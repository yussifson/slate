import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { LayoutDashboard, RefreshCw, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSuperAdmin } from "@/lib/constants";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import ThemeToggle from "./ThemeToggle";

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

export default function TopBar({ user }) {
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
    <div className="h-12 border-b border-border bg-card sticky top-0 z-30 flex items-center pl-14 pr-5 lg:px-5 gap-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm flex-1">
        <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
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

        {/* Premium Theme Toggle */}
        <ThemeToggle />

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