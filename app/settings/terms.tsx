import React from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { BackButton } from '../../src/components/ui/BackButton';

export default function TermsScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BackButton />

      <Text style={styles.title}>{t('terms.title')}</Text>
      <Text style={styles.body}>{t('terms.body')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.primary },
  content: { padding: theme.spacing.lg, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: theme.spacing.lg },
  body: { fontSize: 14, color: theme.colors.text.secondary, lineHeight: 22 },
});
