-- ──────────────────────────────────────────────────────────────────
-- CLIPAD V3 — PHASE 1 FOUNDATION MIGRATION
-- Non-Destructive Extension of Existing Schema for Clipad V3
-- ──────────────────────────────────────────────────────────────────

-- 1. V3 Feature Flags Table (Per-Organization / Per-User Flag Storage)
CREATE TABLE IF NOT EXISTS public.clipad_v3_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  flag_key TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT clipad_v3_flags_uniq UNIQUE (company_id, user_id, flag_key)
);

-- 2. Provenance-Aware Knowledge Meta Extension (Non-destructive)
ALTER TABLE public.clipad_imported_knowledge 
  ADD COLUMN IF NOT EXISTS source_type TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_permissions JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS provenance_metadata JSONB DEFAULT '{}'::jsonb;

-- 3. V3 Organizational Memory Table (Personal, Team, Org Memory Tiers)
CREATE TABLE IF NOT EXISTS public.clipad_v3_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  team_space_id UUID REFERENCES public.clipad_spaces(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  memory_tier TEXT NOT NULL CHECK (memory_tier IN ('personal', 'team', 'organizational')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  confidence_score NUMERIC(3,2) DEFAULT 1.00,
  freshness_score NUMERIC(3,2) DEFAULT 1.00,
  source_type TEXT,
  source_id TEXT,
  source_url TEXT,
  permissions_policy JSONB DEFAULT '{"visibility": "inherit"}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. V3 Event Bus / Audit Trail Log Table
CREATE TABLE IF NOT EXISTS public.clipad_v3_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- e.g. 'capture.created', 'knowledge.created', 'decision.detected'
  source_domain TEXT NOT NULL, -- e.g. 'Capture', 'Memory', 'Intelligence'
  payload JSONB DEFAULT '{}'::jsonb,
  trace_id UUID DEFAULT gen_random_uuid(),
  processed_at TIMESTAMPTZ,
  error_log TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Indexes for V3 Queries
CREATE INDEX IF NOT EXISTS idx_clipad_v3_flags_comp ON public.clipad_v3_feature_flags(company_id, flag_key);
CREATE INDEX IF NOT EXISTS idx_clipad_v3_memories_tier ON public.clipad_v3_memories(company_id, memory_tier, is_active);
CREATE INDEX IF NOT EXISTS idx_clipad_v3_events_type ON public.clipad_v3_events(company_id, event_type, created_at DESC);

-- Enable RLS
ALTER TABLE public.clipad_v3_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clipad_v3_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clipad_v3_events ENABLE ROW LEVEL SECURITY;

-- Permissive RLS policies for authenticated tenant users
CREATE POLICY clipad_v3_flags_select ON public.clipad_v3_feature_flags
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY clipad_v3_memories_select ON public.clipad_v3_memories
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY clipad_v3_events_select ON public.clipad_v3_events
  FOR SELECT USING (auth.uid() IS NOT NULL);
