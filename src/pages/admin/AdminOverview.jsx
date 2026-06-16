import { useTranslation} from "react-i18next";
import { useState, useEffect} from 'react';
import { powerSync } from "@/api/PowerSyncConnector";
import { useQuery } from "@powersync/react";
import { Scale, Users, Building2, DollarSign, Loader2, Activity, Clock} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import Companies from '@/pages/Companies';
import { supabase } from '@/lib/supabase';

export default function AdminOverview() {
  const { t } = useTranslation();
  const { data: companies = [], isLoading: loadingCompanies } = useQuery("SELECT * FROM companies");
  const { data: subscriptions = [], isLoading: loadingSubscriptions } = useQuery(`
    SELECT cs.company_id, cs.status as subscription_status, p.price_monthly
    FROM company_subscriptions cs
    LEFT JOIN subscription_plans p ON cs.plan_id = p.id
    WHERE cs.status IN ('active', 'trial')
  `);
  const { data: profiles = [], isLoading: loadingProfiles } = useQuery("SELECT id FROM profiles");
  const { data: cases = [], isLoading: loadingCases } = useQuery("SELECT id FROM industry_records WHERE record_type = 'case'");

  const [telemetry, setTelemetry] = useState(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(true);

  useEffect(() => {
    const loadTelemetry = async () => {
      try {
        const { data, error } = await supabase.rpc('get_admin_telemetry');
        if (!error && data) {
          setTelemetry(data);
        }
      } catch (err) {
        console.error("Failed to load telemetry", err);
      } finally {
        setLoadingTelemetry(false);
      }
    };
    loadTelemetry();
  }, []);

  const loading = loadingCompanies || loadingProfiles || loadingCases || loadingSubscriptions;

  const activeFirmsCount = companies.filter(c => c.status === 'active').length;
  const totalUsersCount = profiles.length;
  const totalCasesCount = cases.length;

  const mrr = subscriptions
  .filter(s => s.subscription_status === 'active' || s.subscription_status === 'trial')
  .reduce((sum, s) => {
    return sum + Number(s.price_monthly || 0);
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
      
      {/* Live Telemetry Section (Bypasses Offline First for Live Server Metrics) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-900 text-white shadow-sm p-6 rounded-2xl flex items-center justify-between border border-slate-800">
          <div>
            <p className="text-sm text-slate-400 mb-1">{t("active_users_today", "Active Users Today")}</p>
            <div className="flex items-center space-x-3">
              <p className="text-3xl font-black">{loadingTelemetry ? '-' : telemetry?.active_today || 0}</p>
              <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">LIVE</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">Logged in past 24h</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-emerald-400 flex items-center justify-center border border-slate-700">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 text-white shadow-sm p-6 rounded-2xl flex items-center justify-between border border-slate-800">
          <div>
            <p className="text-sm text-slate-400 mb-1">{t("monthly_active_users", "Monthly Active Users")}</p>
            <div className="flex items-center space-x-3">
               <p className="text-3xl font-black">{loadingTelemetry ? '-' : telemetry?.active_month || 0}</p>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">Logged in past 30 days</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-blue-400 flex items-center justify-center border border-slate-700">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

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
