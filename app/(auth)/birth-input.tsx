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

  // OAuth 후 provider_token으로 Google 프로필(생년월일만) 가져오기
  useEffect(() => {
    const providerToken = params.pt;
    if (!providerToken) return;
    (async () => {
      try {
        const profile = await fetchGoogleProfile(providerToken);
        // 이름: 한글인 경우에만 자동입력 (영문은 사주에 부적합)
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

  // City search
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

  const handleStart = async () => {
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);
    const hourNum = unknownTime ? 12 : (selectedHour ?? 12);

    if (!yearNum || !monthNum || !dayNum) return;

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
  };

  const yearNum_ = parseInt(year, 10);
  const monthNum_ = parseInt(month, 10);
  const dayNum_ = parseInt(day, 10);
  const isValid =
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
    dayNum_ <= 31;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
          <Text style={styles.decorChar}>命</Text>
          <View style={styles.decorLine} />
          <Text style={styles.title}>{t('birth.title')}</Text>
          <Text style={styles.subtitle}>{t('birth.subtitle')}</Text>
        </Animated.View>

        {/* Name */}
        <Animated.View entering={FadeInDown.delay(150).duration(600)}>
          <Text style={styles.sectionLabel}>{t('home.editName')}</Text>
          <View style={styles.nameCard}>
            <TextInput
              style={styles.nameInput}
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
          <Text style={styles.sectionLabel}>{t('home.editCalendar')}</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, !isLunar && styles.toggleActive]}
              onPress={() => setIsLunar(false)}
            >
              <Text style={[styles.toggleText, !isLunar && styles.toggleTextActive]}>
                {t('birth.solar')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, isLunar && styles.toggleActive]}
              onPress={() => setIsLunar(true)}
            >
              <Text style={[styles.toggleText, isLunar && styles.toggleTextActive]}>
                {t('birth.lunar')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Birth date */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <Text style={styles.sectionLabel}>{t('home.editBirthDate')}</Text>
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
          <Text style={styles.sectionLabel}>{t('home.editGender')}</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, gender === 'male' && styles.toggleActive]}
              onPress={() => setGender('male')}
            >
              <Text style={[styles.toggleText, gender === 'male' && styles.toggleTextActive]}>
                {t('birth.male')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, gender === 'female' && styles.toggleActive]}
              onPress={() => setGender('female')}
            >
              <Text style={[styles.toggleText, gender === 'female' && styles.toggleTextActive]}>
                {t('birth.female')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Birth city */}
        <Animated.View entering={FadeInDown.delay(420).duration(600)}>
          <Text style={styles.sectionLabel}>{t('birth.birthCity')}</Text>
          <View style={styles.nameCard}>
            <TextInput
              style={styles.nameInput}
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
            <View style={styles.cityResults}>
              {filteredCities.map((city) => (
                <TouchableOpacity
                  key={city.id}
                  style={styles.cityItem}
                  onPress={() => handleCitySelect(city)}
                >
                  <Text style={styles.cityName}>
                    {i18n.language === 'en' ? city.nameEn : city.name}
                  </Text>
                  <Text style={styles.cityCountry}>{city.countryNameEn}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {selectedCity && correctionText && (
            <Text style={styles.correctionHint}>
              {t('birth.solarCorrection')}: {correctionText}
            </Text>
          )}
        </Animated.View>

        {/* Birth hour */}
        <Animated.View entering={FadeInDown.delay(450).duration(600)}>
          <View style={styles.hourHeader}>
            <Text style={styles.sectionLabel}>{t('home.editBirthHour')}</Text>
            <TouchableOpacity
              style={styles.unknownRow}
              onPress={() => setUnknownTime(!unknownTime)}
            >
              <View style={[styles.checkbox, unknownTime && styles.checkboxActive]}>
                {unknownTime && <Text style={styles.checkIcon}>✓</Text>}
              </View>
              <Text style={styles.unknownText}>{t('birth.unknownTime')}</Text>
            </TouchableOpacity>
          </View>

          {!unknownTime && (
            <View style={styles.hoursGrid}>
              {HOURS.map((h) => {
                const active = selectedHour === h.value;
                return (
                  <TouchableOpacity
                    key={h.value}
                    style={[styles.hourBtn, active && styles.hourBtnActive]}
                    onPress={() => setSelectedHour(h.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.hourLabel, active && styles.hourLabelActive]}>
                      {t(`birth.${h.labelKey}`)}
                    </Text>
                    <Text style={[styles.hourSub, active && styles.hourSubActive]}>
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
            style={styles.startBtn}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg.primary,
  },
  scroll: {
    padding: theme.spacing.screenPadding,
    paddingTop: 70,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.sectionGap,
  },
  decorChar: {
    fontSize: 40,
    fontWeight: '200',
    color: theme.colors.gold.primary,
    marginBottom: theme.spacing.sm,
  },
  decorLine: {
    width: 40,
    height: 1,
    backgroundColor: theme.colors.gold.primary,
    opacity: 0.3,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '200',
    color: theme.colors.text.primary,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: '300',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.gold.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bg.secondary,
    borderRadius: theme.radius.sm,
    padding: 3,
    marginBottom: theme.spacing.lg,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: '#1C1C1E',
  },
  toggleText: {
    color: theme.colors.text.tertiary,
    fontSize: 14,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: theme.colors.gold.light,
    fontWeight: '600',
  },
  nameCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: theme.spacing.lg,
  },
  nameInput: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '400',
  },
  // City search
  cityResults: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginTop: -theme.spacing.md,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
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
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.md,
    paddingHorizontal: 4,
  },
  // Hour grid
  hourHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
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
  },
  hoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  hourBtn: {
    width: '31%',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  hourBtnActive: {
    borderColor: theme.colors.gold.primary,
    backgroundColor: '#1C1C1E',
  },
  hourLabel: {
    color: theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  hourLabelActive: {
    color: theme.colors.gold.light,
    fontWeight: '600',
  },
  hourSub: {
    color: theme.colors.text.tertiary,
    fontSize: 10,
    marginTop: 2,
  },
  hourSubActive: {
    color: theme.colors.gold.muted,
  },
  startBtn: {
    marginTop: theme.spacing.md,
  },
});
