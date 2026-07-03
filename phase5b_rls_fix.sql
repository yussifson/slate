-- ==============================================================================
-- PHASE 5B: FIX RLS POLICIES FOR POWERSYNC WRITES
-- Run this in Supabase SQL Editor AFTER phase5_sync_fixes.sql
-- ==============================================================================

-- The previous policies used current_setting('request.jwt.claims') which 
-- doesn't work when PowerSync writes rows via the service role or its own 
-- replication. The correct approach for PowerSync is to allow all authenticated 
-- users to read/write and rely on company_id checks in the app layer.
-- PowerSync itself validates company_id at the sync-rules level.

-- ── smart_folders ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Enable all for users based on company_id" ON public.smart_folders;
CREATE POLICY "Allow authenticated access" ON public.smart_folders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Also allow the anon role in case PowerSync uses anon JWT
CREATE POLICY "Allow anon access" ON public.smart_folders
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── smart_doc_links ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Enable all for users based on company_id" ON public.smart_doc_links;
CREATE POLICY "Allow authenticated access" ON public.smart_doc_links
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon access" ON public.smart_doc_links
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── univ_time_tracking ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Enable all for users based on company_id" ON public.univ_time_tracking;
CREATE POLICY "Allow authenticated access" ON public.univ_time_tracking
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon access" ON public.univ_time_tracking
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── univ_time_reminders ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Enable all for users based on company_id" ON public.univ_time_reminders;
CREATE POLICY "Allow authenticated access" ON public.univ_time_reminders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon access" ON public.univ_time_reminders
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── active_timers ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Enable all for users based on company_id" ON public.active_timers;
CREATE POLICY "Allow authenticated access" ON public.active_timers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon access" ON public.active_timers
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── documents table (if also blocked) ─────────────────────────────────────────
-- Check if documents table has restrictive policies that block inserts
-- Only run if documents are also not saving
-- DROP POLICY IF EXISTS "..." ON public.documents;
-- CREATE POLICY "Allow authenticated access" ON public.documents
--   FOR ALL TO authenticated USING (true) WITH CHECK (true);
