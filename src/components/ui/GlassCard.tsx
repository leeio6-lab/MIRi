import React from 'react';
import { View, StyleSheet, type ViewStyle, type LayoutChangeEvent } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { theme } from '../../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gold?: boolean;
  /** true → 기존 먹각(코너만), false/기본 → 먹각 + 네 변 연결 사각형 */
  cornersOnly?: boolean;
}

const MAIN_W = 1.2;
const ECHO_W = 0.5;
const DIAMOND_R = 2.5;
const R = theme.radius.lg;       // 카드 borderRadius
const INSET = 4;                  // 테두리 안쪽 여백
const CORNER_LEN = 28;            // 코너 L자 길이

// ─────────────────────────────────────────────────────────────
// 먹각 풀 프레임 — SVG 하나로 코너 + 변 연결
// ─────────────────────────────────────────────────────────────

function InkFrame({ gold, width, height }: { gold: boolean; width: number; height: number }) {
  if (width === 0 || height === 0) return null;

  const color = gold ? '#5C4A1E' : '#352A20';
  const op = gold ? 0.25 : 0.18;
  const echoOp = gold ? 0.10 : 0.06;
  const diamOp = gold ? 0.22 : 0.14;

  const i = INSET;
  const w = width;
  const h = height;
  const cl = CORNER_LEN;
  const r = Math.min(R, 14);

  // 코너 L자 (main)
  const tlMain = `M${i} ${i + cl} L${i} ${i + r} Q${i} ${i} ${i + r} ${i} L${i + cl} ${i}`;
  const trMain = `M${w - i - cl} ${i} L${w - i - r} ${i} Q${w - i} ${i} ${w - i} ${i + r} L${w - i} ${i + cl}`;
  const blMain = `M${i} ${h - i - cl} L${i} ${h - i - r} Q${i} ${h - i} ${i + r} ${h - i} L${i + cl} ${h - i}`;
  const brMain = `M${w - i} ${h - i - cl} L${w - i} ${h - i - r} Q${w - i} ${h - i} ${w - i - r} ${h - i} L${w - i - cl} ${h - i}`;

  // 코너 L자 (echo — 안쪽)
  const ei = i + 5;
  const ecl = cl - 8;
  const er = Math.min(r + 2, 16);
  const tlEcho = `M${ei} ${ei + ecl} L${ei} ${ei + er} Q${ei} ${ei} ${ei + er} ${ei} L${ei + ecl} ${ei}`;
  const trEcho = `M${w - ei - ecl} ${ei} L${w - ei - er} ${ei} Q${w - ei} ${ei} ${w - ei} ${ei + er} L${w - ei} ${ei + ecl}`;
  const blEcho = `M${ei} ${h - ei - ecl} L${ei} ${h - ei - er} Q${ei} ${h - ei} ${ei + er} ${h - ei} L${ei + ecl} ${h - ei}`;
  const brEcho = `M${w - ei} ${h - ei - ecl} L${w - ei} ${h - ei - er} Q${w - ei} ${h - ei} ${w - ei - er} ${h - ei} L${w - ei - ecl} ${h - ei}`;

  // 다이아몬드 (각 코너 안쪽)
  const dd = i + 7;
  const diamonds = [
    { cx: dd, cy: dd },
    { cx: w - dd, cy: dd },
    { cx: dd, cy: h - dd },
    { cx: w - dd, cy: h - dd },
  ];

  // 변 연결선 (코너 사이)
  const topEdge = `M${i + cl} ${i} L${w - i - cl} ${i}`;
  const bottomEdge = `M${i + cl} ${h - i} L${w - i - cl} ${h - i}`;
  const leftEdge = `M${i} ${i + cl} L${i} ${h - i - cl}`;
  const rightEdge = `M${w - i} ${i + cl} L${w - i} ${h - i - cl}`;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* 전체 프레임 — 코너 + 변 동일 두께/투명도 */}
        {[topEdge, bottomEdge, leftEdge, rightEdge, tlMain, trMain, blMain, brMain].map((d, idx) => (
          <Path key={`f${idx}`} d={d} stroke={color} strokeWidth={MAIN_W} fill="none"
            opacity={op} strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {/* 코너 echo */}
        {[tlEcho, trEcho, blEcho, brEcho].map((d, idx) => (
          <Path key={`e${idx}`} d={d} stroke={color} strokeWidth={ECHO_W} fill="none"
            opacity={echoOp} strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {/* 다이아몬드 */}
        {diamonds.map((dm, idx) => (
          <Path key={`d${idx}`}
            d={`M${dm.cx} ${dm.cy - DIAMOND_R} L${dm.cx + DIAMOND_R} ${dm.cy} L${dm.cx} ${dm.cy + DIAMOND_R} L${dm.cx - DIAMOND_R} ${dm.cy} Z`}
            stroke={color} strokeWidth={0.6} fill={color} opacity={diamOp} />
        ))}
      </Svg>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// 기존 먹각 (코너만) — 홈 전용
// ─────────────────────────────────────────────────────────────

const CVB = 50;
const CSZ = 46;

function CornerOrnaments({ gold }: { gold: boolean }) {
  const color = gold ? '#5C4A1E' : '#352A20';
  const mainOp = gold ? 0.40 : 0.30;
  const echoOp = gold ? 0.18 : 0.10;
  const diamOp = gold ? 0.30 : 0.18;

  const tlMain = 'M7 46 L7 15 Q7 7 15 7 L46 7';
  const tlEcho = 'M12 41 L12 18 Q12 12 18 12 L41 12';
  const tlDiam = `M10 ${10 - DIAMOND_R} L${10 + DIAMOND_R} 10 L10 ${10 + DIAMOND_R} L${10 - DIAMOND_R} 10 Z`;

  const trMain = 'M43 46 L43 15 Q43 7 35 7 L4 7';
  const trEcho = 'M38 41 L38 18 Q38 12 32 12 L9 12';
  const trDiam = `M40 ${10 - DIAMOND_R} L${40 + DIAMOND_R} 10 L40 ${10 + DIAMOND_R} L${40 - DIAMOND_R} 10 Z`;

  const blMain = 'M7 4 L7 35 Q7 43 15 43 L46 43';
  const blEcho = 'M12 9 L12 32 Q12 38 18 38 L41 38';
  const blDiam = `M10 ${40 - DIAMOND_R} L${10 + DIAMOND_R} 40 L10 ${40 + DIAMOND_R} L${10 - DIAMOND_R} 40 Z`;

  const brMain = 'M43 4 L43 35 Q43 43 35 43 L4 43';
  const brEcho = 'M38 9 L38 32 Q38 38 32 38 L9 38';
  const brDiam = `M40 ${40 - DIAMOND_R} L${40 + DIAMOND_R} 40 L40 ${40 + DIAMOND_R} L${40 - DIAMOND_R} 40 Z`;

  const corners = [
    { main: tlMain, echo: tlEcho, diam: tlDiam, pos: { top: -3, left: -3 } },
    { main: trMain, echo: trEcho, diam: trDiam, pos: { top: -3, right: -3 } },
    { main: blMain, echo: blEcho, diam: blDiam, pos: { bottom: -3, left: -3 } },
    { main: brMain, echo: brEcho, diam: brDiam, pos: { bottom: -3, right: -3 } },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {corners.map((c, idx) => (
        <Svg
          key={idx}
          width={CSZ}
          height={CSZ}
          viewBox={`0 0 ${CVB} ${CVB}`}
          style={[{ position: 'absolute' }, c.pos as any]}
        >
          <Path d={c.main} stroke={color} strokeWidth={MAIN_W} fill="none"
            opacity={mainOp} strokeLinecap="round" strokeLinejoin="round" />
          <Path d={c.echo} stroke={color} strokeWidth={ECHO_W} fill="none"
            opacity={echoOp} strokeLinecap="round" strokeLinejoin="round" />
          <Path d={c.diam} stroke={color} strokeWidth={0.6} fill={color} opacity={diamOp} />
        </Svg>
      ))}
    </View>
  );
}

export const GlassCard = React.memo(function GlassCard({
  children,
  style,
  gold,
  cornersOnly,
}: GlassCardProps) {
  const [size, setSize] = React.useState({ w: 0, h: 0 });

  const onLayout = React.useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev.w === width && prev.h === height ? prev : { w: width, h: height }));
  }, []);

  return (
    <View style={[styles.card, style]} onLayout={cornersOnly ? undefined : onLayout}>
      {cornersOnly
        ? <CornerOrnaments gold={!!gold} />
        : <InkFrame gold={!!gold} width={size.w} height={size.h} />
      }
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.cardPadding,
    overflow: 'hidden',
  },
});
