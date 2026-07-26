-- ═══════════════════════════════════════════════════════════════════════════
--  Migration: Integration Visibility Model
--  Adds visibility scoping columns to clipad_integrations so each connection
--  belongs to exactly one of: personal | space | company
--
--  Visibility rules:
--    'personal'  → only the connecting user sees it (connected_by_user_id = auth.uid())
--    'space'     → all members of space_id see it
--    'company'   → all members of company_id see it (admin-level integrations)
-- ═══════════════════════════════════════════════════════════════════════════

-- Add scoping columns to clipad_integrations
ALTER TABLE public.clipad_integrations
  ADD COLUMN IF NOT EXISTS connected_by_user_id  uuid,
  ADD COLUMN IF NOT EXISTS visibility            text NOT NULL DEFAULT 'company',
  ADD COLUMN IF NOT EXISTS space_id             uuid REFERENCES public.clipad_spaces(id) ON DELETE SET NULL;

-- Backfill: all existing records are company-wide (the old default)
UPDATE public.clipad_integrations
  SET visibility = 'company'
  WHERE visibility IS NULL OR visibility = '';

-- Index for fast scoped lookups
CREATE INDEX IF NOT EXISTS idx_clipad_integrations_user    ON public.clipad_integrations (connected_by_user_id);
CREATE INDEX IF NOT EXISTS idx_clipad_integrations_space   ON public.clipad_integrations (space_id) WHERE space_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clipad_integrations_vis     ON public.clipad_integrations (visibility);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- (Enable only if not already enabled — use DO block for idempotency)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'clipad_integrations'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.clipad_integrations ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Drop old catch-all policies if they exist
DROP POLICY IF EXISTS "company_integrations_select" ON public.clipad_integrations;
DROP POLICY IF EXISTS "company_integrations_insert" ON public.clipad_integrations;
DROP POLICY IF EXISTS "company_integrations_update" ON public.clipad_integrations;
DROP POLICY IF EXISTS "company_integrations_delete" ON public.clipad_integrations;

-- SELECT: users can see their own personal integrations + company-wide ones + space ones they belong to
CREATE POLICY "integrations_select" ON public.clipad_integrations
  FOR SELECT USING (
    -- Their own personal integration
    connected_by_user_id = auth.uid()
    OR
    -- Company-wide integration: same company
    (visibility = 'company' AND company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    ))
    OR
    -- Space integration: they are a member of that space
    (visibility = 'space' AND space_id IN (
      SELECT space_id FROM public.clipad_space_members WHERE user_id = auth.uid()
    ))
  );

-- INSERT: any authenticated user can create an integration
CREATE POLICY "integrations_insert" ON public.clipad_integrations
  FOR INSERT WITH CHECK (
    -- Must be in the company
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND
    -- For company-wide integrations, user must be admin or super_admin
    (
      visibility != 'company'
      OR
      (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
    )
  );

-- UPDATE/DELETE: owner, or admin for company/space integrations
CREATE POLICY "integrations_manage" ON public.clipad_integrations
  FOR ALL USING (
    connected_by_user_id = auth.uid()
    OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- ── Also scope clipad_imported_knowledge to match integration visibility ──────
-- Add connected_by_user_id and space_id to clipad_imported_knowledge if not present
ALTER TABLE public.clipad_imported_knowledge
  ADD COLUMN IF NOT EXISTS connected_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS space_id             uuid REFERENCES public.clipad_spaces(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS visibility           text NOT NULL DEFAULT 'company';

-- Backfill visibility
UPDATE public.clipad_imported_knowledge SET visibility = 'company' WHERE visibility IS NULL;

-- Propagate visibility from integration to knowledge items
UPDATE public.clipad_imported_knowledge ik
  SET
    connected_by_user_id = ci.connected_by_user_id,
    space_id             = ci.space_id,
    visibility           = ci.visibility
  FROM public.clipad_integrations ci
  WHERE ik.integration_id = ci.id
    AND ik.connected_by_user_id IS NULL;
