type I18nText = { ko: string; en: string; ja: string };

export const TEN_GOD_TIPS: Record<string, {
  do: I18nText;
  dont: I18nText;
  mood: I18nText;
}> = {
  '비견': {
    do: { ko: '함께하면 두 배! 협력하세요', en: 'Better together — collaborate today', ja: '一緒なら二倍！協力しましょう' },
    dont: { ko: '혼자 독식하려 하면 잃어요', en: 'Trying to take all will lose all', ja: '独り占めしようとすると失います' },
    mood: { ko: '경쟁심이 올라오는 날', en: 'A competitive day', ja: '競争心が高まる日' },
  },
  '겁재': {
    do: { ko: '적극적으로 나서세요', en: 'Take initiative boldly', ja: '積極的に動きましょう' },
    dont: { ko: '충동 지출은 내일 후회해요', en: "Impulse spending = tomorrow's regret", ja: '衝動買いは明日後悔します' },
    mood: { ko: '에너지 넘치는 날', en: 'An energetic day', ja: 'エネルギー溢れる日' },
  },
  '식신': {
    do: { ko: '맛있는 것 먹고 기운 충전!', en: 'Recharge with good food!', ja: '美味しいものでパワーチャージ！' },
    dont: { ko: '과식하면 오후가 무거워요', en: 'Overeating will weigh you down', ja: '食べ過ぎると午後が重くなります' },
    mood: { ko: '여유로운 감성의 날', en: 'A relaxed, creative day', ja: 'ゆったりとした感性の日' },
  },
  '상관': {
    do: { ko: '하고 싶은 말을 하세요', en: 'Speak your mind today', ja: '言いたいことを言いましょう' },
    dont: { ko: '상사·어른에겐 한 템포 쉬고', en: 'Pause before speaking to superiors', ja: '上司・年長者には一拍置いて' },
    mood: { ko: '표현력이 폭발하는 날', en: 'An expressive day', ja: '表現力が爆発する日' },
  },
  '편재': {
    do: { ko: '돈 되는 정보에 귀 기울이세요', en: 'Pay attention to money-making info', ja: 'お金になる情報に耳を傾けて' },
    dont: { ko: '확인 안 된 투자는 위험해요', en: 'Unverified investments are risky', ja: '確認されていない投資は危険' },
    mood: { ko: '재물운이 움직이는 날', en: 'Money energy is flowing', ja: '財運が動く日' },
  },
  '정재': {
    do: { ko: '가계부 정리하기 좋은 날', en: 'Great day to organize finances', ja: '家計簿整理に良い日' },
    dont: { ko: '큰 돈 쓸 때는 하루 미루세요', en: 'Delay big purchases by one day', ja: '大きな出費は一日遅らせて' },
    mood: { ko: '안정과 축적의 날', en: 'A day of stability', ja: '安定と蓄積の日' },
  },
  '편관': {
    do: { ko: '밀린 일을 과감히 처리하세요', en: 'Tackle pending tasks decisively', ja: '溜まった仕事を大胆に片付けて' },
    dont: { ko: '감정적 충돌은 손해만 남아요', en: 'Emotional clashes only leave damage', ja: '感情的な衝突は損だけが残る' },
    mood: { ko: '강한 추진력의 날', en: 'A day of strong drive', ja: '強い推進力の日' },
  },
  '정관': {
    do: { ko: '약속과 규칙을 잘 지키세요', en: 'Honor your commitments today', ja: '約束とルールをしっかり守って' },
    dont: { ko: '편법은 부메랑으로 돌아와요', en: 'Shortcuts come back as boomerangs', ja: '近道はブーメランで返ってくる' },
    mood: { ko: '질서와 신뢰의 날', en: 'A day of order and trust', ja: '秩序と信頼の日' },
  },
  '편인': {
    do: { ko: '새로운 걸 배워보세요', en: 'Learn something new today', ja: '新しいことを学びましょう' },
    dont: { ko: '너무 깊이 생각하면 결정 못 해요', en: 'Overthinking prevents decisions', ja: '考えすぎると決断できません' },
    mood: { ko: '직감이 살아있는 날', en: 'A day of strong intuition', ja: '直感が冴える日' },
  },
  '정인': {
    do: { ko: '책 한 페이지, 강의 하나 들으세요', en: 'Read a page or watch a lecture', ja: '本を一ページ、講義を一つ' },
    dont: { ko: '게으름의 유혹에 넘어가지 마세요', en: "Don't give in to laziness", ja: '怠けの誘惑に負けないで' },
    mood: { ko: '지적 호기심의 날', en: 'A day of intellectual curiosity', ja: '知的好奇心の日' },
  },
};

