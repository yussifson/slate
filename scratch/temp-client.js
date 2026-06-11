import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://wmabgiafwamxkcgxyhee.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtYWJnaWFmd2FteGtjZ3h5aGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NTk0MjIsImV4cCI6MjA5NTMzNTQyMn0.cXS4DjYP_KEMDJ5n1QXOfOu0TGxUOQktf_j88Y9FHpk";

// Circuit breaker: after one timeout, skip all network requests for 30 seconds.
let forceOfflineUntil = 0;

const customFetch = async (url, options) => {
  // If browser reports offline, fail immediately
  if (false) {
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

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

export { supabase };