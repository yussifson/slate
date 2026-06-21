import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useImpersonation } from "@/lib/ImpersonationContext";
import { supabase } from "@/api/supabaseClient";
import IntelligenceUI from "@/components/intelligence/IntelligenceUI";
import { Building2, Plus, ArrowRight, Activity, TrendingUp, Sparkles, Globe, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "react-hot-toast";

export default function EnterpriseDashboard() {
  const { user } = useAuth();
  const { startImpersonation } = useImpersonation();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const { error } = await supabase.from('companies').update({ industry_type: newIndustry }).eq('id', companyId);
      if (error) throw error;
      toast.success(`Workspace updated to ${newIndustry}!`);
      fetchPortfolio();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update workspace.");
    }
  };

  const totalModulesActive = portfolio.reduce((acc, curr) => acc + (curr.active_modules ? curr.active_modules.length : 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 school-page-enter font-dmsans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl school-heading font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Globe className="text-blue-500" />
            Enterprise Command Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your entire portfolio of businesses and verticals from a single unified view.
          </p>
        </div>
        <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-6 flex items-center gap-2">
          <Plus size={16} /> New Vertical
        </Button>
      </div>

      {/* High Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="school-card p-6 flex flex-col justify-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Portfolio Companies</p>
          <p className="text-4xl font-black text-slate-900 dark:text-white mt-2">{portfolio.length}</p>
        </div>
        <div className="school-card p-6 flex flex-col justify-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Active Verticals</p>
          <p className="text-4xl font-black text-slate-900 dark:text-white mt-2">{totalModulesActive}</p>
        </div>
        <div className="school-card p-6 flex flex-col justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-sm font-medium text-blue-100">Overall Portfolio Growth</p>
            <p className="text-4xl font-black mt-2">+24%</p>
          </div>
          <TrendingUp className="absolute right-0 bottom-0 text-white opacity-20 w-32 h-32 translate-x-4 translate-y-4" />
        </div>
      </div>

      {/* OrbitFlow Global Intelligence */}
      <div className="school-card border border-indigo-500/20 shadow-lg shadow-indigo-500/5 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-xl">
            <Sparkles className="text-indigo-400 w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-white font-bold tracking-tight">OrbitFlow Enterprise Intelligence</h2>
            <p className="text-indigo-200 text-xs">AI Agent connected to your entire multi-vertical portfolio</p>
          </div>
        </div>
        <div className="h-[400px] bg-slate-50 dark:bg-slate-900 relative">
          {/* Intelligence UI component */}
          <IntelligenceUI embedded={true} customPrompt="You are an Enterprise Portfolio Analyst. Summarize metrics across all my child companies." />
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8">Your Verticals</h2>
        {loading ? (
          <div className="text-slate-500 text-sm animate-pulse">Loading portfolio...</div>
        ) : portfolio.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center">
            <Building2 className="mx-auto text-slate-400 mb-3 w-10 h-10" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">No companies in your portfolio yet.</p>
            <Button variant="outline" className="mt-4 rounded-full">Deploy First Vertical</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.map((company, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={company.id} 
                onClick={() => startImpersonation(company)}
                className="school-card p-6 cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2">
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                      <Building2 className="text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs rounded-full bg-slate-100 dark:bg-slate-800 border-0 hover:bg-slate-200 dark:hover:bg-slate-700 uppercase tracking-widest text-slate-500 font-semibold px-3">
                          Workspace: {company.industry || 'core'} <ChevronDown className="ml-1 w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => changeWorkspace(e, company.id, 'law_firm')}>Law Firm</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => changeWorkspace(e, company.id, 'hospital')}>Hospital</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => changeWorkspace(e, company.id, 'school')}>School</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => changeWorkspace(e, company.id, 'university')}>University</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => changeWorkspace(e, company.id, 'vocational')}>Vocational</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => changeWorkspace(e, company.id, 'hotel')}>Hotel</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => changeWorkspace(e, company.id, 'hr')}>Human Resources</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => changeWorkspace(e, company.id, 'retail')}>Retail</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => changeWorkspace(e, company.id, 'logistics')}>Logistics</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => changeWorkspace(e, company.id, 'insurance')}>Insurance</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => changeWorkspace(e, company.id, 'religion')}>Religion / Church</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => changeWorkspace(e, company.id, 'marketing_agency')}>Marketing Agency</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => changeWorkspace(e, company.id, 'core')}>Core System</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
                  {company.name}
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  {company.subdomain}.optavel.com
                </p>

                <div className="flex items-center text-blue-600 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                  Manage Vertical <ArrowRight size={16} className="ml-1" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
