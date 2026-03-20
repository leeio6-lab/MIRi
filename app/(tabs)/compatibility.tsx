import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { DateInputRow } from '../../src/components/ui/DateInputRow';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { LoadingInk } from '../../src/components/ui/LoadingInk';
import { PaywallModal } from '../../src/components/ui/PaywallModal';
import { ShareCard } from '../../src/components/ui/ShareCard';
import { CompatibilityRadar } from '../../src/components/saju/CompatibilityRadar';
import { ElementMatch } from '../../src/components/saju/ElementMatch';
import { useAuthStore } from '../../src/stores/authStore';
import { useFortuneStore } from '../../src/stores/fortuneStore';
import { CONFIG } from '../../src/constants/config';
import { api, formatPillarInfo } from '../../src/services/api';
import { calculateFourPillars } from '../../src/utils/saju-calc';
import { getCoupleTitle, getCompatOverview, getZodiacEmoji } from '../../src/utils/compatibility-calc';
import type { CompatibilityResult, CompatCategories, CompatCategoryScore, CompatDayMaster, CompatRelationshipStages, CompatSurvivalGuide, CompatDateRecommend, CompatSecretMessage, CompatCoupleArchetype } from '../../src/types/api';

// ELEMENT_KO removed — use t(`elements.${el}`) inside component

const CAT_LABELS: Record<string, string> = {
  love: '애정', communication: '소통', values: '가치관',
  sexual: '성적', finance: '금전', family: '가족',
  growth: '성장', crisis: '위기',
};

const VERDICT_MAP: { min: number; label: string; sub: string }[] = [
  { min: 90, label: '천생연분', sub: '전생에 약속한 인연' },
  { min: 80, label: '찢었다', sub: '주변에서 질투할 조합' },
  { min: 70, label: '케미 폭발', sub: '같이 있으면 시간이 순삭' },
  { min: 60, label: '밀당의 고수들', sub: '적당한 긴장감이 관계를 지킨다' },
  { min: 50, label: '묘한 끌림', sub: '끌리는데 불안하기도 한' },
  { min: 40, label: '취급주의', sub: '서로 자극하는 위험한 관계' },
  { min: 0, label: '도망쳐', sub: '만나면 둘 다 지치는 관계' },
];

const getVerdict = (score: number) => VERDICT_MAP.find(v => score >= v.min) || VERDICT_MAP[VERDICT_MAP.length - 1];

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

