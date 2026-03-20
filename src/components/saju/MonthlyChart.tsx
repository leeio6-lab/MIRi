import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { theme } from '../../constants/theme';

const SCREEN_W = Dimensions.get('window').width;
// 모바일 잘림 방지: 좌우 여백을 충분히 확보
const CHART_W = Math.max(SCREEN_W - 56, 280);
const CHART_H = 170;
const PAD_L = 28;
const PAD_R = 12;
const PAD_T = 22;
const PAD_B = 36;

export interface MonthlyScore {
  month: string;
  score: number;
  keyword: string;
}

interface MonthlyChartProps {
  data: MonthlyScore[];
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

export const MonthlyChart = React.memo(function MonthlyChart({ data }: MonthlyChartProps) {
  if (!data || data.length === 0) return null;

  const svgW = CHART_W;
  const svgH = CHART_H;
  const plotW = svgW - PAD_L - PAD_R;
  const plotH = svgH - PAD_T - PAD_B;

  const scores = data.map(d => d.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const yMin = Math.max(minScore - 8, 0);
  const yMax = Math.min(maxScore + 8, 100);
  const yRange = Math.max(yMax - yMin, 15);

  const points = data.map((d, i) => ({
    x: PAD_L + (i / (data.length - 1)) * plotW,
    y: PAD_T + plotH - ((d.score - yMin) / yRange) * plotH,
  }));

  const linePath = buildSmoothPath(points);
  const areaPath = linePath
    + ` L ${points[points.length - 1].x} ${PAD_T + plotH}`
    + ` L ${points[0].x} ${PAD_T + plotH} Z`;

  const peakIdx = scores.reduce((mi, s, i) => s > scores[mi] ? i : mi, 0);
  const lowIdx = scores.reduce((mi, s, i) => s < scores[mi] ? i : mi, 0);

  // Guide lines
  const guideScores = [yMin, Math.round((yMin + yMax) / 2), yMax];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -8 }} contentContainerStyle={{ paddingHorizontal: 8 }}>
      <Svg width={Math.max(svgW, 340)} height={svgH}>
        <Defs>
          <LinearGradient id="monthAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.gold.primary} stopOpacity="0.15" />
            <Stop offset="1" stopColor={theme.colors.gold.primary} stopOpacity="0.01" />
          </LinearGradient>
          <LinearGradient id="monthLineGrad" x1="0" y1="0" x2="1" y2="0">
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
                stroke="rgba(0,0,0,0.04)" strokeWidth={0.8} strokeDasharray="3,3" />
              <SvgText x={PAD_L - 5} y={y + 3} textAnchor="end"
                fontSize={8} fill={theme.colors.text.tertiary}>{s}</SvgText>
            </React.Fragment>
          );
        })}

        {/* Area fill */}
        <Path d={areaPath} fill="url(#monthAreaGrad)" />

        {/* Line */}
        <Path d={linePath} fill="none" stroke="url(#monthLineGrad)" strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => {
          const color = scoreColor(data[i].score);
          const isPeak = i === peakIdx;
          const isLow = i === lowIdx;
          const isHighlight = isPeak || isLow;

          return (
            <React.Fragment key={i}>
              {/* Glow for peak/low */}
              {isHighlight && (
                <Circle cx={p.x} cy={p.y} r={8} fill={color} opacity={0.12} />
              )}

              {/* Dot */}
              <Circle cx={p.x} cy={p.y} r={isHighlight ? 4 : 2.5}
                fill="#fff" stroke={color} strokeWidth={isHighlight ? 2 : 1.5} />

              {/* Score label on peak & low */}
              {isHighlight && (
                <SvgText x={p.x} y={p.y - 10} textAnchor="middle"
                  fontSize={10} fontWeight="700" fill={color}>
                  {data[i].score}
                </SvgText>
              )}

              {/* Month label */}
              <SvgText x={p.x} y={svgH - PAD_B + 14} textAnchor="middle"
                fontSize={9} fontWeight={isHighlight ? '700' : '400'}
                fill={isHighlight ? color : theme.colors.text.tertiary}>
                {data[i].month.replace('월', '')}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
      </ScrollView>

      {/* Keyword chips row */}
      <View style={styles.kwRow}>
        {data.map((d, i) => {
          const isPeak = i === peakIdx;
          const isLow = i === lowIdx;
          const color = scoreColor(d.score);
          if (!isPeak && !isLow) return null;
          return (
            <View key={i} style={[styles.kwChip, { backgroundColor: color + '12', borderColor: color + '30' }]}>
              <Text style={[styles.kwLabel, { color }]}>{isPeak ? 'BEST' : '주의'}</Text>
              <Text style={[styles.kwMonth, { color }]}>{d.month}</Text>
              <Text style={styles.kwText}>{d.keyword}</Text>
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
    marginTop: theme.spacing.xs,
  },
  kwRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  kwChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  kwLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  kwMonth: {
    fontSize: 11,
    fontWeight: '700',
  },
  kwText: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
  },
});
