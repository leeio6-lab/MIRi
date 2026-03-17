import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';

const SCREEN_W = Dimensions.get('window').width;

interface LoadingInkProps {
  message?: string;
  steps?: string[];
  tips?: string[];
  finalMessage?: string;
  estimatedSeconds?: number;
}

export function LoadingInk({ message, steps, tips, finalMessage, estimatedSeconds = 30 }: LoadingInkProps) {
  const defaultSteps = ['분석하는 중'];
  const defaultFinal = '마무리하는 중';
  const resolvedSteps = steps ?? defaultSteps;
  const resolvedFinal = finalMessage ?? defaultFinal;

  const scale1 = useSharedValue(0.3);
  const scale2 = useSharedValue(0.1);
  const scale3 = useSharedValue(0.2);
  const opacity1 = useSharedValue(0.8);
  const opacity2 = useSharedValue(0.6);
  const opacity3 = useSharedValue(0.4);
  const dotOpacity = useSharedValue(0.3);

  const progressValue = useSharedValue(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [reachedFinal, setReachedFinal] = useState(false);

  // Step messages — spaced across estimated time
  const stepInterval = Math.max(2500, (estimatedSeconds * 1000) / (resolvedSteps.length + 1));

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
    }, stepInterval);
    return () => clearInterval(interval);
  }, [message, resolvedSteps.length, stepInterval]);

  // Shuffle tips once on mount, then rotate every 5s
  const [shuffledTips] = useState(() => {
    if (!tips?.length) return [];
    const arr = [...tips];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  useEffect(() => {
    if (!shuffledTips.length) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % shuffledTips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [shuffledTips.length]);

  // Progress bar — single Reanimated tween, no re-renders
  useEffect(() => {
    progressValue.value = withTiming(95, {
      duration: estimatedSeconds * 1000,
      easing: Easing.out(Easing.quad),
    });
  }, [estimatedSeconds]);

  // Ink animations
  useEffect(() => {
    scale1.value = withRepeat(withSequence(
      withTiming(1, { duration: 2000, easing: Easing.out(Easing.cubic) }),
      withTiming(0.3, { duration: 1500, easing: Easing.in(Easing.cubic) })
    ), -1);
    opacity1.value = withRepeat(withSequence(
      withTiming(0.2, { duration: 2000 }), withTiming(0.8, { duration: 1500 })
    ), -1);
    scale2.value = withRepeat(withSequence(
      withTiming(0.8, { duration: 2500, easing: Easing.out(Easing.cubic) }),
      withTiming(0.1, { duration: 1800, easing: Easing.in(Easing.cubic) })
    ), -1);
    opacity2.value = withRepeat(withSequence(
      withTiming(0.15, { duration: 2500 }), withTiming(0.6, { duration: 1800 })
    ), -1);
    scale3.value = withRepeat(withSequence(
      withTiming(1.2, { duration: 3000, easing: Easing.out(Easing.cubic) }),
      withTiming(0.2, { duration: 2000, easing: Easing.in(Easing.cubic) })
    ), -1);
    opacity3.value = withRepeat(withSequence(
      withTiming(0.1, { duration: 3000 }), withTiming(0.4, { duration: 2000 })
    ), -1);
    dotOpacity.value = withRepeat(withSequence(
      withTiming(1, { duration: 600 }), withTiming(0.3, { duration: 600 })
    ), -1);
  }, []);

  const animStyle1 = useAnimatedStyle(() => ({ transform: [{ scale: scale1.value }], opacity: opacity1.value }));
  const animStyle2 = useAnimatedStyle(() => ({ transform: [{ scale: scale2.value }], opacity: opacity2.value }));
  const animStyle3 = useAnimatedStyle(() => ({ transform: [{ scale: scale3.value }], opacity: opacity3.value }));
  const dotStyle = useAnimatedStyle(() => ({ opacity: dotOpacity.value }));
  const progressStyle = useAnimatedStyle(() => ({ width: `${progressValue.value}%` }));

  const displayText = message ?? (reachedFinal ? resolvedFinal : resolvedSteps[stepIndex]);
  const currentTip = shuffledTips[tipIndex];

  return (
    <View style={styles.container}>
      <View style={styles.inkContainer}>
        <Animated.View style={[styles.inkDrop, styles.ink1, animStyle1]} />
        <Animated.View style={[styles.inkDrop, styles.ink2, animStyle2]} />
        <Animated.View style={[styles.inkDrop, styles.ink3, animStyle3]} />
      </View>

      {/* Step message */}
      <View style={styles.messageRow}>
        <Text style={styles.message}>{displayText}</Text>
        <Animated.Text style={[styles.dots, dotStyle]}>...</Animated.Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressStyle]} />
      </View>

      {/* Tip */}
      {currentTip && (
        <Animated.View key={tipIndex} entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} style={styles.tipWrap}>
          <Text style={styles.tipLabel}>알고 계셨나요?</Text>
          <Text style={styles.tipText}>{currentTip}</Text>
        </Animated.View>
      )}

      {/* Background analysis note */}
      <Text style={styles.warning}>다른 화면을 둘러봐도 분석이 계속됩니다</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg.primary,
    paddingHorizontal: 32,
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
  ink1: { width: 120, height: 120, backgroundColor: '#1C1C1E' },
  ink2: { width: 90, height: 90, backgroundColor: '#3A3A3C', left: 40, top: 20 },
  ink3: { width: 150, height: 150, backgroundColor: '#2C2C2E' },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 28,
  },
  message: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  dots: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  // Progress bar
  progressTrack: {
    width: SCREEN_W - 100,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 2,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.gold.primary,
    borderRadius: 2,
  },
  // Tip
  tipWrap: {
    marginTop: 32,
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 70, // 2줄 고정 높이 (label 19 + tipText 2줄 40 + 여유) — 줄 수 변해도 레이아웃 안 움직임
  },
  tipLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    marginBottom: 4,
    letterSpacing: 1,
  },
  tipText: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Warning
  warning: {
    position: 'absolute',
    bottom: 50,
    fontSize: 12,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
  },
});
