import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useImpersonation } from "@/lib/ImpersonationContext";
import { supabase } from "@/api/supabaseClient";
import { Building2, ChevronDown, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

export default function EnterprisePortfolioSwitcher() {
  const { user } = useAuth();
  const { startImpersonation, impersonatedCompany } = useImpersonation();
  const [portfolio, setPortfolio] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const fetchPortfolio = async () => {
      if (!user?.id || user?.role !== 'enterprise_admin') return;
      try {
        const { data, error } = await supabase.rpc('get_enterprise_portfolio', { admin_uid: user.id });
        if (!error && active) {
          setPortfolio(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch portfolio:", err);
      }
    };
    fetchPortfolio();
    return () => { active = false; };
  }, [user?.id, user?.role]);

  if (user?.role !== 'enterprise_admin' || !impersonatedCompany) {
    return null; // Only show if they are an enterprise admin currently impersonating a child vertical
  }

  return (
    <div className="px-4 py-2 mb-2 border-b border-slate-100 dark:border-slate-800">
      <DropdownMenu>
        <DropdownMenuTrigger className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors focus:outline-none">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
              <Building2 size={16} />
            </div>
            <div className="flex flex-col items-start truncate">
              <span className="text-xs text-slate-500 font-medium">Enterprise Portfolio</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {impersonatedCompany.name}
              </span>
            </div>
          </div>
          <ChevronDown size={16} className="text-slate-400 shrink-0 ml-2" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="start">
          <DropdownMenuLabel>Your Verticals</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {portfolio.map((company) => (
            <DropdownMenuItem 
              key={company.id}
              onClick={() => startImpersonation(company)}
              className={`flex items-center gap-2 cursor-pointer ${impersonatedCompany.id === company.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : ''}`}
            >
              <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
              <span className="truncate">{company.name}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => {
              // Clear impersonation and go back to command center
              // The stopImpersonation method usually redirects to /admin. We can just redirect to /enterprise-admin manually 
              // after stopping, but stopImpersonation forces a reload.
              navigate('/enterprise-admin');
            }}
            className="flex items-center gap-2 text-indigo-600 cursor-pointer focus:text-indigo-700"
          >
            <Globe size={16} />
            Command Center
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
