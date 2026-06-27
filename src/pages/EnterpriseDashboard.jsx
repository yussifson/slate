import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useImpersonation } from "@/lib/ImpersonationContext";
import { supabase } from "@/api/supabaseClient";
import IntelligenceUI from "@/components/intelligence/IntelligenceUI";
import { Building2, Plus, ArrowRight, Activity, TrendingUp, Sparkles, Globe, ChevronDown, Users, BarChart3, ShieldCheck, Zap, Server } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "react-hot-toast";

export default function EnterpriseDashboard() {
  const { user } = useAuth();
  const { startImpersonation } = useImpersonation();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVertical, setSelectedVertical] = useState(null);

  const fetchPortfolio = async () => {
    try {
      if (!user?.id) return;
      const { data, error } = await supabase.rpc('get_enterprise_portfolio', { admin_uid: user.id });
      if (error) throw error;
      setPortfolio(data || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch enterprise portfolio:", err);
      setLoading(false);
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
      
      // Update local state to avoid refetching if we want instant feedback
      setPortfolio(prev => prev.map(c => c.id === companyId ? { ...c, industry: newIndustry, industry_type: newIndustry } : c));
      if (selectedVertical && selectedVertical.id === companyId) {
        setSelectedVertical(prev => ({ ...prev, industry: newIndustry, industry_type: newIndustry }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update workspace.");
    }
  };

  const totalModulesActive = portfolio.reduce((acc, curr) => acc + (curr.active_modules ? curr.active_modules.length : 0), 0);

  // Generate some premium-looking mock stats for the selected vertical to make it feel alive
  const generateMockStats = (id) => {
    // Deterministic mock generation based on ID
    const seed = id ? id.charCodeAt(0) + id.charCodeAt(id.length - 1) : 0;
    return {
      users: 120 + (seed * 15),
      revenue: `$${(24 + (seed % 10)).toLocaleString()}k`,
      uptime: `${99 + ((seed % 100) / 100)}%`,
      growth: `+${8 + (seed % 15)}%`
    };
  };

  return (
    <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-8 min-h-screen bg-slate-50/50 dark:bg-slate-950/20 font-dmsans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl">
              <Globe className="text-blue-600 dark:text-blue-400 w-7 h-7" />
            </div>
            Enterprise Command Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Manage your entire portfolio of businesses and verticals from a unified dashboard.
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-5 flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95">
          <Plus size={18} /> Deploy New Vertical
        </Button>
      </div>

      {/* High Level Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
            <Building2 className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
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

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 flex flex-col justify-center text-white border-0 relative overflow-hidden shadow-xl shadow-blue-900/20">
          <div className="relative z-10">
            <p className="text-sm font-semibold text-blue-100 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Overall Portfolio Growth
            </p>
            <div className="flex items-end gap-3 mt-1">
              <p className="text-4xl font-black">+24%</p>
              <span className="text-blue-200 font-medium mb-1 shrink-0">this quarter</span>
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
            <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold px-2.5 py-1 rounded-full">
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
              <Button variant="outline" className="mt-4 rounded-full">Deploy First Vertical</Button>
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
                    onClick={() => setSelectedVertical(company)}
                    className={`p-5 cursor-pointer rounded-2xl border transition-all duration-200 group relative overflow-hidden ${
                      isSelected 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-slate-950' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:shadow-md'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-20"></div>
                    )}
                    
                    <div className="relative z-10 flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl transition-colors ${
                          isSelected 
                          ? 'bg-white/20 text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        }`}>
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className={`font-bold truncate max-w-[160px] ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors'}`}>
                            {company.name}
                          </h3>
                          <p className={`text-xs truncate ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
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
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 dark:border-slate-800 pb-8 mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs font-bold uppercase tracking-widest rounded-full">
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
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <Users className="w-5 h-5 text-indigo-500 mb-3" />
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Active Users</p>
                          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.users}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <BarChart3 className="w-5 h-5 text-emerald-500 mb-3" />
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Monthly Rev</p>
                          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.revenue}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <Activity className="w-5 h-5 text-blue-500 mb-3" />
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Sys Uptime</p>
                          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.uptime}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <TrendingUp className="w-5 h-5 text-amber-500 mb-3" />
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
                      <div className="p-2 bg-indigo-500/20 rounded-xl">
                        <Sparkles className="text-indigo-400 w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h2 className="text-white font-bold tracking-tight">Workspace Copilot</h2>
                        <p className="text-indigo-200 text-xs">Connected to {selectedVertical.name}</p>
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
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none h-full flex flex-col"
              >
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/20 rounded-xl">
                      <Zap className="text-indigo-400 w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-white text-lg font-bold tracking-tight">Global Portfolio Intelligence</h2>
                      <p className="text-indigo-200 text-sm">AI Agent connected to your entire multi-vertical ecosystem</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 bg-slate-50 dark:bg-slate-950 relative min-h-[600px]">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                    <Globe className="w-96 h-96" />
                  </div>
                  <IntelligenceUI embedded={true} customPrompt="You are an Enterprise Portfolio Analyst. Summarize metrics across all my child companies. I have not selected a specific vertical yet, so speak in broad terms about the whole portfolio." />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
