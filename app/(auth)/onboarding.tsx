import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, PanResponder } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { Button } from '../../src/components/ui/Button';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;

interface SlideData {
  id: string;
  titleKey: string;
  descKey: string;
  icon: string;
}

const SLIDES: SlideData[] = [
  { id: '1', titleKey: 'auth.onboarding1Title', descKey: 'auth.onboarding1Desc', icon: '命' },
  { id: '2', titleKey: 'auth.onboarding2Title', descKey: 'auth.onboarding2Desc', icon: '相' },
  { id: '3', titleKey: 'auth.onboarding3Title', descKey: 'auth.onboarding3Desc', icon: '緣' },
  { id: '4', titleKey: 'auth.onboarding4Title', descKey: 'auth.onboarding4Desc', icon: '運' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'right' | 'left'>('right');

  const currentSlide = SLIDES[currentIndex];

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= SLIDES.length || idx === currentIndex) return;
    setDirection(idx > currentIndex ? 'right' : 'left');
    setCurrentIndex(idx);
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      goTo(currentIndex + 1);
    } else {
      router.push('/(auth)/login');
    }
  };

  // 좌우 스와이프
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -SWIPE_THRESHOLD && currentIndex < SLIDES.length - 1) {
          goTo(currentIndex + 1);
        } else if (g.dx > SWIPE_THRESHOLD && currentIndex > 0) {
          goTo(currentIndex - 1);
        }
      },
    })
  ).current;

  return (
    <View style={s.container}>
      {/* 브랜드 헤더 */}
      <View style={s.header}>
        <Text style={s.appName}>명리</Text>
        <View style={s.headerDecoRow}>
          <View style={s.headerDeco} />
          <Text style={s.appNameSub}>운명의 이치를 읽다</Text>
          <View style={s.headerDeco} />
        </View>
      </View>

      {/* 슬라이드 (스와이프 가능) */}
      <View style={s.slideArea} {...panResponder.panHandlers}>
        <Animated.View
          key={currentSlide.id}
          entering={FadeIn.duration(600)}
          exiting={FadeOut.duration(300)}
          style={s.slide}
        >
          {/* 한자 아이콘 */}
          <View style={s.iconWrap}>
            <View style={s.iconCornerTL} />
            <View style={s.iconCornerTR} />
            <View style={s.iconCornerBL} />
            <View style={s.iconCornerBR} />
            <Text style={s.icon}>{currentSlide.icon}</Text>
          </View>

          {/* 점 장식 */}
          <View style={s.dotsRow}>
            <View style={s.dotSmall} />
            <View style={s.dotSmall} />
            <View style={s.dotSmall} />
          </View>

          {/* 텍스트 */}
          <Text style={s.slideTitle}>{t(currentSlide.titleKey)}</Text>
          <Text style={s.slideDesc}>{t(currentSlide.descKey)}</Text>
        </Animated.View>
      </View>

      {/* 인디케이터 */}
      <View style={s.dots}>
        {SLIDES.map((slide, i) => (
          <Pressable key={slide.id} onPress={() => goTo(i)}>
            <View style={[s.dot, i === currentIndex && s.dotActive]} />
          </Pressable>
        ))}
      </View>

      {/* 버튼 */}
      <View style={s.footer}>
        <Button
          title={currentIndex === SLIDES.length - 1 ? t('birth.start') : t('common.next')}
          onPress={handleNext}
          style={s.btn}
        />
        {currentIndex < SLIDES.length - 1 && (
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            style={({ pressed }) => [s.skipBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={s.skipText}>{t('auth.skipOnboarding')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.primary },
  header: { paddingTop: 70, alignItems: 'center', gap: 8 },
  appName: { fontSize: 32, fontWeight: '200', color: theme.colors.text.primary, letterSpacing: 6 },
  headerDecoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerDeco: { width: 20, height: 1, backgroundColor: theme.colors.gold.light, opacity: 0.3 },
  appNameSub: { fontSize: 11, color: theme.colors.text.tertiary, letterSpacing: 3, fontWeight: '400' },

  slideArea: { flex: 1, justifyContent: 'center', overflow: 'hidden' },
  slide: { alignItems: 'center', paddingHorizontal: theme.spacing.xl },

  iconWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 24, position: 'relative' },
  icon: { fontSize: 56, fontWeight: '200', color: theme.colors.gold.primary, letterSpacing: 4 },
  iconCornerTL: { position: 'absolute', top: 0, left: 0, width: 18, height: 18, borderTopWidth: 1, borderLeftWidth: 1, borderColor: theme.colors.gold.light + '40' },
  iconCornerTR: { position: 'absolute', top: 0, right: 0, width: 18, height: 18, borderTopWidth: 1, borderRightWidth: 1, borderColor: theme.colors.gold.light + '40' },
  iconCornerBL: { position: 'absolute', bottom: 0, left: 0, width: 18, height: 18, borderBottomWidth: 1, borderLeftWidth: 1, borderColor: theme.colors.gold.light + '40' },
  iconCornerBR: { position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderBottomWidth: 1, borderRightWidth: 1, borderColor: theme.colors.gold.light + '40' },

  dotsRow: { flexDirection: 'row', gap: 5, marginBottom: 20 },
  dotSmall: { width: 2, height: 2, borderRadius: 1, backgroundColor: theme.colors.text.primary, opacity: 0.25 },

  slideTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.text.primary, textAlign: 'center', marginBottom: 14, letterSpacing: 2 },
  slideDesc: { fontSize: 14, fontWeight: '400', color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 24, letterSpacing: 0.5 },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingVertical: theme.spacing.lg },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.gold.primary + '20' },
  dotActive: { backgroundColor: theme.colors.gold.primary, width: 24, borderRadius: 3 },

  footer: { paddingHorizontal: theme.spacing.screenPadding, paddingBottom: theme.spacing.xxl, gap: theme.spacing.sm },
  btn: { width: '100%' },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipText: { fontSize: 13, color: theme.colors.text.tertiary, letterSpacing: 1 },
});
