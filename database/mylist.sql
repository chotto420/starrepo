-- マイリスト機能のデータベース設計
-- Run this SQL in Supabase SQL Editor

-- ============================================
-- USER_MYLIST TABLE
-- ============================================

-- ユーザーのマイリスト（ブックマーク）を保存するテーブル
CREATE TABLE IF NOT EXISTS user_mylist (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    place_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, place_id) -- 同じゲームを重複して追加できないように
);

-- ============================================
-- INDEXES
-- ============================================

-- ユーザーIDでの検索を高速化
CREATE INDEX IF NOT EXISTS idx_user_mylist_user_id 
ON user_mylist(user_id);

-- Place IDでの検索を高速化（「このゲームを何人がマイリスト登録しているか」を取得する際に使用）
CREATE INDEX IF NOT EXISTS idx_user_mylist_place_id 
ON user_mylist(place_id);

-- 複合インデックス（ユーザーが特定のゲームをマイリストに追加しているか確認）
CREATE INDEX IF NOT EXISTS idx_user_mylist_user_place 
ON user_mylist(user_id, place_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- RLSを有効化
ALTER TABLE user_mylist ENABLE ROW LEVEL SECURITY;

-- 全ユーザーがマイリストデータを閲覧可能（ランキング用）
CREATE POLICY "Anyone can view mylist"
ON user_mylist
FOR SELECT
USING (true);

-- ユーザーは自分のマイリストに追加可能
CREATE POLICY "Users can add to their mylist"
ON user_mylist
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のマイリストから削除可能
CREATE POLICY "Users can remove from their mylist"
ON user_mylist
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- VERIFY TABLE
-- ============================================

-- テーブルとポリシーを確認
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'user_mylist';

SELECT 
    policyname,
    tablename,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'user_mylist';
