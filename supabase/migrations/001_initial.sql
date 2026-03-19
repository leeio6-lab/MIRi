-- Myeongri App Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT,
  birth_year INTEGER NOT NULL,
  birth_month INTEGER NOT NULL,
  birth_day INTEGER NOT NULL,
  birth_hour INTEGER DEFAULT 12,
  is_lunar BOOLEAN DEFAULT FALSE,
  gender TEXT CHECK (gender IN ('male', 'female')) NOT NULL,
  locale TEXT DEFAULT 'ko',
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES users(id),
  free_analyses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analysis records
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('saju', 'face', 'compatibility', 'daily')) NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  input_data JSONB,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Face images (temporary storage tracking)
CREATE TABLE IF NOT EXISTS face_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchases
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios', 'android')) NOT NULL,
  receipt_data TEXT,
  is_valid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily fortune cache
CREATE TABLE IF NOT EXISTS daily_fortune_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  birth_key TEXT NOT NULL, -- "YYYY-MM-DD-HH-gender" for caching
  fortune_date DATE NOT NULL,
  locale TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(birth_key, fortune_date, locale)
);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own data
CREATE POLICY users_self ON users FOR ALL USING (auth.uid() = id);

-- Users can read their own analyses
CREATE POLICY analyses_self ON analyses FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own face images
CREATE POLICY face_images_self ON face_images FOR ALL USING (auth.uid() = user_id);

-- Users can read their own purchases
CREATE POLICY purchases_self ON purchases FOR ALL USING (auth.uid() = user_id);

-- Daily fortune cache is readable by all authenticated users
ALTER TABLE daily_fortune_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY daily_cache_read ON daily_fortune_cache FOR SELECT USING (auth.role() = 'authenticated');

-- Auto-delete expired face images (run as cron job)
-- SELECT cron.schedule('cleanup-face-images', '0 3 * * *', $$
--   DELETE FROM face_images WHERE expires_at < NOW();
-- $$);

-- Indexes
CREATE INDEX idx_analyses_user ON analyses(user_id, created_at DESC);
CREATE INDEX idx_daily_cache ON daily_fortune_cache(birth_key, fortune_date, locale);
CREATE INDEX idx_face_images_expiry ON face_images(expires_at);
