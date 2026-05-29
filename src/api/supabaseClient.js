import { createClient } from '@supabase/supabase-js';

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

  const controller = new AbortController();
  // Uploads get a longer timeout; everything else 5s for fast offline fallback
  const isUpload = url.includes('/storage/v1/object/');
  const timeoutDuration = isUpload ? 30000 : 5000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
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
