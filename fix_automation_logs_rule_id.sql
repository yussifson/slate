-- Fix automation_logs not-null constraint on rule_id

-- If rule_id is currently NOT NULL, make it NULLABLE so PowerSync can sync generic logs
ALTER TABLE public.automation_logs ALTER COLUMN rule_id DROP NOT NULL;

-- Also ensure the PowerSync publication has it, just in case
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'powersync' AND tablename = 'automation_logs') THEN
        ALTER PUBLICATION powersync ADD TABLE public.automation_logs;
    END IF;
END $$;
