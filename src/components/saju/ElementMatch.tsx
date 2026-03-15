import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

const ELEMENT_INFO: Record<string, { hanja: string; color: string }> = {
  '목': { hanja: '木', color: theme.colors.elements.wood },
  '화': { hanja: '火', color: theme.colors.elements.fire },
  '토': { hanja: '土', color: theme.colors.elements.earth },
  '금': { hanja: '金', color: theme.colors.elements.metal },
  '수': { hanja: '水', color: theme.colors.elements.water },
  wood: { hanja: '木', color: theme.colors.elements.wood },
  fire: { hanja: '火', color: theme.colors.elements.fire },
  earth: { hanja: '土', color: theme.colors.elements.earth },
  metal: { hanja: '金', color: theme.colors.elements.metal },
  water: { hanja: '水', color: theme.colors.elements.water },
};

// Extract the Korean element name (e.g., "수(水)" -> "수", "water" -> "water")
function getElementKey(s: string): string {
  const match = s.match(/^([가-힣])/);
  return match ? match[1] : s.toLowerCase().replace(/[^a-z]/g, '');
}

interface ElementMatchProps {
  aName?: string;
  bName?: string;
  aDominant: string; // e.g. "수(水)" or "water"
  aPercent: number;
  bDominant: string;
  bPercent: number;
  interaction: string;
  complementary: string;
}

export const ElementMatch = React.memo(function ElementMatch({
  aName = 'A',
  bName = 'B',
  aDominant,
  aPercent,
  bDominant,
  bPercent,
  interaction,
  complementary,
}: ElementMatchProps) {
  const aKey = getElementKey(aDominant);
  const bKey = getElementKey(bDominant);
  const aInfo = ELEMENT_INFO[aKey] || { hanja: '?', color: theme.colors.text.tertiary };
  const bInfo = ELEMENT_INFO[bKey] || { hanja: '?', color: theme.colors.text.tertiary };

  // Determine if 상생 or 상극
  const isClash = interaction.includes('극') || interaction.includes('剋') || interaction.includes('克');
  const arrowColor = isClash ? theme.colors.warning : theme.colors.success;
  const arrowSymbol = isClash ? '⚡' : '~';

  return (
    <View style={styles.container}>
      {/* Two circles with arrow */}
      <View style={styles.matchRow}>
        {/* Person A */}
        <View style={styles.personCol}>
          <View style={[styles.elementCircle, { borderColor: aInfo.color }]}>
            <Text style={[styles.elementHanja, { color: aInfo.color }]}>{aInfo.hanja}</Text>
          </View>
          <Text style={styles.personName} numberOfLines={1}>{aName}</Text>
          <Text style={styles.elementLabel} numberOfLines={1}>{aDominant}</Text>
          <Text style={styles.pctText}>{aPercent}%</Text>
        </View>

        {/* Arrow/Interaction */}
        <View style={styles.arrowCol}>
          <View style={[styles.arrowLine, { backgroundColor: arrowColor }]} />
          <View style={[styles.arrowBadge, { backgroundColor: arrowColor }]}>
            <Text style={styles.arrowText}>{arrowSymbol}</Text>
          </View>
          <View style={[styles.arrowLine, { backgroundColor: arrowColor }]} />
        </View>

        {/* Person B */}
        <View style={styles.personCol}>
          <View style={[styles.elementCircle, { borderColor: bInfo.color }]}>
            <Text style={[styles.elementHanja, { color: bInfo.color }]}>{bInfo.hanja}</Text>
          </View>
          <Text style={styles.personName} numberOfLines={1}>{bName}</Text>
          <Text style={styles.elementLabel} numberOfLines={1}>{bDominant}</Text>
          <Text style={styles.pctText}>{bPercent}%</Text>
        </View>
      </View>

      {/* Interaction description */}
      <View style={[styles.interactionBox, { borderColor: arrowColor }]}>
        <Text style={[styles.interactionTitle, { color: arrowColor }]}>
          {isClash ? '상극 관계' : '상생 관계'}
        </Text>
        <Text style={styles.interactionText}>{interaction}</Text>
      </View>

      {/* Complementary note */}
      {complementary ? (
        <View style={styles.compBox}>
          <Text style={styles.compTitle}>서로 채워주는 기운</Text>
          <Text style={styles.compText}>{complementary}</Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.sm,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: theme.spacing.md,
  },
  personCol: {
    alignItems: 'center',
    flex: 1,
  },
  elementCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
  },
  elementHanja: {
    fontSize: 24,
    fontWeight: '700',
  },
  personName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  elementLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  pctText: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
  },
  arrowCol: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 24, // align with circles
  },
  arrowLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  arrowBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  interactionBox: {
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  interactionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  interactionText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  compBox: {
    backgroundColor: theme.colors.bg.secondary,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
  },
  compTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.success,
    marginBottom: 4,
  },
  compText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
});
