-- 1. ADD MISSING COLUMNS & TABLES
ALTER TABLE public.clipad_meeting_records ADD COLUMN IF NOT EXISTS video_url TEXT;

CREATE TABLE IF NOT EXISTS public.clipad_video_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES public.clipad_videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  watch_percent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Force add in case they already exist but lack these columns
ALTER TABLE public.clipad_video_views ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.clipad_video_comments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.clipad_video_reactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.clipad_video_views ENABLE ROW LEVEL SECURITY;

-- 2. RE-APPLY STRICT MULTI-TENANT POLICIES FOR COMMENTS, REACTIONS, VIEWS

DROP POLICY IF EXISTS "clipad_video_comments_select" ON public.clipad_video_comments;
CREATE POLICY "clipad_video_comments_select" ON public.clipad_video_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clipad_videos cv
      WHERE cv.id = clipad_video_comments.video_id
      AND (
        cv.creator_id IN (SELECT id FROM profiles WHERE company_id::text = public.get_user_company_id())
        OR EXISTS (
          SELECT 1 FROM clipad_spaces cs
          WHERE cs.id = cv.space_id
          AND (cs.company_id::text = public.get_user_company_id() OR cs.created_by IN (SELECT id FROM profiles WHERE company_id::text = public.get_user_company_id()))
        )
      )
    )
  );

DROP POLICY IF EXISTS "clipad_video_comments_insert" ON public.clipad_video_comments;
CREATE POLICY "clipad_video_comments_insert" ON public.clipad_video_comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "clipad_video_comments_update" ON public.clipad_video_comments;
CREATE POLICY "clipad_video_comments_update" ON public.clipad_video_comments
  FOR UPDATE USING (user_id = auth.uid() OR public.is_clipad_admin());

DROP POLICY IF EXISTS "clipad_video_comments_delete" ON public.clipad_video_comments;
CREATE POLICY "clipad_video_comments_delete" ON public.clipad_video_comments
  FOR DELETE USING (user_id = auth.uid() OR public.is_clipad_admin());

-- === REACTIONS ===
DROP POLICY IF EXISTS "clipad_video_reactions_select" ON public.clipad_video_reactions;
CREATE POLICY "clipad_video_reactions_select" ON public.clipad_video_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clipad_videos cv
      WHERE cv.id = clipad_video_reactions.video_id
      AND (
        cv.creator_id IN (SELECT id FROM profiles WHERE company_id::text = public.get_user_company_id())
        OR EXISTS (
          SELECT 1 FROM clipad_spaces cs
          WHERE cs.id = cv.space_id
          AND (cs.company_id::text = public.get_user_company_id() OR cs.created_by IN (SELECT id FROM profiles WHERE company_id::text = public.get_user_company_id()))
        )
      )
    )
  );

DROP POLICY IF EXISTS "clipad_video_reactions_insert" ON public.clipad_video_reactions;
CREATE POLICY "clipad_video_reactions_insert" ON public.clipad_video_reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "clipad_video_reactions_delete" ON public.clipad_video_reactions;
CREATE POLICY "clipad_video_reactions_delete" ON public.clipad_video_reactions
  FOR DELETE USING (user_id = auth.uid() OR public.is_clipad_admin());

-- === VIEWS ===
DROP POLICY IF EXISTS "clipad_video_views_select" ON public.clipad_video_views;
CREATE POLICY "clipad_video_views_select" ON public.clipad_video_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clipad_videos cv
      WHERE cv.id = clipad_video_views.video_id
      AND (
        cv.creator_id IN (SELECT id FROM profiles WHERE company_id::text = public.get_user_company_id())
        OR EXISTS (
          SELECT 1 FROM clipad_spaces cs
          WHERE cs.id = cv.space_id
          AND (cs.company_id::text = public.get_user_company_id() OR cs.created_by IN (SELECT id FROM profiles WHERE company_id::text = public.get_user_company_id()))
        )
      )
    )
  );

DROP POLICY IF EXISTS "clipad_video_views_insert" ON public.clipad_video_views;
CREATE POLICY "clipad_video_views_insert" ON public.clipad_video_views
  FOR INSERT WITH CHECK (user_id = auth.uid());
