import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { FACE_POINTS } from './FaceGuide';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FeatureData {
  area: string;
  score: number;
  description: string;
  detail?: string;
  nickname?: string;
  position?: { x: number; y: number };
}

interface FaceOverlayProps {
  imageUri: string;
  features: FeatureData[];
  imageSize: number;
  isTransformed?: boolean;
  onFeatureSelect?: (area: string | null) => void;
}

// ---------------------------------------------------------------------------
// Label metadata
// ---------------------------------------------------------------------------

const LABEL_META: Record<string, { label: string; shortLabel: string; side: 'left' | 'right' }> = {
  forehead: { label: '천정(天庭)', shortLabel: '天庭', side: 'right' },
  eyes:     { label: '감찰관(監察)', shortLabel: '監察', side: 'left' },
  nose:     { label: '재백궁(財帛)', shortLabel: '財帛', side: 'right' },
  mouth:    { label: '출납관(出納)', shortLabel: '出納', side: 'left' },
  jawline:  { label: '지각(地閣)', shortLabel: '地閣', side: 'right' },
  ears:     { label: '채청관(採聽)', shortLabel: '採聽', side: 'left' },
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ZOOM_SCALE = 1.8;
const ZOOM_DURATION = 400;
const PULSE_DURATION = 1800;

// ---------------------------------------------------------------------------
// Pulsing dot + label line
// ---------------------------------------------------------------------------

function FeaturePoint({
  px,
  py,
  isActive,
  index,
  area,
  score,
  imageSize,
  onPress,
}: {
  px: number;
  py: number;
  isActive: boolean;
  index: number;
  area: string;
  score: number;
  imageSize: number;
  onPress: () => void;
}) {
  const meta = LABEL_META[area];
  const side = meta?.side ?? 'right';
  const glowScale = useSharedValue(0);

  useEffect(() => {
    glowScale.value = withDelay(
      index * 200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: PULSE_DURATION, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: PULSE_DURATION, easing: Easing.in(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => {
    const scale = interpolate(glowScale.value, [0, 1], [1, 2.2]);
    const opacity = interpolate(glowScale.value, [0, 0.5, 1], [0.6, 0.3, 0]);
    return { transform: [{ scale }], opacity };
  });

  const dotSize = isActive ? 12 : 7;
  const touchSize = 44;

  // 라벨 연결선: 점에서 좌/우 가장자리로 선을 긋고 라벨+점수 표시
  const lineLength = side === 'right'
    ? imageSize - px - dotSize / 2 - 8
    : px - dotSize / 2 - 8;

  const showLabel = !isActive && meta; // 활성 상태면 하단 패널에 상세 표시

  return (
    <>
      {/* 연결선 + 라벨 (얼굴 밖으로) */}
      {showLabel && lineLength > 30 && (
        <View
          style={[
            styles.labelLine,
            {
              top: py - 0.5,
              ...(side === 'right'
                ? { left: px + dotSize / 2 + 2 }
                : { right: imageSize - px + dotSize / 2 + 2 }),
              width: Math.min(lineLength, 80),
              flexDirection: side === 'right' ? 'row' : 'row-reverse',
            },
          ]}
        >
          <View style={styles.lineSegment} />
          <View style={[styles.labelTag, side === 'left' && { marginLeft: 0, marginRight: 4 }]}>
            <Text style={styles.labelTagText}>{meta.shortLabel}</Text>
            <Text style={styles.labelScore}>{score}</Text>
          </View>
        </View>
      )}

      {/* 터치 영역 + 점 */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          styles.pointTouch,
          {
            left: px - touchSize / 2,
            top: py - touchSize / 2,
            width: touchSize,
            height: touchSize,
          },
        ]}
        onPress={onPress}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: dotSize + 10,
              height: dotSize + 10,
              borderRadius: (dotSize + 10) / 2,
              borderWidth: 1.5,
              borderColor: isActive ? '#D4B24B' : 'rgba(212,178,75,0.5)',
            },
            glowStyle,
          ]}
        />
        <View
          style={[
            styles.dot,
            { width: dotSize, height: dotSize, borderRadius: dotSize / 2 },
            isActive && styles.dotActive,
          ]}
        />
      </TouchableOpacity>
    </>
  );
}

