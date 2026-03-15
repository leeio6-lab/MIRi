import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { theme } from '../../constants/theme';
import { GlassCard } from '../ui/GlassCard';

interface ReviewPromptProps {
  onDismiss: () => void;
}

export function ReviewPrompt({ onDismiss }: ReviewPromptProps) {
  const handleReview = () => {
    const storeUrl = Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/id0000000000' // TODO: Replace with real ID
      : 'https://play.google.com/store/apps/details?id=com.miri.app';

    Linking.openURL(storeUrl).catch(() => {});
    onDismiss();
  };

  return (
    <GlassCard style={styles.container}>
      <Text style={styles.title}>MIRi가 마음에 드셨나요?</Text>
      <Text style={styles.desc}>리뷰를 남겨주시면 더 좋은 서비스를 만드는 데 큰 힘이 됩니다.</Text>
      <View style={styles.buttons}>
        <TouchableOpacity onPress={onDismiss} style={styles.laterBtn}>
          <Text style={styles.laterText}>나중에</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleReview} style={styles.reviewBtn}>
          <Text style={styles.reviewText}>리뷰 작성</Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: theme.spacing.sm },
  title: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary },
  desc: { fontSize: 13, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 20 },
  buttons: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.sm },
  laterBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  laterText: { color: theme.colors.text.tertiary, fontSize: 14 },
  reviewBtn: { paddingVertical: 8, paddingHorizontal: 20, backgroundColor: theme.colors.gold.primary, borderRadius: theme.radius.sm },
  reviewText: { color: theme.colors.text.inverse, fontSize: 14, fontWeight: '600' },
});
