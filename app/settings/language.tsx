import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { BackButton } from '../../src/components/ui/BackButton';

const LANGUAGES = [
  { code: 'ko', label: '한국어', native: '한국어' },
  { code: 'ja', label: '日本語', native: '日本語' },
  { code: 'en', label: 'English', native: 'English' },
];

export default function LanguageScreen() {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language;

  return (
    <View style={styles.container}>
      <BackButton />

      <Text style={styles.title}>{t('mypage.language')}</Text>

      <GlassCard style={styles.card}>
        {LANGUAGES.map((lang, i) => (
          <React.Fragment key={lang.code}>
            {i > 0 && <View style={styles.divider} />}
            <TouchableOpacity
              style={styles.langItem}
              onPress={() => i18n.changeLanguage(lang.code)}
            >
              <Text style={styles.langLabel}>{lang.native}</Text>
              {currentLang === lang.code && (
                <Text style={styles.check}>✓</Text>
              )}
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.primary, padding: theme.spacing.lg, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: theme.spacing.lg },
  card: { padding: 0 },
  langItem: { flexDirection: 'row', justifyContent: 'space-between', padding: theme.spacing.md },
  langLabel: { fontSize: 16, color: theme.colors.text.primary },
  check: { fontSize: 18, color: theme.colors.gold.primary },
  divider: { height: 1, backgroundColor: theme.colors.glass.border, marginHorizontal: theme.spacing.md },
});
