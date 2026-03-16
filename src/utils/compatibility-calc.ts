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

// ── 궁합 커플 타이틀 (자극적 + 공유하고 싶은 한 줄) ──
const COUPLE_TITLES: Record<string, string> = {
  'earth_earth': '편한 건 좋은데... 심장은 뛰긴 해?',
  'fire_fire':   '소화기 준비하세요, 이 커플 위험합니다',
  'metal_metal': '둘 다 안 지는 성격, 리모컨 전쟁 각오',
  'water_water': '감성 쓰나미, 같이 울다가 사랑에 빠짐',
  'wood_wood':   '고집 x 고집 = 이기면 사랑, 지면 이별',
  'earth_fire':  '불 지르는 놈 + 수습하는 놈 = 찐사랑',
  'earth_metal': '3년은 심심해, 근데 30년은 행복해',
  'fire_wood':   '태우는 사랑, 근데 이게 왜 이렇게 좋지?',
  'metal_water': '겉으론 남남, 문 닫으면 세상에서 제일 다정',
  'water_wood':  '전생에 부부 아니면 설명이 안 되는 케미',
  'earth_wood':  '자꾸 밀어내는데 왜 더 끌리는 거야',
  'fire_metal':  '매일 싸우면서 매일 보고 싶은 미친 궁합',
  'earth_water': '다르니까 미치고, 다르니까 빠지고',
  'metal_wood':  '잔소리꾼 + 반항아 = 의외로 찰떡',
  'fire_water':  '중독 주의보, 빠지면 못 나옴',
};

export function getCoupleTitle(el1: string, el2: string): string {
  const key = [el1, el2].sort().join('_');
  return COUPLE_TITLES[key] ?? '운명의 만남!';
}

// ── 띠 이모지 ──
const ZODIAC_EMOJI: Record<string, string> = {
  '쥐': '🐭', '소': '🐮', '호랑이': '🐯', '토끼': '🐰',
  '용': '🐲', '뱀': '🐍', '말': '🐴', '양': '🐑',
  '원숭이': '🐵', '닭': '🐔', '개': '🐶', '돼지': '🐷',
};
export function getZodiacEmoji(zodiac: string): string {
  return ZODIAC_EMOJI[zodiac] ?? '✨';
}

// ── 궁합 10줄 요약 (긍정+부정 밸런스, 공유용) ──
interface CoupleHooks {
  first: string;   // 첫인상
  charm: string;   // 매력 포인트
  love: string;    // 연애 스타일
  fight: string;   // 싸움 패턴
  jealousy: string; // 질투/집착
  money: string;   // 돈
  bed: string;     // 밤
  family: string;  // 결혼 후
  danger: string;  // 위험 신호
  verdict: string; // 최종 판결
}

