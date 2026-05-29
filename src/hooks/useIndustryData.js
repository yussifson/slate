import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useCompany } from './useCompanyId';
import { get, set } from 'idb-keyval';

// --- IndexedDB Cache Helpers (mirrors base44Client pattern) ---
const IDR_OUTBOX_KEY = 'idr_offline_outbox';

const getIdrCache = async (key) => {
  try {
    const val = await get(key);
    return val || [];
  } catch (e) {
    return [];
  }
};

const setIdrCache = async (key, data) => {
  try {
    await set(key, data);
  } catch (e) {}
};

const getIdrOutbox = async () => {
  try {
    const val = await get(IDR_OUTBOX_KEY);
    return val || [];
  } catch (e) {
    return [];
  }
};

const setIdrOutbox = async (outbox) => {
  try {
    await set(IDR_OUTBOX_KEY, outbox);
  } catch (e) {}
};

// Background sync: flush outbox when back online
const syncIdrOutbox = async () => {
  if (!navigator.onLine) return;
  const outbox = await getIdrOutbox();
  if (outbox.length === 0) return;

  console.log(`[IDR Offline Sync] Found ${outbox.length} queued mutations. Syncing...`);
  const remaining = [];

  for (const item of outbox) {
    try {
      if (item.op === 'upsert') {
        await supabase.from('industry_records').upsert(item.record);
      } else if (item.op === 'delete') {
        await supabase.from('industry_records').delete().eq('id', item.id).eq('company_id', item.companyId);
      }
      console.log(`[IDR Offline Sync] Synced ${item.op} for ${item.record?.record_type || item.id}`);
    } catch (err) {
      console.error(`[IDR Offline Sync] Failed, re-queuing.`, err);
      remaining.push(item);
    }
  }

  await setIdrOutbox(remaining);
  if (remaining.length === 0) {
    console.log('[IDR Offline Sync] All operations synced successfully.');
    window.dispatchEvent(new CustomEvent('idr_sync_complete'));
  }
};

// Register online listener for background sync
if (typeof window !== 'undefined') {
  window.addEventListener('online', syncIdrOutbox);
  setTimeout(syncIdrOutbox, 2000);
}

/**
 * Hook to fetch generic industry records with full offline-first support.
 * On success: writes to IndexedDB cache.
 * On failure (offline/network error): reads from IndexedDB cache.
 */
export function useIndustryRecords(recordType) {
  const { company } = useCompany();
  const companyId = company?.id;
  const industry = company?.industry_type;
  const cacheKey = `idr_cache_${companyId}_${recordType}`;

  return useQuery({
    queryKey: ['industry_records', companyId, industry, recordType],
    queryFn: async () => {
      if (!companyId || !industry || !recordType) return [];

      if (!navigator.onLine) {
        return await getIdrCache(cacheKey);
      }

      try {
        const { data, error } = await supabase
          .from('industry_records')
          .select('*')
          .eq('company_id', companyId)
          .eq('industry', industry)
          .eq('record_type', recordType)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Cache the fresh data for offline use
        await setIdrCache(cacheKey, data);
        return data;
      } catch (err) {
        // Network error or timeout — fall back to local cache silently
        console.warn(`[Offline Mode] useIndustryRecords(${recordType}) failed, using cache.`, err.message);
        const cached = await getIdrCache(cacheKey);
        return cached;
      }
    },
    enabled: !!companyId && !!industry && !!recordType,
    // Return stale/cached data while revalidating — never show empty on load
    placeholderData: (prev) => prev,
  });
}


/**
 * Hook to create or update an industry record — with offline queuing.
 */
export function useMutateIndustryRecord() {
  const queryClient = useQueryClient();
  const { company } = useCompany();
  const companyId = company?.id;
  const industry = company?.industry_type;

  return useMutation({
    mutationFn: async ({ id, recordType, payload, status, searchText }) => {
      if (!companyId || !industry || !recordType) {
        throw new Error("Missing context to save record.");
      }

      const record = {
        ...(id ? { id } : {}),
        company_id: companyId,
        industry,
        record_type: recordType,
        data: payload,
        status: status || null,
        search_text: searchText || null,
      };

      // Optimistically update local cache immediately
      const cacheKey = `idr_cache_${companyId}_${recordType}`;
      const cached = await getIdrCache(cacheKey);
      if (id) {
        const updated = cached.map(r => r.id === id ? { ...r, ...record } : r);
        await setIdrCache(cacheKey, updated);
      } else {
        const tempId = crypto.randomUUID();
        record.id = tempId;
        record.created_at = new Date().toISOString();
        await setIdrCache(cacheKey, [record, ...cached]);
      }

      // Try to persist to server
      if (!navigator.onLine) {
        console.warn(`[Offline Mode] useMutateIndustryRecord offline, queuing immediately.`);
        const outbox = await getIdrOutbox();
        await setIdrOutbox([...outbox, { op: 'upsert', record }]);
        return record;
      }

      try {
        let result;
        if (id) {
          result = await supabase
            .from('industry_records')
            .update(record)
            .eq('id', id)
            .select()
            .single();
        } else {
          result = await supabase
            .from('industry_records')
            .insert(record)
            .select()
            .single();
        }

        if (result.error) throw result.error;
        return result.data;
      } catch (err) {
        // Queue to outbox for later sync
        console.warn(`[Offline Mode] useMutateIndustryRecord failed, queuing.`, err.message);
        const outbox = await getIdrOutbox();
        await setIdrOutbox([...outbox, { op: 'upsert', record }]);
        // Return the locally saved record so UI closes normally
        return record;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['industry_records', companyId, industry, data.record_type],
        (old = []) => {
          const exists = old.find(r => r.id === data.id);
          if (exists) return old.map(r => r.id === data.id ? data : r);
          return [data, ...old];
        }
      );
      queryClient.invalidateQueries(['industry_records', companyId, industry, data.record_type]);
    },
  });
}

/**
 * Hook to delete an industry record — with offline queuing.
 */
export function useDeleteIndustryRecord() {
  const queryClient = useQueryClient();
  const { company } = useCompany();
  const companyId = company?.id;

  return useMutation({
    mutationFn: async ({ id, recordType }) => {
      // Optimistically remove from local cache
      const cacheKey = `idr_cache_${companyId}_${recordType}`;
      const cached = await getIdrCache(cacheKey);
      await setIdrCache(cacheKey, cached.filter(r => r.id !== id));

      if (!navigator.onLine) {
        console.warn(`[Offline Mode] useDeleteIndustryRecord offline, queuing immediately.`);
        const outbox = await getIdrOutbox();
        await setIdrOutbox([...outbox, { op: 'delete', id, companyId }]);
        return { id, recordType };
      }

      try {
        const { error } = await supabase
          .from('industry_records')
          .delete()
          .eq('id', id)
          .eq('company_id', companyId);

        if (error) throw error;
        return { id, recordType };
      } catch (err) {
        // Queue delete for later sync
        console.warn(`[Offline Mode] useDeleteIndustryRecord failed, queuing.`, err.message);
        const outbox = await getIdrOutbox();
        await setIdrOutbox([...outbox, { op: 'delete', id, companyId }]);
        return { id, recordType };
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['industry_records', companyId, company?.industry_type, data.recordType],
        (old = []) => old.filter(r => r.id !== data.id)
      );
      queryClient.invalidateQueries(['industry_records', companyId, company?.industry_type, data.recordType]);
    },
  });
}
