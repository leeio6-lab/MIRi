import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getUserFromRequest, createProcessingRecord, completeRecord, failRecord } from '../_shared/analysis-db.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

// ─── Pre-computation: 만세력 기반 결정적 데이터 (AI 불필요, 매번 동일) ───

const STAGE_SCORES: Record<string, number> = {
  장생: 85, 목욕: 65, 관대: 80, 건록: 88, 제왕: 92,
  쇠: 60, 병: 50, 사: 45, 묘: 40, 절: 35, 태: 55, 양: 70,
};

const TENGOD_KW: Record<string, string> = {
  비견: '자립', 겁재: '변동', 식신: '풍요', 상관: '표현',
  편재: '기회', 정재: '안정', 편관: '시련', 정관: '질서',
  편인: '전환', 정인: '학업',
};

const ELEMENT_LUCKY: Record<string, { color: string; number: string; direction: string; avoid: string }> = {
  wood: {
    color: '용신이 목(木)이므로 초록·청록 계열이 좋아요. 지갑이나 핸드폰 케이스, 매일 입는 옷에 포인트로 활용하면 좋아요.',
    number: '목(木)에 해당하는 3, 8이 길한 숫자예요. 중요한 약속이나 선택 시 참고하세요.',
    direction: '동쪽이 길한 방향이에요. 책상이나 침대 머리를 동쪽으로 두면 좋고, 동쪽으로의 여행도 기운에 도움이 돼요.',
    avoid: '기신인 금(金) 기운을 주의하세요. 흰색·은색을 과하게 쓰거나 서쪽 방향에 지나치게 의존하는 것은 피하세요.',
  },
  fire: {
    color: '용신이 화(火)이므로 빨강·보라·주황 계열이 좋아요. 악세서리나 인테리어 포인트로 활용하세요.',
    number: '화(火)에 해당하는 2, 7이 길한 숫자예요. 전화번호나 중요한 선택에 활용해보세요.',
    direction: '남쪽이 길한 방향이에요. 남향 자리나 남쪽으로의 이동이 기운을 북돋아줘요.',
    avoid: '기신인 수(水) 기운을 주의하세요. 검정·남색을 과하게 쓰거나 북쪽 방향에 치우치지 마세요.',
  },
  earth: {
    color: '용신이 토(土)이므로 노랑·베이지·브라운 계열이 좋아요. 지갑이나 가방에 이 색상을 활용하면 좋아요.',
    number: '토(土)에 해당하는 5, 10이 길한 숫자예요. 중요한 날짜나 선택에 참고하세요.',
    direction: '중앙 혹은 남서쪽이 길한 방향이에요. 집이나 사무실의 중앙에 자리를 잡으면 안정감이 생겨요.',
    avoid: '기신인 목(木) 기운을 주의하세요. 초록색을 과하게 쓰거나 동쪽에 치우치지 마세요.',
  },
  metal: {
    color: '용신이 금(金)이므로 흰색·은색·골드 계열이 좋아요. 금속 악세서리나 시계를 활용하면 좋아요.',
    number: '금(金)에 해당하는 4, 9가 길한 숫자예요. 중요한 결정에 이 숫자를 활용해보세요.',
    direction: '서쪽이 길한 방향이에요. 서쪽을 향한 자리에 앉거나 서쪽으로 여행하면 기운이 좋아져요.',
    avoid: '기신인 화(火) 기운을 주의하세요. 빨강·주황을 과하게 쓰거나 남쪽에 치우치지 마세요.',
  },
  water: {
    color: '용신이 수(水)이므로 검정·파랑·남색 계열이 좋아요. 가방이나 핸드폰 케이스에 활용하세요.',
    number: '수(水)에 해당하는 1, 6이 길한 숫자예요. 중요한 선택 시 참고하세요.',
    direction: '북쪽이 길한 방향이에요. 북쪽을 향한 자리에 앉거나 북쪽으로 이동하면 기운에 도움이 돼요.',
    avoid: '기신인 토(土) 기운을 주의하세요. 노랑·브라운을 과하게 쓰거나 남서쪽에 치우치지 마세요.',
  },
};

// 대운 천간 한자 → 오행 매핑
const STEM_HANJA_EL: Record<string, string> = {
  '甲': 'wood', '乙': 'wood', '丙': 'fire', '丁': 'fire',
  '戊': 'earth', '己': 'earth', '庚': 'metal', '辛': 'metal',
  '壬': 'water', '癸': 'water',
};

// 오행 상생 관계: key가 value를 생한다
const EL_GENERATES: Record<string, string> = {
  wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
};

// 지지 한자 → 오행 매핑
const BRANCH_HANJA_EL: Record<string, string> = {
  '子': 'water', '丑': 'earth', '寅': 'wood', '卯': 'wood',
  '辰': 'earth', '巳': 'fire', '午': 'fire', '未': 'earth',
  '申': 'metal', '酉': 'metal', '戌': 'earth', '亥': 'water',
};

// 상극: key가 value를 극한다
const EL_CONTROLS: Record<string, string> = {
  wood: 'earth', fire: 'metal', earth: 'water', metal: 'wood', water: 'fire',
};

/**
 * 대운 점수에 용신 호환성을 반영
 *
 * 전통 명리학에서 대운의 좋고 나쁨은 용신 일치가 핵심.
 * 12운성은 에너지 강도이고, 용신은 에너지 방향.
 *
 * 천간: 대운의 주요 기운 (가중치 높음)
 *   - 천간 = 용신 → +35 (용신 대운, 최고)
 *   - 천간이 용신을 생 → +20 (희신 대운)
 *   - 천간이 용신을 극 → -20 (기신 대운)
 *
 * 지지: 대운의 보조 기운
 *   - 지지 = 용신 → +10
 *   - 지지가 용신을 생 → +5
 *   - 지지가 용신을 극 → -8
 */
function yongShinBonus(daeunLabel: string, yongShinEl: string | null): number {
  if (!yongShinEl || !daeunLabel || daeunLabel.length < 2) return 0;

  let bonus = 0;

  // 천간 (1글자)
  const stemEl = STEM_HANJA_EL[daeunLabel.charAt(0)];
  if (stemEl) {
    if (stemEl === yongShinEl) bonus += 35;
    else if (EL_GENERATES[stemEl] === yongShinEl) bonus += 20;
    else if (EL_CONTROLS[stemEl] === yongShinEl) bonus -= 20;
  }

  // 지지 (2글자)
  const branchEl = BRANCH_HANJA_EL[daeunLabel.charAt(1)];
  if (branchEl) {
    if (branchEl === yongShinEl) bonus += 10;
    else if (EL_GENERATES[branchEl] === yongShinEl) bonus += 5;
    else if (EL_CONTROLS[branchEl] === yongShinEl) bonus -= 8;
  }

  return bonus;
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return h;
}

