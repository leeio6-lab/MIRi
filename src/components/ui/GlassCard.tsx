import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gold?: boolean;
}

// ─────────────────────────────────────────────────────────────
// 먹각 (Ink Corner)
//
// Four corner brackets only. No edge lines.
// L-bracket + echo + diamond per corner.
// ─────────────────────────────────────────────────────────────

const VB = 50;
const SZ = 46;
const MAIN_W = 1.2;
const ECHO_W = 0.5;
const DIAMOND_R = 2.5;

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
      {corners.map((c, i) => (
        <Svg
          key={i}
          width={SZ}
          height={SZ}
          viewBox={`0 0 ${VB} ${VB}`}
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
}: GlassCardProps) {
  return (
    <View style={[styles.card, style]}>
      <CornerOrnaments gold={!!gold} />
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
