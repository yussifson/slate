import { useTranslation} from "react-i18next";
import { useState, useEffect} from 'react';
import { powerSync} from "@/api/PowerSyncConnector";
import { Scale, Users, Building2, DollarSign, Loader2} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import Companies from '@/pages/Companies';

export default function AdminOverview() {
 const { t} = useTranslation();
 const [companies, setCompanies] = useState([]);
 const [profiles, setProfiles] = useState([]);
 const [cases, setCases] = useState([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const fetchData = async () => {
 setLoading(true);
 try {
 const __resComp = await powerSync.execute(`SELECT * FROM companies`);
 const compData = __resComp.rows ? (__resComp.rows._array || Array.from(__resComp.rows)) : [];
 if (compData) setCompanies(compData);

 const __resProf = await powerSync.execute(`SELECT * FROM profiles`);
 const profData = __resProf.rows ? (__resProf.rows._array || Array.from(__resProf.rows)) : [];
 if (profData) setProfiles(profData);

 const __resCase = await powerSync.execute(`SELECT * FROM legal_cases`);
 const caseData = __resCase.rows ? (__resCase.rows._array || Array.from(__resCase.rows)) : [];
 if (caseData) setCases(caseData);
} catch (err) {
 console.error("Failed to load platform stats:", err);
} finally {
 setLoading(false);
}
};
 fetchData();
}, []);

 const activeFirmsCount = companies.filter(c => c.status === 'active').length;
 const totalUsersCount = profiles.length;
 const totalCasesCount = cases.length;

 const mrr = companies
 .filter(c => c.subscription_status === 'active' && c.status === 'active')
 .reduce((sum, c) => {
 const planPrice = c.subscription_plan === 'starter' ? 29 : c.subscription_plan === 'professional' ? 79 : c.subscription_plan === 'enterprise' ? 199 : 0;
 return sum + planPrice;
}, 0);

 if (loading) {
 return (
 <div className="flex justify-center py-24">
 <Loader2 className="w-8 h-8 animate-spin text-primary" />
 </div>
 );
}

 return (
 <div className="p-6 space-y-6 max-w-7xl mx-auto">
 <PageHeader 
 title="Platform Overview" 
 subtitle="Global metrics and MRR across the Slate ecosystem." 
 />
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 border border-primary/20 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 p-6 rounded-2xl flex items-center justify-between">
 <div>
 <p className="text-sm text-muted-foreground mb-1">{t("total_mrr", "Total MRR")}</p>
 <p className="text-3xl font-black text-slate-900 dark:text-slate-100">${mrr}</p>
 <p className="text-xs text-primary mt-2 font-semibold">{t("active_subscriptions", "Active Subscriptions")}</p>
 </div>
 <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-primary flex items-center justify-center">
 <DollarSign className="w-6 h-6" />
 </div>
 </div>

 <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 border border-primary/20 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 p-6 rounded-2xl flex items-center justify-between">
 <div>
 <p className="text-sm text-muted-foreground mb-1">{t("total_firms", "Total Firms")}</p>
 <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{companies.length}</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">{activeFirmsCount} {t("active", "Active /")} {companies.filter(c => c.subscription_status === 'trial').length} {t("trials", "Trials")}</p>
 </div>
 <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-primary flex items-center justify-center">
 <Building2 className="w-6 h-6" />
 </div>
 </div>

 <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 border border-primary/20 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 p-6 rounded-2xl flex items-center justify-between">
 <div>
 <p className="text-sm text-muted-foreground mb-1">{t("total_users", "Total Users")}</p>
 <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{totalUsersCount}</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">{t("across_all_firms", "Across all firms")}</p>
 </div>
 <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-primary flex items-center justify-center">
 <Users className="w-6 h-6" />
 </div>
 </div>

 <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 border border-primary/20 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 p-6 rounded-2xl flex items-center justify-between">
 <div>
 <p className="text-sm text-muted-foreground mb-1">{t("total_cases", "Total Cases")}</p>
 <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{totalCasesCount}</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">{t("platform_wide_data", "Platform-wide data")}</p>
 </div>
 <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
 <Scale className="w-6 h-6" />
 </div>
 </div>
 </div>
 
 <div className="mt-8 pt-8 border-t border-primary/40">
 <Companies />
 </div>
 </div>
 );
}
