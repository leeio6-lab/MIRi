import { OVERVIEW_TEMPLATES, YEARLY_TEMPLATES, LIFE_PEAK_TEMPLATES, LIFE_DIRECTION_TEMPLATES, OverviewCategory, OverviewCategoryBase, SipsinTag } from '../constants/overviewTemplates';

// Issue 1: Module-level cache to track last used sentence index per tag+category
// Ensures 3-sentence rotation within a reasonable period
const lastUsedIndices = new Map<string, number>();

interface SipsinStrength {
  비겁: number;
  식상: number;
  재성: number;
  관성: number;
  인성: number;
  겁재있음: boolean;
  도화살있음: boolean;
}

/**
 * FullSajuAnalysis.tenGods에서 십신 강약을 산출.
 * tenGods: { yearStem, monthStem, dayStem, hourStem, yearBranch, monthBranch, dayBranch, hourBranch }
 * 모두 한글 (비견, 겁재, 식신, 상관, 편재, 정재, 편관, 정관, 편인, 정인)
 */
export function getSipsinStrength(tenGods: Record<string, string>, spiritStars?: Record<string, string>): SipsinStrength {
  const allGods = Object.values(tenGods).filter(Boolean);

  const count = (names: string[]) => allGods.filter(t => names.includes(t)).length;

  // 도화살 체크: spiritStars 값 중 '도화' 포함 여부
  let 도화살 = false;
  if (spiritStars) {
    도화살 = Object.values(spiritStars).some(v => typeof v === 'string' && v.includes('도화'));
  }

  return {
    비겁: count(['비견', '겁재']),
    식상: count(['식신', '상관']),
    재성: count(['편재', '정재']),
    관성: count(['편관', '정관']),
    인성: count(['편인', '정인']),
    겁재있음: allGods.includes('겁재'),
    도화살있음: 도화살,
  };
}

/**
 * 십신 강약에서 카테고리별 최적 태그 결정
 */
