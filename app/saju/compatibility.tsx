import React, { useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { DateInputRow } from '../../src/components/ui/DateInputRow';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { BackButton } from '../../src/components/ui/BackButton';
import { LoadingInk } from '../../src/components/ui/LoadingInk';
import { PaywallModal } from '../../src/components/ui/PaywallModal';
import { ShareCard } from '../../src/components/ui/ShareCard';
import { CompatibilityRadar } from '../../src/components/saju/CompatibilityRadar';
import { ElementMatch } from '../../src/components/saju/ElementMatch';
import { useAuthStore } from '../../src/stores/authStore';
import { useFortuneStore } from '../../src/stores/fortuneStore';
import { api, formatPillarInfo } from '../../src/services/api';
import { calculateFourPillars } from '../../src/utils/saju-calc';
import { calculateLocalCompatibility, getCoupleTitle } from '../../src/utils/compatibility-calc';
import type { CompatibilityResult, CompatCategories, CompatDayMaster, CompatCategoryScore } from '../../src/types/api';

const sc = (score: number) =>
  score >= 75 ? theme.colors.success : score >= 55 ? theme.colors.gold.primary : score >= 40 ? theme.colors.warning : theme.colors.error;

export default function CompatibilityScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { setCompatibilityResult } = useFortuneStore();

  const ELEMENT_KO: Record<string, string> = {
    wood: t('elements.wood'), fire: t('elements.fire'), earth: t('elements.earth'),
    metal: t('elements.metal'), water: t('elements.water'),
  };

  const [partnerName, setPartnerName] = useState('');
  const [partnerYear, setPartnerYear] = useState('');
  const [partnerMonth, setPartnerMonth] = useState('');
  const [partnerDay, setPartnerDay] = useState('');
  const [partnerGender, setPartnerGender] = useState<'male' | 'female'>('female');

  // 내 정보 수정
  const [editingMy, setEditingMy] = useState(false);
  const [myYear, setMyYear] = useState(user ? String(user.birthYear) : '');
  const [myMonth, setMyMonth] = useState(user ? String(user.birthMonth) : '');
  const [myDay, setMyDay] = useState(user ? String(user.birthDay) : '');
  const [myGender, setMyGender] = useState<'male' | 'female'>(user?.gender ?? 'male');

  const myEffectiveYear = editingMy ? parseInt(myYear, 10) : user?.birthYear;
  const myEffectiveMonth = editingMy ? parseInt(myMonth, 10) : user?.birthMonth;
  const myEffectiveDay = editingMy ? parseInt(myDay, 10) : user?.birthDay;
  const myEffectiveHour = user?.birthHour ?? 12;
  const myEffectiveGender = editingMy ? myGender : (user?.gender ?? 'male');

  const myPillarsData = React.useMemo(() => {
    const y = myEffectiveYear; const m = myEffectiveMonth; const d = myEffectiveDay;
    if (!y || !m || !d || isNaN(y) || isNaN(m) || isNaN(d)) return null;
    try { return calculateFourPillars(y, m, d, myEffectiveHour, undefined, undefined, undefined, editingMy ? false : user?.isLunar); } catch { return null; }
  }, [myEffectiveYear, myEffectiveMonth, myEffectiveDay, myEffectiveHour]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const partnerYearNum = parseInt(partnerYear, 10);
  const partnerMonthNum = parseInt(partnerMonth, 10);
  const partnerDayNum = parseInt(partnerDay, 10);
  const isPartnerValid =
    partnerYear.length === 4 &&
    !isNaN(partnerYearNum) &&
    partnerYearNum >= 1900 &&
    partnerYearNum <= new Date().getFullYear() &&
    partnerMonth.length >= 1 &&
    !isNaN(partnerMonthNum) &&
    partnerMonthNum >= 1 &&
    partnerMonthNum <= 12 &&
    partnerDay.length >= 1 &&
    !isNaN(partnerDayNum) &&
    partnerDayNum >= 1 &&
    partnerDayNum <= 31;

  const partnerPillarsData = React.useMemo(() => {
    if (!isPartnerValid) return null;
    try { return calculateFourPillars(partnerYearNum, partnerMonthNum, partnerDayNum, 12); } catch { return null; }
  }, [isPartnerValid, partnerYearNum, partnerMonthNum, partnerDayNum]);

  const myName = user?.name || t('common.me');
  const ptName = partnerName.trim() || t('common.partner');

  /** Validate/sanitize a CompatibilityResult so missing AI fields never crash the UI */
  const sanitizeResult = (r: CompatibilityResult): CompatibilityResult => ({
    ...r,
    overallScore: typeof r.overallScore === 'number' && !isNaN(r.overallScore) ? r.overallScore : 65,
    categories: r.categories ?? ({} as CompatCategories),
    dynamics: r.dynamics ?? ({} as NonNullable<CompatibilityResult['dynamics']>),
    strengthPoints: Array.isArray(r.strengthPoints) ? r.strengthPoints : [],
    conflictPoints: Array.isArray(r.conflictPoints) ? r.conflictPoints : [],
  });

  const handleAnalyze = async (isPaid = false) => {
    if (!isPartnerValid || !myEffectiveYear || !myEffectiveMonth || !myEffectiveDay) return;

    setLoading(true);
    try {
      if (!isPaid) {
        const localResult = calculateLocalCompatibility(
          myEffectiveYear, myEffectiveMonth, myEffectiveDay, myEffectiveHour, myEffectiveGender,
          partnerYearNum, partnerMonthNum, partnerDayNum, 12, partnerGender,
          editingMy ? false : user?.isLunar, false,
        );
        const safeLocal = sanitizeResult(localResult);
        setResult(safeLocal);
        setCompatibilityResult(safeLocal);
      } else {
        const myPillars = calculateFourPillars(myEffectiveYear, myEffectiveMonth, myEffectiveDay, myEffectiveHour, undefined, undefined, undefined, editingMy ? false : user?.isLunar);
        const partnerPillars = calculateFourPillars(partnerYearNum, partnerMonthNum, partnerDayNum, 12);
        const myPillarInfo = formatPillarInfo(myPillars, myEffectiveYear);
        const partnerPillarInfo = formatPillarInfo(partnerPillars, partnerYearNum);

        const apiResult = await api.analyzeCompatibility(
          {
            year: myEffectiveYear, month: myEffectiveMonth, day: myEffectiveDay,
            hour: myEffectiveHour, isLunar: user?.isLunar ?? false, gender: myEffectiveGender,
          },
          {
            year: partnerYearNum, month: partnerMonthNum, day: partnerDayNum,
            hour: 12, isLunar: false, gender: partnerGender,
          },
          user?.locale ?? 'ko', true, myPillarInfo, partnerPillarInfo,
          myName, ptName,
        );
        const safeApi = sanitizeResult(apiResult);
        setResult(safeApi);
        setCompatibilityResult(safeApi);
      }
    } catch (err) {
      console.error('[Compatibility] error:', err);
      const fallback = calculateLocalCompatibility(
        myEffectiveYear!, myEffectiveMonth!, myEffectiveDay!, myEffectiveHour, myEffectiveGender,
        partnerYearNum, partnerMonthNum, partnerDayNum, 12, partnerGender,
        editingMy ? false : user?.isLunar, false,
      );
      setResult(sanitizeResult(fallback));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingInk steps={t('loading.compatSteps', { returnObjects: true }) as string[]} tips={t('loading.sajuTips', { returnObjects: true }) as string[]} finalMessage={t('loading.compatFinal')} estimatedSeconds={30} />;

  /* ─── Section counter ─── */
  let secIdx = 0;
  const nextSec = () => ++secIdx;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
    <ScrollView
      style={sty.container}
      contentContainerStyle={sty.content}
      showsVerticalScrollIndicator={false}
    >
      <BackButton />

      <Text style={sty.title}>{t('compatibility.title')}</Text>

      {/* My Info */}
      <GlassCard style={sty.personCard}>
        <View style={sty.personHeader}>
          <Text style={sty.personLabel}>{t('compatibility.myInfo')}</Text>
          <TouchableOpacity onPress={() => setEditingMy(!editingMy)} activeOpacity={0.7}>
            <Text style={sty.editBtn}>{editingMy ? t('common.confirm') : t('home.profileEdit')}</Text>
          </TouchableOpacity>
        </View>
        {editingMy ? (
          <View>
            <DateInputRow
              year={myYear} month={myMonth} day={myDay}
              onChangeYear={setMyYear} onChangeMonth={setMyMonth} onChangeDay={setMyDay}
              variant="inline"
            />
            <View style={sty.genderRow}>
              <TouchableOpacity style={[sty.genderBtn, myGender === 'male' && sty.genderActive]} onPress={() => setMyGender('male')}>
                <Text style={[sty.genderText, myGender === 'male' && sty.genderTextActive]}>{t('birth.male')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[sty.genderBtn, myGender === 'female' && sty.genderActive]} onPress={() => setMyGender('female')}>
                <Text style={[sty.genderText, myGender === 'female' && sty.genderTextActive]}>{t('birth.female')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <Text style={sty.personInfo}>
              {myEffectiveYear}.{String(myEffectiveMonth).padStart(2, '0')}.{String(myEffectiveDay).padStart(2, '0')}
              {' · '}{myEffectiveGender === 'male' ? t('common.male_short') : t('common.female_short')}
            </Text>
            {myPillarsData && (
              <View style={sty.myDetailRow}>
                <View style={sty.myDetailItem}>
                  <Text style={sty.myDetailLabel}>일간</Text>
                  <Text style={sty.myDetailValue}>{myPillarsData.dayMaster}({ELEMENT_KO[myPillarsData.dayMasterElement]})</Text>
                </View>
                <View style={sty.myDetailDivider} />
                <View style={sty.myDetailItem}>
                  <Text style={sty.myDetailLabel}>주 오행</Text>
                  <Text style={sty.myDetailValue}>{ELEMENT_KO[Object.entries(myPillarsData.elementBalance).reduce((a, b) => a[1] > b[1] ? a : b)[0]]}</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </GlassCard>

      {/* Couple connector */}
      <View style={sty.coupleConnector}>
        <View style={sty.connLine} />
        <View style={sty.connHeart}>
          <Text style={sty.connHeartText}>&hearts;</Text>
        </View>
        <View style={sty.connLine} />
      </View>

      {/* Partner Info */}
      <GlassCard style={sty.personCard}>
        <Text style={sty.personLabel}>{t('compatibility.partner')}</Text>
        <TextInput
          style={sty.nameInput}
          value={partnerName}
          onChangeText={setPartnerName}
          placeholder={t('compatibility.namePlaceholder')}
          placeholderTextColor={theme.colors.text.tertiary}
          maxLength={10}
        />
        <DateInputRow
          year={partnerYear}
          month={partnerMonth}
          day={partnerDay}
          onChangeYear={setPartnerYear}
          onChangeMonth={setPartnerMonth}
          onChangeDay={setPartnerDay}
          variant="inline"
        />
        <View style={sty.genderRow}>
          <TouchableOpacity
            style={[sty.genderBtn, partnerGender === 'male' && sty.genderActive]}
            onPress={() => setPartnerGender('male')}
          >
            <Text style={[sty.genderText, partnerGender === 'male' && sty.genderTextActive]}>남성</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[sty.genderBtn, partnerGender === 'female' && sty.genderActive]}
            onPress={() => setPartnerGender('female')}
          >
            <Text style={[sty.genderText, partnerGender === 'female' && sty.genderTextActive]}>여성</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {!result ? (
        <Button
          title={t('compatibility.analyzeButton')}
          onPress={() => handleAnalyze(false)}
          disabled={!isPartnerValid}
          style={sty.analyzeBtn}
        />
      ) : (
        <Animated.View entering={FadeInDown.springify()}>
          {/* Headline — 직관적 커플 타이틀 */}
          {(myPillarsData && partnerPillarsData) ? (
            <Text style={sty.headline}>{getCoupleTitle(myPillarsData.dayMasterElement, partnerPillarsData.dayMasterElement)}</Text>
          ) : result.headline ? (
            <Text style={sty.headline}>{result.headline}</Text>
          ) : null}

          {/* ══════ SUMMARY DASHBOARD ══════ */}
          <GlassCard gold style={sty.summaryDash}>
            {/* Couple Archetype (if available) */}
            {result.coupleArchetype && (
              <View style={sty.archetypeRow}>
                <Text style={sty.archetypeEmoji}>{result.coupleArchetype.emoji}</Text>
                <View style={sty.archetypeMeta}>
                  <Text style={sty.archetypeTitle}>{result.coupleArchetype.title}</Text>
                  <Text style={sty.archetypeDesc} numberOfLines={2}>{result.coupleArchetype.description}</Text>
                </View>
              </View>
            )}

            {/* Score */}
            <View style={sty.scoreRow}>
              <Text style={sty.scoreNum}>{result.overallScore}</Text>
              <Text style={sty.scoreUnit}>점</Text>
            </View>
            <Text style={sty.scoreSummary}>{result.summary}</Text>

            {/* Quick category previews — top 3 & bottom 1 */}
            {result.categories && (() => {
              const entries = Object.entries(result.categories)
                .map(([key, val]) => {
                  const cat = val as CompatCategoryScore;
                  return { key, score: cat?.score ?? (typeof val === 'number' ? val : 50) };
                })
                .sort((a, b) => b.score - a.score);
              const catLabels: Record<string, string> = {
                love: '애정', communication: '소통', values: '가치관',
                sexual: '성적', finance: '금전', family: '가족',
                growth: '성장', crisis: '위기',
              };
              const best3 = entries.slice(0, 3);
              const worst = entries[entries.length - 1];
              return (
                <View style={sty.quickCats}>
                  <View style={sty.quickCatGroup}>
                    <Text style={sty.quickCatGroupLabel}>강점</Text>
                    {best3.map(e => (
                      <View key={e.key} style={sty.quickCatItem}>
                        <Text style={sty.quickCatName}>{catLabels[e.key] || e.key}</Text>
                        <Text style={[sty.quickCatScore, { color: sc(e.score) }]}>{e.score}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={sty.quickCatDivider} />
                  <View style={sty.quickCatGroup}>
                    <Text style={sty.quickCatGroupLabel}>주의</Text>
                    <View style={sty.quickCatItem}>
                      <Text style={sty.quickCatName}>{catLabels[worst.key] || worst.key}</Text>
                      <Text style={[sty.quickCatScore, { color: sc(worst.score) }]}>{worst.score}</Text>
                    </View>
                  </View>
                </View>
              );
            })()}
          </GlassCard>

          {/* Both people info */}
          <GlassCard style={sty.detailCard}>
            <View style={sty.pairRow}>
              <View style={sty.pairCol}>
                <View style={sty.pairCircle}>
                  <Text style={sty.pairEmoji}>{user?.gender === 'male' ? '\u2642' : '\u2640'}</Text>
                </View>
                <Text style={sty.pairName}>{myName}</Text>
                <Text style={sty.pairInfo}>
                  {user ? `${user.birthYear}.${String(user.birthMonth).padStart(2, '0')}.${String(user.birthDay).padStart(2, '0')}` : ''}
                </Text>
                {myPillarsData && (
                  <Text style={sty.pairElement}>{myPillarsData.dayMaster} ({ELEMENT_KO[myPillarsData.dayMasterElement]})</Text>
                )}
              </View>
              <View style={sty.pairCenter}>
                <View style={sty.pairHeartBg}>
                  <Text style={sty.pairHeartText}>&hearts;</Text>
                </View>
              </View>
              <View style={sty.pairCol}>
                <View style={sty.pairCircle}>
                  <Text style={sty.pairEmoji}>{partnerGender === 'male' ? '\u2642' : '\u2640'}</Text>
                </View>
                <Text style={sty.pairName}>{ptName}</Text>
                <Text style={sty.pairInfo}>
                  {partnerYear}.{partnerMonth.padStart(2, '0')}.{partnerDay.padStart(2, '0')}
                </Text>
                {(() => {
                  try {
                    const pp = calculateFourPillars(partnerYearNum, partnerMonthNum, partnerDayNum, 12);
                    return <Text style={sty.pairElement}>{pp.dayMaster} ({ELEMENT_KO[pp.dayMasterElement]})</Text>;
                  } catch { return null; }
                })()}
              </View>
            </View>
          </GlassCard>

          {/* ══════ PAID DETAIL SECTIONS ══════ */}
          {result.categories ? (
            <>
              {/* Radar Chart */}
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <GlassCard style={sty.detailCard}>
                  <SecHead num={nextSec()} title="궁합 레이더" />
                  <CompatibilityRadar categories={result.categories as CompatCategories} />
                </GlassCard>
              </Animated.View>

              {/* Category Details */}
              <Animated.View entering={FadeInDown.delay(150).springify()}>
                <GlassCard style={sty.detailCard}>
                  <SecHead num={nextSec()} title="항목별 상세" />
                  {(() => {
                    const labels: Record<string, string> = {
                      love: t('compatibility.categories.love'), communication: t('compatibility.categories.communication'), values: t('compatibility.categories.values'),
                      sexual: t('compatibility.categories.sexual'), finance: t('compatibility.categories.finance'), family: t('compatibility.categories.family'),
                      growth: t('compatibility.categories.growth'), crisis: t('compatibility.categories.crisis'),
                    };
                    return Object.entries(result.categories!).map(([key, val]) => {
                      const cat = val as CompatCategoryScore;
                      const s = cat?.score ?? (typeof val === 'number' ? val : 50);
                      const detail = cat?.detail ?? '';
                      const color = sc(s);
                      return (
                        <View key={key} style={sty.catDetailRow}>
                          <View style={sty.catDetailHead}>
                            <Text style={sty.categoryLabel}>{labels[key] || key}</Text>
                            <View style={sty.catBarWrap}>
                              <View style={sty.catBarTrack}>
                                <View style={[sty.catBarFill, { width: `${s}%`, backgroundColor: color }]} />
                              </View>
                              <Text style={[sty.categoryScore, { color }]}>{s}</Text>
                            </View>
                          </View>
                          {detail ? <Text style={sty.catDetailText}>{detail}</Text> : null}
                        </View>
                      );
                    });
                  })()}
                </GlassCard>
              </Animated.View>

              {/* Element Interaction */}
              {result.elementInteraction && (
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                  <GlassCard style={sty.detailCard}>
                    <SecHead num={nextSec()} title="오행 궁합" />
                    <ElementMatch
                      aName={myName}
                      bName={ptName}
                      aDominant={result.elementInteraction.aElements.dominant}
                      aPercent={result.elementInteraction.aElements.percent}
                      bDominant={result.elementInteraction.bElements.dominant}
                      bPercent={result.elementInteraction.bElements.percent}
                      interaction={result.elementInteraction.interaction}
                      complementary={result.elementInteraction.complementary}
                    />
                  </GlassCard>
                </Animated.View>
              )}

              {/* Day Master Relation */}
              {result.dayMasterRelation && (
                <Animated.View entering={FadeInDown.delay(250).springify()}>
                  <GlassCard style={sty.detailCard}>
                    <SecHead num={nextSec()} title="일간 관계" />
                    {typeof result.dayMasterRelation === 'string' ? (
                      <Text style={sty.detailText}>{result.dayMasterRelation}</Text>
                    ) : (
                      <>
                        <Text style={sty.dmType}>{(result.dayMasterRelation as CompatDayMaster).type}</Text>
                        <Text style={sty.detailText}>{(result.dayMasterRelation as CompatDayMaster).analysis}</Text>
                        <View style={sty.dmPairRow}>
                          <View style={sty.dmPairCol}>
                            <Text style={sty.dmPairLabel} numberOfLines={1}>{myName} → {ptName}</Text>
                            <Text style={sty.dmPairText}>{(result.dayMasterRelation as CompatDayMaster).aToB}</Text>
                          </View>
                          <View style={sty.dmDivider} />
                          <View style={sty.dmPairCol}>
                            <Text style={sty.dmPairLabel} numberOfLines={1}>{ptName} → {myName}</Text>
                            <Text style={sty.dmPairText}>{(result.dayMasterRelation as CompatDayMaster).bToA}</Text>
                          </View>
                        </View>
                      </>
                    )}
                  </GlassCard>
                </Animated.View>
              )}

              {/* Dynamics */}
              {result.dynamics && (
                <Animated.View entering={FadeInDown.delay(300).springify()}>
                  <GlassCard style={sty.detailCard}>
                    <SecHead num={nextSec()} title="관계 역학" />
                    {result.dynamics.powerBalance ? (
                      <View style={sty.dynSection}>
                        <Text style={sty.dynTitle}>주도권</Text>
                        <Text style={sty.detailText}>{result.dynamics.powerBalance}</Text>
                      </View>
                    ) : null}
                    {result.dynamics.fightPattern ? (
                      <View style={sty.dynSection}>
                        <Text style={sty.dynTitle}>싸움 패턴</Text>
                        <Text style={sty.detailText}>{result.dynamics.fightPattern}</Text>
                      </View>
                    ) : null}
                    {result.dynamics.loveLanguage ? (
                      <View style={sty.dynSection}>
                        <Text style={sty.dynTitle}>사랑 표현</Text>
                        <Text style={sty.detailText}>{result.dynamics.loveLanguage}</Text>
                      </View>
                    ) : null}
                    {result.dynamics.attachmentStyle ? (
                      <View style={sty.dynSection}>
                        <Text style={sty.dynTitle}>애착 유형</Text>
                        <Text style={sty.detailText}>{result.dynamics.attachmentStyle}</Text>
                      </View>
                    ) : null}
                    {result.dynamics.jealousy ? (
                      <View style={sty.dynSection}>
                        <Text style={sty.dynTitle}>질투 패턴</Text>
                        <Text style={sty.detailText}>{result.dynamics.jealousy}</Text>
                      </View>
                    ) : null}
                    {result.dynamics.dealBreaker ? (
                      <View style={[sty.dynSection, sty.dealBreakerBox]}>
                        <Text style={sty.dealBreakerTitle}>관계를 깨뜨릴 수 있는 것</Text>
                        <Text style={sty.dealBreakerText}>{result.dynamics.dealBreaker}</Text>
                      </View>
                    ) : null}
                  </GlassCard>
                </Animated.View>
              )}

              {/* Relationship Stages */}
              {result.relationshipStages && (
                <Animated.View entering={FadeInDown.delay(350).springify()}>
                  <GlassCard style={sty.detailCard}>
                    <SecHead num={nextSec()} title="관계 단계별 예측" />
                    <View style={sty.stageTimeline}>
                      {[
                        { key: 'first3months', label: '첫 3개월', icon: '🌱' },
                        { key: 'sixMonths', label: '6개월', icon: '🌿' },
                        { key: 'oneYear', label: '1년', icon: '🌳' },
                        { key: 'threeYears', label: '3년', icon: '🏡' },
                        { key: 'longTerm', label: '장기', icon: '💎' },
                      ].map((stage, i) => {
                        const text = (result.relationshipStages as any)?.[stage.key];
                        if (!text) return null;
                        return (
                          <View key={stage.key} style={sty.stageRow}>
                            <View style={sty.stageLeft}>
                              <Text style={sty.stageIcon}>{stage.icon}</Text>
                              {i < 4 && <View style={sty.stageLine} />}
                            </View>
                            <View style={sty.stageContent}>
                              <Text style={sty.stageLabel}>{stage.label}</Text>
                              <Text style={sty.stageText}>{text}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </GlassCard>
                </Animated.View>
              )}

              {/* Strength & Conflict */}
              {result.strengthPoints && result.strengthPoints.length > 0 && (
                <Animated.View entering={FadeInDown.delay(400).springify()}>
                  <GlassCard style={sty.detailCard}>
                    <SecHead num={nextSec()} title="시너지 포인트" />
                    {result.strengthPoints.map((p, i) => (
                      <View key={i} style={sty.pointRow}>
                        <View style={[sty.pointBullet, { backgroundColor: theme.colors.success }]}>
                          <Text style={sty.pointBulletText}>+</Text>
                        </View>
                        <Text style={sty.detailText}>{p}</Text>
                      </View>
                    ))}
                  </GlassCard>
                </Animated.View>
              )}

              {result.conflictPoints && result.conflictPoints.length > 0 && (
                <Animated.View entering={FadeInDown.delay(420).springify()}>
                  <GlassCard style={sty.detailCard}>
                    <SecHead num={nextSec()} title="충돌 포인트" />
                    {result.conflictPoints.map((p, i) => (
                      <View key={i} style={sty.pointRow}>
                        <View style={[sty.pointBullet, { backgroundColor: theme.colors.warning }]}>
                          <Text style={sty.pointBulletText}>!</Text>
                        </View>
                        <Text style={sty.detailText}>{p}</Text>
                      </View>
                    ))}
                  </GlassCard>
                </Animated.View>
              )}

              {/* Survival Guide */}
              {result.survivalGuide && (
                <Animated.View entering={FadeInDown.delay(450).springify()}>
                  <GlassCard style={sty.detailCard}>
                    <SecHead num={nextSec()} title="이 커플 생존 가이드" />
                    {[
                      { key: 'rule1', label: '규칙 1', icon: '1' },
                      { key: 'rule2', label: '규칙 2', icon: '2' },
                      { key: 'rule3', label: '규칙 3', icon: '3' },
                    ].map(r => {
                      const text = (result.survivalGuide as any)?.[r.key];
                      if (!text) return null;
                      return (
                        <View key={r.key} style={sty.ruleRow}>
                          <View style={sty.ruleBadge}><Text style={sty.ruleBadgeText}>{r.icon}</Text></View>
                          <Text style={sty.ruleText}>{text}</Text>
                        </View>
                      );
                    })}
                    {result.survivalGuide.neverDo && (
                      <View style={sty.neverDoBox}>
                        <Text style={sty.neverDoLabel}>절대 하지 말 것</Text>
                        <Text style={sty.neverDoText}>{result.survivalGuide.neverDo}</Text>
                      </View>
                    )}
                  </GlassCard>
                </Animated.View>
              )}

              {/* Date Recommendations */}
              {result.dateRecommend && (
                <Animated.View entering={FadeInDown.delay(480).springify()}>
                  <GlassCard style={sty.detailCard}>
                    <SecHead num={nextSec()} title="데이트 추천" />
                    {result.dateRecommend.bestDate && (
                      <View style={sty.dateItem}>
                        <View style={[sty.dateIcon, { backgroundColor: 'rgba(45,122,95,0.10)' }]}>
                          <Text style={sty.dateIconText}>💚</Text>
                        </View>
                        <View style={sty.dateContent}>
                          <Text style={[sty.dateLabel, { color: theme.colors.success }]}>베스트 데이트</Text>
                          <Text style={sty.dateText}>{result.dateRecommend.bestDate}</Text>
                        </View>
                      </View>
                    )}
                    {result.dateRecommend.healingDate && (
                      <View style={sty.dateItem}>
                        <View style={[sty.dateIcon, { backgroundColor: 'rgba(44,95,138,0.10)' }]}>
                          <Text style={sty.dateIconText}>💙</Text>
                        </View>
                        <View style={sty.dateContent}>
                          <Text style={[sty.dateLabel, { color: theme.colors.info }]}>힐링 데이트</Text>
                          <Text style={sty.dateText}>{result.dateRecommend.healingDate}</Text>
                        </View>
                      </View>
                    )}
                    {result.dateRecommend.worstDate && (
                      <View style={sty.dateItem}>
                        <View style={[sty.dateIcon, { backgroundColor: 'rgba(196,148,61,0.10)' }]}>
                          <Text style={sty.dateIconText}>⚠️</Text>
                        </View>
                        <View style={sty.dateContent}>
                          <Text style={[sty.dateLabel, { color: theme.colors.warning }]}>피해야 할 데이트</Text>
                          <Text style={sty.dateText}>{result.dateRecommend.worstDate}</Text>
                        </View>
                      </View>
                    )}
                  </GlassCard>
                </Animated.View>
              )}

              {/* Marriage Grade */}
              {result.marriageGrade && (
                <Animated.View entering={FadeInDown.delay(500).springify()}>
                  <GlassCard gold style={sty.detailCard}>
                    <SecHead num={nextSec()} title="결혼 적합도" />
                    <View style={sty.gradeWrap}>
                      <Text style={sty.gradeText}>{result.marriageGrade.grade}</Text>
                    </View>
                    <Text style={sty.detailText}>{result.marriageGrade.summary}</Text>
                    {result.marriageGrade.ifMarried ? (
                      <View style={sty.marriedBox}>
                        <Text style={sty.marriedLabel}>결혼 후 모습</Text>
                        <Text style={sty.detailText}>{result.marriageGrade.ifMarried}</Text>
                      </View>
                    ) : null}
                    {result.marriageGrade.childrenNote ? (
                      <View style={sty.marriedBox}>
                        <Text style={sty.marriedLabel}>자녀 궁합</Text>
                        <Text style={sty.detailText}>{result.marriageGrade.childrenNote}</Text>
                      </View>
                    ) : null}
                    {result.marriageGrade.inlaws ? (
                      <View style={sty.marriedBox}>
                        <Text style={sty.marriedLabel}>시댁/처가 궁합</Text>
                        <Text style={sty.detailText}>{result.marriageGrade.inlaws}</Text>
                      </View>
                    ) : null}
                  </GlassCard>
                </Animated.View>
              )}

              {/* Timeline — best/worst months */}
              {result.timeline && (() => {
                const tl = result.timeline as any;
                const bestMonths = tl.bestMonths2026 ?? Object.entries(tl).find(([k]: [string, unknown]) => k.startsWith('bestMonths'))?.[1] ?? [];
                const worstMonths = tl.worstMonths2026 ?? Object.entries(tl).find(([k]: [string, unknown]) => k.startsWith('worstMonths'))?.[1] ?? [];
                const year = new Date().getFullYear();
                return (
                <Animated.View entering={FadeInDown.delay(530).springify()}>
                <GlassCard style={sty.detailCard}>
                  <SecHead num={nextSec()} title={`${year}년 월별 궁합`} />
                  {bestMonths.length > 0 && (
                    <View style={sty.tlSection}>
                      <Text style={sty.tlSectionTitle}>좋은 달</Text>
                      {bestMonths.map((m: any, i: number) => (
                        <View key={i} style={sty.tlRow}>
                          <Text style={sty.tlMonth}>{m.month}</Text>
                          <View style={sty.tlBar}>
                            <View style={[sty.tlBarFill, sty.tlBarGood, { width: `${m.score}%` }]} />
                          </View>
                          <Text style={[sty.tlScore, { color: theme.colors.success }]}>{m.score}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {worstMonths.length > 0 && (
                    <View style={sty.tlSection}>
                      <Text style={sty.tlSectionTitle}>주의할 달</Text>
                      {worstMonths.map((m: any, i: number) => (
                        <View key={i} style={sty.tlRow}>
                          <Text style={sty.tlMonth}>{m.month}</Text>
                          <View style={sty.tlBar}>
                            <View style={[sty.tlBarFill, sty.tlBarWarn, { width: `${m.score}%` }]} />
                          </View>
                          <Text style={[sty.tlScore, { color: theme.colors.warning }]}>{m.score}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {result.timeline!.marriageTiming ? (
                    <View style={sty.tlHighlight}>
                      <Text style={sty.tlHighlightLabel}>결혼 최적 시기</Text>
                      <Text style={sty.tlHighlightText}>{result.timeline!.marriageTiming}</Text>
                    </View>
                  ) : null}
                  {result.timeline!.dangerPeriod ? (
                    <View style={[sty.tlHighlight, sty.tlDanger]}>
                      <Text style={sty.tlDangerLabel}>위기 주의 시기</Text>
                      <Text style={sty.tlDangerText}>{result.timeline!.dangerPeriod}</Text>
                    </View>
                  ) : null}
                </GlassCard>
                </Animated.View>
                );
              })()}

              {/* Secret Messages */}
              {result.secretMessage && (
                <Animated.View entering={FadeInDown.delay(560).springify()}>
                  <GlassCard style={sty.detailCard}>
                    <SecHead num={nextSec()} title="비밀 메시지" />
                    <View style={sty.secretRow}>
                      <View style={sty.secretCard}>
                        <Text style={sty.secretTo}>{user?.name || '나'}에게</Text>
                        <Text style={sty.secretText}>{result.secretMessage.toA}</Text>
                      </View>
                      <View style={[sty.secretCard, sty.secretCardB]}>
                        <Text style={sty.secretTo}>{t('common.partner')}에게</Text>
                        <Text style={sty.secretText}>{result.secretMessage.toB}</Text>
                      </View>
                    </View>
                  </GlassCard>
                </Animated.View>
              )}

              {/* Yearly Advice */}
              {result.yearlyAdvice && (
                <Animated.View entering={FadeInDown.delay(580).springify()}>
                  <GlassCard gold style={sty.detailCard}>
                    <SecHead num={nextSec()} title="올해 조언" />
                    <Text style={sty.detailText}>{result.yearlyAdvice}</Text>
                  </GlassCard>
                </Animated.View>
              )}

              {/* Practical Advice */}
              {result.advice && (
                <Animated.View entering={FadeInDown.delay(600).springify()}>
                  <GlassCard style={sty.detailCard}>
                    <SecHead num={nextSec()} title="실용적 조언" />
                    {Array.isArray(result.advice) ? (
                      result.advice.map((a, i) => (
                        <View key={i} style={sty.adviceRow}>
                          <View style={sty.adviceNum}><Text style={sty.adviceNumText}>{i + 1}</Text></View>
                          <Text style={sty.detailText}>{a}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={sty.detailText}>{result.advice}</Text>
                    )}
                  </GlassCard>
                </Animated.View>
              )}

              {/* Fun Fact */}
              {result.funFact && (
                <Animated.View entering={FadeInDown.delay(620).springify()}>
                  <View style={sty.funFactBox}>
                    <Text style={sty.funFactLabel}>재미있는 사실</Text>
                    <Text style={sty.funFactText}>{result.funFact}</Text>
                  </View>
                </Animated.View>
              )}

              {/* Final Words */}
              {result.finalWords && (
                <Animated.View entering={FadeInDown.delay(650).springify()}>
                  <GlassCard gold style={sty.detailCard}>
                    <View style={sty.finalHeader}>
                      <View style={sty.finalQuote}><Text style={sty.finalQuoteText}>"</Text></View>
                      <Text style={sty.finalLabel}>MIRi의 한 마디</Text>
                    </View>
                    <Text style={[sty.detailText, { fontWeight: '500', lineHeight: 24, fontSize: 15 }]}>{result.finalWords}</Text>
                  </GlassCard>
                </Animated.View>
              )}
            </>
          ) : (
            <>
              {/* Teaser for paid */}
              {result.teaserForPaid && (
                <View style={sty.teaserCard}>
                  <Text style={sty.teaserText}>{result.teaserForPaid}</Text>
                </View>
              )}

              {/* Blur for paid */}
              <TouchableOpacity onPress={() => setShowPaywall(true)}>
                <GlassCard style={sty.paidCard}>
                  <View style={sty.blurOverlay}>
                    <Text style={sty.lockText}>{t('compatibility.unlockDetail')}</Text>
                  </View>
                  <View style={{ opacity: 0.2, padding: theme.spacing.md }}>
                    <Text style={sty.paidText}>일간 관계 분석 / 오행 궁합 / 충돌 포인트 / 올해 조언...</Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      )}

      {result && (
        <View style={sty.shareWrap}>
          <ShareCard
            type="compatibility"
            score={result.overallScore}
            summary={result.headline || (typeof result.summary === 'string' ? result.summary : '')}
          />
        </View>
      )}

      <Text style={sty.disclaimer}>{t('common.disclaimer')}</Text>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUnlocked={() => {
          setShowPaywall(false);
          handleAnalyze(true);
        }}
        productType="compatibility"
      />
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ─── Section header with numbered badge ─── */
function SecHead({ num, title }: { num: number; title: string }) {
  return (
    <View style={sty.secHeadRow}>
      <View style={sty.secHeadBadge}><Text style={sty.secHeadNum}>{num}</Text></View>
      <Text style={sty.detailLabel}>{title}</Text>
    </View>
  );
}

const sty = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.primary },
  content: { padding: theme.spacing.screenPadding, paddingTop: 60, paddingBottom: 120 },
  title: {
    ...theme.typo.screenTitle,
    textAlign: 'center', marginBottom: theme.spacing.sectionGap,
  },
  personCard: { marginBottom: theme.spacing.sm },
  personHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm },
  personLabel: { fontSize: 14, color: theme.colors.text.secondary },
  nameInput: { backgroundColor: theme.colors.bg.primary, borderRadius: theme.radius.sm, paddingVertical: 12, paddingHorizontal: 12, color: theme.colors.text.primary, fontSize: 15, borderWidth: 1, borderColor: theme.colors.glass.border, marginBottom: theme.spacing.sm, marginTop: theme.spacing.sm },
  editBtn: { fontSize: 13, fontWeight: '600', color: theme.colors.gold.primary },
  personName: { fontSize: 18, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 4 },
  personInfo: { fontSize: 14, color: theme.colors.text.secondary, lineHeight: 20 },
  myDetailRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 12,
    backgroundColor: theme.colors.bg.secondary, borderRadius: theme.radius.sm, padding: 10,
  },
  myDetailItem: { flex: 1, alignItems: 'center' },
  myDetailLabel: { fontSize: 11, color: theme.colors.text.tertiary, marginBottom: 2 },
  myDetailValue: { fontSize: 13, fontWeight: '600', color: theme.colors.gold.primary },
  myDetailDivider: { width: 1, height: 24, backgroundColor: theme.colors.glass.border },
  coupleConnector: { flexDirection: 'row', alignItems: 'center', marginVertical: theme.spacing.lg },
  connLine: { flex: 1, height: 1, backgroundColor: theme.colors.gold.primary + '30' },
  connHeart: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8546B' + '15', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E8546B' + '30' },
  connHeartText: { fontSize: 16, color: '#E8546B' },
  genderRow: { flexDirection: 'row', gap: theme.spacing.sm },
  genderBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    backgroundColor: theme.colors.bg.primary, borderRadius: theme.radius.sm,
    borderWidth: 1, borderColor: 'transparent',
  },
  genderActive: { borderColor: theme.colors.gold.primary, backgroundColor: theme.colors.bg.tertiary },
  genderText: { color: theme.colors.text.secondary, fontSize: 14 },
  genderTextActive: { color: theme.colors.gold.primary, fontWeight: '600' },
  analyzeBtn: { marginTop: theme.spacing.xl },

  // Headline
  headline: {
    fontSize: 20, fontWeight: '700', color: theme.colors.gold.primary,
    textAlign: 'center', marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm, lineHeight: 28,
  },

  // ── Summary Dashboard ──
  summaryDash: { marginTop: theme.spacing.md, alignItems: 'center' },
  archetypeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', marginBottom: theme.spacing.md, paddingBottom: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.glass.border },
  archetypeEmoji: { fontSize: 36 },
  archetypeMeta: { flex: 1 },
  archetypeTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: 2 },
  archetypeDesc: { fontSize: 12, color: theme.colors.text.secondary, lineHeight: 18 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  scoreNum: { fontSize: 52, fontWeight: '700', color: theme.colors.gold.primary },
  scoreUnit: { fontSize: 16, fontWeight: '500', color: theme.colors.text.tertiary, marginBottom: 10 },
  scoreSummary: { fontSize: 14, color: theme.colors.text.secondary, lineHeight: 22, textAlign: 'center', marginTop: theme.spacing.sm },
  quickCats: { flexDirection: 'row', alignItems: 'flex-start', width: '100%', marginTop: theme.spacing.md, paddingTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.glass.border },
  quickCatGroup: { flex: 1, gap: 6 },
  quickCatGroupLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  quickCatItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quickCatName: { fontSize: 13, color: theme.colors.text.secondary },
  quickCatScore: { fontSize: 14, fontWeight: '700' },
  quickCatDivider: { width: 1, height: 60, backgroundColor: theme.colors.glass.border, marginHorizontal: theme.spacing.md },

  // Section header
  secHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.sm },
  secHeadBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.gold.primary, alignItems: 'center', justifyContent: 'center' },
  secHeadNum: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // Detail cards
  detailCard: { marginTop: theme.spacing.md },
  detailLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.gold.primary },
  detailText: { flex: 1, fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },

  // Category bars with actual progress bar
  catDetailRow: { marginBottom: theme.spacing.md },
  catDetailHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  catBarWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginLeft: 12 },
  catBarTrack: { flex: 1, height: 6, backgroundColor: theme.colors.bg.tertiary, borderRadius: 3, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 3 },
  catDetailText: { fontSize: 12, color: theme.colors.text.tertiary, lineHeight: 18 },
  categoryLabel: { fontSize: 13, color: theme.colors.text.secondary, width: 50 },
  categoryScore: { fontSize: 14, fontWeight: '700', width: 30, textAlign: 'right' },

  // Pair info
  pairRow: { flexDirection: 'row', alignItems: 'center' },
  pairCol: { flex: 1, alignItems: 'center', gap: 3 },
  pairCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.bg.secondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: theme.colors.gold.primary + '40', marginBottom: 4 },
  pairEmoji: { fontSize: 20, color: theme.colors.gold.primary },
  pairCenter: { width: 40, alignItems: 'center', justifyContent: 'center' },
  pairHeartBg: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8546B' + '18', alignItems: 'center', justifyContent: 'center' },
  pairHeartText: { fontSize: 16, color: '#E8546B' },
  pairName: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
  pairInfo: { fontSize: 11, color: theme.colors.text.secondary },
  pairElement: { fontSize: 12, fontWeight: '600', color: theme.colors.gold.primary, marginTop: 2 },

  // Day Master
  dmType: { fontSize: 15, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: theme.spacing.sm },
  dmPairRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  dmPairCol: { flex: 1, backgroundColor: theme.colors.bg.secondary, borderRadius: theme.radius.sm, padding: theme.spacing.sm },
  dmPairLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.gold.muted, marginBottom: 4 },
  dmPairText: { fontSize: 12, color: theme.colors.text.secondary, lineHeight: 18 },
  dmDivider: { width: 1, backgroundColor: theme.colors.glass.border },

  // Dynamics
  dynSection: { marginBottom: theme.spacing.md },
  dynTitle: { fontSize: 13, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 4 },
  dealBreakerBox: { backgroundColor: 'rgba(196,80,61,0.06)', borderRadius: theme.radius.sm, padding: theme.spacing.sm, borderWidth: 1, borderColor: 'rgba(196,80,61,0.15)' },
  dealBreakerTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.error, marginBottom: 4 },
  dealBreakerText: { fontSize: 13, color: theme.colors.error, lineHeight: 20 },
  divider: { height: 1, backgroundColor: theme.colors.glass.border, marginVertical: theme.spacing.md },

  // Relationship Stages (timeline)
  stageTimeline: { gap: 0 },
  stageRow: { flexDirection: 'row', gap: 12 },
  stageLeft: { alignItems: 'center', width: 32 },
  stageIcon: { fontSize: 18, marginBottom: 4 },
  stageLine: { width: 2, flex: 1, backgroundColor: theme.colors.glass.border, minHeight: 20 },
  stageContent: { flex: 1, paddingBottom: theme.spacing.md },
  stageLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: 2 },
  stageText: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },

  // Strength/Conflict (improved bullets)
  pointRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.sm, alignItems: 'flex-start' },
  pointBullet: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  pointBulletText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Survival Guide
  ruleRow: { flexDirection: 'row', gap: 10, marginBottom: theme.spacing.md, alignItems: 'flex-start' },
  ruleBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.gold.primary, alignItems: 'center', justifyContent: 'center' },
  ruleBadgeText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  ruleText: { flex: 1, fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },
  neverDoBox: { backgroundColor: 'rgba(196,80,61,0.06)', borderRadius: theme.radius.sm, padding: theme.spacing.md },
  neverDoLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.error, marginBottom: 4 },
  neverDoText: { fontSize: 13, color: theme.colors.error, lineHeight: 20 },

  // Date Recommendations
  dateItem: { flexDirection: 'row', gap: 12, marginBottom: theme.spacing.md, alignItems: 'flex-start' },
  dateIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dateIconText: { fontSize: 16 },
  dateContent: { flex: 1 },
  dateLabel: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  dateText: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },

  // Marriage grade
  gradeWrap: { alignItems: 'center', marginBottom: theme.spacing.md },
  gradeText: { fontSize: 42, fontWeight: '700', color: theme.colors.gold.primary },
  marriedBox: { marginTop: theme.spacing.md, backgroundColor: 'rgba(181,149,48,0.06)', borderRadius: theme.radius.sm, padding: theme.spacing.sm },
  marriedLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: 4 },

  // Timeline
  tlSection: { marginBottom: theme.spacing.md },
  tlSectionTitle: { fontSize: 12, fontWeight: '600', color: theme.colors.text.primary, marginBottom: theme.spacing.xs },
  tlRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  tlMonth: { fontSize: 12, color: theme.colors.text.secondary, width: 36 },
  tlBar: { flex: 1, height: 6, backgroundColor: theme.colors.bg.tertiary, borderRadius: 3, overflow: 'hidden' },
  tlBarFill: { height: '100%', borderRadius: 3 },
  tlBarGood: { backgroundColor: theme.colors.success },
  tlBarWarn: { backgroundColor: theme.colors.warning },
  tlScore: { fontSize: 12, fontWeight: '600', width: 28, textAlign: 'right' },
  tlHighlight: { backgroundColor: 'rgba(45,122,95,0.08)', borderRadius: theme.radius.sm, padding: theme.spacing.sm, marginBottom: theme.spacing.sm },
  tlHighlightLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.success, marginBottom: 4 },
  tlHighlightText: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },
  tlDanger: { backgroundColor: 'rgba(196,148,61,0.08)' },
  tlDangerLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.warning, marginBottom: 4 },
  tlDangerText: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },

  // Secret Messages
  secretRow: { gap: theme.spacing.sm },
  secretCard: { backgroundColor: 'rgba(181,149,48,0.06)', borderRadius: theme.radius.md, padding: theme.spacing.md },
  secretCardB: { borderLeftColor: theme.colors.info, backgroundColor: 'rgba(44,95,138,0.06)' },
  secretTo: { fontSize: 12, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: 4 },
  secretText: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20, fontStyle: 'italic' },

  // Advice
  adviceRow: { flexDirection: 'row', gap: 8, marginBottom: theme.spacing.sm, alignItems: 'flex-start' },
  adviceNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: theme.colors.gold.primary, alignItems: 'center', justifyContent: 'center' },
  adviceNumText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Fun Fact
  funFactBox: { marginTop: theme.spacing.md, backgroundColor: theme.colors.bg.secondary, borderRadius: theme.radius.lg, padding: theme.spacing.cardPadding, borderWidth: 1, borderColor: theme.colors.glass.border },
  funFactLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: theme.spacing.xs },
  funFactText: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },

  // Final Words
  finalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.md },
  finalQuote: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(181,149,48,0.12)', alignItems: 'center', justifyContent: 'center' },
  finalQuoteText: { fontSize: 18, fontWeight: '700', color: theme.colors.gold.primary, marginTop: -2 },
  finalLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.gold.muted, letterSpacing: 0.5 },

  // Share
  shareWrap: { marginTop: theme.spacing.xl },

  // Teaser/Paid
  teaserCard: {
    marginTop: theme.spacing.lg, backgroundColor: '#1C1C1E',
    borderRadius: theme.radius.lg, padding: theme.spacing.cardPadding,
    borderWidth: 1, borderColor: theme.colors.gold.dark + '40',
  },
  teaserText: { fontSize: 13, color: theme.colors.goldCard.textSecondary, lineHeight: 20, textAlign: 'center' },
  paidCard: { marginTop: theme.spacing.md, position: 'relative', minHeight: 60 },
  blurOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(28,28,30,0.92)', zIndex: 1,
    borderWidth: 1, borderColor: theme.colors.gold.dark + '40',
    alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.lg,
  },
  lockText: { color: theme.colors.gold.light, fontSize: 14, fontWeight: '600' },
  paidText: { color: theme.colors.text.tertiary, fontSize: 13 },
  disclaimer: {
    fontSize: 10, color: theme.colors.text.tertiary,
    textAlign: 'center', lineHeight: 14, marginTop: theme.spacing.xl,
  },
});
