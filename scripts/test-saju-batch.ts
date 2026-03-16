/**
 * 사주 & 궁합 배치 테스트 스크립트
 * 최소 30개씩 다양한 생년월일로 테스트
 */

import {
  calculateFourPillars,
  calculateFullSaju,
  getTenGod,
  getLifeStage,
  getSpiritStar,
  analyzeStrength,
  calculateDaeun,
  calculateYongShin,
  calculateYearlyFortune,
  calculateMonthlyFortune,
  getHiddenStemsText,
  getHiddenStemsHanja,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  HEAVENLY_STEMS_HANJA,
  EARTHLY_BRANCHES_HANJA,
  STEM_ELEMENTS,
  LIFE_STAGE_NAMES,
  SPIRIT_STAR_NAMES,
} from '../src/utils/saju-calc';

import { calculateLocalCompatibility } from '../src/utils/compatibility-calc';
import { applySolarTimeCorrection, getSolarTimeCorrection } from '../src/utils/solar-time';

// ─── 테스트 데이터 ───

interface TestPerson {
  label: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  gender: 'male' | 'female';
  minute?: number;
  longitude?: number;
  utcOffset?: number;
}

const SAJU_TEST_CASES: TestPerson[] = [
  // 기본 케이스 (다양한 연대)
  { label: '1950년생 남자 (이른 새벽)', year: 1950, month: 3, day: 15, hour: 3, gender: 'male' },
  { label: '1960년생 여자 (아침)', year: 1960, month: 7, day: 22, hour: 8, gender: 'female' },
  { label: '1970년생 남자 (정오)', year: 1970, month: 11, day: 1, hour: 12, gender: 'male' },
  { label: '1980년생 여자 (오후)', year: 1980, month: 1, day: 30, hour: 15, gender: 'female' },
  { label: '1990년생 남자 (저녁)', year: 1990, month: 5, day: 10, hour: 19, gender: 'male' },
  { label: '1993년생 남자 (만세력 검증용)', year: 1993, month: 5, day: 26, hour: 10, gender: 'male' },
  { label: '2000년생 여자 (자정)', year: 2000, month: 9, day: 9, hour: 0, gender: 'female' },
  { label: '2005년생 남자 (23시 자시)', year: 2005, month: 12, day: 25, hour: 23, gender: 'male' },
  { label: '2010년생 여자 (새벽 1시)', year: 2010, month: 6, day: 15, hour: 1, gender: 'female' },
  { label: '2024년생 남자', year: 2024, month: 2, day: 10, hour: 14, gender: 'male' },

  // 절기 경계 (입춘 전후)
  { label: '입춘 직전 (2/3)', year: 1985, month: 2, day: 3, hour: 10, gender: 'male' },
  { label: '입춘 당일 (2/4)', year: 1985, month: 2, day: 4, hour: 10, gender: 'male' },
  { label: '입춘 직후 (2/5)', year: 1985, month: 2, day: 5, hour: 10, gender: 'male' },

  // 월경계 (각 절기 전후)
  { label: '경칩 직전 (3/5)', year: 1992, month: 3, day: 5, hour: 7, gender: 'female' },
  { label: '경칩 직후 (3/7)', year: 1992, month: 3, day: 7, hour: 7, gender: 'female' },
  { label: '대설 전후 (12/6)', year: 1988, month: 12, day: 6, hour: 18, gender: 'male' },
  { label: '대설 직후 (12/8)', year: 1988, month: 12, day: 8, hour: 18, gender: 'male' },
  { label: '소한 직전 (1/5)', year: 1995, month: 1, day: 5, hour: 6, gender: 'female' },
  { label: '소한 직후 (1/7)', year: 1995, month: 1, day: 7, hour: 6, gender: 'female' },

  // 시간 경계 (시진 전환점)
  { label: '축시 시작 (1:00)', year: 1987, month: 4, day: 20, hour: 1, gender: 'male' },
  { label: '인시 시작 (3:00)', year: 1987, month: 4, day: 20, hour: 3, gender: 'male' },
  { label: '묘시 시작 (5:00)', year: 1987, month: 4, day: 20, hour: 5, gender: 'male' },
  { label: '진시 시작 (7:00)', year: 1987, month: 4, day: 20, hour: 7, gender: 'male' },
  { label: '사시 시작 (9:00)', year: 1987, month: 4, day: 20, hour: 9, gender: 'male' },
  { label: '오시 시작 (11:00)', year: 1987, month: 4, day: 20, hour: 11, gender: 'male' },
  { label: '미시 시작 (13:00)', year: 1987, month: 4, day: 20, hour: 13, gender: 'male' },
  { label: '신시 시작 (15:00)', year: 1987, month: 4, day: 20, hour: 15, gender: 'male' },
  { label: '유시 시작 (17:00)', year: 1987, month: 4, day: 20, hour: 17, gender: 'male' },
  { label: '술시 시작 (19:00)', year: 1987, month: 4, day: 20, hour: 19, gender: 'male' },
  { label: '해시 시작 (21:00)', year: 1987, month: 4, day: 20, hour: 21, gender: 'male' },
  { label: '자시 시작 (23:00)', year: 1987, month: 4, day: 20, hour: 23, gender: 'male' },

  // 지역시 보정 테스트
  { label: '서울 지역시보정', year: 1990, month: 8, day: 15, hour: 14, gender: 'male', minute: 30, longitude: 127, utcOffset: 9 },
  { label: '부산 지역시보정', year: 1990, month: 8, day: 15, hour: 14, gender: 'male', minute: 30, longitude: 129.05, utcOffset: 9 },
  { label: '도쿄 지역시보정', year: 1990, month: 8, day: 15, hour: 14, gender: 'male', minute: 30, longitude: 139.69, utcOffset: 9 },
  { label: 'LA 지역시보정', year: 1990, month: 8, day: 15, hour: 14, gender: 'male', minute: 30, longitude: -118.24, utcOffset: -7 },
  { label: '뉴욕 지역시보정', year: 1990, month: 8, day: 15, hour: 0, gender: 'female', minute: 10, longitude: -74.01, utcOffset: -4 },

  // 윤년/특수 날짜
  { label: '윤년 2/29', year: 2000, month: 2, day: 29, hour: 12, gender: 'male' },
  { label: '윤년 2/28', year: 2000, month: 2, day: 28, hour: 12, gender: 'male' },
  { label: '비윤년 2/28', year: 2001, month: 2, day: 28, hour: 12, gender: 'male' },
  { label: '12/31 연말', year: 1999, month: 12, day: 31, hour: 23, gender: 'female' },
  { label: '1/1 연초', year: 2000, month: 1, day: 1, hour: 0, gender: 'female' },

  // 극단적 연도
  { label: '1924년생 (아주 오래된)', year: 1924, month: 6, day: 10, hour: 10, gender: 'male' },
  { label: '2026년생 (현재 연도)', year: 2026, month: 3, day: 15, hour: 8, gender: 'female' },
];

