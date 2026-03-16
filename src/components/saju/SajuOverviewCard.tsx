import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { theme } from '../../constants/theme';
import type { SajuOverview } from '../../types/api';
import Svg, { Path, Circle as SvgCircle, Rect } from 'react-native-svg';

const G = theme.colors.gold.primary;

// ── 커스텀 SVG 아이콘 (골드, 18px) ──
function IcPersonality() {
  return <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><SvgCircle cx={12} cy={8} r={4} stroke={G} strokeWidth={1.8} /><Path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" stroke={G} strokeWidth={1.8} strokeLinecap="round" /><Path d="M15 6c1 1.5 1 3 0 4" stroke={G} strokeWidth={1.3} strokeLinecap="round" opacity={0.5} /></Svg>;
}
function IcCareer() {
  return <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Rect x={3} y={7} width={18} height={13} rx={2} stroke={G} strokeWidth={1.8} /><Path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" stroke={G} strokeWidth={1.8} /><Path d="M3 12h18" stroke={G} strokeWidth={1.3} opacity={0.4} /></Svg>;
}
function IcWealth() {
  return <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><SvgCircle cx={12} cy={12} r={9} stroke={G} strokeWidth={1.8} /><Path d="M12 6v12M9 9.5c0-1.1 1.3-2 3-2s3 .9 3 2-1.3 2-3 2-3 .9-3 2 1.3 2 3 2 3-.9 3-2" stroke={G} strokeWidth={1.5} strokeLinecap="round" /></Svg>;
}
function IcLove() {
  return <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M12 21s-7-5.3-7-10c0-2.8 2.2-5 5-5 1.5 0 2.8.7 3.5 1.7" stroke={G} strokeWidth={1.8} strokeLinecap="round" /><Path d="M12 21s7-5.3 7-10c0-2.8-2.2-5-5-5-1.5 0-2.8.7-3.5 1.7" stroke={G} strokeWidth={1.8} strokeLinecap="round" /></Svg>;
}
function IcHealth() {
  return <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M4 12h4l2-6 4 12 2-6h4" stroke={G} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}
function IcFamily() {
  return <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M3 21l3-12 6-6 6 6 3 12z" stroke={G} strokeWidth={1.8} strokeLinejoin="round" /><Rect x={9} y={14} width={6} height={7} rx={0.5} stroke={G} strokeWidth={1.5} /><SvgCircle cx={12} cy={10} r={1.5} fill={G} fillOpacity={0.3} /></Svg>;
}
function IcSocial() {
  return <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><SvgCircle cx={9} cy={8} r={3} stroke={G} strokeWidth={1.6} /><SvgCircle cx={17} cy={9} r={2.5} stroke={G} strokeWidth={1.4} opacity={0.6} /><Path d="M2 19c0-3.5 3-6 7-6s7 2.5 7 6" stroke={G} strokeWidth={1.6} strokeLinecap="round" /><Path d="M16 13c2.5 0 5 1.5 5 4" stroke={G} strokeWidth={1.3} strokeLinecap="round" opacity={0.5} /></Svg>;
}
function IcYearly() {
  return <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Rect x={3} y={4} width={18} height={17} rx={2} stroke={G} strokeWidth={1.8} /><Path d="M3 9h18" stroke={G} strokeWidth={1.5} /><Path d="M8 2v4M16 2v4" stroke={G} strokeWidth={1.8} strokeLinecap="round" /><SvgCircle cx={12} cy={15} r={2} fill={G} fillOpacity={0.25} stroke={G} strokeWidth={1.2} /></Svg>;
}
function IcLifePeak() {
  return <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M3 20l4-6 4 3 5-10 5 7" stroke={G} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><SvgCircle cx={16} cy={7} r={2} fill={G} fillOpacity={0.3} stroke={G} strokeWidth={1.3} /></Svg>;
}
function IcDirection() {
  return <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M12 2l7 10-7 10-7-10z" stroke={G} strokeWidth={1.8} strokeLinejoin="round" /><Path d="M12 2v20" stroke={G} strokeWidth={1.2} opacity={0.3} /><Path d="M5 12h14" stroke={G} strokeWidth={1.2} opacity={0.3} /><SvgCircle cx={12} cy={10} r={2} fill={G} fillOpacity={0.2} /></Svg>;
}

const ICON_MAP: Record<string, React.FC> = {
  personality: IcPersonality,
  career: IcCareer,
  wealth: IcWealth,
  love: IcLove,
  health: IcHealth,
  family: IcFamily,
  social: IcSocial,
  yearly: IcYearly,
  lifePeak: IcLifePeak,
  lifeDirection: IcDirection,
};

const ITEMS: { key: keyof Omit<SajuOverview, 'poeticTitle' | 'hookQuestion'>; label: string; section: string }[] = [
  { key: 'personality',    label: '성격', section: 'personality' },
  { key: 'career',         label: '직업', section: 'career' },
  { key: 'wealth',         label: '재물', section: 'wealth' },
  { key: 'love',           label: '인연', section: 'love' },
  { key: 'health',         label: '건강', section: 'health' },
  { key: 'family',         label: '가족', section: 'family' },
  { key: 'social',         label: '대인', section: 'social' },
  { key: 'yearly',         label: '올해', section: 'yearly' },
  { key: 'lifePeak',       label: '대운', section: 'lifePeak' },
  { key: 'lifeDirection',  label: '방향', section: 'lifeDirection' },
];

interface Props {
  overview: SajuOverview;
  onItemPress: (section: string) => void;
}

export const SajuOverviewCard = React.memo(function SajuOverviewCard({ overview, onItemPress }: Props) {
  const { t } = useTranslation();

  // AI가 지정한 핵심 항목, 없으면 가장 긴 항목으로 fallback
  const hotKey = React.useMemo(() => {
    if ((overview as any).hotKey) return (overview as any).hotKey;
    let longest = '';
    let hotSection = '';
    for (const item of ITEMS) {
      const v = overview[item.key];
      if (v && v.length > longest.length) { longest = v; hotSection = item.section; }
    }
    return hotSection;
  }, [overview]);

  return (
    <View style={styles.container}>
      {ITEMS.map((item, idx) => {
        const value = overview[item.key];
        if (!value) return null;
        const Icon = ICON_MAP[item.section];
        const isHot = item.section === hotKey;

        return (
          <Animated.View key={item.key} entering={FadeInDown.delay(40 + idx * 25).springify()}>
            <TouchableOpacity
              style={[styles.row, isHot && styles.hotRow]}
              onPress={() => onItemPress(item.section)}
              activeOpacity={0.5}
            >
              <View style={[styles.iconWrap, isHot && styles.hotIconWrap]}>
                {Icon && <Icon />}
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.value, isHot && styles.hotValue]} numberOfLines={2}>{value}</Text>
              </View>
              {isHot && <Text style={styles.hotDot}>●</Text>}
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
            {idx < ITEMS.length - 1 && <View style={styles.divider} />}
          </Animated.View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
    paddingHorizontal: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.colors.gold.primary + '0C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    lineHeight: 19,
  },
  arrow: {
    fontSize: 22,
    fontWeight: '400',
    color: theme.colors.gold.primary,
    opacity: 0.6,
  },

  // HOT 하이라이트
  hotRow: {
    backgroundColor: theme.colors.gold.primary + '08',
    borderRadius: 12,
    marginHorizontal: -6,
    paddingHorizontal: 6,
  },
  hotIconWrap: {
    backgroundColor: theme.colors.gold.primary + '1A',
    borderWidth: 1,
    borderColor: theme.colors.gold.primary + '25',
  },
  hotDot: {
    fontSize: 8,
    color: '#C4503D',
    marginRight: 2,
  },
  hotValue: {
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.glass.border,
    marginLeft: 42,
  },
});
