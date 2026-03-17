import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, withRepeat, withSequence,
  withSpring, Easing, interpolate,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { TAROT_POOL } from '../../constants/tarotData';
import { BriefcaseIcon, CoinIcon, HeartIcon } from '../icons/AnalysisIcons';
import { PremiumButton } from '../ui/PremiumButton';
import { FireIllust } from '../icons/tarot/FireIllust';
import { WaterIllust } from '../icons/tarot/WaterIllust';
import { WoodIllust } from '../icons/tarot/WoodIllust';
import { MetalIllust } from '../icons/tarot/MetalIllust';
import { EarthIllust } from '../icons/tarot/EarthIllust';
import { MetalIcon, WoodIcon, WaterIcon, FireIcon, EarthIcon } from '../icons/ElementIcons';

const CARD_W = 96;
const CARD_H = 156;
const G = '#D4A84B';
const ELEMENTS = ['metal', 'wood', 'water', 'fire', 'earth'] as const;
type Element = typeof ELEMENTS[number];

const EINFO: Record<string, {
  primary: string; bg: string; gradient: string[]; hanja: string;
  label: { ko: string; en: string; ja: string };
}> = {
  metal: { primary: '#6B7B8D', bg: '#ECEEF2', gradient: ['#F2F4F7', '#E6EAF0', '#D9DFE8'], hanja: '金', label: { ko: '금(金)', en: 'Metal', ja: '金' } },
  wood:  { primary: '#5B7A4A', bg: '#ECF3E6', gradient: ['#F2F6EE', '#E4EDD8', '#D6E4C8'], hanja: '木', label: { ko: '목(木)', en: 'Wood', ja: '木' } },
  water: { primary: '#3D6B8E', bg: '#EBF2F9', gradient: ['#EEF4F9', '#DCE8F2', '#CADCEC'], hanja: '水', label: { ko: '수(水)', en: 'Water', ja: '水' } },
  fire:  { primary: '#B85450', bg: '#FFF0EC', gradient: ['#F9F0EE', '#F2DDD8', '#EBCAC4'], hanja: '火', label: { ko: '화(火)', en: 'Fire', ja: '火' } },
  earth: { primary: '#8B6E4E', bg: '#F2EBDF', gradient: ['#F5F0E8', '#EBE0D2', '#E0D0BC'], hanja: '土', label: { ko: '토(土)', en: 'Earth', ja: '土' } },
};

const ELEM_ICONS: Record<string, React.FC<{ size?: number; color?: string }>> = {
  fire: FireIcon, water: WaterIcon, wood: WoodIcon, metal: MetalIcon, earth: EarthIcon,
};

const ILLUST_MAP: Record<string, React.FC<{ width?: number; height?: number; color?: string }>> = {
  fire: FireIllust, water: WaterIllust, wood: WoodIllust, metal: MetalIllust, earth: EarthIllust,
};

const STEM_WEAK: Record<number, Element> = {
  0: 'metal', 1: 'metal', 2: 'water', 3: 'water', 4: 'wood',
  5: 'wood', 6: 'fire', 7: 'fire', 8: 'earth', 9: 'earth',
};

function getToday() { return new Date().toISOString().slice(0, 10); }

