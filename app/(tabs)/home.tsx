import React, { useMemo, useState, useCallback } from 'react';
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
import { useDailyFortune } from '../../src/hooks/useDailyFortune';
import { calculateFourPillars } from '../../src/utils/saju-calc';
import { api, formatPillarInfo } from '../../src/services/api';
import { CITIES, type City } from '../../src/constants/cities';

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
  const { setSajuResult, isLoading, setLoading, setError, saveAndRecord } = useFortuneStore();
  const { dailyFortune, refresh } = useDailyFortune();
  const [showPaywall, setShowPaywall] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showElement, setShowElement] = useState(false);

  const pillars = useMemo(
    () => user
      ? calculateFourPillars(user.birthYear, user.birthMonth, user.birthDay, user.birthHour)
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
        pillarInfo
      );
      setSajuResult(result);
      saveAndRecord('saju', true, result);
      router.push('/saju/result');
    } catch (err) {
      console.error('[Home] Paid analysis error:', err);
      if (pillars) {
        setSajuResult({
          fourPillars: {
            year: { stem: pillars.year.stem, branch: pillars.year.branch, element: pillars.year.element },
            month: { stem: pillars.month.stem, branch: pillars.month.branch, element: pillars.month.element },
            day: { stem: pillars.day.stem, branch: pillars.day.branch, element: pillars.day.element },
            hour: { stem: pillars.hour.stem, branch: pillars.hour.branch, element: pillars.hour.element },
          },
          elementBalance: pillars.elementBalance,
          overallScore: Math.floor(Math.random() * 20 + 70),
          headline: t('saju.defaultHeadline'),
          summary: t('saju.defaultSummary'),
        });
        router.push('/saju/result');
      }
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
    return <LoadingInk />;
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
          <Text style={styles.fortuneLabel}>{t('home.todayEnergy')}</Text>
          <Text style={styles.fortuneText}>{todaySummary}</Text>
          {dailyFortune?.luckyItem && (
            <View style={styles.luckyRow}>
              <Text style={styles.luckyLabel}>{t('home.luckyItemLabel')}</Text>
              <Text style={styles.luckyValue}>{dailyFortune.luckyItem}</Text>
            </View>
          )}
        </GlassCard>
      </Animated.View>


      {/* ── 상세 분석 CTA ── */}
      <Animated.View entering={FadeInDown.delay(400).duration(500)}>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => setShowPaywall(true)}
          activeOpacity={0.85}
        >
          <View style={styles.ctaGlowTop} />
          <View style={styles.ctaInner}>
            <View style={styles.ctaLeft}>
              <View style={styles.ctaIconCircle}>
                <Text style={styles.ctaIcon}>命</Text>
              </View>
              <View style={styles.ctaTextWrap}>
                <Text style={styles.ctaTitle} numberOfLines={1}>{t('home.myDetailAnalysis')}</Text>
                <Text style={styles.ctaSub} numberOfLines={1}>
                  {t('home.myDetailSub')}
                </Text>
              </View>
            </View>
            <View style={styles.ctaRight}>
              <View style={styles.ctaPriceBox}>
                <Text style={styles.ctaPrice}>{t('paywall.price')}</Text>
              </View>
              <Text style={styles.ctaArrow}>→</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* ── 사주 상세로 유도 ── */}
      <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/saju/detail')}>
        <PulseHint />
      </TouchableOpacity>

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
  profileEdit: { fontSize: 13, fontWeight: '600', color: theme.colors.gold.primary },

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
    color: theme.colors.gold.muted,
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
    color: theme.colors.gold.primary,
    textAlign: 'center',
    letterSpacing: 2,
  },
  /* ── 오늘의 기운 ── */
  fortuneCard: {
    marginBottom: 16,
    padding: 16,
  },
  fortuneLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.gold.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  fortuneText: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.text.secondary,
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
    color: theme.colors.gold.primary,
    fontWeight: '600',
  },

  /* ── 상세 분석 CTA ── */
  ctaBtn: {
    backgroundColor: '#1C1C1E',
    borderRadius: theme.radius.lg,
    paddingVertical: 18,
    paddingHorizontal: 20,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.gold.light,
    marginBottom: 3,
  },
  ctaSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.3,
  },
  ctaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaPriceBox: {
    backgroundColor: theme.colors.gold.primary + '20',
    borderRadius: theme.radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.gold.primary + '30',
  },
  ctaPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.gold.primary,
  },
  ctaArrow: {
    fontSize: 18,
    color: theme.colors.gold.primary + '80',
    fontWeight: '300',
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
