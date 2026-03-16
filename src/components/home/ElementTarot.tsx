import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withRepeat, withSequence, withTiming, withSpring, Easing, interpolate,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { useFortuneStore } from '../../stores/fortuneStore';
import { MetalIcon, WoodIcon, WaterIcon, FireIcon, EarthIcon } from '../icons/ElementIcons';
import { BriefcaseIcon, CoinIcon, HeartIcon } from '../icons/AnalysisIcons';
import { PremiumButton } from '../ui/PremiumButton';

// Lazy illustrations
const ILLUST: Record<string, React.FC<{ width?: number; height?: number }>> = {};
try { ILLUST.fire = require('../icons/tarot/FireIllust').FireIllust; } catch {}
try { ILLUST.water = require('../icons/tarot/WaterIllust').WaterIllust; } catch {}
try { ILLUST.wood = require('../icons/tarot/WoodIllust').WoodIllust; } catch {}
try { ILLUST.metal = require('../icons/tarot/MetalIllust').MetalIllust; } catch {}
try { ILLUST.earth = require('../icons/tarot/EarthIllust').EarthIllust; } catch {}

const CARD_W = 72;
const CARD_H = 105;
const G = '#E8B04A';

const ELEMENTS = ['metal', 'wood', 'water', 'fire', 'earth'] as const;
const ICON_MAP: Record<string, React.FC<{ size?: number; color?: string }>> = { metal: MetalIcon, wood: WoodIcon, water: WaterIcon, fire: FireIcon, earth: EarthIcon };

const ET: Record<string, { primary: string; accent: string; text: string; hanja: string; label: Record<string, string> }> = {
  metal: { primary: '#6B7B8D', accent: '#4A5A6A', text: '#5A6A7A', hanja: '金', label: { ko: '금(金)', en: 'Metal', ja: '金' } },
  wood:  { primary: '#5B7A4A', accent: '#486B38', text: '#4A6B3A', hanja: '木', label: { ko: '목(木)', en: 'Wood', ja: '木' } },
  water: { primary: '#3D6B8E', accent: '#2D5A7A', text: '#3A6580', hanja: '水', label: { ko: '수(水)', en: 'Water', ja: '水' } },
  fire:  { primary: '#B85450', accent: '#9A4440', text: '#A84A46', hanja: '火', label: { ko: '화(火)', en: 'Fire', ja: '火' } },
  earth: { primary: '#8B6E4E', accent: '#705840', text: '#7A6348', hanja: '土', label: { ko: '토(土)', en: 'Earth', ja: '土' } },
};

function getToday() { return new Date().toDateString(); }

/* ─── Mandala (카드 뒷면 장식) ─── */
function Mandala() {
  const s = 40, cx = 20, cy = 20, r = 16;
  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Circle cx={cx} cy={cy} r={r} stroke={G} strokeWidth={0.8} fill="none" opacity={0.5} />
      <Circle cx={cx} cy={cy} r={2} fill={G} opacity={0.6} />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <Line key={i} x1={cx + 4 * Math.cos(a)} y1={cy + 4 * Math.sin(a)} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke={G} strokeWidth={0.5} opacity={0.4} />;
      })}
    </Svg>
  );
}

