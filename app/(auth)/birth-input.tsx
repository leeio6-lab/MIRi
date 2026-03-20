import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { Button } from '../../src/components/ui/Button';
import { DateInputRow } from '../../src/components/ui/DateInputRow';
import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/services/supabase';
import { CITIES, type City } from '../../src/constants/cities';
import { getSolarTimeCorrection } from '../../src/utils/solar-time';
import { fetchGoogleProfile } from '../../src/services/auth';

const HOURS = [
  { labelKey: 'hourZi', sub: '23-01', value: 0 },
  { labelKey: 'hourChou', sub: '01-03', value: 2 },
  { labelKey: 'hourYin', sub: '03-05', value: 4 },
  { labelKey: 'hourMao', sub: '05-07', value: 6 },
  { labelKey: 'hourChen', sub: '07-09', value: 8 },
  { labelKey: 'hourSi', sub: '09-11', value: 10 },
  { labelKey: 'hourWu', sub: '11-13', value: 12 },
  { labelKey: 'hourWei', sub: '13-15', value: 14 },
  { labelKey: 'hourShen', sub: '15-17', value: 16 },
  { labelKey: 'hourYou', sub: '17-19', value: 18 },
  { labelKey: 'hourXu', sub: '19-21', value: 20 },
  { labelKey: 'hourHai', sub: '21-23', value: 22 },
];

