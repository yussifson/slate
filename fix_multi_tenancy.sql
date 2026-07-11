-- 0. RE-CREATE MISSING HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_clipad_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_clipad_space_member(space_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM clipad_space_members 
    WHERE space_id = space_uuid 
    AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT p.company_id::text FROM public.profiles p WHERE p.id = auth.uid();
$$;

-- 1. DROP ALL EXISTING POLICIES TO PREVENT LEAKS
DO $$ 
DECLARE 
    r RECORD;
    t TEXT;
    tables TEXT[] := ARRAY['clipad_spaces', 'clipad_videos', 'clipad_meeting_records', 'clipad_space_members', 'clipad_action_items', 'clipad_video_comments', 'clipad_video_reactions'];
BEGIN 
    FOREACH t IN ARRAY tables LOOP
        FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public') LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || t; 
        END LOOP;
    END LOOP;
END $$;

-- 2. RE-APPLY STRICT MULTI-TENANT POLICIES

-- === SPACES ===
CREATE POLICY "clipad_spaces_select" ON public.clipad_spaces
  FOR SELECT USING (
    (
      company_id::text = public.get_user_company_id() OR 
      created_by IN (SELECT id FROM profiles WHERE company_id::text = public.get_user_company_id())
    )
    AND (
      is_private = false 
      OR created_by = auth.uid() 
      OR public.is_clipad_space_member(id)
    )
  );

CREATE POLICY "clipad_spaces_insert" ON public.clipad_spaces
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "clipad_spaces_update" ON public.clipad_spaces
  FOR UPDATE USING (
    (company_id::text = public.get_user_company_id() OR created_by IN (SELECT id FROM profiles WHERE company_id::text = public.get_user_company_id()))
    AND (created_by = auth.uid() OR public.is_clipad_admin())
  );

CREATE POLICY "clipad_spaces_delete" ON public.clipad_spaces
  FOR DELETE USING (
    (company_id::text = public.get_user_company_id() OR created_by IN (SELECT id FROM profiles WHERE company_id::text = public.get_user_company_id()))
    AND (created_by = auth.uid() OR public.is_clipad_admin())
  );

-- === SPACE MEMBERS ===
CREATE POLICY "clipad_space_members_select" ON public.clipad_space_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clipad_spaces cs 
      WHERE cs.id = clipad_space_members.space_id 
      AND (cs.company_id::text = public.get_user_company_id() OR cs.created_by IN (SELECT id FROM profiles WHERE company_id::text = public.get_user_company_id()))
    )
  );

CREATE POLICY "clipad_space_members_insert" ON public.clipad_space_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clipad_spaces cs 
      WHERE cs.id = clipad_space_members.space_id 
      AND (cs.company_id::text = public.get_user_company_id() OR cs.created_by IN (SELECT id FROM profiles WHERE company_id::text = public.get_user_company_id()))
    )
  );

CREATE POLICY "clipad_space_members_delete" ON public.clipad_space_members
  FOR DELETE USING (
    user_id = auth.uid() OR public.is_clipad_admin()
  );

-- === VIDEOS ===
CREATE POLICY "clipad_videos_select" ON public.clipad_videos
  FOR SELECT USING (
    creator_id IN (SELECT id FROM profiles WHERE company_id::text = public.get_user_company_id())
    OR EXISTS (
      SELECT 1 FROM clipad_spaces cs
      WHERE cs.id = clipad_videos.space_id
      AND (cs.company_id::text = public.get_user_company_id() OR cs.created_by IN (SELECT id FROM profiles WHERE company_id::text = public.get_user_company_id()))
    )
  );

CREATE POLICY "clipad_videos_insert" ON public.clipad_videos
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "clipad_videos_update" ON public.clipad_videos
  FOR UPDATE USING (
    creator_id = auth.uid() OR public.is_clipad_admin()
  );

CREATE POLICY "clipad_videos_delete" ON public.clipad_videos
  FOR DELETE USING (
    creator_id = auth.uid() OR public.is_clipad_admin()
  );

-- === MEETING RECORDS ===
CREATE POLICY "clipad_meetings_select" ON public.clipad_meeting_records
  FOR SELECT USING (
    host_id IN (SELECT id FROM profiles WHERE company_id::text = public.get_user_company_id())
    OR EXISTS (
      SELECT 1 FROM clipad_spaces cs
      WHERE cs.id = clipad_meeting_records.space_id
      AND (cs.company_id::text = public.get_user_company_id() OR cs.created_by IN (SELECT id FROM profiles WHERE company_id::text = public.get_user_company_id()))
    )
  );

CREATE POLICY "clipad_meetings_insert" ON public.clipad_meeting_records
  FOR INSERT WITH CHECK (host_id = auth.uid());

CREATE POLICY "clipad_meetings_update" ON public.clipad_meeting_records
  FOR UPDATE USING (
    host_id = auth.uid() OR public.is_clipad_admin()
  );

CREATE POLICY "clipad_meetings_delete" ON public.clipad_meeting_records
  FOR DELETE USING (
    host_id = auth.uid() OR public.is_clipad_admin()
  );

-- === ACTION ITEMS ===
CREATE POLICY "clipad_action_items_select" ON public.clipad_action_items
  FOR SELECT USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM clipad_spaces cs
      WHERE cs.id = clipad_action_items.space_id
      AND (cs.company_id::text = public.get_user_company_id() OR cs.created_by IN (SELECT id FROM profiles WHERE company_id::text = public.get_user_company_id()))
    )
  );

CREATE POLICY "clipad_action_items_insert" ON public.clipad_action_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "clipad_action_items_update" ON public.clipad_action_items
  FOR UPDATE USING (
    assigned_to = auth.uid() OR public.is_clipad_admin()
  );
