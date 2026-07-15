import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { EnterpriseAnalyticsAPI } from '@/api/EnterpriseAnalyticsAPI';
import { 
  Shield, Server, Video, Users, AlertCircle, CheckCircle, Clock, 
  Activity, ArrowUpRight, ArrowDownRight, FolderKanban, Briefcase, Zap, Search
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import ClipadLoader from '@/components/ui/ClipadLoader';

export default function EnterpriseDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [trends, setTrends] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    if (user?.company_id) {
      loadDashboard();
    }
  }, [user]);

  const loadDashboard = async () => {
    setLoading(true);
    const [tMetrics, oHealth, aTrends, aLogs] = await Promise.all([
      EnterpriseAnalyticsAPI.getTenantMetrics(user.company_id),
      EnterpriseAnalyticsAPI.getOrgIntelligenceHealth(user.company_id),
      EnterpriseAnalyticsAPI.getAdoptionTrends(user.company_id),
      EnterpriseAnalyticsAPI.getRecentAuditLogs(user.company_id)
    ]);
    
    setMetrics(tMetrics);
    setIntelligence(oHealth);
    setTrends(aTrends);
    setAuditLogs(aLogs);
    setLoading(false);
  };

  if (loading) return <ClipadLoader fullScreen text="Loading Enterprise Command Center..." />;

  const storagePercentage = ((metrics?.storageUsedGB || 0) / 50) * 100;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400" /> 
              Enterprise Command Center
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Cross-tenant visibility and administrative oversight for your entire organization.</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">Live Status: Operational</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard 
              icon={<Server className="w-5 h-5 text-blue-500" />} 
              title="Storage Utilization" 
              value={`${metrics?.storageUsedGB || 0} GB`}
              subtext={`of 50GB Limit (${storagePercentage.toFixed(1)}%)`}
              progress={storagePercentage}
              progressColor="bg-blue-500"
            />
            <MetricCard 
              icon={<FolderKanban className="w-5 h-5 text-amber-500" />} 
              title="Active Spaces" 
              value={metrics?.spaces || 0}
              subtext="Cross-functional hubs"
            />
            <MetricCard 
              icon={<Video className="w-5 h-5 text-emerald-500" />} 
              title="Total Video Assets" 
              value={(metrics?.videos || 0) + (metrics?.meetings || 0)}
              subtext={`${metrics?.videos || 0} Async | ${metrics?.meetings || 0} Meetings`}
            />
          </div>

          {/* Org Intelligence Health */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Organizational Intelligence</h2>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100 dark:border-rose-500/20">
                <AlertCircle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
                <p className="text-3xl font-black text-rose-700 dark:text-rose-400">{intelligence?.openBlockers || 0}</p>
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-300 uppercase tracking-wider mt-1">Open Blockers</p>
              </div>
              <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                <Briefcase className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                <p className="text-3xl font-black text-indigo-700 dark:text-indigo-400">{intelligence?.totalDecisions || 0}</p>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 uppercase tracking-wider mt-1">Key Decisions</p>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20">
                <Clock className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <p className="text-3xl font-black text-amber-700 dark:text-amber-400">{intelligence?.pendingCommitments || 0}</p>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-300 uppercase tracking-wider mt-1">Pending Commitments</p>
              </div>
            </div>
          </div>

          {/* Usage Trends */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">30-Day Adoption Trends</h2>
            <div className="h-[300px] w-full">
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends}>
                    <defs>
                      <linearGradient id="colorVideos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMeetings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="videos" name="Async Videos" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVideos)" />
                    <Area type="monotone" dataKey="meetings" name="Meeting Records" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMeetings)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <Activity className="w-10 h-10 mb-2 opacity-20" />
                  <p>No usage data found for the last 30 days.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column - Security & Audit Stream */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden h-[800px]">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              Security & Audit Log
            </h2>
            <p className="text-xs text-slate-500 mt-1">Real-time organizational event stream</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <div key={log.id} className="flex gap-4 group">
                  <div className="relative flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20 z-10" />
                    <div className="w-px h-full bg-slate-200 dark:bg-slate-700 absolute top-2 group-last:hidden" />
                  </div>
                  <div className="pb-4">
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{log.title}</p>
                      <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    {log.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{log.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                        {log.profiles?.avatar_url ? (
                          <img src={log.profiles.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[8px] font-bold">{log.profiles?.full_name?.charAt(0) || '?'}</span>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-slate-500">{log.profiles?.full_name || 'System'}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No audit logs found.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function MetricCard({ icon, title, value, subtext, progress, progressColor }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      {progress !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
          <div className={`h-full ${progressColor} transition-all`} style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      )}
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
          {icon}
        </div>
        <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">{title}</h3>
      </div>
      <p className="text-3xl font-black text-slate-900 dark:text-white mb-1">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{subtext}</p>
    </div>
  );
}
