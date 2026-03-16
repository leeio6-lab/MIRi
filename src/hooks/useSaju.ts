import { useCallback, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useFortuneStore } from '../stores/fortuneStore';
import { api, formatPillarInfo } from '../services/api';
import { calculateFourPillars, type FourPillarsCalc } from '../utils/saju-calc';

export function useSaju() {
  const { user } = useAuthStore();
  const { sajuResult, setSajuResult, isLoading, setLoading, setError } = useFortuneStore();

  const pillars: FourPillarsCalc | null = useMemo(
    () => user
      ? calculateFourPillars(user.birthYear, user.birthMonth, user.birthDay, user.birthHour, undefined, undefined, undefined, user.isLunar)
      : null,
    [user?.birthYear, user?.birthMonth, user?.birthDay, user?.birthHour, user?.isLunar]
  );

  const analyze = useCallback(async (isPaid: boolean) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const pillarInfo = pillars
        ? formatPillarInfo(pillars, user.birthYear)
        : undefined;

      const result = await api.analyzeSaju(
        {
          year: user.birthYear,
          month: user.birthMonth,
          day: user.birthDay,
          hour: user.birthHour,
          isLunar: user.isLunar,
          gender: user.gender,
        },
        user.locale,
        isPaid,
        'integrated',
        pillarInfo
      );
      setSajuResult(result);
    } catch (err) {
      if (__DEV__) console.error('[useSaju] analyze error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [user, pillars]);

  return { pillars, sajuResult, analyze, isLoading };
}
