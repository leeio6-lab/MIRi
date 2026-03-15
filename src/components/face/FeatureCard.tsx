import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { GlassCard } from '../ui/GlassCard';

interface FeatureCardProps {
  area: string;
  label: string;
  score: number;
  description: string;
  detail?: string;
}

export const FeatureCard = React.memo(function FeatureCard({ area, label, score, description, detail }: FeatureCardProps) {
  return (
    <GlassCard style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.score}>{score}점</Text>
      </View>

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${score}%` }]} />
      </View>

      <Text style={styles.description}>{description}</Text>
      {detail && <Text style={styles.detail}>{detail}</Text>}
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.sm },
  label: { fontSize: 15, fontWeight: '600', color: theme.colors.text.primary },
  score: { fontSize: 15, fontWeight: '700', color: theme.colors.gold.primary },
  barTrack: { height: 6, backgroundColor: theme.colors.bg.tertiary, borderRadius: 3, overflow: 'hidden', marginBottom: theme.spacing.sm },
  barFill: { height: '100%', backgroundColor: theme.colors.gold.primary, borderRadius: 3 },
  description: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },
  detail: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20, marginTop: theme.spacing.xs },
});
