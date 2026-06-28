

export function getSubdomainAndBase() {
  const host = window.location.hostname;
  const customBaseDomain = import.meta.env.VITE_BASE_DOMAIN || 'slate.optavel.com';

  // Handle localhost scenarios
  if (host === 'localhost' || host.startsWith('127.0.0.1')) {
    return { currentSubdomain: null, baseDomain: host, isCustomDomain: false };
  }
  
  // Handle firm.localhost testing
  if (host.endsWith('.localhost')) {
    const parts = host.split('.');
    return { currentSubdomain: parts[0], baseDomain: 'localhost', isCustomDomain: false };
  }

  // Handle Vercel preview and production domains
  if (host.endsWith('.vercel.app')) {
    return { currentSubdomain: null, baseDomain: host, isCustomDomain: false };
  }
  
  if (host === customBaseDomain) {
    return { currentSubdomain: null, baseDomain: host, isCustomDomain: false };
  }

  if (host.endsWith(`.${customBaseDomain}`)) {
    const currentSubdomain = host.replace(`.${customBaseDomain}`, '');
    return { currentSubdomain, baseDomain: customBaseDomain, isCustomDomain: false };
  }

  // Handle custom domains (e.g. app.firmz.com or firmz.com)
  // If it doesn't match any of the base system domains above, it must be a custom domain mapped by a tenant.
  return { currentSubdomain: host, baseDomain: host, isCustomDomain: true };
}

export function getMainAppUrl() {
  const { baseDomain } = getSubdomainAndBase();
  const port = window.location.port ? `:${window.location.port}` : '';
  return `${window.location.protocol}//${baseDomain}${port}`;
}
