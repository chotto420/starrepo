-- 外部キー制約の追加
-- Run this SQL in Supabase SQL Editor

-- ============================================
-- ADD FOREIGN KEY TO REVIEWS
-- ============================================

-- reviewsテーブルのplace_idがplacesテーブルのplace_idを参照するように設定
-- これにより、Supabaseクライアントで `places:place_id` のような結合が可能になります

ALTER TABLE reviews
ADD CONSTRAINT fk_reviews_places
FOREIGN KEY (place_id)
REFERENCES places(place_id)
ON DELETE CASCADE; -- ゲームが削除されたらレビューも削除

-- ============================================
-- VERIFY
-- ============================================

SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS foreign_table_name
FROM 
    pg_constraint 
WHERE 
    conname = 'fk_reviews_places';
