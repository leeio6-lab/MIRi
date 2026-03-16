import React, { useState, useCallback } from 'react';
import { Text, Pressable, Modal, View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { theme } from '../../constants/theme';
import { SAJU_GLOSSARY } from './HelpButton';

type GlossaryKey = keyof typeof SAJU_GLOSSARY;

// ─── 본문 텍스트에서 자동 감지할 용어 매핑 ───
// key = 텍스트에서 찾을 단어, value = SAJU_GLOSSARY 키
const TERM_MAP: [string, GlossaryKey][] = [
  // 긴 단어 먼저 (겹침 방지)
  ['사주팔자', 'fourPillars'],
  ['사주 팔자', 'fourPillars'],
  ['합충형파', '합충형파'],
  ['배우자궁', '배우자궁'],
  ['귀문관살', '귀문관살'],
  ['천을귀인', '천을귀인'],
  ['12운성', 'lifeStages'],
  ['십이운성', 'lifeStages'],
  ['12신살', 'spiritStars'],
  ['십이신살', 'spiritStars'],
  ['오행 밸런스', 'elementBalance'],
  ['오행 균형', 'elementBalance'],
  ['오행밸런스', 'elementBalance'],
  ['귀인운', '귀인운'],
  ['지장간', 'hiddenStems'],
  ['양인살', '양인살'],
  ['도화살', '도화살'],
  ['천간합', '천간합'],
  ['지지충', '지지충'],
  ['지지합', '지지합'],
  ['식재관', '식재관'],
  ['억부법', '억부법'],
  ['조후법', '조후법'],
  ['통관법', '통관법'],
  ['초년운', '초년운'],
  ['중년운', '중년운'],
  ['말년운', '말년운'],
  ['신강', 'strength'],
  ['신약', 'strength'],
  ['身强', 'strength'],
  ['身弱', 'strength'],
  ['십성', 'tenGods'],
  ['十星', 'tenGods'],
  ['십신', 'tenGods'],
  ['十神', 'tenGods'],
  ['용신', 'yongShin'],
  ['用神', 'yongShin'],
  ['기신', 'yongShin'],
  ['忌神', 'yongShin'],
  ['희신', '희신'],
  ['喜神', '희신'],
  ['대운', 'daeun'],
  ['大運', 'daeun'],
  ['세운', '세운'],
  ['歲運', '세운'],
  ['연운', 'yearlyFortune'],
  ['월운', 'monthlyFortune'],
  // 기둥 & 구성 요소 (긴 것 먼저)
  ['월간', '월간'],
  ['일지', '일지'],
  ['일간', 'dayMaster'],
  ['日干', 'dayMaster'],
  ['일주', '일주'],
  ['연주', '연주'],
  ['월주', '월주'],
  ['시주', '시주'],
  ['오행', 'fiveElements'],
  ['五行', 'fiveElements'],
  // 기본 구조
  ['천간', '천간'],
  ['天干', '천간'],
  ['지지', '지지'],
  ['地支', '지지'],
  ['간지', '간지'],
  ['음양', '음양'],
  ['陰陽', '음양'],
  // 분석 개념
  ['원국', '원국'],
  ['격국', '격국'],
  ['종격', '종격'],
  ['통근', '통근'],
  ['득령', '득령'],
  ['득지', '득지'],
  ['득세', '득세'],
  ['삼합', '삼합'],
  ['인비', '인비'],
  // 십성 카테고리
  ['재성', '재성'],
  ['관성', '관성'],
  ['인성', '인성'],
  ['식상', '식상'],
  ['비겁', '비겁'],
  // 십성 — 개별 용어 팝업
  ['비견', '비견'],
  ['겁재', '겁재'],
  ['식신', '식신'],
  ['상관', '상관'],
  ['편재', '편재'],
  ['정재', '정재'],
  ['편관', '편관'],
  ['정관', '정관'],
  ['편인', '편인'],
  ['정인', '정인'],
  // 12운성 — 개별 용어 팝업
  ['장생', '장생'],
  ['목욕', '목욕'],
  ['관대', '관대'],
  ['건록', '건록'],
  ['제왕', '제왕'],
  // 12신살 — 개별 용어 팝업
  ['겁살', '겁살'],
  ['재살', '재살'],
  ['천살', '천살'],
  ['지살', '지살'],
  ['연살', '연살'],
  ['월살', '월살'],
  ['망신살', '망신살'],
  ['장성살', '장성살'],
  ['반안살', '반안살'],
  ['역마살', '역마살'],
  ['육해살', '육해살'],
  ['화개살', '화개살'],
  // 상생·상극
  ['상생', '상생'],
  ['상극', '상극'],
];

// 정규식 빌드 (한 번만)
const TERM_REGEX = new RegExp(
  `(${TERM_MAP.map(([word]) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
  'g'
);
const WORD_TO_KEY = new Map(TERM_MAP);

// ─── 팝업 컴포넌트 (공유) ───
function TermPopup({ termKey, visible, onClose }: { termKey: GlossaryKey; visible: boolean; onClose: () => void }) {
  const term = SAJU_GLOSSARY[termKey];
  if (!term) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.popup} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{term.title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.short}>{term.short}</Text>
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.detail}>{term.detail}</Text>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── TermBadge: 코드 계산된 배지(십성·12운성·신살)를 감싸서 탭 가능하게 ───
// label을 넘기면 개별 용어(예: '겁재')를 먼저 찾고, 없으면 카테고리(예: 'tenGods')로 폴백
export function TermBadge({ termKey, label, children }: { termKey: GlossaryKey; label?: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const resolvedKey = (label && label in SAJU_GLOSSARY) ? label : termKey;
  const term = SAJU_GLOSSARY[resolvedKey];
  if (!term) return <>{children}</>;

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
      <TermPopup termKey={resolvedKey as GlossaryKey} visible={visible} onClose={() => setVisible(false)} />
    </>
  );
}

// ─── TermTip: 독립 블록형 (섹션 제목 옆 등) ───
interface TermTipProps {
  termKey: GlossaryKey;
  label?: string;
  style?: any;
}

export function TermTip({ termKey, label, style }: TermTipProps) {
  const [visible, setVisible] = useState(false);
  const term = SAJU_GLOSSARY[termKey];
  if (!term) return <Text style={style}>{label ?? termKey}</Text>;

  const displayText = label ?? term.title.split('(')[0].trim();

  return (
    <>
      <Pressable onPress={() => setVisible(true)} hitSlop={4}>
        <Text style={[styles.term, style]}>
          {displayText}
          <Text style={styles.dot}>{'\u00B7'}</Text>
        </Text>
      </Pressable>
      <TermPopup termKey={termKey} visible={visible} onClose={() => setVisible(false)} />
    </>
  );
}

// ─── TermInline: Text 내부 인라인용 ───
export function TermInline({ termKey, children, style }: { termKey: GlossaryKey; children: React.ReactNode; style?: any }) {
  const [visible, setVisible] = useState(false);
  const term = SAJU_GLOSSARY[termKey];
  if (!term) return <Text style={style}>{children}</Text>;

  return (
    <>
      <Text style={[styles.inline, style]} onPress={() => setVisible(true)}>
        {children}
      </Text>
      <TermPopup termKey={termKey} visible={visible} onClose={() => setVisible(false)} />
    </>
  );
}

// ─── SajuText: 본문 텍스트에서 용어 자동 감지 → 탭 가능하게 ───
interface SajuTextProps {
  children: string;
  style?: any;
}

/**
 * AI 생성 텍스트를 받아서 사주 용어를 자동 감지하고
 * 해당 단어를 탭하면 용어 설명 팝업이 뜨도록 렌더링합니다.
 *
 * 사용법: <SajuText style={styles.body}>{someText}</SajuText>
 */
export function SajuText({ children: text, style }: SajuTextProps) {
  const [activeKey, setActiveKey] = useState<GlossaryKey | null>(null);

  const handlePress = useCallback((key: GlossaryKey) => {
    setActiveKey(key);
  }, []);

  if (!text || typeof text !== 'string') return <Text style={style}>{text}</Text>;

  // 텍스트를 용어/비용어 조각으로 분리
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const seen = new Set<string>(); // 같은 단어는 첫 출현만 하이라이트

  // 매치 수집
  const matches: { index: number; length: number; word: string; key: GlossaryKey }[] = [];
  let m: RegExpExecArray | null;
  TERM_REGEX.lastIndex = 0;
  while ((m = TERM_REGEX.exec(text)) !== null) {
    const word = m[1];
    const key = WORD_TO_KEY.get(word);
    if (key) {
      matches.push({ index: m.index, length: word.length, word, key });
    }
  }

  // 겹치는 매치 제거 (긴 것 우선)
  const filtered = matches
    .sort((a, b) => a.index - b.index || b.length - a.length)
    .filter((m, i, arr) => {
      if (i === 0) return true;
      const prev = arr[i - 1];
      return m.index >= prev.index + prev.length;
    });

  for (const match of filtered) {
    // 매치 이전 텍스트
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const isFirst = !seen.has(match.key);
    if (isFirst) seen.add(match.key);

    // 첫 출현 → 하이라이트+탭 가능, 이후 → 일반 텍스트
    if (isFirst) {
      const capturedKey = match.key;
      parts.push(
        <Text
          key={`m${match.index}`}
          style={styles.inlineWord}
          onPress={() => handlePress(capturedKey)}
        >
          {match.word}
        </Text>
      );
    } else {
      parts.push(match.word);
    }

    lastIndex = match.index + match.length;
  }

  // 나머지 텍스트
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  // 용어가 하나도 없으면 그냥 렌더
  if (filtered.length === 0) return <Text style={style}>{text}</Text>;

  return (
    <>
      <Text style={style}>{parts}</Text>
      {activeKey && (
        <TermPopup termKey={activeKey} visible={true} onClose={() => setActiveKey(null)} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  term: {
    color: theme.colors.gold.primary,
    fontWeight: '600',
  },
  dot: {
    fontSize: 8,
    color: theme.colors.gold.primary,
    opacity: 0.6,
  },
  inline: {
    textDecorationLine: 'underline',
    textDecorationColor: theme.colors.gold.primary + '60',
    textDecorationStyle: 'dotted',
    color: theme.colors.gold.primary,
  },
  inlineWord: {
    color: theme.colors.gold.primary,
    textDecorationLine: 'underline',
    textDecorationColor: theme.colors.gold.primary + '50',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  popup: {
    backgroundColor: theme.colors.bg.primary,
    borderRadius: theme.radius.xl,
    padding: 22,
    width: '100%',
    maxHeight: '70%',
    ...Platform.select({
      web: { boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 10,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    flex: 1,
  },
  close: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    padding: 4,
  },
  short: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    lineHeight: 20,
    marginBottom: 10,
  },
  scroll: {
    maxHeight: 300,
  },
  detail: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 21,
  },
});
