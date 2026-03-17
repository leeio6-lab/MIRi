import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SajuResult, FaceResult, DailyFortune, CompatibilityResult } from '../types/api';
import type { AnalysisRecord } from '../services/api';
import { api } from '../services/api';

interface FortuneState {
  sajuResult: SajuResult | null;
  faceResult: FaceResult | null;
  transformedImageBase64: string | null;
  dailyFortune: DailyFortune | null;
  compatibilityResult: CompatibilityResult | null;
  history: AnalysisRecord[];
  isLoading: boolean;
  error: string | null;

  // Background analysis state
  sajuPending: boolean;
  sajuReady: boolean;
  facePending: boolean;
  faceReady: boolean;
  faceNoFace: string | null;

  // Retention: yesterday score
  yesterdayScore: number;
  lastScoreDate: string | null;

  // Retention: streak
  streakCount: number;
  lastVisitDate: string | null;
  streakCelebration: number | null; // 7 or 30 when just achieved

  // Daily card
  dailyCardDate: string | null;
  dailyCardMessage: string | null;
  dailyCardTenGod: string | null;
  dailyCardScore: number | null;
  setDailyCard: (date: string, message: string, tenGod: string, score: number) => void;

  // Tarot (AM/PM sessions)
  tarotMorningDate: string | null;
  tarotMorningElement: string | null;
  tarotMorningVariant: number | null;
  tarotAfternoonDate: string | null;
  tarotAfternoonElement: string | null;
  tarotAfternoonVariant: number | null;
  setTarotResult: (period: 'morning' | 'afternoon', element: string, variant: number) => void;

  // Quiz
  quizDate: string | null;
  quizResult: { selected: string; correct: string; isCorrect: boolean } | null;
  setQuiz: (date: string, result: { selected: string; correct: string; isCorrect: boolean }) => void;

  // Roulette
  rouletteDate: string | null;
  rouletteResult: number | null;
  setRoulette: (date: string, result: number) => void;

