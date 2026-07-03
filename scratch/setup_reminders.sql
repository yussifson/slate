CREATE TABLE public.univ_time_reminders (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL,
    user_id UUID,
    title TEXT,
    description TEXT,
    remind_at TIMESTAMP WITH TIME ZONE,
    is_recurring INTEGER DEFAULT 0,
    recurrence_pattern TEXT,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Pending'
);

-- Turn on Row Level Security
ALTER TABLE public.univ_time_reminders ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "time_reminders_select" ON public.univ_time_reminders FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "time_reminders_insert" ON public.univ_time_reminders FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "time_reminders_update" ON public.univ_time_reminders FOR UPDATE USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "time_reminders_delete" ON public.univ_time_reminders FOR DELETE USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE univ_time_reminders;