// 궁합 테스트 쌍
interface CompatTestCase {
  label: string;
  p1: { year: number; month: number; day: number; hour: number; gender: string };
  p2: { year: number; month: number; day: number; gender: string };
}

const COMPAT_TEST_CASES: CompatTestCase[] = [
  // 천간합 쌍
  { label: '갑기합 (甲己合)', p1: { year: 1984, month: 3, day: 4, hour: 10, gender: 'male' }, p2: { year: 1989, month: 7, day: 15, gender: 'female' } },
  { label: '을경합 (乙庚合)', p1: { year: 1985, month: 5, day: 10, hour: 8, gender: 'male' }, p2: { year: 1990, month: 11, day: 20, gender: 'female' } },
  { label: '병신합 (丙辛合)', p1: { year: 1986, month: 9, day: 18, hour: 14, gender: 'female' }, p2: { year: 1991, month: 1, day: 5, gender: 'male' } },
  { label: '정임합 (丁壬合)', p1: { year: 1987, month: 12, day: 25, hour: 6, gender: 'male' }, p2: { year: 1992, month: 4, day: 10, gender: 'female' } },
  { label: '무계합 (戊癸合)', p1: { year: 1988, month: 2, day: 14, hour: 16, gender: 'female' }, p2: { year: 1993, month: 8, day: 30, gender: 'male' } },

  // 같은 오행 쌍 (비화)
  { label: '목+목 비화', p1: { year: 1984, month: 6, day: 15, hour: 10, gender: 'male' }, p2: { year: 1985, month: 3, day: 20, gender: 'female' } },
  { label: '화+화 비화', p1: { year: 1986, month: 8, day: 20, hour: 12, gender: 'male' }, p2: { year: 1987, month: 5, day: 10, gender: 'female' } },
  { label: '토+토 비화', p1: { year: 1988, month: 10, day: 5, hour: 14, gender: 'female' }, p2: { year: 1989, month: 7, day: 25, gender: 'male' } },
  { label: '금+금 비화', p1: { year: 1990, month: 1, day: 12, hour: 8, gender: 'male' }, p2: { year: 1991, month: 9, day: 8, gender: 'female' } },
  { label: '수+수 비화', p1: { year: 1992, month: 4, day: 28, hour: 22, gender: 'female' }, p2: { year: 1993, month: 11, day: 15, gender: 'male' } },

  // 상생 쌍
  { label: '목생화 (木生火)', p1: { year: 1984, month: 5, day: 5, hour: 7, gender: 'male' }, p2: { year: 1986, month: 8, day: 18, gender: 'female' } },
  { label: '화생토 (火生土)', p1: { year: 1986, month: 3, day: 22, hour: 15, gender: 'female' }, p2: { year: 1988, month: 6, day: 10, gender: 'male' } },
  { label: '토생금 (土生金)', p1: { year: 1988, month: 7, day: 14, hour: 11, gender: 'male' }, p2: { year: 1990, month: 10, day: 5, gender: 'female' } },
  { label: '금생수 (金生水)', p1: { year: 1990, month: 9, day: 3, hour: 20, gender: 'female' }, p2: { year: 1992, month: 12, day: 22, gender: 'male' } },
  { label: '수생목 (水生木)', p1: { year: 1992, month: 11, day: 18, hour: 4, gender: 'male' }, p2: { year: 1984, month: 2, day: 7, gender: 'female' } },

  // 상극 쌍
  { label: '목극토 (木剋土)', p1: { year: 1984, month: 4, day: 10, hour: 9, gender: 'male' }, p2: { year: 1988, month: 9, day: 15, gender: 'female' } },
  { label: '토극수 (土剋水)', p1: { year: 1988, month: 8, day: 20, hour: 17, gender: 'female' }, p2: { year: 1992, month: 1, day: 25, gender: 'male' } },
  { label: '수극화 (水剋火)', p1: { year: 1992, month: 6, day: 5, hour: 13, gender: 'male' }, p2: { year: 1986, month: 11, day: 30, gender: 'female' } },
  { label: '화극금 (火剋金)', p1: { year: 1986, month: 2, day: 12, hour: 21, gender: 'female' }, p2: { year: 1990, month: 7, day: 8, gender: 'male' } },
  { label: '금극목 (金剋木)', p1: { year: 1990, month: 10, day: 28, hour: 5, gender: 'male' }, p2: { year: 1984, month: 5, day: 17, gender: 'female' } },

  // 나이차이 다양
  { label: '동갑 (1990)', p1: { year: 1990, month: 3, day: 15, hour: 10, gender: 'male' }, p2: { year: 1990, month: 9, day: 20, gender: 'female' } },
  { label: '1살 차이', p1: { year: 1991, month: 5, day: 10, hour: 8, gender: 'male' }, p2: { year: 1992, month: 3, day: 25, gender: 'female' } },
  { label: '5살 차이', p1: { year: 1985, month: 7, day: 20, hour: 14, gender: 'male' }, p2: { year: 1990, month: 11, day: 12, gender: 'female' } },
  { label: '10살 차이', p1: { year: 1980, month: 1, day: 5, hour: 6, gender: 'male' }, p2: { year: 1990, month: 6, day: 18, gender: 'female' } },
  { label: '20살 차이', p1: { year: 1970, month: 8, day: 12, hour: 16, gender: 'male' }, p2: { year: 1990, month: 4, day: 28, gender: 'female' } },

  // 여자가 연상
  { label: '여성 연상 3살', p1: { year: 1993, month: 6, day: 10, hour: 10, gender: 'male' }, p2: { year: 1990, month: 2, day: 15, gender: 'female' } },

  // 같은 생년월일 다른 시간
  { label: '같은날 다른시간', p1: { year: 1990, month: 5, day: 5, hour: 6, gender: 'male' }, p2: { year: 1990, month: 5, day: 5, gender: 'female' } },

  // 경계 케이스
  { label: '입춘 전 vs 후', p1: { year: 1990, month: 2, day: 3, hour: 10, gender: 'male' }, p2: { year: 1990, month: 2, day: 5, gender: 'female' } },
  { label: '연말연초', p1: { year: 1989, month: 12, day: 31, hour: 23, gender: 'male' }, p2: { year: 1990, month: 1, day: 1, gender: 'female' } },
  { label: '윤년 2/29', p1: { year: 2000, month: 2, day: 29, hour: 12, gender: 'male' }, p2: { year: 2001, month: 3, day: 1, gender: 'female' } },

  // 2000년대생 커플
  { label: '2000년대생 커플', p1: { year: 2000, month: 8, day: 15, hour: 10, gender: 'male' }, p2: { year: 2001, month: 4, day: 20, gender: 'female' } },
  { label: '2010년대생 커플', p1: { year: 2010, month: 3, day: 10, hour: 14, gender: 'male' }, p2: { year: 2011, month: 7, day: 25, gender: 'female' } },
];