/* ─── Mandala ─── */
function Mandala() {
  const s = 64, c = 32;
  const r1 = 26, r2 = 18, r3 = 10;
  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {/* Outer ring */}
      <Circle cx={c} cy={c} r={r1} stroke={G} strokeWidth={0.6} fill="none" opacity={0.35} />
      {/* Middle ring */}
      <Circle cx={c} cy={c} r={r2} stroke={G} strokeWidth={0.4} fill="none" opacity={0.25} />
      {/* Inner ring */}
      <Circle cx={c} cy={c} r={r3} stroke={G} strokeWidth={0.4} fill="none" opacity={0.20} />
      {/* Center dot */}
      <Circle cx={c} cy={c} r={2} fill={G} opacity={0.5} />
      {/* 8 radial lines — outer */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <Line key={`o${i}`} x1={c + r3 * Math.cos(a)} y1={c + r3 * Math.sin(a)} x2={c + r1 * Math.cos(a)} y2={c + r1 * Math.sin(a)} stroke={G} strokeWidth={0.35} opacity={i % 2 === 0 ? 0.4 : 0.2} />;
      })}
      {/* 8 small dots on middle ring */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = ((i + 0.5) / 8) * Math.PI * 2;
        return <Circle key={`d${i}`} cx={c + r2 * Math.cos(a)} cy={c + r2 * Math.sin(a)} r={1} fill={G} opacity={0.3} />;
      })}
      {/* 4 petal arcs between inner and middle */}
      {Array.from({ length: 4 }).map((_, i) => {
        const a1 = (i / 4) * Math.PI * 2;
        const a2 = ((i + 0.5) / 4) * Math.PI * 2;
        const a3 = ((i + 1) / 4) * Math.PI * 2;
        const x1 = c + r3 * Math.cos(a1), y1 = c + r3 * Math.sin(a1);
        const xm = c + (r2 + 2) * Math.cos(a2), ym = c + (r2 + 2) * Math.sin(a2);
        const x2 = c + r3 * Math.cos(a3), y2 = c + r3 * Math.sin(a3);
        return <Path key={`p${i}`} d={`M${x1},${y1} Q${xm},${ym} ${x2},${y2}`} stroke={G} strokeWidth={0.4} fill="none" opacity={0.25} />;
      })}
    </Svg>
  );
}

/* ─── Shimmer ─── */
function ShimmerOverlay() {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withSequence(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      withDelay(1500, withTiming(0, { duration: 0 })),
    ), -1);
  }, []);
  const s = useAnimatedStyle(() => ({
    left: `${interpolate(p.value, [0, 1], [-30, 130])}%` as any,
    opacity: interpolate(p.value, [0, 0.15, 0.5, 0.85, 1], [0, 0.8, 1, 0.8, 0]),
  }));
  return <Animated.View style={[{ position: 'absolute', top: 0, width: '35%', height: '100%', backgroundColor: 'rgba(212,168,75,0.1)', transform: [{ skewX: '-12deg' }] }, s]} />;
}

