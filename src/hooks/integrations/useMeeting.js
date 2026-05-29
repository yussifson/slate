import { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'react-hot-toast';

export const useMeeting = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { session } = useAuth();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';

  const generateMeetingLink = async ({ companyId, provider = 'zoom', topic, duration, startTime }) => {
    setIsGenerating(true);

    if (!navigator.onLine) {
      setTimeout(() => setIsGenerating(false), 500);
      toast.success(`[Offline] Generated local placeholder ${provider} meeting room.`);
      return { join_url: `https://offline.${provider}.com/j/${Date.now()}`, start_url: `https://offline.${provider}.com/s/${Date.now()}`, password: 'offline-pass' };
    }

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          companyId,
          provider, 
          topic,
          duration,
          startTime
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate meeting link');
      }

      toast.success(`Successfully created ${provider} meeting room.`);
      return data.data; // returns { join_url, start_url, password }
    } catch (error) {
      console.error("Meeting Error:", error);
      toast.error(`Meeting Generation Failed: ${error.message}`);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateMeetingLink, isGenerating };
};
