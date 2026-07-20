import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  CheckCircle2, XCircle, RefreshCw, Plug, Unplug, ExternalLink,
  Loader2, Clock, FileText, MessageSquare, Video, Github,
  AlertCircle, Zap, Search, Filter, ArrowLeft, BarChart2, ChevronDown, Key, Eye, EyeOff,
  Settings, FolderOpen, Hash, Sliders
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import IntegrationAnalytics from './IntegrationAnalytics';

import { INTEGRATIONS, CATEGORIES } from '@/config/integrationsList';

const isSuperAdmin = (user) => user?.role === 'super_admin' || user?.user_metadata?.role === 'super_admin';

// ─── Main Component ──────────────────────────────────────────────────────────
export default function IntegrationsHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const companyId = user?.user_metadata?.company_id || user?.company_id;

  const [connected, setConnected] = useState({});
  const [knowledge, setKnowledge] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState({});
  const [disconnecting, setDisconnecting] = useState({});
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('hub'); // 'hub' or 'analytics'
  const [apiKeyModal, setApiKeyModal] = useState(null); // { provider, integration, fields }
  const [configModal, setConfigModal] = useState(null); // { integration, conn }

  // Handle OAuth callback status
  useEffect(() => {
    const status = searchParams.get('status');
    const provider = searchParams.get('provider');
    const message = searchParams.get('message');

    if (status === 'success' && provider) {
      toast({ title: '✅ Connected!', description: `${provider.replace('_', ' ')} connected successfully. Syncing your data...` });
      setSearchParams({});
      loadConnected();
    } else if (status === 'needs_api_key' && provider) {
      // API key-based provider — open the key input modal
      const integration = INTEGRATIONS.find(i => i.provider === provider || i.id === provider);
      setApiKeyModal({ provider, integration });
      setSearchParams({});
    } else if (status === 'error') {
      toast({ title: 'Connection Failed', description: message?.replace(/_/g, ' ') || 'Authentication failed.', variant: 'destructive' });
      setSearchParams({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConnected = useCallback(async () => {
    if (!companyId) return;
    const { data } = await supabase.from('clipad_integrations').select('*').eq('company_id', companyId);
    if (data) {
      const map = {};
      data.forEach(row => { map[row.provider] = row; });
      setConnected(map);
    }
    setLoading(false);
  }, [companyId]);

  const loadKnowledge = useCallback(async () => {
    if (!companyId) return;
    const { data } = await supabase.from('clipad_imported_knowledge').select('id, provider, content_type, title, url, imported_at, ai_summary').eq('company_id', companyId).order('imported_at', { ascending: false }).limit(20);
    if (data) setKnowledge(data);
  }, [companyId]);

  useEffect(() => {
    loadConnected();
    loadKnowledge();
  }, [loadConnected, loadKnowledge]);

  const handleConnect = (integration) => {
    if (!companyId) {
      toast({ title: 'Not authorized', description: 'You must be an admin to connect integrations.', variant: 'destructive' });
      return;
    }
    const returnUrl = encodeURIComponent(window.location.href.split('?')[0]);
    const oauthUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth-init?provider=${integration.provider}&company_id=${companyId}&user_id=${user.id}&integration_id=${integration.id}&return_url=${returnUrl}`;
    window.location.href = oauthUrl;
  };

  const handleDisconnect = async (integration) => {
    setDisconnecting(prev => ({ ...prev, [integration.id]: true }));
    try {
      await supabase.from('clipad_integrations').delete().eq('company_id', companyId).in('provider', [integration.provider, integration.id]);
      toast({ title: 'Disconnected', description: `${integration.name} has been disconnected.` });
      await loadConnected();
    } catch (e) {
      toast({ title: 'Error', description: 'Could not disconnect.', variant: 'destructive' });
    } finally {
      setDisconnecting(prev => ({ ...prev, [integration.id]: false }));
    }
  };

  const handleUpdateSyncFrequency = async (connId, newFrequency) => {
    try {
      const { error } = await supabase
        .from('clipad_integrations')
        .update({ sync_frequency: newFrequency })
        .eq('id', connId);
      
      if (error) throw error;
      
      toast({ title: 'Success', description: `Auto-sync updated to ${newFrequency}.` });
      await loadConnected();
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update auto-sync.', variant: 'destructive' });
    }
  };

  const handleSyncNow = async (integration) => {
    try {
      const conn = connected[integration.provider] || connected[integration.id];
      if (!conn) return;

      setSyncing(prev => ({ ...prev, [integration.id]: true }));

      // Optimistically clear any sync error
      await supabase
        .from('clipad_integrations')
        .update({ sync_error: null })
        .eq('id', conn.id);

      const { data: syncResult, error } = await supabase.functions.invoke('integration-sync', {
        body: { integrationId: conn.id, provider: integration.id }
      });
      if (error) throw error;

      const imported = syncResult?.imported || 0;
      toast({ title: `✅ ${integration.name} synced`, description: `${imported} item${imported !== 1 ? 's' : ''} imported. AI is now processing the content...` });

      // Trigger AI reprocessing for any items missing ai_summary
      setTimeout(async () => {
        try {
          const { data: unprocessed } = await supabase
            .from('clipad_imported_knowledge')
            .select('id, external_id')
            .eq('integration_id', conn.id)
            .is('ai_summary', null)
            .limit(20);

          if (unprocessed?.length > 0) {
            for (const item of unprocessed) {
              supabase.functions.invoke('integration-ai-processor', {
                body: { integrationId: conn.id, provider: integration.id, externalId: item.external_id }
              }).catch(() => {});
            }
          }
        } catch { /* ignore */ }
        loadConnected();
        loadKnowledge();
      }, 3000);
    } catch (e) {
      toast({ title: 'Sync failed', description: e.message || 'Could not sync.', variant: 'destructive' });
    } finally {
      setSyncing(prev => ({ ...prev, [integration.id]: false }));
    }
  };

  const clearSyncError = async (integration) => {
    const conn = connected[integration.provider] || connected[integration.id];
    if (!conn) return;
    try {
      await supabase.from('clipad_integrations').update({ sync_error: null }).eq('id', conn.id);
      setConnected(prev => ({ ...prev, [integration.id || integration.provider]: { ...conn, sync_error: null }}));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveApiKey = async (provider, keyData) => {
    if (!companyId) return;
    try {
      const { error } = await supabase.from('clipad_integrations').upsert({
        company_id: companyId,
        provider: provider,
        status: 'active',
        access_token: keyData.api_key || keyData.token || '',
        metadata: keyData,
        connected_at: new Date().toISOString(),
      }, { onConflict: 'company_id,provider' });

      if (error) throw error;
      toast({ title: '✅ Connected!', description: `${provider.replace(/_/g, ' ')} connected successfully.` });
      setApiKeyModal(null);
      await loadConnected();
    } catch (e) {
      toast({ title: 'Connection Failed', description: e.message, variant: 'destructive' });
    }
  };

  const filteredIntegrations = INTEGRATIONS.filter(i => {
    const matchesCategory = activeCategory === 'All' || i.category === activeCategory;
    const matchesSearch = !searchQuery || i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const connectedCount = Object.keys(connected).length;
  const knowledgeCount = knowledge.length;

  if (!isSuperAdmin(user)) {
    return (
      <div className="min-h-full bg-background text-foreground pb-16 page-enter" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-background to-background px-6 py-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(var(--primary-rgb),0.08),transparent_60%)] pointer-events-none" />
          <div className="max-w-4xl mx-auto relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full mb-5 border border-primary/20">
              <Zap className="w-3.5 h-3.5" /> Coming Soon to Your Workspace
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
              Knowledge Integrations
            </h1>
            <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
              Connect every tool your team uses — Slack, Notion, Google Drive, GitHub, Jira and more — into one unified organizational memory powered by AI.
            </p>
          </div>
        </div>

        {/* Preview cards */}
        <div className="max-w-5xl mx-auto px-4 md:px-6 mt-10">
          <h2 className="text-lg font-bold text-foreground mb-6">50+ Integrations Coming Soon</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {INTEGRATIONS.slice(0, 16).map(intg => (
              <div key={intg.id} className="relative bg-card border border-border rounded-2xl p-5 flex flex-col items-center gap-3 text-center opacity-75 select-none overflow-hidden group">
                <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl z-10">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Coming Soon</span>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-secondary text-2xl">
                  {typeof intg.icon === 'string' ? intg.icon : <Plug className="w-6 h-6 text-muted-foreground" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{intg.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{intg.category}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            Your workspace admin will be able to activate integrations soon. Stay tuned! 🚀
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background text-foreground pb-12" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-background to-background px-6 py-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(var(--primary-rgb),0.08),transparent_60%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-start gap-4 mb-3">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Plug className="w-5 h-5 text-primary" />
            </div>
            <div className="mt-1">
              <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
              <p className="text-sm text-muted-foreground">Connect your tools. Build organizational memory.</p>
            </div>
          </div>
          {/* Stats row */}
          <div className="flex flex-wrap gap-4 mt-6">
            {[
              { label: 'Connected', value: connectedCount, icon: CheckCircle2, color: 'text-emerald-500' },
              { label: 'Knowledge Items', value: knowledgeCount, icon: FileText, color: 'text-blue-500' },
              { label: 'Available', value: INTEGRATIONS.length, icon: Zap, color: 'text-primary' },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="font-bold text-foreground">{stat.value}</span>
                <span className="text-muted-foreground text-sm">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 mt-6">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveView('hub')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${activeView === 'hub' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Plug className="w-4 h-4" /> Integrations
          </button>
          <button
            onClick={() => setActiveView('analytics')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${activeView === 'analytics' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <BarChart2 className="w-4 h-4" /> Analytics
          </button>
        </div>
      </div>

      {activeView === 'analytics' ? (
        <IntegrationAnalytics embedded={true} />
      ) : (
        <div className="max-w-5xl mx-auto px-4 md:px-6 mt-8 space-y-8">

        {/* Search + Filter */}
        <div className="flex flex-col gap-5">
          <div className="relative w-full max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl text-[15px] focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap justify-center mb-4">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${activeCategory === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Connected integrations summary */}
        {connectedCount > 0 && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
            <h2 className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {connectedCount} Active Connection{connectedCount !== 1 ? 's' : ''}
            </h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(connected).map(([provider, conn]) => {
                const intg = INTEGRATIONS.find(i => i.provider === provider || i.id === provider);
                if (!intg) return null;
                return (
                  <div key={provider} className="flex items-center gap-2 bg-white dark:bg-card border border-emerald-500/20 rounded-xl px-3 py-1.5">
                    <span>{intg.icon}</span>
                    <span className="text-sm font-semibold">{intg.name}</span>
                    {conn.last_synced_at && (
                      <span className="text-xs text-muted-foreground">• synced {new Date(conn.last_synced_at).toLocaleDateString()}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Integration Cards Grid */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-4">
            {activeCategory === 'All' ? 'All Integrations' : activeCategory}
            <span className="ml-2 text-muted-foreground font-normal text-sm">({filteredIntegrations.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {filteredIntegrations.map(integration => {
              const conn = connected[integration.provider] || connected[integration.id];
              const isConnected = !!conn;
              const isSyncing = syncing[integration.id];
              const isDisconnecting = disconnecting[integration.id];
              const isPhase1 = integration.phase === 1;

              return (
                <div
                  key={integration.id}
                  className={`group relative bg-card border ${integration.border} rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md transition-all duration-200 ${!isPhase1 ? 'opacity-75' : ''}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${integration.color} border ${integration.border} flex items-center justify-center text-2xl shadow-sm shrink-0`}>
                        {integration.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground text-sm">{integration.name}</h3>
                          {isConnected && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Connected
                            </span>
                          )}
                          {!isPhase1 && (
                            <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-bold">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{integration.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">{integration.description}</p>

                  {/* Import types */}
                  <div className="flex flex-wrap gap-1.5">
                    {integration.importTypes?.map(type => (
                      <span key={type} className="px-2 py-0.5 bg-secondary text-muted-foreground text-[11px] rounded-lg font-medium">{type}</span>
                    ))}
                  </div>

                  {/* Sync status */}
                  {isConnected && conn?.last_synced_at && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      Last synced: {new Date(conn.last_synced_at).toLocaleString()}
                    </div>
                  )}
                  {isConnected && conn?.sync_error && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-1.5 text-xs text-red-500 bg-red-500/10 p-2 rounded-lg">
                        <div className="flex gap-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span className="leading-snug break-all">{conn.sync_error}</span>
                        </div>
                        <button onClick={() => clearSyncError(integration)} className="hover:bg-red-500/20 rounded p-0.5 shrink-0 transition-colors">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleConnect(integration)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold transition-colors w-fit"
                      >
                        <RefreshCw className="w-3 h-3" /> Re-connect to fix
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border">
                    {isPhase1 ? (
                      isConnected ? (
                        <>
                          <button
                            onClick={() => handleSyncNow(integration)}
                            disabled={isSyncing}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                          </button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="flex items-center justify-center w-8 h-8 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground transition-colors border border-transparent hover:border-border"
                                title={`Auto-Sync: ${conn.sync_frequency || 'Manual'}`}
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="w-48 font-sans z-[100] p-2 rounded-2xl border border-border shadow-xl bg-card">
                              <DropdownMenuLabel className="text-[11px] text-muted-foreground font-bold px-3 py-2 uppercase tracking-widest text-center">Sync Frequency</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-border my-1" />
                              {['Manual', '15 Minutes', 'Hourly', 'Daily', 'Weekly'].map(freq => {
                                const isSelected = conn.sync_frequency === freq;
                                return (
                                  <DropdownMenuItem
                                    key={freq}
                                    onClick={() => handleUpdateSyncFrequency(conn.id, freq)}
                                    className={`cursor-pointer px-4 py-2.5 my-0.5 rounded-xl text-sm font-medium transition-all ${isSelected ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' : 'text-foreground hover:bg-secondary hover:translate-x-1'}`}
                                  >
                                    <div className="flex items-center w-full justify-between">
                                      <span>{freq === '15 Minutes' ? 'Every 15m' : freq}</span>
                                      {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                                    </div>
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfigModal({ integration, conn }); }}
                            className="flex items-center justify-center w-8 h-8 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground transition-colors border border-transparent hover:border-border"
                            title="Configure import settings"
                          >
                            <Settings className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDisconnect(integration)}
                            disabled={isDisconnecting}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold transition-colors disabled:opacity-50 ml-auto"
                            title="Disconnect"
                          >
                            {isDisconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unplug className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">Disconnect</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleConnect(integration)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        >
                          <Plug className="w-3.5 h-3.5" />
                          Connect
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Available in the next release</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Imported Knowledge */}
        {knowledge.length > 0 ? (
          <div>
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Recently Imported Knowledge
              <span className="ml-1 text-muted-foreground font-normal text-sm">({knowledge.length} items)</span>
            </h2>
            <div className="space-y-2">
              {knowledge.map(item => {
                const intg = INTEGRATIONS.find(i => i.provider === item.provider || i.id === item.provider);
                return (
                  <div key={item.id} className="flex items-start gap-3 bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors group">
                    <div className="text-xl shrink-0 mt-0.5">{intg?.icon || '📄'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-foreground truncate">{item.title || 'Untitled'}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-secondary text-muted-foreground rounded-md shrink-0">{item.content_type}</span>
                      </div>
                      {item.ai_summary && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.ai_summary}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-muted-foreground">{intg?.name || item.provider}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-[11px] text-muted-foreground">{new Date(item.imported_at).toLocaleDateString()}</span>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : Object.keys(connected).length > 0 ? (
          <div className="bg-secondary/50 border border-border border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3">
             <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
               <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
             </div>
             <div>
               <h3 className="font-bold text-foreground">Waiting for knowledge sync</h3>
               <p className="text-sm text-muted-foreground max-w-sm mt-1">
                 Your connected integrations are syncing in the background. If you see any errors on the cards above (like 403 or invalid_auth), you'll need to reconnect or clear the errors before data will appear here.
               </p>
             </div>
          </div>
        ) : null}

        {/* API credentials notice */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm text-amber-600 dark:text-amber-400 mb-1">API Credentials Required</h3>
            <p className="text-sm text-muted-foreground">
              To activate integrations, register OAuth apps on each provider's developer portal and add the credentials as Supabase secrets. 
              Contact your administrator or check the <strong>CliPad Integration Setup Guide</strong> for step-by-step instructions.
            </p>
          </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {apiKeyModal && (
        <ApiKeyModal
          integration={apiKeyModal.integration}
          provider={apiKeyModal.provider}
          onSave={handleSaveApiKey}
          onClose={() => setApiKeyModal(null)}
        />
      )}

      {/* Integration Config Modal */}
      {configModal && (
        <IntegrationConfigModal
          integration={configModal.integration}
          conn={configModal.conn}
          onSave={async (updates) => {
            try {
              const { error } = await supabase
                .from('clipad_integrations')
                .update({ metadata: { ...(configModal.conn.metadata || {}), ...updates } })
                .eq('id', configModal.conn.id);
              if (error) throw error;
              toast({ title: '✅ Settings saved', description: 'Import configuration updated.' });
              setConfigModal(null);
              await loadConnected();
            } catch (e) {
              toast({ title: 'Error', description: e.message, variant: 'destructive' });
            }
          }}
          onClose={() => setConfigModal(null)}
        />
      )}
    </div>
  );
}

// ─── API Key Input Modal ──────────────────────────────────────────────────────
const API_KEY_CONFIGS = {
  freshdesk:        { label: 'Freshdesk',             fields: [{ key: 'api_key', label: 'API Key', secret: true }, { key: 'subdomain', label: 'Subdomain (e.g. yourcompany)', secret: false }] },
  guru:             { label: 'Guru',                   fields: [{ key: 'api_key', label: 'API Key', secret: true }, { key: 'username', label: 'Username / Email', secret: false }] },
  trello:           { label: 'Trello',                 fields: [{ key: 'api_key', label: 'API Key', secret: false }, { key: 'token', label: 'Personal Access Token', secret: true }] },
  stripe:           { label: 'Stripe',                 fields: [{ key: 'api_key', label: 'Secret Key (sk_live_...)', secret: true }] },
  datadog:          { label: 'Datadog',                fields: [{ key: 'api_key', label: 'API Key', secret: true }, { key: 'app_key', label: 'Application Key', secret: true }] },
  jenkins:          { label: 'Jenkins',                fields: [{ key: 'url', label: 'Jenkins URL', secret: false }, { key: 'username', label: 'Username', secret: false }, { key: 'api_key', label: 'API Token', secret: true }] },
  whatsapp:         { label: 'WhatsApp Business',      fields: [{ key: 'api_key', label: 'Permanent Access Token', secret: true }, { key: 'phone_id', label: 'Phone Number ID', secret: false }] },
  telegram:         { label: 'Telegram',               fields: [{ key: 'api_key', label: 'Bot Token', secret: true }] },
  aws:              { label: 'AWS',                    fields: [{ key: 'access_key_id', label: 'Access Key ID', secret: false }, { key: 'api_key', label: 'Secret Access Key', secret: true }, { key: 'region', label: 'Region (e.g. us-east-1)', secret: false }] },
  google_cloud:     { label: 'Google Cloud',           fields: [{ key: 'api_key', label: 'Service Account JSON Key', secret: true }] },
  sap:              { label: 'SAP',                    fields: [{ key: 'url', label: 'API URL', secret: false }, { key: 'api_key', label: 'API Key / Token', secret: true }] },
  oracle:           { label: 'Oracle',                 fields: [{ key: 'url', label: 'Oracle Instance URL', secret: false }, { key: 'api_key', label: 'API Key', secret: true }] },
  servicenow:       { label: 'ServiceNow',             fields: [{ key: 'subdomain', label: 'Instance (e.g. mycompany)', secret: false }, { key: 'username', label: 'Username', secret: false }, { key: 'api_key', label: 'Password / API Token', secret: true }] },
  workday:          { label: 'Workday',                fields: [{ key: 'tenant', label: 'Tenant Name', secret: false }, { key: 'api_key', label: 'Integration System User Password', secret: true }] },
  bamboohr:         { label: 'BambooHR',               fields: [{ key: 'subdomain', label: 'Company Domain', secret: false }, { key: 'api_key', label: 'API Key', secret: true }] },
  // PAT (Personal Access Token) providers
  github_enterprise:{ label: 'GitHub Enterprise',      fields: [{ key: 'url', label: 'GitHub Enterprise URL', secret: false }, { key: 'api_key', label: 'Personal Access Token', secret: true }] },
  airtable:         { label: 'Airtable',               fields: [{ key: 'api_key', label: 'Personal Access Token', secret: true }] },
  confluence_pat:   { label: 'Confluence (Server)',    fields: [{ key: 'url', label: 'Confluence Base URL', secret: false }, { key: 'username', label: 'Username', secret: false }, { key: 'api_key', label: 'Personal Access Token', secret: true }] },
  jira_pat:         { label: 'Jira (Server)',           fields: [{ key: 'url', label: 'Jira Base URL', secret: false }, { key: 'username', label: 'Username', secret: false }, { key: 'api_key', label: 'Personal Access Token', secret: true }] },
  gitlab_pat:       { label: 'GitLab (Self-Hosted)',   fields: [{ key: 'url', label: 'GitLab URL', secret: false }, { key: 'api_key', label: 'Personal Access Token', secret: true }] },
  notion_integration:{ label: 'Notion (Integration)', fields: [{ key: 'api_key', label: 'Internal Integration Token', secret: true }] },
  openai:           { label: 'OpenAI',                 fields: [{ key: 'api_key', label: 'API Key (sk-...)', secret: true }] },
  pagerduty:        { label: 'PagerDuty',              fields: [{ key: 'api_key', label: 'API Key', secret: true }] },
  monday_api:       { label: 'Monday.com',             fields: [{ key: 'api_key', label: 'API Token', secret: true }] },
};

function ApiKeyModal({ integration, provider, onSave, onClose }) {
  const config = API_KEY_CONFIGS[provider] || { label: provider, fields: [{ key: 'api_key', label: 'API Key / Token', secret: true }] };
  const [values, setValues] = React.useState({});
  const [showSecrets, setShowSecrets] = React.useState({});
  const [saving, setSaving] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(provider, values);
    setSaving(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200 relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
            <Key className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-base font-bold">Connect {integration?.name || config.label}</h2>
            <p className="text-xs text-muted-foreground">Enter your API credentials to connect</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {config.fields.map(field => (
            <div key={field.key}>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{field.label}</label>
              <div className="relative">
                <input
                  type={field.secret && !showSecrets[field.key] ? 'password' : 'text'}
                  required
                  value={values[field.key] || ''}
                  onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 pr-10"
                  placeholder={field.secret ? '••••••••••••••••' : ''}
                />
                {field.secret && (
                  <button type="button" onClick={() => setShowSecrets(p => ({ ...p, [field.key]: !p[field.key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showSecrets[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
              {saving ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ─── Per-Integration Config Modal ─────────────────────────────────────────────
function IntegrationConfigModal({ integration, conn, onSave, onClose }) {
  const meta = conn?.metadata || {};
  const [importLimit, setImportLimit] = useState(meta.import_limit || 100);
  const [includeFilter, setIncludeFilter] = useState(meta.include_filter || '');
  const [excludeFilter, setExcludeFilter] = useState(meta.exclude_filter || '');
  const [syncAttachments, setSyncAttachments] = useState(meta.sync_attachments ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      import_limit: Number(importLimit),
      include_filter: includeFilter,
      exclude_filter: excludeFilter,
      sync_attachments: syncAttachments,
    });
    setSaving(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200 relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-xl">
            {integration?.icon || <Sliders className="w-5 h-5 text-blue-500" />}
          </div>
          <div>
            <h2 className="text-base font-bold">{integration?.name} — Import Settings</h2>
            <p className="text-xs text-muted-foreground">Control what gets imported and how</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Max items per sync
            </label>
            <input
              type="number"
              min={10}
              max={1000}
              value={importLimit}
              onChange={e => setImportLimit(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Higher limits increase sync time. Default: 100.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Include filter (optional)
            </label>
            <input
              type="text"
              value={includeFilter}
              onChange={e => setIncludeFilter(e.target.value)}
              placeholder="e.g. engineering, product, design"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Comma-separated channels/folders/labels to include.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Exclude filter (optional)
            </label>
            <input
              type="text"
              value={excludeFilter}
              onChange={e => setExcludeFilter(e.target.value)}
              placeholder="e.g. random, general, archive"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Comma-separated channels/folders/labels to skip.</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Sync Attachments</p>
              <p className="text-xs text-muted-foreground">Include file attachments in sync</p>
            </div>
            <button
              type="button"
              onClick={() => setSyncAttachments(p => !p)}
              className={`w-11 h-6 rounded-full transition-colors relative ${syncAttachments ? 'bg-blue-500' : 'bg-secondary border border-border'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${syncAttachments ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
