// ============================================================
// 지역시(眞太陽時) 보정 유틸리티
//
// 사주 계산에서 출생 시간을 태양시(true solar time)로 보정합니다.
// 각 시간대의 표준 경선(standard meridian)과 실제 출생지 경도의
// 차이를 이용하여 보정 시간을 계산합니다.
//
// 공식: (출생지 경도 - 표준 경선) × 4분/도
// 표준 경선 = UTC 오프셋 × 15°
//
// 예시: 서울 (경도 127°E, UTC+9, 표준경선 135°E)
//   (127 - 135) × 4 = -32분
//   → 시계 시간보다 태양시가 32분 느림
// ============================================================

/**
 * Calculate solar time correction in minutes
 *
 * @param longitude  Birth city longitude (positive = East, negative = West)
 * @param utcOffset  UTC offset in hours (e.g., 9 for KST, -5 for EST)
 * @returns Correction in minutes (negative = solar time is behind clock time)
 *
 * Example: Seoul (127°E, UTC+9, standard meridian = 135°E)
 *   (127 - 135) × 4 = -32 minutes
 */
export function getSolarTimeCorrection(longitude: number, utcOffset: number): number {
  const standardMeridian = utcOffset * 15;
  return (longitude - standardMeridian) * 4;
}

/**
 * Apply solar time correction to birth hour and minute
 *
 * Returns the corrected hour (0-23) and corrected minute (0-59).
 * If the correction crosses a day boundary, the hour wraps accordingly
 * (the caller should adjust the date if needed).
 *
 * @param birthHour   Birth hour in 24h format (0-23)
 * @param birthMinute Birth minute (0-59)
 * @param longitude   Birth city longitude
 * @param utcOffset   UTC offset in hours
 * @returns Object with corrected hour, minute, correction amount, and day offset
 */
export function applySolarTimeCorrection(
  birthHour: number,
  birthMinute: number,
  longitude: number,
  utcOffset: number
): {
  correctedHour: number;
  correctedMinute: number;
  correctionMinutes: number;
  dayOffset: number;
} {
  const correctionMinutes = Math.round(getSolarTimeCorrection(longitude, utcOffset));

  let totalMinutes = birthHour * 60 + birthMinute + correctionMinutes;

  // Calculate day offset (how many days to shift)
  let dayOffset = 0;
  while (totalMinutes < 0) {
    totalMinutes += 24 * 60;
    dayOffset -= 1;
  }
  while (totalMinutes >= 24 * 60) {
    totalMinutes -= 24 * 60;
    dayOffset += 1;
  }

  const correctedHour = Math.floor(totalMinutes / 60);
  const correctedMinute = totalMinutes % 60;

  return {
    correctedHour,
    correctedMinute,
    correctionMinutes,
    dayOffset,
  };
}

/**
 * Format correction minutes as a display string
 * e.g., -32 → "-32분", +18 → "+18분"
 */
export function formatCorrectionMinutes(minutes: number): string {
  const rounded = Math.round(minutes);
  const sign = rounded >= 0 ? '+' : '';
  return `${sign}${rounded}분`;
}
