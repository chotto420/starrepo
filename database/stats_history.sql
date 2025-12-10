-- 急上昇ランキング用の履歴テーブル
-- Run this SQL in Supabase SQL Editor

-- ============================================
-- PLACE_STATS_HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS place_stats_history (
    id BIGSERIAL PRIMARY KEY,
    place_id BIGINT NOT NULL,
    visit_count BIGINT,
    favorite_count BIGINT,
    playing INTEGER,
    like_count BIGINT,
    recorded_at DATE DEFAULT CURRENT_DATE,
    UNIQUE(place_id, recorded_at) -- 1日1レコード
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_stats_history_place_id 
ON place_stats_history(place_id);

CREATE INDEX IF NOT EXISTS idx_stats_history_recorded_at 
ON place_stats_history(recorded_at);

CREATE INDEX IF NOT EXISTS idx_stats_history_place_date 
ON place_stats_history(place_id, recorded_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE place_stats_history ENABLE ROW LEVEL SECURITY;

-- 全員が閲覧可能（ランキング用）
CREATE POLICY "Anyone can view stats history"
ON place_stats_history
FOR SELECT
USING (true);

-- サービスロールのみ挿入可能
CREATE POLICY "Service role can insert stats"
ON place_stats_history
FOR INSERT
WITH CHECK (true);
