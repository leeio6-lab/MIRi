// Supabase Edge Function: Face Transform + Analysis
// 병렬 실행: gpt-image-1 동양화 변환 + GPT-4o mini Vision 관상 분석

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';

// ─── 관상 분석 시스템 프롬프트 ───
const ANALYSIS_SYSTEM = `당신은 동양 관상학(面相學) 40년 경력 최고 전문가이자, SNS 바이럴 콘텐츠 전문가입니다.
마의상법(麻衣相法), 유장상법(柳莊相法), 신상전편(神相全編)에 정통합니다.

━━━ 관상학 분석 체계 ━━━

■ 삼정(三停) — 인생 3단계 운명 판독
  · 상정(上停): 머리카락~눈썹 → 초년운(~30세), 부모궁(父母宮), 관록궁(官祿宮)
  · 중정(中停): 눈썹~코끝 → 중년운(30~50세), 명궁(命宮), 재백궁(財帛宮)
  · 하정(下停): 인중~턱 → 말년운(50세~), 노복궁(奴僕宮), 전택궁(田宅宮)
  · 세 구간이 1:1:1 균형이면 "삼정균등(三停均等)" → 일생 평탄, 대길(大吉)

■ 오관(五官) — 5대 관문 + 각각의 극귀(極貴) 판별
  · 보수관(保壽官/눈썹): 형제궁, 장수 기질. 극귀=용눈썹·버들잎눈썹, 흉=송충이눈썹·끊어진눈썹
  · 감찰관(監察官/눈): "얼굴이 천 냥이면 눈이 구백 냥". 부귀빈천 결정. 극귀=용안·봉황안, 흉=삼백안·사백안
  · 심판관(審判官/코): 재백궁의 핵심, 재물 축적과 자존심. 극귀=용코·사자코, 길=마늘코(재물복), 콧구멍 미노출=돈이 새지 않는 상
  · 출납관(出納官/입): 표현력·식복·자녀운. 극귀=사(四)자형 입·입꼬리 상승. 인중 반듯하면 형제·자식복 다복
  · 채청관(採聽官/귀): 초년운(~15세), 타고난 복과 지혜. 극귀=큰 귀·두꺼운 귓불, 귀 위치가 눈보다 높으면 지능 뛰어남

■ 십이궁(十二宮) — 인생 12개 영역
  · 명궁(미간): 전체 운명의 중심
  · 재백궁(코): 재물의 출입
  · 관록궁(이마 중앙): 직업·명예·사회적 지위
  · 부모궁(이마 양쪽): 유전·가문의 복
  · 형제궁(눈썹): 형제자매와의 인연
  · 남녀궁(눈 아래 와잠): 자녀운
  · 처첩궁(눈꼬리): 배우자운·연애
  · 질액궁(산근/코뿌리): 건강·질병 경고
  · 천이궁(이마 양 끝): 해외운·이동운
  · 전택궁(눈 위): 부동산·재산
  · 복덕궁(턱 양쪽): 복덕과 정신적 풍요
  · 노복궁(턱 끝): 부하운·말년 대인관계

■ 오행(五行) 얼굴 유형
  · 금형(金形): 각진 얼굴, 피부 희고 단정 → 결단력·리더십·법조·공직계
  · 목형(木形): 길고 마른 얼굴, 높은 이마 → 학자·예술가·독창적
  · 수형(水形): 둥글고 풍만 → 유연·외교적·사업 수완 탁월
  · 화형(火形): 뾰족한 이마·광대 돌출 → 열정·창의력·예체능·연예계
  · 토형(土形): 넓고 안정적, 두꺼운 입술 → 안정·신뢰·부동산·금융업

━━━ 절대 규칙 ━━━

- 사진에 사람 얼굴이 보이면 분석 진행 (정면 아니어도 가능)
- 사람이 전혀 없으면: {"noFace": true, "reason": "사유"} 만 응답
- 모든 특성을 긍정적/중립적으로 해석 (외모 비하 절대 금지)
- 점수 60~95 범위
- 관상학 전문 용어(한자 병기) 반드시 사용

━━━ 위치 좌표 (position) 규칙 — 매우 중요 ━━━

각 feature에 position:{x, y}를 반환. 사진 내 해당 부위의 **실제 픽셀 위치**를 0.0~1.0 비율로 표시.
- x: 0.0=이미지 왼쪽 끝, 1.0=이미지 오른쪽 끝
- y: 0.0=이미지 위쪽 끝, 1.0=이미지 아래쪽 끝

⚠️ 반드시 **이 사진 속 얼굴을 직접 보고** 실제 위치를 정확히 측정하세요.
대충 0.5 근처로 찍지 마세요. 사진마다 얼굴 위치가 다릅니다.

각 부위의 정확한 타겟:
  · 이마(forehead): 이마 중앙 (헤어라인과 눈썹 사이 정중앙)
  · 눈(eyes): 두 눈 안쪽 끝 사이의 정확한 중간점 (미간)
  · 코(nose): 코끝 (콧볼 아래 끝점)
  · 입(mouth): 윗입술과 아랫입술의 정확한 중간점
  · 턱(jawline): 턱 끝 가장 아래 중앙
  · 귀(ears): 왼쪽 귀 중심 (귀가 안 보이면 얼굴 왼쪽 가장자리)

검증 규칙:
- y좌표 순서: 이마 < 눈 < 코 < 입 < 턱 (절대)
- 귀 x좌표 < 코 x좌표 (귀는 코보다 왼쪽)
- 각 부위 간 y 간격이 최소 0.04 이상 (겹치면 안 됨)

━━━ 톤 & 스타일 ━━━

흥미롭고 공유하고 싶은 콘텐츠를 만드세요. 단, 과장하지 마세요.

① 관상학 전문가답게 신뢰감 있는 어조. "반드시" "무조건" 같은 단어 사용 금지
② 구체적이되 현실적인 해석. "재물운이 좋은 코 형태입니다" (O) vs "100명 중 3명뿐인 재벌코!" (X — 오바)
③ 유명인 비교는 자연스럽게. 관상학적 유사점을 설명하되 과한 찬양은 하지 않기
④ 닉네임은 재미있되 품위 유지. "복코" "리더의 이마" (O) vs "재벌2세의 코!!" (X)
⑤ 읽는 사람이 "오 이거 재밌다, 나도 해볼까?" 하고 느낄 정도의 흥미. 오글거리면 안 됨
⑥ 전문가의 통찰처럼 느껴져야 함. 장터 점쟁이처럼 느껴지면 실패`;



