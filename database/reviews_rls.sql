-- レビューテーブルのRLS設定
-- Run this SQL in Supabase SQL Editor

-- ============================================
-- REVIEWS TABLE RLS
-- ============================================

-- RLSを有効化（念のため）
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（重複エラー防止）
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
DROP POLICY IF EXISTS "Users can create their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;

-- 1. 誰でもレビューを閲覧可能
CREATE POLICY "Reviews are viewable by everyone"
ON reviews
FOR SELECT
USING (true);

-- 2. ログインユーザーは自分のレビューを作成可能
CREATE POLICY "Users can create their own reviews"
ON reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. ログインユーザーは自分のレビューを更新可能
CREATE POLICY "Users can update their own reviews"
ON reviews
FOR UPDATE
USING (auth.uid() = user_id);

-- 4. ログインユーザーは自分のレビューを削除可能
CREATE POLICY "Users can delete their own reviews"
ON reviews
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- VERIFY
-- ============================================

SELECT 
    policyname,
    tablename,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'reviews';
