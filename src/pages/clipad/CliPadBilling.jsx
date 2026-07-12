import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import ContactSalesModal from '@/components/clipad/ContactSalesModal';
import PaymentReceiptModal from '@/components/clipad/PaymentReceiptModal';

export default function CliPadBilling() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const [currentPlan, setCurrentPlan] = useState('free');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(218 / 19); // Fallback: 218 GHS for $19
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [receiptDetails, setReceiptDetails] = useState(null);

  useEffect(() => {
    // Load Paystack script
    const script = document.createElement('script');
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);

    fetchSubscription();
    fetchExchangeRate();

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
      // 0. Fetch company name for receipts
      const { data: companyData } = await supabase
        .from('companies')
        .select('name, clipad_pricing_tags(name)')
        .eq('id', companyId)
        .maybeSingle();
      if (companyData?.name) setCompanyName(companyData.name);

      // 1. Check company_subscriptions (set by Paystack payments or admin sync trigger)
      const { data: subData } = await supabase
        .from('company_subscriptions')
        .select('plan_id, status')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .maybeSingle();

      if (subData?.plan_id && subData.plan_id !== 'free') {
        setCurrentPlan(subData.plan_id);
        setInitializing(false);
        return;
      }

      // 2. Fallback: read from companies.pricing_tag_id (set by super-admin directly)
      const { data: companyData } = await supabase
        .from('companies')
        .select('pricing_tag_id, clipad_pricing_tags(name)')
        .eq('id', companyId)
        .maybeSingle();

      if (companyData?.clipad_pricing_tags?.name) {
        const tagName = companyData.clipad_pricing_tags.name.toLowerCase();
        if (tagName.includes('enterprise')) {
          setCurrentPlan('enterprise');
        } else if (tagName.includes('pro')) {
          setCurrentPlan('pro');
        } else {
          setCurrentPlan(subData?.plan_id || 'free');
        }
      } else {
        setCurrentPlan(subData?.plan_id || 'free');
      }
    } catch (e) {
      console.error(e);
      setCurrentPlan('free');
    } finally {
      setInitializing(false);
    }
  };

  const fetchExchangeRate = async () => {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data && data.rates && data.rates.GHS) {
        setExchangeRate(data.rates.GHS);
      } else {
        setExchangeRate(218 / 19);
      }
    } catch (e) {
      console.error('Exchange rate fetch failed, using fallback 218 GHS', e);
      setExchangeRate(218 / 19);
    }
  };

  const handleUpgrade = async (planType) => {
    setLoading(true);
    try {
      const isPro = planType === 'pro';
      const amountInGhs = isPro ? 105 : 450;
      const amountInPesewas = amountInGhs * 100;
      const planCode = isPro 
            ? (import.meta.env.VITE_PAYSTACK_PLAN_CODE_PRO || 'PLN_rz16cups3jarao2')
            : (import.meta.env.VITE_PAYSTACK_PLAN_CODE_ENTERPRISE || 'PLN_0g01fqqgeymnsj7');

      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_mock', // Fallback for dev
        email: user?.email || 'user@example.com',
        amount: amountInPesewas, 
        currency: 'GHS',
        plan: planCode, // Add Paystack Plan code for subscriptions
        ref: '' + Math.floor((Math.random() * 1000000000) + 1), // generates a pseudo-unique reference
        callback: function (response) {
          toast({
            title: 'Payment Successful',
            description: `Reference: ${response.reference}. You are now on the ${planType.toUpperCase()} plan.`,
          });
          
          setReceiptDetails({
            reference: response.reference,
            receiptNumber: `CLIP-${Date.now().toString(36).toUpperCase()}-${planType.slice(0,3).toUpperCase()}`,
            amount: amountInPesewas,
            currency: 'GHS',
            plan: planType,
            date: new Date().toISOString(),
            email: user?.email || 'user@example.com',
            companyName: companyName || undefined,
            isAdminAssigned: false,
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
          <p className="text-3xl font-bold mt-4">$9<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          <p className="text-xs text-muted-foreground mt-1">
            Billed in GHS (105 GHS)
          </p>
          <ul className="mt-6 space-y-3">
            <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> Unlimited Meetings</li>
            <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> Advanced AI Action Items</li>
            <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> Cloud Recordings (Daily.co)</li>
          </ul>
          <button 
            onClick={() => handleUpgrade('pro')}
            disabled={currentPlan === 'pro' || loading}
            className={`w-full mt-8 py-2 rounded-xl font-semibold transition-all ${currentPlan === 'pro' ? 'bg-secondary text-foreground border border-border' : 'bg-primary text-white hover:bg-primary/90'}`}>
            {currentPlan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
          </button>
        </div>

        {/* ENTERPRISE PLAN */}
        <div className={`p-6 rounded-2xl border ${currentPlan === 'enterprise' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
          <h3 className="text-xl font-bold">Enterprise</h3>
          <p className="text-3xl font-bold mt-4">$39<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          <p className="text-xs text-muted-foreground mt-1">
            Billed in GHS (450 GHS)
          </p>
          <ul className="mt-6 space-y-3">
            <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> Dedicated Account Manager</li>
            <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> Custom Payment Subdomains</li>
            <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> Enterprise SLAs</li>
          </ul>
          <button 
            onClick={() => handleUpgrade('enterprise')}
            disabled={currentPlan === 'enterprise' || loading}
            className={`w-full mt-8 py-2 rounded-xl font-semibold border ${currentPlan === 'enterprise' ? 'bg-secondary text-foreground border-border' : 'bg-background text-foreground hover:bg-secondary border-border'}`}>
            {currentPlan === 'enterprise' ? 'Current Plan' : 'Upgrade to Enterprise'}
          </button>
        </div>
      </div>
      <ContactSalesModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
      <PaymentReceiptModal isOpen={!!receiptDetails} onClose={() => setReceiptDetails(null)} transactionDetails={receiptDetails} />
    </div>
  );
}
