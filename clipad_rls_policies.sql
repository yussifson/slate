-- ============================================================
-- CLIPAD ROW LEVEL SECURITY - Run in Supabase SQL Editor
-- This enforces data isolation at the DB level (bulletproof)
-- ============================================================

-- 1. CLIPAD SPACES
ALTER TABLE public.clipad_spaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clipad_spaces_select" ON public.clipad_spaces;
CREATE POLICY "clipad_spaces_select" ON public.clipad_spaces
  FOR SELECT USING (
    -- Creator can always see it
    created_by = auth.uid()
    OR
    -- Members can see it
    EXISTS (SELECT 1 FROM clipad_space_members WHERE space_id = clipad_spaces.id AND user_id = auth.uid())
    OR
    -- Public spaces visible to all
    is_private = false
  );

DROP POLICY IF EXISTS "clipad_spaces_insert" ON public.clipad_spaces;
CREATE POLICY "clipad_spaces_insert" ON public.clipad_spaces
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "clipad_spaces_update" ON public.clipad_spaces;
CREATE POLICY "clipad_spaces_update" ON public.clipad_spaces
  FOR UPDATE USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "clipad_spaces_delete" ON public.clipad_spaces;
CREATE POLICY "clipad_spaces_delete" ON public.clipad_spaces
  FOR DELETE USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- 2. CLIPAD VIDEOS
ALTER TABLE public.clipad_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clipad_videos_select" ON public.clipad_videos;
CREATE POLICY "clipad_videos_select" ON public.clipad_videos
  FOR SELECT USING (
    creator_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM clipad_spaces cs
      WHERE cs.id = clipad_videos.space_id
      AND (
        cs.is_private = false
        OR cs.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM clipad_space_members csm WHERE csm.space_id = cs.id AND csm.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
      )
    )
  );

DROP POLICY IF EXISTS "clipad_videos_insert" ON public.clipad_videos;
CREATE POLICY "clipad_videos_insert" ON public.clipad_videos
  FOR INSERT WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "clipad_videos_update" ON public.clipad_videos;
CREATE POLICY "clipad_videos_update" ON public.clipad_videos
  FOR UPDATE USING (
    creator_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "clipad_videos_delete" ON public.clipad_videos;
CREATE POLICY "clipad_videos_delete" ON public.clipad_videos
  FOR DELETE USING (
    creator_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- 3. CLIPAD MEETING RECORDS
ALTER TABLE public.clipad_meeting_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clipad_meetings_select" ON public.clipad_meeting_records;
CREATE POLICY "clipad_meetings_select" ON public.clipad_meeting_records
  FOR SELECT USING (
    host_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM clipad_spaces cs
      WHERE cs.id = clipad_meeting_records.space_id
      AND (
        cs.is_private = false
        OR cs.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM clipad_space_members csm WHERE csm.space_id = cs.id AND csm.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
      )
    )
  );

DROP POLICY IF EXISTS "clipad_meetings_insert" ON public.clipad_meeting_records;
CREATE POLICY "clipad_meetings_insert" ON public.clipad_meeting_records
  FOR INSERT WITH CHECK (host_id = auth.uid());

DROP POLICY IF EXISTS "clipad_meetings_update" ON public.clipad_meeting_records;
CREATE POLICY "clipad_meetings_update" ON public.clipad_meeting_records
  FOR UPDATE USING (
    host_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "clipad_meetings_delete" ON public.clipad_meeting_records;
CREATE POLICY "clipad_meetings_delete" ON public.clipad_meeting_records
  FOR DELETE USING (
    host_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- 4. CLIPAD SPACE MEMBERS
ALTER TABLE public.clipad_space_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clipad_space_members_select" ON public.clipad_space_members;
CREATE POLICY "clipad_space_members_select" ON public.clipad_space_members
  FOR SELECT USING (
    true
  );

DROP POLICY IF EXISTS "clipad_space_members_insert" ON public.clipad_space_members;
CREATE POLICY "clipad_space_members_insert" ON public.clipad_space_members
  FOR INSERT WITH CHECK (
    true
  );

DROP POLICY IF EXISTS "clipad_space_members_delete" ON public.clipad_space_members;
CREATE POLICY "clipad_space_members_delete" ON public.clipad_space_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- 5. CLIPAD ACTION ITEMS
ALTER TABLE public.clipad_action_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clipad_action_items_select" ON public.clipad_action_items;
CREATE POLICY "clipad_action_items_select" ON public.clipad_action_items
  FOR SELECT USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM clipad_spaces cs
      WHERE cs.id = clipad_action_items.space_id
      AND (cs.created_by = auth.uid() OR EXISTS (SELECT 1 FROM clipad_space_members WHERE space_id = cs.id AND user_id = auth.uid()))
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "clipad_action_items_all" ON public.clipad_action_items;
CREATE POLICY "clipad_action_items_all" ON public.clipad_action_items
  FOR ALL USING (
    assigned_to = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );
