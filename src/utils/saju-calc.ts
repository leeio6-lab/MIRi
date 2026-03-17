// ============================================================
// 사주팔자(四柱八字) 계산기
//
// 근거 문헌:
// - 적천수(滴天髓), 유백온(劉伯溫)
// - 자평진전(子平真詮), 심효첨(沈孝瞻)
// - 만세력(萬歲曆) 간지 대조표
//
// 계산 원리:
// - 년주: (year-4) % 60, 입춘(立春) 기준 연도 전환
// - 월주: 年上起月法 (오호둔/五虎遁)
// - 일주: 율리우스 적일(Julian Day Number) 기반
// - 시주: 日上起時法 (오서둔/五鼠遁)
// - 오행: 지장간(地藏干) 본기/중기/여기 가중치 반영
// - 절기: 24절기 중 12절(節) 기준 월 경계
// ============================================================

import { applySolarTimeCorrection } from './solar-time';

// ─── 천간 (天干, Heavenly Stems) ───
const HEAVENLY_STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const;
const HEAVENLY_STEMS_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const HEAVENLY_STEMS_EN = ['Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui'] as const;

// ─── 지지 (地支, Earthly Branches) ───
const EARTHLY_BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as const;
const EARTHLY_BRANCHES_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
const EARTHLY_BRANCHES_EN = ['Zi', 'Chou', 'Yin', 'Mao', 'Chen', 'Si', 'Wu', 'Wei', 'Shen', 'You', 'Xu', 'Hai'] as const;

// ─── 오행 (五行, Five Elements) ───
// 천간 → 오행: 甲乙=木, 丙丁=火, 戊己=土, 庚辛=金, 壬癸=水
const STEM_ELEMENTS: readonly string[] = ['wood', 'wood', 'fire', 'fire', 'earth', 'earth', 'metal', 'metal', 'water', 'water'];

// 천간 음양: 甲丙戊庚壬=양(陽), 乙丁己辛癸=음(陰)
const STEM_YINYANG: readonly ('양' | '음')[] = ['양', '음', '양', '음', '양', '음', '양', '음', '양', '음'];

// ─── 띠 (12지신) ───
const ZODIAC_ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'] as const;
const ZODIAC_ANIMALS_EN = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'] as const;

// ─── 지장간 (地藏干, Hidden Stems in Earthly Branches) ───
// 각 지지에 숨어있는 천간과 30일 기준 가중치
// 순서: [여기(餘氣), 중기(中氣), 본기(本氣)] (본기가 가장 강함)
// 출처: 만세력, 나무위키 지장간 항목 교차검증
interface HiddenStem {
  stemIdx: number;   // 천간 인덱스 (0=甲 ~ 9=癸)
  weight: number;    // 30일 기준 가중치
}

const HIDDEN_STEMS: readonly HiddenStem[][] = [
  /* 子 */ [{ stemIdx: 8, weight: 10 }, { stemIdx: 9, weight: 20 }],                                        // 壬10, 癸20
  /* 丑 */ [{ stemIdx: 9, weight: 9 }, { stemIdx: 7, weight: 3 }, { stemIdx: 5, weight: 18 }],               // 癸9, 辛3, 己18
  /* 寅 */ [{ stemIdx: 4, weight: 7 }, { stemIdx: 2, weight: 7 }, { stemIdx: 0, weight: 16 }],               // 戊7, 丙7, 甲16
  /* 卯 */ [{ stemIdx: 0, weight: 10 }, { stemIdx: 1, weight: 20 }],                                        // 甲10, 乙20
  /* 辰 */ [{ stemIdx: 1, weight: 9 }, { stemIdx: 9, weight: 3 }, { stemIdx: 4, weight: 18 }],               // 乙9, 癸3, 戊18
  /* 巳 */ [{ stemIdx: 4, weight: 7 }, { stemIdx: 6, weight: 7 }, { stemIdx: 2, weight: 16 }],               // 戊7, 庚7, 丙16
  /* 午 */ [{ stemIdx: 2, weight: 10 }, { stemIdx: 5, weight: 9 }, { stemIdx: 3, weight: 11 }],              // 丙10, 己9, 丁11
  /* 未 */ [{ stemIdx: 3, weight: 9 }, { stemIdx: 1, weight: 3 }, { stemIdx: 5, weight: 18 }],               // 丁9, 乙3, 己18
  /* 申 */ [{ stemIdx: 4, weight: 7 }, { stemIdx: 8, weight: 7 }, { stemIdx: 6, weight: 16 }],               // 戊7, 壬7, 庚16
  /* 酉 */ [{ stemIdx: 6, weight: 10 }, { stemIdx: 7, weight: 20 }],                                        // 庚10, 辛20
  /* 戌 */ [{ stemIdx: 7, weight: 9 }, { stemIdx: 3, weight: 3 }, { stemIdx: 4, weight: 18 }],               // 辛9, 丁3, 戊18
  /* 亥 */ [{ stemIdx: 4, weight: 7 }, { stemIdx: 0, weight: 7 }, { stemIdx: 8, weight: 16 }],               // 戊7, 甲7, 壬16
];

// ─── 절기 경계 (節氣, Solar Terms) ───
// 12절(節)의 근사 양력 날짜 - 월주 결정 기준
// 실제 절기는 매년 1~2일 오차 가능 (정밀 계산 시 태양 황경도 사용)
// 각 절기는 해당 사주월의 시작을 의미
const JEOLGI_BOUNDARIES: readonly { month: number; day: number; branch: number }[] = [
  { month: 2,  day: 4,  branch: 2 },   // 입춘(立春) → 寅월 시작 = 새해
  { month: 3,  day: 6,  branch: 3 },   // 경칩(驚蟄) → 卯월
  { month: 4,  day: 5,  branch: 4 },   // 청명(清明) → 辰월
  { month: 5,  day: 6,  branch: 5 },   // 입하(立夏) → 巳월
  { month: 6,  day: 6,  branch: 6 },   // 망종(芒種) → 午월
  { month: 7,  day: 7,  branch: 7 },   // 소서(小暑) → 未월
  { month: 8,  day: 8,  branch: 8 },   // 입추(立秋) → 申월
  { month: 9,  day: 8,  branch: 9 },   // 백로(白露) → 酉월
  { month: 10, day: 8,  branch: 10 },  // 한로(寒露) → 戌월
  { month: 11, day: 7,  branch: 11 },  // 입동(立冬) → 亥월
  { month: 12, day: 7,  branch: 0 },   // 대설(大雪) → 子월
  { month: 1,  day: 6,  branch: 1 },   // 소한(小寒) → 丑월
];

// ============================================================
// 핵심 계산 함수
// ============================================================

/**
 * 그레고리력 날짜 → 율리우스 적일(Julian Day Number)
 * Meeus/Richards 알고리즘 (미 해군천문대 검증)
 */
function gregorianToJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/**
 * 율리우스 적일(JDN) → 그레고리력 날짜 변환
 * (지역시 보정으로 날짜가 바뀔 때 사용)
 */
function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor(146097 * b / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor(1461 * d / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

/**
 * 절기 기반 사주 월 지지와 사주 연도 결정
 * 입춘(약 2/4) 전이면 전년도로 계산
 */
function getSajuMonthAndYear(
  year: number,
  month: number,
  day: number
): { branchIdx: number; sajuYear: number } {
  // 입춘 전이면 전년도
  const isBeforeIpchun = month < 2 || (month === 2 && day < 4);
  const sajuYear = isBeforeIpchun ? year - 1 : year;

  // 절기 경계에 따른 월 지지 결정
  let branchIdx = 1; // 기본값: 丑월 (소한 ~ 입춘 직전)

  for (let i = 0; i < JEOLGI_BOUNDARIES.length; i++) {
    const curr = JEOLGI_BOUNDARIES[i];
    const next = JEOLGI_BOUNDARIES[(i + 1) % 12];

    if (curr.month <= next.month) {
      // 같은 해 내에서 비교 (예: 2월~3월)
      if (
        (month > curr.month || (month === curr.month && day >= curr.day)) &&
        (month < next.month || (month === next.month && day < next.day))
      ) {
        branchIdx = curr.branch;
        break;
      }
    } else {
      // 연도를 넘기는 경우 (12월 대설 ~ 1월 소한)
      if (
        month > curr.month ||
        (month === curr.month && day >= curr.day) ||
        month < next.month ||
        (month === next.month && day < next.day)
      ) {
        branchIdx = curr.branch;
        break;
      }
    }
  }

  return { branchIdx, sajuYear };
}

/**
 * 시진 변환: 24시간 → 지지 인덱스
 * 자시(子時) = 23:00~01:00, 축시(丑時) = 01:00~03:00, ...
 */
function hourToBranchIndex(hour: number): number {
  if (hour === 23 || hour === 0) return 0;  // 자시
  return Math.floor((hour + 1) / 2);
}

// ============================================================
// 사주(柱) 계산
// ============================================================

export interface Pillar {
  stem: string;
  stemHanja: string;
  stemIdx: number;
  branch: string;
  branchHanja: string;
  branchIdx: number;
  element: string;
  yinYang: '양' | '음';
  zodiac?: string;
}

export interface FourPillarsCalc {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
  elementBalance: { wood: number; fire: number; earth: number; metal: number; water: number };
  dayMaster: string;           // 일간(日干) 한자
  dayMasterElement: string;    // 일간 오행
  dayMasterYinYang: '양' | '음';
}

function makePillar(stemIdx: number, branchIdx: number, zodiac?: string): Pillar {
  const si = ((stemIdx % 10) + 10) % 10;
  const bi = ((branchIdx % 12) + 12) % 12;
  return {
    stem: HEAVENLY_STEMS[si],
    stemHanja: HEAVENLY_STEMS_HANJA[si],
    stemIdx: si,
    branch: EARTHLY_BRANCHES[bi],
    branchHanja: EARTHLY_BRANCHES_HANJA[bi],
    branchIdx: bi,
    element: STEM_ELEMENTS[si],
    yinYang: STEM_YINYANG[si],
    zodiac,
  };
}

/** 년주(年柱) - 입춘 기준 연도 사용 */
function calcYearPillar(sajuYear: number): Pillar {
  const stemIdx = (sajuYear - 4) % 10;
  const branchIdx = (sajuYear - 4) % 12;
  return makePillar(stemIdx, branchIdx, ZODIAC_ANIMALS[branchIdx]);
}

/**
 * 월주(月柱) - 年上起月法 (오호둔/五虎遁)
 * 甲己년 → 丙寅, 乙庚년 → 戊寅, 丙辛년 → 庚寅, 丁壬년 → 壬寅, 戊癸년 → 甲寅
 */
function calcMonthPillar(sajuYear: number, monthBranchIdx: number): Pillar {
  const yearStemIdx = (sajuYear - 4) % 10;
  // 月干 기산: ((년간%5)*2 + 2)가 寅월의 천간
  const monthStemBase = ((yearStemIdx % 5) * 2 + 2) % 10;
  // 寅(2)부터의 오프셋
  const monthOffset = (monthBranchIdx - 2 + 12) % 12;
  const stemIdx = (monthStemBase + monthOffset) % 10;
  return makePillar(stemIdx, monthBranchIdx);
}

/**
 * 일주(日柱) - Julian Day Number 기반 정밀 계산
 *
 * 오프셋 검증 (포스텔러 만세력 달력 대조):
 *   2026-03-01 = 甲戌 ✓, 2026-03-15 = 戊子 ✓
 *   1993-05-26 = 丁未 ✓ (포스텔러 pro 결과와 일치)
 *
 * 공식: stemIdx = (JDN + 9) % 10, branchIdx = (JDN + 1) % 12
 */
function calcDayPillar(year: number, month: number, day: number): Pillar {
  const jdn = gregorianToJDN(year, month, day);
  const stemIdx = (jdn + 9) % 10;
  const branchIdx = (jdn + 1) % 12;
  return makePillar(stemIdx, branchIdx);
}

/**
 * 시주(時柱) - 日上起時法 (오서둔/五鼠遁)
 * 甲己일 → 甲子시, 乙庚일 → 丙子시, 丙辛일 → 戊子시, 丁壬일 → 庚子시, 戊癸일 → 壬子시
 */
function calcHourPillar(dayStemIdx: number, hour: number): Pillar {
  const branchIdx = hourToBranchIndex(hour);
  const stemBase = (dayStemIdx % 5) * 2;
  const stemIdx = (stemBase + branchIdx) % 10;
  return makePillar(stemIdx, branchIdx);
}

// ============================================================
// 오행 균형 계산 (지장간 가중치 반영)
// ============================================================

type ElementKey = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

function stemToElement(stemIdx: number): ElementKey {
  return STEM_ELEMENTS[stemIdx] as ElementKey;
}

// 지지 → 대표 오행 (본기 기준)
const BRANCH_ELEMENTS: readonly string[] = [
  'water', 'earth', 'wood', 'wood', 'earth', 'fire',
  'fire', 'earth', 'metal', 'metal', 'earth', 'water',
];

/**
 * 오행 비율 계산 — 표준 8자 카운트 방식
 * (포스텔러 만세력 등 주요 사주 앱과 동일)
 *
 * 천간 4개 + 지지 4개 = 8개, 각 1점
 * 총 8점을 100%로 환산
 *
 * 예) 癸酉 丁巳 丁未 己酉
 *   천간: 癸(수), 丁(화), 丁(화), 己(토) → 수1, 화2, 토1
 *   지지: 酉(금), 巳(화), 未(토), 酉(금) → 금2, 화1, 토1
 *   합계: 화3(37.5%), 토2(25%), 금2(25%), 수1(12.5%), 목0(0%)
 */
function calcElementBalance(pillars: Pillar[]): Record<ElementKey, number> {
  const raw: Record<ElementKey, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };

  for (const pillar of pillars) {
    // 천간 오행 (1점)
    raw[stemToElement(pillar.stemIdx)] += 1;

    // 지지 대표 오행 (1점)
    raw[BRANCH_ELEMENTS[pillar.branchIdx] as ElementKey] += 1;
  }

  // 퍼센트 환산 (총 8점)
  const total = Object.values(raw).reduce((a, b) => a + b, 0);
  return {
    wood: +((raw.wood / total) * 100).toFixed(1),
    fire: +((raw.fire / total) * 100).toFixed(1),
    earth: +((raw.earth / total) * 100).toFixed(1),
    metal: +((raw.metal / total) * 100).toFixed(1),
    water: +((raw.water / total) * 100).toFixed(1),
  };
}

// ============================================================
// 메인 함수
// ============================================================

export function calculateFourPillars(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute?: number,       // optional birth minute (default: 0)
  longitude?: number,    // optional birth city longitude (for solar time correction)
  utcOffset?: number,    // optional UTC offset in hours (for solar time correction)
  isLunar?: boolean,     // optional: true면 음력→양력 변환 후 계산
): FourPillarsCalc {
  // -1. 음력 → 양력 변환
  let solarYear = year;
  let solarMonth = month;
  let solarDay = day;

  if (isLunar) {
    try {
      const KoreanLunarCalendar = require('korean-lunar-calendar');
      const cal = new KoreanLunarCalendar();
      cal.setLunarDate(year, month, day, false);
      const solar = cal.getSolarCalendar();
      solarYear = solar.year;
      solarMonth = solar.month;
      solarDay = solar.day;
    } catch {
      // 변환 실패 시 원본 날짜 그대로 사용
    }
  }

  // 0. 지역시 보정 (longitude/utcOffset 제공 시)
  let correctedHour = hour;
  let correctedDay = solarDay;
  let correctedMonth = solarMonth;
  let correctedYear = solarYear;

  if (longitude !== undefined && utcOffset !== undefined) {
    const birthMinute = minute ?? 0;
    const correction = applySolarTimeCorrection(hour, birthMinute, longitude, utcOffset);
    correctedHour = correction.correctedHour;

    // 일자 보정 (보정으로 인해 날짜가 바뀌는 경우)
    if (correction.dayOffset !== 0) {
      const jdn = gregorianToJDN(solarYear, solarMonth, solarDay) + correction.dayOffset;
      const adjusted = jdnToGregorian(jdn);
      correctedYear = adjusted.year;
      correctedMonth = adjusted.month;
      correctedDay = adjusted.day;
    }
  }

  // 1. 절기 기반 사주 월/년 결정
  const { branchIdx: monthBranch, sajuYear } = getSajuMonthAndYear(correctedYear, correctedMonth, correctedDay);

  // 2. 사주 계산
  const yearPillar = calcYearPillar(sajuYear);
  const monthPillar = calcMonthPillar(sajuYear, monthBranch);
  const dayPillar = calcDayPillar(correctedYear, correctedMonth, correctedDay);
  const hourPillar = calcHourPillar(dayPillar.stemIdx, correctedHour);

  // 3. 오행 균형 (지장간 포함)
  const elementBalance = calcElementBalance([yearPillar, monthPillar, dayPillar, hourPillar]);

  return {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
    elementBalance,
    dayMaster: HEAVENLY_STEMS_HANJA[dayPillar.stemIdx],
    dayMasterElement: STEM_ELEMENTS[dayPillar.stemIdx],
    dayMasterYinYang: STEM_YINYANG[dayPillar.stemIdx],
  };
}

export {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  ZODIAC_ANIMALS,
  ZODIAC_ANIMALS_EN,
  HEAVENLY_STEMS_HANJA,
  EARTHLY_BRANCHES_HANJA,
  STEM_ELEMENTS,
  HIDDEN_STEMS,
};

// ============================================================
// 공망 (空亡, Void/Emptiness)
// ============================================================

/**
 * 공망(空亡) 계산 — 순중공망(旬中空亡)
 *
 * 60갑자를 10개씩 6순(旬)으로 나눔:
 *   甲子旬(0-9),  甲戌旬(10-19), 甲申旬(20-29),
 *   甲午旬(30-39), 甲辰旬(40-49), 甲寅旬(50-59)
 *
 * 각 순에서 천간 10개가 지지 12개 중 10개와 짝을 이루고,
 * 남은 2개의 지지가 공망이 됨.
 *
 * 계산법: 일주의 60갑자 번호를 구하고, 해당 순의 시작점에서
 *         빠진 2개 지지를 찾음.
 *
 * @param stemIdx   일간 천간 인덱스 (0~9)
 * @param branchIdx 일지 지지 인덱스 (0~11)
 * @returns 공망에 해당하는 2개 지지 인덱스 배열
 */
export function calculateGongmang(stemIdx: number, branchIdx: number): [number, number] {
  // 60갑자 내 위치: stem과 branch의 관계로 순(旬) 결정
  // 순의 시작 지지 = branchIdx - stemIdx (10개 천간이 순서대로 짝지어지므로)
  const startBranch = ((branchIdx - stemIdx) % 12 + 12) % 12;

  // 공망 = 순의 시작 지지에서 10번째, 11번째 (0-indexed)
  const gm1 = (startBranch + 10) % 12;
  const gm2 = (startBranch + 11) % 12;

  return [gm1, gm2];
}

/**
 * 공망 한자 문자열 반환
 * @returns "戌亥" 같은 2글자 한자
 */
export function getGongmangHanja(stemIdx: number, branchIdx: number): string {
  const [gm1, gm2] = calculateGongmang(stemIdx, branchIdx);
  return `${EARTHLY_BRANCHES_HANJA[gm1]}${EARTHLY_BRANCHES_HANJA[gm2]}`;
}

/**
 * 공망 한글 문자열 반환
 * @returns "술해" 같은 2글자 한글
 */
export function getGongmangText(stemIdx: number, branchIdx: number): string {
  const [gm1, gm2] = calculateGongmang(stemIdx, branchIdx);
  return `${EARTHLY_BRANCHES[gm1]}${EARTHLY_BRANCHES[gm2]}`;
}

/**
 * 특정 지지가 공망에 해당하는지 확인
 */
export function isGongmang(dayStemIdx: number, dayBranchIdx: number, targetBranchIdx: number): boolean {
  const [gm1, gm2] = calculateGongmang(dayStemIdx, dayBranchIdx);
  return targetBranchIdx === gm1 || targetBranchIdx === gm2;
}

// ============================================================
// 십성 (十星, Ten Gods)
// ============================================================

/**
 * 십성 계산 — 일간(日干)과 다른 천간의 관계
 *
 * 오행 상생/상극 관계 + 음양 동이(同異) 조합으로 10가지 관계를 결정
 *
 * 오행 인덱스: Math.floor(stemIdx / 2) → 0=목, 1=화, 2=토, 3=금, 4=수
 * 상생 순환: 목(0)→화(1)→토(2)→금(3)→수(4)→목(0)
 * 상극 순환: 목(0)→토(2)→수(4)→화(1)→금(3)→목(0)
 *
 * 검증 (일간 丁(3), day master):
 *   癸(9) vs 丁(3): 수→화 = 극아(controls me), 동양(odd/odd) = 편관 ✓
 *   甲(0) vs 丁(3): 목→화 = 생아(generates me), 이양(even/odd) = 정인 ✓
 *   酉(9) 본기 辛(7): 화→금 = 아극(I control), 동양(odd/odd) = 편재 ✓
 *   辰(4) 본기 戊(4): 화→토 = 아생(I generate), 이양(even/odd) = 상관 ✓
 */
export function getTenGod(dayMasterIdx: number, otherStemIdx: number): string {
  const dmElement = Math.floor(dayMasterIdx / 2); // 0=wood,1=fire,2=earth,3=metal,4=water
  const otherElement = Math.floor(otherStemIdx / 2);
  const samePol = (dayMasterIdx % 2) === (otherStemIdx % 2);

  // Generation cycle: 0→1→2→3→4→0
  // Control cycle:    0→2→4→1→3→0

  if (dmElement === otherElement) {
    // 비화 (same element)
    return samePol ? '비견' : '겁재';
  }

  // I generate: dm → other (generation cycle, dm generates other)
  if ((dmElement + 1) % 5 === otherElement) {
    return samePol ? '식신' : '상관';
  }

  // Generates me: other → dm (other generates dm)
  if ((otherElement + 1) % 5 === dmElement) {
    return samePol ? '편인' : '정인';
  }

  // I control: dm → other (control cycle, dm controls other)
  // Control cycle: wood(0)→earth(2)→water(4)→fire(1)→metal(3)→wood(0)
  if ((dmElement + 2) % 5 === otherElement) {
    return samePol ? '편재' : '정재';
  }

  // Controls me: other → dm (other controls dm)
  if ((otherElement + 2) % 5 === dmElement) {
    return samePol ? '편관' : '정관';
  }

  return '비견'; // fallback (should never reach)
}

/**
 * 지지의 본기(本氣) 천간 인덱스를 반환
 * 본기 = HIDDEN_STEMS 배열의 마지막 항목 (가장 높은 가중치)
 */
export function getMainHiddenStem(branchIdx: number): number {
  const hidden = HIDDEN_STEMS[branchIdx];
  return hidden[hidden.length - 1].stemIdx;
}

/**
 * 지지에 대한 십성 계산 — 본기(本氣) 기준
 */
export function getTenGodForBranch(dayMasterIdx: number, branchIdx: number): string {
  return getTenGod(dayMasterIdx, getMainHiddenStem(branchIdx));
}

// ============================================================
// 12운성 (十二運星, Twelve Life Stages)
// ============================================================

const LIFE_STAGE_NAMES = [
  '장생', '목욕', '관대', '건록', '제왕',
  '쇠', '병', '사', '묘', '절', '태', '양',
] as const;

/**
 * 각 천간의 장생(長生) 시작 지지
 * 인덱스: 0=甲 ~ 9=癸
 *
 * 검증 (丁(3) → startBranch=9=酉):
 *   酉(9): (9-9+12)%12 = 0 = 장생 ✓
 *   巳(5): (9-5+12)%12 = 4 = 제왕 ✓
 *   未(7): (9-7+12)%12 = 2 = 관대 ✓
 *   辰(4): (9-4+12)%12 = 5 = 쇠   ✓
 */
const LIFE_STAGE_START = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3] as const;

