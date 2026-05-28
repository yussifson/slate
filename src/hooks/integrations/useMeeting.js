import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export const useMeeting = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';

  const generateMeetingLink = async ({ companyId, provider = 'zoom', topic, duration, startTime }) => {
    setIsGenerating(true);
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

      toast({
        title: "Meeting Generated",
        description: `Successfully created ${provider} meeting room.`,
        variant: "default"
      });
      return data.data; // returns { join_url, start_url, password }
    } catch (error) {
      console.error("Meeting Error:", error);
      toast({
        title: "Meeting Generation Failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateMeetingLink, isGenerating };
};
