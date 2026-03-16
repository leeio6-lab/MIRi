export interface RouletteItem {
  keyword: { ko: string; en: string; ja: string };
  message: { ko: string; en: string; ja: string };
  color: string;
}

export const ROULETTE_ITEMS: RouletteItem[] = [
  { keyword: { ko: '대박', en: 'Jackpot', ja: '大当たり' }, message: { ko: '이번 주말 뜻밖의 행운이 찾아와요. 복권이든 인연이든, 열린 마음으로.', en: 'Unexpected luck this weekend. Stay open, whether it\'s fortune or fate.', ja: 'この週末、思いがけない幸運が訪れます。心を開いて。' }, color: '#E8B04A' },
  { keyword: { ko: '인연', en: 'Connection', ja: '縁' }, message: { ko: '이번 주말 뜻밖의 만남이 좋은 인연으로 이어질 수 있어요.', en: 'An unexpected encounter this weekend could become a meaningful connection.', ja: 'この週末の思いがけない出会いが良い縁につながるかもしれません。' }, color: '#C75B4A' },
  { keyword: { ko: '성장', en: 'Growth', ja: '成長' }, message: { ko: '이번 주말 배운 것이 다음 주를 완전히 바꿔놓을 수 있어요.', en: 'What you learn this weekend could completely change next week.', ja: 'この週末学んだことが来週を完全に変えるかもしれません。' }, color: '#6B8E5B' },
  { keyword: { ko: '휴식', en: 'Rest', ja: '休息' }, message: { ko: '아무것도 안 하는 게 최고의 선택인 주말이에요. 충전하세요.', en: 'Doing nothing is the best choice this weekend. Recharge.', ja: '何もしないのが最高の選択の週末です。充電してください。' }, color: '#5B8FA8' },
  { keyword: { ko: '결단', en: 'Decision', ja: '決断' }, message: { ko: '주말 동안 내린 결정이 다음 달까지 영향을 미칠 수 있어요.', en: 'A decision made this weekend could affect the next month.', ja: '週末に下した決定が来月まで影響するかもしれません。' }, color: '#C4912E' },
  { keyword: { ko: '모험', en: 'Adventure', ja: '冒険' }, message: { ko: '안 가본 곳, 안 해본 것에서 에너지를 얻는 주말이에요.', en: 'Energy comes from new places and new experiences this weekend.', ja: '行ったことのない場所、やったことのないことからエネルギーをもらう週末です。' }, color: '#8B6BA8' },
  { keyword: { ko: '절약', en: 'Save', ja: '節約' }, message: { ko: '이번 주말 지갑을 꽉 닫으세요. 다음 주에 쓸 곳이 생겨요.', en: 'Keep your wallet closed this weekend. You\'ll need it next week.', ja: 'この週末は財布をしっかり閉じてください。来週使う場所ができます。' }, color: '#888888' },
  { keyword: { ko: '행운', en: 'Lucky', ja: '幸運' }, message: { ko: '이번 주말은 뭘 해도 잘 풀리는 날이에요. 하고 싶은 거 다 하세요.', en: 'Everything goes your way this weekend. Do whatever you want.', ja: 'この週末は何をしてもうまくいく日です。やりたいことを全部やってください。' }, color: '#E8B04A' },
];

export function getRouletteTarget(): number {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return seed % ROULETTE_ITEMS.length;
}
