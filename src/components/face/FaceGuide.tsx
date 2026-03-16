import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
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

export function FaceGuide({ size, hasImage = false }: FaceGuideProps) {
  const s = size * 0.6;

  return (
    <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
      {/* 엔소(円相) — 붓 터치 원 */}
      <View style={{ position: 'absolute', top: (size - s) / 2 - 10, left: (size - s) / 2, width: s, height: s }}>
        <Svg width={s} height={s} viewBox="0 0 120 120">
          {/* 붓 원 — 한 획으로 그린 듯한 원 (끝이 살짝 열림) */}
          <Path
            d="M60 10 C90 10, 110 30, 110 60 C110 90, 90 110, 60 110 C30 110, 10 90, 10 60 C10 32, 28 12, 55 10"
            stroke={hasImage ? theme.colors.success : G}
            strokeWidth={hasImage ? 2 : 1.8}
            strokeLinecap="round"
            fill="none"
            opacity={hasImage ? 0.4 : 0.25}
          />
          {/* 인식 완료 체크 */}
          {hasImage && (
            <>
              <Circle cx={60} cy={75} r={12} fill={theme.colors.success} opacity={0.12} />
              <Path d="M53 75 L58 80 L67 71" stroke={theme.colors.success} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
            </>
          )}
        </Svg>
      </View>

      {/* 가운데 한자 */}
      {!hasImage && (
        <Text style={styles.centerChar}>面</Text>
      )}

      {/* 하단 안내 */}
      <View style={[styles.hintBar, { bottom: size * 0.08 }]}>
        {hasImage ? (
          <View style={styles.detectedRow}>
            <Text style={styles.detectedCheck}>{'\u2713'}</Text>
            <Text style={styles.detectedText}>얼굴 인식 완료</Text>
          </View>
        ) : (
          <Text style={styles.hintText}>사진을 선택하면 관상을 풀어드려요</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerChar: {
    fontSize: 56,
    fontWeight: '300',
    color: G,
    opacity: 0.3,
    marginTop: -14,
  },
  hintBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 12,
    color: G,
    opacity: 0.5,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  detectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detectedCheck: {
    fontSize: 13,
    color: theme.colors.success,
    fontWeight: '700',
  },
  detectedText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
