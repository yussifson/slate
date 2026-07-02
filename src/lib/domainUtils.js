

export function getSubdomainAndBase() {
  const host = window.location.hostname;
  
  const envBase = import.meta.env.VITE_BASE_DOMAIN;
  const knownBaseDomains = ['slate.optavel.com', 'slated.optavel.com', 'oatstack.com'];
  if (envBase && !knownBaseDomains.includes(envBase)) {
    knownBaseDomains.push(envBase);
  }

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
  
  // Check against known base domains
  for (const base of knownBaseDomains) {
    if (host === base) {
      return { currentSubdomain: null, baseDomain: base, isCustomDomain: false };
    }
    if (host.endsWith(`.${base}`)) {
      const currentSubdomain = host.replace(`.${base}`, '');
      return { currentSubdomain, baseDomain: base, isCustomDomain: false };
    }
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

export function isDesktopApp() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isElectronEnv = ua.includes('electron');
  const isTauri = !!window.__TAURI__;
  const isCapacitor = !!window.Capacitor || ua.includes('capacitor');
  const isFileProtocol = window.location.protocol === 'file:' || window.location.protocol.startsWith('app') || window.location.protocol.startsWith('tauri') || window.location.protocol === 'capacitor:';
  
  // Fallback: If we are on Android/iOS and the host is localhost, it's definitely a native app wrapper (like Capacitor)
  const isMobileLocalhost = (ua.includes('android') || ua.includes('iphone') || ua.includes('ipad')) && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  return isElectronEnv || isTauri || isCapacitor || isFileProtocol || isMobileLocalhost;
}
