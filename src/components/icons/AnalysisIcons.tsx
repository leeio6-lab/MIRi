import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface IconProps { size?: number; color?: string; }

/** 서류가방 — 직업운 */
export function BriefcaseIcon({ size = 16, color = '#E8B04A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Rect x={1.5} y={5} width={13} height={9} rx={2} stroke={color} strokeWidth={1.2} />
      <Path d="M5.5 5V3.5C5.5 2.67 6.17 2 7 2h2c.83 0 1.5.67 1.5 1.5V5" stroke={color} strokeWidth={1.2} />
      <Path d="M1.5 8.5h13" stroke={color} strokeWidth={0.8} opacity={0.5} />
    </Svg>
  );
}

/** 동전 — 재물운 */
export function CoinIcon({ size = 16, color = '#E8B04A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Circle cx={8} cy={8} r={6} stroke={color} strokeWidth={1.2} />
      <Circle cx={8} cy={8} r={3.5} stroke={color} strokeWidth={0.8} opacity={0.4} />
      <Path d="M8 5v6M6.5 6.5h3M6.5 9.5h3" stroke={color} strokeWidth={0.8} />
    </Svg>
  );
}

/** 하트 — 관계운 */
export function HeartIcon({ size = 16, color = '#E8B04A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M8 13.5S1.5 9.5 1.5 5.5C1.5 3.5 3 2 5 2c1.2 0 2.3.7 3 1.7C8.7 2.7 9.8 2 11 2c2 0 3.5 1.5 3.5 3.5 0 4-6.5 8-6.5 8z" stroke={color} strokeWidth={1.2} strokeLinejoin="round" />
    </Svg>
  );
}
