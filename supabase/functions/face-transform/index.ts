// Supabase Edge Function: Face Transform + Analysis
// 병렬 실행: gpt-image-1 관상화 변환 + GPT-4o mini Vision 관상 분석

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

// ─── 관상 분석 시스템 프롬프트 ───
const ANALYSIS_SYSTEM = `당신은 동양 관상학(面相學) 40년 경력의 최고 전문가입니다.
마의상법(麻衣相法), 유장상법(柳莊相法), 신상전편(神相全編)에 정통합니다.

분석 체계:
■ 삼정(三停) — 상정(이마~눈썹), 중정(눈썹~코끝), 하정(코끝~턱) 비율과 균형
■ 오관(五官) — 보수관(눈썹), 감찰관(눈), 심판관(코), 출납관(입), 채청관(귀)
■ 십이궁(十二宮) — 명궁, 재백궁, 형제궁, 전택궁, 남녀궁, 노복궁, 처첩궁, 질액궁, 천이궁, 관록궁, 복덕궁, 부모궁
■ 오행(五行) — 금형, 목형, 수형, 화형, 토형 얼굴 유형 판별

원칙:
- 사진에 사람 얼굴이 보이면 관상 분석을 진행하세요 (정면이 아니어도, 약간 기울어져도 분석 가능).
- 사람이 전혀 없거나 동물/사물만 있는 경우에만:
  {"noFace": true, "reason": "(사유를 한 문장으로)"} 형태로 응답하세요.
- 얼굴이 확인되면:
  - 전통 관상학 용어와 이론에 근거하여 전문적으로 해석
  - 삼정의 비율, 오관의 형태, 십이궁의 상태를 종합적으로 판단
  - 각 부위마다 관상학 전문 용어(한자 병기)를 사용하여 근거 제시
  - 모든 특성을 긍정적/중립적으로 해석 (외모 비하 절대 금지)
  - 점수는 60~95 범위
  - 엔터테인먼트 목적 고지 포함`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64, locale = 'ko' } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lang = locale === 'ko' ? '한국어' : locale === 'ja' ? '日本語' : 'English';

    // 이미지 MIME 타입 자동 감지 (JPEG/PNG)
    const mimeType = imageBase64.startsWith('/9j/') || imageBase64.startsWith('iVBOR') === false
      ? 'image/jpeg' : 'image/png';

    // ─── 1단계: 관상 분석 (원본 사진) ───
    const analysisRaw = await analyzePhysiognomy(imageBase64, lang, mimeType);

    // 얼굴 미감지
    if (analysisRaw.noFace) {
      return new Response(JSON.stringify({
        transformedImage: null,
        analysis: null,
        transformError: null,
        noFace: true,
        reason: analysisRaw.reason ?? '정면 얼굴이 잘 보이는 사진을 사용해주세요.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const analysis = normalizeAnalysis(analysisRaw);

    return new Response(JSON.stringify({
      analysis,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Face analysis failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ─── 분석 결과 정규화: features 객체→배열, 필수 필드 보장 ───
function normalizeAnalysis(raw: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...raw };

  if (result.features && !Array.isArray(result.features)) {
    const featuresObj = result.features as Record<string, Record<string, unknown>>;
    const areaOrder = ['forehead', 'eyes', 'nose', 'mouth', 'jawline', 'chin', 'ears'];
    result.features = areaOrder
      .filter(area => featuresObj[area])
      .map(area => ({
        area,
        score: featuresObj[area].score ?? 75,
        description: featuresObj[area].title ?? featuresObj[area].description ?? featuresObj[area].name ?? '',
        detail: featuresObj[area].detail,
      }));
  }

  if (Array.isArray(result.features)) {
    result.features = (result.features as Record<string, unknown>[]).map((f, i) => ({
      area: f.area ?? ['forehead', 'eyes', 'nose', 'mouth', 'jawline', 'ears'][i] ?? 'unknown',
      score: f.score ?? 75,
      description: f.description ?? '',
      detail: f.detail,
    }));
  }

  return result;
}

// ─── 관상 분석 — GPT-4o mini Vision ───
async function analyzePhysiognomy(
  selfieBase64: string,
  lang: string,
  mimeType: string,
): Promise<Record<string, unknown>> {
  const analysisPrompt = `이 얼굴을 전통 관상학(面相學) 전문가 관점에서 정밀 분석해주세요. 응답 언어: ${lang}.

사진에 사람 얼굴이 보이면 분석을 진행하세요. 약간 기울어지거나 반측면도 분석 가능합니다.
사람이 전혀 없거나 동물/사물만 있는 경우에만: {"noFace": true, "reason": "사유"}
얼굴이 있으면 아래 JSON (반드시 관상학 전문 용어와 한자를 병기):
{
  "overallScore": (60-100),
  "faceType": "(오행 얼굴 유형: 금형/목형/수형/화형/토형 + 근거 한줄)",
  "samjeong": "(삼정 분석: 상정·중정·하정 비율 및 균형 평가 50자)",
  "summary": "(종합 관상 평가 — 이 사람의 타고난 기운과 운명적 특징 150자)",
  "features": [
    {"area":"forehead", "x":(0~1 이마 중심 x좌표), "y":(0~1 이마 중심 y좌표), "score":(60-100), "description":"(천정天庭/상정上停 — 관상학 관점 한줄)", "detail":"(마의상법 기준 상세 풀이 3-4문장)"},
    {"area":"eyes", "x":(왼쪽 눈과 오른쪽 눈 사이 중심 x), "y":(눈 y좌표), "score":(60-100), "description":"(감찰관監察官 — 한줄)", "detail":"(눈 상세 풀이 3-4문장)"},
    {"area":"nose", "x":(코 중심 x), "y":(코 중심 y), "score":(60-100), "description":"(심판관審判官/재백궁 — 한줄)", "detail":"(코 상세 풀이 3-4문장)"},
    {"area":"mouth", "x":(입 중심 x), "y":(입 중심 y), "score":(60-100), "description":"(출납관出納官 — 한줄)", "detail":"(입 상세 풀이 3-4문장)"},
    {"area":"jawline", "x":(턱 중심 x), "y":(턱 끝 y), "score":(60-100), "description":"(지각地閣/하정下停 — 한줄)", "detail":"(턱 상세 풀이 3-4문장)"},
    {"area":"ears", "x":(오른쪽 귀 x), "y":(귀 중심 y), "score":(60-100), "description":"(채청관採聽官 — 한줄)", "detail":"(귀 상세 풀이 3-4문장)"}
  ],
  ※ x, y 좌표: 이미지 왼쪽 상단이 (0,0), 오른쪽 하단이 (1,1). 사진 속 실제 부위 위치를 정확히 측정하세요.
  "personality": "(관상으로 본 성격 — 오행 체질과 얼굴 전체 인상에서 읽히는 기질, 강점, 약점 200자)",
  "fortune": "(관상으로 본 운세 — 재물운·관록운·연애운·건강운 종합 예측 200자)",
  "advice": "(관상 기반 개운 조언 — 보완할 점과 구체적 방법 150자)",
  "radarScores": {"wealth":(60-100), "love":(60-100), "health":(60-100), "success":(60-100), "social":(60-100)},
  "highlight": {"area":"(가장 좋은 부위 영문키)", "message":"(관상학적으로 왜 좋은지, 전문 용어 포함 100자)"}
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ANALYSIS_SYSTEM },
        {
          role: 'user',
          content: [
            { type: 'text', text: analysisPrompt },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${selfieBase64}`, detail: 'auto' },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errText}`);
  }

  const data = await response.json();

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI analysis');
  }

  return JSON.parse(content);
}
