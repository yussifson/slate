-- Update the get_company_by_subdomain RPC to return logo_light_url and tagline, and get the latest one
DROP FUNCTION IF EXISTS public.get_company_by_subdomain(text);

CREATE OR REPLACE FUNCTION public.get_company_by_subdomain(p_subdomain text)
RETURNS TABLE (
  id uuid,
  name text,
  logo_url text,
  logo_light_url text,
  tagline text,
  subdomain text,
  custom_domain text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id, 
    c.name, 
    c.logo_url,
    c.logo_light_url,
    c.tagline,
    c.subdomain,
    c.custom_domain
  FROM public.companies c
  WHERE c.subdomain = p_subdomain 
     OR c.custom_domain = p_subdomain
  ORDER BY c.created_at DESC
  LIMIT 1;
END;
$$;
