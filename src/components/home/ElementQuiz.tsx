import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { useFortuneStore } from '../../stores/fortuneStore';

const ELEMENTS = [
  { key: 'wood', hanja: '木', ko: '목', color: '#6B8E5B' },
  { key: 'fire', hanja: '火', ko: '화', color: '#C75B4A' },
  { key: 'earth', hanja: '土', ko: '토', color: '#D4A84B' },
  { key: 'metal', hanja: '金', ko: '금', color: '#C4912E' },
  { key: 'water', hanja: '水', ko: '수', color: '#5B8FA8' },
];

function getToday() { const d = new Date(); return d.toDateString(); }

interface Props {
  elementBalance?: Record<string, number>; // { wood: 25, fire: 12.5, ... }
}

export function ElementQuiz({ elementBalance }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { quizDate, quizResult, setQuiz } = useFortuneStore();
  const today = getToday();
  const alreadyDone = quizDate === today;

  const [selected, setSelected] = useState<string | null>(alreadyDone ? quizResult?.selected || null : null);
  const [revealed, setRevealed] = useState(alreadyDone);

  // Find weakest element
  const weakest = useMemo(() => {
    if (!elementBalance) return 'water';
    return Object.entries(elementBalance).reduce((a, b) => a[1] < b[1] ? a : b)[0];
  }, [elementBalance]);

  const isCorrect = selected === weakest;
  const accuracy = useMemo(() => 75 + Math.floor(Math.random() * 20), [selected]);

  const handleSelect = (key: string) => {
    if (revealed) return;
    setSelected(key);
    setRevealed(true);
    setQuiz(today, { selected: key, correct: weakest, isCorrect: key === weakest });
    try { const H = require('expo-haptics'); H.impactAsync(H.ImpactFeedbackStyle.Medium); } catch {}
  };

  const weakEl = ELEMENTS.find(e => e.key === weakest);
  const selEl = ELEMENTS.find(e => e.key === selected);

  return (
    <View style={styles.container}>
      <Text style={styles.quizBadge}>QUIZ</Text>
      <Text style={styles.label}>{'오늘 부족한 기운은?'}</Text>

      <View style={styles.row}>
        {ELEMENTS.map((el) => {
          const isSelected = selected === el.key;
          const dimmed = revealed && !isSelected;
          return (
            <TouchableOpacity key={el.key} style={[styles.btn, isSelected && styles.btnSelected, dimmed && styles.btnDimmed]} onPress={() => handleSelect(el.key)} disabled={revealed} activeOpacity={0.7}>
              <Text style={[styles.btnHanja, { color: isSelected ? el.color : '#C4912E' }]}>{el.hanja}</Text>
              <Text style={[styles.btnLabel, isSelected && { color: el.color }]}>{el.ko}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {revealed && (
        <Animated.View entering={FadeInDown.springify()} style={[styles.resultCard, isCorrect ? styles.resultCorrect : styles.resultWrong]}>
          {isCorrect ? (
            <>
              <Text style={styles.resultTitle}>✦ {'직감이 정확해요!'} ✦</Text>
              <Text style={styles.resultDesc}>
                사주에서 가장 부족한 {weakEl?.ko}({weakEl?.hanja})의 기운을 정확히 감지했어요.
              </Text>
              <Text style={styles.resultAccuracy}>직감 정확도: {accuracy}%</Text>
            </>
          ) : (
            <>
              <Text style={styles.resultTitle}>{'아쉽지만 조금 달라요'}</Text>
              <View style={styles.compareRow}>
                <View style={styles.compareItem}>
                  <Text style={styles.compareLabel}>고른 것</Text>
                  <Text style={[styles.compareValue, { color: selEl?.color }]}>{selEl?.ko}({selEl?.hanja})</Text>
                </View>
                <Text style={styles.compareArrow}>→</Text>
                <View style={styles.compareItem}>
                  <Text style={styles.compareLabel}>실제</Text>
                  <Text style={[styles.compareValue, { color: weakEl?.color }]}>{weakEl?.ko}({weakEl?.hanja})</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/(tabs)/saju' as any)} activeOpacity={0.8}>
                <Text style={styles.ctaText}>{'내 사주 오행 정확히 알아보기'}</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14, alignItems: 'center' },
  quizBadge: { fontSize: 10, fontWeight: '800', color: theme.colors.gold.primary, letterSpacing: 2, marginBottom: 6 },
  label: { fontSize: 14, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 14, letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  btn: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: theme.colors.bg.elevated, borderWidth: 1.5, borderColor: 'rgba(232,176,74,0.25)',
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    }),
  } as any,
  btnSelected: { borderColor: '#E8B04A', backgroundColor: 'rgba(232,176,74,0.08)' },
  btnDimmed: { opacity: 0.3 },
  btnHanja: { fontSize: 18, fontWeight: '300' },
  btnLabel: { fontSize: 9, color: '#C4912E', marginTop: 1 },
  resultCard: {
    marginTop: 12, width: '100%', backgroundColor: theme.colors.bg.elevated, borderRadius: 16, padding: 20, alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
    }),
  } as any,
  resultCorrect: {},
  resultWrong: {},
  resultTitle: { fontSize: 16, fontWeight: '700', color: '#E8B04A', marginBottom: 8, letterSpacing: 1 },
  resultDesc: { fontSize: 13, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  resultAccuracy: { fontSize: 22, fontWeight: '800', color: '#E8B04A' },
  compareRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, marginTop: 4 },
  compareItem: { alignItems: 'center' },
  compareLabel: { fontSize: 10, color: theme.colors.text.tertiary, marginBottom: 2 },
  compareValue: { fontSize: 15, fontWeight: '700' },
  compareArrow: { fontSize: 16, color: theme.colors.text.tertiary },
  ctaBtn: { backgroundColor: '#1C1C1E', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  ctaText: { fontSize: 14, fontWeight: '700', color: theme.colors.gold.primary },
});
