import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

// 고정 좌표 — 촬영 가이드 + 결과 오버레이 모두 이 좌표 사용
export const FACE_POINTS = {
  forehead: { x: 0.5, y: 0.22, label: '천정' },
  eyes:     { x: 0.5, y: 0.38, label: '감찰관' },
  nose:     { x: 0.5, y: 0.50, label: '재백궁' },
  mouth:    { x: 0.5, y: 0.62, label: '출납관' },
  jawline:  { x: 0.5, y: 0.75, label: '지각' },
  ears:     { x: 0.84, y: 0.38, label: '채청관' },
} as const;

interface FaceGuideProps {
  size: number;
  showLabels?: boolean;
}

/** 촬영 시 얼굴 정렬 가이드 — 타원 + 부위별 가이드선 */
export function FaceGuide({ size, showLabels = true }: FaceGuideProps) {
  const ovalW = size * 0.58;
  const ovalH = size * 0.72;

  return (
    <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
      {/* 타원 */}
      <View style={[styles.oval, { width: ovalW, height: ovalH, top: size * 0.12 }]} />

      {/* 가이드 선 — 각 부위 위치 */}
      {Object.entries(FACE_POINTS).map(([key, pt]) => {
        if (key === 'ears') return null; // 귀는 타원 바깥
        const y = pt.y * size;
        return (
          <View key={key} style={[styles.guideLine, { top: y }]}>
            <View style={styles.lineBar} />
            {showLabels && (
              <Text style={styles.guideLabel}>{pt.label}</Text>
            )}
          </View>
        );
      })}

      {/* 귀 마커 */}
      <View style={[styles.earMarker, { left: size * 0.12, top: FACE_POINTS.ears.y * size }]}>
        <View style={styles.earDot} />
        {showLabels && <Text style={styles.earLabel}>채청</Text>}
      </View>
      <View style={[styles.earMarker, { right: size * 0.12, top: FACE_POINTS.ears.y * size }]}>
        <View style={styles.earDot} />
        {showLabels && <Text style={styles.earLabel}>채청</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  oval: {
    alignSelf: 'center',
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: theme.colors.gold.primary,
    borderStyle: 'dashed',
    opacity: 0.4,
  },
  guideLine: {
    position: 'absolute',
    left: '25%',
    right: '25%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lineBar: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.gold.primary,
    opacity: 0.3,
  },
  guideLabel: {
    fontSize: 9,
    color: theme.colors.gold.primary,
    opacity: 0.6,
    fontWeight: '500',
  },
  earMarker: {
    position: 'absolute',
    alignItems: 'center',
    gap: 2,
  },
  earDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.gold.primary,
    opacity: 0.4,
  },
  earLabel: {
    fontSize: 8,
    color: theme.colors.gold.primary,
    opacity: 0.5,
  },
});
