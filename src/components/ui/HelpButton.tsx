import React, { useState } from 'react';
import {
  Pressable,
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../../constants/theme';

// ─── 사주 용어 사전 ───
const SAJU_GLOSSARY: Record<string, { title: string; short: string; detail: string }> = {
  // 기본 구조
  fourPillars: {
    title: '사주팔자 (四柱八字)',
    short: '태어난 년·월·일·시를 4개의 기둥으로 나타낸 것',
    detail:
      '사주(四柱)는 4개의 기둥, 팔자(八字)는 8개의 글자를 뜻합니다. ' +
      '태어난 년·월·일·시 각각에 천간(天干)과 지지(地支) 한 글자씩을 배당하여 ' +
      '총 8글자로 한 사람의 운명 에너지를 표현합니다.\n\n' +
      '• 년주 = 조상, 유년기\n• 월주 = 부모, 청년기\n• 일주 = 나 자신, 중년기\n• 시주 = 자녀, 말년기',
  },
  dayMaster: {
    title: '일간 (日干)',
    short: '나를 대표하는 천간 — 사주의 핵심',
    detail:
      '일간은 일주(日柱)의 천간(위쪽 글자)으로, 사주에서 "나 자신"을 뜻합니다. ' +
      '모든 분석은 일간을 중심으로 이루어집니다.\n\n' +
      '예를 들어 일간이 丁(정화)이면, 나의 본질적 에너지는 "음의 불꽃"입니다. ' +
      '촛불처럼 따뜻하고 섬세한 성격을 의미합니다.',
  },
  // 오행
  fiveElements: {
    title: '오행 (五行)',
    short: '만물을 구성하는 5가지 에너지: 목·화·토·금·수',
    detail:
      '목(木) = 나무, 성장, 봄\n' +
      '화(火) = 불, 확산, 여름\n' +
      '토(土) = 흙, 중심, 환절기\n' +
      '금(金) = 쇠, 수렴, 가을\n' +
      '수(水) = 물, 저장, 겨울\n\n' +
      '상생(相生): 목→화→토→금→수→목 (서로 도움)\n' +
      '상극(相剋): 목→토→수→화→금→목 (서로 견제)\n\n' +
      '오행 비율이 균형 잡히면 좋고, 한쪽이 과하거나 부족하면 불균형입니다.',
  },
  elementBalance: {
    title: '오행 밸런스',
    short: '사주팔자 8글자에서 각 오행이 차지하는 비율',
    detail:
      '천간 4개 + 지지 4개 = 총 8자에서 각 오행의 비율을 계산합니다.\n\n' +
      '• 과다(37%+): 에너지가 넘쳐 제어 필요\n' +
      '• 발달(25%): 충분히 갖춰진 상태\n' +
      '• 적정(12.5%): 균형 잡힌 상태\n' +
      '• 부족(0%): 보완이 필요한 에너지',
  },
  // 십성
  tenGods: {
    title: '십성 (十星)',
    short: '일간과 다른 글자의 관계를 10가지로 분류',
    detail:
      '일간(나)을 기준으로 다른 7개 글자가 나와 어떤 관계인지 나타냅니다.\n\n' +
      '• 비견/겁재: 나와 같은 오행 → 형제, 경쟁자\n' +
      '• 식신/상관: 내가 생하는 오행 → 재능, 표현력\n' +
      '• 편재/정재: 내가 극하는 오행 → 재물, 아버지\n' +
      '• 편관/정관: 나를 극하는 오행 → 직장, 규율\n' +
      '• 편인/정인: 나를 생하는 오행 → 학문, 어머니\n\n' +
      '편(偏) = 같은 음양, 정(正) = 다른 음양',
  },
  // 12운성
  lifeStages: {
    title: '12운성 (十二運星)',
    short: '일간의 에너지가 각 지지에서 얼마나 강한지',
    detail:
      '사람의 일생처럼 에너지가 탄생 → 성장 → 절정 → 쇠퇴 → 소멸 → 재생하는 12단계입니다.\n\n' +
      '🟢 강한 운성:\n' +
      '  장생 = 탄생, 새로운 시작\n' +
      '  관대 = 성인, 사회 진출\n' +
      '  건록 = 독립, 안정\n' +
      '  제왕 = 절정, 최고의 힘\n\n' +
      '🟡 전환기:\n' +
      '  목욕 = 변화, 불안정\n' +
      '  쇠 = 하강, 원숙\n\n' +
      '🔴 약한 운성:\n' +
      '  병 = 쇠약, 내면 성장\n' +
      '  사 = 마무리, 정리\n' +
      '  묘 = 잠복, 숨은 힘\n\n' +
      '⚪ 재생기:\n' +
      '  절 = 소멸 직전\n' +
      '  태 = 잉태, 새 기운\n' +
      '  양 = 성장 준비',
  },
  // 12신살
  spiritStars: {
    title: '12신살 (十二神煞)',
    short: '각 기둥에 작용하는 운명의 특수 에너지',
    detail:
      '일지(나의 지지)를 기준으로 다른 기둥에 어떤 특수 에너지가 작용하는지 나타냅니다.\n\n' +
      '• 겁살: 급변, 돌발 상황\n' +
      '• 재살: 자연재해, 예기치 못한 손실\n' +
      '• 천살: 하늘의 시련, 천재지변\n' +
      '• 지살: 땅의 장애, 이동 곤란\n' +
      '• 역마살: 이동, 여행, 변동이 많음\n' +
      '• 화개살: 예술성, 종교성, 고독\n' +
      '• 도화살: 매력, 이성 인기\n\n' +
      '신살은 좋고 나쁨이 아니라, 어떤 에너지가 작용하는지를 알려줍니다.',
  },
  // 지장간
  hiddenStems: {
    title: '지장간 (地藏干)',
    short: '지지 안에 숨어있는 천간들',
    detail:
      '각 지지(地支) 안에는 1~3개의 천간이 숨어있습니다.\n\n' +
      '예: 未(미) 안에는 丁(화) + 乙(목) + 己(토)가 숨어 있습니다.\n\n' +
      '• 본기(本氣): 가장 강한 에너지 (60~100%)\n' +
      '• 중기(中氣): 중간 에너지\n' +
      '• 여기(餘氣): 약한 에너지\n\n' +
      '지장간을 통해 겉으로 보이지 않는 숨겨진 성향과 잠재력을 파악합니다.',
  },
  // 신강/신약
  strength: {
    title: '신강/신약 (身強/身弱)',
    short: '일간(나)의 에너지가 강한지 약한지',
    detail:
      '4가지 기준으로 일간의 강약을 판단합니다:\n\n' +
      '• 득령(得令): 태어난 계절이 일간을 돕는가?\n' +
      '• 득지(得地): 일지에 일간과 같은 오행이 있는가?\n' +
      '• 득시(得時): 태어난 시간이 일간을 돕는가?\n' +
      '• 득세(得勢): 다른 천간들이 일간을 돕는가?\n\n' +
      '신강 = 에너지 과잉 → 발산·통제가 필요\n' +
      '신약 = 에너지 부족 → 보충·지원이 필요\n\n' +
      '신강이 좋고 신약이 나쁜 것이 아닙니다. 균형이 중요합니다.',
  },
  // 용신
  yongShin: {
    title: '용신 (用神)',
    short: '사주의 균형을 맞춰주는 핵심 오행',
    detail:
      '용신은 사주에서 가장 필요한 오행으로, 운세 해석의 핵심입니다.\n\n' +
      '• 억부용신: 신강이면 약하게, 신약이면 강하게 만드는 오행\n' +
      '• 조후용신: 계절적 균형을 맞추는 오행\n' +
      '  - 여름생 → 수(水) 필요\n' +
      '  - 겨울생 → 화(火) 필요\n\n' +
      '• 기신(忌神): 용신의 반대, 피해야 할 오행\n\n' +
      '용신에 해당하는 대운이 올 때 좋은 시기가 됩니다.',
  },
  // 대운
  daeun: {
    title: '대운 (大運)',
    short: '10년 단위로 바뀌는 인생의 큰 운세 흐름',
    detail:
      '대운은 10년마다 바뀌는 큰 운세의 흐름입니다.\n\n' +
      '• 대운수: 첫 대운이 시작되는 나이 (사람마다 다름)\n' +
      '• 순행/역행: 남녀·년간 음양에 따라 방향이 결정\n' +
      '• 각 대운은 새로운 간지(천간+지지)가 배정됨\n\n' +
      '대운의 간지가 나의 용신과 같은 오행이면 좋은 10년,\n' +
      '기신과 같으면 주의가 필요한 10년입니다.\n\n' +
      '⚠️ "대운수 7세"는 7살부터 운이 좋다는 뜻이 아니라,\n' +
      '첫 번째 10년 사이클이 7살에 시작된다는 뜻입니다.',
  },
  // 연운
  yearlyFortune: {
    title: '연운 (年運)',
    short: '매년 바뀌는 1년 단위 운세',
    detail:
      '매년 달라지는 년주(간지)가 나의 일간과 어떤 관계인지 보여줍니다.\n\n' +
      '대운(10년) 안에서 세부적으로 매년의 운세를 분석합니다.\n' +
      '대운이 좋은 시기에 연운도 좋으면 최고의 해가 됩니다.',
  },
  // 월운
  monthlyFortune: {
    title: '월운 (月運)',
    short: '매달 바뀌는 운세',
    detail:
      '매달의 월주가 나의 일간과 어떤 관계인지 보여줍니다.\n' +
      '대운 > 연운 > 월운 순으로 영향력이 줄어듭니다.\n' +
      '월운은 단기적인 타이밍을 잡는 데 활용합니다.',
  },
};

// ─── 컴포넌트 ───

interface HelpButtonProps {
  termKey: keyof typeof SAJU_GLOSSARY;
  size?: number;
  color?: string;
}

export function HelpButton({ termKey, size = 18, color = theme.colors.text.tertiary }: HelpButtonProps) {
  const [visible, setVisible] = useState(false);
  const term = SAJU_GLOSSARY[termKey];

  if (!term) return null;

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        hitSlop={8}
        style={[styles.btn, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <Text style={[styles.btnText, { fontSize: size * 0.65, color }]}>?</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.title}>{term.title}</Text>
              <TouchableOpacity onPress={() => setVisible(false)} hitSlop={12}>
                <Text style={styles.close}>X</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.short}>{term.short}</Text>

            <View style={styles.divider} />

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.detail}>{term.detail}</Text>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ─── 스타일 ───

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1.5,
    borderColor: theme.colors.text.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  btnText: {
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: theme.colors.bg.primary,
    borderRadius: theme.radius.xl,
    padding: 24,
    width: '100%',
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    flex: 1,
  },
  close: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    padding: 4,
  },
  short: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    lineHeight: 20,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.glass.border,
    marginBottom: 12,
  },
  scroll: {
    maxHeight: 350,
  },
  detail: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
});

export { SAJU_GLOSSARY };
