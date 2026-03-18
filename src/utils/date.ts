/** 오늘 날짜를 YYYY-MM-DD 문자열로 반환 */
export function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 오늘 날짜를 YYYYMMDD 숫자로 반환 */
export function getTodayNumeric(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}
