import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { theme } from '../../constants/theme';
import { FORTUNE_CARD_MESSAGES } from '../../constants/fortuneCards';
import { useFortuneStore } from '../../stores/fortuneStore';
import { calculateTodaySaju, getTenGod } from '../../utils/saju-calc';

interface Props {
  dayStemIdx?: number;
}

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function DailyFortuneCard({ dayStemIdx }: Props) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'ko') as 'ko' | 'en' | 'ja';
  const { dailyCardDate, dailyCardMessage, dailyCardTenGod, dailyCardScore, setDailyCard } = useFortuneStore();

  const today = getToday();
  const isRevealed = dailyCardDate === today;

  const todayCard = useMemo(() => {
    if (isRevealed && dailyCardMessage) {
      return { message: dailyCardMessage, tenGod: dailyCardTenGod || '', score: dailyCardScore || 75 };
    }
    if (dayStemIdx == null) return null;
    const todaySaju = calculateTodaySaju(dayStemIdx);
    const tenGod = getTenGod(dayStemIdx, todaySaju.dayStemIdx);
    const messages = FORTUNE_CARD_MESSAGES[tenGod];
    if (!messages?.length) return null;
    const d = new Date();
    const dateNum = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    const variant = dateNum % messages.length;
    return { message: messages[variant][lang] || messages[variant].ko, tenGod, score: 60 + (dateNum % 30) };
  }, [dayStemIdx, isRevealed, dailyCardMessage, lang]);

  // Animations
  const rotation = useSharedValue(isRevealed ? 180 : 0);
  const cardScale = useSharedValue(1);
  const cardY = useSharedValue(0);
  const pulseOpacity = useSharedValue(0.4);
  const revealOpacity = useSharedValue(isRevealed ? 1 : 0);

  useEffect(() => {
    if (!isRevealed) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        ), -1, false
      );
    }
  }, [isRevealed]);

  const handleFlip = () => {
    if (isRevealed || !todayCard) return;
    setDailyCard(today, todayCard.message, todayCard.tenGod, todayCard.score);

    try { const H = require('expo-haptics'); setTimeout(() => H.impactAsync(H.ImpactFeedbackStyle.Medium), 400); } catch {}

    cardY.value = withTiming(-8, { duration: 180 });
    cardScale.value = withTiming(1.03, { duration: 180 });
    rotation.value = withDelay(180, withTiming(180, { duration: 500, easing: Easing.bezier(0.4, 0, 0.2, 1) }));
    cardY.value = withDelay(680, withSpring(0, { damping: 12 }));
    cardScale.value = withDelay(680, withSpring(1, { damping: 10 }));
    revealOpacity.value = withDelay(450, withTiming(1, { duration: 400 }));
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardY.value }, { scale: cardScale.value }],
  }));

  const frontStyle = useAnimatedStyle(() => ({
    opacity: rotation.value < 90 ? 1 : 0,
    transform: [{ perspective: 1000 }, { rotateY: `${rotation.value}deg` }],
  }));

  const backStyle = useAnimatedStyle(() => ({
    opacity: rotation.value >= 90 ? 1 : 0,
    transform: [{ perspective: 1000 }, { rotateY: `${rotation.value - 180}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));
  const msgStyle = useAnimatedStyle(() => ({
    opacity: revealOpacity.value,
    transform: [{ translateY: interpolate(revealOpacity.value, [0, 1], [10, 0]) }],
  }));

  if (!todayCard) return null;

  return (
    <Animated.View style={[styles.wrapper, containerStyle]}>
      <TouchableOpacity activeOpacity={0.95} onPress={handleFlip} disabled={isRevealed}>
        {/* Front */}
        <Animated.View style={[styles.card, frontStyle]}>
          <Animated.View style={[styles.pulseRing, pulseStyle]} />
          <Text style={styles.hanja}>命</Text>
          <Text style={styles.frontHint}>오늘의 운명을 열어보세요</Text>
          <Text style={styles.frontTap}>탭하여 카드 뒤집기</Text>
        </Animated.View>

        {/* Back */}
        <Animated.View style={[styles.card, styles.cardBack, backStyle]}>
          <Text style={styles.backLabel}>오늘의 운명 카드</Text>
          <Animated.View style={msgStyle}>
            <Text style={styles.backMessage}>"{todayCard.message}"</Text>
            <View style={styles.tenGodRow}>
              <View style={styles.tenGodLine} />
              <Text style={styles.tenGodText}>{todayCard.tenGod}의 기운</Text>
              <View style={styles.tenGodLine} />
            </View>
            <Text style={styles.backScore}>{todayCard.score}<Text style={styles.backScoreUnit}>점</Text></Text>
          </Animated.View>
          {isRevealed && (
            <Text style={styles.tomorrowHint}>내일 새로운 카드가 기다리고 있어요</Text>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
    height: 180,
  },
  card: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg.elevated,
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
    }),
  } as any,
  cardBack: {},
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: theme.colors.gold.primary,
  },
  hanja: {
    fontSize: 40,
    color: theme.colors.gold.primary,
    fontWeight: '200',
    marginBottom: 10,
  },
  frontHint: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '400',
    letterSpacing: 1,
    marginBottom: 4,
  },
  frontTap: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
  },
  backLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
    opacity: 0.7,
  },
  backMessage: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  tenGodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tenGodLine: {
    width: 16,
    height: 1,
    backgroundColor: theme.colors.gold.primary,
    opacity: 0.2,
  },
  tenGodText: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
  },
  backScore: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.gold.primary,
  },
  backScoreUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.colors.text.tertiary,
  },
  tomorrowHint: {
    position: 'absolute',
    bottom: 10,
    fontSize: 10,
    color: theme.colors.text.tertiary,
    letterSpacing: 0.3,
  },
});
