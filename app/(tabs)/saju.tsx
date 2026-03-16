import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { LoadingInk } from '../../src/components/ui/LoadingInk';
import { PaywallModal } from '../../src/components/ui/PaywallModal';
import { useAuthStore } from '../../src/stores/authStore';
import { useFortuneStore } from '../../src/stores/fortuneStore';
import { calculateFourPillars } from '../../src/utils/saju-calc';
import { api, formatPillarInfo } from '../../src/services/api';
import { CONFIG } from '../../src/constants/config';

export default function SajuScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const ANALYSIS_ITEMS = useMemo(() => [
    { icon: t('saju.features.personality_icon'), title: t('saju.features.personality_title'), desc: t('saju.features.personality_desc') },
    { icon: t('saju.features.career_icon'), title: t('saju.features.career_title'), desc: t('saju.features.career_desc') },
    { icon: t('saju.features.love_icon'), title: t('saju.features.love_title'), desc: t('saju.features.love_desc') },
    { icon: t('saju.features.health_icon'), title: t('saju.features.health_title'), desc: t('saju.features.health_desc') },
    { icon: t('saju.features.yearly_icon'), title: t('saju.features.yearly_title'), desc: t('saju.features.yearly_desc') },
    { icon: t('saju.features.bigFortune_icon'), title: t('saju.features.bigFortune_title'), desc: t('saju.features.bigFortune_desc') },
    { icon: t('saju.features.lucky_icon'), title: t('saju.features.lucky_title'), desc: t('saju.features.lucky_desc') },
  ], [t]);
  const { user } = useAuthStore();
  const { setSajuResult, isLoading, setLoading, error, setError, saveAndRecord } = useFortuneStore();
  const [showPaywall, setShowPaywall] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const pillars = useMemo(
    () => user
      ? calculateFourPillars(user.birthYear, user.birthMonth, user.birthDay, user.birthHour, undefined, undefined, undefined, user.isLunar)
      : null,
    [user?.birthYear, user?.birthMonth, user?.birthDay, user?.birthHour]
  );

  const handlePaidAnalyze = useCallback(async () => {
    console.log('[Saju] handlePaidAnalyze called, user:', user ? `${user.birthYear}.${user.birthMonth}.${user.birthDay}` : 'NULL');
    setLocalError(null);

    if (!user) {
      // Web: use window.location for reliable navigation
      if (Platform.OS === 'web') {
        window.location.href = '/birth-input';
      } else {
        router.push('/(auth)/birth-input');
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pillarInfo = pillars
        ? formatPillarInfo(pillars, user.birthYear, user.birthMonth, user.birthDay, user.gender)
        : undefined;

      console.log('[Saju] Calling API...');
      const result = await api.analyzeSaju(
        {
          year: user.birthYear,
          month: user.birthMonth,
          day: user.birthDay,
          hour: user.birthHour,
          isLunar: user.isLunar,
          gender: user.gender,
        },
        user.locale,
        true,
        'integrated',
        pillarInfo,
        user.name,
      );
      console.log('[Saju] API success, navigating to result');
      setSajuResult(result);
      saveAndRecord('saju', true, result);
      router.push('/saju/result');
    } catch (err) {
      console.error('[Saju] Analysis error:', err);
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
      setLocalError(msg);
    } finally {
      setLoading(false);
    }
  }, [user, pillars]);

  if (isLoading) {
    return <LoadingInk steps={t('loading.sajuSteps', { returnObjects: true }) as string[]} tips={t('loading.sajuTips', { returnObjects: true }) as string[]} finalMessage={t('loading.sajuFinal')} estimatedSeconds={30} />;
  }

  const displayError = localError || error;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Error banner */}
      {displayError && (
        <TouchableOpacity style={styles.errorBanner} onPress={() => { setLocalError(null); setError(null); }}>
          <Text style={styles.errorText}>{displayError}</Text>
          <Text style={styles.errorDismiss}>X</Text>
        </TouchableOpacity>
      )}

      {/* No user warning */}
      {!user && (
        <TouchableOpacity
          style={styles.warningBanner}
          onPress={() => {
            if (Platform.OS === 'web') {
              window.location.href = '/birth-input';
            } else {
              router.push('/(auth)/birth-input');
            }
          }}
        >
          <Text style={styles.warningText}>{t('saju.heroSub')}</Text>
          <Text style={styles.warningLink}>{t('birth.title')} &rarr;</Text>
        </TouchableOpacity>
      )}

      {/* Hero + CTA (첫 화면에 바로 보이도록) */}
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <View style={styles.hero}>
          <Text style={styles.heroChar}>命</Text>
          <Text style={styles.heroTitle}>{t('saju.heroTitle')}</Text>
          <Text style={styles.heroSub}>
            {t('saju.heroSub')}
          </Text>
        </View>

        {/* CTA 버튼 — 첫 화면에 바로 노출 */}
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => CONFIG.DEV_BYPASS_PAYMENT ? handlePaidAnalyze() : setShowPaywall(true)}
          activeOpacity={0.85}
        >
          <View style={styles.ctaInner}>
            <View>
              <Text style={styles.ctaTitle}>{t('saju.ctaTitle')}</Text>
              <Text style={styles.ctaSub}>{t('saju.ctaSub')}</Text>
            </View>
            <View style={styles.ctaPriceBox}>
              <View style={styles.ctaDiscountBadge}>
                <Text style={styles.ctaDiscountText}>50% OFF</Text>
              </View>
              <Text style={styles.ctaPriceOld}>{t('saju.ctaPriceOld')}</Text>
              <Text style={styles.ctaPrice}>{t('paywall.price')}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* 분석 항목 미리보기 */}
      <Animated.View entering={FadeInDown.delay(250).springify()}>
        <Text style={styles.sectionTitle}>{t('saju.includedAnalysis')}</Text>
        {ANALYSIS_ITEMS.map((item) => (
          <GlassCard key={item.icon} style={styles.featureCard}>
            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>{item.icon}</Text>
              </View>
              <View style={styles.featureBody}>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureDesc}>{item.desc}</Text>
              </View>
            </View>
          </GlassCard>
        ))}
      </Animated.View>

      <Text style={styles.disclaimer}>{t('common.disclaimer')}</Text>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUnlocked={() => handlePaidAnalyze()}
        productType="saju"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg.primary,
  },
  content: {
    padding: theme.spacing.screenPadding,
    paddingTop: 60,
    paddingBottom: 120,
  },
  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  heroChar: {
    fontSize: 64,
    fontWeight: '200',
    color: theme.colors.gold.primary,
    marginBottom: theme.spacing.md,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: 2,
    marginBottom: theme.spacing.sm,
  },
  heroSub: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  // Feature cards
  featureCard: {
    marginBottom: theme.spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(181,149,48,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.gold.primary,
  },
  featureBody: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    lineHeight: 18,
  },
  // CTA (Hero 바로 아래)
  ctaBtn: {
    backgroundColor: '#1C1C1E',
    borderRadius: theme.radius.lg,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: theme.colors.gold.dark + '60',
    marginBottom: theme.spacing.xl,
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    marginBottom: 4,
  },
  ctaSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.3,
  },
  ctaPriceBox: {
    alignItems: 'flex-end',
  },
  ctaDiscountBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
    alignSelf: 'flex-end',
  },
  ctaDiscountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  ctaPriceOld: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  ctaPrice: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.gold.primary,
  },
  disclaimer: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: theme.spacing.xl,
  },
  errorBanner: {
    backgroundColor: '#FF3B30',
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  errorDismiss: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  warningBanner: {
    backgroundColor: 'rgba(181,149,48,0.15)',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.gold.primary + '40',
    padding: 14,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  warningText: {
    color: theme.colors.text.secondary,
    fontSize: 13,
    marginBottom: 6,
  },
  warningLink: {
    color: theme.colors.gold.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