/**
 * 12운성 계산
 *
 * 양간(陽干, even index) = 순행(forward), 음간(陰干, odd index) = 역행(backward)
 *
 * @param stemIdx  천간 인덱스 (0~9)
 * @param branchIdx 지지 인덱스 (0~11)
 */
export function getLifeStage(stemIdx: number, branchIdx: number): string {
  const startBranch = LIFE_STAGE_START[stemIdx];
  const isYang = stemIdx % 2 === 0;

  let stageIdx: number;
  if (isYang) {
    // 양간: 순행 (forward)
    stageIdx = (branchIdx - startBranch + 12) % 12;
  } else {
    // 음간: 역행 (backward)
    stageIdx = (startBranch - branchIdx + 12) % 12;
  }

  return LIFE_STAGE_NAMES[stageIdx];
}

// ============================================================
// 12신살 (十二神煞, Spirit Stars)
// ============================================================

const SPIRIT_STAR_NAMES = [
  '겁살', '재살', '천살', '지살', '연살', '월살',
  '망신살', '장성살', '반안살', '역마살', '육해살', '화개살',
] as const;

/**
 * 삼합(三合) 그룹별 겁살 시작 지지
 *
 * 寅午戌(2,6,10) → 亥(11) 시작
 * 巳酉丑(5,9,1)  → 寅(2) 시작
 * 申子辰(8,0,4)  → 巳(5) 시작
 * 亥卯未(11,3,7) → 申(8) 시작
 */