export function determineTags(strength: SipsinStrength): Record<OverviewCategoryBase, SipsinTag> {
  const { 비겁, 식상, 재성, 관성, 인성, 겁재있음, 도화살있음 } = strength;

  const 비겁강 = 비겁 >= 2;
  const 비겁약 = 비겁 === 0;
  const 식상강 = 식상 >= 2;
  const 식상약 = 식상 === 0;
  const 재성강 = 재성 >= 2;
  const 재성약 = 재성 === 0;
  const 관성강 = 관성 >= 2;
  const 관성약 = 관성 === 0;
  const 인성강 = 인성 >= 2;
  const 인성약 = 인성 === 0;

  // Issue 2: Balanced saju fallback — when no strong pattern detected,
  // pick the sipsin with the highest count. If truly tied, rotate by category hash.
  const sipsinEntries: [string, number][] = [
    ['비겁', 비겁], ['식상', 식상], ['재성', 재성], ['관성', 관성], ['인성', 인성],
  ];

  function balancedFallback(category: string): SipsinTag {
    const maxCount = Math.max(...sipsinEntries.map(([, c]) => c));
    const topSipsin = sipsinEntries.filter(([, c]) => c === maxCount);
    // If multiple tied at max, rotate based on category name hash
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = ((hash << 5) - hash + category.charCodeAt(i)) | 0;
    }
    const picked = topSipsin[Math.abs(hash) % topSipsin.length];
    return `${picked[0]}강` as SipsinTag;
  }

  // 카테고리별 핵심 십신이 다름
  // personality: 비겁 > 인성 > 식상 우선
  // career: 관성 > 식상 > 재성 우선
  // wealth: 재성 > 겁재 > 식상 우선
  // love: 도화살 > 재성 > 비겁 우선
  // health: 관성(스트레스) > 비겁(과로) > 식상(소화기) 우선
  // family: 인성 > 비겁 > 관성 우선
  // social: 식상 > 비겁 > 인성 우선

  function pickPersonality(): SipsinTag {
    if (비겁강 && 식상강) return '비겁강+식상강';
    if (비겁강 && 관성강) return '비겁강+관성강';
    if (비겁강 && 재성약) return '비겁강+재성약';
    if (인성강 && 비겁강) return '인성강+비겁강';
    if (인성강 && 식상약) return '인성강+식상약';
    if (비겁약 && 관성강) return '비겁약+관성강';
    if (관성강 && 인성강) return '관성강+인성강';
    if (식상강 && 인성약) return '식상강+인성약';
    if (식상강 && 관성약) return '식상강+관성약';
    if (비겁강) return '비겁강';
    if (비겁약) return '비겁약';
    if (인성강) return '인성강';
    if (인성약) return '인성약';
    if (식상강) return '식상강';
    if (식상약) return '식상약';
    if (관성강) return '관성강';
    if (관성약) return '관성약';
    if (재성강) return '재성강';
    if (재성약) return '재성약';
    return balancedFallback('personality');
  }

  function pickCareer(): SipsinTag {
    if (관성강 && 인성강) return '관성강+인성강';
    if (비겁강 && 관성강) return '비겁강+관성강';
    if (식상강 && 관성약) return '식상강+관성약';
    if (식상강 && 재성강) return '식상강+재성강';
    if (재성강 && 관성강) return '재성강+관성강';
    if (비겁강 && 재성약) return '비겁강+재성약';
    if (인성강 && 식상약) return '인성강+식상약';
    if (비겁약 && 관성강) return '비겁약+관성강';
    if (관성약 && 재성강) return '관성약+재성강';
    if (재성약 && 식상강) return '재성약+식상강';
    if (관성강) return '관성강';
    if (관성약) return '관성약';
    if (식상강) return '식상강';
    if (식상약) return '식상약';
    if (비겁강) return '비겁강';
    if (비겁약) return '비겁약';
    if (재성강) return '재성강';
    if (재성약) return '재성약';
    if (인성강) return '인성강';
    if (인성약) return '인성약';
    return balancedFallback('career');
  }

  function pickWealth(): SipsinTag {
    if (재성강 && 겁재있음) return '재성강+겁재있음';
    if (재성강 && 관성강) return '재성강+관성강';
    if (식상강 && 재성강) return '식상강+재성강';
    if (비겁강 && 재성약) return '비겁강+재성약';
    if (재성약 && 식상강) return '재성약+식상강';
    if (관성약 && 재성강) return '관성약+재성강';
    if (인성강 && 비겁강) return '인성강+비겁강';
    if (관성강 && 인성강) return '관성강+인성강';
    if (식상강 && 인성약) return '식상강+인성약';
    if (재성강) return '재성강';
    if (재성약) return '재성약';
    if (식상강) return '식상강';
    if (식상약) return '식상약';
    if (비겁강) return '비겁강';
    if (비겁약) return '비겁약';
    if (관성강) return '관성강';
    if (인성강) return '인성강';
    return balancedFallback('wealth');
  }

  function pickLove(): SipsinTag {
    if (도화살있음) return '도화살있음';
    if (비겁강 && 관성강) return '비겁강+관성강';
    if (식상강 && 관성약) return '식상강+관성약';
    if (비겁강 && 식상강) return '비겁강+식상강';
    if (인성강 && 식상약) return '인성강+식상약';
    if (재성강 && 겁재있음) return '재성강+겁재있음';
    if (관성강 && 인성강) return '관성강+인성강';
    if (비겁약 && 관성강) return '비겁약+관성강';
    if (비겁강 && 재성약) return '비겁강+재성약';
    if (재성강 && 관성강) return '재성강+관성강';
    if (비겁강) return '비겁강';
    if (비겁약) return '비겁약';
    if (식상강) return '식상강';
    if (식상약) return '식상약';
    if (관성강) return '관성강';
    if (관성약) return '관성약';
    if (인성강) return '인성강';
    if (인성약) return '인성약';
    if (재성강) return '재성강';
    if (재성약) return '재성약';
    return balancedFallback('love');
  }

  function pickHealth(): SipsinTag {
    if (관성강 && 인성강) return '관성강+인성강';
    if (재성강 && 관성강) return '재성강+관성강';
    if (비겁강 && 관성강) return '비겁강+관성강';
    if (비겁강 && 식상강) return '비겁강+식상강';
    if (식상강 && 관성약) return '식상강+관성약';
    if (비겁약 && 관성강) return '비겁약+관성강';
    if (재성강 && 겁재있음) return '재성강+겁재있음';
    if (관성강) return '관성강';
    if (식상강) return '식상강';
    if (비겁강) return '비겁강';
    if (인성강) return '인성강';
    if (인성약) return '인성약';
    if (비겁약) return '비겁약';
    if (재성강) return '재성강';
    if (재성약) return '재성약';
    return balancedFallback('health');
  }

  function pickFamily(): SipsinTag {
    if (인성강 && 비겁강) return '인성강+비겁강';
    if (관성강 && 인성강) return '관성강+인성강';
    if (비겁강 && 관성강) return '비겁강+관성강';
    if (비겁강 && 식상강) return '비겁강+식상강';
    if (비겁강 && 재성약) return '비겁강+재성약';
    if (비겁약 && 관성강) return '비겁약+관성강';
    if (재성강 && 겁재있음) return '재성강+겁재있음';
    if (식상강 && 인성약) return '식상강+인성약';
    if (인성강) return '인성강';
    if (비겁강) return '비겁강';
    if (비겁약) return '비겁약';
    if (식상강) return '식상강';
    if (식상약) return '식상약';
    if (관성강) return '관성강';
    if (관성약) return '관성약';
    if (재성강) return '재성강';
    if (재성약) return '재성약';
    return balancedFallback('family');
  }

  function pickSocial(): SipsinTag {
    if (도화살있음) return '도화살있음';
    if (비겁강 && 식상강) return '비겁강+식상강';
    if (식상강 && 관성약) return '식상강+관성약';
    if (식상강 && 재성강) return '식상강+재성강';
    if (비겁약 && 관성강) return '비겁약+관성강';
    if (관성강 && 인성강) return '관성강+인성강';
    if (인성강 && 식상약) return '인성강+식상약';
    if (비겁강 && 재성약) return '비겁강+재성약';
    if (식상강) return '식상강';
    if (식상약) return '식상약';
    if (비겁강) return '비겁강';
    if (비겁약) return '비겁약';
    if (인성강) return '인성강';
    if (관성강) return '관성강';
    if (관성약) return '관성약';
    if (재성강) return '재성강';
    return balancedFallback('social');
  }

  return {
    personality: pickPersonality(),
    career: pickCareer(),
    wealth: pickWealth(),
    love: pickLove(),
    health: pickHealth(),
    family: pickFamily(),
    social: pickSocial(),
  };
}

