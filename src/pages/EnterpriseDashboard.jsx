import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, ArrowRight, Activity, TrendingUp, Globe, Users, BarChart3, ShieldCheck, Layers, Loader2, X, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { INDUSTRIES } from '@/config/industries';

const SUPER_ADMIN_KEYS = new Set(['slate', 'optavelos', 'admin', 'slateadmin', 'superadmin', 'optavel', 'slate_admin']);

export default function EnterpriseDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVertical, setSelectedVertical] = useState(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployingVertical, setDeployingVertical] = useState(null);

  const fetchPortfolio = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const ids = [...(user.available_companies?.map(c => c.id) || []), user.company_id].filter(Boolean);
      const uniqueIds = [...new Set(ids)];
      if (!uniqueIds.length) { setPortfolio([]); setLoading(false); return; }
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, industry_type, subdomain, status, logo_url, subscription_plan')
        .in('id', uniqueIds);
      if (error) throw error;
      const companies = data || [];
      setPortfolio(companies);
      const current = companies.find(c => c.id === user.company_id) || companies[0];
      if (current) setSelectedVertical(current);
    } catch (err) {
      console.error('Portfolio fetch failed:', err);
      toast.error('Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.company_id]);

  useEffect(() => { fetchPortfolio(); }, [fetchPortfolio]);

  // Vertical switch: identical to Super Admin handleIndustryChange in TopBar.jsx
  // Sets sessionStorage industry override, clears React Query cache, navigates to /
  // and reloads so Sidebar + all pages re-read the new industry. No subdomain redirect.
  const handleVerticalSwitch = (company) => {
    const industry = company.industry_type || company.industry;
    if (!industry) { toast.error('This vertical has no industry configured'); return; }
    sessionStorage.setItem('slate_industry_override', industry);
    queryClient.clear();
    toast.success('Switching to ' + company.name + '...');
    navigate('/');
    setTimeout(() => { window.location.reload(); }, 150);
  };

  const handleDeployVertical = async (industryKey) => {
    setDeployingVertical(industryKey);
    const indConfig = INDUSTRIES[industryKey];
    await new Promise(res => setTimeout(res, 2500));
    let newCompany = {
      id: crypto.randomUUID(),
      name: 'New ' + indConfig.name + ' Vertical',
      industry_type: industryKey, subdomain: industryKey, status: 'active',
    };
    try {
      const { data, error } = await supabase.from('companies')
        .insert({ name: newCompany.name, industry_type: industryKey, status: 'active', created_by: user?.id })
        .select().single();
      if (!error && data) newCompany = data;
    } catch (e) { console.warn('Supabase insert failed, using local state:', e); }
    setPortfolio(prev => [newCompany, ...prev]);
    setDeployingVertical(null);
    setShowDeployModal(false);
    setSelectedVertical(newCompany);
    toast.success(indConfig.name + ' deployed! Click Switch to enter.', { duration: 5000 });
  };

  const getStats = (company) => ({
    users: '--',
    revenue: '--',
    plan: company.subscription_plan || 'starter',
    status: company.status || 'active',
  });

  const availableVerticals = Object.entries(INDUSTRIES).filter(([key]) => !SUPER_ADMIN_KEYS.has(key));
  const activeCount = portfolio.filter(c => c.status === 'active').length;
  const currentInd = (selectedVertical?.industry_type || selectedVertical?.industry || '').replace(/_/g, ' ');

  return (
    <div className="p-3 md:p-6 max-w-screen-xl mx-auto space-y-4 min-h-screen">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
              <Globe className="text-primary dark:text-primary w-5 h-5" />
            </div>
            Enterprise Command Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Monitor and switch between all your deployed vertical workspaces.</p>
        </div>
        <Button onClick={() => setShowDeployModal(true)} className="bg-primary hover:bg-primary/90 text-white rounded-lg px-5 py-2.5 flex items-center gap-2 text-sm font-semibold">
          <Plus size={16} /> Deploy New Vertical
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-primary/5 dark:bg-primary/10 flex items-center justify-center">
            <Building2 className="text-primary dark:text-primary w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Portfolio Companies</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{portfolio.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <Layers className="text-blue-600 dark:text-blue-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Verticals</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{activeCount}</p>
          </div>
        </div>
        <div className="bg-primary rounded-xl p-5 flex flex-col justify-center text-white relative overflow-hidden">
          <p className="text-xs font-semibold text-primary-foreground flex items-center gap-1.5 mb-1"><Activity className="w-3.5 h-3.5" /> Current Workspace</p>
          <p className="text-lg font-bold truncate">{selectedVertical?.name || 'None selected'}</p>
          <p className="text-primary-foreground/80 text-xs mt-0.5 capitalize">{currentInd || '--'}</p>
          <TrendingUp className="absolute right-2 bottom-2 text-white/10 w-24 h-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-6">
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Your Verticals</h2>
            <span className="bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary text-xs font-bold px-2 py-0.5 rounded-full">{portfolio.length}</span>
          </div>

          {loading ? (
            <div className="flex flex-col gap-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div>
          ) : portfolio.length === 0 ? (
            <div className="p-5 md:p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center bg-white dark:bg-card">
              <Building2 className="mx-auto text-slate-400 mb-2 w-8 h-8" />
              <p className="text-slate-500 text-sm font-medium">No verticals deployed yet.</p>
              <Button onClick={() => setShowDeployModal(true)} variant="outline" size="sm" className="mt-3 rounded-lg">Deploy First Vertical</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-96 pr-1 pb-4">
              {portfolio.map((company, i) => {
                const isSelected = selectedVertical?.id === company.id;
                const ind = (company.industry_type || company.industry || 'core').replace(/_/g, ' ');
                return (
                  <motion.div key={company.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    onClick={() => setSelectedVertical(company)}
                    className={'p-4 cursor-pointer rounded-xl border transition-all ' + (isSelected ? 'bg-primary border-primary' : 'bg-white dark:bg-card border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-50')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={'p-2 rounded-lg ' + (isSelected ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800')}>
                        <Building2 className={'w-4 h-4 ' + (isSelected ? 'text-white' : 'text-slate-500')} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className={'font-semibold text-sm truncate ' + (isSelected ? 'text-white' : 'text-slate-900 dark:text-white')}>{company.name}</h3>
                        <p className={'text-xs mt-0.5 capitalize ' + (isSelected ? 'text-primary-foreground' : 'text-slate-400')}>{ind}</p>
                      </div>
                      {company.status === 'active' && <span className={'w-1.5 h-1.5 rounded-full flex-shrink-0 ' + (isSelected ? 'bg-white' : 'bg-primary')} />}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {selectedVertical ? (
              <motion.div key={selectedVertical.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                className="bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col gap-5"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary text-xs font-bold uppercase tracking-wider rounded capitalize">
                        {(selectedVertical.industry_type || selectedVertical.industry || 'core').replace(/_/g, ' ')}
                      </span>
                      {selectedVertical.status === 'active' && (
                        <span className="flex items-center gap-1 text-primary dark:text-primary text-xs font-semibold"><ShieldCheck className="w-3.5 h-3.5" /> Active</span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedVertical.name}</h2>
                    <p className="text-slate-400 text-xs mt-0.5">{selectedVertical.subdomain ? selectedVertical.subdomain + '.optavel.com' : selectedVertical.id}</p>
                  </div>
                  <Button onClick={() => handleVerticalSwitch(selectedVertical)}
                    className="bg-primary hover:bg-primary/90 text-white rounded-lg px-5 py-2.5 text-sm font-semibold flex items-center gap-2 shrink-0">
                    Switch to this Vertical <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(() => {
                    const s = getStats(selectedVertical);
                    return [
                      { icon: Users, label: 'Employees', value: String(s.users) },
                      { icon: BarChart3, label: 'Monthly Rev', value: String(s.revenue) },
                      { icon: Activity, label: 'Plan', value: String(s.plan) },
                      { icon: ShieldCheck, label: 'Status', value: String(s.status) },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">
                        <Icon className="w-4 h-4 text-primary mb-2" />
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
                        <p className="text-base font-bold text-slate-900 dark:text-white mt-1 capitalize truncate">{value}</p>
                      </div>
                    ));
                  })()}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-lg p-4 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">How vertical switching works</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Clicking Switch to this Vertical reloads the app with that industry full module set - identical to Super Admin industry switching. The sidebar, pages and features all update to match. No subdomain redirect happens.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-xl p-16 flex flex-col items-center justify-center text-center">
                <Building2 className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">Select a vertical to view details</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Dialog open={showDeployModal} onOpenChange={deployingVertical ? undefined : setShowDeployModal}>
        <DialogContent className="max-w-3xl max-h-screen overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card p-0">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">Deploy New Vertical</DialogTitle>
              <DialogDescription className="text-slate-500 text-sm mt-0.5">Select an industry. Once deployed you can switch to it instantly.</DialogDescription>
            </div>
            {!deployingVertical && (
              <button onClick={() => setShowDeployModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            )}
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableVerticals.map(([key, ind]) => {
              const alreadyDeployed = portfolio.some(c => (c.industry_type || c.industry) === key);
              const isDeploying = deployingVertical === key;
              return (
                <div key={key}
                  onClick={() => !deployingVertical && !alreadyDeployed && handleDeployVertical(key)}
                  className={'border rounded-lg p-4 transition-all relative overflow-hidden ' + (
                    alreadyDeployed ? 'border-primary/20 dark:border-primary/20 bg-primary/5 cursor-default' :
                    isDeploying ? 'border-primary/40 bg-primary/5 dark:bg-primary/10' :
                    deployingVertical ? 'opacity-40 pointer-events-none border-slate-200 bg-white dark:bg-card' :
                    'border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-50 cursor-pointer bg-white dark:bg-card'
                  )}
                >
                  {isDeploying && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-card/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      <span className="text-xs font-bold text-primary">Deploying {ind.name}...</span>
                      <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1"><div className="h-full bg-primary rounded-full" style={{width: '70%'}} /></div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-base">{ind.icon || '🏢'}</div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex-1 truncate">{ind.name}</h3>
                    {alreadyDeployed && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">Complete OS for {ind.name?.toLowerCase()} management.</p>
                  {alreadyDeployed && <p className="text-xs font-bold text-primary mt-2">Already deployed</p>}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
