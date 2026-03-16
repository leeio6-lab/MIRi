import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { LoadingInk } from '../../src/components/ui/LoadingInk';
import { FourPillarsView } from '../../src/components/saju/FourPillars';
import { ElementChart } from '../../src/components/saju/ElementChart';
import { PaywallModal } from '../../src/components/ui/PaywallModal';
import { DateInputRow } from '../../src/components/ui/DateInputRow';
import { useAuthStore } from '../../src/stores/authStore';
import { useFortuneStore } from '../../src/stores/fortuneStore';
import { usePurchaseStore } from '../../src/stores/purchaseStore';
import { useDailyFortune } from '../../src/hooks/useDailyFortune';
import { calculateFourPillars, hourToBranchIndex, getTenGod, calculateWeeklyFortune, calculateTodaySaju } from '../../src/utils/saju-calc';
import { api, formatPillarInfo } from '../../src/services/api';
import { CITIES, type City } from '../../src/constants/cities';
import { HOURLY_INSIGHTS } from '../../src/constants/hourlyInsights';
import { DAILY_INSIGHTS } from '../../src/constants/dailyInsights';
import { TEN_GOD_TIPS, getTodayBranchIdx, getTodayZodiacMatch, getFortuneGrade } from '../../src/constants/dailyCuriosity';

// Element descriptions are now in i18n files under home.elementDesc.*

function PulseHint() {
  const { t } = useTranslation();
  const opacity = useSharedValue(0.4);
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, // infinite
    );
    translateY.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[pulseStyles.container, animStyle]}>
      <View style={pulseStyles.row}>
        <Text style={pulseStyles.arrow}>↓</Text>
        <Text style={pulseStyles.text}>{t('home.tapDetail')}</Text>
        <Text style={pulseStyles.arrow}>↓</Text>
      </View>
    </Animated.View>
  );
}

