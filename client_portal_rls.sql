-- Enable RLS for all client-facing tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE univ_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE univ_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE univ_re_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE univ_retail_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policyholders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts during re-run)
DROP POLICY IF EXISTS "Enable read access for own client record" ON clients;
DROP POLICY IF EXISTS "Enable read access for own student record" ON univ_students;
DROP POLICY IF EXISTS "Enable read access for own patient record" ON univ_patients;
DROP POLICY IF EXISTS "Enable read access for own retail customer record" ON univ_retail_customers;
DROP POLICY IF EXISTS "Enable read access for own re client record" ON univ_re_clients;
DROP POLICY IF EXISTS "Enable read access for own policyholder record" ON insurance_policyholders;

-- Create policies comparing id (which may be text) to auth.uid() (which is uuid) by casting both to text
CREATE POLICY "Enable read access for own client record" ON clients FOR SELECT USING (id::text = auth.uid()::text);
CREATE POLICY "Enable read access for own student record" ON univ_students FOR SELECT USING (id::text = auth.uid()::text);
CREATE POLICY "Enable read access for own patient record" ON univ_patients FOR SELECT USING (id::text = auth.uid()::text);
CREATE POLICY "Enable read access for own retail customer record" ON univ_retail_customers FOR SELECT USING (id::text = auth.uid()::text);
CREATE POLICY "Enable read access for own re client record" ON univ_re_clients FOR SELECT USING (id::text = auth.uid()::text);
CREATE POLICY "Enable read access for own policyholder record" ON insurance_policyholders FOR SELECT USING (id::text = auth.uid()::text);