// ---------------------------------------------------------------------------
// Detail panel (bottom slide-up)
// ---------------------------------------------------------------------------

function DetailPanel({
  data,
  label,
  onClose,
}: {
  data: FeatureData;
  label: string;
  onClose: () => void;
}) {
  const slideY = useSharedValue(200);
  const barWidth = useSharedValue(0);

  useEffect(() => {
    slideY.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.bezierFn(0.25, 0.1, 0.25, 1)) });
    barWidth.value = withDelay(150, withTiming(data.score, { duration: 600, easing: Easing.out(Easing.bezierFn(0.25, 0.1, 0.25, 1)) }));
  }, [data.area, data.score]);

  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: slideY.value }] }));
  const barStyle = useAnimatedStyle(() => ({ width: `${barWidth.value}%` as any }));

  return (
    <Animated.View style={[styles.detailPanel, panelStyle]}>
      <View style={styles.panelTopEdge} />
      <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={styles.closeBtnText}>{'\u2715'}</Text>
      </TouchableOpacity>

      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{label}</Text>
        {data.nickname && <Text style={styles.panelNickname}>{data.nickname}</Text>}
      </View>

      <View style={styles.scoreRow}>
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, barStyle]} />
        </View>
        <Text style={styles.scoreValue}>{data.score}</Text>
        <Text style={styles.scoreUnit}>점</Text>
      </View>

      <Text style={styles.panelDesc} numberOfLines={3}>{data.description}</Text>
      {data.detail && <Text style={styles.panelDetail} numberOfLines={2}>{data.detail}</Text>}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main FaceOverlay
// ---------------------------------------------------------------------------

