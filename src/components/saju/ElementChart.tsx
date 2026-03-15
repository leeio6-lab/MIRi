import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { theme } from '../../constants/theme';
import { GlassCard } from '../ui/GlassCard';

interface ElementChartProps {
  balance: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  noCard?: boolean;
}

const ELEMENTS = [
  { key: 'wood', label: '木', ko: '목', color: theme.colors.elements.wood, emoji: '' },
  { key: 'fire', label: '火', ko: '화', color: theme.colors.elements.fire, emoji: '' },
  { key: 'earth', label: '土', ko: '토', color: theme.colors.elements.earth, emoji: '' },
  { key: 'metal', label: '金', ko: '금', color: theme.colors.elements.metal, emoji: '' },
  { key: 'water', label: '水', ko: '수', color: theme.colors.elements.water, emoji: '' },
] as const;

function ElementBar({ element, value, index }: { element: typeof ELEMENTS[number]; value: number; index: number }) {
  const width = useSharedValue(0);

  React.useEffect(() => {
    width.value = withDelay(
      index * 120,
      withTiming(value, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
  }, [value]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={styles.barRow}>
      <View style={styles.barLabel}>
        <Text style={[styles.elementHanja, { color: element.color }]}>{element.label}</Text>
        <Text style={styles.elementKo}>{element.ko}</Text>
      </View>
      <View style={styles.barTrack}>
        <Animated.View
          style={[styles.barFill, { backgroundColor: element.color }, barStyle]}
        />
      </View>
      <Text style={styles.barValue}>{value}%</Text>
    </View>
  );
}

export const ElementChart = React.memo(function ElementChart({ balance, noCard }: ElementChartProps) {
  const { t } = useTranslation();

  const content = (
    <>
      <Text style={styles.title}>{t('saju.elementBalance')}</Text>
      <View style={styles.chartContainer}>
        {ELEMENTS.map((el, i) => (
          <ElementBar
            key={el.key}
            element={el}
            value={balance[el.key as keyof typeof balance]}
            index={i}
          />
        ))}
      </View>
    </>
  );

  if (noCard) return <View>{content}</View>;
  return <GlassCard gold>{content}</GlassCard>;
});

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  chartContainer: {
    gap: theme.spacing.sm,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  barLabel: {
    minWidth: 36,
    alignItems: 'center',
  },
  elementHanja: {
    fontSize: 18,
    fontWeight: '700',
  },
  elementKo: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
  },
  barTrack: {
    flex: 1,
    height: 20,
    backgroundColor: theme.colors.bg.tertiary,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: theme.radius.sm,
    minWidth: 4,
  },
  barValue: {
    minWidth: 32,
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'right',
  },
});
