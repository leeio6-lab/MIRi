import React from 'react';
import Svg, { Path, Line } from 'react-native-svg';

interface Props { width?: number; height?: number; color?: string }

export function WoodIllust({ width = 140, height = 140, color = '#5B7A4A' }: Props) {
  const cx = width / 2;
  const bot = height - 18;

  const branches = [
    `M${cx} ${bot - 55} C${cx - 8} ${bot - 60} ${cx - 25} ${bot - 65} ${cx - 35} ${bot - 58}`,
    `M${cx} ${bot - 50} C${cx + 10} ${bot - 58} ${cx + 28} ${bot - 62} ${cx + 38} ${bot - 52}`,
    `M${cx} ${bot - 40} C${cx - 12} ${bot - 48} ${cx - 30} ${bot - 46} ${cx - 40} ${bot - 38}`,
    `M${cx} ${bot - 35} C${cx + 8} ${bot - 42} ${cx + 22} ${bot - 44} ${cx + 32} ${bot - 32}`,
    `M${cx} ${bot - 25} C${cx - 10} ${bot - 30} ${cx - 18} ${bot - 28} ${cx - 26} ${bot - 22}`,
  ];

  const leaves = [
    { x: cx - 35, y: bot - 58 }, { x: cx + 38, y: bot - 52 },
    { x: cx - 40, y: bot - 38 }, { x: cx + 32, y: bot - 32 },
    { x: cx - 26, y: bot - 22 }, { x: cx - 30, y: bot - 62 },
    { x: cx + 34, y: bot - 58 }, { x: cx - 36, y: bot - 44 },
    { x: cx + 28, y: bot - 40 },
  ];

  const leafPath = (lx: number, ly: number) =>
    `M${lx} ${ly - 8} C${lx - 5} ${ly - 3} ${lx - 5} ${ly + 3} ${lx} ${ly + 8}
     C${lx + 5} ${ly + 3} ${lx + 5} ${ly - 3} ${lx} ${ly - 8}Z`;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Trunk */}
      <Path
        d={`M${cx - 4} ${bot} C${cx - 6} ${bot - 30} ${cx - 3} ${bot - 50} ${cx} ${bot - 65}
            C${cx + 3} ${bot - 50} ${cx + 6} ${bot - 30} ${cx + 4} ${bot}Z`}
        stroke={color} strokeWidth={1.2} fill="none" />

      {/* Branches */}
      {branches.map((b, i) => (
        <Path key={i} d={b} stroke={color} strokeWidth={1} fill="none" opacity={0.7} />
      ))}

      {/* Leaves */}
      {leaves.map((l, i) => (
        <React.Fragment key={`l${i}`}>
          <Path d={leafPath(l.x, l.y)} stroke={color} strokeWidth={0.8} fill="none" opacity={0.6} />
          <Line x1={l.x} y1={l.y - 6} x2={l.x} y2={l.y + 6}
            stroke={color} strokeWidth={0.4} opacity={0.3} />
        </React.Fragment>
      ))}

      {/* Roots */}
      <Path d={`M${cx - 4} ${bot} C${cx - 10} ${bot + 6} ${cx - 18} ${bot + 8} ${cx - 22} ${bot + 4}`}
        stroke={color} strokeWidth={1} fill="none" opacity={0.5} />
      <Path d={`M${cx + 4} ${bot} C${cx + 10} ${bot + 6} ${cx + 16} ${bot + 10} ${cx + 20} ${bot + 6}`}
        stroke={color} strokeWidth={1} fill="none" opacity={0.5} />

      {/* Ground */}
      <Path d={`M${cx - 50} ${bot + 4} Q${cx} ${bot + 10} ${cx + 50} ${bot + 4}`}
        stroke={color} strokeWidth={0.8} fill="none" opacity={0.3} />
    </Svg>
  );
}
