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
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { useAuthStore } from '../../src/stores/authStore';
import { useFortuneStore } from '../../src/stores/fortuneStore';
import { calculateFourPillars, ZODIAC_ANIMALS } from '../../src/utils/saju-calc';

function MenuItem({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.menuLabel, danger && styles.menuDanger]}>{label}</Text>
      <Text style={styles.menuArrow}>{'›'}</Text>
    </TouchableOpacity>
  );
}

export default function MyPageScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isGuest, logout } = useAuthStore();
  const { setSajuResult, setFaceResult, setTransformedImage, setDailyFortune, setCompatibilityResult } = useFortuneStore();

  const pillars = user
    ? calculateFourPillars(user.birthYear, user.birthMonth, user.birthDay, user.birthHour, undefined, undefined, undefined, user.isLunar)
    : null;

  const performLogout = async () => {
    try {
      setSajuResult(null);
      setFaceResult(null);
      setTransformedImage(null);
      setDailyFortune(null);
      setCompatibilityResult(null);
      await logout();
    } catch (e) {
      console.warn('[Logout] error:', e);
    }
    router.replace('/(auth)/onboarding');
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-restricted-globals
      const ok = confirm(t('mypage.logoutConfirm'));
      if (ok) performLogout();
    } else {
      Alert.alert(
        t('mypage.logout'),
        t('mypage.logoutConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            style: 'destructive',
            onPress: performLogout,
          },
        ],
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>{t('mypage.title')}</Text>

      {/* Profile Card */}
      <GlassCard gold style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarChar}>
            {pillars?.year.zodiac?.[0] ?? '?'}
          </Text>
        </View>
        {user && (
          <View style={styles.profileInfo}>
            {isGuest ? (
              <Text style={styles.guestBadge}>{t('mypage.guest')}</Text>
            ) : user.email ? (
              <View style={styles.accountRow}>
                <Text style={styles.accountIcon}>G</Text>
                <Text style={styles.accountEmail} numberOfLines={1}>{user.email}</Text>
              </View>
            ) : null}
            {user.name ? (
              <Text style={styles.profileUserName}>{user.name}</Text>
            ) : null}
            <Text style={styles.profileName}>
              {t('mypage.birthFormat', {
                year: user.birthYear,
                month: user.birthMonth,
                day: user.birthDay,
              })}
            </Text>
            <Text style={styles.profileDetail}>
              {user.isLunar ? t('mypage.calendarLunar') : t('mypage.calendarSolar')} | {user.gender === 'male' ? t('mypage.genderMale') : t('mypage.genderFemale')}
            </Text>
            {pillars?.year.zodiac && (
              <Text style={styles.profileZodiac}>
                {pillars.year.zodiac}{t('mypage.zodiacSuffix')} | {pillars.year.stemHanja}{pillars.year.branchHanja}{t('mypage.yearSuffix')}
              </Text>
            )}
          </View>
        )}
      </GlassCard>

      {/* Menu */}
      <GlassCard style={styles.menuCard}>
        <MenuItem
          label={t('mypage.history')}
          onPress={() => router.push('/face/history')}
        />
        <View style={styles.menuDivider} />
        <MenuItem
          label={t('mypage.language')}
          onPress={() => router.push('/settings/language')}
        />
        <View style={styles.menuDivider} />
        <MenuItem
          label={t('mypage.notifications')}
          onPress={() => Alert.alert(t('mypage.notifications'), t('common.comingSoon'))}
        />
      </GlassCard>

      <GlassCard style={styles.menuCard}>
        <MenuItem
          label={t('mypage.purchase')}
          onPress={() => router.push('/settings/subscription')}
        />
      </GlassCard>

      <GlassCard style={styles.menuCard}>
        <MenuItem
          label={t('mypage.terms')}
          onPress={() => router.push('/settings/terms')}
        />
        <View style={styles.menuDivider} />
        <MenuItem
          label={t('mypage.privacy')}
          onPress={() => router.push('/settings/privacy')}
        />
      </GlassCard>

      <GlassCard style={styles.menuCard}>
        <MenuItem
          label={t('mypage.logout')}
          onPress={handleLogout}
          danger
        />
      </GlassCard>

      <Text style={styles.version}>
        {t('mypage.version')}: 1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg.primary,
  },
  content: {
    padding: theme.spacing.screenPadding,
    paddingTop: 60,
    paddingBottom: 120,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    letterSpacing: -0.5,
    marginBottom: theme.spacing.sectionGap,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sectionGap,
    padding: theme.spacing.cardPadding,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.gold.dark,
  },
  avatarChar: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.gold.primary,
  },
  profileInfo: {
    flex: 1,
  },
  guestBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    backgroundColor: 'rgba(181,149,48,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
    letterSpacing: 0.5,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  accountIcon: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4285F4',
    backgroundColor: 'rgba(66,133,244,0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    overflow: 'hidden',
  },
  accountEmail: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    flex: 1,
  },
  profileUserName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  profileDetail: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  profileZodiac: {
    fontSize: 13,
    color: theme.colors.gold.primary,
    marginTop: 2,
  },
  menuCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.cardPadding,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.md,
  },
  menuLabel: {
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  menuDanger: {
    color: theme.colors.error,
  },
  menuArrow: {
    color: theme.colors.text.tertiary,
    fontSize: 14,
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.glass.border,
    marginHorizontal: theme.spacing.md,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.lg,
  },
});
