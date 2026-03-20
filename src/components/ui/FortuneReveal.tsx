import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInDown,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { playInkDrop, playInkSpread, playReveal } from '../../utils/sounds';

const { width: W, height: H } = Dimensions.get('window');
const TAPS_NEEDED = 3;
const PARTICLES_PER_TAP = 10;

interface FortuneData {
  score: number;
  grade: string;
  gradeColor: string;
  summary: string;
  luckyItem?: string;
  sijin?: string;       // 현재 시진 (자시, 축시...)
  tenGod?: string;      // 현재 십신
  hourInsight?: string;  // 시간별 인사이트
}

interface Props {
  visible: boolean;
  fortune: FortuneData | null;
  onClose: () => void;
}

/* ─── Particle ─── */
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  delay: number;
}

function InkParticle({ p }: { p: Particle }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const dur = 500 + Math.random() * 300;
    translateX.value = withDelay(p.delay, withTiming(p.vx, { duration: dur, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(p.delay, withTiming(p.vy + 40, { duration: dur, easing: Easing.out(Easing.quad) }));
    scale.value = withDelay(p.delay, withSequence(
      withTiming(1.2, { duration: 100 }),
      withTiming(0.6, { duration: dur - 100, easing: Easing.out(Easing.quad) }),
    ));
    opacity.value = withDelay(p.delay, withSequence(
      withTiming(0.8, { duration: 80 }),
      withTiming(0, { duration: dur, easing: Easing.in(Easing.quad) }),
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{
      position: 'absolute',
      left: p.x - p.size / 2,
      top: p.y - p.size / 2,
      width: p.size,
      height: p.size,
      borderRadius: p.size / 2,
      backgroundColor: '#1C1C1E',
    }, style]} />
  );
}

/* ─── Ripple ring on tap ─── */
function TapRipple({ x, y }: { x: number; y: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withTiming(4, { duration: 700, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(0, { duration: 700, easing: Easing.out(Easing.quad) });
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{
      position: 'absolute',
      left: x - 30,
      top: y - 30,
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 2,
      borderColor: theme.colors.gold.primary,
    }, style]} />
  );
}

/* ─── Impact splash (big circle) ─── */
function TapSplash({ x, y }: { x: number; y: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.5, { duration: 150, easing: Easing.out(Easing.cubic) }),
      withTiming(2.5, { duration: 500, easing: Easing.out(Easing.quad) }),
    );
    opacity.value = withSequence(
      withTiming(0.5, { duration: 100 }),
      withTiming(0, { duration: 600 }),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{
      position: 'absolute',
      left: x - 40,
      top: y - 40,
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#2C2C2E',
    }, style]} />
  );
}

