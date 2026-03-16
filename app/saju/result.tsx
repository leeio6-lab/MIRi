import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { BackButton } from '../../src/components/ui/BackButton';
import { LifeGraph } from '../../src/components/saju/LifeGraph';
import { MonthlyChart } from '../../src/components/saju/MonthlyChart';
import { LifePeriodTimeline } from '../../src/components/saju/LifePeriodTimeline';
import { SajuOverviewCard } from '../../src/components/saju/SajuOverviewCard';
import { HelpButton } from '../../src/components/ui/HelpButton';
import { TermTip, SajuText } from '../../src/components/ui/TermTip';
import { useFortuneStore } from '../../src/stores/fortuneStore';
import { useAuthStore } from '../../src/stores/authStore';
import { calculateFourPillars } from '../../src/utils/saju-calc';

const SCREEN_W = Dimensions.get('window').width;
const isSmall = SCREEN_W < 380;

const sc = (s?: number) => {
  const v = s ?? 70;
  return v >= 80 ? theme.colors.success : v >= 60 ? theme.colors.gold.primary : v >= 40 ? theme.colors.warning : theme.colors.error;
};

/* ─── Section Title ─── */
function Section({ title, sub, helpKeys, termKey }: { title: string; sub?: string; helpKeys?: string[]; termKey?: string }) {
  return (
    <View style={$.secWrap}>
      <View style={$.secRow}>
        {termKey ? (
          <View style={$.secRow}>
            <Text style={$.secTitle}>{title} </Text>
            <TermTip termKey={termKey as any} label="?" style={{ fontSize: 13, fontWeight: '700' }} />
          </View>
        ) : (
          <Text style={$.secTitle}>{title}</Text>
        )}
        {helpKeys && <HelpButton termKeys={helpKeys as any} size={17} />}
      </View>
      {sub ? <Text style={$.secSub}>{sub}</Text> : null}
    </View>
  );
}


// ── 일간별 사주 정의 (총평 태그라인) ──
const DAY_MASTER_IDENTITY: Record<string, { name: string; hanja: string; nature: string; tagline: string }> = {
  '갑': { name: '갑목일주', hanja: '甲木日柱', nature: '큰 나무', tagline: '꺾이지 않는 대들보의 기운' },
  '을': { name: '을목일주', hanja: '乙木日柱', nature: '풀과 꽃', tagline: '부드럽지만 끈질긴 생명력' },
  '병': { name: '병화일주', hanja: '丙火日柱', nature: '태양', tagline: '세상을 비추는 뜨거운 심장' },
  '정': { name: '정화일주', hanja: '丁火日柱', nature: '촛불', tagline: '은은하지만 꺼지지 않는 불꽃' },
  '무': { name: '무토일주', hanja: '戊土日柱', nature: '큰 산', tagline: '흔들리지 않는 대지의 중심' },
  '기': { name: '기토일주', hanja: '己土日柱', nature: '논밭', tagline: '품어서 키우는 어머니의 땅' },
  '경': { name: '경금일주', hanja: '庚金日柱', nature: '바위와 칼', tagline: '단단하고 날카로운 결단의 기운' },
  '신': { name: '신금일주', hanja: '辛金日柱', nature: '보석', tagline: '갈고닦을수록 빛나는 원석' },
  '임': { name: '임수일주', hanja: '壬水日柱', nature: '바다와 강', tagline: '거침없이 흐르는 자유로운 물결' },
  '계': { name: '계수일주', hanja: '癸水日柱', nature: '이슬과 비', tagline: '조용히 스며드는 지혜의 물방울' },
};

