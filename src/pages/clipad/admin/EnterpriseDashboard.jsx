import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { EnterpriseAnalyticsAPI } from '@/api/EnterpriseAnalyticsAPI';
import { 
  Shield, Server, Video, Users, AlertCircle, CheckCircle, Clock, 
  Activity, ArrowUpRight, ArrowDownRight, FolderKanban, Briefcase, Zap, Search, Eye, X, MessageSquare
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import ClipadLoader from '@/components/ui/ClipadLoader';

export default function EnterpriseDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [trends, setTrends] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [loadingEngagement, setLoadingEngagement] = useState(false);

  useEffect(() => {
    if (user?.company_id) {
      loadDashboard();
    }
  }, [user]);

  const loadDashboard = async () => {
    setLoading(true);
    const [tMetrics, oHealth, aTrends, aLogs, aAssets] = await Promise.all([
      EnterpriseAnalyticsAPI.getTenantMetrics(user.company_id),
      EnterpriseAnalyticsAPI.getOrgIntelligenceHealth(user.company_id),
      EnterpriseAnalyticsAPI.getAdoptionTrends(user.company_id),
      EnterpriseAnalyticsAPI.getRecentAuditLogs(user.company_id),
      EnterpriseAnalyticsAPI.getCompanyAssets(user.company_id)
    ]);
    
    setMetrics(tMetrics);
    setIntelligence(oHealth);
    setTrends(aTrends);
    setAuditLogs(aLogs);
    setAssets(aAssets);
    setLoading(false);
  };

  const handleAssetClick = async (asset) => {
    setSelectedAsset(asset);
    setLoadingEngagement(true);
    const data = await EnterpriseAnalyticsAPI.getAssetEngagement(asset.id, asset.type, user.company_id);
    setEngagement(data);
    setLoadingEngagement(false);
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

          {/* Asset List (Detailed Engagement Tracking) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden flex flex-col">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-500" />
              Detailed Media Analytics
            </h2>
            <p className="text-sm text-slate-500 mb-4">Click any video or meeting to view detailed engagement tracking (who watched and commented).</p>
            
            <div className="max-h-[350px] overflow-y-auto pr-2 space-y-2">
              {assets.map(asset => (
                <button 
                  key={asset.id} 
                  onClick={() => handleAssetClick(asset)}
                  className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <Video className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {asset.title || 'Untitled Asset'}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                        <span className="capitalize text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{asset.type}</span>
                        Created by {asset.host_name} • {new Date(asset.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              ))}
              {assets.length === 0 && (
                <div className="text-center py-8 text-slate-500">No assets found in the organization.</div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column - Usage & Audit Stream */}
        <div className="space-y-6">
          {/* Usage Trends */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">30-Day Adoption Trends</h2>
            <div className="h-[250px] w-full">
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
                    <RechartsTooltip 
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
                  <p>No usage data found.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden h-[450px]">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" />
                Security & Audit Log
              </h2>
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
                      <div className="flex items-center gap-1.5 mt-2">
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

      {/* Asset Engagement Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Video className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedAsset.title || 'Untitled Asset'}</h2>
                  <p className="text-sm text-slate-500 capitalize">{selectedAsset.type} Tracking Analytics</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAsset(null)}
                className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingEngagement ? (
                <div className="flex flex-col items-center justify-center py-20 text-indigo-500">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-sm font-semibold">Generating Engagement Report...</p>
                </div>
              ) : engagement ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Viewers & Non Viewers Column */}
                  <div className="space-y-8">
                    {/* Viewers */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        Watched ({engagement.viewers.length})
                      </h3>
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 max-h-[300px] overflow-y-auto">
                        {engagement.viewers.length === 0 ? (
                          <p className="p-4 text-sm text-slate-500 text-center">Nobody has watched this yet.</p>
                        ) : (
                          <div className="divide-y divide-slate-200 dark:divide-slate-800">
                            {engagement.viewers.map(u => (
                              <div key={u.id} className="p-3 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center overflow-hidden shrink-0">
                                  {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{u.name?.charAt(0)}</span>}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{u.name}</p>
                                  <p className="text-[10px] text-slate-500">Viewed {new Date(u.viewed_at).toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Non Viewers */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        Did Not Watch ({engagement.nonViewers.length})
                      </h3>
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 max-h-[300px] overflow-y-auto">
                        {engagement.nonViewers.length === 0 ? (
                          <p className="p-4 text-sm text-slate-500 text-center">Everyone in the company has watched!</p>
                        ) : (
                          <div className="divide-y divide-slate-200 dark:divide-slate-800">
                            {engagement.nonViewers.map(u => (
                              <div key={u.id} className="p-3 flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                                  {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-slate-500">{u.full_name?.charAt(0)}</span>}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{u.full_name}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Comments Column */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-500" />
                      Engagement Comments ({engagement.comments.length})
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 h-[650px] overflow-y-auto">
                      {engagement.comments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6">
                          <MessageSquare className="w-8 h-8 mb-3 opacity-20" />
                          <p className="text-sm text-center">No comments on this asset.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                          {engagement.comments.map(c => (
                            <div key={c.id} className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center overflow-hidden">
                                  {c.author?.avatar_url ? <img src={c.author?.avatar_url} className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{c.author?.full_name?.charAt(0) || '?'}</span>}
                                </div>
                                <p className="text-xs font-semibold text-slate-900 dark:text-white">{c.author?.full_name}</p>
                                <span className="text-[10px] text-slate-500 ml-auto">{new Date(c.created_at).toLocaleString()}</span>
                              </div>
                              <p className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                                {c.content || c.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
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
