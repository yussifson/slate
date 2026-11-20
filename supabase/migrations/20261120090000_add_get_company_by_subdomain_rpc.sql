-- Migration: 20261120090000_add_get_company_by_subdomain_rpc.sql
-- Description: Creates the get_company_by_subdomain RPC used by Login.jsx for workspace
-- resolution and branding lookup. This function must be accessible to anonymous users
-- (unauthenticated) so it can resolve the workspace before login occurs.

CREATE OR REPLACE FUNCTION public.get_company_by_subdomain(p_subdomain TEXT)
RETURNS TABLE (
  id          UUID,
  name        TEXT,
  subdomain   TEXT,
  custom_domain TEXT,
  logo_url    TEXT,
  logo_light_url TEXT,
  favicon_url TEXT,
  tagline     TEXT,
  primary_color TEXT,
  industry_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean TEXT;
BEGIN
  v_clean := LOWER(TRIM(p_subdomain));

  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.subdomain,
    c.custom_domain,
    c.logo_url,
    c.logo_light_url,
    c.favicon_url,
    c.tagline,
    c.primary_color,
    c.industry_type
  FROM public.companies c
  WHERE
    LOWER(TRIM(c.subdomain))     = v_clean
    OR LOWER(TRIM(c.custom_domain)) = v_clean
  LIMIT 1;
END;
$$;

-- Grant access to anon (unauthenticated users need to call this on the login page)
-- and authenticated users (for profile checks during session validation).
GRANT EXECUTE ON FUNCTION public.get_company_by_subdomain(TEXT) TO anon, authenticated, service_role;
