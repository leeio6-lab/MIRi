import React from 'react';
import Svg, { Rect, Path, Circle } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

/**
 * Lock icon for premium content overlay.
 * Rounded rectangle body, semicircle shackle, and keyhole detail.
 */
export function LockIcon({ size = 24, color = '#E8B04A' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Lock body - rounded rectangle */}
      <Rect
        x={5}
        y={11}
        width={14}
        height={11}
        rx={2}
        ry={2}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Shackle - semicircle arc on top */}
      <Path
        d="M8 11 V8 C8 4.686 9.79 2 12 2 C14.21 2 16 4.686 16 8 V11"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Keyhole circle */}
      <Circle
        cx={12}
        cy={15.5}
        r={1.5}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
      />
      {/* Keyhole drop / triangle pointing down */}
      <Path
        d="M11.25 16.8 L12 19.5 L12.75 16.8"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
