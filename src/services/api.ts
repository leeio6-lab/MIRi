import { supabase, supabaseUrl, supabaseAnonKey } from './supabase';
import type { SajuInput, SajuResult, FaceResult, CompatibilityResult, DailyFortune } from '../types/api';
import type { AnalysisMode } from '../stores/userStore';
import type { FourPillarsCalc } from '../utils/saju-calc';
import { calculateDaeun, calculateMonthlyFortune, calculateYearlyFortune } from '../utils/saju-calc';

// ─── Rate Limiter ───
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMITS: Record<string, { maxCalls: number; windowMs: number }> = {
  'saju':           { maxCalls: 5,  windowMs: 60_000 },
  'compatibility':  { maxCalls: 5,  windowMs: 60_000 },
  'face-transform': { maxCalls: 3,  windowMs: 60_000 },
  'daily-fortune':  { maxCalls: 10, windowMs: 60_000 },
};

function checkRateLimit(functionName: string): void {
  const limit = RATE_LIMITS[functionName];
  if (!limit) return;

  const now = Date.now();
  const calls = rateLimitMap.get(functionName) ?? [];
  const recent = calls.filter((t) => now - t < limit.windowMs);

  if (recent.length >= limit.maxCalls) {
    throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
  }

  recent.push(now);
  rateLimitMap.set(functionName, recent);
}

// ─── Auth Token Cache (avoid async getSession on every API call) ───
let _cachedToken: string | null = null;
let _tokenFetchedAt = 0;
const TOKEN_CACHE_MS = 60_000; // 1분 캐시

async function getAuthToken(): Promise<string> {
  const now = Date.now();
  if (_cachedToken && now - _tokenFetchedAt < TOKEN_CACHE_MS) return _cachedToken;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      _cachedToken = session.access_token;
      _tokenFetchedAt = now;
      return _cachedToken;
    }
  } catch { /* use anon key */ }
  return supabaseAnonKey;
}

