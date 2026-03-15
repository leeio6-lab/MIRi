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
      ? calculateFourPillars(user.birthYear, user.birthMonth, user.birthDay, user.birthHour)
      : null,
    [user?.birthYear, user?.birthMonth, user?.birthDay, user?.birthHour]
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
      // Fallback to local calculation with mock summary
      if (pillars) {
        setSajuResult({
          fourPillars: {
            year: { stem: pillars.year.stem, branch: pillars.year.branch, element: pillars.year.element },
            month: { stem: pillars.month.stem, branch: pillars.month.branch, element: pillars.month.element },
            day: { stem: pillars.day.stem, branch: pillars.day.branch, element: pillars.day.element },
            hour: { stem: pillars.hour.stem, branch: pillars.hour.branch, element: pillars.hour.element },
          },
          elementBalance: pillars.elementBalance,
          overallScore: Math.floor(Math.random() * 20 + 70),
          headline: '사주 분석',
          summary: '당신의 사주에는 균형 잡힌 기운이 흐르고 있습니다. 올해는 새로운 시작과 도전에 유리한 운세입니다.',
        });
      }
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [user, pillars]);

  return { pillars, sajuResult, analyze, isLoading };
}