// ─── 테스트 헬퍼 ───

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const errors: string[] = [];

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
  } else {
    failedTests++;
    errors.push(`FAIL: ${message}`);
  }
}

function assertRange(value: number, min: number, max: number, label: string) {
  assert(value >= min && value <= max, `${label}: ${value} not in [${min}, ${max}]`);
}

function assertValidStem(stemIdx: number, label: string) {
  assert(stemIdx >= 0 && stemIdx <= 9, `${label}: stemIdx ${stemIdx} out of range [0,9]`);
}

function assertValidBranch(branchIdx: number, label: string) {
  assert(branchIdx >= 0 && branchIdx <= 11, `${label}: branchIdx ${branchIdx} out of range [0,11]`);
}

// ─── 사주 테스트 ───

console.log('='.repeat(70));
console.log(' 사주(四柱) 분석 배치 테스트');
console.log('='.repeat(70));

for (const tc of SAJU_TEST_CASES) {
  try {
    const result = calculateFullSaju(
      tc.year, tc.month, tc.day, tc.hour, tc.gender,
      tc.minute, tc.longitude, tc.utcOffset
    );

    const fp = result.fourPillars;
    const prefix = `[사주] ${tc.label}`;

    // 1. 사주팔자 기본 유효성
    for (const pillarName of ['year', 'month', 'day', 'hour'] as const) {
      const p = fp[pillarName];
      assertValidStem(p.stemIdx, `${prefix} ${pillarName}주 천간`);
      assertValidBranch(p.branchIdx, `${prefix} ${pillarName}주 지지`);
      assert(p.stem !== undefined && p.stem.length > 0, `${prefix} ${pillarName}주 stem 비어있음`);
      assert(p.branch !== undefined && p.branch.length > 0, `${prefix} ${pillarName}주 branch 비어있음`);
      assert(p.stemHanja !== undefined && p.stemHanja.length > 0, `${prefix} ${pillarName}주 stemHanja 비어있음`);
      assert(p.branchHanja !== undefined && p.branchHanja.length > 0, `${prefix} ${pillarName}주 branchHanja 비어있음`);
      assert(['wood', 'fire', 'earth', 'metal', 'water'].includes(p.element), `${prefix} ${pillarName}주 element 유효하지 않음: ${p.element}`);
      assert(p.yinYang === '양' || p.yinYang === '음', `${prefix} ${pillarName}주 yinYang 유효하지 않음: ${p.yinYang}`);
    }

    // 2. 오행 균형 합계 = 100%
    const eb = fp.elementBalance;
    const ebSum = eb.wood + eb.fire + eb.earth + eb.metal + eb.water;
    assert(Math.abs(ebSum - 100) < 1, `${prefix} 오행 합계 ${ebSum.toFixed(1)} != 100`);
    for (const el of ['wood', 'fire', 'earth', 'metal', 'water'] as const) {
      assertRange(eb[el], 0, 100, `${prefix} 오행 ${el}`);
    }

    // 3. 일간
    assert(fp.dayMaster !== undefined && fp.dayMaster.length > 0, `${prefix} dayMaster 비어있음`);
    assert(['wood', 'fire', 'earth', 'metal', 'water'].includes(fp.dayMasterElement), `${prefix} dayMasterElement 유효하지 않음`);

    // 4. 십성 유효성
    const validTenGods = ['비견', '겁재', '식신', '상관', '편인', '정인', '편재', '정재', '편관', '정관'];
    for (const [key, val] of Object.entries(result.tenGods)) {
      assert(validTenGods.includes(val), `${prefix} 십성 ${key}=${val} 유효하지 않음`);
    }
    assert(result.tenGods.dayStem === '비견', `${prefix} 일간 십성은 항상 비견이어야 함: ${result.tenGods.dayStem}`);

    // 5. 12운성 유효성
    const validLifeStages: string[] = [...LIFE_STAGE_NAMES];
    for (const [key, val] of Object.entries(result.lifeStages)) {
      assert(validLifeStages.includes(val), `${prefix} 12운성 ${key}=${val} 유효하지 않음`);
    }

    // 6. 12신살 유효성
    const validSpiritStars: string[] = [...SPIRIT_STAR_NAMES];
    for (const [key, val] of Object.entries(result.spiritStars)) {
      assert(validSpiritStars.includes(val), `${prefix} 12신살 ${key}=${val} 유효하지 않음`);
    }

    // 7. 신강/신약 분석
    const str = result.strength;
    assertRange(str.score, 0, 100, `${prefix} 신강신약 점수`);
    assert(typeof str.isStrong === 'boolean', `${prefix} isStrong 타입 오류`);
    assert(typeof str.deukryeong === 'boolean', `${prefix} deukryeong 타입 오류`);
    assert(typeof str.deukji === 'boolean', `${prefix} deukji 타입 오류`);
    assert(typeof str.deuksi === 'boolean', `${prefix} deuksi 타입 오류`);
    assert(typeof str.deukse === 'boolean', `${prefix} deukse 타입 오류`);
    assert(str.description.length > 0, `${prefix} strength description 비어있음`);
    // 점수와 isStrong 일관성 (45점 기준)
    assert(
      (str.score >= 45) === str.isStrong,
      `${prefix} 점수 ${str.score}와 isStrong ${str.isStrong} 불일치`
    );

    // 8. 대운
    const daeun = result.daeun;
    assert(daeun.direction === '순행' || daeun.direction === '역행', `${prefix} 대운 방향 유효하지 않음: ${daeun.direction}`);
    assertRange(daeun.daeunNumber, 0, 12, `${prefix} 대운수`);
    assert(daeun.pillars.length === 10, `${prefix} 대운 개수 ${daeun.pillars.length} != 10`);
    for (let i = 0; i < daeun.pillars.length; i++) {
      const dp = daeun.pillars[i];
      assertValidStem(dp.stemIdx, `${prefix} 대운 ${i + 1} 천간`);
      assertValidBranch(dp.branchIdx, `${prefix} 대운 ${i + 1} 지지`);
      assert(validTenGods.includes(dp.tenGod), `${prefix} 대운 ${i + 1} 십성 유효하지 않음: ${dp.tenGod}`);
      assert(validLifeStages.includes(dp.lifeStage as string), `${prefix} 대운 ${i + 1} 12운성 유효하지 않음: ${dp.lifeStage}`);
      assert(dp.startAge >= 0, `${prefix} 대운 ${i + 1} startAge ${dp.startAge} < 0`);
    }
    // 대운 startAge 순서 검증
    for (let i = 1; i < daeun.pillars.length; i++) {
      assert(
        daeun.pillars[i].startAge === daeun.pillars[i - 1].startAge + 10,
        `${prefix} 대운 startAge 간격 오류: ${daeun.pillars[i - 1].startAge} → ${daeun.pillars[i].startAge}`
      );
    }

    // 9. 용신
    const ys = result.yongShin;
    const validElements = ['wood', 'fire', 'earth', 'metal', 'water'];
    assert(validElements.includes(ys.eokbuYongShin), `${prefix} 억부용신 유효하지 않음: ${ys.eokbuYongShin}`);
    assert(validElements.includes(ys.johuYongShin), `${prefix} 조후용신 유효하지 않음: ${ys.johuYongShin}`);
    assert(validElements.includes(ys.giShin), `${prefix} 기신 유효하지 않음: ${ys.giShin}`);
    assert(ys.description.length > 0, `${prefix} 용신 description 비어있음`);
    // 용신과 기신은 다른 오행이어야 함
    assert(ys.eokbuYongShin !== ys.giShin, `${prefix} 억부용신과 기신이 같음: ${ys.eokbuYongShin}`);

    // 10. 연운
    const yf = result.yearlyFortune;
    assertValidStem(yf.stemIdx, `${prefix} 연운 천간`);
    assertValidBranch(yf.branchIdx, `${prefix} 연운 지지`);
    assert(validTenGods.includes(yf.tenGod), `${prefix} 연운 십성 유효하지 않음`);

    // 11. 오늘의 사주
    const ts = result.todaySaju;
    assertValidStem(ts.dayStemIdx, `${prefix} 오늘 천간`);
    assertValidBranch(ts.dayBranchIdx, `${prefix} 오늘 지지`);
    assert(validTenGods.includes(ts.tenGod), `${prefix} 오늘 십성 유효하지 않음`);

    // 12. 지장간 테스트
    for (let bi = 0; bi < 12; bi++) {
      const text = getHiddenStemsText(bi);
      const hanja = getHiddenStemsHanja(bi);
      assert(text.length >= 2, `${prefix} 지장간 텍스트 지지${bi} 길이 부족: ${text}`);
      assert(hanja.length >= 2, `${prefix} 지장간 한자 지지${bi} 길이 부족: ${hanja}`);
    }

    // 13. 월운 테스트
    const mf = calculateMonthlyFortune(fp.day.stemIdx, tc.year);
    assert(mf.length === 12, `${prefix} 월운 개수 ${mf.length} != 12`);
    for (let i = 0; i < mf.length; i++) {
      assertValidStem(mf[i].stemIdx, `${prefix} 월운 ${mf[i].month}월 천간`);
      assertValidBranch(mf[i].branchIdx, `${prefix} 월운 ${mf[i].month}월 지지`);
      assert(validTenGods.includes(mf[i].tenGod), `${prefix} 월운 ${mf[i].month}월 십성 유효하지 않음`);
    }

    // 결과 출력 (요약)
    console.log(
      `✓ ${tc.label}: ` +
      `${fp.year.stemHanja}${fp.year.branchHanja} ` +
      `${fp.month.stemHanja}${fp.month.branchHanja} ` +
      `${fp.day.stemHanja}${fp.day.branchHanja} ` +
      `${fp.hour.stemHanja}${fp.hour.branchHanja} ` +
      `| 일간=${fp.dayMaster}(${fp.dayMasterElement}) ` +
      `| ${str.isStrong ? '신강' : '신약'}(${str.score}점) ` +
      `| 용신=${ys.eokbuYongShin} ` +
      `| 대운=${daeun.direction}(${daeun.daeunNumber}세)`
    );

  } catch (e: any) {
    failedTests++;
    errors.push(`CRASH [사주] ${tc.label}: ${e.message}\n${e.stack}`);
    console.log(`✗ ${tc.label}: CRASH - ${e.message}`);
  }
}

