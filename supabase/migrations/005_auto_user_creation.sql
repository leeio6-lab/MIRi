-- 005: auth.users → public.users 자동 생성 트리거
-- 소셜 로그인/게스트 로그인 시 public.users 자동 생성
-- 이 트리거가 없으면 onboarding 전 분석 기록이 저장 안 됨

-- 1. 함수: 새 auth 사용자 생성 시 public.users에 기본 행 삽입
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, birth_year, birth_month, birth_day, gender, locale)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    1990, -- 기본값 (온보딩에서 업데이트)
    1,
    1,
    'male',
    COALESCE(NEW.raw_user_meta_data->>'locale', 'ko')
  )
  ON CONFLICT (id) DO NOTHING; -- 이미 존재하면 스킵
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 트리거: auth.users INSERT 시 실행
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. 기존 auth 사용자 중 public.users에 없는 사용자 백필
INSERT INTO public.users (id, email, name, birth_year, birth_month, birth_day, gender, locale)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', au.raw_user_meta_data->>'full_name', ''),
  1990, 1, 1, 'male', 'ko'
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;
