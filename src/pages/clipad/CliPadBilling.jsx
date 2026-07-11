import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { Check, CreditCard, Loader2, Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function CliPadBilling() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const [currentPlan, setCurrentPlan] = useState('free');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Load Paystack script
    const script = document.createElement('script');
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);

    fetchSubscription();

    return () => {
      document.body.removeChild(script);
    };
  }, [companyId]);

  const fetchSubscription = async () => {
    if (!companyId) {
      setInitializing(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('company_subscriptions')
        .select('plan_id, status')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .maybeSingle();

      if (data) {
        setCurrentPlan(data.plan_id || 'free');
      } else {
        setCurrentPlan('free');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInitializing(false);
    }
  };

  const handleUpgrade = async (planType, amount) => {
    setLoading(true);
    try {
      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_mock', // Fallback for dev
        email: user?.email || 'user@example.com',
        amount: amount * 100, // in kobo/cents
        currency: 'USD',
        ref: '' + Math.floor((Math.random() * 1000000000) + 1), // generates a pseudo-unique reference
        callback: function (response) {
          toast({
            title: 'Payment Successful',
            description: `Reference: ${response.reference}. You are now on the ${planType.toUpperCase()} plan.`,
          });
          
          setCurrentPlan(planType);
          
          if (companyId) {
            supabase.from('company_subscriptions').upsert({
              company_id: companyId,
              plan_id: planType,
              status: 'active',
              paystack_customer_code: response.reference,
              updated_at: new Date().toISOString()
            }).then(() => fetchSubscription());
          }
        },
        onClose: function () {
          toast({ title: 'Payment Cancelled', description: 'Window closed.' });
        },
      });
      handler.openIframe();
    } catch (err) {
      toast({ title: 'Error', description: 'Could not initialize Paystack', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Billing & Plans</h2>
        <p className="text-muted-foreground mt-2">Manage your CliPad subscription and features.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* FREE PLAN */}
        <div className={`p-6 rounded-2xl border ${currentPlan === 'free' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
          <h3 className="text-xl font-bold">Free</h3>
          <p className="text-3xl font-bold mt-4">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          <ul className="mt-6 space-y-3">
            <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> 10 Video Meetings</li>
            <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> Basic AI Summaries</li>
            <li className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="w-4 h-4 text-slate-300 dark:text-slate-700" /> No Cloud Recordings</li>
          </ul>
          <button disabled className="w-full mt-8 py-2 rounded-xl bg-secondary text-foreground font-semibold border border-border">
            {currentPlan === 'free' ? 'Current Plan' : 'Downgrade'}
          </button>
        </div>

        {/* PRO PLAN */}
        <div className={`relative p-6 rounded-2xl border ${currentPlan === 'pro' ? 'border-primary bg-primary/5' : 'border-primary/50 bg-card shadow-lg'}`}>
          {currentPlan !== 'pro' && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Recommended
            </div>
          )}
          <h3 className="text-xl font-bold">Pro</h3>
          <p className="text-3xl font-bold mt-4">$29<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          <ul className="mt-6 space-y-3">
            <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> Unlimited Meetings</li>
            <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> Advanced AI Action Items</li>
            <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> Cloud Recordings (Daily.co)</li>
          </ul>
          <button 
            onClick={() => handleUpgrade('pro', 29)}
            disabled={currentPlan === 'pro' || loading}
            className={`w-full mt-8 py-2 rounded-xl font-semibold transition-all ${currentPlan === 'pro' ? 'bg-secondary text-foreground border border-border' : 'bg-primary text-white hover:bg-primary/90'}`}>
            {currentPlan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
          </button>
        </div>

        {/* CUSTOM PLAN */}
        <div className={`p-6 rounded-2xl border ${currentPlan === 'custom' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
          <h3 className="text-xl font-bold">Custom</h3>
          <p className="text-3xl font-bold mt-4">Let's Talk</p>
          <ul className="mt-6 space-y-3">
            <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> Dedicated Account Manager</li>
            <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> Custom Payment Subdomains</li>
            <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> Enterprise SLAs</li>
          </ul>
          <button 
            onClick={() => handleUpgrade('custom', 199)}
            disabled={currentPlan === 'custom' || loading}
            className={`w-full mt-8 py-2 rounded-xl font-semibold border ${currentPlan === 'custom' ? 'bg-secondary text-foreground border-border' : 'bg-background text-foreground hover:bg-secondary border-border'}`}>
            {currentPlan === 'custom' ? 'Current Plan' : 'Contact Sales'}
          </button>
        </div>
      </div>
    </div>
  );
}