function getSpiritStarStart(dayBranchIdx: number): number {
  // 寅午戌 group
  if (dayBranchIdx === 2 || dayBranchIdx === 6 || dayBranchIdx === 10) return 11;
  // 巳酉丑 group
  if (dayBranchIdx === 5 || dayBranchIdx === 9 || dayBranchIdx === 1) return 2;
  // 申子辰 group
  if (dayBranchIdx === 8 || dayBranchIdx === 0 || dayBranchIdx === 4) return 5;
  // 亥卯未 group
  return 8; // branches 11, 3, 7
}

/**
 * 12신살 계산 — 일지(日支) 기준
 *
 * @param dayBranchIdx    일지 인덱스 (삼합 그룹 결정)
 * @param targetBranchIdx 대상 지지 인덱스
 */
export function getSpiritStar(dayBranchIdx: number, targetBranchIdx: number): string {
  const startBranch = getSpiritStarStart(dayBranchIdx);
  const idx = (targetBranchIdx - startBranch + 12) % 12;
  return SPIRIT_STAR_NAMES[idx];
}

// ============================================================
// 신강/신약 분석 (Strong/Weak Analysis)
// ============================================================

export interface StrengthAnalysis {
  isStrong: boolean;
  deukryeong: boolean;  // 득령(得令): 월지가 일간을 돕는가
  deukji: boolean;      // 득지(得地): 일지 지장간에 일간 오행 있는가
  deuksi: boolean;      // 득시(得時): 시간이 일간을 돕는가
  deukse: boolean;      // 득세(得勢): 천간 다수가 일간을 돕는가
  score: number;        // 총점 (100점 만점)
  description: string;
}

/**
 * 오행이 대상 오행을 돕는지 판별 (동일 오행 또는 상생)
 */
