import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, NativeSyntheticEvent, NativeScrollEvent, Share } from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, SharedValue } from 'react-native-reanimated';
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
import { calculateFourPillars, getTenGod, getTenGodForBranch, getSpiritStar } from '../../src/utils/saju-calc';
import { getOverviewFromTenGods } from '../../src/utils/overviewMatcher';
import Svg, { Path, Circle as SvgCircle } from 'react-native-svg';
import { DayMasterAnim } from '../../src/components/icons/DayMasterAnim';

// ── 한글→한자 매핑 (DayMasterAnim용) ──
const STEM_KO_TO_HANJA: Record<string, string> = {
  '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊',
  '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸',
};

// ── 오행별 하이라이트 색상 ──
const EL_COLORS: Record<string, string> = {
  wood: '#3D8B37',  // 초록
  fire: '#C4503D',  // 빨강
  earth: '#A68B5B', // 황토
  metal: '#8C8C8C', // 은색
  water: '#2C5F8A', // 파랑
};
const STEM_EL: Record<string, string> = {
  '갑': 'wood', '을': 'wood', '병': 'fire', '정': 'fire', '무': 'earth',
  '기': 'earth', '경': 'metal', '신': 'metal', '임': 'water', '계': 'water',
};

// ── 일간별 커스텀 SVG 아이콘 (오행 하이라이트) ──
function DayMasterIcon({ stem, size = 32 }: { stem: string; size?: number }) {
  const c = theme.colors.gold.primary;
  const h = EL_COLORS[STEM_EL[stem] ?? 'earth']; // 하이라이트 색
  const s = size;
  const icons: Record<string, React.ReactNode> = {
    // 갑 — 큰 나무: 수관이 초록
    '갑': <Svg width={s} height={s} viewBox="0 0 32 32"><Path d="M16 28V14" stroke={c} strokeWidth={2.2} strokeLinecap="round" /><Path d="M12 28h8" stroke={c} strokeWidth={1.5} strokeLinecap="round" /><Path d="M16 14c-6 0-9-4-9-7.5S11 2 16 2s9 1 9 4.5-3 7.5-9 7.5z" fill={h} fillOpacity={0.25} stroke={c} strokeWidth={1.5} /><Path d="M16 14c-3 0-5-2-5-4s2.5-3.5 5-3.5 5 1.5 5 3.5-2 4-5 4z" fill={h} fillOpacity={0.15} /></Svg>,
    // 을 — 덩굴 꽃: 꽃봉오리 초록
    '을': <Svg width={s} height={s} viewBox="0 0 32 32"><Path d="M16 28c0-8-6-10-6-16s6-8 6-8" stroke={c} strokeWidth={1.5} strokeLinecap="round" fill="none" /><Path d="M16 28c0-8 6-10 6-16" stroke={c} strokeWidth={1.5} strokeLinecap="round" fill="none" /><SvgCircle cx={16} cy={8} r={4} fill={h} fillOpacity={0.3} stroke={c} strokeWidth={1.5} /><SvgCircle cx={16} cy={8} r={1.5} fill={h} fillOpacity={0.5} /></Svg>,
    // 병 — 태양: 중심+빛줄기 빨강
    '병': <Svg width={s} height={s} viewBox="0 0 32 32"><SvgCircle cx={16} cy={16} r={6} fill={h} fillOpacity={0.25} stroke={c} strokeWidth={1.8} /><SvgCircle cx={16} cy={16} r={2.5} fill={h} fillOpacity={0.4} />{[0,45,90,135,180,225,270,315].map(a => { const r1=9,r2=12.5,rad=a*Math.PI/180; return <Path key={a} d={`M${16+r1*Math.cos(rad)} ${16+r1*Math.sin(rad)}L${16+r2*Math.cos(rad)} ${16+r2*Math.sin(rad)}`} stroke={h} strokeWidth={1.5} strokeLinecap="round" strokeOpacity={0.6} />; })}</Svg>,
    // 정 — 촛불: 불꽃 빨강
    '정': <Svg width={s} height={s} viewBox="0 0 32 32"><Path d="M14 28h4v-10h-4z" fill={c} fillOpacity={0.1} stroke={c} strokeWidth={1.3} strokeLinejoin="round" /><Path d="M16 18c-2 0-3.5-2.5-3.5-5C12.5 9 16 4 16 4s3.5 5 3.5 9c0 2.5-1.5 5-3.5 5z" fill={h} fillOpacity={0.3} stroke={h} strokeWidth={1.5} strokeOpacity={0.7} /><Path d="M16 15c-1 0-1.5-1.2-1.5-2.5S16 8 16 8s1.5 3.3 1.5 4.5S17 15 16 15z" fill={h} fillOpacity={0.5} /></Svg>,
    // 무 — 산: 산체 황토
    '무': <Svg width={s} height={s} viewBox="0 0 32 32"><Path d="M2 26L12 8l6 10 4-6 8 14z" fill={h} fillOpacity={0.2} stroke={c} strokeWidth={1.5} strokeLinejoin="round" /><Path d="M8 26l8-12 4 6" stroke={h} strokeWidth={1.2} strokeLinejoin="round" fill="none" opacity={0.4} /></Svg>,
    // 기 — 이삭: 열매 황토
    '기': <Svg width={s} height={s} viewBox="0 0 32 32"><Path d="M16 28V12" stroke={c} strokeWidth={1.8} strokeLinecap="round" /><Path d="M16 12c-2-3-6-5-6-8" stroke={c} strokeWidth={1.3} strokeLinecap="round" fill="none" /><Path d="M16 12c2-3 6-5 6-8" stroke={c} strokeWidth={1.3} strokeLinecap="round" fill="none" /><Path d="M16 16c-2-2-5-3-5-5.5" stroke={c} strokeWidth={1.3} strokeLinecap="round" fill="none" /><Path d="M16 16c2-2 5-3 5-5.5" stroke={c} strokeWidth={1.3} strokeLinecap="round" fill="none" /><SvgCircle cx={10} cy={4} r={1.8} fill={h} fillOpacity={0.4} /><SvgCircle cx={22} cy={4} r={1.8} fill={h} fillOpacity={0.4} /><SvgCircle cx={11} cy={10.5} r={1.5} fill={h} fillOpacity={0.3} /><SvgCircle cx={21} cy={10.5} r={1.5} fill={h} fillOpacity={0.3} /></Svg>,
    // 경 — 검: 칼날 은색
    '경': <Svg width={s} height={s} viewBox="0 0 32 32"><Path d="M16 3v18" stroke={h} strokeWidth={2} strokeLinecap="round" strokeOpacity={0.7} /><Path d="M16 3l2 6h-4z" fill={h} fillOpacity={0.25} /><Path d="M10 21h12" stroke={c} strokeWidth={2} strokeLinecap="round" /><Path d="M14 21v5l2 3 2-3v-5" stroke={c} strokeWidth={1.3} fill={c} fillOpacity={0.1} /></Svg>,
    // 신 — 보석: 면 은색 반짝
    '신': <Svg width={s} height={s} viewBox="0 0 32 32"><Path d="M16 4l10 8-10 16-10-16z" fill={h} fillOpacity={0.15} stroke={c} strokeWidth={1.5} strokeLinejoin="round" /><Path d="M6 12h20" stroke={h} strokeWidth={1.2} strokeOpacity={0.5} /><Path d="M16 4l-4 8 4 16 4-16-4-8" stroke={h} strokeWidth={1} opacity={0.35} /></Svg>,
    // 임 — 파도: 파도 파랑
    '임': <Svg width={s} height={s} viewBox="0 0 32 32"><Path d="M2 14c3-3 5-3 8 0s5 3 8 0 5-3 8 0" stroke={h} strokeWidth={2} strokeLinecap="round" fill="none" /><Path d="M2 20c3-3 5-3 8 0s5 3 8 0 5-3 8 0" stroke={h} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.5} /><Path d="M4 25c3-2 4-2 7 0s4 2 7 0 4-2 7 0" stroke={h} strokeWidth={1} strokeLinecap="round" fill="none" opacity={0.3} /></Svg>,
    // 계 — 물방울: 방울 파랑
    '계': <Svg width={s} height={s} viewBox="0 0 32 32"><Path d="M16 4C16 4 8 14 8 20a8 8 0 0016 0c0-6-8-16-8-16z" fill={h} fillOpacity={0.2} stroke={c} strokeWidth={1.5} /><Path d="M13 22a4 3 0 006 0" stroke={h} strokeWidth={1.2} strokeLinecap="round" fill="none" opacity={0.5} /><SvgCircle cx={14} cy={19} r={1.2} fill={h} fillOpacity={0.45} /></Svg>,
  };
  return <>{icons[stem] ?? <Svg width={s} height={s} viewBox="0 0 32 32"><SvgCircle cx={16} cy={16} r={12} stroke={c} strokeWidth={1.5} fill={c} fillOpacity={0.1} /></Svg>}</>;
}

