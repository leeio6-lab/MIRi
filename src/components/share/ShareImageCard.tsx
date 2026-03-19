import React, { forwardRef } from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';

// ─── 공유 데이터 타입 ───

export type ShareData =
  | SajuShareData
  | FaceShareData
  | CompatShareData;

export interface SajuShareData {
  type: 'saju';
  score: number;
  headline: string;
  dayMaster: string;
  nature: string;
  items: { k: string; v: string }[];
  lucky?: string;
}

export interface FaceShareData {
  type: 'face';
  score: number;
  tag: string;
  hookLine: string;
  celebrity?: string;
  radar?: { label: string; kanji: string; value: number }[];
  portraitBase64?: string;
}

export interface CompatShareData {
  type: 'compatibility';
  score: number;
  name1: string;
  name2: string;
  verdict: string;
  verdictSub: string;
  summary: string;
  best: { name: string; score: number };
  worst: { name: string; score: number };
}

// ─── 상수 ───

const W = 380;
const BG = '#1C1C1E';
const GOLD = '#E8B04A';
const GOLD_DIM = 'rgba(232,176,74,0.15)';
const GOLD_LINE = 'rgba(232,176,74,0.20)';
const T1 = '#F2EDE3';
const T2 = '#C4B99A';
const T3 = '#8A7E68';

const TYPE_META = {
  saju: { hanja: '命', label: '사주 분석', cta: '나도 사주 보러가기' },
  face: { hanja: '相', label: '관상 분석', cta: '나도 관상 보러가기' },
  compatibility: { hanja: '緣', label: '궁합 분석', cta: '나도 궁합 보러가기' },
};

// ─── 컴포넌트 ───

export const ShareImageCard = forwardRef<View, { data: ShareData }>(({ data }, ref) => {
  const meta = TYPE_META[data.type];

  return (
    <View ref={ref} style={s.card} collapsable={false}>
      {/* ═══ HEADER ═══ */}
      <View style={s.header}>
        <Text style={s.logo}>명리</Text>
        <View style={s.badge}>
          <Text style={s.badgeHanja}>{meta.hanja}</Text>
          <Text style={s.badgeLabel}>{meta.label}</Text>
        </View>
      </View>

      <View style={s.divider} />

      {/* ═══ BODY ═══ */}
      {data.type === 'saju' && <SajuBody data={data} />}
      {data.type === 'face' && <FaceBody data={data} />}
      {data.type === 'compatibility' && <CompatBody data={data} />}

      <View style={s.divider} />

      {/* ═══ FOOTER ═══ */}
      <View style={s.footer}>
        <Text style={s.footerCta}>{meta.cta}</Text>
        <Text style={s.footerUrl}>myeongri.app</Text>
      </View>
    </View>
  );
});

// ─── 사주 ───

function SajuBody({ data }: { data: SajuShareData }) {
  return (
    <View style={s.body}>
      {/* 일주 */}
      <Text style={s.dayMaster}>{data.dayMaster}</Text>
      <Text style={s.nature}>{data.nature}</Text>

      {/* 점수 */}
      <View style={s.scoreRow}>
        <Text style={s.scoreNum}>{data.score}</Text>
        <Text style={s.scoreUnit}>점</Text>
      </View>

      {/* 헤드라인 */}
      {data.headline ? <Text style={s.headline} numberOfLines={2}>{data.headline}</Text> : null}

      {/* 운명 요약 */}
      <View style={s.itemsDivider}>
        <View style={s.itemsDividerLine} />
        <Text style={s.itemsDividerText}>운명 요약</Text>
        <View style={s.itemsDividerLine} />
      </View>

      {data.items.map((item, i) => (
        <View key={i} style={s.itemRow}>
          <Text style={s.itemKanji}>{item.k}</Text>
          <Text style={s.itemValue} numberOfLines={2}>{item.v}</Text>
        </View>
      ))}

      {/* 행운 */}
      {data.lucky && (
        <View style={s.luckyRow}>
          <Text style={s.luckyText}>{data.lucky}</Text>
        </View>
      )}
    </View>
  );
}

