export const CONFIG = {
  // __DEV__일 때만 결제 우회 (프로덕션에서는 항상 false)
  DEV_BYPASS_PAYMENT: __DEV__,
  // true면 API 호출 대신 목 데이터 사용
  USE_MOCK_API: false,
  // 초기 무료 분석 크레딧
  INITIAL_FREE_CREDITS: 0,
} as const;
