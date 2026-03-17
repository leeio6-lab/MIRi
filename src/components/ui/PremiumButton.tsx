import React, { useEffect, useMemo } from 'react';
import { Text, StyleSheet, TouchableOpacity, View, Platform, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';

interface Props {
  title: string;
  price?: string;
  onPress: () => void;
  variant?: 'shimmer' | 'pulse' | 'merge';
  socialProof?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
}

export function PremiumButton({
  title, price, onPress, variant = 'shimmer', socialProof = false, loading = false, disabled = false, style,
}: Props) {
  // Shimmer
  const shimmerX = useSharedValue(-1);
  useEffect(() => {
    if (variant === 'shimmer' || variant === 'merge') {
      shimmerX.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withDelay(1500, withTiming(-1, { duration: 0 })),
        ), -1
      );
    }
  }, [variant]);

  const shimmerStyle = useAnimatedStyle(() => ({
    left: `${interpolate(shimmerX.value, [-1, 1], [-30, 130])}%`,
  }));

  // Price pulse
  const priceScale = useSharedValue(1);
  useEffect(() => {
    if (price && (variant === 'pulse' || variant === 'shimmer')) {
      priceScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        ), -1
      );
    }
  }, [price, variant]);
  const priceStyle = useAnimatedStyle(() => ({ transform: [{ scale: priceScale.value }] }));

  // Merge circles
  const mergeX = useSharedValue(15);
  useEffect(() => {
    if (variant === 'merge') {
      mergeX.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(15, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        ), -1
      );
    }
  }, [variant]);
  const leftCircle = useAnimatedStyle(() => ({
    transform: [{ translateX: -mergeX.value }],
    opacity: interpolate(mergeX.value, [0, 15], [0.25, 0.12]),
  }));
  const rightCircle = useAnimatedStyle(() => ({
    transform: [{ translateX: mergeX.value }],
    opacity: interpolate(mergeX.value, [0, 15], [0.25, 0.12]),
  }));

  // Press animation
  const btnScale = useSharedValue(1);
  const handlePressIn = () => {
    btnScale.value = withSpring(0.96, { damping: 15 });
    try { const H = require('expo-haptics'); H.impactAsync(H.ImpactFeedbackStyle.Light); } catch {}
  };
  const handlePressOut = () => { btnScale.value = withSpring(1, { damping: 10 }); };
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  // Social proof count
  const count = useMemo(() => {
    const d = new Date();
    return 127 + ((d.getHours() * 13 + d.getMinutes()) % 89);
  }, []);

  return (
    <View style={[styles.wrapper, style]}>
      {socialProof && (
        <Text style={styles.socialText}>오늘 {count}명이 분석을 받았어요</Text>
      )}
      <Animated.View style={btnStyle}>
        <TouchableOpacity
          style={[styles.btn, disabled && styles.btnDisabled]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          disabled={disabled || loading}
        >
          {/* Merge circles */}
          {variant === 'merge' && (
            <View style={styles.mergeWrap}>
              <Animated.View style={[styles.mergeCircle, leftCircle]} />
              <Animated.View style={[styles.mergeCircle, rightCircle]} />
            </View>
          )}

          {/* Shimmer */}
          {(variant === 'shimmer' || variant === 'merge') && (
            <Animated.View style={[styles.shimmer, shimmerStyle]} />
          )}

          {/* Content */}
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.content}>
              <Text style={styles.title}>{title}</Text>
              {price && (
                <Animated.View style={priceStyle}>
                  <Text style={styles.price}> · {price}</Text>
                </Animated.View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  socialText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
  },
  btn: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
    }),
  } as any,
  btnDisabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#E8B04A',
    letterSpacing: 0.5,
  },
  price: {
    fontSize: 17,
    fontWeight: '700',
    color: '#E8B04A',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    width: '25%',
    height: '100%',
    backgroundColor: 'rgba(232,176,74,0.15)',
    transform: [{ skewX: '-15deg' }],
  },
  mergeWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mergeCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
