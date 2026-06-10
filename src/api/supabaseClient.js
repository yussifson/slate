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

  // ----------------------------------------------------------------------
  // UNIV_* COMPONENTS HTTP PROXY
  // Intercept any queries to univ_* tables and map them to industry_records
  // ----------------------------------------------------------------------
  let finalUrl = url;
  let finalOptions = { ...options };
  let isUnivProxy = false;
  let tableName = '';

  const univMatch = url.match(/\/rest\/v1\/(univ_[a-zA-Z0-9_]+)/);
  if (univMatch) {
    isUnivProxy = true;
    tableName = univMatch[1];
    
    // Rewrite URL to industry_records
    finalUrl = url.replace(/\/rest\/v1\/univ_[a-zA-Z0-9_]+/, '/rest/v1/industry_records');
    
    // For GET requests, ensure we only fetch records belonging to this specific 'univ_' table
    if (finalOptions.method === 'GET') {
      finalUrl += (finalUrl.includes('?') ? '&' : '?') + `record_type=eq.${tableName}`;
    }

    // For POST / PATCH requests, we must wrap the raw object into the `data` column
    if ((finalOptions.method === 'POST' || finalOptions.method === 'PATCH') && finalOptions.body) {
       try {
         let bodyObj = JSON.parse(finalOptions.body);
         const isArray = Array.isArray(bodyObj);
         if (!isArray) bodyObj = [bodyObj];

         // If it's a PATCH, fetch the existing record to merge the JSON data so we don't wipe it!
         if (finalOptions.method === 'PATCH') {
            const getUrl = finalUrl + (finalUrl.includes('?') ? '&' : '?') + 'select=data';
            // Use original fetch to avoid infinite loops, we don't need the custom interceptor here
            const existingRes = await fetch(getUrl, { headers: finalOptions.headers });
            if (existingRes.ok) {
               const existingRows = await existingRes.json();
               if (existingRows.length > 0) {
                   const existingData = existingRows[0].data || {};
                   bodyObj = [{ ...existingData, ...bodyObj[0] }];
               }
            }
         }

         const newBody = bodyObj.map(obj => ({
           company_id: obj.company_id || undefined,
           industry: 'orbit_build_data',
           record_type: tableName,
           data: obj, // Wrap original fields inside the JSONB data column
           search_text: JSON.stringify(obj)
         }));

         finalOptions.body = JSON.stringify(isArray ? newBody : newBody[0]);
       } catch (e) {
         console.error('Failed to proxy univ_ mutation payload:', e);
       }
    }
  }

  const controller = new AbortController();
  // Uploads and Edge Functions get a longer timeout; everything else 8s for fast offline fallback
  const isUpload = finalUrl.includes('/storage/v1/object/');
  const isEdgeFunction = finalUrl.includes('/functions/v1/');
  const timeoutDuration = isUpload || isEdgeFunction ? 60000 : 30000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

  try {
    const response = await fetch(finalUrl, { ...finalOptions, signal: controller.signal });
    // Successful — clear circuit breaker
    forceOfflineUntil = 0;

    // ----------------------------------------------------------------------
    // UNIV_* COMPONENTS RESPONSE PROXY
    // Unwrap the `data` column back out into the root object for the components
    // ----------------------------------------------------------------------
    if (isUnivProxy && finalOptions.method === 'GET' && response.ok) {
       const clone = response.clone();
       const json = await clone.json();
       const mappedJson = json.map(row => ({
          id: row.id,
          company_id: row.company_id,
          ...(row.data || {}),
          created_at: row.created_at
       }));
       return new Response(JSON.stringify(mappedJson), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
       });
    }

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

// ----------------------------------------------------------------------
// UNIV_* COMPONENTS REALTIME PROXY
// Intercept Realtime channel subscriptions to map univ_ tables to industry_records
// ----------------------------------------------------------------------
const originalChannel = supabase.channel.bind(supabase);
supabase.channel = (name, opts) => {
  const chan = originalChannel(name, opts);
  const originalOn = chan.on.bind(chan);
  
  chan.on = (type, filter, callback) => {
    // If the component tries to listen to changes on a univ_* table...
    if (type === 'postgres_changes' && filter?.table && filter.table.startsWith('univ_')) {
      // Map the listener to industry_records instead!
      filter.table = 'industry_records';
      // The filter.filter already restricts by company_id, which is perfect.
    }
    return originalOn(type, filter, callback);
  };
  
  return chan;
};

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
