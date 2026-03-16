export interface SajuInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  isLunar: boolean;
  gender: 'male' | 'female';
}

export interface FourPillars {
  year: { stem: string; branch: string; element: string };
  month: { stem: string; branch: string; element: string };
  day: { stem: string; branch: string; element: string };
  hour: { stem: string; branch: string; element: string };
}

export interface ElementBalance {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

// --- Paid sub-types (new schema v2) ---

export interface SajuStructure {
  dayMaster: string;
  strength: string;
  format: string;
  yongShin: string;
  specialNote: string;
}

export interface SajuPersonality {
  core: string;
  strengths: string[];
  weaknesses: string[];
  pastGuess: string[];
}

export interface SajuCareer {
  title: string;
  analysis: string;
  bestFields: string[];
  avoidFields: string;
  timing: string;
  sideJob: string;
}

export interface SajuWealth {
  title: string;
  score: number;
  pattern: string;
  peakYears: string;
  warning: string;
}

export interface SajuLove {
  title: string;
  score: number;
  idealPartner: string;
  timing: string;
  warning: string;
  ifInRelationship: string;
}

export interface SajuHealth {
  title: string;
  score: number;
  weakPoints: string[];
  dangerPeriod: string;
  advice: string;
}

export interface SajuQuarter {
  period: string;
  score: number;
  keyword: string;
  detail: string;
}

export interface SajuYearly {
  overview: string;
  quarters: SajuQuarter[];
  bestMonth: string;
  worstMonth: string;
}

export interface LifeGraphPoint {
  age: string;
  label: string;
  score: number;
  keyword: string;
}

export interface SajuDaeun {
  current: string;
  lifePeak: string;
  nextBigChange: string;
  lifeGraph?: LifeGraphPoint[];
}

export interface SajuLucky {
  color: string;
  number: string;
  direction: string;
  avoid: string;
}

// --- 초년운/중년운/말년운 ---
export interface SajuLifePeriod {
  period: string;       // "초년운", "중년운", "말년운"
  ageRange: string;     // "1~30세"
  score: number;        // 0~100
  keyword: string;      // "성장과 시련"
  summary: string;      // 요약 설명
}

// --- 대인관계운 ---
export interface SajuRelationship {
  title: string;
  score: number;
  socialStyle: string;        // 대인관계 스타일
  bestRelation: string;       // 잘 맞는 사람 유형
  cautionRelation: string;    // 조심할 관계
  advice: string;             // 관계 조언
}

// --- 부모/자식운 ---
export interface SajuFamily {
  parentFortune: string;      // 부모운
  childFortune: string;       // 자녀운
  familyDynamic: string;      // 가족 관계 역학
  advice: string;             // 가정 조언
}

// --- 월별 운세 ---
export interface SajuMonthlyScore {
  month: string;      // "1월"
  score: number;       // 0~100
  keyword: string;     // "시작"
}

// --- 학업/시험운 ---
export interface SajuAcademic {
  title: string;
  score: number;
  aptitude: string;           // 학습 적성
  bestStudyMethod: string;    // 최적 학습법
  examTiming: string;         // 시험운 좋은 시기
  advice: string;
}

// --- Overview (990사주 스타일 한 줄 캐치프레이즈) ---
export interface SajuOverview {
  poeticTitle: string;    // "호수 위에 뜬 태양, 병자일주"
  hookQuestion: string;   // "말 한마디로 천 냥 빛 대신 원수를 갚나요?"
  personality: string;    // 성격 한 줄
  career: string;         // 직업운 한 줄
  wealth: string;         // 재물운 한 줄
  love: string;           // 연애운 한 줄
  health: string;         // 건강운 한 줄
  family: string;         // 가족 한 줄
  social: string;         // 인간관계 한 줄
  yearly: string;         // 올해운세 한 줄
  lifePeak: string;       // 인생피크 한 줄
  lifeDirection: string;  // 인생방향 한 줄
}

// --- SajuResult (free + paid union) ---

export interface SajuResult {
  // Client-side computed (not from API)
  fourPillars?: FourPillars;
  elementBalance?: ElementBalance;

  // Common
  overallScore: number;
  headline?: string;
  summary: string | string[];

  // Free fields
  dayMasterInsight?: string;
  todayTip?: string;
  teaser?: string;
  elements?: ElementBalance;

  // Overview (990사주 스타일)
  overview?: SajuOverview;

  // Paid fields
  structure?: SajuStructure;
  personality?: SajuPersonality;
  career?: SajuCareer;
  wealth?: SajuWealth;
  love?: SajuLove;
  health?: SajuHealth;
  yearly2026?: SajuYearly;
  daeun?: SajuDaeun;
  lucky?: SajuLucky;
  lifePeriods?: SajuLifePeriod[];
  relationship?: SajuRelationship;
  family?: SajuFamily;
  monthly2026?: SajuMonthlyScore[];
  academic?: SajuAcademic;
  finalWords?: string;
  disclaimer?: string;

