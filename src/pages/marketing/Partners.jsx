import { useTranslation} from "react-i18next";
import { Handshake, ArrowRight, ShieldCheck, Globe, Rocket} from 'lucide-react';
import { Button} from '@/components/ui/button';

export default function Partners() {
 const { t} = useTranslation();
 return (
 <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
 <div className="text-center max-w-3xl mx-auto mb-20">
 <div className="w-20 h-20 bg-slate-100 text-primary rounded-3xl flex items-center justify-center mx-auto mb-8 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20">
 <Handshake className="w-10 h-10" />
 </div>
 <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 tracking-[-0.02em]">
 {t("slate_partner_network", "Slate Partner Network")}
 </h1>
 <p className="text-xl text-slate-600 leading-relaxed mb-10">
 {t(
 "join_our_ecosystem_of_technolo",
 "Join our ecosystem of technology partners, system integrators, and resellers delivering next-generation workspace solutions to enterprises worldwide."
 )}
 </p>
 <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
 <Button className="rounded-full px-8 bg-primary text-white hover:bg-primary/90 h-14 text-lg font-semibold -emerald-600/20 w-full sm:w-auto">
 {t("become_a_partner", "Become a Partner")}
 </Button>
 <Button variant="outline" className="rounded-full px-8 h-14 text-lg font-semibold w-full sm:w-auto border-primary/40 text-slate-700 hover:bg-slate-50">
 {t("find_a_partner", "Find a Partner")}
 </Button>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 <div className="bg-white p-10 rounded-md-[2rem] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-14 h-14 bg-slate-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
 <Globe className="w-7 h-7" />
 </div>
 <h3 className="text-xl font-semibold text-slate-900 mb-4">{t("technology_partners", "Technology Partners")}</h3>
 <p className="text-slate-600 leading-relaxed">
 {t(
 "build_integrations_and_apps_on",
 "Build integrations and apps on our platform to reach thousands of enterprise customers looking to extend their workspace."
 )}
 </p>
 </div>
 
 <div className="bg-white p-10 rounded-md-[2rem] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-14 h-14 bg-slate-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
 <ShieldCheck className="w-7 h-7" />
 </div>
 <h3 className="text-xl font-semibold text-slate-900 mb-4">{t("solutions_partners", "Solutions Partners")}</h3>
 <p className="text-slate-600 leading-relaxed">
 {t(
 "consult_implement_and_manage_o",
 "Consult, implement, and manage Slate deployments for enterprise clients with complex requirements."
 )}
 </p>
 </div>

 <div className="bg-white p-10 rounded-md-[2rem] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-14 h-14 bg-slate-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
 <Rocket className="w-7 h-7" />
 </div>
 <h3 className="text-xl font-semibold text-slate-900 mb-4">{t("referral_partners", "Referral Partners")}</h3>
 <p className="text-slate-600 leading-relaxed">
 {t(
 "recommend_slate_to_your_ne",
 "Recommend Slate to your network and earn recurring commissions for every successful enterprise contract."
 )}
 </p>
 </div>
 </div>
 </div>
 );
}
