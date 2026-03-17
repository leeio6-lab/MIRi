import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { theme } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { TermBadge } from '../../src/components/ui/TermTip';
import { BackButton } from '../../src/components/ui/BackButton';
import { ElementRadar } from '../../src/components/saju/ElementRadar';
import { ElementChart } from '../../src/components/saju/ElementChart';
import { useAuthStore } from '../../src/stores/authStore';
import {
  calculateFullSaju,
  calculateYearlyFortune,
  calculateMonthlyFortune,
  ELEMENT_NAMES_KO,
  HIDDEN_STEMS,
  HEAVENLY_STEMS_HANJA,
  EARTHLY_BRANCHES_HANJA,
  STEM_ELEMENTS,
  STEM_YINYANG,
  BRANCH_ELEMENTS,
  isGongmang,
  type FullSajuAnalysis,
  type DaeunPillar,
  type YearlyFortune,
  type MonthlyFortune,
} from '../../src/utils/saju-calc';

// ─── Day master personality descriptions ───
const DAY_MASTER_DESCRIPTIONS: Record<number, string> = {
  0: '갑목(甲木) — 큰 나무처럼 곧고 당당한 리더십. 정의감이 강하고 도전정신이 넘칩니다.',
  1: '을목(乙木) — 덩굴처럼 유연하고 적응력이 뛰어남. 부드럽지만 강인한 생명력.',
  2: '병화(丙火) — 태양처럼 밝고 열정적. 주변을 환하게 비추는 카리스마.',
  3: '정화(丁火) — 촛불처럼 따뜻하고 섬세함. 내면이 깊고 직관력이 뛰어남.',
  4: '무토(戊土) — 산처럼 듬직하고 신뢰감 있음. 포용력과 안정감의 상징.',
  5: '기토(己土) — 옥토처럼 기름지고 양육적. 세심하고 실용적인 능력.',
  6: '경금(庚金) — 강철처럼 강하고 결단력 있음. 의리와 책임감이 강함.',
  7: '신금(辛金) — 보석처럼 섬세하고 예리함. 완벽주의적 성향과 미적 감각.',
  8: '임수(壬水) — 바다처럼 넓고 깊은 지혜. 자유로운 영혼과 큰 포부.',
  9: '계수(癸水) — 이슬처럼 맑고 순수함. 감성적이고 직관력이 뛰어남.',
};

// ─── Element interpretations ───
const ELEMENT_INTERPRETATIONS: Record<string, { meaning: string; strong: string; weak: string; body: string; color: string }> = {
  wood: {
    meaning: '봄 · 성장 · 시작',
    strong: '결단이 빠르고 밀어붙이는 힘이 있어요. 다만 한 번 정하면 물러서지 않으려는 면이 있으니, 가끔은 주변 의견도 들어보세요.',
    weak: '새로운 일을 시작할 때 망설임이 있을 수 있어요. 산책이나 식물 가꾸기처럼 자연과 가까이하면 목 기운이 보완됩니다.',
    body: '간, 담, 눈, 근육',
    color: '초록 · 연두',
  },
  fire: {
    meaning: '여름 · 열정 · 표현',
    strong: '말과 행동에 에너지가 넘쳐요. 사람들 앞에 서는 걸 좋아하지만, 너무 달아오르면 쉽게 지칠 수 있으니 쉬어가는 타이밍이 중요해요.',
    weak: '자기 표현이 서투르거나 소극적인 면이 있을 수 있어요. 따뜻한 차 한 잔, 붉은 계열 소품이 화 기운을 채워줍니다.',
    body: '심장, 소장, 혈관',
    color: '빨강 · 주황',
  },
  earth: {
    meaning: '환절기 · 안정 · 중심',
    strong: '사람들이 편하게 의지하는 타입이에요. 신뢰감이 크지만, 익숙한 것만 고집하면 기회를 놓칠 수 있어요.',
    weak: '마음이 잘 흔들리거나 중심 잡기가 어려울 때가 있어요. 규칙적인 생활 리듬과 흙과 가까운 활동(도예, 등산)이 도움됩니다.',
    body: '위장, 비장, 입술',
    color: '노랑 · 베이지',
  },
  metal: {
    meaning: '가을 · 결단 · 정의',
    strong: '옳고 그름이 분명하고 실행력이 좋아요. 다만 너무 칼같으면 주변이 불편할 수 있으니, 부드러운 말투를 의식하면 관계가 좋아져요.',
    weak: '결정을 미루거나 마무리가 흐지부지될 때가 있어요. 정리정돈, 은색·금속 소재 액세서리가 금 기운을 보완합니다.',
    body: '폐, 대장, 코, 피부',
    color: '흰색 · 은색',
  },
  water: {
    meaning: '겨울 · 지혜 · 유연',
    strong: '관찰력이 좋고 상황 파악이 빨라요. 다만 생각이 너무 많아지면 행동이 늦어질 수 있으니, 떠오를 때 바로 움직이세요.',
    weak: '깊이 생각하기보다 즉흥적으로 판단하는 경향이 있어요. 물 가까이(수영, 산책)하면 수 기운이 채워집니다.',
    body: '신장, 방광, 귀, 뼈',
    color: '검정 · 남색',
  },
};

// ─── Strength interpretations ───
const STRENGTH_MESSAGES = {
  strong: '자아가 단단해서 스스로 길을 여는 힘이 있어요. 독립적이고 추진력이 좋지만, 가끔은 한 발 물러서서 주변을 살피는 여유가 필요합니다. 에너지가 넘칠 때는 표현(식상)이나 재물 활동(재성)으로 풀어주면 균형이 맞아요.',
  weak: '혼자 밀어붙이기보다 좋은 사람들과 함께할 때 빛나는 유형이에요. 멘토나 배움(인성), 믿을 수 있는 동료(비겁)가 큰 힘이 됩니다. 체력 관리를 꾸준히 하면 운도 따라와요.',
};

// ─── Yong Shin practical tips ───
const YONGSHIN_TIPS: Record<string, string> = {
  wood: '동쪽이 좋은 방향이에요. 초록 계열 옷이나 소품, 아침 시간 활용, 공원 산책이 기운을 채워줍니다.',
  fire: '남쪽이 좋은 방향이에요. 따뜻한 색 옷, 사람 많은 곳, 낮 시간에 중요한 일을 하면 좋아요.',
  earth: '중심을 잡아주는 게 중요해요. 베이지·갈색 계열 소품, 규칙적인 생활, 흙과 가까운 활동이 좋습니다.',
  metal: '서쪽이 좋은 방향이에요. 흰색·은색 계열, 깔끔하게 정리된 공간, 오후에 집중하면 효율이 올라요.',
  water: '북쪽이 좋은 방향이에요. 남색·검정 계열 소품, 물 자주 마시기, 저녁 시간 활용이 도움됩니다.',
};

// ─── Element color helpers ───
const ELEMENT_COLORS: Record<string, string> = {
  wood: theme.colors.elements.wood,
  fire: theme.colors.elements.fire,
  earth: theme.colors.elements.earth,
  metal: theme.colors.elements.metal,
  water: theme.colors.elements.water,
};

function getElementColor(element: string): string {
  return ELEMENT_COLORS[element] ?? theme.colors.text.primary;
}

function stemColor(stemIdx: number): string {
  return getElementColor(STEM_ELEMENTS[stemIdx]);
}

/** helper to get main hidden stem index */
function getMainHiddenStemIdx(branchIdx: number): number {
  const hidden = HIDDEN_STEMS[branchIdx];
  return hidden[hidden.length - 1].stemIdx;
}

