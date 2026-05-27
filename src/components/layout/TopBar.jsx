import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, RefreshCw, Globe, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSuperAdmin } from "@/lib/constants";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import ThemeToggle from "./ThemeToggle";
import { useCompany } from "@/hooks/useCompanyId";
import { INDUSTRIES } from "@/config/industries";

const PAGE_TITLES = {
  "/": "Dashboard",
  "/cases": "Cases",
  "/clients": "Clients",
  "/calendar": "Calendar",
  "/invoices": "Invoices",
  "/tasks": "Tasks",
  "/documents": "Documents",
  "/team": "Team",
  "/companies": "Companies",
  "/subscriptions": "Subscriptions",
  "/settings": "Settings",
  "/client-portal": "Client Portal",
};

export default function TopBar({ user, isAIOpen, toggleAI }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { company } = useCompany();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => {
      setIsRefreshing(false);
      toast({ title: "Data refreshed", description: "Everything is up to date." });
    }, 500);
  };

  const handleIndustryChange = (newIndustry) => {
    sessionStorage.setItem('optalflow_industry_override', newIndustry);
    queryClient.invalidateQueries();
    toast({
      title: "Industry Switched",
      description: `Active industry changed to ${INDUSTRIES[newIndustry]?.name || newIndustry}.`,
    });
    // Navigate back to dashboard to prevent route mismatch on specific pages
    navigate('/');
    // Smooth reload of the layout
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const pathKey = Object.keys(PAGE_TITLES).filter(k => k !== "/").find(k => location.pathname.startsWith(k)) || (location.pathname === "/" ? "/" : "/");
  const title = PAGE_TITLES[pathKey] || "Dashboard";

  const nameStr = user?.full_name || user?.first_name || "User";
  const initials = nameStr.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const displayName = isSuperAdmin(user) ? "Super Admin" : nameStr;

  const currentIndustry = company?.industry_type || 'law';

  return (
    <div className="h-12 border-b-2 border-primary/80 bg-card sticky top-0 z-30 flex items-center pl-14 pr-5 lg:px-5 gap-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm flex-1">
        <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium text-foreground">{title}</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Super Admin Industry Switcher */}
        {user?.role === 'super_admin' && (
          <div className="flex items-center gap-1.5 border border-amber-200 dark:border-amber-900 bg-amber-500/10 dark:bg-amber-950/20 px-2 py-1 rounded-md text-xs font-bold text-amber-700 dark:text-amber-400">
            <Layers className="w-3.5 h-3.5 animate-spin" />
            <select
              value={currentIndustry}
              onChange={e => handleIndustryChange(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-xs pr-4 cursor-pointer text-amber-700 dark:text-amber-400"
            >
              {Object.entries(INDUSTRIES).map(([key, ind]) => (
                <option key={key} value={key} className="bg-card text-foreground">
                  {ind.icon} {ind.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Language */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-md px-2.5 py-1.5 hover:bg-muted/50 cursor-default bg-card">
          <Globe className="w-3.5 h-3.5" />
          <span>English</span>
          <span>🇬🇧</span>
        </div>

        {/* Premium Theme Toggle */}
        <ThemeToggle />

        {/* User */}
        <div className="flex items-center gap-2 ml-1">
          <span className="hidden sm:block text-sm font-medium text-foreground">{displayName}</span>
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-sm">
            <span className="text-[11px] font-bold text-white">{initials}</span>
          </div>
        </div>

        {/* AI Toggle */}
        <Button
          variant="outline"
          size="sm"
          className={`gap-1.5 text-xs h-8 ${isAIOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-400' : 'text-muted-foreground'}`}
          onClick={toggleAI}
        >
          <Sparkles className={`w-3.5 h-3.5 ${isAIOpen ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
          <span className="hidden sm:block">Ask AI</span>
        </Button>

        {/* Refresh */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:block">{isRefreshing ? "Refreshing..." : "Refresh"}</span>
        </Button>
      </div>
    </div>
  );
}