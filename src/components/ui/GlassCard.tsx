import React from 'react';
import { View, StyleSheet, Platform, type ViewStyle } from 'react-native';
import { theme } from '../../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gold?: boolean;
}

export const GlassCard = React.memo(function GlassCard({ children, style, gold }: GlassCardProps) {
  return (
    <View style={[styles.card, gold && styles.goldBorder, style]}>
      {children}
    </View>
  );
});

const cardShadow = Platform.select({
  web: { boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.06)' },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.cardPadding,
    ...cardShadow,
  } as any,
  goldBorder: {
    borderColor: theme.colors.gold.dark,
    borderWidth: 1.5,
  },
});
