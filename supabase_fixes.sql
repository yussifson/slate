-- Add currency to univ_time_tracking if it doesn't exist
ALTER TABLE public.univ_time_tracking ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';

-- Add stages to case_pipelines if it doesn't exist
ALTER TABLE public.case_pipelines ADD COLUMN IF NOT EXISTS stages jsonb;
