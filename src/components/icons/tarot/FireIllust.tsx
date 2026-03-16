import React from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';

interface Props { width?: number; height?: number; color?: string }

export function FireIllust({ width = 140, height = 140, color = '#B85450' }: Props) {
  const cx = width / 2;
  const cy = height / 2 - 8;
  const r = 28;

  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 * Math.PI) / 180;
    const long = i % 2 === 0;
    const inner = r + 4;
    const outer = inner + (long ? 18 : 10);
    return {
      x1: cx + inner * Math.cos(a), y1: cy + inner * Math.sin(a),
      x2: cx + outer * Math.cos(a), y2: cy + outer * Math.sin(a),
      sw: long ? 1.2 : 0.8,
    };
  });

  const stars = [
    { x: cx - 48, y: cy - 22 }, { x: cx + 50, y: cy - 28 },
    { x: cx - 44, y: cy + 10 }, { x: cx + 46, y: cy + 14 },
  ];

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Sun circle */}
      <Circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={1.5} fill="none" />

      {/* 12 rays */}
      {rays.map((ray, i) => (
        <Line key={i} x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2}
          stroke={color} strokeWidth={ray.sw} strokeLinecap="round" opacity={0.7} />
      ))}

      {/* Center large flame */}
      <Path
        d={`M${cx} ${cy + 32} C${cx - 14} ${cy + 18} ${cx - 10} ${cy + 42} ${cx - 8} ${cy + 50}
            Q${cx} ${cy + 36} ${cx + 8} ${cy + 50}
            C${cx + 10} ${cy + 42} ${cx + 14} ${cy + 18} ${cx} ${cy + 32}Z`}
        stroke={color} strokeWidth={1.2} fill="none" />

      {/* Left small flame */}
      <Path
        d={`M${cx - 16} ${cy + 38} C${cx - 22} ${cy + 30} ${cx - 20} ${cy + 46} ${cx - 16} ${cy + 50}
            C${cx - 12} ${cy + 46} ${cx - 10} ${cy + 30} ${cx - 16} ${cy + 38}Z`}
        stroke={color} strokeWidth={1} fill="none" opacity={0.6} />

      {/* Right small flame */}
      <Path
        d={`M${cx + 16} ${cy + 38} C${cx + 10} ${cy + 30} ${cx + 12} ${cy + 46} ${cx + 16} ${cy + 50}
            C${cx + 20} ${cy + 46} ${cx + 22} ${cy + 30} ${cx + 16} ${cy + 38}Z`}
        stroke={color} strokeWidth={1} fill="none" opacity={0.6} />

      {/* Stars */}
      {stars.map((s, i) => (
        <React.Fragment key={`s${i}`}>
          <Line x1={s.x - 4} y1={s.y} x2={s.x + 4} y2={s.y} stroke={color} strokeWidth={0.7} opacity={0.3} />
          <Line x1={s.x} y1={s.y - 4} x2={s.x} y2={s.y + 4} stroke={color} strokeWidth={0.7} opacity={0.3} />
        </React.Fragment>
      ))}
    </Svg>
  );
}
