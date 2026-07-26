-- ═══════════════════════════════════════════════════════════════════════════
--  Migration: Integration Visibility Model (FIXED - type-safe version)
--  profiles.company_id is TEXT, clipad_integrations.company_id is UUID.
--  All comparisons use explicit ::text or ::uuid casts where needed.
-- ═══════════════════════════════════════════════════════════════════════════

-- Add scoping columns to clipad_integrations (idempotent)
ALTER TABLE public.clipad_integrations
  ADD COLUMN IF NOT EXISTS connected_by_user_id  uuid,
  ADD COLUMN IF NOT EXISTS visibility            text NOT NULL DEFAULT 'company',
  ADD COLUMN IF NOT EXISTS space_id             uuid REFERENCES public.clipad_spaces(id) ON DELETE SET NULL;

-- Backfill: all existing records become company-wide
UPDATE public.clipad_integrations
  SET visibility = 'company'
  WHERE visibility IS NULL OR visibility = '';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clipad_integrations_user    ON public.clipad_integrations (connected_by_user_id);
CREATE INDEX IF NOT EXISTS idx_clipad_integrations_space   ON public.clipad_integrations (space_id) WHERE space_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clipad_integrations_vis     ON public.clipad_integrations (visibility);

-- ── Enable RLS (idempotent) ────────────────────────────────────────────────────
ALTER TABLE public.clipad_integrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate cleanly
DROP POLICY IF EXISTS "company_integrations_select"  ON public.clipad_integrations;
DROP POLICY IF EXISTS "company_integrations_insert"  ON public.clipad_integrations;
DROP POLICY IF EXISTS "company_integrations_update"  ON public.clipad_integrations;
DROP POLICY IF EXISTS "company_integrations_delete"  ON public.clipad_integrations;
DROP POLICY IF EXISTS "integrations_select"          ON public.clipad_integrations;
DROP POLICY IF EXISTS "integrations_insert"          ON public.clipad_integrations;
DROP POLICY IF EXISTS "integrations_manage"          ON public.clipad_integrations;

-- ── SELECT policy ─────────────────────────────────────────────────────────────
-- NOTE: profiles.company_id is TEXT; clipad_integrations.company_id is UUID.
-- Cast to text for comparison: company_id::text = profiles.company_id
CREATE POLICY "integrations_select" ON public.clipad_integrations
  FOR SELECT USING (
    -- Personal: connecting user can always see their own
    connected_by_user_id = auth.uid()
    OR
    -- Company-wide: same company (cast uuid → text to match profiles.company_id type)
    (visibility = 'company' AND company_id::text IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    ))
    OR
    -- Space: member of that space (clipad_space_members.user_id is uuid)
    (visibility = 'space' AND space_id IN (
      SELECT space_id FROM public.clipad_space_members WHERE user_id = auth.uid()
    ))
  );

-- ── INSERT policy ─────────────────────────────────────────────────────────────
CREATE POLICY "integrations_insert" ON public.clipad_integrations
  FOR INSERT WITH CHECK (
    -- Must belong to the company
    company_id::text IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND
    -- Only admins can create company-wide integrations
    (
      visibility != 'company'
      OR
      (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
    )
  );

-- ── MANAGE policy (update / delete) ───────────────────────────────────────────
CREATE POLICY "integrations_manage" ON public.clipad_integrations
  FOR ALL USING (
    -- Owner can always manage their own
    connected_by_user_id = auth.uid()
    OR
    -- Admins can manage anything in their company
    (
      company_id::text IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
      AND
      (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
    )
  );

-- ── Scope clipad_imported_knowledge to match integration visibility ────────────
ALTER TABLE public.clipad_imported_knowledge
  ADD COLUMN IF NOT EXISTS connected_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS space_id             uuid REFERENCES public.clipad_spaces(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS visibility           text NOT NULL DEFAULT 'company';

-- Backfill
UPDATE public.clipad_imported_knowledge SET visibility = 'company' WHERE visibility IS NULL;

-- Propagate visibility from parent integration
UPDATE public.clipad_imported_knowledge ik
  SET
    connected_by_user_id = ci.connected_by_user_id,
    space_id             = ci.space_id,
    visibility           = ci.visibility
  FROM public.clipad_integrations ci
  WHERE ik.integration_id = ci.id
    AND ik.connected_by_user_id IS NULL;
