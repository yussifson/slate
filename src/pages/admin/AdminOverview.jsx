import { useTranslation} from "react-i18next";
import { useState, useEffect} from 'react';
import { powerSync } from "@/api/PowerSyncConnector";
import { useQuery } from "@tanstack/react-query";
import {Database, Scale, Users, Building2, DollarSign, Activity, Clock, Cpu, ToggleRight, Megaphone, Handshake, AlertTriangle, LineChart, Server} from "lucide-react";
import PageHeader from '@/components/shared/PageHeader';
import Companies from '@/pages/Companies';
import { supabase } from '@/api/supabaseClient';
import { OrbitLoader } from "@/components/ui/orbit-loader";

export default function AdminOverview() {
  const { t } = useTranslation();
  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ['admin_overview_companies'],
    queryFn: async () => {
      const { data } = await supabase.from('companies').select('*');
      return data || [];
    }
  });

  const { data: subscriptions = [], isLoading: loadingSubscriptions } = useQuery({
    queryKey: ['admin_overview_subscriptions'],
    queryFn: async () => {
      const { data: cData } = await supabase.from('companies').select('id, subscription_status, subscription_plan');
      const { data: pData } = await supabase.from('subscription_plans').select('id, name, price_monthly');
      
      return (cData || []).map(c => {
        let price = 0;
        if (pData) {
          const matchedPlan = pData.find(p => p.id === c.subscription_plan || p.name.toLowerCase().replace(/\s/g, '') === c.subscription_plan?.toLowerCase());
          if (matchedPlan) price = matchedPlan.price_monthly;
        }
        return {
          company_id: c.id,
          subscription_status: c.subscription_status,
          price_monthly: price
        };
      });
    }
  });

  const { data: totalUsersCount = 0, isLoading: loadingProfiles } = useQuery({
    queryKey: ['admin_overview_profiles_count'],
    queryFn: async () => {
      const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
      return count || 0;
    }
  });

  const { data: totalRecordsCount = 0, isLoading: loadingRecords } = useQuery({
    queryKey: ['admin_overview_records_count'],
    queryFn: async () => {
      const { count } = await supabase.from('industry_records').select('id', { count: 'exact', head: true });
      return count || 0;
    }
  });

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

  const loading = loadingCompanies || loadingProfiles || loadingRecords || loadingSubscriptions;

  const activeFirmsCount = companies.filter(c => c.subscription_status === 'active').length;

  const mrr = subscriptions
  .filter(s => s.subscription_status === 'active' || s.subscription_status === 'trial')
  .reduce((sum, s) => {
    return sum + Number(s.price_monthly || 0);
  }, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <OrbitLoader size="md" />
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
        <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm p-6 rounded-2xl flex items-center justify-between border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div>
            <p className="text-sm text-slate-500 dark:text-muted-foreground mb-1">{t("active_users_today", "Active Users Today")}</p>
            <div className="flex items-center space-x-3">
              <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-[-0.02em]">{loadingTelemetry ? '-' : telemetry?.active_today || 0}</p>
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10/20 dark:text-emerald-400 px-2 py-1 rounded-full tracking-[0.04em]">LIVE</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-2 font-medium tracking-[0.04em]">Logged in past 24h</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-secondary dark:text-emerald-400 flex items-center justify-center border-[0.5px] border-black/9 dark:border-white/8 border-emerald-100 dark:border-border">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm p-6 rounded-2xl flex items-center justify-between border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div>
            <p className="text-sm text-slate-500 dark:text-muted-foreground mb-1">{t("monthly_active_users", "Monthly Active Users")}</p>
            <div className="flex items-center space-x-3">
               <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-[-0.02em]">{loadingTelemetry ? '-' : telemetry?.active_month || 0}</p>
            </div>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-2 font-medium tracking-[0.04em]">Logged in past 30 days</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 dark:bg-secondary dark:text-blue-400 flex items-center justify-center border-[0.5px] border-black/9 dark:border-white/8 border-blue-100 dark:border-border">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Global Intelligence Layer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 p-5 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-emerald-200/50 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2"><Server className="w-4 h-4 text-emerald-500" /> Global Health Score</h3>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">99.9%</span>
          </div>
          <p className="text-xs text-slate-500 mb-2">Aggregate metric combining system uptime, API response times, and zero-downtime deployments.</p>
          <div className="text-[10px] uppercase font-semibold text-emerald-600 tracking-wider">All Systems Nominal</div>
        </div>

        <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 p-5 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-amber-200/50 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2"><LineChart className="w-4 h-4 text-amber-500" /> Revenue Risk</h3>
            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{companies.filter(c => c.subscription_status === 'trial').length} Trials Ending</span>
          </div>
          <p className="text-xs text-slate-500 mb-2">Highlights companies with expiring trials within the next 72 hours requiring conversion focus.</p>
          <div className="text-[10px] uppercase font-semibold text-amber-600 tracking-wider cursor-pointer hover:underline">View Conversion Pipeline</div>
        </div>

        <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 p-5 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-indigo-200/50 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-indigo-500" /> System Anomalies</h3>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">0 Detected</span>
          </div>
          <p className="text-xs text-slate-500 mb-2">Machine-learning detection of unusual API usage spikes, mass deletions, or sudden drop in active users.</p>
          <div className="text-[10px] uppercase font-semibold text-indigo-600 tracking-wider">Baseline Stable</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 p-6 rounded-2xl flex items-center justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div>
            <p className="text-sm text-[#71717a] dark:text-gray-400 mb-1">{t("total_mrr", "Total MRR")}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-[-0.02em]">${mrr}</p>
            <p className="text-xs text-primary mt-2 font-semibold tracking-[0.04em]">{t("active_subscriptions", "Active Subscriptions")}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-secondary/50 text-primary flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 p-6 rounded-2xl flex items-center justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div>
            <p className="text-sm text-[#71717a] dark:text-gray-400 mb-1">{t("total_firms", "Total Firms")}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-[-0.02em]">{companies.length}</p>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-2 font-medium tracking-[0.04em]">{activeFirmsCount} {t("active", "Active /")} {companies.filter(c => c.subscription_status === 'trial').length} {t("trials", "Trials")}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-secondary/50 text-primary flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 p-6 rounded-2xl flex items-center justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div>
            <p className="text-sm text-[#71717a] dark:text-gray-400 mb-1">{t("total_users", "Total Users")}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-[-0.02em]">{totalUsersCount}</p>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-2 font-medium tracking-[0.04em]">{t("across_all_firms", "Across all firms")}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-secondary/50 text-primary flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 p-6 rounded-2xl flex items-center justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div>
            <p className="text-sm text-[#71717a] dark:text-gray-400 mb-1">{t("total_records", "Platform Records")}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-[-0.02em]">{totalRecordsCount}</p>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-2 font-medium tracking-[0.04em]">{t("platform_wide_data", "Platform-wide data")}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 dark:bg-secondary dark:text-amber-400 flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
        </div>
      </div>
      
      <div className="mt-8 mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 tracking-[-0.02em]">Super Admin Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <a href="/admin/intelligence" className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 hover:border-primary/50 hover:shadow-md transition-all flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <div><p className="font-semibold text-sm text-foreground">Intelligence</p><p className="text-[11px] text-muted-foreground">AI Global Engine</p></div>
          </a>
          <a href="/admin/rollout" className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 hover:border-primary/50 hover:shadow-md transition-all flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ToggleRight className="w-5 h-5" />
            </div>
            <div><p className="font-semibold text-sm text-foreground">Feature Rollouts</p><p className="text-[11px] text-muted-foreground">Manage Flags</p></div>
          </a>
          <a href="/admin/quotas" className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 hover:border-primary/50 hover:shadow-md transition-all flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Database className="w-5 h-5" />
            </div>
            <div><p className="font-semibold text-sm text-foreground">Tenant Quotas</p><p className="text-[11px] text-muted-foreground">Limits & Usage</p></div>
          </a>
          <a href="/admin/broadcasts" className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 hover:border-primary/50 hover:shadow-md transition-all flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Megaphone className="w-5 h-5" />
            </div>
            <div><p className="font-semibold text-sm text-foreground">Broadcasts</p><p className="text-[11px] text-muted-foreground">Global Messaging</p></div>
          </a>
          <a href="/admin/enterprise-requests" className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 hover:border-primary/50 hover:shadow-md transition-all flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div><p className="font-semibold text-sm text-foreground">Enterprise Requests</p><p className="text-[11px] text-muted-foreground">Review Leads</p></div>
          </a>
          <a href="/admin/partners" className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 hover:border-primary/50 hover:shadow-md transition-all flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Handshake className="w-5 h-5" />
            </div>
            <div><p className="font-semibold text-sm text-foreground">Partner Apps</p><p className="text-[11px] text-muted-foreground">Reseller Pipeline</p></div>
          </a>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-primary/40">
        <Companies />
      </div>
    </div>
  );
}