// ─── 궁합 테스트 ───

console.log('\n' + '='.repeat(70));
console.log(' 궁합(宮合) 분석 배치 테스트');
console.log('='.repeat(70));

for (const tc of COMPAT_TEST_CASES) {
  try {
    const result = calculateLocalCompatibility(
      tc.p1.year, tc.p1.month, tc.p1.day, tc.p1.hour, tc.p1.gender,
      tc.p2.year, tc.p2.month, tc.p2.day, 12, tc.p2.gender,
    );

    const prefix = `[궁합] ${tc.label}`;

    // 1. 점수 범위 (코드에서 35~92로 clamp)
    assertRange(result.overallScore, 35, 92, `${prefix} 점수`);
    assert(Number.isInteger(result.overallScore), `${prefix} 점수가 정수가 아님: ${result.overallScore}`);

    // 2. headline 유효성
    assert(result.headline !== undefined && result.headline.length > 0, `${prefix} headline 비어있음`);
    assert(result.headline!.length <= 200, `${prefix} headline 너무 김: ${result.headline!.length}자`);

    // 3. summary 유효성
    assert(result.summary !== undefined && result.summary.length > 0, `${prefix} summary 비어있음`);
    assert(result.summary.includes('일간'), `${prefix} summary에 '일간' 키워드 없음`);

    // 4. teaser 유효성
    assert(result.teaserForPaid !== undefined && result.teaserForPaid!.length > 0, `${prefix} teaser 비어있음`);

    // 5. 역방향 궁합도 테스트 (p2를 기준으로)
    const reverseResult = calculateLocalCompatibility(
      tc.p2.year, tc.p2.month, tc.p2.day, 12, tc.p2.gender,
      tc.p1.year, tc.p1.month, tc.p1.day, tc.p1.hour, tc.p1.gender,
    );
    assert(reverseResult.overallScore >= 35 && reverseResult.overallScore <= 92, `${prefix} 역방향 점수 범위 벗어남: ${reverseResult.overallScore}`);

    // 결과 출력
    console.log(
      `✓ ${tc.label}: ` +
      `점수=${result.overallScore}점 ` +
      `(역=${reverseResult.overallScore}점) ` +
      `| ${result.headline}`
    );

  } catch (e: any) {
    failedTests++;
    errors.push(`CRASH [궁합] ${tc.label}: ${e.message}\n${e.stack}`);
    console.log(`✗ ${tc.label}: CRASH - ${e.message}`);
  }
}

