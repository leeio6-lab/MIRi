import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../constants/theme';
import { usePurchaseStore } from '../../stores/purchaseStore';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onUnlocked: () => void;
  productType: 'saju' | 'face' | 'compatibility';
}

export function PaywallModal({
  visible,
  onClose,
  onUnlocked,
  productType,
}: PaywallModalProps) {
  const { t } = useTranslation();
  const { purchaseAnalysis, isProcessing, freeCredits } = usePurchaseStore();

  const features = t('paywall.features', { returnObjects: true }) as string[];

  const handlePurchase = async () => {
    const success = await purchaseAnalysis(productType);
    if (success) {
      onClose();
      onUnlocked();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{t('paywall.title')}</Text>
          <Text style={styles.subtitle}>{t('paywall.subtitle')}</Text>

          <View style={styles.divider} />

          {/* 포함 내용 */}
          <ScrollView style={styles.featureList}>
            {features.map((feature, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </ScrollView>

          {/* 가격 */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{t('paywall.price')}</Text>
            <Text style={styles.priceLabel}>{t('paywall.perAnalysis')}</Text>
          </View>

          {/* 구매 버튼 */}
          <TouchableOpacity
            style={styles.purchaseBtn}
            onPress={handlePurchase}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            {isProcessing ? (
              <ActivityIndicator color={theme.colors.text.inverse} />
            ) : (
              <Text style={styles.purchaseBtnText}>
                {freeCredits > 0
                  ? t('paywall.freeTrial', { count: freeCredits })
                  : t('paywall.purchase')}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>{t('common.disclaimer')}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    borderTopWidth: 1,
    borderColor: theme.colors.gold.dark + '50',
  },
  closeBtn: { alignSelf: 'flex-end', padding: theme.spacing.sm },
  closeText: { color: 'rgba(255,255,255,0.5)', fontSize: 20 },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.gold.light, textAlign: 'center', marginBottom: theme.spacing.xs },
  subtitle: { fontSize: 14, color: theme.colors.goldCard.textSecondary, textAlign: 'center', marginBottom: theme.spacing.md },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: theme.spacing.sm },
  featureList: { maxHeight: 130 },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: theme.spacing.sm },
  checkmark: { color: theme.colors.gold.light, fontSize: 16 },
  featureText: { color: theme.colors.goldCard.text, fontSize: 14, flex: 1 },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginVertical: theme.spacing.md, gap: theme.spacing.xs },
  price: { fontSize: 32, fontWeight: '700', color: theme.colors.gold.light },
  priceLabel: { fontSize: 14, color: theme.colors.goldCard.textSecondary },
  purchaseBtn: {
    backgroundColor: theme.colors.gold.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    minHeight: 48,
  },
  purchaseBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  disclaimer: { color: theme.colors.goldCard.textTertiary, fontSize: 9, textAlign: 'center', marginTop: theme.spacing.sm, lineHeight: 13 },
});
