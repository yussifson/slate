import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

export function useLogActivity() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ action, recordType, recordId, changes }) => {
      const { error } = await supabase.from('audit_logs').insert({
        user_id: user?.id,
        user_email: user?.email,
        action,
        record_type: recordType,
        record_id: recordId,
        changes: changes || {},
        created_at: new Date().toISOString()
      });
      if (error) console.warn('Audit log error (non-fatal):', error);
    }
  });
}
