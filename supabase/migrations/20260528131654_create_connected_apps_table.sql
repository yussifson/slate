-- Create connected_apps table
CREATE TABLE IF NOT EXISTS public.connected_apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    provider TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'error')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, provider)
);

-- RLS Policies
ALTER TABLE public.connected_apps ENABLE ROW LEVEL SECURITY;

-- Allow users to view their company's connected apps
CREATE POLICY "Users can view connected apps for their company" ON public.connected_apps
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Allow admins to insert/update connected apps for their company
CREATE POLICY "Admins can manage connected apps" ON public.connected_apps
    FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM public.users 
            WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'company_admin')
        )
    );

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_connected_apps_modtime
    BEFORE UPDATE ON public.connected_apps
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