// ─── Scroll-triggered lazy reveal ───
function LazySection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(false);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    // Trigger when the placeholder enters the viewport area
    if (!visible) setVisible(true);
  }, [visible]);

  if (!visible) {
    return <View onLayout={onLayout} style={{ minHeight: 60 }} />;
  }

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500).springify()}>
      {children}
    </Animated.View>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {subtitle && <Text style={s.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ═══════════════════════════════════════════════
// ★ 킥 포인트 1: 사주 한 줄 내러티브
// ═══════════════════════════════════════════════

const DAYMASTER_NATURE: Record<number, { nature: string; advice: string }> = {
  0: { nature: '큰 나무', advice: '뿌리가 깊을수록 높이 자랍니다. 기본기를 다지세요.' },
  1: { nature: '풀과 꽃', advice: '유연함이 강점이에요. 흐름을 타면 멀리 갑니다.' },
  2: { nature: '태양', advice: '빛을 나누세요. 비출수록 당신도 빛납니다.' },
  3: { nature: '촛불', advice: '작지만 어둠을 밝히는 존재예요. 집중하면 강해집니다.' },
  4: { nature: '산', advice: '묵묵히 자리를 지키세요. 사람들이 찾아옵니다.' },
  5: { nature: '들판', advice: '씨를 뿌린 만큼 거둡니다. 꾸준함이 답이에요.' },
  6: { nature: '강철', advice: '결단의 순간에 강해져요. 망설이지 마세요.' },
  7: { nature: '보석', advice: '갈고 닦을수록 빛나요. 디테일이 무기입니다.' },
  8: { nature: '바다', advice: '작은 그릇에 담기지 마세요. 큰 그림을 그리세요.' },
  9: { nature: '빗물', advice: '조용히 스며드는 힘이 있어요. 급하지 않아도 됩니다.' },
};

function PersonalNarrativeSection({ analysis }: { analysis: FullSajuAnalysis }) {
  const dmIdx = analysis.fourPillars.day.stemIdx;
  const dm = DAYMASTER_NATURE[dmIdx];
  const strength = analysis.strength;
  const balance = analysis.fourPillars.elementBalance;
  const sorted = Object.entries(balance).sort(([,a],[,b]) => (b as number) - (a as number));
  const strongest = sorted[0][0];

  const strengthWord = strength.isStrong ? '스스로 길을 여는' : '함께할 때 빛나는';
  const elementWord = ELEMENT_INTERPRETATIONS[strongest]?.meaning.split('·')[1]?.trim() || '';

  return (
    <GlassCard style={s.cardSpacing}>
      <View style={s.narrativeWrap}>
        <Text style={s.narrativeTitle}>
          {dm?.nature}처럼 {elementWord}이 넘치는,{'\n'}{strengthWord} 사주
        </Text>
        <View style={s.narrativeDivider} />
        <Text style={s.narrativeAdvice}>{dm?.advice}</Text>
      </View>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════
// ★ 킥 포인트 2: 기둥 간 관계도 (합충)
// ═══════════════════════════════════════════════

const STEM_COMBINES: [number, number, string][] = [
  [0, 5, '갑기합 — 토로 변화하는 기운'], [1, 6, '을경합 — 금으로 변화하는 기운'],
  [2, 7, '병신합 — 수로 변화하는 기운'], [3, 8, '정임합 — 목으로 변화하는 기운'],
  [4, 9, '무계합 — 화로 변화하는 기운'],
];

const BRANCH_CLASHES: [number, number, string][] = [
  [0, 6, '자오충 — 감정이 요동치는 에너지'], [1, 7, '축미충 — 가치관이 부딪히는 에너지'],
  [2, 8, '인신충 — 이동과 변화의 에너지'], [3, 9, '묘유충 — 관계가 흔들리는 에너지'],
  [4, 10, '진술충 — 고집이 부딪히는 에너지'], [5, 11, '사해충 — 생각이 충돌하는 에너지'],
];

const BRANCH_COMBINES: [number, number, string][] = [
  [0, 1, '자축합 — 안정을 만드는 조화'], [2, 11, '인해합 — 성장을 돕는 조화'],
  [3, 10, '묘술합 — 열정을 키우는 조화'], [4, 9, '진유합 — 결실을 맺는 조화'],
  [5, 8, '사신합 — 흐름을 만드는 조화'], [6, 7, '오미합 — 따뜻함을 나누는 조화'],
];

function PillarInteractionSection({ analysis }: { analysis: FullSajuAnalysis }) {
  const fp = analysis.fourPillars;
  const pillars = [
    { name: '시', stem: fp.hour.stemIdx, branch: fp.hour.branchIdx },
    { name: '일', stem: fp.day.stemIdx, branch: fp.day.branchIdx },
    { name: '월', stem: fp.month.stemIdx, branch: fp.month.branchIdx },
    { name: '년', stem: fp.year.stemIdx, branch: fp.year.branchIdx },
  ];

  const interactions: { from: string; to: string; type: '합' | '충'; desc: string }[] = [];

  for (let i = 0; i < pillars.length; i++) {
    for (let j = i + 1; j < pillars.length; j++) {
      const a = pillars[i], b = pillars[j];
      for (const [s1, s2, desc] of STEM_COMBINES) {
        if ((a.stem === s1 && b.stem === s2) || (a.stem === s2 && b.stem === s1))
          interactions.push({ from: `${a.name}주`, to: `${b.name}주`, type: '합', desc: `천간 ${desc}` });
      }
      for (const [b1, b2, desc] of BRANCH_CLASHES) {
        if ((a.branch === b1 && b.branch === b2) || (a.branch === b2 && b.branch === b1))
          interactions.push({ from: `${a.name}주`, to: `${b.name}주`, type: '충', desc: `지지 ${desc}` });
      }
      for (const [b1, b2, desc] of BRANCH_COMBINES) {
        if ((a.branch === b1 && b.branch === b2) || (a.branch === b2 && b.branch === b1))
          interactions.push({ from: `${a.name}주`, to: `${b.name}주`, type: '합', desc: `지지 ${desc}` });
      }
    }
  }

  if (interactions.length === 0) return null;

  return (
    <GlassCard style={s.cardSpacing}>
      <SectionHeader title="기둥 간 관계" subtitle="어떤 기운이 서로 밀고 당기는지" />
      <View style={s.interactionList}>
        {interactions.map((inter, i) => (
          <View key={i} style={s.interactionRow}>
            <View style={[s.interactionBadge, inter.type === '합' ? s.interactionHap : s.interactionChung]}>
              <Text style={[s.interactionBadgeText, inter.type === '합' ? s.interactionHapText : s.interactionChungText]}>
                {inter.type}
              </Text>
            </View>
            <View style={s.interactionTextWrap}>
              <Text style={s.interactionPillars}>{inter.from} ↔ {inter.to}</Text>
              <Text style={s.interactionDesc}>{inter.desc}</Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={s.interactionFooter}>
        합은 서로 끌어당기는 조화의 에너지, 충은 부딪혀 변화를 만드는 에너지예요.{'\n'}
        충이 있다고 나쁜 게 아니라, 변화의 힘이 강하다는 뜻입니다.
      </Text>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════
// ★ 킥 포인트 3: 나에게 맞는 것들 (실생활 가이드)
// ═══════════════════════════════════════════════

const ELEMENT_GUIDE: Record<string, {
  color: string; direction: string; season: string;
  time: string; food: string; avoid: string; career: string;
}> = {
  wood: { color: '초록 · 연두', direction: '동쪽', season: '봄 (3~5월)', time: '아침 5~9시', food: '신맛 — 레몬, 매실, 식초', avoid: '금속성 과다 노출', career: '교육, 출판, 패션, 조경' },
  fire: { color: '빨강 · 보라', direction: '남쪽', season: '여름 (6~8월)', time: '낮 9~13시', food: '쓴맛 — 커피, 녹차, 케일', avoid: '차가운 환경 장시간', career: '미디어, 요식, 전자, 엔터' },
  earth: { color: '노랑 · 베이지', direction: '중앙', season: '환절기', time: '오후 13~15시', food: '단맛 — 고구마, 대추, 꿀', avoid: '불규칙한 생활', career: '부동산, 건설, 중개, 유통' },
  metal: { color: '흰색 · 은색', direction: '서쪽', season: '가을 (9~11월)', time: '저녁 15~19시', food: '매운맛 — 생강, 마늘', avoid: '습한 환경', career: '금융, 법률, IT, 의료기기' },
  water: { color: '검정 · 남색', direction: '북쪽', season: '겨울 (12~2월)', time: '밤 19~23시', food: '짠맛 — 해산물, 미역', avoid: '건조하고 뜨거운 환경', career: '무역, 물류, 관광, 외교' },
};

function MyGuideSection({ analysis }: { analysis: FullSajuAnalysis }) {
  const yongEl = analysis.yongShin.eokbuYongShin;
  const giEl = analysis.yongShin.giShin;
  const guide = ELEMENT_GUIDE[yongEl];
  const avoidGuide = ELEMENT_GUIDE[giEl];

  if (!guide) return null;

  const items = [
    { label: '좋은 색', value: guide.color },
    { label: '좋은 방향', value: guide.direction },
    { label: '좋은 계절', value: guide.season },
    { label: '에너지 높은 시간', value: guide.time },
    { label: '도움이 되는 음식', value: guide.food },
    { label: '어울리는 직업군', value: guide.career },
    { label: '주의할 것', value: avoidGuide?.avoid || guide.avoid },
  ];

  return (
    <GlassCard style={s.cardSpacing}>
      <SectionHeader title="나에게 맞는 것들" subtitle="일상에서 바로 써먹는 기운 보완법" />
      <View style={s.guideGrid}>
        {items.map((item, i) => (
          <View key={i} style={[s.guideItem, i === items.length - 1 && s.guideItemLast]}>
            <Text style={s.guideLabel}>{item.label}</Text>
            <Text style={s.guideValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

// ─── 1. Today's energy ───
function TodaySajuSection({ analysis }: { analysis: FullSajuAnalysis }) {
  const { todaySaju } = analysis;
  const color = stemColor(todaySaju.dayStemIdx);

  return (
    <GlassCard style={s.cardSpacing}>
      <SectionHeader title="오늘의 기운" subtitle={`${todaySaju.date} — 오늘 나에게 흐르는 에너지`} />
      <View style={s.todayRow}>
        <View style={s.todayPillar}>
          <Text style={[s.todayHanja, { color }]}>{todaySaju.dayStemHanja}</Text>
          <Text style={[s.todayHanjaSub, { color }]}>{todaySaju.dayBranchHanja}</Text>
        </View>
        <View style={s.todayInfo}>
          <View style={s.todayBadgeRow}>
            <TermBadge termKey="tenGods" label={todaySaju.tenGod}>
              <View style={[s.pillBadge, { backgroundColor: color + '18' }]}>
                <Text style={[s.pillBadgeText, { color }]}>{todaySaju.tenGod}</Text>
              </View>
            </TermBadge>
            <TermBadge termKey="lifeStages" label={todaySaju.lifeStage}>
              <View style={[s.pillBadge, { backgroundColor: '#F5F5F5' }]}>
                <Text style={[s.pillBadgeText, { color: theme.colors.text.secondary }]}>{todaySaju.lifeStage}</Text>
              </View>
            </TermBadge>
          </View>
          <Text style={s.todayDesc}>{todaySaju.description}</Text>
        </View>
      </View>
    </GlassCard>
  );
}

// ─── 2. Four Pillars — Card Stack Layout ───
const ELEMENT_HANJA_SIGN: Record<string, string> = {
  wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
};

function FourPillarsCardSection({ analysis }: { analysis: FullSajuAnalysis }) {
  const { fourPillars, tenGods, lifeStages, spiritStars } = analysis;
  const pillarsArr = [
    { key: 'hour', label: '시주', pillar: fourPillars.hour, stemTG: tenGods.hourStem, branchTG: tenGods.hourBranch, ls: lifeStages.hourBranch, ss: spiritStars.hourBranch, isDay: false },
    { key: 'day', label: '일주', pillar: fourPillars.day, stemTG: tenGods.dayStem, branchTG: tenGods.dayBranch, ls: lifeStages.dayBranch, ss: spiritStars.dayBranch, isDay: true },
    { key: 'month', label: '월주', pillar: fourPillars.month, stemTG: tenGods.monthStem, branchTG: tenGods.monthBranch, ls: lifeStages.monthBranch, ss: spiritStars.monthBranch, isDay: false },
    { key: 'year', label: '년주', pillar: fourPillars.year, stemTG: tenGods.yearStem, branchTG: tenGods.yearBranch, ls: lifeStages.yearBranch, ss: spiritStars.yearBranch, isDay: false },
  ];

  return (
    <GlassCard style={s.cardSpacing}>
      <SectionHeader title="나의 사주팔자" subtitle="네 기둥이 나를 이루고 있어요" />

      {/* 범례 */}
      <View style={s.pillarHelpRow}>
        <View style={s.pillarHelpItem}>
          <Text style={s.pillarHelpLabel}>십성</Text>
        </View>
        <View style={s.pillarHelpItem}>
          <Text style={s.pillarHelpLabel}>지장간</Text>
        </View>
        <View style={s.pillarHelpItem}>
          <Text style={s.pillarHelpLabel}>12운성</Text>
        </View>
        <View style={s.pillarHelpItem}>
          <Text style={s.pillarHelpLabel}>12신살</Text>
        </View>
      </View>

      {/* Card stack — 4 individual pillar cards */}
      <View style={s.pillarCardsRow}>
        {pillarsArr.map((p) => {
          const sColor = stemColor(p.pillar.stemIdx);
          const sElement = STEM_ELEMENTS[p.pillar.stemIdx];
          const bElement = STEM_ELEMENTS[getMainHiddenStemIdx(p.pillar.branchIdx)];
          const bColor = getElementColor(bElement);
          const hiddenStems = HIDDEN_STEMS[p.pillar.branchIdx];
          const hiddenStr = hiddenStems.map(h => HEAVENLY_STEMS_HANJA[h.stemIdx]).join(' ');

          return (
            <View
              key={p.key}
              style={[
                s.pillarCard,
                { backgroundColor: sColor + '06' },
                p.isDay && s.pillarCardDay,
              ]}
            >
              {/* Watermark element hanja in background */}
              <Text style={[s.pillarWatermark, { color: sColor + '08' }]}>
                {ELEMENT_HANJA_SIGN[sElement] || ''}
              </Text>

              <View style={s.pillarCardInner}>
                {/* Label — fixed height */}
                <View style={s.pillarRow}>
                  <Text style={[s.pillarLabel, p.isDay && s.pillarLabelDay]}>
                    {p.label}{p.isDay ? ' (나)' : ''}
                  </Text>
                </View>

                {/* Stem — fixed height */}
                <View style={s.pillarHanjaRow}>
                  <Text style={[s.pillarStemHanja, { color: sColor }]}>
                    {p.pillar.stemHanja}
                  </Text>
                  <Text style={[s.pillarKoSmall, { color: sColor }]}>{p.pillar.stem}</Text>
                </View>

                <View style={s.pillarDivider} />

                {/* Branch — fixed height */}
                <View style={s.pillarHanjaRow}>
                  <Text style={[s.pillarBranchHanja, { color: bColor }]}>
                    {p.pillar.branchHanja}
                  </Text>
                  <Text style={[s.pillarKoSmall, { color: bColor }]}>{p.pillar.branch}</Text>
                </View>

                {/* Ten gods — fixed height */}
                <View style={s.pillarBadgesCol}>
                  <TermBadge termKey="tenGods" label={p.stemTG}>
                    <View style={[s.pillBadge, { backgroundColor: sColor + '15' }]}>
                      <Text style={[s.pillBadgeTextSm, { color: sColor }]}>{p.stemTG}</Text>
                    </View>
                  </TermBadge>
                  <TermBadge termKey="tenGods" label={p.branchTG}>
                    <View style={[s.pillBadge, { backgroundColor: bColor + '15' }]}>
                      <Text style={[s.pillBadgeTextSm, { color: bColor }]}>{p.branchTG}</Text>
                    </View>
                  </TermBadge>
                </View>

                {/* Hidden stems — fixed height */}
                <TermBadge termKey="hiddenStems">
                  <View style={s.pillarMetaRow}>
                    <Text style={s.pillarMeta}>{hiddenStr}</Text>
                  </View>
                </TermBadge>

                {/* Life stage — fixed height */}
                <TermBadge termKey="lifeStages" label={p.ls}>
                  <View style={s.pillarMetaRow}>
                    <Text style={s.pillarLifeStage}>{p.ls}</Text>
                  </View>
                </TermBadge>

                {/* Spirit star — fixed height */}
                <TermBadge termKey="spiritStars" label={p.ss}>
                  <View style={s.pillarMetaRow}>
                    <View style={[s.pillBadge, { backgroundColor: '#F5F5F5' }]}>
                      <Text style={[s.pillBadgeTextSm, { color: theme.colors.text.secondary }]}>{p.ss}</Text>
                    </View>
                  </View>
                </TermBadge>
              </View>
            </View>
          );
        })}
      </View>
    </GlassCard>
  );
}

// ─── 2.5 전통 만세력 명식표 (Classic Manseryeok Table) ───

function ManseryeokTableSection({ analysis }: { analysis: FullSajuAnalysis }) {
  const { fourPillars, tenGods, lifeStages, spiritStars, gongmang } = analysis;
  const dmIdx = fourPillars.day.stemIdx;

  // 시 → 일 → 월 → 년 순서 (전통 만세력 표 기준)
  const columns = [
    { label: '시주', pillar: fourPillars.hour, stemTG: tenGods.hourStem, branchTG: tenGods.hourBranch, ls: lifeStages.hourBranch, ss: spiritStars.hourBranch, isDay: false },
    { label: '일주', pillar: fourPillars.day, stemTG: '일간', branchTG: tenGods.dayBranch, ls: lifeStages.dayBranch, ss: spiritStars.dayBranch, isDay: true },
    { label: '월주', pillar: fourPillars.month, stemTG: tenGods.monthStem, branchTG: tenGods.monthBranch, ls: lifeStages.monthBranch, ss: spiritStars.monthBranch, isDay: false },
    { label: '년주', pillar: fourPillars.year, stemTG: tenGods.yearStem, branchTG: tenGods.yearBranch, ls: lifeStages.yearBranch, ss: spiritStars.yearBranch, isDay: false },
  ];

  const ROW_LABEL_WIDTH = 52;

  // 행 렌더링 함수
  const renderRow = (label: string, cells: React.ReactNode[], bgColor?: string) => (
    <View style={[s2.tableRow, bgColor ? { backgroundColor: bgColor } : undefined]}>
      <View style={[s2.tableRowLabel, { width: ROW_LABEL_WIDTH }]}>
        <Text style={s2.tableRowLabelText}>{label}</Text>
      </View>
      {cells.map((cell, i) => (
        <View key={i} style={[s2.tableCell, columns[i].isDay && s2.tableCellDay]}>
          {cell}
        </View>
      ))}
    </View>
  );

  return (
    <GlassCard style={s.cardSpacing}>
      <SectionHeader title="명식표" subtitle="전통 만세력 형식의 사주 원국" />

      <View style={s2.tableContainer}>
        {/* 기둥 헤더 */}
        <View style={s2.tableRow}>
          <View style={[s2.tableRowLabel, { width: ROW_LABEL_WIDTH }]} />
          {columns.map((col) => (
            <View key={col.label} style={[s2.tableCell, col.isDay && s2.tableCellDay]}>
              <Text style={[s2.tableHeaderText, col.isDay && s2.tableHeaderTextDay]}>{col.label}</Text>
            </View>
          ))}
        </View>

        {/* 십성 (천간) */}
        {renderRow('십성', columns.map((col) => (
          <Text style={[s2.tableTenGodText, { color: stemColor(col.pillar.stemIdx) }]}>
            {col.stemTG}
          </Text>
        )))}

        {/* 천간 */}
        {renderRow('천간', columns.map((col) => {
          const sColor = stemColor(col.pillar.stemIdx);
          const yinyang = STEM_YINYANG[col.pillar.stemIdx];
          return (
            <View style={s2.tableStemCell}>
              <Text style={[s2.tableHanjaLarge, { color: sColor }]}>{col.pillar.stemHanja}</Text>
              <Text style={[s2.tableKoSmall, { color: sColor }]}>
                {col.pillar.stem}{yinyang === '양' ? '(+)' : '(-)'}
              </Text>
            </View>
          );
        }), '#F5F5F5' + '40')}

        {/* 지지 */}
        {renderRow('지지', columns.map((col) => {
          const bEl = BRANCH_ELEMENTS[col.pillar.branchIdx];
          const bColor = getElementColor(bEl);
          const isGM = isGongmang(dmIdx, fourPillars.day.branchIdx, col.pillar.branchIdx);
          return (
            <View style={s2.tableStemCell}>
              <View style={{ position: 'relative' }}>
                <Text style={[s2.tableHanjaLarge, { color: bColor }]}>{col.pillar.branchHanja}</Text>
                {isGM && <View style={s2.gongmangDot} />}
              </View>
              <Text style={[s2.tableKoSmall, { color: bColor }]}>{col.pillar.branch}</Text>
            </View>
          );
        }), '#F5F5F5' + '40')}

        {/* 십성 (지지) */}
        {renderRow('지지십성', columns.map((col) => {
          const bEl = BRANCH_ELEMENTS[col.pillar.branchIdx];
          const bColor = getElementColor(bEl);
          return <Text style={[s2.tableTenGodText, { color: bColor }]}>{col.branchTG}</Text>;
        }))}

        {/* 지장간 */}
        {renderRow('지장간', columns.map((col) => {
          const hidden = HIDDEN_STEMS[col.pillar.branchIdx];
          return (
            <View style={s2.tableHiddenRow}>
              {hidden.map((h, i) => (
                <Text key={i} style={[s2.tableHiddenText, { color: stemColor(h.stemIdx) }]}>
                  {HEAVENLY_STEMS_HANJA[h.stemIdx]}
                </Text>
              ))}
            </View>
          );
        }))}

        {/* 12운성 */}
        {renderRow('12운성', columns.map((col) => (
          <Text style={s2.tableMetaText}>{col.ls}</Text>
        )))}

        {/* 12신살 */}
        {renderRow('12신살', columns.map((col) => (
          <Text style={s2.tableMetaText}>{col.ss}</Text>
        )))}

        {/* 띠 */}
        {renderRow('띠', columns.map((col) => (
          <Text style={s2.tableMetaText}>
            {col.pillar.zodiac ? `${col.pillar.zodiac}띠` : '—'}
          </Text>
        )))}
      </View>

      {/* 공망 */}
      <View style={s2.gongmangRow}>
        <Text style={s2.gongmangLabel}>공망(空亡)</Text>
        <View style={s2.gongmangValueWrap}>
          <Text style={s2.gongmangHanja}>{gongmang.hanja}</Text>
          <Text style={s2.gongmangText}>({gongmang.text})</Text>
          {gongmang.inPillars.length > 0 && (
            <View style={s2.gongmangInPillars}>
              {gongmang.inPillars.map((name) => (
                <View key={name} style={s2.gongmangPillarBadge}>
                  <Text style={s2.gongmangPillarText}>{name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
      {gongmang.inPillars.length > 0 && (
        <Text style={s2.gongmangNote}>
          {gongmang.inPillars.join(', ')}에 공망이 걸려 있습니다. 해당 기둥의 기운이 실속 없이 드러나거나 뜻대로 안 될 수 있지만, 오히려 집착을 내려놓으면 자유로워지는 에너지입니다.
        </Text>
      )}
    </GlassCard>
  );
}

// ─── 3. Energy Summary (new) ───
function EnergySummarySection({ analysis }: { analysis: FullSajuAnalysis }) {
  const dmIdx = analysis.fourPillars.day.stemIdx;
  const dmElement = analysis.fourPillars.dayMasterElement;
  const dmColor = getElementColor(dmElement);
  const desc = DAY_MASTER_DESCRIPTIONS[dmIdx] || '';

  // Find dominant element
  const balance = analysis.fourPillars.elementBalance;
  const entries = Object.entries(balance) as [string, number][];
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0];
  const dominantColor = getElementColor(dominant[0]);

  return (
    <GlassCard style={s.cardSpacing}>
      <SectionHeader title="나는 어떤 사람일까" />
      <View style={s.energySummaryCard}>
        <View style={[s.energySummaryAccent, { backgroundColor: dmColor + '20' }]}>
          <Text style={[s.energySummaryHanja, { color: dmColor }]}>
            {analysis.fourPillars.dayMaster}
          </Text>
        </View>
        <Text style={s.energySummaryDesc}>{desc}</Text>
        <View style={s.energySummaryDivider} />
        <View style={s.energySummaryRow}>
          <View style={[s.energyDot, { backgroundColor: dominantColor }]} />
          <Text style={s.energySummaryMeta}>
            가장 강한 에너지: {ELEMENT_NAMES_KO[dominant[0]] || dominant[0]} ({dominant[1]}%)
          </Text>
        </View>
        <View style={s.energySummaryRow}>
          <View style={[s.energyDot, { backgroundColor: dmColor }]} />
          <Text style={s.energySummaryMeta}>
            음양: {analysis.fourPillars.dayMasterYinYang === '양' ? '陽 (양)' : '陰 (음)'} {'·'} {ELEMENT_NAMES_KO[dmElement] || dmElement}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
}

// ─── 4. Element Balance — Radar Chart ───
function ElementBalanceSection({ analysis }: { analysis: FullSajuAnalysis }) {
  const { fourPillars, tenGods } = analysis;
  const balance = fourPillars.elementBalance;

  // Ten gods distribution
  const allTenGods = [
    tenGods.yearStem, tenGods.monthStem, tenGods.dayStem, tenGods.hourStem,
    tenGods.yearBranch, tenGods.monthBranch, tenGods.dayBranch, tenGods.hourBranch,
  ];
  const tenGodCounts: Record<string, number> = {};
  allTenGods.forEach(tg => {
    tenGodCounts[tg] = (tenGodCounts[tg] || 0) + 1;
  });
  const tenGodEntries = Object.entries(tenGodCounts).sort((a, b) => b[1] - a[1]);

  const ELEMENTS = [
    { key: 'wood', label: '木', ko: '목', color: theme.colors.elements.wood },
    { key: 'fire', label: '火', ko: '화', color: theme.colors.elements.fire },
    { key: 'earth', label: '土', ko: '토', color: theme.colors.elements.earth },
    { key: 'metal', label: '金', ko: '금', color: theme.colors.elements.metal },
    { key: 'water', label: '水', ko: '수', color: theme.colors.elements.water },
  ] as const;

  return (
    <GlassCard style={s.cardSpacing}>
      <SectionHeader title="나의 오행 균형" subtitle="다섯 가지 기운의 밸런스" />

      {/* Radar chart */}
      <ElementRadar balance={balance} />

      {/* 오행별 해석 */}
      <View style={s.tenGodSection}>
        <Text style={s.subSectionTitle}>각 기운이 나에게 미치는 영향</Text>
        {[...Object.entries(balance)].sort(([,a],[,b]) => (b as number) - (a as number)).map(([elKey, val]) => {
          const el = ELEMENTS.find(e => e.key === elKey);
          if (!el) return null;
          const interp = ELEMENT_INTERPRETATIONS[elKey];
          if (!interp) return null;
          const isHigh = val > 25;
          return (
            <View key={elKey} style={s.elementInterpRow}>
              <View style={s.elementInterpHeader}>
                <View style={[s.elementInterpDot, { backgroundColor: el.color }]} />
                <Text style={[s.elementInterpName, { color: el.color }]}>{el.label} {el.ko}</Text>
                <Text style={s.elementInterpPct}>{val}%</Text>
              </View>
              <Text style={s.elementInterpMeaning}>{interp.meaning}</Text>
              <Text style={s.elementInterpDesc}>{isHigh ? interp.strong : interp.weak}</Text>
              <View style={s.elementInterpMeta}>
                <Text style={s.elementInterpMetaLabel}>관련 신체</Text>
                <Text style={s.elementInterpMetaValue}>{interp.body}</Text>
              </View>
              <View style={s.elementInterpMeta}>
                <Text style={s.elementInterpMetaLabel}>보완 색상</Text>
                <Text style={s.elementInterpMetaValue}>{interp.color}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Ten gods distribution */}
      <View style={s.tenGodSection}>
        <Text style={s.subSectionTitle}>나를 둘러싼 관계의 기운</Text>
        <View style={s.tenGodPillsWrap}>
          {tenGodEntries.map(([name, count]) => {
            const pct = Math.round((count / 8) * 100);
            return (
              <View key={name} style={s.tenGodPill}>
                <Text style={s.tenGodPillName}>{name}</Text>
                <View style={s.tenGodPillCountWrap}>
                  <Text style={s.tenGodPillCount}>{count}개</Text>
                  <Text style={s.tenGodPillPct}>{pct}%</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </GlassCard>
  );
}

// ─── 5. Strength Analysis ───
function StrengthSection({ analysis }: { analysis: FullSajuAnalysis }) {
  const { strength } = analysis;
  const indicators = [
    { label: '계절의 힘', desc: '태어난 달이 나를 돕는가', value: strength.deukryeong },
    { label: '뿌리의 힘', desc: '내가 앉은 자리가 든든한가', value: strength.deukji },
    { label: '시간의 힘', desc: '태어난 시가 나를 돕는가', value: strength.deuksi },
    { label: '하늘의 힘', desc: '주변 기운이 나를 돕는가', value: strength.deukse },
  ];

  return (
    <GlassCard style={s.cardSpacing}>
      <SectionHeader title={strength.isStrong ? '자아가 강한 사주' : '조화를 이루는 사주'} />

      <View style={s.strengthGrid}>
        {indicators.map((ind) => (
          <View key={ind.label} style={s.strengthItem}>
            <View style={[s.strengthIcon, ind.value ? s.strengthIconPass : s.strengthIconFail]}>
              <Text style={[s.strengthCheck, { color: ind.value ? theme.colors.success : theme.colors.error }]}>
                {ind.value ? '✓' : '✗'}
              </Text>
            </View>
            <Text style={s.strengthLabel}>{ind.label}</Text>
            <Text style={s.strengthDesc}>{ind.desc}</Text>
          </View>
        ))}
      </View>

      <View style={s.strengthScoreRow}>
        <Text style={s.strengthScoreNumber}>{strength.score}</Text>
        <Text style={s.strengthScoreMax}>/100</Text>
      </View>
      <Text style={s.strengthDescription}>{strength.description}</Text>
      <View style={s.strengthInterpBox}>
        <Text style={s.strengthInterpText}>
          {strength.isStrong ? STRENGTH_MESSAGES.strong : STRENGTH_MESSAGES.weak}
        </Text>
      </View>
    </GlassCard>
  );
}

// ─── 6. Yong Shin (Useful God) ───
function YongShinSection({ analysis }: { analysis: FullSajuAnalysis }) {
  const { yongShin } = analysis;
  const eokbuColor = getElementColor(yongShin.eokbuYongShin);
  const johuColor = getElementColor(yongShin.johuYongShin);
  const giShinColor = getElementColor(yongShin.giShin);

  return (
    <GlassCard style={s.cardSpacing}>
      <SectionHeader title="나에게 필요한 기운" subtitle="부족한 기운을 채우면 운이 열려요" />

      <View style={s.yongShinRow}>
        <View style={s.yongShinItem}>
          <Text style={s.yongShinLabel}>도움이 되는 기운</Text>
          <View style={[s.yongShinCircle, { backgroundColor: eokbuColor + '18', borderColor: eokbuColor + '60' }]}>
            <Text style={[s.yongShinCircleText, { color: eokbuColor }]}>
              {ELEMENT_NAMES_KO[yongShin.eokbuYongShin] || yongShin.eokbuYongShin}
            </Text>
          </View>
        </View>
        <View style={s.yongShinItem}>
          <Text style={s.yongShinLabel}>균형을 맞추는 기운</Text>
          <View style={[s.yongShinCircle, { backgroundColor: johuColor + '18', borderColor: johuColor + '60' }]}>
            <Text style={[s.yongShinCircleText, { color: johuColor }]}>
              {ELEMENT_NAMES_KO[yongShin.johuYongShin] || yongShin.johuYongShin}
            </Text>
          </View>
        </View>
        <View style={s.yongShinItem}>
          <Text style={s.yongShinLabel}>주의할 기운</Text>
          <View style={[s.yongShinCircle, { backgroundColor: giShinColor + '10', borderColor: giShinColor + '30' }]}>
            <Text style={[s.yongShinCircleText, { color: giShinColor + '99' }]}>
              {ELEMENT_NAMES_KO[yongShin.giShin] || yongShin.giShin}
            </Text>
          </View>
        </View>
      </View>

      <Text style={s.yongShinDesc}>{yongShin.description}</Text>
      {YONGSHIN_TIPS[yongShin.eokbuYongShin] && (
        <View style={s.yongShinTipBox}>
          <Text style={s.yongShinTipLabel}>실생활 보완법</Text>
          <Text style={s.yongShinTipText}>{YONGSHIN_TIPS[yongShin.eokbuYongShin]}</Text>
        </View>
      )}
    </GlassCard>
  );
}

// ─── 7. Daeun — Horizontal Scroll ───
function DaeunTimelineSection({ analysis, birthYear }: { analysis: FullSajuAnalysis; birthYear: number }) {
  const { daeun } = analysis;
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthYear;
  const scrollRef = React.useRef<ScrollView>(null);

  // 현재 대운 위치로 초기 스크롤
  React.useEffect(() => {
    const idx = daeun.pillars.findIndex(
      (p: DaeunPillar) => currentAge >= p.startAge && currentAge < p.startAge + 10
    );
    if (idx > 0 && scrollRef.current) {
      setTimeout(() => scrollRef.current?.scrollTo({ x: Math.max(0, idx * 96 - 40), animated: false }), 100);
    }
  }, []);

  return (
    <GlassCard style={s.cardSpacing}>
      <SectionHeader title="인생의 큰 흐름 (대운)" subtitle={daeun.direction === '순행' ? '순행 — 10년마다 새 기운이 열려요' : '역행 — 10년마다 내면이 깊어져요'} />
      <Text style={s.daeunStartInfo}>대운수: {daeun.daeunNumber}세부터 시작</Text>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.daeunScroll}
      >
        {daeun.pillars.map((item: DaeunPillar) => {
          const isCurrent = currentAge >= item.startAge && currentAge < item.startAge + 10;
          const sColor = stemColor(item.stemIdx);

          return (
            <View key={item.startAge} style={[s.daeunCard, isCurrent && s.daeunCardCurrent]}>
              {isCurrent && (
                <View style={s.daeunNowBadge}>
                  <Text style={s.daeunNowText}>현재</Text>
                </View>
              )}
              <Text style={[s.daeunAge, isCurrent && s.daeunAgeCurrent]}>
                {item.startAge}~{item.startAge + 9}세
              </Text>
              <Text style={[s.daeunHanja, { color: sColor }]}>
                {item.stemHanja}{item.branchHanja}
              </Text>
              <Text style={s.daeunKo}>{item.stem}{item.branch}</Text>
              <TermBadge termKey="tenGods" label={item.tenGod}>
                <View style={[s.pillBadge, { backgroundColor: sColor + '15', marginTop: 4 }]}>
                  <Text style={[s.pillBadgeTextSm, { color: sColor }]}>{item.tenGod}</Text>
                </View>
              </TermBadge>
              <TermBadge termKey="lifeStages" label={item.lifeStage}>
                <Text style={s.daeunLS}>{item.lifeStage}</Text>
              </TermBadge>
            </View>
          );
        })}
      </ScrollView>
    </GlassCard>
  );
}

// ─── 8. This Year's Flow (Combined Yearly + Monthly) ───
function ThisYearFlowSection({ analysis }: { analysis: FullSajuAnalysis }) {
  const dmIdx = analysis.fourPillars.day.stemIdx;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const years = useMemo(() => {
    const result: YearlyFortune[] = [];
    for (let y = currentYear - 2; y <= currentYear + 2; y++) {
      result.push(calculateYearlyFortune(dmIdx, y));
    }
    return result;
  }, [dmIdx, currentYear]);

  const months = useMemo(() => {
    return calculateMonthlyFortune(dmIdx, currentYear);
  }, [dmIdx, currentYear]);

  const currentYearData = years.find(y => y.year === currentYear);

  return (
    <GlassCard style={s.cardSpacing}>
      <SectionHeader title={`${currentYear}년, 나의 한 해`} subtitle="올해 어떤 기운이 흐르고 있을까" />

      {/* Current year highlight */}
      {currentYearData && (
        <View style={s.yearHighlight}>
          <View style={s.yearHighlightLeft}>
            <Text style={s.yearHighlightYear}>{currentYearData.year}</Text>
            <Text style={s.yearHighlightZodiac}>{currentYearData.zodiac}띠</Text>
          </View>
          <View style={s.yearHighlightCenter}>
            <Text style={[s.yearHighlightHanja, { color: stemColor(currentYearData.stemIdx) }]}>
              {currentYearData.stemHanja}{currentYearData.branchHanja}
            </Text>
            <Text style={s.yearHighlightKo}>{currentYearData.stem}{currentYearData.branch}</Text>
          </View>
          <View style={s.yearHighlightRight}>
            <TermBadge termKey="tenGods" label={currentYearData.tenGod}>
              <View style={[s.pillBadge, { backgroundColor: stemColor(currentYearData.stemIdx) + '15' }]}>
                <Text style={[s.pillBadgeText, { color: stemColor(currentYearData.stemIdx) }]}>
                  {currentYearData.tenGod}
                </Text>
              </View>
            </TermBadge>
            <TermBadge termKey="lifeStages" label={currentYearData.lifeStage}>
              <Text style={s.yearHighlightLS}>{currentYearData.lifeStage}</Text>
            </TermBadge>
          </View>
        </View>
      )}

      {/* Nearby years — compact row */}
      <View style={s.nearbyYearsRow}>
        {years.filter(y => y.year !== currentYear).map((item) => {
          const sColor = stemColor(item.stemIdx);
          return (
            <View key={item.year} style={s.nearbyYearItem}>
              <Text style={s.nearbyYearNumber}>{item.year}</Text>
              <Text style={[s.nearbyYearHanja, { color: sColor }]}>{item.stemHanja}{item.branchHanja}</Text>
              <TermBadge termKey="tenGods" label={item.tenGod}>
                <View style={[s.pillBadge, { backgroundColor: sColor + '12' }]}>
                  <Text style={[s.pillBadgeTextSm, { color: sColor }]}>{item.tenGod}</Text>
                </View>
              </TermBadge>
            </View>
          );
        })}
      </View>

      {/* Monthly grid */}
      <View style={s.monthSeparator} />
      <Text style={s.monthGridTitle}>달마다 달라지는 기운</Text>
      <View style={s.monthGrid}>
        {months.map((m: MonthlyFortune) => {
          const isCurrent = m.month === currentMonth;
          const sColor = stemColor(m.stemIdx);
          return (
            <View key={m.month} style={[s.monthItem, isCurrent && s.monthItemCurrent]}>
              <Text style={[s.monthLabel, isCurrent && s.monthLabelCurrent]}>{m.month}월</Text>
              <Text style={[s.monthHanja, { color: sColor }]}>{m.stemHanja}{m.branchHanja}</Text>
              <TermBadge termKey="tenGods" label={m.tenGod}>
                <View style={[s.pillBadge, { backgroundColor: sColor + '15' }]}>
                  <Text style={[s.pillBadgeTextSm, { color: sColor }]}>{m.tenGod}</Text>
                </View>
              </TermBadge>
            </View>
          );
        })}
      </View>
    </GlassCard>
  );
}

// ============================================================
// Main Detail Screen
// ============================================================

export default function SajuDetailScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Redirect if no user data
  if (!user) {
    // Use setTimeout to avoid calling router during render
    React.useEffect(() => {
      router.replace('/(auth)/birth-input');
    }, []);
    return null;
  }

  const analysis = useMemo(() => {
    return calculateFullSaju(
      user.birthYear,
      user.birthMonth,
      user.birthDay,
      user.birthHour,
      user.gender,
    );
  }, [user.birthYear, user.birthMonth, user.birthDay, user.birthHour, user.gender]);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Back button + title */}
      <View style={s.header}>
        <BackButton />
        <Text style={s.screenTitle}>나의 만세력</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Day master intro */}
      <View style={s.dayMasterBanner}>
        <Text style={s.dayMasterHanja}>{analysis.fourPillars.dayMaster}</Text>
        <Text style={s.dayMasterInfo}>
          {analysis.fourPillars.dayMasterYinYang === '양' ? '陽' : '陰'} {'·'} {
            ELEMENT_NAMES_KO[analysis.fourPillars.dayMasterElement] || analysis.fourPillars.dayMasterElement
          }
        </Text>
        <Text style={s.dayMasterCaption}>나를 대표하는 기운</Text>
      </View>

      {/* ★ 한 줄 요약 */}
      <Animated.View entering={FadeInDown.duration(500)}>
        <PersonalNarrativeSection analysis={analysis} />
      </Animated.View>

      {/* ── 오행 밸런스 요약 ── */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <GlassCard style={s.quickElementCard}>
          <ElementChart balance={analysis.fourPillars.elementBalance} noCard />
        </GlassCard>
      </Animated.View>

      {/* ── 사주팔자 한눈에 ── */}
      <LazySection delay={0}>
        <FourPillarsCardSection analysis={analysis} />
      </LazySection>

      {/* ── 전통 만세력 명식표 ── */}
      <LazySection delay={50}>
        <ManseryeokTableSection analysis={analysis} />
      </LazySection>

      {/* ── 기둥 간 관계 ── */}
      <LazySection delay={50}>
        <PillarInteractionSection analysis={analysis} />
      </LazySection>

      {/* ── 오행 균형 ── */}
      <LazySection delay={50}>
        <ElementBalanceSection analysis={analysis} />
      </LazySection>

      {/* ── 신강/신약 ── */}
      <LazySection delay={50}>
        <StrengthSection analysis={analysis} />
      </LazySection>

      {/* ── 나에게 필요한 기운 ── */}
      <LazySection delay={100}>
        <YongShinSection analysis={analysis} />
      </LazySection>

      {/* ── 나에게 맞는 것들 ── */}
      <LazySection delay={100}>
        <MyGuideSection analysis={analysis} />
      </LazySection>

      {/* ★ 사주풀이 CTA */}
      <LazySection delay={100}>
        <GlassCard style={s.ctaCard}>
          <View style={s.ctaDeco}>
            <View style={s.ctaDecoLine} />
            <Text style={s.ctaDecoChar}>命</Text>
            <View style={s.ctaDecoLine} />
          </View>
          <Text style={s.ctaTitle}>여기까지는 만세력 기본 정보예요</Text>
          <Text style={s.ctaSub}>
            나만의 사주를 명리학으로 깊이 풀어드려요{'\n'}
            성격, 적성, 연애운, 재물운까지 상세 풀이
          </Text>
          <TouchableOpacity
            style={s.ctaButton}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/saju' as any)}
          >
            <Text style={s.ctaButtonText}>내 사주 상세 풀이 받기</Text>
          </TouchableOpacity>
        </GlassCard>
      </LazySection>

      {/* ── 오늘의 기운 ── */}
      <LazySection delay={100}>
        <TodaySajuSection analysis={analysis} />
      </LazySection>

      {/* ── 인생의 큰 흐름 ── */}
      <LazySection delay={150}>
        <DaeunTimelineSection analysis={analysis} birthYear={user.birthYear} />
      </LazySection>

      {/* ── 올해 흐름 ── */}
      <LazySection delay={150}>
        <ThisYearFlowSection analysis={analysis} />
      </LazySection>

      {/* Disclaimer */}
      <Text style={s.disclaimer}>
        본 분석은 전통 사주 명리학을 기반으로 한 참고 자료이며,{'\n'}
        중요한 결정의 유일한 근거로 사용하지 마시기 바랍니다.
      </Text>
    </ScrollView>
  );
}

// ============================================================
// Styles
// ============================================================

const s = StyleSheet.create({
  // ─── Layout ───
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: theme.spacing.screenPadding,
    paddingTop: 56,
    paddingBottom: 120,
  },
  quickElementCard: {
    marginBottom: theme.spacing.sectionGap,
    padding: 20,
  },
  cardSpacing: {
    marginBottom: theme.spacing.sectionGap,
  },

  // ─── Header ───
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  screenTitle: {
    ...theme.typo.screenTitle,
    textAlign: 'center',
  },

  // ─── Day Master Banner ───
  dayMasterBanner: {
    alignItems: 'center',
    marginBottom: theme.spacing.sectionGap,
  },
  dayMasterHanja: {
    fontSize: 56,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    letterSpacing: 2,
  },
  dayMasterInfo: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xs,
    letterSpacing: 1,
  },
  dayMasterCaption: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
    marginTop: theme.spacing.xs,
  },

  // ─── Section Header ───
  sectionHeader: {
    marginBottom: theme.spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typo.sectionTitle,
    color: theme.colors.gold.dark,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginTop: 4,
    letterSpacing: 0.5,
    lineHeight: 18,
  },

  // ─── Pill Badge (universal) ───
  pillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  pillBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  pillBadgeTextSm: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // ─── 1. Today's Saju ───
  todayRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  todayPillar: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
  },
  todayHanja: {
    fontSize: 32,
    fontWeight: '700',
  },
  todayHanjaSub: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 2,
  },
  todayInfo: {
    flex: 1,
  },
  todayBadgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  todayDesc: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    letterSpacing: 0.3,
  },

  // ─── 2. Four Pillars — Card Stack ───
  pillarHelpRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glass.border,
  },
  pillarHelpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pillarHelpLabel: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
  },
  pillarCardsRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  pillarCard: {
    flex: 1,
    position: 'relative' as const,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    minHeight: 260,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    backgroundColor: '#FFFFFF',
  },
  pillarCardDay: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: theme.colors.gold.light + '40',
    ...Platform.select({
      web: { boxShadow: `0px 4px 12px ${theme.colors.gold.muted}30` },
      default: {
        shadowColor: theme.colors.gold.muted,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 4,
      },
    }),
    transform: [{ scale: 1.02 }],
  },
  pillarWatermark: {
    position: 'absolute' as const,
    bottom: 6,
    right: 2,
    fontSize: 64,
    fontWeight: '900',
  },
  pillarCardInner: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  pillarRow: {
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillarHanjaRow: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillarMetaRow: {
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillarLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  pillarLabelDay: {
    color: theme.colors.gold.primary,
  },
  pillarStemHanja: {
    fontSize: 22,
    fontWeight: '700',
  },
  pillarBranchHanja: {
    fontSize: 22,
    fontWeight: '700',
  },
  pillarHanjaDay: {
    fontSize: 26,
  },
  pillarKoSmall: {
    fontSize: 9,
  },
  pillarDivider: {
    width: 20,
    height: 1,
    backgroundColor: theme.colors.glass.border,
    marginVertical: 2,
  },
  pillarBadgesCol: {
    height: 52,
    gap: 3,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarMeta: {
    fontSize: 9,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  pillarLifeStage: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },

  // ─── 3. Energy Summary ───
  energySummaryCard: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  energySummaryAccent: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  energySummaryHanja: {
    fontSize: 28,
    fontWeight: '700',
  },
  energySummaryDesc: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.sm,
    letterSpacing: 0.3,
  },
  energySummaryDivider: {
    width: 40,
    height: 1,
    backgroundColor: theme.colors.border.divider,
    marginVertical: 12,
  },
  energySummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  energyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  energySummaryMeta: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },

  // ─── 4. Element Balance ───
  elementCircleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  elementCircleItem: {
    alignItems: 'center',
    gap: 4,
  },
  elementCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  elementCircleHanja: {
    fontWeight: '700',
  },
  elementCircleKo: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
  },
  elementCirclePct: {
    fontSize: 13,
    fontWeight: '700',
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  // ─── Element interpretation rows ───
  elementInterpRow: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glass.border,
  },
  elementInterpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  elementInterpDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  elementInterpName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  elementInterpPct: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  elementInterpMeaning: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  elementInterpDesc: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  elementInterpMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  elementInterpMetaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.gold.primary,
    width: 60,
  },
  elementInterpMetaValue: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    flex: 1,
  },

  tenGodSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.glass.border,
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  tenGodPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tenGodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  tenGodPillName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  tenGodPillCountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tenGodPillCount: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.gold.primary,
  },
  tenGodPillPct: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
  },

  // ─── 5. Strength ───
  strengthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  strengthItem: {
    width: '48%' as unknown as number,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  strengthIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  strengthIconPass: {
    backgroundColor: theme.colors.success + '15',
  },
  strengthIconFail: {
    backgroundColor: theme.colors.error + '15',
  },
  strengthCheck: {
    fontSize: 16,
    fontWeight: '700',
  },
  strengthLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  strengthDesc: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  strengthScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  strengthScoreNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.gold.primary,
  },
  strengthScoreMax: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
    marginLeft: 2,
  },
  strengthDescription: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  strengthInterpBox: {
    marginTop: theme.spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: 20,
  },
  strengthInterpText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    letterSpacing: 0.3,
  },

  // ─── 6. Yong Shin ───
  yongShinRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
  },
  yongShinItem: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  yongShinLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  yongShinCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yongShinCircleText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  yongShinDesc: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  yongShinTipBox: {
    marginTop: theme.spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: 20,
  },
  yongShinTipLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  yongShinTipText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    letterSpacing: 0.3,
  },

  // ─── 7. Daeun — Horizontal Scroll ───
  daeunStartInfo: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.md,
  },
  daeunScroll: {
    gap: 8,
    paddingRight: 16,
  },
  daeunCard: {
    width: 88,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    gap: 3,
  },
  daeunCardCurrent: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: theme.colors.gold.light + '40',
  },
  daeunNowBadge: {
    backgroundColor: theme.colors.gold.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    marginBottom: 2,
  },
  daeunNowText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.text.inverse,
  },
  daeunAge: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  daeunAgeCurrent: {
    color: theme.colors.gold.primary,
    fontWeight: '700',
  },
  daeunHanja: {
    fontSize: 22,
    fontWeight: '700',
    marginVertical: 2,
  },
  daeunKo: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
  },
  daeunLS: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },

  // ─── 8. This Year's Flow ───
  yearHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.gold.primary + '08',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  yearHighlightLeft: {
    alignItems: 'center',
  },
  yearHighlightYear: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.gold.primary,
  },
  yearHighlightZodiac: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  yearHighlightCenter: {
    alignItems: 'center',
  },
  yearHighlightHanja: {
    fontSize: 28,
    fontWeight: '700',
  },
  yearHighlightKo: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  yearHighlightRight: {
    alignItems: 'center',
    gap: 4,
  },
  yearHighlightLS: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
  nearbyYearsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  nearbyYearItem: {
    alignItems: 'center',
    gap: 3,
  },
  nearbyYearNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  nearbyYearHanja: {
    fontSize: 16,
    fontWeight: '700',
  },
  monthSeparator: {
    height: 1,
    backgroundColor: theme.colors.border.divider,
    marginVertical: 20,
  },
  monthGridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  monthItem: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    gap: 3,
  },
  monthItemCurrent: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: theme.colors.gold.light + '40',
  },
  monthLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  monthLabelCurrent: {
    color: theme.colors.gold.primary,
    fontWeight: '700',
  },
  monthHanja: {
    fontSize: 16,
    fontWeight: '700',
  },

  // ─── ★ Narrative ───
  narrativeWrap: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  narrativeTitle: {
    fontSize: 17,
    fontWeight: '300',
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: 1,
  },
  narrativeDivider: {
    width: 32,
    height: 1,
    backgroundColor: theme.colors.gold.light,
    opacity: 0.4,
    marginVertical: 16,
  },
  narrativeAdvice: {
    fontSize: 13,
    color: theme.colors.gold.dark,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
    letterSpacing: 0.5,
  },

  // ─── ★ Interactions ───
  interactionList: {
    gap: 10,
  },
  interactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,168,75,0.08)',
  },
  interactionBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interactionHap: {
    backgroundColor: 'rgba(45,122,95,0.12)',
  },
  interactionChung: {
    backgroundColor: 'rgba(196,80,61,0.12)',
  },
  interactionBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  interactionHapText: {
    color: theme.colors.success,
  },
  interactionChungText: {
    color: theme.colors.error,
  },
  interactionTextWrap: {
    flex: 1,
  },
  interactionPillars: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  interactionDesc: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  interactionFooter: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    lineHeight: 18,
    marginTop: 14,
    textAlign: 'center',
  },

  // ─── ★ Guide ───
  guideGrid: {
    gap: 0,
  },
  guideItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,168,75,0.08)',
  },
  guideItemLast: {
    borderBottomWidth: 0,
  },
  guideLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  guideValue: {
    fontSize: 13,
    color: theme.colors.text.primary,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },

  // ─── CTA ───
  ctaCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginBottom: theme.spacing.sectionGap,
  },
  ctaDeco: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  ctaDecoLine: {
    width: 24,
    height: 1,
    backgroundColor: theme.colors.gold.light,
    opacity: 0.4,
  },
  ctaDecoChar: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    letterSpacing: 2,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  ctaSub: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  ctaButton: {
    backgroundColor: theme.colors.gold.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: theme.radius.md,
    ...Platform.select({
      web: { boxShadow: `0px 4px 12px ${theme.colors.gold.muted}50` },
      default: {
        shadowColor: theme.colors.gold.muted,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  } as any,
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // ─── Disclaimer ───
  disclaimer: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: theme.spacing.xl,
  },
});

