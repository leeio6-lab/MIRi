-- 004_server_managed_analysis.sql
-- 서버 기반 분석 라이프사이클 + 회원 전용 데이터 저장

-- 1. analyses 테이블에 status 컬럼 추가
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS status TEXT
  CHECK (status IN ('processing', 'completed', 'failed'))
  DEFAULT 'completed';

-- 기존 레코드 backfill
UPDATE analyses SET status = 'completed' WHERE status IS NULL;

-- 2. processing 상태 폴링용 인덱스
CREATE INDEX IF NOT EXISTS idx_analyses_pending
  ON analyses(user_id, status, created_at DESC)
  WHERE status = 'processing';

-- 3. 비회원(anonymous) 차단: RLS 정책 교체
-- 기존 정책 제거
DROP POLICY IF EXISTS analyses_self ON analyses;

-- 새 정책: 인증된 비익명 사용자만 자신의 analyses 접근 가능
CREATE POLICY analyses_member_only ON analyses FOR ALL
  USING (
    auth.uid() = user_id
    AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE
  )
  WITH CHECK (
    auth.uid() = user_id
    AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE
  );
