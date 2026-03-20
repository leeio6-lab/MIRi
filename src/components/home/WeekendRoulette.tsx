import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, withSequence, Easing, FadeInDown, runOnJS,
} from 'react-native-reanimated';
import Svg, { Path, Circle as SvgCircle, Line } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { ROULETTE_ITEMS, getRouletteTarget } from '../../constants/rouletteData';
import { useFortuneStore } from '../../stores/fortuneStore';

const SIZE = 240;
const SEGMENTS = ROULETTE_ITEMS.length;
const ANGLE_PER = 360 / SEGMENTS;

function getToday() { const d = new Date(); return d.toDateString(); }
function isWeekend() { const d = new Date().getDay(); return d === 0 || d === 6; }

export function WeekendRoulette() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'ko') as 'ko' | 'en' | 'ja';
  const router = useRouter();
  const { rouletteDate, rouletteResult, setRoulette } = useFortuneStore();

  const today = getToday();
  const alreadyDone = rouletteDate === today;
  const weekend = isWeekend();
  const targetIdx = useMemo(() => getRouletteTarget(), []);

  const [phase, setPhase] = useState<'idle' | 'spinning' | 'done'>(alreadyDone ? 'done' : 'idle');
  const rotation = useSharedValue(0);

  const handleSpin = () => {
    if (phase !== 'idle' || !weekend) return;
    setPhase('spinning');

    const targetAngle = 360 * 6 + (360 - targetIdx * ANGLE_PER - ANGLE_PER / 2);
    rotation.value = withTiming(targetAngle, { duration: 4000, easing: Easing.bezier(0.2, 0.8, 0.2, 1) });

    try { const H = require('expo-haptics'); H.impactAsync(H.ImpactFeedbackStyle.Medium); } catch {}

    setTimeout(() => {
      setPhase('done');
      setRoulette(today, targetIdx);
      try { const H = require('expo-haptics'); H.notificationAsync(H.NotificationFeedbackType.Success); } catch {}
    }, 4200);
  };

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotation.value}deg` }],
  }));

  const resultItem = alreadyDone && rouletteResult != null ? ROULETTE_ITEMS[rouletteResult] : ROULETTE_ITEMS[targetIdx];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('home.rouletteTitle') || '주말 운세 룰렛'}</Text>

      {!weekend && (
        <View style={styles.waitWrap}>
          <Text style={styles.waitText}>{t('home.rouletteWait') || '이번 주말 룰렛이 기다리고 있어요'}</Text>
        </View>
      )}

      {weekend && (
        <>
          <View style={styles.wheelWrap}>
            {/* Pointer */}
            <View style={styles.pointer}>
              <Svg width={20} height={14} viewBox="0 0 20 14">
                <Path d="M10 14 L0 0 L20 0 Z" fill="#E8B04A" />
              </Svg>
            </View>

            {/* Wheel */}
            <Animated.View style={[styles.wheel, wheelStyle]}>
              <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
                {/* Outer circle */}
                <SvgCircle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 2} stroke="#E8B04A" strokeWidth={2} fill="#FFFFFF" />
                {/* Segments */}
                {ROULETTE_ITEMS.map((item, i) => {
                  const startA = (i * ANGLE_PER - 90) * Math.PI / 180;
                  const endA = ((i + 1) * ANGLE_PER - 90) * Math.PI / 180;
                  const midA = ((i + 0.5) * ANGLE_PER - 90) * Math.PI / 180;
                  const r = SIZE / 2 - 3;
                  const cx = SIZE / 2;
                  const cy = SIZE / 2;
                  return (
                    <React.Fragment key={i}>
                      <Line x1={cx} y1={cy} x2={cx + r * Math.cos(startA)} y2={cy + r * Math.sin(startA)} stroke="rgba(232,176,74,0.2)" strokeWidth={1} />
                      {i % 2 === 1 && (
                        <Path d={`M${cx},${cy} L${cx + r * Math.cos(startA)},${cy + r * Math.sin(startA)} A${r},${r} 0 0,1 ${cx + r * Math.cos(endA)},${cy + r * Math.sin(endA)} Z`} fill="rgba(232,176,74,0.04)" />
                      )}
                    </React.Fragment>
                  );
                })}
              </Svg>
              {/* Labels */}
              {ROULETTE_ITEMS.map((item, i) => {
                const midA = ((i + 0.5) * ANGLE_PER - 90) * Math.PI / 180;
                const r = SIZE / 2 - 32;
                const x = SIZE / 2 + r * Math.cos(midA);
                const y = SIZE / 2 + r * Math.sin(midA);
                return (
                  <View key={i} style={[styles.segLabel, { left: x - 20, top: y - 10 }]}>
                    <Text style={[styles.segText, i === 7 && { color: '#E8B04A', fontWeight: '800' }]}>{item.keyword[lang] || item.keyword.ko}</Text>
                  </View>
                );
              })}
            </Animated.View>

            {/* Center button */}
            {phase === 'idle' && (
              <TouchableOpacity style={styles.centerBtn} onPress={handleSpin} activeOpacity={0.8}>
                <Text style={styles.centerText}>START</Text>
              </TouchableOpacity>
            )}
            {phase === 'spinning' && (
              <View style={styles.centerBtn}><Text style={styles.centerText}>...</Text></View>
            )}
          </View>

          {/* Result */}
          {phase === 'done' && resultItem && (
            <Animated.View entering={FadeInDown.springify()} style={styles.resultCard}>
              <Text style={styles.resultLabel}>이번 주말 키워드</Text>
              <Text style={[styles.resultKw, { color: resultItem.color }]}>✦ {resultItem.keyword[lang] || resultItem.keyword.ko} ✦</Text>
              <Text style={styles.resultMsg}>{resultItem.message[lang] || resultItem.message.ko}</Text>
              {(targetIdx === 1 || targetIdx === 7) && (
                <TouchableOpacity style={styles.resultCta} onPress={() => router.push('/(tabs)/compatibility' as any)} activeOpacity={0.8}>
                  <Text style={styles.resultCtaText}>궁합 분석 해보기</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16, alignItems: 'center' },
  label: { fontSize: 11, fontWeight: '700', color: theme.colors.gold.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 },
  waitWrap: { padding: 20, backgroundColor: theme.colors.bg.elevated, borderRadius: 16, width: '100%', alignItems: 'center' },
  waitText: { fontSize: 13, color: theme.colors.text.tertiary },
  wheelWrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 16 },
  pointer: { position: 'absolute', top: -4, zIndex: 10, alignItems: 'center' },
  wheel: { width: SIZE, height: SIZE, position: 'relative' },
  segLabel: { position: 'absolute', width: 40, height: 20, alignItems: 'center', justifyContent: 'center' },
  segText: { fontSize: 11, fontWeight: '600', color: '#333' },
  centerBtn: {
    position: 'absolute', width: 54, height: 54, borderRadius: 27, backgroundColor: '#E8B04A', alignItems: 'center', justifyContent: 'center',
    ...Platform.select({ web: { boxShadow: '0 2px 8px rgba(196,145,46,0.3)' }, default: { elevation: 4 } }),
  } as any,
  centerText: { fontSize: 11, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
  resultCard: {
    backgroundColor: theme.colors.bg.elevated, borderRadius: 16, padding: 20, width: '100%', alignItems: 'center',
    ...Platform.select({ web: { boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }, default: { elevation: 3 } }),
  } as any,
  resultLabel: { fontSize: 12, color: theme.colors.text.tertiary, marginBottom: 6 },
  resultKw: { fontSize: 24, fontWeight: '700', marginBottom: 10, letterSpacing: 2 },
  resultMsg: { fontSize: 14, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: 12 },
  resultCta: { backgroundColor: '#E8B04A', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  resultCtaText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
});
