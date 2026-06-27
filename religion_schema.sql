-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Religion Module Tables

CREATE TABLE IF NOT EXISTS public.univ_religion_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    member_id TEXT,
    name TEXT NOT NULL,
    phone TEXT,
    type TEXT,
    group_name TEXT,
    status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS public.univ_religion_donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    member_name TEXT,
    amount REAL NOT NULL,
    type TEXT,
    status TEXT DEFAULT 'Completed'
);

CREATE TABLE IF NOT EXISTS public.univ_religion_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date TEXT,
    location TEXT,
    attendees INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Upcoming'
);

CREATE TABLE IF NOT EXISTS public.univ_religion_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    leader TEXT,
    members INTEGER DEFAULT 0,
    schedule TEXT,
    color TEXT,
    icon_type INTEGER DEFAULT 1,
    status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS public.univ_religion_small_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    leader TEXT,
    location TEXT,
    members INTEGER DEFAULT 0,
    time TEXT,
    status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS public.univ_religion_prayers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    requestor TEXT,
    prayer TEXT NOT NULL,
    "prayersCount" INTEGER DEFAULT 0,
    sentiment TEXT,
    "aiAnalysis" TEXT,
    status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS public.univ_religion_sermons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    speaker TEXT,
    scripture TEXT,
    duration TEXT,
    sermon_kit TEXT,
    date TEXT,
    series TEXT,
    status TEXT DEFAULT 'Draft'
);

CREATE TABLE IF NOT EXISTS public.univ_religion_volunteers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT,
    group_name TEXT,
    availability TEXT,
    next_service TEXT,
    event TEXT,
    status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS public.univ_religion_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.univ_religion_members(id) ON DELETE SET NULL,
    milestone_type TEXT,
    date TEXT,
    notes TEXT
);

-- RLS Policies
ALTER TABLE public.univ_religion_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_religion_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_religion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_religion_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_religion_small_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_religion_prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_religion_sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_religion_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_religion_milestones ENABLE ROW LEVEL SECURITY;

-- Create policies for each table based on company_id
DO $$
DECLARE
    t_name TEXT;
BEGIN
    FOR t_name IN SELECT unnest(ARRAY[
        'univ_religion_members',
        'univ_religion_donations',
        'univ_religion_events',
        'univ_religion_groups',
        'univ_religion_small_groups',
        'univ_religion_prayers',
        'univ_religion_sermons',
        'univ_religion_volunteers',
        'univ_religion_milestones'
    ])
    LOOP
        EXECUTE format('
            CREATE POLICY "Enable read access for company users" ON public.%I
                FOR SELECT USING (
                    company_id IN (
                        SELECT company_id FROM public.profiles WHERE profiles.id = auth.uid()
                    )
                );
            CREATE POLICY "Enable write access for company users" ON public.%I
                FOR INSERT WITH CHECK (
                    company_id IN (
                        SELECT company_id FROM public.profiles WHERE profiles.id = auth.uid()
                    )
                );
            CREATE POLICY "Enable update access for company users" ON public.%I
                FOR UPDATE USING (
                    company_id IN (
                        SELECT company_id FROM public.profiles WHERE profiles.id = auth.uid()
                    )
                );
            CREATE POLICY "Enable delete access for company users" ON public.%I
                FOR DELETE USING (
                    company_id IN (
                        SELECT company_id FROM public.profiles WHERE profiles.id = auth.uid()
                    )
                );
        ', t_name, t_name, t_name, t_name);
    END LOOP;
END
$$;

-- Grant permissions
GRANT ALL ON TABLE public.univ_religion_members TO authenticated;
GRANT ALL ON TABLE public.univ_religion_donations TO authenticated;
GRANT ALL ON TABLE public.univ_religion_events TO authenticated;
GRANT ALL ON TABLE public.univ_religion_groups TO authenticated;
GRANT ALL ON TABLE public.univ_religion_small_groups TO authenticated;
GRANT ALL ON TABLE public.univ_religion_prayers TO authenticated;
GRANT ALL ON TABLE public.univ_religion_sermons TO authenticated;
GRANT ALL ON TABLE public.univ_religion_volunteers TO authenticated;
GRANT ALL ON TABLE public.univ_religion_milestones TO authenticated;