const COUPLE_HOOKS: Record<string, CoupleHooks> = {
  'earth_earth': { first: '만나자마자 "이 사람이다" 확신이 옴', charm: '같이 있으면 아무것도 안 해도 행복', love: '연애 아닌 동거 느낌, 3개월 만에 반말', fight: '냉전 시작하면 누가 먼저 말 걸지 치킨게임', jealousy: '질투 안 하는 줄 알았는데 속으로 부글부글', money: '둘 다 짠돌이라 통장 잔고는 늘 안심', bed: '익숙함이 편안함인데, 가끔은 좀 심심할 수 있음', family: '시댁/처가 갈등 제로, 어른들이 제일 좋아할 커플', danger: '편한 게 당연해지면 "이게 사랑이야?" 의문 시작', verdict: '자극은 부족해도 행복 지속력은 S급' },
  'fire_fire':   { first: '눈 마주친 순간 심장에 불이 붙음', charm: '같이 있으면 세상이 놀이공원, 매일이 축제', love: '사귀는 건지 싸우는 건지 본인들도 헷갈림', fight: '접시 날아다니다 갑자기 포옹, 감정의 롤러코스터', jealousy: '질투의 화신 x 2, 카톡 읽씹하면 바로 전쟁', money: '어제 호텔 뷔페, 오늘 편의점 삼각김밥', bed: '소방관도 못 끄는 불, 매일이 신혼여행급', family: '시끌벅적한 가정, 아이들은 활기차게 자람', danger: '열정이 식으면 남는 게 없을 수 있음', verdict: '짧고 굵게 or 평생 불꽃 — 선택은 니 몫' },
  'metal_metal': { first: '서로의 능력에 반함, "이 사람 좀 되는데?"', charm: '말 안 해도 척하면 척, 센스 커플', love: '"너 아니어도 돼" 입으론 그러면서 못 떠남', fight: '삐지면 일주일째 같은 집에서 남남 생활', jealousy: '겉으론 쿨한 척, 속으론 상대 인스타 매일 감시', money: '가계부 대조하다 "이게 뭐야" 싸움 가능', bed: '겉은 냉동실인데 문 닫으면 용광로', family: '효율적 육아, 역할 분담 완벽한 팀', danger: '"미안해" 한마디면 끝나는데 자존심이 발목', verdict: '둘 다 꺾이면 역대급 부부, 안 꺾이면 이혼' },
  'water_water': { first: '만나자마자 전생에 알던 사이 같음', charm: '눈빛만으로 대화 가능, 텔레파시 커플', love: '감정 공유 무한대, 슬플 때 같이 울어줌', fight: '싸우다 둘 다 울어서 뭐가 문제인지 까먹음', jealousy: '질투라기보단 불안, "나 아직 좋아해?" 하루 3회', money: '돈보다 감성이 우선이라 텅장 위험', bed: '분위기 세팅에 진심, 향초 재고 항상 확보', family: '감성 교육 완벽, 근데 학원비 관리는 미지수', danger: '현실 감각 장착 안 하면 같이 침몰', verdict: '로맨스 S급, 현실력만 보강하면 천생연분' },
  'wood_wood':   { first: '첫 대화 3시간, 대화가 끝이 없음', charm: '같이 있으면 서로 레벨업, 성장 부스터', love: '존경하는 사이인데 가끔 연인 맞나 싶음', fight: '새벽 4시까지 토론하다 결국 각자 잠듦', jealousy: '질투보다 경쟁심, "나보다 잘 되면 어쩌지"', money: '둘 다 사업 아이템 있어서 투자금 부족', bed: '계획적이라 즉흥이 없음, 스케줄 잡는 중', family: '교육열 최강 부모, 근데 아이가 숨 막힐 수도', danger: '양보를 약함으로 보는 순간 끝남', verdict: '비전이 같으면 무적, 다르면 라이벌' },
  'earth_fire':  { first: '한쪽이 끌려가는 게 아니라 자연스럽게 스며듦', charm: '한 명이 불 지르면 한 명이 수습해주는 팀워크', love: '주변에서 제일 부러워하는 커플 투표 1등', fight: '화나면 폭발 vs 화나면 묵묵, 의외로 찰떡', jealousy: '불(火) 쪽이 질투하면 토(土) 쪽이 안아줌', money: '버는 사람 따로, 지키는 사람 따로, 완벽 분업', bed: '천천히 타오르는데 한번 붙으면 절대 안 꺼짐', family: '가정에 온기가 넘침, 아이들이 정서적으로 안정', danger: '편한 게 당연해지면 감사함을 잊기 쉬움', verdict: '결혼 적합도 최상위권, 찐으로 추천' },
  'earth_metal': { first: '처음엔 "이 사람 좀 무뚝뚝한데?" 하다가 빠짐', charm: '알면 알수록 보석 발견하는 기분', love: '처음엔 심심한데 3년 차부터 빛이 남', fight: '잔소리 vs 무시, 근데 결국 화해하는 패턴', jealousy: '둘 다 쿨한 척이라 질투 표현이 서툶', money: '부부 재테크 유튜브 찍어도 될 최강 조합', bed: '양보다 질, 느리지만 확실하게', family: '안정적 가정, 노후까지 탄탄한 플랜', danger: '재미 요소 안 넣으면 우정으로 변질 위험', verdict: '10년 뒤 "결혼 잘했다" 할 확률 최상위' },
  'fire_wood':   { first: '만나면 에너지 폭발, 시간이 순삭', charm: '같이 있으면 뭘 해도 재밌고 세상 다 가진 기분', love: '응원하다가 본인이 번아웃, 주는 사랑 과다', fight: '참다 참다 터지면 산불급, 수습에 한 달', jealousy: '"나만 봐" 하는 쪽이 정해져 있음', money: '한 명이 벌면 다른 한 명이 쓰는 구조', bed: '에너지는 넘치는데 타이밍 맞추는 게 관건', family: '활기찬 가정, 근데 한쪽이 계속 희생하면 위험', danger: '태우기만 하고 채워주지 않으면 재만 남음', verdict: '밸런스만 잡으면 최고의 파트너' },
  'metal_water': { first: '겉으로 쿨한 척하다 새벽에 울면서 전화함', charm: '세상에서 제일 차가운 사람이 나 앞에서만 녹음', love: '무장해제 시키는 유일한 사람, 대체 불가', fight: '차갑게 쏘면 눈물로 반격, 결국 금 쪽이 짐', jealousy: '금(金) 쪽 질투는 무언의 압박, 수(水) 쪽은 눈물', money: '계획파 + 분위기파 = 균형 잡힌 살림', bed: '달빛 아래 바다, 로맨틱 농도 최상급', family: '서로 다른 방식으로 아이를 사랑하는 부모', danger: '감정 표현 안 하면 오해가 폭탄처럼 터짐', verdict: '표현만 잘하면 드라마보다 아름다운 실화' },
  'water_wood':  { first: '만나자마자 "우리 전생에 뭐였지?" 느낌', charm: '비타민 커플, 만나면 충전 헤어지면 방전', love: '싸울 일이 없어서 주변이 의심함 "진짜 사귀어?"', fight: '논쟁해도 상처 안 주는 말하는 스킬 보유', jealousy: '질투보다 응원, 건강한 관계의 정석', money: '같이 키우는 자산, 부동산 안목도 좋음', bed: '자연스럽고 편안, 오래갈 스타일 확정', family: '모범 가정 후보 1순위, 교육관도 찰떡', danger: '너무 편해서 연인인지 친구인지 헷갈릴 수 있음', verdict: '행복한 결혼 생활 보장 S급 궁합' },
  'earth_wood':  { first: '설명 안 되는 끌림, "왜 자꾸 생각나지?"', charm: '다른 점이 오히려 매력, 새로운 세계를 열어줌', love: '밀당이 연애의 양념, 절대 지루하지 않음', fight: '의견 충돌 후 오히려 서로를 더 깊이 이해', jealousy: '티 안 내다 터지면 그게 오히려 감동', money: '다른 시각이 합쳐지면 의외의 재테크 조합', bed: '예측 불가능한 게 최고의 스파크', family: '다양한 관점이 아이를 넓게 키울 수 있음', danger: '있는 그대로 인정해주는 연습하기', verdict: '다름이 매력인 운명적 조합' },
  'fire_metal':  { first: '첫 만남에 전기 흐름, 이건 운명이 맞음', charm: '극과 극이라 매일이 새롭고 절대 안 질림', love: '영화보다 드라마틱한 진짜 러브스토리', fight: '부딪혀도 결국 더 단단해지는 관계', jealousy: '질투할 때 솔직해지면 오히려 더 가까워짐', money: '다른 관점이 합쳐져서 최적의 재무 균형', bed: '뜨거움과 차가움의 중독적인 조합', family: '서로 다른 교육 스타일이 아이에게 균형', danger: '다른 걸 틀린 거로 보지 않는 연습', verdict: '서로 인정하면 전설이 될 커플' },
  'earth_water': { first: '알수록 빠지는 타입, 처음엔 몰랐던 매력 발견', charm: '서로 없는 걸 채워줌, 퍼즐의 마지막 조각', love: '다른 만큼 배울 게 많은 풍성한 관계', fight: '대화법만 맞추면 싸울 일이 확 줄어듦', jealousy: '표현 방식이 달라서 그렇지, 사랑의 깊이는 같음', money: '안정 + 모험의 조합이 의외로 수익률 좋음', bed: '매번 다른 느낌, 오래 함께해도 신선함', family: '안정과 유연함이 공존하는 이상적 가정', danger: '소통 방식 차이를 이해하려는 마음 갖기', verdict: '노력한 만큼 열매 맺는 가성비 최고 궁합' },
  'metal_wood':  { first: '"좀 독특한데?" 호기심이 사랑으로 변하는 순간', charm: '함께하면 서로 더 나은 사람으로 성장', love: '솔직한 게 사랑의 증거, 이해하면 감동', fight: '할 말 다 하는 사이, 돌려 말 안 해서 오히려 편함', jealousy: '무관심한 척하다 은근 챙기는 갭 매력', money: '실용 + 창의 조합으로 알뜰살뜰 잘 삶', bed: '긴장감이 만드는 의외의 케미', family: '각자의 장점으로 균형 잡힌 육아', danger: '칭찬 한마디가 관계의 비타민', verdict: '서로를 다듬어 보석으로 만드는 궁합' },
  'fire_water':  { first: '눈 마주치면 심장 멈춤, 이건 운명이다', charm: '"이 사람만큼 나를 이해하는 사람은 없다"', love: '끌림의 강도가 우주급, 한번 빠지면 올인', fight: '부딪혀도 결국 돌아옴, 서로 없으면 안 되니까', jealousy: '둘 다 진심이라 질투도 진심, 그게 사랑의 증거', money: '각자 통장 유지하면 오히려 자유롭고 좋음', bed: '뜨겁고 차갑고 다시 뜨겁고, 중독성 만점', family: '드라마틱하지만 사랑 넘치는 가정', danger: '감정에 올인할 때 숨 고르기 한번', verdict: '운명이면 전설이 될 사랑, 놓치지 마세요' },
};

