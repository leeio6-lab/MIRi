-- Add indexes for purchase lookups
CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_product ON purchases(product_id);
