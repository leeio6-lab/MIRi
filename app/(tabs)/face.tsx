import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { LoadingInk } from '../../src/components/ui/LoadingInk';
import { PaywallModal } from '../../src/components/ui/PaywallModal';
import { FaceOverlay } from '../../src/components/face/FaceOverlay';
import { FaceGuide } from '../../src/components/face/FaceGuide';
import { FeatureCard } from '../../src/components/face/FeatureCard';
import { useFortuneStore } from '../../src/stores/fortuneStore';
import { usePurchaseStore } from '../../src/stores/purchaseStore';
import { useFace } from '../../src/hooks/useFace';

const { width } = Dimensions.get('window');

function ensureFeaturesArray(features: unknown): { area: string; score: number; description: string; detail?: string }[] {
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
      }));
  }
  return [];
}

export default function FaceScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { faceResult, transformedImageBase64, analyze, isLoading, error, clearError, noFaceDetected, noFaceReason, clearNoFace } = useFace();
  const { setFaceResult, setTransformedImage, saveAndRecord } = useFortuneStore();
  const { hasFaceTicket, useFaceTicket, purchaseAnalysis } = usePurchaseStore();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  // 관상화 크기 및 부위별 데이터
  const portraitSize = width - theme.spacing.lg * 2;
  const features = faceResult ? ensureFeaturesArray(faceResult.features) : [];

  // ─── 사진 선택 ───
  const pickImage = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(t('common.permissionRequired'), t('face.photoPermission'));
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      clearNoFace();
      clearError();
      setAnalyzed(false);
      setFaceResult(null);
      setTransformedImage(null);
    }
  };

  // ─── 분석 시작 (티켓 보유 상태에서) ───
  const startAnalysis = async () => {
    if (!imageUri) return;

    const faceRes = await analyze(imageUri);
    if (faceRes) {
      // 성공 시에만 티켓 소모
      useFaceTicket();
      setAnalyzed(true);
      saveAndRecord('face', true, faceRes);
    }
    // 실패/noFace 시 티켓 유지 → 재시도 가능
  };

  // ─── "관상 분석하기" 버튼 ───
  const handleAnalyzePress = async () => {
    if (hasFaceTicket()) {
      // 이미 티켓 보유 → 바로 분석
      startAnalysis();
    } else {
      // 티켓 없음 → 결제
      setShowPaywall(true);
    }
  };

  // ─── 결제 완료 후 ───
  const handlePaywallUnlocked = () => {
    // purchaseAnalysis에서 faceTicket이 이미 추가됨 → 바로 분석
    startAnalysis();
  };

  // ─── 재시도 (에러 후) ───
  const handleRetry = () => {
    clearError();
    clearNoFace();
    startAnalysis();
  };

  // 원본 사진 (수묵화 필터는 FaceOverlay에서 적용)
  const displayImageUri = imageUri;

  if (isLoading) {
    return <LoadingInk steps={t('loading.faceSteps', { returnObjects: true }) as string[]} finalMessage={t('loading.faceFinal')} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>{t('face.title')}</Text>

      {/* ═══ Phase 1: 사진 선택 + 분석 시작 ═══ */}
      {!analyzed ? (
        <Animated.View entering={FadeIn.delay(200)}>
          {/* 사진 프리뷰 / 플레이스홀더 */}
          <View style={styles.captureArea}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderIcon}>相</Text>
                <Text style={styles.guideText}>{t('face.guide')}</Text>
              </View>
            )}
            <FaceGuide size={portraitSize} />
          </View>

          {/* 얼굴 미감지 */}
          {noFaceDetected && (
            <Animated.View entering={FadeInDown.springify()} style={styles.noFaceCard}>
              <Text style={styles.noFaceTitle}>{t('face.noFaceTitle')}</Text>
              <Text style={styles.noFaceDesc}>{noFaceReason}</Text>
              <Text style={styles.tipText}>{t('face.tipText')}</Text>
              {hasFaceTicket() && (
                <Button title={t('common.retryOther')} onPress={() => { clearNoFace(); setImageUri(null); }} style={styles.retryBtn} />
              )}
            </Animated.View>
          )}

          {/* 분석 실패 — 티켓 유지, 재시도 가능 */}
          {error && !noFaceDetected && (
            <Animated.View entering={FadeInDown.springify()} style={styles.errorCard}>
              <Text style={styles.errorTitle}>{t('face.analysisFailed')}</Text>
              <Text style={styles.errorDesc}>{error}</Text>
              <Text style={styles.tipText}>{t('face.ticketPreserved')}</Text>
              <Button title={t('common.retryAgain')} onPress={handleRetry} style={styles.retryBtn} />
            </Animated.View>
          )}

          {/* 버튼 영역 */}
          {!error && !noFaceDetected && (
            <View style={styles.buttonGroup}>
              {/* 사진 선택 버튼 */}
              <View style={styles.captureButtons}>
                <Button
                  title={t('face.takePhoto')}
                  onPress={() => pickImage(true)}
                  variant="secondary"
                  style={styles.captureBtn}
                />
                <Button
                  title={t('face.choosePhoto')}
                  onPress={() => pickImage(false)}
                  variant="secondary"
                  style={styles.captureBtn}
                />
              </View>

              {/* 분석 시작 버튼 — 사진 선택 후에만 표시 */}
              {imageUri && (
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                  <Button
                    title={hasFaceTicket() ? t('face.startAnalysis') : t('face.startAnalysisFree')}
                    onPress={handleAnalyzePress}
                    style={styles.analyzeBtn}
                  />
                  {!hasFaceTicket() && (
                    <Text style={styles.priceHint}>{t('face.purchaseHint')}</Text>
                  )}
                  {hasFaceTicket() && (
                    <Text style={styles.ticketHint}>{t('face.ticketHint')}</Text>
                  )}
                </Animated.View>
              )}
            </View>
          )}
        </Animated.View>

      ) : faceResult ? (
        /* ═══ Phase 2: 결과 — 관상화 크게 + 부위별 오버레이 ═══ */
        <>
          {/* 관상화 + 부위별 포인트 오버레이 */}
          {/* 사진 + 부위별 오버레이 (터치 시 상세) */}
          {displayImageUri && (
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <View style={styles.portraitSection}>
                <FaceOverlay
                  imageUri={displayImageUri}
                  features={features}
                  imageSize={portraitSize}
                />
              </View>
              <Text style={styles.tapHint}>부위를 터치하면 상세 분석을 볼 수 있습니다</Text>
            </Animated.View>
          )}

          {/* 종합 점수 */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <GlassCard gold style={styles.overallCard}>
              <Text style={styles.overallLabel}>{t('face.overallScore')}</Text>
              <Text style={styles.overallScore}>{faceResult.overallScore}</Text>
              <Text style={styles.overallMax}>/100</Text>
              {faceResult.faceType && (
                <Text style={styles.faceType}>{faceResult.faceType}</Text>
              )}
              {faceResult.samjeong && (
                <Text style={styles.samjeong}>{faceResult.samjeong}</Text>
              )}
              <Text style={styles.overallSummary}>{faceResult.summary}</Text>
            </GlassCard>
          </Animated.View>

          {/* 성격 분석 */}
          {faceResult.personality && (
            <Animated.View entering={FadeInDown.delay(1000).springify()}>
              <GlassCard style={styles.paidSection}>
                <Text style={styles.sectionTitle}>{t('face.personalitySection')}</Text>
                <Text style={styles.sectionText}>{faceResult.personality}</Text>
              </GlassCard>
            </Animated.View>
          )}

          {/* 운세 예측 */}
          {faceResult.fortune && (
            <Animated.View entering={FadeInDown.delay(1100).springify()}>
              <GlassCard style={styles.paidSection}>
                <Text style={styles.sectionTitle}>{t('face.fortuneSection')}</Text>
                <Text style={styles.sectionText}>{faceResult.fortune}</Text>
              </GlassCard>
            </Animated.View>
          )}

          {/* 오행 레이더 */}
          {faceResult.radarScores && (
            <Animated.View entering={FadeInDown.delay(1200).springify()}>
              <GlassCard style={styles.paidSection}>
                <Text style={styles.sectionTitle}>{t('face.radarSection')}</Text>
                <View style={styles.radarGrid}>
                  {(['wealth', 'love', 'health', 'success', 'social'] as const).map((key) => (
                    <View key={key} style={styles.radarItem}>
                      <Text style={styles.radarLabel}>
                        {t(`face.faceCategories.${key}`)}
                      </Text>
                      <Text style={styles.radarScore}>{faceResult.radarScores![key]}</Text>
                      <View style={styles.radarBarTrack}>
                        <View style={[styles.radarBarFill, { width: `${faceResult.radarScores![key]}%` }]} />
                      </View>
                    </View>
                  ))}
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {/* 관상 조언 */}
          {faceResult.advice && (
            <Animated.View entering={FadeInDown.delay(1300).springify()}>
              <GlassCard gold style={styles.paidSection}>
                <Text style={styles.sectionTitle}>{t('face.adviceSection')}</Text>
                <Text style={styles.sectionTextGold}>{faceResult.advice}</Text>
              </GlassCard>
            </Animated.View>
          )}

          {/* 베스트 포인트 */}
          {faceResult.highlight && (
            <Animated.View entering={FadeInDown.delay(1400).springify()}>
              <GlassCard style={styles.highlightCard}>
                <Text style={styles.highlightLabel}>{t('face.bestPoint')}</Text>
                <Text style={styles.highlightArea}>
                  {t(`face.features.${faceResult.highlight.area}`, { defaultValue: faceResult.highlight.area })}
                </Text>
                <Text style={styles.highlightMessage}>{faceResult.highlight.message}</Text>
              </GlassCard>
            </Animated.View>
          )}

          {/* 다시 분석 */}
          <Button
            title={t('face.newAnalysis')}
            onPress={() => {
              setAnalyzed(false);
              setImageUri(null);
              setFaceResult(null);
              setTransformedImage(null);
            }}
            variant="secondary"
            style={styles.retryBtn}
          />
        </>
      ) : null}

      <Text style={styles.disclaimer}>{t('common.disclaimer')}</Text>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUnlocked={handlePaywallUnlocked}
        productType="face"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.primary },
  content: { padding: theme.spacing.screenPadding, paddingTop: 60, paddingBottom: 120 },
  title: { fontSize: 24, fontWeight: '200', color: theme.colors.text.primary, textAlign: 'center', marginBottom: theme.spacing.lg, letterSpacing: 4 },

  // 촬영 영역
  captureArea: {
    width: width - theme.spacing.lg * 2,
    aspectRatio: 1,
    backgroundColor: theme.colors.bg.secondary,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
  },
  previewImage: { width: '100%', height: '100%' },
  placeholderContainer: { alignItems: 'center', gap: theme.spacing.md },
  placeholderIcon: { fontSize: 60, color: theme.colors.gold.primary, opacity: 0.6 },
  guideText: { fontSize: 14, color: theme.colors.text.tertiary, textAlign: 'center', paddingHorizontal: theme.spacing.xl },
  faceGuide: { position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  faceOval: { width: '60%', height: '75%', borderRadius: 9999, borderWidth: 1.5, borderColor: theme.colors.gold.primary, borderStyle: 'dashed', opacity: 0.25 },

  // 버튼
  buttonGroup: { marginTop: theme.spacing.lg },
  captureButtons: { flexDirection: 'row', gap: theme.spacing.sm },
  captureBtn: { flex: 1 },
  analyzeBtn: { marginTop: theme.spacing.md },
  priceHint: { fontSize: 12, color: theme.colors.text.tertiary, textAlign: 'center', marginTop: theme.spacing.xs },
  ticketHint: { fontSize: 12, color: theme.colors.gold.primary, textAlign: 'center', marginTop: theme.spacing.xs, fontWeight: '600' },

  // 관상화 + 오버레이
  portraitSection: {
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: theme.colors.gold.dark,
    position: 'relative',
  },
  portraitBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.gold.dark,
  },
  portraitBadgeText: { fontSize: 11, color: theme.colors.gold.primary, fontWeight: '600' },

  // 결과
  overallCard: { alignItems: 'center', marginBottom: theme.spacing.md },
  overallLabel: { fontSize: 14, color: theme.colors.text.secondary, marginBottom: theme.spacing.sm },
  overallScore: { fontSize: 56, fontWeight: '700', color: theme.colors.gold.primary },
  overallMax: { fontSize: 16, color: theme.colors.text.tertiary, marginBottom: theme.spacing.md },
  faceType: { fontSize: 13, color: theme.colors.gold.primary, textAlign: 'center', marginBottom: theme.spacing.xs, fontWeight: '600' },
  samjeong: { fontSize: 12, color: theme.colors.text.tertiary, textAlign: 'center', marginBottom: theme.spacing.sm },
  overallSummary: { fontSize: 14, color: theme.colors.text.secondary, lineHeight: 22, textAlign: 'center' },

  // 섹션
  paidSection: { marginTop: theme.spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: theme.spacing.sm },
  sectionText: { fontSize: 14, color: theme.colors.text.secondary, lineHeight: 22 },
  sectionTextGold: { fontSize: 14, color: theme.colors.gold.muted ?? theme.colors.gold.primary, lineHeight: 22 },

  // 레이더
  radarGrid: { gap: theme.spacing.sm },
  radarItem: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  radarLabel: { fontSize: 13, color: theme.colors.text.secondary, width: 36 },
  radarScore: { fontSize: 13, fontWeight: '700', color: theme.colors.gold.primary, width: 28, textAlign: 'right' },
  radarBarTrack: { flex: 1, height: 6, backgroundColor: theme.colors.bg.tertiary, borderRadius: 3, overflow: 'hidden' },
  radarBarFill: { height: '100%', backgroundColor: theme.colors.gold.primary, borderRadius: 3 },

  // 하이라이트
  highlightCard: { marginTop: theme.spacing.md, alignItems: 'center', borderWidth: 1.5, borderColor: theme.colors.gold.dark },
  highlightLabel: { fontSize: 12, color: theme.colors.text.tertiary, marginBottom: theme.spacing.xs },
  highlightArea: { fontSize: 20, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: theme.spacing.xs },
  highlightMessage: { fontSize: 14, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 22 },

  // 에러/미감지
  noFaceCard: { backgroundColor: '#FFF8F0', borderRadius: theme.radius.md, padding: theme.spacing.md, marginTop: theme.spacing.md, borderWidth: 1, borderColor: '#E8D5B8' },
  noFaceTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: theme.spacing.xs },
  noFaceDesc: { fontSize: 13, color: theme.colors.text.secondary, marginBottom: theme.spacing.sm },
  tipText: { fontSize: 12, color: theme.colors.text.tertiary, lineHeight: 20 },
  errorCard: { backgroundColor: '#FFF0F0', borderRadius: theme.radius.md, padding: theme.spacing.md, marginTop: theme.spacing.md, borderWidth: 1, borderColor: '#E8B8B8' },
  errorTitle: { fontSize: 15, fontWeight: '700', color: '#C44', marginBottom: theme.spacing.xs },
  errorDesc: { fontSize: 13, color: theme.colors.text.secondary, marginBottom: theme.spacing.sm },

  tapHint: { fontSize: 11, color: theme.colors.text.tertiary, textAlign: 'center', marginTop: theme.spacing.xs, marginBottom: theme.spacing.md },
  retryBtn: { marginTop: theme.spacing.lg },
  disclaimer: { fontSize: 10, color: theme.colors.text.tertiary, textAlign: 'center', lineHeight: 14, marginTop: theme.spacing.xl },
});
