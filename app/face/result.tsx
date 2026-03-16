import React from 'react';
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

export default function FaceResultScreen() {
  const { t } = useTranslation();
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
      {/* Header */}
      <View style={s.nav}>
        <BackButton />
        <View style={s.brand}>
          <Text style={s.logo}>MIRi</Text>
          <Text style={s.tagline}>얼굴에 담긴 운명</Text>
        </View>
        <View style={{ width: 34 }} />
      </View>

      {/* Portrait */}
      {imageUri && (
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <View style={s.portraitWrap}>
            <Image
              source={{ uri: imageUri }}
              style={[s.portrait, { width: portraitSize, height: portraitSize }]}
            />
          </View>
        </Animated.View>
      )}

      {/* Score */}
      <Animated.View entering={FadeInDown.delay(imageUri ? 200 : 100).springify()}>
        <View style={s.scoreWrap}>
          <Text style={s.score}>{faceResult.overallScore}</Text>
          {faceResult.shareTitle && (
            <Text style={s.shareTitle}>{faceResult.shareTitle}</Text>
          )}
        </View>
        {faceResult.summary ? (
          <Text style={s.summary}>{faceResult.summary}</Text>
        ) : null}
      </Animated.View>

      {/* Features */}
      {features.map((feature, i) => (
        <Animated.View key={feature.area} entering={FadeInDown.delay(200 + i * 60).springify()}>
          <View style={s.featureCard}>
            <View style={s.featureTop}>
              <Text style={s.featureArea}>
                {AREA_LABELS[feature.area] ?? feature.area}
              </Text>
              <Text style={s.featureScore}>{feature.score}</Text>
            </View>
            <View style={s.bar}>
              <View style={[s.barFill, { width: `${feature.score}%` }]} />
            </View>
            <Text style={s.featureDesc}>{feature.description}</Text>
            {feature.detail && (
              <Text style={s.featureDetail}>{feature.detail}</Text>
            )}
          </View>
        </Animated.View>
      ))}

      {/* Personality */}
      {faceResult.personality && (
        <Animated.View entering={FadeInDown.delay(600).springify()}>
          <View style={s.section}>
            <Text style={s.sectionLabel}>성격</Text>
            <Text style={s.sectionBody}>{faceResult.personality}</Text>
          </View>
        </Animated.View>
      )}

      {/* Fortune */}
      {faceResult.fortune && (
        <Animated.View entering={FadeInDown.delay(700).springify()}>
          <View style={s.section}>
            <Text style={s.sectionLabel}>운세</Text>
            <Text style={s.sectionBody}>{faceResult.fortune}</Text>
          </View>
        </Animated.View>
      )}

      {/* Advice */}
      {faceResult.advice && (
        <Animated.View entering={FadeInDown.delay(800).springify()}>
          <View style={[s.section, s.adviceSection]}>
            <Text style={s.sectionBody}>{faceResult.advice}</Text>
          </View>
        </Animated.View>
      )}

      {/* Share */}
      <View style={s.shareWrap}>
        <ShareCard
          type="face"
          score={faceResult.overallScore}
          summary={faceResult.summary}
        />
      </View>

      <Text style={s.disclaimer}>{t('common.disclaimer')}</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 52 : 44, paddingBottom: 100 },
  empty: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#AEAEB2', fontSize: 15 },

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
    color: '#1C1C1E',
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '400',
    color: '#AEAEB2',
    letterSpacing: 1,
    marginTop: 1,
  },

  // Portrait
  portraitWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  portrait: {
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },

  // Score
  scoreWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  score: {
    fontSize: 52,
    fontWeight: '200',
    color: '#1C1C1E',
    letterSpacing: -2,
  },
  shareTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#636366',
    marginTop: 2,
  },
  summary: {
    fontSize: 15,
    fontWeight: '400',
    color: '#636366',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 28,
  },

  // Features
  featureCard: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  featureTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  featureArea: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  featureScore: {
    fontSize: 20,
    fontWeight: '300',
    color: '#1C1C1E',
  },
  bar: {
    height: 2,
    backgroundColor: '#F0F0F0',
    borderRadius: 1,
    overflow: 'hidden',
    marginBottom: 10,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#B59530',
    borderRadius: 1,
  },
  featureDesc: {
    fontSize: 14,
    fontWeight: '400',
    color: '#636366',
    lineHeight: 22,
  },
  featureDetail: {
    fontSize: 13,
    fontWeight: '400',
    color: '#AEAEB2',
    lineHeight: 20,
    marginTop: 4,
  },

  // Sections
  section: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#AEAEB2',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 15,
    fontWeight: '400',
    color: '#1C1C1E',
    lineHeight: 24,
  },
  adviceSection: {
    backgroundColor: '#FAFAFA',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderBottomWidth: 0,
  },

  // Share
  shareWrap: { marginTop: 28 },

  // Disclaimer
  disclaimer: {
    fontSize: 10,
    color: '#AEAEB2',
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 24,
  },
});
