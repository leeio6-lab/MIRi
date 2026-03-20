import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import { theme } from '../../constants/theme';

const ITEM_H = 40;
const VISIBLE = 5;
const CENTER = Math.floor(VISIBLE / 2) * ITEM_H;

// ── Wheel Column ──
function WheelColumn({
  items,
  selectedIndex,
  onSelect,
  width,
  label,
}: {
  items: (string | number)[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  width: number;
  label: string;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    // 초기 위치 설정 (애니메이션 없이)
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: false });
      mountedRef.current = true;
    }, 50);
  }, []);

  useEffect(() => {
    if (mountedRef.current) {
      scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: true });
    }
  }, [selectedIndex]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const y = e.nativeEvent.contentOffset.y;
      const idx = Math.round(y / ITEM_H);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      if (clamped !== selectedIndex) {
        onSelect(clamped);
      }
      // 스냅 보정
      scrollRef.current?.scrollTo({ y: clamped * ITEM_H, animated: true });
    }, 80);
  }, [items.length, selectedIndex, onSelect]);

  return (
    <View style={[ws.col, { width }]}>
      <Text style={ws.label}>{label}</Text>
      <View style={[ws.wheelWrap, { height: ITEM_H * VISIBLE }]}>
        {/* 선택 강조 바 */}
        <View style={ws.highlight} pointerEvents="none" />
        {/* 상단 페이드 */}
        <View style={[ws.fade, ws.fadeTop]} pointerEvents="none" />
        {/* 하단 페이드 */}
        <View style={[ws.fade, ws.fadeBottom]} pointerEvents="none" />

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_H}
          decelerationRate={Platform.OS === 'ios' ? 'fast' : 0.9}
          onMomentumScrollEnd={handleScroll}
          onScrollEndDrag={handleScroll}
          contentContainerStyle={{
            paddingTop: CENTER,
            paddingBottom: CENTER,
          }}
          nestedScrollEnabled
        >
          {items.map((item, i) => (
            <View key={`${item}-${i}`} style={ws.item}>
              <Text style={[
                ws.itemText,
                i === selectedIndex && ws.itemTextSelected,
              ]}>
                {item}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const ws = StyleSheet.create({
  col: { alignItems: 'center' },
  label: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: 4,
    fontWeight: '500',
  },
  wheelWrap: {
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: theme.colors.bg.secondary,
  },
  highlight: {
    position: 'absolute',
    top: CENTER,
    left: 4,
    right: 4,
    height: ITEM_H,
    borderRadius: 8,
    backgroundColor: theme.colors.gold.primary + '12',
    borderWidth: 1,
    borderColor: theme.colors.gold.primary + '25',
    zIndex: 1,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: CENTER,
    zIndex: 2,
  },
  fadeTop: {
    top: 0,
    ...(Platform.OS === 'web'
      ? { background: `linear-gradient(to bottom, ${theme.colors.bg.secondary} 0%, transparent 100%)` } as any
      : {}),
  },
  fadeBottom: {
    bottom: 0,
    ...(Platform.OS === 'web'
      ? { background: `linear-gradient(to top, ${theme.colors.bg.secondary} 0%, transparent 100%)` } as any
      : {}),
  },
  item: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 16,
    fontWeight: '400',
    color: theme.colors.text.tertiary,
  },
  itemTextSelected: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
});

// ── DateInputRow ──

interface DateInputRowProps {
  year: string;
  month: string;
  day: string;
  onChangeYear: (v: string) => void;
  onChangeMonth: (v: string) => void;
  onChangeDay: (v: string) => void;
  variant?: 'card' | 'inline';
}

// 연도 범위
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1919 }, (_, i) => currentYear - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function getDays(y: number, m: number) {
  const max = new Date(y, m, 0).getDate();
  return Array.from({ length: max }, (_, i) => i + 1);
}

export function DateInputRow({
  year, month, day,
  onChangeYear, onChangeMonth, onChangeDay,
  variant = 'card',
}: DateInputRowProps) {
  const yearNum = parseInt(year, 10) || 1990;
  const monthNum = parseInt(month, 10) || 1;
  const dayNum = parseInt(day, 10) || 1;

  const days = getDays(yearNum, monthNum);
  const yearIdx = YEARS.indexOf(yearNum);
  const monthIdx = monthNum - 1;
  const dayIdx = Math.min(dayNum - 1, days.length - 1);

  const handleYear = useCallback((idx: number) => {
    onChangeYear(String(YEARS[idx]));
  }, [onChangeYear]);

  const handleMonth = useCallback((idx: number) => {
    onChangeMonth(String(MONTHS[idx]));
  }, [onChangeMonth]);

  const handleDay = useCallback((idx: number) => {
    onChangeDay(String(days[idx]));
  }, [onChangeDay, days]);

  return (
    <View style={[styles.container, variant === 'card' && styles.card]}>
      <WheelColumn
        items={YEARS}
        selectedIndex={yearIdx >= 0 ? yearIdx : 0}
        onSelect={handleYear}
        width={90}
        label="년"
      />
      <WheelColumn
        items={MONTHS}
        selectedIndex={monthIdx}
        onSelect={handleMonth}
        width={60}
        label="월"
      />
      <WheelColumn
        items={days}
        selectedIndex={dayIdx}
        onSelect={handleDay}
        width={60}
        label="일"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: theme.spacing.md,
  },
});
