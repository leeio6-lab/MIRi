import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
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
import { MIRiLogo } from '../../src/components/ui/MIRiLogo';
import { LoadingInk } from '../../src/components/ui/LoadingInk';
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
import { ElementQuiz } from '../../src/components/home/ElementQuiz';
import { ElementTarot } from '../../src/components/home/ElementTarot';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

// Element descriptions are now in i18n files under home.elementDesc.*

// ─── Weekly Line Chart Component ───
const GRAPH_H = 120;
const GRAPH_PAD_TOP = 22;
const GRAPH_PAD_BOT = 8;
const DOT_R = 5;
const DOT_R_TODAY = 7;

function WeeklyLineChart({ weeklyData, t }: { weeklyData: { days: any[]; today: number; bestDay: any }; t: any }) {
  const [chartWidth, setChartWidth] = useState(0);
  const days = weeklyData.days;
  const scores = days.map((d: any) => d.score);
  const minScore = Math.min(...scores) - 5;
  const maxScore = Math.max(...scores) + 5;
  const range = maxScore - minScore || 1;

  const getX = (i: number) => {
    if (chartWidth === 0) return 0;
    const colW = chartWidth / 7;
    return colW / 2 + colW * i;
  };
  const getY = (score: number) => {
    return GRAPH_PAD_TOP + (1 - (score - minScore) / range) * (GRAPH_H - GRAPH_PAD_TOP - GRAPH_PAD_BOT);
  };

  // Build smooth path
  const points = days.map((d: any, i: number) => ({ x: getX(i), y: getY(d.score) }));
  let linePath = '';
  let areaPath = '';
  if (chartWidth > 0 && points.length > 0) {
    linePath = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cx = (points[i - 1].x + points[i].x) / 2;
      linePath += ` C${cx},${points[i - 1].y} ${cx},${points[i].y} ${points[i].x},${points[i].y}`;
    }
    areaPath = linePath + ` L${points[points.length - 1].x},${GRAPH_H} L${points[0].x},${GRAPH_H} Z`;
  }

  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  return (
    <View onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
      {chartWidth > 0 && (
        <Svg width={chartWidth} height={GRAPH_H} style={{ marginBottom: 6 }}>
          <Defs>
            <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme.colors.gold.primary} stopOpacity="0.15" />
              <Stop offset="1" stopColor={theme.colors.gold.primary} stopOpacity="0.01" />
            </LinearGradient>
          </Defs>
          {/* area fill */}
          {areaPath ? <Path d={areaPath} fill="url(#areaGrad)" /> : null}
          {/* line */}
          {linePath ? <Path d={linePath} fill="none" stroke={theme.colors.gold.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /> : null}
          {/* dots */}
          {points.map((p, i) => {
            const isToday = days[i].dayOfWeek === weeklyData.today;
            const isBest = days[i].date === weeklyData.bestDay.date;
            const r = isToday ? DOT_R_TODAY : DOT_R;
            return (
              <React.Fragment key={i}>
                {isToday && (
                  <Circle cx={p.x} cy={p.y} r={r + 4} fill={theme.colors.gold.primary + '15'} />
                )}
                <Circle
                  cx={p.x} cy={p.y} r={r}
                  fill={isToday ? theme.colors.gold.primary : isBest ? theme.colors.gold.light : '#D4D4D4'}
                  stroke="#FFFFFF" strokeWidth={2}
                />
              </React.Fragment>
            );
          })}
        </Svg>
      )}
      {/* 십성 + 간지 행 */}
      <View style={wkStyles.infoRow}>
        {days.map((d: any, i: number) => {
          const isToday = d.dayOfWeek === weeklyData.today;
          const isBest = d.date === weeklyData.bestDay.date;
          return (
            <View key={`info-${i}`} style={wkStyles.infoCell}>
              <Text style={[wkStyles.tenGod, isToday && wkStyles.tenGodToday]}>{d.tenStar}</Text>
              <Text style={[wkStyles.pillar, isToday && wkStyles.pillarToday]}>{d.dayPillar}</Text>
              {isBest && <Text style={wkStyles.bestTag}>BEST</Text>}
            </View>
          );
        })}
      </View>
      {/* 요일 행 */}
      <View style={wkStyles.dayRow}>
        {days.map((d: any, i: number) => {
          const isToday = d.dayOfWeek === weeklyData.today;
          return (
            <View key={`day-${i}`} style={wkStyles.dayCell}>
              <Text style={[wkStyles.dayText, isToday && wkStyles.dayTextToday]}>
                {t(`days.${dayKeys[d.dayOfWeek]}`)}
              </Text>
              {isToday && <View style={wkStyles.todayDot} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const wkStyles = StyleSheet.create({
  infoRow: {
    flexDirection: 'row',
  },
  infoCell: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
    paddingVertical: 4,
  },
  tenGod: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  tenGodToday: {
    color: theme.colors.gold.primary,
    fontWeight: '700',
  },
  pillar: {
    fontSize: 10,
    fontWeight: '400',
    color: theme.colors.text.tertiary,
  },
  pillarToday: {
    color: theme.colors.gold.dark,
    fontWeight: '500',
  },
  bestTag: {
    fontSize: 8,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    backgroundColor: theme.colors.gold.primary + '12',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    overflow: 'hidden',
    marginTop: 1,
  },
  dayRow: {
    flexDirection: 'row',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(212,168,75,0.12)',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text.tertiary,
  },
  dayTextToday: {
    fontWeight: '700',
    color: theme.colors.gold.primary,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.gold.primary,
  },
});

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
  const scrollRef = useRef<ScrollView>(null);
  const tarotY = useRef(0);

  const handleTarotSelect = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: tarotY.current - 40, animated: true });
    }, 300);
  }, []);

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
        ? formatPillarInfo(pillars, user.birthYear, user.birthMonth, user.birthDay, user.gender)
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
      ref={scrollRef}
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
          <Text style={styles.appSub}>운명을 미리 보다</Text>
          <View style={styles.headerDivider} />
        </View>
      </Animated.View>

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
              <View style={styles.profileMeta}>
                <Text style={styles.profileBirth}>
                  {user.birthYear}.{String(user.birthMonth).padStart(2, '0')}.{String(user.birthDay).padStart(2, '0')}
                  {' · '}{user.gender === 'male' ? t('common.male_short') : t('common.female_short')}
                  {' · '}{user.isLunar ? t('birth.lunar') : t('birth.solar')}
                </Text>
                <Text style={styles.profileDate}>
                  {new Date().toLocaleDateString(i18n.language === 'ko' ? 'ko-KR' : i18n.language === 'ja' ? 'ja-JP' : 'en-US', {
                    month: 'long', day: 'numeric', weekday: 'short',
                  })}
                </Text>
              </View>
            </View>
            <Text style={styles.profileEdit}>{t('home.profileEdit')}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={styles.sectionDivider} />

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

      <View style={styles.sectionDivider} />

      {/* ── 만세력 ── */}
      <Animated.View entering={FadeInDown.delay(180).duration(500)}>
        <TouchableOpacity
          style={styles.manseryeokCard}
          onPress={() => router.push('/saju/detail')}
          activeOpacity={0.7}
        >
          <View style={styles.manseryeokRow}>
            <Text style={styles.manseryeokCardIcon}>命</Text>
            <View style={styles.manseryeokBody}>
              <Text style={styles.manseryeokCardTitle}>{t('home.manseryeok')}</Text>
              <Text style={styles.manseryeokCardSub}>사주 원국 · 대운 · 세운</Text>
            </View>
            <Text style={styles.manseryeokArrow}>›</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* ── 오행 타로 ── */}
      {pillars && (
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          onLayout={(e) => { tarotY.current = e.nativeEvent.layout.y; }}
        >
          <ElementTarot dayStemIdx={pillars.day.stemIdx} onCardSelect={handleTarotSelect} />
        </Animated.View>
      )}

      <View style={styles.sectionDivider} />

      {/* ── 이번 주 운세 (Weekly Line Chart) ── */}
      {weeklyData && (
        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <GlassCard style={styles.weeklyCard}>
            <View style={styles.weeklyHeader}>
              <View>
                <Text style={styles.weeklyLabel}>WEEKLY</Text>
                <Text style={styles.weeklyTitle}>{t('home.weeklyTitle')}</Text>
              </View>
              {weeklyData.bestDay && (
                <View style={styles.weeklyBest}>
                  <Text style={styles.weeklyBestLabel}>BEST</Text>
                  <Text style={styles.weeklyBestDay}>
                    {t(`days.${['sun','mon','tue','wed','thu','fri','sat'][weeklyData.bestDay.dayOfWeek]}`)}
                  </Text>
                </View>
              )}
            </View>
            <WeeklyLineChart weeklyData={weeklyData} t={t} />
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
    paddingTop: 48,
    paddingBottom: 120,
  },

  /* ── 헤더 ── */
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appName: {
    fontSize: 44,
    fontWeight: '200',
    color: theme.colors.text.primary,
    letterSpacing: 10,
  },
  appSub: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
    letterSpacing: 3,
    marginTop: 2,
  },
  headerDivider: {
    width: 32,
    height: 1,
    backgroundColor: 'rgba(212,168,75,0.20)',
    marginTop: 12,
  },

  /* ── 프로필 바 ── */
  profileBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: theme.radius.md,
    paddingVertical: 12, paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 15, fontWeight: '600', color: theme.colors.text.primary, letterSpacing: 0.5 },
  profileMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  profileBirth: { fontSize: 11, color: theme.colors.text.tertiary, letterSpacing: 0.3 },
  profileDate: { fontSize: 11, color: theme.colors.text.secondary, letterSpacing: 0.3 },
  profileEdit: { fontSize: 12, fontWeight: '500', color: theme.colors.text.tertiary, letterSpacing: 0.3 },

  /* ── 일간 + 주오행 카드 ── */
  identityCard: {
    marginBottom: 6,
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
    fontSize: 54,
    fontWeight: '300',
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
    backgroundColor: 'rgba(212,168,75,0.15)',
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
    letterSpacing: 0.5,
  },
  identitySub: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  identityDesc: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    marginTop: 2,
    letterSpacing: 0.5,
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

  /* ── 만세력 카드 ── */
  manseryeokCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  manseryeokRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manseryeokCardIcon: {
    fontSize: 28,
    color: theme.colors.text.primary,
    fontWeight: '200',
    marginRight: 14,
    fontFamily: Platform.select({ ios: 'Didot', android: 'serif', default: 'serif' }),
  },
  manseryeokBody: {
    flex: 1,
  },
  manseryeokCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    letterSpacing: 0.3,
  },
  manseryeokCardSub: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  manseryeokArrow: {
    fontSize: 18,
    color: theme.colors.text.tertiary,
    fontWeight: '300',
  },

  /* ── 만세력 버튼 (레거시) ── */
  manseryeokBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gold.primary + '15',
    gap: 6,
  },
  manseryeokBtnIcon: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.gold.dark,
    opacity: 0.5,
  },
  manseryeokBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.gold.dark,
    opacity: 0.7,
  },
  manseryeokBtnArrow: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.gold.dark,
    opacity: 0.5,
  },

  /* ── Weekly Chart ── */
  weeklyCard: {
    marginTop: 12,
    marginBottom: 16,
    padding: 22,
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  weeklyLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    letterSpacing: 2,
    opacity: 0.7,
    marginBottom: 3,
  },
  weeklyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: 1,
  },
  weeklyBest: {
    alignItems: 'center',
    backgroundColor: theme.colors.gold.primary + '0C',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  weeklyBestLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: theme.colors.gold.primary,
    letterSpacing: 1.5,
  },
  weeklyBestDay: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    marginTop: 1,
  },

  /* ── 사주 해석 힌트 ── */
  sajuHint: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.goldCard.textTertiary,
    textAlign: 'center',
    marginTop: 10,
    opacity: 0.8,
  },

  /* ── 오행 해석 ── */
  elementInsight: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.glass.border,
    gap: 8,
  },
  elementInsightText: {
    fontSize: 13,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  elementInsightSub: {
    color: theme.colors.text.tertiary,
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

  /* ── 섹션 구분 ── */
  sectionDivider: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(212,168,75,0.15)',
    alignSelf: 'center',
    marginVertical: 4,
  },

  /* ── 하단 ── */
  disclaimer: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: 0.5,
    marginTop: 32,
  },
});
