-- ═══════════════════════════════════════════════════════════════════════════
--  INTEGRATION KNOWLEDGE — fully type-safe, run this in Supabase SQL editor
--  Uses text for IDs and auth.uid()::text everywhere to avoid operator errors.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.integration_knowledge (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           text        NOT NULL,
  space_id             text,
  connected_by_user_id text        NOT NULL,
  integration_type     text        NOT NULL,
  source_id            text,
  source_url           text,
  title                text        NOT NULL,
  summary              text,
  raw_content          text,
  tags                 text[],
  sentiment            text,
  flagged_action       text,
  metadata             jsonb,
  visibility           text        NOT NULL DEFAULT 'private',
  is_flagged           boolean     NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_integration_knowledge_company  ON public.integration_knowledge (company_id);
CREATE INDEX IF NOT EXISTS idx_integration_knowledge_user     ON public.integration_knowledge (connected_by_user_id);
CREATE INDEX IF NOT EXISTS idx_integration_knowledge_type     ON public.integration_knowledge (integration_type);
CREATE INDEX IF NOT EXISTS idx_integration_knowledge_flagged  ON public.integration_knowledge (is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_integration_knowledge_space    ON public.integration_knowledge (space_id) WHERE space_id IS NOT NULL;

-- RLS
ALTER TABLE public.integration_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_see_own"      ON public.integration_knowledge;
DROP POLICY IF EXISTS "users_see_company"  ON public.integration_knowledge;
DROP POLICY IF EXISTS "users_see_space"    ON public.integration_knowledge;
DROP POLICY IF EXISTS "users_insert_own"   ON public.integration_knowledge;
DROP POLICY IF EXISTS "users_manage_own"   ON public.integration_knowledge;

-- Own records
CREATE POLICY "users_see_own" ON public.integration_knowledge
  FOR SELECT USING (connected_by_user_id = auth.uid()::text);

-- Company-wide records
CREATE POLICY "users_see_company" ON public.integration_knowledge
  FOR SELECT USING (
    visibility = 'company' AND
    company_id::text IN (
      SELECT company_id::text FROM public.profiles WHERE id::text = auth.uid()::text
    )
  );

-- Space records
CREATE POLICY "users_see_space" ON public.integration_knowledge
  FOR SELECT USING (
    visibility = 'space' AND
    space_id::text IN (
      SELECT space_id::text FROM public.clipad_space_members WHERE user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "users_insert_own" ON public.integration_knowledge
  FOR INSERT WITH CHECK (connected_by_user_id = auth.uid()::text);

CREATE POLICY "users_manage_own" ON public.integration_knowledge
  FOR ALL USING (connected_by_user_id = auth.uid()::text);

-- ── Backfill clipad_imported_knowledge visibility columns ─────────────────────
ALTER TABLE public.clipad_imported_knowledge
  ADD COLUMN IF NOT EXISTS connected_by_user_id text,
  ADD COLUMN IF NOT EXISTS visibility           text NOT NULL DEFAULT 'company';

UPDATE public.clipad_imported_knowledge
  SET visibility = 'company'
  WHERE visibility IS NULL OR visibility = '';
