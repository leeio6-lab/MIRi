import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

const C = '#1A1A1A';
const G = '#D4A84B';

export function MIRiLogo({ width = 130 }: { width?: number }) {
  const h = width * (52 / 130);
  return (
    <Svg width={width} height={h} viewBox="0 0 130 52">
      {/* M */}
      <Path d="M6 8 L6 44" stroke={C} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M6 8 L24 36 L42 8" stroke={C} strokeWidth={1.2} strokeLinejoin="round" strokeLinecap="round" fill="none" />
      <Path d="M42 8 L42 44" stroke={C} strokeWidth={2.2} strokeLinecap="round" />
      {/* I */}
      <Path d="M56 8 L56 44" stroke={C} strokeWidth={2.2} strokeLinecap="round" />
      {/* R */}
      <Path d="M70 8 L70 44" stroke={C} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M70 8 C70 8 90 6 90 18 C90 28 74 28 70 28" stroke={C} strokeWidth={1.2} fill="none" strokeLinecap="round" />
      <Path d="M82 28 L96 44" stroke={C} strokeWidth={1.5} strokeLinecap="round" />
      {/* i */}
      <Path d="M110 20 L110 44" stroke={C} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M110 4 L113.5 9 L110 14 L106.5 9 Z" fill={G} opacity={0.85} />
    </Svg>
  );
}