// ─── 지역시 보정 단독 테스트 ───

console.log('\n' + '='.repeat(70));
console.log(' 지역시(眞太陽時) 보정 테스트');
console.log('='.repeat(70));

const solarTests = [
  { label: '서울', longitude: 127, utcOffset: 9, expectedApprox: -32 },
  { label: '평양', longitude: 125.75, utcOffset: 9, expectedApprox: -37 },
  { label: '도쿄', longitude: 139.69, utcOffset: 9, expectedApprox: 19 },
  { label: '뉴욕', longitude: -74.01, utcOffset: -5, expectedApprox: 4 },
  { label: 'LA', longitude: -118.24, utcOffset: -8, expectedApprox: 7 },
  { label: '런던', longitude: -0.12, utcOffset: 0, expectedApprox: 0 },
  { label: '시드니', longitude: 151.21, utcOffset: 10, expectedApprox: 5 },
  { label: '베이징', longitude: 116.40, utcOffset: 8, expectedApprox: -14 },
];

for (const st of solarTests) {
  try {
    const correction = getSolarTimeCorrection(st.longitude, st.utcOffset);
    const diff = Math.abs(correction - st.expectedApprox);
    assert(diff <= 5, `${st.label} 지역시 보정 ${correction.toFixed(1)}분 vs 예상 ${st.expectedApprox}분 (차이 ${diff.toFixed(1)})`);

    // applySolarTimeCorrection 테스트
    const applied = applySolarTimeCorrection(12, 0, st.longitude, st.utcOffset);
    assertRange(applied.correctedHour, 0, 23, `${st.label} 보정된 시간`);
    assertRange(applied.correctedMinute, 0, 59, `${st.label} 보정된 분`);
    assert(applied.dayOffset >= -1 && applied.dayOffset <= 1, `${st.label} dayOffset 범위 초과: ${applied.dayOffset}`);

    console.log(
      `✓ ${st.label}: 보정=${Math.round(correction)}분 (예상≈${st.expectedApprox}분) → 12:00 → ${applied.correctedHour}:${String(applied.correctedMinute).padStart(2, '0')}`
    );
  } catch (e: any) {
    failedTests++;
    errors.push(`CRASH [지역시] ${st.label}: ${e.message}`);
    console.log(`✗ ${st.label}: CRASH - ${e.message}`);
  }
}

