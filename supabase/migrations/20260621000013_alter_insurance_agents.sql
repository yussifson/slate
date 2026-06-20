ALTER TABLE public.insurance_agents ADD COLUMN IF NOT EXISTS agent_code TEXT;
ALTER TABLE public.insurance_agents ADD COLUMN IF NOT EXISTS policies_sold INTEGER;
ALTER TABLE public.insurance_agents ADD COLUMN IF NOT EXISTS premium_collected REAL;
ALTER TABLE public.insurance_agents ADD COLUMN IF NOT EXISTS claims_handled INTEGER;
ALTER TABLE public.insurance_agents ADD COLUMN IF NOT EXISTS commission_earned REAL;
ALTER TABLE public.insurance_agents ADD COLUMN IF NOT EXISTS rating INTEGER;
