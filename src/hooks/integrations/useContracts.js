import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export const useContracts = () => {
  const [isSending, setIsSending] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';

  const sendForSignature = async ({ companyId, provider = 'docusign', documentName, signerEmail, signerName }) => {
    setIsSending(true);
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/send-contract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          companyId,
          provider, 
          documentName,
          signerEmail,
          signerName
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to send contract for signature');
      }

      toast({
        title: "Sent for Signature",
        description: `Successfully sent to ${signerEmail} via ${provider}.`,
        variant: "default"
      });
      return data; 
    } catch (error) {
      console.error("Contract Error:", error);
      toast({
        title: "Sending Failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  return { sendForSignature, isSending };
};
