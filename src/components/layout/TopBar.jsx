import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { LayoutDashboard, RefreshCw, Globe, PanelLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSuperAdmin } from "@/lib/constants";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";

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

export default function TopBar({ user, isSidebarCollapsed, toggleSidebar, isAIOpen, toggleAI }) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => {
      setIsRefreshing(false);
      toast({ title: "Data refreshed", description: "Everything is up to date." });
    }, 500);
  };
  const pathKey = Object.keys(PAGE_TITLES).filter(k => k !== "/").find(k => location.pathname.startsWith(k)) || (location.pathname === "/" ? "/" : "/");
  const title = PAGE_TITLES[pathKey] || "Dashboard";

  const nameStr = user?.full_name || user?.first_name || "User";
  const initials = nameStr.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const displayName = isSuperAdmin(user) ? "Super Admin" : nameStr;

  return (
    <div className="h-12 border-b border-border bg-card sticky top-0 z-30 flex items-center pl-4 pr-5 lg:px-5 gap-3">
      {/* Sidebar Toggle & Breadcrumb */}
      <div className="flex items-center gap-3 text-sm flex-1">
        <button 
          onClick={toggleSidebar}
          className="hidden lg:flex p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeft className="w-5 h-5" />
        </button>
        <div className="h-4 w-px bg-border hidden lg:block mx-1"></div>
        <LayoutDashboard className="w-4 h-4 text-muted-foreground hidden sm:block" />
        <span className="font-medium text-foreground">{title}</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Language */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-md px-2.5 py-1.5 hover:bg-muted/50 cursor-default bg-card">
          <Globe className="w-3.5 h-3.5" />
          <span>English</span>
          <span>🇬🇧</span>
        </div>

        {/* Orbit AI Toggle */}
        <Button
          onClick={toggleAI}
          variant="ghost"
          size="sm"
          className={`relative overflow-hidden gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all duration-300 ${
            isAIOpen
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-95"
              : "bg-card text-foreground border-border hover:border-blue-500/50 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-950/20 dark:hover:to-indigo-950/20 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-[0_0_10px_rgba(59,130,246,0.15)]"
          }`}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
          <Sparkles className={`w-3.5 h-3.5 ${isAIOpen ? "animate-spin text-white" : "text-blue-500"}`} style={{ animationDuration: '3s' }} />
          <span>Orbit AI</span>
          <span className="flex h-1.5 w-1.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
          </span>
        </Button>

        {/* Premium Theme Toggle & Notifications */}
        <ThemeToggle />
        <NotificationBell user={user} />

        {/* User */}
        <div className="flex items-center gap-2 ml-1">
          <span className="hidden sm:block text-sm font-medium text-foreground">{displayName}</span>
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-sm">
            <span className="text-[11px] font-bold text-white">{initials}</span>
          </div>
        </div>

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