import React from 'react';
import { 
  BarChart2, Zap, AlertTriangle, ChevronRight,
  Target, Globe, Activity, TrendingUp, TrendingDown
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useIntelligence } from '@/hooks/useIntelligence';

export default function OptavelCommandCenter() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;

  // 1. Fetch Real Deal Rooms Value (Pipeline)
  const { data: pipelineData } = useQuery({
    queryKey: ['optavel_pipeline', companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const res = await powerSync.execute(
        `SELECT SUM(value) as total FROM optavel_deal_rooms WHERE company_id = ? AND stage != 'closed_won' AND stage != 'closed_lost'`,
        [companyId]
      );
      return res.rows.item(0).total || 0;
    },
    enabled: !!companyId
  });

  // 2. Fetch Active OKRs
  const { data: okrs = [] } = useQuery({
    queryKey: ['optavel_okrs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM optavel_okrs WHERE company_id = ? ORDER BY progress DESC LIMIT 4`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  // 3. Fetch Invoices for MRR
  const { data: mrrData } = useQuery({
    queryKey: ['optavel_mrr', companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const res = await powerSync.execute(
        `SELECT SUM(total_amount) as total FROM univ_invoice WHERE company_id = ? AND status = 'paid'`,
        [companyId]
      );
      return (res.rows.item(0).total || 0) / 12; 
    },
    enabled: !!companyId
  });

  // Intelligence Engine
  const { insights = [], isRunning } = useIntelligence('optavel');

  const stats = [
    { label: 'Live MRR', val: `$${(mrrData || 0).toLocaleString()}`, trend: '+12%', color: 'from-emerald-400 to-teal-500', isUp: true },
    { label: 'Pipeline Value', val: `$${(pipelineData || 0).toLocaleString()}`, trend: '+5%', color: 'from-blue-400 to-indigo-500', isUp: true },
    { label: 'Active Goals', val: okrs.length.toString(), trend: 'On Track', color: 'from-purple-400 to-pink-500', isUp: true },
    { label: 'Cash Runway', val: '18 mo', trend: 'Stable', color: 'from-amber-400 to-orange-500', isUp: true },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020817] text-slate-800 dark:text-slate-100 p-6 md:p-10 font-sans">
      {/* Dynamic Header */}
      <div className="mb-12 relative">
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl opacity-50 dark:opacity-20 animate-pulse pointer-events-none"></div>
        <div className="absolute top-0 right-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl opacity-50 dark:opacity-20 animate-pulse pointer-events-none"></div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 flex items-center gap-4 mb-3 relative z-10">
          <div className="p-3 bg-white dark:bg-white/5 rounded-2xl shadow-xl shadow-emerald-500/10 border border-slate-100 dark:border-white/10">
            <Globe className="w-8 h-8 text-emerald-500" />
          </div>
          Optavel Dashboard
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 font-medium relative z-10">Welcome back! Here is your global operations overview.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 relative z-10">
        {stats.map((stat, i) => (
          <div key={i} className="group relative bg-white dark:bg-[#0F172A] rounded-3xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div className={`absolute -right-10 -top-10 w-32 h-32 opacity-10 dark:opacity-5 rounded-full blur-2xl bg-gradient-to-br ${stat.color} group-hover:opacity-20 transition-opacity`}></div>
            
            <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider">{stat.label}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{stat.val}</h3>
              <div className="flex items-center gap-1 text-sm font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">
                {stat.isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                <span className={stat.isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>{stat.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 relative z-10">
        {/* OKRs Section */}
        <div className="xl:col-span-2 bg-white dark:bg-[#0F172A] rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
          
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                <Target className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
              </div>
              Company Objectives
            </h2>
            <button className="text-sm font-semibold text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-6">
            {okrs.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No Active OKRs</h3>
                <p className="text-slate-400">Start setting your company goals to track progress here.</p>
              </div>
            ) : (
              okrs.map((okr, i) => (
                <div key={okr.id} className="group p-5 bg-slate-50 dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-[#1E293B]/80 border border-slate-200 dark:border-white/5 rounded-2xl transition-colors">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-1">{okr.title}</h4>
                      <p className="text-sm font-medium text-slate-500">{okr.status === 'on_track' ? 'On Track' : okr.status}</p>
                    </div>
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-600">
                      {okr.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-1000 ease-out" 
                      style={{ width: `${okr.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
            
            {/* Fallback Dummy Data if empty */}
            {okrs.length === 0 && (
              <div className="group p-5 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-white/5 rounded-2xl opacity-50 grayscale">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-1">Achieve $1M ARR</h4>
                    <p className="text-sm font-medium text-slate-500">On Track</p>
                  </div>
                  <span className="text-2xl font-black text-slate-400">0%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div className="h-full rounded-full bg-slate-400" style={{ width: '0%' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Intelligence Section */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 dark:from-[#0B1120] dark:to-black rounded-3xl p-8 shadow-2xl relative overflow-hidden border border-slate-800 dark:border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 relative z-10">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            Intelligence
          </h2>
          
          <div className="space-y-4 relative z-10">
            {isRunning && (
              <div className="flex items-center gap-3 text-blue-400 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                <Activity className="w-5 h-5 animate-pulse" />
                <span className="text-sm font-medium">Analyzing global operations...</span>
              </div>
            )}
            
            {insights.map(alert => (
              <div key={alert.id} className="group p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors backdrop-blur-sm">
                <div className="flex gap-4">
                  <div className={`p-2 rounded-xl h-fit ${
                    alert.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    alert.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base mb-1">{alert.title}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">{alert.description || alert.body}</p>
                    {alert.actionLink && (
                      <a href={alert.actionLink} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-400 mt-3 hover:text-blue-300 transition-colors">
                        Review Protocol <ChevronRight className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {insights.length === 0 && !isRunning && (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <Activity className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Systems Optimal</h3>
                <p className="text-slate-400 text-sm">No operational anomalies detected.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
