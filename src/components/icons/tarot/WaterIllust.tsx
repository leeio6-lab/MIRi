import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface Props { width?: number; height?: number; color?: string }

export function WaterIllust({ width = 140, height = 140, color = '#3D6B8E' }: Props) {
  const cx = width / 2;

  const wavePath = (y: number) => {
    const amp = 6;
    const waveW = 80;
    const sx = cx - waveW / 2;
    const seg = waveW / 4;
    return `M${sx} ${y}
      C${sx + seg * 0.5} ${y - amp} ${sx + seg * 0.5} ${y - amp} ${sx + seg} ${y}
      C${sx + seg * 1.5} ${y + amp} ${sx + seg * 1.5} ${y + amp} ${sx + seg * 2} ${y}
      C${sx + seg * 2.5} ${y - amp} ${sx + seg * 2.5} ${y - amp} ${sx + seg * 3} ${y}
      C${sx + seg * 3.5} ${y + amp} ${sx + seg * 3.5} ${y + amp} ${sx + seg * 4} ${y}`;
  };

  const tearDrop = (tx: number, ty: number, s: number) =>
    `M${tx} ${ty - s * 6} C${tx - s * 3} ${ty - s * 1} ${tx - s * 3} ${ty + s * 3} ${tx} ${ty + s * 4}
     C${tx + s * 3} ${ty + s * 3} ${tx + s * 3} ${ty - s * 1} ${tx} ${ty - s * 6}Z`;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Crescent moon */}
      <Path
        d={`M${cx + 5} ${12} A18 18 0 1 0 ${cx + 5} ${48} A13 13 0 1 1 ${cx + 5} ${12}Z`}
        stroke={color} strokeWidth={1.2} fill="none" />

      {/* Waves */}
      <Path d={wavePath(75)} stroke={color} strokeWidth={1.2} fill="none" opacity={0.8} strokeLinecap="round" />
      <Path d={wavePath(87)} stroke={color} strokeWidth={1.2} fill="none" opacity={0.5} strokeLinecap="round" />
      <Path d={wavePath(99)} stroke={color} strokeWidth={1.2} fill="none" opacity={0.3} strokeLinecap="round" />

      {/* Teardrops */}
      <Path d={tearDrop(cx - 14, 62, 1.2)} stroke={color} strokeWidth={1} fill="none" opacity={0.6} />
      <Path d={tearDrop(cx + 18, 58, 1)} stroke={color} strokeWidth={0.8} fill="none" opacity={0.5} />

      {/* Scattered dots */}
      {[
        { x: cx - 36, y: 50, r: 2 }, { x: cx + 38, y: 46, r: 1.5 },
        { x: cx - 28, y: 110, r: 1.5 }, { x: cx + 30, y: 112, r: 2 },
        { x: cx - 50, y: 80, r: 1 }, { x: cx + 52, y: 88, r: 1.2 },
      ].map((d, i) => (
        <Circle key={i} cx={d.x} cy={d.y} r={d.r} fill={color} opacity={0.2} />
      ))}
    </Svg>
  );
}
