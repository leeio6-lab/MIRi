import React, { useState, useMemo } from 'react';
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
import { BackButton } from '../../src/components/ui/BackButton';
import { useAuthStore } from '../../src/stores/authStore';
import {
  calculateFourPillars,
  calculateMonthlyFortune,
  calculateYearlyFortune,
} from '../../src/utils/saju-calc';

// 십성 기반 월운 점수 매핑 (만세력 기반 결정적 계산)
const TEN_GOD_SCORE: Record<string, number> = {
  '비견': 65, '겁재': 58, '식신': 78, '상관': 62,
  '편재': 75, '정재': 80, '편관': 55, '정관': 72,
  '편인': 68, '정인': 76,
};

// 12운성 보정값
const LIFE_STAGE_BONUS: Record<string, number> = {
  '장생': 8, '목욕': 2, '관대': 6, '건록': 10, '제왕': 12,
  '쇠': -2, '병': -5, '사': -8, '묘': -10, '절': -6, '태': 0, '양': 4,
};

// 십성 기반 키워드
const TEN_GOD_KEYWORD: Record<string, string> = {
  '비견': '경쟁', '겁재': '변화', '식신': '행운', '상관': '도전',
  '편재': '기회', '정재': '안정', '편관': '시련', '정관': '성취',
  '편인': '학습', '정인': '성장',
};

export default function YearlyScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // 만세력 기반 월운 계산 (결정적, 랜덤 없음)
  const monthlyData = useMemo(() => {
    if (!user) return null;
    try {
      const pillars = calculateFourPillars(user.birthYear, user.birthMonth, user.birthDay, user.birthHour, undefined, undefined, undefined, user.isLunar);
      const monthly = calculateMonthlyFortune(pillars.day.stemIdx, currentYear);
      const yearly = calculateYearlyFortune(pillars.day.stemIdx, currentYear);

      return monthly.map((m) => {
        const baseScore = TEN_GOD_SCORE[m.tenGod] ?? 65;
        const bonus = LIFE_STAGE_BONUS[m.lifeStage] ?? 0;
        const score = Math.max(35, Math.min(95, baseScore + bonus));
        const keyword = TEN_GOD_KEYWORD[m.tenGod] ?? '평온';

        return {
          month: m.month,
          score,
          keyword,
          tenGod: m.tenGod,
          lifeStage: m.lifeStage,
          pillar: `${m.stemHanja}${m.branchHanja}`,
        };
      });
    } catch {
      return null;
    }
  }, [user?.birthYear, user?.birthMonth, user?.birthDay, user?.birthHour, currentYear]);

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

      {monthlyData ? (
        <View style={styles.monthsGrid}>
          {monthlyData.map((item, i) => {
            const isCurrentMonth = item.month === currentMonth;
            const scoreColor =
              item.score >= 80 ? theme.colors.success :
              item.score >= 60 ? theme.colors.gold.primary :
              theme.colors.warning;

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
                  <Text style={styles.monthPillar}>{item.pillar}</Text>
                  <Text style={[styles.monthScore, { color: scoreColor }]}>
                    {item.score}
                  </Text>
                  <Text style={styles.monthKeyword}>{item.keyword}</Text>
                  <Text style={styles.monthTenGod}>{item.tenGod}</Text>
                </GlassCard>
              </Animated.View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{t('result.noResult')}</Text>
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
  monthLabel: { fontSize: 13, color: theme.colors.text.secondary, marginBottom: 2 },
  monthLabelActive: { color: theme.colors.gold.primary, fontWeight: '700' },
  monthPillar: { fontSize: 11, color: theme.colors.text.tertiary, marginBottom: theme.spacing.xs },
  monthScore: { fontSize: 28, fontWeight: '700', marginBottom: 2 },
  monthKeyword: { fontSize: 11, color: theme.colors.text.tertiary },
  monthTenGod: { fontSize: 10, color: theme.colors.gold.muted, marginTop: 2 },
  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: theme.colors.text.secondary },
});