function elementSupports(helperElement: number, targetElement: number): boolean {
  // 동일 오행
  if (helperElement === targetElement) return true;
  // 상생: helper가 target을 생(生)한다 → (helper + 1) % 5 === target
  if ((helperElement + 1) % 5 === targetElement) return true;
  return false;
}

/**
 * 오행 지원 강도 반환 (0~1)
 * 동일 오행 = 1.0, 상생(생아) = 0.6, 그 외 = 0
 */
function elementSupportDegree(helperElement: number, targetElement: number): number {
  if (helperElement === targetElement) return 1.0;
  if ((helperElement + 1) % 5 === targetElement) return 0.6;
  return 0;
}

/**
 * 신강/신약 분석 (세분화 채점)
 *
 * 득령(35점): 월지 본기의 일간 지원 강도 (동일=35, 상생=21)
 * 득지(25점): 일지 지장간의 일간 동일 오행 가중치 비율
 * 득시(20점): 시간(時干)의 일간 지원 강도 (동일=20, 상생=12)
 * 득세(20점): 연간/월간/시간의 지원 강도 합산 비율
 *
 * 총점 45점 이상 = 신강, 미만 = 신약
 */
export function analyzeStrength(pillars: FourPillarsCalc): StrengthAnalysis {
  const dmElement = Math.floor(pillars.day.stemIdx / 2);

  // 득령: 월지(본기)가 일간을 돕는 강도
  const monthBranchElement = Math.floor(getMainHiddenStem(pillars.month.branchIdx) / 2);
  const deukryeongDegree = elementSupportDegree(monthBranchElement, dmElement);
  const deukryeong = deukryeongDegree > 0;

  // 득지: 일지 지장간 가중치 반영 — 일간 동일 오행의 가중치 비율
  const dayHidden = HIDDEN_STEMS[pillars.day.branchIdx];
  const totalWeight = dayHidden.reduce((sum, h) => sum + h.weight, 0);
  const supportWeight = dayHidden
    .filter(h => Math.floor(h.stemIdx / 2) === dmElement)
    .reduce((sum, h) => sum + h.weight, 0);
  const deukjiRatio = totalWeight > 0 ? supportWeight / totalWeight : 0;
  const deukji = deukjiRatio > 0;

  // 득시: 시간 오행의 일간 지원 강도
  const hourStemElement = Math.floor(pillars.hour.stemIdx / 2);
  const deuksiDegree = elementSupportDegree(hourStemElement, dmElement);
  const deuksi = deuksiDegree > 0;

  // 득세: 연간/월간/시간 각각의 지원 강도 합산 (최대 3.0)
  const otherStems = [pillars.year.stemIdx, pillars.month.stemIdx, pillars.hour.stemIdx];
  const supportSum = otherStems.reduce(
    (sum, si) => sum + elementSupportDegree(Math.floor(si / 2), dmElement), 0
  );
  const deukseRatio = supportSum / 3;
  const deukse = deukseRatio >= 0.5;

  // 세분화 점수 (소수 → 반올림)
  const score = Math.round(
    deukryeongDegree * 35 +
    deukjiRatio * 25 +
    deuksiDegree * 20 +
    deukseRatio * 20
  );

  const isStrong = score >= 45;

  const description = isStrong
    ? `신강(身強): 일간 ${HEAVENLY_STEMS_HANJA[pillars.day.stemIdx]}(${STEM_ELEMENTS[pillars.day.stemIdx]})이 강하여 재성/관성/식상이 용신으로 필요합니다.`
    : `신약(身弱): 일간 ${HEAVENLY_STEMS_HANJA[pillars.day.stemIdx]}(${STEM_ELEMENTS[pillars.day.stemIdx]})이 약하여 인성/비겁이 용신으로 필요합니다.`;

  return {
    isStrong,
    deukryeong,
    deukji,
    deuksi,
    deukse,
    score,
    description,
  };
}

// ============================================================
// 대운 (大運, Major Fortune Cycles)
// ============================================================

export interface DaeunPillar {
  stem: string;
  stemHanja: string;
  stemIdx: number;
  branch: string;
  branchHanja: string;
  branchIdx: number;
  startAge: number;        // 이 대운이 시작되는 나이
  tenGod: string;          // 일간 대비 십성
  lifeStage: string;       // 12운성
}

export interface DaeunResult {
  direction: '순행' | '역행';
  daeunNumber: number;     // 대운수 (대운 시작 나이)
  pillars: DaeunPillar[];  // 10개 대운
}

/**
 * 대운 계산
 *
 * 방향 결정:
 *   남자 + 양(陽)년간 = 순행, 남자 + 음(陰)년간 = 역행
 *   여자 = 반대
 *
 * 대운수: 생일~다음/이전 절기 경계까지 일수 ÷ 3, 반올림
 *
 * 대운 간지: 월주에서 방향에 따라 간지 순차 이동
 *
 * 검증 (1993/05/26 남자, 년간 癸(9)=음, 역행):
 *   이전 절기 입하 5/6 → 20일 → 20/3=6.67→7 대운수 ✓
 *   월주 丁巳(3,5) 역행: 丙辰(2,4), 乙卯(1,3), 甲寅(0,2), 癸丑(9,1) ✓
 */
export function calculateDaeun(
  pillars: FourPillarsCalc,
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  gender: 'male' | 'female'
): DaeunResult {
  const yearStemIdx = pillars.year.stemIdx;
  const isYangStem = yearStemIdx % 2 === 0;

  // 방향: male+양=순행, male+음=역행, female은 반대
  const isForward = gender === 'male' ? isYangStem : !isYangStem;
  const direction: '순행' | '역행' = isForward ? '순행' : '역행';

  // 대운수 계산: 생일~절기 경계 사이 일수
  const daeunNumber = calcDaeunNumber(birthYear, birthMonth, birthDay, isForward);

  // 대운 간지 생성 (10개)
  const monthStemIdx = pillars.month.stemIdx;
  const monthBranchIdx = pillars.month.branchIdx;
  const dayMasterIdx = pillars.day.stemIdx;
  const step = isForward ? 1 : -1;

  const daeunPillars: DaeunPillar[] = [];
  for (let i = 1; i <= 10; i++) {
    const si = ((monthStemIdx + step * i) % 10 + 10) % 10;
    const bi = ((monthBranchIdx + step * i) % 12 + 12) % 12;
    daeunPillars.push({
      stem: HEAVENLY_STEMS[si],
      stemHanja: HEAVENLY_STEMS_HANJA[si],
      stemIdx: si,
      branch: EARTHLY_BRANCHES[bi],
      branchHanja: EARTHLY_BRANCHES_HANJA[bi],
      branchIdx: bi,
      startAge: daeunNumber + (i - 1) * 10,
      tenGod: getTenGod(dayMasterIdx, si),
      lifeStage: getLifeStage(dayMasterIdx, bi),
    });
  }

  return { direction, daeunNumber, pillars: daeunPillars };
}