// ─── 전통 만세력 명식표 스타일 ───
const s2 = StyleSheet.create({
  tableContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.divider,
  },
  tableRowLabel: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 7,
    backgroundColor: '#F5F5F5' + '80',
    borderRightWidth: 1,
    borderRightColor: theme.colors.border.divider,
  },
  tableRowLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
  },
  tableCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRightWidth: 1,
    borderRightColor: 'rgba(212,168,75,0.08)',
  },
  tableCellDay: {
    backgroundColor: theme.colors.gold.primary + '06',
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  tableHeaderTextDay: {
    color: theme.colors.gold.primary,
    fontWeight: '700',
  },
  tableTenGodText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tableStemCell: {
    alignItems: 'center',
    gap: 1,
  },
  tableHanjaLarge: {
    fontSize: 24,
    fontWeight: '700',
  },
  tableKoSmall: {
    fontSize: 10,
    fontWeight: '500',
  },
  tableHiddenRow: {
    flexDirection: 'row',
    gap: 2,
  },
  tableHiddenText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tableMetaText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  // 공망 표시
  gongmangDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.error,
  },
  gongmangRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,168,75,0.10)',
    gap: 10,
  },
  gongmangLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
  },
  gongmangValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  gongmangHanja: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  gongmangText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  gongmangInPillars: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 4,
  },
  gongmangPillarBadge: {
    backgroundColor: theme.colors.error + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gongmangPillarText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.error,
  },
  gongmangNote: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    lineHeight: 18,
    marginTop: 8,
  },
});
