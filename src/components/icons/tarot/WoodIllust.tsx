import React from 'react';
import Svg, { Path, Line, Circle } from 'react-native-svg';

interface Props { width?: number; height?: number; color?: string }

export function WoodIllust({ width = 140, height = 140, color = '#5B7A4A' }: Props) {
  const cx = width / 2, bot = height - 8;

  const branches = [
    `M${cx} ${bot - 55} C${cx - 10} ${bot - 60} ${cx - 24} ${bot - 64} ${cx - 34} ${bot - 56}`,
    `M${cx} ${bot - 48} C${cx + 12} ${bot - 56} ${cx + 26} ${bot - 60} ${cx + 36} ${bot - 50}`,
    `M${cx} ${bot - 38} C${cx - 14} ${bot - 46} ${cx - 28} ${bot - 44} ${cx - 38} ${bot - 36}`,
    `M${cx} ${bot - 32} C${cx + 10} ${bot - 40} ${cx + 22} ${bot - 42} ${cx + 30} ${bot - 30}`,
    `M${cx} ${bot - 60} C${cx + 4} ${bot - 66} ${cx + 6} ${bot - 72} ${cx + 3} ${bot - 76}`,
  ];

  const leaves = [
    { x: cx - 34, y: bot - 56 }, { x: cx + 36, y: bot - 50 },
    { x: cx - 38, y: bot - 36 }, { x: cx + 30, y: bot - 30 },
    { x: cx + 3, y: bot - 76 }, { x: cx - 28, y: bot - 62 },
    { x: cx + 30, y: bot - 56 }, { x: cx - 32, y: bot - 42 },
  ];

  const leaf = (lx: number, ly: number) =>
    `M${lx} ${ly - 7} C${lx - 4} ${ly - 2} ${lx - 4} ${ly + 3} ${lx} ${ly + 7}
     C${lx + 4} ${ly + 3} ${lx + 4} ${ly - 2} ${lx} ${ly - 7}Z`;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Trunk */}
      <Path d={`M${cx - 4} ${bot} Q${cx - 5} ${bot - 30} ${cx - 2} ${bot - 50} Q${cx} ${bot - 60} ${cx} ${bot - 65}`}
        stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Path d={`M${cx + 4} ${bot} Q${cx + 5} ${bot - 30} ${cx + 2} ${bot - 50}`}
        stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" opacity={0.3} />

      {branches.map((b, i) => <Path key={i} d={b} stroke={color} strokeWidth={1} fill="none" opacity={0.7} strokeLinecap="round" />)}

      {leaves.map((l, i) => (
        <React.Fragment key={`l${i}`}>
          <Path d={leaf(l.x, l.y)} stroke={color} strokeWidth={0.7} fill={`${color}0F`} />
          <Line x1={l.x} y1={l.y - 5} x2={l.x} y2={l.y + 5} stroke={color} strokeWidth={0.35} opacity={0.3} />
        </React.Fragment>
      ))}

      {/* Roots */}
      <Path d={`M${cx - 3} ${bot} C${cx - 10} ${bot + 4} ${cx - 18} ${bot + 6} ${cx - 22} ${bot + 2}`} stroke={color} strokeWidth={1} fill="none" opacity={0.5} />
      <Path d={`M${cx} ${bot} C${cx} ${bot + 5} ${cx - 4} ${bot + 8} ${cx - 6} ${bot + 6}`} stroke={color} strokeWidth={0.8} fill="none" opacity={0.35} />
      <Path d={`M${cx + 3} ${bot} C${cx + 10} ${bot + 4} ${cx + 16} ${bot + 6} ${cx + 20} ${bot + 2}`} stroke={color} strokeWidth={1} fill="none" opacity={0.5} />

      {/* Ground */}
      <Path d={`M${cx - 35} ${bot + 3} Q${cx} ${bot + 7} ${cx + 35} ${bot + 3}`} stroke={color} strokeWidth={0.8} fill="none" opacity={0.15} />

      {/* Small sprout */}
      <Path d={`M${cx + 28} ${bot + 3} L${cx + 28} ${bot - 3}`} stroke={color} strokeWidth={0.7} fill="none" opacity={0.3} />
      <Path d={`M${cx + 25} ${bot - 1} Q${cx + 28} ${bot - 4} ${cx + 31} ${bot - 1}`} stroke={color} strokeWidth={0.6} fill="none" opacity={0.3} />
    </Svg>
  );
}
