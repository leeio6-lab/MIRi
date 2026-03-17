import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { theme } from '../src/constants/theme';
import { MIRiLogo } from '../src/components/ui/MIRiLogo';
import { useAuthStore } from '../src/stores/authStore';
import { supabase } from '../src/services/supabase';

const { width, height } = Dimensions.get('window');

function InkDrop({ delay, x, y, size, maxScale, color }: {
  delay: number; x: number; y: number; size: number; maxScale: number; color: string;
}) {
  const coreScale = useSharedValue(0);
  const coreOpacity = useSharedValue(0);
  const midScale = useSharedValue(0);
  const midOpacity = useSharedValue(0);
  const outerScale = useSharedValue(0);
  const outerOpacity = useSharedValue(0);

  useEffect(() => {
    coreScale.value = withDelay(delay,
      withTiming(maxScale * 0.6, { duration: 1800, easing: Easing.out(Easing.cubic) })
    );
    coreOpacity.value = withDelay(delay, withSequence(
      withTiming(0.35, { duration: 300 }),
      withTiming(0, { duration: 2500, easing: Easing.out(Easing.quad) })
    ));

    midScale.value = withDelay(delay + 100,
      withTiming(maxScale * 0.85, { duration: 2200, easing: Easing.out(Easing.cubic) })
    );
    midOpacity.value = withDelay(delay + 100, withSequence(
      withTiming(0.18, { duration: 400 }),
      withTiming(0, { duration: 3000, easing: Easing.out(Easing.quad) })
    ));

    outerScale.value = withDelay(delay + 200,
      withTiming(maxScale, { duration: 2800, easing: Easing.out(Easing.cubic) })
    );
    outerOpacity.value = withDelay(delay + 200, withSequence(
      withTiming(0.08, { duration: 500 }),
      withTiming(0, { duration: 3500, easing: Easing.out(Easing.quad) })
    ));
  }, []);

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coreScale.value }], opacity: coreOpacity.value,
  }));
  const midStyle = useAnimatedStyle(() => ({
    transform: [{ scale: midScale.value }], opacity: midOpacity.value,
  }));
  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerScale.value }], opacity: outerOpacity.value,
  }));

  const baseStyle = {
    position: 'absolute' as const,
    left: x - size / 2,
    top: y - size / 2,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
  };

  return (
    <>
      <Animated.View style={[baseStyle, outerStyle]} />
      <Animated.View style={[baseStyle, midStyle]} />
      <Animated.View style={[baseStyle, coreStyle]} />
    </>
  );
}

let hasNavigated = false;

export default function SplashScreen() {
  const router = useRouter();
  const titleOpacity = useSharedValue(0);
  const titleScale = useSharedValue(0.85);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    const navigate = async () => {
      if (hasNavigated) return;
      hasNavigated = true;

      const { isAuthenticated, hasCompletedOnboarding } = useAuthStore.getState();
      const { data: { session } } = await supabase.auth.getSession();
      const authed = isAuthenticated || !!session;

      if (authed && hasCompletedOnboarding) {
        router.replace('/(tabs)/home');
      } else if (authed) {
        router.replace('/(auth)/birth-input');
      } else {
        router.replace('/(auth)/onboarding');
      }
    };

    // 웹: OAuth 리다이렉트 후 돌아온 경우를 먼저 체크 (isAuthenticated보다 우선)
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      if (url.includes('code=') || url.includes('access_token=')) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (__DEV__) console.log('[Splash] onAuthStateChange event:', event, 'session:', !!session);
          if (session) {
            subscription.unsubscribe();
            hasNavigated = true;
            const pt = session.provider_token;
            const meta = session.user?.user_metadata;
            const name = meta?.full_name ?? meta?.name;
            if (__DEV__) {
              console.log('[Splash] provider_token:', !!pt, 'name:', name);
              console.log('[Splash] user_metadata:', JSON.stringify(meta));
            }
            const params: Record<string, string> = {};
            if (pt) params.pt = pt;
            if (name) params.name = name;
            const { hasCompletedOnboarding } = useAuthStore.getState();
            if (hasCompletedOnboarding) {
              router.replace('/(tabs)/home');
            } else {
              const qs = new URLSearchParams(params).toString();
              if (__DEV__) console.log('[Splash] navigating to birth-input with:', qs);
              router.replace(`/(auth)/birth-input${qs ? `?${qs}` : ''}` as any);
            }
          }
        });
        setTimeout(() => {
          subscription.unsubscribe();
          navigate();
        }, 5000);
        return;
      }
    }

    // 이미 로그인된 상태면 스플래시 건너뛰기
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      navigate();
      return;
    }

    // 최초 진입 시에만 스플래시 애니메이션 표시
    titleOpacity.value = withDelay(800, withTiming(1, { duration: 1000 }));
    titleScale.value = withDelay(800, withTiming(1, { duration: 1000, easing: Easing.out(Easing.back(1.5)) }));
    taglineOpacity.value = withDelay(1600, withTiming(1, { duration: 800 }));

    const timer = setTimeout(navigate, 3000);
    return () => clearTimeout(timer);
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value, transform: [{ scale: titleScale.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  return (
    <View style={styles.container}>
      <InkDrop delay={200} x={width * 0.5} y={height * 0.38} size={100} maxScale={3.5} color="#1C1C1E" />
      <InkDrop delay={600} x={width * 0.62} y={height * 0.44} size={70} maxScale={2.8} color="#3A3A3C" />
      <InkDrop delay={1000} x={width * 0.38} y={height * 0.50} size={50} maxScale={2.2} color="#2C2C2E" />

      <Animated.View style={titleStyle}>
        <Text style={styles.title}>MIRi</Text>
        <Text style={styles.titleKo}>미리</Text>
      </Animated.View>
      <Animated.View style={taglineStyle}>
        <Text style={styles.tagline}>운명을 미리 보다</Text>
        <Text style={styles.taglineSub}>3,000년 역학 x 현대 과학</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 56,
    fontWeight: '200',
    color: theme.colors.text.primary,
    textAlign: 'center',
    letterSpacing: 18,
  },
  titleKo: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    letterSpacing: 12,
    fontWeight: '300',
  },
  tagline: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    letterSpacing: 4,
    fontWeight: '300',
  },
  taglineSub: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    letterSpacing: 1,
    fontWeight: '300',
  },
});
