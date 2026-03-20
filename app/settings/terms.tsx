import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { BackButton } from '../../src/components/ui/BackButton';

export default function TermsScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <BackButton />

      <View style={styles.header}>
        <Text style={styles.headerChar}>約</Text>
        <Text style={styles.title}>{t('terms.title')}</Text>
      </View>

      <View style={styles.dateBox}>
        <Text style={styles.dateText}>시행일: 2026년 3월 20일</Text>
      </View>

      <Text style={styles.body}>{t('terms.body')}</Text>

      <View style={styles.contactBox}>
        <Text style={styles.contactLabel}>문의처</Text>
        <TouchableOpacity onPress={() => Linking.openURL('mailto:myeongri.app@gmail.com')}>
          <Text style={styles.contactEmail}>myeongri.app@gmail.com</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.primary },
  content: { padding: theme.spacing.screenPadding, paddingTop: 60, paddingBottom: 80 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  headerChar: { fontSize: 22, fontWeight: '200', color: theme.colors.gold.primary, letterSpacing: 2 },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.text.primary, letterSpacing: 0.5 },
  dateBox: { backgroundColor: theme.colors.gold.primary + '08', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 20 },
  dateText: { fontSize: 12, color: theme.colors.gold.dark, fontWeight: '500' },
  body: { fontSize: 14, color: theme.colors.text.secondary, lineHeight: 24, letterSpacing: 0.3 },
  contactBox: { marginTop: 32, backgroundColor: theme.colors.bg.secondary, borderRadius: 12, padding: 16, alignItems: 'center', gap: 6 },
  contactLabel: { fontSize: 12, color: theme.colors.text.tertiary, fontWeight: '600', letterSpacing: 1 },
  contactEmail: { fontSize: 15, color: theme.colors.gold.primary, fontWeight: '600', textDecorationLine: 'underline' },
});
