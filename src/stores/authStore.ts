import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '../types/user';
import * as AuthService from '../services/auth';
import { api } from '../services/api';
import { useFortuneStore } from './fortuneStore';
import type { AnalysisRecord } from '../services/api';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  hasCompletedOnboarding: boolean;
  hasSeenGuide: boolean;
  isLoading: boolean;

  setUser: (user: UserProfile | null) => void;
  setAuthenticated: (auth: boolean) => void;
  setOnboardingComplete: () => void;
  setGuideComplete: () => void;
  setLoading: (loading: boolean) => void;

  signInWithGoogle: () => Promise<{ success: boolean; error?: string; providerToken?: string }>;
  signInWithApple: () => Promise<{ success: boolean; error?: string }>;
  signInWithKakao: () => Promise<{ success: boolean; error?: string }>;
  signInWithLine: () => Promise<{ success: boolean; error?: string }>;
  signInAsGuest: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

// ─── Guest → Social login data migration helpers ───
interface GuestDataSnapshot {
  history: AnalysisRecord[];
  sajuResult: unknown;
  faceResult: unknown;
  dailyFortune: unknown;
  compatibilityResult: unknown;
}

function _snapshotGuestData(isGuest: boolean): GuestDataSnapshot | null {
  if (!isGuest) return null;
  const fs = useFortuneStore.getState();
  const snapshot: GuestDataSnapshot = {
    history: [...fs.history],
    sajuResult: fs.sajuResult,
    faceResult: fs.faceResult,
    dailyFortune: fs.dailyFortune,
    compatibilityResult: fs.compatibilityResult,
  };
  if (__DEV__) console.log('[Auth] Guest data snapshot saved — history count:', snapshot.history.length);
  return snapshot;
}

function _restoreGuestData(snapshot: GuestDataSnapshot | null): void {
  if (!snapshot) return;
  const fs = useFortuneStore.getState();
  // Merge: keep any existing history on the new session, prepend guest history (dedup by id)
  const existingIds = new Set(fs.history.map((r) => r.id));
  const merged = [
    ...fs.history,
    ...snapshot.history.filter((r) => !existingIds.has(r.id)),
  ];
  useFortuneStore.setState({
    history: merged,
    sajuResult: fs.sajuResult ?? snapshot.sajuResult as any,
    faceResult: fs.faceResult ?? snapshot.faceResult as any,
    dailyFortune: fs.dailyFortune ?? snapshot.dailyFortune as any,
    compatibilityResult: fs.compatibilityResult ?? snapshot.compatibilityResult as any,
  });
  if (__DEV__) console.log('[Auth] Guest data restored — merged history count:', merged.length);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isGuest: false,
      hasCompletedOnboarding: false,
      hasSeenGuide: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (auth) => set({ isAuthenticated: auth, isGuest: false }),
      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
      setGuideComplete: () => set({ hasSeenGuide: true }),
      setLoading: (loading) => set({ isLoading: loading }),

      signInWithGoogle: async () => {
        set({ isLoading: true });
        // Snapshot guest data before social login destroys anonymous session
        const guestSnapshot = _snapshotGuestData(get().isGuest);
        const result = await AuthService.signInWithGoogle();
        set({ isLoading: false, isAuthenticated: result.success, isGuest: false });
        if (result.success) _restoreGuestData(guestSnapshot);
        return { success: result.success, error: result.error, providerToken: result.providerToken };
      },

      signInWithApple: async () => {
        set({ isLoading: true });
        const guestSnapshot = _snapshotGuestData(get().isGuest);
        const result = await AuthService.signInWithApple();
        set({ isLoading: false, isAuthenticated: result.success, isGuest: false });
        if (result.success) _restoreGuestData(guestSnapshot);
        return result;
      },

      signInWithKakao: async () => {
        set({ isLoading: true });
        const guestSnapshot = _snapshotGuestData(get().isGuest);
        const result = await AuthService.signInWithKakao();
        set({ isLoading: false, isAuthenticated: result.success, isGuest: false });
        if (result.success) _restoreGuestData(guestSnapshot);
        return result;
      },

      signInWithLine: async () => {
        set({ isLoading: true });
        const guestSnapshot = _snapshotGuestData(get().isGuest);
        const result = await AuthService.signInWithLine();
        set({ isLoading: false, isAuthenticated: result.success, isGuest: false });
        if (result.success) _restoreGuestData(guestSnapshot);
        return result;
      },

      signInAsGuest: async () => {
        set({ isLoading: true });
        const result = await AuthService.signInAsGuest();
        set({ isLoading: false, isAuthenticated: result.success, isGuest: true });
        return result;
      },

      logout: async () => {
        try {
          await AuthService.signOut();
        } catch {
          // Always clear local state even if Supabase signOut fails
        }
        // 이전 사용자 토큰/ID 캐시 제거 (다른 사용자 데이터 혼동 방지)
        api.clearAuthCache();
        set({
          user: null,
          isAuthenticated: false,
          isGuest: false,
          hasCompletedOnboarding: false,
        });
      },
    }),
    {
      name: 'myeongri-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        hasSeenGuide: state.hasSeenGuide,
      }),
    }
  )
);
