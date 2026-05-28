import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export const usePayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';

  const processPayment = async ({ companyId, provider, amount, currency, customerEmail, invoiceId }) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          companyId,
          provider, // 'stripe' or 'paystack'
          amount,
          currency: currency || (provider === 'paystack' ? 'NGN' : 'USD'),
          customerEmail,
          returnUrl: `${window.location.origin}/invoices/${invoiceId}`
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Payment processing failed');
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
      return data;
    } catch (error) {
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const syncInvoiceToQuickBooks = async ({ companyId, invoiceDetails }) => {
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/sync-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          companyId,
          provider: 'quickbooks',
          invoiceDetails
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'QuickBooks sync failed');
      
      toast({ title: "Invoice Synced", description: "Successfully pushed to QuickBooks." });
      return data;
    } catch (error) {
      console.error("QB Sync Error:", error);
      toast({ title: "Sync Failed", description: error.message, variant: "destructive" });
    }
  };

  return { processPayment, syncInvoiceToQuickBooks, isPaymentLoading: isLoading };
};
