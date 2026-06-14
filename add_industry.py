with open('C:/Users/USER/OneDrive/Documents/airflake/src/api/AppSchema.js', 'r', encoding='utf-8') as f:
    schema = f.read()

industry_schema = '''    industry_records: new Table({
        id: column.text,
        created_at: column.text,
        company_id: column.text,
        industry: column.text,
        record_type: column.text,
        data: column.text,
        status: column.text,
        title: column.text,
        search_text: column.text,
    }),'''

if 'industry_records:' not in schema:
    schema = schema.replace('export const AppSchema = new Schema({', 'export const AppSchema = new Schema({\n' + industry_schema)
    with open('C:/Users/USER/OneDrive/Documents/airflake/src/api/AppSchema.js', 'w', encoding='utf-8') as f:
        f.write(schema)

sql = '''CREATE TABLE IF NOT EXISTS public.industry_records (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    company_id uuid not null,
    industry text,
    record_type text,
    data jsonb,
    status text,
    title text,
    search_text text
);
ALTER TABLE public.industry_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow company access on industry_records" ON public.industry_records;
CREATE POLICY "Allow company access on industry_records" ON public.industry_records FOR ALL USING (auth.uid() IS NOT NULL);
'''

with open('C:/Users/USER/OneDrive/Documents/airflake/supabase/migrations/20260613210000_add_industry_records.sql', 'w', encoding='utf-8') as f:
    f.write(sql)
print('Added industry_records schema and migration.')
