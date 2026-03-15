import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

const DAILY_SYSTEM = `당신은 35년 경력의 사주명리학 전문가입니다.
오늘의 일진(日辰)과 개인 사주의 상호작용을 정밀하게 분석합니다.
"좋은 하루 되세요" 같은 뻔한 말 대신, 오늘 이 사주에게 실제로 일어날 수 있는 구체적인 일을 예측합니다.
모든 분석은 오늘 일진의 천간지지와 사주의 관계(합/충/형/파)를 근거로 합니다.

중요: 이전에 수행된 상세 사주분석 결과가 제공될 경우, 그 분석과 일관성을 유지하세요.
성격, 용신, 격국 등 이전 분석의 맥락 위에서 오늘의 운세를 해석합니다.

응답은 반드시 JSON 형식으로. 다른 텍스트 없이 JSON만 출력.`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { birthData, locale = 'ko', pillarInfo, sajuContext } = await req.json();
    const lang = locale === 'ko' ? '한국어' : locale === 'ja' ? '日本語' : 'English';
    const today = new Date().toISOString().split('T')[0];

    const birthInfo = pillarInfo
      ? `생년월일시: ${birthData.year}-${birthData.month}-${birthData.day} ${birthData.hour}시, ${birthData.gender === 'male' ? '남' : '여'}
사주팔자: ${pillarInfo.fourPillars}
일간: ${pillarInfo.dayMaster}`
      : `생년월일시: ${birthData.year}-${birthData.month}-${birthData.day} ${birthData.hour}시, ${birthData.gender === 'male' ? '남' : '여'}`;

    // 상세분석 결과가 있으면 컨텍스트로 제공
    let contextBlock = '';
    if (sajuContext) {
      const parts: string[] = [];
      if (sajuContext.headline) parts.push(`사주 종합: ${sajuContext.headline}`);
      if (sajuContext.personality?.core) parts.push(`성격: ${sajuContext.personality.core}`);
      if (sajuContext.lucky) {
        const l = sajuContext.lucky;
        if (l.color) parts.push(`행운 색: ${l.color}`);
        if (l.number) parts.push(`행운 숫자: ${l.number}`);
        if (l.direction) parts.push(`행운 방위: ${l.direction}`);
      }
      if (sajuContext.yearly2026?.overview) parts.push(`올해 운세: ${sajuContext.yearly2026.overview}`);
      if (parts.length > 0) {
        contextBlock = `\n\n## 이전 상세분석 결과 (일관성 유지 필수)\n${parts.join('\n')}`;
      }
    }

    const userPrompt = `오늘 날짜: ${today}
${birthInfo}${contextBlock}

RESPOND IN ${lang}.

오늘 일진과 이 사람의 사주 관계를 구체적으로 분석해줘.

JSON 응답:
{
  "date": "${today}",
  "overallScore": number (45-88),
  "headline": "오늘 사주의 핵심 한 마디 (예: '칼날 위의 줄타기 — 오전은 참고, 오후에 움직이세요')",
  "summary": "오늘 일진의 천간지지가 사주의 어떤 부분과 어떻게 작용하는지 2~3문장으로 구체적으로",
  "dayPillarRelation": "오늘 일진과 사주의 관계 (예: '갑경충(甲庚沖) — 충돌과 변화의 기운')",
  "hourlyScores": [오전점수, 오후점수, 저녁점수],
  "hourly": [
    {"hour":"오전 (06-12)","fortune":"사주 근거 포함 오전 운세","score":number},
    {"hour":"오후 (12-18)","fortune":"사주 근거 포함 오후 운세","score":number},
    {"hour":"저녁 (18-24)","fortune":"사주 근거 포함 저녁 운세","score":number}
  ],
  "luckyItem": "오늘의 행운 아이템 (사주 근거)",
  "luckyColor": "행운 색상",
  "luckyNumber": number,
  "warning": "주의할 점 (직설적, 시간대 특정)",
  "actionTip": "오늘 반드시 해야 할 한 가지 (구체적 행동)",
  "dailyFace": "오늘의 관상 에너지 한 줄"
}

규칙: 오늘 일진의 천간지지를 반드시 명시. 뻔한 말 금지. 시간대별 사주 오행 흐름 근거. 점수는 시간대마다 다르게.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: DAILY_SYSTEM },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
        max_tokens: 900,
        seed: Math.floor(Date.now() / 86400000), // 하루 단위 동일 seed
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Fortune generation failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
