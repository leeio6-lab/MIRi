import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';

const SCREEN_W = Dimensions.get('window').width;

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

const BAR_MAX_H = 100;

function MonthBar({ item, index, maxScore }: { item: MonthlyScore; index: number; maxScore: number }) {
  const height = useSharedValue(0);
  const targetH = Math.max((item.score / Math.max(maxScore, 100)) * BAR_MAX_H, 6);

  React.useEffect(() => {
    height.value = withDelay(
      index * 60,
      withTiming(targetH, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
  }, [targetH]);

  const barStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  const color = scoreColor(item.score);
  const isMax = item.score === maxScore;

  return (
    <View style={styles.barCol}>
      <Text style={[styles.scoreLabel, { color }]}>{item.score}</Text>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            { backgroundColor: color },
            isMax && styles.barPeak,
            barStyle,
          ]}
        />
      </View>
      <Text style={[styles.monthLabel, isMax && { color, fontWeight: '700' as const }]}>{item.month.replace('월', '')}</Text>
      <Text style={styles.kwLabel} numberOfLines={1}>{item.keyword}</Text>
    </View>
  );
}

export const MonthlyChart = React.memo(function MonthlyChart({ data }: MonthlyChartProps) {
  if (!data || data.length === 0) return null;

  const maxScore = Math.max(...data.map(d => d.score));

  // Split into two rows of 6 for mobile
  const firstHalf = data.slice(0, 6);
  const secondHalf = data.slice(6, 12);

  return (
    <View style={styles.container}>
      <View style={styles.chartRow}>
        {firstHalf.map((item, i) => (
          <MonthBar key={i} item={item} index={i} maxScore={maxScore} />
        ))}
      </View>
      {secondHalf.length > 0 && (
        <View style={styles.chartRow}>
          {secondHalf.map((item, i) => (
            <MonthBar key={i + 6} item={item} index={i + 6} maxScore={maxScore} />
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 2,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  barTrack: {
    width: '80%',
    height: BAR_MAX_H,
    backgroundColor: theme.colors.bg.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barPeak: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  monthLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  kwLabel: {
    fontSize: 8,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});
