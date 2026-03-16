import React from 'react';
import Svg, { Path, Line, Circle } from 'react-native-svg';

interface Props { width?: number; height?: number; color?: string }

export function EarthIllust({ width = 140, height = 140, color = '#8B6E4E' }: Props) {
  const cx = width / 2;

  const sunCx = cx + 45;
  const sunCy = 28;
  const sunR = 8;
  const sunRays = Array.from({ length: 4 }, (_, i) => {
    const a = (i * 90 + 45) * Math.PI / 180;
    return {
      x1: sunCx + (sunR + 3) * Math.cos(a),
      y1: sunCy + (sunR + 3) * Math.sin(a),
      x2: sunCx + (sunR + 8) * Math.cos(a),
      y2: sunCy + (sunR + 8) * Math.sin(a),
    };
  });

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Big mountain (back) */}
      <Path d={`M${cx - 50} 100 L${cx - 5} 35 L${cx + 45} 100 Z`}
        stroke={color} strokeWidth={1.2} fill="none" strokeLinejoin="round" />

      {/* Small mountain (front) */}
      <Path d={`M${cx + 5} 100 L${cx + 35} 58 L${cx + 60} 100 Z`}
        stroke={color} strokeWidth={1} fill="none" opacity={0.7} strokeLinejoin="round" />

      {/* Horizon */}
      <Path d="M10 100 Q70 106 130 100" stroke={color} strokeWidth={0.8} fill="none" opacity={0.3} />

      {/* Cloud */}
      <Circle cx={cx - 28} cy={48} r={6} stroke={color} strokeWidth={0.8} fill="none" opacity={0.4} />
      <Circle cx={cx - 20} cy={44} r={8} stroke={color} strokeWidth={0.8} fill="none" opacity={0.4} />
      <Circle cx={cx - 11} cy={48} r={6} stroke={color} strokeWidth={0.8} fill="none" opacity={0.4} />

      {/* Sun */}
      <Circle cx={sunCx} cy={sunCy} r={sunR} stroke={color} strokeWidth={1} fill="none" opacity={0.6} />
      {sunRays.map((r, i) => (
        <Line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
          stroke={color} strokeWidth={0.8} opacity={0.4} strokeLinecap="round" />
      ))}
    </Svg>
  );
}