export default function BirthInputScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams<{ name?: string; year?: string; month?: string; day?: string; pt?: string }>();
  const { setUser, setOnboardingComplete } = useAuthStore();

  const [userName, setUserName] = useState(params.name ?? '');
  const [year, setYear] = useState(params.year ?? '');
  const [month, setMonth] = useState(params.month ? params.month.padStart(2, '0') : '');
  const [day, setDay] = useState(params.day ? params.day.padStart(2, '0') : '');
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  const [isLunar, setIsLunar] = useState(false);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [unknownTime, setUnknownTime] = useState(false);

  useEffect(() => {
    const providerToken = params.pt;
    if (!providerToken) return;
    (async () => {
      try {
        const profile = await fetchGoogleProfile(providerToken);
        if (profile.name && /[\uAC00-\uD7AF]/.test(profile.name) && !userName) {
          setUserName(profile.name);
        }
        if (profile.birthYear) {
          setYear(String(profile.birthYear));
          if (profile.birthMonth) setMonth(String(profile.birthMonth).padStart(2, '0'));
          if (profile.birthDay) setDay(String(profile.birthDay).padStart(2, '0'));
        }
      } catch {}
    })();
  }, [params.pt]);

  const [cityQuery, setCityQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [showCityResults, setShowCityResults] = useState(false);

  const filteredCities = useMemo(() => {
    if (cityQuery.length < 1) return [];
    const q = cityQuery.toLowerCase();
    return CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.countryNameEn.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [cityQuery]);

  const correctionText = useMemo(() => {
    if (!selectedCity) return null;
    const mins = getSolarTimeCorrection(selectedCity.longitude, selectedCity.utcOffset);
    const rounded = Math.round(mins);
    const sign = rounded >= 0 ? '+' : '';
    return `${sign}${rounded}${t('birth.correctionMin')}`;
  }, [selectedCity, t]);

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    const displayName = i18n.language === 'en' ? city.nameEn : city.name;
    setCityQuery(`${displayName} (${city.countryNameEn})`);
    setShowCityResults(false);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStart = async () => {
    if (isSubmitting) return;
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);
    const hourNum = unknownTime ? 12 : (selectedHour ?? 12);

    if (!yearNum || !monthNum || !dayNum) return;

    // 날짜 유효성 (2월30일 등 방어)
    const maxDay = new Date(yearNum, monthNum, 0).getDate();
    if (dayNum > maxDay) {
      Alert.alert('날짜 오류', `${monthNum}월은 최대 ${maxDay}일까지입니다.`);
      return;
    }

    // 14세 미만 age gate
    const age = new Date().getFullYear() - yearNum;
    if (age < 14) {
      Alert.alert('이용 제한', '14세 미만은 법정대리인의 동의가 필요합니다.\n현재 버전에서는 14세 이상만 이용할 수 있습니다.');
      return;
    }

    setIsSubmitting(true);

    let userId = 'guest-' + Date.now();
    let email: string | undefined;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        userId = session.user.id;
        email = session.user.email ?? undefined;
      }
    } catch {}

    setUser({
      id: userId,
      email,
      name: userName || undefined,
      birthYear: yearNum,
      birthMonth: monthNum,
      birthDay: dayNum,
      birthHour: hourNum,
      isUnknownTime: unknownTime || undefined,
      isLunar,
      gender,
      locale: i18n.language,
      createdAt: new Date().toISOString(),
      birthCity: selectedCity?.id,
      birthLongitude: selectedCity?.longitude,
      birthUtcOffset: selectedCity?.utcOffset,
    });
    setOnboardingComplete();
    router.replace('/(tabs)/home');
    setIsSubmitting(false);
  };

  const yearNum_ = parseInt(year, 10);
  const monthNum_ = parseInt(month, 10);
  const dayNum_ = parseInt(day, 10);
  const isValid =
    userName.trim().length > 0 &&
    year.length === 4 &&
    !isNaN(yearNum_) &&
    yearNum_ >= 1900 &&
    yearNum_ <= new Date().getFullYear() &&
    month.length >= 1 &&
    !isNaN(monthNum_) &&
    monthNum_ >= 1 &&
    monthNum_ <= 12 &&
    day.length >= 1 &&
    !isNaN(dayNum_) &&
    dayNum_ >= 1 &&
    dayNum_ <= (yearNum_ && monthNum_ ? new Date(yearNum_, monthNum_, 0).getDate() : 31) &&
    (new Date().getFullYear() - yearNum_) >= 14;

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={s.header}>
          <Text style={s.decorChar}>命</Text>
          <View style={s.decorDots}>
            <View style={s.dot} />
            <View style={s.dotSm} />
            <View style={s.dot} />
          </View>
          <Text style={s.title}>{t('birth.title')}</Text>
          <Text style={s.subtitle}>{t('birth.subtitle')}</Text>
        </Animated.View>

        {/* Name */}
        <Animated.View entering={FadeInDown.delay(150).duration(600)}>
          <Text style={s.sectionLabel}>{t('home.editName')}</Text>
          <View style={s.inputCard}>
            <TextInput
              style={s.inputField}
              value={userName}
              onChangeText={setUserName}
              placeholder={t('birth.namePlaceholder')}
              placeholderTextColor={theme.colors.text.tertiary}
              returnKeyType="next"
            />
          </View>
        </Animated.View>

        {/* Calendar type */}
        <Animated.View entering={FadeInDown.delay(250).duration(600)}>
          <Text style={s.sectionLabel}>{t('home.editCalendar')}</Text>
          <View style={s.toggleRow}>
            <TouchableOpacity style={[s.toggleBtn, !isLunar && s.toggleActive]} onPress={() => setIsLunar(false)}>
              <Text style={[s.toggleText, !isLunar && s.toggleTextActive]}>{t('birth.solar')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.toggleBtn, isLunar && s.toggleActive]} onPress={() => setIsLunar(true)}>
              <Text style={[s.toggleText, isLunar && s.toggleTextActive]}>{t('birth.lunar')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Birth date */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <Text style={s.sectionLabel}>{t('home.editBirthDate')}</Text>
          <DateInputRow
            year={year}
            month={month}
            day={day}
            onChangeYear={setYear}
            onChangeMonth={setMonth}
            onChangeDay={setDay}
            variant="inline"
          />
        </Animated.View>

        {/* Gender */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <Text style={s.sectionLabel}>{t('home.editGender')}</Text>
          <View style={s.toggleRow}>
            <TouchableOpacity style={[s.toggleBtn, gender === 'male' && s.toggleActive]} onPress={() => setGender('male')}>
              <Text style={[s.toggleText, gender === 'male' && s.toggleTextActive]}>{t('birth.male')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.toggleBtn, gender === 'female' && s.toggleActive]} onPress={() => setGender('female')}>
              <Text style={[s.toggleText, gender === 'female' && s.toggleTextActive]}>{t('birth.female')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Birth city */}
        <Animated.View entering={FadeInDown.delay(420).duration(600)}>
          <Text style={s.sectionLabel}>{t('birth.birthCity')}</Text>
          <View style={s.inputCard}>
            <TextInput
              style={s.inputField}
              value={cityQuery}
              onChangeText={(v) => {
                setCityQuery(v);
                setSelectedCity(null);
                setShowCityResults(v.length >= 1);
              }}
              placeholder={t('birth.citySearch')}
              placeholderTextColor={theme.colors.text.tertiary}
              returnKeyType="done"
            />
          </View>
          {showCityResults && filteredCities.length > 0 && (
            <View style={s.cityResults}>
              {filteredCities.map((city) => (
                <TouchableOpacity
                  key={city.id}
                  style={s.cityItem}
                  onPress={() => handleCitySelect(city)}
                >
                  <Text style={s.cityName}>
                    {i18n.language === 'en' ? city.nameEn : city.name}
                  </Text>
                  <Text style={s.cityCountry}>{city.countryNameEn}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {selectedCity && correctionText && (
            <Text style={s.correctionHint}>
              {t('birth.solarCorrection')}: {correctionText}
            </Text>
          )}
        </Animated.View>

        {/* Birth hour */}
        <Animated.View entering={FadeInDown.delay(450).duration(600)}>
          <View style={s.hourHeader}>
            <Text style={s.sectionLabel}>{t('home.editBirthHour')}</Text>
            <TouchableOpacity
              style={s.unknownRow}
              onPress={() => setUnknownTime(!unknownTime)}
            >
              <View style={[s.checkbox, unknownTime && s.checkboxActive]}>
                {unknownTime && <Text style={s.checkIcon}>✓</Text>}
              </View>
              <Text style={s.unknownText}>{t('birth.unknownTime')}</Text>
            </TouchableOpacity>
          </View>

          {!unknownTime && (
            <View style={s.hoursGrid}>
              {HOURS.map((h) => {
                const active = selectedHour === h.value;
                return (
                  <TouchableOpacity
                    key={h.value}
                    style={[s.hourBtn, active && s.hourBtnActive]}
                    onPress={() => setSelectedHour(h.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.hourLabel, active && s.hourLabelActive]}>
                      {t(`birth.${h.labelKey}`)}
                    </Text>
                    <Text style={[s.hourSub, active && s.hourSubActive]}>
                      {h.sub}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Animated.View>

        {/* Start button */}
        <Animated.View entering={FadeInDown.delay(550).duration(600)}>
          <Button
            title={t('birth.start')}
            onPress={handleStart}
            disabled={!isValid}
            style={s.startBtn}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    padding: theme.spacing.screenPadding,
    paddingTop: 64,
    paddingBottom: 120,
  },

  /* ── Header ── */
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  decorChar: {
    fontSize: 56,
    fontWeight: '200',
    color: theme.colors.gold.primary,
    marginBottom: 8,
  },
  decorDots: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 18,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#1A1A1A',
  },
  dotSm: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#1A1A1A',
    opacity: 0.3,
  },
  title: {
    fontSize: 22,
    fontWeight: '200',
    color: theme.colors.text.primary,
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: 0.5,
  },

  /* ── Section labels ── */
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.gold.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    opacity: 0.7,
  },

  /* ── Toggle (solar/lunar, gender) ── */
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: theme.radius.sm,
    padding: 3,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: '#1A1A1A',
  },
  toggleText: {
    color: theme.colors.text.tertiary,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  toggleTextActive: {
    color: theme.colors.gold.primary,
    fontWeight: '600',
  },

  /* ── Input fields ── */
  inputCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: theme.radius.md,
    marginBottom: 20,
  },
  inputField: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.3,
  },

  /* ── City search ── */
  cityResults: {
    backgroundColor: '#F5F5F5',
    borderRadius: theme.radius.md,
    marginTop: -12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(212,168,75,0.10)',
  },
  cityName: {
    fontSize: 15,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  cityCountry: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  correctionHint: {
    fontSize: 12,
    color: theme.colors.gold.primary,
    marginTop: -8,
    marginBottom: 16,
    paddingHorizontal: 4,
    letterSpacing: 0.3,
  },

  /* ── Hour grid ── */
  hourHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  unknownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: theme.colors.text.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: theme.colors.gold.primary,
    borderColor: theme.colors.gold.primary,
  },
  checkIcon: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  unknownText: {
    color: theme.colors.text.secondary,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  hoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 32,
  },
  hourBtn: {
    width: '31%',
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: theme.radius.sm,
    alignItems: 'center',
  },
  hourBtnActive: {
    backgroundColor: '#1A1A1A',
  },
  hourLabel: {
    color: theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  hourLabelActive: {
    color: theme.colors.gold.primary,
    fontWeight: '700',
  },
  hourSub: {
    color: theme.colors.text.tertiary,
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  hourSubActive: {
    color: theme.colors.text.tertiary,
  },

  /* ── CTA ── */
  startBtn: {
    marginTop: 8,
  },
});
