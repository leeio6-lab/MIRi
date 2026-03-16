import React from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';

interface Props { width?: number; height?: number; color?: string }

export function FireIllust({ width = 140, height = 140, color = '#B85450' }: Props) {
  const cx = width / 2, cy = height / 2 - 12;
  const R = 30;

  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 * Math.PI) / 180;
    const long = i % 2 === 0;
    const len = long ? 22 : 14;
    const sw = long ? 1 : 0.7;
    const inner = R + 2;
    return {
      x1: cx + inner * Math.cos(a), y1: cy + inner * Math.sin(a),
      x2: cx + (inner + len) * Math.cos(a), y2: cy + (inner + len) * Math.sin(a),
      long, sw,
    };
  });

  const sparks = [
    { x: cx - 22, y: cy + 48, r: 1.5 }, { x: cx + 24, y: cy + 44, r: 1.2 },
    { x: cx - 30, y: cy + 36, r: 1 }, { x: cx + 32, y: cy + 38, r: 1.3 },
  ];

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Circle cx={cx} cy={cy} r={R} stroke={color} strokeWidth={1.2} fill="none" />
      <Circle cx={cx} cy={cy} r={18} fill={`${color}0A`} stroke="none" />

      {rays.map((r, i) => (
        <React.Fragment key={i}>
          <Line x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke={color} strokeWidth={r.sw} opacity={0.7} strokeLinecap="round" />
          {r.long && <Circle cx={r.x2} cy={r.y2} r={1.5} fill={color} />}
        </React.Fragment>
      ))}

      {/* Center flame */}
      <Path d={`M${cx} ${cy + 28} C${cx - 10} ${cy + 42} ${cx - 14} ${cy + 58} ${cx - 6} ${cy + 72}
               Q${cx} ${cy + 60} ${cx + 6} ${cy + 72}
               C${cx + 14} ${cy + 58} ${cx + 10} ${cy + 42} ${cx} ${cy + 28}Z`}
        stroke={color} strokeWidth={1} fill={`${color}08`} />
      <Path d={`M${cx} ${cy + 36} C${cx - 3} ${cy + 48} ${cx - 2} ${cy + 58} ${cx} ${cy + 64}`}
        stroke={color} strokeWidth={0.5} fill="none" opacity={0.5} />

      {/* Left flame */}
      <Path d={`M${cx - 18} ${cy + 40} C${cx - 24} ${cy + 50} ${cx - 22} ${cy + 62} ${cx - 18} ${cy + 68}
               C${cx - 14} ${cy + 62} ${cx - 12} ${cy + 50} ${cx - 18} ${cy + 40}Z`}
        stroke={color} strokeWidth={0.8} fill={`${color}06`} />

      {/* Right flame */}
      <Path d={`M${cx + 18} ${cy + 40} C${cx + 12} ${cy + 50} ${cx + 14} ${cy + 62} ${cx + 18} ${cy + 68}
               C${cx + 22} ${cy + 62} ${cx + 24} ${cy + 50} ${cx + 18} ${cy + 40}Z`}
        stroke={color} strokeWidth={0.8} fill={`${color}06`} />

      {sparks.map((s, i) => (
        <Circle key={`sp${i}`} cx={s.x} cy={s.y} r={s.r} fill={color} opacity={0.2} />
      ))}
    </Svg>
  );
}
