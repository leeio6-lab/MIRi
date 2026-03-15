import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { BackButton } from '../../src/components/ui/BackButton';
import { LoadingInk } from '../../src/components/ui/LoadingInk';
import { useAuthStore } from '../../src/stores/authStore';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const MOCK_MONTHLY = MONTHS.map((m) => ({
  month: m,
  score: Math.floor(Math.random() * 30 + 60),
  keyword: ['새 시작', '인내', '행운', '도전', '평화', '성장', '변화', '안정', '기회', '수확', '감사', '정리'][m - 1],
}));

export default function YearlyScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<typeof MOCK_MONTHLY | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setResult(MOCK_MONTHLY);
    setLoading(false);
  };

  if (loading) return <LoadingInk steps={t('loading.yearlySteps', { returnObjects: true }) as string[]} finalMessage={t('loading.yearlyFinal')} />;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <BackButton />

      <Text style={styles.title}>{t('yearly.title', { year: currentYear })}</Text>
      <Text style={styles.subtitle}>
        {user ? t('yearly.birthInfo', { year: user.birthYear, month: user.birthMonth, day: user.birthDay }) : ''}
      </Text>

      {!result ? (
        <Button title={t('yearly.analyzeButton')} onPress={handleAnalyze} style={styles.analyzeBtn} />
      ) : (
        <View style={styles.monthsGrid}>
          {result.map((item, i) => {
            const isCurrentMonth = item.month === currentMonth;
            const scoreColor =
              item.score >= 80 ? theme.colors.success :
              item.score >= 60 ? theme.colors.gold.primary :
              theme.colors.error;

            return (
              <Animated.View
                key={item.month}
                entering={FadeInDown.delay(i * 80).springify()}
              >
                <GlassCard
                  style={isCurrentMonth ? { ...styles.monthCard, ...styles.monthCardActive } : styles.monthCard}
                  gold={isCurrentMonth}
                >
                  <Text style={[styles.monthLabel, isCurrentMonth && styles.monthLabelActive]}>
                    {item.month}월
                  </Text>
                  <Text style={[styles.monthScore, { color: scoreColor }]}>
                    {item.score}
                  </Text>
                  <Text style={styles.monthKeyword}>{item.keyword}</Text>
                </GlassCard>
              </Animated.View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.primary },
  content: { padding: theme.spacing.screenPadding, paddingTop: 60, paddingBottom: 120 },
  title: {
    ...theme.typo.screenTitle,
    textAlign: 'center', marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 14, color: theme.colors.text.secondary,
    textAlign: 'center', marginBottom: theme.spacing.sectionGap,
  },
  analyzeBtn: { marginTop: theme.spacing.xl },
  monthsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: theme.spacing.sm, justifyContent: 'center',
  },
  monthCard: {
    width: 100, alignItems: 'center', paddingVertical: theme.spacing.md,
  },
  monthCardActive: {
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  monthLabel: { fontSize: 13, color: theme.colors.text.secondary, marginBottom: theme.spacing.xs },
  monthLabelActive: { color: theme.colors.gold.primary, fontWeight: '700' },
  monthScore: { fontSize: 28, fontWeight: '700', marginBottom: theme.spacing.xs },
  monthKeyword: { fontSize: 11, color: theme.colors.text.tertiary },
});
