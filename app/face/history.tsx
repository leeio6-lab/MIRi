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
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { BackButton } from '../../src/components/ui/BackButton';
import { useFortuneStore } from '../../src/stores/fortuneStore';
import { api } from '../../src/services/api';
import type { AnalysisRecord } from '../../src/services/api';

// ─── Helpers ───

const TYPE_LABEL: Record<string, string> = {
  saju: '사주',
  face: '관상',
  compatibility: '궁합',
};

function getScore(record: AnalysisRecord): number | null {
  const r = record.result as any;
  return typeof r?.overallScore === 'number' ? r.overallScore : null;
}

function getSummary(record: AnalysisRecord): string {
  const r = record.result as any;
  return r?.headline
    ?? r?.shareTitle
    ?? (typeof r?.summary === 'string' ? r.summary : '')
    ?? r?.overview?.headline
    ?? r?.personality?.headline
    ?? '';
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

// ─── Filter Tab ───

function FilterBar({
  active,
  onChange,
  counts,
}: {
  active: string;
  onChange: (key: string) => void;
  counts: Record<string, number>;
}) {
  const keys = ['', 'saju', 'face', 'compatibility'];
  const labels = ['전체', '사주', '관상', '궁합'];
  return (
    <View style={f.row}>
      {keys.map((k, i) => {
        const on = active === k;
        const count = k ? counts[k] ?? 0 : Object.values(counts).reduce((a, b) => a + b, 0);
        return (
          <TouchableOpacity
            key={k}
            onPress={() => onChange(k)}
            style={[f.tab, on && f.tabOn]}
          >
            <Text style={[f.label, on && f.labelOn]}>
              {labels[i]}{count > 0 ? ` ${count}` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const f = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    marginBottom: 4,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: -1,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabOn: {
    borderBottomColor: '#1C1C1E',
  },
  label: {
    fontSize: 14,
    color: '#AEAEB2',
    fontWeight: '500',
  },
  labelOn: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
});

// ─── Card ───

function RecordCard({
  item,
  onTap,
  onLongPress,
}: {
  item: AnalysisRecord;
  onTap: () => void;
  onLongPress: () => void;
}) {
  const score = getScore(item);
  const summary = getSummary(item);
  const typeLabel = TYPE_LABEL[item.type] ?? item.type;

  return (
    <TouchableOpacity
      onPress={onTap}
      onLongPress={onLongPress}
      activeOpacity={0.6}
      delayLongPress={400}
      style={c.card}
    >
      {/* 상단: 타입 + 날짜 */}
      <View style={c.top}>
        <Text style={c.type}>{typeLabel}</Text>
        <Text style={c.date}>{formatDate(item.createdAt)}</Text>
      </View>

      {/* 본문 */}
      {summary ? (
        <Text style={c.summary} numberOfLines={2}>{summary}</Text>
      ) : (
        <Text style={c.summaryEmpty}>분석 결과</Text>
      )}

      {/* 하단: 점수 */}
      {score !== null && (
        <Text style={c.score}>{score}점</Text>
      )}
    </TouchableOpacity>
  );
}

const c = StyleSheet.create({
  card: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  type: {
    fontSize: 12,
    fontWeight: '600',
    color: '#AEAEB2',
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 12,
    color: '#AEAEB2',
  },
  summary: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1C1C1E',
    lineHeight: 24,
  },
  summaryEmpty: {
    fontSize: 16,
    fontWeight: '400',
    color: '#AEAEB2',
    lineHeight: 24,
  },
  score: {
    fontSize: 13,
    fontWeight: '500',
    color: '#636366',
    marginTop: 6,
  },
});

// ─── Screen ───

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

  const filtered = filter
    ? history.filter((r) => r.type === filter)
    : history;

  const counts: Record<string, number> = { saju: 0, face: 0, compatibility: 0 };
  history.forEach((r) => { if (counts[r.type] !== undefined) counts[r.type]++; });

  const handleTap = async (record: AnalysisRecord) => {
    const r = record.result as any;
    if (record.type === 'saju') {
      setSajuResult(r);
      router.push('/saju/result');
    } else if (record.type === 'face') {
      setFaceResult(r);
      // 로컬 메모리에 이미지가 있으면 즉시 사용, 없으면 Supabase에서 fetch
      const localImg = record.imageBase64;
      if (localImg) {
        setTransformedImage(localImg);
      } else {
        setTransformedImage(null);
        // Supabase에서 개별 fetch (비동기, 화면 전환 후 로드)
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
      // eslint-disable-next-line no-restricted-globals
      if (confirm('이 기록을 삭제할까요?')) deleteRecord(record.id);
    } else {
      Alert.alert(
        '삭제',
        '이 기록을 삭제할까요?',
        [
          { text: '취소', style: 'cancel' },
          { text: '삭제', style: 'destructive', onPress: () => deleteRecord(record.id) },
        ],
      );
    }
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <BackButton />
        <Text style={s.title}>기록</Text>
        <View style={{ width: 40 }} />
      </View>

      <FilterBar active={filter} onChange={setFilter} counts={counts} />

      {loading ? (
        <ActivityIndicator color="#AEAEB2" style={{ marginTop: 80 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#AEAEB2"
              colors={['#AEAEB2']}
            />
          }
          renderItem={({ item }) => (
            <RecordCard
              item={item}
              onTap={() => handleTap(item)}
              onLongPress={() => handleDelete(item)}
            />
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>
                {filter ? `${TYPE_LABEL[filter]} 기록이 없습니다` : '아직 기록이 없습니다'}
              </Text>
              <Text style={s.emptySub}>분석을 받으면 여기에 저장됩니다</Text>
            </View>
          }
          contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { paddingBottom: 100 }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 56,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 15,
    color: '#AEAEB2',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#D1D1D6',
  },
});
