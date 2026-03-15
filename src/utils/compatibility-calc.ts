/**
 * 궁합 로컬 계산 — 무료 분석용 (API 호출 없음)
 * 두 사람의 사주를 비교하여 기본 궁합 정보를 생성
 */

import {
  calculateFourPillars,
  getTenGod,
  HEAVENLY_STEMS_HANJA,
  STEM_ELEMENTS,
} from './saju-calc';
import type { CompatibilityResult } from '../types/api';

// 천간합 테이블: [갑기, 을경, 병신, 정임, 무계]
const STEM_COMBINATIONS: [number, number, string][] = [
  [0, 5, '갑기합(甲己合) — 토(土)로 변화'],
  [1, 6, '을경합(乙庚合) — 금(金)으로 변화'],
  [2, 7, '병신합(丙辛合) — 수(水)로 변화'],
  [3, 8, '정임합(丁壬合) — 목(木)으로 변화'],
  [4, 9, '무계합(戊癸合) — 화(火)로 변화'],
];

// 지지충 테이블
const BRANCH_CLASHES: [number, number][] = [
  [0, 6], // 자오충
  [1, 7], // 축미충
  [2, 8], // 인신충
  [3, 9], // 묘유충
  [4, 10], // 진술충
  [5, 11], // 사해충
];

// 지지육합 테이블
const BRANCH_COMBINES: [number, number, string][] = [
  [0, 1, '자축합(子丑合)'],
  [2, 11, '인해합(寅亥合)'],
  [3, 10, '묘술합(卯戌合)'],
  [4, 9, '진유합(辰酉合)'],
  [5, 8, '사신합(巳申合)'],
  [6, 7, '오미합(午未合)'],
];

const ELEMENT_KO: Record<string, string> = {
  wood: '목(木)', fire: '화(火)', earth: '토(土)', metal: '금(金)', water: '수(水)',
};

const ELEMENT_RELATION: Record<string, Record<string, string>> = {
  wood: { fire: '상생(木生火)', earth: '상극(木剋土)', metal: '상극(金剋木)', water: '상생(水生木)', wood: '비화(同)' },
  fire: { earth: '상생(火生土)', metal: '상극(火剋金)', water: '상극(水剋火)', wood: '상생(木生火)', fire: '비화(同)' },
  earth: { metal: '상생(土生金)', water: '상극(土剋水)', wood: '상극(木剋土)', fire: '상생(火生土)', earth: '비화(同)' },
  metal: { water: '상생(金生水)', wood: '상극(金剋木)', fire: '상극(火剋金)', earth: '상생(土生金)', metal: '비화(同)' },
  water: { wood: '상생(水生木)', fire: '상극(水剋火)', earth: '상극(土剋水)', metal: '상생(金生水)', water: '비화(同)' },
};

function findStemCombination(stem1: number, stem2: number): string | null {
  for (const [a, b, desc] of STEM_COMBINATIONS) {
    if ((stem1 === a && stem2 === b) || (stem1 === b && stem2 === a)) return desc;
  }
  return null;
}

function countBranchClashes(branches1: number[], branches2: number[]): number {
  let count = 0;
  for (const b1 of branches1) {
    for (const b2 of branches2) {
      if (BRANCH_CLASHES.some(([a, b]) => (b1 === a && b2 === b) || (b1 === b && b2 === a))) {
        count++;
      }
    }
  }
  return count;
}

function countBranchCombines(branches1: number[], branches2: number[]): { count: number; names: string[] } {
  const names: string[] = [];
  for (const b1 of branches1) {
    for (const b2 of branches2) {
      const found = BRANCH_COMBINES.find(([a, b]) => (b1 === a && b2 === b) || (b1 === b && b2 === a));
      if (found) names.push(found[2]);
    }
  }
  return { count: names.length, names };
}

/**
 * 로컬 궁합 계산 — API 호출 없이 기본 궁합 결과 생성
 */
export function calculateLocalCompatibility(
  myYear: number, myMonth: number, myDay: number, myHour: number, myGender: string,
  partnerYear: number, partnerMonth: number, partnerDay: number, partnerGender: string,
): CompatibilityResult {
  const my = calculateFourPillars(myYear, myMonth, myDay, myHour);
  const partner = calculateFourPillars(partnerYear, partnerMonth, partnerDay, 12);

  const myDm = my.day.stemIdx;
  const ptDm = partner.day.stemIdx;

  // 1. 일간 관계
  const tenGodAtoB = getTenGod(myDm, ptDm);
  const tenGodBtoA = getTenGod(ptDm, myDm);
  const stemCombo = findStemCombination(myDm, ptDm);

  // 2. 오행 관계
  const myEl = STEM_ELEMENTS[myDm];
  const ptEl = STEM_ELEMENTS[ptDm];
  const elRelation = ELEMENT_RELATION[myEl]?.[ptEl] ?? '';

  // 3. 지지 합충
  const myBranches = [my.year.branchIdx, my.month.branchIdx, my.day.branchIdx, my.hour.branchIdx];
  const ptBranches = [partner.year.branchIdx, partner.month.branchIdx, partner.day.branchIdx, partner.hour.branchIdx];
  const clashes = countBranchClashes(myBranches, ptBranches);
  const combines = countBranchCombines(myBranches, ptBranches);

  // 4. 점수 산출
  let score = 65; // 기본
  if (stemCombo) score += 10; // 천간합이면 +10
  if (elRelation.includes('상생')) score += 5;
  if (elRelation.includes('비화')) score += 2;
  if (elRelation.includes('상극')) score -= 5;
  score += combines.count * 5; // 지지합 하나당 +5
  score -= clashes * 7; // 지지충 하나당 -7
  score = Math.max(35, Math.min(92, score));

  // 5. headline 생성
  const myDmName = HEAVENLY_STEMS_HANJA[myDm];
  const ptDmName = HEAVENLY_STEMS_HANJA[ptDm];
  const myElKo = ELEMENT_KO[myEl];
  const ptElKo = ELEMENT_KO[ptEl];

  let headline = '';
  if (stemCombo) {
    headline = `${myDmName}와 ${ptDmName}의 ${stemCombo.split('—')[0].trim()}`;
  } else if (elRelation.includes('상생')) {
    headline = `${myElKo}과 ${ptElKo}의 상생 — 서로를 키워주는 관계`;
  } else if (elRelation.includes('상극')) {
    headline = `${myElKo}과 ${ptElKo}의 상극 — 강한 끌림과 긴장이 공존하는 관계`;
  } else {
    headline = `${myElKo}과 ${ptElKo}의 비화 — 편안하지만 자극이 부족할 수 있는 관계`;
  }

  // 6. summary (concise)
  let summary = `${myDmName}(${myElKo})과 ${ptDmName}(${ptElKo})의 만남. `;
  if (stemCombo) {
    summary += `천간합으로 자연스러운 끌림이 있는 조합이에요.`;
  } else if (combines.count > 0) {
    summary += `${combines.names[0]}으로 함께하면 편안한 관계예요.`;
  } else if (clashes > 0) {
    summary += `강한 자극을 주고받는 역동적인 관계예요.`;
  } else {
    summary += `서로의 ${tenGodAtoB} 관계로 독특한 에너지를 주고받아요.`;
  }

  const teaser = '싸움 패턴, 결혼 적합도, 월별 궁합까지 상세 분석을 확인해보세요.';

  return {
    overallScore: Math.round(score),
    headline,
    summary,
    teaserForPaid: teaser,
  };
}
