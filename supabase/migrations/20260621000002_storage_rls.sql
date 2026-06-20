-- Create bucket if it does not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('workspace-files', 'workspace-files', false)
ON CONFLICT (id) DO NOTHING;

-- RLS is natively enabled on storage.objects

-- 1. Users can upload files to their workspace folder
-- We assume files are uploaded to path: [company_id]/[file_name]
CREATE POLICY "Users can upload to their workspace folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'workspace-files' AND
  (auth.uid() IS NOT NULL) AND
  (path_tokens[1] IN (SELECT user_company_ids()))
);

-- 2. Users can view files in their workspace folder
CREATE POLICY "Users can view their workspace files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'workspace-files' AND
  (auth.uid() IS NOT NULL) AND
  (path_tokens[1] IN (SELECT user_company_ids()))
);

-- 3. Users can update files in their workspace folder
CREATE POLICY "Users can update their workspace files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'workspace-files' AND
  (auth.uid() IS NOT NULL) AND
  (path_tokens[1] IN (SELECT user_company_ids()))
);

-- 4. Users can delete files in their workspace folder
CREATE POLICY "Users can delete their workspace files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'workspace-files' AND
  (auth.uid() IS NOT NULL) AND
  (path_tokens[1] IN (SELECT user_company_ids()))
);