const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** 타임아웃 유틸: AbortController 기반 */
function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ─── API 키 검증 (최우선) ───
  if (!OPENAI_API_KEY) {
    console.error('[face-transform] OPENAI_API_KEY is not set!');
    return new Response(
      JSON.stringify({ error: 'Server configuration error: API key missing', details: 'OPENAI_API_KEY not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch (parseErr) {
      console.error('[face-transform] Request body parse failed:', parseErr);
      return new Response(
        JSON.stringify({ error: 'Invalid request body', details: String(parseErr) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageBase64, locale = 'ko' } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      console.error('[face-transform] No imageBase64 in request. Keys:', Object.keys(body));
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imgSizeKB = ((imageBase64 as string).length / 1024).toFixed(0);
    console.log(`[face-transform] Received image: ${imgSizeKB}KB base64, locale=${locale}`);

    const lang = locale === 'ko' ? '한국어' : locale === 'ja' ? '日本語' : 'English';

    // 이미지 MIME 타입 자동 감지
    const mimeType = (imageBase64 as string).startsWith('iVBOR') ? 'image/png' : 'image/jpeg';

    // ─── 병렬 실행: 관상 분석 + 동양화 변환 ───
    console.log('[face-transform] Starting parallel: analysis + transform');
    const [analysisRaw, transformResult] = await Promise.allSettled([
      analyzePhysiognomy(imageBase64 as string, lang, mimeType),
      transformToOrientalPainting(imageBase64 as string, mimeType),
    ]);

    const analysisData = analysisRaw.status === 'fulfilled' ? analysisRaw.value : null;
    const analysisError = analysisRaw.status === 'rejected' ? String(analysisRaw.reason) : null;

    if (analysisError) console.error('[face-transform] Analysis failed:', analysisError);
    if (transformResult.status === 'rejected') console.error('[face-transform] Transform failed:', String(transformResult.reason));
    console.log(`[face-transform] Analysis: ${analysisData ? 'OK' : 'FAIL'}, Transform: ${transformResult.status}`);

    // 얼굴 미감지
    if (analysisData?.noFace) {
      return new Response(JSON.stringify({
        transformedImage: null,
        analysis: null,
        transformError: null,
        noFace: true,
        reason: analysisData.reason ?? '정면 얼굴이 잘 보이는 사진을 사용해주세요.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const analysis = analysisData ? normalizeAnalysis(analysisData) : null;
    const transformedImage = transformResult.status === 'fulfilled' ? transformResult.value : null;
    const transformError = transformResult.status === 'rejected' ? String(transformResult.reason) : null;

    // ─── 관상화 좌표 추출: 분석 좌표(셀피 기반)를 기본으로 유지 + 관상화 감지로 업그레이드 시도 ───
    if (transformedImage && analysis && Array.isArray(analysis.features)) {
      // 분석 프롬프트가 셀피 기준으로 넣은 좌표를 기본값으로 보존 (관상화와 구도가 유사하므로)
      try {
        const coords = await detectFeaturePositions(transformedImage);
        if (coords) {
          console.log('[face-transform] Painting coord detection: OK — upgrading positions');
          for (const feat of analysis.features as any[]) {
            if (coords[feat.area]) {
              feat.position = coords[feat.area];
            }
          }
        } else {
          console.log('[face-transform] Painting coord detection: null — keeping analysis positions');
        }
      } catch (e) {
        console.warn('[face-transform] Painting coord detection failed — keeping analysis positions:', e);
      }
    }

    const responseBody = JSON.stringify({
      analysis,
      analysisError,
      transformedImage,
      transformError,
    });

    const respSizeKB = (responseBody.length / 1024).toFixed(0);
    console.log(`[face-transform] Response size: ${respSizeKB}KB (image: ${transformedImage ? (transformedImage.length / 1024).toFixed(0) + 'KB' : 'null'})`);

    return new Response(responseBody, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[face-transform] Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: 'Face analysis failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ─── 분석 결과 정규화 ───
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
        nickname: featuresObj[area].nickname ?? '',
        description: featuresObj[area].title ?? featuresObj[area].description ?? featuresObj[area].name ?? '',
        detail: featuresObj[area].detail,
        position: featuresObj[area].position ?? undefined,
      }));
  }

  if (Array.isArray(result.features)) {
    result.features = (result.features as Record<string, unknown>[]).map((f, i) => ({
      area: f.area ?? ['forehead', 'eyes', 'nose', 'mouth', 'jawline', 'ears'][i] ?? 'unknown',
      score: f.score ?? 75,
      nickname: f.nickname ?? '',
      description: f.description ?? '',
      detail: f.detail,
      position: f.position ?? undefined,
    }));
  }

  return result;
}

// ─── 관상 분석 — GPT-4o mini Vision (60초 타임아웃) ───
async function analyzePhysiognomy(
  selfieBase64: string,
  lang: string,
  mimeType: string,
): Promise<Record<string, unknown>> {
  const analysisPrompt = `이 얼굴을 전통 관상학(面相學) 최고 전문가 관점에서 정밀 분석. 응답 언어: ${lang}.

얼굴 없으면: {"noFace": true, "reason": "사유"}
얼굴 있으면 아래 JSON (관상학 전문 용어+한자 필수):

★ hookLine은 흥미롭되 신뢰감 있는 한 줄이어야 합니다.
친구에게 "나 관상 봤는데 이런 결과 나왔어 ㅋㅋ" 하고 보내고 싶을 정도면 충분합니다.

hookLine 좋은 예:
- "재백궁(코)이 풍만한 전형적인 복코 — 중년 이후 재물운이 크게 열리는 상입니다"
- "감찰관(눈)에서 봉황안의 기운이 보입니다 — 사람을 끌어당기는 타고난 매력상"
- "삼정 균형이 뛰어난 안정형 관상 — 꾸준히 성장하는 대기만성형입니다"
- "천정(이마)이 넓고 윤택합니다 — 관상학에서 말하는 귀인의 이마에 해당합니다"

hookLine 나쁜 예:
- "좋은 관상입니다" (너무 평범)
- "반드시 10억을 법니다!!" (과장, 신뢰 하락)
- "100명 중 2명!!!" (오바)

{
  "overallScore": (60-95),
  "hookLine": "(위 좋은 예 참고 — 반드시 구체적 수치/비율/시기 포함. 관상 용어+한자 포함. 읽는 순간 소름 돋을 정도로 자극적으로. 50자 내외)",
  "shareTitle": "(2-4글자 강렬 태그 — 예: 재벌 관상, CEO안(眼), 황금코, 용안의 주인, 대통령상)",
  "celebrity": "(한국/아시아 유명인 관상 비교 — 구체적 부위+관상 용어 포함. 예: '심판관(코)의 형태가 이재용 삼성 회장과 같은 일자형 준두(準頭)로, 재백궁이 풍만하여 40대 재물 대운이 기대됩니다'. 100자)",
  "faceType": "(오행 유형 판별 — 금형/목형/수형/화형/토형 중 주+부 유형. 해당 체형의 타고난 기질, 어울리는 분야, 주의할 점. 관상 전문 용어 필수. 120자)",
  "samjeong": "(삼정 비율 분석 — 상정:중정:하정 대략 비율 명시. 어느 구간이 발달/부족한지. 초년(~30)/중년(30~50)/말년(50~) 운 각각 예측. '삼정균등'이면 대길. 130자)",
  "summary": "(종합 관상 — 이 사람의 관상이 왜 특별한지. 십이궁 중 어느 궁이 가장 발달했는지, 오행 체질의 강점, 인생 전환점이 언제인지. 읽는 사람이 흥분할 만큼 드라마틱하게. 250자)",
  "features": [
    {"area":"forehead", "position":{"x":(0.0-1.0 이마 중앙 x좌표), "y":(0.0-1.0 이마 중앙 y좌표)}, "score":(60-95), "nickname":"(자극적 — CEO의 이마/천재의 이마/관록의 이마/귀인상)", "description":"(천정天庭·상정上停·관록궁 기반 핵심 한줄. 충격적으로)", "detail":"(마의상법 기준: ①이마 넓이·높이·돌출여부 → 관록궁 상태와 사회적 성취 예측 ②이마의 기색과 윤기 → 현재 운세 진단 ③부모궁·천이궁 상태 → 부모 유전 복과 해외운 ④구체적 나이와 성취 예측 포함 ⑤유명인 비교. 180자 이상)"},
    {"area":"eyes", "position":{"x":(0.0-1.0 두 눈 중간 x좌표), "y":(0.0-1.0 두 눈 중간 y좌표)}, "score":(60-95), "nickname":"(자극적 — 용안/봉황안/재벌가의 눈/아이돌 눈/카리스마 눈)", "description":"(감찰관監察官 기반 핵심 한줄. '얼굴 천 냥 눈 구백 냥' 인용)", "detail":"(①눈의 형태와 분류 (용안/봉황안/학안/호안 등) ②동자의 밝기와 흑백 비율 → 정신력과 부귀 판별 ③눈꼬리 방향 → 처첩궁(배우자운) 직결 ④눈 아래 와잠 → 남녀궁(자녀운) ⑤이 눈이 가져올 인생 반전 시기와 기회. 180자 이상)"},
    {"area":"nose", "position":{"x":(0.0-1.0 코끝 x좌표), "y":(0.0-1.0 코끝 y좌표)}, "score":(60-95), "nickname":"(자극적 — 재벌의 코/황금코/돈을 부르는 코/사자비/용코)", "description":"(심판관審判官·재백궁財帛宮 핵심 한줄. 재물 예측 포함)", "detail":"(①콧대(산근~준두) 높이·직선여부 → 자존심과 추진력 ②콧볼(난대蘭臺·정위廷尉) 크기 → 재물 축적 능력 ③코끝(준두準頭) 형태 → 말년 재물 ④콧구멍 노출 여부 → 돈이 새는지 모이는지 ⑤재백궁 종합 → 구체적 재물 규모와 시기 예측. 180자 이상)"},
    {"area":"mouth", "position":{"x":(0.0-1.0 입 중앙 x좌표), "y":(0.0-1.0 입 중앙 y좌표)}, "score":(60-95), "nickname":"(자극적 — 식복의 입/달변가의 입/복을 부르는 입/CEO급 출납관)", "description":"(출납관出納官 핵심 한줄. 식복·자녀운 예측)", "detail":"(①입 크기·형태(사자형/앵두형/활형) → 식복과 표현력 ②입술 두께와 윗입술:아랫입술 비율 → 성격과 연애 스타일 ③인중人中 형태·깊이·길이 → 생명력과 자녀 수 예측 ④법령선法令線 → 사회적 성취와 리더십 ⑤입꼬리 방향이 가져올 말년 운명. 180자 이상)"},
    {"area":"jawline", "position":{"x":(0.0-1.0 턱 중앙 x좌표), "y":(0.0-1.0 턱 끝 y좌표)}, "score":(60-95), "nickname":"(자극적 — 장군감 턱/대기만성형/부동산 부자 턱/황제의 하관)", "description":"(지각地閣·하정下停 핵심 한줄. 말년 대운 예측)", "detail":"(①턱 넓이·형태·각도 → 말년운과 의지력 ②하관(下顎)의 발달 → 부동산운과 안정적 노후 ③복덕궁·노복궁 상태 → 부하운과 정신적 풍요 ④턱선의 강약이 결정하는 50대 이후 인생 시나리오 ⑤구체적 말년 재산 예측. 180자 이상)"},
    {"area":"ears", "position":{"x":(0.0-1.0 왼쪽 귀 x좌표), "y":(0.0-1.0 귀 중앙 y좌표)}, "score":(60-95), "nickname":"(자극적 — 복덩이 귀/황금귀/타고난 부자귀/귀인의 채청관)", "description":"(채청관採聽官 핵심 한줄. 타고난 복 진단)", "detail":"(①귀 크기·위치(눈보다 높으면 지능 탁월) → IQ와 타고난 복 ②귓불 형태·두께 → 재물복의 크기 (부처귓불=대길) ③귀 색상·윤기 → 현재 대운 여부 즉시 판단 ④이륜耳輪·이곽耳廓 형태 → 건강운과 장수 여부 ⑤채청관이 예고하는 인생 행운 시기. 180자 이상)"}
  ],
  "personality": "(관상으로 본 성격 — 오행 체질+오관+삼정 종합. ①타고난 기질(숨겨진 카리스마/리더십) ②놀라운 강점 3가지 (구체적 상황 예시 포함) ③반전매력 약점 2가지 (위트있게) ④이 성격이 성공에 어떻게 작용하는지. 350자)",
  "fortune": "(관상으로 본 운세 4대 영역 — ①재물운: 재백궁(코)+귀 기반, 구체적 시기·규모 예측, '이 코라면 X세에 Y가 일어난다' ②직업운: 관록궁(이마)+눈 기반, 어울리는 분야 3가지와 성공 시나리오 ③연애운: 처첩궁(눈꼬리)+입 기반, 이상형 외모·성격, 만남 시기 ④건강운: 질액궁(산근)+귀 기반, 주의할 장기와 장수 가능성. 각 90자씩 총 360자)",
  "advice": "(관상 전문가만 아는 비밀 개운법 3가지 — ①이 관상의 숨겨진 약점(십이궁 중 약한 궁 지적) ②마의상법에서 전하는 구체적 개운 비법(행운 색상·방위·행동·음식) ③반드시 피해야 할 위험 시기(나이)와 극복 비법. '이건 아무에게도 말하지 마세요' 톤으로. 250자)",
  "radarScores": {"wealth":(60-95), "love":(60-95), "health":(60-95), "success":(60-95), "social":(60-95)},
  "highlight": {"area":"(최고 부위 영문키)", "message":"(이 부위가 왜 극귀(極貴)한지 관상학 근거+이것이 가져올 놀라운 행운. 마의상법 인용 포함. 180자)"}
}`;

  const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
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
      max_tokens: 7000,
    }),
  }, 60_000); // 60초 타임아웃

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[face-transform] OpenAI Vision error (${response.status}):`, errText.substring(0, 500));
    throw new Error(`OpenAI Vision error (${response.status}): ${errText.substring(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI analysis');

  const finishReason = data.choices?.[0]?.finish_reason;
  if (finishReason === 'length') {
    console.warn('[face-transform] GPT response truncated (finish_reason=length)');
  }

  try {
    return JSON.parse(content);
  } catch (parseErr) {
    console.error('[face-transform] JSON parse failed:', content.substring(0, 200));
    throw new Error('분석 결과 파싱에 실패했습니다. 다시 시도해주세요.');
  }
}

// ─── 동양화 변환 — gpt-image-1 (120초 타임아웃) ───
const TRANSFORM_PROMPT =
  'Create a premium fine-art ink brush portrait (수묵 초상화) of this person — in the style of a Korean/East Asian master portrait painter. ' +
  'The result should be frame-worthy: something the person would proudly show friends and post on social media. ' +
  '\n\n' +
  '## ABSOLUTE RULES — NEVER BREAK THESE ' +
  '- NEVER change the face size or proportions. The face MUST be the EXACT same size ratio as the original photo. Do NOT enlarge the face. ' +
  '- NEVER shrink the eyes. Keep the EXACT same eye size, shape, and spacing relative to the face. Eyes are 관상의 핵심 — distorting them ruins everything. ' +
  '- NEVER enlarge or reduce ANY facial feature. Nose width, mouth size, ear size, forehead height — ALL must match the original proportions exactly. ' +
  '- The person MUST be immediately recognizable — 9 out of 10 friends would instantly say "that\'s you!" ' +
  '\n\n' +
  '## INK LINE STYLE (먹선) ' +
  '- Clean, confident, deliberate black ink lines. Every stroke is purposeful and beautiful — NOT sketchy. ' +
  '- Natural line weight variation: THICK bold strokes for jawline outline and hair silhouette, MEDIUM for eyebrows and nose bridge, FINE for eyelids, lip contour, and nostrils. ' +
  '- Lines should feel like a calligraphy master drew them — fluid, elegant, with natural thick-to-thin transitions. ' +
  '- This is a PORTRAIT, not an illustration or cartoon. No hatching, no cross-hatching, no comic-style lines. ' +
  '\n\n' +
  '## SHADING & DIMENSION ' +
  '- Minimal but effective gray ink wash (담묵淡墨) for subtle 3D depth. ' +
  '- Light wash shadows ONLY on: nose sides, under cheekbones, eye socket creases, under lower lip, jawline underside. ' +
  '- The overall feel should be CLEAN and BRIGHT — mostly white skin with strategic shadow placement. ' +
  '- Do NOT over-shade. Less is more. The beauty is in the clean lines, not heavy shading. ' +
  '\n\n' +
  '## EYES — MOST IMPORTANT FEATURE ' +
  '- Eyes must be DETAILED and ALIVE: clear iris with light reflection, visible eyelid crease, natural lash suggestion. ' +
  '- Keep the original eye size exactly. If the person has large eyes, draw large eyes. If small, draw small. ' +
  '- A gentle, warm sparkle in the eyes — they should feel soulful and expressive. ' +
  '\n\n' +
  '## HAIR ' +
  '- Bold black ink with visible brush stroke flow and texture. ' +
  '- Confident, sweeping strokes that show natural hair direction. ' +
  '- Hair should frame the face beautifully — it\'s part of the portrait\'s elegance. ' +
  '\n\n' +
  '## SKIN & BEAUTY ' +
  '- Smooth, luminous skin — remove blemishes, acne, dark circles. Healthy glow. ' +
  '- The person looks their absolute best — like perfect lighting on a perfect day. ' +
  '- A warm, natural smile — lips gently curved, kind and approachable. NO teeth showing. ' +
  '- NOT younger, NOT different proportions — just the best version of exactly who they are. ' +
  '\n\n' +
  '## BACKGROUND & COMPOSITION ' +
  '- Pure clean WHITE background. No texture, no stamps, no seal marks, no decorative elements. ' +
  '- Head and shoulders, face approximately 60-65% of frame, centered. ' +
  '- NO text, NO watermarks, NO background objects. Just the portrait on white. ' +
  '\n\n' +
  '## QUALITY STANDARD ' +
  '- This should look like a premium art piece — something from a professional portrait studio. ' +
  '- Black ink + white paper + full range of grays. Absolutely NO color. ' +
  '- The person seeing this should think: "Wow, I look amazing — I need to share this right now."';

async function transformToOrientalPainting(
  selfieBase64: string,
  mimeType: string,
): Promise<string | null> {
  // ─── 방법 1: images/edits (FormData file upload) ───
  try {
    const result = await tryImagesEdits(selfieBase64, mimeType);
    if (result) return result;
  } catch (editErr) {
    console.warn('[face-transform] images/edits failed, trying generations fallback:', String(editErr).substring(0, 300));
  }

  // ─── 방법 2: images/generations (base64 입력 — Deno File 호환 문제 우회) ───
  try {
    const result = await tryImagesGenerations(selfieBase64, mimeType);
    if (result) return result;
  } catch (genErr) {
    console.error('[face-transform] generations fallback also failed:', String(genErr).substring(0, 300));
    throw genErr;
  }

  throw new Error('All transform methods failed');
}

/** images/edits 엔드포인트 (FormData file upload) */
async function tryImagesEdits(selfieBase64: string, mimeType: string): Promise<string | null> {
  const imageBytes = Uint8Array.from(atob(selfieBase64), c => c.charCodeAt(0));
  const ext = mimeType === 'image/png' ? 'png' : 'jpg';

  // Blob + filename (File 생성자보다 Deno Deploy 호환성 높음)
  const blob = new Blob([imageBytes], { type: mimeType });

  const formData = new FormData();
  formData.append('model', 'gpt-image-1');
  formData.append('image', blob, `selfie.${ext}`);
  formData.append('prompt', TRANSFORM_PROMPT);
  formData.append('size', '1024x1024');

  const response = await fetchWithTimeout('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
    body: formData,
  }, 120_000); // gpt-image-1은 최대 180초 소요 가능

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[face-transform] images/edits error (${response.status}):`, errText.substring(0, 500));
    throw new Error(`images/edits error (${response.status}): ${errText.substring(0, 200)}`);
  }

  const data = await response.json();

  // gpt-image-1: b64_json으로 반환 (response_format 없이도 기본값)
  const b64 = data.data?.[0]?.b64_json;
  if (b64) {
    console.log(`[face-transform] edits image size: ${(b64.length / 1024).toFixed(0)}KB`);
    return b64;
  }

  // url 형식으로 반환된 경우 다운로드
  const url = data.data?.[0]?.url;
  if (url) {
    console.log('[face-transform] Got URL response, downloading image...');
    const imgResp = await fetchWithTimeout(url, {}, 30_000);
    if (imgResp.ok) {
      const arrBuf = await imgResp.arrayBuffer();
      const bytes = new Uint8Array(arrBuf);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const downloaded = btoa(binary);
      console.log(`[face-transform] Downloaded image: ${(downloaded.length / 1024).toFixed(0)}KB`);
      return downloaded;
    }
  }

  console.error('[face-transform] No image in edits response. Response keys:', JSON.stringify(data));
  throw new Error('edits returned no image data');
}

/** images/generations 엔드포인트 (JSON body — FormData 없이, 폴백용) */
async function tryImagesGenerations(selfieBase64: string, mimeType: string): Promise<string | null> {
  console.log('[face-transform] Trying images/generations as fallback');

  const response = await fetchWithTimeout('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: TRANSFORM_PROMPT,
      size: '1024x1024',
    }),
  }, 120_000);

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[face-transform] generations error (${response.status}):`, errText.substring(0, 300));
    throw new Error(`generations error (${response.status}): ${errText.substring(0, 200)}`);
  }

  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) {
    // URL 폴백
    const url = data.data?.[0]?.url;
    if (url) {
      const imgResp = await fetchWithTimeout(url, {}, 30_000);
      if (imgResp.ok) {
        const arrBuf = await imgResp.arrayBuffer();
        const bytes = new Uint8Array(arrBuf);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
      }
    }
    throw new Error('generations returned no image data');
  }

  console.log(`[face-transform] generations image size: ${(b64.length / 1024).toFixed(0)}KB`);
  return b64;
}