const SCREEN_W = Dimensions.get('window').width;
const isSmall = SCREEN_W < 380;
const SHARE_BASE_URL = 'https://dist-drab-ten-14.vercel.app/share';

function ShareIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7" stroke="#FFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 6l-4-4-4 4" stroke="#FFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 2v13" stroke="#FFF" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

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
const DAY_MASTER_IDENTITY: Record<string, { name: string; icon: string; element: string; nature: string; tagline: string }> = {
  '갑': { name: '갑목일주', icon: '\uD83C\uDF33', element: '목', nature: '큰 나무', tagline: '꺾이지 않는 대들보의 기운' },
  '을': { name: '을목일주', icon: '\uD83C\uDF3F', element: '목', nature: '풀과 꽃', tagline: '부드럽지만 끈질긴 생명력' },
  '병': { name: '병화일주', icon: '\u2600\uFE0F', element: '화', nature: '태양', tagline: '세상을 비추는 뜨거운 심장' },
  '정': { name: '정화일주', icon: '\uD83D\uDD6F\uFE0F', element: '화', nature: '촛불', tagline: '은은하지만 꺼지지 않는 불꽃' },
  '무': { name: '무토일주', icon: '\u26F0\uFE0F', element: '토', nature: '큰 산', tagline: '흔들리지 않는 대지의 중심' },
  '기': { name: '기토일주', icon: '\uD83C\uDF3E', element: '토', nature: '논밭', tagline: '품어서 키우는 어머니의 땅' },
  '경': { name: '경금일주', icon: '\u2694\uFE0F', element: '금', nature: '바위와 칼', tagline: '단단하고 날카로운 결단의 기운' },
  '신': { name: '신금일주', icon: '\uD83D\uDC8E', element: '금', nature: '보석', tagline: '갈고닦을수록 빛나는 원석' },
  '임': { name: '임수일주', icon: '\uD83C\uDF0A', element: '수', nature: '바다와 강', tagline: '거침없이 흐르는 자유로운 물결' },
  '계': { name: '계수일주', icon: '\uD83D\uDCA7', element: '수', nature: '이슬과 비', tagline: '조용히 스며드는 지혜의 물방울' },
};

