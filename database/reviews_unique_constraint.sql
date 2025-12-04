-- レビューテーブルにユニーク制約を追加
-- ユーザーは1つのゲームに対して1つのレビューのみ投稿可能

-- 既存の重複レビューを削除（最新のものを残す）
DELETE FROM reviews a USING (
  SELECT MIN(id) as id, user_id, place_id 
  FROM reviews 
  GROUP BY user_id, place_id 
  HAVING COUNT(*) > 1
) b
WHERE a.user_id = b.user_id 
  AND a.place_id = b.place_id 
  AND a.id != b.id;

-- ユニーク制約を追加
ALTER TABLE reviews 
ADD CONSTRAINT reviews_user_place_unique 
UNIQUE (user_id, place_id);
