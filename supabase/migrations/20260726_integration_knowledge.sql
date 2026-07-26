-- ═══════════════════════════════════════════════════════════════════════════
--  Migration: Integration Knowledge table (FIXED - type-safe version)
--  Does NOT reference public.companies (may not exist).
--  connected_by_user_id and company_id are both uuid.
--  profiles.company_id is TEXT so comparisons cast uuid → text.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.integration_knowledge (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- company_id stored as text to match profiles.company_id type
  company_id           text        NOT NULL,
  space_id             uuid        REFERENCES public.clipad_spaces(id) ON DELETE SET NULL,
  connected_by_user_id uuid        NOT NULL,
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
DROP POLICY IF EXISTS "users_insert_own"   ON public.integration_knowledge;
DROP POLICY IF EXISTS "users_manage_own"   ON public.integration_knowledge;

-- Own records (connected_by_user_id is uuid, auth.uid() is uuid — safe)
CREATE POLICY "users_see_own" ON public.integration_knowledge
  FOR SELECT USING (connected_by_user_id = auth.uid());

-- Company-wide records
-- company_id here is TEXT (matching profiles.company_id which is TEXT)
CREATE POLICY "users_see_company" ON public.integration_knowledge
  FOR SELECT USING (
    visibility = 'company' AND
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Space records
CREATE POLICY "users_see_space" ON public.integration_knowledge
  FOR SELECT USING (
    visibility = 'space' AND
    space_id IN (
      SELECT space_id FROM public.clipad_space_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "users_insert_own" ON public.integration_knowledge
  FOR INSERT WITH CHECK (connected_by_user_id = auth.uid());

CREATE POLICY "users_manage_own" ON public.integration_knowledge
  FOR ALL USING (connected_by_user_id = auth.uid());

-- ── Backfill clipad_imported_knowledge visibility columns ─────────────────────
-- (safe to run even if columns already exist from the other migration)
ALTER TABLE public.clipad_imported_knowledge
  ADD COLUMN IF NOT EXISTS connected_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS visibility           text NOT NULL DEFAULT 'company';

UPDATE public.clipad_imported_knowledge
  SET visibility = 'company'
  WHERE visibility IS NULL OR visibility = '';
