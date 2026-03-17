import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withDelay, Easing, interpolate,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Line, Ellipse, Rect } from 'react-native-svg';

// ─── Helper: looping oscillation ───
function useOsc(duration: number, delay = 0) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withRepeat(withSequence(
      withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
    ), -1, true));
  }, []);
  return v;
}

// Animated.View wrapper that overlays on top of a static SVG base
// Each animation wraps the ENTIRE Svg in an Animated.View for web compat

// ═══════════════════════════════════════
// 甲 — 큰 나무: 전체 살짝 흔들림
// ═══════════════════════════════════════
function GapMok({ s }: { s: number }) {
  const C = '#5B7A4A';
  const osc = useOsc(2500);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(osc.value, [0, 1], [-2, 2])}deg` }],
  }));
  return (
    <Animated.View style={[{ width: s, height: s }, style]}>
      <Svg width={s} height={s} viewBox="0 0 48 48">
        <Path d="M24 44 L24 18" stroke={C} strokeWidth={2.5} strokeLinecap="round" />
        <Path d="M24 28 L16 22" stroke={C} strokeWidth={1.5} strokeLinecap="round" />
        <Path d="M24 28 L32 22" stroke={C} strokeWidth={1.5} strokeLinecap="round" />
        <Path d="M24 22 L20 16" stroke={C} strokeWidth={1.2} strokeLinecap="round" />
        <Ellipse cx={24} cy={10} rx={4} ry={2.5} fill={C} opacity={0.7} />
        <Ellipse cx={18} cy={14} rx={4} ry={2.5} fill={C} opacity={0.6} />
        <Ellipse cx={30} cy={14} rx={4} ry={2.5} fill={C} opacity={0.6} />
        <Ellipse cx={15} cy={20} rx={3.5} ry={2} fill={C} opacity={0.5} />
        <Ellipse cx={33} cy={20} rx={3.5} ry={2} fill={C} opacity={0.5} />
      </Svg>
    </Animated.View>
  );
}

// ═══════════════════════════════════════
// 乙 — 풀/덩굴: 바람에 흔들림
// ═══════════════════════════════════════
function EulMok({ s }: { s: number }) {
  const C = '#6B8E5B';
  const osc = useOsc(3000);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(osc.value, [0, 1], [-2, 2]) }],
  }));
  return (
    <Animated.View style={[{ width: s, height: s }, style]}>
      <Svg width={s} height={s} viewBox="0 0 48 48">
        <Path d="M24 44 C24 34 18 28 22 20 C26 12 20 8 24 4" stroke={C} strokeWidth={2} fill="none" strokeLinecap="round" />
        <Ellipse cx={20} cy={18} rx={3.5} ry={2} fill={C} opacity={0.6} />
        <Ellipse cx={28} cy={12} rx={3} ry={2} fill={C} opacity={0.6} />
        <Ellipse cx={22} cy={8} rx={2.5} ry={1.8} fill={C} opacity={0.5} />
        <Circle cx={26} cy={5} r={2} fill={C} opacity={0.4} />
      </Svg>
    </Animated.View>
  );
}

// ═══════════════════════════════════════
// 丙 — 태양: 미세 pulse
// ═══════════════════════════════════════
function ByungHwa({ s }: { s: number }) {
  const C = '#B85450';
  const osc = useOsc(2500);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(osc.value, [0, 1], [0.95, 1.05]) }],
    opacity: interpolate(osc.value, [0, 1], [0.85, 1]),
  }));
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return { x1: 24 + 12 * Math.cos(a), y1: 24 + 12 * Math.sin(a), x2: 24 + 18 * Math.cos(a), y2: 24 + 18 * Math.sin(a) };
  });
  return (
    <Animated.View style={[{ width: s, height: s }, style]}>
      <Svg width={s} height={s} viewBox="0 0 48 48">
        <Circle cx={24} cy={24} r={9} fill="none" stroke={C} strokeWidth={2} opacity={0.8} />
        <Circle cx={24} cy={24} r={5} fill={C} opacity={0.15} />
        {rays.map((r, i) => (
          <Line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke={C} strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
        ))}
      </Svg>
    </Animated.View>
  );
}

// ═══════════════════════════════════════
// 丁 — 촛불: 불꽃 흔들림
// ═══════════════════════════════════════
function JungHwa({ s }: { s: number }) {
  const C = '#C75B4A';
  const osc1 = useOsc(1800);
  const osc2 = useOsc(2000, 500);
  const style = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(osc1.value, [0, 1], [-3, 3])}deg` },
      { scaleX: interpolate(osc2.value, [0, 1], [0.95, 1.05]) },
    ],
  }));
  const sparkOsc = useOsc(2000, 400);
  const sparkStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sparkOsc.value, [0, 1], [0.2, 0.8]),
  }));
  return (
    <View style={{ width: s, height: s }}>
      {/* Static base */}
      <Svg width={s} height={s} viewBox="0 0 48 48" style={{ position: 'absolute' }}>
        <Rect x={21} y={28} width={6} height={16} rx={1.5} fill={C} opacity={0.2} />
        <Line x1={24} y1={28} x2={24} y2={22} stroke={C} strokeWidth={1} opacity={0.5} />
        <Path d="M18 44 L30 44" stroke={C} strokeWidth={1.5} strokeLinecap="round" opacity={0.3} />
      </Svg>
      {/* Animated flame */}
      <Animated.View style={[{ position: 'absolute', width: s, height: s }, style]}>
        <Svg width={s} height={s} viewBox="0 0 48 48">
          <Path d="M24 6 C28 12 30 16 28 20 C26 24 22 24 20 20 C18 16 20 12 24 6 Z" fill={C} opacity={0.35} />
          <Path d="M24 11 C26 14 27 16 26 18 C25 20 23 20 22 18 C21 16 22 14 24 11 Z" fill={C} opacity={0.55} />
        </Svg>
      </Animated.View>
      {/* Animated sparks */}
      <Animated.View style={[{ position: 'absolute', width: s, height: s }, sparkStyle]}>
        <Svg width={s} height={s} viewBox="0 0 48 48">
          <Circle cx={19} cy={12} r={1.2} fill={C} />
          <Circle cx={29} cy={10} r={1} fill={C} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ═══════════════════════════════════════
// 戊 — 큰 산: 정상만 pulse
// ═══════════════════════════════════════
function MuTo({ s }: { s: number }) {
  const C = '#8B6E4E';
  const osc = useOsc(3000);
  const dotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(osc.value, [0, 1], [0.3, 0.7]),
  }));
  return (
    <View style={{ width: s, height: s }}>
      <Svg width={s} height={s} viewBox="0 0 48 48" style={{ position: 'absolute' }}>
        <Path d="M6 42 L24 10 L42 42 Z" fill="none" stroke={C} strokeWidth={1.8} strokeLinejoin="round" />
        <Path d="M14 42 L28 22 L42 42" fill="none" stroke={C} strokeWidth={1} opacity={0.3} strokeLinejoin="round" />
      </Svg>
      <Animated.View style={[{ position: 'absolute', width: s, height: s }, dotStyle]}>
        <Svg width={s} height={s} viewBox="0 0 48 48">
          <Circle cx={24} cy={12} r={2.5} fill={C} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ═══════════════════════════════════════
// 己 — 논밭: 새싹 + 구름 이동
// ═══════════════════════════════════════
function GiTo({ s }: { s: number }) {
  const C = '#9A8460';
  const cloudOsc = useOsc(5000);
  const sproutOsc = useOsc(3000);
  const cloudStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(cloudOsc.value, [0, 1], [-3, 3]) }],
  }));
  const sproutStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: interpolate(sproutOsc.value, [0, 1], [0.95, 1.05]) }],
  }));
  return (
    <View style={{ width: s, height: s }}>
      {/* Static ground */}
      <Svg width={s} height={s} viewBox="0 0 48 48" style={{ position: 'absolute' }}>
        <Line x1={6} y1={36} x2={42} y2={36} stroke={C} strokeWidth={1.5} opacity={0.4} />
      </Svg>
      {/* Animated sprouts */}
      <Animated.View style={[{ position: 'absolute', width: s, height: s }, sproutStyle]}>
        <Svg width={s} height={s} viewBox="0 0 48 48">
          {[16, 24, 32].map((x) => (
            <React.Fragment key={x}>
              <Line x1={x} y1={36} x2={x} y2={26} stroke={C} strokeWidth={1.5} strokeLinecap="round" />
              <Ellipse cx={x - 3} cy={27} rx={3} ry={1.8} fill={C} opacity={0.5} />
              <Ellipse cx={x + 3} cy={28} rx={2.5} ry={1.5} fill={C} opacity={0.4} />
            </React.Fragment>
          ))}
        </Svg>
      </Animated.View>
      {/* Animated cloud */}
      <Animated.View style={[{ position: 'absolute', width: s, height: s }, cloudStyle]}>
        <Svg width={s} height={s} viewBox="0 0 48 48">
          <Ellipse cx={34} cy={12} rx={7} ry={3.5} fill={C} opacity={0.15} />
          <Ellipse cx={30} cy={13} rx={4} ry={2.5} fill={C} opacity={0.1} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ═══════════════════════════════════════
// 庚 — 바위/검: 빛줄기 반짝임
// ═══════════════════════════════════════
function GyungGeum({ s }: { s: number }) {
  const C = '#6B7B8D';
  const osc = useOsc(2000);
  const sparkStyle = useAnimatedStyle(() => ({
    opacity: interpolate(osc.value, [0, 0.5, 1], [0.1, 0.6, 0.1]),
  }));
  return (
    <View style={{ width: s, height: s }}>
      <Svg width={s} height={s} viewBox="0 0 48 48" style={{ position: 'absolute' }}>
        <Path d="M24 6 L38 24 L24 42 L10 24 Z" fill="none" stroke={C} strokeWidth={1.8} strokeLinejoin="round" />
        <Path d="M24 6 L38 24 L24 24 Z" fill={C} opacity={0.08} />
      </Svg>
      <Animated.View style={[{ position: 'absolute', width: s, height: s }, sparkStyle]}>
        <Svg width={s} height={s} viewBox="0 0 48 48">
          <Line x1={24} y1={6} x2={24} y2={1} stroke={C} strokeWidth={1.2} strokeLinecap="round" />
          <Line x1={38} y1={24} x2={43} y2={24} stroke={C} strokeWidth={1.2} strokeLinecap="round" />
          <Line x1={24} y1={42} x2={24} y2={47} stroke={C} strokeWidth={1.2} strokeLinecap="round" />
          <Line x1={10} y1={24} x2={5} y2={24} stroke={C} strokeWidth={1.2} strokeLinecap="round" />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ═══════════════════════════════════════
// 辛 — 보석: 느린 회전
// ═══════════════════════════════════════
function ShinGeum({ s }: { s: number }) {
  const C = '#7B8B9D';
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(withTiming(360, { duration: 12000, easing: Easing.linear }), -1);
  }, []);
  const rotStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));
  const r = 14;
  const pts = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    return `${24 + r * Math.cos(a)},${24 + r * Math.sin(a)}`;
  });
  const pathD = `M${pts[0]} ${pts.slice(1).map(p => `L${p}`).join(' ')} Z`;
  return (
    <Animated.View style={[{ width: s, height: s }, rotStyle]}>
      <Svg width={s} height={s} viewBox="0 0 48 48">
        <Path d={pathD} fill="none" stroke={C} strokeWidth={1.5} />
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <Line key={i} x1={24} y1={24}
              x2={24 + 11 * Math.cos(a)} y2={24 + 11 * Math.sin(a)}
              stroke={C} strokeWidth={0.8} opacity={0.3} />
          );
        })}
      </Svg>
    </Animated.View>
  );
}

