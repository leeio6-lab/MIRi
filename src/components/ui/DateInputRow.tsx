import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
  ViewToken,
} from 'react-native';
import { theme } from '../../constants/theme';

const ITEM_H = 44;
const VISIBLE = 5;
const CENTER_IDX = Math.floor(VISIBLE / 2);

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
  const flatRef = useRef<FlatList>(null);
  const ready = useRef(false);
  const scrolling = useRef(false);

  // 패딩용 빈 항목
  const padded = [
    ...Array(CENTER_IDX).fill(''),
    ...items,
    ...Array(CENTER_IDX).fill(''),
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      flatRef.current?.scrollToOffset({
        offset: selectedIndex * ITEM_H,
        animated: false,
      });
      ready.current = true;
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready.current && !scrolling.current) {
      flatRef.current?.scrollToOffset({
        offset: selectedIndex * ITEM_H,
        animated: true,
      });
    }
  }, [selectedIndex]);

  const handleScrollEnd = useCallback((e: any) => {
    scrolling.current = false;
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_H);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    if (clamped !== selectedIndex) {
      onSelect(clamped);
    }
  }, [items.length, selectedIndex, onSelect]);

  const handleScrollBegin = useCallback(() => {
    scrolling.current = true;
  }, []);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_H,
    offset: ITEM_H * index,
    index,
  }), []);

  const renderItem = useCallback(({ item, index }: { item: string | number; index: number }) => {
    const realIdx = index - CENTER_IDX;
    const isEmpty = item === '';
    const isSelected = realIdx === selectedIndex;
    return (
      <View style={s.item}>
        {!isEmpty && (
          <Text style={[s.itemText, isSelected && s.itemTextSelected]}>
            {item}
          </Text>
        )}
      </View>
    );
  }, [selectedIndex]);

  return (
    <View style={[s.col, { width }]}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.wheelWrap, { height: ITEM_H * VISIBLE }]}>
        {/* 선택 강조 바 */}
        <View style={s.highlight} pointerEvents="none" />

        <FlatList
          ref={flatRef}
          data={padded}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          keyExtractor={(item, i) => `${item}-${i}`}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_H}
          decelerationRate="fast"
          onScrollBeginDrag={handleScrollBegin}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={(e) => {
            // 느린 스크롤은 momentum 없이 끝남
            if (Platform.OS === 'web') handleScrollEnd(e);
          }}
          nestedScrollEnabled
          initialScrollIndex={selectedIndex}
          windowSize={7}
        />
      </View>
    </View>
  );
}

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
    <View style={[s.container, variant === 'card' && s.card]}>
      <WheelColumn
        items={YEARS}
        selectedIndex={yearIdx >= 0 ? yearIdx : 34}
        onSelect={handleYear}
        width={88}
        label="년"
      />
      <WheelColumn
        items={MONTHS}
        selectedIndex={monthIdx}
        onSelect={handleMonth}
        width={56}
        label="월"
      />
      <WheelColumn
        items={days}
        selectedIndex={dayIdx >= 0 ? dayIdx : 0}
        onSelect={handleDay}
        width={56}
        label="일"
      />
    </View>
  );
}

const s = StyleSheet.create({
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
    top: CENTER_IDX * ITEM_H,
    left: 4,
    right: 4,
    height: ITEM_H,
    borderRadius: 8,
    backgroundColor: theme.colors.gold.primary + '12',
    borderWidth: 1,
    borderColor: theme.colors.gold.primary + '25',
    zIndex: 1,
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
