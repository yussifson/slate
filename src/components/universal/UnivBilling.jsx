import React, { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import {
  CreditCard, CheckCircle2, AlertTriangle, Zap,
  Shield, Star, Crown, History, ArrowRight
} from 'lucide-react';

// IMPORTANT: Add Paystack script to your index.html:
// <script src="https://js.paystack.co/v1/inline.js"></script>

export default function UnivBilling({
  title = 'Billing & Plans',
  companyId,
  pageName
}) {
  const { toast } = useToast();
  const hookCompanyId = useCompanyId();
  const effectiveCompanyId = companyId || hookCompanyId;

  const { subscription, plan, isActive, status, isLoading: subLoading, checkLimit } = useSubscription();
  const aiLimit = checkLimit('ai_credits_monthly');

  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch available plans from the database
  const { data: availablePlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['subscription_plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  const handleSubscribe = async (targetPlan) => {
    if (!targetPlan.paystack_plan_code) {
      toast({ title: "Plan configuration error", description: "This plan does not have a valid Paystack Plan Code.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Get user email (we need this for Paystack)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // 2. Initialize Paystack Popup
      // Note: You must replace 'YOUR_PAYSTACK_PUBLIC_KEY' with your actual public key from .env
      const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_YOUR_KEY';
      
      const handler = window.PaystackPop.setup({
        key: paystackPublicKey,
        email: user.email,
        amount: targetPlan.price_monthly * 100, // Paystack amount is in kobo/cents
        plan: targetPlan.paystack_plan_code,
        metadata: {
          custom_fields: [
            {
              display_name: "Company ID",
              variable_name: "company_id",
              value: effectiveCompanyId
            },
            {
              display_name: "Plan ID",
              variable_name: "plan_id",
              value: targetPlan.id
            }
          ]
        },
        onClose: () => {
          setIsProcessing(false);
          toast({ title: "Payment cancelled", description: "You closed the payment window." });
        },
        callback: (response) => {
          setIsProcessing(false);
          // Webhook will handle the actual DB update, but we can optimistically show success
          toast({ 
            title: "Subscription successful!", 
            description: "Your payment was processed. Your account will be upgraded momentarily." 
          });
        }
      });

      handler.openIframe();
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      toast({ title: "Error initiating payment", description: error.message, variant: "destructive" });
    }
  };

  if (subLoading || plansLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading billing details...</div>;
  }

  const currentPlanId = plan?.id;

  return (
    <div className="flex flex-col h-full bg-background font-sans overflow-y-auto">
      <div className="p-6 sm:p-8 max-w-6xl mx-auto w-full space-y-8">
        
        {/* Header & Current Status */}
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1">Manage your subscription, billing details, and view your usage.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-foreground">Current Plan: {plan?.name || 'Free'}</h2>
              <span className={cn("px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md border", 
                isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"
              )}>
                {status}
              </span>
            </div>
            <p className="text-muted-foreground max-w-xl">
              {isActive 
                ? `You are currently on the ${plan?.name} plan. Your next billing date is ${subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'N/A'}.` 
                : "You do not have an active subscription. Upgrade to unlock premium features."}
            </p>
          </div>
          <div className="bg-muted rounded-xl p-4 min-w-[200px]">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5"><Zap className="w-3 h-3 text-amber-500" /> AI Credits (Monthly)</div>
            <div className="flex items-end gap-1 mb-2">
              <span className="text-2xl font-black">{aiLimit.current}</span>
              <span className="text-sm font-medium text-muted-foreground pb-1">/ {aiLimit.max || '∞'}</span>
            </div>
            <div className="w-full h-2 bg-background rounded-full overflow-hidden">
              <div 
                className={cn("h-full transition-all", aiLimit.allowed ? "bg-amber-500" : "bg-red-500")} 
                style={{ width: `${Math.min((aiLimit.current / Math.max(aiLimit.max, 1)) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Pricing Table */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-4">Available Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availablePlans.map((p) => {
              const isCurrent = p.id === currentPlanId;
              
              // Helper to parse features json safely
              const features = p.features ? Object.keys(p.features).filter(k => p.features[k]) : [];
              const limits = p.limits || {};

              return (
                <div key={p.id} className={cn(
                  "bg-card rounded-2xl p-6 sm:p-8 flex flex-col relative transition-all",
                  isCurrent ? "border-2 border-primary shadow-md" : "border border-border shadow-sm hover:border-primary/50"
                )}>
                  {isCurrent && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                      Current Plan
                    </div>
                  )}
                  <h4 className="text-xl font-bold text-foreground mb-2">{p.name}</h4>
                  <div className="flex items-end gap-1 mb-6">
                    <span className="text-4xl font-black">${p.price_monthly}</span>
                    <span className="text-muted-foreground font-medium mb-1">/ mo</span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span><strong>{limits.users || 1}</strong> User Seats</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span><strong>{limits.ai_credits_monthly || 0}</strong> AI Credits / mo</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span><strong>{limits.storage_gb || 0}GB</strong> Storage</span>
                    </li>
                    {features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="capitalize">{f.replace(/_/g, ' ')}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => handleSubscribe(p)}
                    disabled={isCurrent || isProcessing}
                    className={cn(
                      "w-full py-2.5 rounded-lg text-sm font-bold transition-colors",
                      isCurrent ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-white hover:bg-primary/90 shadow-sm"
                    )}
                  >
                    {isProcessing && !isCurrent ? 'Processing...' : isCurrent ? 'Active Plan' : 'Subscribe via Paystack'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <History className="w-5 h-5 text-primary" /> Billing History
            </h3>
          </div>
          <div className="text-center py-10 text-muted-foreground">
            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No recent transactions found.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
