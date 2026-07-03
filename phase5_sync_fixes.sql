-- ==============================================================================
-- PHASE 5 SYNC FIXES MIGRATION
-- Fixes permanent data saving issues for Time Tracking, Smart Docs, and AI 
-- ==============================================================================

-- 1. Create Time Tracking Tables
CREATE TABLE IF NOT EXISTS public.univ_time_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id TEXT,
    user_id TEXT,
    project_id TEXT,
    task_id TEXT,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    billable INTEGER DEFAULT 0,
    hourly_rate REAL,
    total_amount REAL,
    status TEXT,
    tags TEXT,
    currency TEXT DEFAULT 'USD'
);

CREATE TABLE IF NOT EXISTS public.univ_time_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id TEXT,
    user_id TEXT,
    reminder_time TIMESTAMP WITH TIME ZONE,
    message TEXT,
    status TEXT
);

CREATE TABLE IF NOT EXISTS public.active_timers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id TEXT,
    user_id TEXT,
    project_id TEXT,
    task_id TEXT,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE
);

-- 2. Create Smart Docs Tables
CREATE TABLE IF NOT EXISTS public.smart_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id TEXT,
    name TEXT,
    parent_id TEXT,
    color TEXT
);

CREATE TABLE IF NOT EXISTS public.smart_doc_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id TEXT,
    document_id TEXT,
    entity_type TEXT,
    entity_id TEXT,
    relationship TEXT
);

-- 3. Alter Documents table to add SmartDocs/AI features
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS key_obligations TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS risks TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS expiry_date TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS signature_status TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS folder_id TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS tags TEXT;

-- 4. Enable Row Level Security (RLS) on new tables
ALTER TABLE public.univ_time_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_time_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_doc_links ENABLE ROW LEVEL SECURITY;

-- 5. Add universal read/write policies for company-scoped data
-- We use WITH CHECK to explicitly allow inserts

-- univ_time_tracking
DROP POLICY IF EXISTS "Enable all for users based on company_id" ON public.univ_time_tracking;
CREATE POLICY "Enable all for users based on company_id" ON public.univ_time_tracking
    AS PERMISSIVE FOR ALL TO public
    USING (company_id = current_setting('request.jwt.claims', true)::json->>'company_id')
    WITH CHECK (company_id = current_setting('request.jwt.claims', true)::json->>'company_id');

-- univ_time_reminders
DROP POLICY IF EXISTS "Enable all for users based on company_id" ON public.univ_time_reminders;
CREATE POLICY "Enable all for users based on company_id" ON public.univ_time_reminders
    AS PERMISSIVE FOR ALL TO public
    USING (company_id = current_setting('request.jwt.claims', true)::json->>'company_id')
    WITH CHECK (company_id = current_setting('request.jwt.claims', true)::json->>'company_id');

-- active_timers
DROP POLICY IF EXISTS "Enable all for users based on company_id" ON public.active_timers;
CREATE POLICY "Enable all for users based on company_id" ON public.active_timers
    AS PERMISSIVE FOR ALL TO public
    USING (company_id = current_setting('request.jwt.claims', true)::json->>'company_id')
    WITH CHECK (company_id = current_setting('request.jwt.claims', true)::json->>'company_id');

-- smart_folders
DROP POLICY IF EXISTS "Enable all for users based on company_id" ON public.smart_folders;
CREATE POLICY "Enable all for users based on company_id" ON public.smart_folders
    AS PERMISSIVE FOR ALL TO public
    USING (company_id = current_setting('request.jwt.claims', true)::json->>'company_id')
    WITH CHECK (company_id = current_setting('request.jwt.claims', true)::json->>'company_id');

-- smart_doc_links
DROP POLICY IF EXISTS "Enable all for users based on company_id" ON public.smart_doc_links;
CREATE POLICY "Enable all for users based on company_id" ON public.smart_doc_links
    AS PERMISSIVE FOR ALL TO public
    USING (company_id = current_setting('request.jwt.claims', true)::json->>'company_id')
    WITH CHECK (company_id = current_setting('request.jwt.claims', true)::json->>'company_id');

-- 6. Add Tables to PowerSync Publication
-- Wrapped in a DO block to prevent errors if already added
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE public.univ_time_tracking;
    EXCEPTION WHEN duplicate_object THEN END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE public.univ_time_reminders;
    EXCEPTION WHEN duplicate_object THEN END;

    BEGIN
        ALTER PUBLICATION powersync ADD TABLE public.active_timers;
    EXCEPTION WHEN duplicate_object THEN END;

    BEGIN
        ALTER PUBLICATION powersync ADD TABLE public.smart_folders;
    EXCEPTION WHEN duplicate_object THEN END;

    BEGIN
        ALTER PUBLICATION powersync ADD TABLE public.smart_doc_links;
    EXCEPTION WHEN duplicate_object THEN END;
END $$;