export default function SajuResultScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<string, number>>({});
  const overviewY = useRef(0);
  const [showFloatingBtn, setShowFloatingBtn] = useState(false);
  const scrollY = useSharedValue(0);
  const storeResult = useFortuneStore().sajuResult;
  const r: any = storeResult;
  const { user } = useAuthStore();
  const pillars = useMemo(
    () => user
      ? calculateFourPillars(user.birthYear, user.birthMonth, user.birthDay, user.birthHour, undefined, undefined, undefined, user.isLunar)
      : (__DEV__ ? calculateFourPillars(1995, 8, 15, 10) : null),
    [user?.birthYear, user?.birthMonth, user?.birthDay, user?.birthHour, user?.isLunar]
  );

  const templateOverview = useMemo(() => {
    if (!pillars) return null;
    const dmIdx = pillars.day.stemIdx;
    const tenGods = {
      yearStem: getTenGod(dmIdx, pillars.year.stemIdx),
      monthStem: getTenGod(dmIdx, pillars.month.stemIdx),
      dayStem: '비견',
      hourStem: getTenGod(dmIdx, pillars.hour.stemIdx),
      yearBranch: getTenGodForBranch(dmIdx, pillars.year.branchIdx),
      monthBranch: getTenGodForBranch(dmIdx, pillars.month.branchIdx),
      dayBranch: getTenGodForBranch(dmIdx, pillars.day.branchIdx),
      hourBranch: getTenGodForBranch(dmIdx, pillars.hour.branchIdx),
    };
    const spiritStars = {
      yearBranch: getSpiritStar(pillars.day.branchIdx, pillars.year.branchIdx),
      monthBranch: getSpiritStar(pillars.day.branchIdx, pillars.month.branchIdx),
      dayBranch: getSpiritStar(pillars.day.branchIdx, pillars.day.branchIdx),
      hourBranch: getSpiritStar(pillars.day.branchIdx, pillars.hour.branchIdx),
    };
    return getOverviewFromTenGods(tenGods, spiritStars);
  }, [pillars]);

  if (!r) return (
    <View style={$.empty}><Text style={$.emptyText}>{t('result.noResult')}</Text><BackButton /></View>
  );

  const handleShare = async () => {
    const hookTitle = r.overview?.poeticTitle || r.headline || '사주 분석 결과';
    const lines: string[] = [];
    const ov = templateOverview ?? r.overview;
    if (ov?.personality) lines.push(`성격: ${ov.personality}`);
    if (ov?.career) lines.push(`직업: ${ov.career}`);
    if (ov?.wealth) lines.push(`재물: ${ov.wealth}`);
    if (ov?.love) lines.push(`연애: ${ov.love}`);
    const params = new URLSearchParams();
    params.set('type', 'saju');
    if (hookTitle) params.set('title', encodeURIComponent(hookTitle));
    if (lines[0]) params.set('summary', encodeURIComponent(lines[0]));
    const shareUrl = `${SHARE_BASE_URL}?${params.toString()}`;
    const shareText = `[명리 사주]\n\n${hookTitle}\n\n${lines.slice(0, 3).join('\n')}\n\n나도 보러가기 → ${shareUrl}`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({ title: '명리 사주', text: shareText });
      } else if (Platform.OS !== 'web') {
        await Share.share({ message: shareText, title: '명리 사주' });
      }
    } catch {}
  };

  const yearly = r.yearly2026 ?? r.yearlyFortune;
  const lucky = r.lucky ?? r.luckyElements;
  const final = r.finalWords ?? r.finalMessage;
  const { personality, career, wealth, love, health, daeun, lifePeriods, relationship, family } = r as any;
  const monthly: any[] | undefined = r.monthly2026 ?? r[`monthly${new Date().getFullYear()}`];

  let d = 0;
  const nd = () => { d += 30; return d; };

  return (
    <>
    <ScrollView
      ref={scrollRef}
      style={$.container}
      contentContainerStyle={$.content}
      showsVerticalScrollIndicator={false}
      onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = e.nativeEvent.contentOffset.y;
        scrollY.value = y;
        // 스크롤마다 state 업데이트 대신 값이 변경될 때만 업데이트
        const shouldShow = !!(r.overview && y > overviewY.current + 300);
        if (shouldShow !== showFloatingBtn) setShowFloatingBtn(shouldShow);
      }}
      scrollEventThrottle={32}
    >
      <View style={$.navBar}>
        <BackButton />
        <View style={$.navBrand}>
          <Text style={$.navLogo}>명리</Text>
          <Text style={$.navTagline}>사주 풀이</Text>
        </View>
        <View style={$.navSpacer} />
      </View>

      {/* ═══ HOOK HEADLINE ═══ */}
      <Animated.View entering={FadeInDown.delay(nd()).springify()}>
        <View style={$.hookHero}>
          {(() => {
            // poeticTitle=정의(큰글씨), hookQuestion=보충(서브). 질문이 title에 오면 swap
            let title = r.overview?.poeticTitle || (templateOverview as any)?.poeticTitle || r.headline || '';
            let sub = r.overview?.hookQuestion || (templateOverview as any)?.hookQuestion || '';
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
          <View style={$.hookAccent} />
        </View>
      </Animated.View>

      {/* ═══ 일주 정의 (총평 배지) ═══ */}
      {pillars && (() => {
        const identity = DAY_MASTER_IDENTITY[pillars.day.stem];
        if (!identity) return null;
        return (
          <Animated.View entering={FadeInDown.delay(nd()).springify()}>
            <View style={$.identityCard}>
              <View style={$.identityIconWrap}>
                <DayMasterAnim dayStem={STEM_KO_TO_HANJA[pillars.day.stem] ?? '甲'} size={44} />
              </View>
              <View style={$.identityBody}>
                <View style={$.identityNameRow}>
                  <Text style={$.identityName}>{identity.name}</Text>
                  <Text style={$.identityNature}>{identity.nature}의 사주</Text>
                </View>
                <Text style={$.identityTagline}>{identity.tagline}</Text>
              </View>
            </View>
          </Animated.View>
        );
      })()}

      {/* ═══ Overview (990사주 스타일) ═══ */}
      {(r.overview || templateOverview) && (() => {
        const ov = r.overview || templateOverview || {};
        return (
        <Animated.View entering={FadeInDown.delay(nd()).springify()} onLayout={(e) => { overviewY.current = e.nativeEvent.layout.y; }}>
          <SajuOverviewCard
            overview={ov}
            templateOverview={templateOverview ?? undefined}
            accentColor={pillars ? EL_COLORS[STEM_EL[pillars.day.stem] ?? 'earth'] : undefined}
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
          <GlassCard style={$.card}>
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
          <GlassCard style={$.card}>
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
              {lucky.color && <LuckyRow icon="彩" label="색상" val={lucky.color} />}
              {lucky.number && <LuckyRow icon="數" label="숫자" val={lucky.number} />}
              {lucky.direction && <LuckyRow icon="方" label="방위" val={lucky.direction} />}
            </View>
            {lucky.avoid && <View style={$.alertBox}><Text style={$.alertT}>{lucky.avoid}</Text></View>}
          </GlassCard>
        </Animated.View>
      )}

      {/* ═══ 마무리 ═══ */}
      {final && (
        <Animated.View entering={FadeInDown.delay(nd()).springify()}>
          <GlassCard style={{ marginTop: 24 }}>
            <Text style={$.finalQuote}>"</Text>
            <SajuText style={$.finalText}>{final}</SajuText>
          </GlassCard>
        </Animated.View>
      )}

      {/* ═══ 공유 섹션 ═══ */}
      <Animated.View entering={FadeInDown.delay(nd()).springify()}>
        <View style={$.shareSection}>
          <View style={$.shareDecoLine}>
            <View style={$.decoLineSide} />
            <Text style={$.decoChar}>命</Text>
            <View style={$.decoLineSide} />
          </View>

          <Text style={$.shareCta}>{'이 사주,\n혼자만 볼 거야?'}</Text>

          {(r.overview || templateOverview) && (() => {
            const items: { kanji: string; val: string }[] = [];
            const ov = templateOverview ?? r.overview;
            if (ov?.personality) items.push({ kanji: '性', val: ov.personality });
            if (ov?.career) items.push({ kanji: '業', val: ov.career });
            if (ov?.wealth) items.push({ kanji: '財', val: ov.wealth });
            if (ov?.love) items.push({ kanji: '緣', val: ov.love });
            if (ov?.health) items.push({ kanji: '體', val: ov.health });
            const top3 = items.slice(0, 3);
            return top3.length > 0 ? (
              <View style={$.sharePreview}>
                {top3.map((item, i) => (
                  <View key={i} style={$.shareRow}>
                    <Text style={$.shareKanji}>{item.kanji}</Text>
                    <Text style={$.shareVal} numberOfLines={1}>{item.val}</Text>
                  </View>
                ))}
              </View>
            ) : null;
          })()}

          <TouchableOpacity style={$.shareBtn} onPress={handleShare} activeOpacity={0.85}>
            <ShareIcon />
            <Text style={$.shareBtnText}>친구에게 공유하기</Text>
          </TouchableOpacity>

          <Text style={$.shareHint}>카카오톡, 인스타, 문자로 보내기</Text>
        </View>
      </Animated.View>

      <TouchableOpacity style={$.reBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/saju' as any)} activeOpacity={0.7}>
        <Text style={$.reBtnT}>{t('result.reAnalyze')}</Text>
      </TouchableOpacity>
      <Text style={$.disc}>{r.disclaimer || t('common.disclaimer')}</Text>
    </ScrollView>

    {showFloatingBtn && (
      <TouchableOpacity
        style={$.floatingBtn}
        activeOpacity={0.8}
        onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
      >
        <Text style={$.floatingBtnIcon}>{'\u2191'}</Text>
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
  content: { padding: isSmall ? 16 : 20, paddingTop: Platform.OS === 'ios' ? 52 : 44, paddingBottom: 80 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  navBrand: {
    flex: 1,
    alignItems: 'center',
  },
  navLogo: {
    fontSize: 15,
    fontWeight: '200',
    color: theme.colors.text.primary,
    letterSpacing: 4,
  },
  navTagline: {
    fontSize: 10,
    fontWeight: '400',
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
    marginTop: 1,
  },
  navSpacer: {
    width: 34,
  },
  empty: { flex: 1, backgroundColor: theme.colors.bg.primary, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: theme.colors.text.secondary, fontSize: 16 },

  // Identity card — 일주 정의
  identityCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 168, 75, 0.12)',
    gap: 16,
  },
  identityIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(212, 168, 75, 0.12)',
  },
  identityBody: {
    flex: 1,
  },
  identityNameRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    gap: 8,
    marginBottom: 3,
  },
  identityName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: theme.colors.text.primary,
    letterSpacing: -0.3,
  },
  identityNature: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: theme.colors.gold.primary,
  },
  identityTagline: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 19,
  },

  // Hook hero — 자극적 최상단
  hookHero: {
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 4,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  hookText: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text.primary,
    textAlign: 'center' as const,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  hookSub: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.gold.primary,
    textAlign: 'center' as const,
    marginTop: 8,
    zIndex: 1,
  },

  // Section title
  secWrap: { marginBottom: 6 },
  secRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text.primary, letterSpacing: -0.3 },
  secSub: { fontSize: 13, color: theme.colors.text.secondary, marginTop: 2, lineHeight: 20 },

  // Card & shared
  card: { marginTop: 16 },
  body: { fontSize: 15, color: theme.colors.text.secondary, lineHeight: 23 },
  sub: { fontSize: 14, fontWeight: '600', color: theme.colors.gold.primary, marginBottom: 3 },
  divider: { height: 1, backgroundColor: theme.colors.glass.border, marginVertical: 10 },
  // Highlight box
  hlBox: { marginTop: 6, backgroundColor: 'rgba(181,149,48,0.07)', borderRadius: 10, padding: 10 },
  hlLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: 2 },
  hlText: { fontSize: 14, color: theme.colors.text.secondary, lineHeight: 21 },

  // Alert box
  alertBox: { marginTop: 6, backgroundColor: 'rgba(196,148,61,0.06)', borderRadius: 8, padding: 8 },
  alertT: { fontSize: 13, color: theme.colors.warning, lineHeight: 19 },

  // Lists
  listWrap: { marginTop: 6, gap: 3 },
  listRow: { flexDirection: 'row', gap: 6 },
  bulletG: { fontSize: 14, fontWeight: '700', color: theme.colors.success, width: 14 },
  bulletO: { fontSize: 14, fontWeight: '700', color: theme.colors.warning, width: 14, textAlign: 'center' },
  listVal: { flex: 1, fontSize: 14, color: theme.colors.text.secondary, lineHeight: 21 },

  // Past guess
  pastCard: { marginTop: 8, borderLeftWidth: 2, borderLeftColor: theme.colors.gold.primary, paddingLeft: 10, gap: 4 },
  pastText: { fontSize: 14, color: theme.colors.gold.primary, lineHeight: 21, fontStyle: 'italic' },

  // Quarter grid
  qGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  qItem: { flex: 1, minWidth: 0, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 8 },
  qHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qPeriod: { fontSize: 11, fontWeight: '600', color: theme.colors.text.primary },
  qScore: { fontSize: 18, fontWeight: '700' },
  qBar: { height: 2, width: 20, borderRadius: 1, marginVertical: 4 },
  qKw: { fontSize: 11, fontWeight: '600', color: theme.colors.gold.primary },
  qDetail: { fontSize: 10, color: theme.colors.text.tertiary, lineHeight: 14, marginTop: 2 },

  // Lucky
  luckyGrid: { gap: 6 },
  luckyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 },
  luckyIcon: { fontSize: 14 },
  luckyLbl: { fontSize: 11, color: theme.colors.text.tertiary, width: 32 },
  luckyVal: { flex: 1, fontSize: 12, color: theme.colors.text.primary, fontWeight: '600' },

  // Final
  finalQuote: { fontSize: 22, fontWeight: '700', color: theme.colors.gold.primary, opacity: 0.3, marginBottom: -6 },
  finalText: { fontSize: 15, color: theme.colors.text.primary, lineHeight: 24, fontWeight: '500' },

  // Actions
  reBtn: { marginTop: 12, borderWidth: 1, borderColor: theme.colors.gold.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  reBtnT: { fontSize: 14, fontWeight: '600', color: theme.colors.gold.primary },
  disc: { fontSize: 9, color: theme.colors.text.tertiary, textAlign: 'center', lineHeight: 13, marginTop: 16, marginBottom: 8 },

  // Hook accent
  hookAccent: {
    width: 40,
    height: 2,
    backgroundColor: theme.colors.gold.primary,
    opacity: 0.3,
    borderRadius: 1,
    marginTop: 14,
  },

  // Share section
  shareSection: {
    marginTop: 28,
    backgroundColor: theme.colors.goldCard.bg,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center' as const,
  },
  shareDecoLine: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 20,
    alignSelf: 'stretch' as const,
  },
  decoLineSide: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(212, 168, 75, 0.25)',
  },
  decoChar: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: theme.colors.gold.primary,
    letterSpacing: 2,
    opacity: 0.5,
  },
  shareCta: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: theme.colors.goldCard.text,
    textAlign: 'center' as const,
    lineHeight: 32,
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  sharePreview: {
    alignSelf: 'stretch' as const,
    gap: 8,
    marginBottom: 24,
  },
  shareRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  shareKanji: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: theme.colors.gold.primary,
    width: 24,
    textAlign: 'center' as const,
  },
  shareVal: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500' as const,
    color: theme.colors.goldCard.textSecondary,
    lineHeight: 19,
  },
  shareBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: theme.colors.gold.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignSelf: 'stretch' as const,
  },
  shareBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  shareHint: {
    fontSize: 11,
    color: theme.colors.goldCard.textTertiary,
    marginTop: 10,
    letterSpacing: 0.5,
  },

  // Floating button
  floatingBtn: {
    position: 'absolute',
    bottom: 32,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 }),
  } as any,
  floatingBtnIcon: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: -1 },
});
