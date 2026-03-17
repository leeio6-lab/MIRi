import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

const COMPATIBILITY_SYSTEM = `당신은 서울에서 30년간 궁합 전문 상담을 해온 사주명리학 대가입니다.
연간 3,000쌍 이상의 커플, 부부, 사업 파트너 궁합을 봐왔습니다.
당신의 특기는 두 사람의 사주를 보자마자 "이 관계의 본질"을 한 마디로 꿰뚫고,
어디서 시너지가 나고 어디서 충돌하는지를 구체적으로 짚어주는 것입니다.

## 분석 방법론 (5층 레이어 교차 분석)
1. 일간 관계 (가장 중요) — 합/극/비견/생 등 + A→B, B→A 양방향
2. 지지 합충형파해 — 특히 일지(배우자궁)끼리의 관계 핵심
3. 오행 상생상극 — 서로의 부족을 채워주는가, 상극하는가
4. 궁위 교차 — A의 일지가 B에게 어떤 십성인지, 역방향도
5. 운의 흐름 호환 — 대운 방향 일치/엇갈림, 올해 세운과의 관계

## 일관성 규칙 (최우선)
- 같은 두 사주의 궁합은 언제 분석해도 같은 결론이어야 한다.
- ⚠️ [확정] 태그가 붙은 데이터(신강/신약, 용신)는 사전 계산된 정답이다. 절대 변경하지 마라.
- 성격/궁합 판단은 십신 배치와 오행 비율에서 논리적으로 도출되어야 한다.
- 무작위성 금지. 핵심 판단(시너지/충돌 포인트)은 동일해야 한다.

## 절대 규칙
1. 모든 해석에 사주 근거 (어떤 글자와 어떤 글자가 어떤 관계)
2. 누구에게나 해당되는 말 금지
3. 궁합 나빠도 대처법 함께. 좋아도 함정 포인트 반드시 지적.
4. 점수 35~92 범위. 8개 카테고리 점수 모두 차등. 같은 점수 금지.
5. 양방향 분석.
6. 확정적 예측 금지. 가능성으로 표현.
7. "사람1", "사람2", "A", "B" 같은 대명사 절대 금지. 반드시 실제 이름 사용.

응답: JSON만. 다른 텍스트 없이.`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 해시 기반 결정적 시드
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return h;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { person1, person2, locale = 'ko', isPaid = false, pillarInfo1, pillarInfo2, name1, name2 } = await req.json();
    const lang = locale === 'ko' ? '한국어' : locale === 'ja' ? '日本語' : 'English';
    const currentYear = new Date().getFullYear();
    const n1 = name1 || '나';
    const n2 = name2 || '상대방';

    // 현재 연도의 간지 동적 계산
    const STEMS_KO = ['갑','을','병','정','무','기','경','신','임','계'];
    const BRANCHES_KO = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
    const STEMS_HANJA = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    const BRANCHES_HANJA = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    const yStemIdx = ((currentYear - 4) % 10 + 10) % 10;
    const yBranchIdx = ((currentYear - 4) % 12 + 12) % 12;
    const yearGanjiLabel = `${STEMS_KO[yStemIdx]}${BRANCHES_KO[yBranchIdx]}년(${STEMS_HANJA[yStemIdx]}${BRANCHES_HANJA[yBranchIdx]})`;

    // 결정적 시드: 두 사람의 생년월일 조합
    const birthSeed = Math.abs(hashStr(
      `${person1.year}${person1.month}${person1.day}${person2.year}${person2.month}${person2.day}`
    ));

    // 사주 정보 블록 구성 — 확정 데이터 포함
    const formatPersonBlock = (name: string, person: any, pi: any) => {
      if (!pi) {
        return `${name}: ${person.year}-${person.month}-${person.day} ${person.hour || 12}시, ${person.gender === 'male' ? '남' : '여'}`;
      }
      let block = `${name}: ${person.year}-${person.month}-${person.day} ${person.hour || 12}시, ${person.gender === 'male' ? '남' : '여'}
사주: ${pi.fourPillars}, 일간: ${pi.dayMaster}
오행: 목${pi.elements?.wood ?? '?'}% 화${pi.elements?.fire ?? '?'}% 토${pi.elements?.earth ?? '?'}% 금${pi.elements?.metal ?? '?'}% 수${pi.elements?.water ?? '?'}%`;

      // 확정 데이터 추가 (프리컴퓨트된 경우)
      if (pi.strength || pi.yongShin) {
        block += `\n[확정] 강약: ${pi.strength ?? '(미제공)'}, 용신: ${pi.yongShin ?? '(미제공)'}`;
      }
      return block;
    };

    const p1Info = formatPersonBlock(n1, person1, pillarInfo1);
    const p2Info = formatPersonBlock(n2, person2, pillarInfo2);

    let userPrompt: string;

    if (isPaid) {
      userPrompt = `${p1Info}
${p2Info}

RESPOND IN ${lang}.
현재연도: ${currentYear}년 (${yearGanjiLabel})

## 중요: 이름 사용 규칙
- 첫 번째 사람의 이름: "${n1}"
- 두 번째 사람의 이름: "${n2}"
- 반드시 위 이름을 사용하세요. "사람1", "사람2", "A", "B" 같은 대명사는 절대 사용 금지.

두 사람의 궁합을 1시간짜리 대면 상담 수준으로 분석해줘.
모든 항목에서 반드시 두 사람의 천간지지를 근거로 들어.

## 자기검증 (출력 전 반드시 확인)
□ categories 8개 점수가 모두 다른가? 같은 점수가 있으면 실패.
□ 최고 점수 - 최저 점수 차이가 20점 이상인가?
□ 모든 분석에 구체적 간지가 명시되어 있는가?
□ "사람1", "사람2", "A", "B" 대신 실명을 썼는가?
□ 뻔한 일반론 없이 이 두 사주에서만 나올 수 있는 분석인가?
□ [확정] 데이터의 강약/용신을 그대로 사용했는가?

JSON 응답 (모든 필드 필수, 빈 문자열 금지):
{
  "overallScore": number(45-90),
  "headline": "이 궁합을 꿰뚫는 한 문장 비유",
  "summary": "3~4문장 종합 요약 — 두 사람의 일간 관계 + 핵심 시너지/충돌",

  "coupleArchetype": {
    "title": "이 커플의 유형 이름 (예: '불꽃과 나무', '바다와 바위', '달과 태양')",
    "emoji": "이 커플을 대표하는 이모지 2개 (예: '🔥🌿')",
    "description": "이 유형의 특성 150자+ — 어떤 관계 패턴인지, 유사한 유명 커플이 있다면 언급"
  },

  "categories": {
    "love": { "score": number(30-95), "detail": "감정적 교감, 로맨스, 설렘 분석 100자+" },
    "communication": { "score": number(30-95), "detail": "대화 방식, 의견 충돌 시 패턴 분석 100자+" },
    "values": { "score": number(30-95), "detail": "인생관, 가치관, 우선순위 일치도 분석 100자+" },
    "sexual": { "score": number(30-95), "detail": "신체적 궁합, 에너지 교환, 끌림 분석 100자+" },
    "finance": { "score": number(30-95), "detail": "돈 관리 방식, 소비/저축 패턴 호환 분석 100자+" },
    "family": { "score": number(30-95), "detail": "가족 관계, 시댁/처가, 양육 스타일 분석 100자+" },
    "growth": { "score": number(30-95), "detail": "서로의 성장을 돕는가, 발목을 잡는가 분석 100자+" },
    "crisis": { "score": number(30-95), "detail": "위기 대처, 이별 위험도, 회복 탄력성 분석 100자+" }
  },

  "dayMasterRelation": {
    "type": "관계 유형명 (예: '정임합(丁壬合) — 운명적 끌림')",
    "analysis": "일간 관계 상세 분석 200자+",
    "aToB": "${n1}이/가 ${n2}을/를 보는 시선 — 십성 관계 + 현실적 의미 100자+",
    "bToA": "${n2}이/가 ${n1}을/를 보는 시선 — 십성 관계 + 현실적 의미 100자+"
  },

  "elementInteraction": {
    "summary": "오행 궁합 한 줄 요약",
    "aElements": { "dominant": "${n1}의 주 오행 (예: '수(水)')", "percent": number },
    "bElements": { "dominant": "${n2}의 주 오행 (예: '화(火)')", "percent": number },
    "interaction": "상생/상극/비화 + 구체적 설명 150자+",
    "complementary": "서로 채워주는 오행 분석 100자+"
  },

  "dynamics": {
    "powerBalance": "주도권 분석 100자+ — 몇대몇 비율, 어떤 상황에서 뒤집히는지",
    "fightPattern": "싸움 패턴 150자+ — 트리거, 공격/방어 방식, 냉전 기간, 화해 패턴, 반복 주기",
    "loveLanguage": "사랑 표현 방식 비교 100자+",
    "dealBreaker": "이 관계를 깨뜨릴 수 있는 것 1가지 100자+"
  },

  "relationshipStages": {
    "first3months": "만남~3개월: 이 커플의 초반 모습 80자+",
    "sixMonths": "3~6개월: 현실 접촉 시작 80자+",
    "oneYear": "6개월~1년: 권태기 or 안정기 80자+",
    "threeYears": "1~3년: 진짜 시험이 오는 시기 80자+",
    "longTerm": "3년 이후: 장기적 관계의 모습 80자+"
  },

  "strengthPoints": [
    "시너지1 — 사주 근거 + 현실 발현 80자+",
    "시너지2 — 사주 근거 80자+",
    "시너지3 — 사주 근거 80자+"
  ],

  "conflictPoints": [
    "충돌1 — 사주 근거 + 구체적 대처법 100자+",
    "충돌2 — 사주 근거 + 대처법 100자+",
    "충돌3 — 사주 근거 + 대처법 100자+"
  ],

  "survivalGuide": {
    "rule1": "이 커플의 생존 법칙 1 — 구체적 행동",
    "rule2": "생존 법칙 2",
    "rule3": "생존 법칙 3",
    "neverDo": "이것만은 절대 하지 마세요 — 이 커플에게 치명적인 행동 1가지"
  },

  "dateRecommend": {
    "bestDate": "이 커플에게 최고인 데이트 — 두 사람의 오행/십성 기반 추천 80자+",
    "worstDate": "이 커플이 피해야 할 데이트 유형 60자+",
    "healingDate": "다툰 후 화해 데이트 추천 60자+"
  },

  "timeline": {
    "bestMonths": [
      { "month": "3월", "score": 85, "reason": "사주 근거 60자+" },
      { "month": "9월", "score": 82, "reason": "..." }
    ],
    "worstMonths": [
      { "month": "6월", "score": 40, "reason": "사주 근거 60자+" },
      { "month": "10월", "score": 45, "reason": "..." }
    ],
    "marriageTiming": "결혼 최적 시기 경향 — 사주 근거 (확정 금지, 가능성으로)"
  },

  "marriageGrade": {
    "grade": "A+ ~ D 등급",
    "summary": "결혼 적합도 요약 120자+",
    "ifMarried": "결혼 후 예상 모습 120자+ — 1~3년차/4~5년차/10년차 구분",
    "childrenNote": "자녀 관련 궁합 100자+",
    "inlaws": "시댁/처가 관계 예측 80자+"
  },

  "secretMessage": {
    "toA": "${n1}에게만 전하는 비밀 조언 100자+ — 상대를 다룰 때 알아야 할 핵심",
    "toB": "${n2}에게만 전하는 비밀 조언 100자+"
  },

  "yearlyAdvice": "올해(${currentYear}년) 이 커플에게 가장 중요한 조언 150자+",

  "advice": [
    "실용 조언1 — 구체적 행동 지침",
    "실용 조언2",
    "실용 조언3"
  ],

  "funFact": "재미로 보는 한 줄 — 이 커플을 음식에 비유하면? / 이 커플의 전생은? / 이 커플이 동물이라면? 중 하나.",

  "finalWords": "마지막 한 마디 150자 — 이 커플에게만 해당하는 따뜻하고 구체적인 메시지",
  "disclaimer": "본 분석은 전통 사주명리학 기반 참고용 콘텐츠이며, 중요한 결정에는 전문가와 상담하시기 바랍니다."
}

규칙:
- 모든 텍스트에서 반드시 "${n1}", "${n2}" 실명을 사용. "사람1", "사람2" 절대 금지.
- categories 8개 항목 점수 모두 다르게. 최고-최저 차이 20점 이상.
- survivalGuide는 뻔한 말 금지. 실제 행동 레벨.
- secretMessage는 상대방이 모르게 각자에게 주는 팁.
- JSON만 출력.`;
    } else {
      userPrompt = `${p1Info}
${p2Info}

RESPOND IN ${lang}.

"${n1}"과 "${n2}"의 궁합 핵심을 짧지만 강렬하게 요약해줘.
반드시 "${n1}", "${n2}" 실명을 사용. "사람1", "사람2" 절대 금지.

JSON 응답:
{
  "overallScore": number(45-90),
  "headline": "이 궁합을 한 마디로 — 비유 필수",
  "summary": "두 사람의 일간 관계를 근거로 한 핵심 요약 2~3문장",
  "teaserForPaid": "상세 분석에서 알 수 있는 것 미리보기 1문장"
}

뻔한 일반론 금지. 두 사람의 사주 구조를 근거로. JSON만 출력.`;
    }

    // --- Helper: call OpenAI ---
    const callAI = async (prompt: string, model: string, maxTok: number, temp: number, seed?: number) => {
      const body: Record<string, unknown> = {
        model,
        messages: [
          { role: 'system', content: COMPATIBILITY_SYSTEM },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: temp,
        max_tokens: maxTok,
      };
      if (seed !== undefined) body.seed = seed;
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await resp.json();
      return JSON.parse(d.choices[0].message.content);
    };

    const model = isPaid ? 'gpt-4o' : 'gpt-4o-mini';
    const maxTokens = isPaid ? 8000 : 1500;
    const temperature = isPaid ? 0.6 : 0.75;

    const rawResult = await callAI(userPrompt, model, maxTokens, temperature, birthSeed);

    // --- Response validation & sanitization (paid only) ---
    if (isPaid) {
      // Ensure overallScore in range
      if (typeof rawResult.overallScore === 'number') {
        rawResult.overallScore = Math.max(35, Math.min(92, rawResult.overallScore));
      } else {
        rawResult.overallScore = 65;
      }

      // Ensure all category scores exist and are in range
      const CATEGORIES = ['love', 'communication', 'values', 'sexual', 'finance', 'family', 'growth', 'crisis'];
      if (rawResult.categories) {
        for (const cat of CATEGORIES) {
          if (!rawResult.categories[cat]) {
            rawResult.categories[cat] = { score: 60, detail: '' };
          } else if (typeof rawResult.categories[cat].score !== 'number') {
            rawResult.categories[cat].score = 60;
          } else {
            rawResult.categories[cat].score = Math.max(30, Math.min(95, rawResult.categories[cat].score));
          }
        }

        // Deduplicate category scores (AI sometimes returns identical scores)
        const scores = CATEGORIES.map(c => rawResult.categories[c].score);
        const seen = new Set<number>();
        for (let i = 0; i < CATEGORIES.length; i++) {
          while (seen.has(scores[i])) {
            scores[i] += (i % 2 === 0 ? 1 : -1); // nudge alternating direction
            scores[i] = Math.max(30, Math.min(95, scores[i]));
          }
          seen.add(scores[i]);
          rawResult.categories[CATEGORIES[i]].score = scores[i];
        }
      }

      // Ensure marriageGrade has grade field
      if (rawResult.marriageGrade && !rawResult.marriageGrade.grade) {
        rawResult.marriageGrade.grade = 'B';
      }

      // Ensure strengthPoints and conflictPoints are arrays
      if (!Array.isArray(rawResult.strengthPoints)) rawResult.strengthPoints = [];
      if (!Array.isArray(rawResult.conflictPoints)) rawResult.conflictPoints = [];
      if (!Array.isArray(rawResult.advice)) rawResult.advice = [];

      // Ensure disclaimer
      if (!rawResult.disclaimer) {
        rawResult.disclaimer = '본 분석은 전통 사주명리학 기반 참고용 콘텐츠이며, 중요한 결정에는 전문가와 상담하시기 바랍니다.';
      }
    }

    // Normalize timeline keys — dynamic year + backward compat alias
    if (rawResult.timeline) {
      const tl = rawResult.timeline;

      // AI가 bestMonthsXXXX 키로 반환할 수 있으므로 정규화
      const bestKey = Object.keys(tl).find(k => k.startsWith('bestMonths'));
      const worstKey = Object.keys(tl).find(k => k.startsWith('worstMonths'));

      // bestMonths / worstMonths (연도 없는 키)로 통합
      if (bestKey && bestKey !== 'bestMonths') {
        tl.bestMonths = tl[bestKey];
      }
      if (worstKey && worstKey !== 'worstMonths') {
        tl.worstMonths = tl[worstKey];
      }

      // UI backward compat: bestMonths2026 alias
      if (tl.bestMonths) tl.bestMonths2026 = tl.bestMonths;
      if (tl.worstMonths) tl.worstMonths2026 = tl.worstMonths;

      // 동적 연도 alias도 추가
      if (tl.bestMonths) tl[`bestMonths${currentYear}`] = tl.bestMonths;
      if (tl.worstMonths) tl[`worstMonths${currentYear}`] = tl.worstMonths;
    }

    return new Response(JSON.stringify(rawResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Compatibility analysis failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