/* ─── Float ─── */
function FloatWrap({ index, on, children }: { index: number; on: boolean; children: React.ReactNode }) {
  const y = useSharedValue(0);
  useEffect(() => {
    if (!on) { y.value = withTiming(0, { duration: 200 }); return; }
    y.value = withDelay(index * 400, withRepeat(withSequence(
      withTiming(-4, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      withTiming(4, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
    ), -1, true));
  }, [on]);
  const s = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={s}>{children}</Animated.View>;
}

/* ─── Card Back ─── */
function CardBack() {
  return (
    <View style={[$.cardBack, { backgroundColor: '#1A150A' }]}>
      <View style={$.outerBorder}>
        <View style={$.innerFrame}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Mandala />
          </View>
          <Text style={$.backLabel}>五行</Text>
        </View>
      </View>
      <ShimmerOverlay />
    </View>
  );
}

/* ─── Inner Frame SVG ─── */
function InnerFrame({ w, h, color }: { w: number; h: number; color: string }) {
  const I = 4, v = 10;
  const L = I, T = I, R = w - I, B = h - I;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={StyleSheet.absoluteFill}>
      <Rect x={L} y={T} width={R - L} height={B - T} rx={2} stroke={color} strokeWidth={0.4} fill="none" opacity={0.3} />
      {/* Top-left */}
      <Path d={`M ${L} ${T + v} C ${L} ${T + 3} ${L + 3} ${T} ${L + v} ${T}`} stroke={color} strokeWidth={0.5} fill="none" opacity={0.5} />
      <Path d={`M ${L + 4} ${T + 4} C ${L + 3} ${T + 6} ${L + 3} ${T + 8} ${L + 5} ${T + 9}`} stroke={color} strokeWidth={0.35} fill="none" opacity={0.3} />
      <Circle cx={L + 5} cy={T + 10} r={0.8} fill={color} opacity={0.3} />
      {/* Top-right */}
      <Path d={`M ${R} ${T + v} C ${R} ${T + 3} ${R - 3} ${T} ${R - v} ${T}`} stroke={color} strokeWidth={0.5} fill="none" opacity={0.5} />
      <Path d={`M ${R - 4} ${T + 4} C ${R - 3} ${T + 6} ${R - 3} ${T + 8} ${R - 5} ${T + 9}`} stroke={color} strokeWidth={0.35} fill="none" opacity={0.3} />
      <Circle cx={R - 5} cy={T + 10} r={0.8} fill={color} opacity={0.3} />
      {/* Bottom-left */}
      <Path d={`M ${L} ${B - v} C ${L} ${B - 3} ${L + 3} ${B} ${L + v} ${B}`} stroke={color} strokeWidth={0.5} fill="none" opacity={0.5} />
      <Path d={`M ${L + 4} ${B - 4} C ${L + 3} ${B - 6} ${L + 3} ${B - 8} ${L + 5} ${B - 9}`} stroke={color} strokeWidth={0.35} fill="none" opacity={0.3} />
      <Circle cx={L + 5} cy={B - 10} r={0.8} fill={color} opacity={0.3} />
      {/* Bottom-right */}
      <Path d={`M ${R} ${B - v} C ${R} ${B - 3} ${R - 3} ${B} ${R - v} ${B}`} stroke={color} strokeWidth={0.5} fill="none" opacity={0.5} />
      <Path d={`M ${R - 4} ${B - 4} C ${R - 3} ${B - 6} ${R - 3} ${B - 8} ${R - 5} ${B - 9}`} stroke={color} strokeWidth={0.35} fill="none" opacity={0.3} />
      <Circle cx={R - 5} cy={B - 10} r={0.8} fill={color} opacity={0.3} />
    </Svg>
  );
}

/* ─── Divider with diamond ─── */
function DiamondDivider({ w, color }: { w: number; color: string }) {
  const half = w * 0.3;
  const mid = w / 2;
  return (
    <Svg width={w} height={6} viewBox={`0 0 ${w} 6`}>
      <Line x1={mid - half} y1={3} x2={mid - 3} y2={3} stroke={color} strokeWidth={0.4} opacity={0.15} />
      <Path d={`M ${mid} 1 L ${mid + 2.5} 3 L ${mid} 5 L ${mid - 2.5} 3 Z`} fill={color} opacity={0.3} />
      <Line x1={mid + 3} y1={3} x2={mid + half} y2={3} stroke={color} strokeWidth={0.4} opacity={0.15} />
    </Svg>
  );
}

/* ─── Card Front (Premium) ─── */
function CardFront({ element, keyword, message, label, revealed }: {
  element: string; keyword: string; message: string; label: string; revealed: boolean;
}) {
  const info = EINFO[element] || EINFO.earth;
  const Illust = ILLUST_MAP[element];
  const ElemIcon = ELEM_ICONS[element];

  // Entrance animation
  const prog = useSharedValue(0);
  useEffect(() => {
    if (revealed) {
      prog.value = withDelay(300, withTiming(1, { duration: 1000, easing: Easing.out(Easing.ease) }));
    }
  }, [revealed]);

  const frameAnim = useAnimatedStyle(() => ({ opacity: interpolate(prog.value, [0, 0.1, 0.2], [0, 0, 1]) }));
  const illustAnim = useAnimatedStyle(() => ({
    opacity: interpolate(prog.value, [0, 0.08, 0.35], [0, 0, 1]),
    transform: [{ scale: interpolate(prog.value, [0, 0.08, 0.35, 1], [0.92, 0.92, 1, 1]) }],
  }));
  const dividerAnim = useAnimatedStyle(() => ({
    opacity: interpolate(prog.value, [0, 0.3, 0.5], [0, 0, 1]),
    transform: [{ scaleX: interpolate(prog.value, [0, 0.3, 0.5, 1], [0, 0, 1, 1]) }],
  }));
  const hanjaAnim = useAnimatedStyle(() => ({ opacity: interpolate(prog.value, [0, 0.45, 0.6], [0, 0, 1]) }));
  const kwAnim = useAnimatedStyle(() => ({ opacity: interpolate(prog.value, [0, 0.5, 0.65], [0, 0, 1]) }));
  const msgAnim = useAnimatedStyle(() => ({ opacity: interpolate(prog.value, [0, 0.6, 0.8], [0, 0, 1]) }));
  const bottomAnim = useAnimatedStyle(() => ({ opacity: interpolate(prog.value, [0, 0.8, 1], [0, 0, 1]) }));

  return (
    <View style={[$.cardFront, { backgroundColor: '#FFFFFF' }]}>
      {/* Decorative frame */}
      <Animated.View style={[StyleSheet.absoluteFill, frameAnim]}>
        <InnerFrame w={CARD_W} h={CARD_H} color={G} />
      </Animated.View>

      <View style={$.frontContent}>
        {/* Illustration */}
        <Animated.View style={[$.frontIllustWrap, illustAnim]}>
          {Illust && <Illust width={48} height={48} color={info.primary} />}
        </Animated.View>

        {/* Divider */}
        <Animated.View style={[{ alignItems: 'center', marginTop: 3 }, dividerAnim]}>
          <DiamondDivider w={60} color={info.primary} />
        </Animated.View>

        {/* Hanja + label */}
        <Animated.View style={[{ alignItems: 'center', marginTop: 2 }, hanjaAnim]}>
          <Text style={[$.fHanja, { color: info.primary }]}>{info.hanja}</Text>
          <Text style={[$.fLabel, { color: info.primary }]}>{label || info.label.ko}</Text>
        </Animated.View>

        {/* Keyword with side lines */}
        <Animated.View style={[$.fKwRow, kwAnim]}>
          <View style={[$.fKwLine, { backgroundColor: info.primary + '33' }]} />
          <View style={[$.fKwDot, { backgroundColor: info.primary + '40' }]} />
          <Text style={[$.fKw, { color: info.primary }]}>{keyword || ''}</Text>
          <View style={[$.fKwDot, { backgroundColor: info.primary + '40' }]} />
          <View style={[$.fKwLine, { backgroundColor: info.primary + '33' }]} />
        </Animated.View>

        {/* Message */}
        <Animated.View style={[{ marginTop: 2, paddingHorizontal: 6 }, msgAnim]}>
          <Text style={$.fMsg}>{message || ''}</Text>
        </Animated.View>

        <View style={{ flex: 1 }} />

        {/* Bottom symbol */}
        <Animated.View style={[{ alignItems: 'center', marginBottom: 4 }, bottomAnim]}>
          {ElemIcon && <ElemIcon size={10} color={info.primary + '50'} />}
        </Animated.View>
      </View>
    </View>
  );
}

/* ─── Analysis Item ─── */
function AnalysisItemAnimated({ Icon, title, text, color, delay }: {
  Icon: React.FC<{ size?: number; color?: string }>; title: string; text: string; color: string; delay: number;
}) {
  const op = useSharedValue(0);
  useEffect(() => { op.value = withDelay(delay, withTiming(1, { duration: 400 })); }, []);
  const s = useAnimatedStyle(() => ({ opacity: op.value }));
  return (
    <Animated.View style={[$.aItem, s]}>
      <View style={$.aHeader}><Icon size={16} color={color} /><Text style={[$.aTitle, { color }]}>{title}</Text></View>
      <Text style={$.aText}>{text}</Text>
    </Animated.View>
  );
}

/* ─── Analysis Content ─── */
function AnalysisContent({ element, variant, dayStemIdx, lang, onPurchase }: {
  element: string; variant: number; dayStemIdx: number; lang: 'ko' | 'en' | 'ja'; onPurchase: () => void;
}) {
  const info = EINFO[element] || EINFO.earth;
  const data = TAROT_POOL[element]?.[variant];
  if (!data) return null;

  const weakest = STEM_WEAK[dayStemIdx % 10] || 'earth';
  const isMatch = weakest === element;
  const matchPct = useMemo(() => isMatch ? 82 + Math.floor(Math.random() * 15) : 0, [isMatch]);

  const items = [
    { Icon: BriefcaseIcon, title: lang === 'en' ? 'Career' : lang === 'ja' ? '職業運' : '직업운', text: data.career[lang] || data.career.ko },
    { Icon: CoinIcon, title: lang === 'en' ? 'Wealth' : lang === 'ja' ? '財運' : '재물운', text: data.wealth[lang] || data.wealth.ko },
    { Icon: HeartIcon, title: lang === 'en' ? 'Relationships' : lang === 'ja' ? '関係運' : '관계운', text: data.relationship[lang] || data.relationship.ko },
  ];

  return (
    <View style={$.analysisWrap}>
      {isMatch && (
        <View style={$.matchBadge}>
          <Text style={$.matchBadgeText}>{'✦ '}{lang === 'en' ? 'Intuition hit!' : lang === 'ja' ? '直感的中！' : '직감 적중!'} {matchPct}%</Text>
          <Text style={$.matchSub}>
            {lang === 'ko' ? `내 사주에 부족한 ${info.label.ko}을 직감으로 선택했어요` :
             lang === 'ja' ? `四柱で不足している${info.label.ja}を直感で選びました` :
             `You intuitively picked ${info.label.en}, which your chart lacks`}
          </Text>
        </View>
      )}
      <Text style={[$.analysisMainTitle, { color: info.primary }]}>
        {lang === 'en' ? `Today's ${info.hanja} Energy` : lang === 'ja' ? `今日の${info.hanja}の気` : `오늘의 ${info.hanja} 기운`}
      </Text>
      <View style={[$.divider, { backgroundColor: info.primary + '20' }]} />
      {items.map((item, i) => (
        <AnalysisItemAnimated key={i} Icon={item.Icon} title={item.title} text={item.text} color={info.primary} delay={i * 150} />
      ))}
      <View style={[$.divider, { backgroundColor: info.primary + '10' }]} />
      <Text style={$.ctaNote}>
        {lang === 'ko' ? `이건 ${info.hanja}의 일반적 기운이에요.` : lang === 'ja' ? `これは${info.hanja}の一般的な気です。` : `This is the general energy of ${info.hanja}.`}
      </Text>
      <Text style={$.ctaQ}>
        {lang === 'ko' ? '내 사주에 맞는 정확한 분석은?' : lang === 'ja' ? '私の四柱に合った正確な分析は？' : 'Want analysis tailored to your birth chart?'}
      </Text>
      <PremiumButton title={lang === 'ko' ? '내 사주 상세 분석 · ₩770' : lang === 'ja' ? '四柱詳細分析 · ¥770' : 'Detailed Saju Analysis · $0.99'} onPress={onPurchase} variant="shimmer" style={{ marginTop: 12 }} />
    </View>
  );
}

/* ═══ ANIMATED CARD — always mounted, never unmounted ═══ */
const GAP = 10;
// Pre-compute how far each position is from row center
function getCenterOffsetX(indexInRow: number, rowSize: number): number {
  const totalW = rowSize * CARD_W + (rowSize - 1) * GAP;
  const rowCenter = totalW / 2;
  const cardCenter = indexInRow * (CARD_W + GAP) + CARD_W / 2;
  return rowCenter - cardCenter;
}

function AnimCard({ element, isMe, isOther, phase, onPress, resetKey, centerOffsetX, centerOffsetY, keyword, message, label }: {
  element: string; isMe: boolean; isOther: boolean; phase: string; onPress: () => void; resetKey: number; centerOffsetX: number; centerOffsetY: number; keyword: string; message: string; label: string;
}) {
  const liftY = useSharedValue(0);
  const moveX = useSharedValue(0);
  const moveY = useSharedValue(0);
  const scale = useSharedValue(1);
  const flipProg = useSharedValue(0);
  const otherOp = useSharedValue(1);
  const otherSc = useSharedValue(1);

  useEffect(() => {
    if (isMe) {
      if (phase === 'selected') {
        liftY.value = withTiming(-14, { duration: 200, easing: Easing.out(Easing.cubic) });
      } else if (phase === 'centering') {
        liftY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
        moveX.value = withTiming(centerOffsetX, { duration: 600, easing: Easing.inOut(Easing.cubic) });
        moveY.value = withTiming(centerOffsetY, { duration: 600, easing: Easing.inOut(Easing.cubic) });
        scale.value = withTiming(2.3, { duration: 600, easing: Easing.inOut(Easing.cubic) });
      } else if (phase === 'flipping') {
        flipProg.value = withTiming(1, { duration: 900, easing: Easing.inOut(Easing.cubic) });
      } else if (phase === 'landed') {
        scale.value = withSpring(2.15, { damping: 22, stiffness: 100 });
        try { const H = require('expo-haptics'); H.impactAsync(H.ImpactFeedbackStyle.Light); } catch {}
      }
    }
    if (isOther) {
      if (phase === 'fading') {
        otherOp.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) });
        otherSc.value = withTiming(0.85, { duration: 400 });
      }
    }
  }, [phase, isMe, isOther]);

  useEffect(() => {
    liftY.value = 0;
    moveX.value = 0;
    moveY.value = 0;
    scale.value = 1;
    flipProg.value = 0;
    otherOp.value = 1;
    otherSc.value = 1;
  }, [resetKey]);

  const containerStyle = useAnimatedStyle(() => {
    if (isMe) {
      const extraH = (scale.value - 1) * CARD_H * 0.5;
      return {
        transform: [
          { translateX: moveX.value },
          { translateY: liftY.value + moveY.value + extraH },
          { scale: scale.value },
          { scaleX: interpolate(flipProg.value, [0, 0.5, 1], [1, 0.02, 1]) },
        ],
        zIndex: 10,
        opacity: 1,
      };
    }
    return {
      transform: [{ scale: otherSc.value }],
      opacity: otherOp.value,
      zIndex: 1,
    };
  });

  const backOp = useAnimatedStyle(() => ({
    opacity: interpolate(flipProg.value, [0, 0.49, 0.5, 1], [1, 1, 0, 0]),
  }));
  const frontOp = useAnimatedStyle(() => ({
    opacity: interpolate(flipProg.value, [0, 0.49, 0.5, 1], [0, 0, 1, 1]),
  }));

  // After centering, hide other cards completely
  const gone = isOther && (phase === 'centering' || phase === 'flipping' || phase === 'landed' || phase === 'analysis');

  return (
    <Animated.View style={[{ width: CARD_W, height: CARD_H }, containerStyle, gone && { opacity: 0 }]}>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={phase !== 'pick'} style={{ width: '100%', height: '100%' }}>
        {/* Back face */}
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width: CARD_W, height: CARD_H }, backOp]}>
          <CardBack />
        </Animated.View>
        {/* Front face — always rendered but invisible until flip */}
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width: CARD_W, height: CARD_H }, frontOp]}>
          <CardFront element={element} keyword={keyword} message={message} label={label}
            revealed={isMe && (phase === 'flipping' || phase === 'landed' || phase === 'analysis')} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ═══ MAIN ═══ */