/* ─── Float wrapper (Reanimated — float만) ─── */
function FloatWrap({ index, enabled, children }: { index: number; enabled: boolean; children: React.ReactNode }) {
  const y = useSharedValue(0);
  useEffect(() => {
    if (!enabled) return;
    y.value = withDelay(index * 500, withRepeat(withSequence(
      withTiming(-4, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      withTiming(4, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
    ), -1, true));
  }, [enabled]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

/* ─── Card component (Reanimated flip — 원본 동작 버전) ─── */
function TarotCard({ element, phase, isMe, index, onPress }: {
  element: string; phase: string; isMe: boolean; index: number; onPress: () => void;
}) {
  const t = ET[element] || ET.earth;
  const Icon = ICON_MAP[element] || EarthIcon;

  const moveY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const flipRot = useSharedValue(0);

  useEffect(() => {
    if (phase === 'selected' && isMe) {
      moveY.value = withTiming(-10, { duration: 200, easing: Easing.out(Easing.cubic) });
    }
    if (phase === 'fading' && !isMe) {
      opacity.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) });
      scale.value = withTiming(0.85, { duration: 400 });
    }
    if (phase === 'centering' && isMe) {
      scale.value = withTiming(1.5, { duration: 500, easing: Easing.inOut(Easing.cubic) });
      moveY.value = withTiming(0, { duration: 500 });
    }
    if (phase === 'flipping' && isMe) {
      flipRot.value = withTiming(180, { duration: 700, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    }
    if (phase === 'revealed' && isMe) {
      scale.value = withSpring(1.4, { damping: 18, stiffness: 100 });
    }
  }, [phase]);

  const cStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: moveY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));
  const fStyle = useAnimatedStyle(() => ({
    opacity: flipRot.value < 90 ? 1 : 0,
    transform: [{ perspective: 1200 }, { rotateY: `${flipRot.value}deg` }],
  }));
  const bStyle = useAnimatedStyle(() => ({
    opacity: flipRot.value >= 90 ? 1 : 0,
    transform: [{ perspective: 1200 }, { rotateY: `${flipRot.value - 180}deg` }],
  }));

  const isHidden = !isMe && (phase === 'revealed' || phase === 'analysis');
  if (isHidden) return null;

  return (
    <Animated.View style={[{ width: CARD_W, height: CARD_H, alignItems: 'center' }, cStyle]}>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={phase !== 'pick'} style={{ width: '100%', height: '100%' }}>
        {/* Back (dark) */}
        <Animated.View style={[$.cardBack, fStyle]}>
          <View style={$.innerFrame} />
          <Mandala />
          <Text style={$.backLabel}>五行</Text>
        </Animated.View>
        {/* Front */}
        <Animated.View style={[$.cardFront, { borderColor: t.primary }, bStyle]}>
          <View style={[$.colorBar, { backgroundColor: t.accent }]} />
          <Icon size={28} color={t.primary} />
          <Text style={[$.frontHanja, { color: t.text }]}>{t.hanja}</Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ═══ MAIN ═══ */
export function ElementTarot({ dayStemIdx }: { dayStemIdx: number }) {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'ko') as 'ko' | 'en' | 'ja';
  const router = useRouter();
  const store = useFortuneStore();

  const isAfternoon = new Date().getHours() >= 12;
  const today = getToday();

  // Store check
  const savedDate = isAfternoon ? store.tarotAfternoonDate : store.tarotMorningDate;
  const savedElement = isAfternoon ? store.tarotAfternoonElement : store.tarotMorningElement;
  const savedVariant = isAfternoon ? (store as any).tarotAfternoonVariant : (store as any).tarotMorningVariant;
  const alreadyPicked = savedDate === today && !!savedElement;

  // Shuffle (random each mount)
  const [resetKey, setResetKey] = useState(0);
  const shuffled = useMemo(() => {
    const arr = [...ELEMENTS];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [resetKey]);

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [phase, setPhase] = useState<'pick' | 'selected' | 'fading' | 'centering' | 'flipping' | 'revealed' | 'analysis'>('pick');
  const [expanded, setExpanded] = useState(false);
  const [result, setResult] = useState<{ element: string; variant: number } | null>(
    alreadyPicked ? { element: savedElement!, variant: savedVariant ?? 0 } : null
  );

  // Get analysis data
  let pool: any = null;
  try { pool = require('../../constants/tarotAnalysis').TAROT_POOL; } catch {}

  const selectedData = result && pool ? pool[result.element]?.[result.variant] : null;

  const handleSelect = (idx: number) => {
    if (phase !== 'pick') return;
    const element = shuffled[idx];
    const variants = pool?.[element];
    const variant = variants ? Math.floor(Math.random() * variants.length) : 0;

    setSelectedIdx(idx);
    setResult({ element, variant });
    setPhase('selected');

    // Store
    if (isAfternoon) {
      store.setTarotSession(today, idx, true);
      // Also save element + variant
      useFortuneStore.setState({ tarotAfternoonElement: element, tarotAfternoonVariant: variant } as any);
    } else {
      store.setTarotSession(today, idx, false);
      useFortuneStore.setState({ tarotMorningElement: element, tarotMorningVariant: variant } as any);
    }

    try { const H = require('expo-haptics'); H.impactAsync(H.ImpactFeedbackStyle.Medium); } catch {}

    setTimeout(() => setPhase('fading'), 200);
    setTimeout(() => setPhase('centering'), 600);
    setTimeout(() => setPhase('flipping'), 1100);
    setTimeout(() => setPhase('revealed'), 1800);
    setTimeout(() => setPhase('analysis'), 2200);
  };

  const handleReset = () => {
    store.setTarotSession('', -1, isAfternoon);
    useFortuneStore.setState(isAfternoon
      ? { tarotAfternoonElement: null, tarotAfternoonVariant: null } as any
      : { tarotMorningElement: null, tarotMorningVariant: null } as any
    );
    setSelectedIdx(null);
    setPhase('pick');
    setResult(null);
    setExpanded(false);
    setResetKey(k => k + 1);
  };

  const rTheme = result ? ET[result.element] || ET.earth : null;

  // ═══ 재방문: 접힌/펼친 요약 ═══
  if (alreadyPicked && result && selectedData && rTheme) {
    return (
      <View style={$.wrap}>
        <TouchableOpacity style={$.summaryBar} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
          {/* Mini card */}
          <View style={[$.miniCard, { borderColor: rTheme.primary }]}>
            <Text style={[$.miniHanja, { color: rTheme.primary }]}>{rTheme.hanja}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[$.summaryTitle, { color: rTheme.text }]}>오늘의 {rTheme.hanja} 기운 · {selectedData.keyword[lang] || selectedData.keyword.ko}</Text>
          </View>
          <Text style={$.expandIcon}>{expanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {expanded && (
          <View style={$.expandedContent}>
            <View style={[$.divider, { backgroundColor: rTheme.primary + '15' }]} />
            {[
              { icon: BriefcaseIcon, title: '직업운', text: selectedData.career },
              { icon: CoinIcon, title: '재물운', text: selectedData.wealth },
              { icon: HeartIcon, title: '관계운', text: selectedData.relationship },
            ].map((item, i) => (
              <View key={i} style={$.analysisItem}>
                <View style={$.analysisHeader}>
                  <item.icon size={16} color={rTheme.accent} />
                  <Text style={[$.analysisTitle, { color: rTheme.accent }]}>{item.title}</Text>
                </View>
                <Text style={$.analysisText}>{item.text[lang] || item.text.ko}</Text>
              </View>
            ))}
            <View style={[$.divider, { backgroundColor: rTheme.primary + '10' }]} />
            <Text style={$.ctaNote}>이건 {rTheme.hanja}의 일반적 기운이에요.</Text>
            <Text style={$.ctaQ}>나만의 정확한 분석이 궁금하다면?</Text>
            <PremiumButton title="내 사주 상세 분석" price="₩500" onPress={() => router.push('/(tabs)/saju' as any)} variant="shimmer" style={{ marginTop: 12 }} />
          </View>
        )}

        {__DEV__ && (
          <TouchableOpacity onPress={handleReset} style={$.devBtn}><Text style={$.devText}>다시 뽑기 (DEV)</Text></TouchableOpacity>
        )}
      </View>
    );
  }

  // ═══ 선택 모드 ═══
  return (
    <View style={$.wrap}>
      <Text style={$.title}>오행 타로</Text>
      {phase === 'pick' && <Text style={$.sub}>직감을 믿고 한 장을 선택하세요</Text>}

      {/* Row 1: 3장 */}
      <View style={$.row}>
        {shuffled.slice(0, 3).map((el, i) => (
          <FloatWrap key={`${el}-${resetKey}`} index={i} enabled={phase === 'pick'}>
            <TarotCard element={el} phase={phase} isMe={selectedIdx === i} index={i} onPress={() => handleSelect(i)} />
          </FloatWrap>
        ))}
      </View>
      {/* Row 2: 2장 */}
      <View style={$.row2}>
        {shuffled.slice(3).map((el, i) => (
          <FloatWrap key={`${el}-${resetKey}`} index={i + 3} enabled={phase === 'pick'}>
            <TarotCard element={el} phase={phase} isMe={selectedIdx === i + 3} index={i + 3} onPress={() => handleSelect(i + 3)} />
          </FloatWrap>
        ))}
      </View>

      {/* Analysis after flip */}
      {phase === 'analysis' && result && selectedData && rTheme && (
        <View style={$.postAnalysis}>
          <View style={[$.divider, { backgroundColor: rTheme.primary + '15' }]} />
          <Text style={[$.postTitle, { color: rTheme.text }]}>오늘의 {rTheme.hanja} 기운 · {selectedData.keyword[lang] || selectedData.keyword.ko}</Text>
          {[
            { icon: BriefcaseIcon, title: '직업운', text: selectedData.career },
            { icon: CoinIcon, title: '재물운', text: selectedData.wealth },
            { icon: HeartIcon, title: '관계운', text: selectedData.relationship },
          ].map((item, i) => (
            <View key={i} style={$.analysisItem}>
              <View style={$.analysisHeader}>
                <item.icon size={16} color={rTheme.accent} />
                <Text style={[$.analysisTitle, { color: rTheme.accent }]}>{item.title}</Text>
              </View>
              <Text style={$.analysisText}>{item.text[lang] || item.text.ko}</Text>
            </View>
          ))}
          <View style={[$.divider, { backgroundColor: rTheme.primary + '10' }]} />
          <Text style={$.ctaNote}>이건 {rTheme.hanja}의 일반적 기운이에요.</Text>
          <Text style={$.ctaQ}>나만의 정확한 분석이 궁금하다면?</Text>
          <PremiumButton title="내 사주 상세 분석" price="₩500" onPress={() => router.push('/(tabs)/saju' as any)} variant="shimmer" style={{ marginTop: 12 }} />
        </View>
      )}

      {__DEV__ && phase === 'analysis' && (
        <TouchableOpacity onPress={handleReset} style={$.devBtn}><Text style={$.devText}>다시 뽑기 (DEV)</Text></TouchableOpacity>
      )}
    </View>
  );
}

/* ═══ STYLES ═══ */
const $ = StyleSheet.create({
  wrap: { marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', textAlign: 'center', marginBottom: 4, letterSpacing: 1 },
  sub: { fontSize: 12, color: '#AAA', textAlign: 'center', marginBottom: 14 },
  row: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  row2: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 10 },

  // Card back
  cardBack: {
    position: 'absolute', top: 0, left: 0, width: CARD_W, height: CARD_H,
    borderRadius: 12, backgroundColor: '#1A150D', borderWidth: 1.5, borderColor: G,
    alignItems: 'center', justifyContent: 'center', backfaceVisibility: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 4px 14px rgba(196,145,46,0.2)' },
      default: { shadowColor: '#C4912E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 14, elevation: 6 },
    }),
  } as any,
  innerFrame: { position: 'absolute', top: 3, left: 3, right: 3, bottom: 3, borderRadius: 9, borderWidth: 0.5, borderColor: G + '25' },
  backLabel: { position: 'absolute', bottom: 6, fontSize: 8, color: G, opacity: 0.5, letterSpacing: 2 },

  // Card front
  cardFront: {
    position: 'absolute', top: 0, left: 0, width: CARD_W, height: CARD_H,
    borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1.5, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', backfaceVisibility: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 4px 14px rgba(0,0,0,0.08)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 4 },
    }),
  } as any,
  colorBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  frontHanja: { fontSize: 18, fontWeight: '600', marginTop: 4 },

  // Summary bar (재방문)
  summaryBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
    }),
  } as any,
  miniCard: {
    width: 36, height: 50, borderRadius: 8, backgroundColor: '#FFFFFF',
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  miniHanja: { fontSize: 14, fontWeight: '700' },
  summaryTitle: { fontSize: 14, fontWeight: '600' },
  expandIcon: { fontSize: 10, color: '#AAA' },

  // Expanded
  expandedContent: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18, marginTop: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },

  // Analysis items
  analysisItem: { marginBottom: 16 },
  analysisHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  analysisTitle: { fontSize: 14, fontWeight: '700' },
  analysisText: { fontSize: 13, color: '#444', lineHeight: 20 },
  divider: { height: 1, marginVertical: 10 },
  ctaNote: { fontSize: 12, color: '#AAA', textAlign: 'center' },
  ctaQ: { fontSize: 13, color: '#666', textAlign: 'center', fontWeight: '600', marginTop: 4 },

  // Post-flip analysis
  postAnalysis: { marginTop: 16, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  postTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, textAlign: 'center' },

  // Dev
  devBtn: { marginTop: 8, alignItems: 'center', padding: 6 },
  devText: { fontSize: 11, color: '#E85D4A', fontWeight: '600' },
});
