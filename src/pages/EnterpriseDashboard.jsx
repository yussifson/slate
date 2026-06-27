import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useImpersonation } from "@/lib/ImpersonationContext";
import { supabase } from "@/api/supabaseClient";
import IntelligenceUI from "@/components/intelligence/IntelligenceUI";
import { Building2, Plus, ArrowRight, Activity, TrendingUp, Sparkles, Globe, Users, BarChart3, ShieldCheck, Zap, Server, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import { INDUSTRIES } from "@/config/industries";

const RESTRICTED_KEYS = ["optavelos", "admin", "slateadmin", "superadmin", "optavel"];

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
      if (!user?.id) { setLoading(false); return; }
      const companyIds = user?.available_companies?.map(c => c.id) || [];
      const ids = companyIds.length ? companyIds : (user?.company_id ? [user.company_id] : []);
      if (!ids.length) { setPortfolio([]); setLoading(false); return; }

      const { data, error } = await supabase.from("companies").select("*").in("id", ids);
      if (error) throw error;
      let finalData = data || [];
      if (user.company_id && !finalData.find(c => c.id === user.company_id)) {
        const { data: cur } = await supabase.from("companies").select("*").eq("id", user.company_id).single();
        if (cur) finalData.push(cur);
      }
      setPortfolio(finalData);
      if (finalData.length > 0) setSelectedVertical(finalData[0]);
    } catch (err) {
      console.error("Failed to fetch enterprise portfolio:", err);
    } finally {
      setLoading(false);
    }
  };

  // Switch vertical entirely in-app — no subdomain redirect
  const handleVerticalSwitch = (company) => {
    setSelectedVertical(company);
    const ind = company.industry_type || company.industry;
    if (ind) {
      sessionStorage.setItem("slate_industry_override", ind);
      window.dispatchEvent(new CustomEvent("slate_industry_change", { detail: { industry: ind } }));
    }
  };

  useEffect(() => { fetchPortfolio(); }, [user?.id]);

  const handleDeployVertical = (industryKey) => {
    setDeployingVertical(industryKey);
    const indConfig = INDUSTRIES[industryKey];
    setTimeout(() => {
      const newCompany = {
        id: crypto.randomUUID(),
        name: `New ${indConfig.name} Vertical`,
        subdomain: industryKey,
        industry: industryKey,
        industry_type: industryKey,
      };
      setPortfolio(prev => [newCompany, ...prev]);
      setShowDeployModal(false);
      setDeployingVertical(null);
      setSelectedVertical(newCompany);
      toast.success(`${indConfig.name} vertical deployed!`);
    }, 2500);
  };

  const generateMockStats = (id = "") => {
    const seed = id ? id.charCodeAt(0) + (id.charCodeAt(id.length - 1) || 0) : 42;
    return {
      users: (120 + seed * 15).toLocaleString(),
      revenue: `$${(24 + (seed % 10)).toLocaleString()}k`,
      uptime: `99.${seed % 100 < 10 ? "0" : ""}${seed % 100}%`,
      growth: `+${8 + (seed % 15)}%`,
    };
  };

  const availableVerticals = Object.entries(INDUSTRIES).filter(([key]) => !RESTRICTED_KEYS.includes(key));
  const totalModules = portfolio.reduce((a, c) => a + (c.active_modules?.length || 0), 0);

  return (
    <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-6 min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Globe className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
            </div>
            Enterprise Command Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Manage your portfolio of verticals from one unified dashboard.
          </p>
        </div>
        <Button
          onClick={() => setShowDeployModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-5 py-2.5 flex items-center gap-2 text-sm font-semibold"
        >
          <Plus size={16} /> Deploy New Vertical
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
            <Building2 className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Portfolio Companies</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{portfolio.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
            <Server className="text-blue-600 dark:text-blue-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Active Modules</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{totalModules}</p>
          </div>
        </div>
        <div className="bg-emerald-600 rounded-xl p-5 flex flex-col justify-center text-white relative overflow-hidden">
          <p className="text-xs font-semibold text-emerald-100 flex items-center gap-1.5 mb-1">
            <Activity className="w-3.5 h-3.5" /> Overall Portfolio Growth
          </p>
          <p className="text-3xl font-bold">+24%</p>
          <p className="text-emerald-200 text-xs mt-0.5">this quarter</p>
          <TrendingUp className="absolute right-2 bottom-2 text-white/10 w-24 h-24" />
        </div>
      </div>

      {/* Master-Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: List */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Your Verticals</h2>
            <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full">{portfolio.length}</span>
          </div>

          {loading ? (
            <div className="flex flex-col gap-2">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />)}
            </div>
          ) : portfolio.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center bg-white dark:bg-slate-900">
              <Building2 className="mx-auto text-slate-400 mb-2 w-8 h-8" />
              <p className="text-slate-500 text-sm font-medium">No verticals yet.</p>
              <Button onClick={() => setShowDeployModal(true)} variant="outline" size="sm" className="mt-3 rounded-lg">Deploy First Vertical</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[700px] pr-1 pb-4">
              {portfolio.map((company, i) => {
                const isSelected = selectedVertical?.id === company.id;
                return (
                  <motion.div
                    key={company.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => handleVerticalSwitch(company)}
                    className={`p-4 cursor-pointer rounded-xl border transition-all ${
                      isSelected
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${isSelected ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800"}`}>
                        <Building2 className={`w-4 h-4 ${isSelected ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className={`font-semibold text-sm truncate ${isSelected ? "text-white" : "text-slate-900 dark:text-white"}`}>{company.name}</h3>
                        <p className={`text-xs truncate mt-0.5 ${isSelected ? "text-emerald-100" : "text-slate-400"}`}>{(company.subdomain || company.industry || "core")}.optavel.com</p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                        isSelected ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}>
                        {(company.industry || "core").replace("_", " ")}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Detail */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {selectedVertical ? (
              <motion.div
                key={selectedVertical.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col gap-5"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider rounded">
                        {selectedVertical.industry || "Workspace"}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> Healthy
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedVertical.name}</h2>
                    <p className="text-slate-500 text-sm mt-0.5">{(selectedVertical.subdomain || selectedVertical.industry || "core")}.optavel.com</p>
                  </div>
                  <Button
                    onClick={() => startImpersonation(selectedVertical)}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-lg px-5 py-2.5 text-sm font-semibold flex items-center gap-2 shrink-0"
                  >
                    Launch Workspace <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(() => {
                    const s = generateMockStats(selectedVertical.id);
                    return [
                      { icon: Users, label: "Active Users", value: s.users },
                      { icon: BarChart3, label: "Monthly Rev", value: s.revenue },
                      { icon: Activity, label: "Sys Uptime", value: s.uptime },
                      { icon: TrendingUp, label: "QoQ Growth", value: s.growth },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">
                        <Icon className="w-4 h-4 text-emerald-500 mb-2" />
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
                      </div>
                    ));
                  })()}
                </div>

                {/* Copilot */}
                <div className="min-h-[340px] bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
                  <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                        <Sparkles className="text-emerald-400 w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Workspace Copilot</p>
                        <p className="text-emerald-300/60 text-xs">Connected to {selectedVertical.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Live</span>
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    <IntelligenceUI
                      embedded={true}
                      customPrompt={`You are an AI analyst connected to the "${selectedVertical.name}" workspace (Industry: ${selectedVertical.industry}). Provide insights tailored to this vertical.`}
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="global"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-[500px]"
              >
                <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 px-5 py-4 flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Zap className="text-emerald-500 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-slate-900 dark:text-white font-semibold text-sm">Global Portfolio Intelligence</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">AI connected to your entire ecosystem</p>
                  </div>
                </div>
                <div className="flex-1 relative min-h-[480px]">
                  <IntelligenceUI embedded={true} customPrompt="You are an Enterprise Portfolio Analyst. Speak in broad terms about the entire portfolio." />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Deploy Modal */}
      <Dialog open={showDeployModal} onOpenChange={deployingVertical ? undefined : setShowDeployModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">Deploy New Vertical</DialogTitle>
              <DialogDescription className="text-slate-500 text-sm mt-0.5">
                Select an industry to provision a complete workspace.
              </DialogDescription>
            </div>
            {!deployingVertical && (
              <button onClick={() => setShowDeployModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableVerticals.map(([key, ind]) => (
              <div
                key={key}
                onClick={() => !deployingVertical && handleDeployVertical(key)}
                className={`border rounded-lg p-4 transition-all relative overflow-hidden ${
                  deployingVertical === key
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400"
                    : deployingVertical
                    ? "opacity-40 pointer-events-none border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    : "border-slate-200 dark:border-slate-800 hover:border-emerald-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer bg-white dark:bg-slate-900"
                }`}
              >
                {deployingVertical === key && (
                  <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                    <span className="text-xs font-bold text-emerald-700">Deploying...</span>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-base shrink-0">
                    {ind.icon || "??"}
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{ind.name}</h3>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">Complete OS for {ind.name?.toLowerCase()} management.</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