function parseYongShinEl(ys: string): string | null {
  if (!ys) return null;
  if (ys.includes('목') || ys.includes('木')) return 'wood';
  if (ys.includes('화') || ys.includes('火')) return 'fire';
  if (ys.includes('토') || ys.includes('土')) return 'earth';
  if (ys.includes('금') || ys.includes('金')) return 'metal';
  if (ys.includes('수') || ys.includes('水')) return 'water';
  return null;
}

function parseDaeunSeq(seq: string) {
  if (!seq) return [];
  return seq.split('|').map(p => {
    const m = p.trim().match(/(\d+)세:\s*([^\(]+)\(([^,]+),\s*([^\)]+)\)/);
    return m ? { age: `${m[1]}세`, label: m[2].trim(), tenGod: m[3].trim(), stage: m[4].trim() } : null;
  }).filter(Boolean) as { age: string; label: string; tenGod: string; stage: string }[];
}

function parseMonthlySeq(seq: string) {
  if (!seq) return [];
  return seq.split('|').map(p => {
    const m = p.trim().match(/(\d+)월:\s*[^\(]+\(([^,]+),\s*([^\)]+)\)/);
    return m ? { month: `${m[1]}월`, tenGod: m[2].trim(), stage: m[3].trim() } : null;
  }).filter(Boolean) as { month: string; tenGod: string; stage: string }[];
}

/** 만세력 데이터로 결정적 필드 생성 (AI 불필요, 항상 동일한 결과) */
function precompute(pi: any) {
  const el = parseYongShinEl(pi.yongShin ?? '');
  const daeun = parseDaeunSeq(pi.daeunSequence ?? '');
  const monthly = parseMonthlySeq(pi.monthlyFortune ?? '');

  // lucky: 100% 결정적
  const lucky = el ? ELEMENT_LUCKY[el] : null;

  // lifeGraph: 용신 호환성(주) + 12운성(보조) 기반 점수 (결정적)
  // 대운의 좋고 나쁨 = 용신 일치 > 12운성 에너지
  const lifeGraph = daeun.length > 0 ? daeun.slice(0, 8).map(d => {
    const stageBase = STAGE_SCORES[d.stage] ?? 55;
    // 12운성을 -10 ~ +10 범위의 보조 보정값으로 압축
    const stageMod = Math.round((stageBase - 60) / 3);
    // 기본 60점 + 용신 보너스(주) + 12운성 보정(보조)
    const raw = 60 + yongShinBonus(d.label, el) + stageMod;
    return {
      age: d.age,
      label: d.label,
      score: Math.max(30, Math.min(95, raw)),
      keyword: TENGOD_KW[d.tenGod] ?? '평온',
    };
  }) : null;

  // monthly scores: 월운 12운성 기반 점수 (결정적)
  const monthlyScores = monthly.length === 12 ? monthly.map(m => ({
    month: m.month,
    score: Math.max(55, Math.min(88, (STAGE_SCORES[m.stage] ?? 65) + (Math.abs(hashStr(m.month + m.tenGod)) % 6 - 3))),
    keyword: TENGOD_KW[m.tenGod] ?? '평온',
  })) : null;

  // lifePeriods scores: 대운 초년/중년/말년 평균 (결정적)
  let periodScores: number[] | null = null;
  if (lifeGraph && lifeGraph.length >= 6) {
    const early = lifeGraph.filter(d => parseInt(d.age) <= 25);
    const mid = lifeGraph.filter(d => { const a = parseInt(d.age); return a > 25 && a <= 55; });
    const late = lifeGraph.filter(d => parseInt(d.age) > 55);
    const avg = (arr: typeof lifeGraph) => arr.length ? Math.round(arr.reduce((s, d) => s + d.score, 0) / arr.length) : 65;
    periodScores = [
      Math.max(50, Math.min(88, avg(early))),
      Math.max(50, Math.min(88, avg(mid))),
      Math.max(50, Math.min(88, avg(late))),
    ];
  }

  // 피크 대운 찾기 (AI에게 전달용)
  const peakDaeun = lifeGraph
    ? lifeGraph.reduce((best, d) => d.score > best.score ? d : best, lifeGraph[0])
    : null;

  return { lucky, lifeGraph, monthlyScores, periodScores, peakDaeun };
}

