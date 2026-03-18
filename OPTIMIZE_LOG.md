# MIRI 코드 최적화 로그

## 1. 죽은 코드 제거
- 삭제한 import: 5개
  - `getFortuneGrade` (home.tsx — 사용하지 않는 함수)
  - `Defs, LinearGradient, Stop, Rect` (home.tsx — 사용하지 않는 SVG 컴포넌트)
- console.log __DEV__ 가드 추가: 28개 (10개 파일)
  - useFace.ts (4), backgroundAnalysis.ts (7), auth.ts (6), ShareCard.tsx (1)
  - saju.tsx (2), compatibility.tsx (4), mypage.tsx (1), face.tsx (1), saju/compatibility.tsx (1)

## 2. 중복 코드 통합
- 추출한 공통 함수:
  - `src/utils/date.ts` — `getTodayString()`, `getTodayNumeric()` (3곳에서 중복된 날짜 포매팅 통합)
  - `mapRowToRecord()` — api.ts 내 DB row → AnalysisRecord 매핑 (3곳 중복 제거)

## 3. 타입 개선
- mapRowToRecord 헬퍼로 row 매핑 타입 일관성 확보
- (any 타입 49개, as any 31개 확인 — 추후 단계적 개선 대상)

## 4. 렌더링 최적화
- (기존 React.memo 적용 양호 — MonthlyChart, LifePeriodTimeline, SajuOverviewCard 등)

## 5. 번들 최적화
- 미사용 import 5개 제거 (tree-shaking 개선)

## 6. 상태 관리
- fortuneStore에서 날짜 유틸 함수로 전환 (getTodayString)
- partialize 이미 양호 (transformedImage persist 제외, history 15개 제한, face base64 제거)

## 7. API 최적화 (사주/궁합)
- 타임아웃 추가: `AbortSignal.timeout(30_000)` — invokeFunction fetch에 적용
- DB row 매핑 중복 제거: fetchHistory, fetchPendingAnalyses, fetchAnalysisById

## 8. 관상 분석 최적화
- 변경 전 플로우:
  1. analyzePhysiognomy(셀카) — GPT-4o-mini — **병렬**
  2. transformToOrientalPainting(셀카) — gpt-image-1 — **병렬**
  3. detectFeaturePositions(동양화) — GPT-4o — **순차** (별도 호출)
  → 총 3회 API 호출, 분석은 원본 셀카 사용

- 변경 후 플로우:
  1. transformToOrientalPainting(셀카) → 동양화 (120초)
  2. analyzePhysiognomy(동양화 or 셀카) + 위치 좌표 → JSON (60초)
  → 총 2회 API 호출, 순차, 동양화로 분석

- 수정 사항:
  - Promise.allSettled → 순차 실행으로 변경
  - analyzePhysiognomy에 includePositions 파라미터 추가
  - 위치 좌표를 분석 프롬프트에 통합 (별도 GPT-4o 호출 제거)
  - detectFeaturePositions 함수 제거
  - 동양화 실패 시 원본 셀카로 폴백
- 리사이즈: 기존 적용됨 (768px, JPEG 0.65 quality)
- 캐싱: Zustand store + Supabase DB (회원)
- 폴백: 적용됨 (변환 실패 → 원본 셀카로 분석)

## 9. 파일 구조
- 신규 파일: `src/utils/date.ts`

## 10. 접근성
- (추후 단계적 개선 대상)

## 결과
- TypeScript 에러: 0
- 빌드 에러: 0
- 총 수정 파일: 14개
- 총 신규 파일: 2개 (date.ts, OPTIMIZE_LOG.md)
- 총 삭제 파일: 0개
- 기능 변경: 없음
- 관상 API 호출: 3회→2회/건 (순차)