/**
 * 대운수 계산 — 생일~절기 경계까지 일수 / 3 반올림
 */
function calcDaeunNumber(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  isForward: boolean
): number {
  // 절기 경계를 날짜 순으로 정렬 (해당 연도 기준)
  const boundaries: { month: number; day: number }[] = [];
  for (const jg of JEOLGI_BOUNDARIES) {
    boundaries.push({ month: jg.month, day: jg.day });
  }
  // 월 순 정렬
  boundaries.sort((a, b) => a.month - b.month || a.day - b.day);

  if (isForward) {
    // 순행: 다음 절기까지 일수
    let nextBoundary: { month: number; day: number } | null = null;
    for (const b of boundaries) {
      if (b.month > birthMonth || (b.month === birthMonth && b.day > birthDay)) {
        nextBoundary = b;
        break;
      }
    }
    // 올해에 없으면 내년 첫 절기
    const nextYear = nextBoundary ? birthYear : birthYear + 1;
    const nb = nextBoundary || boundaries[0];
    const days = daysBetween(birthYear, birthMonth, birthDay, nextYear, nb.month, nb.day);
    return Math.round(days / 3);
  } else {
    // 역행: 이전 절기까지 일수
    let prevBoundary: { month: number; day: number } | null = null;
    for (let i = boundaries.length - 1; i >= 0; i--) {
      const b = boundaries[i];
      if (b.month < birthMonth || (b.month === birthMonth && b.day <= birthDay)) {
        prevBoundary = b;
        break;
      }
    }
    // 올해에 없으면 작년 마지막 절기
    const prevYear = prevBoundary ? birthYear : birthYear - 1;
    const pb = prevBoundary || boundaries[boundaries.length - 1];
    const days = daysBetween(prevYear, pb.month, pb.day, birthYear, birthMonth, birthDay);
    return Math.round(days / 3);
  }
}

/** 두 날짜 사이의 일수 (절대값) */
function daysBetween(
  y1: number, m1: number, d1: number,
  y2: number, m2: number, d2: number
): number {
  return Math.abs(gregorianToJDN(y2, m2, d2) - gregorianToJDN(y1, m1, d1));
}

// ============================================================
// 연운 (年運, Yearly Fortune)
// ============================================================

export interface YearlyFortune {
  year: number;
  stem: string;
  stemHanja: string;
  stemIdx: number;
  branch: string;
  branchHanja: string;
  branchIdx: number;
  tenGod: string;
  lifeStage: string;
  zodiac: string;
}

/**
 * 연운 계산 — 해당 해의 년주에 대한 일간 관계
 */
export function calculateYearlyFortune(dayMasterIdx: number, year: number): YearlyFortune {
  const stemIdx = ((year - 4) % 10 + 10) % 10;
  const branchIdx = ((year - 4) % 12 + 12) % 12;

  return {
    year,
    stem: HEAVENLY_STEMS[stemIdx],
    stemHanja: HEAVENLY_STEMS_HANJA[stemIdx],
    stemIdx,
    branch: EARTHLY_BRANCHES[branchIdx],
    branchHanja: EARTHLY_BRANCHES_HANJA[branchIdx],
    branchIdx,
    tenGod: getTenGod(dayMasterIdx, stemIdx),
    lifeStage: getLifeStage(dayMasterIdx, branchIdx),
    zodiac: ZODIAC_ANIMALS[branchIdx] as string,
  };
}

// ============================================================
// 월운 (月運, Monthly Fortune)
// ============================================================

export interface MonthlyFortune {
  month: number;         // 양력 월 (1~12)
  stem: string;
  stemHanja: string;
  stemIdx: number;
  branch: string;
  branchHanja: string;
  branchIdx: number;
  tenGod: string;
  lifeStage: string;
}

/**
 * 월운 계산 — 해당 연도의 각 월주에 대한 일간 관계
 *
 * 12개월 각각의 월주를 계산하고 일간 대비 십성/12운성을 반환
 */
export function calculateMonthlyFortune(dayMasterIdx: number, year: number): MonthlyFortune[] {
  const result: MonthlyFortune[] = [];

  for (let m = 1; m <= 12; m++) {
    // 절기 기반으로 해당 월의 사주 월 결정
    // 각 양력 월의 중간쯤 (15일)을 기준으로 해당 월의 월주를 구함
    const { branchIdx: monthBranch, sajuYear } = getSajuMonthAndYear(year, m, 15);
    const yearStemIdx = ((sajuYear - 4) % 10 + 10) % 10;

    // 월간 계산 (年上起月法)
    const monthStemBase = ((yearStemIdx % 5) * 2 + 2) % 10;
    const monthOffset = (monthBranch - 2 + 12) % 12;
    const stemIdx = (monthStemBase + monthOffset) % 10;

    result.push({
      month: m,
      stem: HEAVENLY_STEMS[stemIdx],
      stemHanja: HEAVENLY_STEMS_HANJA[stemIdx],
      stemIdx,
      branch: EARTHLY_BRANCHES[monthBranch],
      branchHanja: EARTHLY_BRANCHES_HANJA[monthBranch],
      branchIdx: monthBranch,
      tenGod: getTenGod(dayMasterIdx, stemIdx),
      lifeStage: getLifeStage(dayMasterIdx, monthBranch),
    });
  }

  return result;
}

// ============================================================
// 용신 (用神, Useful God)
// ============================================================

export interface YongShinResult {
  eokbuYongShin: string;    // 억부용신 (오행)
  johuYongShin: string;     // 조후용신 (오행)
  giShin: string;           // 기신 (꺼리는 오행)
  description: string;
}

const ELEMENT_NAMES_KO: Record<string, string> = {
  wood: '목(木)',
  fire: '화(火)',
  earth: '토(土)',
  metal: '금(金)',
  water: '수(水)',
};

const ELEMENT_KEYS: ElementKey[] = ['wood', 'fire', 'earth', 'metal', 'water'];

/**
 * 오행 인덱스(0~4)를 ElementKey로 변환
 */
function elementIdxToKey(idx: number): ElementKey {
  return ELEMENT_KEYS[idx];
}

/**
 * 상생 관계: source 오행이 생하는 오행 반환
 */
function generatedElement(elementIdx: number): number {
  return (elementIdx + 1) % 5;
}

/**
 * 상극 관계: source 오행이 극하는 오행 반환
 */
function controlledElement(elementIdx: number): number {
  return (elementIdx + 2) % 5;
}

/**
 * 나를 극하는 오행 반환
 */
function controllingElement(elementIdx: number): number {
  // (x+2)%5 === elementIdx 를 만족하는 x
  return (elementIdx + 3) % 5;
}

/**
 * 나를 생하는 오행 반환
 */
function generatingElement(elementIdx: number): number {
  return (elementIdx + 4) % 5;
}

