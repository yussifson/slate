CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  record_type TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  field_options JSONB DEFAULT '[]',
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, record_type, field_name)
);

ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage custom fields for their org" ON custom_field_definitions 
FOR ALL USING (
  company_id IN (
    SELECT id FROM organizations WHERE auth.uid() IN (
      SELECT user_id FROM organization_members WHERE org_id = organizations.id
    )
  )
);
