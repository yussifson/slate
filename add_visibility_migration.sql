-- Migration to add visibility to videos and meeting records
-- Run this in your Supabase SQL Editor

ALTER TABLE public.clipad_videos
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'internal';

ALTER TABLE public.clipad_meeting_records
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'internal';
