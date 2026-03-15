import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  withRepeat,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../src/constants/theme';

const { width, height } = Dimensions.get('window');

export default function TransformingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ imageUri?: string }>();

  // Ink spread animations
  const ink1Scale = useSharedValue(0);
  const ink1Opacity = useSharedValue(0);
  const ink2Scale = useSharedValue(0);
  const ink2Opacity = useSharedValue(0);
  const ink3Scale = useSharedValue(0);
  const ink3Opacity = useSharedValue(0);

  // Crossfade original -> portrait
  const overlayOpacity = useSharedValue(0);

  // Text
  const text1Opacity = useSharedValue(1);
  const text2Opacity = useSharedValue(0);
  const text3Opacity = useSharedValue(0);

  useEffect(() => {
    // Ink drop 1 - center
    ink1Opacity.value = withTiming(0.7, { duration: 500 });
    ink1Scale.value = withTiming(4, { duration: 3000, easing: Easing.out(Easing.cubic) });

    // Ink drop 2 - offset
    ink2Opacity.value = withDelay(400, withTiming(0.5, { duration: 500 }));
    ink2Scale.value = withDelay(400, withTiming(3.5, { duration: 2800, easing: Easing.out(Easing.cubic) }));

    // Ink drop 3 - large
    ink3Opacity.value = withDelay(800, withTiming(0.6, { duration: 500 }));
    ink3Scale.value = withDelay(800, withTiming(5, { duration: 3000, easing: Easing.out(Easing.cubic) }));

    // Overlay covers the selfie
    overlayOpacity.value = withDelay(1500, withTiming(0.85, { duration: 2000, easing: Easing.inOut(Easing.cubic) }));

    // Text transitions
    text1Opacity.value = withDelay(2500, withTiming(0, { duration: 500 }));
    text2Opacity.value = withSequence(
      withDelay(3000, withTiming(1, { duration: 500 })),
      withDelay(2000, withTiming(0, { duration: 500 }))
    );
    text3Opacity.value = withDelay(5500, withTiming(1, { duration: 500 }));

    // Navigate to result after animation
    const timer = setTimeout(() => {
      router.replace('/face/result');
    }, 7000);

    return () => clearTimeout(timer);
  }, []);

  const ink1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ink1Scale.value }],
    opacity: ink1Opacity.value,
  }));
  const ink2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ink2Scale.value }],
    opacity: ink2Opacity.value,
  }));
  const ink3Style = useAnimatedStyle(() => ({
    transform: [{ scale: ink3Scale.value }],
    opacity: ink3Opacity.value,
  }));
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));
  const text1Style = useAnimatedStyle(() => ({ opacity: text1Opacity.value }));
  const text2Style = useAnimatedStyle(() => ({ opacity: text2Opacity.value }));
  const text3Style = useAnimatedStyle(() => ({ opacity: text3Opacity.value }));

  return (
    <View style={styles.container}>
      {/* Selfie background */}
      {params.imageUri && (
        <Image
          source={{ uri: params.imageUri }}
          style={styles.selfieImage}
          blurRadius={2}
        />
      )}

      {/* Ink overlay - covers the selfie with brush-like effect */}
      <Animated.View style={[styles.inkOverlay, overlayStyle]}>
        <View style={styles.inkTexture} />
      </Animated.View>

      {/* Ink drops */}
      <View style={styles.inkContainer}>
        <Animated.View style={[styles.inkDrop, styles.ink1, ink1Style]} />
        <Animated.View style={[styles.inkDrop, styles.ink2, ink2Style]} />
        <Animated.View style={[styles.inkDrop, styles.ink3, ink3Style]} />
      </View>

      {/* Text transitions */}
      <View style={styles.textContainer}>
        <Animated.Text style={[styles.statusText, text1Style]}>
          당신의 관상을 그리는 중...
        </Animated.Text>
        <Animated.Text style={[styles.statusText, styles.statusText2, text2Style]}>
          면상학의 눈으로 바라보는 중...
        </Animated.Text>
        <Animated.Text style={[styles.statusText, styles.statusText3, text3Style]}>
          관상화가 완성되었습니다
        </Animated.Text>
      </View>

      {/* Decorative elements */}
      <View style={styles.cornerTL}>
        <Text style={styles.cornerChar}>面</Text>
      </View>
      <View style={styles.cornerBR}>
        <Text style={styles.cornerChar}>相</Text>
      </View>
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
  selfieImage: {
    position: 'absolute',
    width: width,
    height: height,
    opacity: 0.4,
  },
  inkOverlay: {
    position: 'absolute',
    width: width,
    height: height,
    backgroundColor: theme.colors.bg.primary,
  },
  inkTexture: {
    flex: 1,
    backgroundColor: theme.colors.bg.secondary,
    opacity: 0.5,
  },
  inkContainer: {
    position: 'absolute',
    width: width,
    height: height,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inkDrop: {
    position: 'absolute',
    borderRadius: 9999,
  },
  ink1: {
    width: 80,
    height: 80,
    backgroundColor: theme.colors.bg.tertiary,
  },
  ink2: {
    width: 60,
    height: 60,
    backgroundColor: theme.colors.gold.dark,
    opacity: 0.3,
    left: width * 0.3,
    top: height * 0.35,
  },
  ink3: {
    width: 100,
    height: 100,
    backgroundColor: theme.colors.bg.elevated,
    right: width * 0.2,
    bottom: height * 0.3,
  },
  textContainer: {
    position: 'absolute',
    bottom: height * 0.2,
    alignItems: 'center',
  },
  statusText: {
    position: 'absolute',
    fontSize: 18,
    color: theme.colors.gold.light,
    textAlign: 'center',
    letterSpacing: 2,
  },
  statusText2: {
    color: theme.colors.gold.primary,
  },
  statusText3: {
    color: theme.colors.gold.primary,
    fontWeight: '700',
    fontSize: 20,
  },
  cornerTL: {
    position: 'absolute',
    top: 60,
    left: theme.spacing.lg,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 60,
    right: theme.spacing.lg,
  },
  cornerChar: {
    fontSize: 32,
    color: theme.colors.gold.muted,
    opacity: 0.2,
  },
});
