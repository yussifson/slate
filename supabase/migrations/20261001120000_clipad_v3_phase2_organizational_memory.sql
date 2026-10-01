-- ──────────────────────────────────────────────────────────────────
-- CLIPAD V3 — PHASE 2 ORGANIZATIONAL MEMORY & INTELLIGENCE MIGRATION
-- Non-Destructive Extension for Organizational Memory Core & Graph Entities
-- ──────────────────────────────────────────────────────────────────

-- 1. Extend clipad_v3_memories with Taxonomy, Lifecycle, & Provenance
ALTER TABLE public.clipad_v3_memories
  ADD COLUMN IF NOT EXISTS memory_type TEXT DEFAULT 'FACT',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS importance NUMERIC(3,2) DEFAULT 0.50,
  ADD COLUMN IF NOT EXISTS superseded_by UUID REFERENCES public.clipad_v3_memories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS speaker_id TEXT,
  ADD COLUMN IF NOT EXISTS speaker_name TEXT,
  ADD COLUMN IF NOT EXISTS timestamp_marker TEXT;

-- Status constraint check
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clipad_v3_memories_status_check'
  ) THEN
    ALTER TABLE public.clipad_v3_memories
      ADD CONSTRAINT clipad_v3_memories_status_check
      CHECK (status IN ('ACTIVE', 'OUTDATED', 'SUPERSEDED', 'ARCHIVED', 'DELETED'));
  END IF;
END $$;

-- 2. V3 Normalized Organizational Entities Table
CREATE TABLE IF NOT EXISTS public.clipad_v3_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (
    entity_type IN ('person', 'organization', 'team', 'space', 'project', 'meeting', 'conversation', 'document', 'knowledge', 'decision', 'commitment', 'task', 'event', 'memory')
  ),
  entity_id TEXT, -- Mapped external or existing internal record ID
  name TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT clipad_v3_entity_uniq UNIQUE (company_id, entity_type, entity_id)
);

-- 3. V3 Graph-Ready Entity Relationships Table
CREATE TABLE IF NOT EXISTS public.clipad_v3_entity_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  source_entity_id UUID REFERENCES public.clipad_v3_entities(id) ON DELETE CASCADE,
  target_entity_id UUID REFERENCES public.clipad_v3_entities(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (
    relationship_type IN ('member_of', 'participated_in', 'belongs_to', 'produced', 'creates', 'relates_to', 'derived_from', 'concerns', 'supersedes')
  ),
  confidence NUMERIC(3,2) DEFAULT 1.00,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT clipad_v3_rel_uniq UNIQUE (source_entity_id, target_entity_id, relationship_type)
);

-- Indexes for memory search and graph queries
CREATE INDEX IF NOT EXISTS idx_clipad_v3_memories_status ON public.clipad_v3_memories(company_id, status, memory_tier);
CREATE INDEX IF NOT EXISTS idx_clipad_v3_memories_type ON public.clipad_v3_memories(company_id, memory_type);
CREATE INDEX IF NOT EXISTS idx_clipad_v3_entities_comp ON public.clipad_v3_entities(company_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_clipad_v3_rels_source ON public.clipad_v3_entity_relationships(company_id, source_entity_id);
CREATE INDEX IF NOT EXISTS idx_clipad_v3_rels_target ON public.clipad_v3_entity_relationships(company_id, target_entity_id);

-- Enable RLS
ALTER TABLE public.clipad_v3_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clipad_v3_entity_relationships ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Entities & Relationships
DROP POLICY IF EXISTS clipad_v3_entities_select ON public.clipad_v3_entities;
DROP POLICY IF EXISTS clipad_v3_entities_insert ON public.clipad_v3_entities;
DROP POLICY IF EXISTS clipad_v3_entities_update ON public.clipad_v3_entities;
DROP POLICY IF EXISTS clipad_v3_entities_delete ON public.clipad_v3_entities;

CREATE POLICY clipad_v3_entities_select ON public.clipad_v3_entities
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY clipad_v3_entities_insert ON public.clipad_v3_entities
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY clipad_v3_entities_update ON public.clipad_v3_entities
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY clipad_v3_entities_delete ON public.clipad_v3_entities
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

DROP POLICY IF EXISTS clipad_v3_rels_select ON public.clipad_v3_entity_relationships;
DROP POLICY IF EXISTS clipad_v3_rels_insert ON public.clipad_v3_entity_relationships;
DROP POLICY IF EXISTS clipad_v3_rels_update ON public.clipad_v3_entity_relationships;
DROP POLICY IF EXISTS clipad_v3_rels_delete ON public.clipad_v3_entity_relationships;

CREATE POLICY clipad_v3_rels_select ON public.clipad_v3_entity_relationships
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY clipad_v3_rels_insert ON public.clipad_v3_entity_relationships
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY clipad_v3_rels_update ON public.clipad_v3_entity_relationships
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY clipad_v3_rels_delete ON public.clipad_v3_entity_relationships
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );
