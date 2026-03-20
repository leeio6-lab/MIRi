import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  AppState,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Svg, { Path, Circle as SvgCircle } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { LoadingInk } from '../../src/components/ui/LoadingInk';
import { PaywallModal } from '../../src/components/ui/PaywallModal';
import { ShareCard } from '../../src/components/ui/ShareCard';
import { FaceOverlay } from '../../src/components/face/FaceOverlay';
import { useFortuneStore } from '../../src/stores/fortuneStore';
import { usePurchaseStore } from '../../src/stores/purchaseStore';
import { useAuthStore } from '../../src/stores/authStore';
import { useUserStore } from '../../src/stores/userStore';
import { startFaceAnalysis } from '../../src/services/backgroundAnalysis';
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
  const scoreColor = feature.score >= 85 ? theme.colors.gold.primary : feature.score >= 75 ? theme.colors.gold.dark : theme.colors.gold.muted;

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
  const { t } = useTranslation();
  const {
    faceResult, transformedImageBase64, error,
    setFaceResult, setTransformedImage, setError,
    facePending, faceReady, setFaceReady, faceNoFace, setFaceNoFace,
  } = useFortuneStore();
  const { hasFaceTicket } = usePurchaseStore();
  const { analysisMode } = useUserStore();
  const { user } = useAuthStore();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const displayImageUri = (transformedImageBase64 ? `data:image/png;base64,${transformedImageBase64}` : null) ?? imageUri;
  const analyzed = faceReady && faceResult !== null && displayImageUri !== null;
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [photoStatus, setPhotoStatus] = useState<'none' | 'ok' | 'noface'>('none');
  const scrollRef = useRef<ScrollView>(null);
  const pendingStartTime = useRef<number>(0);

  // 관상 분석 타임아웃 복구 (2분 이상 pending이면 자동 해제)
  useEffect(() => {
    if (facePending) {
      pendingStartTime.current = Date.now();
    }
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && facePending && pendingStartTime.current > 0) {
        const elapsed = Date.now() - pendingStartTime.current;
        if (elapsed > 120_000) {
          // 2분 이상 경과 — 타임아웃으로 판단
          useFortuneStore.getState().setFacePending(false);
          useFortuneStore.getState().setError('분석 시간이 초과되었습니다. 다시 시도해주세요.');
        }
      }
    });
    return () => sub.remove();
  }, [facePending]);

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
      const uri = result.assets[0].uri;
      setImageUri(uri);
      setFaceNoFace(null);
      setError(null);
      setFaceReady(false);
      setFaceResult(null);
      setTransformedImage(null);

      // 즉시 얼굴 사전 검증 → 상태 피드백
      const faceCheck = await detectFaceLocal(uri);
      if (!faceCheck.hasFace && faceCheck.confidence !== 'skip') {
        setPhotoStatus('noface');
      } else {
        setPhotoStatus('ok');
      }
    }
  };

  // ─── Analysis (클라이언트 얼굴 사전검증 포함) ───
  const startAnalysis = async () => {
    if (!imageUri) return;

    // pickImage에서 이미 검증된 경우 스킵, 아닌 경우만 재검증
    if (photoStatus !== 'ok') {
      const faceCheck = await detectFaceLocal(imageUri);
      if (!faceCheck.hasFace && faceCheck.confidence !== 'skip') {
        Alert.alert(
          t('face.noFaceTitle') || '얼굴을 찾을 수 없어요',
          t('face.noFaceLocal') || '사람 얼굴이 포함된 정면 사진을 선택해주세요.',
        );
        return;
      }
    }

    // 백그라운드 서버 API 호출 (화면 이탈해도 계속 실행)
    startFaceAnalysis({
      imageUri,
      locale: user?.locale ?? 'ko',
      analysisMode,
    });
  };

  const handleAnalyzePress = async () => {
    if (hasFaceTicket()) {
      startAnalysis();
    } else {
      setShowPaywall(true);
    }
  };

  const handleRetry = () => {
    setError(null);
    setFaceNoFace(null);
    startAnalysis();
  };

  const resetAnalysis = () => {
    setFaceReady(false);
    setImageUri(null);
    setFaceResult(null);
    setTransformedImage(null);
    setExpandedFeature(null);
    setPhotoStatus('none');
    setFaceNoFace(null);
    setError(null);
  };

  // Image URIs
  const transformedUri = transformedImageBase64
    ? `data:image/png;base64,${transformedImageBase64}`
    : null;

  if (facePending) {
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

  const handleDownloadPainting = async () => {
    if (!transformedImageBase64) return;

    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${transformedImageBase64}`;
      link.download = `Myeongri_portrait_${Date.now()}.png`;
      link.click();
    } else {
      try {
        const FS = require('expo-file-system');
        const Share = require('expo-sharing');
        const fileUri = `${FS.cacheDirectory}Myeongri_portrait_${Date.now()}.png`;
        await FS.writeAsStringAsync(fileUri, transformedImageBase64, {
          encoding: FS.EncodingType.Base64,
        });
        await Share.shareAsync(fileUri, { mimeType: 'image/png' });
      } catch (e) {
        if (__DEV__) console.warn('[Face] Download failed:', e);
      }
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
        {/* ─── 0. BRAND + BACK ─── */}
        <View style={rs.navBar}>
          <TouchableOpacity onPress={resetAnalysis} style={rs.navBackBtn} activeOpacity={0.5} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={rs.navBackArrow}>{'\u2039'}</Text>
          </TouchableOpacity>
          <View style={rs.navBrand}>
            <Text style={rs.navLogo}>명리</Text>
            <View style={rs.navDecoRow}>
              <View style={rs.navDeco} />
              <Text style={rs.navTagline}>面 相 풀 이</Text>
              <View style={rs.navDeco} />
            </View>
          </View>
          <View style={rs.navSpacer} />
        </View>

        {/* ─── 1. PORTRAIT ─── */}
        <Animated.View entering={FadeIn.delay(100).duration(500)}>
          {transformedUri ? (
            <Text style={rs.inkLabel}>水墨 관상화</Text>
          ) : (
            <Text style={rs.inkLabelFallback}>관상 분석</Text>
          )}
          <View style={rs.portraitFrame}>
            <FaceOverlay
              imageUri={displayImageUri ?? ''}
              features={features}
              imageSize={portraitSize}
              isTransformed={!!transformedUri}
              onFeatureSelect={(area) => setExpandedFeature(area)}
            />
            {transformedImageBase64 && (
              <TouchableOpacity style={rs.downloadOverlay} onPress={handleDownloadPainting} activeOpacity={0.7}>
                <Text style={rs.downloadOverlayText}>畵 저장</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={rs.tapHint}>{t('face.tapHint')}</Text>
        </Animated.View>

        {/* ─── 2. 메인 카드 (검정, 사진 바로 아래) ─── */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={rs.mainCard}>
            {faceResult.shareTitle && (
              <View style={rs.mainTagRow}>
                <View style={rs.mainTag}>
                  <Text style={rs.mainTagText}>{faceResult.shareTitle}</Text>
                </View>
              </View>
            )}
            <View style={rs.mainScoreRow}>
              <Text style={rs.mainScoreNum}>{faceResult.overallScore}</Text>
              <Text style={rs.mainScoreUnit}>점</Text>
            </View>
            <View style={rs.mainDivider} />
            <Text style={rs.mainHookLine}>
              {faceResult.hookLine ?? faceResult.summary}
            </Text>
            {faceResult.celebrity && (
              <Text style={rs.mainCelebrity}>{faceResult.celebrity}</Text>
            )}
          </View>
        </Animated.View>

        {/* ─── 3. BEST POINT (다크 카드) ─── */}
        {faceResult.highlight && (
          <Animated.View entering={FadeInDown.delay(450).springify()}>
            <View style={rs.bestCard}>
              <Text style={rs.bestLabel}>가장 빛나는 부위</Text>
              <View style={rs.bestDivider} />
              <Text style={rs.bestHanja}>
                {AREA_ICONS[faceResult.highlight.area] ?? '相'}
              </Text>
              <Text style={rs.bestArea}>
                {AREA_LABELS[faceResult.highlight.area] ?? faceResult.highlight.area}
              </Text>
              <Text style={rs.bestMessage}>{faceResult.highlight.message}</Text>
            </View>
          </Animated.View>
        )}

        {/* ─── 4. RADAR (운세 바) ─── */}
        {faceResult.radarScores && (
          <Animated.View entering={FadeInDown.delay(550).springify()}>
            <GlassCard style={rs.radarCard}>
              <View style={rs.radarTitleRow}>
                <View style={rs.radarTitleLine} />
                <Text style={rs.radarTitle}>{t('face.radarSection')}</Text>
                <View style={rs.radarTitleLine} />
              </View>
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
            </GlassCard>
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
          <ShareCard data={{
            type: 'face',
            score: faceResult.overallScore,
            tag: faceResult.shareTitle || '관상',
            hookLine: faceResult.hookLine ?? faceResult.summary ?? '',
            celebrity: faceResult.celebrity,
            radar: faceResult.radarScores ? [
              { label: '재물', kanji: '財', value: faceResult.radarScores.wealth },
              { label: '성공', kanji: '祿', value: faceResult.radarScores.success },
              { label: '연애', kanji: '愛', value: faceResult.radarScores.love },
              { label: '건강', kanji: '壽', value: faceResult.radarScores.health },
              { label: '사교', kanji: '和', value: faceResult.radarScores.social },
            ] : undefined,
            portraitBase64: transformedImageBase64 ?? undefined,
          }} />
          <TouchableOpacity style={rs.newBtn} onPress={resetAnalysis} activeOpacity={0.8}>
            <Text style={rs.newBtnText}>{t('face.newAnalysis')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={rs.disclaimer}>{t('common.disclaimer')}</Text>
      </ScrollView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  CAPTURE VIEW (Phase 1) — 간소화
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
          <View style={cs.heroDecoRow}>
            <View style={cs.heroDot} />
            <View style={cs.heroDeco} />
            <Text style={cs.heroChar}>面相</Text>
            <View style={cs.heroDeco} />
            <View style={cs.heroDot} />
          </View>
          <Text style={cs.heroTitle}>{t('face.title')}</Text>
          <Text style={cs.heroSub}>{'셀카 한 장으로 관상을 풀어드려요'}</Text>
        </View>
      </Animated.View>

      {/* ── 분석 안내 알림 ── */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <View style={cs.infoNotice}>
          <Text style={cs.infoChar}>相</Text>
          <View style={cs.infoTextWrap}>
            <Text style={cs.infoTitle}>이런 분석을 해드려요</Text>
            <Text style={cs.infoDesc}>
              {'종합 관상 점수 · 부위별 운세 · 성격 분석\n재물운 · 연애운 · 건강운 · 수묵 관상화'}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* ── 사진 선택 버튼 ── */}
      {!error && !faceNoFace && !imageUri && (
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={cs.actionRow}>
            <TouchableOpacity style={cs.actionBtn} onPress={() => pickImage(true)} activeOpacity={0.7}>
              <Text style={cs.actionHanja}>攝</Text>
              <Text style={cs.actionLabel}>{t('face.takePhoto')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={cs.actionBtn} onPress={() => pickImage(false)} activeOpacity={0.7}>
              <Text style={cs.actionHanja}>冊</Text>
              <Text style={cs.actionLabel}>{t('face.choosePhoto')}</Text>
            </TouchableOpacity>
          </View>
          <Text style={cs.guideHint}>{t('face.guide')}</Text>
        </Animated.View>
      )}

      {/* ── 사진 선택 완료 + 진행 버튼 ── */}
      {!error && !faceNoFace && imageUri && (
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <View style={[cs.readyCard, photoStatus === 'noface' && cs.readyCardWarn]}>
            <Text style={[cs.readyChar, photoStatus === 'ok' && cs.readyCharOk, photoStatus === 'noface' && cs.readyCharWarn]}>面</Text>
            {photoStatus === 'ok' && (
              <>
                <View style={cs.statusRow}>
                  <Text style={cs.statusCheckIcon}>{'\u2713'}</Text>
                  <Text style={cs.statusOkText}>사진이 첨부되었습니다</Text>
                </View>
                <Text style={cs.readyDesc}>아래 버튼을 눌러 관상 분석을 시작하세요</Text>
              </>
            )}
            {photoStatus === 'noface' && (
              <>
                <View style={cs.statusRow}>
                  <Text style={cs.statusWarnIcon}>!</Text>
                  <Text style={cs.statusWarnText}>얼굴이 감지되지 않았습니다</Text>
                </View>
                <Text style={cs.readyDescWarn}>
                  {'정면을 바라보는 얼굴이 잘 보이는 사진을\n다시 선택해주세요'}
                </Text>
              </>
            )}
            {photoStatus === 'none' && (
              <>
                <Text style={cs.readyTitle}>사진이 준비되었습니다</Text>
                <Text style={cs.readyDesc}>아래 버튼을 눌러 관상 분석을 시작하세요</Text>
              </>
            )}
            <TouchableOpacity style={cs.changePhotoBtn} onPress={() => { setImageUri(null); setPhotoStatus('none'); }} activeOpacity={0.7}>
              <Text style={cs.changePhotoText}>다른 사진 선택</Text>
            </TouchableOpacity>
          </View>

          {photoStatus !== 'noface' && (
            <TouchableOpacity style={cs.analyzeBtn} onPress={handleAnalyzePress} activeOpacity={0.8}>
              <Text style={cs.analyzeBtnText}>
                {hasFaceTicket() ? t('face.startAnalysis') : '관상 분석하기'}
              </Text>
              {!hasFaceTicket() && (
                <Text style={cs.analyzeBtnPrice}>{t('paywall.facePrice')}</Text>
              )}
            </TouchableOpacity>
          )}
          <Text style={cs.statusHint}>
            {photoStatus === 'noface'
              ? '얼굴이 잘 보이는 다른 사진을 선택해주세요'
              : hasFaceTicket() ? t('face.ticketHint') : '분석권 구매 후 관상을 풀어드려요'}
          </Text>
        </Animated.View>
      )}

      {/* ── No Face / Error ── */}
      {faceNoFace && (
        <Animated.View entering={FadeInDown.springify()} style={cs.noFaceCard}>
          <Text style={cs.noFaceChar}>面</Text>
          <Text style={cs.noFaceTitle}>{t('face.noFaceTitle')}</Text>
          <Text style={cs.noFaceDesc}>{faceNoFace}</Text>
          <View style={cs.noFaceTips}>
            <Text style={cs.noFaceTipItem}>{'\u2022'} 정면을 바라보는 얼굴 사진</Text>
            <Text style={cs.noFaceTipItem}>{'\u2022'} 밝은 조명, 가림 없는 사진</Text>
          </View>
          <Text style={cs.noFaceReassure}>{t('face.ticketPreserved')}</Text>
          <TouchableOpacity style={cs.retryActionBtn} onPress={() => { setFaceNoFace(null); setImageUri(null); }}>
            <Text style={cs.retryActionText}>다른 사진 선택</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {error && !faceNoFace && (
        <Animated.View entering={FadeInDown.springify()} style={cs.errorCard}>
          <Text style={cs.errorTitle}>{t('face.analysisFailed')}</Text>
          <Text style={cs.errorDesc}>{error}</Text>
          <Text style={cs.tipText}>{t('face.ticketPreserved')}</Text>
          <TouchableOpacity style={cs.retryActionBtn} onPress={handleRetry}>
            <Text style={cs.retryActionText}>{t('common.retryAgain')}</Text>
          </TouchableOpacity>
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
  navDecoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 3,
  },
  navDeco: {
    width: 20,
    height: 1,
    backgroundColor: theme.colors.gold.light,
    opacity: 0.3,
  },
  navTagline: {
    fontSize: 10,
    fontWeight: '400',
    color: theme.colors.text.tertiary,
    letterSpacing: 3,
  },
  navBackBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBackArrow: {
    fontSize: 22,
    fontWeight: '300',
    color: theme.colors.text.primary,
    marginTop: -1,
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

  // ── 2. 메인 카드 (검정) ──
  mainCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: theme.radius.lg,
    padding: 24,
    marginTop: -4,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(181,149,48,0.15)',
  },
  mainTagRow: {
    marginBottom: 12,
  },
  mainTag: {
    backgroundColor: theme.colors.gold.primary,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 4,
  },
  mainTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  mainScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginBottom: 8,
  },
  mainScoreNum: {
    fontSize: 48,
    fontWeight: '200',
    color: theme.colors.gold.primary,
    letterSpacing: -1,
  },
  mainScoreUnit: {
    fontSize: 16,
    fontWeight: '400',
    color: theme.colors.gold.dark,
  },
  mainDivider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(181,149,48,0.25)',
    marginBottom: 14,
  },
  mainHookLine: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.3,
    paddingHorizontal: 4,
  },
  mainCelebrity: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
  },
  mainShareBtn: {
    marginTop: 16,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(181,149,48,0.4)',
    borderRadius: theme.radius.sm,
  },
  mainShareText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.gold.primary,
    letterSpacing: 1,
  },

  // ── 3. Best Card (다크) ──
  bestCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: theme.radius.lg,
    padding: 28,
    marginBottom: 20,
    alignItems: 'center',
  },
  bestLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 3,
    marginBottom: 8,
  },
  bestDivider: {
    width: 20,
    height: 1,
    backgroundColor: theme.colors.gold.primary + '40',
    marginBottom: 16,
  },
  bestHanja: {
    fontSize: 36,
    fontWeight: '200',
    color: theme.colors.gold.primary,
    letterSpacing: 4,
    marginBottom: 8,
  },
  bestArea: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  bestMessage: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.3,
  },

  // ── 4. Radar ──
  radarCard: {
    marginBottom: 20,
  },
  radarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  radarTitleLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212, 168, 75, 0.08)',
  },
  radarTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.gold.dark,
    letterSpacing: 3,
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
    backgroundColor: 'rgba(212, 168, 75, 0.12)',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.gold.dark,
    letterSpacing: 3,
  },

  // ── Feature Expand Cards ──
  featureCard: {
    backgroundColor: theme.colors.bg.elevated,
    borderRadius: theme.radius.lg,
    padding: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
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
    backgroundColor: theme.colors.gold.primary + '12',
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
    backgroundColor: theme.colors.gold.primary + '10',
    paddingHorizontal: 8,
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
    backgroundColor: 'rgba(212, 168, 75, 0.08)',
    marginBottom: 10,
  },
  featureDetail: {
    ...theme.typo.body,
    fontSize: 13,
  },
  featureDesc: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    letterSpacing: 0.3,
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
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.gold.dark,
    letterSpacing: 3,
    marginBottom: 12,
  },

  // ── Download overlay on portrait ──
  downloadOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    zIndex: 20,
  },
  downloadOverlayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  // ── 7. Bottom Actions ──
  bottomActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
    marginBottom: theme.spacing.md,
  },
  bottomShareBtn: {
    flex: 1,
    backgroundColor: theme.colors.gold.primary,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  bottomShareText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  newBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.gold.primary,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  newBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.gold.dark,
    letterSpacing: 0.5,
  },

  // ── Disclaimer ──
  disclaimer: {
    ...theme.typo.caption,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: theme.spacing.md,
  },
});

// ════════════════════════════════════════════════════════════════════════════
//  CAPTURE STYLES
// ════════════════════════════════════════════════════════════════════════════

const cs = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.primary },
  content: { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 62 : 52, paddingBottom: 120 },

  // Header
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroDecoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  heroDeco: {
    width: 28,
    height: 1,
    backgroundColor: theme.colors.gold.light,
    opacity: 0.3,
  },
  heroDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#1A1A1A',
  },
  heroChar: {
    fontSize: 48,
    fontWeight: '200',
    color: theme.colors.gold.primary,
    letterSpacing: 8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.5,
  },

  // 분석 안내 알림
  infoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(26, 26, 26, 0.06)',
    padding: 20,
    marginBottom: 24,
    gap: 16,
    ...theme.shadow.card,
  },
  infoChar: {
    fontSize: 28,
    fontWeight: '200',
    color: theme.colors.text.tertiary,
    letterSpacing: 2,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  infoDesc: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    letterSpacing: 0.3,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 28,
    gap: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: theme.radius.lg,
  },
  actionHanja: {
    fontSize: 28,
    fontWeight: '200',
    color: theme.colors.gold.primary,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.gold.primary,
    letterSpacing: 0.5,
  },
  guideHint: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 18,
  },

  // 사진 준비 완료 카드
  readyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 168, 75, 0.10)',
    padding: 28,
    marginBottom: 8,
    ...theme.shadow.card,
  },
  readyCardWarn: {
    borderColor: 'rgba(220, 60, 60, 0.20)',
  },
  readyChar: {
    fontSize: 36,
    fontWeight: '200',
    color: theme.colors.text.tertiary,
    letterSpacing: 2,
    marginBottom: 12,
  },
  readyCharOk: {
    color: '#2E7D32',
  },
  readyCharWarn: {
    color: '#C62828',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statusCheckIcon: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E7D32',
  },
  statusOkText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
    letterSpacing: 0.5,
  },
  statusWarnIcon: {
    fontSize: 14,
    fontWeight: '800',
    color: '#C62828',
    width: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(198, 40, 40, 0.10)',
    overflow: 'hidden',
  },
  statusWarnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C62828',
    letterSpacing: 0.5,
  },
  readyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  readyDesc: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    letterSpacing: 0.3,
    lineHeight: 22,
  },
  readyDescWarn: {
    fontSize: 13,
    color: '#C62828',
    letterSpacing: 0.3,
    lineHeight: 22,
    textAlign: 'center',
    opacity: 0.8,
  },
  changePhotoBtn: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(26, 26, 26, 0.10)',
    borderRadius: theme.radius.sm,
  },
  changePhotoText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  // Analyze button
  analyzeBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(26,26,26,0.15)' },
      default: { shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 },
    }),
  } as any,
  analyzeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  analyzeBtnPrice: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  statusHint: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.5,
  },

  // No face / Error
  noFaceCard: {
    backgroundColor: theme.colors.bg.elevated,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: 24,
    marginTop: 20,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  noFaceChar: {
    fontSize: 32,
    fontWeight: '200',
    color: theme.colors.gold.muted,
    marginBottom: 12,
    letterSpacing: 2,
  },
  noFaceTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 8, textAlign: 'center', letterSpacing: 1 },
  noFaceDesc: { fontSize: 13, color: theme.colors.text.secondary, marginBottom: 16, textAlign: 'center', lineHeight: 22, letterSpacing: 0.3 },
  noFaceTips: {
    alignSelf: 'stretch',
    backgroundColor: theme.colors.gold.primary + '08',
    borderRadius: theme.radius.sm,
    padding: 14,
    marginBottom: 14,
    gap: 6,
  },
  noFaceTipItem: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 22, letterSpacing: 0.3 },
  noFaceReassure: { fontSize: 12, color: theme.colors.gold.dark, fontWeight: '600', marginBottom: 14, letterSpacing: 0.5 },
  retryActionBtn: {
    backgroundColor: theme.colors.gold.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  retryActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tipText: { fontSize: 12, color: theme.colors.text.tertiary, lineHeight: 20, letterSpacing: 0.3 },
  errorCard: {
    backgroundColor: theme.colors.bg.elevated,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.error + '20',
    padding: 24,
    marginTop: 20,
  },
  errorTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.error, marginBottom: 6, letterSpacing: 0.5 },
  errorDesc: { fontSize: 13, color: theme.colors.text.secondary, marginBottom: 10, lineHeight: 22, letterSpacing: 0.3 },
  disclaimer: { fontSize: 10, color: theme.colors.text.tertiary, textAlign: 'center', lineHeight: 16, marginTop: 32, letterSpacing: 0.5 },
});
