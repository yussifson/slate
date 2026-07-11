DROP POLICY IF EXISTS "Users can update their own spaces" ON public.clipad_spaces;
CREATE POLICY "Users can update their own spaces" ON public.clipad_spaces FOR UPDATE USING (true);