// ─── 특수 검증 케이스 ───

console.log('\n' + '='.repeat(70));
console.log(' 특수 검증 케이스');
console.log('='.repeat(70));

// 1993/05/26 일주 = 丁未 검증 (포스텔러 대조)
try {
  const fp1993 = calculateFourPillars(1993, 5, 26, 10);
  assert(
    fp1993.day.stemHanja === '丁' && fp1993.day.branchHanja === '未',
    `1993/05/26 일주 검증: 예상 丁未, 실제 ${fp1993.day.stemHanja}${fp1993.day.branchHanja}`
  );
  console.log(`✓ 1993/05/26 일주 = ${fp1993.day.stemHanja}${fp1993.day.branchHanja} (포스텔러 검증)`);
} catch (e: any) {
  errors.push(`CRASH 1993 검증: ${e.message}`);
}

// 2026/03/01 일주 = 甲戌 검증
try {
  const fp2026a = calculateFourPillars(2026, 3, 1, 12);
  assert(
    fp2026a.day.stemHanja === '甲' && fp2026a.day.branchHanja === '戌',
    `2026/03/01 일주 검증: 예상 甲戌, 실제 ${fp2026a.day.stemHanja}${fp2026a.day.branchHanja}`
  );
  console.log(`✓ 2026/03/01 일주 = ${fp2026a.day.stemHanja}${fp2026a.day.branchHanja} (만세력 검증)`);
} catch (e: any) {
  errors.push(`CRASH 2026/03/01 검증: ${e.message}`);
}

