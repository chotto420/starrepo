-- Database Performance Optimization
-- Run this SQL in Supabase SQL Editor

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Index for favorite_count (used in filters and sorting)
CREATE INDEX IF NOT EXISTS idx_places_favorite_count 
ON places(favorite_count DESC);

-- Index for visit_count (used in sorting rankings)
CREATE INDEX IF NOT EXISTS idx_places_visit_count 
ON places(visit_count DESC);

-- Index for playing count (used in "Now Playing" ranking)
CREATE INDEX IF NOT EXISTS idx_places_playing 
ON places(playing DESC) 
WHERE playing IS NOT NULL;

-- Index for genre (used in filtering)
CREATE INDEX IF NOT EXISTS idx_places_genre 
ON places(genre);

-- Composite index for genre + favorite_count (optimizes genre filtering with quality filter)
CREATE INDEX IF NOT EXISTS idx_places_genre_favorite 
ON places(genre, favorite_count DESC);

-- Index for last_updated_at (used in home page sorting)
CREATE INDEX IF NOT EXISTS idx_places_last_updated 
ON places(last_updated_at DESC);

-- Index for reviews by place_id (optimizes review lookups)
CREATE INDEX IF NOT EXISTS idx_reviews_place_id 
ON reviews(place_id);

-- ============================================
-- VERIFY INDEXES
-- ============================================

-- Run this to verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('places', 'reviews')
ORDER BY tablename, indexname;

-- ============================================
-- EXPECTED RESULTS
-- ============================================
-- You should see indexes like:
-- - idx_places_favorite_count
-- - idx_places_visit_count
-- - idx_places_playing
-- - idx_places_genre
-- - idx_places_genre_favorite
-- - idx_places_last_updated
-- - idx_reviews_place_id
