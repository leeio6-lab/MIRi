import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { ShareCard } from '../../src/components/ui/ShareCard';
import { BackButton } from '../../src/components/ui/BackButton';
import { useFortuneStore } from '../../src/stores/fortuneStore';

export default function FaceResultScreen() {
  const { t } = useTranslation();
  const { faceResult } = useFortuneStore();

  if (!faceResult) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>분석 결과가 없습니다.</Text>
        <BackButton />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <BackButton />

      <Text style={styles.title}>관상 분석 결과</Text>

      {/* Score */}
      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <GlassCard gold style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>{t('face.overallScore')}</Text>
          <Text style={styles.score}>{faceResult.overallScore}</Text>
          <Text style={styles.summary}>{faceResult.summary}</Text>
        </GlassCard>
      </Animated.View>

      {/* Features */}
      {(Array.isArray(faceResult.features) ? faceResult.features : []).map((feature, i) => {
        const featureLabel = t(`face.features.${feature.area}`, { defaultValue: feature.area });
        return (
          <Animated.View key={feature.area} entering={FadeInDown.delay(300 + i * 100).springify()}>
            <GlassCard style={styles.featureCard}>
              <View style={styles.featureHeader}>
                <Text style={styles.featureName}>{featureLabel}</Text>
                <Text style={styles.featureScore}>{feature.score}점</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${feature.score}%` }]} />
              </View>
              <Text style={styles.featureDesc}>{feature.description}</Text>
              {feature.detail && (
                <Text style={styles.featureDetail}>{feature.detail}</Text>
              )}
            </GlassCard>
          </Animated.View>
        );
      })}

      {/* Personality / Fortune if available (paid) */}
      {faceResult.personality && (
        <Animated.View entering={FadeInDown.delay(800).springify()}>
          <GlassCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>성격 분석</Text>
            <Text style={styles.sectionText}>{faceResult.personality}</Text>
          </GlassCard>
        </Animated.View>
      )}

      {faceResult.fortune && (
        <Animated.View entering={FadeInDown.delay(900).springify()}>
          <GlassCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>운세</Text>
            <Text style={styles.sectionText}>{faceResult.fortune}</Text>
          </GlassCard>
        </Animated.View>
      )}

      {faceResult.advice && (
        <Animated.View entering={FadeInDown.delay(1000).springify()}>
          <GlassCard gold style={styles.sectionCard}>
            <Text style={styles.sectionTitleGold}>조언</Text>
            <Text style={styles.sectionTextGold}>{faceResult.advice}</Text>
          </GlassCard>
        </Animated.View>
      )}

      {/* Share Card */}
      <View style={styles.shareSection}>
        <ShareCard
          type="face"
          score={faceResult.overallScore}
          summary={faceResult.summary}
        />
      </View>

      <Text style={styles.disclaimer}>{t('common.disclaimer')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.primary },
  content: { padding: theme.spacing.screenPadding, paddingTop: 60, paddingBottom: 120 },
  empty: { flex: 1, backgroundColor: theme.colors.bg.primary, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: theme.colors.text.secondary, fontSize: 16 },
  title: { ...theme.typo.screenTitle, textAlign: 'center', marginBottom: theme.spacing.sectionGap },
  scoreCard: { alignItems: 'center', marginBottom: theme.spacing.md },
  scoreLabel: { fontSize: 14, color: theme.colors.text.secondary, marginBottom: theme.spacing.sm },
  score: { fontSize: 56, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: theme.spacing.md },
  summary: { fontSize: 14, color: theme.colors.text.secondary, lineHeight: 22, textAlign: 'center' },
  featureCard: { marginBottom: theme.spacing.sm },
  featureHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.sm },
  featureName: { fontSize: 15, fontWeight: '600', color: theme.colors.text.primary },
  featureScore: { fontSize: 15, fontWeight: '700', color: theme.colors.gold.primary },
  barTrack: { height: 6, backgroundColor: theme.colors.bg.tertiary, borderRadius: 3, overflow: 'hidden', marginBottom: theme.spacing.sm },
  barFill: { height: '100%', backgroundColor: theme.colors.gold.primary, borderRadius: 3 },
  featureDesc: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },
  featureDetail: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20, marginTop: theme.spacing.xs },
  sectionCard: { marginTop: theme.spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: theme.spacing.sm },
  sectionText: { fontSize: 14, color: theme.colors.text.secondary, lineHeight: 22 },
  sectionTitleGold: { fontSize: 16, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: theme.spacing.sm },
  sectionTextGold: { fontSize: 14, color: theme.colors.gold.muted, lineHeight: 22 },
  shareSection: { marginTop: theme.spacing.xl },
  disclaimer: { fontSize: 10, color: theme.colors.text.tertiary, textAlign: 'center', lineHeight: 14, marginTop: theme.spacing.xl },
});
