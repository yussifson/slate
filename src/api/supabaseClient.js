import { createClient } from '@supabase/supabase-js';
import { getSubdomainAndBase, isDesktopApp } from '../lib/domainUtils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Circuit breaker: after one timeout, skip all network requests for 30 seconds.
let forceOfflineUntil = 0;

const customFetch = async (url, options) => {
  // If browser reports offline, fail immediately
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new TypeError('Failed to fetch: Offline');
  }

  // If circuit breaker is tripped, fail immediately
  if (Date.now() < forceOfflineUntil) {
    throw new TypeError('Failed to fetch: Offline');
  }

  let finalUrl = url;
  if (finalUrl.includes('company_id=eq.null')) {
    finalUrl = finalUrl.replace('company_id=eq.null', 'company_id=is.null');
  }

  const controller = new AbortController();
  // Uploads and Edge Functions get a longer timeout; everything else 8s for fast offline fallback
  const isUpload = finalUrl.includes('/storage/v1/object/');
  const isEdgeFunction = finalUrl.includes('/functions/v1/');
  const timeoutDuration = isUpload || isEdgeFunction ? 60000 : 30000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

  try {
    const response = await fetch(finalUrl, { ...options, signal: controller.signal });
    // Successful — clear circuit breaker
    forceOfflineUntil = 0;

    return response;
  } catch (error) {
    // Trip the circuit breaker for 30 seconds on any network failure
    if (error.name === 'AbortError') {
      forceOfflineUntil = Date.now() + 30000;
      throw new TypeError('Failed to fetch: Request timeout');
    }
    if (
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('NetworkError') ||
      error.message?.includes('ERR_INTERNET_DISCONNECTED') ||
      error.message?.includes('ERR_NETWORK_CHANGED')
    ) {
      forceOfflineUntil = Date.now() + 30000;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Custom storage adapter to use cookies for cross-subdomain SSO
const createCookieStorage = () => {
  if (typeof document === 'undefined') return undefined; // SSR safe
  
  // Do not use cookies on native apps (Capacitor/Electron)
  if (isDesktopApp()) return undefined; 

  const { baseDomain, isCustomDomain } = getSubdomainAndBase();
  // We cannot set cross-subdomain cookies for custom domains easily without advanced routing,
  // and we don't need to for localhost.
  const domainAttr = (baseDomain === 'localhost' || isCustomDomain) 
    ? '' 
    : `; domain=.${baseDomain}`;

  return {
    getItem: (key) => {
      const match = document.cookie.match(new RegExp('(^| )' + encodeURIComponent(key) + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    },
    setItem: (key, value) => {
      // 365 days expiration
      const expires = new Date(Date.now() + 365 * 864e5).toUTCString();
      document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; expires=${expires}; path=/${domainAttr}; SameSite=Lax; Secure`;
    },
    removeItem: (key) => {
      document.cookie = `${encodeURIComponent(key)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domainAttr}; SameSite=Lax; Secure`;
    }
  };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Bypass Web Locks to prevent deadlocks in React Strict Mode
    lock: async (name, acquireTimeout, fn) => {
      return await fn();
    },
    // Start with autoRefreshToken disabled if we are offline at load time.
    // This stops the endless _recoverAndRefresh retry storm when loading offline.
    autoRefreshToken: typeof navigator !== 'undefined' ? navigator.onLine : true,
    detectSessionInUrl: true,
    persistSession: true,
    storage: createCookieStorage() || (typeof window !== 'undefined' ? window.localStorage : undefined)
  },
  global: {
    fetch: customFetch
  }
});

// Pause / resume Supabase's auto-refresh token loop based on connectivity.
// Without this, Supabase hammers the /auth/v1/token endpoint every few seconds
// when offline, flooding the console with errors.
if (typeof window !== 'undefined') {
  window.addEventListener('offline', () => {
    supabase.auth.stopAutoRefresh();
  });

  window.addEventListener('online', () => {
    supabase.auth.startAutoRefresh();
  });
}