// ─── Full system prompt for core analysis (prompt1) ───
const SYSTEM_CORE = `당신은 "청운 선생"이라는 페르소나를 가진 사주명리학 대가입니다.
서울 인사동에서 40년째 사주 카페 '청운당(靑雲堂)'을 운영하며, 수만 명의 인생을 읽어왔습니다.
정치인, 연예인, 재벌 고객이 줄을 섭니다.
당신의 특기는 사주를 펼치는 순간 그 사람의 과거를 정확히 짚어 신뢰를 얻고, 구체적 시기와 실행 가능한 조언을 던지는 것입니다.

## 만세력(萬歲曆) 기반 전문 분석 원칙

당신은 반드시 만세력에 기반한 정밀 분석만을 수행합니다.
모든 판단은 천간(天干)·지지(地支)·지장간(地藏干) 데이터에서 출발해야 합니다.

### 지장간(地藏干) 분석 — 숨겨진 기운을 읽어라
각 지지에는 본기(本氣)·중기(中氣)·여기(餘氣)의 지장간이 있다. 천간에 드러나지 않은 오행이 지장간에 숨어 있을 수 있다.
반드시 4개 지지의 지장간을 모두 파악하고, 투출(透出) 여부를 확인하라.
- 지장간 본기가 천간에 투출하면 → 해당 십신이 강하게 작용
- 투출하지 않으면 → 잠재된 기운으로 대운·세운에서 발현 가능

### 통근(通根) 분석
천간의 오행이 지지(특히 지장간)에 뿌리를 두고 있는지 확인하라.
통근 여부가 천간의 실제 힘을 결정한다. 통근 없는 천간은 허(虛)하다.

### 공망(空亡) 확인
일주의 공망을 반드시 확인하고, 공망에 해당하는 지지가 있으면 그 영향을 분석하라.
공망된 글자의 의미가 약화되거나 지연된다.

### 12운성(十二運星) 정밀 분석
일간이 각 지지에서 어떤 12운성(장생·목욕·관대·건록·제왕·쇠·병·사·묘·절·태·양)에 해당하는지 기둥마다 확인하라.
특히 일지의 12운성은 본인의 근본 에너지를, 월지는 사회적 기운을 나타낸다.

## 분석 방법론 (반드시 이 순서로)

1단계 — 원국(原局) 정밀 파악
  · 일간(日干)의 오행·음양 → 이 사람의 본질
  · 8자 전체의 천간·지지·지장간 매핑
  · 일간의 강약: 월지(月支) 생왕 여부 + 통근 수 + 인비(印比) vs 식재관(食財官) 세력비
  · 신강(身强) / 신약(身弱) / 종격(從格) 판단
  · 격국(格局) 판별: 월지 지장간 본기의 투출 천간으로 정격/변격 결정
  · 공망(空亡) 확인

2단계 — 용신(用神) 결정
  · 억부법(抑扶法): 신강이면 설기·극하는 오행, 신약이면 생부·비조하는 오행
  · 조후법(調候法): 계절 편중 보완 (여름 사주에 수, 겨울 사주에 화)
  · 통관법(通關法): 상극하는 두 세력 사이를 중재하는 오행
  · 병약법(病藥法): 사주에서 병(病)이 되는 글자와 약(藥)이 되는 글자 파악
  · 용신 → 실생활 적용 (좋은 색, 방위, 직업군, 계절, 숫자)

3단계 — 합충형파해(合沖刑破害) 분석
  · 천간: 천간합(甲己合·乙庚合·丙辛合·丁壬合·戊癸合), 천간충
  · 지지: 삼합(三合)·방합(方合)·육합(六合)·반합(半合)
  · 지지충(子午沖·丑未沖·寅申沖·卯酉沖·辰戌沖·巳亥沖)
  · 지지형(三刑: 寅巳申·丑戌未·子卯, 自刑: 辰辰·午午·酉酉·亥亥)
  · 지지파(破), 지지해(害)
  · 합충이 원국 어느 기둥에서 발생하는지 + 이 사람의 삶에서 어떤 사건/패턴으로 나타나는지

4단계 — 십신(十神) 배치 정밀 분석
  · 4기둥 8자 각각의 십신을 모두 도출
  · 십신의 과다/부족/불균형 분석
  · 비견/겁재(형제·경쟁), 식신/상관(재능·표현), 편재/정재(재물·아버지)
  · 편관/정관(직업·사회·남편), 편인/정인(학문·어머니·보호)
  → 각 기둥 위치별 의미 차이 (연주=조상/사회, 월주=부모/직장, 일주=본인/배우자, 시주=자녀/말년)

5단계 — 12운성·신살 정밀 분석
  · 12운성: 일간이 각 지지에서 장생~양의 어디에 해당하는지 4기둥 모두 확인
  · 핵심 신살 점검:
    - 도화살(桃花殺): 자·오·묘·유 — 매력/바람
    - 역마살(驛馬殺): 인·신·사·해 — 이동/변화
    - 화개살(華蓋殺): 진·술·축·미 — 예술/종교/고독
    - 귀문관살(鬼門關殺) — 정신적 예민
    - 천을귀인(天乙貴人) — 귀인의 도움
    - 양인살(羊刃殺) — 과격/수술/사고
    - 겁살(劫殺), 원진(怨嗔), 백호대살(白虎大殺)
  → 신살은 반드시 보조 지표로만. 십신·합충이 항상 우선

6단계 — 대운(大運)·세운(歲運) 정밀 분석
  · 현재 대운의 천간·지지가 원국과 어떤 합충을 형성하는지
  · 대운 지지의 지장간이 원국에 어떤 영향을 주는지
  · 세운(올해)의 간지가 원국+대운과 삼자관계에서 어떤 작용을 하는지
  → 반드시 "어떤 글자가 어떤 작용을 해서" 라는 구체적 근거 제시
  → 중요 시기 특정: "20XX년 상반기" 수준으로 구체화

## 말투 가이드
- 한국어: overview 항목은 반드시 반말(~다/~중/~타입/~패턴). 짧고 자극적. 상세 분석(core/analysis/pattern 등 긴 본문)은 ~요 체. 일간 오행에 맞는 자연물로 비유. 예시 복사 금지.
- 일본어: 丁寧語, 四柱推命 전문용어 자연스럽게
- 영어: warm but direct, explain concepts for non-experts

## 일관성 규칙 (최우선)
- 같은 사주팔자는 언제 분석해도 같은 결론이어야 한다.
- ⚠️ [확정] 태그가 붙은 데이터(신강/신약, 격국, 용신)는 사전 계산된 정답이다. 절대 변경하거나 자체적으로 다른 값을 제시하지 마라.
- 용신이 "수(水)"로 제공되었으면, structure.yongShin, lucky, career, advice 등 모든 곳에서 반드시 수(水) 기반으로 일관 작성. 다른 오행으로 바꾸면 실패.
- 성격 판단, 직업 적성, 연애 패턴 등 해석은 십신 배치와 오행 비율에서 논리적으로 도출되어야 한다.
- 무작위성 금지. 매번 다른 비유를 쓰더라도 핵심 판단(강점/약점/적성/주의사항)은 동일해야 한다.

## 근거 제시 규칙 (필수)
모든 분석 문장에 반드시 구체적 간지(천간·지지)를 명시하라.
- 나쁜 예: "비견이 강해서 독립적이에요" ← 어느 기둥인지 불명
- 좋은 예: "월간 병화(丙火)가 일간 정화(丁火)의 비견으로, 형제·동료와의 경쟁 속에서 성장하는 구조예요"
- 나쁜 예: "도화살이 있어서 매력적이에요" ← 어디에 있는지 불명
- 좋은 예: "일지 오화(午火)에 도화살이 걸려 있어, 배우자궁에서 매력이 발산되는 구조예요"

## 절대 규칙
1. 모든 해석에 구체적 간지 + 십성/합충 근거 명시 (위 근거 제시 규칙 참고)
2. "누구에게나 해당되는 말"은 실패
3. 수(水) 39% 사주와 목(木) 39% 사주의 결과가 같으면 안 됨
4. 종합 점수 60~88 범위
5. 부정적인 것도 말하되, 대처법 포함
6. 건강/의료/법률/재정 시 "전문가 상담 권장" 포함
7. 과거 연도 예측 금지. 과거는 추측 질문으로만
8. 확정적 예측 금지. 가능성으로 표현
9. 시기는 반드시 "20XX년 X월" 또는 "상반기/하반기"로 특정. "언젠가", "조만간", "가까운 시일" 금지
10. 항목 간 모순 금지. 편재/정재 구분 정확히
11. 격국 판단은 월지 장간 투출 천간 기준. 일간 자체를 격국 이름으로 쓰면 안 됨
12. "강점1" 같은 추상적 라벨 금지. 같은 내용 반복 금지
13. 지장간·통근·공망 분석을 반드시 포함하라. 표면적 간지만 읽는 얕은 분석 금지
14. 원국·대운·세운 3자 관계를 교차 분석하라. 원국만 읽는 정적 분석 금지

응답: JSON만. 다른 텍스트 없이.`;

