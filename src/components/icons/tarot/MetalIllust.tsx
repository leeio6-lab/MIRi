import React from 'react';
import Svg, { Path, Line, Circle } from 'react-native-svg';

interface Props { width?: number; height?: number; color?: string }

export function MetalIllust({ width = 140, height = 140, color = '#6B7B8D' }: Props) {
  const cx = width / 2, dCy = 56;
  const dW = 22, dH = 31; // diamond half-sizes

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Diamond */}
      <Path d={`M${cx} ${dCy - dH} L${cx + dW} ${dCy} L${cx} ${dCy + dH} L${cx - dW} ${dCy} Z`}
        stroke={color} strokeWidth={1.3} fill={`${color}08`} />
      {/* V-cut top */}
      <Line x1={cx} y1={dCy - dH} x2={cx - dW * 0.45} y2={dCy} stroke={color} strokeWidth={0.7} opacity={0.4} />
      <Line x1={cx} y1={dCy - dH} x2={cx + dW * 0.45} y2={dCy} stroke={color} strokeWidth={0.7} opacity={0.4} />
      {/* Reverse V bottom */}
      <Line x1={cx - dW * 0.35} y1={dCy} x2={cx} y2={dCy + dH * 0.6} stroke={color} strokeWidth={0.6} opacity={0.25} />
      <Line x1={cx + dW * 0.35} y1={dCy} x2={cx} y2={dCy + dH * 0.6} stroke={color} strokeWidth={0.6} opacity={0.25} />

      {/* Crown */}
      <Path d={`M${cx - 18} ${dCy - dH - 8} L${cx - 11} ${dCy - dH - 22} L${cx} ${dCy - dH - 12} L${cx + 11} ${dCy - dH - 22} L${cx + 18} ${dCy - dH - 8}`}
        stroke={color} strokeWidth={1} fill="none" />
      <Line x1={cx - 18} y1={dCy - dH - 8} x2={cx + 18} y2={dCy - dH - 8} stroke={color} strokeWidth={0.8} />
      <Circle cx={cx - 11} cy={dCy - dH - 23} r={1.5} fill={color} opacity={0.6} />
      <Circle cx={cx} cy={dCy - dH - 13} r={1.5} fill={color} opacity={0.6} />
      <Circle cx={cx + 11} cy={dCy - dH - 23} r={1.5} fill={color} opacity={0.6} />

      {/* Sword */}
      <Path d={`M${cx} ${dCy + dH + 6} L${cx - 2} ${dCy + dH + 10} L${cx} ${dCy + dH + 4} L${cx + 2} ${dCy + dH + 10} Z`} fill={color} opacity={0.5} />
      <Line x1={cx} y1={dCy + dH + 10} x2={cx} y2={dCy + dH + 48} stroke={color} strokeWidth={1.3} />
      <Line x1={cx - 7} y1={dCy + dH + 34} x2={cx + 7} y2={dCy + dH + 34} stroke={color} strokeWidth={1.2} strokeLinecap="round" />
      <Line x1={cx} y1={dCy + dH + 38} x2={cx} y2={dCy + dH + 48} stroke={color} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      <Circle cx={cx} cy={dCy + dH + 50} r={2} stroke={color} strokeWidth={0.8} fill="none" opacity={0.5} />

      {/* Light rays */}
      {[[-1, -1], [1, -1], [-1, 0.5], [1, 0.5]].map(([dx, dy], i) => (
        <Line key={i} x1={cx + dx * (dW + 4)} y1={dCy + dy * 14} x2={cx + dx * (dW + 16)} y2={dCy + dy * 14 - 6}
          stroke={color} strokeWidth={0.8} opacity={0.25} strokeLinecap="round" />
      ))}
    </Svg>
  );
}