/**
 * 용신 계산
 *
 * 신강 → 억부용신: 일간을 극하는 오행 / 일간이 생하는 오행 (에너지 발산)
 * 신약 → 억부용신: 일간을 생하는 오행 / 일간과 같은 오행 (에너지 보충)
 *
 * 조후용신: 계절 균형
 *   - 여름생(화 과다) → 수(水) 필요
 *   - 겨울생(수 과다) → 화(火) 필요
 *   - 봄생(목 과다) → 금(金) 필요
 *   - 가을생(금 과다) → 목(木) 필요
 *
 * @param dayMasterElement 일간 오행 ('wood'|'fire'|'earth'|'metal'|'water')
 * @param isStrong         신강 여부
 * @param monthBranchIdx   월지 인덱스 (조후용신 계절 판단용, 선택)
 */
export function calculateYongShin(
  dayMasterElement: string,
  isStrong: boolean,
  monthBranchIdx?: number
): YongShinResult {
  const dmIdx = ELEMENT_KEYS.indexOf(dayMasterElement as ElementKey);

  let eokbuIdx: number;
  let giShinIdx: number;

  if (isStrong) {
    // 신강: 극아(controls me) 또는 아생(I generate)으로 에너지를 빼야 함
    eokbuIdx = controllingElement(dmIdx);  // 나를 극하는 오행
    giShinIdx = generatingElement(dmIdx);  // 나를 생하는 오행 = 기신 (더 강해지므로)
  } else {
    // 신약: 생아(generates me) 또는 동일 오행으로 보충
    eokbuIdx = generatingElement(dmIdx);   // 나를 생하는 오행
    giShinIdx = controllingElement(dmIdx); // 나를 극하는 오행 = 기신 (더 약해지므로)
  }

  // 조후용신: 월지 기반 계절 판단
  let johuIdx: number;
  if (monthBranchIdx !== undefined) {
    // 寅卯辰(2,3,4)=봄, 巳午未(5,6,7)=여름, 申酉戌(8,9,10)=가을, 亥子丑(11,0,1)=겨울
    if (monthBranchIdx >= 5 && monthBranchIdx <= 7) {
      johuIdx = ELEMENT_KEYS.indexOf('water');  // 여름 → 수
    } else if (monthBranchIdx >= 11 || monthBranchIdx <= 1) {
      johuIdx = ELEMENT_KEYS.indexOf('fire');   // 겨울 → 화
    } else if (monthBranchIdx >= 2 && monthBranchIdx <= 4) {
      johuIdx = ELEMENT_KEYS.indexOf('metal');  // 봄 → 금
    } else {
      johuIdx = ELEMENT_KEYS.indexOf('wood');   // 가을 → 목
    }
  } else {
    // 월지 정보 없으면 억부용신과 동일
    johuIdx = eokbuIdx;
  }

  const eokbuKey = elementIdxToKey(eokbuIdx);
  const johuKey = elementIdxToKey(johuIdx);
  const giShinKey = elementIdxToKey(giShinIdx);

  const description = isStrong
    ? `신강 사주입니다. ${ELEMENT_NAMES_KO[eokbuKey]}이(가) 억부용신으로 일간의 강한 기운을 제어합니다. ` +
      `${ELEMENT_NAMES_KO[johuKey]}이(가) 조후용신으로 계절 균형을 맞춥니다. ` +
      `${ELEMENT_NAMES_KO[giShinKey]}은(는) 기신으로 피하는 것이 좋습니다.`
    : `신약 사주입니다. ${ELEMENT_NAMES_KO[eokbuKey]}이(가) 억부용신으로 일간의 약한 기운을 보충합니다. ` +
      `${ELEMENT_NAMES_KO[johuKey]}이(가) 조후용신으로 계절 균형을 맞춥니다. ` +
      `${ELEMENT_NAMES_KO[giShinKey]}은(는) 기신으로 피하는 것이 좋습니다.`;

  return {
    eokbuYongShin: eokbuKey,
    johuYongShin: johuKey,
    giShin: giShinKey,
    description,
  };
}

// ============================================================
// 오늘의 사주 (Today's Saju)
// ============================================================

export interface TodaySajuResult {
  date: string;             // YYYY-MM-DD
  dayStem: string;
  dayStemHanja: string;
  dayStemIdx: number;
  dayBranch: string;
  dayBranchHanja: string;
  dayBranchIdx: number;
  tenGod: string;           // 일간 대비 오늘 일간의 십성
  lifeStage: string;        // 일간 대비 오늘 일지의 12운성
  description: string;
}

/**
 * 오늘의 사주 계산
 *
 * 오늘 날짜의 일주를 구한 뒤, 사용자의 일간(dayMasterIdx) 대비
 * 십성과 12운성을 반환
 */
export function calculateTodaySaju(dayMasterIdx: number): TodaySajuResult {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  const dayPillar = calcDayPillar(year, month, day);

  const tenGod = getTenGod(dayMasterIdx, dayPillar.stemIdx);
  const lifeStage = getLifeStage(dayMasterIdx, dayPillar.branchIdx);

  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const description =
    `오늘(${dateStr})의 일주는 ${dayPillar.stemHanja}${dayPillar.branchHanja}` +
    `(${STEM_ELEMENTS[dayPillar.stemIdx]})입니다. ` +
    `나의 일간 ${HEAVENLY_STEMS_HANJA[dayMasterIdx]} 기준 십성은 ${tenGod}, ` +
    `12운성은 ${lifeStage}입니다.`;

  return {
    date: dateStr,
    dayStem: dayPillar.stem,
    dayStemHanja: dayPillar.stemHanja,
    dayStemIdx: dayPillar.stemIdx,
    dayBranch: dayPillar.branch,
    dayBranchHanja: dayPillar.branchHanja,
    dayBranchIdx: dayPillar.branchIdx,
    tenGod,
    lifeStage,
    description,
  };
}

// ============================================================
// 종합 분석 (Full Saju Analysis)
// ============================================================

export interface FullSajuAnalysis {
  fourPillars: FourPillarsCalc;
  tenGods: {
    yearStem: string;
    monthStem: string;
    dayStem: string;    // 항상 '비견' (자기 자신)
    hourStem: string;
    yearBranch: string;
    monthBranch: string;
    dayBranch: string;
    hourBranch: string;
  };
  lifeStages: {
    yearBranch: string;
    monthBranch: string;
    dayBranch: string;
    hourBranch: string;
  };
  spiritStars: {
    yearBranch: string;
    monthBranch: string;
    dayBranch: string;
    hourBranch: string;
  };
  strength: StrengthAnalysis;
  daeun: DaeunResult;
  yongShin: YongShinResult;
  yearlyFortune: YearlyFortune;
  todaySaju: TodaySajuResult;
  gongmang: {
    branches: [number, number];   // 공망 지지 인덱스 2개
    hanja: string;                // "戌亥" 등
    text: string;                 // "술해" 등
    inPillars: string[];          // 사주 내 공망에 해당하는 기둥들 (예: ['년주', '시주'])
  };
}