/**
 * 십신 태그에 맞는 문장을 결정적 랜덤으로 선택.
 * 같은 날 + 같은 사주 = 같은 결과.
 */
export function getOverviewFromTenGods(
  tenGods: Record<string, string>,
  spiritStars?: Record<string, string>,
  pillarInfo?: { yongShinElement?: string; peakDaeunAge?: number },
): Record<string, string> {
  const strength = getSipsinStrength(tenGods, spiritStars);
  const tags = determineTags(strength);

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('[Overview] 십신 강약:', {
      비겁: strength.비겁,
      식상: strength.식상,
      재성: strength.재성,
      관성: strength.관성,
      인성: strength.인성,
      겁재있음: strength.겁재있음,
      도화살있음: strength.도화살있음,
    });
    console.log('[Overview] 선택된 태그:', tags);
  }

  // 사주 + 날짜 기반 고유 seed (같은 사주라도 매번 다른 결과)
  const godStr = Object.values(tenGods).join('');
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const seedInput = godStr + dateStr;
  let sajuHash = 0;
  for (let i = 0; i < seedInput.length; i++) {
    sajuHash = ((sajuHash << 5) - sajuHash + seedInput.charCodeAt(i)) | 0;
  }
  const seed = Math.abs(sajuHash);

  const result: Record<string, string> = {};

  // 7개: 십신 태그 → 템플릿 매칭
  const categories: OverviewCategoryBase[] = ['personality', 'career', 'wealth', 'love', 'health', 'family', 'social'];
  for (const cat of categories) {
    const tag = tags[cat];
    const pool = OVERVIEW_TEMPLATES[cat]?.[tag];
    if (pool && pool.length > 0) {
      let idx = (seed + cat.charCodeAt(0)) % pool.length;
      // Rotation guarantee: avoid repeating the same sentence as last time
      const cacheKey = `${cat}:${tag}`;
      const lastIdx = lastUsedIndices.get(cacheKey);
      if (lastIdx === idx && pool.length > 1) {
        idx = (idx + 1) % pool.length;
      }
      lastUsedIndices.set(cacheKey, idx);
      result[cat] = pool[idx];
    } else {
      const fallbackTag = tag.split('+')[0] as SipsinTag;
      const fallbackPool = OVERVIEW_TEMPLATES[cat]?.[fallbackTag];
      result[cat] = fallbackPool?.[0] ?? '';
    }
  }

  // 3개: 용신 오행 + 피크 나이 → 템플릿 매칭
  const yongShinEl = pillarInfo?.yongShinElement ?? 'earth';
  const peakAge = pillarInfo?.peakDaeunAge ?? 50;

  // yearly: 용신 오행
  const yearlyPool = YEARLY_TEMPLATES[yongShinEl] ?? YEARLY_TEMPLATES.earth;
  result.yearly = yearlyPool[seed % yearlyPool.length];

  // lifePeak: 피크 나이
  const peakCategory = peakAge <= 30 ? 'early' : peakAge <= 50 ? 'mid' : 'late';
  const peakPool = LIFE_PEAK_TEMPLATES[peakCategory];
  result.lifePeak = peakPool[seed % peakPool.length];

  // lifeDirection: 용신 오행
  const dirPool = LIFE_DIRECTION_TEMPLATES[yongShinEl] ?? LIFE_DIRECTION_TEMPLATES.earth;
  result.lifeDirection = dirPool[(seed + 7) % dirPool.length];

  return result;
}

/**
 * sipsinSummary 문자열 생성 (서버 프롬프트용)
 */
export function getSipsinSummary(tenGods: Record<string, string>, spiritStars?: Record<string, string>): string {
  const s = getSipsinStrength(tenGods, spiritStars);
  let summary = `비겁${s.비겁}개, 식상${s.식상}개, 재성${s.재성}개, 관성${s.관성}개, 인성${s.인성}개`;
  if (s.겁재있음) summary += ', 겁재있음';
  if (s.도화살있음) summary += ', 도화살있음';
  return summary;
}
