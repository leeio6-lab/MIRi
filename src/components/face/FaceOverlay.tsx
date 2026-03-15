import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { FACE_POINTS } from './FaceGuide';

interface FeatureData {
  area: string;
  score: number;
  description: string;
  detail?: string;
}

interface FaceOverlayProps {
  imageUri: string;
  features: FeatureData[];
  imageSize: number;
}

const LABEL_META: Record<string, { label: string; side: 'left' | 'right' }> = {
  forehead: { label: '천정(天庭)', side: 'right' },
  eyes:     { label: '감찰관(監察)', side: 'left' },
  nose:     { label: '재백궁(財帛)', side: 'right' },
  mouth:    { label: '출납관(出納)', side: 'left' },
  jawline:  { label: '지각(地閣)', side: 'right' },
  ears:     { label: '채청관(採聽)', side: 'right' },
};

export function FaceOverlay({ imageUri, features, imageSize }: FaceOverlayProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedData = selected ? features.find(f => f.area === selected) : null;
  const LINE_LEN = imageSize * 0.2;

  return (
    <View style={[styles.container, { width: imageSize, height: imageSize }]}>
      {/* 사진 + 한지톤 필터 */}
      <Image
        source={{ uri: imageUri }}
        style={[
          styles.image,
          { width: imageSize, height: imageSize },
          // @ts-ignore
          { filter: 'sepia(25%) saturate(0.6) contrast(1.1) brightness(1.02)' },
        ]}
      />
      <View style={[styles.paperOverlay, { width: imageSize, height: imageSize }]} />

      {/* 부위별 포인트 + 선 + 라벨 */}
      {features.map((f) => {
        const pt = FACE_POINTS[f.area as keyof typeof FACE_POINTS];
        const meta = LABEL_META[f.area];
        if (!pt || !meta) return null;

        const px = pt.x * imageSize;
        const py = pt.y * imageSize;
        const isLeft = meta.side === 'left';
        const isActive = selected === f.area;

        return (
          <React.Fragment key={f.area}>
            {/* 선 */}
            <View
              style={[
                styles.line,
                {
                  left: isLeft ? px - LINE_LEN : px,
                  top: py,
                  width: LINE_LEN,
                },
                isActive && styles.lineActive,
              ]}
            />

            {/* 점 */}
            <TouchableOpacity
              style={[styles.pointTouch, { left: px - 18, top: py - 18 }]}
              onPress={() => setSelected(isActive ? null : f.area)}
            >
              <View style={[styles.dot, isActive && styles.dotActive]} />
            </TouchableOpacity>

            {/* 라벨 */}
            <TouchableOpacity
              style={[
                styles.labelBox,
                isLeft
                  ? { right: imageSize - px + LINE_LEN - 6, top: py - 12 }
                  : { left: px + LINE_LEN - 6, top: py - 12 },
                isActive && styles.labelBoxActive,
              ]}
              onPress={() => setSelected(isActive ? null : f.area)}
            >
              <Text style={[styles.labelText, isActive && styles.labelTextActive]}>
                {meta.label}
              </Text>
              <Text style={[styles.scoreText, isActive && styles.scoreActive]}>
                {f.score}
              </Text>
            </TouchableOpacity>
          </React.Fragment>
        );
      })}

      {/* 상세 카드 */}
      {selectedData && (
        <Animated.View entering={FadeInDown.duration(200)} style={styles.detailCard}>
          <TouchableOpacity onPress={() => setSelected(null)} style={styles.closeBtn}>
            <Text style={styles.closeText}>X</Text>
          </TouchableOpacity>
          <Text style={styles.detailTitle}>
            {LABEL_META[selected!]?.label}
          </Text>
          <View style={styles.detailScoreRow}>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${selectedData.score}%` }]} />
            </View>
            <Text style={styles.detailScore}>{selectedData.score}점</Text>
          </View>
          <Text style={styles.detailDesc}>{selectedData.description}</Text>
          {selectedData.detail && (
            <Text style={styles.detailDetail}>{selectedData.detail}</Text>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', alignSelf: 'center', borderRadius: theme.radius.lg, overflow: 'hidden', backgroundColor: theme.colors.bg.secondary },
  image: { borderRadius: theme.radius.lg },
  paperOverlay: { position: 'absolute', top: 0, left: 0, backgroundColor: 'rgba(210,190,160,0.12)', borderRadius: theme.radius.lg },

  line: { position: 'absolute', height: 1, backgroundColor: 'rgba(200,170,120,0.5)' },
  lineActive: { height: 2, backgroundColor: theme.colors.gold.primary },

  pointTouch: { position: 'absolute', width: 36, height: 36, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(200,170,120,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  dotActive: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.colors.gold.primary, borderColor: '#fff', borderWidth: 2 },

  labelBox: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, zIndex: 5 },
  labelBoxActive: { backgroundColor: 'rgba(0,0,0,0.8)', borderWidth: 1, borderColor: theme.colors.gold.primary },
  labelText: { fontSize: 9, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  labelTextActive: { color: '#fff' },
  scoreText: { fontSize: 9, color: 'rgba(200,170,120,0.7)', fontWeight: '700' },
  scoreActive: { color: theme.colors.gold.primary },

  detailCard: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(20,18,15,0.92)', padding: theme.spacing.md, paddingTop: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.gold.dark, zIndex: 20 },
  closeBtn: { position: 'absolute', top: 8, right: 12, zIndex: 21 },
  closeText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  detailTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.gold.primary, marginBottom: theme.spacing.xs },
  detailScoreRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
  barTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: theme.colors.gold.primary, borderRadius: 2 },
  detailScore: { fontSize: 14, fontWeight: '700', color: theme.colors.gold.primary },
  detailDesc: { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
  detailDetail: { fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 18, marginTop: theme.spacing.xs },
});
