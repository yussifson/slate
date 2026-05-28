import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export const useCalendar = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';

  const syncEvent = async ({ companyId, provider, eventDetails }) => {
    setIsSyncing(true);
    try {
      // eventDetails should include: title, startTime, endTime, description, attendees
      const res = await fetch(`${supabaseUrl}/functions/v1/sync-calendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          companyId,
          provider, // 'google' or 'microsoft'
          eventDetails
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Calendar sync failed');
      }

      toast({
        title: "Calendar Synced",
        description: `Event added to ${provider === 'google' ? 'Google Calendar' : 'Outlook'}.`,
        variant: "default"
      });
      return data;
    } catch (error) {
      toast({
        title: "Sync Error",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  return { syncEvent, isSyncing };
};
