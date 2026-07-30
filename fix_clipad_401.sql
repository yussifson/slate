-- =====================================================
-- FIX: CliPad 401 Unauthorized - RLS Policy Overhaul
-- Run this in Supabase SQL Editor
-- =====================================================

-- STEP 1: Ensure helper functions exist and are correct
CREATE OR REPLACE FUNCTION public.is_clipad_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'company_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_clipad_space_member(space_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM clipad_space_members 
    WHERE space_id = space_uuid 
    AND user_id = auth.uid()
  );
$$;

-- STEP 2: Drop ALL existing policies on clipad tables (prevents policy conflicts)
DO $$ 
DECLARE 
    r RECORD;
    t TEXT;
    tables TEXT[] := ARRAY[
      'clipad_spaces', 'clipad_videos', 'clipad_meeting_records', 
      'clipad_space_members', 'clipad_action_items', 'clipad_video_comments',
      'clipad_video_reactions', 'clipad_org_events'
    ];
BEGIN 
    FOREACH t IN ARRAY tables LOOP
        FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public') LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || t; 
        END LOOP;
    END LOOP;
END $$;

-- STEP 3: CLIPAD_SPACES - Open policies for all authenticated users
ALTER TABLE public.clipad_spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clipad_spaces_select" ON public.clipad_spaces
  FOR SELECT TO authenticated USING (
    created_by = auth.uid()
    OR public.is_clipad_space_member(id)
    OR is_private = false
    OR public.is_clipad_admin()
  );

-- KEY FIX: Any authenticated user can create a space (not restricted to created_by check)
CREATE POLICY "clipad_spaces_insert" ON public.clipad_spaces
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "clipad_spaces_update" ON public.clipad_spaces
  FOR UPDATE TO authenticated USING (
    created_by = auth.uid()
    OR public.is_clipad_admin()
  );

CREATE POLICY "clipad_spaces_delete" ON public.clipad_spaces
  FOR DELETE TO authenticated USING (
    created_by = auth.uid()
    OR public.is_clipad_admin()
  );

-- STEP 4: CLIPAD_VIDEOS
ALTER TABLE public.clipad_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clipad_videos_select" ON public.clipad_videos
  FOR SELECT TO authenticated USING (
    creator_id = auth.uid()
    OR public.is_clipad_admin()
    OR EXISTS (
      SELECT 1 FROM clipad_spaces cs
      WHERE cs.id = clipad_videos.space_id
      AND (
        cs.is_private = false
        OR cs.created_by = auth.uid()
        OR public.is_clipad_space_member(cs.id)
      )
    )
  );

CREATE POLICY "clipad_videos_insert" ON public.clipad_videos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "clipad_videos_update" ON public.clipad_videos
  FOR UPDATE TO authenticated USING (
    creator_id = auth.uid()
    OR public.is_clipad_admin()
  );

CREATE POLICY "clipad_videos_delete" ON public.clipad_videos
  FOR DELETE TO authenticated USING (
    creator_id = auth.uid()
    OR public.is_clipad_admin()
  );

-- STEP 5: CLIPAD_MEETING_RECORDS
ALTER TABLE public.clipad_meeting_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clipad_meetings_select" ON public.clipad_meeting_records
  FOR SELECT TO authenticated USING (
    host_id = auth.uid()
    OR public.is_clipad_admin()
    OR EXISTS (
      SELECT 1 FROM clipad_spaces cs
      WHERE cs.id = clipad_meeting_records.space_id
      AND (
        cs.is_private = false
        OR cs.created_by = auth.uid()
        OR public.is_clipad_space_member(cs.id)
      )
    )
  );

CREATE POLICY "clipad_meetings_insert" ON public.clipad_meeting_records
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "clipad_meetings_update" ON public.clipad_meeting_records
  FOR UPDATE TO authenticated USING (
    host_id = auth.uid()
    OR public.is_clipad_admin()
  );

CREATE POLICY "clipad_meetings_delete" ON public.clipad_meeting_records
  FOR DELETE TO authenticated USING (
    host_id = auth.uid()
    OR public.is_clipad_admin()
  );

-- STEP 6: CLIPAD_SPACE_MEMBERS
ALTER TABLE public.clipad_space_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clipad_space_members_select" ON public.clipad_space_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "clipad_space_members_insert" ON public.clipad_space_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "clipad_space_members_delete" ON public.clipad_space_members
  FOR DELETE TO authenticated USING (
    user_id = auth.uid()
    OR public.is_clipad_admin()
  );

-- STEP 7: CLIPAD_ACTION_ITEMS
ALTER TABLE public.clipad_action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clipad_action_items_select" ON public.clipad_action_items
  FOR SELECT TO authenticated USING (
    assigned_to = auth.uid()
    OR public.is_clipad_admin()
    OR EXISTS (
      SELECT 1 FROM clipad_spaces cs
      WHERE cs.id = clipad_action_items.space_id
      AND (cs.created_by = auth.uid() OR public.is_clipad_space_member(cs.id))
    )
  );

CREATE POLICY "clipad_action_items_insert" ON public.clipad_action_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "clipad_action_items_update" ON public.clipad_action_items
  FOR UPDATE TO authenticated USING (
    assigned_to = auth.uid()
    OR public.is_clipad_admin()
  );

CREATE POLICY "clipad_action_items_delete" ON public.clipad_action_items
  FOR DELETE TO authenticated USING (
    assigned_to = auth.uid()
    OR public.is_clipad_admin()
  );

-- STEP 8: CLIPAD_VIDEO_COMMENTS
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clipad_video_comments') THEN
    ALTER TABLE public.clipad_video_comments ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "clipad_video_comments_all" ON public.clipad_video_comments;
    CREATE POLICY "clipad_video_comments_all" ON public.clipad_video_comments
      FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- STEP 9: CLIPAD_VIDEO_REACTIONS
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clipad_video_reactions') THEN
    ALTER TABLE public.clipad_video_reactions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "clipad_video_reactions_all" ON public.clipad_video_reactions;
    CREATE POLICY "clipad_video_reactions_all" ON public.clipad_video_reactions
      FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- STEP 10: CLIPAD_ORG_EVENTS
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clipad_org_events') THEN
    ALTER TABLE public.clipad_org_events ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "clipad_org_events_select" ON public.clipad_org_events;
    DROP POLICY IF EXISTS "clipad_org_events_insert" ON public.clipad_org_events;
    CREATE POLICY "clipad_org_events_select" ON public.clipad_org_events
      FOR SELECT TO authenticated USING (
        workspace_id IN (SELECT company_id::uuid FROM profiles WHERE id = auth.uid())
        OR public.is_clipad_admin()
      );
    CREATE POLICY "clipad_org_events_insert" ON public.clipad_org_events
      FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

SELECT 'CliPad RLS policies updated successfully! All authenticated users can now use CliPad features.' AS status;
