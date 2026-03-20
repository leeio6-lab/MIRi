import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { ShareCard } from '../../src/components/ui/ShareCard';
import { BackButton } from '../../src/components/ui/BackButton';
import { useFortuneStore } from '../../src/stores/fortuneStore';

const SCREEN_W = Dimensions.get('window').width;

const AREA_LABELS: Record<string, string> = {
  forehead: '천정(天庭)',
  eyes: '감찰관(監察)',
  nose: '재백궁(財帛)',
  mouth: '출납관(出納)',
  jawline: '지각(地閣)',
  ears: '채청관(採聽)',
  chin: '지각(地閣)',
};

const AREA_HANJA: Record<string, string> = {
  forehead: '額', eyes: '目', nose: '鼻', mouth: '口', jawline: '顎', ears: '耳', chin: '顎',
};

export default function FaceResultScreen() {
  const { t } = useTranslation();
  const captureRef = useRef<View>(null);
  const { faceResult, transformedImageBase64 } = useFortuneStore();
  const imageUri = transformedImageBase64
    ? `data:image/png;base64,${transformedImageBase64}`
    : null;
  const portraitSize = Math.min(SCREEN_W - 64, 320);

  if (!faceResult) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyText}>분석 결과가 없습니다.</Text>
        <BackButton />
      </View>
    );
  }

  const features = Array.isArray(faceResult.features) ? faceResult.features : [];

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header (outside capture area) */}
      <View style={s.nav}>
        <BackButton />
        <View style={s.brand}>
          <Text style={s.logo}>명리</Text>
          <Text style={s.tagline}>얼굴에 담긴 운명</Text>
        </View>
        <View style={{ width: 34 }} />
      </View>

      {/* Capture area start */}
      <View ref={captureRef} style={s.captureArea} collapsable={false}>

      {/* Capture header */}
      <View style={s.captureHeader}>
        <Text style={s.logo}>명리</Text>
        <Text style={s.tagline}>얼굴에 담긴 운명</Text>
      </View>

      {/* Portrait */}
      {imageUri ? (
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <View style={s.portraitWrap}>
            <Image
              source={{ uri: imageUri }}
              style={[s.portrait, { width: portraitSize, height: portraitSize }]}
            />
          </View>
        </Animated.View>
      ) : (
        <View style={s.portraitWrap}>
          <Text style={s.noPortraitText}>이미지가 복원되지 않았습니다</Text>
        </View>
      )}

      {/* Score */}
      <Animated.View entering={FadeInDown.delay(imageUri ? 200 : 100).springify()}>
        <View style={s.scoreWrap}>
          <Text style={s.score}>{faceResult.overallScore}</Text>
          <Text style={s.scoreUnit}>점</Text>
        </View>
        {faceResult.shareTitle && (
          <Text style={s.shareTitle}>{faceResult.shareTitle}</Text>
        )}
        {faceResult.summary ? (
          <Text style={s.summary}>{faceResult.summary}</Text>
        ) : null}
      </Animated.View>

      {/* Features */}
      {features.length > 0 && (
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <GlassCard style={s.featuresCard}>
            <View style={s.featuresSectionHeader}>
              <View style={s.sectionLine} />
              <Text style={s.sectionLabel}>부위별 분석</Text>
              <View style={s.sectionLine} />
            </View>
            {features.map((feature, i) => (
              <View key={feature.area} style={[s.featureRow, i === features.length - 1 && s.featureRowLast]}>
                <View style={s.featureLeft}>
                  <Text style={s.featureHanja}>{AREA_HANJA[feature.area] ?? '相'}</Text>
                </View>
                <View style={s.featureCenter}>
                  <View style={s.featureNameRow}>
                    <Text style={s.featureArea}>{AREA_LABELS[feature.area] ?? feature.area}</Text>
                    <Text style={s.featureScoreNum}>{feature.score}</Text>
                  </View>
                  <View style={s.bar}>
                    <View style={[s.barFill, { width: `${feature.score}%` }]} />
                  </View>
                  <Text style={s.featureDesc}>{feature.description}</Text>
                  {feature.detail && (
                    <Text style={s.featureDetail}>{feature.detail}</Text>
                  )}
                </View>
              </View>
            ))}
          </GlassCard>
        </Animated.View>
      )}

      {/* Personality */}
      {faceResult.personality && (
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <GlassCard style={s.analysisCard}>
            <Text style={s.cardLabel}>性 성격</Text>
            <Text style={s.sectionBody}>{faceResult.personality}</Text>
          </GlassCard>
        </Animated.View>
      )}

      {/* Fortune */}
      {faceResult.fortune && (
        <Animated.View entering={FadeInDown.delay(600).springify()}>
          <GlassCard style={s.analysisCard}>
            <Text style={s.cardLabel}>運 운세</Text>
            <Text style={s.sectionBody}>
              {typeof faceResult.fortune === 'string' ? faceResult.fortune : JSON.stringify(faceResult.fortune)}
            </Text>
          </GlassCard>
        </Animated.View>
      )}

      {/* Advice */}
      {faceResult.advice && (
        <Animated.View entering={FadeInDown.delay(700).springify()}>
          <GlassCard style={s.analysisCard}>
            <Text style={s.cardLabel}>開 조언</Text>
            <Text style={s.sectionBody}>{faceResult.advice}</Text>
          </GlassCard>
        </Animated.View>
      )}

      {/* Capture footer */}
      <View style={s.captureFooter}>
        <Text style={s.captureFooterText}>명리 — 운명의 이치를 읽다</Text>
      </View>

      </View>{/* Capture area end */}

      {/* Share */}
      <View style={s.shareWrap}>
        <ShareCard data={{
          type: 'face',
          score: faceResult.overallScore,
          tag: faceResult.shareTitle || '관상',
          hookLine: faceResult.hookLine ?? faceResult.summary ?? '',
          portraitBase64: transformedImageBase64 ?? undefined,
        }} />
      </View>

      <Text style={s.disclaimer}>{t('common.disclaimer')}</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.primary },
  content: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 52 : 44, paddingBottom: 100 },
  empty: { flex: 1, backgroundColor: theme.colors.bg.primary, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: theme.colors.text.tertiary, fontSize: 15, letterSpacing: 0.5 },

  // Nav
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  brand: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    fontSize: 15,
    fontWeight: '200',
    color: theme.colors.text.primary,
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '400',
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
    marginTop: 1,
  },

  // Portrait
  portraitWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  portrait: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg.secondary,
    ...theme.shadow.card,
  },
  noPortraitText: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: 24,
  },

  // Score
  scoreWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 4,
  },
  score: {
    fontSize: 42,
    fontWeight: '500',
    color: theme.colors.gold.primary,
    letterSpacing: -1,
  },
  scoreUnit: {
    fontSize: 16,
    fontWeight: '400',
    color: theme.colors.gold.dark,
  },
  shareTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 1,
  },
  summary: {
    fontSize: 13,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.3,
  },

  // Features section
  featuresCard: {
    marginBottom: theme.spacing.sectionGap,
  },
  featuresSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border.divider,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    letterSpacing: 2,
  },
  featureRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.divider,
    gap: 14,
  },
  featureRowLast: {
    borderBottomWidth: 0,
  },
  featureLeft: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.gold.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureHanja: {
    fontSize: 15,
    fontWeight: '300',
    color: theme.colors.gold.dark,
    letterSpacing: 1,
  },
  featureCenter: {
    flex: 1,
  },
  featureNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  featureArea: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
  },
  featureScoreNum: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.gold.primary,
    letterSpacing: -0.5,
  },
  bar: {
    height: 3,
    backgroundColor: theme.colors.bg.tertiary,
    borderRadius: 1.5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  barFill: {
    height: '100%',
    backgroundColor: theme.colors.gold.primary,
    borderRadius: 1.5,
  },
  featureDesc: {
    fontSize: 13,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  featureDetail: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.colors.text.tertiary,
    lineHeight: 20,
    marginTop: 6,
    letterSpacing: 0.3,
  },

  // Analysis Cards
  analysisCard: {
    marginBottom: theme.spacing.sectionGap,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.gold.dark,
    letterSpacing: 2,
    marginBottom: 12,
  },
  sectionBody: {
    fontSize: 13,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    lineHeight: 22,
    letterSpacing: 0.3,
  },

  // Capture area
  captureArea: {
    backgroundColor: theme.colors.bg.primary,
    paddingBottom: 20,
  },
  captureHeader: {
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  captureFooter: {
    alignItems: 'center' as const,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.divider,
  },
  captureFooterText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: theme.colors.text.tertiary,
    letterSpacing: 2,
  },

  // Share
  shareWrap: { marginTop: 8 },

  // Disclaimer
  disclaimer: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 24,
    letterSpacing: 0.5,
  },
});
