import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface Props { width?: number; height?: number; color?: string }

export function WaterIllust({ width = 140, height = 140, color = '#3D6B8E' }: Props) {
  const cx = width / 2;
  const cy = height / 2;

  // All coordinates relative to center, scaled to fit within viewBox
  const moonCy = cy - 20;
  const moonR = 11;

  const wave = (y: number, w: number) => {
    const sx = cx - w / 2, amp = 4, seg = w / 4;
    return `M${sx} ${y} C${sx + seg * 0.5} ${y - amp} ${sx + seg * 0.5} ${y - amp} ${sx + seg} ${y}
      C${sx + seg * 1.5} ${y + amp} ${sx + seg * 1.5} ${y + amp} ${sx + seg * 2} ${y}
      C${sx + seg * 2.5} ${y - amp} ${sx + seg * 2.5} ${y - amp} ${sx + seg * 3} ${y}
      C${sx + seg * 3.5} ${y + amp} ${sx + seg * 3.5} ${y + amp} ${sx + seg * 4} ${y}`;
  };

  const tear = (tx: number, ty: number, s: number) =>
    `M${tx} ${ty - s * 5} C${tx - s * 2.5} ${ty - s} ${tx - s * 2.5} ${ty + s * 2} ${tx} ${ty + s * 3}
     C${tx + s * 2.5} ${ty + s * 2} ${tx + s * 2.5} ${ty - s} ${tx} ${ty - s * 5}Z`;

  const waveY = cy + 10;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Crescent moon — two overlapping circles */}
      <Circle cx={cx - 2} cy={moonCy} r={moonR} stroke={color} strokeWidth={1.2} fill="none" />
      <Circle cx={cx + 6} cy={moonCy - 2} r={moonR - 2} fill={color === '#3D6B8E' ? '#EBF2F9' : '#FFF'} stroke="none" />
      {/* Stars inside */}
      <Circle cx={cx - 8} cy={moonCy - 6} r={1} fill={color} opacity={0.4} />
      <Circle cx={cx - 4} cy={moonCy + 4} r={0.8} fill={color} opacity={0.35} />
      <Circle cx={cx - 10} cy={moonCy + 2} r={0.7} fill={color} opacity={0.3} />

      {/* Waves */}
      <Path d={wave(waveY, width * 0.6)} stroke={color} strokeWidth={1} fill="none" opacity={0.7} strokeLinecap="round" />
      <Path d={wave(waveY + 9, width * 0.6)} stroke={color} strokeWidth={1} fill="none" opacity={0.45} strokeLinecap="round" />
      <Path d={wave(waveY + 18, width * 0.6)} stroke={color} strokeWidth={1} fill="none" opacity={0.25} strokeLinecap="round" />

      {/* Teardrops */}
      <Path d={tear(cx - 12, waveY - 8, 1.2)} stroke={color} strokeWidth={0.7} fill={`${color}0D`} />
      <Path d={tear(cx + 14, waveY - 12, 1)} stroke={color} strokeWidth={0.6} fill={`${color}0D`} />

      {/* Scattered drops */}
      {[
        { x: cx - 28, y: waveY + 4, r: 1.5 }, { x: cx + 30, y: waveY + 12, r: 1.2 },
        { x: cx - 22, y: waveY + 28, r: 1.8 }, { x: cx + 24, y: waveY + 26, r: 1.4 },
        { x: cx + 4, y: waveY + 32, r: 1.5 }, { x: cx - 10, y: waveY + 30, r: 1 },
      ].map((d, i) => (
        <Circle key={i} cx={d.x} cy={d.y} r={d.r} fill={color} opacity={0.12 + i * 0.02} />
      ))}
    </Svg>
  );
}
