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

  setSajuResult: (result: SajuResult | null) => void;
  setFaceResult: (result: FaceResult | null) => void;
  setTransformedImage: (base64: string | null) => void;
  setDailyFortune: (fortune: DailyFortune | null) => void;
  setCompatibilityResult: (result: CompatibilityResult | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // History
  loadHistory: (type?: string) => Promise<void>;
  saveAndRecord: (type: 'saju' | 'face' | 'compatibility', isPaid: boolean, result: unknown, inputData?: unknown) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
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

      setSajuResult: (result) => set({ sajuResult: result }),
      setFaceResult: (result) => set({ faceResult: result }),
      setTransformedImage: (base64) => set({ transformedImageBase64: base64 }),
      setDailyFortune: (fortune) => set({ dailyFortune: fortune }),
      setCompatibilityResult: (result) => set({ compatibilityResult: result }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      loadHistory: async (type?) => {
        const records = await api.fetchHistory(type);
        if (records.length > 0) {
          // Supabase에서 가져온 기록이 있으면 로컬과 병합
          const local = get().history;
          const remoteIds = new Set(records.map((r) => r.id));
          // 로컬에만 있는 기록(아직 Supabase에 반영 안 된 것) 유지
          const localOnly = local.filter((r) => !remoteIds.has(r.id));
          const merged = [...localOnly, ...records]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 50);
          set({ history: merged });
        }
        // records가 비어있으면(게스트/네트워크 에러) 기존 로컬 기록 유지
      },

      deleteRecord: async (id) => {
        set({ history: get().history.filter((r) => r.id !== id) });
        try {
          await api.deleteAnalysis(id);
        } catch (e) {
          if (__DEV__) console.warn('[FortuneStore] deleteAnalysis failed:', e);
        }
      },

      saveAndRecord: async (type, isPaid, result, inputData?) => {
        // 로컬 히스토리에 즉시 추가
        const record: AnalysisRecord = {
          id: Date.now().toString(),
          type,
          isPaid,
          result: result as any,
          createdAt: new Date().toISOString(),
        };
        const prev = get().history;
        set({ history: [record, ...prev].slice(0, 50) });

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
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        sajuResult: state.sajuResult,
        faceResult: state.faceResult,
        transformedImageBase64: state.transformedImageBase64,
        dailyFortune: state.dailyFortune,
        compatibilityResult: state.compatibilityResult,
        history: state.history.slice(0, 20), // 최근 20개만 로컬 캐시
      }),
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
