import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Check, Info, Server, Shield, Database, Headphones,
  Globe, Heart, GraduationCap, Building2, Calculator,
  ArrowRight, Sparkles, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  PLAN_META, TIER_META, UNIVERSAL_FEATURES,
  getPrice, formatPrice, formatPriceNumber,
  detectMarketTier, setTierOverride, assertPricingIntegrity,
} from '@/lib/pricing';
import { GeoBanner } from '@/components/marketing/GeoBanner';

// Run integrity check in dev
if (import.meta?.env?.DEV) {
  try { assertPricingIntegrity(); } catch(e) { console.error(e.message); }
}

const PLAN_KEYS = ['starter','professional','business','enterprise'];
const TIER_ICONS = { global: Globe, emerging: Building2, community: Heart, education: GraduationCap };

export default function Pricing() {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [marketTier, setMarketTier]     = useState('global');
  const [geoCountry, setGeoCountry]     = useState(null);
  const [geoSource, setGeoSource]       = useState(null);
  const [showOffCloudDialog, setShowOffCloudDialog] = useState(false);
  const [calcTeamSize, setCalcTeamSize] = useState(30);
  const [openFaq, setOpenFaq]           = useState(null);

  // Geo-detect on mount
  useEffect(() => {
    detectMarketTier().then(({ tier, country, source }) => {
      setMarketTier(tier);
      setGeoCountry(country);
      setGeoSource(source);
    });
  }, []);

  function handleTierOverride(newTier) {
    setTierOverride(newTier);
    setMarketTier(newTier);
  }

  // ROI calculator
  const calcDisjointedCost = (calcTeamSize * 8) + (calcTeamSize * 15) + (calcTeamSize * 11) + 40;
  const calcSlateCost = Math.round(getPrice('professional', marketTier, billingCycle) / 100);

  const faqs = [
    {
      q: 'Are features locked behind higher tiers?',
      a: "No. Slate operates on a 'Technology for Everyone' philosophy. Every plan includes full access to all 14 vertical industry modules and universal features. You only pay for higher capacity (users, storage, AI tokens)."
    },
    {
      q: "What is an 'Internal User' vs an 'External User'?",
      a: 'Internal users are your staff (e.g. Doctors, Lawyers, Teachers). External users are your clients, patients, or students. Unlimited external users can access client portals for free on any plan.'
    },
    {
      q: 'How does Market Tier pricing work?',
      a: 'We adjust pricing to match local purchasing power. An NGO in Ghana gets the exact same enterprise-grade software as a hedge fund in New York — priced fairly for their local economy.'
    },
    {
      q: 'Which payment methods do you accept?',
      a: 'We process payments via Paystack, supporting cards, bank transfers, mobile money (MTN, Airtel, M-Pesa), and USSD. All major Visa/Mastercard cards are accepted globally.'
    },
    {
      q: 'Can I self-host Slate on my own servers?',
      a: 'Yes. Our Off-Cloud Enterprise deployment starts at $15,000/year and allows you to run Slate completely air-gapped on your private network or bare-metal servers.'
    },
    {
      q: 'Do community and education plans need verification?',
      a: 'Yes. After signup, our team verifies your organization type (NGO registration, school accreditation, etc.) within 1–2 business days before the discounted pricing activates.'
    },
  ];

  return (
    <div className="overflow-x-hidden bg-slate-50 min-h-screen">
      <Helmet>
        <title>Pricing | Slate</title>
        <meta name="description" content="Transparent, geo-aware pricing for Slate. All features included on every plan. Technology for everyone." />
      </Helmet>

      {/* ── HERO ── */}
      <section className="pt-8 pb-6 md:pt-12 md:pb-10 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-5 uppercase tracking-widest">
            {t('technology_for_everyone', 'Technology For Everyone')}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 mb-4 leading-tight">
            {t('one_platform_all_features_fa', 'One platform. All features.')}
            <span className="block text-primary">{t('fairly_priced', 'Fairly priced.')}</span>
          </h1>
          <p className="text-base md:text-lg text-slate-600 font-medium mb-8 max-w-2xl mx-auto">
            {t('we_dont_gate_features', "We don't gate features. Every plan includes all 14 industry modules. Choose the capacity your team needs, priced for your local market.")}
          </p>

          {/* GeoBanner — only shown for non-global tiers */}
          {marketTier !== 'global' && geoCountry && (
            <div className="mb-6 text-left">
              <GeoBanner country={geoCountry} tier={marketTier} onTierChange={handleTierOverride} />
            </div>
          )}

          {/* Market Tier Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-7">
            {Object.entries(TIER_META).map(([id, meta]) => {
              const Icon = TIER_ICONS[id];
              const isActive = marketTier === id;
              return (
                <button
                  key={id}
                  id={`tier-btn-${id}`}
                  onClick={() => handleTierOverride(id)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-3 rounded-2xl border-2 transition-all duration-200 text-center ${
                    isActive
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                      : 'border-slate-200 bg-white hover:border-primary/40 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-1.5 rounded-xl ${isActive ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div>
                    <p className={`text-xs md:text-sm font-bold leading-none mb-0.5 ${isActive ? 'text-primary' : 'text-slate-700'}`}>{meta.name}</p>
                    {meta.badge && (
                      <span className="text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">{meta.badge}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 md:gap-4 text-sm md:text-base font-bold text-slate-700">
            <span className={billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'}>
              {t('monthly', 'Monthly')}
            </span>
            <button
              id="billing-toggle"
              onClick={() => setBillingCycle(c => c === 'monthly' ? 'annual' : 'monthly')}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                billingCycle === 'annual' ? 'bg-primary' : 'bg-slate-300'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
            <span className={`flex items-center gap-2 ${billingCycle === 'annual' ? 'text-slate-900' : 'text-slate-400'}`}>
              {t('annually', 'Annually')}
              <span className="text-[10px] font-black bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                {t('save_20', 'SAVE 20%')}
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* ── PRICING CARDS ── */}
      <section className="pb-12 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
            {PLAN_KEYS.map((planKey) => {
              const meta = PLAN_META[planKey];
              const price = getPrice(planKey, marketTier, billingCycle);
              const isEnterprise = planKey === 'enterprise';
              return (
                <div
                  key={planKey}
                  id={`plan-card-${planKey}`}
                  className={`relative flex flex-col bg-white rounded-[1.75rem] border transition-all duration-300 p-6 md:p-7 ${
                    meta.highlight
                      ? 'border-primary shadow-2xl shadow-primary/10 md:-translate-y-3 md:scale-[1.02]'
                      : 'border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300'
                  }`}
                >
                  {meta.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md whitespace-nowrap">
                      {t('most_popular', 'Most popular')}
                    </div>
                  )}

                  <div className="mb-5 pb-5 border-b border-slate-100">
                    <h3 className="font-black text-xl text-slate-900 mb-1">{meta.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{meta.tagline}</p>
                  </div>

                  <div className="mb-5">
                    <div className="flex items-end gap-1 mb-1">
                      <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                        {isEnterprise ? 'Custom' : (price === 0 ? 'Free' : '$' + formatPriceNumber(price))}
                      </span>
                      {!isEnterprise && price > 0 && (
                        <span className="text-slate-400 text-sm font-bold mb-1.5">/ mo</span>
                      )}
                    </div>
                    {!isEnterprise && price > 0 && billingCycle === 'annual' && (
                      <p className="text-xs text-primary font-bold">Billed annually</p>
                    )}
                    {isEnterprise && (
                      <p className="text-xs text-slate-400 font-medium">Tailored quote</p>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-5 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500">{t('internal_users', 'Users')}</span>
                      <span className="text-slate-900 text-right">{meta.quota}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500">{t('storage_limit', 'Storage')}</span>
                      <span className="text-slate-900">{meta.storage}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500">{t('ai_tokens', 'AI Tokens')}</span>
                      <span className="text-slate-900">{meta.aiTokens}</span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 flex-1 mb-6">
                    {UNIVERSAL_FEATURES.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-semibold leading-snug">
                        <div className="mt-0.5 shrink-0 rounded-full border border-primary/40 flex items-center justify-center p-[2px]">
                          <Check className="w-2.5 h-2.5 text-primary" strokeWidth={3.5} />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    {isEnterprise ? (
                      <Link to="/enterprise-contact" className="w-full block">
                        <Button
                          id={`cta-${planKey}`}
                          variant="outline"
                          className="w-full py-5 text-sm font-black rounded-full border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-all"
                        >
                          {meta.cta} <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    ) : (
                      <Link to={`/signup?plan=${planKey}&market=${marketTier}&billing=${billingCycle}`} className="w-full block">
                        <Button
                          id={`cta-${planKey}`}
                          className={`w-full py-5 text-sm font-black rounded-full transition-all hover:scale-[1.02] ${
                            meta.highlight
                              ? 'bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          {meta.cta}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paystack badge */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3 py-1.5 font-semibold">
              <Shield className="w-3.5 h-3.5 text-primary" /> Secured by Paystack
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3 py-1.5 font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Cards, Bank Transfer, Mobile Money
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3 py-1.5 font-semibold">
              <Check className="w-3.5 h-3.5 text-primary" /> Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* ── ROI CALCULATOR ── */}
      <section className="py-12 md:py-16 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
            <div className="absolute top-0 right-0 p-32 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
            <div className="p-8 md:p-14 flex-1 relative z-10 text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-white mb-6 uppercase tracking-wider">
                <Calculator className="w-4 h-4" /> The Financial Reality
              </div>
              <h2 className="text-2xl md:text-4xl font-black mb-4 leading-tight">Stop paying the disjointed SaaS tax.</h2>
              <p className="text-slate-300 font-medium leading-relaxed mb-8 max-w-md text-sm md:text-base">
                Combining Slack, Dropbox, Asana, and a legacy ERP costs a typical 30-person team hundreds per month. Slate unifies it all under one fair price.
              </p>
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Team Size: {calcTeamSize} Users</label>
                <input
                  type="range" min="5" max="100" step="5"
                  value={calcTeamSize}
                  onChange={e => setCalcTeamSize(Number(e.target.value))}
                  className="w-full max-w-sm accent-primary h-2 rounded-lg cursor-pointer"
                />
              </div>
            </div>
            <div className="bg-slate-800/50 p-8 md:p-14 w-full md:w-[360px] flex flex-col justify-center relative z-10 border-t md:border-t-0 md:border-l border-slate-700/50">
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Cost of Disjointed Stack</p>
                  <p className="text-3xl md:text-4xl font-black text-white/50 line-through decoration-red-500 decoration-4">${calcDisjointedCost}<span className="text-base">/mo</span></p>
                </div>
                <div className="h-px bg-slate-700" />
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Cost of Unified Slate</p>
                  <p className="text-4xl md:text-5xl font-black text-white">{calcSlateCost === 0 ? 'Free' : '$' + calcSlateCost}<span className="text-lg text-slate-400">/mo</span></p>
                </div>
                {calcSlateCost < calcDisjointedCost && (
                  <div className="pt-2">
                    <div className="inline-flex items-center gap-2 text-sm font-bold text-primary bg-primary/10 px-4 py-2 rounded-xl">
                      <Sparkles className="w-4 h-4" /> You save ${(calcDisjointedCost - calcSlateCost).toLocaleString()}/mo
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OFF-CLOUD ENTERPRISE ── */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-slate-200/50 hover:border-slate-300 transition-colors">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-600 mb-5 uppercase tracking-wider">
                <Server className="w-4 h-4" /> High Security
              </div>
              <h3 className="font-black text-2xl md:text-3xl text-slate-900 mb-3">{t('off_cloud_on_premise', 'Off-Cloud Enterprise')}</h3>
              <p className="text-sm md:text-base text-slate-500 leading-relaxed font-medium mb-6 max-w-xl">
                For organizations with strict data sovereignty requirements. Deploy Slate entirely air-gapped on your own private bare-metal servers.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['Self-hosted deployment','Air-gapped network support','Custom database integration','Dedicated solution engineer'].map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-slate-800 font-bold">
                    <div className="shrink-0 rounded-full bg-slate-100 flex items-center justify-center p-1">
                      <Check className="w-3 h-3 text-slate-900" strokeWidth={4} />
                    </div>
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full md:w-72 shrink-0 flex flex-col items-center bg-slate-50 rounded-[1.5rem] p-7 border border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Starting At</span>
              <span className="text-3xl md:text-4xl font-black text-slate-900 mb-5">$15,000<span className="text-lg text-slate-500">/yr</span></span>
              <Button
                onClick={() => setShowOffCloudDialog(true)}
                className="w-full py-5 rounded-full font-black text-sm bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 transition-all shadow-lg"
              >
                {t('build_custom_quote', 'Build Custom Quote')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── OFF-CLOUD DIALOG ── */}
      <Dialog open={showOffCloudDialog} onOpenChange={setShowOffCloudDialog}>
        <DialogContent className="sm:max-w-[680px] p-0 overflow-hidden bg-white border-0 rounded-[2rem] shadow-2xl flex flex-col max-h-[85vh]">
          <div className="bg-slate-900 px-8 py-7 shrink-0 text-center">
            <DialogTitle className="text-2xl font-black text-white mb-2 tracking-tight">{t('off_cloud_enterprise', 'Off-Cloud Enterprise')}</DialogTitle>
            <DialogDescription className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed font-medium">
              Deploy Slate securely on your own private infrastructure. Starting at $15,000 USD / year.
            </DialogDescription>
          </div>
          <div className="px-8 py-8 overflow-y-auto bg-white flex-1">
            <div className="space-y-7">
              <div>
                <h4 className="font-bold text-slate-900 mb-4 uppercase tracking-widest text-xs border-b border-slate-100 pb-2">Deployment</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[{icon: Server, title:'Self-Hosted / On-Premise', body:'Deploy to internal bare-metal servers or private AWS/Azure VPCs.'},
                    {icon: Shield, title:'Air-Gapped Operation',      body:'Full offline operation without external API dependencies.'},
                    {icon: Database, title:'Custom DB Integration',   body:'Connect your existing Oracle, MSSQL, or Postgres databases.'},
                    {icon: Headphones, title:'Dedicated Engineer',    body:'A dedicated engineer for deployment, white-labelling, and maintenance.'},
                  ].map(({icon: Icon, title, body}) => (
                    <div key={title} className="flex gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-slate-700" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{title}</p>
                        <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-5 bg-slate-50 border-t border-slate-100 sm:justify-between items-center flex-col sm:flex-row gap-3 shrink-0">
            <Button variant="ghost" onClick={() => setShowOffCloudDialog(false)} className="w-full sm:w-auto font-bold text-slate-600">
              {t('close', 'Close')}
            </Button>
            <Link to="/enterprise-contact" onClick={() => setShowOffCloudDialog(false)} className="w-full sm:w-auto block">
              <Button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-black py-5 px-8 rounded-full shadow-xl flex items-center gap-2">
                {t('contact_sales', 'Contact Sales')} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── FAQ ── */}
      <section className="bg-white py-16 md:py-24 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">{t('frequently_asked_questions', 'Frequently Asked Questions')}</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                <button
                  id={`faq-${i}`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm md:text-base font-bold text-slate-900">{faq.q}</span>
                  <span className={`text-primary font-black text-lg transition-transform shrink-0 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