/**
 * 종합 사주 분석 — 모든 분석을 하나의 호출로 통합
 *
 * @param year       양력 생년
 * @param month      양력 생월 (1~12)
 * @param day        양력 생일
 * @param hour       생시 (0~23)
 * @param gender     성별
 * @param minute     생분 (0~59, optional)
 * @param longitude  출생지 경도 (optional, for solar time correction)
 * @param utcOffset  출생지 UTC 오프셋 (optional, for solar time correction)
 */
export function calculateFullSaju(
  year: number,
  month: number,
  day: number,
  hour: number,
  gender: 'male' | 'female',
  minute?: number,
  longitude?: number,
  utcOffset?: number,
): FullSajuAnalysis {
  // 1. 사주팔자 계산 (지역시 보정 포함)
  const fourPillars = calculateFourPillars(year, month, day, hour, minute, longitude, utcOffset);
  const dmIdx = fourPillars.day.stemIdx;

  // 2. 십성
  const tenGods = {
    yearStem: getTenGod(dmIdx, fourPillars.year.stemIdx),
    monthStem: getTenGod(dmIdx, fourPillars.month.stemIdx),
    dayStem: '비견', // 일간 자체는 항상 비견
    hourStem: getTenGod(dmIdx, fourPillars.hour.stemIdx),
    yearBranch: getTenGodForBranch(dmIdx, fourPillars.year.branchIdx),
    monthBranch: getTenGodForBranch(dmIdx, fourPillars.month.branchIdx),
    dayBranch: getTenGodForBranch(dmIdx, fourPillars.day.branchIdx),
    hourBranch: getTenGodForBranch(dmIdx, fourPillars.hour.branchIdx),
  };

  // 3. 12운성
  const lifeStages = {
    yearBranch: getLifeStage(dmIdx, fourPillars.year.branchIdx),
    monthBranch: getLifeStage(dmIdx, fourPillars.month.branchIdx),
    dayBranch: getLifeStage(dmIdx, fourPillars.day.branchIdx),
    hourBranch: getLifeStage(dmIdx, fourPillars.hour.branchIdx),
  };

  // 4. 12신살
  const dayBranch = fourPillars.day.branchIdx;
  const spiritStars = {
    yearBranch: getSpiritStar(dayBranch, fourPillars.year.branchIdx),
    monthBranch: getSpiritStar(dayBranch, fourPillars.month.branchIdx),
    dayBranch: getSpiritStar(dayBranch, fourPillars.day.branchIdx),
    hourBranch: getSpiritStar(dayBranch, fourPillars.hour.branchIdx),
  };

  // 5. 신강/신약
  const strength = analyzeStrength(fourPillars);

  // 6. 대운
  const daeun = calculateDaeun(fourPillars, year, month, day, gender);

  // 7. 용신
  const yongShin = calculateYongShin(
    fourPillars.dayMasterElement,
    strength.isStrong,
    fourPillars.month.branchIdx
  );

  // 8. 연운 (현재 해)
  const currentYear = new Date().getFullYear();
  const yearlyFortune = calculateYearlyFortune(dmIdx, currentYear);

  // 9. 오늘의 사주
  const todaySaju = calculateTodaySaju(dmIdx);

  // 10. 공망
  const gmBranches = calculateGongmang(fourPillars.day.stemIdx, fourPillars.day.branchIdx);
  const gmInPillars: string[] = [];
  const pillarNames = ['년주', '월주', '일주', '시주'];
  const pillarBranches = [fourPillars.year.branchIdx, fourPillars.month.branchIdx, fourPillars.day.branchIdx, fourPillars.hour.branchIdx];
  for (let i = 0; i < 4; i++) {
    if (gmBranches.includes(pillarBranches[i] as any)) {
      gmInPillars.push(pillarNames[i]);
    }
  }

  return {
    fourPillars,
    tenGods,
    lifeStages,
    spiritStars,
    strength,
    daeun,
    yongShin,
    yearlyFortune,
    todaySaju,
    gongmang: {
      branches: gmBranches,
      hanja: getGongmangHanja(fourPillars.day.stemIdx, fourPillars.day.branchIdx),
      text: getGongmangText(fourPillars.day.stemIdx, fourPillars.day.branchIdx),
      inPillars: gmInPillars,
    },
  };
}

/**
 * 지장간(地藏干) 한자 문자열 반환
 * 예: 辰 → "을계무"
 */
export function getHiddenStemsText(branchIdx: number): string {
  return HIDDEN_STEMS[branchIdx]
    .map(h => HEAVENLY_STEMS[h.stemIdx])
    .join('');
}

/**
 * 지장간 한자 문자열 반환
 */
export function getHiddenStemsHanja(branchIdx: number): string {
  return HIDDEN_STEMS[branchIdx]
    .map(h => HEAVENLY_STEMS_HANJA[h.stemIdx])
    .join('');
}

// ============================================================
// 주간 운세 (Weekly Fortune)
// ============================================================

export interface WeeklyFortuneDay {
  date: string;           // YYYY-MM-DD
  dayOfWeek: number;      // 0=Sun, 1=Mon, ..., 6=Sat
  dayPillar: string;      // 일주 한자 (예: 甲子)
  tenStar: string;        // 십성
  score: number;          // 점수
}

const TEN_STAR_SCORES: Record<string, number> = {
  '비견': 60, '겁재': 55, '식신': 75, '상관': 65, '편재': 70,
  '정재': 80, '편관': 50, '정관': 85, '편인': 72, '정인': 78,
};

/**
 * 주간 운세 계산 — 이번 주 월~일 7일의 일진 기반
 */
export function calculateWeeklyFortune(dayMasterIdx: number): WeeklyFortuneDay[] {
  const now = new Date();
  const currentDay = now.getDay(); // 0=Sun
  // 월요일 기준으로 이번 주 시작일 계산
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

  const result: WeeklyFortuneDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + mondayOffset + i);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const jdn = gregorianToJDN(year, month, day);
    const stemIdx = (jdn + 9) % 10;
    const branchIdx = (jdn + 1) % 12;
    const tenStar = getTenGod(dayMasterIdx, stemIdx);
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    result.push({
      date: dateStr,
      dayOfWeek: d.getDay(),
      dayPillar: `${HEAVENLY_STEMS_HANJA[stemIdx]}${EARTHLY_BRANCHES_HANJA[branchIdx]}`,
      tenStar,
      score: TEN_STAR_SCORES[tenStar] ?? 65,
    });
  }

  return result;
}

// Export additional constants and utility functions
export {
  LIFE_STAGE_NAMES,
  SPIRIT_STAR_NAMES,
  BRANCH_ELEMENTS,
  ELEMENT_NAMES_KO,
  STEM_YINYANG,
  HEAVENLY_STEMS_EN,
  EARTHLY_BRANCHES_EN,
  hourToBranchIndex,
};
