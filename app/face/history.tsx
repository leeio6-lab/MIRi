import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { BackButton } from '../../src/components/ui/BackButton';
import { useFortuneStore } from '../../src/stores/fortuneStore';
import { api } from '../../src/services/api';
import type { AnalysisRecord } from '../../src/services/api';

// ─── 타입별 한자 + 라벨 ───
const TYPE_META: Record<string, { hanja: string; label: string }> = {
  saju: { hanja: '命', label: '사주' },
  face: { hanja: '相', label: '관상' },
  compatibility: { hanja: '緣', label: '궁합' },
};

function getScore(record: AnalysisRecord): number | null {
  const r = record.result as any;
  return typeof r?.overallScore === 'number' ? r.overallScore : null;
}

function getSummary(record: AnalysisRecord): string {
  const r = record.result as any;
  return r?.headline ?? r?.shareTitle ?? (typeof r?.summary === 'string' ? r.summary : '') ?? '';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((today.getTime() - target.getTime()) / 86400000);
  if (diff === 0) return '오늘';
  if (diff === 1) return '어제';
  if (diff <= 7) return `${diff}일 전`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// ─── 필터 탭 ───
function FilterBar({ active, onChange, counts }: { active: string; onChange: (k: string) => void; counts: Record<string, number> }) {
  const tabs = [
    { key: '', label: '전체' },
    { key: 'saju', label: '사주' },
    { key: 'face', label: '관상' },
    { key: 'compatibility', label: '궁합' },
  ];
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <View style={ft.row}>
      {tabs.map((tab) => {
        const on = active === tab.key;
        const count = tab.key ? (counts[tab.key] ?? 0) : total;
        return (
          <TouchableOpacity key={tab.key} onPress={() => onChange(tab.key)} style={[ft.tab, on && ft.tabOn]}>
            <Text style={[ft.label, on && ft.labelOn]}>
              {tab.label}{count > 0 ? ` ${count}` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const ft = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 168, 75, 0.08)',
    marginBottom: 8,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: -1,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabOn: {
    borderBottomColor: theme.colors.gold.primary,
  },
  label: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  labelOn: {
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
});

// ─── 기록 카드 ───
function RecordCard({ item, onTap, onLongPress, index }: { item: AnalysisRecord; onTap: () => void; onLongPress: () => void; index: number }) {
  const score = getScore(item);
  const summary = getSummary(item);
  const meta = TYPE_META[item.type] ?? { hanja: '記', label: item.type };

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(350)}>
      <TouchableOpacity onPress={onTap} onLongPress={onLongPress} activeOpacity={0.7} delayLongPress={400} style={cd.card}>
        {/* 왼쪽: 한자 아이콘 */}
        <View style={cd.iconWrap}>
          <Text style={cd.iconHanja}>{meta.hanja}</Text>
        </View>

        {/* 가운데: 정보 (왼쪽 정렬) */}
        <View style={cd.body}>
          <View style={cd.topRow}>
            <Text style={cd.typeLabel}>{meta.label}</Text>
            <Text style={cd.date}>{formatDate(item.createdAt)}</Text>
          </View>
          {summary ? (
            <Text style={cd.summary} numberOfLines={2}>{summary}</Text>
          ) : (
            <Text style={cd.summaryEmpty}>분석 결과</Text>
          )}
        </View>

        {/* 오른쪽: 점수 */}
        {score !== null && (
          <View style={cd.scoreWrap}>
            <Text style={cd.scoreNum}>{score}</Text>
            <Text style={cd.scoreUnit}>점</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const cd = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 18,
    backgroundColor: theme.colors.bg.elevated,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 168, 75, 0.12)',
    gap: 14,
    ...Platform.select({
      web: { boxShadow: `0 2px 8px ${theme.colors.gold.muted}10` },
      default: { shadowColor: theme.colors.gold.muted, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
    }),
  } as any,
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#242323',
    borderWidth: 1,
    borderColor: 'rgba(212, 168, 75, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHanja: {
    fontSize: 18,
    fontWeight: '300',
    color: theme.colors.gold.primary,
    letterSpacing: 1,
  },
  body: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.gold.dark,
    letterSpacing: 1.5,
  },
  date: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
  },
  summary: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.text.primary,
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  summaryEmpty: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.text.tertiary,
    lineHeight: 22,
  },
  scoreWrap: {
    alignItems: 'center',
    marginLeft: 4,
  },
  scoreNum: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.gold.primary,
    letterSpacing: -0.5,
  },
  scoreUnit: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
  },
});

