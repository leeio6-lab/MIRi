import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../constants/theme';
import { GlassCard } from '../ui/GlassCard';
import type { FourPillarsCalc } from '../../utils/saju-calc';
import { getTenGod, getLifeStage } from '../../utils/saju-calc';

interface FourPillarsProps {
  pillars: FourPillarsCalc;
  noTitle?: boolean;
}

const ELEMENT_COLORS: Record<string, string> = {
  wood: theme.colors.elements.wood,
  fire: theme.colors.elements.fire,
  earth: theme.colors.elements.earth,
  metal: theme.colors.elements.metal,
  water: theme.colors.elements.water,
};

function PillarColumn({ label, stem, stemHanja, branch, branchHanja, element, tenGod, lifeStage, isDay }: {
  label: string;
  stem: string;
  stemHanja: string;
  branch: string;
  branchHanja: string;
  element: string;
  tenGod: string;
  lifeStage: string;
  isDay?: boolean;
}) {
  const { t } = useTranslation();
  const color = ELEMENT_COLORS[element] ?? theme.colors.text.primary;

  return (
    <View style={styles.pillarCol}>
      <Text style={styles.pillarLabel}>{label}</Text>
      <Text style={[styles.tenGod, { color }]}>{isDay ? t('pillar.dayMaster') : tenGod}</Text>
      <GlassCard style={{ ...styles.pillarCard, borderColor: color }}>
        <Text style={[styles.hanja, { color }]}>{stemHanja}</Text>
        <Text style={styles.korean}>{stem}</Text>
      </GlassCard>
      <GlassCard style={{ ...styles.pillarCard, borderColor: color }}>
        <Text style={[styles.hanja, { color }]}>{branchHanja}</Text>
        <Text style={styles.korean}>{branch}</Text>
      </GlassCard>
      <Text style={styles.lifeStage}>{lifeStage}</Text>
    </View>
  );
}

export const FourPillarsView = React.memo(function FourPillarsView({ pillars, noTitle }: FourPillarsProps) {
  const { t } = useTranslation();
  const dm = pillars.day.stemIdx;

  return (
    <View style={styles.container}>
      {!noTitle && <Text style={styles.title}>{t('saju.fourPillars')}</Text>}
      <View style={styles.pillarsRow}>
        <PillarColumn
          label={t('saju.hourPillar')}
          stem={pillars.hour.stem} stemHanja={pillars.hour.stemHanja}
          branch={pillars.hour.branch} branchHanja={pillars.hour.branchHanja}
          element={pillars.hour.element}
          tenGod={getTenGod(dm, pillars.hour.stemIdx)}
          lifeStage={getLifeStage(dm, pillars.hour.branchIdx)}
        />
        <PillarColumn
          label={t('saju.dayPillar')}
          stem={pillars.day.stem} stemHanja={pillars.day.stemHanja}
          branch={pillars.day.branch} branchHanja={pillars.day.branchHanja}
          element={pillars.day.element}
          tenGod="" lifeStage={getLifeStage(dm, pillars.day.branchIdx)}
          isDay
        />
        <PillarColumn
          label={t('saju.monthPillar')}
          stem={pillars.month.stem} stemHanja={pillars.month.stemHanja}
          branch={pillars.month.branch} branchHanja={pillars.month.branchHanja}
          element={pillars.month.element}
          tenGod={getTenGod(dm, pillars.month.stemIdx)}
          lifeStage={getLifeStage(dm, pillars.month.branchIdx)}
        />
        <PillarColumn
          label={t('saju.yearPillar')}
          stem={pillars.year.stem} stemHanja={pillars.year.stemHanja}
          branch={pillars.year.branch} branchHanja={pillars.year.branchHanja}
          element={pillars.year.element}
          tenGod={getTenGod(dm, pillars.year.stemIdx)}
          lifeStage={getLifeStage(dm, pillars.year.branchIdx)}
        />
      </View>
      {pillars.year.zodiac && (
        <Text style={styles.zodiac}>{pillars.year.zodiac}띠</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    marginBottom: 10,
  },
  pillarsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pillarCol: {
    alignItems: 'center',
    gap: 5,
  },
  pillarLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  tenGod: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    minHeight: 12,
  },
  pillarCard: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  hanja: {
    fontSize: 26,
    fontWeight: '700',
  },
  korean: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 1,
  },
  lifeStage: {
    fontSize: 9,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
  },
  zodiac: {
    marginTop: 8,
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
});
