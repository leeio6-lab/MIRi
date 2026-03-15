import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { theme } from '../../constants/theme';

const SCREEN_W = Dimensions.get('window').width;

interface CategoryRadarProps {
  scores: {
    career: number;
    wealth: number;
    love: number;
    health: number;
    social: number;
    academic: number;
  };
  size?: number;
}

const CATEGORIES = [
  { key: 'career', label: '직업', icon: '💼', color: '#2D7A5F', angle: -90 },
  { key: 'wealth', label: '재물', icon: '💰', color: '#B59530', angle: -30 },
  { key: 'love', label: '연애', icon: '💕', color: '#C4503D', angle: 30 },
  { key: 'health', label: '건강', icon: '🏥', color: '#2C5F8A', angle: 90 },
  { key: 'social', label: '대인', icon: '🤝', color: '#8C6BB1', angle: 150 },
  { key: 'academic', label: '학업', icon: '📚', color: '#A68B5B', angle: 210 },
] as const;

function polar(angleDeg: number, r: number, cx: number, cy: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function CategoryRadar({ scores, size: sizeProp }: CategoryRadarProps) {
  const size = sizeProp ?? Math.min(SCREEN_W - 80, 280);
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 36;
  const rings = [0.25, 0.5, 0.75, 1.0];

  const values = CATEGORIES.map(c => (scores as any)[c.key] ?? 0);
  const maxVal = 100;

  const dataPoints = CATEGORIES.map((c, i) => {
    const v = Math.max(values[i] / maxVal, 0.08) * R;
    return polar(c.angle, v, cx, cy);
  });

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        {/* Grid rings */}
        {rings.map(r => (
          <Polygon
            key={r}
            points={CATEGORIES.map(c => {
              const p = polar(c.angle, R * r, cx, cy);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill="none"
            stroke="rgba(0,0,0,0.05)"
            strokeWidth={0.8}
          />
        ))}

        {/* Axis lines */}
        {CATEGORIES.map(c => {
          const p = polar(c.angle, R, cx, cy);
          return <Line key={c.key} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(0,0,0,0.04)" strokeWidth={0.8} />;
        })}

        {/* Data polygon */}
        <Polygon
          points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill="rgba(181,149,48,0.10)"
          stroke={theme.colors.gold.primary}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* Vertices */}
        {CATEGORIES.map((c, i) => (
          <Circle key={c.key} cx={dataPoints[i].x} cy={dataPoints[i].y} r={3.5} fill={c.color} />
        ))}

        {/* Labels */}
        {CATEGORIES.map((c, i) => {
          const p = polar(c.angle, R + 24, cx, cy);
          return (
            <React.Fragment key={c.key}>
              <SvgText
                x={p.x} y={p.y - 5}
                textAnchor="middle" alignmentBaseline="central"
                fontSize={12} fontWeight="700" fill={c.color}
              >
                {c.label}
              </SvgText>
              <SvgText
                x={p.x} y={p.y + 10}
                textAnchor="middle" alignmentBaseline="central"
                fontSize={10} fontWeight="600" fill={theme.colors.text.secondary}
              >
                {values[i]}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
});