export function FaceOverlay({
  imageUri,
  features,
  imageSize,
  isTransformed,
  onFeatureSelect,
}: FaceOverlayProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const centerX = imageSize / 2;
  const centerY = imageSize / 2;

  const PAINTING_POINTS: Record<string, { x: number; y: number }> = {
    forehead: { x: 0.52, y: 0.14 },
    eyes:     { x: 0.48, y: 0.32 },
    nose:     { x: 0.50, y: 0.45 },
    mouth:    { x: 0.50, y: 0.56 },
    jawline:  { x: 0.50, y: 0.70 },
    ears:     { x: 0.22, y: 0.34 },
  };

  const getPoint = useCallback(
    (f: FeatureData) => {
      if (f.position && typeof f.position.x === 'number' && typeof f.position.y === 'number'
          && f.position.x > 0.01 && f.position.x < 0.99 && f.position.y > 0.01 && f.position.y < 0.99) {
        return f.position;
      }
      if (isTransformed) {
        return PAINTING_POINTS[f.area] ?? FACE_POINTS[f.area as keyof typeof FACE_POINTS] ?? null;
      }
      return FACE_POINTS[f.area as keyof typeof FACE_POINTS] ?? null;
    },
    [isTransformed],
  );

  const handleSelect = useCallback(
    (area: string | null) => {
      setSelected(area);
      onFeatureSelect?.(area);

      if (area) {
        const feature = features.find((f) => f.area === area);
        const pt = feature ? getPoint(feature) : null;
        if (pt) {
          const px = pt.x * imageSize;
          const py = pt.y * imageSize;
          const s = ZOOM_SCALE;
          scale.value = withTiming(s, { duration: ZOOM_DURATION, easing: Easing.bezierFn(0.25, 0.1, 0.25, 1) });
          translateX.value = withTiming((centerX - px) * (s - 1), { duration: ZOOM_DURATION, easing: Easing.bezierFn(0.25, 0.1, 0.25, 1) });
          translateY.value = withTiming((centerY - py) * (s - 1), { duration: ZOOM_DURATION, easing: Easing.bezierFn(0.25, 0.1, 0.25, 1) });
        }
      } else {
        scale.value = withTiming(1, { duration: ZOOM_DURATION, easing: Easing.bezierFn(0.25, 0.1, 0.25, 1) });
        translateX.value = withTiming(0, { duration: ZOOM_DURATION, easing: Easing.bezierFn(0.25, 0.1, 0.25, 1) });
        translateY.value = withTiming(0, { duration: ZOOM_DURATION, easing: Easing.bezierFn(0.25, 0.1, 0.25, 1) });
      }
    },
    [imageSize, centerX, centerY, onFeatureSelect, features, getPoint],
  );

  const zoomStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const selectedData = selected ? features.find((f) => f.area === selected) : null;

  return (
    <View style={[styles.container, { width: imageSize, height: imageSize }]}>
      <Animated.View style={[{ width: imageSize, height: imageSize, position: 'relative' }, zoomStyle]}>
        <View style={{ width: imageSize, height: imageSize, borderRadius: theme.radius.lg, overflow: 'hidden' }}>
          <Image
            source={{ uri: imageUri }}
            style={[
              styles.image,
              { width: imageSize, height: imageSize },
              // @ts-ignore
              !isTransformed && { filter: 'sepia(25%) saturate(0.6) contrast(1.1) brightness(1.02)' },
            ]}
          />
        </View>

        {!isTransformed && <View style={[styles.paperOverlay, { width: imageSize, height: imageSize }]} />}

        {features.map((f, index) => {
          const pt = getPoint(f);
          if (!pt) return null;
          const px = pt.x * imageSize;
          const py = pt.y * imageSize;

          return (
            <FeaturePoint
              key={f.area}
              px={px}
              py={py}
              isActive={selected === f.area}
              index={index}
              area={f.area}
              score={f.score}
              imageSize={imageSize}
              onPress={() => handleSelect(selected === f.area ? null : f.area)}
            />
          );
        })}
      </Animated.View>

      {selectedData && selected && LABEL_META[selected] && (
        <DetailPanel
          key={selected}
          data={selectedData}
          label={LABEL_META[selected].label}
          onClose={() => handleSelect(null)}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'center',
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: '#0E0D0B',
  },
  image: {
    borderRadius: theme.radius.lg,
  },
  paperOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(210,190,160,0.10)',
    borderRadius: theme.radius.lg,
  },

  // -- Dots --
  pointTouch: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  dot: {
    backgroundColor: 'rgba(212,178,75,0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#D4B24B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  dotActive: {
    backgroundColor: '#D4B24B',
    borderColor: '#FFFFFF',
    borderWidth: 2,
    shadowOpacity: 1,
    shadowRadius: 10,
  },

  // -- Label line + tag --
  labelLine: {
    position: 'absolute',
    height: 1,
    alignItems: 'center',
    zIndex: 9,
  },
  lineSegment: {
    flex: 1,
    height: 0.5,
    backgroundColor: 'rgba(212,178,75,0.35)',
  },
  labelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  labelTagText: {
    fontSize: 8,
    fontWeight: '500',
    color: 'rgba(212,178,75,0.85)',
    letterSpacing: 1,
  },
  labelScore: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D4B24B',
  },

  // -- Detail panel --
  detailPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(14,13,11,0.94)',
    paddingHorizontal: theme.spacing.md,
    paddingTop: 14,
    paddingBottom: theme.spacing.lg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: theme.radius.lg,
    borderBottomRightRadius: theme.radius.lg,
    zIndex: 30,
  },
  panelTopEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: theme.colors.gold.dark,
    opacity: 0.6,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 31,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 10,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    letterSpacing: 0.5,
  },
  panelNickname: {
    fontSize: 12,
    color: 'rgba(200,170,120,0.6)',
    fontWeight: '400',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  barTrack: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2.5,
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: theme.colors.gold.primary,
    borderRadius: 2.5,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    minWidth: 28,
    textAlign: 'right',
  },
  scoreUnit: {
    fontSize: 12,
    color: 'rgba(200,170,120,0.6)',
    fontWeight: '400',
    marginLeft: -4,
  },
  panelDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  panelDetail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
    marginTop: 6,
    fontStyle: 'italic',
  },
});
