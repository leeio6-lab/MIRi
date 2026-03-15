import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { Button } from '../../src/components/ui/Button';

const { width } = Dimensions.get('window');

interface SlideData {
  id: string;
  titleKey: string;
  descKey: string;
  icon: string;
  color: string;
}

const SLIDES: SlideData[] = [
  { id: '1', titleKey: 'auth.onboarding1Title', descKey: 'auth.onboarding1Desc', icon: '命', color: theme.colors.text.primary },
  { id: '2', titleKey: 'auth.onboarding2Title', descKey: 'auth.onboarding2Desc', icon: '相', color: theme.colors.text.primary },
  { id: '3', titleKey: 'auth.onboarding3Title', descKey: 'auth.onboarding3Desc', icon: '科', color: theme.colors.text.primary },
  { id: '4', titleKey: 'auth.onboarding4Title', descKey: 'auth.onboarding4Desc', icon: '運', color: theme.colors.text.primary },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentSlide = SLIDES[currentIndex];

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.push('/(auth)/login');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>MIRi</Text>
        <Text style={styles.appNameSub}>미리</Text>
      </View>

      {/* Slide content - state based (works on web + native) */}
      <View style={styles.slideArea}>
        <Animated.View
          key={currentSlide.id}
          entering={FadeIn.duration(400)}
          style={styles.slide}
        >
          <View style={styles.iconContainer}>
            <Text style={[styles.icon, { color: currentSlide.color }]}>{currentSlide.icon}</Text>
            <View style={[styles.iconGlow, { backgroundColor: currentSlide.color }]} />
          </View>
          <Text style={styles.slideTitle}>{t(currentSlide.titleKey)}</Text>
          <Text style={styles.slideDesc}>{t(currentSlide.descKey)}</Text>
        </Animated.View>
      </View>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <Pressable key={i} onPress={() => setCurrentIndex(i)}>
            <View style={[styles.dot, i === currentIndex && styles.dotActive]} />
          </Pressable>
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.footer}>
        <Button
          title={currentIndex === SLIDES.length - 1 ? t('birth.start') : t('common.next')}
          onPress={handleNext}
          style={styles.btn}
        />
        {currentIndex < SLIDES.length - 1 && (
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.skipText}>{t('auth.skipOnboarding')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.primary },
  header: { paddingTop: 70, alignItems: 'center', gap: 2 },
  appName: { fontSize: 28, fontWeight: '200', color: theme.colors.text.primary, letterSpacing: 8 },
  appNameSub: { fontSize: 14, color: theme.colors.text.secondary, letterSpacing: 4, fontWeight: '300' },
  slideArea: { flex: 1, justifyContent: 'center' },
  slide: { alignItems: 'center', paddingHorizontal: theme.spacing.xl },
  iconContainer: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.xl, borderRadius: 70, borderWidth: 1, borderColor: theme.colors.text.primary + '12' },
  icon: { fontSize: 64, fontWeight: '300', zIndex: 1 },
  iconGlow: { position: 'absolute', width: 100, height: 100, borderRadius: 50, opacity: 0.1 },
  slideTitle: { ...theme.typo.screenTitle, color: theme.colors.text.primary, textAlign: 'center', marginBottom: theme.spacing.md },
  slideDesc: { ...theme.typo.body, textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingVertical: theme.spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.gold.primary + '20' },
  dotActive: { backgroundColor: theme.colors.gold.primary, width: 28, borderRadius: 4 },
  footer: { paddingHorizontal: theme.spacing.screenPadding, paddingBottom: theme.spacing.xxl, gap: theme.spacing.sm },
  btn: { width: '100%' },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipText: { ...theme.typo.caption, color: theme.colors.text.tertiary },
});
