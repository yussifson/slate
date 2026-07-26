-- Migration: Integration Knowledge table for AI-ingested third-party data
-- Supports role-level visibility scoping for privacy isolation

CREATE TABLE IF NOT EXISTS public.integration_knowledge (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  space_id            uuid REFERENCES public.clipad_spaces(id) ON DELETE SET NULL,
  connected_by_user_id uuid NOT NULL,
  integration_type    text NOT NULL, -- 'github', 'gmail', 'notion', 'jira', 'gdrive', 'slack', 'linear', 'trello'
  source_id           text,          -- external record ID (e.g. GitHub issue #123, Gmail thread ID)
  source_url          text,          -- direct link to the source record
  title               text NOT NULL,
  summary             text,          -- AI-generated 1-3 sentence summary
  raw_content         text,          -- original content (truncated at 5000 chars)
  tags                text[],        -- AI-extracted labels/topics
  sentiment           text,          -- 'positive' | 'neutral' | 'negative' | 'urgent'
  flagged_action      text,          -- AI-detected required action (e.g. 'resolve_issue', 'reply_email')
  metadata            jsonb,         -- source-specific fields: assignee, labels, status, due_date, etc.
  visibility          text NOT NULL DEFAULT 'private', -- 'private' | 'space' | 'company'
  is_flagged          boolean NOT NULL DEFAULT false,  -- true = surfaces as Action Item
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Index for fast per-user and per-company lookups
CREATE INDEX IF NOT EXISTS idx_integration_knowledge_company   ON public.integration_knowledge (company_id);
CREATE INDEX IF NOT EXISTS idx_integration_knowledge_user      ON public.integration_knowledge (connected_by_user_id);
CREATE INDEX IF NOT EXISTS idx_integration_knowledge_type      ON public.integration_knowledge (integration_type);
CREATE INDEX IF NOT EXISTS idx_integration_knowledge_flagged   ON public.integration_knowledge (is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_integration_knowledge_space     ON public.integration_knowledge (space_id) WHERE space_id IS NOT NULL;

-- Row Level Security
ALTER TABLE public.integration_knowledge ENABLE ROW LEVEL SECURITY;

-- Users can see their own private records
CREATE POLICY "users_see_own" ON public.integration_knowledge
  FOR SELECT USING (connected_by_user_id = auth.uid());

-- Users can see company-wide records if they are in the same company
CREATE POLICY "users_see_company" ON public.integration_knowledge
  FOR SELECT USING (
    visibility = 'company' AND
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Users can insert their own records
CREATE POLICY "users_insert_own" ON public.integration_knowledge
  FOR INSERT WITH CHECK (connected_by_user_id = auth.uid());

-- Users can update/delete their own records
CREATE POLICY "users_manage_own" ON public.integration_knowledge
  FOR ALL USING (connected_by_user_id = auth.uid());

-- Also add visibility + connected_by_user_id columns to clipad_imported_knowledge (if not already present)
-- These make the existing knowledge privacy-aware without a full migration
ALTER TABLE public.clipad_imported_knowledge 
  ADD COLUMN IF NOT EXISTS connected_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'company';

-- Update existing records to be company-visible (safe default for existing data)
UPDATE public.clipad_imported_knowledge 
  SET visibility = 'company' 
  WHERE visibility IS NULL OR visibility = '';