  setSajuResult: (result: SajuResult | null) => void;
  setFaceResult: (result: FaceResult | null) => void;
  setTransformedImage: (base64: string | null) => void;
  setDailyFortune: (fortune: DailyFortune | null) => void;
  setCompatibilityResult: (result: CompatibilityResult | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSajuPending: (v: boolean) => void;
  setSajuReady: (v: boolean) => void;
  setFacePending: (v: boolean) => void;
  setFaceReady: (v: boolean) => void;
  setFaceNoFace: (reason: string | null) => void;
  clearStreakCelebration: () => void;

  // Streak & daily check
  checkStreak: () => void;
  checkDailyScore: (todayScore: number) => void;

  // History
  loadHistory: (type?: string) => Promise<void>;
  saveAndRecord: (type: 'saju' | 'face' | 'compatibility', isPaid: boolean, result: unknown, inputData?: unknown) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  clearAllData: () => void;
}

export const useFortuneStore = create<FortuneState>()(
  persist(
    (set, get) => ({
      sajuResult: null,
      faceResult: null,
      transformedImageBase64: null,
      dailyFortune: null,
      compatibilityResult: null,
      history: [],
      isLoading: false,
      error: null,

      sajuPending: false,
      sajuReady: false,
      facePending: false,
      faceReady: false,
      faceNoFace: null,

      yesterdayScore: 0,
      lastScoreDate: null,
      streakCount: 0,
      lastVisitDate: null,
      streakCelebration: null,

      dailyCardDate: null,
      dailyCardMessage: null,
      dailyCardTenGod: null,
      dailyCardScore: null,
      setDailyCard: (date, message, tenGod, score) => set({ dailyCardDate: date, dailyCardMessage: message, dailyCardTenGod: tenGod, dailyCardScore: score }),

      tarotMorningDate: null,
      tarotMorningElement: null,
      tarotMorningVariant: null,
      tarotAfternoonDate: null,
      tarotAfternoonElement: null,
      tarotAfternoonVariant: null,
      setTarotResult: (period, element, variant) => {
        const today = new Date().toISOString().slice(0, 10);
        if (period === 'morning') {
          set({ tarotMorningDate: today, tarotMorningElement: element, tarotMorningVariant: variant });
        } else {
          set({ tarotAfternoonDate: today, tarotAfternoonElement: element, tarotAfternoonVariant: variant });
        }
      },

      quizDate: null,
      quizResult: null,
      setQuiz: (date, result) => set({ quizDate: date, quizResult: result }),

      rouletteDate: null,
      rouletteResult: null,
      setRoulette: (date, result) => set({ rouletteDate: date, rouletteResult: result }),

      clearStreakCelebration: () => set({ streakCelebration: null }),

      checkDailyScore: (todayScore: number) => {
        const today = new Date().toISOString().slice(0, 10);
        const state = get();
        if (state.lastScoreDate === today) return; // already checked today
        // Move current todayScore to yesterdayScore
        const prevFortune = state.dailyFortune;
        const prevScore = prevFortune?.overallScore ?? 0;
        set({ yesterdayScore: prevScore, lastScoreDate: today });
      },

      checkStreak: () => {
        const today = new Date().toISOString().slice(0, 10);
        const state = get();
        if (state.lastVisitDate === today) return; // already checked today

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);

        let newStreak: number;
        let celebration: number | null = null;

        if (state.lastVisitDate === yesterdayStr) {
          newStreak = state.streakCount + 1;
        } else {
          newStreak = 1;
        }

        // Streak rewards
        if (newStreak === 7) celebration = 7;
        if (newStreak === 30) celebration = 30;

        set({
          streakCount: newStreak,
          lastVisitDate: today,
          streakCelebration: celebration,
        });
      },

      setSajuResult: (result) => set({ sajuResult: result }),
      setFaceResult: (result) => set({ faceResult: result }),
      setTransformedImage: (base64) => set({ transformedImageBase64: base64 }),
      setDailyFortune: (fortune) => set({ dailyFortune: fortune }),
      setCompatibilityResult: (result) => set({ compatibilityResult: result }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setSajuPending: (v) => set({ sajuPending: v }),
      setSajuReady: (v) => set({ sajuReady: v }),
      setFacePending: (v) => set({ facePending: v }),
      setFaceReady: (v) => set({ faceReady: v }),
      setFaceNoFace: (reason) => set({ faceNoFace: reason }),

      loadHistory: async (type?) => {
        const records = await api.fetchHistory(type);

        // 7일 이내 로컬 기록만 유지
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const local = get().history.filter(
          (r) => new Date(r.createdAt).getTime() >= sevenDaysAgo,
        );

        if (records.length > 0) {
          // Supabase 기록이 있으면 (로그인 상태) → Supabase 기준으로 교체
          // 로컬 전용 기록(아직 sync 안 된 최근 것)만 병합
          const remoteIds = new Set(records.map((r) => r.id));
          const localUnsyncedRecent = local.filter(
            (r) => !remoteIds.has(r.id) && !r.id.match(/^[0-9a-f-]{36}$/),
          );
          const merged = [...localUnsyncedRecent, ...records]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 50);
          set({ history: merged });
        } else {
          // 게스트 또는 네트워크 에러 → 로컬 기록(7일 필터 적용)만 유지
          set({ history: local });
        }
      },

      deleteRecord: async (id) => {
        set({ history: get().history.filter((r) => r.id !== id) });
        try {
          await api.deleteAnalysis(id);
        } catch (e) {
          if (__DEV__) console.warn('[FortuneStore] deleteAnalysis failed:', e);
        }
      },

      clearAllData: () => {
        set({
          sajuResult: null,
          faceResult: null,
          transformedImageBase64: null,
          dailyFortune: null,
          compatibilityResult: null,
          history: [],
          yesterdayScore: 0,
          lastScoreDate: null,
          streakCount: 0,
          lastVisitDate: null,
          streakCelebration: null,
          sajuPending: false,
          sajuReady: false,
          facePending: false,
          faceReady: false,
          faceNoFace: null,
        });
      },

      saveAndRecord: async (type, isPaid, result, inputData?) => {
        // face 결과는 히스토리에 경량 버전만 저장 (base64 제거)
        const lightResult = type === 'face' ? {
          overallScore: (result as any).overallScore,
          shareTitle: (result as any).shareTitle,
          hookLine: (result as any).hookLine,
          faceType: (result as any).faceType,
          summary: typeof (result as any).summary === 'string' ? (result as any).summary.slice(0, 200) : undefined,
        } : result;

        const record: AnalysisRecord = {
          id: Date.now().toString(),
          type,
          isPaid,
          result: lightResult as any,
          createdAt: new Date().toISOString(),
        };
        const prev = get().history;
        set({ history: [record, ...prev].slice(0, 30) });

        // Supabase에 저장 (실패해도 로컬은 이미 저장됨)
        try {
          await api.saveAnalysis(type, isPaid, result, inputData);
        } catch (e) {
          if (__DEV__) console.warn('[FortuneStore] saveAnalysis failed:', e);
        }
      },
    }),
    {
      name: 'miri-fortune',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        sajuResult: state.sajuResult,
        faceResult: state.faceResult ? { ...state.faceResult, transformedImage: undefined } : null,
        transformedImageBase64: null, // persist 제외 (1MB+, 용량 초과 방지)
        dailyFortune: state.dailyFortune,
        compatibilityResult: state.compatibilityResult,
        // 이미지 base64는 persist 제외 (용량 초과 방지, Supabase에서 복원)
        history: state.history.slice(0, 15).map((r) => {
          // face 결과에서 큰 필드 제거 (base64 이미지, 긴 텍스트)
          const result = r.type === 'face' && r.result ? {
            overallScore: (r.result as any).overallScore,
            shareTitle: (r.result as any).shareTitle,
            hookLine: (r.result as any).hookLine,
            faceType: (r.result as any).faceType,
            summary: typeof (r.result as any).summary === 'string' ? (r.result as any).summary.slice(0, 200) : undefined,
          } : r.result;
          return { ...r, result, imageBase64: undefined };
        }),
        yesterdayScore: state.yesterdayScore,
        lastScoreDate: state.lastScoreDate,
        streakCount: state.streakCount,
        lastVisitDate: state.lastVisitDate,
        dailyCardDate: state.dailyCardDate,
        dailyCardMessage: state.dailyCardMessage,
        dailyCardTenGod: state.dailyCardTenGod,
        dailyCardScore: state.dailyCardScore,
        tarotMorningDate: state.tarotMorningDate,
        tarotMorningElement: state.tarotMorningElement,
        tarotMorningVariant: state.tarotMorningVariant,
        tarotAfternoonDate: state.tarotAfternoonDate,
        tarotAfternoonElement: state.tarotAfternoonElement,
        tarotAfternoonVariant: state.tarotAfternoonVariant,
        quizDate: state.quizDate,
        quizResult: state.quizResult,
        rouletteDate: state.rouletteDate,
        rouletteResult: state.rouletteResult,
      }),
      migrate: (persisted: any, version: number) => {
        if (version < 2) {
          // v1→v2: 캐시된 sajuResult/compatibilityResult 클리어 (mock 데이터 제거)
          return { ...persisted, sajuResult: null, compatibilityResult: null };
        }
        return persisted;
      },
      // 복원 시 features 객체→배열 변환 (이전 데이터 호환)
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as object) };
        if (merged.faceResult?.features && !Array.isArray(merged.faceResult.features)) {
          const obj = merged.faceResult.features as Record<string, any>;
          const areaOrder = ['forehead', 'eyes', 'nose', 'mouth', 'jawline', 'chin', 'ears'];
          merged.faceResult = {
            ...merged.faceResult,
            features: areaOrder
              .filter(a => obj[a])
              .map(a => ({ area: a, score: obj[a].score ?? 75, description: obj[a].title ?? obj[a].description ?? '' })),
          };
        }
        return merged;
      },
    }
  )
);