type Phase = 'pick' | 'selected' | 'fading' | 'centering' | 'flipping' | 'landed' | 'analysis';

export function ElementTarot({ dayStemIdx, onCardSelect, onPurchase }: { dayStemIdx: number; onCardSelect?: () => void; onPurchase?: () => void }) {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'ko') as 'ko' | 'en' | 'ja';

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
  const [phase, setPhase] = useState<Phase>('pick');
  const [result, setResult] = useState<{ element: string; variant: number } | null>(null);
  const [expanded, setExpanded] = useState(false);

  const pendingResult = React.useRef<{ element: string; variant: number } | null>(null);

  const handleSelect = useCallback((idx: number) => {
    if (phase !== 'pick') return;
    const element = shuffled[idx];
    const variants = TAROT_POOL[element];
    const variant = variants ? Math.floor(Math.random() * variants.length) : 0;

    setSelectedIdx(idx);
    setResult({ element, variant });
    pendingResult.current = { element, variant };

    try { const H = require('expo-haptics'); H.impactAsync(H.ImpactFeedbackStyle.Medium); } catch {}

    setPhase('selected');
    onCardSelect?.();
    setTimeout(() => setPhase('fading'), 200);
    setTimeout(() => setPhase('centering'), 500);
    setTimeout(() => setPhase('flipping'), 1100);
    setTimeout(() => setPhase('landed'), 1900);
    setTimeout(() => {
      pendingResult.current = null;
      setPhase('analysis');
    }, 2200);
  }, [phase, shuffled, onCardSelect]);

  const handleReset = useCallback(() => {
    setSelectedIdx(null);
    setPhase('pick');
    setResult(null);
    setExpanded(false);
    setResetKey(k => k + 1);
  }, []);

  // Compute variant data for selected card
  const variantData = result ? TAROT_POOL[result.element]?.[result.variant] : null;
  const selKeyword = variantData ? (variantData.keyword[lang] || variantData.keyword.ko) : '';
  const selMessage = variantData ? (variantData.message[lang] || variantData.message.ko) : '';
  const selLabel = result ? (EINFO[result.element]?.label[lang] || EINFO[result.element]?.label.ko || '') : '';

  // ═══ 선택 모드 — rows always rendered ═══
  return (
    <View style={$.wrap}>
      <Text style={$.title}>{lang === 'ko' ? '오행 타로' : lang === 'ja' ? '五行タロット' : 'Five Elements Tarot'}</Text>
      {phase === 'pick' && (
        <Text style={$.sub}>{lang === 'ko' ? '직감을 믿고 한 장을 선택하세요' : lang === 'ja' ? '直感を信じて一枚選んでください' : 'Trust your intuition and pick one card'}</Text>
      )}

      {/* Row 1: 3 cards */}
      <View style={$.row}>
        {shuffled.slice(0, 3).map((el, i) => (
          <FloatWrap key={`${el}-${resetKey}`} index={i} on={phase === 'pick'}>
            <AnimCard element={el} isMe={selectedIdx === i} isOther={selectedIdx !== null && selectedIdx !== i}
              phase={phase} onPress={() => handleSelect(i)} resetKey={resetKey}
              centerOffsetX={getCenterOffsetX(i, 3)} centerOffsetY={0}
              keyword={selectedIdx === i ? selKeyword : ''} message={selectedIdx === i ? selMessage : ''} label={selectedIdx === i ? selLabel : ''} />
          </FloatWrap>
        ))}
      </View>

      {/* Row 2: 2 cards */}
      <View style={$.row2}>
        {shuffled.slice(3).map((el, i) => (
          <FloatWrap key={`${el}-${resetKey}`} index={i + 3} on={phase === 'pick'}>
            <AnimCard element={el} isMe={selectedIdx === i + 3} isOther={selectedIdx !== null && selectedIdx !== i + 3}
              phase={phase} onPress={() => handleSelect(i + 3)} resetKey={resetKey}
              centerOffsetX={getCenterOffsetX(i, 2)} centerOffsetY={-(CARD_H + 8)}
              keyword={selectedIdx === i + 3 ? selKeyword : ''} message={selectedIdx === i + 3 ? selMessage : ''} label={selectedIdx === i + 3 ? selLabel : ''} />
          </FloatWrap>
        ))}
      </View>

      {/* Spacer for scaled card */}
      {phase !== 'pick' && phase !== 'selected' && phase !== 'fading' && (
        <View style={{ height: 4 }} />
      )}

      {/* Analysis */}
      {phase === 'analysis' && result && variantData && (
        <AnalysisContent element={result.element} variant={result.variant} dayStemIdx={dayStemIdx} lang={lang} onPurchase={() => onPurchase?.()} />
      )}
      {phase === 'analysis' && (
        <TouchableOpacity onPress={handleReset} style={$.redrawBtn} activeOpacity={0.7}>
          <Text style={$.redrawText}>{lang === 'ko' ? '다시 뽑기' : lang === 'ja' ? 'もう一度引く' : 'Draw again'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ═══ STYLES ═══ */
const $ = StyleSheet.create({
  wrap: { marginBottom: 8, overflow: 'visible' },
  title: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', textAlign: 'center', marginBottom: 6, letterSpacing: 1 },
  sub: { fontSize: 12, color: '#AAA', textAlign: 'center', marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'center', gap: 10, overflow: 'visible' },
  row2: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 8, overflow: 'visible' },

  // Card back
  cardBack: {
    width: CARD_W, height: CARD_H, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1.2, borderColor: G + 'AA',
    ...Platform.select({
      web: { boxShadow: '0 6px 20px rgba(139,117,48,0.25)' },
      default: { shadowColor: '#8B7530', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 8 },
    }),
  } as any,
  outerBorder: { flex: 1, margin: 5, borderRadius: 10, borderWidth: 0.4, borderColor: G + '40', overflow: 'hidden' },
  innerFrame: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 6 },
  backLabel: { fontSize: 11, color: G, opacity: 0.45, letterSpacing: 6, fontWeight: '300', marginTop: 6 },

  // Card front (premium)
  cardFront: {
    width: CARD_W, height: CARD_H, borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(212,168,75,0.15)',
    ...Platform.select({
      web: { boxShadow: '0 6px 20px rgba(212,168,75,0.35)' },
      default: { shadowColor: '#D4A84B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
    }),
  } as any,
  frontContent: {
    flex: 1, alignItems: 'center', paddingTop: 6, paddingBottom: 2, paddingHorizontal: 4,
  },
  frontIllustWrap: { marginTop: 0 },
  fHanja: { fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  fLabel: { fontSize: 5, opacity: 0.6, marginTop: 0 },
  fKwRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  fKwLine: { width: 10, height: 0.5 },
  fKwDot: { width: 2, height: 2, borderRadius: 1 },
  fKw: { fontSize: 7, fontWeight: '700', letterSpacing: 0.5 },
  fMsg: { fontSize: 5, color: '#555', lineHeight: 7.5, textAlign: 'center' },

  // Summary (revisit)
  summaryBar: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFF', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
    }),
  } as any,
  // Mini card — black & gold premium
  miniCard: {
    width: 42, height: 58, borderRadius: 10,
    backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 0 10px rgba(212,168,75,0.45)' },
      default: { shadowColor: G, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.45, shadowRadius: 10, elevation: 6 },
    }),
  } as any,
  miniHanja: { fontSize: 20, fontWeight: '700', color: G },
  summaryTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  summaryKeyword: { fontSize: 12, color: '#888', marginTop: 2, fontWeight: '500' },
  expandIcon: { fontSize: 12, color: '#AAA' },
  afternoonHint: { fontSize: 13, color: '#E8B04A', textAlign: 'center', marginTop: 10, fontWeight: '500' },

  // Analysis
  analysisWrap: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginTop: 6,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
    }),
  } as any,
  matchBadge: {
    backgroundColor: '#FFF9EE', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#D4A84B30', alignItems: 'center',
  },
  matchBadgeText: { fontSize: 16, color: '#D4A84B', fontWeight: '800', textAlign: 'center', letterSpacing: 0.5 },
  matchSub: { fontSize: 12, color: '#B8942F', textAlign: 'center', marginTop: 4, lineHeight: 17 },
  missText: { fontSize: 12, color: '#AAA', textAlign: 'center', marginBottom: 8 },
  analysisMainTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  divider: { height: 1, marginVertical: 10 },
  aItem: { marginBottom: 16 },
  aHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  aTitle: { fontSize: 14, fontWeight: '700' },
  aText: { fontSize: 13, color: '#444', lineHeight: 20 },
  ctaNote: { fontSize: 12, color: '#AAA', textAlign: 'center' },
  ctaQ: { fontSize: 13, color: '#666', textAlign: 'center', fontWeight: '600', marginTop: 4 },

  redrawBtn: { marginTop: 14, alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 16 },
  redrawText: { fontSize: 12, color: '#AAA', fontWeight: '400', letterSpacing: 0.5 },
  devBtn: { marginTop: 8, alignItems: 'center', padding: 6 },
  devText: { fontSize: 11, color: '#E85D4A', fontWeight: '600' },
});
