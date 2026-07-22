-- Allow anonymous users to read public videos
CREATE POLICY "Enable read for public videos anon" ON public.clipad_videos FOR SELECT TO anon USING (visibility IN ('external', 'public'));

-- Allow anonymous users to read comments on public videos
CREATE POLICY "Enable read for public videos comments anon" ON public.clipad_video_comments FOR SELECT TO anon USING (
  EXISTS (
    SELECT 1 FROM public.clipad_videos
    WHERE id = clipad_video_comments.video_id
    AND visibility IN ('external', 'public')
  )
);

-- Allow anonymous users to read reactions on public videos
CREATE POLICY "Enable read for public videos reactions anon" ON public.clipad_video_reactions FOR SELECT TO anon USING (
  EXISTS (
    SELECT 1 FROM public.clipad_videos
    WHERE id = clipad_video_reactions.video_id
    AND visibility IN ('external', 'public')
  )
);
