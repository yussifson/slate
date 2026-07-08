import { useTranslation } from "react-i18next";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from "@/lib/AuthContext";
import { Home, Calendar as CalendarIcon, DollarSign, Target, Briefcase, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

function StatCard({ icon: IconComp, label, value, sub, color = "bg-slate-50 dark:bg-slate-800/50 text-primary" }) {
  return (
    <div className="bg-card rounded-2xl border-0 p-5 flex items-center gap-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <IconComp className="w-6 h-6" />
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground tracking-[-0.03em]">{value}</p>
        <p className="text-sm font-medium text-muted-foreground tracking-tight mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function RealEstateDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = user?.company_id;
  const today = new Date();

  const { data: properties = [] } = useQuery({
    queryKey: ['re_properties', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM univ_re_properties WHERE company_id = ?`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: viewings = [] } = useQuery({
    queryKey: ['re_viewings', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM univ_re_viewings WHERE company_id = ? ORDER BY date ASC`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['re_transactions', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(`SELECT * FROM univ_re_transactions WHERE company_id = ?`, [companyId]);
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const activeProperties = properties.filter(p => p.status === 'active' || p.status === 'listed');
  const upcomingViewings = viewings.filter(v => v.date && new Date(v.date) >= today);
  const pendingDeals = transactions.filter(t => t.status === 'pending');
  
  const totalVolume = transactions
    .filter(t => t.status === 'closed')
    .reduce((sum, t) => sum + (Number(t.price) || 0), 0);

  return (
    <div className="space-y-8 school-page-enter font-dmsans max-w-7xl mx-auto pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-8 sm:p-10 text-white shadow-2xl shadow-indigo-500/20">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl mix-blend-overlay pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-blue-900 opacity-20 rounded-full blur-2xl mix-blend-overlay pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                <Home className="w-6 h-6 text-indigo-100" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Real Estate Operations</h1>
            </div>
            <p className="text-indigo-100 text-lg font-medium tracking-wide">Brokerage & Property Overview</p>
            <div className="mt-6 flex items-center gap-4 text-sm font-medium text-indigo-100/80">
              <span className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 opacity-70" />
                {format(today, "EEEE, MMMM d, yyyy")}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-inner">
            <div className="text-right">
              <p className="text-xs text-indigo-200 font-bold uppercase tracking-wider mb-1">Status</p>
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_12px_rgba(96,165,250,0.8)]" />
                Active Market
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Home} label="Active Listings" value={activeProperties.length} color="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" />
        <StatCard icon={CalendarIcon} label="Upcoming Viewings" value={upcomingViewings.length} color="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" />
        <StatCard icon={Briefcase} label="Pending Deals" value={pendingDeals.length} color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" />
        <StatCard icon={DollarSign} label="Closed Volume" value={`$${(totalVolume / 1000000).toFixed(1)}M`} sub="YTD" color="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Viewings */}
        <div className="bg-card rounded-3xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[500px]">
          <div className="p-6 border-b border-border/50 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold">Upcoming Viewings</h3>
          </div>
          <div className="divide-y divide-border/50 overflow-y-auto flex-1">
            {upcomingViewings.length === 0 ? (
              <div className="p-5 text-center text-sm text-muted-foreground">No upcoming viewings</div>
            ) : upcomingViewings.slice(0, 8).map(v => (
                <div key={v.id} className="px-6 py-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-semibold text-indigo-600 leading-none">{format(new Date(v.date), "MMM")}</span>
                    <span className="text-sm font-semibold text-indigo-600 leading-none">{format(new Date(v.date), "d")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{v.property_address}</p>
                    <p className="text-xs text-muted-foreground mt-1">{v.client_name} · {v.time || 'TBD'}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Deals */}
        <div className="bg-card rounded-3xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[500px]">
          <div className="p-6 border-b border-border/50 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold">Pending Deals</h3>
          </div>
          <div className="divide-y divide-border/50 overflow-y-auto flex-1">
            {pendingDeals.length === 0 ? (
              <div className="p-5 text-center text-sm text-muted-foreground">No pending deals</div>
            ) : pendingDeals.map(deal => (
                <div key={deal.id} className="px-6 py-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-bold">{deal.property_address}</p>
                      <p className="text-xs text-muted-foreground mt-1">Buyer: {deal.buyer_name}</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">${Number(deal.price).toLocaleString()}</Badge>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
