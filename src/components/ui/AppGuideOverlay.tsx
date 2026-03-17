import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, FadeInUp } from 'react-native-reanimated';
import { theme } from '../../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const TAB_COUNT = 5;
const TAB_W = SCREEN_W / TAB_COUNT;

// 각 탭의 안내 데이터 (순서: 占 命 緣 相 我)
const STEPS = [
  { tabIndex: 0, char: '占', title: '오늘의 운세', desc: '매일 바뀌는 일진과\n시간대별 운세를 확인하세요' },
  { tabIndex: 1, char: '命', title: '사주 분석', desc: '사주팔자 기반\n성격·직업·재물운을 풀어드려요' },
  { tabIndex: 2, char: '緣', title: '궁합 분석', desc: '두 사람의 사주가 만나\n어떤 인연인지 알아보세요' },
  { tabIndex: 3, char: '相', title: '관상 분석', desc: '셀카 한 장으로\n얼굴에 담긴 운명을 읽어요' },
  { tabIndex: 4, char: '我', title: '마이페이지', desc: '분석 기록과 설정을\n관리할 수 있어요' },
];

interface Props {
  onComplete: () => void;
}

export function AppGuideOverlay({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleTap = () => {
    if (isLast) {
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  // 현재 탭의 중심 X 좌표
  const tabCenterX = current.tabIndex * TAB_W + TAB_W / 2;
  // 말풍선 너비
  const BUBBLE_W = 220;
  // 말풍선 왼쪽 위치 (화면 밖으로 안 나가게 클램프)
  const bubbleLeft = Math.max(16, Math.min(SCREEN_W - BUBBLE_W - 16, tabCenterX - BUBBLE_W / 2));
  // 꼬리 위치 (말풍선 안에서의 상대 위치)
  const tailLeft = tabCenterX - bubbleLeft;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={s.overlay}
    >
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={handleTap}>

        {/* 탭바 위 하이라이트 영역 */}
        <View style={s.tabHighlightRow}>
          {STEPS.map((st, i) => (
            <View key={i} style={[s.tabSpot, i === step && s.tabSpotActive]}>
              <Text style={[s.tabSpotChar, i === step && s.tabSpotCharActive]}>{st.char}</Text>
            </View>
          ))}
        </View>

        {/* 말풍선 (탭 위에 뜸) */}
        <Animated.View
          key={step}
          entering={FadeInUp.duration(350).springify()}
          style={[s.bubble, { left: bubbleLeft, width: BUBBLE_W }]}
        >
          {/* 꼬리 삼각형 */}
          <View style={[s.bubbleTail, { left: tailLeft - 8 }]} />

          <Text style={s.bubbleTitle}>{current.title}</Text>
          <Text style={s.bubbleDesc}>{current.desc}</Text>

          <View style={s.bubbleFooter}>
            <Text style={s.bubbleStep}>{step + 1} / {STEPS.length}</Text>
            <Text style={s.bubbleNext}>{isLast ? '시작하기' : '다음'}</Text>
          </View>
        </Animated.View>

        {/* 상단 안내 */}
        {step === 0 && (
          <Animated.View entering={FadeIn.delay(400).duration(400)} style={s.topHint}>
            <Text style={s.topHintText}>탭하여 기능을 알아보세요</Text>
          </Animated.View>
        )}

      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
    justifyContent: 'flex-end',
  },

  // ── 상단 힌트 ──
  topHint: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
  },
  topHintText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    fontWeight: '300',
  },

  // ── 탭 하이라이트 (하단 고정) ──
  tabHighlightRow: {
    flexDirection: 'row',
    height: 84,
    paddingBottom: 34,
    paddingTop: 8,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,168,75,0.12)',
  },
  tabSpot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.3,
  },
  tabSpotActive: {
    opacity: 1,
  },
  tabSpotChar: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
  },
  tabSpotCharActive: {
    color: theme.colors.gold.primary,
  },

  // ── 말풍선 (탭 바로 위) ──
  bubble: {
    position: 'absolute',
    bottom: 92, // 탭바 높이(84) + 여백
    backgroundColor: theme.colors.bg.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 20,
    paddingHorizontal: 22,
    ...({
      shadowColor: theme.colors.gold.muted,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    } as any),
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -8,
    width: 16,
    height: 8,
    backgroundColor: 'transparent',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: theme.colors.bg.primary,
  },
  bubbleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  bubbleDesc: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  bubbleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bubbleStep: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
  },
  bubbleNext: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    letterSpacing: 1,
  },
});
