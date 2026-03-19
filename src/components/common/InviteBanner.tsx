import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { theme } from '../../constants/theme';
import { GlassCard } from '../ui/GlassCard';
import { analytics } from '../../services/analytics';

interface InviteBannerProps {
  referralCode?: string;
  freeAnalysesCount?: number;
}

export function InviteBanner({ referralCode, freeAnalysesCount = 0 }: InviteBannerProps) {
  const handleInvite = async () => {
    try {
      const message = `명리(命理)에서 AI 사주/관상 분석 받아보세요! 운명의 이치를 읽다.\n\n추천 코드: ${referralCode ?? 'MYEONGRI2026'}\n\n다운로드: https://myeongri-app.com/download`;

      await Share.share({
        message,
        title: '명리 - 운명의 이치를 읽다',
      });

      analytics.track('referral_invite');
    } catch {
      // User cancelled share
    }
  };

  return (
    <TouchableOpacity onPress={handleInvite} activeOpacity={0.8}>
      <GlassCard gold style={styles.container}>
        <View style={styles.left}>
          <Text style={styles.title}>친구 초대하기</Text>
          <Text style={styles.desc}>
            친구 1명 초대 = 무료 분석 1회
          </Text>
          {freeAnalysesCount > 0 && (
            <Text style={styles.count}>
              보유 무료 분석: {freeAnalysesCount}회
            </Text>
          )}
        </View>
        <Text style={styles.arrow}>{'>'}</Text>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flex: 1 },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    marginBottom: 2,
  },
  desc: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  count: {
    fontSize: 12,
    color: theme.colors.gold.light,
    marginTop: theme.spacing.xs,
  },
  arrow: {
    fontSize: 18,
    color: theme.colors.gold.muted,
  },
});
