import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Circuit breaker mechanism: force immediate offline failures for 30s after a timeout
let forceOfflineUntil = 0;

const customFetch = async (url, options) => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new TypeError('Failed to fetch: Offline');
  }

  if (Date.now() < forceOfflineUntil) {
    throw new TypeError('Failed to fetch: Offline');
  }

  const controller = new AbortController();
  // Reduce timeout to 5 seconds to fail faster, unless it's a storage upload which might take longer
  const isUpload = url.includes('/storage/v1/object/');
  const timeoutDuration = isUpload ? 30000 : 5000;
  
  const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    // Successful response, meaning we are online. Clear circuit breaker.
    forceOfflineUntil = 0;
    return response;
  } catch (error) {
    // If we aborted due to timeout OR fetch failed due to actual network disconnect
    if (error.name === 'AbortError' || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      // Trip the circuit breaker for 30 seconds
      forceOfflineUntil = Date.now() + 30000;
      throw new TypeError('Failed to fetch: Request timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    lock: async (name, acquireTimeout, fn) => {
      // Bypass Web Locks to prevent deadlocks in React Strict Mode
      return await fn();
    }
  },
  global: {
    fetch: customFetch
  }
});
