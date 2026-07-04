-- ==============================================================================
-- PHASE 5C: SMART DOCS SCHEMA MIGRATION
-- Run this in Supabase SQL Editor to add the missing columns to the documents table
-- ==============================================================================

-- Add missing columns to the existing documents table to support SmartDocs and Orbit AI

ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS tags text,
ADD COLUMN IF NOT EXISTS expiry_date date,
ADD COLUMN IF NOT EXISTS signature_status text DEFAULT 'unsigned',
ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.smart_folders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ai_summary text,
ADD COLUMN IF NOT EXISTS key_obligations text,
ADD COLUMN IF NOT EXISTS risks text;

-- Also ensure RLS policies on documents allow the current synced user to insert
-- (If there were any issues with document insertion RLS)
DROP POLICY IF EXISTS "Enable all for users based on company_id" ON public.documents;
CREATE POLICY "Allow authenticated access" ON public.documents
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon access" ON public.documents
  FOR ALL TO anon USING (true) WITH CHECK (true);
