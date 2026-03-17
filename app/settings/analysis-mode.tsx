import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { BackButton } from '../../src/components/ui/BackButton';
import { useUserStore, type AnalysisMode } from '../../src/stores/userStore';

export default function AnalysisModeScreen() {
  const { t } = useTranslation();
  const { analysisMode, setAnalysisMode } = useUserStore();

  const MODES: { key: AnalysisMode; icon: string; labelKey: string; descKey: string }[] = [
    { key: 'traditional', icon: '卜', labelKey: 'analysisMode.traditional', descKey: 'analysisMode.traditionalDesc' },
    { key: 'science', icon: '科', labelKey: 'analysisMode.scienceMode', descKey: 'analysisMode.scienceDesc' },
    { key: 'integrated', icon: '合', labelKey: 'analysisMode.integrated', descKey: 'analysisMode.integratedDesc' },
  ];

  return (
    <View style={styles.container}>
      <BackButton />

      <Text style={styles.title}>{t('analysisMode.title')}</Text>
      <Text style={styles.subtitle}>{t('analysisMode.subtitle')}</Text>

      <View style={styles.modes}>
        {MODES.map((mode) => {
          const isActive = analysisMode === mode.key;
          return (
            <TouchableOpacity
              key={mode.key}
              onPress={() => setAnalysisMode(mode.key)}
              activeOpacity={0.7}
            >
              <GlassCard
               
                gold={isActive}
                style={isActive ? { ...styles.modeCard, ...styles.modeCardActive } : styles.modeCard}
              >
                <Text style={[styles.modeIcon, isActive && styles.modeIconActive]}>
                  {mode.icon}
                </Text>
                <View style={styles.modeInfo}>
                  <Text style={[styles.modeLabel, isActive && styles.modeLabelActive]}>
                    {t(mode.labelKey)}
                  </Text>
                  <Text style={styles.modeDesc}>{t(mode.descKey)}</Text>
                </View>
                {isActive && <Text style={styles.check}>*</Text>}
              </GlassCard>
            </TouchableOpacity>
          );
        })}
      </View>

      <GlassCard style={styles.infoCard}>
        <Text style={styles.infoTitle}>{t('analysisMode.whatIsScience')}</Text>
        <Text style={styles.infoText}>{t('analysisMode.scienceExplain')}</Text>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.primary, padding: theme.spacing.lg, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: theme.spacing.xs },
  subtitle: { fontSize: 14, color: theme.colors.text.secondary, marginBottom: theme.spacing.xl },
  modes: { gap: theme.spacing.md, marginBottom: theme.spacing.xl },
  modeCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  modeCardActive: { backgroundColor: 'rgba(0,0,0,0.02)' },
  modeIcon: { fontSize: 28, fontWeight: '700', color: theme.colors.text.tertiary, width: 40, textAlign: 'center' },
  modeIconActive: { color: theme.colors.gold.primary },
  modeInfo: { flex: 1 },
  modeLabel: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary },
  modeLabelActive: { color: theme.colors.gold.primary },
  modeDesc: { fontSize: 13, color: theme.colors.text.secondary, marginTop: 2 },
  check: { fontSize: 20, color: theme.colors.gold.primary },
  infoCard: {},
  infoTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.info, marginBottom: theme.spacing.sm },
  infoText: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },
});
