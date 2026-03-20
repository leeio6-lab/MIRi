export const CONFIG = {
  // __DEV__ 환경에서만 결제 우회 (프로덕션 빌드에서는 항상 false)
  DEV_BYPASS_PAYMENT: typeof __DEV__ !== 'undefined' && __DEV__,
  // true면 API 호출 대신 목 데이터 사용
  USE_MOCK_API: false,
  // 초기 무료 분석 크레딧 (첫 사용자 체험용)
  INITIAL_FREE_CREDITS: 1,
} as const;
