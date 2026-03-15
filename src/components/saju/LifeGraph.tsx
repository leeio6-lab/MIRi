import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from 'react-native-svg';
import { theme } from '../../constants/theme';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - theme.spacing.screenPadding * 2 - 40;
const CHART_H = 180;
const PAD_L = 40;
const PAD_R = 16;
const PAD_T = 24;
const PAD_B = 48;

export interface LifeGraphPoint {
  age: string;
  label: string;
  score: number;
  keyword: string;
}

interface LifeGraphProps {
  data: LifeGraphPoint[];
}

function scoreColor(s: number) {
  if (s >= 75) return theme.colors.success;
  if (s >= 55) return theme.colors.gold.primary;
  if (s >= 40) return theme.colors.warning;
  return theme.colors.error;
}

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const tension = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export const LifeGraph = React.memo(function LifeGraph({ data }: LifeGraphProps) {
  if (!data || data.length === 0) return null;

  const svgW = CHART_W;
  const svgH = CHART_H;
  const plotW = svgW - PAD_L - PAD_R;
  const plotH = svgH - PAD_T - PAD_B;

  const minScore = Math.min(...data.map(d => d.score));
  const maxScore = Math.max(...data.map(d => d.score));
  const scoreRange = Math.max(maxScore - minScore, 20);
  const yMin = Math.max(minScore - 10, 0);
  const yMax = Math.min(maxScore + 10, 100);
  const yRange = yMax - yMin;

  const points = data.map((d, i) => ({
    x: PAD_L + (i / (data.length - 1)) * plotW,
    y: PAD_T + plotH - ((d.score - yMin) / yRange) * plotH,
  }));

  const linePath = buildSmoothPath(points);
  // Area fill path
  const areaPath = linePath
    + ` L ${points[points.length - 1].x} ${PAD_T + plotH}`
    + ` L ${points[0].x} ${PAD_T + plotH} Z`;

  // Horizontal guide lines
  const guideScores = [yMin, Math.round((yMin + yMax) / 2), yMax];

  const peakIdx = data.reduce((mi, d, i, arr) => d.score > arr[mi].score ? i : mi, 0);

  return (
    <View style={styles.container}>
      <Svg width={svgW} height={svgH}>
        <Defs>
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.gold.primary} stopOpacity="0.18" />
            <Stop offset="1" stopColor={theme.colors.gold.primary} stopOpacity="0.02" />
          </LinearGradient>
          <LinearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={theme.colors.gold.dark} />
            <Stop offset="0.5" stopColor={theme.colors.gold.primary} />
            <Stop offset="1" stopColor={theme.colors.gold.light} />
          </LinearGradient>
        </Defs>

        {/* Guide lines */}
        {guideScores.map(s => {
          const y = PAD_T + plotH - ((s - yMin) / yRange) * plotH;
          return (
            <React.Fragment key={s}>
              <Line x1={PAD_L} y1={y} x2={svgW - PAD_R} y2={y}
                stroke="rgba(0,0,0,0.05)" strokeWidth={0.8} strokeDasharray="4,4" />
              <SvgText x={PAD_L - 6} y={y + 3} textAnchor="end"
                fontSize={9} fill={theme.colors.text.tertiary}>{s}</SvgText>
            </React.Fragment>
          );
        })}

        {/* Area fill */}
        <Path d={areaPath} fill="url(#areaGrad)" />

        {/* Line */}
        <Path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth={2.5}
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => {
          const color = scoreColor(data[i].score);
          const isPeak = i === peakIdx;
          return (
            <React.Fragment key={i}>
              {isPeak && (
                <Circle cx={p.x} cy={p.y} r={10} fill={color} opacity={0.12} />
              )}
              <Circle cx={p.x} cy={p.y} r={isPeak ? 5 : 3.5}
                fill="#fff" stroke={color} strokeWidth={isPeak ? 2.5 : 2} />

              {/* Age label */}
              <SvgText x={p.x} y={svgH - PAD_B + 14} textAnchor="middle"
                fontSize={9} fontWeight="600" fill={theme.colors.text.primary}>
                {data[i].age}
              </SvgText>

              {/* Daeun label */}
              <SvgText x={p.x} y={svgH - PAD_B + 26} textAnchor="middle"
                fontSize={8} fill={theme.colors.text.tertiary}>
                {data[i].label}
              </SvgText>

              {/* Score on peak */}
              {isPeak && (
                <SvgText x={p.x} y={p.y - 12} textAnchor="middle"
                  fontSize={11} fontWeight="700" fill={color}>
                  {data[i].score}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Keyword chips */}
      <View style={styles.kwRow}>
        {data.map((d, i) => {
          const isPeak = i === peakIdx;
          const color = scoreColor(d.score);
          return (
            <View key={i} style={[styles.kwChip, isPeak && { backgroundColor: color + '15', borderColor: color + '30' }]}>
              <Text style={[styles.kwScore, { color }]}>{d.score}</Text>
              <Text style={styles.kwText} numberOfLines={1}>{d.keyword}</Text>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
          <Text style={styles.legendText}>75+</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.gold.primary }]} />
          <Text style={styles.legendText}>55~74</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.warning }]} />
          <Text style={styles.legendText}>40~54</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.error }]} />
          <Text style={styles.legendText}>&lt;40</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  kwRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  kwChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  kwScore: {
    fontSize: 9,
    fontWeight: '700',
  },
  kwText: {
    fontSize: 8,
    color: theme.colors.text.tertiary,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.glass.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 9,
    color: theme.colors.text.tertiary,
  },
});
