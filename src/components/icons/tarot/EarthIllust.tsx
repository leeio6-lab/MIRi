import React from 'react';
import Svg, { Path, Line, Circle } from 'react-native-svg';

interface Props { width?: number; height?: number; color?: string }

export function EarthIllust({ width = 140, height = 140, color = '#8B6E4E' }: Props) {
  const cx = width / 2, cy = height / 2;
  const baseY = cy + 18;

  const sunCx = cx + 28, sunCy = cy - 28, sunR = 6;
  const sunRays = Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60) * Math.PI / 180;
    return {
      x1: sunCx + (sunR + 2) * Math.cos(a), y1: sunCy + (sunR + 2) * Math.sin(a),
      x2: sunCx + (sunR + 6) * Math.cos(a), y2: sunCy + (sunR + 6) * Math.sin(a),
    };
  });

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Big mountain */}
      <Path d={`M${cx - 32} ${baseY} L${cx} ${baseY - 38} L${cx + 34} ${baseY} Z`}
        stroke={color} strokeWidth={1.2} fill={`${color}0A`} strokeLinejoin="round" />
      <Circle cx={cx} cy={baseY - 38} r={1.5} fill={color} opacity={0.5} />

      {/* Small mountain */}
      <Path d={`M${cx + 8} ${baseY} L${cx + 26} ${baseY - 24} L${cx + 40} ${baseY} Z`}
        stroke={color} strokeWidth={1} fill={`${color}08`} strokeLinejoin="round" opacity={0.8} />

      {/* Ridge */}
      <Path d={`M${cx} ${baseY - 38} Q${cx + 13} ${baseY - 30} ${cx + 26} ${baseY - 24}`}
        stroke={color} strokeWidth={0.6} fill="none" opacity={0.3} />

      {/* Ground */}
      <Path d={`M${cx - 40} ${baseY} Q${cx} ${baseY + 3} ${cx + 44} ${baseY}`}
        stroke={color} strokeWidth={0.8} fill="none" opacity={0.4} />

      {/* Field pattern */}
      {[0, 1].map(r => <Line key={`fh${r}`} x1={cx - 28} y1={baseY + 6 + r * 4} x2={cx - 14} y2={baseY + 6 + r * 4} stroke={color} strokeWidth={0.4} opacity={0.1} />)}
      {[0, 1, 2].map(c => <Line key={`fv${c}`} x1={cx - 26 + c * 6} y1={baseY + 4} x2={cx - 26 + c * 6} y2={baseY + 12} stroke={color} strokeWidth={0.4} opacity={0.08} />)}

      {/* Sun */}
      <Circle cx={sunCx} cy={sunCy} r={sunR} stroke={color} strokeWidth={0.8} fill={`${color}0A`} opacity={0.6} />
      {sunRays.map((r, i) => (
        <Line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke={color} strokeWidth={0.6} opacity={0.3} strokeLinecap="round" />
      ))}

      {/* Cloud */}
      <Circle cx={cx - 20} cy={cy - 18} r={4.5} stroke={color} strokeWidth={0.6} fill={`${color}08`} opacity={0.4} />
      <Circle cx={cx - 13} cy={cy - 21} r={6} stroke={color} strokeWidth={0.6} fill={`${color}08`} opacity={0.4} />
      <Circle cx={cx - 6} cy={cy - 18} r={4.5} stroke={color} strokeWidth={0.6} fill={`${color}08`} opacity={0.4} />
    </Svg>
  );
}
