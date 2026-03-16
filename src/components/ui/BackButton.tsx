import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../../constants/theme';

interface BackButtonProps {
  fallback?: string;
}

export function BackButton({ fallback = '/(tabs)/home' }: BackButtonProps) {
  const router = useRouter();
  const { t } = useTranslation();

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
    <TouchableOpacity onPress={handleBack} style={styles.btn} activeOpacity={0.6}>
      <Text style={styles.arrow}>{'‹'}</Text>
      <Text style={styles.label}>{t('common.back')}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 8,
    paddingRight: 12,
    marginBottom: theme.spacing.md,
  },
  arrow: {
    fontSize: 22,
    fontWeight: '300',
    color: theme.colors.text.secondary,
    marginTop: -1,
  },
  label: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    fontWeight: '400',
  },
});
