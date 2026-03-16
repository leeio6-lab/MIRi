export const CONFIG = {
  // TODO: 앱스토어 출시 시 false로 변경
  DEV_BYPASS_PAYMENT: true,
  // true면 API 호출 대신 목 데이터 사용
  USE_MOCK_API: false,
  // 초기 무료 분석 크레딧
  INITIAL_FREE_CREDITS: 0,
} as const;
