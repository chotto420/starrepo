-- Add average_rating column to places table
ALTER TABLE public.places 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0;

-- Optional: Create index for ranking queries
CREATE INDEX IF NOT EXISTS idx_places_average_rating ON public.places(average_rating DESC);
