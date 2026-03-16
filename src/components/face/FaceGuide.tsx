import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Ellipse, Circle } from 'react-native-svg';
import { theme } from '../../constants/theme';

export const FACE_POINTS = {
  forehead: { x: 0.50, y: 0.18, label: '천정' },
  eyes:     { x: 0.38, y: 0.36, label: '감찰관' },
  nose:     { x: 0.50, y: 0.48, label: '재백궁' },
  mouth:    { x: 0.50, y: 0.58, label: '출납관' },
  jawline:  { x: 0.42, y: 0.70, label: '지각' },
  ears:     { x: 0.18, y: 0.38, label: '채청관' },
} as const;

interface FaceGuideProps {
  size: number;
  showLabels?: boolean;
  hasImage?: boolean;
}

const G = theme.colors.gold.primary;

/** 얼굴 실루엣 SVG — 미니멀 라인아트 */
function FaceSilhouette({ size }: { size: number }) {
  const s = size * 0.7;
  return (
    <View style={{ position: 'absolute', top: size * 0.12, left: (size - s) / 2, width: s, height: s }}>
      <Svg width={s} height={s} viewBox="0 0 100 120">
        {/* 얼굴 윤곽 */}
        <Path
          d="M50 8 C25 8, 12 30, 12 50 C12 75, 25 100, 50 108 C75 100, 88 75, 88 50 C88 30, 75 8, 50 8Z"
          stroke={G} strokeWidth={1.2} fill="none" opacity={0.2}
        />
        {/* 눈썹 */}
        <Path d="M28 40 Q35 36, 42 39" stroke={G} strokeWidth={1} fill="none" opacity={0.25} strokeLinecap="round" />
        <Path d="M58 39 Q65 36, 72 40" stroke={G} strokeWidth={1} fill="none" opacity={0.25} strokeLinecap="round" />
        {/* 눈 */}
        <Ellipse cx={35} cy={45} rx={5} ry={3} stroke={G} strokeWidth={0.8} fill="none" opacity={0.2} />
        <Ellipse cx={65} cy={45} rx={5} ry={3} stroke={G} strokeWidth={0.8} fill="none" opacity={0.2} />
        <Circle cx={35} cy={45} r={1.5} fill={G} opacity={0.15} />
        <Circle cx={65} cy={45} r={1.5} fill={G} opacity={0.15} />
        {/* 코 */}
        <Path d="M50 42 L50 58 M44 60 Q50 64, 56 60" stroke={G} strokeWidth={0.8} fill="none" opacity={0.18} strokeLinecap="round" />
        {/* 입 */}
        <Path d="M40 72 Q50 78, 60 72" stroke={G} strokeWidth={1} fill="none" opacity={0.2} strokeLinecap="round" />
        <Path d="M42 72 Q50 74, 58 72" stroke={G} strokeWidth={0.6} fill="none" opacity={0.12} />
        {/* 귀 */}
        <Path d="M12 42 Q6 45, 8 55 Q10 60, 14 58" stroke={G} strokeWidth={0.8} fill="none" opacity={0.15} />
        <Path d="M88 42 Q94 45, 92 55 Q90 60, 86 58" stroke={G} strokeWidth={0.8} fill="none" opacity={0.15} />
      </Svg>
    </View>
  );
}

export function FaceGuide({ size, showLabels = true, hasImage = false }: FaceGuideProps) {
  const cx = size / 2;
  const ovalW = size * 0.52;
  const ovalH = size * 0.68;
  const ovalTop = size * 0.14;

  const markers = [
    { label: '이마', y: 0.22, width: 0.22 },
    { label: '눈',  y: 0.36, width: 0.32 },
    { label: '코',  y: 0.48, width: 0.10 },
    { label: '입',  y: 0.58, width: 0.16 },
    { label: '턱',  y: 0.70, width: 0.18 },
  ];

  return (
    <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
      {/* 얼굴 실루엣 — 이미지 없을 때만 */}
      {!hasImage && <FaceSilhouette size={size} />}

      {/* 얼굴 윤곽 — 타원 */}
      <View style={[styles.oval, { width: ovalW, height: ovalH, top: ovalTop, opacity: hasImage ? 0.2 : 0.35 }]} />

      {/* 십자 중심선 */}
      {!hasImage && (
        <>
          <View style={[styles.crossV, { left: cx - 0.5, top: ovalTop + ovalH * 0.15, height: ovalH * 0.7 }]} />
          <View style={[styles.crossH, { top: size * 0.36, left: cx - ovalW * 0.35, width: ovalW * 0.7 }]} />
        </>
      )}

      {/* 부위별 마커 — 이미지 있을 때만 */}
      {showLabels && hasImage && markers.map((m) => (
        <View key={m.label} style={[styles.marker, { top: m.y * size - 8, left: cx - (m.width * size) / 2, width: m.width * size }]}>
          <View style={styles.markerLine} />
          <Text style={styles.markerLabel}>{m.label}</Text>
        </View>
      ))}

      {/* 귀 마커 — 이미지 있을 때만 */}
      {showLabels && hasImage && (
        <>
          <View style={[styles.earMark, { left: cx - ovalW / 2 - 14, top: size * 0.34 }]}>
            <View style={styles.earDot} />
          </View>
          <View style={[styles.earMark, { right: cx - ovalW / 2 - 14, top: size * 0.34 }]}>
            <View style={styles.earDot} />
          </View>
        </>
      )}

      {/* 하단 안내 */}
      <View style={[styles.hintBar, { top: ovalTop + ovalH + 12 }]}>
        <Text style={styles.hintText}>
          {hasImage ? '얼굴을 가이드에 맞춰주세요' : '사진을 선택해주세요'}
        </Text>
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
    borderColor: G,
  },
  crossV: {
    position: 'absolute',
    width: 1,
    backgroundColor: G,
    opacity: 0.1,
  },
  crossH: {
    position: 'absolute',
    height: 1,
    backgroundColor: G,
    opacity: 0.1,
  },
  marker: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  markerLine: {
    flex: 1,
    height: 1,
    backgroundColor: G,
    opacity: 0.2,
  },
  markerLabel: {
    fontSize: 9,
    color: G,
    opacity: 0.5,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  earMark: {
    position: 'absolute',
    alignItems: 'center',
  },
  earDot: {
    width: 8,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: G,
    opacity: 0.3,
  },
  hintBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 11,
    color: G,
    opacity: 0.5,
    fontWeight: '500',
    letterSpacing: 1,
  },
});
