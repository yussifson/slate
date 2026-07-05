const fs = require('fs');
const missing = fs.readFileSync('missing_in_db.txt', 'utf8').split('\n').filter(Boolean);
let sql = '-- Migration for missing DB tables\n\n';
for (const table of missing) {
  sql += `CREATE TABLE IF NOT EXISTS public.${table} (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "${table}_all_access" ON public.${table};

CREATE POLICY "${table}_all_access" ON public.${table}
  FOR ALL USING (company_id::text = (SELECT company_id::text FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id::text = (SELECT company_id::text FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.${table} TO authenticated, service_role;

`;
}
fs.writeFileSync('supabase/migrations/20260705000000_align_appschema_tables.sql', sql);
console.log('Migration generated successfully with explicit type casting.');