// ═══════════════════════════════════════
// 壬 — 바다: 물결 흘러감
// ═══════════════════════════════════════
function ImSu({ s }: { s: number }) {
  const C = '#3D6B8E';
  const osc = useOsc(3000);
  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(osc.value, [0, 1], [-4, 4]) }],
  }));
  const dropOsc = useOsc(2000);
  const dropStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(dropOsc.value, [0, 1], [-2, 2]) }],
  }));
  return (
    <View style={{ width: s, height: s }}>
      <Animated.View style={[{ position: 'absolute', width: s, height: s }, waveStyle]}>
        <Svg width={s} height={s} viewBox="0 0 48 48">
          <Path d="M4 20 C12 16 20 24 28 20 C36 16 44 24 48 20" fill="none" stroke={C} strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
          <Path d="M4 28 C12 24 20 32 28 28 C36 24 44 32 48 28" fill="none" stroke={C} strokeWidth={1.5} strokeLinecap="round" opacity={0.4} />
          <Path d="M4 36 C12 32 20 40 28 36 C36 32 44 40 48 36" fill="none" stroke={C} strokeWidth={1.5} strokeLinecap="round" opacity={0.3} />
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', width: s, height: s }, dropStyle]}>
        <Svg width={s} height={s} viewBox="0 0 48 48">
          <Path d="M24 8 C24 8 28 12 24 15 C20 12 24 8 24 8 Z" fill={C} opacity={0.4} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ═══════════════════════════════════════
// 癸 — 이슬: 물방울 떨어짐 + 파문
// ═══════════════════════════════════════
function GyeSu({ s }: { s: number }) {
  const C = '#5B8FA8';
  const dropV = useSharedValue(0);
  const rippleV = useSharedValue(0);
  useEffect(() => {
    dropV.value = withRepeat(withTiming(1, { duration: 2500, easing: Easing.in(Easing.quad) }), -1);
    rippleV.value = withDelay(1200, withRepeat(withSequence(
      withTiming(1, { duration: 1300, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 0 }),
    ), -1));
  }, []);
  const dropStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(dropV.value, [0, 1], [0, 8]) }],
    opacity: interpolate(dropV.value, [0, 0.8, 1], [0.8, 0.8, 0]),
  }));
  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(rippleV.value, [0, 1], [0.5, 1.2]) }],
    opacity: interpolate(rippleV.value, [0, 0.3, 1], [0.4, 0.3, 0]),
  }));
  return (
    <View style={{ width: s, height: s }}>
      {/* Static main drop outline */}
      <Svg width={s} height={s} viewBox="0 0 48 48" style={{ position: 'absolute' }}>
        <Path d="M24 8 C24 8 32 18 24 24 C16 18 24 8 24 8 Z" fill="none" stroke={C} strokeWidth={1.5} opacity={0.6} />
      </Svg>
      {/* Falling small drops */}
      <Animated.View style={[{ position: 'absolute', width: s, height: s }, dropStyle]}>
        <Svg width={s} height={s} viewBox="0 0 48 48">
          <Circle cx={20} cy={26} r={1.5} fill={C} opacity={0.7} />
          <Circle cx={28} cy={28} r={1.2} fill={C} opacity={0.5} />
        </Svg>
      </Animated.View>
      {/* Ripple */}
      <Animated.View style={[{ position: 'absolute', width: s, height: s }, rippleStyle]}>
        <Svg width={s} height={s} viewBox="0 0 48 48">
          <Ellipse cx={24} cy={38} rx={10} ry={3} fill="none" stroke={C} strokeWidth={1} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ═══════════════════════════════════════
// Main export
// ═══════════════════════════════════════
const STEM_MAP: Record<string, React.FC<{ s: number }>> = {
  '\u7532': GapMok,   // 甲
  '\u4E59': EulMok,   // 乙
  '\u4E19': ByungHwa, // 丙
  '\u4E01': JungHwa,  // 丁
  '\u620A': MuTo,     // 戊
  '\u5DF1': GiTo,     // 己
  '\u5E9A': GyungGeum,// 庚
  '\u8F9B': ShinGeum, // 辛
  '\u58EC': ImSu,     // 壬
  '\u7678': GyeSu,    // 癸
};

interface Props {
  dayStem: string;
  size?: number;
}

export function DayMasterAnim({ dayStem, size = 48 }: Props) {
  const Comp = STEM_MAP[dayStem];
  if (!Comp) return null;
  return <Comp s={size} />;
}