  // Legacy compat
  luckyColor?: string;
  luckyNumber?: number;
  luckyDirection?: string;
  bigFortune?: string;
  // old field aliases
  dayMasterDescription?: string;
  teaserForPaid?: string;
  finalMessage?: string;
  sajuStructure?: any;
  yearlyFortune?: any;
  luckyElements?: any;
}

// --- Face ---

export interface FeatureScience { evidence: string; disclaimer: string; }
export interface FaceFeatureScore { area: string; score: number; description: string; detail?: string; nickname?: string; science?: FeatureScience; position?: { x: number; y: number }; }
export interface RadarScores { wealth: number; love: number; health: number; success: number; social: number; }
export interface FaceResult {
  overallScore: number; summary: string; features: FaceFeatureScore[];
  faceType?: string; samjeong?: string;
  personality?: string; fortune?: string; advice?: string;
  radarScores?: RadarScores; highlight?: { area: string; message: string };
  hookLine?: string; shareTitle?: string; celebrity?: string;
}

// Legacy
export interface SajuScienceLink { category: string; evidence: string; disclaimer: string; }
export interface SajuAnalysisSection { saju_analysis: string; science_link?: SajuScienceLink; }

// --- Compatibility ---

export interface CompatCategoryScore {
  score: number;
  detail: string;
}

export interface CompatCategories {
  love: CompatCategoryScore;
  communication: CompatCategoryScore;
  values: CompatCategoryScore;
  sexual: CompatCategoryScore;
  finance: CompatCategoryScore;
  family: CompatCategoryScore;
  growth: CompatCategoryScore;
  crisis: CompatCategoryScore;
}

export interface CompatDayMaster {
  type: string;
  analysis: string;
  aToB: string;
  bToA: string;
}

export interface CompatElementInteraction {
  summary: string;
  aElements: { dominant: string; percent: number };
  bElements: { dominant: string; percent: number };
  interaction: string;
  complementary: string;
}

export interface CompatDynamics {
  powerBalance: string;
  fightPattern: string;
  loveLanguage: string;
  attachmentStyle?: string;
  jealousy?: string;
  dealBreaker: string;
}

export interface CompatCoupleArchetype {
  title: string;
  emoji: string;
  description: string;
}

export interface CompatRelationshipStages {
  first3months: string;
  sixMonths: string;
  oneYear: string;
  threeYears: string;
  longTerm: string;
}

export interface CompatSurvivalGuide {
  rule1: string;
  rule2: string;
  rule3: string;
  neverDo: string;
}

export interface CompatDateRecommend {
  bestDate: string;
  worstDate: string;
  healingDate: string;
}

export interface CompatSecretMessage {
  toA: string;
  toB: string;
}

export interface CompatTimelineMonth {
  month: string;
  score: number;
  reason: string;
}

export interface CompatTimeline {
  bestMonths2026: CompatTimelineMonth[];
  worstMonths2026: CompatTimelineMonth[];
  marriageTiming: string;
  dangerPeriod: string;
}

export interface CompatMarriageGrade {
  grade: string;
  summary: string;
  ifMarried: string;
  childrenNote: string;
  inlaws?: string;
}

export interface CompatibilityResult {
  overallScore: number;
  headline?: string;
  summary: string;
  teaserForPaid?: string;

  // v2 paid fields
  coupleArchetype?: CompatCoupleArchetype;
  categories?: CompatCategories;
  dayMasterRelation?: CompatDayMaster | string;
  elementInteraction?: CompatElementInteraction;
  dynamics?: CompatDynamics;
  relationshipStages?: CompatRelationshipStages;
  strengthPoints?: string[];
  conflictPoints?: string[];
  survivalGuide?: CompatSurvivalGuide;
  dateRecommend?: CompatDateRecommend;
  timeline?: CompatTimeline;
  marriageGrade?: CompatMarriageGrade;
  secretMessage?: CompatSecretMessage;
  yearlyAdvice?: string;
  advice?: string[] | string;
  funFact?: string;
  finalWords?: string;
  disclaimer?: string;

  // Legacy v1 compat
  fiveElementInteraction?: string;
  detail?: string;
}

// --- Daily Fortune ---

export interface DailyFortune {
  date: string;
  _cacheKey?: string;
  overallScore: number;
  headline?: string;
  summary: string;
  dayPillarRelation?: string;
  hourly?: { hour: string; fortune: string; score: number }[];
  luckyItem?: string;
  luckyColor?: string;
  luckyNumber?: number;
  warning?: string;
  actionTip?: string;
  dailyFace?: string;
}