// 2026/03/15 일주 = 戊子 검증
try {
  const fp2026b = calculateFourPillars(2026, 3, 15, 12);
  assert(
    fp2026b.day.stemHanja === '戊' && fp2026b.day.branchHanja === '子',
    `2026/03/15 일주 검증: 예상 戊子, 실제 ${fp2026b.day.stemHanja}${fp2026b.day.branchHanja}`
  );
  console.log(`✓ 2026/03/15 일주 = ${fp2026b.day.stemHanja}${fp2026b.day.branchHanja} (만세력 검증)`);
} catch (e: any) {
  errors.push(`CRASH 2026/03/15 검증: ${e.message}`);
}

// 십성 교차 검증: 일간 丁(3), 癸(9) → 편관
try {
  const tg = getTenGod(3, 9);
  assert(tg === '편관', `십성 교차검증: 丁vs癸 예상 편관, 실제 ${tg}`);
  console.log(`✓ 십성 丁(3)vs癸(9) = ${tg} (교차검증)`);
} catch (e: any) {
  errors.push(`CRASH 십성 검증: ${e.message}`);
}

// 십성 교차 검증: 일간 丁(3), 甲(0) → 정인
try {
  const tg2 = getTenGod(3, 0);
  assert(tg2 === '정인', `십성 교차검증: 丁vs甲 예상 정인, 실제 ${tg2}`);
  console.log(`✓ 십성 丁(3)vs甲(0) = ${tg2} (교차검증)`);
} catch (e: any) {
  errors.push(`CRASH 십성 검증2: ${e.message}`);
}

