import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, { FadeInDown, FadeIn, FadeInUp } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { LoadingInk } from '../../src/components/ui/LoadingInk';
import { PaywallModal } from '../../src/components/ui/PaywallModal';
import { ShareCard } from '../../src/components/ui/ShareCard';
import { FaceOverlay } from '../../src/components/face/FaceOverlay';
import { FaceGuide } from '../../src/components/face/FaceGuide';
import { useFortuneStore } from '../../src/stores/fortuneStore';
import { usePurchaseStore } from '../../src/stores/purchaseStore';
import { useFace } from '../../src/hooks/useFace';
import { detectFaceLocal } from '../../src/utils/face-detect';

const { width } = Dimensions.get('window');

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function ensureFeaturesArray(features: unknown): { area: string; score: number; description: string; detail?: string; nickname?: string; position?: { x: number; y: number } }[] {
  if (Array.isArray(features)) return features;
  if (features && typeof features === 'object') {
    const areaOrder = ['forehead', 'eyes', 'nose', 'mouth', 'jawline', 'chin', 'ears'];
    const obj = features as Record<string, any>;
    return areaOrder
      .filter(area => obj[area])
      .map(area => ({
        area,
        score: obj[area].score ?? 75,
        description: obj[area].title ?? obj[area].description ?? obj[area].name ?? '',
        detail: obj[area].detail,
        nickname: obj[area].nickname,
        position: obj[area].position,
      }));
  }
  return [];
}

const AREA_LABELS: Record<string, string> = {
  forehead: '천정(天庭)',
  eyes: '감찰관(監察)',
  nose: '재백궁(財帛)',
  mouth: '출납관(出納)',
  jawline: '지각(地閣)',
  ears: '채청관(採聽)',
  chin: '지각(地閣)',
};

const AREA_ICONS: Record<string, string> = {
  forehead: '額', eyes: '目', nose: '鼻', mouth: '口', jawline: '顎', ears: '耳', chin: '顎',
};

const RADAR_LABELS: Record<string, { label: string; icon: string }> = {
  wealth:  { label: '재물운', icon: '財' },
  love:    { label: '연애운', icon: '愛' },
  health:  { label: '건강운', icon: '壽' },
  success: { label: '성공운', icon: '祿' },
  social:  { label: '사교운', icon: '和' },
};

// ────────────────────────────────────────────────────────────────────────────
// Expandable Feature Card
// ────────────────────────────────────────────────────────────────────────────

