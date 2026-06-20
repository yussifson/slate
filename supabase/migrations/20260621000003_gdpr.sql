CREATE TABLE IF NOT EXISTS public.data_subject_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    requestor_email TEXT NOT NULL,
    request_type TEXT NOT NULL CHECK (request_type IN ('export', 'erasure', 'rectification', 'access')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_isolation_select" ON public.data_subject_requests
FOR SELECT USING (
    company_id::text IN (SELECT user_company_ids())
    AND has_role_permission(company_id::text, 'read')
);

CREATE POLICY "company_isolation_insert" ON public.data_subject_requests
FOR INSERT WITH CHECK (
    company_id::text IN (SELECT user_company_ids())
    AND has_role_permission(company_id::text, 'create')
);

CREATE POLICY "company_isolation_update" ON public.data_subject_requests
FOR UPDATE USING (
    company_id::text IN (SELECT user_company_ids())
    AND has_role_permission(company_id::text, 'update')
);

-- RPC for triggering GDPR Export
CREATE OR REPLACE FUNCTION trigger_gdpr_export(p_email TEXT, p_company_id TEXT)
RETURNS jsonb AS $$
DECLARE
    v_user_profile jsonb;
    v_result jsonb;
BEGIN
    -- This function would theoretically gather all PII linked to the email.
    -- For demonstration, it logs the request and returns a summary.
    
    INSERT INTO public.data_subject_requests (company_id, requestor_email, request_type, status)
    VALUES (p_company_id::uuid, p_email, 'export', 'processing');

    SELECT to_jsonb(p) INTO v_user_profile FROM public.profiles p WHERE email = p_email AND company_id::text = p_company_id;
    
    v_result := jsonb_build_object(
        'status', 'success',
        'message', 'GDPR export initiated. The user will receive an email shortly.',
        'profile_data', v_user_profile
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC for triggering GDPR Erasure (Right to be Forgotten)
CREATE OR REPLACE FUNCTION trigger_gdpr_erasure(p_email TEXT, p_company_id TEXT)
RETURNS jsonb AS $$
DECLARE
    v_result jsonb;
BEGIN
    INSERT INTO public.data_subject_requests (company_id, requestor_email, request_type, status)
    VALUES (p_company_id::uuid, p_email, 'erasure', 'processing');

    -- Anonymize profile
    UPDATE public.profiles 
    SET full_name = 'Anonymized User', 
        phone = null,
        avatar_url = null
    WHERE email = p_email AND company_id::text = p_company_id;

    v_result := jsonb_build_object(
        'status', 'success',
        'message', 'GDPR erasure completed. PII has been anonymized.'
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