// 12운성 교차 검증: 丁(3) + 酉(9) → 장생
try {
  const ls = getLifeStage(3, 9);
  assert(ls === '장생', `12운성 교차검증: 丁+酉 예상 장생, 실제 ${ls}`);
  console.log(`✓ 12운성 丁(3)+酉(9) = ${ls} (교차검증)`);
} catch (e: any) {
  errors.push(`CRASH 12운성 검증: ${e.message}`);
}

// 12운성 교차 검증: 丁(3) + 巳(5) → 제왕
try {
  const ls2 = getLifeStage(3, 5);
  assert(ls2 === '제왕', `12운성 교차검증: 丁+巳 예상 제왕, 실제 ${ls2}`);
  console.log(`✓ 12운성 丁(3)+巳(5) = ${ls2} (교차검증)`);
} catch (e: any) {
  errors.push(`CRASH 12운성 검증2: ${e.message}`);
}

// 입춘 전후 연주 변화 검증
try {
  const before = calculateFourPillars(1985, 2, 3, 10);
  const after = calculateFourPillars(1985, 2, 5, 10);
  // 입춘 전(2/3)은 전년도(1984) 연주, 입춘 후(2/5)는 당년도(1985) 연주
  assert(
    before.year.stemIdx !== after.year.stemIdx || before.year.branchIdx !== after.year.branchIdx,
    `입춘 전후 연주 변화 검증: 연주가 같음 - 전 ${before.year.stemHanja}${before.year.branchHanja}, 후 ${after.year.stemHanja}${after.year.branchHanja}`
  );
  console.log(
    `✓ 입춘 전후 연주 변화: 2/3=${before.year.stemHanja}${before.year.branchHanja}(${before.year.zodiac}띠) → 2/5=${after.year.stemHanja}${after.year.branchHanja}(${after.year.zodiac}띠)`
  );
} catch (e: any) {
  errors.push(`CRASH 입춘 검증: ${e.message}`);
}

// 자시(23시) 검증 - 시주 지지가 자(子)여야 함
try {
  const jasi = calculateFourPillars(1990, 5, 10, 23);
  assert(jasi.hour.branchIdx === 0, `자시(23:00) 지지 검증: 예상 子(0), 실제 ${jasi.hour.branch}(${jasi.hour.branchIdx})`);
  console.log(`✓ 자시(23:00) = ${jasi.hour.stemHanja}${jasi.hour.branchHanja} (지지=子 확인)`);
} catch (e: any) {
  errors.push(`CRASH 자시 검증: ${e.message}`);
}

// 자시(0시) 검증 - 시주 지지가 자(子)여야 함
try {
  const jasi0 = calculateFourPillars(1990, 5, 10, 0);
  assert(jasi0.hour.branchIdx === 0, `자시(0:00) 지지 검증: 예상 子(0), 실제 ${jasi0.hour.branch}(${jasi0.hour.branchIdx})`);
  console.log(`✓ 자시(0:00) = ${jasi0.hour.stemHanja}${jasi0.hour.branchHanja} (지지=子 확인)`);
} catch (e: any) {
  errors.push(`CRASH 자시0 검증: ${e.message}`);
}

// ─── 결과 요약 ───

console.log('\n' + '='.repeat(70));
console.log(' 테스트 결과 요약');
console.log('='.repeat(70));
console.log(`총 테스트: ${totalTests}`);
console.log(`통과: ${passedTests}`);
console.log(`실패: ${failedTests}`);
console.log(`사주 테스트 케이스: ${SAJU_TEST_CASES.length}개`);
console.log(`궁합 테스트 케이스: ${COMPAT_TEST_CASES.length}개`);

if (errors.length > 0) {
  console.log('\n--- 실패 목록 ---');
  for (const err of errors) {
    console.log(`  ${err}`);
  }
}

console.log('\n' + (failedTests === 0 ? '🎉 모든 테스트 통과!' : `⚠️ ${failedTests}개 테스트 실패`));

process.exit(failedTests > 0 ? 1 : 0);
