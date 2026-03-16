import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { useFortuneStore } from '../stores/fortuneStore';
import {
  calculateTodaySaju,
  calculateFourPillars,
  HEAVENLY_STEMS_HANJA,
  STEM_ELEMENTS,
} from '../utils/saju-calc';

/** 로컬 타임존 기준 YYYY-MM-DD */
function getLocalDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 결정적 해시 (같은 입력 → 같은 출력) */
function seededHash(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function useDailyFortune() {
  const { user } = useAuthStore();
  const { dailyFortune, setDailyFortune } = useFortuneStore();
  const { t } = useTranslation();
  const hydratedRef = useRef(false);

  const generate = useCallback(async () => {
    if (!user) return;

    // persist hydration 대기
    if (!hydratedRef.current) {
      await new Promise<void>((resolve) => {
        const unsub = useFortuneStore.persist.onFinishHydration(() => {
          hydratedRef.current = true;
          unsub();
          resolve();
        });
        if (useFortuneStore.persist.hasHydrated()) {
          hydratedRef.current = true;
          unsub();
          resolve();
        }
      });
    }

    const today = getLocalDateString();
    const currentFortune = useFortuneStore.getState().dailyFortune;

    // 캐시 키: 날짜 + 생년월일시 + 언어 (정보 바뀌면 재생성)
    const lang = t('common.appName'); // changes per language
    const cacheKey = `${today}_${user.birthYear}_${user.birthMonth}_${user.birthDay}_${user.birthHour}_${lang}`;

    // 이미 같은 조건의 데이터가 있으면 재생성하지 않음
    if (currentFortune?.date === today && (currentFortune as any)?._cacheKey === cacheKey) return;

    // ─── 100% 로컬 계산 (API 호출 없음) ───
    const pillars = calculateFourPillars(user.birthYear, user.birthMonth, user.birthDay, user.birthHour, undefined, undefined, undefined, user.isLunar);
    const todaySaju = calculateTodaySaju(pillars.day.stemIdx);

    // 결정적 해시 (같은 날 + 같은 생년 → 항상 동일한 결과)
    const hashBase = today + user.birthYear + user.birthMonth + user.birthDay;
    const h1 = seededHash(hashBase);
    const h2 = seededHash('item' + hashBase);
    const h3 = seededHash('color' + hashBase);
    const h4 = seededHash('num' + hashBase);

    // 십성 기반 메시지 선택 (i18n)
    const tenGod = todaySaju.tenGod;
    const messages = t(`daily.tenGod.${tenGod}`, { returnObjects: true }) as string[];
    const fallbackMessages = t('daily.tenGod.비견', { returnObjects: true }) as string[];
    const resolvedMessages = Array.isArray(messages) ? messages : fallbackMessages;
    const message = resolvedMessages[h1 % resolvedMessages.length];

    // 오행 이름 (i18n)
    const todayElement = t(`elements.${STEM_ELEMENTS[todaySaju.dayStemIdx]}`);
    const myElement = t(`elements.${pillars.dayMasterElement}`);

    // 점수: 12운성 기반
    const STAGE_SCORES: Record<string, number> = {
      장생: 85, 목욕: 65, 관대: 80, 건록: 88, 제왕: 92,
      쇠: 60, 병: 50, 사: 45, 묘: 40, 절: 35, 태: 55, 양: 70,
    };
    const baseScore = STAGE_SCORES[todaySaju.lifeStage] ?? 65;
    const scoreVariation = (h1 % 11) - 5;
    const overallScore = Math.max(30, Math.min(95, baseScore + scoreVariation));

    // Summary (i18n template)
    const summary = t('home.fortuneSummary', {
      dayStem: todaySaju.dayStemHanja,
      dayBranch: todaySaju.dayBranchHanja,
      dayElement: todayElement,
      myDayStem: HEAVENLY_STEMS_HANJA[pillars.day.stemIdx],
      myElement,
      tenGod,
      message,
    });

    // Lucky items/colors (i18n)
    const luckyItems = t('daily.luckyItems', { returnObjects: true }) as string[];
    const luckyColors = t('daily.luckyColors', { returnObjects: true }) as string[];

    setDailyFortune({
      date: today,
      _cacheKey: cacheKey,
      overallScore,
      headline: `${todaySaju.dayStemHanja}${todaySaju.dayBranchHanja} · ${tenGod}`,
      summary,
      luckyItem: luckyItems[h2 % luckyItems.length],
      luckyColor: luckyColors[h3 % luckyColors.length],
      luckyNumber: 1 + (h4 % 45),
    });
  }, [user?.birthYear, user?.birthMonth, user?.birthDay, user?.birthHour, t]);

  useEffect(() => {
    generate();
  }, [generate]);

  return { dailyFortune, refresh: generate };
}
