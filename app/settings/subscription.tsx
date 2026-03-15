import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { BackButton } from '../../src/components/ui/BackButton';
import { usePurchaseStore } from '../../src/stores/purchaseStore';

export default function PurchaseHistoryScreen() {
  const { t } = useTranslation();
  const { purchasedItems, freeCredits, restorePurchases } = usePurchaseStore();
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restorePurchases();
      const state = usePurchaseStore.getState();
      if (state.purchasedItems.length > 0) {
        Alert.alert(t('mypage.restoreDoneTitle'), t('mypage.restoreSuccess'));
      } else {
        Alert.alert(t('mypage.restoreResultTitle'), t('mypage.restoreEmpty'));
      }
    } catch {
      Alert.alert(t('common.error'), t('mypage.restoreError'));
    } finally {
      setIsRestoring(false);
    }
  };

  const formatPurchaseItem = (item: string): string => {
    if (item.includes('saju')) return t('mypage.purchaseItemSaju');
    if (item.includes('face')) return t('mypage.purchaseItemFace');
    if (item.includes('compatibility')) return t('mypage.purchaseItemCompat');
    if (item.startsWith('dev_')) return `[DEV] ${item.replace('dev_', '').split('_')[0]}`;
    return item;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BackButton />

      <Text style={styles.title}>{t('mypage.purchase')}</Text>

      {/* 이용권 현황 */}
      <GlassCard style={styles.statusCard}>
        <Text style={styles.statusLabel}>{t('mypage.freeCreditsLeft')}</Text>
        <Text style={styles.statusValue}>
          {freeCredits}{t('mypage.creditsUnit')}
        </Text>
        <Text style={styles.statusDesc}>{t('mypage.perAnalysis')}</Text>
      </GlassCard>

      {/* 구매 내역 */}
      <GlassCard style={styles.historyCard}>
        <Text style={styles.historyTitle}>{t('mypage.purchaseHistory')}</Text>
        {purchasedItems.length === 0 ? (
          <Text style={styles.historyEmpty}>{t('mypage.noPurchase')}</Text>
        ) : (
          purchasedItems.slice(-20).reverse().map((item, i) => (
            <View key={i} style={styles.historyItem}>
              <Text style={styles.historyItemText}>{formatPurchaseItem(item)}</Text>
            </View>
          ))
        )}
      </GlassCard>

      {/* 복원 */}
      <TouchableOpacity
        style={styles.restoreBtn}
        onPress={handleRestore}
        disabled={isRestoring}
      >
        {isRestoring ? (
          <ActivityIndicator color={theme.colors.text.tertiary} size="small" />
        ) : (
          <Text style={styles.restoreText}>{t('mypage.restorePurchase')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.primary },
  content: { padding: theme.spacing.screenPadding, paddingTop: 60, paddingBottom: 120 },
  title: { ...theme.typo.screenTitle, marginBottom: theme.spacing.sectionGap },
  statusCard: { marginBottom: theme.spacing.lg, alignItems: 'center' },
  statusLabel: { fontSize: 12, color: theme.colors.text.tertiary },
  statusValue: { fontSize: 28, fontWeight: '700', color: theme.colors.gold.primary, marginVertical: theme.spacing.sm },
  statusDesc: { fontSize: 14, color: theme.colors.text.secondary, textAlign: 'center' },
  historyCard: { marginBottom: theme.spacing.md },
  historyTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: theme.spacing.md },
  historyEmpty: { fontSize: 14, color: theme.colors.text.tertiary },
  historyItem: { paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.glass.border },
  historyItemText: { fontSize: 14, color: theme.colors.text.secondary },
  restoreBtn: { alignItems: 'center', paddingVertical: theme.spacing.md, minHeight: 40 },
  restoreText: { color: theme.colors.text.tertiary, fontSize: 13, textDecorationLine: 'underline' },
});
