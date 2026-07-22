-- Add missing columns for clipad_videos
ALTER TABLE public.clipad_videos ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.clipad_videos ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';
ALTER TABLE public.clipad_videos ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;
ALTER TABLE public.clipad_videos ADD COLUMN IF NOT EXISTS unlock_at TIMESTAMPTZ;

-- Add missing columns for clipad_spaces (frontend expects 'title')
ALTER TABLE public.clipad_spaces ADD COLUMN IF NOT EXISTS title TEXT;
-- Backfill title from name if it exists
UPDATE public.clipad_spaces SET title = name WHERE title IS NULL AND name IS NOT NULL;
