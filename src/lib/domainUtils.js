export const APP_BASE_DOMAIN = 'lexafrica.oatstack.com';

export function getSubdomainAndBase() {
  const host = window.location.hostname;
  
  let currentSubdomain = null;
  let baseDomain = host;

  if (host === 'localhost' || host.startsWith('127.0.0.1')) {
    return { currentSubdomain: null, baseDomain: host };
  }

  // Handle the user's specific domain gracefully
  if (host.endsWith(APP_BASE_DOMAIN)) {
    if (host === APP_BASE_DOMAIN) {
      currentSubdomain = null;
      baseDomain = APP_BASE_DOMAIN;
    } else {
      currentSubdomain = host.replace(`.${APP_BASE_DOMAIN}`, '');
      baseDomain = APP_BASE_DOMAIN;
    }
  } else {
    // Fallback for vercel.app or firm.localhost testing
    const parts = host.split('.');
    const isVercel = host.endsWith('vercel.app');
    
    if (isVercel) {
      if (parts.length >= 4) currentSubdomain = parts[0];
      baseDomain = parts.slice(-3).join('.'); // e.g., app-name.vercel.app
    } else if (parts.length === 2 && parts[1] === 'localhost') {
      currentSubdomain = parts[0];
      baseDomain = 'localhost';
    } else if (parts.length >= 3) {
      currentSubdomain = parts[0];
      baseDomain = parts.slice(1).join('.');
    }
  }

  if (currentSubdomain === 'www' || currentSubdomain === 'app') {
    currentSubdomain = null;
  }

  return { currentSubdomain, baseDomain };
}

export function getMainAppUrl() {
  const { baseDomain } = getSubdomainAndBase();
  const port = window.location.port ? `:${window.location.port}` : '';
  return `${window.location.protocol}//${baseDomain}${port}`;
}
