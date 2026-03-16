import React from 'react';
import Svg, { Path, Line, Circle } from 'react-native-svg';

interface Props { width?: number; height?: number; color?: string }

export function MetalIllust({ width = 140, height = 140, color = '#6B7B8D' }: Props) {
  const cx = width / 2;
  const dCy = 60;
  const dW = 25;
  const dH = 35;

  const crownY = dCy - dH - 8;
  const swordTop = dCy + dH + 6;

  const rays = [
    { x1: cx - dW - 8, y1: dCy - 8, x2: cx - dW - 20, y2: dCy - 14 },
    { x1: cx - dW - 6, y1: dCy + 4, x2: cx - dW - 18, y2: dCy + 2 },
    { x1: cx + dW + 8, y1: dCy - 8, x2: cx + dW + 20, y2: dCy - 14 },
    { x1: cx + dW + 6, y1: dCy + 4, x2: cx + dW + 18, y2: dCy + 2 },
  ];

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Diamond */}
      <Path d={`M${cx} ${dCy - dH} L${cx + dW} ${dCy} L${cx} ${dCy + dH} L${cx - dW} ${dCy} Z`}
        stroke={color} strokeWidth={1.5} fill="none" />

      {/* V-cut reflection */}
      <Path d={`M${cx - 10} ${dCy - 12} L${cx} ${dCy + 5} L${cx + 10} ${dCy - 12}`}
        stroke={color} strokeWidth={0.8} fill="none" opacity={0.4} />

      {/* Crown */}
      <Path d={`M${cx - 18} ${crownY} L${cx - 11} ${crownY - 14} L${cx} ${crownY - 4} L${cx + 11} ${crownY - 14} L${cx + 18} ${crownY}`}
        stroke={color} strokeWidth={1.2} fill="none" />
      <Circle cx={cx - 11} cy={crownY - 16} r={1.5} fill={color} opacity={0.6} />
      <Circle cx={cx} cy={crownY - 6} r={1.5} fill={color} opacity={0.6} />
      <Circle cx={cx + 11} cy={crownY - 16} r={1.5} fill={color} opacity={0.6} />

      {/* Sword blade */}
      <Line x1={cx} y1={swordTop} x2={cx} y2={swordTop + 30} stroke={color} strokeWidth={1.5} />
      {/* Guard */}
      <Line x1={cx - 8} y1={swordTop + 4} x2={cx + 8} y2={swordTop + 4} stroke={color} strokeWidth={1.2} strokeLinecap="round" />
      {/* Grip */}
      <Path d={`M${cx - 2} ${swordTop + 22} L${cx + 2} ${swordTop + 22} L${cx + 2} ${swordTop + 30} L${cx - 2} ${swordTop + 30} Z`}
        stroke={color} strokeWidth={0.8} fill="none" opacity={0.5} />

      {/* Light rays */}
      {rays.map((r, i) => (
        <Line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
          stroke={color} strokeWidth={0.8} opacity={0.35} strokeLinecap="round" />
      ))}
    </Svg>
  );
}