export default function CompatibilityScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth > 600;
  const getEl = (el: string) => t(`elements.${el}`);
  const { user } = useAuthStore();
  const { setCompatibilityResult, saveAndRecord } = useFortuneStore();

  const [partnerName, setPartnerName] = useState('');
  const [partnerYear, setPartnerYear] = useState('');
  const [partnerMonth, setPartnerMonth] = useState('');
  const [partnerDay, setPartnerDay] = useState('');
  const [partnerGender, setPartnerGender] = useState<'male' | 'female'>('female');

  // 내 정보 수정 — user가 없으면 자동으로 편집모드
  const [editingMy, setEditingMy] = useState(!user);
  const [myName, setMyName] = useState(user?.name ?? '');
  const [myYear, setMyYear] = useState(user ? String(user.birthYear) : '');
  const [myMonth, setMyMonth] = useState(user ? String(user.birthMonth) : '');
  const [myDay, setMyDay] = useState(user ? String(user.birthDay) : '');
  const [myGender, setMyGender] = useState<'male' | 'female'>(user?.gender ?? 'male');
  const [myIsLunar, setMyIsLunar] = useState(user?.isLunar ?? false);
  const [mySelectedHour, setMySelectedHour] = useState<number | null>(user?.birthHour ?? null);
  const [myUnknownTime, setMyUnknownTime] = useState(user?.birthHour == null);
  const [partnerIsLunar, setPartnerIsLunar] = useState(false);
  const [partnerSelectedHour, setPartnerSelectedHour] = useState<number | null>(null);
  const [partnerUnknownTime, setPartnerUnknownTime] = useState(false);

  const myEffectiveYear = editingMy ? parseInt(myYear, 10) : user?.birthYear;
  const myEffectiveMonth = editingMy ? parseInt(myMonth, 10) : user?.birthMonth;
  const myEffectiveDay = editingMy ? parseInt(myDay, 10) : user?.birthDay;
  const myEffectiveHour = editingMy ? (myUnknownTime ? 12 : (mySelectedHour ?? 12)) : (user?.birthHour ?? 12);
  const myEffectiveGender = editingMy ? myGender : (user?.gender ?? 'male');
  const myEffectiveIsLunar = editingMy ? myIsLunar : (user?.isLunar ?? false);

  const myPillarsData = React.useMemo(() => {
    const y = myEffectiveYear; const m = myEffectiveMonth; const d = myEffectiveDay;
    if (!y || !m || !d || isNaN(y) || isNaN(m) || isNaN(d)) return null;
    try { return calculateFourPillars(y, m, d, myEffectiveHour, undefined, undefined, undefined, myEffectiveIsLunar); } catch { return null; }
  }, [myEffectiveYear, myEffectiveMonth, myEffectiveDay, myEffectiveHour]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<string, number>>({});

  const partnerYearNum = parseInt(partnerYear, 10);
  const partnerMonthNum = parseInt(partnerMonth, 10);
  const partnerDayNum = parseInt(partnerDay, 10);
  const partnerHourNum = partnerUnknownTime ? 12 : (partnerSelectedHour ?? 12);
  const isValidDate = (y: number, m: number, d: number) => {
    if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
    if (y < 1920 || y > new Date().getFullYear()) return false;
    if (m < 1 || m > 12 || d < 1) return false;
    const maxDay = new Date(y, m, 0).getDate();
    return d <= maxDay;
  };
  const isPartnerValid =
    partnerYear.length === 4 && isValidDate(partnerYearNum, partnerMonthNum, partnerDayNum);

  const myDisplayName = (editingMy ? myName.trim() : user?.name) || t('common.me');
  const ptName = partnerName.trim() || t('common.partner');


  const partnerPillarsData = React.useMemo(() => {
    if (!isPartnerValid) return null;
    try { return calculateFourPillars(partnerYearNum, partnerMonthNum, partnerDayNum, partnerHourNum, undefined, undefined, undefined, partnerIsLunar); }
    catch { return null; }
  }, [isPartnerValid, partnerYearNum, partnerMonthNum, partnerDayNum, partnerHourNum]);

  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  const handleAnalyze = async () => {
    if (loading) return;
    if (__DEV__) console.log('[Compat] handleAnalyze called', { myEffectiveYear, myEffectiveMonth, myEffectiveDay, isPartnerValid });
    if (!isPartnerValid || !myEffectiveYear || !myEffectiveMonth || !myEffectiveDay) return;
    setLoading(true);
    setAnalyzeError(null);
    try {
      // useMemo로 이미 계산된 pillar 재활용 (중복 계산 방지)
      const myPillars = myPillarsData ?? calculateFourPillars(myEffectiveYear, myEffectiveMonth, myEffectiveDay, myEffectiveHour, undefined, undefined, undefined, myEffectiveIsLunar);
      const partnerPillars = partnerPillarsData ?? calculateFourPillars(partnerYearNum, partnerMonthNum, partnerDayNum, partnerHourNum, undefined, undefined, undefined, partnerIsLunar);
      if (__DEV__) console.log('[Compat] Calling API...');
      const apiResult = await api.analyzeCompatibility(
        { year: myEffectiveYear, month: myEffectiveMonth, day: myEffectiveDay, hour: myEffectiveHour, isLunar: myEffectiveIsLunar, gender: myEffectiveGender },
        { year: partnerYearNum, month: partnerMonthNum, day: partnerDayNum, hour: partnerHourNum, isLunar: partnerIsLunar, gender: partnerGender },
        user?.locale ?? 'ko', true,
        formatPillarInfo(myPillars, myEffectiveYear, myEffectiveMonth, myEffectiveDay, myEffectiveGender),
        formatPillarInfo(partnerPillars, partnerYearNum, partnerMonthNum, partnerDayNum, partnerGender),
        myDisplayName, ptName,
      );
      if (!mountedRef.current) return;
      if (__DEV__) console.log('[Compat] API success');
      setResult(apiResult);
      setCompatibilityResult(apiResult);
      saveAndRecord('compatibility', true, apiResult);
    } catch (err) {
      if (!mountedRef.current) return;
      if (__DEV__) console.error('[Compatibility] error:', err);
      setAnalyzeError(err instanceof Error ? err.message : 'Analysis failed');
      // 결제 후 분석 실패 시 크레딧 복원
      const { usePurchaseStore } = require('../../src/stores/purchaseStore');
      usePurchaseStore.getState().restoreCredit('compatibility');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  if (loading) return <LoadingInk steps={t('loading.compatSteps', { returnObjects: true }) as string[]} tips={t('loading.sajuTips', { returnObjects: true }) as string[]} finalMessage={t('loading.compatFinal')} estimatedSeconds={30} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView ref={scrollRef} style={st.container} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>

      {/* Error banner */}
      {analyzeError && (
        <TouchableOpacity style={{ backgroundColor: '#FF3B30', borderRadius: 12, padding: 14, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }} onPress={() => setAnalyzeError(null)}>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500', flex: 1 }}>{analyzeError}</Text>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 12 }}>X</Text>
        </TouchableOpacity>
      )}

      {/* ── INPUT FORM (hide after result) ── */}
      {!result && (
        <>
          <View style={st.hero}>
            <Text style={st.heroChar}>緣</Text>
            <View style={st.heroDotsRow}>
              <View style={st.heroDot} />
              <View style={st.heroDotSmall} />
              <View style={st.heroDot} />
            </View>
            <Text style={st.heroTitle}>{t('compatibility.title')}</Text>
            <Text style={st.heroSub}>{'두 사람의 사주가 만나\n어떤 인연을 만드는지 알려드려요'}</Text>
          </View>

          {/* My Info — 간소화 (탭하면 수정) */}
          <TouchableOpacity
            style={st.myCompact}
            onPress={() => setEditingMy(!editingMy)}
            activeOpacity={0.7}
          >
            {/* 상단 골드 엣지라인 */}
            <View style={st.myCompactGoldEdge} />
            {!editingMy ? (
              <View style={st.myCompactRow}>
                <View style={st.myCompactLeft}>
                  <Text style={st.myCompactLabel}>{t('compatibility.myInfo')}</Text>
                  <Text style={st.myCompactInfo}>
                    {myDisplayName}{' · '}
                    {myEffectiveYear}.{String(myEffectiveMonth).padStart(2, '0')}.{String(myEffectiveDay).padStart(2, '0')}
                    {' · '}{myEffectiveGender === 'male' ? t('common.male_short') : t('common.female_short')}
                    {myPillarsData ? ` · ${myPillarsData.dayMaster}` : ''}
                  </Text>
                </View>
                <Text style={st.myCompactEdit}>{t('home.profileEdit')}</Text>
              </View>
            ) : (
              <View>
                <View style={st.myCompactEditHeader}>
                  <Text style={st.myCompactLabel}>{t('compatibility.myInfo')}</Text>
                  <Text style={st.myCompactDone}>{t('common.confirm')}</Text>
                </View>

                <TextInput
                  style={st.nameInput}
                  value={myName}
                  onChangeText={setMyName}
                  placeholder={t('compatibility.namePlaceholder')}
                  placeholderTextColor={theme.colors.text.tertiary}
                  maxLength={10}
                />

                <Text style={st.inputLabel}>{t('home.editCalendar')}</Text>
                <View style={st.calToggleRow}>
                  <TouchableOpacity style={[st.calToggleBtn, !myIsLunar && st.calToggleActive]} onPress={() => setMyIsLunar(false)}>
                    <Text style={[st.calToggleText, !myIsLunar && st.calToggleTextActive]}>{t('birth.solar')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[st.calToggleBtn, myIsLunar && st.calToggleActive]} onPress={() => setMyIsLunar(true)}>
                    <Text style={[st.calToggleText, myIsLunar && st.calToggleTextActive]}>{t('birth.lunar')}</Text>
                  </TouchableOpacity>
                </View>

                <DateInputRow
                  year={myYear} month={myMonth} day={myDay}
                  onChangeYear={setMyYear} onChangeMonth={setMyMonth} onChangeDay={setMyDay}
                  variant="inline"
                />

                <View style={st.genderRow}>
                  <TouchableOpacity style={[st.genderBtn, myGender === 'male' && st.genderActive]} onPress={() => setMyGender('male')}>
                    <Text style={[st.genderText, myGender === 'male' && st.genderTextActive]}>{t('compatibility.maleGender')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[st.genderBtn, myGender === 'female' && st.genderActive]} onPress={() => setMyGender('female')}>
                    <Text style={[st.genderText, myGender === 'female' && st.genderTextActive]}>{t('compatibility.femaleGender')}</Text>
                  </TouchableOpacity>
                </View>

                <View style={st.hourHeader}>
                  <Text style={st.inputLabel}>{t('home.editBirthHour')}</Text>
                  <TouchableOpacity style={st.unknownRow} onPress={() => { setMyUnknownTime(!myUnknownTime); if (!myUnknownTime) setMySelectedHour(null); }}>
                    <View style={[st.checkbox, myUnknownTime && st.checkboxActive]}>
                      {myUnknownTime && <Text style={st.checkIcon}>{'\u2713'}</Text>}
                    </View>
                    <Text style={st.unknownText}>{t('birth.unknownTime')}</Text>
                  </TouchableOpacity>
                </View>
                {!myUnknownTime && (
                  <View style={st.hoursGrid}>
                    {HOURS.map((h) => {
                      const active = mySelectedHour === h.value;
                      return (
                        <TouchableOpacity
                          key={h.value}
                          style={[st.hourBtn, active && st.hourBtnActive]}
                          onPress={() => setMySelectedHour(h.value)}
                          activeOpacity={0.7}
                        >
                          <Text style={[st.hourLabel, active && st.hourLabelActive]}>{t(`birth.${h.labelKey}`)}</Text>
                          <Text style={[st.hourSub, active && st.hourSubActive]}>{h.sub}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>

          {/* Partner Info */}
          <GlassCard style={st.personCard}>
            <Text style={st.personLabel}>{t('compatibility.partnerInfo')}</Text>
            <TextInput
              style={st.nameInput}
              value={partnerName}
              onChangeText={setPartnerName}
              placeholder={t('compatibility.namePlaceholder')}
              placeholderTextColor={theme.colors.text.tertiary}
              maxLength={10}
            />

            {/* Calendar type (양력/음력) */}
            <Text style={st.inputLabel}>{t('home.editCalendar')}</Text>
            <View style={st.calToggleRow}>
              <TouchableOpacity style={[st.calToggleBtn, !partnerIsLunar && st.calToggleActive]} onPress={() => setPartnerIsLunar(false)}>
                <Text style={[st.calToggleText, !partnerIsLunar && st.calToggleTextActive]}>{t('birth.solar')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.calToggleBtn, partnerIsLunar && st.calToggleActive]} onPress={() => setPartnerIsLunar(true)}>
                <Text style={[st.calToggleText, partnerIsLunar && st.calToggleTextActive]}>{t('birth.lunar')}</Text>
              </TouchableOpacity>
            </View>

            <DateInputRow
              year={partnerYear}
              month={partnerMonth}
              day={partnerDay}
              onChangeYear={setPartnerYear}
              onChangeMonth={setPartnerMonth}
              onChangeDay={setPartnerDay}
              variant="inline"
            />

            {/* Gender */}
            <View style={st.genderRow}>
              <TouchableOpacity style={[st.genderBtn, partnerGender === 'male' && st.genderActive]} onPress={() => setPartnerGender('male')}>
                <Text style={[st.genderText, partnerGender === 'male' && st.genderTextActive]}>{t('compatibility.maleGender')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.genderBtn, partnerGender === 'female' && st.genderActive]} onPress={() => setPartnerGender('female')}>
                <Text style={[st.genderText, partnerGender === 'female' && st.genderTextActive]}>{t('compatibility.femaleGender')}</Text>
              </TouchableOpacity>
            </View>

            {/* Birth hour (생시) */}
            <View style={st.hourHeader}>
              <Text style={st.inputLabel}>{t('home.editBirthHour')}</Text>
              <TouchableOpacity style={st.unknownRow} onPress={() => setPartnerUnknownTime(!partnerUnknownTime)}>
                <View style={[st.checkbox, partnerUnknownTime && st.checkboxActive]}>
                  {partnerUnknownTime && <Text style={st.checkIcon}>{'\u2713'}</Text>}
                </View>
                <Text style={st.unknownText}>{t('birth.unknownTime')}</Text>
              </TouchableOpacity>
            </View>
            {!partnerUnknownTime && (
              <View style={st.hoursGrid}>
                {HOURS.map((h) => {
                  const active = partnerSelectedHour === h.value;
                  return (
                    <TouchableOpacity
                      key={h.value}
                      style={[st.hourBtn, active && st.hourBtnActive]}
                      onPress={() => setPartnerSelectedHour(h.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[st.hourLabel, active && st.hourLabelActive]}>{t(`birth.${h.labelKey}`)}</Text>
                      <Text style={[st.hourSub, active && st.hourSubActive]}>{h.sub}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </GlassCard>

          <Button title={`${t('compatibility.analyzeButton')} · ${t('paywall.price')}`} onPress={() => CONFIG.DEV_BYPASS_PAYMENT ? handleAnalyze() : setShowPaywall(true)} disabled={!isPartnerValid} style={st.analyzeBtn} />
        </>
      )}

      {/* ── RESULTS ── */}
      {result && (
        <Animated.View entering={FadeInDown.springify()}>
          {/* Back to input */}
          <TouchableOpacity onPress={() => setResult(null)} style={st.resetBtn} activeOpacity={0.6}>
            <View style={st.resetIconWrap}>
              <Text style={st.resetIcon}>{'\u2039'}</Text>
            </View>
            <Text style={st.resetText}>{t('compatibility.reAnalyze')}</Text>
          </TouchableOpacity>

          {/* Brand */}
          <View style={st.brandRow}>
            <Text style={st.brandLogo}>명리</Text>
            <Text style={st.brandTag}>두 사람의 인연</Text>
          </View>

          {/* ═══ 궁합 요약 카드 (사주분석 overview 스타일) ═══ */}
          {(() => {
            const ov = (myPillarsData?.dayMasterElement && partnerPillarsData?.dayMasterElement)
              ? getCompatOverview(myPillarsData.dayMasterElement, partnerPillarsData.dayMasterElement, myPillarsData.year?.zodiac ?? '', partnerPillarsData.year?.zodiac ?? '')
              : null;
            return (
              <>
                {/* 커플 타이틀 + 점수 */}
                <View style={st.hookHero}>
                  <Text style={st.hookTitle} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.7}>{ov?.coupleTitle ?? result.headline ?? ''}</Text>
                  <Text style={st.hookScore}>{result.overallScore}<Text style={st.hookScoreUnit}>점</Text></Text>
                </View>

                {/* 커플 프로필 카드 */}
                <GlassCard gold style={st.coupleCard}>
                  <View style={st.coupleRow}>
                    <View style={st.coupleCol}>
                      <View style={st.coupleCircle}>
                        {myPillarsData && <Text style={st.coupleHanja}>{myPillarsData.dayMaster}</Text>}
                      </View>
                      <Text style={st.coupleName}>{myDisplayName}</Text>
                      <Text style={st.coupleZodiac}>{ov?.myZodiac ?? ''}띠</Text>
                    </View>
                    <View style={st.coupleVs}>
                      <View style={[st.relBadge, ov?.elRelation === '상극' && st.relBadgeClash]}>
                        <Text style={st.relBadgeText}>{ov?.elRelation ?? ''}</Text>
                      </View>
                    </View>
                    <View style={st.coupleCol}>
                      <View style={st.coupleCircle}>
                        {partnerPillarsData && <Text style={st.coupleHanja}>{partnerPillarsData.dayMaster}</Text>}
                      </View>
                      <Text style={st.coupleName}>{ptName}</Text>
                      <Text style={st.coupleZodiac}>{ov?.ptZodiac ?? ''}띠</Text>
                    </View>
                  </View>
                </GlassCard>

                {/* 10줄 요약 카드 (클릭 → 해당 섹션 이동) */}
                {ov && (
                  <GlassCard gold style={st.overviewCard}>
                    {[
                      { hanja: '初', meaning: '첫인상', value: ov.first, section: 'dynamics' },
                      { hanja: '魅', meaning: '매력', value: ov.charm, section: 'stages' },
                      { hanja: '愛', meaning: '사랑', value: ov.love, section: 'stages' },
                      { hanja: '戰', meaning: '갈등', value: ov.fight, section: 'dynamics' },
                      { hanja: '嫉', meaning: '질투', value: ov.jealousy, section: 'dynamics' },
                      { hanja: '財', meaning: '금전', value: ov.money, section: 'survival' },
                      { hanja: '夜', meaning: '밤', value: ov.bed, section: 'date' },
                      { hanja: '婚', meaning: '결혼', value: ov.family, section: 'marriage' },
                      { hanja: '危', meaning: '위험', value: ov.danger, section: 'survival', warn: true },
                      { hanja: '判', meaning: '판정', value: ov.verdict, section: 'dynamics', gold: true },
                    ].map((item, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[st.ovRow, i < 9 && st.ovRowBorder]}
                        onPress={() => {
                          const y = sectionY.current[item.section];
                          if (y != null) scrollRef.current?.scrollTo({ y: y - 20, animated: true });
                        }}
                        activeOpacity={0.6}
                      >
                        <View style={st.ovBadgeWrap}>
                          <View style={[st.ovBadge, (item as any).warn && st.ovBadgeWarn, (item as any).gold && st.ovBadgeGold]}>
                            <Text style={[st.ovBadgeText, (item as any).warn && st.ovBadgeTextWarn, (item as any).gold && st.ovBadgeTextGold]}>{item.hanja}</Text>
                          </View>
                          <Text style={st.ovBadgeMeaning}>{(item as any).meaning}</Text>
                        </View>
                        <View style={st.ovBody}>
                          <Text style={[st.ovValue, (item as any).gold && st.ovValueGold]}>{item.value}</Text>
                        </View>
                        <Text style={st.ovArrow}>›</Text>
                      </TouchableOpacity>
                    ))}
                  </GlassCard>
                )}

                {/* 요약 텍스트 */}
                {result.summary && (
                  <Text style={st.resultSummary}>{result.summary}</Text>
                )}
              </>
            );
          })()}

          {/* ── PAID SECTIONS ── */}
          {result.categories && (
            <>
              {/* Radar */}
              <GlassCard style={st.detailCard}>
                <Text style={st.detailLabel}>{t('compatibility.radar')}</Text>
                <CompatibilityRadar categories={result.categories as CompatCategories} />
              </GlassCard>

              {/* Category details */}
              <GlassCard style={st.detailCard}>
                <Text style={st.detailLabel}>{t('compatibility.categoryDetail')}</Text>
                {Object.entries(result.categories).map(([key, val]) => {
                  const getCat = (key: string) => t(`compatibility.categories.${key}`);
                  const sc = typeof val === 'number' ? val : (val as CompatCategoryScore)?.score ?? 50;
                  const detail = typeof val === 'object' ? (val as CompatCategoryScore)?.detail : '';
                  const color = sc >= 75 ? theme.colors.success : sc >= 55 ? theme.colors.gold.primary : sc >= 40 ? theme.colors.warning : theme.colors.error;
                  return (
                    <View key={key} style={st.catRow}>
                      <View style={st.catHead}>
                        <Text style={st.catLabel}>{getCat(key)}</Text>
                        <Text style={[st.catScore, { color }]}>{sc}</Text>
                      </View>
                      {detail ? <Text style={st.catDetail}>{detail}</Text> : null}
                    </View>
                  );
                })}
              </GlassCard>

              {/* Element Match */}
              {result.elementInteraction && (
                <GlassCard style={st.detailCard}>
                  <Text style={st.detailLabel}>{t('compatibility.elementCompat')}</Text>
                  <ElementMatch
                    aName={myDisplayName} bName={ptName}
                    aDominant={result.elementInteraction.aElements.dominant}
                    aPercent={result.elementInteraction.aElements.percent}
                    bDominant={result.elementInteraction.bElements.dominant}
                    bPercent={result.elementInteraction.bElements.percent}
                    interaction={result.elementInteraction.interaction}
                    complementary={result.elementInteraction.complementary}
                  />
                </GlassCard>
              )}

              {/* Day Master */}
              {result.dayMasterRelation && (
                <GlassCard style={st.detailCard}>
                  <Text style={st.detailLabel}>{t('compatibility.dayMasterRelation')}</Text>
                  {typeof result.dayMasterRelation === 'string' ? (
                    <Text style={st.detailText}>{result.dayMasterRelation}</Text>
                  ) : (
                    <>
                      <Text style={st.dmType}>{(result.dayMasterRelation as CompatDayMaster).type}</Text>
                      <Text style={st.detailText}>{(result.dayMasterRelation as CompatDayMaster).analysis}</Text>
                      <View style={[st.dmPairRow, isTablet && { flexDirection: 'row' }]}>
                        <View style={[st.dmPairCol, isTablet && { flex: 1 }]}>
                          <Text style={st.dmPairLabel} numberOfLines={1}>{myDisplayName} → {ptName}</Text>
                          <Text style={st.dmPairText}>{(result.dayMasterRelation as CompatDayMaster).aToB}</Text>
                        </View>
                        <View style={isTablet ? { width: 1, backgroundColor: theme.colors.glass.border, alignSelf: 'stretch' } : st.dmDiv} />
                        <View style={[st.dmPairCol, isTablet && { flex: 1 }]}>
                          <Text style={st.dmPairLabel} numberOfLines={1}>{ptName} → {myDisplayName}</Text>
                          <Text style={st.dmPairText}>{(result.dayMasterRelation as CompatDayMaster).bToA}</Text>
                        </View>
                      </View>
                    </>
                  )}
                </GlassCard>
              )}

              {/* Dynamics */}
              {result.dynamics && (
                <View onLayout={(e) => { sectionY.current['dynamics'] = e.nativeEvent.layout.y; }}><GlassCard style={st.detailCard}>
                  <Text style={st.detailLabel}>{t('compatibility.dynamicsTitle')}</Text>
                  {result.dynamics.powerBalance ? <View style={st.dynSec}><Text style={st.dynTitle}>{t('compatibility.powerBalance')}</Text><Text style={st.detailText}>{result.dynamics.powerBalance}</Text></View> : null}
                  {result.dynamics.fightPattern ? <View style={st.dynSec}><Text style={st.dynTitle}>{t('compatibility.fightPattern')}</Text><Text style={st.detailText}>{result.dynamics.fightPattern}</Text></View> : null}
                  {result.dynamics.loveLanguage ? <View style={st.dynSec}><Text style={st.dynTitle}>{t('compatibility.loveLanguage')}</Text><Text style={st.detailText}>{result.dynamics.loveLanguage}</Text></View> : null}
                  {result.dynamics.dealBreaker ? (
                    <View style={st.dealBox}><Text style={st.dealTitle}>{t('compatibility.dealBreaker')}</Text><Text style={st.dealText}>{result.dynamics.dealBreaker}</Text></View>
                  ) : null}
                </GlassCard></View>
              )}

              {/* Strength / Conflict */}
              {result.strengthPoints && result.strengthPoints.length > 0 && (
                <GlassCard style={st.detailCard}>
                  <Text style={st.detailLabel}>{t('compatibility.synergyPoints')}</Text>
                  {result.strengthPoints.map((p, i) => <View key={i} style={st.pointRow}><Text style={st.pointGood}>+</Text><Text style={st.detailText}>{p}</Text></View>)}
                </GlassCard>
              )}
              {result.conflictPoints && result.conflictPoints.length > 0 && (
                <GlassCard style={st.detailCard}>
                  <Text style={st.detailLabel}>{t('compatibility.conflictPoints')}</Text>
                  {result.conflictPoints.map((p, i) => <View key={i} style={st.pointRow}><Text style={st.pointWarn}>!</Text><Text style={st.detailText}>{p}</Text></View>)}
                </GlassCard>
              )}

              {/* Relationship Stages */}
              {result.relationshipStages && (
                <View onLayout={(e) => { sectionY.current['stages'] = e.nativeEvent.layout.y; }}><GlassCard style={st.detailCard}>
                  <Text style={st.detailLabel}>{t('compatibility.relationTimeline')}</Text>
                  {[
                    { label: t('compatibility.stage0_3'), icon: '🌱', text: result.relationshipStages.first3months },
                    { label: t('compatibility.stage3_6'), icon: '🌿', text: result.relationshipStages.sixMonths },
                    { label: t('compatibility.stage6_12'), icon: '🌳', text: result.relationshipStages.oneYear },
                    { label: t('compatibility.stage1_3y'), icon: '🏔', text: result.relationshipStages.threeYears },
                    { label: t('compatibility.stage3y_plus'), icon: '🏡', text: result.relationshipStages.longTerm },
                  ].map((stage, i) => (
                    <View key={i} style={st.stageRow}>
                      <View style={st.stageLeft}>
                        <Text style={st.stageIcon}>{stage.icon}</Text>
                        <View style={i < 4 ? st.stageLine : undefined} />
                      </View>
                      <View style={st.stageBody}>
                        <Text style={st.stageLabel}>{stage.label}</Text>
                        <Text style={st.stageText}>{stage.text}</Text>
                      </View>
                    </View>
                  ))}
                </GlassCard></View>
              )}

              {/* Survival Guide */}
              {result.survivalGuide && (
                <View onLayout={(e) => { sectionY.current['survival'] = e.nativeEvent.layout.y; }}><GlassCard style={st.detailCard}>
                  <Text style={st.detailLabel}>{t('compatibility.survivalRules')}</Text>
                  {[result.survivalGuide.rule1, result.survivalGuide.rule2, result.survivalGuide.rule3].map((r, i) => (
                    <View key={i} style={st.ruleRow}>
                      <View style={st.ruleBadge}><Text style={st.ruleNum}>{i + 1}</Text></View>
                      <Text style={st.detailText}>{r}</Text>
                    </View>
                  ))}
                  {result.survivalGuide.neverDo && (
                    <View style={st.dealBox}>
                      <Text style={st.dealTitle}>{t('compatibility.neverDo')}</Text>
                      <Text style={st.dealText}>{result.survivalGuide.neverDo}</Text>
                    </View>
                  )}
                </GlassCard></View>
              )}

              {/* Date Recommend */}
              {result.dateRecommend && (
                <View onLayout={(e) => { sectionY.current['date'] = e.nativeEvent.layout.y; }}><GlassCard style={st.detailCard}>
                  <Text style={st.detailLabel}>{t('compatibility.dateRecommendTitle')}</Text>
                  <View style={st.dateGrid}>
                    <View style={[st.dateItem, st.dateGood]}>
                      <Text style={st.dateItemLabel}>{t('compatibility.bestDate')}</Text>
                      <Text style={st.dateItemText}>{result.dateRecommend.bestDate}</Text>
                    </View>
                    <View style={[st.dateItem, st.dateHeal]}>
                      <Text style={st.dateItemLabel}>{t('compatibility.healingDate')}</Text>
                      <Text style={st.dateItemText}>{result.dateRecommend.healingDate}</Text>
                    </View>
                    <View style={[st.dateItem, st.dateBad]}>
                      <Text style={st.dateItemLabel}>{t('compatibility.worstDate')}</Text>
                      <Text style={st.dateItemText}>{result.dateRecommend.worstDate}</Text>
                    </View>
                  </View>
                </GlassCard></View>
              )}

              {/* Marriage Grade */}
              {result.marriageGrade && (
                <View onLayout={(e) => { sectionY.current['marriage'] = e.nativeEvent.layout.y; }}><GlassCard gold style={st.detailCard}>
                  <Text style={st.detailLabel}>{t('compatibility.marriageGradeTitle')}</Text>
                  <Text style={st.gradeText}>{result.marriageGrade.grade}</Text>
                  <Text style={st.detailText}>{result.marriageGrade.summary}</Text>
                  {result.marriageGrade.ifMarried && <><View style={st.divider} /><Text style={st.dynTitle}>{t('compatibility.afterMarriage')}</Text><Text style={st.detailText}>{result.marriageGrade.ifMarried}</Text></>}
                  {result.marriageGrade.childrenNote && <><View style={st.divider} /><Text style={st.dynTitle}>{t('compatibility.childrenNote')}</Text><Text style={st.detailText}>{result.marriageGrade.childrenNote}</Text></>}
                  {result.marriageGrade.inlaws && <><View style={st.divider} /><Text style={st.dynTitle}>{t('compatibility.inlaws')}</Text><Text style={st.detailText}>{result.marriageGrade.inlaws}</Text></>}
                </GlassCard></View>
              )}

              {/* Secret Message */}
              {result.secretMessage && (
                <GlassCard style={st.detailCard}>
                  <Text style={st.detailLabel}>{t('compatibility.secretAdvice')}</Text>
                  <View style={[st.secretRow, isTablet && { flexDirection: 'row' }]}>
                    <View style={[st.secretCol, isTablet && { flex: 1 }]}>
                      <Text style={st.secretLabel}>{t('compatibility.toPersonFormat', { name: myDisplayName })}</Text>
                      <Text style={st.secretText}>{result.secretMessage.toA}</Text>
                    </View>
                    <View style={isTablet ? { width: 1, backgroundColor: theme.colors.glass.border, alignSelf: 'stretch' } : st.secretDiv} />
                    <View style={[st.secretCol, isTablet && { flex: 1 }]}>
                      <Text style={st.secretLabel}>{t('compatibility.toPersonFormat', { name: ptName })}</Text>
                      <Text style={st.secretText}>{result.secretMessage.toB}</Text>
                    </View>
                  </View>
                </GlassCard>
              )}

              {/* Timeline */}
              {result.timeline && (() => {
                const tl = result.timeline as any;
                const cy = new Date().getFullYear();
                const best = tl[`bestMonths${cy}`] ?? tl.bestMonths2026 ?? Object.values(tl).find((v: any) => Array.isArray(v) && v[0]?.month) ?? [];
                const worst = tl[`worstMonths${cy}`] ?? tl.worstMonths2026 ?? [];
                return (
                  <View onLayout={(e) => { sectionY.current['timeline'] = e.nativeEvent.layout.y; }}><GlassCard style={st.detailCard}>
                    <Text style={st.detailLabel}>{t('compatibility.monthlyCompatTitle', { year: new Date().getFullYear() })}</Text>
                    {best.length > 0 && <View style={st.tlSec}><Text style={st.tlSecTitle}>{t('compatibility.goodMonths')}</Text>
                      {best.map((m: any, i: number) => <View key={i} style={st.tlRow}><Text style={st.tlMonth}>{m.month ?? ''}</Text><View style={st.tlBar}><View style={[st.tlFill, st.tlGood, { width: `${Math.max(0, Math.min(100, m.score ?? 50))}%` }]} /></View><Text style={[st.tlScore, { color: theme.colors.success }]}>{m.score ?? '-'}</Text></View>)}
                    </View>}
                    {worst.length > 0 && <View style={st.tlSec}><Text style={st.tlSecTitle}>{t('compatibility.cautionMonths')}</Text>
                      {worst.map((m: any, i: number) => <View key={i} style={st.tlRow}><Text style={st.tlMonth}>{m.month ?? ''}</Text><View style={st.tlBar}><View style={[st.tlFill, st.tlWarn, { width: `${Math.max(0, Math.min(100, m.score ?? 50))}%` }]} /></View><Text style={[st.tlScore, { color: theme.colors.warning }]}>{m.score ?? '-'}</Text></View>)}
                    </View>}
                    {tl.marriageTiming && <View style={st.tlHi}><Text style={st.tlHiLabel}>{t('compatibility.bestMarriageTiming')}</Text><Text style={st.tlHiText}>{tl.marriageTiming}</Text></View>}
                  </GlassCard></View>
                );
              })()}

              {/* Yearly + Advice */}
              {result.yearlyAdvice && <GlassCard gold style={st.detailCard}><Text style={st.detailLabel}>{t('compatibility.yearlyAdviceTitle')}</Text><Text style={st.detailText}>{result.yearlyAdvice}</Text></GlassCard>}
              {result.advice && (
                <GlassCard style={st.detailCard}>
                  <Text style={st.detailLabel}>{t('compatibility.practicalAdvice')}</Text>
                  {Array.isArray(result.advice) ? result.advice.map((a, i) => <View key={i} style={st.advRow}><Text style={st.advNum}>{i + 1}</Text><Text style={st.detailText}>{a}</Text></View>) : <Text style={st.detailText}>{result.advice}</Text>}
                </GlassCard>
              )}
              {result.funFact && (
                <GlassCard style={st.funFactCard}>
                  <Text style={st.funFactText}>{result.funFact}</Text>
                </GlassCard>
              )}
              {result.finalWords && <GlassCard gold style={st.detailCard}><Text style={st.detailLabel}>{t('compatibility.masterWord')}</Text><Text style={[st.detailText, { fontWeight: '500', lineHeight: 24 }]}>{result.finalWords}</Text></GlassCard>}
            </>
          )}

          {/* Share */}
          {result.categories && (() => {
            const verdict = getVerdict(result.overallScore);
            return (
              <View style={{ marginTop: theme.spacing.md }}>
                <ShareCard data={{
                  type: 'compatibility',
                  score: result.overallScore,
                  name1: myDisplayName,
                  name2: ptName,
                  verdict: verdict.label,
                  verdictSub: verdict.sub,
                  summary: result.headline || (typeof result.summary === 'string' ? result.summary : ''),
                  best: (() => {
                    const entries = Object.entries(result.categories ?? {})
                      .map(([key, val]) => ({ key, score: (val as any)?.score ?? (typeof val === 'number' ? val : 50) }))
                      .sort((a, b) => b.score - a.score);
                    return entries.length > 0 ? { name: CAT_LABELS[entries[0].key] || entries[0].key, score: entries[0].score } : { name: '-', score: 0 };
                  })(),
                  worst: (() => {
                    const entries = Object.entries(result.categories ?? {})
                      .map(([key, val]) => ({ key, score: (val as any)?.score ?? (typeof val === 'number' ? val : 50) }))
                      .sort((a, b) => a.score - b.score);
                    return entries.length > 0 ? { name: CAT_LABELS[entries[0].key] || entries[0].key, score: entries[0].score } : { name: '-', score: 0 };
                  })(),
                }} />
              </View>
            );
          })()}
        </Animated.View>
      )}

      <Text style={st.disclaimer}>{t('common.disclaimer')}</Text>

      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)}
        onUnlocked={() => { setShowPaywall(false); handleAnalyze(); }} productType="compatibility" />
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.primary },
  content: { padding: theme.spacing.screenPadding, paddingTop: 48, paddingBottom: 120 },
  brandRow: {
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  brandLogo: {
    fontSize: 15,
    fontWeight: '200' as const,
    color: theme.colors.text.primary,
    letterSpacing: 4,
  },
  brandTag: {
    fontSize: 10,
    fontWeight: '400' as const,
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
    marginTop: 1,
  },
  hero: { alignItems: 'center', marginBottom: theme.spacing.xl },
  heroChar: { fontSize: 52, fontWeight: '200', color: theme.colors.gold.primary, marginBottom: 10 },
  heroDotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  heroDot: { width: 3.5, height: 3.5, borderRadius: 2, backgroundColor: '#1A1A1A' },
  heroDotSmall: { width: 2, height: 2, borderRadius: 1, backgroundColor: '#1A1A1A', opacity: 0.4 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: theme.colors.text.primary, letterSpacing: 2, marginBottom: theme.spacing.sm },
  heroSub: { fontSize: 14, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 22 },
  // Input form
  // My Info compact
  myCompact: {
    backgroundColor: '#1A1A1A',
    borderRadius: theme.radius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(232,176,74,0.15)',
    shadowColor: '#E8B04A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  myCompactGoldEdge: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(232,176,74,0.3)',
  },
  myCompactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  myCompactLeft: {
    flex: 1,
  },
  myCompactLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    marginBottom: 6,
  },
  myCompactInfo: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
    lineHeight: 20,
  },
  myCompactEdit: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.gold.primary,
    letterSpacing: 0.5,
  },
  myCompactEditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  myCompactDone: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    letterSpacing: 0.5,
  },
  // Partner card (기존 유지)
  personCard: { marginBottom: theme.spacing.sm },
  personLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.text.secondary, letterSpacing: 1, marginBottom: theme.spacing.sm },
  coupleConnector: { alignItems: 'center', marginVertical: 0 },
  connLine: { width: 0, height: 0 },
  nameInput: { backgroundColor: theme.colors.bg.primary, borderRadius: theme.radius.sm, paddingVertical: 14, paddingHorizontal: 14, color: theme.colors.text.primary, fontSize: 15, borderWidth: 1, borderColor: theme.colors.border.subtle, marginBottom: 12, letterSpacing: 0.5 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.gold.primary, marginBottom: 6, marginTop: theme.spacing.sm },
  calToggleRow: { flexDirection: 'row', backgroundColor: theme.colors.bg.primary, borderRadius: theme.radius.sm, padding: 3, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border.subtle },
  calToggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 6 },
  calToggleActive: { backgroundColor: '#1A1A1A' },
  calToggleText: { color: theme.colors.text.tertiary, fontSize: 14, fontWeight: '600', letterSpacing: 1 },
  calToggleTextActive: { color: theme.colors.gold.primary, fontWeight: '700' },
  hourScroll: { marginBottom: 6 },
  hourChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: theme.colors.bg.secondary, marginRight: 6 },
  hourChipActive: { backgroundColor: '#1C1C1E' },
  hourChipText: { fontSize: 12, color: theme.colors.text.tertiary, fontWeight: '500' },
  hourChipTextActive: { color: theme.colors.gold.light, fontWeight: '600' },
  hourHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.md, marginBottom: 6 },
  unknownRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: theme.colors.text.tertiary, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: theme.colors.gold.primary, borderColor: theme.colors.gold.primary },
  checkIcon: { fontSize: 11, color: '#FFFFFF', fontWeight: '700' },
  unknownText: { color: theme.colors.text.secondary, fontSize: 12 },
  hoursGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs, marginBottom: theme.spacing.sm },
  hourBtn: { width: '31%', paddingVertical: 10, backgroundColor: theme.colors.bg.primary, borderRadius: theme.radius.sm, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.glass.border },
  hourBtnActive: { borderColor: theme.colors.gold.primary, backgroundColor: '#1C1C1E' },
  hourLabel: { color: theme.colors.text.primary, fontSize: 13, fontWeight: '500' },
  hourLabelActive: { color: theme.colors.gold.light, fontWeight: '600' },
  hourSub: { color: theme.colors.text.tertiary, fontSize: 10, marginTop: 1 },
  hourSubActive: { color: theme.colors.gold.muted },
  genderRow: { flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 4 },
  genderBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 6, borderWidth: 1, borderColor: theme.colors.border.subtle },
  genderActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  genderText: { color: theme.colors.text.tertiary, fontSize: 14, fontWeight: '600', letterSpacing: 1 } as any,
  genderTextActive: { color: theme.colors.gold.primary, fontWeight: '700' },
  analyzeBtn: { marginTop: theme.spacing.xl },
  // Result header
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.md, paddingVertical: 4 },
  resetIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center' },
  resetIcon: { fontSize: 20, fontWeight: '300', color: theme.colors.text.primary, marginTop: -1 },
  resetText: { color: theme.colors.text.secondary, fontSize: 14, fontWeight: '500' },
  // Hook hero
  hookHero: { alignItems: 'center', marginBottom: theme.spacing.md },
  hookTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.gold.primary, textAlign: 'center', lineHeight: 30, letterSpacing: -0.5 },
  hookScore: { fontSize: 56, fontWeight: '800', color: theme.colors.gold.dark, marginTop: 4 },
  hookScoreUnit: { fontSize: 16, fontWeight: '500', color: theme.colors.text.tertiary },
  // Couple card
  coupleCard: { marginBottom: theme.spacing.sm },
  coupleRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  coupleCol: { flex: 1, alignItems: 'center', gap: 3 },
  coupleCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: theme.colors.bg.secondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: theme.colors.gold.primary + '40', marginBottom: 4 },
  coupleHanja: { fontSize: 22, fontWeight: '800', color: theme.colors.gold.primary },
  coupleName: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary },
  coupleZodiac: { fontSize: 11, color: theme.colors.text.tertiary },
  coupleVs: { alignItems: 'center', paddingHorizontal: 8 },
  relBadge: { backgroundColor: theme.colors.gold.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.gold.primary + '30' },
  relBadgeClash: { backgroundColor: 'rgba(196,80,61,0.08)', borderColor: 'rgba(196,80,61,0.20)' },
  relBadgeText: { fontSize: 12, fontWeight: '700', color: theme.colors.gold.primary },
  // Overview rows
  overviewCard: { marginBottom: theme.spacing.sm },
  ovRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 10 },
  ovRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.06)' },
  ovBadgeWrap: { alignItems: 'center', width: 34 },
  ovBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(181,149,48,0.10)', alignItems: 'center', justifyContent: 'center' },
  ovBadgeMeaning: { fontSize: 8, color: theme.colors.text.tertiary, marginTop: 2, fontWeight: '500' },
  ovBadgeWarn: { backgroundColor: 'rgba(196,80,61,0.10)' },
  ovBadgeGold: { backgroundColor: theme.colors.gold.primary },
  ovBadgeText: { fontSize: 13, fontWeight: '700', color: theme.colors.gold.primary },
  ovBadgeTextWarn: { color: theme.colors.error },
  ovBadgeTextGold: { color: '#FFFFFF' },
  ovValueGold: { fontWeight: '700', color: theme.colors.gold.dark },
  ovBody: { flex: 1 },
  ovValue: { fontSize: 14, fontWeight: '500', color: theme.colors.text.primary, lineHeight: 20 },
  ovArrow: { fontSize: 18, fontWeight: '300', color: theme.colors.text.tertiary, marginLeft: 2 },
  resultSummary: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20, textAlign: 'center', marginVertical: theme.spacing.sm },
  // Detail cards
  pillarDivider: { height: 1, backgroundColor: theme.colors.glass.border, marginVertical: 14 },
  detailCard: { marginTop: theme.spacing.md },
  detailLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: theme.spacing.sm },
  detailText: { flex: 1, fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },
  // Categories
  catRow: { marginBottom: theme.spacing.md },
  catHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  catLabel: { fontSize: 12, color: theme.colors.text.secondary },
  catScore: { fontSize: 13, fontWeight: '700' },
  catDetail: { fontSize: 12, color: theme.colors.text.tertiary, lineHeight: 18 },
  // Day Master
  dmType: { fontSize: 15, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: theme.spacing.sm },
  dmPairRow: { flexDirection: 'column', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  dmPairCol: { backgroundColor: theme.colors.bg.secondary, borderRadius: theme.radius.sm, padding: theme.spacing.sm },
  dmPairLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.gold.muted, marginBottom: 4 },
  dmPairText: { fontSize: 12, color: theme.colors.text.secondary, lineHeight: 18 },
  dmDiv: { height: 1, backgroundColor: theme.colors.glass.border },
  // Dynamics
  dynSec: { marginBottom: theme.spacing.md },
  dynTitle: { fontSize: 13, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 4 },
  dealBox: { backgroundColor: 'rgba(196,80,61,0.06)', borderRadius: theme.radius.sm, padding: theme.spacing.sm, borderWidth: 1, borderColor: 'rgba(196,80,61,0.15)' },
  dealTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.error, marginBottom: 4 },
  dealText: { fontSize: 13, color: theme.colors.error, lineHeight: 20 },
  // Points
  pointRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
  pointGood: { fontSize: 14, fontWeight: '700', color: theme.colors.success, width: 16 },
  pointWarn: { fontSize: 14, fontWeight: '700', color: theme.colors.warning, width: 16 },
  // Marriage
  gradeText: { fontSize: 36, fontWeight: '700', color: theme.colors.gold.primary, textAlign: 'center', marginBottom: theme.spacing.sm },
  // Timeline
  tlSec: { marginBottom: theme.spacing.md },
  tlSecTitle: { fontSize: 12, fontWeight: '600', color: theme.colors.text.primary, marginBottom: theme.spacing.xs },
  tlRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  tlMonth: { fontSize: 12, color: theme.colors.text.secondary, width: 36 },
  tlBar: { flex: 1, height: 6, backgroundColor: theme.colors.bg.tertiary, borderRadius: 3, overflow: 'hidden' },
  tlFill: { height: '100%', borderRadius: 3 },
  tlGood: { backgroundColor: theme.colors.success },
  tlWarn: { backgroundColor: theme.colors.warning },
  tlScore: { fontSize: 12, fontWeight: '600', width: 28, textAlign: 'right' },
  tlHi: { backgroundColor: 'rgba(45,122,95,0.08)', borderRadius: theme.radius.sm, padding: theme.spacing.sm },
  tlHiLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.success, marginBottom: 4 },
  tlHiText: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },
  // Advice
  advRow: { flexDirection: 'row', gap: 8, marginBottom: theme.spacing.sm },
  advNum: { fontSize: 12, fontWeight: '700', color: theme.colors.gold.primary, width: 16, textAlign: 'center', backgroundColor: theme.colors.bg.tertiary, borderRadius: 8, height: 18, lineHeight: 18 },
  // Archetype (used in paid section)
  archetypeCard: { marginTop: theme.spacing.md, alignItems: 'center' },
  archetypeEmoji: { fontSize: 36, marginBottom: 6 },
  archetypeTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: 6, textAlign: 'center' },
  archetypeDesc: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20, textAlign: 'center' },
  // Stages
  stageRow: { flexDirection: 'row', gap: 10, minHeight: 52 },
  stageLeft: { width: 24, alignItems: 'center' },
  stageIcon: { fontSize: 16 },
  stageLine: { width: 2, flex: 1, backgroundColor: theme.colors.glass.border, marginTop: 4 },
  stageBody: { flex: 1, paddingBottom: theme.spacing.md },
  stageLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: 2 },
  stageText: { fontSize: 12, color: theme.colors.text.secondary, lineHeight: 18 },
  // Survival guide
  ruleRow: { flexDirection: 'row', gap: 10, marginBottom: theme.spacing.md, alignItems: 'flex-start' },
  ruleBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: theme.colors.gold.primary, alignItems: 'center', justifyContent: 'center' },
  ruleNum: { fontSize: 12, fontWeight: '700', color: '#fff' },
  divider: { height: 1, backgroundColor: theme.colors.glass.border, marginVertical: theme.spacing.md },
  // Date recommend
  dateGrid: { gap: theme.spacing.sm },
  dateItem: { borderRadius: theme.radius.sm, padding: theme.spacing.sm },
  dateGood: { backgroundColor: 'rgba(45,122,95,0.08)' },
  dateHeal: { backgroundColor: 'rgba(44,95,138,0.08)' },
  dateBad: { backgroundColor: 'rgba(196,80,61,0.06)' },
  dateItemLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.text.tertiary, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateItemText: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },
  // Secret message
  secretRow: { flexDirection: 'column', gap: theme.spacing.sm },
  secretCol: { flex: 1, backgroundColor: theme.colors.bg.secondary, borderRadius: theme.radius.sm, padding: theme.spacing.sm },
  secretDiv: { height: 1, backgroundColor: theme.colors.glass.border },
  secretLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.gold.muted, marginBottom: 4 },
  secretText: { fontSize: 12, color: theme.colors.text.secondary, lineHeight: 18 },
  // Fun fact
  funFactCard: { marginTop: theme.spacing.md, alignItems: 'center' },
  funFactText: { fontSize: 14, color: theme.colors.gold.primary, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
  // Unlock CTA (black box matching home screen)
  unlockCta: {
    marginTop: theme.spacing.lg,
    backgroundColor: '#1C1C1E',
    borderRadius: theme.radius.lg,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: theme.colors.gold.primary + '60',
    overflow: 'hidden' as const,
  },
  unlockGlowTop: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: theme.colors.gold.primary + '50',
  },
  unlockCtaInner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  unlockLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  unlockIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.gold.primary + '18',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: theme.colors.gold.primary + '30',
  },
  unlockIcon: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: theme.colors.gold.primary,
  },
  unlockTextWrap: {
    flex: 1,
  },
  unlockCtaTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: theme.colors.gold.light,
    marginBottom: 3,
  },
  unlockCtaDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.3,
  },
  unlockRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  unlockPriceBox: {
    backgroundColor: theme.colors.gold.primary + '20',
    borderRadius: theme.radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.gold.primary + '30',
  },
  unlockPrice: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: theme.colors.gold.primary,
  },
  unlockArrow: {
    fontSize: 18,
    color: theme.colors.gold.primary + '80',
    fontWeight: '300' as const,
  },
  disclaimer: { fontSize: 10, color: theme.colors.text.tertiary, textAlign: 'center', lineHeight: 14, marginTop: theme.spacing.xl },
});
