import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { theme } from '../../constants/theme';

interface LoadingInkProps {
  message?: string;
  steps?: string[];
  finalMessage?: string;
}

export function LoadingInk({ message, steps, finalMessage }: LoadingInkProps) {
  const { t } = useTranslation();
  const defaultSteps = t('loading.defaultSteps', { returnObjects: true }) as string[];
  const defaultFinal = t('loading.defaultFinal');
  const resolvedSteps = steps ?? defaultSteps;
  const resolvedFinal = finalMessage ?? defaultFinal;
  const scale1 = useSharedValue(0.3);
  const scale2 = useSharedValue(0.1);
  const scale3 = useSharedValue(0.2);
  const opacity1 = useSharedValue(0.8);
  const opacity2 = useSharedValue(0.6);
  const opacity3 = useSharedValue(0.4);
  const dotOpacity = useSharedValue(0.3);

  const [stepIndex, setStepIndex] = useState(0);
  const [reachedFinal, setReachedFinal] = useState(false);

  // 단계별 메시지 — 3초 간격, 마지막까지 가면 멈춤
  useEffect(() => {
    if (message) return;

    const interval = setInterval(() => {
      setStepIndex((prev) => {
        const next = prev + 1;
        if (next >= resolvedSteps.length) {
          setReachedFinal(true);
          clearInterval(interval);
          return prev;
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [message, resolvedSteps.length]);

  useEffect(() => {
    scale1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.out(Easing.cubic) }),
        withTiming(0.3, { duration: 1500, easing: Easing.in(Easing.cubic) })
      ),
      -1
    );
    opacity1.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 2000 }),
        withTiming(0.8, { duration: 1500 })
      ),
      -1
    );
    scale2.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2500, easing: Easing.out(Easing.cubic) }),
        withTiming(0.1, { duration: 1800, easing: Easing.in(Easing.cubic) })
      ),
      -1
    );
    opacity2.value = withRepeat(
      withSequence(
        withTiming(0.15, { duration: 2500 }),
        withTiming(0.6, { duration: 1800 })
      ),
      -1
    );
    scale3.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 3000, easing: Easing.out(Easing.cubic) }),
        withTiming(0.2, { duration: 2000, easing: Easing.in(Easing.cubic) })
      ),
      -1
    );
    opacity3.value = withRepeat(
      withSequence(
        withTiming(0.1, { duration: 3000 }),
        withTiming(0.4, { duration: 2000 })
      ),
      -1
    );
    dotOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.3, { duration: 600 })
      ),
      -1
    );
  }, []);

  const animStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: opacity1.value,
  }));
  const animStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: opacity2.value,
  }));
  const animStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }],
    opacity: opacity3.value,
  }));
  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  const displayText = message ?? (reachedFinal ? resolvedFinal : resolvedSteps[stepIndex]);

  return (
    <View style={styles.container}>
      <View style={styles.inkContainer}>
        <Animated.View style={[styles.inkDrop, styles.ink1, animStyle1]} />
        <Animated.View style={[styles.inkDrop, styles.ink2, animStyle2]} />
        <Animated.View style={[styles.inkDrop, styles.ink3, animStyle3]} />
      </View>
      <View style={styles.messageRow}>
        <Text style={styles.message}>{displayText}</Text>
        <Animated.Text style={[styles.dots, dotStyle]}>...</Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg.primary,
  },
  inkContainer: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inkDrop: {
    position: 'absolute',
    borderRadius: 9999,
  },
  ink1: {
    width: 120,
    height: 120,
    backgroundColor: '#1C1C1E',
  },
  ink2: {
    width: 90,
    height: 90,
    backgroundColor: '#3A3A3C',
    left: 40,
    top: 20,
  },
  ink3: {
    width: 150,
    height: 150,
    backgroundColor: '#2C2C2E',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: theme.spacing.xl,
  },
  message: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    letterSpacing: 0.5,
  },
  dots: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
});