// ─── 메인 화면 ───
export default function HistoryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { history, loadHistory, deleteRecord } = useFortuneStore();
  const { setSajuResult, setFaceResult, setCompatibilityResult, setTransformedImage } = useFortuneStore();
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const doLoad = useCallback(async (type?: string) => {
    await loadHistory(type || undefined);
  }, [loadHistory]);

  useEffect(() => {
    setLoading(true);
    doLoad(filter).finally(() => setLoading(false));
  }, [filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await doLoad(filter);
    setRefreshing(false);
  }, [filter, doLoad]);

  const filtered = filter ? history.filter((r) => r.type === filter) : history;

  const counts: Record<string, number> = { saju: 0, face: 0, compatibility: 0 };
  history.forEach((r) => { if (counts[r.type] !== undefined) counts[r.type]++; });

  const handleTap = async (record: AnalysisRecord) => {
    const r = record.result as any;
    if (record.type === 'saju') {
      setSajuResult(r);
      router.push('/saju/result');
    } else if (record.type === 'face') {
      setFaceResult(r);
      const localImg = record.imageBase64;
      if (localImg) {
        setTransformedImage(localImg);
      } else {
        setTransformedImage(null);
        api.fetchAnalysisImage(record.id).then((img) => {
          if (img) setTransformedImage(img);
        });
      }
      router.push('/face/result');
    } else if (record.type === 'compatibility') {
      setCompatibilityResult(r);
      router.push('/saju/compatibility-result');
    }
  };

  const handleDelete = (record: AnalysisRecord) => {
    if (Platform.OS === 'web') {
      if (confirm('이 기록을 삭제할까요?')) deleteRecord(record.id);
    } else {
      Alert.alert('삭제', '이 기록을 삭제할까요?', [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: () => deleteRecord(record.id) },
      ]);
    }
  };

  return (
    <View style={s.container}>
      {/* 헤더 */}
      <View style={s.header}>
        <BackButton />
        <View style={s.headerCenter}>
          <Text style={s.headerHanja}>錄</Text>
          <Text style={s.title}>분석 기록</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FilterBar active={filter} onChange={setFilter} counts={counts} />

      {loading ? (
        <ActivityIndicator color={theme.colors.gold.muted} style={{ marginTop: 80 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.gold.muted} colors={[theme.colors.gold.muted]} />
          }
          renderItem={({ item, index }) => (
            <RecordCard item={item} onTap={() => handleTap(item)} onLongPress={() => handleDelete(item)} index={index} />
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyHanja}>記</Text>
              <Text style={s.emptyText}>
                {filter ? `${TYPE_META[filter]?.label ?? ''} 기록이 없습니다` : '아직 기록이 없습니다'}
              </Text>
              <Text style={s.emptySub}>분석을 받으면 여기에 저장됩니다</Text>
            </View>
          }
          contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { paddingTop: 4, paddingBottom: 100 }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg.primary,
    paddingTop: 56,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerHanja: {
    fontSize: 16,
    fontWeight: '300',
    color: theme.colors.gold.primary,
    letterSpacing: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyHanja: {
    fontSize: 36,
    fontWeight: '200',
    color: theme.colors.gold.muted,
    opacity: 0.4,
    marginBottom: 12,
    letterSpacing: 4,
  },
  emptyText: {
    fontSize: 15,
    color: theme.colors.text.tertiary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  emptySub: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    opacity: 0.6,
    letterSpacing: 0.3,
  },
});