export default function SajuResultScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<string, number>>({});
  const overviewY = useRef(0);
  const [showFloatingBtn, setShowFloatingBtn] = useState(false);
  const storeResult = useFortuneStore().sajuResult;
  const r: any = storeResult;
  const { user } = useAuthStore();
  const pillars = user
    ? calculateFourPillars(user.birthYear, user.birthMonth, user.birthDay, user.birthHour, undefined, undefined, undefined, user.isLunar)
    : (__DEV__ ? calculateFourPillars(1995, 8, 15, 10) : null);

  if (!r) return (
    <View style={$.empty}><Text style={$.emptyText}>{t('result.noResult')}</Text><BackButton /></View>
  );

  const yearly = r.yearly2026 ?? r.yearlyFortune;
  const lucky = r.lucky ?? r.luckyElements;
  const final = r.finalWords ?? r.finalMessage;
  const { personality, career, wealth, love, health, daeun, lifePeriods, relationship, family } = r as any;
  const monthly: any[] | undefined = r.monthly2026 ?? r[`monthly${new Date().getFullYear()}`];

  let d = 0;
  const nd = () => { d += 50; return d; };

  return (
    <>
    <ScrollView
      ref={scrollRef}
      style={$.container}
      contentContainerStyle={$.content}
      showsVerticalScrollIndicator={false}
      onScroll={(e) => {
        const y = e.nativeEvent.contentOffset.y;
        setShowFloatingBtn(r.overview && y > overviewY.current + 300);
      }}
      scrollEventThrottle={100}
    >
      <BackButton />

      {/* ═══ HOOK HEADLINE ═══ */}
      <Animated.View entering={FadeInDown.delay(nd()).springify()}>
        <View style={$.hookHero}>
          {pillars && (
            <Text style={$.hookHanja} allowFontScaling={false}>{pillars.dayMaster.charAt(0)}</Text>
          )}
          {(() => {
            // poeticTitle=정의(큰글씨), hookQuestion=보충(서브). 질문이 title에 오면 swap
            let title = r.overview?.poeticTitle || r.headline || '';
            let sub = r.overview?.hookQuestion || '';
            if (title.includes('?') || title.includes('？')) {
              [title, sub] = [sub || title, title];
            }
            return (
              <>
                {title ? <Text style={$.hookText} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.75}>{title}</Text> : null}
                {sub ? <Text style={$.hookSub} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>{sub}</Text> : null}
              </>
            );
          })()}
        </View>
      </Animated.View>

      {/* ═══ 일주 정의 (총평 배지) ═══ */}
      {pillars && (() => {
        const identity = DAY_MASTER_IDENTITY[pillars.day.stem];
        if (!identity) return null;
        return (
          <Animated.View entering={FadeInDown.delay(nd()).springify()}>
            <View style={$.identityCard}>
              <View style={$.identityHanjaWrap}>
                <Text style={$.identityHanja}>{pillars.dayMaster}</Text>
              </View>
              <View style={$.identityBody}>
                <View style={$.identityNameRow}>
                  <Text style={$.identityName}>{identity.name}</Text>
                  <Text style={$.identityHanjaSmall}>{identity.hanja}</Text>
                </View>
                <Text style={$.identityNature} numberOfLines={1}>{identity.nature}의 사주</Text>
                <Text style={$.identityTagline} numberOfLines={2}>{identity.tagline}</Text>
              </View>
            </View>
          </Animated.View>
        );
      })()}

      {/* ═══ Overview (990사주 스타일) ═══ */}
      {r.overview && (() => {
        // AI가 overview 항목을 빠뜨릴 경우 상세 섹션에서 fallback
        const ov = { ...r.overview };
        if (!ov.love && love?.title) ov.love = love.title;
        if (!ov.career && career?.title) ov.career = career.title;
        if (!ov.wealth && wealth?.title) ov.wealth = wealth.title;
        if (!ov.health && health?.title) ov.health = health.title;
        if (!ov.personality && personality?.core) ov.personality = personality.core.slice(0, 40) + '...';
        return (
        <Animated.View entering={FadeInDown.delay(nd()).springify()} onLayout={(e) => { overviewY.current = e.nativeEvent.layout.y; }}>
          <SajuOverviewCard
            overview={ov}
            onItemPress={(key) => {
              const y = sectionY.current[key];
              if (y != null) scrollRef.current?.scrollTo({ y: y - 20, animated: true });
            }}
          />
        </Animated.View>
        );
      })()}

      {/* 사주 원국 + 사주 구조: 무료에서 이미 볼 수 있으므로 유료 결과에선 생략 */}

      {/* ═══ 성격 분석 ═══ */}
      {personality?.core && (
        <Animated.View entering={FadeInDown.delay(nd()).springify()} onLayout={(e) => { sectionY.current['personality'] = e.nativeEvent.layout.y; }}>
          <GlassCard style={$.card}>
            <Section title="성격 분석" termKey="tenGods" />
            <SajuText style={$.body}>{personality.core}</SajuText>

            {personality.strengths?.length > 0 && (
              <View style={$.listWrap}>
                {personality.strengths.map((v: string, i: number) => (
                  <View key={i} style={$.listRow}><Text style={$.bulletG}>+</Text><Text style={$.listVal}>{v}</Text></View>
                ))}
              </View>
            )}
            {personality.weaknesses?.length > 0 && (
              <View style={$.listWrap}>
                {personality.weaknesses.map((v: string, i: number) => (
                  <View key={i} style={$.listRow}><Text style={$.bulletO}>-</Text><Text style={$.listVal}>{v}</Text></View>
                ))}
              </View>
            )}

            {personality.pastGuess?.length > 0 && (
              <View style={$.pastCard}>
                {personality.pastGuess.map((v: string, i: number) => (
                  <Text key={i} style={$.pastText}>{v}</Text>
                ))}
              </View>
            )}
          </GlassCard>
        </Animated.View>
      )}

      {/* ═══ 직업운 ═══ */}
      {career?.title && (
        <Animated.View entering={FadeInDown.delay(nd()).springify()} onLayout={(e) => { sectionY.current['career'] = e.nativeEvent.layout.y; }}>
          <GlassCard style={$.card}>
            <Section title="직업운" sub={career.title} termKey="strength" />
            {career.analysis && <SajuText style={$.body}>{career.analysis}</SajuText>}
            {career.bestFields?.length > 0 && (
              <View style={$.listWrap}>
                {career.bestFields.map((f: string, i: number) => (
                  <View key={i} style={$.listRow}><Text style={$.bulletG}>+</Text><Text style={$.listVal}>{f}</Text></View>
                ))}
              </View>
            )}
            {career.avoidFields && <View style={$.alertBox}><Text style={$.alertT}>{career.avoidFields}</Text></View>}
          </GlassCard>
        </Animated.View>
      )}

      {/* ═══ 재물운 ═══ */}
      {wealth?.title && (
        <Animated.View entering={FadeInDown.delay(nd()).springify()} onLayout={(e) => { sectionY.current['wealth'] = e.nativeEvent.layout.y; }}>
          <GlassCard style={$.card}>
            <Section title="재물운" sub={wealth.title} />
            {wealth.pattern && <SajuText style={$.body}>{wealth.pattern}</SajuText>}
            {wealth.peakYears && <View style={$.hlBox}><Text style={$.hlLabel}>재물 피크</Text><Text style={$.hlText}>{wealth.peakYears}</Text></View>}
            {wealth.warning && <View style={$.alertBox}><Text style={$.alertT}>{wealth.warning}</Text></View>}
          </GlassCard>
        </Animated.View>
      )}

      {/* ═══ 연애운 ═══ */}
      {love?.title && (
        <Animated.View entering={FadeInDown.delay(nd()).springify()} onLayout={(e) => { sectionY.current['love'] = e.nativeEvent.layout.y; }}>
          <GlassCard style={$.card}>
            <Section title="연애·결혼운" sub={love.title} />
            {love.idealPartner && <View style={$.hlBox}><Text style={$.hlLabel}>이상형</Text><Text style={$.hlText}>{love.idealPartner}</Text></View>}
            {(love.timing || (love as any).tendency) && <View style={$.hlBox}><Text style={$.hlLabel}>좋은 시기</Text><Text style={$.hlText}>{love.timing || (love as any).tendency}</Text></View>}
            {love.warning && <View style={$.alertBox}><Text style={$.alertT}>{love.warning}</Text></View>}
          </GlassCard>
        </Animated.View>
      )}

      {/* ═══ 건강운 ═══ */}
      {health?.title && (
        <Animated.View entering={FadeInDown.delay(nd()).springify()} onLayout={(e) => { sectionY.current['health'] = e.nativeEvent.layout.y; }}>
          <GlassCard style={$.card}>
            <Section title="건강운" sub={health.title} termKey="fiveElements" />

            {health.weakPoints?.length > 0 && health.weakPoints.map((v: string, i: number) => (
              <View key={i} style={$.listRow}><Text style={$.bulletO}>!</Text><Text style={$.listVal}>{v}</Text></View>
            ))}
            {health.dangerPeriod && <View style={$.alertBox}><Text style={$.alertT}>{health.dangerPeriod}</Text></View>}
            {health.advice && <><View style={$.divider} /><SajuText style={$.body}>{health.advice}</SajuText></>}
          </GlassCard>
        </Animated.View>
      )}

      {/* ═══ 올해 운세 ═══ */}
      {(yearly?.overview || monthly?.length) && (
        <Animated.View entering={FadeInDown.delay(nd()).springify()} onLayout={(e) => { sectionY.current['yearly'] = e.nativeEvent.layout.y; }}>
          <GlassCard gold style={$.card}>
            <Section title={`${new Date().getFullYear()}년 운세`} termKey="yearlyFortune" />
            {yearly?.overview && <SajuText style={$.body}>{yearly.overview}</SajuText>}
            {monthly && monthly.length > 0 && (
              <><View style={$.divider} /><MonthlyChart data={monthly} /></>
            )}
            {yearly?.quarters?.length > 0 && (
              <>
                <View style={$.divider} />
                <View style={$.qGrid}>
                  {yearly.quarters.map((q: any, i: number) => (
                    <View key={i} style={$.qItem}>
                      <View style={$.qHead}><Text style={$.qPeriod}>{q.period}</Text><Text style={[$.qScore, { color: sc(q.score) }]}>{q.score}</Text></View>
                      <View style={[$.qBar, { backgroundColor: sc(q.score) }]} />
                      <Text style={$.qKw} numberOfLines={1}>{q.keyword}</Text>
                      <Text style={$.qDetail} numberOfLines={3}>{q.detail}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </GlassCard>
        </Animated.View>
      )}

      {/* ═══ 평생 운세 ═══ */}
      {(lifePeriods?.length || daeun?.current) && (
        <Animated.View entering={FadeInDown.delay(nd()).springify()} onLayout={(e) => { sectionY.current['lifePeak'] = e.nativeEvent.layout.y; }}>
          <GlassCard gold style={$.card}>
            <Section title="평생 운세" termKey="daeun" />
            {lifePeriods?.length > 0 && <LifePeriodTimeline data={lifePeriods} />}
            {daeun?.lifeGraph?.length > 0 && <><View style={$.divider} /><LifeGraph data={daeun.lifeGraph} /></>}
            {daeun?.current && (
              <>
                <View style={$.divider} />
                <Text style={$.sub}>현재 대운</Text>
                <SajuText style={$.body}>{daeun.current}</SajuText>
                {daeun.lifePeak && <View style={$.hlBox}><Text style={$.hlLabel}>인생 피크</Text><Text style={$.hlText}>{daeun.lifePeak}</Text></View>}
              </>
            )}
          </GlassCard>
        </Animated.View>
      )}

      {/* ═══ 관계운 (대인관계 + 부모자녀 통합) ═══ */}
      {(relationship?.title || family?.parentFortune) && (
        <Animated.View entering={FadeInDown.delay(nd()).springify()} onLayout={(e) => { sectionY.current['family'] = e.nativeEvent.layout.y; sectionY.current['social'] = e.nativeEvent.layout.y; }}>
          <GlassCard style={$.card}>
            <Section title="관계운" />

            {relationship?.socialStyle && <SajuText style={$.body}>{relationship.socialStyle}</SajuText>}
            {relationship?.bestRelation && <View style={$.hlBox}><Text style={$.hlLabel}>잘 맞는 유형</Text><Text style={$.hlText}>{relationship.bestRelation}</Text></View>}
            {relationship?.cautionRelation && <View style={$.alertBox}><Text style={$.alertT}>{relationship.cautionRelation}</Text></View>}

            {family?.parentFortune && (
              <>
                <View style={$.divider} />
                <Text style={$.sub}>부모운</Text>
                <SajuText style={$.body}>{family.parentFortune}</SajuText>
              </>
            )}
            {family?.childFortune && (
              <>
                <View style={$.divider} />
                <Text style={$.sub}>자녀운</Text>
                <SajuText style={$.body}>{family.childFortune}</SajuText>
              </>
            )}
          </GlassCard>
        </Animated.View>
      )}

      {/* ═══ 행운 요소 ═══ */}
      {lucky && (
        <Animated.View entering={FadeInDown.delay(nd()).springify()} onLayout={(e) => { sectionY.current['lifeDirection'] = e.nativeEvent.layout.y; }}>
          <GlassCard style={$.card}>
            <Section title="행운 요소" termKey="yongShin" />
            <View style={$.luckyGrid}>
              {lucky.color && <LuckyRow icon="🎨" label="색상" val={lucky.color} />}
              {lucky.number && <LuckyRow icon="🔢" label="숫자" val={lucky.number} />}
              {lucky.direction && <LuckyRow icon="🧭" label="방위" val={lucky.direction} />}
            </View>
            {lucky.avoid && <View style={$.alertBox}><Text style={$.alertT}>{lucky.avoid}</Text></View>}
          </GlassCard>
        </Animated.View>
      )}

      {/* ═══ 마무리 ═══ */}
      {final && (
        <Animated.View entering={FadeInDown.delay(nd()).springify()}>
          <GlassCard gold style={{ marginTop: 24 }}>
            <Text style={$.finalQuote}>"</Text>
            <SajuText style={$.finalText}>{final}</SajuText>
          </GlassCard>
        </Animated.View>
      )}

      <TouchableOpacity style={$.reBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/saju' as any)} activeOpacity={0.7}>
        <Text style={$.reBtnT}>{t('result.reAnalyze')}</Text>
      </TouchableOpacity>
      <Text style={$.disc}>{r.disclaimer || t('common.disclaimer')}</Text>
    </ScrollView>

    {/* Floating "요약 보기" button */}
    {showFloatingBtn && (
      <TouchableOpacity
        style={$.floatingBtn}
        activeOpacity={0.85}
        onPress={() => scrollRef.current?.scrollTo({ y: overviewY.current - 10, animated: true })}
      >
        <Text style={$.floatingBtnT}>↑ 요약</Text>
      </TouchableOpacity>
    )}
    </>
  );
}

/* ─── Small components ─── */
function LuckyRow({ icon, label, val }: { icon: string; label: string; val: string }) {
  return <View style={$.luckyRow}><Text style={$.luckyIcon}>{icon}</Text><Text style={$.luckyLbl}>{label}</Text><Text style={$.luckyVal}>{val}</Text></View>;
}

/* ─── Styles ─── */
const $ = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.primary },
  content: { padding: isSmall ? 16 : 20, paddingTop: Platform.OS === 'ios' ? 56 : 48, paddingBottom: 80 },
  empty: { flex: 1, backgroundColor: theme.colors.bg.primary, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: theme.colors.text.secondary, fontSize: 16 },

  // Identity card — 일주 정의
  identityCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: theme.colors.bg.secondary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(181,149,48,0.20)',
    gap: 12,
  },
  identityHanjaWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(181,149,48,0.08)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1.5,
    borderColor: 'rgba(181,149,48,0.20)',
  },
  identityHanja: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: theme.colors.gold.primary,
  },
  identityBody: {
    flex: 1,
  },
  identityNameRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 2,
  },
  identityName: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: theme.colors.text.primary,
    letterSpacing: -0.3,
  },
  identityHanjaSmall: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    fontWeight: '500' as const,
  },
  identityNature: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: theme.colors.gold.primary,
    marginBottom: 2,
  },
  identityTagline: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },

  // Hook hero — 자극적 최상단
  hookHero: {
    position: 'relative' as const,
    paddingVertical: 18,
    paddingHorizontal: 4,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  hookHanja: {
    position: 'absolute',
    top: -5,
    right: -8,
    fontSize: 100,
    fontWeight: '900',
    color: 'rgba(181,149,48,0.06)',
    lineHeight: 110,
    zIndex: -1,
  },
  hookText: {
    fontSize: 19,
    fontWeight: '800',
    color: theme.colors.text.primary,
    textAlign: 'center' as const,
    lineHeight: 28,
    letterSpacing: -0.5,
    zIndex: 1,
  },
  hookSub: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.gold.primary,
    textAlign: 'center' as const,
    marginTop: 6,
    zIndex: 1,
  },

  // Section title
  secWrap: { marginBottom: 6 },
  secRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text.primary, letterSpacing: -0.3 },
  secSub: { fontSize: 13, color: theme.colors.text.secondary, marginTop: 2, lineHeight: 20 },

  // Card & shared
  card: { marginTop: 16 },
  body: { fontSize: 14, color: theme.colors.text.secondary, lineHeight: 21 },
  sub: { fontSize: 13, fontWeight: '600', color: theme.colors.gold.primary, marginBottom: 3 },
  divider: { height: 1, backgroundColor: theme.colors.glass.border, marginVertical: 10 },
  // Highlight box
  hlBox: { marginTop: 6, backgroundColor: 'rgba(181,149,48,0.07)', borderRadius: 10, padding: 10 },
  hlLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: 2 },
  hlText: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 19 },

  // Alert box
  alertBox: { marginTop: 6, backgroundColor: 'rgba(196,148,61,0.06)', borderRadius: 8, padding: 8 },
  alertT: { fontSize: 12, color: theme.colors.warning, lineHeight: 17 },

  // Lists
  listWrap: { marginTop: 6, gap: 3 },
  listRow: { flexDirection: 'row', gap: 6 },
  bulletG: { fontSize: 13, fontWeight: '700', color: theme.colors.success, width: 14 },
  bulletO: { fontSize: 13, fontWeight: '700', color: theme.colors.warning, width: 14, textAlign: 'center' },
  listVal: { flex: 1, fontSize: 13, color: theme.colors.text.secondary, lineHeight: 19 },

  // Past guess
  pastCard: { marginTop: 8, borderLeftWidth: 2, borderLeftColor: theme.colors.gold.primary, paddingLeft: 10, gap: 4 },
  pastText: { fontSize: 13, color: theme.colors.gold.primary, lineHeight: 19, fontStyle: 'italic' },

  // Quarter grid
  qGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  qItem: { width: (SCREEN_W - (isSmall ? 32 : 40) - 48 - 8) / 2, backgroundColor: theme.colors.bg.secondary, borderRadius: 10, padding: 8 },
  qHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qPeriod: { fontSize: 11, fontWeight: '600', color: theme.colors.text.primary },
  qScore: { fontSize: 18, fontWeight: '700' },
  qBar: { height: 2, width: 20, borderRadius: 1, marginVertical: 4 },
  qKw: { fontSize: 11, fontWeight: '600', color: theme.colors.gold.primary },
  qDetail: { fontSize: 10, color: theme.colors.text.tertiary, lineHeight: 14, marginTop: 2 },

  // Lucky
  luckyGrid: { gap: 6 },
  luckyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.bg.secondary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 },
  luckyIcon: { fontSize: 14 },
  luckyLbl: { fontSize: 11, color: theme.colors.text.tertiary, width: 32 },
  luckyVal: { flex: 1, fontSize: 12, color: theme.colors.text.primary, fontWeight: '600' },

  // Final
  finalQuote: { fontSize: 22, fontWeight: '700', color: theme.colors.gold.primary, opacity: 0.3, marginBottom: -6 },
  finalText: { fontSize: 14, color: theme.colors.text.primary, lineHeight: 23, fontWeight: '500' },

  // Actions
  reBtn: { marginTop: 12, borderWidth: 1, borderColor: theme.colors.gold.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  reBtnT: { fontSize: 14, fontWeight: '600', color: theme.colors.gold.primary },
  disc: { fontSize: 9, color: theme.colors.text.tertiary, textAlign: 'center', lineHeight: 13, marginTop: 16, marginBottom: 8 },

  // Floating button
  floatingBtn: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    backgroundColor: theme.colors.gold.dark,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 }),
  } as any,
  floatingBtnT: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
