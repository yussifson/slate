import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

export function useLogActivity() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ action, recordType, recordId, changes }) => {
      const error = await (async () => {
        const _p = {
          user_id: user?.id,
          user_email: user?.email,
          action,
          record_type: recordType,
          record_id: recordId,
          changes: changes || {},
          created_at: new Date().toISOString()
        };
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        try {
          await powerSync.execute(`INSERT INTO audit_logs (${_k.join(', ')}) VALUES (${_k.map(()=>'?').join(', ')})`, _v);
          return null;
        } catch(e) { return e; }
      })();
      if (error) console.warn('Audit log error (non-fatal):', error);
    }
  });
}
