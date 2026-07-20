import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { 
  Network, Database, Activity, Zap, RefreshCw, AlertTriangle, 
  ArrowUpRight, Clock, ShieldAlert, Cpu, Sparkles, Plug
} from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import ClipadLoader from '@/components/ui/ClipadLoader';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { isAdmin } from '@/lib/constants';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

export default function IntegrationAnalytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [providerData, setProviderData] = useState([]);
  const [timelineData, setTimelineData] = useState([]);
  const [recentSyncs, setRecentSyncs] = useState([]);

  const isUserAdmin = isAdmin(user);

  useEffect(() => {
    if (!isUserAdmin) {
      setLoading(false);
      return;
    }

    async function fetchAnalytics() {
      try {
        // Fetch Integrations
        const { data: integrations } = await supabase
          .from('clipad_integrations')
          .select('id, provider, status, last_synced_at, sync_frequency, sync_error')
          .eq('company_id', user?.company_id);

        // Fetch Imported Knowledge
        const { data: knowledge } = await supabase
          .from('clipad_imported_knowledge')
          .select('id, provider, content_type, ai_summary, imported_at, embedding')
          .eq('company_id', user?.company_id);

        // Fetch Relationships (Vector Graph edges)
        const { data: relationships } = await supabase
          .from('clipad_knowledge_relationships')
          .select('id, relationship_type, confidence_score')
          .eq('company_id', user?.company_id);

        const totalItems = knowledge?.length || 0;
        const processedItems = knowledge?.filter(k => k.ai_summary !== null).length || 0;
        const vectorizedItems = knowledge?.filter(k => k.embedding !== null).length || 0;
        const errorCount = integrations?.filter(i => i.status === 'error').length || 0;
        const totalRelationships = relationships?.length || 0;

        setMetrics({
          activeConnections: integrations?.filter(i => i.status === 'active').length || 0,
          totalConnections: integrations?.length || 0,
          totalItems,
          processedItems,
          vectorizedItems,
          errorCount,
          totalRelationships
        });

        // Provider Distribution for Pie Chart
        const providerCounts = {};
        (knowledge || []).forEach(k => {
          providerCounts[k.provider] = (providerCounts[k.provider] || 0) + 1;
        });
        const pData = Object.entries(providerCounts).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
        setProviderData(pData.sort((a, b) => b.value - a.value).slice(0, 7));

        // Timeline Data for Area Chart (mocking historical progression based on imported_at)
        const dateGroups = {};
        const now = new Date();
        for (let i = 13; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          dateGroups[d.toISOString().split('T')[0]] = 0;
        }

        (knowledge || []).forEach(k => {
          if (k.imported_at) {
            const d = k.imported_at.split('T')[0];
            if (dateGroups[d] !== undefined) dateGroups[d]++;
          }
        });

        let cumulative = 0;
        const tData = Object.entries(dateGroups).map(([date, count]) => {
          cumulative += count;
          return { date: date.slice(5), newItems: count, totalItems: cumulative };
        });
        setTimelineData(tData);

        // Recent Syncs Table
        const syncs = (integrations || []).map(i => ({
          provider: i.provider,
          status: i.status,
          lastSync: i.last_synced_at,
          frequency: i.sync_frequency,
          error: i.sync_error
        })).sort((a, b) => new Date(b.lastSync || 0) - new Date(a.lastSync || 0));
        
        setRecentSyncs(syncs);

      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user?.company_id) fetchAnalytics();
  }, [user, isUserAdmin]);

  if (loading) return <ClipadLoader fullScreen text="Loading Integration Analytics..." />;
  if (!isUserAdmin) return <Navigate to="/clipad" replace />;

  return (
    <div className="min-h-full bg-slate-50 dark:bg-background flex flex-col w-full page-enter">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
          
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Network className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black">
                  Integration Analytics
                </h1>
                <p className="text-sm text-slate-500 mt-1">Monitor data ingestion, AI processing, and knowledge graph health.</p>
              </div>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl shadow-sm text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" /> Refresh Data
            </button>
          </div>

          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard 
              title="Active Integrations" 
              value={`${metrics?.activeConnections} / ${metrics?.totalConnections}`} 
              icon={Plug} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" 
              subtitle={metrics?.errorCount > 0 ? `${metrics.errorCount} requiring attention` : 'All systems operational'}
              subtitleClass={metrics?.errorCount > 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}
            />
            <MetricCard 
              title="Total Knowledge Items" 
              value={metrics?.totalItems?.toLocaleString()} 
              icon={Database} color="text-indigo-500" bg="bg-indigo-50 dark:bg-indigo-500/10" 
              subtitle="Imported from all sources"
            />
            <MetricCard 
              title="AI Processed (Vectorized)" 
              value={`${metrics?.vectorizedItems?.toLocaleString()}`} 
              icon={Cpu} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-500/10" 
              subtitle={`${Math.round((metrics?.vectorizedItems / (metrics?.totalItems || 1)) * 100)}% of total corpus`}
            />
            <MetricCard 
              title="Graph Relationships" 
              value={metrics?.totalRelationships?.toLocaleString()} 
              icon={Network} color="text-purple-500" bg="bg-purple-50 dark:bg-purple-500/10" 
              subtitle="Detected cross-source links"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Chart: Data Ingestion Over Time */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-card border border-slate-200 dark:border-border shadow-sm flex flex-col hover:border-indigo-500/30 transition-all hover:shadow-md">
              <h3 className="text-base font-bold mb-1">Knowledge Ingestion (14 Days)</h3>
              <p className="text-xs text-slate-500 mb-6">Volume of items synced into the organizational memory</p>
              <div className="flex-1 min-h-[300px]">
                {timelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="totalItems" name="Total Corpus" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                      <Area type="monotone" dataKey="newItems" name="New Daily" stroke="#10b981" strokeWidth={2} fillOpacity={0} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">No ingestion data available</div>
                )}
              </div>
            </div>

            {/* Chart: Source Distribution */}
            <div className="p-5 rounded-2xl bg-white dark:bg-card border border-slate-200 dark:border-border shadow-sm flex flex-col hover:border-indigo-500/30 transition-all hover:shadow-md">
              <h3 className="text-base font-bold mb-1">Knowledge Sources</h3>
              <p className="text-xs text-slate-500 mb-6">Distribution by integration</p>
              <div className="flex-1 min-h-[300px] flex items-center justify-center">
                {providerData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={providerData}
                        cx="50%" cy="45%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {providerData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-slate-400">No source data</div>
                )}
              </div>
            </div>
          </div>

          {/* Sync Status Table */}
          <div className="p-5 rounded-2xl bg-white dark:bg-card border border-slate-200 dark:border-border shadow-sm hover:border-indigo-500/30 transition-all hover:shadow-md">
            <h3 className="text-base font-bold mb-5 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-500" />
              Integration Sync Status
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 rounded-t-xl">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-xl">Provider</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last Synced</th>
                    <th className="px-4 py-3">Frequency</th>
                    <th className="px-4 py-3 rounded-tr-xl">Errors / Logs</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSyncs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No active integrations found.</td>
                    </tr>
                  ) : (
                    recentSyncs.map((sync, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-4 font-semibold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                          {sync.provider.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-4">
                          {sync.status === 'error' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">
                              <AlertTriangle className="w-3.5 h-3.5" /> Error
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" /> Active
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-slate-500">
                          {sync.lastSync ? new Date(sync.lastSync).toLocaleString() : 'Never'}
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs">
                            {sync.frequency || 'Manual'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-500 max-w-xs truncate">
                          {sync.error ? (
                            <span className="text-rose-500 text-xs" title={sync.error}>{sync.error}</span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color, bg, subtitle, subtitleClass = "text-slate-400" }) {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-card border border-slate-200 dark:border-border shadow-sm flex flex-col hover:border-indigo-500/30 transition-all hover:shadow-md">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg} ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h4 className="text-slate-500 dark:text-muted-foreground text-xs font-semibold uppercase tracking-wider">{title}</h4>
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1.5">{value}</div>
      <p className={`text-xs mt-auto ${subtitleClass}`}>{subtitle}</p>
    </div>
  );
}