const pulseStyles = StyleSheet.create({
  container: {
    marginTop: 4,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.gold.primary + '15',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  arrow: {
    fontSize: 12,
    color: theme.colors.gold.primary,
    fontWeight: '700',
  },
  text: {
    fontSize: 12,
    color: theme.colors.gold.primary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

function ElementDetailCard({ pillars }: { pillars: any }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const balance = pillars.elementBalance;
  const sorted = Object.entries(balance).sort(([, a], [, b]) => (b as number) - (a as number));
  const strongest = sorted[0][0];
  const weakest = sorted[sorted.length - 1][0];

  return (
    <GlassCard style={ohStyles.card}>
      <ElementChart balance={balance} noCard />
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={ohStyles.btn}
        activeOpacity={0.8}
      >
        <Text style={ohStyles.btnText}>
          {expanded ? t('home.elementDetailCollapse') : t('home.elementDetailExpand')}
        </Text>
        <View style={ohStyles.arrowBox}>
          <Text style={ohStyles.arrow}>{expanded ? '∧' : '∨'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={ohStyles.detail}>
          <View style={ohStyles.row}>
            <View style={[ohStyles.dot, { backgroundColor: theme.colors.elements[strongest as keyof typeof theme.colors.elements] }]} />
            <View style={ohStyles.textWrap}>
              <Text style={ohStyles.label}>{t('home.strongestElement')} {t(`elements.${strongest}`)}</Text>
              <Text style={ohStyles.desc}>{t(`home.elementDesc.${strongest}_high`)}</Text>
            </View>
          </View>
          <View style={ohStyles.divider} />
          <View style={ohStyles.row}>
            <View style={[ohStyles.dot, { backgroundColor: theme.colors.elements[weakest as keyof typeof theme.colors.elements] }]} />
            <View style={ohStyles.textWrap}>
              <Text style={ohStyles.label}>{t('home.weakestElement')} {t(`elements.${weakest}`)}</Text>
              <Text style={ohStyles.desc}>{t(`home.elementDesc.${weakest}_low`)}</Text>
            </View>
          </View>
        </View>
      )}
    </GlassCard>
  );
}

const ohStyles = StyleSheet.create({
  card: { marginBottom: 4 },
  btn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.gold.light,
    letterSpacing: 0.5,
  },
  arrowBox: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  arrow: { fontSize: 12, color: theme.colors.gold.light, fontWeight: '700' },
  detail: { marginTop: 16, gap: 14 },
  row: { flexDirection: 'row', gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  textWrap: { flex: 1 },
  label: { fontSize: 13, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 4 },
  desc: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)' },
});

export default function HomeScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user, setUser } = useAuthStore();
  const {
    setSajuResult, isLoading, setLoading, setError, saveAndRecord,
    streakCount, checkStreak, streakCelebration, clearStreakCelebration,
    checkDailyScore, yesterdayScore,
  } = useFortuneStore();
  const { addFreeCredits } = usePurchaseStore();
  const { dailyFortune, refresh } = useDailyFortune();
  const [showPaywall, setShowPaywall] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showElement, setShowElement] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationValue, setCelebrationValue] = useState<number>(0);

  // ── Streak check on mount ──
  useEffect(() => {
    checkStreak();
  }, []);

  // ── Streak celebration ──
  useEffect(() => {
    if (streakCelebration === 7 || streakCelebration === 30) {
      addFreeCredits(streakCelebration === 7 ? 1 : 2);
      setCelebrationValue(streakCelebration);
      setShowCelebrationModal(true);
      clearStreakCelebration();
    }
  }, [streakCelebration]);

  // ── Daily score tracking ──
  useEffect(() => {
    if (dailyFortune?.overallScore != null) {
      checkDailyScore(dailyFortune.overallScore);
    }
  }, [dailyFortune?.overallScore]);

  const pillars = useMemo(
    () => user
      ? calculateFourPillars(user.birthYear, user.birthMonth, user.birthDay, user.birthHour, undefined, undefined, undefined, user.isLunar)
      : null,
    [user?.birthYear, user?.birthMonth, user?.birthDay, user?.birthHour]
  );

  const dominantElement = useMemo(() => {
    if (!pillars) return 'earth';
    return Object.entries(pillars.elementBalance).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];
  }, [pillars]);

  const elementColor = theme.colors.elements[dominantElement as keyof typeof theme.colors.elements] ?? theme.colors.gold.primary;

  // ── Yesterday score comparison ──
  const scoreChange = (dailyFortune?.overallScore ?? 0) - yesterdayScore;

  // ── Now This Hour ──
  const hourlyData = useMemo(() => {
    if (!pillars) return null;
    const now = new Date();
    const currentHour = now.getHours();
    const branchIdx = hourToBranchIndex(currentHour);
    const sijinNames = ['자시', '축시', '인시', '묘시', '진시', '사시', '오시', '미시', '신시', '유시', '술시', '해시'];
    const hourKeys = ['zi', 'chou', 'yin', 'mao', 'chen', 'si', 'wu', 'wei', 'shen', 'you', 'xu', 'hai'];
    const sijinName = sijinNames[branchIdx];
    const hourKey = hourKeys[branchIdx];
    const stemBase = (pillars.day.stemIdx % 5) * 2;
    const hourStemIdx = (stemBase + branchIdx) % 10;
    const tenGod = getTenGod(pillars.day.stemIdx, hourStemIdx);
    const insight = HOURLY_INSIGHTS[sijinName]?.[tenGod];
    const nextBranchIdx = (branchIdx + 1) % 12;
    const nextSijinName = sijinNames[nextBranchIdx];
    const nextHourKey = hourKeys[nextBranchIdx];
    const nextStemBase = (pillars.day.stemIdx % 5) * 2;
    const nextHourStemIdx = (nextStemBase + nextBranchIdx) % 10;
    const nextTenGod = getTenGod(pillars.day.stemIdx, nextHourStemIdx);
    const nextInsight = HOURLY_INSIGHTS[nextSijinName]?.[nextTenGod];
    return { branchIdx, sijinName, hourKey, tenGod, insight, nextHourKey, nextInsight, nextTenGod };
  }, [pillars, Math.floor(new Date().getHours() / 2)]);

  // ── Daily Insight ──
  const dailyInsightData = useMemo(() => {
    if (!pillars) return null;
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const todaySaju = calculateTodaySaju(pillars.day.stemIdx);
    const todayTenGod = getTenGod(pillars.day.stemIdx, todaySaju.dayStemIdx);
    const dayThemeIcons: Record<number, string> = { 1: '\uD83D\uDCBC', 2: '\uD83D\uDC95', 3: '\uD83D\uDCB0', 4: '\uD83C\uDFC3', 5: '\uD83E\uDD1D', 6: '\uD83C\uDF40', 0: '\uD83D\uDCCB' };
    const icon = dayThemeIcons[dayOfWeek] ?? '\uD83C\uDF40';
    const insightGroup = DAILY_INSIGHTS[dayOfWeek];
    const insight = insightGroup?.[todayTenGod];
    return { dayOfWeek, todayTenGod, icon, insight };
  }, [pillars]);

  // ── Today's Do/Don't ──
  const todayTip = useMemo(() => {
    if (!dailyInsightData?.todayTenGod) return null;
    return TEN_GOD_TIPS[dailyInsightData.todayTenGod] ?? null;
  }, [dailyInsightData?.todayTenGod]);

  // ── Today's Zodiac Match ──
  const zodiacMatch = useMemo(() => {
    const branchIdx = getTodayBranchIdx();
    return getTodayZodiacMatch(branchIdx);
  }, []);

  // ── Weekly Chart ──
  const weeklyData = useMemo(() => {
    if (!pillars) return null;
    const days = calculateWeeklyFortune(pillars.day.stemIdx);
    const today = new Date().getDay(); // 0=Sun
    const bestDay = days.reduce((best, d) => d.score > best.score ? d : best, days[0]);
    return { days, today, bestDay };
  }, [pillars]);

  const handlePaidAnalyze = useCallback(async () => {
    if (!user) {
      router.push('/(auth)/birth-input');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pillarInfo = pillars
        ? formatPillarInfo(pillars, user.birthYear)
        : undefined;

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
      setSajuResult(result);
      saveAndRecord('saju', true, result);
      router.push('/saju/result');
    } catch (err) {
      if (__DEV__) console.error('[Home] Paid analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [user, pillars]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const todaySummary = dailyFortune?.summary
    ?? t('home.defaultFortune');

  if (isLoading) {
    return <LoadingInk steps={t('loading.sajuSteps', { returnObjects: true }) as string[]} tips={t('loading.sajuTips', { returnObjects: true }) as string[]} finalMessage={t('loading.sajuFinal')} estimatedSeconds={30} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onScroll={({ nativeEvent }) => {
        if (!showElement && nativeEvent.contentOffset.y > 100) {
          setShowElement(true);
        }
      }}
      scrollEventThrottle={200}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.gold.primary}
        />
      }
    >
      {/* ── 헤더 ── */}
      <Animated.View entering={FadeInDown.delay(50).duration(500)}>
        <View style={styles.header}>
          <Text style={styles.appName}>MIRi</Text>
          <Text style={styles.appSub}>{t('common.appName')}</Text>
        </View>
      </Animated.View>

      {/* ── 날짜 ── */}
      <Text style={styles.date}>
        {new Date().toLocaleDateString(i18n.language === 'ko' ? 'ko-KR' : i18n.language === 'ja' ? 'ja-JP' : 'en-US', {
          month: 'long', day: 'numeric', weekday: 'short',
        })}
      </Text>

      {/* ── 분석 대상 프로필 ── */}
      {user && (
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <TouchableOpacity
            style={styles.profileBar}
            onPress={() => setShowEditModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user.name || t('home.defaultHero')}
              </Text>
              <Text style={styles.profileBirth}>
                {user.birthYear}.{String(user.birthMonth).padStart(2, '0')}.{String(user.birthDay).padStart(2, '0')}
                {' · '}{user.gender === 'male' ? t('common.male_short') : t('common.female_short')}
                {' · '}{user.isLunar ? t('birth.lunar') : t('birth.solar')}
              </Text>
            </View>
            <Text style={styles.profileEdit}>{t('home.profileEdit')}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── 연속 출석 배지 ── */}
      {streakCount > 0 && (
        <Animated.View entering={FadeInDown.delay(120).duration(500)}>
          <TouchableOpacity
            style={styles.streakRow}
            onPress={() => setShowStreakModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.streakIcon}>{'\uD83D\uDD25'}</Text>
            <Text style={styles.streakCount}>{streakCount}</Text>
            <Text style={styles.streakLabel}>{t('home.streakBadge', { count: streakCount })}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── 일간 + 주 오행 ── */}
      {pillars && (
        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <GlassCard gold style={styles.identityCard}>
            <View style={styles.identityRow}>
              <View style={styles.dayMasterSide}>
                <Text style={styles.dayMasterChar}>{pillars.dayMaster}</Text>
                <Text style={styles.dayMasterYY}>
                  {pillars.dayMasterYinYang === '양' ? '陽' : '陰'}
                </Text>
              </View>
              <View style={styles.identityDivider} />
              <View style={styles.elementSide}>
                <View style={styles.elementBadge}>
                  <View style={[styles.elementDot, { backgroundColor: elementColor }]} />
                  <Text style={styles.elementLabel}>
                    {t(`elements.${pillars.dayMasterElement}`)}
                  </Text>
                </View>
                <Text style={styles.identitySub}>{t('home.dayMasterLabel')}</Text>
                <Text style={styles.identityDesc}>{t('home.dayMasterDesc')}</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      )}

      {/* ── 오늘의 기운 ── */}
      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <GlassCard style={styles.fortuneCard}>
          <View style={styles.fortuneHeader}>
            <Text style={styles.fortuneLabel}>{t('home.todayEnergy')}</Text>
            <TouchableOpacity
              style={styles.manseryeokChip}
              onPress={() => router.push('/saju/detail')}
              activeOpacity={0.7}
            >
              <Text style={styles.manseryeokText}>{t('home.manseryeok')}</Text>
              <Text style={styles.manseryeokArrow}>›</Text>
            </TouchableOpacity>
          </View>
          {dailyFortune?.overallScore != null && (() => {
            const grade = getFortuneGrade(dailyFortune.overallScore);
            return (
              <View style={styles.scoreHero}>
                <Text style={styles.scoreNumber}>{dailyFortune.overallScore}</Text>
                <View style={styles.scoreRight}>
                  <View style={[styles.gradeBadge, { backgroundColor: grade.color + '18', borderColor: grade.color + '40' }]}>
                    <Text style={[styles.gradeText, { color: grade.color }]}>{grade.label}</Text>
                  </View>
                  <Text style={styles.scoreMax}>/ 100</Text>
                </View>
              </View>
            );
          })()}
          <Text style={styles.fortuneText}>{todaySummary}</Text>
          {/* Yesterday comparison */}
          {(scoreChange !== 0 || yesterdayScore > 0) && (
            <View style={styles.scoreChangeRow}>
              {scoreChange > 0 && (
                <>
                  <Text style={[styles.scoreChangeText, { color: '#4A9E6E' }]}>{'\u25B2'}{scoreChange}</Text>
                  <Text style={[styles.scoreChangeLabel, { color: '#4A9E6E' }]}>{t('home.fortuneUp')}</Text>
                </>
              )}
              {scoreChange < 0 && (
                <>
                  <Text style={[styles.scoreChangeText, { color: '#E85D4A' }]}>{'\u25BC'}{Math.abs(scoreChange)}</Text>
                  <Text style={[styles.scoreChangeLabel, { color: '#E85D4A' }]}>{t('home.fortuneDown')}</Text>
                </>
              )}
              {scoreChange === 0 && yesterdayScore > 0 && (
                <>
                  <Text style={[styles.scoreChangeText, { color: theme.colors.text.tertiary }]}>{'\u2192'}</Text>
                  <Text style={[styles.scoreChangeLabel, { color: theme.colors.text.tertiary }]}>{t('home.fortuneSame')}</Text>
                </>
              )}
            </View>
          )}
          {dailyFortune?.luckyItem && (
            <View style={styles.luckyRow}>
              <Text style={styles.luckyLabel}>{t('home.luckyItemLabel')}</Text>
              <Text style={styles.luckyValue}>{dailyFortune.luckyItem}</Text>
            </View>
          )}
        </GlassCard>
      </Animated.View>


      {/* ── 오늘의 한 수 (Do/Don't) ── */}
      {todayTip && (
        <Animated.View entering={FadeInDown.delay(350).duration(500)}>
          <GlassCard style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Text style={styles.tipTitle}>오늘의 한 수</Text>
              <Text style={styles.tipMood}>{todayTip.mood[i18n.language as 'ko' | 'en' | 'ja'] ?? todayTip.mood.ko}</Text>
            </View>
            <View style={styles.tipRow}>
              <View style={[styles.tipBox, styles.tipDoBox]}>
                <Text style={styles.tipDoLabel}>DO</Text>
                <Text style={styles.tipDoText}>{todayTip.do[i18n.language as 'ko' | 'en' | 'ja'] ?? todayTip.do.ko}</Text>
              </View>
              <View style={[styles.tipBox, styles.tipDontBox]}>
                <Text style={styles.tipDontLabel}>DON'T</Text>
                <Text style={styles.tipDontText}>{todayTip.dont[i18n.language as 'ko' | 'en' | 'ja'] ?? todayTip.dont.ko}</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      )}

      {/* ── 오늘의 궁합 띠 ── */}
      {zodiacMatch && (
        <Animated.View entering={FadeInDown.delay(380).duration(500)}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/(tabs)/compatibility' as any)}>
            <GlassCard style={styles.zodiacCard}>
              <Text style={styles.zodiacTitle}>오늘의 궁합 띠</Text>
              <View style={styles.zodiacRow}>
                {zodiacMatch.lucky.map((z, i) => (
                  <View key={i} style={styles.zodiacItem}>
                    <Text style={styles.zodiacEmoji}>{z.emoji}</Text>
                    <Text style={styles.zodiacName}>{i18n.language === 'en' ? z.nameEn : i18n.language === 'ja' ? z.nameJa : z.name}</Text>
                    <Text style={styles.zodiacGoodLabel}>GOOD</Text>
                  </View>
                ))}
                {zodiacMatch.caution && (
                  <>
                    <View style={styles.zodiacDivider} />
                    <View style={styles.zodiacItem}>
                      <Text style={styles.zodiacEmoji}>{zodiacMatch.caution.emoji}</Text>
                      <Text style={styles.zodiacName}>{i18n.language === 'en' ? zodiacMatch.caution.nameEn : i18n.language === 'ja' ? zodiacMatch.caution.nameJa : zodiacMatch.caution.name}</Text>
                      <Text style={styles.zodiacCautionLabel}>주의</Text>
                    </View>
                  </>
                )}
              </View>
            </GlassCard>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── 지금 이 시간 (Now This Hour) ── */}
      {hourlyData && (
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <GlassCard style={styles.nowCard}>
            <View style={styles.nowBadgeRow}>
              <View style={styles.nowBadge}>
                <Text style={styles.nowBadgeText}>{t('home.nowBadge')}</Text>
              </View>
              <Text style={styles.nowSijin}>{t(`hours.${hourlyData.hourKey}`)}</Text>
            </View>
            <View style={styles.nowTenGodRow}>
              <Text style={styles.nowTenGod}>{hourlyData.tenGod}</Text>
            </View>
            {hourlyData.insight && (
              <Text style={styles.nowMessage}>
                {hourlyData.insight[i18n.language as 'ko' | 'en' | 'ja'] ?? hourlyData.insight.ko}
              </Text>
            )}
            {hourlyData.nextInsight && (
              <View style={styles.nowNextRow}>
                <Text style={styles.nowNextLabel}>{t('home.nextHourPreview')}</Text>
                <Text style={styles.nowNextHour}>{t(`hours.${hourlyData.nextHourKey}`)}</Text>
              </View>
            )}
          </GlassCard>
        </Animated.View>
      )}

      {/* ── 오늘의 한 줄 (Daily Insight) ── */}
      {dailyInsightData?.insight && (
        <Animated.View entering={FadeInDown.delay(450).duration(500)}>
          <GlassCard style={styles.dailyInsightCard}>
            <View style={styles.dailyInsightRow}>
              <Text style={styles.dailyInsightIcon}>{dailyInsightData.icon}</Text>
              <View style={styles.dailyInsightTextWrap}>
                <Text style={styles.dailyInsightTitle}>{t('home.dailyInsightTitle')}</Text>
                <Text style={styles.dailyInsightMessage}>
                  {dailyInsightData.insight[i18n.language as 'ko' | 'en' | 'ja'] ?? dailyInsightData.insight.ko}
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      )}

      {/* ── 이번 주 운세 (Weekly Chart) ── */}
      {weeklyData && (
        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <GlassCard style={styles.weeklyCard}>
            <Text style={styles.weeklyTitle}>{t('home.weeklyTitle')}</Text>
            <View style={styles.weeklyBars}>
              {weeklyData.days.map((d, idx) => {
                const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                const dayKey = dayKeys[d.dayOfWeek];
                const isToday = d.dayOfWeek === weeklyData.today;
                const isBest = d.date === weeklyData.bestDay.date;
                const barWidth = `${Math.max(d.score, 20)}%`;
                return (
                  <View key={d.date} style={styles.weeklyBarRow}>
                    <Text style={[styles.weeklyDayLabel, isToday && styles.weeklyDayLabelToday]}>
                      {t(`days.${dayKey}`)}
                    </Text>
                    <View style={styles.weeklyBarTrack}>
                      <View
                        style={[
                          styles.weeklyBarFill,
                          { width: barWidth as any },
                          isToday && styles.weeklyBarFillToday,
                        ]}
                      />
                    </View>
                    <Text style={styles.weeklyBarScore}>{d.score}</Text>
                    {isToday && <Text style={styles.weeklyTodayTag}>{t('home.todayLabel')}</Text>}
                    {isBest && <Text style={styles.weeklyBestStar}>{'\u2B50'}</Text>}
                  </View>
                );
              })}
            </View>
            <Text style={styles.weeklyBestText}>
              {t('home.weeklyBest')}: {(() => {
                const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                return t(`days.${dayKeys[weeklyData.bestDay.dayOfWeek]}`);
              })()}
            </Text>
          </GlassCard>
        </Animated.View>
      )}

      {/* ── 사주팔자 ── */}
      {pillars && (
        <Animated.View entering={FadeInDown.delay(550).duration(500)}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/saju/detail')}
          >
            <GlassCard gold style={styles.sajuCard}>
              <Text style={styles.sajuTitle}>{t('home.myFourPillars')}</Text>
              <FourPillarsView pillars={pillars} noTitle />
            </GlassCard>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── 오행 밸런스 (스크롤 시 로드) ── */}
      {pillars && showElement && (
        <Animated.View entering={FadeInDown.duration(500)}>
          <GlassCard style={styles.sajuCard}>
            <ElementChart balance={pillars.elementBalance} noCard />
          </GlassCard>
        </Animated.View>
      )}

      <Text style={styles.disclaimer}>{t('common.disclaimer')}</Text>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUnlocked={() => handlePaidAnalyze()}
        productType="saju"
      />

      {/* ── 편집 모달 ── */}
      {user && (
        <ProfileEditModal
          visible={showEditModal}
          user={user}
          onClose={() => setShowEditModal(false)}
          onSave={(updated) => {
            setUser({ ...user, ...updated });
            setShowEditModal(false);
          }}
        />
      )}

      {/* ── 연속 출석 모달 ── */}
      <Modal visible={showStreakModal} animationType="fade" transparent onRequestClose={() => setShowStreakModal(false)}>
        <TouchableOpacity style={styles.streakModalOverlay} activeOpacity={1} onPress={() => setShowStreakModal(false)}>
          <View style={styles.streakModalContent}>
            <Text style={styles.streakModalIcon}>{'\uD83D\uDD25'}</Text>
            <Text style={styles.streakModalCount}>{streakCount}{t('home.streakBadge', { count: streakCount })}</Text>
            {/* Progress bar toward next milestone */}
            {(() => {
              const goal = streakCount < 7 ? 7 : 30;
              const progress = Math.min(streakCount / goal, 1);
              return (
                <>
                  <View style={styles.streakProgressTrack}>
                    <View style={[styles.streakProgressFill, { width: `${progress * 100}%` as any }]} />
                  </View>
                  <Text style={styles.streakProgressText}>
                    {t('home.streakProgress', { current: streakCount, goal })}
                  </Text>
                  <Text style={styles.streakGoalText}>
                    {goal === 7 ? t('home.streakGoal7') : t('home.streakGoal30')}
                  </Text>
                </>
              );
            })()}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── 축하 모달 ── */}
      <Modal visible={showCelebrationModal} animationType="fade" transparent onRequestClose={() => setShowCelebrationModal(false)}>
        <TouchableOpacity style={styles.streakModalOverlay} activeOpacity={1} onPress={() => setShowCelebrationModal(false)}>
          <View style={styles.streakModalContent}>
            <Text style={styles.celebrationEmoji}>{'\uD83C\uDF89'}</Text>
            <Text style={styles.celebrationTitle}>{t('home.streakCelebrationTitle')}</Text>
            <Text style={styles.celebrationMessage}>
              {celebrationValue === 7 ? t('home.streakCelebration7') : t('home.streakCelebration30')}
            </Text>
            <TouchableOpacity style={styles.celebrationBtn} onPress={() => setShowCelebrationModal(false)}>
              <Text style={styles.celebrationBtnText}>{t('common.confirm')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

/* ── 프로필 편집 모달 ── */
function getHours(t: (key: string) => string) {
  return [
    { label: t('birth.hourZi'), sub: '23-01', value: 0 }, { label: t('birth.hourChou'), sub: '01-03', value: 2 },
    { label: t('birth.hourYin'), sub: '03-05', value: 4 }, { label: t('birth.hourMao'), sub: '05-07', value: 6 },
    { label: t('birth.hourChen'), sub: '07-09', value: 8 }, { label: t('birth.hourSi'), sub: '09-11', value: 10 },
    { label: t('birth.hourWu'), sub: '11-13', value: 12 }, { label: t('birth.hourWei'), sub: '13-15', value: 14 },
    { label: t('birth.hourShen'), sub: '15-17', value: 16 }, { label: t('birth.hourYou'), sub: '17-19', value: 18 },
    { label: t('birth.hourXu'), sub: '19-21', value: 20 }, { label: t('birth.hourHai'), sub: '21-23', value: 22 },
  ];
}

function ProfileEditModal({ visible, user, onClose, onSave }: {
  visible: boolean;
  user: { name?: string; birthYear: number; birthMonth: number; birthDay: number; birthHour: number; gender: 'male' | 'female'; isLunar: boolean; birthCity?: string; birthLongitude?: number; birthUtcOffset?: number };
  onClose: () => void;
  onSave: (d: { name?: string; birthYear: number; birthMonth: number; birthDay: number; birthHour: number; gender: 'male' | 'female'; isLunar: boolean; birthCity?: string; birthLongitude?: number; birthUtcOffset?: number }) => void;
}) {
  const { t, i18n } = useTranslation();
  const hours = useMemo(() => getHours(t), [t]);
  const [name, setName] = useState(user.name ?? '');
  const [year, setYear] = useState(String(user.birthYear));
  const [month, setMonth] = useState(String(user.birthMonth).padStart(2, '0'));
  const [day, setDay] = useState(String(user.birthDay).padStart(2, '0'));
  const [hour, setHour] = useState(user.birthHour);
  const [gender, setGender] = useState(user.gender);
  const [isLunar, setIsLunar] = useState(user.isLunar);

  // City search
  const [cityQuery, setCityQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [showCityResults, setShowCityResults] = useState(false);

  const filteredCities = useMemo(() => {
    if (cityQuery.length < 1) return [];
    const q = cityQuery.toLowerCase();
    return CITIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q) || c.countryNameEn.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [cityQuery]);

  React.useEffect(() => {
    if (visible) {
      setName(user.name ?? ''); setYear(String(user.birthYear));
      setMonth(String(user.birthMonth).padStart(2, '0')); setDay(String(user.birthDay).padStart(2, '0'));
      setHour(user.birthHour); setGender(user.gender); setIsLunar(user.isLunar);
      // Restore city
      if (user.birthCity) {
        const city = CITIES.find(c => c.id === user.birthCity);
        if (city) {
          setSelectedCity(city);
          const displayName = i18n.language === 'en' ? city.nameEn : city.name;
          setCityQuery(`${displayName} (${city.countryNameEn})`);
        }
      } else {
        setCityQuery(''); setSelectedCity(null);
      }
    }
  }, [visible]);

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    const displayName = i18n.language === 'en' ? city.nameEn : city.name;
    setCityQuery(`${displayName} (${city.countryNameEn})`);
    setShowCityResults(false);
  };

  const handleSave = () => {
    const y = parseInt(year, 10), m = parseInt(month, 10), d = parseInt(day, 10);
    if (!y || !m || !d) return;
    onSave({ name: name || undefined, birthYear: y, birthMonth: m, birthDay: d, birthHour: hour, gender, isLunar, birthCity: selectedCity?.id, birthLongitude: selectedCity?.longitude, birthUtcOffset: selectedCity?.utcOffset });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={em.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={em.sheet} contentContainerStyle={em.sheetInner} showsVerticalScrollIndicator={false}>
          <View style={em.handle} />
          <Text style={em.title}>{t('home.editTitle')}</Text>
          <Text style={em.subtitle}>{t('home.editSubtitle')}</Text>

          <Text style={em.label}>{t('home.editName')}</Text>
          <TextInput style={em.input} value={name} onChangeText={setName} placeholder={t('home.namePlaceholder')} placeholderTextColor={theme.colors.text.tertiary} />

          <Text style={em.label}>{t('home.editBirthDate')}</Text>
          <DateInputRow
            year={year}
            month={month}
            day={day}
            onChangeYear={setYear}
            onChangeMonth={setMonth}
            onChangeDay={setDay}
            variant="inline"
          />

          <View style={em.toggleGroup}>
            <View style={em.toggleCol}>
              <Text style={em.label}>{t('home.editGender')}</Text>
              <View style={em.toggleRow}>
                <TouchableOpacity style={[em.tog, gender === 'male' && em.togOn]} onPress={() => setGender('male')}>
                  <Text style={[em.togT, gender === 'male' && em.togTOn]}>{t('common.male_short')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[em.tog, gender === 'female' && em.togOn]} onPress={() => setGender('female')}>
                  <Text style={[em.togT, gender === 'female' && em.togTOn]}>{t('common.female_short')}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={em.toggleCol}>
              <Text style={em.label}>{t('home.editCalendar')}</Text>
              <View style={em.toggleRow}>
                <TouchableOpacity style={[em.tog, !isLunar && em.togOn]} onPress={() => setIsLunar(false)}>
                  <Text style={[em.togT, !isLunar && em.togTOn]}>{t('birth.solar')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[em.tog, isLunar && em.togOn]} onPress={() => setIsLunar(true)}>
                  <Text style={[em.togT, isLunar && em.togTOn]}>{t('birth.lunar')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text style={em.label}>{t('birth.birthCity')}</Text>
          <TextInput
            style={em.input}
            value={cityQuery}
            onChangeText={(v) => { setCityQuery(v); setSelectedCity(null); setShowCityResults(v.length >= 1); }}
            placeholder={t('birth.citySearch')}
            placeholderTextColor={theme.colors.text.tertiary}
          />
          {showCityResults && filteredCities.length > 0 && (
            <View style={em.cityResults}>
              {filteredCities.map((city) => (
                <TouchableOpacity key={city.id} style={em.cityItem} onPress={() => handleCitySelect(city)}>
                  <Text style={em.cityName}>{i18n.language === 'en' ? city.nameEn : city.name}</Text>
                  <Text style={em.cityCountry}>{city.countryNameEn}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={em.label}>{t('home.editBirthHour')}</Text>
          <View style={em.hoursGrid}>
            {hours.map((h) => (
              <TouchableOpacity key={h.value} style={[em.hourBtn, hour === h.value && em.hourBtnOn]} onPress={() => setHour(h.value)}>
                <Text style={[em.hourLbl, hour === h.value && em.hourLblOn]}>{h.label}</Text>
                <Text style={[em.hourSub, hour === h.value && em.hourSubOn]}>{h.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={em.btnRow}>
            <TouchableOpacity style={em.cancelBtn} onPress={onClose}>
              <Text style={em.cancelT}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={em.saveBtn} onPress={handleSave}>
              <Text style={em.saveT}>{t('home.editApply')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const em = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
  sheetInner: { padding: 20, paddingBottom: 40 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.12)', alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: theme.colors.text.primary },
  subtitle: { fontSize: 13, color: theme.colors.text.tertiary, marginTop: 4, marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '600', color: theme.colors.gold.primary, letterSpacing: 1, marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 14, fontSize: 16, color: theme.colors.text.primary },

  // 성별 / 역법 토글
  toggleGroup: { flexDirection: 'row', gap: 16 },
  toggleCol: { flex: 1 },
  toggleRow: { flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 8, padding: 3 },
  tog: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  togOn: { backgroundColor: '#1C1C1E' },
  togT: { fontSize: 14, color: theme.colors.text.tertiary, fontWeight: '500' },
  togTOn: { color: theme.colors.gold.light, fontWeight: '600' },

  // 시간 그리드 — 4열 정렬
  hoursGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 6 },
  hourBtn: {
    width: '24%', paddingVertical: 10, alignItems: 'center',
    backgroundColor: '#F5F5F5', borderRadius: 8,
  },
  hourBtnOn: { backgroundColor: '#1C1C1E' },
  hourLbl: { fontSize: 13, fontWeight: '500', color: theme.colors.text.primary },
  hourLblOn: { color: theme.colors.gold.light, fontWeight: '600' },
  hourSub: { fontSize: 9, color: theme.colors.text.tertiary, marginTop: 2 },
  hourSubOn: { color: theme.colors.gold.muted },

  // City
  cityResults: { backgroundColor: '#F5F5F5', borderRadius: 8, marginTop: 4, marginBottom: 4, overflow: 'hidden' },
  cityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.06)' },
  cityName: { fontSize: 14, color: theme.colors.text.primary, fontWeight: '500' },
  cityCountry: { fontSize: 11, color: theme.colors.text.tertiary },

  // 버튼
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  cancelT: { fontSize: 15, fontWeight: '600', color: theme.colors.text.secondary },
  saveBtn: { flex: 2, paddingVertical: 14, alignItems: 'center', borderRadius: 10, backgroundColor: '#1C1C1E' },
  saveT: { fontSize: 15, fontWeight: '700', color: theme.colors.gold.primary },
});

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

  /* ── 헤더 ── */
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 38,
    fontWeight: '200',
    color: theme.colors.text.primary,
    letterSpacing: 12,
  },
  appSub: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
    fontWeight: '300',
    letterSpacing: 8,
    marginTop: 4,
  },
  date: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'right',
    marginBottom: 8,
  },

  /* ── 프로필 바 ── */
  profileBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: theme.radius.md,
    paddingVertical: 12, paddingHorizontal: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: 20,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 15, fontWeight: '600', color: theme.colors.text.primary },
  profileBirth: { fontSize: 12, color: theme.colors.text.tertiary, marginTop: 2 },
  profileEdit: { fontSize: 13, fontWeight: '600', color: theme.colors.text.tertiary },

  /* ── 일간 + 주오행 카드 ── */
  identityCard: {
    marginBottom: 20,
    padding: 18,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayMasterSide: {
    flex: 1,
    alignItems: 'center',
  },
  dayMasterChar: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.colors.gold.primary,
  },
  dayMasterYY: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  identityDivider: {
    width: 1,
    height: 52,
    backgroundColor: 'rgba(181,149,48,0.2)',
    marginHorizontal: 18,
  },
  elementSide: {
    flex: 1,
    alignItems: 'flex-start',
  },
  elementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  elementDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  elementLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  identitySub: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  identityDesc: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },

  /* ── 사주 + 오행 통합 카드 ── */
  sajuCard: {
    marginBottom: 16,
    padding: 16,
  },
  sajuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    letterSpacing: 2,
  },
  /* ── 오늘의 기운 ── */
  fortuneCard: {
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  fortuneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fortuneLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  manseryeokChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.gold.primary + '12',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.gold.primary + '25',
  },
  manseryeokText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  manseryeokArrow: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  fortuneText: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.text.secondary,
    maxHeight: 60,
    overflow: 'hidden',
  },

  /* ── 점수 히어로 ── */
  scoreHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  scoreNumber: {
    fontSize: 44,
    fontWeight: '700',
    color: theme.colors.gold.dark,
    letterSpacing: -2,
  },
  scoreRight: {
    gap: 4,
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  gradeText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scoreMax: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },

  /* ── Do/Don't 카드 ── */
  tipCard: {
    marginBottom: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: 1,
  },
  tipMood: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },
  tipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tipBox: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
  },
  tipDoBox: {
    backgroundColor: 'rgba(74,158,110,0.06)',
  },
  tipDontBox: {
    backgroundColor: 'rgba(232,84,74,0.06)',
  },
  tipDoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4A9E6E',
    letterSpacing: 1,
    marginBottom: 4,
  },
  tipDoText: {
    fontSize: 12,
    color: '#4A9E6E',
    lineHeight: 18,
    fontWeight: '500',
  },
  tipDontLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E85D4A',
    letterSpacing: 1,
    marginBottom: 4,
  },
  tipDontText: {
    fontSize: 12,
    color: '#E85D4A',
    lineHeight: 18,
    fontWeight: '500',
  },

  /* ── 궁합 띠 카드 ── */
  zodiacCard: {
    marginBottom: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  zodiacTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  zodiacRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  zodiacItem: {
    alignItems: 'center',
    gap: 3,
  },
  zodiacEmoji: {
    fontSize: 28,
  },
  zodiacName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  zodiacGoodLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4A9E6E',
    letterSpacing: 0.5,
  },
  zodiacDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.glass.border,
    marginHorizontal: 4,
  },
  zodiacCautionLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E85D4A',
    letterSpacing: 0.5,
  },

  luckyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.glass.border,
  },
  luckyLabel: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  luckyValue: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },

  /* ── 상세 분석 CTA ── */
  ctaBtn: {
    backgroundColor: '#1C1C1E',
    borderRadius: theme.radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.gold.primary + '60',
    marginBottom: 20,
    overflow: 'hidden',
  },
  ctaGlowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: theme.colors.gold.primary + '50',
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  ctaTextWrap: {
    flex: 1,
  },
  ctaIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.gold.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gold.primary + '30',
  },
  ctaIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.gold.primary,
  },
  ctaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.gold.light,
    marginBottom: 3,
  },
  ctaSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.3,
  },
  ctaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  ctaPriceCol: {
    alignItems: 'center',
    marginRight: 4,
  },
  ctaDiscountBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    marginBottom: 2,
  },
  ctaDiscountText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
  },
  ctaPriceOld: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    textDecorationLine: 'line-through',
  },
  ctaPriceBox: {
    backgroundColor: theme.colors.gold.primary + '20',
    borderRadius: theme.radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.colors.gold.primary + '30',
  },
  ctaPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.gold.primary,
  },
  ctaArrow: {
    fontSize: 18,
    color: theme.colors.gold.primary + '80',
    fontWeight: '300',
  },

  /* ── 연속 출석 배지 ── */
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFF5E6',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 4,
  },
  streakIcon: {
    fontSize: 14,
  },
  streakCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E8760A',
  },
  streakLabel: {
    fontSize: 12,
    color: '#E8760A',
    fontWeight: '500',
  },

  /* ── 어제 비교 점수 ── */
  scoreChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  scoreChangeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scoreChangeLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  /* ── Now This Hour 카드 ── */
  nowCard: {
    marginBottom: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderColor: theme.colors.gold.primary + '40',
    borderWidth: 1.5,
  },
  nowBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  nowBadge: {
    backgroundColor: theme.colors.gold.primary,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  nowBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  nowSijin: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  nowTenGodRow: {
    marginBottom: 6,
  },
  nowTenGod: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  nowMessage: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.text.secondary,
  },
  nowNextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.glass.border,
  },
  nowNextLabel: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
  nowNextHour: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },

  /* ── Daily Insight 카드 ── */
  dailyInsightCard: {
    marginBottom: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dailyInsightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dailyInsightIcon: {
    fontSize: 24,
    marginTop: 2,
  },
  dailyInsightTextWrap: {
    flex: 1,
  },
  dailyInsightTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dailyInsightMessage: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.text.secondary,
  },

  /* ── Weekly Chart ── */
  weeklyCard: {
    marginBottom: 16,
    padding: 16,
  },
  weeklyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  weeklyBars: {
    gap: 6,
  },
  weeklyBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weeklyDayLabel: {
    width: 24,
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  weeklyDayLabelToday: {
    fontWeight: '700',
    color: theme.colors.gold.primary,
  },
  weeklyBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  weeklyBarFill: {
    height: 8,
    backgroundColor: theme.colors.text.tertiary,
    borderRadius: 4,
  },
  weeklyBarFillToday: {
    backgroundColor: theme.colors.gold.primary,
  },
  weeklyBarScore: {
    width: 24,
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textAlign: 'right',
  },
  weeklyTodayTag: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    backgroundColor: theme.colors.gold.primary + '15',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  weeklyBestStar: {
    fontSize: 12,
  },
  weeklyBestText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
  },

  /* ── 연속 출석 모달 ── */
  streakModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    width: 280,
    alignItems: 'center',
  },
  streakModalIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  streakModalCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E8760A',
    marginBottom: 16,
  },
  streakProgressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  streakProgressFill: {
    height: 8,
    backgroundColor: '#E8760A',
    borderRadius: 4,
  },
  streakProgressText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  streakGoalText: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },

  /* ── 축하 모달 ── */
  celebrationEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  celebrationTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  celebrationMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  celebrationBtn: {
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  celebrationBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.gold.primary,
  },

  /* ── 하단 ── */
  disclaimer: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 32,
  },
});
