import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SajuResult, FaceResult, DailyFortune, CompatibilityResult } from '../types/api';
import type { AnalysisRecord, AnalysisStatus } from '../services/api';
import { api } from '../services/api';
import { useAuthStore } from './authStore';
import { getTodayString } from '../utils/date';

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
  /** 앱 재시작 시 서버에서 처리 완료된 분석 복원 */
  recoverPendingAnalyses: () => Promise<void>;
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
        const today = getTodayString();
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
        const today = getTodayString();
        const state = get();
        if (state.lastScoreDate === today) return; // already checked today
        // Move current todayScore to yesterdayScore
        const prevFortune = state.dailyFortune;
        const prevScore = prevFortune?.overallScore ?? 0;
        set({ yesterdayScore: prevScore, lastScoreDate: today });
      },

      checkStreak: () => {
        const today = getTodayString();
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
        const { isGuest } = useAuthStore.getState();

        // 비회원: 로컬 기록만 필터링하여 유지 (서버 조회 안 함)
        if (isGuest) {
          if (type) {
            // 필터 적용 시 로컬에서 필터링만
          }
          return;
        }

        try {
          const serverRecords = await api.fetchHistory(type);

          // 서버 기록 + 로컬 기록 병합 (서버 우선, 중복 제거)
          const localOnly = get().history.filter(
            (local) => !serverRecords.some((s) => s.id === local.id)
          );
          const merged = [...serverRecords, ...localOnly]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 50);
          set({ history: merged });
        } catch (e) {
          if (__DEV__) console.warn('[FortuneStore] loadHistory error:', e);
          // 에러 시 기존 로컬 기록 유지
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

      saveAndRecord: async (type, isPaid, result, _inputData?) => {
        // 로컬 히스토리에 경량 레코드 추가 (게스트 포함, 즉시 UI 반영용)
        // 서버 Edge Function이 회원은 DB에도 저장함 (_analysisId 포함)
        const analysisId = (result as any)?._analysisId;

        const lightResult = type === 'face' ? {
          overallScore: (result as any).overallScore,
          shareTitle: (result as any).shareTitle,
          hookLine: (result as any).hookLine,
          faceType: (result as any).faceType,
          summary: typeof (result as any).summary === 'string' ? (result as any).summary.slice(0, 200) : undefined,
        } : result;

        const record: AnalysisRecord = {
          id: analysisId || Date.now().toString(),
          type,
          isPaid,
          result: lightResult as any,
          createdAt: new Date().toISOString(),
          status: 'completed',
        };
        const prev = get().history;
        set({ history: [record, ...prev].slice(0, 30) });

        // 서버에 이미 저장됨 → 별도 saveAnalysis 호출 불필요
      },

      recoverPendingAnalyses: async () => {
        const { isGuest } = useAuthStore.getState();
        if (isGuest) return;

        try {
          // 서버에서 처리 완료되었지만 클라이언트가 수신 못한 분석 조회
          const pending = await api.fetchPendingAnalyses();
          if (pending.length === 0) return;

          // 3초 간격으로 폴링 (최대 5회)
          for (const record of pending) {
            let attempts = 0;
            while (attempts < 5) {
              attempts++;
              const updated = await api.fetchAnalysisById(record.id);
              if (updated && updated.status === 'completed' && updated.result) {
                // 완료된 분석을 히스토리에 추가
                const prev = get().history;
                if (!prev.find(r => r.id === updated.id)) {
                  set({ history: [updated, ...prev].slice(0, 30) });
                }
                break;
              }
              if (updated && updated.status === 'failed') break;
              // 아직 processing → 3초 대기 후 재시도
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
          }
        } catch (e) {
          if (__DEV__) console.warn('[FortuneStore] recoverPendingAnalyses error:', e);
        }
      },
    }),
    {
      name: 'myeongri-fortune',
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => {
        // 비회원: 분석 결과·히스토리 persist 안 함
        const { isGuest } = useAuthStore.getState();

        return {
        sajuResult: isGuest ? null : state.sajuResult,
        faceResult: isGuest ? null : (state.faceResult ? { ...state.faceResult, transformedImage: undefined } : null),
        transformedImageBase64: null, // persist 제외 (1MB+, 용량 초과 방지)
        dailyFortune: isGuest ? null : state.dailyFortune,
        compatibilityResult: isGuest ? null : state.compatibilityResult,
        // 히스토리: 로컬에 최근 15개 경량 캐시 (게스트도 유지)
        history: state.history.slice(0, 15).map((r) => {
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
      };
      },
      migrate: (persisted: any, version: number) => {
        if (version < 3) {
          // v2→v3: 서버 기반 분석 관리 전환 — 로컬 캐시 클리어
          return { ...persisted, sajuResult: null, compatibilityResult: null, history: [] };
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
