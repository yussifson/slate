

export function getSubdomainAndBase() {
  const host = window.location.hostname;

  // Handle localhost scenarios
  if (host === 'localhost' || host.startsWith('127.0.0.1')) {
    return { currentSubdomain: null, baseDomain: host };
  }
  
  // Handle firm.localhost testing
  if (host.endsWith('.localhost')) {
    const parts = host.split('.');
    return { currentSubdomain: parts[0], baseDomain: 'localhost' };
  }

  // Handle Vercel preview and production domains
  if (host.endsWith('.vercel.app')) {
    return { currentSubdomain: null, baseDomain: host };
  }

  // Handle specific custom base domain from environment variables or hardcoded for slate.optavel.com
  const customBaseDomain = import.meta.env.VITE_BASE_DOMAIN || 'slate.optavel.com';
  
  if (host === customBaseDomain) {
    return { currentSubdomain: null, baseDomain: host };
  }

  if (host.endsWith(`.${customBaseDomain}`)) {
    const currentSubdomain = host.replace(`.${customBaseDomain}`, '');
    return { currentSubdomain, baseDomain: customBaseDomain };
  }

  // Handle custom domains (e.g. firm.company.com -> current: firm, base: company.com)
  const parts = host.split('.');
  
  // If it's a standard domain like company.com
  if (parts.length === 2) {
    return { currentSubdomain: null, baseDomain: host };
  }

  // If it has a subdomain, e.g. firm.company.com
  if (parts.length > 2) {
    const currentSubdomain = parts.shift();
    const baseDomain = parts.join('.');
    
    // Ignore 'www' and 'app' as functional subdomains
    if (currentSubdomain === 'www' || currentSubdomain === 'app') {
      return { currentSubdomain: null, baseDomain };
    }
    
    return { currentSubdomain, baseDomain };
  }

  return { currentSubdomain: null, baseDomain: host };
}

export function getMainAppUrl() {
  const { baseDomain } = getSubdomainAndBase();
  const port = window.location.port ? `:${window.location.port}` : '';
  return `${window.location.protocol}//${baseDomain}${port}`;
}
