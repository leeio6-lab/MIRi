import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { GlassCard } from '../ui/GlassCard';
import { useUserStore } from '../../stores/userStore';

interface ScienceLink {
  category: string;
  evidence: string;
  disclaimer: string;
}

interface FortuneCardProps {
  title: string;
  score: number;
  description: string;
  scienceLink?: ScienceLink;
  icon?: string;
}

export const FortuneCard = React.memo(function FortuneCard({ title, score, description, scienceLink, icon }: FortuneCardProps) {
  const { analysisMode } = useUserStore();
  const [scienceOpen, setScienceOpen] = useState(false);
  const showScience = analysisMode !== 'traditional' && scienceLink;

  const scoreColor =
    score >= 80 ? theme.colors.success :
    score >= 60 ? theme.colors.gold.primary :
    score >= 40 ? theme.colors.warning :
    theme.colors.error;

  return (
    <GlassCard style={styles.container}>
      <View style={styles.header}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.score, { color: scoreColor }]}>{score}점</Text>
      </View>
      <Text style={styles.description}>{description}</Text>

    </GlassCard>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  icon: {
    fontSize: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
  },
  score: {
    fontSize: 16,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  scienceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.glass.border,
  },
  scienceToggleIcon: {
    fontSize: 14,
    color: theme.colors.info,
  },
  scienceToggleText: {
    fontSize: 13,
    color: theme.colors.info,
    fontWeight: '500',
  },
  scienceBox: {
    marginTop: theme.spacing.sm,
    backgroundColor: '#F5F4F0',
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.info,
  },
  scienceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(90,142,200,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: theme.spacing.sm,
  },
  scienceBadgeText: {
    fontSize: 11,
    color: theme.colors.info,
    fontWeight: '600',
  },
  scienceEvidence: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 19,
    marginBottom: theme.spacing.sm,
  },
  scienceDisclaimer: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
    lineHeight: 14,
  },
});
