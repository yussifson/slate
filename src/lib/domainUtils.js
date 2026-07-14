

export function getSubdomainAndBase() {
  const host = window.location.hostname;
  
  const envBase = import.meta.env.VITE_BASE_DOMAIN;
  const knownBaseDomains = ['optavel.com', 'slate.optavel.com', 'slated.optavel.com', 'oatstack.com', 'clipad.optavel.com'];
  if (envBase && !knownBaseDomains.includes(envBase)) {
    knownBaseDomains.push(envBase);
  }

  // Reserved system subdomains that should never be treated as tenant subdomains
  // Only block known Vercel/deployment preview patterns, NOT company names
  const reservedSubdomains = ['www'];

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
  
  // Check exact matches FIRST
  for (const base of knownBaseDomains) {
    if (host === base) {
      return { currentSubdomain: null, baseDomain: base, isCustomDomain: false };
    }
  }

  // Then check suffix matches
  for (const base of knownBaseDomains) {
    if (host.endsWith(`.${base}`)) {
      const currentSubdomain = host.replace(`.${base}`, '');
      // Only block truly generic web prefixes like 'www'
      if (reservedSubdomains.includes(currentSubdomain)) {
        return { currentSubdomain: null, baseDomain: base, isCustomDomain: false };
      }
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
  let targetDomain = baseDomain;
  if (targetDomain === 'optavel.com') {
    targetDomain = 'slate.optavel.com';
  }
  return `${window.location.protocol}//${targetDomain}${port}`;
}

export function isDesktopApp() {
  if (typeof window === 'undefined') return false;

  // If running over HTTPS on a real domain, it is ALWAYS a web browser — never a desktop/native app.
  // This prevents HashRouter from being incorrectly used for web users.
  if (window.location.protocol === 'https:') return false;

  const ua = window.navigator.userAgent.toLowerCase();
  const isElectronEnv = ua.includes('electron');
  const isTauri = !!window.__TAURI__;
  const isCapacitor = !!window.Capacitor || ua.includes('capacitor');
  const isFileProtocol = window.location.protocol === 'file:' || window.location.protocol.startsWith('app') || window.location.protocol.startsWith('tauri') || window.location.protocol === 'capacitor:';
  
  // Fallback: If we are on Android/iOS and the host is localhost, it's definitely a native app wrapper (like Capacitor)
  const isMobileLocalhost = (ua.includes('android') || ua.includes('iphone') || ua.includes('ipad')) && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  return isElectronEnv || isTauri || isCapacitor || isFileProtocol || isMobileLocalhost;
}