// ─── 궁합 ───

function CompatBody({ data }: { data: CompatShareData }) {
  return (
    <View style={s.body}>
      {/* 이름 */}
      <View style={s.namesRow}>
        <Text style={s.nameText}>{data.name1}</Text>
        <Text style={s.nameX}>{'\u00D7'}</Text>
        <Text style={s.nameText}>{data.name2}</Text>
      </View>

      {/* 점수 + 판정 */}
      <View style={s.scoreRow}>
        <Text style={s.scoreNum}>{data.score}</Text>
        <Text style={s.scoreUnit}>점</Text>
      </View>
      <Text style={s.verdict}>{data.verdict}</Text>
      <Text style={s.verdictSub}>{data.verdictSub}</Text>

      {/* 요약 */}
      <Text style={s.compatSummary} numberOfLines={3}>{data.summary}</Text>

      {/* 강점/약점 */}
      <View style={s.itemsDivider}>
        <View style={s.itemsDividerLine} />
        <Text style={s.itemsDividerText}>궁합 포인트</Text>
        <View style={s.itemsDividerLine} />
      </View>

      <View style={s.extremeRow}>
        <View style={s.extremeCard}>
          <Text style={[s.extremeLabel, { color: '#2D7A5F' }]}>强</Text>
          <Text style={s.extremeName}>{data.best.name}</Text>
          <Text style={[s.extremeScore, { color: '#2D7A5F' }]}>{data.best.score}</Text>
        </View>
        <View style={s.extremeCard}>
          <Text style={[s.extremeLabel, { color: '#B85450' }]}>弱</Text>
          <Text style={s.extremeName}>{data.worst.name}</Text>
          <Text style={[s.extremeScore, { color: '#B85450' }]}>{data.worst.score}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── 관상 ───

function FaceBody({ data }: { data: FaceShareData }) {
  return (
    <View style={s.body}>
      {/* 초상화 */}
      {data.portraitBase64 && (
        <View style={s.portraitWrap}>
          <Image
            source={{ uri: `data:image/png;base64,${data.portraitBase64}` }}
            style={s.portrait}
          />
        </View>
      )}

      {/* 태그 + 점수 */}
      <View style={s.faceTagRow}>
        <View style={s.faceTag}>
          <Text style={s.faceTagText}>{data.tag}</Text>
        </View>
      </View>
      <View style={s.scoreRow}>
        <Text style={s.scoreNum}>{data.score}</Text>
        <Text style={s.scoreUnit}>점</Text>
      </View>

      {/* 한 줄 */}
      <Text style={s.hookLine} numberOfLines={2}>{data.hookLine}</Text>

      {/* 레이더 */}
      {data.radar && data.radar.length > 0 && (
        <>
          <View style={s.itemsDivider}>
            <View style={s.itemsDividerLine} />
            <Text style={s.itemsDividerText}>운세 레이더</Text>
            <View style={s.itemsDividerLine} />
          </View>
          {data.radar.map((r, i) => (
            <View key={i} style={s.radarRow}>
              <Text style={s.radarKanji}>{r.kanji}</Text>
              <Text style={s.radarLabel}>{r.label}</Text>
              <View style={s.radarBarBg}>
                <View style={[s.radarBarFill, { width: `${r.value}%` }]} />
              </View>
              <Text style={s.radarScore}>{r.value}</Text>
            </View>
          ))}
        </>
      )}

      {/* 유명인 */}
      {data.celebrity && (
        <Text style={s.celebrity} numberOfLines={2}>{data.celebrity}</Text>
      )}
    </View>
  );
}

// ─── 스타일 ───

const s = StyleSheet.create({
  card: {
    width: W,
    backgroundColor: BG,
    borderRadius: 20,
    padding: 28,
    ...(Platform.OS === 'web'
      ? {}
      : { shadowColor: '#B8A070', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24 }),
  } as any,

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: 22,
    fontWeight: '200',
    color: GOLD,
    letterSpacing: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GOLD_DIM,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  badgeHanja: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 1,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: T2,
    letterSpacing: 1,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: GOLD_LINE,
    marginVertical: 20,
  },

  // Body
  body: {
    alignItems: 'center' as const,
  },

  // Score (shared)
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 6,
  },
  scoreNum: {
    fontSize: 52,
    fontWeight: '300',
    color: GOLD,
    letterSpacing: -2,
  },
  scoreUnit: {
    fontSize: 16,
    fontWeight: '400',
    color: T3,
    marginLeft: 4,
  },

  // Items divider
  itemsDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  itemsDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: GOLD_LINE,
  },
  itemsDividerText: {
    fontSize: 10,
    fontWeight: '600',
    color: T3,
    letterSpacing: 3,
  },

  // ── Saju ──
  dayMaster: {
    fontSize: 20,
    fontWeight: '700',
    color: T1,
    letterSpacing: 3,
    marginBottom: 4,
  },
  nature: {
    fontSize: 13,
    fontWeight: '400',
    color: T2,
    letterSpacing: 2,
    marginBottom: 16,
  },
  headline: {
    fontSize: 14,
    fontWeight: '500',
    color: T2,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    paddingVertical: 8,
    gap: 12,
  },
  itemKanji: {
    fontSize: 15,
    fontWeight: '700',
    color: GOLD,
    width: 22,
    textAlign: 'center',
    letterSpacing: 1,
  },
  itemValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: T2,
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  luckyRow: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: GOLD_DIM,
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  luckyText: {
    fontSize: 12,
    fontWeight: '500',
    color: GOLD,
    textAlign: 'center',
    letterSpacing: 1,
  },

  // ── Compatibility ──
  namesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '600',
    color: T1,
    letterSpacing: 2,
  },
  nameX: {
    fontSize: 18,
    fontWeight: '300',
    color: T3,
  },
  verdict: {
    fontSize: 22,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 3,
    marginBottom: 4,
  },
  verdictSub: {
    fontSize: 12,
    fontWeight: '400',
    color: T3,
    letterSpacing: 1,
    marginBottom: 12,
  },
  compatSummary: {
    fontSize: 13,
    fontWeight: '400',
    color: T2,
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  extremeRow: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'stretch',
  },
  extremeCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  extremeLabel: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  extremeName: {
    fontSize: 12,
    fontWeight: '500',
    color: T2,
    letterSpacing: 1,
  },
  extremeScore: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -1,
  },

  // ── Face ──
  portraitWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  portrait: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  faceTagRow: {
    marginBottom: 8,
  },
  faceTag: {
    backgroundColor: GOLD_DIM,
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 12,
  },
  faceTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 2,
  },
  hookLine: {
    fontSize: 13,
    fontWeight: '400',
    color: T2,
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  radarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 8,
    marginBottom: 8,
  },
  radarKanji: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD,
    width: 16,
    textAlign: 'center',
  },
  radarLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: T3,
    width: 36,
    letterSpacing: 0.5,
  },
  radarBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  radarBarFill: {
    height: '100%',
    backgroundColor: GOLD,
    borderRadius: 3,
  },
  radarScore: {
    fontSize: 13,
    fontWeight: '600',
    color: T2,
    width: 28,
    textAlign: 'right',
    letterSpacing: -0.5,
  },
  celebrity: {
    fontSize: 12,
    fontWeight: '400',
    color: T3,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 12,
    letterSpacing: 0.3,
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: 4,
  },
  footerCta: {
    fontSize: 13,
    fontWeight: '600',
    color: T2,
    letterSpacing: 1,
  },
  footerUrl: {
    fontSize: 11,
    fontWeight: '400',
    color: T3,
    letterSpacing: 2,
  },
});
