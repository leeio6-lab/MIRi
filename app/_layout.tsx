import React, { useEffect, useState } from 'react';
import { LogBox, Platform, View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import NetInfo from '@react-native-community/netinfo';

LogBox.ignoreLogs([
  'Invalid DOM property `transform-origin`',
  'Invalid DOM property `transform-origin`. Did you mean `transformOrigin`?',
]);

// Suppress react-native-svg transform-origin DOM warning on web
if (Platform.OS === 'web' && typeof console !== 'undefined') {
  const origError = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('transform-origin')) return;
    origError.apply(console, args);
  };
}
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../src/i18n';
import { theme } from '../src/constants/theme';
import { supabase } from '../src/services/supabase';
import { useAuthStore } from '../src/stores/authStore';
import { useFortuneStore } from '../src/stores/fortuneStore';
import { ErrorBoundary } from '../src/components/ui/ErrorBoundary';

function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      setIsOffline(!navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!(state.isConnected ?? true));
    });
    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <View style={offlineStyles.banner}>
      <Text style={offlineStyles.text}>오프라인 상태입니다</Text>
    </View>
  );
}

const offlineStyles = StyleSheet.create({
  banner: {
    backgroundColor: '#FF3B30',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default function RootLayout() {
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const loadHistory = useFortuneStore((s) => s.loadHistory);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session);
      // 로그인 시 유저의 분석 기록을 Supabase에서 자동 로드
      if (session) {
        loadHistory().catch(() => {});
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <StatusBar style="dark" />
          <OfflineBanner />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.colors.bg.primary },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="saju" />
            <Stack.Screen name="face" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="share" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg.primary,
  },
});
