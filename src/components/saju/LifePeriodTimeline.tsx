import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle as SvgCircle, Line, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';

const SCREEN_W = Dimensions.get('window').width;

export interface LifePeriod {
  period: string;
  ageRange: string;
  score: number;
  keyword: string;
  summary: string;
}

interface LifePeriodTimelineProps {
  data: LifePeriod[];
}

function scoreColor(s: number) {
  if (s >= 75) return theme.colors.success;
  if (s >= 55) return theme.colors.gold.primary;
  if (s >= 40) return theme.colors.warning;
  return theme.colors.error;
}

const PERIOD_ICONS: Record<string, string> = {
  '초년운': '🌱',
  '중년운': '🌳',
  '말년운': '🍂',
};
const PERIOD_LABELS: Record<string, string> = {
  '초년운': '초년',
  '중년운': '중년',
  '말년운': '말년',
};

function ScoreCircle({ score, size = 44 }: { score: number; size?: number }) {
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  const progress = (score / 100) * c;
  const color = scoreColor(score);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <SvgCircle cx={size / 2} cy={size / 2} r={r}
          stroke={theme.colors.bg.tertiary} strokeWidth={3} fill="none" />
        <SvgCircle cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={3} fill="none"
          strokeDasharray={`${c}`} strokeDashoffset={c - progress}
          strokeLinecap="round" rotation="-90" origin={`${size / 2}, ${size / 2}`} />
      </Svg>
      <Text style={{ fontSize: 13, fontWeight: '700', color }}>{score}</Text>
    </View>
  );
}

function AnimatedBar({ score, index, color }: { score: number; index: number; color: string }) {
  const w = useSharedValue(0);
  React.useEffect(() => {
    w.value = withDelay(index * 200, withTiming(score, { duration: 800, easing: Easing.out(Easing.cubic) }));
  }, [score]);
  const style = useAnimatedStyle(() => ({ width: `${w.value}%` as any }));
  return (
    <View style={s.barTrack}>
      <Animated.View style={[s.barFill, { backgroundColor: color }, style]} />
    </View>
  );
}

function PeriodItem({ item, index, isLast, bestIdx }: {
  item: LifePeriod; index: number; isLast: boolean; bestIdx: number;
}) {
  const color = scoreColor(item.score);
  const isBest = index === bestIdx;
  const icon = PERIOD_ICONS[item.period] || '○';
  const shortLabel = PERIOD_LABELS[item.period] || item.period;

  return (
    <View style={s.itemWrap}>
      {/* Left timeline rail */}
      <View style={s.rail}>
        {index > 0 && <View style={[s.railLine, { backgroundColor: theme.colors.glass.border }]} />}
        <View style={[s.railDot, { borderColor: color }, isBest && { backgroundColor: color + '20' }]}>
          <Text style={s.railIcon}>{icon}</Text>
        </View>
        {!isLast && <View style={[s.railLineBottom, { backgroundColor: theme.colors.glass.border }]} />}
      </View>

      {/* Content */}
      <View style={[s.card, isBest && { borderColor: color + '40', borderWidth: 1.5 }]}>
        <View style={s.cardTop}>
          <View style={s.cardTitleArea}>
            <Text style={[s.periodName, { color }]}>{shortLabel}</Text>
            <Text style={s.ageRange}>{item.ageRange}</Text>
            {isBest && (
              <View style={[s.bestBadge, { backgroundColor: color + '15' }]}>
                <Text style={[s.bestText, { color }]}>BEST</Text>
              </View>
            )}
          </View>
          <ScoreCircle score={item.score} />
        </View>

        <View style={s.kwRow}>
          <View style={[s.kwChip, { backgroundColor: color + '12' }]}>
            <Text style={[s.kwText, { color }]}>{item.keyword}</Text>
          </View>
        </View>

        <AnimatedBar score={item.score} index={index} color={color} />

        <Text style={s.summary}>{item.summary}</Text>
      </View>
    </View>
  );
}

export const LifePeriodTimeline = React.memo(function LifePeriodTimeline({ data }: LifePeriodTimelineProps) {
  if (!data || data.length === 0) return null;
  const bestIdx = data.reduce((mi, d, i, arr) => d.score > arr[mi].score ? i : mi, 0);

  return (
    <View style={s.container}>
      {data.map((item, i) => (
        <PeriodItem key={i} item={item} index={i} isLast={i === data.length - 1} bestIdx={bestIdx} />
      ))}
    </View>
  );
});

const s = StyleSheet.create({
  container: { marginTop: 4 },

  itemWrap: { flexDirection: 'row', minHeight: 100 },

  // Timeline rail
  rail: { width: 36, alignItems: 'center' },
  railLine: { width: 2, height: 12 },
  railLineBottom: { width: 2, flex: 1 },
  railDot: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.bg.primary,
  },
  railIcon: { fontSize: 14 },

  // Card
  card: {
    flex: 1, marginLeft: 8, marginBottom: 12,
    backgroundColor: theme.colors.bg.secondary, borderRadius: theme.radius.md,
    padding: 12, borderWidth: 1, borderColor: 'transparent',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitleArea: { flex: 1, gap: 2 },
  periodName: { fontSize: 15, fontWeight: '700' },
  ageRange: { fontSize: 11, color: theme.colors.text.tertiary, fontWeight: '500' },
  bestBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 2 },
  bestText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  kwRow: { marginTop: 6, flexDirection: 'row' },
  kwChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  kwText: { fontSize: 11, fontWeight: '600' },

  barTrack: { height: 5, backgroundColor: theme.colors.bg.tertiary, borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  barFill: { height: '100%', borderRadius: 3, minWidth: 4 },

  summary: { fontSize: 12, color: theme.colors.text.secondary, lineHeight: 18, marginTop: 8 },
});
