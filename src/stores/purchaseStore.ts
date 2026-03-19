import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { iapService } from '../services/iap';
import { getProductId } from '../constants/iapProducts';
import { CONFIG } from '../constants/config';

interface PurchaseState {
  isProcessing: boolean;
  error: string | null;
  freeCredits: number;
  purchasedItems: string[];
  faceTickets: number;

  purchaseAnalysis: (type: 'saju' | 'face' | 'compatibility') => Promise<boolean>;
  useFreeCredit: () => boolean;
  restorePurchases: () => Promise<void>;
  onPurchaseSuccess: (productId: string) => void;
  onPurchaseError: (message: string) => void;
  canAccess: (type: 'saju' | 'face' | 'compatibility') => boolean;
  hasFaceTicket: () => boolean;
  useFaceTicket: () => boolean;
  addFreeCredits: (count: number) => void;
}

export const usePurchaseStore = create<PurchaseState>()(
  persist(
    (set, get) => ({
      isProcessing: false,
      error: null,
      freeCredits: CONFIG.INITIAL_FREE_CREDITS,
      purchasedItems: [],
      faceTickets: 0,

      hasFaceTicket: () => {
        return get().faceTickets > 0 || CONFIG.DEV_BYPASS_PAYMENT;
      },

      useFaceTicket: () => {
        const state = get();
        if (CONFIG.DEV_BYPASS_PAYMENT) return true;
        if (state.faceTickets > 0) {
          set({ faceTickets: state.faceTickets - 1 });
          return true;
        }
        return false;
      },

      canAccess: () => {
        const state = get();
        if (CONFIG.DEV_BYPASS_PAYMENT) return true;
        if (state.freeCredits > 0) return true;
        return false;
      },

      addFreeCredits: (count: number) => {
        set((s) => ({ freeCredits: s.freeCredits + count }));
      },

      useFreeCredit: () => {
        const state = get();
        if (state.freeCredits > 0) {
          set({ freeCredits: state.freeCredits - 1 });
          return true;
        }
        return false;
      },

      purchaseAnalysis: async (type) => {
        const state = get();

        // 중복 결제 방지
        if (state.isProcessing) return false;

        // DEV 모드
        if (CONFIG.DEV_BYPASS_PAYMENT) {
          set((s) => ({
            purchasedItems: [...s.purchasedItems, `dev_${type}_${Date.now()}`],
            faceTickets: type === 'face' ? s.faceTickets + 1 : s.faceTickets,
          }));
          return true;
        }

        // 무료 크레딧 사용
        if (state.freeCredits > 0) {
          set((s) => ({
            freeCredits: s.freeCredits - 1,
            faceTickets: type === 'face' ? s.faceTickets + 1 : s.faceTickets,
          }));
          return true;
        }

        // 실제 결제
        set({ isProcessing: true, error: null });
        const productId = getProductId(type);
        const success = await iapService.purchase(productId);

        if (success) {
          set((s) => ({
            isProcessing: false,
            purchasedItems: [...s.purchasedItems, productId],
            faceTickets: type === 'face' ? s.faceTickets + 1 : s.faceTickets,
          }));
        } else {
          set({ isProcessing: false });
        }

        return success;
      },

      restorePurchases: async () => {
        set({ isProcessing: true });
        const restored = await iapService.restorePurchases();
        set({
          isProcessing: false,
          purchasedItems: restored,
        });
      },

      onPurchaseSuccess: (productId) => {
        set((state) => ({
          purchasedItems: [...state.purchasedItems, productId],
          isProcessing: false,
          error: null,
        }));
      },

      onPurchaseError: (message) => {
        set({ isProcessing: false, error: message });
      },
    }),
    {
      name: 'myeongri-purchases',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        freeCredits: state.freeCredits,
        purchasedItems: state.purchasedItems,
        faceTickets: state.faceTickets,
      }),
    }
  )
);
