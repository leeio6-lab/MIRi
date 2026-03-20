import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../constants/theme';
import {
  calculateFourPillars,
  getTenGod,
  getTenGodForBranch,
  getLifeStage,
  getHiddenStemsHanja,
  getSpiritStar,
  STEM_ELEMENTS,
  STEM_YINYANG,
} from '../../utils/saju-calc';
import type { FourPillarsCalc } from '../../utils/saju-calc';

const ELEMENT_COLORS: Record<string, string> = {
  wood: theme.colors.elements.wood,
  fire: theme.colors.elements.fire,
  earth: theme.colors.elements.earth,
  metal: theme.colors.elements.metal,
  water: theme.colors.elements.water,
};

interface SajuTableProps {
  pillars: FourPillarsCalc;
}

export const SajuTable = React.memo(function SajuTable({ pillars }: SajuTableProps) {
  const { t } = useTranslation();
  const dm = pillars.day.stemIdx;
  const dayBranch = pillars.day.branchIdx;

  const ELEMENT_SIGN: Record<string, string> = {
    wood: t('elements.woodShort'), fire: t('elements.fireShort'), earth: t('elements.earthShort'), metal: t('elements.metalShort'), water: t('elements.waterShort'),
  };

  const cols = [
    { label: t('pillar.hourPillar'), pillar: pillars.hour },
    { label: t('pillar.dayPillar'), pillar: pillars.day },
    { label: t('pillar.monthPillar'), pillar: pillars.month },
    { label: t('pillar.yearPillar'), pillar: pillars.year },
  ];

  return (
    <View style={st.container}>
      {/* 헤더 행 */}
      <View style={st.headerRow}>
        <View style={st.labelCell} />
        {cols.map(c => (
          <View key={c.label} style={st.headerCell}>
            <Text style={st.headerText}>{c.label}</Text>
          </View>
        ))}
      </View>

      {/* 천간 십성 */}
      <View style={st.row}>
        <View style={st.labelCell}><Text style={st.rowLabel}>십성</Text></View>
        {cols.map((c, i) => {
          const tg = i === 1 ? t('pillar.dayMaster') : getTenGod(dm, c.pillar.stemIdx);
          return (
            <View key={c.label} style={st.cell}>
              <Text style={st.tenGodText}>{tg}</Text>
            </View>
          );
        })}
      </View>

      {/* 천간 */}
      <View style={st.row}>
        <View style={st.labelCell}><Text style={st.rowLabel}>천간</Text></View>
        {cols.map(c => {
          const el = STEM_ELEMENTS[c.pillar.stemIdx];
          const yy = STEM_YINYANG[c.pillar.stemIdx];
          const color = ELEMENT_COLORS[el];
          return (
            <View key={c.label} style={[st.stemCell, { borderColor: color }]}>
              <Text style={[st.hanjaLarge, { color }]}>{c.pillar.stemHanja}</Text>
              <Text style={st.koreanSmall}>{c.pillar.stem}</Text>
              <Text style={[st.elementTag, { color }]}>{yy === '양' ? '+' : '-'}{ELEMENT_SIGN[el]}</Text>
            </View>
          );
        })}
      </View>

      {/* 지지 */}
      <View style={st.row}>
        <View style={st.labelCell}><Text style={st.rowLabel}>지지</Text></View>
        {cols.map(c => {
          const el = STEM_ELEMENTS[c.pillar.branchIdx % 5 * 2]; // approx
          // 지지 오행은 본기 기준
          const branchElement = ['water','earth','wood','wood','earth','fire','fire','earth','metal','metal','earth','water'][c.pillar.branchIdx];
          const color = ELEMENT_COLORS[branchElement];
          const yy = c.pillar.branchIdx % 2 === 0 ? '+' : '-';
          return (
            <View key={c.label} style={[st.branchCell, { borderColor: color }]}>
              <Text style={[st.hanjaLarge, { color }]}>{c.pillar.branchHanja}</Text>
              <Text style={st.koreanSmall}>{c.pillar.branch}</Text>
              <Text style={[st.elementTag, { color }]}>{yy}{ELEMENT_SIGN[branchElement]}</Text>
            </View>
          );
        })}
      </View>

      {/* 지지 십성 */}
      <View style={st.row}>
        <View style={st.labelCell}><Text style={st.rowLabel}>십성</Text></View>
        {cols.map(c => (
          <View key={c.label} style={st.cell}>
            <Text style={st.tenGodText}>{getTenGodForBranch(dm, c.pillar.branchIdx)}</Text>
          </View>
        ))}
      </View>

      {/* 지장간 */}
      <View style={st.row}>
        <View style={st.labelCell}><Text style={st.rowLabel}>지장간</Text></View>
        {cols.map(c => (
          <View key={c.label} style={st.cell}>
            <Text style={st.hiddenText}>{getHiddenStemsHanja(c.pillar.branchIdx)}</Text>
          </View>
        ))}
      </View>

      {/* 12운성 */}
      <View style={st.row}>
        <View style={st.labelCell}><Text style={st.rowLabel}>12운성</Text></View>
        {cols.map(c => (
          <View key={c.label} style={st.cell}>
            <Text style={st.lifeStageText}>{getLifeStage(dm, c.pillar.branchIdx)}</Text>
          </View>
        ))}
      </View>

      {/* 12신살 */}
      <View style={st.row}>
        <View style={st.labelCell}><Text style={st.rowLabel}>12신살</Text></View>
        {cols.map(c => (
          <View key={c.label} style={st.cell}>
            <Text style={st.spiritText}>{getSpiritStar(dayBranch, c.pillar.branchIdx)}</Text>
          </View>
        ))}
      </View>

      {/* 띠 */}
      {pillars.year.zodiac && (
        <View style={st.zodiacRow}>
          <Text style={st.zodiacText}>{pillars.year.zodiac}띠</Text>
        </View>
      )}
    </View>
  );
});

const st = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  labelCell: {
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  rowLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  stemCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg.elevated,
    borderWidth: 1.5,
    borderRadius: 10,
    marginHorizontal: 3,
    paddingVertical: 8,
  },
  branchCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg.elevated,
    borderWidth: 1.5,
    borderRadius: 10,
    marginHorizontal: 3,
    paddingVertical: 8,
  },
  hanjaLarge: {
    fontSize: 24,
    fontWeight: '700',
  },
  koreanSmall: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 1,
  },
  elementTag: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  tenGodText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.gold.primary,
  },
  hiddenText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    letterSpacing: 2,
  },
  lifeStageText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  spiritText: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.text.tertiary,
  },
  zodiacRow: {
    alignItems: 'center',
    marginTop: 6,
  },
  zodiacText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
});