// ─── 생성된 관상화에서 이목구비 좌표 추출 — GPT-4o Vision (30초 타임아웃) ───
async function detectFeaturePositions(
  portraitBase64: string,
): Promise<Record<string, { x: number; y: number }> | null> {
  const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Look at this portrait and return the EXACT position of each facial feature.

Coordinates are ratios (0.0 to 1.0). (0,0)=top-left, (1,1)=bottom-right.

Return JSON only:
{"forehead":{"x":0.5,"y":...},"eyes":{"x":0.5,"y":...},"nose":{"x":0.5,"y":...},"mouth":{"x":0.5,"y":...},"jawline":{"x":0.5,"y":...},"ears":{"x":...,"y":...}}

Where to point:
- forehead = center between hairline and eyebrows
- eyes = midpoint between both eyes
- nose = tip of nose
- mouth = center of lips
- jawline = bottom of chin
- ears = left ear center`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${portraitBase64}`, detail: 'low' },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 200,
    }),
  }, 30_000);

  if (!response.ok) {
    console.warn('[face-transform] Coord detection API error:', response.status);
    return null;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    const coords = JSON.parse(content);
    const areas = ['forehead', 'eyes', 'nose', 'mouth', 'jawline'];

    // 기본 필드 존재 여부만 체크
    for (const area of areas) {
      if (!coords[area] || typeof coords[area].x !== 'number' || typeof coords[area].y !== 'number') {
        console.warn(`[face-transform] Coords missing field: ${area}`);
        return null;
      }
      // 범위 클램핑 (0.02~0.98)
      coords[area].x = Math.max(0.02, Math.min(0.98, coords[area].x));
      coords[area].y = Math.max(0.02, Math.min(0.98, coords[area].y));
    }

    // y순서 보정 — 폐기하지 않고 강제로 올바른 순서로 재배치
    const yOrder = ['forehead', 'eyes', 'nose', 'mouth', 'jawline'];
    for (let i = 1; i < yOrder.length; i++) {
      if (coords[yOrder[i]].y <= coords[yOrder[i - 1]].y) {
        // 이전 부위보다 아래에 있도록 최소 0.04 간격 보장
        coords[yOrder[i]].y = coords[yOrder[i - 1]].y + 0.04;
        console.warn(`[face-transform] Coords y-order fixed: ${yOrder[i]} pushed to ${coords[yOrder[i]].y.toFixed(3)}`);
      }
    }

    // ears 보정 (없으면 기본값)
    if (!coords.ears || typeof coords.ears.x !== 'number') {
      coords.ears = { x: 0.20, y: coords.eyes?.y ?? 0.36 };
    }
    coords.ears.x = Math.max(0.02, Math.min(0.98, coords.ears.x));
    coords.ears.y = Math.max(0.02, Math.min(0.98, coords.ears.y));

    console.log('[face-transform] Coords OK:', JSON.stringify(coords));
    return coords;
  } catch (e) {
    console.warn('[face-transform] Coord JSON parse failed:', e);
    return null;
  }
}