export const ZODIAC_INFO = [
  { name: '쥐', emoji: '🐭', nameEn: 'Rat', nameJa: 'ねずみ' },
  { name: '소', emoji: '🐮', nameEn: 'Ox', nameJa: 'うし' },
  { name: '호랑이', emoji: '🐯', nameEn: 'Tiger', nameJa: 'とら' },
  { name: '토끼', emoji: '🐰', nameEn: 'Rabbit', nameJa: 'うさぎ' },
  { name: '용', emoji: '🐲', nameEn: 'Dragon', nameJa: 'たつ' },
  { name: '뱀', emoji: '🐍', nameEn: 'Snake', nameJa: 'へび' },
  { name: '말', emoji: '🐴', nameEn: 'Horse', nameJa: 'うま' },
  { name: '양', emoji: '🐑', nameEn: 'Sheep', nameJa: 'ひつじ' },
  { name: '원숭이', emoji: '🐵', nameEn: 'Monkey', nameJa: 'さる' },
  { name: '닭', emoji: '🐔', nameEn: 'Rooster', nameJa: 'とり' },
  { name: '개', emoji: '🐶', nameEn: 'Dog', nameJa: 'いぬ' },
  { name: '돼지', emoji: '🐷', nameEn: 'Pig', nameJa: 'いのしし' },
];

// 삼합 (Three Harmony groups by earthly branch index)
const SAMHAP: number[][] = [
  [8, 0, 4],   // 申子辰 (원숭이-쥐-용)
  [9, 1, 5],   // 酉丑巳 (닭-소-뱀)
  [2, 6, 10],  // 寅午戌 (호랑이-말-개)
  [3, 7, 11],  // 卯未亥 (토끼-양-돼지)
];

// 상충 (Clash pairs)
const CLASH: [number, number][] = [
  [0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11],
];

export function getTodayBranchIdx(): number {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth() + 1;
  const d = today.getDate();
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  const jdn = d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
  // 2000-01-01 (JDN 2451545) = 庚辰 → branch index 4
  return ((jdn - 2451545 + 4) % 12 + 12) % 12;
}

export function getTodayZodiacMatch(todayBranch: number) {
  const harmonyGroup = SAMHAP.find(g => g.includes(todayBranch));
  const harmonyIdxs = harmonyGroup ? harmonyGroup.filter(i => i !== todayBranch) : [];
  const clashPair = CLASH.find(([a, b]) => a === todayBranch || b === todayBranch);
  const clashIdx = clashPair ? (clashPair[0] === todayBranch ? clashPair[1] : clashPair[0]) : -1;

  return {
    today: ZODIAC_INFO[todayBranch],
    lucky: harmonyIdxs.map(i => ZODIAC_INFO[i]),
    caution: clashIdx >= 0 ? ZODIAC_INFO[clashIdx] : null,
  };
}

export function getFortuneGrade(score: number): { label: string; color: string } {
  if (score >= 90) return { label: '大吉', color: '#D4A82A' };
  if (score >= 80) return { label: '吉', color: '#4A9E6E' };
  if (score >= 60) return { label: '小吉', color: '#B59530' };
  if (score >= 40) return { label: '平', color: '#8E8E93' };
  return { label: '凶', color: '#E85D4A' };
}
