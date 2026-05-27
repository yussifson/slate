

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

  // Handle custom domains (e.g. firm.company.com -> current: firm, base: company.com)
  const parts = host.split('.');

  // Explicit check for known PaaS domains that have 3 parts by default (e.g., project.vercel.app)
  if (host.endsWith('.vercel.app') || host.endsWith('.onrender.com') || host.endsWith('.netlify.app')) {
    if (parts.length === 3) {
      return { currentSubdomain: null, baseDomain: host };
    }
    if (parts.length > 3) {
      const currentSubdomain = parts.shift();
      const baseDomain = parts.join('.');
      if (currentSubdomain === 'www' || currentSubdomain === 'app') {
        return { currentSubdomain: null, baseDomain };
      }
      return { currentSubdomain, baseDomain };
    }
  }
  
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
