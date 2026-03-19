import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AnalysisMode = 'traditional' | 'science' | 'integrated';

interface UserSettingsState {
  analysisMode: AnalysisMode;
  notificationsEnabled: boolean;
  setAnalysisMode: (mode: AnalysisMode) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

export const useUserStore = create<UserSettingsState>()(
  persist(
    (set) => ({
      analysisMode: 'integrated',
      notificationsEnabled: true,
      setAnalysisMode: (mode) => set({ analysisMode: mode }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
    }),
    {
      name: 'myeongri-user-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
