import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { initiatePaystackSubscription } from '@/lib/paystack';
import { Button } from '@/components/ui/button';
import { Scale, Check, LogOut, Loader2, Sparkles, Server, Shield, Database, Headphones } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import confetti from 'canvas-confetti';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import { getMainAppUrl } from '@/lib/domainUtils';
import { NotificationService } from '@/lib/notifications';

export default function Paywall() {
  const { t } = useTranslation();
  const { user, refreshUser, logout } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [showOffCloudDialog, setShowOffCloudDialog] = useState(false);

  const plans = [
    {
      name: "starter",
      displayName: "Starter Plan",
      price: SUBSCRIPTION_PLANS.starter.price,
      description: "Essential management for boutique firms.",
      features: [
        `Up to ${SUBSCRIPTION_PLANS.starter.maxUsers} active users`,
        `Up to ${SUBSCRIPTION_PLANS.starter.maxCases} projects/cases`,
        "1 Industry Suite access",
        "Limited AI features",
        `Document storage (${SUBSCRIPTION_PLANS.starter.maxStorageGB} GB)`,
        "Paystack secure checkout"
      ]
    },
    {
      name: "professional",
      displayName: "Professional Plan",
      price: SUBSCRIPTION_PLANS.professional.price,
      description: "Our most popular package for growing mid-sized practices.",
      features: [
        `Up to ${SUBSCRIPTION_PLANS.professional.maxUsers} active users`,
        `Up to ${SUBSCRIPTION_PLANS.professional.maxCases} projects/cases`,
        "All Industry Suites access",
        "Industry Switcher tool",
        "Full AI capabilities",
        `Document storage (${SUBSCRIPTION_PLANS.professional.maxStorageGB} GB)`,
        "Paystack secure checkout"
      ],
      popular: true
    },
    {
      name: "enterprise",
      displayName: "Enterprise Plan",
      price: SUBSCRIPTION_PLANS.enterprise.price,
      description: "High-volume custom features for corporate multi-office teams.",
      features: [
        "Unlimited active users",
        "Unlimited projects/cases",
        "All Industry Suites access",
        "Dedicated Database server",
        "Full AI capabilities",
        "Custom branding & Favicon",
        "Data Export (JSON, Excel)",
        "Priority 24/7 support"
      ]
    },
    {
      name: "off_cloud",
      displayName: "Off-Cloud",
      price: "Custom",
      description: "Complete ownership. Self-host Optalflow on your own servers.",
      features: [
        "Full Source Code Access",
        "On-Premise Deployment",
        "Unlimited everything",
        "White-label branding",
        "Custom API Integrations",
        "Dedicated Engineering Support",
        "One-time perpetual license"
      ],
      isSales: true
    }
  ];

  const handleSubscribe = async (plan) => {
    if (!user || !user.company_id) return;
    
    if (plan.isSales) {
      window.location.href = "mailto:sales@optalflow.com?subject=Enterprise Off-Cloud Inquiry";
      return;
    }

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
              max_users: SUBSCRIPTION_PLANS[plan.name]?.maxUsers || 999,
              max_cases: SUBSCRIPTION_PLANS[plan.name]?.maxCases || 9999,
              max_storage_gb: SUBSCRIPTION_PLANS[plan.name]?.maxStorageGB || 500
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

          // Trigger omnichannel notification
          await NotificationService.send({
            companyId: user?.company_id,
            recipientEmail: user?.email,
            recipientName: user?.full_name,
            title: 'Plan Upgraded Successfully',
            message: `Your workspace has been successfully upgraded to the ${plan.name} plan.`,
            type: 'success',
            channels: ['in-app', 'email'] // Sending email receipt and in-app alert
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

  const handleCustomPlanClick = () => {
    setShowOffCloudDialog(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-12 px-6">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white">
            <Scale className="w-4.5 h-4.5" />
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">{t("optalflow", "Optalflow")}</span>
        </div>
        <Button 
          variant="ghost" 
          onClick={() => logout(true)}
          className="text-slate-600 hover:text-slate-900 gap-1.5"
        >
          <LogOut className="w-4 h-4" />
          {t("sign_out", "Sign Out")}
        </Button>
      </div>
      {/* Main Panel */}
      <div className="max-w-6xl mx-auto w-full text-center my-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          {t("subscription_required", "Subscription Required")}
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-none mb-4">
          {t("activate_your_firm_s_workspace", "Activate your firm's workspace")}
        </h1>
        <p className="text-slate-600 text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-12">
          {t(
            "your_trial_period_has_conclude",
            "Your trial period has concluded. Choose a secure billing plan via Paystack to unlock your matters, documents, and client portals."
          )}
        </p>

        {/* Pricing options */}
        {/* Pricing options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left items-stretch mb-8">
          {plans.slice(0, 3).map((p, idx) => {
            return (
              <div 
                key={idx}
                className={`bg-white border rounded-2xl p-8 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative ${
                  p.popular ? 'border-primary shadow-md' : 'border-slate-200'
                }`}
              >
                {p.popular && (
                  <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[9px] font-bold tracking-wider uppercase py-1 px-3 rounded-full">
                    {t("recommended", "Recommended")}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg text-slate-900 mb-1">{p.displayName}</h3>
                  <p className="text-xs text-slate-500 min-h-[32px] leading-relaxed mb-4">{p.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-3xl font-black text-slate-900">${p.price}</span>
                    <span className="text-slate-400 text-xs font-medium"> {t("month", "/ month")}</span>
                  </div>

                  <hr className="border-slate-100 mb-6" />

                  <ul className="space-y-3 mb-8">
                    {p.features.map((feat, fIdx) => {
                      return (
                        <li key={fIdx} className="flex items-center gap-2.5 text-xs text-slate-600">
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{feat}</span>
                        </li>
                      );
                    })}
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
                        {t("processing", "Processing...")}
                      </>
                    ) : (
                      "Subscribe via Paystack"
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Off-Cloud / Enterprise Horizontal Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-left flex flex-col md:flex-row items-center justify-between hover:shadow-lg transition-all duration-300 gap-8">
          <div className="flex-1">
            <h3 className="font-bold text-xl text-slate-900 mb-2">{plans[3].displayName}</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">{plans[3].description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
              {plans[3].features.map((feat, fIdx) => {
                return (
                  <div key={fIdx} className="flex items-center gap-2.5 text-xs text-slate-600">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-medium">{feat}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="w-full md:w-64 shrink-0 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
            <span className="text-2xl font-black text-slate-900 mb-4">{t("custom", "Custom")}</span>
            <Button 
              onClick={handleCustomPlanClick}
              variant="outline"
              className="w-full py-6 rounded-xl font-bold text-sm border-slate-900 text-slate-900 hover:bg-slate-50"
            >
              {t("learn_more", "Learn More")}
            </Button>
          </div>
        </div>

        {/* Off-Cloud Dialog Modal */}
        <Dialog open={showOffCloudDialog} onOpenChange={setShowOffCloudDialog}>
          <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white border-0 rounded-[2rem] shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-slate-50 px-8 py-5 border-b border-slate-100 relative shrink-0">
              <div className="mx-auto w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-3 border border-blue-100 shadow-sm">
                <Server className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-center">
                <DialogTitle className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">{t("off_cloud_enterprise", "Off-Cloud Enterprise")}</DialogTitle>
                <DialogDescription className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed font-medium">
                  {t(
                    "deploy_optalflow_securely_on_y",
                    "Deploy Optalflow securely on your own private infrastructure."
                  )}
                </DialogDescription>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="px-8 py-8 overflow-y-auto bg-white flex-1 custom-scrollbar">
              <div className="space-y-8">
                <div>
                  <h4 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">{t("deployment_architecture", "Deployment & Architecture")}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                        <Server className="w-5 h-5 text-slate-700" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{t("self_hosted_on_premise", "Self-Hosted / On-Premise")}</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t(
                          "deploy_the_platform_directly_t",
                          "Deploy the platform directly to your internal bare-metal servers or private AWS, Azure, and Google Cloud networks."
                        )}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                        <Shield className="w-5 h-5 text-slate-700" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{t("air_gapped_operation", "Air-Gapped Operation")}</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t(
                          "optalflow_can_operate_fully_of",
                          "Optalflow can operate fully offline without external API dependencies, ensuring total data isolation for sensitive sectors."
                        )}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">{t("security_integration", "Security & Integration")}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                        <Database className="w-5 h-5 text-slate-700" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{t("custom_db_integration", "Custom DB Integration")}</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t(
                          "map_optalflow_to_your_existing",
                          "Map Optalflow to your existing legacy databases. We support PostgreSQL, SQL Server, and custom on-prem storage pipelines."
                        )}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                        <Check className="w-5 h-5 text-slate-700" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{t("sla_compliance", "SLA & Compliance")}</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t(
                          "guaranteed_99_99_uptime_sla_bu",
                          "Guaranteed 99.99% uptime SLA. Built to comply with GDPR, HIPAA, SOC2, and government data sovereignty laws."
                        )}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">{t("premium_support", "Premium Support")}</h4>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                        <Headphones className="w-5 h-5 text-slate-700" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{t("dedicated_solution_engineer", "Dedicated Solution Engineer")}</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t(
                          "your_firm_will_be_assigned_a_d",
                          "Your firm will be assigned a dedicated engineer to handle deployment, white-labeling, maintenance, and custom feature development. Direct phone line and prioritized ticketing included."
                        )}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer CTA */}
            <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 sm:justify-between items-center flex-col sm:flex-row gap-4 shrink-0">
              <Button type="button" variant="ghost" onClick={() => setShowOffCloudDialog(false)} className="w-full sm:w-auto font-bold text-slate-600 hover:text-slate-900">
                {t("close", "Close")}
              </Button>
              <a href={`${getMainAppUrl()}/enterprise-contact`} className="w-full sm:w-auto block">
                <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-8 rounded-full shadow-lg shadow-blue-600/20 transition-all hover:scale-105">
                  {t("build_custom_quote", "Build Custom Quote")}
                </Button>
              </a>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto w-full text-center text-xs text-slate-400">© {new Date().getFullYear()} {t(
          "optalflow_transactions_are_ful",
          "Optalflow. Transactions are fully secured and processed locally via Paystack."
        )}
      </div>
    </div>
  );
}
