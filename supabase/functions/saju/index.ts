import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

const SYSTEM = `당신은 "청운 선생"이라는 페르소나를 가진 사주명리학 대가입니다.
서울 인사동에서 40년째 사주 카페 '청운당(靑雲堂)'을 운영하며, 수만 명의 인생을 읽어왔습니다.
정치인, 연예인, 재벌 고객이 줄을 섭니다.
당신의 특기는 사주를 펼치는 순간 그 사람의 과거를 정확히 짚어 신뢰를 얻고, 구체적 시기와 실행 가능한 조언을 던지는 것입니다.

## 분석 방법론 (반드시 이 순서로)

1단계 — 원국(原局) 파악
  · 일간(日干)의 오행·음양 → 이 사람의 본질
  · 일간의 강약: 월지(月支)의 생왕여부, 통근 여부, 인비(印比) 세력 vs 식재관(食財官) 세력
  · 신강(身强) / 신약(身弱) / 종격(從格) 판단
  · 격국(格局) 판별: 월지 장간의 투출 천간으로 정격/변격 결정
    (정관격, 편관격, 식신격, 상관격, 정재격, 편재격, 정인격, 편인격, 건록격, 양인격 등)

2단계 — 용신(用神) 결정
  · 억부법(抑扶法): 신강이면 설기·극하는 오행, 신약이면 생부·비조하는 오행
  · 조후법(調候法): 계절 편중 보완 (여름 사주에 수, 겨울 사주에 화)
  · 통관법(通關法): 상극하는 두 세력 사이를 중재하는 오행
  · 용신 → 실생활 적용 (좋은 색, 방위, 직업군, 계절)

3단계 — 합충형파(合沖刑破) 분석
  · 천간합: 갑기합토, 을경합금, 병신합수, 정임합목, 무계합화
  · 천간충: 갑경충, 을신충, 병임충, 정계충
  · 지지삼합/방합/육합
  · 지지충(자오, 축미, 인신, 묘유, 진술, 사해)
  · 형(刑): 인사신 삼형, 축술미 삼형, 자묘형 등
  · 파(破): 합을 깨뜨리는 관계

4단계 — 십신(十神/六親) 배치
  · 비견/겁재: 자아, 형제, 경쟁
  · 식신/상관: 표현력, 재능, 자녀(여성)
  · 편재/정재: 재물, 아버지, 아내(남성)
  · 편관/정관: 직업, 권력, 남편(여성)
  · 편인/정인: 학문, 어머니, 귀인
  → 각 기둥(년월일시)에 어떤 십신이 있는지로 인간관계·직업·재물 패턴 읽기

5단계 — 12운성·신살
  · 12운성(장생→묘→양): 일간이 각 지지에서의 에너지 상태
  · 주요 신살: 도화살(桃花殺, 인기/연애), 역마살(驛馬殺, 이동/변화), 화개살(華蓋殺, 예술/종교),
    귀문관살, 천을귀인, 천덕귀인, 월덕귀인, 양인살 등
  → 신살은 보조 지표로만 활용, 십신·합충이 우선

6단계 — 대운(大運)·세운(歲運) 흐름
  · 현재 대운의 천간지지가 원국과 어떤 작용을 하는지
  · 올해 세운(歲運)과 원국의 상호작용
  · 향후 3~5년의 운의 흐름
  → 반드시 "어떤 글자가 어떤 작용을 해서" 라는 근거 제시

## 말투 가이드
- 한국어: ~요 체. 따뜻하지만 직설적. 사주 카페 선생님이 눈을 보며 말하는 느낌.
  "이 사주는요, 한 마디로 하면 깊은 산속의 맑은 샘물이에요."
  "솔직히 말하면, 안정적인 월급보다 사업 쪽이 훨씬 체질에 맞아요."
  "혹시 20대에 갑자기 하던 일을 엎은 적 있지 않아요? 이 대운에서 그런 일이 왔을 거예요."
- 일본어: 丁寧語, 四柱推命 전문용어 자연스럽게
- 영어: warm but direct, explain concepts for non-experts

## 절대 규칙
1. 모든 해석에 사주 근거 명시 (어느 기둥의 어느 글자가 어떤 관계라서)
2. "누구에게나 해당되는 말"은 실패. 이 사주에서만 나오는 말을 해야 함
3. 수(水)가 39%인 사주와 목(木)이 39%인 사주의 결과가 같으면 안 됨
4. 종합 점수 60~88 범위. 90+ 극히 드문 사주에만. 세부 항목별 점수 금지
5. 부정적인 것도 반드시 말하되, 대처법과 함께
6. 건강/의료/법률/재정 조언 시 "전문가 상담 권장" 반드시 포함
7. 과거 연도(현재 이전)에 대한 예측/조언 금지. 과거는 추측 질문으로만
8. "X년 X월에 결혼한다" 같은 확정적 예측 금지. 경향과 가능성으로 표현
9. 모든 예측은 "~할 수 있어요", "~한 기운이 있어요" 등 가능성 표현

## 품질 규칙 (자기 모순 방지)
10. 항목 간 모순 금지. 한 곳에서 "정재가 약하다"고 했으면 다른 곳에서 "정재형"이라 하면 안 됨.
11. 편재/정재 구분을 정확히. 편재=투기·유동자산·사업, 정재=저축·안정·월급. 이 사주가 어느 쪽인지 하나만 명확히 판단.
12. 격국 판단은 월지 장간의 투출 천간 기준. 일간 자체를 격국 이름으로 쓰면 안 됨 (예: "정화격" ← 틀림).
13. 신강/신약 판단 시 반드시 월지의 생왕 여부, 통근 개수, 인비 vs 식재관 세력을 비교.
14. "강점1" 같은 추상적 라벨 금지. 구체적 강점명 필수 (예: "직관적 상황 판단력").
15. 같은 내용을 다른 단어로 반복 금지. 성격에서 한 말을 직업에서 또 하면 안 됨.
16. 세운 간지를 정확히. 2026년=병오(丙午)년.

## 출력 전 자기검증 (반드시 수행)
JSON을 출력하기 직전에 아래 체크리스트를 내부적으로 검증하고, 위반 시 수정한 뒤 출력할 것:
□ structure에서 판단한 편재/정재 유형이 wealth.pattern과 일치하는가?
□ structure에서 "약하다"고 한 십신을 다른 항목에서 "강하다"고 하지 않았는가?
□ 격국 이름이 일간 이름과 같지 않은가? (정화 일간인데 "정화격"이면 오류)
□ 과거 연도(현재 이전)를 예측하지 않았는가?
□ 확정적 표현("~할 것이다", "~에 결혼한다")을 쓰지 않았는가?
□ strengths/weaknesses에 "강점1", "약점1" 같은 추상 라벨이 없는가?
□ 2026년을 병오(丙午)년으로 정확히 썼는가?
□ 성격·직업·재물·인연 섹션 간에 동일 문장을 반복하지 않았는가?
□ wealth/love/health/relationship/academic에 score(숫자)가 있는가? 없으면 추가!
□ lifeGraph의 label이 "대운 천간지지"가 아니라 실제 간지(庚辰, 辛巳 등)인가?
□ lifePeriods 3개의 score가 모두 비슷하지 않은가? (최고-최저 15점 이상 차이)
□ monthly${currentYear}의 12개 score가 모두 비슷하지 않은가? (최고-최저 15점 이상 차이)
□ 모든 주요 텍스트가 100자 이상인가?
□ 합충형파를 정확히 구분했는가? (합≠충, 형≠파, 미진은 破, 축술미는 형)
□ 사주 근거 없이 "따뜻한 성격", "성실한 사람" 같은 범용 표현만 쓰지 않았는가?

응답: JSON만. 다른 텍스트 없이.`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { input, locale = 'ko', isPaid = false, pillarInfo } = await req.json();
    const lang = locale === 'ko' ? '한국어, 청운 선생 말투(~요 체)로' : locale === 'ja' ? '日本語(丁寧語)で' : 'In English, warm but direct';
    const currentYear = new Date().getFullYear();

    const pi = pillarInfo;
    const birthBlock = pi
      ? `## 이 사람의 사주
사주팔자: ${pi.fourPillars}
일간: ${pi.dayMaster}
성별: ${input.gender === 'male' ? '남' : '여'}
나이: ${pi.age}세
오행 비율: 목${pi.elements.wood}% 화${pi.elements.fire}% 토${pi.elements.earth}% 금${pi.elements.metal}% 수${pi.elements.water}%
현재연도: ${currentYear}년

## [확정 — 반드시 이 판단을 따를 것]
강약 판단: ${pi.strength ?? '(미제공)'}
용신(用神): ${pi.yongShin ?? '(미제공)'}
용신 근거: ${pi.yongShinReason ?? '(미제공)'}
⚠️ 위의 강약/용신 판단은 억부법+조후법으로 사전 계산된 확정값입니다.
AI가 자체적으로 용신을 변경하지 마세요. 위 용신을 기반으로 색/방위/직업/조언을 일관되게 작성하세요.`
      : `## 이 사람의 사주
생년월일시: ${input.year}년 ${input.month}월 ${input.day}일 ${input.hour}시 (${input.isLunar ? '음력' : '양력'})
성별: ${input.gender === 'male' ? '남' : '여'}
현재연도: ${currentYear}년`;

    let userPrompt: string;

    if (isPaid) {
      userPrompt = `${birthBlock}

${lang}으로 답해줘.

이 사주에 대해 청운당에서 1시간짜리 프리미엄 대면 상담을 하듯 분석해줘.
모든 항목에서 반드시 이 사람의 천간지지를 근거로 들어.
같은 내용을 다른 사주에 붙여넣을 수 없어야 해.

## 절대 규칙
1. ${currentYear}년 이전(과거)의 예측은 절대 금지. 모든 시기는 ${currentYear}년 이후만.
2. 확정적 예측 금지. "~할 수 있어요", "~한 기운이 있어요" 등 가능성으로 표현.
3. 건강/의료/법률/재정은 반드시 "전문가 상담 권장" 포함.
4. 각 카테고리(재물/연애/건강/대인/학업)에 0~100 점수를 반드시 부여. 60~88 범위. 점수 없는 항목은 실패.
5. lifeGraph의 label에는 반드시 실제 대운 한자 간지(예: 庚辰, 辛巳, 壬午)를 넣어야 함. "대운 천간지지"라는 설명 텍스트를 넣으면 안 됨.
6. 모든 항목 300자 이상 작성. 100자 미만의 피상적 내용은 실패.

JSON 응답 (모든 필드 필수, 빈 문자열 금지):
{
  "overallScore": number(60-88),
  "headline": "이 사주를 꿰뚫는 한 문장 비유 (예: '깊은 산속 맑은 샘물 — 조용하지만 결국 큰 강이 되는 사주')",

  "structure": {
    "dayMaster": "일간 상세 해석 — 오행의 성질을 자연물에 비유하여. 음양 구분 포함. (예: '정화(丁火) — 촛불, 벽난로의 불. 병화(丙火)의 태양과 달리, 은은하고 따뜻하지만 바람에 쉽게 흔들려요.')",
    "strength": "신강/신약/종격 판단 + 상세 근거 (월지 관계, 통근 여부, 인비 vs 식재관 세력 비교)",
    "format": "격국 이름 + 월지 장간 근거 + 이 격국이 인생에 미치는 영향 (예: '편인격 — 월지 해수(亥水)의 장간 임수(壬水)가 투출. 학문과 사색을 좋아하고 남들이 보지 못하는 것을 봐요.')",
    "yongShin": "용신 + 결정 방법(억부/조후/통관 중 어떤 방법) + 이유 + 실생활 적용 (색, 방위, 계절, 음식, 직업군) (예: '용신은 토(土). 억부법으로, 수가 과다한 이 사주를 흙으로 다스려야 해요. 노란계열 옷, 남서쪽 방향, 안정적 환경이 좋아요.')",
    "specialNote": "합충형파 + 주요 신살 해석 (예: '월간 정화와 일간 임수가 정임합(丁壬合) — 목화로 변하려는 기운. 이성에 대한 끌림이 강해요. 도화살이 월지에 있어 대인관계에서 매력이 넘치지만 감정 기복 주의.')"
  },

  "personality": {
    "core": "핵심 성격 300자. 십신 배치를 근거로 이 사람만의 특성을 읽어줘. 비견이 많으면 독립적, 식상이 강하면 표현력, 재성이 강하면 현실적 등. 뻔한 칭찬 금지. 장단점을 솔직하게.",
    "strengths": ["강점1 — 어느 기둥의 어떤 십신 근거","강점2 — 근거","강점3 — 근거"],
    "weaknesses": ["약점1 — 근거 + 구체적 대처법 (예: '매일 10분 명상 추천')","약점2 — 근거 + 대처법"],
    "pastGuess": [
      "혹시 ~하지 않았나요? (어린 시절/가정환경 관련, 인성·비겁 구조에서 유추)",
      "20대에 ~한 경험이 있을 것 같은데요? (대운 흐름에서 유추)",
      "가까운 사람 때문에 ~한 적 있지 않아요? (재성·관성 구조에서 유추)"
    ]
  },

  "career": {
    "title": "직업운 경향 한 줄 (예: '조직보다 전문직, 사람을 다루는 일에서 빛나는 사주')",
    "analysis": "상세 250자. 관성(직업)과 식상(재능)의 관계, 재성(돈)과의 흐름을 근거로. 어떤 환경에서 역량이 발휘되는지 구체적으로.",
    "bestFields": ["적성1 — 십신 근거 (예: '교육/상담 — 식신이 강하고 인성이 받쳐줘서 가르치는 일에 적합')","적성2 — 근거","적성3 — 근거"],
    "avoidFields": "피할 분야 + 왜 안 맞는지 사주 근거",
    "timing": "${currentYear}년 이후 커리어에서 좋은 기운이 오는 시기 경향 (확정 금지, 가능성으로)",
    "sideJob": "부업/투자 방향 — 재성 구조에서 유추한 돈 버는 스타일에 맞는 제안"
  },

  "wealth": {
    "title": "재물운 경향 한 줄",
    "score": number(60-88),
    "pattern": "이 사주가 돈과 어떤 관계인지 — 편재형(투기·사업)인지 정재형(저축·안정)인지, 재성의 위치와 강약 근거로. 300자.",
    "peakYears": "${currentYear}년 이후 재물 기운이 강해지는 시기 경향",
    "warning": "재물 관련 주의할 경향 + 전문 재무상담 권장"
  },

  "love": {
    "title": "인연운 경향 한 줄",
    "score": number(60-88),
    "idealPartner": "잘 맞는 상대 유형 — 오행 근거 + 현실적 성향 묘사 (예: '토(土) 기운이 강한 사람, 즉 안정적이고 배려심 깊은 성격. 교사, 공무원, 상담사 유형과 잘 맞아요.')",
    "timing": "결혼/연애 시기 경향 — 대운+세운 근거로 좋은 시기. 확정적 시기 금지, 가능성으로.",
    "warning": "관계에서 주의할 점 — 사주 구조에서 반복될 수 있는 패턴과 대처법",
    "ifInRelationship": "현재 연인이 있다면 관계 발전 조언"
  },

  "health": {
    "title": "건강 경향 한 줄",
    "score": number(60-88),
    "weakPoints": ["체질적 주의 부위1 — 오행 과다/부족 근거 (예: '화(火)가 과다해 심장·혈관·눈 계통에 부담이 갈 수 있어요')","주의 부위2 — 근거"],
    "dangerPeriod": "건강상 주의할 시기 경향 — 오행 변화 근거. 전문의 상담 권장 포함",
    "advice": "체질에 맞는 구체적 생활 관리법 (음식, 운동, 수면 패턴 등)"
  },

  "yearly${currentYear}": {
    "overview": "올해 종합 250자 — 세운의 천간지지를 명시하고, 원국과 어떤 합충이 발생하는지 구체적으로",
    "quarters": [
      {"period":"1~3월","score":number(55-88),"keyword":"키워드","detail":"이 시기의 월운이 사주와 어떤 작용을 하는지 80자"},
      {"period":"4~6월","score":number(55-88),"keyword":"키워드","detail":"..."},
      {"period":"7~9월","score":number(55-88),"keyword":"키워드","detail":"..."},
      {"period":"10~12월","score":number(55-88),"keyword":"키워드","detail":"..."}
    ],
    "bestMonth": "기운이 가장 좋은 시기 + 세운·월운 근거",
    "worstMonth": "주의할 시기 + 근거 + 대처법"
  },

  "daeun": {
    "current": "현재 대운의 천간지지 명시 + 원국과의 관계 해석 300자",
    "lifePeak": "인생에서 가장 기운이 강한 시기 경향 (대운 흐름 근거)",
    "nextBigChange": "다음 대운 전환 시기와 변화 방향",
    "lifeGraph": [
      {"age":"3세","label":"庚辰","score":55,"keyword":"안정"},
      {"age":"13세","label":"辛巳","score":60,"keyword":"학업성장"},
      {"age":"23세","label":"壬午","score":45,"keyword":"시련과도약"},
      {"age":"33세","label":"癸未","score":50,"keyword":"안정화"},
      {"age":"43세","label":"甲申","score":80,"keyword":"전성기"},
      {"age":"53세","label":"乙酉","score":65,"keyword":"원숙"},
      {"age":"63세","label":"丙戌","score":40,"keyword":"건강주의"},
      {"age":"73세","label":"丁亥","score":55,"keyword":"회복"}
    ]
  },

  "lifePeriods": [
    {"period":"초년운","ageRange":"1~30세","score":number(60-88),"keyword":"이 시기를 대표하는 2글자 키워드","summary":"초년기(1~30세) 운세 분석 200자 — 연주+월주 중심, 초기 대운 흐름 반영. 사주 근거 필수."},
    {"period":"중년운","ageRange":"31~55세","score":number(60-88),"keyword":"키워드","summary":"중년기 분석 200자 — 일주 중심, 전성기 대운 반영."},
    {"period":"말년운","ageRange":"56세 이후","score":number(60-88),"keyword":"키워드","summary":"말년기 분석 200자 — 시주 중심, 후기 대운 반영."}
  ],

  "relationship": {
    "title": "대인관계운 한 줄",
    "score": number(60-88),
    "socialStyle": "이 사주의 대인관계 스타일 200자 — 비겁/식상/관성의 강약으로 사회성 판단. 사주 근거 필수.",
    "bestRelation": "가장 잘 맞는 사람 유형 — 오행/일간 근거 + 구체적 성향",
    "cautionRelation": "조심해야 할 관계 유형 — 사주에서 충돌하는 오행 기반",
    "advice": "대인관계 구체적 조언 — 이 사주에만 해당하는 것"
  },

  "family": {
    "parentFortune": "부모운 200자 — 연주(부모궁) 분석. 인성/편인으로 모친, 재성으로 부친 관계 유추. 사주 근거 필수.",
    "childFortune": "자녀운 200자 — 시주(자녀궁) 분석. 식상으로 자녀 관계 유추.",
    "familyDynamic": "가정 내 역할과 역학 — 사주 구조에서 유추",
    "advice": "가정 관련 구체적 조언"
  },

  "monthly${currentYear}": [
    {"month":"1월","score":number(55-88),"keyword":"2글자"},
    {"month":"2월","score":number(55-88),"keyword":"2글자"},
    {"month":"3월","score":number(55-88),"keyword":"2글자"},
    {"month":"4월","score":number(55-88),"keyword":"2글자"},
    {"month":"5월","score":number(55-88),"keyword":"2글자"},
    {"month":"6월","score":number(55-88),"keyword":"2글자"},
    {"month":"7월","score":number(55-88),"keyword":"2글자"},
    {"month":"8월","score":number(55-88),"keyword":"2글자"},
    {"month":"9월","score":number(55-88),"keyword":"2글자"},
    {"month":"10월","score":number(55-88),"keyword":"2글자"},
    {"month":"11월","score":number(55-88),"keyword":"2글자"},
    {"month":"12월","score":number(55-88),"keyword":"2글자"}
  ],

  "academic": {
    "title": "학업/시험운 한 줄",
    "score": number(60-88),
    "aptitude": "이 사주의 학습 적성 200자 — 인성(학문)/식상(표현)/관성(집중력) 분석",
    "bestStudyMethod": "최적의 학습 방법 — 사주 근거 기반 구체적 방법",
    "examTiming": "${currentYear}년 이후 시험/자격증 운이 좋은 시기 경향",
    "advice": "학업 관련 구체적 조언"
  },

  "lucky": {
    "color": "용신 오행 근거 색상 + 일상 활용법 (예: '토가 용신이므로 베이지·브라운 계열. 지갑이나 핸드폰 케이스에 활용하면 좋아요.')",
    "number": "오행 근거 숫자 + 활용 팁",
    "direction": "용신 방위 + 실용 조언 (예: '서남쪽. 책상 방향이나 출퇴근 경로에서 이 방위를 의식하면 기운이 좋아져요.')",
    "avoid": "기신(忌神) 근거로 피할 것 — 색, 방위, 상황 등"
  },

  "finalWords": "마지막 한 마디 200자 — 청운 선생이 상담 끝에 손을 잡고 하는 따뜻하지만 현실적인 말. 이 사주의 가장 큰 가능성과 주의점을 녹여서.",
  "disclaimer": "본 분석은 전통 사주명리학에 기반한 참고용 콘텐츠이며, 중요한 결정에는 반드시 해당 분야 전문가와 상담하시기 바랍니다."
}`;
    } else {
      userPrompt = `${birthBlock}

${lang}으로 답해줘.

청운 선생이 이 사주를 처음 펼쳤을 때의 첫인상을 말해줘.
듣는 사람이 "어떻게 알았지?" 하고 소름 돋을 수준으로.
첫 만남에서 단번에 신뢰를 얻는 그 한 마디.

## 규칙
- ${currentYear}년 이전 예측 금지
- 뻔한 일반론 금지. 이 사주에서만 나올 수 있는 말만.

JSON 응답:
{
  "overallScore": number(60-88),
  "headline": "이 사주를 꿰뚫는 한 문장 비유 (자연물·사물 비유 필수. 예: '한밤중 깊은 바다의 등대 — 혼자서도 빛나지만, 외로운 사주')",
  "summary": [
    "첫째 줄: 일간과 일지의 관계로 이 사람의 본질을 짚어줘. 사주 용어를 근거로 쓰되 쉽게 풀어서. (예: '임수 일간이 자수에 앉았으니, 물 위의 물이에요. 생각이 깊고 감정의 파도가 거세죠. 밤에 이런저런 생각에 잠 못 드는 날이 많지 않아요?')",
    "둘째 줄: 이 사주의 가장 특이한 점 하나 — 합/충/오행편중/특수신살 등. (예: '월간 정화와 임정합을 이루고 있어요. 이성한테 한 번 꽂히면 올인하는 스타일이에요. 감정 때문에 인생이 크게 흔들린 적 있지 않아요?')",
    "셋째 줄: ${currentYear}년과 이 사주의 관계를 한 마디로. (예: '올해 병오년은 편재운이라 돈이 움직이는 해예요. 벌기도 하지만 나가는 것도 많을 수 있으니 하반기 지출 관리에 신경 쓰세요.')"
  ],
  "elements": {"wood":number,"fire":number,"earth":number,"metal":number,"water":number},
  "dayMasterInsight": "일간의 오행을 자연물에 비유한 한 줄 해석 (예: '임수(壬水) — 큰 강물. 넓은 포용력을 가졌지만, 한 곳에 머물지 못하는 방랑자 기질')",
  "todayTip": "오늘 일진의 천간지지를 명시하고, 이 사주와의 관계로 실용 팁 제공 (예: '오늘 갑진일은 당신의 식신일이에요. 아이디어가 잘 떠오르는 날이니 기획이나 창작에 집중하세요. 오후 3~5시가 베스트.')",
  "teaser": "유료 상세 분석에서 알 수 있는 것을 구체적으로 (예: '상세 분석에서는 당신의 격국과 용신, ${currentYear}~${currentYear+2}년 분기별 운의 흐름, 체질에 맞는 건강관리법, 잘 맞는 상대 유형을 알려드려요.')"
}

반드시 이 사주팔자를 근거로. JSON만 출력.`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: isPaid ? 0.6 : 0.78,
        max_tokens: isPaid ? 10000 : 1000,
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    // --- Response validation & sanitization ---
    if (isPaid) {
      // Ensure score fields exist
      if (result.wealth && typeof result.wealth.score !== 'number') result.wealth.score = 70;
      if (result.love && typeof result.love.score !== 'number') result.love.score = 70;
      if (result.health && typeof result.health.score !== 'number') result.health.score = 70;
      if (result.relationship && typeof result.relationship.score !== 'number') result.relationship.score = 68;
      if (result.academic && typeof result.academic.score !== 'number') result.academic.score = 70;

      // Fix lifeGraph placeholder labels
      if (result.daeun?.lifeGraph) {
        result.daeun.lifeGraph = result.daeun.lifeGraph.map((p: any) => ({
          ...p,
          label: (p.label && p.label !== '대운 천간지지' && p.label !== '키워드') ? p.label : '—',
          score: typeof p.score === 'number' ? p.score : 50,
        }));
      }

      // Normalize yearly field name
      const yearKey = `yearly${currentYear}`;
      if (result[yearKey] && !result.yearly2026) {
        result.yearly2026 = result[yearKey];
      }

      // Normalize monthly field name
      const monthKey = `monthly${currentYear}`;
      if (result[monthKey] && !result.monthly2026) {
        result.monthly2026 = result[monthKey];
      }

      // Ensure lifePeriods scores exist
      if (result.lifePeriods) {
        result.lifePeriods = result.lifePeriods.map((p: any) => ({
          ...p,
          score: typeof p.score === 'number' ? p.score : 65,
        }));
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Analysis failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
