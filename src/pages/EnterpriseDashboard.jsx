import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useImpersonation } from "@/lib/ImpersonationContext";
import { supabase } from "@/api/supabaseClient";
import IntelligenceUI from "@/components/intelligence/IntelligenceUI";
import { Building2, Plus, ArrowRight, Activity, TrendingUp, Sparkles, Globe, ChevronDown, Users, BarChart3, ShieldCheck, Zap, Server, Loader2, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import { INDUSTRIES } from "@/config/industries";

export default function EnterpriseDashboard() {
  const { user } = useAuth();
  const { startImpersonation } = useImpersonation();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVertical, setSelectedVertical] = useState(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployingVertical, setDeployingVertical] = useState(null);

  const fetchPortfolio = async () => {
    try {
      if (!user?.id || !user?.available_companies?.length) {
        setPortfolio([]);
        setLoading(false);
        return;
      }
      
      const companyIds = user.available_companies.map(c => c.id);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .in('id', companyIds);
        
      if (error) throw error;
      
      // Ensure current company is always in the list if not fetched
      let finalData = data || [];
      if (user.company_id && !finalData.find(c => c.id === user.company_id)) {
         const { data: currentCompany } = await supabase.from('companies').select('*').eq('id', user.company_id).single();
         if (currentCompany) finalData.push(currentCompany);
      }
      
      setPortfolio(finalData);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch enterprise portfolio:", err);
      setLoading(false);
    }
  };

  
  const handleVerticalSwitch = (company) => {
    setSelectedVertical(company);
    // Behave like Super Admin: override industry and reload
    const newIndustry = company.industry_type || company.industry;
    if (newIndustry) {
      sessionStorage.setItem('slate_industry_override', newIndustry);
      toast.success(`Switched to ${newIndustry} vertical`);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [user?.id]);

  const changeWorkspace = async (e, companyId, newIndustry) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from('companies').update({ industry_type: newIndustry, industry: newIndustry }).eq('id', companyId);
      if (error) throw error;
      toast.success(`Workspace updated to ${newIndustry}!`);
      
      setPortfolio(prev => prev.map(c => c.id === companyId ? { ...c, industry: newIndustry, industry_type: newIndustry } : c));
      if (selectedVertical && selectedVertical.id === companyId) {
        setSelectedVertical(prev => ({ ...prev, industry: newIndustry, industry_type: newIndustry }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update workspace.");
    }
  };

  const handleDeployVertical = async (industryKey) => {
    setDeployingVertical(industryKey);
    const indConfig = INDUSTRIES[industryKey];
    
    // Simulate 4 second deployment
    setTimeout(() => {
      const newCompany = {
        id: Math.random().toString(36).substr(2, 9),
        name: `New ${indConfig.name} Vertical`,
        subdomain: industryKey,
        industry: industryKey,
        industry_type: industryKey
      };
      
      setPortfolio(prev => [newCompany, ...prev]);
      setShowDeployModal(false);
      setDeployingVertical(null);
      setSelectedVertical(newCompany);
      toast.success(`${indConfig.name} vertical deployed successfully!`);
    }, 4000);
  };

  const totalModulesActive = portfolio.reduce((acc, curr) => acc + (curr.active_modules ? curr.active_modules.length : 0), 0);

  const generateMockStats = (id) => {
    const seed = id ? id.charCodeAt(0) + id.charCodeAt(id.length - 1) : 0;
    return {
      users: 120 + (seed * 15),
      revenue: `$${(24 + (seed % 10)).toLocaleString()}k`,
      uptime: `${99 + ((seed % 100) / 100)}%`,
      growth: `+${8 + (seed % 15)}%`
    };
  };

  const availableVerticals = Object.entries(INDUSTRIES).filter(([key]) => key !== 'optavelos' && key !== 'admin' && key !== 'slateadmin');

  return (
    <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-8 min-h-screen bg-slate-50/50 dark:bg-slate-950/20 font-dmsans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl">
              <Globe className="text-emerald-600 dark:text-emerald-400 w-7 h-7" />
            </div>
            Enterprise Command Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Manage your entire portfolio of businesses and verticals from a unified dashboard.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Select Vertical Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-full px-6 py-5 flex items-center gap-2 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all">
                <LayoutGrid size={18} className="text-emerald-600 dark:text-emerald-400" /> 
                <span className="font-semibold text-slate-700 dark:text-slate-300">Select Vertical</span>
                <ChevronDown size={16} className="text-slate-400 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Deployed Verticals</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {portfolio.map((company) => (
                <DropdownMenuItem 
                  key={company.id} 
                  onClick={() => handleVerticalSwitch(company)}
                  className={`cursor-pointer flex flex-col items-start gap-1 p-3 ${selectedVertical?.id === company.id ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`font-bold ${selectedVertical?.id === company.id ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>{company.name}</span>
                    {selectedVertical?.id === company.id && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                  </div>
                  <span className="text-xs text-slate-500 capitalize">{company.industry?.replace('_', ' ')}</span>
                </DropdownMenuItem>
              ))}
              {portfolio.length === 0 && (
                <div className="p-4 text-center text-sm text-slate-500">No verticals deployed yet.</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setShowDeployModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 py-5 flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
            <Plus size={18} /> Deploy New Vertical
          </Button>
        </div>
      </div>

      {/* High Level Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
            <Building2 className="text-emerald-600 dark:text-emerald-400 w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Portfolio Companies</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{portfolio.length}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
            <Server className="text-emerald-600 dark:text-emerald-400 w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Active Modules</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{totalModulesActive}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-3xl p-6 flex flex-col justify-center text-white border-0 relative overflow-hidden shadow-xl shadow-emerald-900/20">
          <div className="relative z-10">
            <p className="text-sm font-semibold text-emerald-100 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Overall Portfolio Growth
            </p>
            <div className="flex items-end gap-3 mt-1">
              <p className="text-4xl font-black">+24%</p>
              <span className="text-emerald-200 font-medium mb-1 shrink-0">this quarter</span>
            </div>
          </div>
          <TrendingUp className="absolute right-0 bottom-0 text-white opacity-10 w-40 h-40 translate-x-8 translate-y-8" />
        </div>
      </div>

      {/* Main Layout: Master-Detail Vertical Switcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        
        {/* Left Column: Vertical List (Master) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Verticals</h2>
            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full">
              {portfolio.length}
            </span>
          </div>

          {loading ? (
            <div className="text-slate-500 text-sm animate-pulse flex flex-col gap-3">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full"></div>)}
            </div>
          ) : portfolio.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center bg-white dark:bg-slate-900">
              <Building2 className="mx-auto text-slate-400 mb-3 w-10 h-10" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">No companies in your portfolio yet.</p>
              <Button onClick={() => setShowDeployModal(true)} variant="outline" className="mt-4 rounded-full">Deploy First Vertical</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[800px] pr-2 custom-scrollbar pb-10">
              {portfolio.map((company, i) => {
                const isSelected = selectedVertical?.id === company.id;
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={company.id} 
                    onClick={() => handleVerticalSwitch(company)}
                    className={`p-5 cursor-pointer rounded-2xl border transition-all duration-200 group relative overflow-hidden ${
                      isSelected 
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-600 ring-offset-2 dark:ring-offset-slate-950' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400 hover:shadow-md'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-600 opacity-20"></div>
                    )}
                    
                    <div className="relative z-10 flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl transition-colors ${
                          isSelected 
                          ? 'bg-white/20 text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                        }`}>
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className={`font-bold truncate max-w-[160px] ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors'}`}>
                            {company.name}
                          </h3>
                          <p className={`text-xs truncate ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                            {company.subdomain}.optavel.com
                          </p>
                        </div>
                      </div>
                      
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={`h-7 px-2 text-[10px] font-bold uppercase tracking-widest rounded-lg border-0 transition-colors ${
                                isSelected 
                                ? 'bg-white/10 hover:bg-white/20 text-white' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                            >
                              {company.industry || 'core'} <ChevronDown className="ml-1 w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {['law_firm', 'hospital', 'school', 'university', 'vocational', 'hotel', 'hr', 'retail', 'logistics', 'insurance', 'religion', 'marketing_agency', 'core'].map(ind => (
                              <DropdownMenuItem key={ind} onClick={(e) => changeWorkspace(e, company.id, ind)}>
                                {ind.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detail View (Detail) */}
        <div className="lg:col-span-8 flex flex-col h-full">
          <AnimatePresence mode="wait">
            {selectedVertical ? (
              <motion.div 
                key={selectedVertical.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col h-full relative overflow-hidden"
              >
                {/* Decorative Background Blur */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 dark:border-slate-800 pb-8 mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs font-bold uppercase tracking-widest rounded-full">
                        {selectedVertical.industry || 'Workspace'}
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5" /> Healthy
                      </span>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{selectedVertical.name}</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                      {selectedVertical.subdomain}.optavel.com
                    </p>
                  </div>
                  
                  <Button 
                    onClick={() => startImpersonation(selectedVertical)}
                    className="bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-full px-8 py-6 text-base font-bold flex items-center gap-2 shadow-lg shadow-slate-900/20 transition-all active:scale-95 w-full md:w-auto shrink-0"
                  >
                    Launch Workspace <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>

                {/* Vertical Specific Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 relative z-10">
                  {(() => {
                    const stats = generateMockStats(selectedVertical.id);
                    return (
                      <>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 transition-colors">
                          <Users className="w-5 h-5 text-emerald-500 mb-3" />
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Active Users</p>
                          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.users}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 transition-colors">
                          <BarChart3 className="w-5 h-5 text-emerald-500 mb-3" />
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Monthly Rev</p>
                          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.revenue}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 transition-colors">
                          <Activity className="w-5 h-5 text-emerald-500 mb-3" />
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Sys Uptime</p>
                          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.uptime}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 transition-colors">
                          <TrendingUp className="w-5 h-5 text-emerald-500 mb-3" />
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">QoQ Growth</p>
                          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.growth}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Intelligence specific to the vertical */}
                <div className="flex-1 min-h-[400px] bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col relative z-10">
                  <div className="bg-slate-950 p-4 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/20 rounded-xl">
                        <Sparkles className="text-emerald-400 w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h2 className="text-white font-bold tracking-tight">Workspace Copilot</h2>
                        <p className="text-emerald-200/60 text-xs">Connected to {selectedVertical.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Online</span>
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    <IntelligenceUI embedded={true} customPrompt={`You are an AI analyst specifically connected to the '${selectedVertical.name}' workspace (Industry: ${selectedVertical.industry}). Provide insights tailored to this vertical.`} />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="global-intelligence"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-emerald-950/20 border border-slate-200 dark:border-emerald-800/30 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none h-full flex flex-col"
              >
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/40 border-b border-emerald-100 dark:border-emerald-800/30 p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/20 rounded-xl">
                      <Zap className="text-emerald-400 w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-emerald-900 dark:text-emerald-100 text-lg font-bold tracking-tight">Global Portfolio Intelligence</h2>
                      <p className="text-emerald-600/80 dark:text-emerald-400/80 text-sm">AI Agent connected to your entire multi-vertical ecosystem</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 bg-white dark:bg-transparent relative min-h-[600px]">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                    <Globe className="w-96 h-96 text-emerald-900" />
                  </div>
                  <IntelligenceUI embedded={true} customPrompt="You are an Enterprise Portfolio Analyst. Summarize metrics across all my child companies. I have not selected a specific vertical yet, so speak in broad terms about the whole portfolio." />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Deploy Vertical Modal */}
      <Dialog open={showDeployModal} onOpenChange={deployingVertical ? undefined : setShowDeployModal}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-0 rounded-3xl border-0">
          <div className="bg-gradient-to-br from-emerald-600 to-green-700 p-8 text-white">
            <DialogTitle className="text-3xl font-black mb-2 flex items-center gap-3">
              <Sparkles className="text-emerald-300" />
              Deploy New Vertical
            </DialogTitle>
            <DialogDescription className="text-emerald-100 text-lg">
              Select an industry vertical to automatically provision a complete workspace for your organization.
            </DialogDescription>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableVerticals.map(([key, ind]) => (
              <div 
                key={key}
                onClick={() => !deployingVertical && handleDeployVertical(key)}
                className={`border border-slate-200 dark:border-slate-800 rounded-2xl p-5 transition-all duration-300 relative overflow-hidden ${
                  deployingVertical === key 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500' 
                  : deployingVertical ? 'opacity-50 grayscale pointer-events-none' : 'hover:border-emerald-400 hover:shadow-md cursor-pointer bg-white dark:bg-slate-950'
                }`}
              >
                {deployingVertical === key && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 animate-pulse">Deploying...</span>
                  </div>
                )}
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0">
                    {ind.icon || '🏢'}
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{ind.name}</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                  Complete operating system optimized for {ind.name.toLowerCase()} management.
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
