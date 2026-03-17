import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { theme } from '../src/constants/theme';

const SCREEN_W = Dimensions.get('window').width;
const CARD_W = Math.min(SCREEN_W - 32, 440);

const TYPE_META: Record<string, { char: string; label: string; color: string }> = {
  saju: { char: '命', label: '사주 분석', color: theme.colors.gold.primary },
  face: { char: '相', label: '관상 분석', color: theme.colors.gold.primary },
  compatibility: { char: '緣', label: '궁합 분석', color: '#E84393' },
};

export default function SharePage() {
  const params = useLocalSearchParams<{
    type?: string;
    score?: string;
    title?: string;
    summary?: string;
    items?: string; // JSON encoded array of {label, value}
  }>();

  const type = params.type ?? 'saju';
  const meta = TYPE_META[type] ?? TYPE_META.saju;
  const score = parseInt(params.score ?? '0', 10);
  const title = params.title ? decodeURIComponent(params.title) : '';
  const summary = params.summary ? decodeURIComponent(params.summary) : '';
  let items: { label: string; value: string }[] = [];
  try {
    if (params.items) items = JSON.parse(decodeURIComponent(params.items));
  } catch {}

  const handleDownload = () => {
    // TODO: Replace with actual App Store / Play Store URLs
    if (Platform.OS === 'web') {
      window.open('https://miri-app.com', '_blank');
    } else {
      Linking.openURL('https://miri-app.com');
    }
  };

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>
      {/* Card */}
      <View style={st.card}>
        {/* Header */}
        <View style={st.header}>
          <Text style={st.logo}>MIRi</Text>
          <View style={[st.typeBadge, { backgroundColor: meta.color + '15' }]}>
            <Text style={[st.typeChar, { color: meta.color }]}>{meta.char}</Text>
            <Text style={[st.typeLabel, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>

        {/* Title */}
        {title ? <Text style={st.title}>{title}</Text> : null}

        {/* Score */}
        {score > 0 && (
          <View style={st.scoreWrap}>
            <Text style={st.score}>{score}</Text>
            <Text style={st.scoreUnit}>/100</Text>
          </View>
        )}

        {/* Summary */}
        {summary ? <Text style={st.summary}>{summary}</Text> : null}

        {/* Items */}
        {items.length > 0 && (
          <View style={st.itemsWrap}>
            {items.map((item, i) => (
              <View key={i} style={[st.itemRow, i < items.length - 1 && st.itemBorder]}>
                <Text style={st.itemLabel}>{item.label}</Text>
                <Text style={st.itemValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Blur overlay — tease more content */}
        <View style={st.blurOverlay}>
          <Text style={st.blurText}>더 자세한 분석 결과는 MIRi에서</Text>
        </View>
      </View>

      {/* CTA */}
      <TouchableOpacity style={st.ctaBtn} onPress={handleDownload} activeOpacity={0.85}>
        <Text style={st.ctaText}>MIRi에서 내 운명 보기</Text>
        <Text style={st.ctaSub}>무료로 시작하기</Text>
      </TouchableOpacity>

      {/* Secondary CTA */}
      <TouchableOpacity style={st.secondaryCta} onPress={handleDownload}>
        <Text style={st.secondaryText}>나도 궁합/사주 분석 받아보기 →</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={st.footer}>
        <Text style={st.footerLogo}>MIRi</Text>
        <Text style={st.footerTag}>운명을 미리 보다</Text>
        <Text style={st.footerDisc}>엔터테인먼트 목적으로 제공됩니다</Text>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  content: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 16, minHeight: '100%' },
  card: {
    width: CARD_W,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 32px rgba(181,149,48,0.12), 0 2px 8px rgba(0,0,0,0.04)' }
      : { shadowColor: '#B59530', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 8 }),
  } as any,
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logo: { fontSize: 24, fontWeight: '800', color: theme.colors.gold.primary, letterSpacing: 4 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  typeChar: { fontSize: 16, fontWeight: '700' },
  typeLabel: { fontSize: 13, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '800', color: theme.colors.text.primary, lineHeight: 28, marginBottom: 16, textAlign: 'center' },
  scoreWrap: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 16 },
  score: { fontSize: 64, fontWeight: '800', color: theme.colors.gold.primary },
  scoreUnit: { fontSize: 20, color: theme.colors.text.tertiary, marginLeft: 4 },
  summary: { fontSize: 15, color: theme.colors.text.secondary, lineHeight: 24, textAlign: 'center', marginBottom: 20 },
  itemsWrap: { backgroundColor: '#FAFAF5', borderRadius: 16, padding: 4, marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, paddingHorizontal: 14, gap: 10 },
  itemBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(181,149,48,0.12)' },
  itemLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.gold.primary, width: 36 },
  itemValue: { flex: 1, fontSize: 14, fontWeight: '500', color: theme.colors.text.primary, lineHeight: 20 },
  blurOverlay: {
    marginTop: 8,
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 12,
  },
  blurText: { fontSize: 14, fontWeight: '600', color: theme.colors.gold.primary },
  ctaBtn: {
    width: CARD_W,
    marginTop: 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.gold.primary + '40',
  },
  ctaText: { fontSize: 18, fontWeight: '700', color: theme.colors.gold.light },
  ctaSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  secondaryCta: { marginTop: 16, paddingVertical: 12 },
  secondaryText: { fontSize: 14, fontWeight: '600', color: theme.colors.gold.primary },
  footer: { marginTop: 40, alignItems: 'center', gap: 4 },
  footerLogo: { fontSize: 18, fontWeight: '700', color: theme.colors.gold.muted, letterSpacing: 4 },
  footerTag: { fontSize: 12, color: theme.colors.text.tertiary },
  footerDisc: { fontSize: 10, color: theme.colors.text.tertiary, marginTop: 8 },
});
