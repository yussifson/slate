import { useTranslation} from "react-i18next";
import { Puzzle, ArrowRight} from 'lucide-react';
import { Button} from '@/components/ui/button';

export default function Integrations() {
 const { t} = useTranslation();
 return (
 <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-4 sm:px-6 lg:px-8 text-center bg-slate-50 relative overflow-hidden">
 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-slate-500 rounded-full blur-3xl pointer-events-none opacity-50"></div>
 <div className="relative z-10">
 <div className="w-20 h-20 bg-white border border-slate-200 -emerald-900/5 text-primary rounded-3xl flex items-center justify-center mx-auto mb-8">
 <Puzzle className="w-10 h-10" />
 </div>
 <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
 {t("connect_your_tools", "Connect your tools")}
 </h1>
 <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
 {t(
 "slate_seamlessly_integrate",
 "Slate seamlessly integrates with your existing tech stack. We're currently expanding our integration directory to support over 100+ native connections."
 )}
 </p>
 
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12 text-left">
 <div className="bg-white p-6 rounded-2xl border border-slate-200 ">
 <h3 className="font-bold text-slate-900 mb-2">{t("crm_sales", "CRM & Sales")}</h3>
 <p className="text-slate-500 text-sm">{t("salesforce_hubspot_pipedrive", "Salesforce, HubSpot, Pipedrive")}</p>
 </div>
 <div className="bg-white p-6 rounded-2xl border border-slate-200 ">
 <h3 className="font-bold text-slate-900 mb-2">{t("finance", "Finance")}</h3>
 <p className="text-slate-500 text-sm">{t("quickbooks_xero_stripe", "QuickBooks, Xero, Stripe")}</p>
 </div>
 <div className="bg-white p-6 rounded-2xl border border-slate-200 ">
 <h3 className="font-bold text-slate-900 mb-2">{t("communication", "Communication")}</h3>
 <p className="text-slate-500 text-sm">{t("slack_microsoft_teams_zoom", "Slack, Microsoft Teams, Zoom")}</p>
 </div>
 </div>

 <Button className="rounded-full px-8 bg-primary text-white hover:bg-primary/90 h-14 text-lg font-bold -emerald-600/20">
 {t("request_an_integration", "Request an Integration")} <ArrowRight className="ml-2 w-5 h-5" />
 </Button>
 </div>
 </div>
 );
}
