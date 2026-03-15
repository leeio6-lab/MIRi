import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { theme } from '../../constants/theme';

interface GradientBgProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GradientBg({ children, style }: GradientBgProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.gradientTop} />
      <View style={styles.gradientBottom} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg.primary,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: theme.colors.bg.secondary,
    opacity: 0.5,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: theme.colors.bg.tertiary,
    opacity: 0.3,
  },
});
