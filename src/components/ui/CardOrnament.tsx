import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, Text as SvgText } from 'react-native-svg';

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type OrnamentType = 'cloud' | 'stamp';

interface CardOrnamentProps {
  position: Position;
  type: OrnamentType;
  color?: string;
  opacity?: number;
}

const CLOUD_W = 80;
const CLOUD_H = 8;

function CloudOrnament({ mirror, color, opacity }: { mirror?: boolean; color: string; opacity: number }) {
  // S-curve from left edge to ~30% width, with small circle at end
  const d = mirror
    ? `M${CLOUD_W},4 C${CLOUD_W * 0.75},1 ${CLOUD_W * 0.55},7 ${CLOUD_W * 0.3},4`
    : `M0,4 C${CLOUD_W * 0.25},1 ${CLOUD_W * 0.45},7 ${CLOUD_W * 0.7},4`;

  const cx = mirror ? CLOUD_W * 0.3 : CLOUD_W * 0.7;

  return (
    <Svg width={CLOUD_W} height={CLOUD_H}>
      <Path
        d={d}
        stroke={color}
        strokeWidth={0.5}
        fill="none"
        opacity={opacity}
      />
      <Circle
        cx={cx}
        cy={4}
        r={1.5}
        fill={color}
        opacity={opacity * 1.25}
      />
    </Svg>
  );
}

const STAMP_SIZE = 8;

function StampOrnament({ color, opacity }: { color: string; opacity: number }) {
  return (
    <Svg width={STAMP_SIZE} height={STAMP_SIZE}>
      <Rect
        x={0.5}
        y={0.5}
        width={STAMP_SIZE - 1}
        height={STAMP_SIZE - 1}
        stroke={color}
        strokeWidth={0.5}
        fill="none"
        opacity={opacity}
        rx={0.5}
      />
      <SvgText
        x={STAMP_SIZE / 2}
        y={STAMP_SIZE / 2 + 2}
        fontSize={5}
        fill={color}
        opacity={opacity}
        textAnchor="middle"
        fontWeight="600"
      >
        命
      </SvgText>
    </Svg>
  );
}

export const CardOrnament = React.memo(function CardOrnament({
  position,
  type,
  color = '#E8B04A',
  opacity = 0.12,
}: CardOrnamentProps) {
  const isTop = position.startsWith('top');
  const isLeft = position.endsWith('left');
  const mirror = !isLeft;

  const posStyle: any = {
    position: 'absolute' as const,
    ...(isTop ? { top: 8 } : { bottom: 8 }),
    ...(isLeft ? { left: 12 } : { right: 12 }),
  };

  if (type === 'stamp') {
    return (
      <View style={posStyle}>
        <StampOrnament color={color} opacity={opacity} />
      </View>
    );
  }

  return (
    <View style={posStyle}>
      <CloudOrnament mirror={mirror} color={color} opacity={opacity} />
    </View>
  );
});
