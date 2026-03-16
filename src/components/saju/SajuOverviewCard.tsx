import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { theme } from '../../constants/theme';
import { GlassCard } from '../ui/GlassCard';
import type { SajuOverview } from '../../types/api';

const ITEMS: { key: keyof Omit<SajuOverview, 'poeticTitle' | 'hookQuestion'>; hanja: string; meaning: string; section: string }[] = [
  { key: 'personality',    hanja: '性', meaning: '성격', section: 'personality' },
  { key: 'career',         hanja: '職', meaning: '직업', section: 'career' },
  { key: 'wealth',         hanja: '財', meaning: '재물', section: 'wealth' },
  { key: 'love',           hanja: '緣', meaning: '인연', section: 'love' },
  { key: 'health',         hanja: '體', meaning: '건강', section: 'health' },
  { key: 'family',         hanja: '家', meaning: '가족', section: 'family' },
  { key: 'social',         hanja: '友', meaning: '대인', section: 'social' },
  { key: 'yearly',         hanja: '歲', meaning: '올해', section: 'yearly' },
  { key: 'lifePeak',       hanja: '運', meaning: '대운', section: 'lifePeak' },
  { key: 'lifeDirection',  hanja: '道', meaning: '방향', section: 'lifeDirection' },
];

interface Props {
  overview: SajuOverview;
  onItemPress: (section: string) => void;
}

export const SajuOverviewCard = React.memo(function SajuOverviewCard({ overview, onItemPress }: Props) {
  const { t } = useTranslation();

  return (
    <GlassCard gold style={styles.card}>
      {/* Item rows */}
      {ITEMS.map((item, idx) => {
        const value = overview[item.key];
        if (!value) return null;

        return (
          <Animated.View key={item.key} entering={FadeInDown.delay(60 + idx * 30).springify()}>
            <TouchableOpacity
              style={[styles.row, idx < ITEMS.length - 1 && styles.rowBorder]}
              onPress={() => onItemPress(item.section)}
              activeOpacity={0.6}
            >
              <View style={styles.badgeWrap}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.hanja}</Text>
                </View>
                <Text style={styles.badgeMeaning}>{item.meaning}</Text>
              </View>
              <Text style={styles.rowValue} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>{value}</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
    paddingBottom: 2,
  },
  poeticTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.gold.dark,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  hookQuestion: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 22,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(181, 149, 48, 0.15)',
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    gap: 10,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  badgeWrap: {
    alignItems: 'center',
    width: 32,
  },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(181, 149, 48, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.gold.primary,
  },
  badgeMeaning: {
    fontSize: 9,
    color: theme.colors.text.tertiary,
    marginTop: 2,
    fontWeight: '500',
  },
  rowValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.primary,
    lineHeight: 18,
  },
  arrow: {
    fontSize: 18,
    fontWeight: '300',
    color: theme.colors.text.tertiary,
    marginLeft: 2,
  },
});
