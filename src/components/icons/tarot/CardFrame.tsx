import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Rect, Path, Circle } from 'react-native-svg';

interface Props { width?: number; height?: number; color?: string }

export function CardFrame({ width = 200, height = 300, color = '#D4A84B' }: Props) {
  const I = 8; // inset
  const L = I, T = I, R = width - I, B = height - I;
  const v = 18; // vine reach

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={StyleSheet.absoluteFill}>
      {/* Inner rect */}
      <Rect x={L} y={T} width={R - L} height={B - T} rx={2} stroke={color} strokeWidth={0.5} fill="none" opacity={0.35} />

      {/* ─ Top-left vine ─ */}
      <Path d={`M ${L} ${T + v} C ${L} ${T + 6} ${L + 6} ${T} ${L + v} ${T}`} stroke={color} strokeWidth={0.6} fill="none" opacity={0.55} />
      <Path d={`M ${L + 7} ${T + 7} C ${L + 5} ${T + 11} ${L + 6} ${T + 15} ${L + 8} ${T + 17}`} stroke={color} strokeWidth={0.45} fill="none" opacity={0.35} />
      <Circle cx={L + 8} cy={T + 18} r={1.2} fill={color} opacity={0.3} />

      {/* ─ Top-right vine ─ */}
      <Path d={`M ${R} ${T + v} C ${R} ${T + 6} ${R - 6} ${T} ${R - v} ${T}`} stroke={color} strokeWidth={0.6} fill="none" opacity={0.55} />
      <Path d={`M ${R - 7} ${T + 7} C ${R - 5} ${T + 11} ${R - 6} ${T + 15} ${R - 8} ${T + 17}`} stroke={color} strokeWidth={0.45} fill="none" opacity={0.35} />
      <Circle cx={R - 8} cy={T + 18} r={1.2} fill={color} opacity={0.3} />

      {/* ─ Bottom-left vine ─ */}
      <Path d={`M ${L} ${B - v} C ${L} ${B - 6} ${L + 6} ${B} ${L + v} ${B}`} stroke={color} strokeWidth={0.6} fill="none" opacity={0.55} />
      <Path d={`M ${L + 7} ${B - 7} C ${L + 5} ${B - 11} ${L + 6} ${B - 15} ${L + 8} ${B - 17}`} stroke={color} strokeWidth={0.45} fill="none" opacity={0.35} />
      <Circle cx={L + 8} cy={B - 18} r={1.2} fill={color} opacity={0.3} />

      {/* ─ Bottom-right vine ─ */}
      <Path d={`M ${R} ${B - v} C ${R} ${B - 6} ${R - 6} ${B} ${R - v} ${B}`} stroke={color} strokeWidth={0.6} fill="none" opacity={0.55} />
      <Path d={`M ${R - 7} ${B - 7} C ${R - 5} ${B - 11} ${R - 6} ${B - 15} ${R - 8} ${B - 17}`} stroke={color} strokeWidth={0.45} fill="none" opacity={0.35} />
      <Circle cx={R - 8} cy={B - 18} r={1.2} fill={color} opacity={0.3} />
    </Svg>
  );
}
