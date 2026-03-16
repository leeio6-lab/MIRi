import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';

interface BackButtonProps {
  fallback?: string;
}

export function BackButton({ fallback = '/(tabs)/home' }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    try {
      if (router.canGoBack()) {
        router.back();
        return;
      }
    } catch {
      // GO_BACK not handled — fall through to replace
    }
    router.replace(fallback as any);
  };

  return (
    <TouchableOpacity onPress={handleBack} style={styles.btn} activeOpacity={0.5} hitSlop={12}>
      <Text style={styles.arrow}>{'\u2039'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignSelf: 'flex-start',
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 24,
    fontWeight: '300',
    color: theme.colors.text.primary,
    marginTop: -1,
    marginLeft: -2,
  },
});
