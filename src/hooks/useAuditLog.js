import { powerSync } from '@/api/PowerSyncConnector';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

export function useLogActivity() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ action, recordType, recordId, changes }) => {
      const error = await (async () => {
        const _payload = {
          id: crypto.randomUUID(),
          user_id: user?.id,
          user_email: user?.email,
          action,
          record_type: recordType,
          record_id: recordId,
          changes: changes || {},
          created_at: new Date().toISOString()
        };
        const _keys = Object.keys(_payload);
        const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        try {
          await powerSync.execute(`INSERT INTO audit_logs (${_keys.join(', ')}) VALUES (${_keys.map(()=>'?').join(', ')})`, _vals);
          return null;
        } catch(e) { return e; }
      })();
      if (error) console.warn('Audit log error (non-fatal):', error);
    }
  });
}
