import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { logAuditEvent } from '@/lib/auditLogger';
import { Check, Loader2, Sparkles, FileText, ArrowUpRight } from 'lucide-react';
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
  const [history, setHistory] = useState([]);
  const [usedStorageGB, setUsedStorageGB] = useState(0);

  useEffect(() => {
    // Load Paystack script
    const script = document.createElement('script');
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);

    fetchSubscription();
    fetchExchangeRate();
    fetchHistory();

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

      // 2. Fallback: read from companies.pricing_tag_id (already fetched in step 0)
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

  
  const fetchHistory = async () => {
    if (!companyId) return;
    try {
      const { data } = await supabase
        .from('optavel_transactions')
        .select('*')
        .eq('company_id', companyId)
        .eq('category', 'clipad_billing')
        .order('created_at', { ascending: false });
      if (data) setHistory(data);
    } catch (e) {
      console.error(e);
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
          
          const receiptNum = `CLIP-${Date.now().toString(36).toUpperCase()}-${planType.slice(0,3).toUpperCase()}`;
          const newReceipt = {
            reference: response.reference,
            receiptNumber: receiptNum,
            amount: amountInPesewas,
            currency: 'GHS',
            plan: planType,
            date: new Date().toISOString(),
            email: user?.email || 'user@example.com',
            companyName: companyName || undefined,
            isAdminAssigned: false,
          };
          setReceiptDetails(newReceipt);
          setCurrentPlan(planType);
          
          if (companyId) {
            supabase.from('company_subscriptions').upsert({
              company_id: companyId,
              plan_id: planType,
              status: 'active',
              paystack_customer_code: response.reference,
              updated_at: new Date().toISOString()
            }).then(() => fetchSubscription());

            supabase.from('optavel_transactions').insert({
              id: receiptNum,
              company_id: companyId,
              amount: amountInPesewas,
              type: 'subscription',
              category: 'clipad_billing',
              description: JSON.stringify(newReceipt),
              date: new Date().toISOString(),
              created_at: new Date().toISOString()
            }).then(() => fetchHistory());
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

      {/* Storage Progress */}
      <div className="p-6 rounded-2xl border border-border bg-card">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-foreground">This Month's Storage Usage</h3>
          <span className="text-sm text-muted-foreground">
            {usedStorageGB.toFixed(2)} GB / {PLAN_LIMITS[currentPlan]?.maxStorageGB === Infinity ? 'Unlimited' : `${PLAN_LIMITS[currentPlan]?.maxStorageGB} GB`} Used
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mb-1 overflow-hidden">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${PLAN_LIMITS[currentPlan]?.maxStorageGB !== Infinity && (usedStorageGB / PLAN_LIMITS[currentPlan]?.maxStorageGB) > 0.9 ? 'bg-red-500' : 'bg-primary'}`}
            style={{ width: `${PLAN_LIMITS[currentPlan]?.maxStorageGB === Infinity ? (usedStorageGB > 0 ? 5 : 0) : Math.min(100, (usedStorageGB / PLAN_LIMITS[currentPlan]?.maxStorageGB) * 100)}%` }}
          ></div>
        </div>
        {PLAN_LIMITS[currentPlan]?.maxStorageGB !== Infinity && (usedStorageGB / PLAN_LIMITS[currentPlan]?.maxStorageGB) > 0.9 && (
          <p className="text-xs text-red-500 mt-2">You are approaching your storage limit. Upgrade your plan to continue recording.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* FREE PLAN */}
        <div className={`p-6 rounded-2xl border ${currentPlan === 'free' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
          <h3 className="text-xl font-bold">Free</h3>
          <p className="text-3xl font-bold mt-4">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          <ul className="mt-6 space-y-3">
            <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> 10 Video Meetings</li>
            <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> Basic AI Summaries</li>
            <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> 2GB Cloud Storage / month</li>
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
            <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> 15GB Cloud Storage / month</li>
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
            <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> 50GB Cloud Storage / month</li>
          </ul>
          <button 
            onClick={() => handleUpgrade('enterprise')}
            disabled={currentPlan === 'enterprise' || loading}
            className={`w-full mt-8 py-2 rounded-xl font-semibold border ${currentPlan === 'enterprise' ? 'bg-secondary text-foreground border-border' : 'bg-background text-foreground hover:bg-secondary border-border'}`}>
            {currentPlan === 'enterprise' ? 'Current Plan' : 'Upgrade to Enterprise'}
          </button>
        </div>
      </div>
      {/* Billing History */}
      <div className="mt-12">
        <h3 className="text-xl font-bold text-foreground mb-6">Billing History & Receipts</h3>
        {history.length === 0 ? (
          <div className="p-8 text-center bg-card border border-border rounded-2xl text-muted-foreground flex flex-col items-center justify-center gap-2">
            <FileText className="w-8 h-8 opacity-50" />
            <p>No billing history found.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-500">Date</th>
                  <th className="px-6 py-4 font-semibold text-slate-500">Receipt #</th>
                  <th className="px-6 py-4 font-semibold text-slate-500">Plan</th>
                  <th className="px-6 py-4 font-semibold text-slate-500">Amount</th>
                  <th className="px-6 py-4 font-semibold text-slate-500">Status</th>
                  <th className="px-6 py-4 font-semibold text-slate-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((tx) => {
                  let rDetails = {};
                  try { rDetails = JSON.parse(tx.description); } catch(e){}
                  
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {tx.id}
                      </td>
                      <td className="px-6 py-4 capitalize text-slate-600 dark:text-slate-400">
                        {rDetails.plan || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {rDetails.isAdminAssigned ? 'Admin Assigned' : `GHS ${(tx.amount / 100).toFixed(2)}`}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 rounded-full text-xs font-bold uppercase tracking-wider">
                          Paid
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setReceiptDetails(rDetails)}
                          className="text-primary hover:text-primary/80 font-semibold flex items-center justify-end gap-1 w-full"
                        >
                          View Receipt <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ContactSalesModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
      <PaymentReceiptModal isOpen={!!receiptDetails} onClose={() => setReceiptDetails(null)} transactionDetails={receiptDetails} />
    </div>
  );
}
