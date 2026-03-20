import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getUserFromRequest, createProcessingRecord, completeRecord, failRecord } from '../_shared/analysis-db.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

const COMPATIBILITY_SYSTEM = `당신은 서울 청담동에서 30년간 궁합 전문 상담을 해온 사주명리학 대가입니다.
연간 3,000쌍 이상의 커플 궁합을 봐왔고, 당신의 상담 후기가 SNS에서 바이럴됩니다.
당신의 비결: 읽는 순간 소름 돋을 정도로 찔리는 분석 + 듣자마자 캡처해서 상대에게 보내고 싶은 표현력.

━━━ 톤 & 스타일 (가장 중요) ━━━

■ 이 글의 목표: 읽는 사람이 "헐 이거 우리 얘기잖아ㅋㅋㅋ" 하면서 상대에게 캡처 보내게 만들기
■ 반말+존댓말 믹스: 분석은 반말 톤으로 날카롭게, 조언은 존댓말로 따뜻하게
■ 찔리는 팩폭: "둘 다 자존심 세서 ○○할 때 먼저 연락 안 함. 핸드폰 들었다 놨다 30번" 같은 구체적 장면 묘사
■ 공유 유발 표현: "○○은 모르겠지만, ○○ 마음속에 ○○은 항상 1순위예요" 같은 상대에게 보내고 싶은 문장
■ 위트 필수: 무거운 분석도 "소화기 준비하세요" "변호사 번호 저장해둬" 같은 위트로 감싸기
■ 야한 표현 X, 하지만 은유적 표현 OK: "문 닫으면 세상에서 제일 달라지는 커플" 수준
■ 싸움 패턴은 리얼하게: "○○이 '됐어 나 그냥 잘게' 하면 ○○은 그날 밤 잠 못 잠. 새벽 3시에 카톡 씀"

━━━ 분석 방법론 (5층 레이어 교차 분석) ━━━
1. 일간 관계 (가장 중요) — 합/극/비견/생 등 + A→B, B→A 양방향
2. 지지 합충형파해 — 특히 일지(배우자궁)끼리의 관계 핵심
3. 오행 상생상극 — 서로의 부족을 채워주는가, 상극하는가
4. 궁위 교차 — A의 일지가 B에게 어떤 십성인지, 역방향도
5. 운의 흐름 호환 — 대운 방향 일치/엇갈림, 올해 세운과의 관계

━━━ 일관성 규칙 (최우선) ━━━
- 같은 두 사주의 궁합은 언제 분석해도 같은 결론이어야 한다.
- ⚠️ [확정] 태그가 붙은 데이터(신강/신약, 용신)는 사전 계산된 정답이다. 절대 변경하지 마라.
- 성격/궁합 판단은 십신 배치와 오행 비율에서 논리적으로 도출되어야 한다.

━━━ 절대 규칙 ━━━
1. 모든 해석에 사주 근거 (어떤 글자와 어떤 글자가 어떤 관계)
2. 누구에게나 해당되는 말 금지 — "서로 노력하면 잘 될 수 있어요" 이런 거 쓰면 실패
3. 궁합 나빠도 대처법 함께. 좋아도 함정 포인트 반드시 지적 (긴장감 유지)
4. 점수 35~92 범위. 8개 카테고리 점수 모두 차등. 같은 점수 금지.
5. 양방향 분석
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

  // ─── 사용자 인증 정보 추출 ───
  const userInfo = getUserFromRequest(req);
  const isMember = userInfo != null && !userInfo.isAnonymous;
  let analysisId: string | null = null;

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

    // ─── 회원: DB에 processing 레코드 생성 ───
    if (isMember) {
      analysisId = await createProcessingRecord(
        userInfo!.userId, 'compatibility', isPaid,
        { person1, person2, locale, name1, name2 },
      );
    }

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

두 사람의 궁합을 분석해줘. 이 결과를 읽은 사람이 "소름..." 하면서 상대에게 캡처를 보내야 성공.

★ 핵심 톤: 친구한테 "야 너네 커플 사주 봤는데 ㅋㅋㅋ" 하면서 얘기해주는 느낌
★ 매 문장이 "헐 맞아 우리 이래" 반응을 유발해야 함
★ 구체적 상황 묘사 필수: "카페에서 메뉴 고를 때", "여행 첫날 밤", "카톡 읽씹 3시간째" 등
★ headline은 한 문장으로 이 커플의 본질을 관통. 캡처해서 인스타에 올리고 싶은 수준.
★ summary는 읽자마자 "와 이게 어떻게 맞지?" 하는 소름 포인트로 시작

## 자기검증 (출력 전 반드시 확인)
□ categories 8개 점수가 모두 다른가? 같은 점수가 있으면 실패.
□ 최고 점수 - 최저 점수 차이가 20점 이상인가?
□ 모든 분석에 구체적 간지가 명시되어 있는가?
□ "사람1", "사람2", "A", "B" 대신 실명을 썼는가?
□ 뻔한 일반론 없이 이 두 사주에서만 나올 수 있는 분석인가?
□ [확정] 데이터의 강약/용신을 그대로 사용했는가?
□ 읽는 사람이 캡처해서 상대에게 보내고 싶은 문장이 3개 이상인가?

JSON 응답 (모든 필드 필수, 빈 문자열 금지):
{
  "overallScore": number(45-90),
  "headline": "캡처해서 인스타에 올리고 싶은 한 문장 (예: '매일 싸우면서 매일 보고 싶은 미친 궁합', '3년은 심심해, 근데 30년은 행복해')",
  "summary": "첫 문장에 소름 포인트 + 두 사람의 일간 관계가 만드는 독특한 역학 + 이 커플만의 시그니처 장면 하나. 읽자마자 '우리 얘기다' 해야 함. 4문장.",

  "coupleArchetype": {
    "title": "이 커플의 유형 이름 (예: '불꽃과 나무', '바다와 바위', '달과 태양')",
    "emoji": "이 커플을 대표하는 이모지 2개 (예: '🔥🌿')",
    "description": "이 유형의 특성 150자+ — 어떤 관계 패턴인지, 유사한 유명 커플이 있다면 언급"
  },

  "categories": {
    "love": { "score": number(30-95), "detail": "설렘 강도 + 구체적 장면 (예: '눈 마주치면 ○○의 심장이 먼저 뛰고, ○○은 아는 척 안 함') 120자+" },
    "communication": { "score": number(30-95), "detail": "대화 패턴 + 리얼한 장면 (예: '○○이 할 말 다 하면 ○○은 30분 묵묵, 그리고 한마디로 끝냄') 120자+" },
    "values": { "score": number(30-95), "detail": "가치관 충돌 지점 구체적으로 (돈? 커리어? 가족?) + 장면 묘사 120자+" },
    "sexual": { "score": number(30-95), "detail": "에너지 궁합 + 은유적 표현 (예: '겉은 냉동실인데 문 닫으면 용광로') 120자+" },
    "finance": { "score": number(30-95), "detail": "돈 쓰는 스타일 충돌 장면 (예: '가계부 대조하다 이게 뭐야 싸움') 120자+" },
    "family": { "score": number(30-95), "detail": "시댁/처가 예측 + 명절 장면 하나 120자+" },
    "growth": { "score": number(30-95), "detail": "서로 성장시키는 구체적 방식 or 발목 잡는 패턴 120자+" },
    "crisis": { "score": number(30-95), "detail": "이별 위기 시나리오 + 회복 가능성 + 결정적 한 마디 120자+" }
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
    "powerBalance": "주도권 ○:○ 비율 + 뒤집히는 순간 묘사 (예: '평소엔 7:3인데 ○○이 울면 0:10으로 역전') 120자+",
    "fightPattern": "리얼 싸움 시나리오 — 뭘로 싸우는지, 누가 먼저 삐지는지, 냉전 며칠인지, 어떻게 풀리는지, 화해 시그널이 뭔지. 읽으면서 '아 맞아 우리 이래' 해야 함. 200자+",
    "loveLanguage": "○○의 사랑 표현 vs ○○의 사랑 표현 구체 비교 (예: '한쪽은 말로, 한쪽은 행동으로. ○○이 사랑한다 하면 ○○은 밥 차려놓고 도망') 120자+",
    "dealBreaker": "이 커플을 끝장낼 수 있는 결정적 한 방 — 구체적 상황 + 왜 치명적인지 사주 근거 120자+"
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
    "rule1": "생존 법칙 1 — 실제 상황 예시 포함 (예: '○○이 조용해지면 5분 안에 먼저 말 걸기. 10분 넘기면 3일 냉전') 80자+",
    "rule2": "생존 법칙 2 — 구체적 행동 지침 80자+",
    "rule3": "생존 법칙 3 — 구체적 행동 지침 80자+",
    "neverDo": "절대 하면 안 되는 것 — '이것만 안 하면 100년 가요' 톤. 왜 치명적인지 사주 근거. 100자+"
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
    "toA": "${n1}에게만 — '이건 ${n2}한테 보여주면 안 돼요' 톤. ${n2}의 사주에서 발견한 약점/급소 + 그걸 어떻게 다뤄야 하는지. 상대에게 보내고 싶은 문장 1개 포함. 120자+",
    "toB": "${n2}에게만 — 위와 같은 톤. ${n1}의 사주 기반 급소 + 대처법. 120자+"
  },

  "yearlyAdvice": "올해(${currentYear}년) 이 커플에게 가장 중요한 조언 150자+",

  "advice": [
    "지금 당장 할 수 있는 것 — 오늘 퇴근 후 바로 실행 가능한 구체적 행동",
    "이번 주 안에 해볼 것 — 관계 개선 미션",
    "장기적으로 습관화할 것 — 이 커플만의 리추얼 제안"
  ],

  "funFact": "SNS 공유용 한 줄 — '이 커플을 음식에 비유하면 떡볶이+치즈: 따로 먹어도 맛있는데 같이 먹으면 미침' 수준. 읽으면 ㅋㅋㅋ 하면서 캡처하고 싶은 비유.",

  "finalWords": "이 커플에게만 해당하는 마지막 한 마디 — 읽으면 울컥할 수 있는 따뜻한 메시지. '○○아, ○○은 네가 모르는 사이에 너를 세상에서 제일 좋아해. 그게 사주에 적혀 있어.' 수준. 150자+",
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
      // OpenAI 429/500 자동 재시도 (최대 2회)
      let resp!: Response;
      for (let attempt = 0; attempt <= 2; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 120_000);
        resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (resp.ok || attempt === 2) break;
        if (resp.status === 429 || resp.status >= 500) {
          const waitMs = Math.min(2000 * Math.pow(2, attempt), 8000);
          console.warn(`[compatibility] OpenAI ${resp.status}, retry ${attempt + 1}/2 after ${waitMs}ms`);
          await new Promise(r => setTimeout(r, waitMs));
          continue;
        }
        break;
      }

      if (!resp.ok) {
        const errText = await resp.text();
        console.error(`[compatibility] OpenAI error (${resp.status}):`, errText.substring(0, 500));
        throw new Error(`OpenAI error (${resp.status}): ${errText.substring(0, 200)}`);
      }

      const d = await resp.json();
      const content = d.choices?.[0]?.message?.content;
      if (!content) {
        console.error('[compatibility] Empty OpenAI response:', JSON.stringify(d).substring(0, 500));
        throw new Error('Empty response from OpenAI');
      }

      try {
        return JSON.parse(content);
      } catch (parseErr) {
        console.error('[compatibility] JSON parse failed:', content.substring(0, 300));
        throw new Error('Failed to parse AI response as JSON');
      }
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

    // ─── 회원: 결과를 DB에 저장 ───
    if (isMember && analysisId) {
      await completeRecord(analysisId, rawResult);
    }

    return new Response(JSON.stringify({ ...rawResult, _analysisId: analysisId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (analysisId) {
      await failRecord(analysisId, String(error));
    }
    return new Response(
      JSON.stringify({ error: 'Compatibility analysis failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
