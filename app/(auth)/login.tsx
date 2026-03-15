import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
import { fetchGoogleProfile } from '../../src/services/auth';

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
      withTiming(maxScale * 0.6, { duration: 2000, easing: Easing.out(Easing.cubic) })
    );
    coreOpacity.value = withDelay(delay, withSequence(
      withTiming(0.35, { duration: 300 }),
      withTiming(0, { duration: 3500, easing: Easing.out(Easing.quad) })
    ));

    midScale.value = withDelay(delay + 100,
      withTiming(maxScale * 0.85, { duration: 2800, easing: Easing.out(Easing.cubic) })
    );
    midOpacity.value = withDelay(delay + 100, withSequence(
      withTiming(0.18, { duration: 400 }),
      withTiming(0, { duration: 4000, easing: Easing.out(Easing.quad) })
    ));

    outerScale.value = withDelay(delay + 200,
      withTiming(maxScale, { duration: 3500, easing: Easing.out(Easing.cubic) })
    );
    outerOpacity.value = withDelay(delay + 200, withSequence(
      withTiming(0.08, { duration: 500 }),
      withTiming(0, { duration: 4500, easing: Easing.out(Easing.quad) })
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

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { signInWithGoogle, signInWithApple, signInAsGuest, isLoading } = useAuthStore();

  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    contentOpacity.value = withDelay(600, withTiming(1, { duration: 1000 }));
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const handleGoogleLogin = async () => {
    const result = await signInWithGoogle();
    console.log('[Login] signInWithGoogle result:', JSON.stringify({
      success: result.success,
      error: result.error,
      hasProviderToken: !!result.providerToken,
    }));

    if (result.success) {
      // 구글 프로필에서 이름/생년월일 가져오기 (providerToken 직접 전달)
      const profile = await fetchGoogleProfile(result.providerToken);
      console.log('[Login] fetchGoogleProfile result:', JSON.stringify(profile));

      const params: Record<string, string> = {};
      if (profile.name) params.name = profile.name;
      if (profile.birthYear) params.year = String(profile.birthYear);
      if (profile.birthMonth) params.month = String(profile.birthMonth);
      if (profile.birthDay) params.day = String(profile.birthDay);

      const query = new URLSearchParams(params).toString();
      console.log('[Login] navigating with query:', query);
      router.replace(`/(auth)/birth-input${query ? `?${query}` : ''}` as any);
    } else if (result.error && result.error !== 'Login cancelled') {
      Alert.alert(t('common.loginFailed'), result.error);
    }
  };

  const handleAppleLogin = async () => {
    const result = await signInWithApple();
    if (result.success) {
      router.replace('/(auth)/birth-input');
    } else if (result.error) {
      Alert.alert(t('common.loginFailed'), result.error);
    }
  };

  const handleGuestLogin = async () => {
    const result = await signInAsGuest();
    if (result.success) {
      router.replace('/(auth)/birth-input');
    } else {
      // Even if Supabase anonymous auth fails, allow guest to continue
      // (they just won't have a Supabase session, only local state)
      router.replace('/(auth)/birth-input');
    }
  };

  return (
    <View style={styles.container}>
      {/* 먹물 방울 — 큰 원이 퍼지고 완전히 사라짐 */}
      <InkDrop delay={200} x={width * 0.3} y={height * 0.15} size={120} maxScale={3.5} color="#1C1C1E" />
      <InkDrop delay={900} x={width * 0.72} y={height * 0.22} size={90} maxScale={3} color="#3A3A3C" />
      <InkDrop delay={1500} x={width * 0.5} y={height * 0.3} size={70} maxScale={2.5} color="#2C2C2E" />

      <Animated.View style={[styles.contentWrap, contentStyle]}>
        <View style={styles.top}>
          <Text style={styles.title}>MIRi</Text>
          <Text style={styles.subtitle}>{t('auth.welcome')}</Text>
        </View>

        <View style={styles.decorative}>
          <Text style={styles.decorChar}>占</Text>
          <View style={styles.decorLine} />
        </View>

        <View style={styles.buttons}>
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.appleBtn}
              onPress={handleAppleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.appleBtnText}>{t('auth.loginApple')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.googleBtnText}>G</Text>
            <Text style={styles.googleBtnLabel}>{t('auth.loginGoogle')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleGuestLogin}
          style={styles.guestBtn}
          disabled={isLoading}
        >
          <Text style={styles.guestText}>{t('auth.guestLogin')}</Text>
        </TouchableOpacity>

        <Text style={styles.loginInfo}>{t('auth.loginBenefit')}</Text>

        <Text style={styles.disclaimer}>{t('common.disclaimer')}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg.primary,
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: theme.spacing.screenPadding,
    justifyContent: 'center',
  },
  top: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  title: {
    fontSize: 44,
    fontWeight: '200',
    color: theme.colors.text.primary,
    letterSpacing: 14,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
    fontWeight: '300',
    letterSpacing: 2,
  },
  decorative: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  decorChar: {
    fontSize: 36,
    color: theme.colors.text.primary,
    opacity: 0.2,
    fontWeight: '300',
  },
  decorLine: {
    width: 60,
    height: 1,
    backgroundColor: theme.colors.text.tertiary,
    opacity: 0.2,
    marginTop: theme.spacing.md,
  },
  buttons: {
    gap: theme.spacing.md,
  },
  appleBtn: {
    backgroundColor: '#1C1C1E',
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  appleBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  googleBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    minHeight: 52,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
  },
  googleBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleBtnLabel: {
    color: '#3C3C3C',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  guestBtn: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  guestText: {
    color: theme.colors.text.tertiary,
    fontSize: 13,
    textDecorationLine: 'underline',
    letterSpacing: 0.5,
  },
  loginInfo: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.colors.text.tertiary,
    lineHeight: 18,
    marginTop: theme.spacing.sm,
  },
  disclaimer: {
    color: theme.colors.text.tertiary,
    fontSize: 10,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    lineHeight: 14,
  },
});