function FeatureExpandCard({
  feature,
  isActive,
  onToggle,
}: {
  feature: { area: string; score: number; description: string; detail?: string; nickname?: string };
  isActive: boolean;
  onToggle: () => void;
}) {
  const icon = AREA_ICONS[feature.area] ?? '相';
  const label = AREA_LABELS[feature.area] ?? feature.area;
  const scoreColor = feature.score >= 85 ? '#D4B245' : feature.score >= 75 ? '#B59530' : '#8A7220';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onToggle}
      style={[rs.featureCard, isActive && rs.featureCardActive]}
    >
      {/* Top row: icon + label + score */}
      <View style={rs.featureHeader}>
        <View style={rs.featureIconBox}>
          <Text style={rs.featureIcon}>{icon}</Text>
        </View>
        <View style={rs.featureTitleWrap}>
          <Text style={rs.featureLabel}>{label}</Text>
          {feature.nickname && (
            <View style={rs.nicknameBadge}>
              <Text style={rs.nicknameText}>{feature.nickname}</Text>
            </View>
          )}
        </View>
        <View style={rs.featureScoreBox}>
          <Text style={[rs.featureScore, { color: scoreColor }]}>{feature.score}</Text>
        </View>
        <Text style={rs.expandArrow}>{isActive ? '\u25B2' : '\u25BC'}</Text>
      </View>

      {/* Score bar */}
      <View style={rs.featureBarTrack}>
        <View style={[rs.featureBarFill, { width: `${feature.score}%`, backgroundColor: scoreColor }]} />
      </View>

      {/* Description — always below header */}
      <Text style={rs.featureDesc} numberOfLines={isActive ? undefined : 2}>
        {feature.description}
      </Text>

      {/* Expanded detail */}
      {isActive && feature.detail && (
        <Animated.View entering={FadeInDown.duration(300)} style={rs.featureDetailBox}>
          <View style={rs.detailDivider} />
          <Text style={rs.featureDetail}>{feature.detail}</Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main Screen
// ────────────────────────────────────────────────────────────────────────────

export default function FaceScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { faceResult, transformedImageBase64, analyze, isLoading, error, clearError, noFaceDetected, noFaceReason, clearNoFace } = useFace();
  const { setFaceResult, setTransformedImage, saveAndRecord } = useFortuneStore();
  const { hasFaceTicket, useFaceTicket } = usePurchaseStore();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const portraitSize = Math.min(width - 32, 420);
  const features = faceResult ? ensureFeaturesArray(faceResult.features) : [];

  // ─── Photo pick ───
  const pickImage = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('common.permissionRequired'), t('face.photoPermission'));
      return;
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      clearNoFace();
      clearError();
      setAnalyzed(false);
      setFaceResult(null);
      setTransformedImage(null);
    }
  };

  // ─── Analysis (클라이언트 얼굴 사전검증 포함) ───
  const startAnalysis = async () => {
    if (!imageUri) return;

    // 1단계: 클라이언트 사이드 얼굴 검증 (무료, 즉시)
    const faceCheck = await detectFaceLocal(imageUri);
    if (!faceCheck.hasFace && faceCheck.confidence !== 'skip') {
      Alert.alert(
        t('face.noFaceTitle') || '얼굴을 찾을 수 없어요',
        t('face.noFaceLocal') || '사람 얼굴이 포함된 정면 사진을 선택해주세요.',
      );
      return;
    }

    // 2단계: 서버 API 호출
    const faceRes = await analyze(imageUri);
    if (faceRes) {
      useFaceTicket();
      setAnalyzed(true);
      // 관상화 이미지도 함께 저장 (기록에서 다시 볼 수 있도록)
      const img = useFortuneStore.getState().transformedImageBase64;
      saveAndRecord('face', true, faceRes, img ? { imageBase64: img } : undefined);
    }
  };

  const handleAnalyzePress = async () => {
    if (hasFaceTicket()) {
      startAnalysis();
    } else {
      setShowPaywall(true);
    }
  };

  const handleRetry = () => {
    clearError();
    clearNoFace();
    startAnalysis();
  };

  const resetAnalysis = () => {
    setAnalyzed(false);
    setImageUri(null);
    setFaceResult(null);
    setTransformedImage(null);
    setExpandedFeature(null);
  };

  // Image URIs
  const transformedUri = transformedImageBase64
    ? `data:image/png;base64,${transformedImageBase64}`
    : null;
  const displayImageUri = transformedUri ?? imageUri;

  if (isLoading) {
    return (
      <LoadingInk
        steps={t('loading.faceSteps', { returnObjects: true }) as string[]}
        tips={t('loading.sajuTips', { returnObjects: true }) as string[]}
        finalMessage={t('loading.faceFinal')}
        estimatedSeconds={15}
      />
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  RESULTS VIEW
  // ════════════════════════════════════════════════════════════════════════════

  const handleShare = async () => {
    const shareText = `[MIRi 관상] ${faceResult?.shareTitle ?? ''} ${faceResult?.overallScore ?? ''}점\n\n${faceResult?.hookLine ?? faceResult?.summary ?? ''}\n\nhttps://dist-drab-ten-14.vercel.app/share?type=face&score=${faceResult?.overallScore}`;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).share) {
      try { await (navigator as any).share({ title: 'MIRi 관상 분석', text: shareText }); } catch {}
    } else if (Platform.OS === 'web' && navigator?.clipboard) {
      await navigator.clipboard.writeText(shareText);
    }
  };

  if (analyzed && faceResult) {
    return (
      <ScrollView
        ref={scrollRef}
        style={rs.container}
        contentContainerStyle={rs.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 0. BRAND ─── */}
        <View style={rs.navBar}>
          <View style={rs.navSpacer} />
          <View style={rs.navBrand}>
            <Text style={rs.navLogo}>MIRi</Text>
            <Text style={rs.navTagline}>관상 풀이</Text>
          </View>
          <View style={rs.navSpacer} />
        </View>

        {/* ─── 1. PORTRAIT (얼굴이 젤 먼저) ─── */}
        <Animated.View entering={FadeIn.delay(100).duration(500)}>
          {transformedUri ? (
            <Text style={rs.inkLabel}>水墨 관상화</Text>
          ) : (
            <Text style={rs.inkLabelFallback}>관상 분석 (수묵화 생성 실패)</Text>
          )}
          <View style={rs.portraitFrame}>
            <FaceOverlay
              imageUri={displayImageUri!}
              features={features}
              imageSize={portraitSize}
              isTransformed={!!transformedUri}
              onFeatureSelect={(area) => setExpandedFeature(area)}
            />
          </View>
          <Text style={rs.tapHint}>{t('face.tapHint')}</Text>
        </Animated.View>

        {/* ─── 2. HOOK + SCORE + SHARE (자극적 → 바로 공유) ─── */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          {faceResult.shareTitle && (
            <View style={rs.tagRow}>
              <View style={rs.tag}>
                <Text style={rs.tagText}>{faceResult.shareTitle}</Text>
              </View>
              <Text style={rs.scoreText}>{faceResult.overallScore}<Text style={rs.scoreUnit}>점</Text></Text>
            </View>
          )}

          <Text style={rs.hookLine}>
            {faceResult.hookLine ?? faceResult.summary}
          </Text>

          {faceResult.celebrity && (
            <Text style={rs.celebrityText}>{'\u2605'} {faceResult.celebrity}</Text>
          )}

          <TouchableOpacity style={rs.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Text style={rs.shareBtnText}>{t('common.share')}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ─── 3. BEST POINT ─── */}
        {faceResult.highlight && (
          <Animated.View entering={FadeInDown.delay(450).springify()}>
            <View style={rs.bestCard}>
              <View style={rs.bestBadge}>
                <Text style={rs.bestBadgeText}>BEST</Text>
              </View>
              <Text style={rs.bestArea}>
                {AREA_LABELS[faceResult.highlight.area] ?? faceResult.highlight.area}
              </Text>
              <Text style={rs.bestMessage}>{faceResult.highlight.message}</Text>
            </View>
          </Animated.View>
        )}

        {/* ─── 4. RADAR ─── */}
        {faceResult.radarScores && (
          <Animated.View entering={FadeInDown.delay(550).springify()}>
            <View style={rs.radarCard}>
              <Text style={rs.radarTitle}>{t('face.radarSection')}</Text>
              {(['wealth', 'love', 'health', 'success', 'social'] as const).map((key) => {
                const meta = RADAR_LABELS[key];
                const val = faceResult.radarScores![key];
                return (
                  <View key={key} style={rs.radarRow}>
                    <Text style={rs.radarIcon}>{meta.icon}</Text>
                    <Text style={rs.radarLabel}>{meta.label}</Text>
                    <View style={rs.radarBarTrack}>
                      <View style={[rs.radarBarFill, { width: `${val}%` }]} />
                    </View>
                    <Text style={rs.radarScore}>{val}</Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* ─── 5. FEATURE CARDS ─── */}
        <Animated.View entering={FadeInDown.delay(650).springify()}>
          <View style={rs.sectionHeader}>
            <View style={rs.sectionLine} />
            <Text style={rs.sectionTitle}>{t('face.detailSection')}</Text>
            <View style={rs.sectionLine} />
          </View>

          {features.map((feature, i) => (
            <Animated.View key={feature.area} entering={FadeInDown.delay(700 + i * 50).springify()}>
              <FeatureExpandCard
                feature={feature}
                isActive={expandedFeature === feature.area}
                onToggle={() => setExpandedFeature(expandedFeature === feature.area ? null : feature.area)}
              />
            </Animated.View>
          ))}
        </Animated.View>

        {/* ─── 6. DEEP ANALYSIS ─── */}
        <Animated.View entering={FadeInDown.delay(900).springify()}>
          <GlassCard style={rs.analysisCard}>
            <Text style={rs.analysisBody}>{faceResult.summary}</Text>
            {faceResult.faceType && (
              <View style={rs.analysisRow}>
                <Text style={rs.analysisRowIcon}>五</Text>
                <Text style={rs.analysisRowText}>{faceResult.faceType}</Text>
              </View>
            )}
            {faceResult.samjeong && (
              <View style={rs.analysisRow}>
                <Text style={rs.analysisRowIcon}>三</Text>
                <Text style={rs.analysisRowText}>{faceResult.samjeong}</Text>
              </View>
            )}
          </GlassCard>

          {faceResult.personality && (
            <GlassCard style={rs.analysisCard}>
              <Text style={rs.cardLabel}>性 {t('face.personalitySection')}</Text>
              <Text style={rs.analysisBody}>{faceResult.personality}</Text>
            </GlassCard>
          )}

          {faceResult.fortune && (
            <GlassCard style={rs.analysisCard}>
              <Text style={rs.cardLabel}>運 {t('face.fortuneSection')}</Text>
              {typeof faceResult.fortune === 'string' ? (
                <Text style={rs.analysisBody}>{faceResult.fortune}</Text>
              ) : (
                Object.entries(faceResult.fortune as Record<string, string>).map(([key, val]) => (
                  <View key={key} style={rs.analysisRow}>
                    <Text style={rs.analysisRowIcon}>{key.replace('운', '')}</Text>
                    <Text style={rs.analysisRowText}>{val}</Text>
                  </View>
                ))
              )}
            </GlassCard>
          )}

          {faceResult.advice && (
            <GlassCard style={rs.analysisCard}>
              <Text style={rs.cardLabel}>開 {t('face.adviceSection')}</Text>
              <Text style={rs.analysisBody}>{faceResult.advice}</Text>
            </GlassCard>
          )}
        </Animated.View>

        {/* ─── 7. BOTTOM ─── */}
        <View style={rs.bottomActions}>
          <TouchableOpacity style={rs.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Text style={rs.shareBtnText}>{t('common.share')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={rs.newBtn} onPress={resetAnalysis} activeOpacity={0.8}>
            <Text style={rs.newBtnText}>{t('face.newAnalysis')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={rs.disclaimer}>{t('common.disclaimer')}</Text>
      </ScrollView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  CAPTURE VIEW (Phase 1)
  // ════════════════════════════════════════════════════════════════════════════

  return (
    <ScrollView
      style={cs.container}
      contentContainerStyle={cs.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <Animated.View entering={FadeIn.delay(100).duration(400)}>
        <View style={cs.hero}>
          <Text style={cs.heroChar}>相</Text>
          <Text style={cs.heroTitle}>{t('face.title')}</Text>
          <Text style={cs.heroSub}>{'얼굴에 새겨진 운명의 지도를\nAI가 읽어드려요'}</Text>
        </View>
      </Animated.View>

      {/* ── Photo Area ── */}
      <Animated.View entering={FadeIn.delay(200).duration(500)}>
        <View style={[cs.captureArea, { width: portraitSize, height: portraitSize }]}>
          <FaceGuide size={portraitSize} hasImage={!!imageUri} />
        </View>
      </Animated.View>

      {/* ── No Face / Error ── */}
      {noFaceDetected && (
        <Animated.View entering={FadeInDown.springify()} style={cs.noFaceCard}>
          <Text style={cs.noFaceEmoji}>{'\uD83D\uDE45'}</Text>
          <Text style={cs.noFaceTitle}>{t('face.noFaceTitle')}</Text>
          <Text style={cs.noFaceDesc}>{noFaceReason}</Text>
          <View style={cs.noFaceTips}>
            <Text style={cs.noFaceTipItem}>{'\u2022'} 정면을 바라보는 얼굴 사진</Text>
            <Text style={cs.noFaceTipItem}>{'\u2022'} 밝은 조명, 가림 없는 사진</Text>
          </View>
          <Text style={cs.noFaceReassure}>{t('face.ticketPreserved')}</Text>
          <TouchableOpacity style={cs.retryActionBtn} onPress={() => { clearNoFace(); setImageUri(null); }}>
            <Text style={cs.retryActionText}>다른 사진 선택</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {error && !noFaceDetected && (
        <Animated.View entering={FadeInDown.springify()} style={cs.errorCard}>
          <Text style={cs.errorTitle}>{t('face.analysisFailed')}</Text>
          <Text style={cs.errorDesc}>{error}</Text>
          <Text style={cs.tipText}>{t('face.ticketPreserved')}</Text>
          <TouchableOpacity style={cs.retryActionBtn} onPress={handleRetry}>
            <Text style={cs.retryActionText}>{t('common.retryAgain')}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Action Buttons ── */}
      {!error && !noFaceDetected && (
        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <View style={cs.actionGroup}>
            <TouchableOpacity style={cs.actionBtn} onPress={() => pickImage(true)} activeOpacity={0.7}>
              <View style={cs.actionIcon}><Text style={cs.actionIconText}>{'📷'}</Text></View>
              <Text style={cs.actionLabel}>{t('face.takePhoto')}</Text>
            </TouchableOpacity>

            <View style={cs.actionDivider} />

            <TouchableOpacity style={cs.actionBtn} onPress={() => pickImage(false)} activeOpacity={0.7}>
              <View style={cs.actionIcon}><Text style={cs.actionIconText}>{'🖼'}</Text></View>
              <Text style={cs.actionLabel}>{t('face.choosePhoto')}</Text>
            </TouchableOpacity>
          </View>

          {imageUri && (
            <Animated.View entering={FadeInDown.delay(150).springify()}>
              <TouchableOpacity style={cs.analyzeBtn} onPress={handleAnalyzePress} activeOpacity={0.8}>
                <Text style={cs.analyzeBtnText}>
                  {hasFaceTicket() ? t('face.startAnalysis') : '관상 분석하기'}
                </Text>
                {!hasFaceTicket() && (
                  <Text style={cs.analyzeBtnPrice}>{t('paywall.facePrice')}</Text>
                )}
              </TouchableOpacity>
              <Text style={cs.statusHint}>
                {hasFaceTicket() ? t('face.ticketHint') : '분석권 구매 후 AI가 관상을 풀어드려요'}
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      )}

      <Text style={cs.disclaimer}>{t('common.disclaimer')}</Text>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUnlocked={() => startAnalysis()}
        productType="face"
      />
    </ScrollView>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  RESULT STYLES
// ════════════════════════════════════════════════════════════════════════════

const rs = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.primary },
  content: { padding: theme.spacing.screenPadding, paddingTop: 48, paddingBottom: 120 },

  // ── 0. NavBar ──
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  navBrand: {
    flex: 1,
    alignItems: 'center',
  },
  navLogo: {
    fontSize: 15,
    fontWeight: '200',
    color: theme.colors.text.primary,
    letterSpacing: 4,
  },
  navTagline: {
    fontSize: 10,
    fontWeight: '400',
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
    marginTop: 1,
  },
  navSpacer: {
    width: 34,
  },

  // ── 1. Portrait ──
  inkLabel: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: 8,
    fontWeight: '400',
  },
  inkLabelFallback: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '400',
  },
  portraitFrame: {
    alignSelf: 'center',
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    ...theme.shadow.card,
  },
  tapHint: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: theme.spacing.lg,
  },

  // ── 2. Hook + Score + Share ──
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: theme.spacing.sm,
  },
  tag: {
    backgroundColor: theme.colors.gold.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: '200',
    color: theme.colors.gold.primary,
    letterSpacing: -1,
  },
  scoreUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.gold.dark,
  },
  hookLine: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: 4,
  },
  celebrityText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  shareBtn: {
    backgroundColor: theme.colors.goldCard.bg,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.radius.full,
    alignSelf: 'center',
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.gold.dark + '60',
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    letterSpacing: 0.5,
  },

  // ── 3. Best Card ──
  bestCard: {
    backgroundColor: theme.colors.bg.elevated,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.cardPadding,
    marginBottom: theme.spacing.cardGap,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gold.dark + '30',
    ...theme.shadow.card,
  },
  bestBadge: {
    backgroundColor: theme.colors.gold.primary,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
  },
  bestBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  bestArea: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  bestMessage: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 21,
  },

  // ── 4. Radar ──
  radarCard: {
    backgroundColor: theme.colors.bg.elevated,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.cardPadding,
    marginBottom: theme.spacing.cardGap,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    ...theme.shadow.card,
  },
  radarTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: 2,
    marginBottom: 14,
    textAlign: 'center',
  },
  radarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  radarIcon: {
    fontSize: 13,
    color: theme.colors.gold.dark,
    fontWeight: '300',
  },
  radarLabel: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    width: 48,
  },
  radarBarTrack: {
    flex: 1,
    height: 5,
    backgroundColor: theme.colors.bg.tertiary,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  radarBarFill: {
    height: '100%',
    backgroundColor: theme.colors.gold.primary,
    borderRadius: 2.5,
  },
  radarScore: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.gold.dark,
    width: 28,
    textAlign: 'right',
  },

  // ── 5. Section Header ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.glass.border,
  },
  sectionTitle: {
    ...theme.typo.sectionTitle,
    fontSize: 14,
    letterSpacing: 2,
  },

  // ── Feature Expand Cards ──
  featureCard: {
    backgroundColor: theme.colors.bg.elevated,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    position: 'relative',
    ...theme.shadow.card,
  },
  featureCardActive: {
    borderColor: theme.colors.gold.dark + '50',
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  featureIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(181,149,48,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: {
    fontSize: 15,
    color: theme.colors.gold.primary,
    fontWeight: '300',
  },
  featureTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  nicknameBadge: {
    backgroundColor: 'rgba(181,149,48,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nicknameText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.gold.dark,
    letterSpacing: 0.3,
  },
  featureScoreBox: {
    alignItems: 'flex-end',
  },
  featureScore: {
    fontSize: 20,
    fontWeight: '700',
  },
  featureBarTrack: {
    height: 3,
    backgroundColor: theme.colors.bg.tertiary,
    borderRadius: 1.5,
    marginBottom: 8,
    overflow: 'hidden',
  },
  featureBarFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  featureDetailBox: {
    marginTop: 10,
  },
  detailDivider: {
    height: 1,
    backgroundColor: theme.colors.glass.border,
    marginBottom: 10,
  },
  featureDetail: {
    ...theme.typo.body,
    fontSize: 13,
  },
  featureDesc: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  expandArrow: {
    fontSize: 9,
    color: theme.colors.text.tertiary,
    marginLeft: 4,
  },

  // ── 6. Analysis Cards (uses GlassCard) ──
  analysisCard: {
    marginBottom: theme.spacing.cardGap,
  },
  analysisBody: {
    ...theme.typo.body,
  },
  analysisRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
  },
  analysisRowIcon: {
    fontSize: 14,
    color: theme.colors.gold.dark,
    fontWeight: '600',
    marginTop: 2,
  },
  analysisRowText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    flex: 1,
  },
  cardLabel: {
    ...theme.typo.cardTitle,
    marginBottom: theme.spacing.sm,
  },

  // ── 7. Bottom Actions ──
  bottomActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  newBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    paddingVertical: 12,
    borderRadius: theme.radius.full,
    alignItems: 'center',
  },
  newBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },

  // ── Disclaimer ──
  disclaimer: {
    ...theme.typo.caption,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: theme.spacing.sm,
  },
});

// ════════════════════════════════════════════════════════════════════════════
//  CAPTURE STYLES
// ════════════════════════════════════════════════════════════════════════════

const cs = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 62 : 52, paddingBottom: 120 },

  // Header
  hero: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  heroChar: {
    fontSize: 64,
    fontWeight: '200',
    color: theme.colors.gold.primary,
    marginBottom: theme.spacing.md,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: 2,
    marginBottom: theme.spacing.sm,
  },
  heroSub: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  title: {
    fontSize: 28,
    fontWeight: '200',
    color: theme.colors.text.primary,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },

  // Photo area
  captureArea: {
    alignSelf: 'center',
    backgroundColor: '#F4F2EF',
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: { width: '100%', height: '100%' },

  // Action buttons
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 20,
    paddingVertical: 4,
    ...Platform.select({
      web: { boxShadow: '0 1px 6px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    }),
  } as any,
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconText: {
    fontSize: 16,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  actionDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },

  // Analyze button
  analyzeBtn: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 14,
  },
  analyzeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    letterSpacing: 0.5,
  },
  analyzeBtnPrice: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.gold.muted,
    marginTop: 2,
  },
  statusHint: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: 6,
  },

  // No face / Error
  noFaceCard: { backgroundColor: '#FFF8F0', borderRadius: 16, padding: 24, marginTop: 16, alignItems: 'center' },
  noFaceEmoji: { fontSize: 36, marginBottom: 10 },
  noFaceTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 6, textAlign: 'center' },
  noFaceDesc: { fontSize: 13, color: theme.colors.text.secondary, marginBottom: 14, textAlign: 'center', lineHeight: 20 },
  noFaceTips: { alignSelf: 'stretch', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 10, padding: 12, marginBottom: 12, gap: 4 },
  noFaceTipItem: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },
  noFaceReassure: { fontSize: 12, color: theme.colors.gold.primary, fontWeight: '600', marginBottom: 12 },
  retryActionBtn: {
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  retryActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.gold.primary,
  },
  tipText: { fontSize: 12, color: theme.colors.text.tertiary, lineHeight: 20 },
  errorCard: { backgroundColor: '#FFF0F0', borderRadius: 16, padding: 20, marginTop: 16 },
  errorTitle: { fontSize: 15, fontWeight: '700', color: '#C44', marginBottom: 4 },
  errorDesc: { fontSize: 13, color: theme.colors.text.secondary, marginBottom: 8 },
  disclaimer: { fontSize: 10, color: theme.colors.text.tertiary, textAlign: 'center', lineHeight: 14, marginTop: 32 },
});
