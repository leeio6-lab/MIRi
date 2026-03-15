import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { BackButton } from '../../src/components/ui/BackButton';
import { useFortuneStore } from '../../src/stores/fortuneStore';
import type { AnalysisRecord } from '../../src/services/api';

const TYPE_META: Record<string, { labelKey: string; char: string; color: string }> = {
  saju: { labelKey: 'history.typeSaju', char: '命', color: theme.colors.gold.primary },
  face: { labelKey: 'history.typeFace', char: '相', color: '#C4503D' },
  compatibility: { labelKey: 'history.typeCompatibility', char: '緣', color: '#2C5F8A' },
};

const FILTER_KEYS = [
  { key: '', labelKey: 'history.filterAll' },
  { key: 'saju', labelKey: 'history.typeSaju' },
  { key: 'face', labelKey: 'history.typeFace' },
  { key: 'compatibility', labelKey: 'history.typeCompatibility' },
];

function getScore(record: AnalysisRecord): number | null {
  const r = record.result as any;
  return r?.overallScore ?? null;
}

function getSummary(record: AnalysisRecord): string {
  const r = record.result as any;
  if (r?.headline) return r.headline;
  if (typeof r?.summary === 'string') return r.summary;
  if (Array.isArray(r?.summary)) return r.summary[0] ?? '';
  return '';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function HistoryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { history, loadHistory, deleteRecord } = useFortuneStore();
  const { setSajuResult, setFaceResult, setCompatibilityResult } = useFortuneStore();
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await loadHistory(filter || undefined);
      setLoading(false);
    })();
  }, [filter]);

  const filtered = filter
    ? history.filter((r) => r.type === filter)
    : history;

  const handleTap = (record: AnalysisRecord) => {
    const r = record.result as any;
    if (record.type === 'saju') {
      setSajuResult(r);
      router.push('/saju/result');
    } else if (record.type === 'face') {
      setFaceResult(r);
      router.push('/face/result');
    } else if (record.type === 'compatibility') {
      setCompatibilityResult(r);
      router.push('/saju/compatibility-result');
    }
  };

  const handleDelete = (record: AnalysisRecord) => {
    Alert.alert(
      t('history.title'),
      t('history.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteRecord(record.id),
        },
      ],
    );
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <BackButton />
        <Text style={s.title}>{t('history.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 필터 */}
      <View style={s.filterRow}>
        {FILTER_KEYS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterBtn, filter === f.key && s.filterBtnActive]}
            onPress={() => { setLoading(true); setFilter(f.key); }}
          >
            <Text style={[s.filterText, filter === f.key && s.filterTextActive]}>
              {t(f.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.gold.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const metaRaw = TYPE_META[item.type] ?? TYPE_META.saju;
            const score = getScore(item);
            const summary = getSummary(item);

            return (
              <GlassCard style={s.card}>
                <TouchableOpacity onPress={() => handleTap(item)} activeOpacity={0.7}>
                  <View style={s.cardTop}>
                    <View style={s.typeBadge}>
                      <Text style={[s.typeChar, { color: metaRaw.color }]}>{metaRaw.char}</Text>
                      <Text style={s.typeLabel}>{t(metaRaw.labelKey)}</Text>
                    </View>
                    <View style={s.cardMeta}>
                      <Text style={s.date}>{formatDate(item.createdAt)}</Text>
                      {item.isPaid && <Text style={s.paidBadge}>{t('common.paid')}</Text>}
                    </View>
                  </View>
                  {score !== null && (
                    <Text style={[s.score, { color: metaRaw.color }]}>{score}{t('common.point')}</Text>
                  )}
                  {summary ? (
                    <Text style={s.summary} numberOfLines={2}>{summary}</Text>
                  ) : null}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={s.deleteBtn}
                >
                  <Text style={s.deleteIcon}>✕</Text>
                </TouchableOpacity>
              </GlassCard>
            );
          }}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Text style={s.emptyChar}>占</Text>
              <Text style={s.emptyText}>{t('history.noRecords')}</Text>
              <Text style={s.emptySub}>{t('history.noRecordsSub')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.primary, paddingTop: 56 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.screenPadding, marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.text.primary },

  filterRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: theme.spacing.screenPadding, marginBottom: 16,
  },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: theme.colors.bg.secondary,
  },
  filterBtnActive: { backgroundColor: '#1C1C1E' },
  filterText: { fontSize: 13, fontWeight: '500', color: theme.colors.text.secondary },
  filterTextActive: { color: theme.colors.gold.primary, fontWeight: '700' },

  list: { padding: theme.spacing.screenPadding, paddingBottom: 120, gap: 10 },
  card: { position: 'relative' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingRight: 28 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeChar: { fontSize: 18, fontWeight: '700' },
  typeLabel: { fontSize: 12, color: theme.colors.text.tertiary, fontWeight: '600' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  date: { fontSize: 12, color: theme.colors.text.tertiary },
  paidBadge: {
    fontSize: 10, fontWeight: '700', color: theme.colors.gold.primary,
    backgroundColor: 'rgba(181,149,48,0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  deleteBtn: {
    position: 'absolute', top: theme.spacing.cardPadding, right: theme.spacing.cardPadding,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: theme.colors.bg.tertiary,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  deleteIcon: {
    fontSize: 11, color: theme.colors.text.tertiary, fontWeight: '600',
  },
  score: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  summary: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },

  emptyWrap: { alignItems: 'center', marginTop: 80 },
  emptyChar: { fontSize: 48, color: theme.colors.text.tertiary, opacity: 0.3, marginBottom: 16 },
  emptyText: { fontSize: 16, color: theme.colors.text.secondary, fontWeight: '600' },
  emptySub: { fontSize: 13, color: theme.colors.text.tertiary, marginTop: 4 },
});