export interface CompatOverview extends CoupleHooks {
  coupleTitle: string;
  myZodiac: string;
  myZodiacEmoji: string;
  ptZodiac: string;
  ptZodiacEmoji: string;
  elRelation: string; // 상생/상극/비화
}

export function getCompatOverview(
  myEl: string, ptEl: string,
  myZodiac: string, ptZodiac: string,
): CompatOverview {
  const key = [myEl, ptEl].sort().join('_');
  const hooks = COUPLE_HOOKS[key] ?? {
    first: '첫 만남부터 뭔가 통하는 느낌',
    charm: '같이 있으면 시간이 순삭',
    love: '끌림은 확실한 관계',
    fight: '싸우면 둘 다 할 말 많은 스타일',
    jealousy: '질투는 사랑의 바로미터',
    money: '돈 앞에선 솔직해지는 사이',
    bed: '함께라서 의미 있는 밤',
    family: '결혼하면 의외로 잘 맞을 수도',
    danger: '서로 다른 점을 인정하는 게 핵심',
    verdict: '노력한 만큼 보상받는 관계',
  };

  const rel = myEl === ptEl ? '비화' :
    (ELEMENT_RELATION[myEl]?.[ptEl]?.includes('상생') ? '상생' : '상극');

  return {
    coupleTitle: COUPLE_TITLES[key] ?? '운명의 만남!',
    ...hooks,
    myZodiac, myZodiacEmoji: getZodiacEmoji(myZodiac),
    ptZodiac, ptZodiacEmoji: getZodiacEmoji(ptZodiac),
    elRelation: rel,
  };
}

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
  partnerYear: number, partnerMonth: number, partnerDay: number, partnerHour: number, partnerGender: string,
  myIsLunar?: boolean, partnerIsLunar?: boolean,
): CompatibilityResult {
  const my = calculateFourPillars(myYear, myMonth, myDay, myHour, undefined, undefined, undefined, myIsLunar);
  const partner = calculateFourPillars(partnerYear, partnerMonth, partnerDay, partnerHour, undefined, undefined, undefined, partnerIsLunar);

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

  // 5. headline 생성 — 직관적 커플 타이틀
  const myDmName = HEAVENLY_STEMS_HANJA[myDm];
  const ptDmName = HEAVENLY_STEMS_HANJA[ptDm];
  const myElKo = ELEMENT_KO[myEl];
  const ptElKo = ELEMENT_KO[ptEl];

  const headline = getCoupleTitle(myEl, ptEl);

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
