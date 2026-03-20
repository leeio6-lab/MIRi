import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { useAuthStore } from '../../src/stores/authStore';
import { useFortuneStore } from '../../src/stores/fortuneStore';
import { calculateFourPillars } from '../../src/utils/saju-calc';

// ── 골드 틴트 구분선 (디자인 시스템) ──
const DIVIDER = 'rgba(212, 168, 75, 0.08)';

// ─── 메뉴 아이템 ───
function MenuItem({ hanja, label, onPress, danger }: { hanja: string; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={s.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={[s.menuHanja, danger && { color: theme.colors.error, opacity: 0.6 }]}>{hanja}</Text>
      <Text style={[s.menuLabel, danger && s.menuDanger]}>{label}</Text>
      <Text style={s.menuArrow}>{'\u203A'}</Text>
    </TouchableOpacity>
  );
}

// ─── 섹션 헤더 ───
function SectionHeader({ hanja, label }: { hanja: string; label: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionHanja}>{hanja}</Text>
      <Text style={s.sectionText}>{label}</Text>
      <View style={s.sectionLine} />
    </View>
  );
}

export default function MyPageScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isGuest, logout } = useAuthStore();
  const { clearAllData } = useFortuneStore();

  const pillars = user
    ? calculateFourPillars(user.birthYear, user.birthMonth, user.birthDay, user.birthHour, undefined, undefined, undefined, user.isLunar)
    : null;

  const performLogout = async () => {
    try { clearAllData(); await logout(); } catch (e) { if (__DEV__) console.warn('[Logout]', e); }
    router.replace('/(auth)/onboarding');
  };

  const performDeleteAccount = async () => {
    try {
      // 1. 서버 DB에서 analyses + users 삭제
      const { api } = require('../../src/services/api');
      await api.deleteAccount();
      // 2. 로컬 데이터 전부 초기화
      clearAllData();
    } catch (e) {
      if (__DEV__) console.warn('[DeleteAccount]', e);
      // 서버 삭제 실패해도 로컬은 초기화
      clearAllData();
    }
    router.replace('/(auth)/onboarding');
  };

  const handleDeleteAccount = () => {
    const msg = '회원 탈퇴 시 모든 분석 기록과 개인정보가 즉시 삭제되며, 복구할 수 없습니다.\n\n정말 탈퇴하시겠습니까?';
    if (Platform.OS === 'web') {
      if (confirm(msg)) performDeleteAccount();
    } else {
      Alert.alert('회원 탈퇴', msg, [
        { text: t('common.cancel'), style: 'cancel' },
        { text: '탈퇴하기', style: 'destructive', onPress: performDeleteAccount },
      ]);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (confirm(t('mypage.logoutConfirm'))) performLogout();
    } else {
      Alert.alert(t('mypage.logout'), t('mypage.logoutConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.confirm'), style: 'destructive', onPress: performLogout },
      ]);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── 프로필 (카드 없이, 여백으로 숨쉬기) ── */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <View style={s.profileWrap}>
          {/* 아바타 */}
          <View style={s.avatar}>
            <Text style={s.avatarChar}>{pillars?.year.stemHanja ?? '命'}</Text>
          </View>

          {/* 이름 + 정보 */}
          {user?.name ? <Text style={s.profileName}>{user.name}</Text> : null}
          {isGuest && (
            <View style={s.guestBadge}><Text style={s.guestBadgeText}>{t('mypage.guest')}</Text></View>
          )}
          <Text style={s.profileBirth}>
            {user ? `${user.birthYear}.${String(user.birthMonth).padStart(2, '0')}.${String(user.birthDay).padStart(2, '0')}` : ''}
          </Text>
          <Text style={s.profileMeta}>
            {user?.isLunar ? t('mypage.calendarLunar') : t('mypage.calendarSolar')}
            {'  ·  '}
            {user?.gender === 'male' ? t('mypage.genderMale') : t('mypage.genderFemale')}
            {pillars ? `  ·  ${pillars.year.stemHanja}${pillars.year.branchHanja}${t('mypage.yearSuffix')}` : ''}
            {pillars?.year.zodiac ? `  ·  ${pillars.year.zodiac}띠` : ''}
          </Text>
        </View>

        {/* 프로필 아래 장식 구분선 */}
        <View style={s.profileDividerWrap}>
          <View style={s.profileDividerLine} />
          <Text style={s.profileDividerChar}>我</Text>
          <View style={s.profileDividerLine} />
        </View>
      </Animated.View>

      {/* ── 기록 ── */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <SectionHeader hanja="錄" label="기록" />
        <GlassCard style={s.menuCard}>
          <MenuItem hanja="冊" label={t('mypage.history')} onPress={() => router.push('/face/history')} />
        </GlassCard>
      </Animated.View>

      {/* ── 설정 ── */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <SectionHeader hanja="設" label="설정" />
        <GlassCard style={s.menuCard}>
          <MenuItem hanja="言" label={t('mypage.language')} onPress={() => router.push('/settings/language')} />
          <View style={s.menuDivider} />
          <MenuItem hanja="鐘" label={t('mypage.notifications')} onPress={() => Alert.alert(t('mypage.notifications'), t('common.comingSoon'))} />
        </GlassCard>
      </Animated.View>

      {/* ── 결제 ── */}
      <Animated.View entering={FadeInDown.delay(300).duration(400)}>
        <SectionHeader hanja="財" label="결제" />
        <GlassCard style={s.menuCard}>
          <MenuItem hanja="券" label={t('mypage.purchase')} onPress={() => router.push('/settings/subscription')} />
        </GlassCard>
      </Animated.View>

      {/* ── 약관 ── */}
      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <SectionHeader hanja="律" label="약관" />
        <GlassCard style={s.menuCard}>
          <MenuItem hanja="約" label={t('mypage.terms')} onPress={() => router.push('/settings/terms')} />
          <View style={s.menuDivider} />
          <MenuItem hanja="密" label={t('mypage.privacy')} onPress={() => router.push('/settings/privacy')} />
        </GlassCard>
      </Animated.View>

      {/* ── 계정 ── */}
      <Animated.View entering={FadeInDown.delay(500).duration(400)}>
        <SectionHeader hanja="帳" label="계정" />
        <GlassCard style={s.menuCardLast}>
          <MenuItem hanja="出" label={t('mypage.logout')} onPress={handleLogout} />
          {!isGuest && (
            <>
              <View style={s.menuDivider} />
              <MenuItem hanja="刪" label={t('mypage.deleteAccount')} onPress={handleDeleteAccount} danger />
            </>
          )}
        </GlassCard>
      </Animated.View>

      <Text style={s.version}>{t('mypage.version')}: 1.0.0</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg.primary,
  },
  content: {
    padding: theme.spacing.screenPadding,
    paddingTop: 60,
    paddingBottom: 120,
  },

  // ── 프로필 (중앙 정렬, 격조) ──
  profileWrap: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FFFDF8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 168, 75, 0.25)',
    marginBottom: 16,
    ...Platform.select({
      web: { boxShadow: `0 4px 16px ${theme.colors.gold.muted}18` },
      default: {
        shadowColor: theme.colors.gold.muted,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 2,
      },
    }),
  } as any,
  avatarChar: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    letterSpacing: 2,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  guestBadge: {
    backgroundColor: theme.colors.gold.primary + '12',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  guestBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.gold.dark,
    letterSpacing: 1.5,
  },
  profileBirth: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  profileMeta: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
    lineHeight: 18,
    textAlign: 'center',
  },

  // ── 프로필 구분선 (한자 장식) ──
  profileDividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
    gap: 12,
  },
  profileDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: DIVIDER,
  },
  profileDividerChar: {
    fontSize: 12,
    fontWeight: '300',
    color: theme.colors.gold.muted,
    letterSpacing: 2,
    opacity: 0.6,
  },

  // ── 섹션 헤더 ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingLeft: 4,
  },
  sectionHanja: {
    fontSize: 13,
    fontWeight: '300',
    color: theme.colors.gold.dark,
    letterSpacing: 2,
  },
  sectionText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    letterSpacing: 2,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: DIVIDER,
    marginLeft: 8,
  },

  // ── 메뉴 카드 (GlassCard 코너 장식만, borderWidth 없음) ──
  menuCard: {
    marginBottom: 20,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  menuCardLast: {
    marginTop: 8,
    marginBottom: 20,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    paddingVertical: 15,
    paddingHorizontal: 24,
    gap: 14,
  },
  menuHanja: {
    fontSize: 15,
    fontWeight: '300',
    color: theme.colors.gold.muted,
    width: 22,
    textAlign: 'center',
    letterSpacing: 1,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
  },
  menuDanger: {
    color: theme.colors.error,
  },
  menuArrow: {
    fontSize: 18,
    fontWeight: '300',
    color: theme.colors.text.tertiary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: DIVIDER,
    marginHorizontal: 24,
  },

  // ── 버전 ──
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: theme.colors.text.tertiary,
    marginTop: 24,
    letterSpacing: 1,
  },
});
