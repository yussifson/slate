import { useTranslation} from 'react-i18next';
import { useState, useEffect} from 'react';
import { Helmet} from 'react-helmet-async';
import { Link} from 'react-router-dom';
import {
 Check, Server, Shield, Database, Headphones,
 ArrowRight, Zap
} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/ui/dialog';
import {
 PLAN_META, UNIVERSAL_FEATURES,
 getPrice, formatPriceNumber,
 detectMarketTier, assertPricingIntegrity} from '@/lib/pricing';

// Run integrity check in dev
if (import.meta?.env?.DEV) {
 try { assertPricingIntegrity();} catch(e) { console.error(e.message);}
}

const PLAN_KEYS = ['starter','professional','business','enterprise'];

export default function Pricing() {
 const { t} = useTranslation();
 const [billingCycle, setBillingCycle] = useState('monthly');
 const [marketTier, setMarketTier] = useState('global');
 const [showOffCloudDialog, setShowOffCloudDialog] = useState(false);
 const [openFaq, setOpenFaq] = useState(null);

 // Geo-detect on mount
 useEffect(() => {
 detectMarketTier().then(({ tier}) => {
 setMarketTier(tier);
});
}, []);

 const faqs = [
 {
 q: 'Are features locked behind higher tiers?',
 a: "No. Slate operates on a 'Technology for Everyone' philosophy. Every plan includes full access to all 14 Work Slate modules and universal features. You only pay for higher capacity (users, storage, AI tokens)."
},
 {
 q: "What is an 'Internal User' vs an 'External User'?",
 a: 'Internal users are your staff. External users are your clients, patients, or students. Unlimited external users can access client portals for free on any plan.'
},
 {
 q: 'How does regional pricing work?',
 a: 'We adjust pricing dynamically behind the scenes to match local purchasing power. An NGO in an emerging market gets the exact same enterprise-grade software as a firm in New York — priced fairly for their local economy.'
},
 {
 q: 'Which payment methods do you accept?',
 a: 'We process payments securely via Paystack, supporting cards, bank transfers, mobile money, and USSD globally.'
},
 {
 q: 'Can I self-host Slate on my own servers?',
 a: 'Yes. Our Off-Cloud Enterprise deployment allows you to run Slate completely air-gapped on your private network.'
},
 {
 q: 'Do community and education plans need verification?',
 a: 'Yes. After signup, our team verifies your organization type within 1–2 business days before the discounted pricing activates.'
},
 ];

 return (
 <div className="overflow-x-hidden bg-white min-h-screen hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Helmet>
 <title>Pricing | Slate</title>
 <meta name="description" content="Transparent pricing for Slate. All features included on every plan. Technology for everyone." />
 </Helmet>

 {/* ── HERO ── */}
 <section className="pt-8 pb-10 md:pt-16 md:pb-14 bg-white border-b border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-xs font-semibold text-slate-600 mb-6 uppercase tracking-widest  tracking-[0.04em]">
 {t('technology_for_everyone', 'Technology For Everyone')}
 </div>
 <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-slate-900 mb-6 leading-tight">
 {t('one_platform_all_features_fa', 'One platform. All features.')}
 <span className="block text-primary">{t('fairly_priced', 'Fairly priced.')}</span>
 </h1>
 <p className="text-base md:text-xl text-slate-600 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
 {t('we_dont_gate_features', "We don't gate features. Every plan includes all 14 Work Slate modules. Choose the capacity your team needs.")}
 </p>

 {/* Billing Toggle */}
 <div className="flex items-center justify-center gap-2 text-sm md:text-base font-semibold text-slate-700 bg-slate-100/80 backdrop-blur-md inline-flex mx-auto p-1.5 rounded-full ring-1 ring-slate-900/5 shadow-inner">
 <button
 onClick={() => setBillingCycle('monthly')}
 className={`px-6 py-2.5 rounded-full transition-all duration-300 ${billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
 >
 {t('monthly', 'Monthly')}
 </button>
 <button
 onClick={() => setBillingCycle('annual')}
 className={`px-6 py-2.5 rounded-full flex items-center gap-2 transition-all duration-300 ${billingCycle === 'annual' ? 'bg-primary text-white shadow-sm ring-1 ring-primary/50' : 'text-slate-500 hover:text-slate-700'}`}
 >
 {t('annually', 'Annually')}
 {billingCycle !== 'annual' && (
 <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest">
 {t('save_20', 'SAVE 20%')}
 </span>
 )}
 </button>
 </div>
 </div>
 </section>

 {/* ── PRICING CARDS ── */}
 <section className="py-12 md:py-16 bg-slate-50">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
 {PLAN_KEYS.map((planKey) => {
 const meta = PLAN_META[planKey];
 const price = getPrice(planKey, marketTier, billingCycle);
 const isEnterprise = planKey === 'enterprise';
 return (
 <div
 key={planKey}
 id={`plan-card-${planKey}`}
 className={`relative flex flex-col bg-white rounded-3xl transition-all duration-300 p-8 ${
 meta.highlight
 ? 'ring-2 ring-primary md:-translate-y-2 shadow-[0_20px_40px_-15px_rgba(var(--primary),0.3)]'
 : 'ring-1 ring-slate-900/5 hover:ring-slate-900/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]'
 }`}
 >
 {meta.popular && (
 <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap tracking-[0.04em]">
 {t('most_popular', 'Most popular')}
 </div>
 )}

 <div className="mb-6 pb-6 border-b border-slate-100">
 <h3 className="font-bold text-2xl text-slate-900 mb-2 tracking-tight">{meta.name}</h3>
 <p className="text-sm text-slate-500 font-medium">{meta.tagline}</p>
 </div>

 <div className="mb-8">
 <div className="flex items-end gap-2 mb-1">
 <span className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tighter">
 {isEnterprise ? 'Custom' : (price === 0 ? 'Free' : '$' + formatPriceNumber(price))}
 </span>
 {!isEnterprise && price > 0 && (
 <span className="text-slate-400 text-sm font-semibold mb-1.5">/ mo</span>
 )}
 </div>
 {!isEnterprise && price > 0 && billingCycle === 'annual' && (
 <p className="text-xs text-primary font-semibold tracking-[0.04em]">Billed annually</p>
 )}
 {isEnterprise && (
 <p className="text-xs text-slate-400 font-medium tracking-[0.04em]">Tailored quote</p>
 )}
 </div>

 <div className="bg-slate-50 rounded-2xl p-5 ring-1 ring-slate-900/5 mb-8 space-y-3">
 <div className="flex justify-between items-center text-sm font-semibold">
 <span className="text-slate-500">{t('internal_users', 'Users')}</span>
 <span className="text-slate-900 text-right">{meta.quota}</span>
 </div>
 <div className="flex justify-between items-center text-sm font-semibold">
 <span className="text-slate-500">{t('storage_limit', 'Storage')}</span>
 <span className="text-slate-900">{meta.storage}</span>
 </div>
 <div className="flex justify-between items-center text-sm font-semibold">
 <span className="text-slate-500">{t('ai_tokens', 'AI Tokens')}</span>
 <span className="text-slate-900">{meta.aiTokens}</span>
 </div>
 </div>

 <ul className="space-y-3 flex-1 mb-8">
 {UNIVERSAL_FEATURES.map((feature, idx) => (
 <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 font-medium leading-snug">
 <div className="mt-0.5 shrink-0 rounded-full bg-primary/10 flex items-center justify-center p-1">
 <Check className="w-3 h-3 text-primary" strokeWidth={3} />
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
 className="w-full py-6 text-base font-bold tracking-tight rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-[0_8px_30px_rgba(16,185,129,0.3)] transition-all hover:-translate-y-0.5"
 >
 {meta.cta} <ArrowRight className="w-4 h-4 ml-1.5" />
 </Button>
 </Link>
 ) : (
 <Link to={`/signup?plan=${planKey}&billing=${billingCycle}`} className="w-full block">
 <Button
 id={`cta-${planKey}`}
 className={`w-full py-6 text-base font-bold tracking-tight rounded-2xl transition-all hover:-translate-y-0.5 ${
 meta.highlight
 ? 'bg-primary hover:bg-primary/90 text-white shadow-[0_8px_30px_rgba(var(--primary),0.3)]'
 : 'bg-white ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
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
 <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 tracking-[0.04em]">
 <div className="flex items-center gap-2 bg-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-full px-4 py-2 font-medium  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Shield className="w-4 h-4 text-primary" /> Secured by Paystack
 </div>
 <div className="flex items-center gap-2 bg-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-full px-4 py-2 font-medium  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Zap className="w-4 h-4 text-amber-500" /> Cards, Bank Transfer, Mobile Money
 </div>
 </div>
 </div>
 </section>

 {/* ── COMPARISON TABLE ── */}
 <section className="py-16 md:py-24 bg-white border-t border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="text-center mb-12">
 <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight tracking-[-0.02em]">{t('compare_plans', 'Compare Plans')}</h2>
 <p className="mt-4 text-slate-500 font-medium max-w-2xl mx-auto">
 Everything you need to scale your organization, no matter your size.
 </p>
 </div>

 <div className="overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
 <div className="min-w-[800px] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-3xl overflow-hidden bg-white  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50 border-b border-primary/40">
 <th className="py-5 px-6 font-semibold text-slate-900 text-sm w-1/3">Features</th>
 <th className="py-5 px-6 font-semibold text-slate-900 text-center text-sm w-1/6">Starter</th>
 <th className="py-5 px-6 font-semibold text-slate-900 text-center text-sm w-1/6">Professional</th>
 <th className="py-5 px-6 font-semibold text-slate-900 text-center text-sm w-1/6">Business</th>
 <th className="py-5 px-6 font-semibold text-slate-900 text-center text-sm w-1/6">Enterprise</th>
 </tr>
 </thead>
 <tbody className="text-sm">
 {/* Core Features */}
 <tr className="bg-slate-50/50">
 <td colSpan="5" className="py-3 px-6 font-semibold text-xs text-slate-500 uppercase tracking-widest bg-slate-100/50 border-y border-primary/40 tracking-[0.04em]">Core Capabilities</td>
 </tr>
 <tr className="border-b border-primary/40 hover:bg-slate-50/50 transition-colors">
 <td className="py-4 px-6 font-medium text-slate-700">All 14 Work Slate Modules</td>
 <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-primary mx-auto" /></td>
 <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-primary mx-auto" /></td>
 <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-primary mx-auto" /></td>
 <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-primary mx-auto" /></td>
 </tr>
 <tr className="border-b border-primary/40 hover:bg-slate-50/50 transition-colors">
 <td className="py-4 px-6 font-medium text-slate-700">Internal Users (Staff)</td>
 <td className="py-4 px-6 text-center text-slate-600 font-semibold">5</td>
 <td className="py-4 px-6 text-center text-slate-600 font-semibold">50</td>
 <td className="py-4 px-6 text-center text-slate-600 font-semibold">Unlimited</td>
 <td className="py-4 px-6 text-center text-slate-600 font-semibold">Unlimited</td>
 </tr>
 <tr className="border-b border-primary/40 hover:bg-slate-50/50 transition-colors">
 <td className="py-4 px-6 font-medium text-slate-700">External Users (Clients/Students)</td>
 <td className="py-4 px-6 text-center text-slate-600 font-semibold">Unlimited</td>
 <td className="py-4 px-6 text-center text-slate-600 font-semibold">Unlimited</td>
 <td className="py-4 px-6 text-center text-slate-600 font-semibold">Unlimited</td>
 <td className="py-4 px-6 text-center text-slate-600 font-semibold">Unlimited</td>
 </tr>
 
 {/* Infrastructure & Support */}
 <tr>
 <td colSpan="5" className="py-3 px-6 font-semibold text-xs text-slate-500 uppercase tracking-widest bg-slate-100/50 border-y border-primary/40 tracking-[0.04em]">Infrastructure & Support</td>
 </tr>
 <tr className="border-b border-primary/40 hover:bg-slate-50/50 transition-colors">
 <td className="py-4 px-6 font-medium text-slate-700">Storage Capacity</td>
 <td className="py-4 px-6 text-center text-slate-600 font-semibold">10 GB</td>
 <td className="py-4 px-6 text-center text-slate-600 font-semibold">500 GB</td>
 <td className="py-4 px-6 text-center text-slate-600 font-semibold">5 TB</td>
 <td className="py-4 px-6 text-center text-slate-600 font-semibold">Custom</td>
 </tr>
 <tr className="border-b border-primary/40 hover:bg-slate-50/50 transition-colors">
 <td className="py-4 px-6 font-medium text-slate-700">AI Tokens / mo</td>
 <td className="py-4 px-6 text-center text-slate-400 font-medium">—</td>
 <td className="py-4 px-6 text-center text-slate-600 font-semibold">10,000</td>
 <td className="py-4 px-6 text-center text-slate-600 font-semibold">Unlimited</td>
 <td className="py-4 px-6 text-center text-slate-600 font-semibold">Unlimited</td>
 </tr>
 <tr className="border-b border-primary/40 hover:bg-slate-50/50 transition-colors">
 <td className="py-4 px-6 font-medium text-slate-700">Support Level</td>
 <td className="py-4 px-6 text-center text-slate-600 font-semibold">Community</td>
 <td className="py-4 px-6 text-center text-slate-600 font-semibold">Standard</td>
 <td className="py-4 px-6 text-center text-slate-600 font-semibold">Priority</td>
 <td className="py-4 px-6 text-center text-slate-600 font-semibold">24/7 Dedicated</td>
 </tr>
 
 {/* Security & Deployment */}
 <tr>
 <td colSpan="5" className="py-3 px-6 font-semibold text-xs text-slate-500 uppercase tracking-widest bg-slate-100/50 border-y border-primary/40 tracking-[0.04em]">Security & Deployment</td>
 </tr>
 <tr className="border-b border-primary/40 hover:bg-slate-50/50 transition-colors">
 <td className="py-4 px-6 font-medium text-slate-700">SSO & Advanced Security</td>
 <td className="py-4 px-6 text-center text-slate-400 font-medium">—</td>
 <td className="py-4 px-6 text-center text-slate-400 font-medium">—</td>
 <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-primary mx-auto" /></td>
 <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-primary mx-auto" /></td>
 </tr>
 <tr className="hover:bg-slate-50/50 transition-colors">
 <td className="py-4 px-6 font-medium text-slate-700">On-Premise / Air-Gapped</td>
 <td className="py-4 px-6 text-center text-slate-400 font-medium">—</td>
 <td className="py-4 px-6 text-center text-slate-400 font-medium">—</td>
 <td className="py-4 px-6 text-center text-slate-400 font-medium">—</td>
 <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-primary mx-auto" /></td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </section>
\n{/* ── OFF-CLOUD ENTERPRISE ── */}
 <section className="py-16 md:py-20 bg-white border-t border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="bg-slate-50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[2rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10 hover:border-primary/40 transition-colors">
 <div className="flex-1">
 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-xs font-semibold text-slate-600 mb-6 uppercase tracking-wider  tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Server className="w-4 h-4" /> High Security
 </div>
 <h3 className="font-semibold text-3xl md:text-4xl text-slate-900 mb-4 tracking-tight tracking-[-0.02em]">{t('off_cloud_on_premise', 'Off-Cloud Enterprise')}</h3>
 <p className="text-base md:text-lg text-slate-600 leading-relaxed font-medium mb-8 max-w-xl">
 For organizations with strict data sovereignty requirements. Deploy Slate entirely air-gapped on your own private bare-metal servers.
 </p>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {['Self-hosted deployment','Air-gapped network support','Custom database integration','Dedicated solution engineer'].map((f, i) => (
 <div key={i} className="flex items-center gap-3 text-sm text-slate-700 font-medium">
 <div className="shrink-0 rounded-full bg-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex items-center justify-center p-1.5  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Check className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
 </div>
 {f}
 </div>
 ))}
 </div>
 </div>
 <div className="w-full md:w-80 shrink-0 flex flex-col items-center bg-white rounded-3xl p-8 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 tracking-[0.04em]">Tailored Quote</span>
 <span className="text-4xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tighter tracking-[-0.02em]">Custom<span className="text-xl text-slate-500 font-medium tracking-normal"> Pricing</span></span>
 <Button
 onClick={() => setShowOffCloudDialog(true)}
 className="w-full py-6 rounded-2xl font-semibold text-sm bg-primary text-white hover:bg-primary/90 transition-all "
 >
 {t('build_custom_quote', 'Build Custom Quote')}
 </Button>
 </div>
 </div>
 </div>
 </section>

 {/* ── OFF-CLOUD DIALOG ── */}
 <Dialog open={showOffCloudDialog} onOpenChange={setShowOffCloudDialog}>
 <DialogContent className="sm:max-w-[680px] p-0 overflow-hidden bg-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-3xl flex flex-col max-h-[85vh] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="bg-slate-50 border-b border-primary/40 px-8 py-8 shrink-0 text-center">
 <DialogTitle className="text-2xl font-semibold text-slate-900 mb-3 tracking-tight tracking-[-0.02em]">{t('off_cloud_enterprise', 'Off-Cloud Enterprise')}</DialogTitle>
 <DialogDescription className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed font-medium">
 Deploy Slate securely on your own private infrastructure with custom enterprise pricing.
 </DialogDescription>
 </div>
 <div className="px-8 py-8 overflow-y-auto bg-white flex-1 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="space-y-8">
 <div>
 <h4 className="font-semibold text-slate-900 mb-5 uppercase tracking-widest text-xs border-b border-primary/40 pb-3 tracking-[0.04em]">Deployment Details</h4>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {[{icon: Server, title:'Self-Hosted / On-Premise', body:'Deploy to internal bare-metal servers or private AWS/Azure VPCs.'},
 {icon: Shield, title:'Air-Gapped Operation', body:'Full offline operation without external API dependencies.'},
 {icon: Database, title:'Custom DB Integration', body:'Connect your existing Oracle, MSSQL, or Postgres databases.'},
 {icon: Headphones, title:'Dedicated Engineer', body:'A dedicated engineer for deployment, white-labelling, and maintenance.'},
 ].map(({icon: Icon, title, body}) => (
 <div key={title} className="flex gap-4">
 <div className="w-10 h-10 rounded-2xl bg-slate-50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex items-center justify-center shrink-0 ">
 <Icon className="w-4.5 h-4.5 text-slate-700" />
 </div>
 <div>
 <p className="text-sm font-semibold text-slate-900 mb-1">{title}</p>
 <p className="text-xs text-slate-500 font-medium leading-relaxed tracking-[0.04em]">{body}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 <DialogFooter className="p-6 bg-slate-50 border-t border-primary/40 sm:justify-between items-center flex-col sm:flex-row gap-4 shrink-0">
 <Button variant="ghost" onClick={() => setShowOffCloudDialog(false)} className="w-full sm:w-auto font-semibold text-slate-600 hover:bg-slate-200">
 {t('close', 'Close')}
 </Button>
 <Link to="/enterprise-contact" onClick={() => setShowOffCloudDialog(false)} className="w-full sm:w-auto block">
 <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-semibold py-6 px-8 rounded-2xl flex items-center gap-2">
 {t('contact_sales', 'Contact Sales')} <ArrowRight className="w-4 h-4" />
 </Button>
 </Link>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* ── FAQ ── */}
 <section className="bg-slate-50 py-16 md:py-24 border-t border-primary/40">
 <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="text-center mb-12">
 <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight tracking-[-0.02em]">{t('frequently_asked_questions', 'Frequently Asked Questions')}</h2>
 </div>
 <div className="space-y-4">
 {faqs.map((faq, i) => (
 <div key={i} className="bg-white rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <button
 id={`faq-${i}`}
 onClick={() => setOpenFaq(openFaq === i ? null : i)}
 className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-slate-50 transition-colors"
 >
 <span className="text-sm md:text-base font-semibold text-slate-900">{faq.q}</span>
 <span className={`text-slate-400 font-semibold text-xl transition-transform shrink-0 ${openFaq === i ? 'rotate-45 text-slate-900' : ''}`}>+</span>
 </button>
 {openFaq === i && (
 <div className="px-6 pb-6 pt-2">
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
