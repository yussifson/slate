import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Check, Info, Server, Shield, Database, Headphones, Globe, Heart, GraduationCap, Building2, Calculator, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function Pricing() {
  const { t } = useTranslation();
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [marketTier, setMarketTier] = useState('global');
  const [showOffCloudDialog, setShowOffCloudDialog] = useState(false);

  // Widget States
  const [calcTeamSize, setCalcTeamSize] = useState(30);

  const marketTiers = [
    { id: 'global', name: "Global", icon: Globe, desc: "US, UK, EU, AU, etc." },
    { id: 'emerging', name: "Emerging", icon: Building2, desc: "Africa, LatAm, SE Asia" },
    { id: 'community', name: "Community", icon: Heart, desc: "NGOs & Non-Profits" },
    { id: 'education', name: "Education", icon: GraduationCap, desc: "Schools & Universities" },
  ];

  const pricingData = {
    global: [
      { id: "starter", name: "Starter", price: { monthly: 49, yearly: 39 }, quota: "Up to 10 Internal Users", storage: "50GB", aiTokens: "0", desc: "Essential operations for small teams" },
      { id: "professional", name: "Professional", price: { monthly: 99, yearly: 79 }, quota: "Up to 50 Internal Users", storage: "500GB", aiTokens: "10,000 / mo", popular: true, desc: "Advanced capacity for growing organizations" },
      { id: "business", name: "Business", price: { monthly: 249, yearly: 199 }, quota: "Unlimited Internal Users", storage: "5TB", aiTokens: "Unlimited", desc: "Maximum scale and dedicated support" }
    ],
    emerging: [
      { id: "starter", name: "Starter", price: { monthly: 19, yearly: 15 }, quota: "Up to 10 Internal Users", storage: "50GB", aiTokens: "0", desc: "Essential operations for small teams" },
      { id: "professional", name: "Professional", price: { monthly: 39, yearly: 31 }, quota: "Up to 50 Internal Users", storage: "500GB", aiTokens: "10,000 / mo", popular: true, desc: "Advanced capacity for growing organizations" },
      { id: "business", name: "Business", price: { monthly: 99, yearly: 79 }, quota: "Unlimited Internal Users", storage: "5TB", aiTokens: "Unlimited", desc: "Maximum scale and dedicated support" }
    ],
    community: [
      { id: "starter", name: "Starter", price: { monthly: 9, yearly: 7 }, quota: "Up to 10 Internal Users", storage: "50GB", aiTokens: "0", desc: "Essential operations for small teams" },
      { id: "professional", name: "Professional", price: { monthly: 19, yearly: 15 }, quota: "Up to 50 Internal Users", storage: "500GB", aiTokens: "10,000 / mo", popular: true, desc: "Advanced capacity for growing organizations" },
      { id: "business", name: "Business", price: { monthly: 49, yearly: 39 }, quota: "Unlimited Internal Users", storage: "5TB", aiTokens: "Unlimited", desc: "Maximum scale and dedicated support" }
    ],
    education: [
      { id: "starter", name: "Starter", price: { monthly: 9, yearly: 7 }, quota: "Up to 10 Internal Users", storage: "50GB", aiTokens: "0", desc: "Essential operations for small teams" },
      { id: "professional", name: "Professional", price: { monthly: 19, yearly: 15 }, quota: "Up to 50 Internal Users", storage: "500GB", aiTokens: "10,000 / mo", popular: true, desc: "Advanced capacity for growing organizations" },
      { id: "business", name: "Business", price: { monthly: 49, yearly: 39 }, quota: "Unlimited Internal Users", storage: "5TB", aiTokens: "Unlimited", desc: "Maximum scale and dedicated support" }
    ],
  };

  const currentPlans = pricingData[marketTier];

  // Universal features that everyone gets (ungated)
  const universalFeatures = [
    "All 14 Industry ERP Modules",
    "Unlimited External Users (Clients/Students)",
    "Unified Chat, Mail & Video",
    "HR, Payroll & Leave Management",
    "Billing, Invoicing & Payments",
    "Offline-first sync via PowerSync",
    "Role-Based Access Control"
  ];

  const faqs = [
    {
      q: "Are features locked behind higher tiers?",
      a: "No! Slate operates on a 'Technology for Everyone' philosophy. Every plan gets full access to all 14 vertical industry modules and universal features. You only pay for higher capacity (users, storage, AI tokens)."
    },
    {
      q: "What defines an 'Internal User' versus an 'External User'?",
      a: "Internal users are your staff (e.g., Doctors, Lawyers, Teachers, Managers). External users are your clients, patients, or students. You can have unlimited external users logging into client portals for free on any plan."
    },
    {
      q: "How does the Market Tier pricing work?",
      a: "We dynamically adjust our pricing to match local purchasing power. An emerging market startup in Ghana gets the exact same enterprise-grade software as a hedge fund in New York, priced fairly for their local economy."
    },
    {
      q: "Can I self-host Slate on my own servers?",
      a: "Yes. Our Off-Cloud Enterprise deployment starts at $15,000/year and allows you to run Slate completely air-gapped on your private network or bare-metal servers."
    }
  ];

  // Calculator Logic
  const calcDisjointedCost = (calcTeamSize * 8) + (calcTeamSize * 15) + (calcTeamSize * 11) + 40; // Slack + Dropbox + Asana + Base ERP
  const calcSlateCost = currentPlans[1].price[billingPeriod]; // Default comparison to Professional plan

  return (
    <div className="overflow-x-hidden bg-slate-50 min-h-screen">
      <Helmet>
        <title>Pricing | Slate</title>
        <meta name="description" content="Transparent, capacity-based pricing for Slate. Technology for everyone." />
      </Helmet>

      {/* Pricing Header */}
      <section className="pt-10 pb-8 md:pt-14 md:pb-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-6 uppercase tracking-widest">
            {t("technology_for_everyone", "Technology For Everyone")}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
            {t("one_platform_all_features_fa", "One platform. All features. Fairly priced.")}
          </h1>
          <p className="text-lg text-slate-600 font-medium mb-10 max-w-2xl mx-auto">
            {t("we_dont_gate_features_every", "We don't gate features. Every plan includes all 14 industry modules. You simply choose the capacity your team needs based on your local market.")}
          </p>

          {/* Market Tier Selector */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {marketTiers.map(tier => {
              const Icon = tier.icon;
              const isActive = marketTier === tier.id;
              return (
                <button
                  key={tier.id}
                  onClick={() => setMarketTier(tier.id)}
                  className={`flex items-center gap-3 py-3 px-5 rounded-2xl border-2 transition-all duration-300 ${isActive ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-slate-200 bg-white hover:border-primary/40 hover:bg-slate-50'}`}
                >
                  <div className={`p-2 rounded-xl ${isActive ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-bold leading-none mb-1 ${isActive ? 'text-primary' : 'text-slate-700'}`}>{tier.name}</p>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{tier.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4 text-base font-bold text-slate-700">
            <span className={billingPeriod === 'monthly' ? 'text-slate-900' : 'text-slate-500'}>{t("monthly", "Monthly")}</span>
            <button 
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-8 w-14 items-center rounded-full bg-slate-900 transition-colors hover:bg-slate-800"
            >
              <span 
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm ${
                  billingPeriod === 'yearly' ? 'translate-x-7' : 'translate-x-1'
                }`} 
              />
            </button>
            <span className={`flex items-center gap-2 ${billingPeriod === 'yearly' ? 'text-slate-900' : 'text-slate-500'}`}>
              {t("annually", "Annually")}
              <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                {t("save_20", "SAVE 20%")}
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {currentPlans.map((p, i) => (
              <div
                key={p.id}
                className={`relative flex flex-col bg-white rounded-[2rem] border transition-all duration-300 p-8 ${
                  p.popular
                    ? 'border-primary shadow-2xl shadow-primary/10 md:-translate-y-4 md:scale-[1.02]'
                    : 'border-slate-200 shadow-sm hover:shadow-lg'
                }`}
              >
                {p.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                    {t("most_popular", "Most popular")}
                  </div>
                )}
                
                <div className="mb-6 border-b border-slate-100 pb-6">
                  <h3 className="font-black text-2xl text-slate-900 mb-2">{p.name}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed h-10">{p.desc}</p>
                </div>
                
                <div className="mb-6 flex-1">
                  <div className="flex items-end gap-1 mb-6">
                    <span className="text-5xl font-black text-slate-900 tracking-tighter">
                      ${p.price[billingPeriod]}
                    </span>
                    <span className="text-slate-500 text-sm font-bold mb-1.5">/ mo</span>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-8 space-y-3">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-slate-500">{t("internal_users", "Internal Users")}</span>
                      <span className="text-slate-900">{p.quota}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-slate-500">{t("storage_limit", "Storage Limit")}</span>
                      <span className="text-slate-900">{p.storage}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-slate-500">{t("ai_generation", "AI Generation")}</span>
                      <span className="text-slate-900">{p.aiTokens}</span>
                    </div>
                  </div>

                  <ul className="space-y-4">
                    {universalFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 font-bold leading-snug">
                        <div className="mt-0.5 shrink-0 rounded-full border border-emerald-500 flex items-center justify-center p-[2px]">
                          <Check className="w-3 h-3 text-emerald-500" strokeWidth={4} />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto pt-6">
                  <Link to={`/signup?plan=${p.id}&market=${marketTier}&billing=${billingPeriod}`} className="w-full block">
                    <Button 
                      variant={p.popular ? 'default' : 'outline'}
                      className={`w-full py-6 text-sm font-black rounded-full transition-all hover:scale-[1.02] ${
                        p.popular 
                          ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/20' 
                          : 'border-2 border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      {t("start_14_day_trial", "Start 14-day free trial")}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator Hook */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
            <div className="absolute top-0 right-0 p-32 bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className="p-10 md:p-14 flex-1 relative z-10 text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-white mb-6 uppercase tracking-wider">
                <Calculator className="w-4 h-4" /> The Financial Reality
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">Stop paying the disjointed SaaS tax.</h2>
              <p className="text-slate-300 font-medium leading-relaxed mb-10 max-w-md">
                Combining Slack, Dropbox, Asana, and a legacy ERP costs a typical 30-person team hundreds of dollars per month. Slate unifies it all under one fair price.
              </p>

              <div className="space-y-4 mb-8">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-widest block">Team Size: {calcTeamSize} Users</label>
                <input 
                  type="range" 
                  min="5" max="100" step="5" 
                  value={calcTeamSize} 
                  onChange={(e) => setCalcTeamSize(Number(e.target.value))}
                  className="w-full max-w-sm accent-primary h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="bg-slate-800/50 p-10 md:p-14 w-full md:w-[400px] flex flex-col justify-center relative z-10 border-t md:border-t-0 md:border-l border-slate-700/50">
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Cost of Disjointed Stack</p>
                  <p className="text-4xl font-black text-white/50 line-through decoration-red-500 decoration-4">${calcDisjointedCost}<span className="text-lg">/mo</span></p>
                </div>
                <div className="h-px bg-slate-700 w-full"></div>
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Cost of Unified Slate</p>
                  <p className="text-5xl font-black text-white">${calcSlateCost}<span className="text-xl text-slate-400">/mo</span></p>
                </div>
                <div className="pt-4">
                  <div className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-xl">
                    You save ${(calcDisjointedCost - calcSlateCost).toLocaleString()}/mo
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Off-Cloud / Enterprise Horizontal Banner */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 lg:p-12 text-left flex flex-col md:flex-row items-center justify-between shadow-xl shadow-slate-200/50 gap-8 relative overflow-hidden group hover:border-slate-300 transition-colors">
            
            <div className="flex-1 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-600 mb-6 uppercase tracking-wider">
                <Server className="w-4 h-4" /> High Security
              </div>
              <h3 className="font-black text-3xl text-slate-900 mb-4">{t("off_cloud_on_premise", "Off-Cloud Enterprise")}</h3>
              <p className="text-base text-slate-500 leading-relaxed font-medium mb-8 max-w-xl">
                {t("for_organizations_with_strict_", "For organizations with strict data sovereignty requirements. Deploy Slate entirely air-gapped on your own private bare-metal servers.")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                {[
                  "Self-hosted deployment",
                  "Air-gapped network support",
                  "Custom database integration",
                  "Dedicated solution engineer"
                ].map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-3 text-sm text-slate-800 font-bold">
                    <div className="shrink-0 rounded-full bg-slate-100 flex items-center justify-center p-1">
                      <Check className="w-3 h-3 text-slate-900" strokeWidth={4} />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="w-full md:w-80 shrink-0 flex flex-col items-center justify-center bg-slate-50 rounded-[2rem] p-8 border border-slate-100 relative z-10">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pricing Floor Starts At</span>
              <span className="text-4xl font-black text-slate-900 mb-6">$15,000<span className="text-lg text-slate-500">/yr</span></span>
              <Button 
                onClick={() => setShowOffCloudDialog(true)}
                className="w-full py-6 rounded-full font-black text-sm bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 transition-all shadow-lg"
              >
                {t("build_custom_quote", "Build Custom Quote")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Off-Cloud Dialog Modal (Kept from original but cleaned up) */}
      <Dialog open={showOffCloudDialog} onOpenChange={setShowOffCloudDialog}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white border-0 rounded-[2rem] shadow-2xl flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="bg-slate-900 px-8 py-8 relative shrink-0 text-center">
            <DialogTitle className="text-3xl font-black text-white mb-2 tracking-tight">{t("off_cloud_enterprise", "Off-Cloud Enterprise")}</DialogTitle>
            <DialogDescription className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed font-medium">
              Deploy Slate securely on your own private infrastructure. Starting strictly at $15,000 USD / year.
            </DialogDescription>
          </div>
          
          {/* Scrollable Content */}
          <div className="px-8 py-8 overflow-y-auto bg-white flex-1 custom-scrollbar">
            <div className="space-y-8">
              {/* Architecture */}
              <div>
                <h4 className="font-bold text-slate-900 mb-4 uppercase tracking-widest text-xs border-b border-slate-100 pb-2">{t("deployment_architecture", "Deployment & Architecture")}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm"><Server className="w-5 h-5 text-slate-700" /></div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{t("self_hosted_on_premise", "Self-Hosted / On-Premise")}</p>
                      <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">Deploy the platform directly to your internal bare-metal servers or private AWS/Azure VPCs.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm"><Shield className="w-5 h-5 text-slate-700" /></div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{t("air_gapped_operation", "Air-Gapped Operation")}</p>
                      <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">Slate can operate fully offline without external API dependencies for total data isolation.</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Support */}
              <div>
                <h4 className="font-bold text-slate-900 mb-4 uppercase tracking-widest text-xs border-b border-slate-100 pb-2">{t("premium_support", "Premium Support")}</h4>
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm"><Headphones className="w-5 h-5 text-slate-700" /></div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{t("dedicated_solution_engineer", "Dedicated Solution Engineer")}</p>
                      <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">Your firm receives a dedicated engineer for deployment, white-labeling, and maintenance.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 sm:justify-between items-center flex-col sm:flex-row gap-4 shrink-0">
            <Button type="button" variant="ghost" onClick={() => setShowOffCloudDialog(false)} className="w-full sm:w-auto font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200">
              {t("close", "Close")}
            </Button>
            <Link to="/enterprise-contact" onClick={() => setShowOffCloudDialog(false)} className="w-full sm:w-auto block">
              <Button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-black py-6 px-8 rounded-full shadow-xl transition-all hover:scale-105 flex items-center gap-2">
                {t("contact_sales", "Contact Sales")} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FAQ Section */}
      <section className="bg-white py-24 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {t("frequently_asked_questions", "Frequently Asked Questions")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {faqs.map((faq, index) => (
              <div key={index} className="space-y-3 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <h4 className="font-bold text-slate-900 flex items-start gap-3 text-base leading-snug">
                  <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium pl-8">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
