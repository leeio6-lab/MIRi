import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Polygon, Circle, Line, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { theme } from '../../constants/theme';

export interface CategoryScore {
  score: number;
  detail: string;
}

interface CompatibilityRadarProps {
  categories: {
    love: CategoryScore;
    communication: CategoryScore;
    values: CategoryScore;
    sexual: CategoryScore;
    finance: CategoryScore;
    growth: CategoryScore;
    family: CategoryScore;
    crisis: CategoryScore;
  };
}

function scoreColor(s: number) {
  if (s >= 75) return theme.colors.success;
  if (s >= 55) return theme.colors.gold.primary;
  if (s >= 40) return theme.colors.warning;
  return theme.colors.error;
}

export const CompatibilityRadar = React.memo(function CompatibilityRadar({ categories }: CompatibilityRadarProps) {
  const { t } = useTranslation();
  const { width: SCREEN_W } = useWindowDimensions();

  const SIZE = Math.min(SCREEN_W - 80, 280);
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = SIZE / 2 - 30;

  function polar(angle: number, radius: number): [number, number] {
    const rad = (angle - 90) * (Math.PI / 180);
    return [CX + radius * Math.cos(rad), CY + radius * Math.sin(rad)];
  }

  const LABELS = [
    { key: 'love', label: t('compatibility.categories.love'), emoji: '' },
    { key: 'communication', label: t('compatibility.categories.communication'), emoji: '' },
    { key: 'values', label: t('compatibility.categories.values'), emoji: '' },
    { key: 'sexual', label: t('compatibility.categories.sexual'), emoji: '' },
    { key: 'finance', label: t('compatibility.categories.finance'), emoji: '' },
    { key: 'growth', label: t('compatibility.categories.growth'), emoji: '' },
    { key: 'family', label: t('compatibility.categories.family'), emoji: '' },
    { key: 'crisis', label: t('compatibility.categories.crisis'), emoji: '' },
  ] as const;

  const n = LABELS.length;
  const step = 360 / n;

  // Rings
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Data points
  const points = LABELS.map((l, i) => {
    const cat = categories[l.key as keyof typeof categories];
    const val = cat?.score ?? 50;
    const angle = i * step;
    const [x, y] = polar(angle, (val / 100) * R);
    return { x, y, val, angle, key: l.key, label: l.label };
  });

  const polygonPts = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE}>
        {/* Ring backgrounds */}
        {rings.map((r, i) => {
          const ringPts = LABELS.map((_, idx) => {
            const [x, y] = polar(idx * step, r * R);
            return `${x},${y}`;
          }).join(' ');
          return (
            <Polygon
              key={i}
              points={ringPts}
              fill="none"
              stroke={theme.colors.glass.border}
              strokeWidth={0.8}
            />
          );
        })}

        {/* Axis lines */}
        {LABELS.map((_, i) => {
          const [x, y] = polar(i * step, R);
          return (
            <Line
              key={i}
              x1={CX} y1={CY} x2={x} y2={y}
              stroke={theme.colors.glass.border}
              strokeWidth={0.5}
            />
          );
        })}

        {/* Data polygon */}
        <Polygon
          points={polygonPts}
          fill="rgba(139, 115, 74, 0.15)"
          stroke={theme.colors.gold.primary}
          strokeWidth={2}
        />

        {/* Data dots + score labels */}
        {points.map((p, i) => (
          <React.Fragment key={i}>
            <Circle
              cx={p.x} cy={p.y} r={4}
              fill={scoreColor(p.val)}
              stroke="#fff"
              strokeWidth={1.5}
            />
          </React.Fragment>
        ))}

        {/* Category labels (outside polygon) */}
        {points.map((p, i) => {
          const [lx, ly] = polar(i * step, R + 20);
          return (
            <SvgText
              key={i}
              x={lx} y={ly}
              fontSize={11}
              fontWeight="600"
              fill={theme.colors.text.secondary}
              textAnchor="middle"
              alignmentBaseline="central"
            >
              {p.label}
            </SvgText>
          );
        })}
      </Svg>

      {/* Score list below radar */}
      <View style={styles.scoreList}>
        {LABELS.map((l) => {
          const cat = categories[l.key as keyof typeof categories];
          const s = cat?.score ?? 50;
          return (
            <View key={l.key} style={styles.scoreRow}>
              <View style={[styles.scoreDot, { backgroundColor: scoreColor(s) }]} />
              <Text style={styles.scoreName}>{l.label}</Text>
              <View style={styles.scoreMiniBar}>
                <View style={[styles.scoreMiniBarFill, { width: `${s}%`, backgroundColor: scoreColor(s) }]} />
              </View>
              <Text style={[styles.scoreVal, { color: scoreColor(s) }]}>{s}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  scoreList: {
    width: '100%',
    marginTop: theme.spacing.md,
    gap: 6,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  scoreName: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    width: 42,
  },
  scoreMiniBar: {
    flex: 1,
    height: 4,
    backgroundColor: theme.colors.bg.tertiary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreMiniBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  scoreVal: {
    fontSize: 13,
    fontWeight: '700',
    width: 28,
    textAlign: 'right',
  },
});