const invokeFunction = async <T>(functionName: string, body: Record<string, unknown>): Promise<T> => {
  checkRateLimit(functionName);

  // 캐시된 토큰 사용 (매번 async getSession 호출 방지)
  const token = await getAuthToken();

  if (__DEV__) console.log(`[API] ${functionName}: url=${supabaseUrl ? 'OK' : 'EMPTY'}, key=${supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'EMPTY'}, token=${token ? token.substring(0, 20) + '...' : 'EMPTY'}`);

  const url = `${supabaseUrl}/functions/v1/${functionName}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let serverMsg = '';
    try {
      const errBody = await response.json();
      serverMsg = errBody?.error ?? errBody?.details ?? '';
    } catch { /* ignore */ }
    const detail = serverMsg ? `: ${serverMsg}` : '';
    if (__DEV__) console.error(`[API] ${functionName} error (${response.status}):`, detail);
    throw new Error(`서버 오류 (${response.status})${detail}`);
  }

  return await response.json() as T;
};

export interface FaceTransformResponse {
  transformedImage: string | null;
  analysis: FaceResult | null;
  analysisError?: string | null;
  transformError: string | null;
  noFace?: boolean;
  reason?: string;
  // API가 직접 결과를 반환하는 경우
  overallScore?: number;
  summary?: string;
  features?: any[];
}

// Element name mapping for pillar formatting
const STEM_ELEMENT_NAMES: Record<string, string> = {
  '갑': '갑목(甲木)', '을': '을목(乙木)',
  '병': '병화(丙火)', '정': '정화(丁火)',
  '무': '무토(戊土)', '기': '기토(己土)',
  '경': '경금(庚金)', '신': '신금(辛金)',
  '임': '임수(壬水)', '계': '계수(癸水)',
};

// 오행 상생/상극 관계
const ELEMENT_GENERATES: Record<string, string> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
const ELEMENT_CONTROLS: Record<string, string> = { wood: 'earth', fire: 'metal', earth: 'water', metal: 'wood', water: 'fire' };
const ELEMENT_CONTROLLED_BY: Record<string, string> = { wood: 'metal', fire: 'water', earth: 'wood', metal: 'fire', water: 'earth' };
const ELEMENT_KO: Record<string, string> = { wood: '목(木)', fire: '화(火)', earth: '토(土)', metal: '금(金)', water: '수(水)' };

// 천간 오행 매핑
const STEM_TO_ELEMENT: Record<string, string> = {
  '갑': 'wood', '을': 'wood', '병': 'fire', '정': 'fire',
  '무': 'earth', '기': 'earth', '경': 'metal', '신': 'metal',
  '임': 'water', '계': 'water',
};

// 월지가 일간을 생하거나 같은 오행인지 (왕상 판단)
const BRANCH_SEASON_ELEMENT: Record<string, string> = {
  '인': 'wood', '묘': 'wood', '진': 'earth',
  '사': 'fire', '오': 'fire', '미': 'earth',
  '신': 'metal', '유': 'metal', '술': 'earth',
  '해': 'water', '자': 'water', '축': 'earth',
};

/**
 * 신강/신약 판단 + 용신 계산
 * 억부법 기반: 일간의 세력(인비) vs 식재관 세력 비교
 */
function analyzeStrengthAndYongShin(pillars: FourPillarsCalc) {
  const dayElement = STEM_TO_ELEMENT[pillars.day.stem];
  const balance = pillars.elementBalance;

  // 일간과 같은 오행(비겁) + 일간을 생하는 오행(인성) = 일간 세력
  const generatesDay = Object.entries(ELEMENT_GENERATES).find(([, v]) => v === dayElement)?.[0] ?? '';
  const dayForce = (balance[dayElement as keyof typeof balance] ?? 0) + (balance[generatesDay as keyof typeof balance] ?? 0);

  // 식상 + 재성 + 관성 = 반대 세력
  const oppositeForce = 100 - dayForce;

  // 월지 생왕 여부
  const monthElement = BRANCH_SEASON_ELEMENT[pillars.month.branch];
  const monthSupports = monthElement === dayElement || ELEMENT_GENERATES[monthElement] === dayElement;

  const isStrong = dayForce >= 40 || (dayForce >= 30 && monthSupports);
  const strength = isStrong ? '신강(身强)' : '신약(身弱)';

  // 용신 결정 (억부법)
  let yongShin: string;
  let yongShinReason: string;

  if (isStrong) {
    // 신강: 설기(식상=일간이 생하는 오행), 극(관성=일간을 극하는 오행), 재성(일간이 극하는 오행)
    const controlledBy = ELEMENT_CONTROLLED_BY[dayElement]; // 일간을 극하는 오행 (관성)
    const dayGenerates = ELEMENT_GENERATES[dayElement];     // 일간이 생하는 오행 (식상)
    const dayControls = ELEMENT_CONTROLS[dayElement];       // 일간이 극하는 오행 (재성)

    // 조후법 보완: 여름(사오미)에 태어난 화 → 수가 급선무
    if (dayElement === 'fire' && ['사', '오', '미'].includes(pillars.month.branch)) {
      yongShin = 'water';
      yongShinReason = `억부법+조후법: ${strength}이고 여름 생이라 화가 과다. 수(水)로 열기를 식혀야 합니다.`;
    } else if (dayElement === 'water' && ['해', '자', '축'].includes(pillars.month.branch)) {
      yongShin = 'fire';
      yongShinReason = `억부법+조후법: ${strength}이고 겨울 생이라 수가 과다. 화(火)로 온기를 보충해야 합니다.`;
    } else {
      // 가장 부족한 식재관 중 하나를 용신으로
      const candidates = [
        { el: controlledBy, score: balance[controlledBy as keyof typeof balance] ?? 0, role: '관성' },
        { el: dayGenerates, score: balance[dayGenerates as keyof typeof balance] ?? 0, role: '식상' },
        { el: dayControls, score: balance[dayControls as keyof typeof balance] ?? 0, role: '재성' },
      ];
      candidates.sort((a, b) => a.score - b.score);
      yongShin = candidates[0].el;
      yongShinReason = `억부법: ${strength}이므로 강한 일간을 설기/극해야 합니다. ${candidates[0].role}인 ${ELEMENT_KO[yongShin]}이 가장 필요합니다.`;
    }
  } else {
    // 신약: 생부(인성=일간을 생하는 오행), 비조(비겁=같은 오행)
    const generates = generatesDay; // 일간을 생하는 오행 (인성)

    if (dayElement === 'fire' && ['해', '자', '축'].includes(pillars.month.branch)) {
      yongShin = 'wood';
      yongShinReason = `억부법+조후법: ${strength}이고 겨울 생이라 화가 약함. 목(木)으로 생화(生火)해야 합니다.`;
    } else if (dayElement === 'water' && ['사', '오', '미'].includes(pillars.month.branch)) {
      yongShin = 'metal';
      yongShinReason = `억부법+조후법: ${strength}이고 여름 생이라 수가 약함. 금(金)으로 생수(生水)해야 합니다.`;
    } else {
      // 인성과 비겁 중 더 부족한 것을 용신으로
      const inScore = balance[generates as keyof typeof balance] ?? 0;
      const biScore = balance[dayElement as keyof typeof balance] ?? 0;
      if (inScore <= biScore) {
        yongShin = generates;
        yongShinReason = `억부법: ${strength}이므로 약한 일간을 생부해야 합니다. 인성인 ${ELEMENT_KO[generates]}이 필요합니다.`;
      } else {
        yongShin = dayElement;
        yongShinReason = `억부법: ${strength}이므로 약한 일간을 비조해야 합니다. 같은 오행 ${ELEMENT_KO[dayElement]}이 필요합니다.`;
      }
    }
  }

  return {
    strength,
    dayForce: Math.round(dayForce),
    oppositeForce: Math.round(oppositeForce),
    monthSupports,
    yongShin: ELEMENT_KO[yongShin],
    yongShinElement: yongShin,
    yongShinReason,
    giShin: ELEMENT_KO[ELEMENT_CONTROLLED_BY[yongShin]] ?? '', // 기신 = 용신을 극하는 오행
  };
}

/**
 * Format computed four pillars into a string for the AI prompt.
 * Optional birthMonth/birthDay/gender enables deterministic daeun + monthly fortune data.
 */
export function formatPillarInfo(
  pillars: FourPillarsCalc,
  birthYear: number,
  birthMonth?: number,
  birthDay?: number,
  gender?: 'male' | 'female',
) {
  const fmt = (p: { stem: string; stemHanja: string; branch: string; branchHanja: string }) =>
    `${p.stem}${p.branch}(${p.stemHanja}${p.branchHanja})`;

  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear + 1;
  const analysis = analyzeStrengthAndYongShin(pillars);

  // Pre-calculated daeun + monthly fortune (deterministic)
  let daeunSequence: string | undefined;
  let monthlyFortune: string | undefined;
  let yearlyFortune: string | undefined;

  if (birthMonth && birthDay && gender) {
    const daeun = calculateDaeun(pillars, birthYear, birthMonth, birthDay, gender);
    daeunSequence = daeun.pillars.map(p =>
      `${p.startAge}세: ${p.stemHanja}${p.branchHanja}(${p.tenGod}, ${p.lifeStage})`
    ).join(' | ');

    const monthly = calculateMonthlyFortune(pillars.day.stemIdx, currentYear);
    monthlyFortune = monthly.map(m =>
      `${m.month}월: ${m.stemHanja}${m.branchHanja}(${m.tenGod}, ${m.lifeStage})`
    ).join(' | ');

    const yearly = calculateYearlyFortune(pillars.day.stemIdx, currentYear);
    yearlyFortune = `${currentYear}년: ${yearly.stemHanja}${yearly.branchHanja}(${yearly.tenGod}, ${yearly.lifeStage})`;
  }

  return {
    fourPillars: `연주: ${fmt(pillars.year)} | 월주: ${fmt(pillars.month)} | 일주: ${fmt(pillars.day)} | 시주: ${fmt(pillars.hour)}`,
    dayMaster: STEM_ELEMENT_NAMES[pillars.day.stem] || pillars.day.stem,
    age,
    elements: pillars.elementBalance,
    strength: analysis.strength,
    yongShin: analysis.yongShin,
    yongShinReason: analysis.yongShinReason,
    // Deterministic fortune data (pre-calculated)
    daeunSequence,
    monthlyFortune,
    yearlyFortune,
  };
}

// ─── Analysis History ───

export interface AnalysisRecord {
  id: string;
  type: 'saju' | 'face' | 'compatibility';
  isPaid: boolean;
  result: SajuResult | FaceResult | CompatibilityResult;
  createdAt: string;
  /** 관상 분석용: 관상화 이미지 base64 */
  imageBase64?: string | null;
}

/** input_data에 저장할 최대 base64 크기 (500KB) — 초과 시 저장 생략 */
const MAX_INPUT_DATA_SIZE = 500_000;

// ─── User ID Cache (saveAnalysis, fetchHistory 등에서 반복 getSession 방지) ───
let _cachedUserId: string | null = null;
let _userIdFetchedAt = 0;

async function getCachedUserId(): Promise<string | null> {
  const now = Date.now();
  if (_cachedUserId && now - _userIdFetchedAt < TOKEN_CACHE_MS) return _cachedUserId;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      _cachedUserId = session.user.id;
      _userIdFetchedAt = now;
      return _cachedUserId;
    }
  } catch { /* guest */ }
  return null;
}

async function saveAnalysis(
  type: 'saju' | 'face' | 'compatibility',
  isPaid: boolean,
  result: unknown,
  inputData?: unknown,
): Promise<void> {
  try {
    const userId = await getCachedUserId();
    if (!userId) return; // 게스트는 로컬만 저장

    // Check if user row exists before inserting analysis
    const { data: userRow } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!userRow) {
      // User row doesn't exist yet (onboarding incomplete) — skip DB save, local only
      return;
    }

    // input_data에 거대한 base64가 있으면 제거 (JSONB 컬럼에 1-3MB PNG 저장 방지)
    let safeInputData = inputData ?? null;
    if (safeInputData && typeof safeInputData === 'object') {
      const imgBase64 = (safeInputData as any).imageBase64;
      if (typeof imgBase64 === 'string' && imgBase64.length > MAX_INPUT_DATA_SIZE) {
        if (__DEV__) console.log(`[API] saveAnalysis: imageBase64 too large (${(imgBase64.length / 1024).toFixed(0)}KB), skipping image storage`);
        // 이미지 제외, 나머지 데이터만 저장
        const { imageBase64: _, ...rest } = safeInputData as Record<string, unknown>;
        safeInputData = Object.keys(rest).length > 0 ? rest : null;
      }
    }

    const { error } = await supabase.from('analyses').insert({
      user_id: userId,
      type,
      is_paid: isPaid,
      input_data: safeInputData,
      result,
    });

    if (error) {
      if (__DEV__) console.warn('[API] saveAnalysis error:', error);
    }
  } catch (e) {
    if (__DEV__) console.warn('[API] saveAnalysis error:', e);
  }
}

async function fetchHistory(type?: string, limit = 30, retentionDays = 7): Promise<AnalysisRecord[]> {
  try {
    const userId = await getCachedUserId();
    if (!userId) return [];

    // 7일 이내 기록만 조회
    const since = new Date();
    since.setDate(since.getDate() - retentionDays);

    let query = supabase
      .from('analyses')
      .select('id, type, is_paid, result, created_at')
      .eq('user_id', userId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) query = query.eq('type', type);

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      id: row.id,
      type: row.type,
      isPaid: row.is_paid,
      result: row.result,
      createdAt: row.created_at,
    }));
  } catch (e) {
    if (__DEV__) console.warn('[API] fetchHistory error:', e);
    return [];
  }
}

async function fetchAnalysisImage(id: string): Promise<string | null> {
  try {
    const userId = await getCachedUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('analyses')
      .select('input_data')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return (data.input_data as any)?.imageBase64 ?? null;
  } catch (e) {
    if (__DEV__) console.warn('[API] fetchAnalysisImage error:', e);
    return null;
  }
}

async function deleteAnalysis(id: string): Promise<void> {
  try {
    const userId = await getCachedUserId();
    if (!userId) return;

    await supabase
      .from('analyses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
  } catch (e) {
    if (__DEV__) console.warn('[API] deleteAnalysis error:', e);
  }
}

export const api = {
  analyzeSaju: (
    input: SajuInput,
    locale: string,
    isPaid: boolean,
    mode: AnalysisMode = 'integrated',
    pillarInfo?: ReturnType<typeof formatPillarInfo>,
    userName?: string,
  ) =>
    invokeFunction<SajuResult>('saju', { input, locale, isPaid, mode, pillarInfo, userName }),

  analyzeFace: (imageBase64: string, locale: string, isPaid: boolean, mode: AnalysisMode = 'integrated') =>
    invokeFunction<FaceTransformResponse>('face-transform', { imageBase64, locale, isPaid, mode }),

  analyzeCompatibility: (
    person1: SajuInput,
    person2: SajuInput,
    locale: string,
    isPaid: boolean,
    pillarInfo1?: ReturnType<typeof formatPillarInfo>,
    pillarInfo2?: ReturnType<typeof formatPillarInfo>,
    name1?: string,
    name2?: string,
  ) =>
    invokeFunction<CompatibilityResult>('compatibility', {
      person1, person2, locale, isPaid, pillarInfo1, pillarInfo2, name1, name2,
    }),

  getDailyFortune: (
    birthData: SajuInput,
    locale: string,
    pillarInfo?: ReturnType<typeof formatPillarInfo>,
    sajuContext?: { headline?: string; personality?: any; lucky?: any; yearly2026?: any }
  ) =>
    invokeFunction<DailyFortune>('daily-fortune', { birthData, locale, pillarInfo, sajuContext }),

  saveAnalysis,
  fetchHistory,
  fetchAnalysisImage,
  deleteAnalysis,
};