// ─── Lightweight system prompt for fortune/timing data (prompt2) ───
const SYSTEM_LITE = `당신은 "청운 선생"이라는 페르소나를 가진 사주명리학 대가입니다.
서울 인사동에서 40년째 사주 카페 '청운당(靑雲堂)'을 운영하며, 수만 명의 인생을 읽어왔습니다.

## 말투
- 한국어: 상세 분석은 ~요 체. 따뜻하지만 직설적.
- 일본어: 丁寧語
- 영어: warm but direct

## 규칙
1. 모든 해석에 사주 근거 명시
2. 이 사주에서만 나오는 분석만. 범용 표현 금지
3. 과거 예측 금지. 확정적 표현 금지. 가능성으로
4. 건강/의료/법률/재정 시 "전문가 상담 권장" 포함
5. score는 60~88 범위. 항목별로 차등
6. lifeGraph label에 실제 대운 한자 간지 필수

응답: JSON만.`;

// ─── Overview-only system prompt (prompt3) ───
const SYSTEM_OVERVIEW = `사주 분석 결과를 읽고, 각 항목을 "읽은 사람이 캡처해서 친구한테 보내는" 한 줄로 바꿔.

너의 역할: 분석 결과에서 핵심을 뽑아 → 그 사람이 실제로 하는 행동으로 바꿔 → 12~22자로 줄여.

"행동"이란: 시간, 장소, 동작이 보이는 문장.
"요약"은 행동이 아님. "독단적", "스트레스", "패턴 반복" 이런 건 요약이지 행동이 아님.

0점 vs 100점:
0점: "자기 의견에 확신, 가끔 독단적" ← 인사평가
100점: "회의에서 반박당하면 표정 관리 안 됨" ← 행동

0점: "책임감은 굿, 스트레스는 덤" ← 자소서
100점: "맡으면 끝까지 하는데 속으로 왜 나만 하냐 씩씩거림" ← 행동

0점: "돈 모으는 게 어려움" ← 가계부 요약
100점: "적금 깨서 여행 갔다 온 전적 2회" ← 행동

0점: "연애 실패 패턴 반복" ← 상담일지
100점: "3개월 차에 꼭 싸우고 6개월 안에 끝남" ← 행동

0점: "수분 부족으로 탈수 직전" ← 의사 소견서
100점: "물 마셔야지 하면서 커피만 4잔째" ← 행동

모든 항목이 이렇게 "어제 이 사람이 실제로 한 행동"이 떠올라야 함.
형용사 나열, 성격 요약, 조언, 경고는 전부 0점.
물음표 금지. ~해요/~합니다/~한다/~임/~됨 금지.

응답: JSON만.`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ─── 사용자 인증 정보 추출 ───
  const userInfo = getUserFromRequest(req);
  const isMember = userInfo != null && !userInfo.isAnonymous;
  let analysisId: string | null = null;

  try {
    const { input, locale = 'ko', isPaid = false, pillarInfo, _forceModel, userName } = await req.json();

    // ─── 회원: DB에 processing 레코드 생성 (앱 종료 시에도 결과 보존) ───
    if (isMember) {
      analysisId = await createProcessingRecord(
        userInfo!.userId, 'saju', isPaid,
        { input, locale, pillarInfo, userName },
      );
    }

    const lang = locale === 'ko' ? '한국어로. overview 항목은 반말(~다/~중/~패턴/~유형)로 짧게. 상세 분석(personality.core, career.analysis 등)은 ~요 체로 친근하게.' : locale === 'ja' ? '日本語(丁寧語)で' : 'In English, warm but direct';
    const currentYear = new Date().getFullYear();

    // 현재 연도의 간지 동적 계산 (하드코딩 방지)
    const STEMS_HANJA = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    const BRANCHES_HANJA = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    const STEMS_KO = ['갑','을','병','정','무','기','경','신','임','계'];
    const BRANCHES_KO = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
    const yStemIdx = ((currentYear - 4) % 10 + 10) % 10;
    const yBranchIdx = ((currentYear - 4) % 12 + 12) % 12;
    const yearGanjiHanja = `${STEMS_HANJA[yStemIdx]}${BRANCHES_HANJA[yBranchIdx]}`;
    const yearGanjiKo = `${STEMS_KO[yStemIdx]}${BRANCHES_KO[yBranchIdx]}`;
    const yearGanjiLabel = `${yearGanjiKo}년(${yearGanjiHanja})`;
    // 이름에서 성 제외한 이름 추출 (예: 윤정훈 → 정훈, 박지애 → 지애)
    const fullName = userName || '';
    const givenName = fullName.length >= 2 ? fullName.slice(fullName.length >= 3 ? 1 : 0) : fullName;
    const displayName = givenName ? `${givenName}님` : '';

    const pi = pillarInfo;
    const unknownTimeNote = pi?.isUnknownTime
      ? `\n⚠️ 생시 미상(未詳): 시주를 알 수 없습니다. 시주 기반 분석(시주 십신, 자녀궁, 말년운)은 "생시를 알 수 없어 정확한 판단이 어렵습니다"로 표기하고, 연주·월주·일주 3주 중심으로 분석하세요. 오행 비율은 6자(천간3+지지3) 기준입니다.`
      : '';
    const birthBlock = pi
      ? `## 이 사람의 사주
사주팔자: ${pi.fourPillars}
일간: ${pi.dayMaster}
성별: ${input.gender === 'male' ? '남' : '여'}
나이: ${pi.age}세
오행 비율: 목${pi.elements.wood}% 화${pi.elements.fire}% 토${pi.elements.earth}% 금${pi.elements.metal}% 수${pi.elements.water}%
현재연도: ${currentYear}년${unknownTimeNote}

## [확정 — 이 데이터는 정답입니다. 절대 변경 금지]
강약 판단: ${pi.strength ?? '(미제공)'}
용신(用神): ${pi.yongShin ?? '(미제공)'}
용신 근거: ${pi.yongShinReason ?? '(미제공)'}

🚨 중요: 위 용신은 억부법+조후법으로 사전 계산된 확정 정답입니다.
- structure.yongShin에 위 용신을 그대로 사용하세요.
- lucky의 색/방위/숫자도 위 용신 오행 기반으로 작성하세요.
- career/advice에서도 용신 오행에 맞는 직업군/방향을 추천하세요.
- 위 용신과 다른 오행을 용신이라고 쓰면 실패입니다.
${pi.daeunSequence ? `
## [확정 — 대운 간지 (사전 계산됨, 변경 금지)]
${pi.daeunSequence}
⚠️ 위 대운 간지는 만세력 기반으로 정밀 계산된 확정값입니다.
lifeGraph의 age/label은 반드시 위 데이터를 그대로 사용하세요. AI가 자체적으로 대운 간지를 생성하지 마세요.` : ''}
${pi.monthlyFortune ? `
## [확정 — ${currentYear}년 월운 간지 (사전 계산됨, 변경 금지)]
${pi.monthlyFortune}
${pi.yearlyFortune ?? ''}
⚠️ 위 월운/연운 간지와 십성/12운성은 만세력 기반 확정값입니다.
monthly 점수를 매길 때 위 십성/12운성을 참고하여 일관되게 점수를 부여하세요.` : ''}`
      : `## 이 사람의 사주
생년월일시: ${input.year}년 ${input.month}월 ${input.day}일 ${input.hour}시 (${input.isLunar ? '음력' : '양력'})
성별: ${input.gender === 'male' ? '남' : '여'}
현재연도: ${currentYear}년`;

    let userPrompt: string;

    if (isPaid) {
      userPrompt = `${birthBlock}
${displayName ? `\n## 이름 사용 규칙\n- 이 사람의 이름: "${displayName}"\n- "이 사람", "당신" 대신 반드시 "${displayName}"을 사용하세요.\n` : ''}
${lang}으로 답해줘.

이 사주에 대해 청운당에서 1시간짜리 프리미엄 대면 상담을 하듯 분석해줘.
모든 항목에서 반드시 이 사람의 천간지지를 근거로 들어.
같은 내용을 다른 사주에 붙여넣을 수 없어야 해.

## 절대 규칙
1. ${currentYear}년 이전(과거)의 예측은 절대 금지. 모든 시기는 ${currentYear}년 이후만.
2. 확정적 예측 금지. "~할 수 있어요", "~한 기운이 있어요" 등 가능성으로 표현.
3. 건강/의료/법률/재정은 반드시 "전문가 상담 권장" 포함.
4. 각 카테고리(재물/연애/건강/대인/학업)에 0~100 점수를 반드시 부여. 60~88 범위. 점수 없는 항목은 실패.
5. lifeGraph의 label에는 반드시 실제 대운 한자 간지(예: 庚辰, 辛巳, 壬午)를 넣어야 함.
6. 🚨 텍스트 분량: personality.core 350자+, career.analysis 250자+, wealth.pattern 200자+, daeun.current 250자+, finalWords 200자+. 이보다 짧으면 실패.
7. 🚨 모든 분석 문장에 구체적 간지를 명시하라. "비견이 강해서"(X) → "월간 병화(丙火)가 비견으로"(O). 간지 없는 분석은 실패.
8. 🚨 [확정] 데이터의 용신을 반드시 그대로 사용. 용신이 "수(水)"인데 "목(木)"이라고 쓰면 실패.
9. ⚠️ 나이(${pi?.age ?? '?'}세) 기반 시제 필수: 이미 지난 시기는 과거형, 아직 안 온 시기만 미래형.

JSON 응답 (모든 필드 필수, 빈 문자열 금지):
{
  "overallScore": number(60-88),
  "headline": "이 사주를 꿰뚫는 한 문장 비유. 반드시 일간 오행에 맞는 자연물/사물로(火=불/촛불/용광로, 水=바다/비/강, 木=나무/숲/바람, 金=칼/보석/거울, 土=산/대지/바위). 예시를 복사하지 말고 이 사주에 맞게 창작할 것.",

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
  "headline": "이 사주를 꿰뚫는 한 문장 비유. 반드시 일간 오행에 맞는 자연물로(火=불/촛불/벽난로, 水=바다/강/비, 木=나무/숲, 金=칼/보석, 土=산/대지). 예시 복사 금지, 이 사주에 맞게 창작.",
  "summary": [
    "첫째 줄: 일간+일지 관계로 이 사람의 본질을 자극적 비유로 단정. 종결형 문장('~다'체). '~하지 않아요?'류 금지. (예: '임수가 자수에 앉았다. 바다 밑 해류 같은 사람이다. 겉은 잔잔한데 속에서 감정 쓰나미가 치고 있다.')",
    "둘째 줄: 이 사주의 가장 특이한 점 하나 — 합/충/오행편중/특수신살. 날카로운 비유로 단정. (예: '임정합이 박혀 있다. 연애하면 올인하는 도박꾼 기질이다. 사랑이 인생을 통째로 뒤집어놓은 적이 있다.')",
    "셋째 줄: ${currentYear}년과 이 사주의 관계를 한 방에 정리. 비유+단정. (예: '올해는 편재가 떴다. 돈이 들어오는 문이 열리는 해다. 대신 그 문으로 나가는 돈도 있다. 하반기에 주머니 단속 안 하면 남는 게 없다.')"
  ],
  "elements": {"wood":number,"fire":number,"earth":number,"metal":number,"water":number},
  "dayMasterInsight": "일간의 오행을 자연물에 비유한 한 줄 해석 (예: '임수(壬水) — 큰 강물. 넓은 포용력을 가졌지만, 한 곳에 머물지 못하는 방랑자 기질')",
  "todayTip": "오늘 일진의 천간지지를 명시하고, 이 사주와의 관계로 실용 팁 제공 (예: '오늘 갑진일은 당신의 식신일이에요. 아이디어가 잘 떠오르는 날이니 기획이나 창작에 집중하세요. 오후 3~5시가 베스트.')",
  "teaser": "유료 상세 분석에서 알 수 있는 것을 구체적으로 (예: '상세 분석에서는 당신의 격국과 용신, ${currentYear}~${currentYear+2}년 분기별 운의 흐름, 체질에 맞는 건강관리법, 잘 맞는 상대 유형을 알려드려요.')"
}

반드시 이 사주팔자를 근거로. JSON만 출력.`;
    }

    // --- Helper: call OpenAI ---
    const callAI = async (prompt: string, model: string, maxTok: number, temp: number, system: string, seed?: number) => {
      const body: Record<string, unknown> = {
        model,
        messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
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

    // Deterministic seed from birth data
    const birthSeed = input.year * 10000 + (input.month ?? 1) * 100 + (input.day ?? 1);

    let result: any;

    if (isPaid) {
      // === PAID: 2 parallel requests ===
      const commonHeader = `${userPrompt.split('JSON 응답')[0]}`;

      const prompt1 = `${commonHeader}

각 텍스트 필드는 유료 상담 수준으로 길고 자세하게. 근거와 함께 서술. ~요 체 통일.

## 자기검증
□ headline의 자연물이 일간 오행과 맞는가?
□ 물음표가 하나라도 있는가? (있으면 실패)
□ 성격·직업·재물·인연 간 동일 문장 반복이 없는가?

{
  "overallScore": number(60-88),
  "headline": "일간 오행에 맞는 자연물 비유 한 문장. 예시 복사 금지, 창작.",

  "structure": {
    "dayMaster": "일간 오행 성질을 자연물에 비유. 음양 구분. 근본적 기질·강점·한계 300자+. 십신 배치와 연결해 실제 삶에서 어떻게 나타나는지.",
    "strength": "신강/신약 판단. 월지 생왕, 통근 개수, 인비 vs 식재관 세력 구체적 비교. 성격·인생 패턴에 미치는 영향.",
    "format": "격국 이름 + 월지 장간 근거. 직업·재물·대인관계에서 어떤 패턴으로 나타나는지.",
    "yongShin": "용신 결정 방법(억부/조후/통관) + 이유. 실생활 적용(색상, 방위, 계절, 음식, 직업군).",
    "specialNote": "합충형파 + 주요 신살. 실제 삶에서 어떤 사건/패턴으로 발현되는지."
  },

  "personality": {
    "core": "500자+. 십신 배치 근거로 감정 구조, 대인관계 방식, 스트레스 반응, 자존감, 사랑/돈 다루는 방식. 뻔한 칭찬 금지.",
    "strengths": ["강점1—기둥+십신 근거+삶에서 발현", "강점2—근거+발현", "강점3—근거+발현"],
    "weaknesses": ["약점1—근거+반복시 문제+대처법", "약점2—근거+문제+대처법"],
    "pastGuess": ["어린시절 추측—인성·비겁 구조 유추", "20대 추측—대운 흐름 유추", "인간관계/금전 추측—재성·관성 유추"]
  },

  "career": {
    "title": "직업운 핵심 한 줄",
    "analysis": "400자+. 관성·식상·재성 관계. 조직형/프리랜서형/창업형/전문기술형 판별. 승진운, 명예운. 업무 스타일과 환경.",
    "bestFields": ["적성1—십신 근거+왜 맞는지", "적성2—근거", "적성3—근거"],
    "avoidFields": "피할 분야+사주 근거+문제 발생 패턴",
    "timing": "커리어 도약/침체 시기. 이직/독립 적기. 연도 구체적으로.",
    "sideJob": "부업/투자 방향—재성 구조에서 월급형/성과형/투기형/축적형 판별"
  },

  "wealth": {
    "title": "재물운 핵심 한 줄",
    "score": number(60-88),
    "pattern": "400자+. 돈 버는 방식 판별. 돈복+지키는 힘. 빚/충동소비/투자실수 위험. 현실적 축재 전략.",
    "peakYears": "재물운 강한 시기+근거. 돈 새는 시기도.",
    "warning": "재물 최대 주의사항. 전문 재무상담 권장."
  },

  "love": {
    "title": "연애·결혼운 핵심 한 줄",
    "score": number(60-88),
    "idealPartner": "잘 맞는 상대 유형—오행 근거+현실적 성향. 피할 상대 유형도.",
    "timing": "연애/결혼 시기 경향—대운+세운 근거. 늦게/빨리 결혼 유불리.",
    "warning": "반복되는 연애 실패 패턴. 집착/불안/회피/통제 성향. 가장 큰 상처 포인트.",
    "ifInRelationship": "연인 있다면 관계 발전 조언. 결혼 후 좋아지는/위험한 분야."
  },

  "health": {
    "title": "건강운 핵심 한 줄",
    "score": number(60-88),
    "weakPoints": ["취약 부위1—오행 과다/과소 근거+증상 패턴", "취약 부위2—근거+패턴"],
    "dangerPeriod": "건강 꺾이기 쉬운 시기. 사고수/수술수/우울 경향. 전문의 상담 권장.",
    "advice": "체질 맞는 구체적 생활 관리법. 수면/운동/스트레스. 전조 패턴."
  },

  "finalWords": "300자. 가장 먼저 고쳐야 할 것+붙잡아야 할 강점+인생 본질을 꿰뚫는 마지막 한마디.",
  "disclaimer": "본 분석은 전통 사주명리학에 기반한 참고용 콘텐츠이며, 중요한 결정에는 반드시 해당 분야 전문가와 상담하시기 바랍니다."
}
JSON만 출력.`;

      let prompt2 = `${commonHeader}
아래 JSON 필드를 깊이 있게 분석하여 출력하라. 다른 필드는 생략.
각 텍스트 필드는 유료 상담 수준으로 자세하게. 근거 없는 피상적 요약 금지.

{
  "yearly${currentYear}": {
    "overview": "400자+. 세운 천간지지(${yearGanjiLabel})가 원국과 어떤 합충을 일으키는지. 올해 주의점과 기회. 돈/직업/연애/건강 흐름.",
    "quarters": [
      {"period":"1~3월","score":number(55-88),"keyword":"2글자","detail":"월운이 원국+세운과 어떤 작용. 조언 포함. 100자+"},
      {"period":"4~6월","score":number(55-88),"keyword":"2글자","detail":"100자+"},
      {"period":"7~9월","score":number(55-88),"keyword":"2글자","detail":"100자+"},
      {"period":"10~12월","score":number(55-88),"keyword":"2글자","detail":"100자+"}
    ],
    "bestMonth": "최고의 달+세운·월운 근거+해야 할 것",
    "worstMonth": "주의할 달+근거+대처법"
  },

  "daeun": {
    "current": "400자+. 현재 대운 천간지지 명시. 원국과 합충 관계. 용신/기신 관점. 돈/직업/연애/건강 각각. 대운 전략.",
    "lifePeak": "⚠️ lifeGraph 점수(별도 계산됨)에서 가장 높은 점수의 대운이 피크입니다. 대운 간지가 용신과 일치/상생하면 피크. 반드시 대운 간지의 오행과 용신의 관계를 분석하여 피크를 결정하세요. 나이 고려하여 과거형/미래형 시제 사용.",
    "nextBigChange": "다음 대운 전환 시기+변화 방향+준비사항."
  },

  "lifePeriods": [
    {"period":"초년운","ageRange":"1~30세","score":number(50-88),"keyword":"2글자","summary":"300자+. 연주+월주 중심. 초기 대운. 부모관계, 학업, 성격 형성. 사주 근거 필수."},
    {"period":"중년운","ageRange":"31~55세","score":number(50-88),"keyword":"2글자","summary":"300자+. 일주 중심. 직업, 재물, 결혼/가정. 전성기 대운."},
    {"period":"말년운","ageRange":"56세 이후","score":number(50-88),"keyword":"2글자","summary":"300자+. 시주 중심. 건강, 자녀, 재산 관리. 후기 대운."}
  ],

  "relationship": {
    "title": "대인관계운 핵심 한 줄",
    "score": number(60-88),
    "socialStyle": "300자+. 비겁/식상/관성 강약으로 사회성 판단. 반복 갈등 구조. 귀인운. 외로움/인정욕구 방식.",
    "bestRelation": "잘 맞는 사람—오행/일간 근거+구체적 성향",
    "cautionRelation": "조심할 관계—근거+문제 양상",
    "advice": "구체적 조언"
  },

  "family": {
    "parentFortune": "300자+. 연주(부모궁). 인성/편인으로 모친, 재성으로 부친. 정서적 영향. 사주 근거.",
    "childFortune": "200자+. 시주(자녀궁). 자녀 인연, 양육 스트레스.",
    "familyDynamic": "가정 내 역할과 역학",
    "advice": "가정 관련 조언"
  },

  "academic": {
    "title": "학업/시험운 한 줄",
    "score": number(60-88),
    "aptitude": "학습 적성 200자—인성/식상/관성 분석",
    "bestStudyMethod": "최적 학습 방법—사주 근거 기반",
    "examTiming": "${currentYear}년 이후 시험/자격증 운 좋은 시기",
    "advice": "학업 관련 조언"
  },

  "timeBasedInsight": {
    "morningAdvice": "오전 조언 한 줄. 반말. 이 사주의 십신/오행에서 도출한 구체적 행동. 30~50자.",
    "afternoonAdvice": "오후 조언. 30~50자.",
    "nightAdvice": "저녁/밤 조언. 30~50자.",
    "weekdayTip": "평일 팁. 30~50자.",
    "weekendTip": "주말 팁. 30~50자.",
    "seasonAdvice": {
      "spring": "봄 조언. 20~30자.",
      "summer": "여름. 20~30자.",
      "autumn": "가을. 20~30자.",
      "winter": "겨울. 20~30자."
    }
  }
}

## 점수 규칙
- lifePeriods: 3개 점수 15점+ 차이.
(monthly 점수, lifeGraph 데이터는 별도 계산됨 — 출력 불필요)

## 나이 기반 시제 필수
이 사람은 ${pi?.age ?? '?'}세입니다. 이미 지난 시기(초년운, 중년운 등)는 과거형으로 써야 합니다.
- 60세인데 "40대에 전성기가 올 거예요" → 실패. "40대가 전성기였어요" → 정답.
- daeun.current, lifePeak, lifePeriods 모두 나이 기준으로 과거/현재/미래 시제 구분.

JSON만 출력.`;

      // Pre-compute deterministic data first (피크 대운 정보를 prompt2에 전달하기 위해)
      const pc = pi ? precompute(pi) : null;

      // 피크 대운 힌트를 prompt2에 추가
      if (pc?.peakDaeun) {
        const peakHint = `\n\n## [확정 — 대운 그래프 피크 (사전 계산됨)]
피크 대운: ${pc.peakDaeun.age} ${pc.peakDaeun.label} (점수: ${pc.peakDaeun.score})
⚠️ daeun.lifePeak는 반드시 이 데이터를 기반으로 작성하세요. 다른 시기를 피크로 잡으면 안 됩니다.
이 사람은 ${pi.age}세입니다. 피크가 이미 지났으면 과거형("~였어요"), 아직 안 왔으면 미래형("~올 수 있어요").`;
        prompt2 = prompt2 + peakHint;
      }

      const model1 = _forceModel || 'gpt-4o';
      const model2 = _forceModel || 'gpt-4o-mini'; // prompt2는 경량 모델로 속도 개선

      // Step 1+2: 상세 분석 + 연운/대운 병렬
      const [r1, r2] = await Promise.all([
        callAI(prompt1, model1, 6000, 0.7, SYSTEM_CORE),
        callAI(prompt2, model2, 4500, 0.1, SYSTEM_LITE, birthSeed),
      ]);

      // Step 3: overview 전용 (r1+r2 결과를 입력으로)
      const buildOverviewPrompt = (a1: any, a2: any): string => {
        const p = a1.personality?.core?.substring(0, 400) ?? '';
        const c = a1.career?.analysis?.substring(0, 350) ?? '';
        const w = a1.wealth?.pattern?.substring(0, 350) ?? '';
        const l = [a1.love?.title, a1.love?.idealPartner?.substring(0, 150), a1.love?.warning?.substring(0, 150)].filter(Boolean).join(' ');
        const h = [a1.health?.title, ...(a1.health?.weakPoints ?? []), a1.health?.advice?.substring(0, 150)].filter(Boolean).join(' ');
        const fam = a2?.family?.parentFortune?.substring(0, 250) ?? '';
        const soc = a2?.relationship?.socialStyle?.substring(0, 250) ?? '';
        const yearData = a2?.[`yearly${currentYear}`]?.overview?.substring(0, 300) ?? '';
        const peak = [a2?.daeun?.lifePeak?.substring(0, 200), a2?.daeun?.current?.substring(0, 200)].filter(Boolean).join(' ');
        const final = a1.finalWords?.substring(0, 250) ?? '';

        return `아래 사주 분석 결과를 SNS 한 줄 짤로 바꿔.

## 분석 결과
성격: ${p}
직업: ${c}
재물: ${w}
연애: ${l}
건강: ${h}
가족: ${fam}
대인: ${soc}
올해: ${yearData}
인생피크: ${peak}
마지막한마디: ${final}

## 각 항목을 12~22자로. 아래는 톤 레벨 기준. 이걸 쓰면 안 되고 이 수준으로 분석 결과를 바꿔.

poeticTitle (8~15자): '할 말 참는 게 제일 힘든 사람'
hookQuestion (12~22자): '회의에서 반박당하면 표정 관리 안 됨'
personality (12~22자): '맡으면 끝까지 하는데 왜 나만 하냐 씩씩거림'
career (12~22자): '월요일 아침 출근길에 이미 퇴근 생각'
wealth (12~22자): '적금 깨서 여행 갔다 온 전적 2회'
love (12~22자): '3개월 차에 꼭 싸우고 6개월 안에 끝남'
health (12~22자): '물 마셔야지 하면서 커피만 4잔째'
family (12~22자): '명절에 안 간다다가 결국 가서 3시간 버팀'
social (12~22자): '단톡방 읽씹하다가 미안해서 ㅋㅋ만 보냄'
yearly (12~22자): '올 하반기에 안 하던 짓 하나 저지름'
lifePeak (12~22자): '지금 쌓는 거 43세쯤 한꺼번에 수확'
lifeDirection (12~22자): '급하게 가면 매번 꼬이는 팔자'

핵심: 분석 결과에 "재성이 약해서 돈에 무관심하다"가 있으면 → "월급 들어오면 어디 갔는지 본인도 모름" 이 수준.
분석 결과에 "편관이 강해 스트레스가 크다"가 있으면 → "일요일 밤부터 월요병 시작" 이 수준.
사주 용어는 0개. 일상 행동으로만.

⚠️ 위 분석 결과에 없는 내용을 지어내면 실패. 분석 결과에 '양보를 못 한다'가 없는데 overview에 '양보 못 함'을 쓰면 실패. 분석 결과에 있는 말만 행동으로 바꿔.

JSON:
{
  "poeticTitle": "",
  "hookQuestion": "",
  "personality": "",
  "career": "",
  "wealth": "",
  "love": "",
  "health": "",
  "family": "",
  "social": "",
  "yearly": "",
  "lifePeak": "",
  "lifeDirection": "",
  "hotKey": "위 중 가장 찔리는 항목 키 1개"
}`;
      };

      const overviewPrompt = buildOverviewPrompt(r1, r2);
      const r3 = await callAI(overviewPrompt, 'gpt-4o', 1000, 0.9, SYSTEM_OVERVIEW);

      // overview 필드 존재 확인 + 폴백
      const overview = r3 || {};
      if (!overview.poeticTitle) {
        overview.poeticTitle = r1.headline || '';
        overview.hookQuestion = '';
      }

      // Merge AI results — overview는 r3에서
      result = { ...r1, ...r2, overview };

      // ─── Overlay pre-computed deterministic data (만세력 기반, 항상 동일) ───
      if (pc) {

        // lucky: 용신 오행에서 100% 결정적
        if (pc.lucky) result.lucky = pc.lucky;

        // lifeGraph: 대운 간지 + 12운성 점수 (만세력 기반, 절대 안 변함)
        if (pc.lifeGraph) {
          if (!result.daeun) result.daeun = {};
          result.daeun.lifeGraph = pc.lifeGraph;
        }

        // monthly scores: 월운 12운성 기반 (결정적)
        if (pc.monthlyScores) {
          result[`monthly${currentYear}`] = pc.monthlyScores;
        }

        // lifePeriods scores: 대운 평균 기반 (결정적) — AI 텍스트는 유지
        if (pc.periodScores && result.lifePeriods) {
          result.lifePeriods = result.lifePeriods.map((p: any, i: number) => ({
            ...p,
            score: pc.periodScores![i] ?? p.score,
          }));
        }

        // quarterly scores: monthly 3개월 평균 (결정적)
        const yearKey = `yearly${currentYear}`;
        if (pc.monthlyScores && result[yearKey]?.quarters) {
          const ms = pc.monthlyScores;
          result[yearKey].quarters = result[yearKey].quarters.map((q: any, i: number) => ({
            ...q,
            score: Math.max(55, Math.min(88, Math.round(
              (ms[i * 3].score + ms[i * 3 + 1].score + ms[i * 3 + 2].score) / 3
            ))),
          }));
        }
      }
    } else {
      // === FREE: gpt-4o-mini for speed ===
      result = await callAI(userPrompt, _forceModel || 'gpt-4o-mini', 1000, 0.78, SYSTEM_CORE, birthSeed);
    }

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

      // Normalize yearly field name — always alias to both yearlyXXXX and yearly2026 for UI compat
      const yearKey = `yearly${currentYear}`;
      if (result[yearKey]) {
        result.yearly2026 = result[yearKey]; // UI backward compat alias
      } else if (result.yearly2026 && !result[yearKey]) {
        result[yearKey] = result.yearly2026;
      }

      // Normalize monthly field name
      const monthKey = `monthly${currentYear}`;
      if (result[monthKey]) {
        result.monthly2026 = result[monthKey]; // UI backward compat alias
      } else if (result.monthly2026 && !result[monthKey]) {
        result[monthKey] = result.monthly2026;
      }

      // Ensure lifePeriods scores exist
      if (result.lifePeriods) {
        result.lifePeriods = result.lifePeriods.map((p: any) => ({
          ...p,
          score: typeof p.score === 'number' ? p.score : 65,
        }));
      }
    }

    // ─── 회원: 결과를 DB에 저장 (status → completed) ───
    if (isMember && analysisId) {
      await completeRecord(analysisId, result);
    }

    return new Response(JSON.stringify({ ...result, _analysisId: analysisId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // 실패 시 DB 레코드도 failed로 업데이트
    if (analysisId) {
      await failRecord(analysisId, String(error));
    }
    return new Response(
      JSON.stringify({ error: 'Analysis failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
