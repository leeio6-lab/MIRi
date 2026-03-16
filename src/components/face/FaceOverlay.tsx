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
// Label metadata — traditional 관상 terms with Hanja
// ---------------------------------------------------------------------------

const LABEL_META: Record<string, { label: string; side: 'left' | 'right' }> = {
  forehead: { label: '천정(天庭)', side: 'right' },
  eyes:     { label: '감찰관(監察)', side: 'right' },
  nose:     { label: '재백궁(財帛)', side: 'right' },
  mouth:    { label: '출납관(出納)', side: 'right' },
  jawline:  { label: '지각(地閣)', side: 'right' },
  ears:     { label: '채청관(採聽)', side: 'left' },
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ZOOM_SCALE = 1.8;
const ZOOM_DURATION = 400;
const PULSE_DURATION = 1800;
const PANEL_HEIGHT = 200;

// ---------------------------------------------------------------------------
// Pulsing dot component
// ---------------------------------------------------------------------------

function PulsingDot({
  px,
  py,
  isActive,
  index,
  onPress,
}: {
  px: number;
  py: number;
  isActive: boolean;
  index: number;
  onPress: () => void;
}) {
  // Outer glow pulse
  const glowScale = useSharedValue(0);

  useEffect(() => {
    // Stagger the pulse start for each dot
    glowScale.value = withDelay(
      index * 200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: PULSE_DURATION, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: PULSE_DURATION, easing: Easing.in(Easing.ease) }),
        ),
        -1, // infinite
        false,
      ),
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => {
    const scale = interpolate(glowScale.value, [0, 1], [1, 2.2]);
    const opacity = interpolate(glowScale.value, [0, 0.5, 1], [0.6, 0.3, 0]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const dotSize = isActive ? 14 : 8;
  const touchSize = 44;

  return (
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
      {/* Glow ring */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: dotSize + 10,
            height: dotSize + 10,
            borderRadius: (dotSize + 10) / 2,
            borderWidth: 1.5,
            borderColor: isActive ? theme.colors.gold.primary : 'rgba(200,170,120,0.5)',
          },
          glowStyle,
        ]}
      />
      {/* Core dot */}
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
          },
          isActive && styles.dotActive,
        ]}
      />
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Detail panel component
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
  const slideY = useSharedValue(PANEL_HEIGHT);
  const barWidth = useSharedValue(0);

  useEffect(() => {
    slideY.value = withTiming(0, {
      duration: 350,
      easing: Easing.out(Easing.bezierFn(0.25, 0.1, 0.25, 1)),
    });
    barWidth.value = withDelay(
      150,
      withTiming(data.score, {
        duration: 600,
        easing: Easing.out(Easing.bezierFn(0.25, 0.1, 0.25, 1)),
      }),
    );
  }, [data.area, data.score]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%` as any,
  }));

  return (
    <Animated.View style={[styles.detailPanel, panelStyle]}>
      {/* Glass effect top edge */}
      <View style={styles.panelTopEdge} />

      {/* Close button */}
      <TouchableOpacity
        onPress={onClose}
        style={styles.closeBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.closeBtnText}>{'  \u2715  '}</Text>
      </TouchableOpacity>

      {/* Header: label + nickname */}
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{label}</Text>
        {data.nickname ? (
          <Text style={styles.panelNickname}>{data.nickname}</Text>
        ) : null}
      </View>

      {/* Score row */}
      <View style={styles.scoreRow}>
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, barStyle]} />
          {/* Bar glow */}
          <Animated.View style={[styles.barGlow, barStyle]} />
        </View>
        <Text style={styles.scoreValue}>{data.score}</Text>
        <Text style={styles.scoreUnit}>점</Text>
      </View>

      {/* Description */}
      <Text style={styles.panelDesc} numberOfLines={3}>
        {data.description}
      </Text>

      {/* Detail */}
      {data.detail ? (
        <Text style={styles.panelDetail} numberOfLines={2}>
          {data.detail}
        </Text>
      ) : null}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main FaceOverlay component
// ---------------------------------------------------------------------------

export function FaceOverlay({
  imageUri,
  features,
  imageSize,
  isTransformed,
  onFeatureSelect,
}: FaceOverlayProps) {
  const [selected, setSelected] = useState<string | null>(null);

  // Reanimated shared values for zoom
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const centerX = imageSize / 2;
  const centerY = imageSize / 2;
  const LINE_LEN = imageSize * 0.18;

  // Resolve position: transformed image uses static FACE_POINTS (selfie coords don't match painting)
  const getPoint = useCallback(
    (f: FeatureData) => {
      // Transformed painting has different composition — always use static points
      if (isTransformed) {
        return FACE_POINTS[f.area as keyof typeof FACE_POINTS] ?? null;
      }
      // Original selfie — use API-returned position if available
      if (f.position && typeof f.position.x === 'number' && typeof f.position.y === 'number') {
        return f.position;
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
          const tx = (centerX - px) * (s - 1);
          const ty = (centerY - py) * (s - 1);

          scale.value = withTiming(s, {
            duration: ZOOM_DURATION,
            easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
          });
          translateX.value = withTiming(tx, {
            duration: ZOOM_DURATION,
            easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
          });
          translateY.value = withTiming(ty, {
            duration: ZOOM_DURATION,
            easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
          });
        }
      } else {
        scale.value = withTiming(1, {
          duration: ZOOM_DURATION,
          easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
        });
        translateX.value = withTiming(0, {
          duration: ZOOM_DURATION,
          easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
        });
        translateY.value = withTiming(0, {
          duration: ZOOM_DURATION,
          easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
        });
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
      {/* Zoomable content layer */}
      <Animated.View
        style={[
          { width: imageSize, height: imageSize, position: 'relative' },
          zoomStyle,
        ]}
      >
        {/* Image */}
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.image,
            { width: imageSize, height: imageSize },
            // @ts-ignore — web-only filter
            !isTransformed && {
              filter: 'sepia(25%) saturate(0.6) contrast(1.1) brightness(1.02)',
            },
          ]}
        />

        {/* Paper overlay for non-transformed images */}
        {!isTransformed && (
          <View
            style={[styles.paperOverlay, { width: imageSize, height: imageSize }]}
          />
        )}

        {/* Connecting lines + dots + labels */}
        {features.map((f, index) => {
          const pt = getPoint(f);
          const meta = LABEL_META[f.area];
          if (!pt || !meta) return null;

          const px = pt.x * imageSize;
          const py = pt.y * imageSize;
          const isLeft = meta.side === 'left';
          const isActive = selected === f.area;

          return (
            <React.Fragment key={f.area}>
              {/* Ink-brush connecting line */}
              <View
                style={[
                  styles.lineContainer,
                  {
                    left: isLeft ? px - LINE_LEN : px,
                    top: py - 1,
                    width: LINE_LEN,
                  },
                ]}
              >
                {/* Main line — thin brush stroke */}
                <View
                  style={[
                    styles.lineMain,
                    isActive && styles.lineMainActive,
                  ]}
                />
                {/* Subtle shadow line underneath for depth */}
                <View
                  style={[
                    styles.lineShadow,
                    isActive && styles.lineShadowActive,
                  ]}
                />
                {/* Tapered end — brush stroke feel */}
                <View
                  style={[
                    styles.lineTaper,
                    isLeft ? { left: 0 } : { right: 0 },
                    isActive && styles.lineTaperActive,
                  ]}
                />
              </View>

              {/* Pulsing dot */}
              <PulsingDot
                px={px}
                py={py}
                isActive={isActive}
                index={index}
                onPress={() => handleSelect(isActive ? null : f.area)}
              />

              {/* Traditional label with score */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.labelBox,
                  isLeft
                    ? { right: imageSize - px + LINE_LEN - 4, top: py - 13 }
                    : { left: px + LINE_LEN - 4, top: py - 13 },
                  isActive && styles.labelBoxActive,
                ]}
                onPress={() => handleSelect(isActive ? null : f.area)}
              >
                <View style={styles.labelInner}>
                  <Text
                    style={[
                      styles.labelText,
                      isActive && styles.labelTextActive,
                    ]}
                  >
                    {meta.label}
                  </Text>
                  <View style={[styles.scoreBadge, isActive && styles.scoreBadgeActive]}>
                    <Text
                      style={[
                        styles.labelScore,
                        isActive && styles.labelScoreActive,
                      ]}
                    >
                      {f.score}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </Animated.View>

      {/* Detail panel — outside zoom layer, slides up from bottom */}
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
  // -- Container --
  container: {
    position: 'relative',
    alignSelf: 'center',
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: '#0E0D0B',
  },

  // -- Image --
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

  // -- Connecting lines (ink-brush style) --
  lineContainer: {
    position: 'absolute',
    height: 3,
    zIndex: 4,
  },
  lineMain: {
    position: 'absolute',
    top: 1,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(200,170,120,0.45)',
  },
  lineMainActive: {
    height: 1.5,
    backgroundColor: theme.colors.gold.primary,
    top: 0.75,
  },
  lineShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    height: 0.5,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  lineShadowActive: {
    backgroundColor: 'rgba(181,149,48,0.3)',
  },
  lineTaper: {
    position: 'absolute',
    top: 0,
    width: 6,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(200,170,120,0.25)',
  },
  lineTaperActive: {
    backgroundColor: 'rgba(181,149,48,0.5)',
  },

  // -- Dots --
  pointTouch: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  dot: {
    backgroundColor: 'rgba(200,170,120,0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#B59530',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  dotActive: {
    backgroundColor: theme.colors.gold.primary,
    borderColor: '#FFFFFF',
    borderWidth: 2,
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },

  // -- Labels --
  labelBox: {
    position: 'absolute',
    zIndex: 5,
  },
  labelBoxActive: {
    zIndex: 15,
  },
  labelInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(14,13,11,0.65)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(200,170,120,0.2)',
  },
  labelText: {
    fontSize: 9.5,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  labelTextActive: {
    color: '#FFFFFF',
  },
  scoreBadge: {
    backgroundColor: 'rgba(200,170,120,0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  scoreBadgeActive: {
    backgroundColor: 'rgba(181,149,48,0.3)',
  },
  labelScore: {
    fontSize: 9,
    color: 'rgba(200,170,120,0.7)',
    fontWeight: '700',
  },
  labelScoreActive: {
    color: theme.colors.gold.primary,
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
  barGlow: {
    position: 'absolute',
    top: -1,
    left: 0,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(181,149,48,0.2)',
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
