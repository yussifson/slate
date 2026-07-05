// Directly push the Optavel OS expansion SQL to Supabase using the Management API
const SUPABASE_URL = 'https://wmabgiafwamxkcgxyhee.supabase.co';
const PROJECT_REF = 'wmabgiafwamxkcgxyhee';
const SERVICE_ROLE_KEY = process.argv[2];

if (!SERVICE_ROLE_KEY) {
  console.error('Usage: node push-migration.mjs <service_role_key>');
  process.exit(1);
}

const SQL = `
CREATE TABLE IF NOT EXISTS public.optavel_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT 'Engineering',
    onboarding_progress INTEGER DEFAULT 0,
    status TEXT DEFAULT 'onboarding',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.optavel_employees ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'optavel_employees' AND policyname = 'optavel_employees_policy') THEN
    CREATE POLICY "optavel_employees_policy" ON public.optavel_employees FOR ALL USING (
      auth.uid() IN (SELECT user_id FROM public.profiles WHERE company_id = optavel_employees.company_id)
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.optavel_leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.optavel_employees(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.optavel_leave_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'optavel_leave_requests' AND policyname = 'optavel_leave_requests_policy') THEN
    CREATE POLICY "optavel_leave_requests_policy" ON public.optavel_leave_requests FOR ALL USING (
      auth.uid() IN (SELECT user_id FROM public.profiles WHERE company_id = optavel_leave_requests.company_id)
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.optavel_support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open',
    severity TEXT DEFAULT 'medium',
    customer_id TEXT,
    reporter_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.optavel_support_tickets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'optavel_support_tickets' AND policyname = 'optavel_support_tickets_policy') THEN
    CREATE POLICY "optavel_support_tickets_policy" ON public.optavel_support_tickets FOR ALL USING (
      auth.uid() IN (SELECT user_id FROM public.profiles WHERE company_id = optavel_support_tickets.company_id)
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.optavel_nps_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id TEXT,
    score INTEGER NOT NULL,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.optavel_nps_responses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'optavel_nps_responses' AND policyname = 'optavel_nps_responses_policy') THEN
    CREATE POLICY "optavel_nps_responses_policy" ON public.optavel_nps_responses FOR ALL USING (
      auth.uid() IN (SELECT user_id FROM public.profiles WHERE company_id = optavel_nps_responses.company_id)
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.optavel_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Technology',
    status TEXT DEFAULT 'active',
    revenue_share REAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.optavel_partners ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'optavel_partners' AND policyname = 'optavel_partners_policy') THEN
    CREATE POLICY "optavel_partners_policy" ON public.optavel_partners FOR ALL USING (
      auth.uid() IN (SELECT user_id FROM public.profiles WHERE company_id = optavel_partners.company_id)
    );
  END IF;
END $$;
`;

async function run() {
  // Use Supabase Management API to run SQL
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ query: SQL })
  });
  
  const body = await res.text();
  console.log('Management API Status:', res.status);
  console.log('Response:', body.substring(0, 500));
}

run().catch(console.error);
