import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { initiatePaystackSubscription } from '@/lib/paystack';
import { Button } from '@/components/ui/button';
import { Scale, Check, LogOut, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Paywall() {
  const { user, refreshUser, logout } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState(null);

  const plans = [
    {
      name: "starter",
      displayName: "Starter Plan",
      price: 29,
      description: "Essential matter and client management for boutique chambers.",
      features: [
        "Up to 3 active users",
        "Up to 10 active Cases",
        "Matter & Pipeline Tracking",
        "Document storage (5 GB)",
        "Invoicing & billing tools",
        "Paystack secure checkout"
      ]
    },
    {
      name: "professional",
      displayName: "Professional Plan",
      price: 79,
      description: "Our most popular package for growing mid-sized practices.",
      features: [
        "Up to 10 active users",
        "Unlimited Cases & Clients",
        "Interactive Client Portals",
        "Document storage (25 GB)",
        "WhatsApp & Email Syncing",
        "Staff Payroll & Leave tools",
        "Conflict Checker module",
        "Priority 24/7 support"
      ],
      popular: true
    },
    {
      name: "enterprise",
      displayName: "Enterprise Plan",
      price: 199,
      description: "High-volume custom features for corporate multi-office legal teams.",
      features: [
        "Unlimited active users",
        "Unlimited Cases & Clients",
        "Dedicated Database server",
        "Document storage (250 GB)",
        "Custom branding & Favicon",
        "Legal research assistant API",
        "Data Export (JSON, Excel)",
        "Dedicated Account Executive"
      ]
    }
  ];

  const handleSubscribe = async (plan) => {
    if (!user || !user.company_id) return;
    setLoadingPlan(plan.name);

    try {
      await initiatePaystackSubscription({
        email: user.email,
        amount: plan.price,
        planName: plan.displayName,
        companyId: user.company_id,
        onSuccess: async (response) => {
          // 1. Update company record in Supabase
          const { error } = await supabase
            .from('companies')
            .update({
              subscription_plan: plan.name,
              subscription_status: 'active',
              max_users: plan.name === 'starter' ? 3 : plan.name === 'professional' ? 10 : 999,
              max_cases: plan.name === 'starter' ? 10 : 9999,
              max_storage_gb: plan.name === 'starter' ? 5 : plan.name === 'professional' ? 25 : 250
            })
            .eq('id', user.company_id);

          if (error) throw error;

          // 2. Add an invoice entry in Supabase to track history
          await supabase.from('subscription_invoices').insert({
            company_id: user.company_id,
            amount: plan.price,
            status: 'paid',
            plan_name: plan.displayName,
            paystack_ref: response.reference
          });

          // 3. Fire celebration confetti
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });

          // 4. Refresh user in Auth context
          await refreshUser();
          
          // Redirect home
          window.location.href = '/';
        },
        onClose: () => {
          setLoadingPlan(null);
        }
      });
    } catch (err) {
      console.error("Subscription payment failed:", err);
      alert("Error completing transaction. Please try again.");
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-12 px-6">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white">
            <Scale className="w-4.5 h-4.5" />
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">Airzyle</span>
        </div>
        <Button 
          variant="ghost" 
          onClick={() => logout(true)}
          className="text-slate-600 hover:text-slate-900 gap-1.5"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>

      {/* Main Panel */}
      <div className="max-w-6xl mx-auto w-full text-center my-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          Subscription Required
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-none mb-4">
          Activate your firm's workspace
        </h1>
        <p className="text-slate-600 text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-12">
          Your trial period has concluded. Choose a secure billing plan via Paystack to unlock your matters, documents, and client portals.
        </p>

        {/* Pricing options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left items-stretch">
          {plans.map((p, idx) => (
            <div 
              key={idx}
              className={`bg-white border rounded-2xl p-8 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative ${
                p.popular ? 'border-primary shadow-md' : 'border-slate-200'
              }`}
            >
              {p.popular && (
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[9px] font-bold tracking-wider uppercase py-1 px-3 rounded-full">
                  Recommended
                </div>
              )}

              <div>
                <h3 className="font-bold text-lg text-slate-900 mb-1">{p.displayName}</h3>
                <p className="text-xs text-slate-500 min-h-[32px] leading-relaxed mb-4">{p.description}</p>
                
                <div className="mb-6">
                  <span className="text-3xl font-black text-slate-900">${p.price}</span>
                  <span className="text-slate-400 text-xs font-medium"> / month</span>
                </div>

                <hr className="border-slate-100 mb-6" />

                <ul className="space-y-3 mb-8">
                  {p.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2.5 text-xs text-slate-600">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <Button 
                  onClick={() => handleSubscribe(p)}
                  disabled={loadingPlan !== null}
                  className={`w-full py-5 rounded-xl font-bold text-sm ${
                    p.popular 
                      ? 'bg-primary hover:bg-primary/95 text-white' 
                      : 'bg-slate-950 hover:bg-slate-900 text-white'
                  }`}
                >
                  {loadingPlan === p.name ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      Processing...
                    </>
                  ) : (
                    `Subscribe via Paystack`
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto w-full text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Airzyle. Transactions are fully secured and processed locally via Paystack.
      </div>
    </div>
  );
}
