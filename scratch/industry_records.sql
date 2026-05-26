-- 1. Create the generic industry_records table
CREATE TABLE IF NOT EXISTS industry_records (
    id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    company_id TEXT NOT NULL, 
    industry TEXT NOT NULL, 
    record_type TEXT NOT NULL, 
    data JSONB DEFAULT '{}'::jsonb NOT NULL, 
    status TEXT, 
    search_text TEXT 
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE industry_records ENABLE ROW LEVEL SECURITY;

-- 3. Create a secure function that returns TEXT to completely avoid any UUID type mismatch
CREATE OR REPLACE FUNCTION get_current_user_company_id_text()
RETURNS TEXT AS $$
DECLARE
  v_company_id TEXT;
BEGIN
  SELECT company_id::text INTO v_company_id 
  FROM profiles 
  WHERE id::text = auth.uid()::text 
  LIMIT 1;
  RETURN v_company_id;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Drop any existing policies to avoid conflicts if you run this multiple times
DROP POLICY IF EXISTS "Users can view records for their company" ON industry_records;
DROP POLICY IF EXISTS "Users can insert records for their company" ON industry_records;
DROP POLICY IF EXISTS "Users can update records for their company" ON industry_records;
DROP POLICY IF EXISTS "Users can delete records for their company" ON industry_records;

-- 5. Create policy to allow users to view records for their company
CREATE POLICY "Users can view records for their company" ON industry_records
    FOR SELECT
    USING (company_id = get_current_user_company_id_text());

-- 6. Create policy to allow users to insert records for their company
CREATE POLICY "Users can insert records for their company" ON industry_records
    FOR INSERT
    WITH CHECK (company_id = get_current_user_company_id_text());

-- 7. Create policy to allow users to update records for their company
CREATE POLICY "Users can update records for their company" ON industry_records
    FOR UPDATE
    USING (company_id = get_current_user_company_id_text())
    WITH CHECK (company_id = get_current_user_company_id_text());

-- 8. Create policy to allow users to delete records for their company
CREATE POLICY "Users can delete records for their company" ON industry_records
    FOR DELETE
    USING (company_id = get_current_user_company_id_text());

-- 9. Create indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_industry_records_company_type ON industry_records(company_id, industry, record_type);
CREATE INDEX IF NOT EXISTS idx_industry_records_data_gin ON industry_records USING GIN (data);