/* ─── Main Component ─── */
export function FortuneReveal({ visible, fortune, onClose }: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [phase, setPhase] = useState<'tap' | 'converge' | 'reveal'>('tap');
  const [tapCount, setTapCount] = useState(0);
  const idRef = useRef(0);

  const overlayOpacity = useSharedValue(0);
  const flashOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setParticles([]);
      setRipples([]);
      setPhase('tap');
      setTapCount(0);
      idRef.current = 0;
      overlayOpacity.value = withTiming(1, { duration: 500 });
    } else {
      overlayOpacity.value = 0;
    }
  }, [visible]);

  const handleTap = useCallback((evt: any) => {
    if (phase !== 'tap') return;

    const x = evt.nativeEvent.locationX ?? evt.nativeEvent.pageX ?? W / 2;
    const y = evt.nativeEvent.locationY ?? evt.nativeEvent.pageY ?? H / 2;

    playInkDrop();

    // Create particles
    const newParticles: Particle[] = [];
    for (let i = 0; i < PARTICLES_PER_TAP; i++) {
      const angle = (Math.PI * 2 * i) / PARTICLES_PER_TAP + (Math.random() - 0.5) * 0.5;
      const speed = 30 + Math.random() * 80;
      newParticles.push({
        id: ++idRef.current,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 6 + Math.random() * 14,
        delay: Math.random() * 50,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);

    // Ripple
    setRipples(prev => [...prev, { id: idRef.current, x, y }]);

    const next = tapCount + 1;
    setTapCount(next);

    if (next >= TAPS_NEEDED) {
      setTimeout(() => {
        playInkSpread();
        setPhase('converge');

        // Flash
        flashOpacity.value = withSequence(
          withTiming(0.8, { duration: 150 }),
          withTiming(0, { duration: 400 }),
        );

        setTimeout(() => {
          setPhase('reveal');
          playReveal();
        }, 800);
      }, 300);
    }
  }, [phase, tapCount]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flashOpacity.value }));

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="none" transparent statusBarTranslucent>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={styles.touchArea} onPress={handleTap}>

          {/* Particles */}
          {particles.map(p => <InkParticle key={p.id} p={p} />)}

          {/* Ripples */}
          {ripples.map(r => (
            <React.Fragment key={r.id}>
              <TapRipple x={r.x} y={r.y} />
              <TapSplash x={r.x} y={r.y} />
            </React.Fragment>
          ))}

          {/* Flash overlay */}
          <Animated.View style={[styles.flash, flashStyle]} pointerEvents="none" />

          {/* Tap instruction */}
          {phase === 'tap' && (
            <Animated.View entering={FadeIn.delay(400)} style={styles.instructionWrap}>
              <Text style={styles.hanja}>占</Text>
              <Text style={styles.instructionText}>화면을 터치하세요</Text>
              <View style={styles.tapCounter}>
                {Array.from({ length: TAPS_NEEDED }).map((_, i) => (
                  <View key={i} style={[styles.tapDot, i < tapCount && styles.tapDotFilled]} />
                ))}
              </View>
            </Animated.View>
          )}

          {/* Converge text */}
          {phase === 'converge' && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.convergeWrap}>
              <Text style={styles.convergeText}>운명을 펼치는 중</Text>
              <View style={styles.convergeDots}>
                {[0, 1, 2].map(i => {
                  const DotAnim = () => {
                    const o = useSharedValue(0.2);
                    useEffect(() => {
                      o.value = withDelay(i * 200, withSequence(
                        withTiming(1, { duration: 300 }),
                        withTiming(0.2, { duration: 300 }),
                      ));
                    }, []);
                    const s = useAnimatedStyle(() => ({ opacity: o.value }));
                    return <Animated.View style={[styles.convergeDot, s]} />;
                  };
                  return <DotAnim key={i} />;
                })}
              </View>
            </Animated.View>
          )}

          {/* Fortune result */}
          {phase === 'reveal' && fortune && (
            <Animated.View entering={SlideInDown.springify().damping(18)} style={styles.resultCard}>
              {/* 시진 배지 */}
              {fortune.sijin && (
                <View style={styles.sijinBadge}>
                  <Text style={styles.sijinText}>{fortune.sijin}</Text>
                  {fortune.tenGod && <Text style={styles.tenGodText}>{fortune.tenGod}</Text>}
                </View>
              )}

              <Text style={styles.resultLabel}>오늘의 기운</Text>

              <View style={styles.scoreRow}>
                <Text style={styles.scoreNum}>{fortune.score}</Text>
                <View style={styles.scoreRight}>
                  <View style={[styles.gradePill, { backgroundColor: fortune.gradeColor + '18', borderColor: fortune.gradeColor + '40' }]}>
                    <Text style={[styles.gradeText, { color: fortune.gradeColor }]}>{fortune.grade}</Text>
                  </View>
                  <Text style={styles.scoreMax}>/ 100</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* 시간별 인사이트 (있으면 우선) */}
              {fortune.hourInsight ? (
                <>
                  <Text style={styles.insightText}>{fortune.hourInsight}</Text>
                  <View style={styles.subDivider} />
                  <Text style={styles.summaryText}>{fortune.summary}</Text>
                </>
              ) : (
                <Text style={styles.summaryText}>{fortune.summary}</Text>
              )}

              {fortune.luckyItem && (
                <View style={styles.luckyRow}>
                  <Text style={styles.luckyLabel}>행운 아이템</Text>
                  <Text style={styles.luckyValue}>{fortune.luckyItem}</Text>
                </View>
              )}

              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.closeBtnText}>확인</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8,8,8,0.95)',
  },
  touchArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },

  // Instruction
  instructionWrap: {
    alignItems: 'center',
    gap: 14,
  },
  hanja: {
    fontSize: 48,
    color: theme.colors.gold.primary,
    opacity: 0.15,
    fontWeight: '200',
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 4,
  },
  tapCounter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  tapDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tapDotFilled: {
    backgroundColor: theme.colors.gold.primary,
    borderColor: theme.colors.gold.primary,
  },

  // Converge
  convergeWrap: {
    alignItems: 'center',
    gap: 12,
  },
  convergeText: {
    fontSize: 15,
    fontWeight: '300',
    color: theme.colors.gold.primary,
    letterSpacing: 6,
    opacity: 0.8,
  },
  convergeDots: {
    flexDirection: 'row',
    gap: 8,
  },
  convergeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.gold.primary,
  },

  // Result
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: W - 48,
    maxWidth: 400,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 12px 60px rgba(0,0,0,0.4)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 30, elevation: 15 },
    }),
  } as any,
  sijinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  sijinText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    letterSpacing: 1,
  },
  tenGodText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  scoreNum: {
    fontSize: 56,
    fontWeight: '800',
    color: theme.colors.gold.dark,
    letterSpacing: -3,
  },
  scoreRight: {
    gap: 4,
  },
  gradePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  gradeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  scoreMax: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
  divider: {
    width: 36,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginBottom: 14,
  },
  insightText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 10,
  },
  subDivider: {
    width: 20,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginBottom: 10,
    alignSelf: 'center',
  },
  summaryText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 14,
  },
  luckyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
    backgroundColor: 'rgba(181,149,48,0.06)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  luckyLabel: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
  luckyValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.gold.primary,
  },
  closeBtn: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.gold.primary,
  },
});
