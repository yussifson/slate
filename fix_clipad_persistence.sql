CREATE TABLE IF NOT EXISTS public.clipad_standups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID REFERENCES public.clipad_spaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    workspace_id UUID,
    user_name TEXT,
    today TEXT,
    yesterday TEXT,
    blockers TEXT,
    mood TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clipad_standups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.clipad_standups;
CREATE POLICY "Enable all for authenticated users" ON public.clipad_standups FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure workspace_id is added where requested by frontend
ALTER TABLE public.clipad_videos ADD COLUMN IF NOT EXISTS workspace_id UUID;
ALTER TABLE public.clipad_meeting_records ADD COLUMN IF NOT EXISTS workspace_id UUID;
ALTER TABLE public.clipad_meeting_records ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

ALTER TABLE public.clipad_action_items ADD COLUMN IF NOT EXISTS workspace_id UUID;
ALTER TABLE public.clipad_action_items ADD COLUMN IF NOT EXISTS context TEXT;
ALTER TABLE public.clipad_action_items ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE public.clipad_action_items ADD COLUMN IF NOT EXISTS title TEXT; 

-- Add the new table to the PowerSync publication if not already added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'powersync' AND tablename = 'clipad_standups'
    ) THEN
        ALTER PUBLICATION powersync ADD TABLE public.clipad_standups;
    END IF;
END $$;
