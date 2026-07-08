import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { getSubdomainAndBase } from '@/lib/domainUtils';
import SlateSiteRenderer from './SlateSiteRenderer';
import { PageLoader } from '@/components/ui/orbit-loader';

/**
 * SiteDomainResolver wraps the entire app routing.
 * It intercepts the initial load, checks if the current hostname
 * corresponds to a published Slate Site. If it does, it renders
 * the public website. If not, it renders the normal Slate app (children).
 *
 * It excludes specific paths like /login, /admin, etc., so companies
 * can still log into their workspace even if their root domain is a public site.
 */
export function SiteDomainResolver({ children }) {
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkDomain() {
      try {
        const host = window.location.hostname;
        const { currentSubdomain, isCustomDomain } = getSubdomainAndBase();

        // Skip check for reserved app domains or local dev (unless testing custom)
        if (host === 'localhost' || host.startsWith('127.0.0.1')) {
          setLoading(false);
          return;
        }

        // Allow bypassing site renderer to access the app via URL parameters or specific paths
        const path = window.location.pathname;
        const appPaths = ['/login', '/signup', '/admin', '/welcome', '/forgot-password', '/reset-password'];
        if (appPaths.some(p => path.startsWith(p)) || window.location.search.includes('bypass_site=true')) {
          setLoading(false);
          return;
        }

        // If it's a base domain with no subdomain, it's the main marketing site, not a tenant site
        if (!currentSubdomain && !isCustomDomain) {
          setLoading(false);
          return;
        }

        // Query for a published site matching this domain
        let query = supabase.from('slate_sites').select('id, company_id').eq('is_published', true);
        
        if (isCustomDomain) {
          query = query.eq('custom_domain', host);
        } else if (currentSubdomain) {
          query = query.eq('subdomain', currentSubdomain);
        }

        const { data, error } = await query.maybeSingle();

        if (data && !error) {
          setSite(data);
        }
      } catch (e) {
        console.warn('Failed to resolve domain', e);
      } finally {
        setLoading(false);
      }
    }

    checkDomain();
  }, []);

  if (loading) {
    return <PageLoader label="Loading..." />;
  }

  // If a site is found for this domain, render the public website
  if (site) {
    return <SlateSiteRenderer companyId={site.company_id} />;
  }

  // Otherwise, render the normal Slate App (marketing or workspace)
  return <>{children}</>;
}
