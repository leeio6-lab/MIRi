import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
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
import { api, formatPillarInfo } from '../../src/services/api';
import { calculateFourPillars } from '../../src/utils/saju-calc';
import { calculateLocalCompatibility } from '../../src/utils/compatibility-calc';
import type { CompatibilityResult, CompatCategories, CompatCategoryScore, CompatDayMaster, CompatRelationshipStages, CompatSurvivalGuide, CompatDateRecommend, CompatSecretMessage, CompatCoupleArchetype } from '../../src/types/api';

// ELEMENT_KO removed — use t(`elements.${el}`) inside component

export default function CompatibilityScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const getEl = (el: string) => t(`elements.${el}`);
  const { user } = useAuthStore();
  const { setCompatibilityResult, saveAndRecord } = useFortuneStore();

  const [partnerName, setPartnerName] = useState('');
  const [partnerYear, setPartnerYear] = useState('');
  const [partnerMonth, setPartnerMonth] = useState('');
  const [partnerDay, setPartnerDay] = useState('');
  const [partnerGender, setPartnerGender] = useState<'male' | 'female'>('female');

  const myPillarsData = React.useMemo(
    () => user ? calculateFourPillars(user.birthYear, user.birthMonth, user.birthDay, user.birthHour) : null,
    [user?.birthYear, user?.birthMonth, user?.birthDay, user?.birthHour]
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const partnerYearNum = parseInt(partnerYear, 10);
  const partnerMonthNum = parseInt(partnerMonth, 10);
  const partnerDayNum = parseInt(partnerDay, 10);
  const isPartnerValid =
    partnerYear.length === 4 && !isNaN(partnerYearNum) && partnerYearNum >= 1900 && partnerYearNum <= new Date().getFullYear() &&
    partnerMonth.length >= 1 && !isNaN(partnerMonthNum) && partnerMonthNum >= 1 && partnerMonthNum <= 12 &&
    partnerDay.length >= 1 && !isNaN(partnerDayNum) && partnerDayNum >= 1 && partnerDayNum <= 31;

  const myName = user?.name || t('common.me');
  const ptName = partnerName.trim() || t('common.partner');

  const partnerPillarsData = React.useMemo(() => {
    if (!isPartnerValid) return null;
    try { return calculateFourPillars(partnerYearNum, partnerMonthNum, partnerDayNum, 12); }
    catch { return null; }
  }, [isPartnerValid, partnerYearNum, partnerMonthNum, partnerDayNum]);

  const handleAnalyze = async (isPaid = false) => {
    if (!isPartnerValid || !user) return;
    setLoading(true);
    try {
      if (!isPaid) {
        const localResult = calculateLocalCompatibility(
          user.birthYear, user.birthMonth, user.birthDay, user.birthHour, user.gender,
          partnerYearNum, partnerMonthNum, partnerDayNum, partnerGender,
        );
        setResult(localResult);
        setCompatibilityResult(localResult);
      } else {
        const myPillars = calculateFourPillars(user.birthYear, user.birthMonth, user.birthDay, user.birthHour);
        const partnerPillars = calculateFourPillars(partnerYearNum, partnerMonthNum, partnerDayNum, 12);
        const apiResult = await api.analyzeCompatibility(
          { year: user.birthYear, month: user.birthMonth, day: user.birthDay, hour: user.birthHour, isLunar: user.isLunar, gender: user.gender },
          { year: partnerYearNum, month: partnerMonthNum, day: partnerDayNum, hour: 12, isLunar: false, gender: partnerGender },
          user.locale, true, formatPillarInfo(myPillars, user.birthYear), formatPillarInfo(partnerPillars, partnerYearNum),
          myName, ptName,
        );
        setResult(apiResult);
        setCompatibilityResult(apiResult);
        saveAndRecord('compatibility', true, apiResult);
      }
    } catch (err) {
      console.error('[Compatibility] error:', err);
      const fallback = calculateLocalCompatibility(
        user.birthYear, user.birthMonth, user.birthDay, user.birthHour, user.gender,
        partnerYearNum, partnerMonthNum, partnerDayNum, partnerGender,
      );
      setResult(fallback);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingInk steps={t('loading.compatSteps', { returnObjects: true }) as string[]} finalMessage={t('loading.compatFinal')} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView style={st.container} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>

      {/* ── INPUT FORM (hide after result) ── */}
      {!result && (
        <>
          <Text style={st.title}>{t('compatibility.title')}</Text>

          {/* My Info */}
          <GlassCard style={st.personCard}>
            <Text style={st.personLabel}>{t('compatibility.myInfo')}</Text>
            {user && (
              <View>
                {user.name ? <Text style={st.personName}>{user.name}</Text> : null}
                <Text style={st.personInfo}>
                  {user.birthYear}.{String(user.birthMonth).padStart(2, '0')}.{String(user.birthDay).padStart(2, '0')}
                  {' · '}{user.gender === 'male' ? t('common.male_short') : t('common.female_short')}
                </Text>
                {myPillarsData && (
                  <View style={st.myDetailRow}>
                    <View style={st.myDetailItem}>
                      <Text style={st.myDetailLabel}>일간</Text>
                      <Text style={st.myDetailValue}>{myPillarsData.dayMaster}({getEl(myPillarsData.dayMasterElement)})</Text>
                    </View>
                    <View style={st.myDetailDivider} />
                    <View style={st.myDetailItem}>
                      <Text style={st.myDetailLabel}>띠</Text>
                      <Text style={st.myDetailValue}>{myPillarsData.year.zodiac}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </GlassCard>

          {/* Heart connector */}
          <View style={st.coupleConnector}>
            <View style={st.connLine} />
            <View style={st.connHeart}><Text style={st.connHeartText}>&hearts;</Text></View>
            <View style={st.connLine} />
          </View>

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
            <DateInputRow
              year={partnerYear}
              month={partnerMonth}
              day={partnerDay}
              onChangeYear={setPartnerYear}
              onChangeMonth={setPartnerMonth}
              onChangeDay={setPartnerDay}
              variant="inline"
            />
            <View style={st.genderRow}>
              <TouchableOpacity style={[st.genderBtn, partnerGender === 'male' && st.genderActive]} onPress={() => setPartnerGender('male')}>
                <Text style={[st.genderText, partnerGender === 'male' && st.genderTextActive]}>{t('compatibility.maleGender')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.genderBtn, partnerGender === 'female' && st.genderActive]} onPress={() => setPartnerGender('female')}>
                <Text style={[st.genderText, partnerGender === 'female' && st.genderTextActive]}>{t('compatibility.femaleGender')}</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          <Button title={t('compatibility.analyzeButton')} onPress={() => handleAnalyze(false)} disabled={!isPartnerValid} style={st.analyzeBtn} />
        </>
      )}

      {/* ── RESULTS ── */}
      {result && (
        <Animated.View entering={FadeInDown.springify()}>
          {/* Back to input */}
          <TouchableOpacity onPress={() => setResult(null)} style={st.resetBtn}>
            <Text style={st.resetText}>{'< '}{t('compatibility.reAnalyze')}</Text>
          </TouchableOpacity>

          {/* Headline */}
          {result.headline && <Text style={st.headline}>{result.headline}</Text>}

          {/* Couple Archetype */}
          {result.coupleArchetype && (
            <GlassCard gold style={st.archetypeCard}>
              <Text style={st.archetypeEmoji}>{result.coupleArchetype.emoji}</Text>
              <Text style={st.archetypeTitle}>{result.coupleArchetype.title}</Text>
              <Text style={st.archetypeDesc}>{result.coupleArchetype.description}</Text>
            </GlassCard>
          )}

          {/* Couple card with score */}
          <GlassCard gold style={st.resultCard}>
            <View style={st.coupleRow}>
              <View style={st.coupleCol}>
                <View style={st.coupleCircle}>
                  <Text style={st.coupleEmoji}>{user?.gender === 'male' ? '\u2642' : '\u2640'}</Text>
                </View>
                <Text style={st.coupleName}>{myName}</Text>
                {myPillarsData && <Text style={st.coupleEl}>{myPillarsData.dayMaster}</Text>}
              </View>
              <View style={st.coupleScoreCol}>
                <Text style={st.scoreNum}>{result.overallScore}</Text>
                <Text style={st.scoreLabel}>{t('result.scoreUnit')}</Text>
              </View>
              <View style={st.coupleCol}>
                <View style={st.coupleCircle}>
                  <Text style={st.coupleEmoji}>{partnerGender === 'male' ? '\u2642' : '\u2640'}</Text>
                </View>
                <Text style={st.coupleName}>{ptName}</Text>
                {partnerPillarsData && <Text style={st.coupleEl}>{partnerPillarsData.dayMaster}</Text>}
              </View>
            </View>
            <Text style={st.resultSummary}>{result.summary}</Text>
          </GlassCard>

          {/* ── PAID SECTIONS ── */}
          {result.categories ? (
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
                    aName={myName} bName={ptName}
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
                      <View style={st.dmPairRow}>
                        <View style={st.dmPairCol}>
                          <Text style={st.dmPairLabel} numberOfLines={1}>{myName} → {ptName}</Text>
                          <Text style={st.dmPairText}>{(result.dayMasterRelation as CompatDayMaster).aToB}</Text>
                        </View>
                        <View style={st.dmDiv} />
                        <View style={st.dmPairCol}>
                          <Text style={st.dmPairLabel} numberOfLines={1}>{ptName} → {myName}</Text>
                          <Text style={st.dmPairText}>{(result.dayMasterRelation as CompatDayMaster).bToA}</Text>
                        </View>
                      </View>
                    </>
                  )}
                </GlassCard>
              )}

              {/* Dynamics */}
              {result.dynamics && (
                <GlassCard style={st.detailCard}>
                  <Text style={st.detailLabel}>{t('compatibility.dynamicsTitle')}</Text>
                  {result.dynamics.powerBalance ? <View style={st.dynSec}><Text style={st.dynTitle}>{t('compatibility.powerBalance')}</Text><Text style={st.detailText}>{result.dynamics.powerBalance}</Text></View> : null}
                  {result.dynamics.fightPattern ? <View style={st.dynSec}><Text style={st.dynTitle}>{t('compatibility.fightPattern')}</Text><Text style={st.detailText}>{result.dynamics.fightPattern}</Text></View> : null}
                  {result.dynamics.loveLanguage ? <View style={st.dynSec}><Text style={st.dynTitle}>{t('compatibility.loveLanguage')}</Text><Text style={st.detailText}>{result.dynamics.loveLanguage}</Text></View> : null}
                  {result.dynamics.dealBreaker ? (
                    <View style={st.dealBox}><Text style={st.dealTitle}>{t('compatibility.dealBreaker')}</Text><Text style={st.dealText}>{result.dynamics.dealBreaker}</Text></View>
                  ) : null}
                </GlassCard>
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
                <GlassCard style={st.detailCard}>
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
                </GlassCard>
              )}

              {/* Survival Guide */}
              {result.survivalGuide && (
                <GlassCard style={st.detailCard}>
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
                </GlassCard>
              )}

              {/* Date Recommend */}
              {result.dateRecommend && (
                <GlassCard style={st.detailCard}>
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
                </GlassCard>
              )}

              {/* Marriage Grade */}
              {result.marriageGrade && (
                <GlassCard gold style={st.detailCard}>
                  <Text style={st.detailLabel}>{t('compatibility.marriageGradeTitle')}</Text>
                  <Text style={st.gradeText}>{result.marriageGrade.grade}</Text>
                  <Text style={st.detailText}>{result.marriageGrade.summary}</Text>
                  {result.marriageGrade.ifMarried && <><View style={st.divider} /><Text style={st.dynTitle}>{t('compatibility.afterMarriage')}</Text><Text style={st.detailText}>{result.marriageGrade.ifMarried}</Text></>}
                  {result.marriageGrade.childrenNote && <><View style={st.divider} /><Text style={st.dynTitle}>{t('compatibility.childrenNote')}</Text><Text style={st.detailText}>{result.marriageGrade.childrenNote}</Text></>}
                  {result.marriageGrade.inlaws && <><View style={st.divider} /><Text style={st.dynTitle}>{t('compatibility.inlaws')}</Text><Text style={st.detailText}>{result.marriageGrade.inlaws}</Text></>}
                </GlassCard>
              )}

              {/* Secret Message */}
              {result.secretMessage && (
                <GlassCard style={st.detailCard}>
                  <Text style={st.detailLabel}>{t('compatibility.secretAdvice')}</Text>
                  <View style={st.secretRow}>
                    <View style={st.secretCol}>
                      <Text style={st.secretLabel}>{t('compatibility.toPersonFormat', { name: myName })}</Text>
                      <Text style={st.secretText}>{result.secretMessage.toA}</Text>
                    </View>
                    <View style={st.secretDiv} />
                    <View style={st.secretCol}>
                      <Text style={st.secretLabel}>{t('compatibility.toPersonFormat', { name: ptName })}</Text>
                      <Text style={st.secretText}>{result.secretMessage.toB}</Text>
                    </View>
                  </View>
                </GlassCard>
              )}

              {/* Timeline */}
              {result.timeline && (() => {
                const tl = result.timeline as any;
                const best = tl.bestMonths2026 ?? Object.values(tl).find((v: any) => Array.isArray(v) && v[0]?.month) ?? [];
                const worst = tl.worstMonths2026 ?? [];
                return (
                  <GlassCard style={st.detailCard}>
                    <Text style={st.detailLabel}>{t('compatibility.monthlyCompatTitle', { year: new Date().getFullYear() })}</Text>
                    {best.length > 0 && <View style={st.tlSec}><Text style={st.tlSecTitle}>{t('compatibility.goodMonths')}</Text>
                      {best.map((m: any, i: number) => <View key={i} style={st.tlRow}><Text style={st.tlMonth}>{m.month}</Text><View style={st.tlBar}><View style={[st.tlFill, st.tlGood, { width: `${m.score}%` }]} /></View><Text style={[st.tlScore, { color: theme.colors.success }]}>{m.score}</Text></View>)}
                    </View>}
                    {worst.length > 0 && <View style={st.tlSec}><Text style={st.tlSecTitle}>{t('compatibility.cautionMonths')}</Text>
                      {worst.map((m: any, i: number) => <View key={i} style={st.tlRow}><Text style={st.tlMonth}>{m.month}</Text><View style={st.tlBar}><View style={[st.tlFill, st.tlWarn, { width: `${m.score}%` }]} /></View><Text style={[st.tlScore, { color: theme.colors.warning }]}>{m.score}</Text></View>)}
                    </View>}
                    {tl.marriageTiming && <View style={st.tlHi}><Text style={st.tlHiLabel}>{t('compatibility.bestMarriageTiming')}</Text><Text style={st.tlHiText}>{tl.marriageTiming}</Text></View>}
                  </GlassCard>
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
          ) : (
            <TouchableOpacity onPress={() => setShowPaywall(true)} style={st.unlockCta}>
              <View style={st.unlockCtaInner}>
                <Text style={st.unlockCtaTitle}>{t('compatibility.unlockDetail')}</Text>
                <Text style={st.unlockCtaDesc}>{t('compatibility.unlockCtaDesc')}</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Share */}
          <View style={{ marginTop: theme.spacing.xl }}>
            <ShareCard type="compatibility" score={result.overallScore} summary={result.headline || (typeof result.summary === 'string' ? result.summary : '')} />
          </View>
        </Animated.View>
      )}

      <Text style={st.disclaimer}>{t('common.disclaimer')}</Text>

      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)}
        onUnlocked={() => { setShowPaywall(false); handleAnalyze(true); }} productType="compatibility" />
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.primary },
  content: { padding: theme.spacing.screenPadding, paddingTop: 60, paddingBottom: 120 },
  title: { ...theme.typo.screenTitle, textAlign: 'center', marginBottom: theme.spacing.sectionGap },
  // Input form
  personCard: { marginBottom: theme.spacing.sm },
  personLabel: { fontSize: 14, color: theme.colors.text.secondary, marginBottom: theme.spacing.sm },
  personName: { fontSize: 18, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 4 },
  personInfo: { fontSize: 14, color: theme.colors.text.secondary, lineHeight: 20 },
  myDetailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: theme.colors.bg.secondary, borderRadius: theme.radius.sm, padding: 10 },
  myDetailItem: { flex: 1, alignItems: 'center' },
  myDetailLabel: { fontSize: 11, color: theme.colors.text.tertiary, marginBottom: 2 },
  myDetailValue: { fontSize: 13, fontWeight: '600', color: theme.colors.gold.primary },
  myDetailDivider: { width: 1, height: 24, backgroundColor: theme.colors.glass.border },
  coupleConnector: { flexDirection: 'row', alignItems: 'center', marginVertical: theme.spacing.lg },
  connLine: { flex: 1, height: 1, backgroundColor: theme.colors.gold.primary + '30' },
  connHeart: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.gold.primary + '12', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.gold.primary + '25' },
  connHeartText: { fontSize: 16, color: theme.colors.gold.primary },
  nameInput: { backgroundColor: theme.colors.bg.primary, borderRadius: theme.radius.sm, paddingVertical: 12, paddingHorizontal: 12, color: theme.colors.text.primary, fontSize: 15, borderWidth: 1, borderColor: theme.colors.glass.border, marginBottom: theme.spacing.sm },
  genderRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.xs },
  genderBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.glass.border, backgroundColor: theme.colors.bg.primary },
  genderActive: { borderColor: theme.colors.gold.primary, backgroundColor: theme.colors.gold.primary + '0A' },
  genderText: { color: theme.colors.text.tertiary, fontSize: 14 },
  genderTextActive: { color: theme.colors.gold.primary, fontWeight: '600' },
  analyzeBtn: { marginTop: theme.spacing.xl },
  // Result header
  resetBtn: { marginBottom: theme.spacing.md },
  resetText: { color: theme.colors.text.secondary, fontSize: 14 },
  headline: { fontSize: 20, fontWeight: '700', color: theme.colors.gold.primary, textAlign: 'center', marginBottom: theme.spacing.sm, lineHeight: 28 },
  resultCard: { marginTop: theme.spacing.md, alignItems: 'center' },
  coupleRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: theme.spacing.md },
  coupleCol: { flex: 1, alignItems: 'center', gap: 3 },
  coupleCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.bg.secondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: theme.colors.gold.primary + '40', marginBottom: 4 },
  coupleEmoji: { fontSize: 20, color: theme.colors.gold.primary },
  coupleName: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
  coupleEl: { fontSize: 12, fontWeight: '600', color: theme.colors.gold.primary },
  coupleScoreCol: { alignItems: 'center' },
  scoreNum: { fontSize: 48, fontWeight: '700', color: theme.colors.gold.primary },
  scoreLabel: { fontSize: 12, color: theme.colors.text.tertiary },
  resultSummary: { fontSize: 14, color: theme.colors.text.secondary, lineHeight: 22, textAlign: 'center' },
  // Detail cards
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
  dmPairRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  dmPairCol: { flex: 1, backgroundColor: theme.colors.bg.secondary, borderRadius: theme.radius.sm, padding: theme.spacing.sm },
  dmPairLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.gold.muted, marginBottom: 4 },
  dmPairText: { fontSize: 12, color: theme.colors.text.secondary, lineHeight: 18 },
  dmDiv: { width: 1, backgroundColor: theme.colors.glass.border },
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
  // Archetype
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
  secretRow: { flexDirection: 'row', gap: theme.spacing.sm },
  secretCol: { flex: 1, backgroundColor: theme.colors.bg.secondary, borderRadius: theme.radius.sm, padding: theme.spacing.sm },
  secretDiv: { width: 1, backgroundColor: theme.colors.glass.border },
  secretLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.gold.muted, marginBottom: 4 },
  secretText: { fontSize: 12, color: theme.colors.text.secondary, lineHeight: 18 },
  // Fun fact
  funFactCard: { marginTop: theme.spacing.md, alignItems: 'center' },
  funFactText: { fontSize: 14, color: theme.colors.gold.primary, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
  // Unlock CTA
  unlockCta: { marginTop: theme.spacing.lg },
  unlockCtaInner: { backgroundColor: theme.colors.gold.primary, borderRadius: theme.radius.md, paddingVertical: 18, paddingHorizontal: theme.spacing.cardPadding, alignItems: 'center' },
  unlockCtaTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  unlockCtaDesc: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  disclaimer: { fontSize: 10, color: theme.colors.text.tertiary, textAlign: 'center', lineHeight: 14, marginTop: theme.spacing.xl },
});
