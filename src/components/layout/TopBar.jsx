import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, RefreshCw, Globe, Layers, Bell } from "lucide-react";
import { OrbitIcon } from "@/components/ui/OrbitIcon";
import { Button } from "@/components/ui/button";
import { isSuperAdmin } from "@/lib/constants";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { base44 } from "@/api/base44Client";
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

  // Fetch Notifications
  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications', company?.id, user?.email],
    queryFn: async () => {
      if (!company?.id || !user?.email) return [];
      const res = await base44.entities.Notification.list({
        company_id: company.id,
        recipient_email: user.email
      });
      // Sort by newest first
      return res.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!company?.id && !!user?.email,
    refetchInterval: 60000 // poll every minute
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id) => {
    try {
      await base44.entities.Notification.update(id, { is_read: true });
      refetchNotifications();
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

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
    // Smooth reload of the layout on the current page
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
        {/* Industry Switcher (Super Admin or Pro/Enterprise) */}
        {(user?.role === 'super_admin' || ['professional', 'enterprise'].includes(company?.subscription_plan)) && (
          <div className="flex items-center gap-1.5 border border-amber-200 dark:border-amber-900 bg-amber-500/10 dark:bg-amber-950/20 px-2 py-1 rounded-md text-xs font-bold text-amber-700 dark:text-amber-400">
            <Layers className="w-3.5 h-3.5 animate-spin" />
            <select
              value={currentIndustry}
              onChange={e => handleIndustryChange(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-xs pr-4 cursor-pointer text-amber-700 dark:text-amber-400"
            >
              {Object.entries(INDUSTRIES)
                .filter(([key]) => key !== 'optalflow' || user?.role === 'super_admin')
                .map(([key, ind]) => (
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

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-card shadow-sm"></span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
            <DropdownMenuLabel className="font-bold flex justify-between items-center">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full">{unreadCount} New</span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              notifications.slice(0, 10).map((notif) => (
                <DropdownMenuItem key={notif.id} className="p-3 flex flex-col items-start gap-1 cursor-default focus:bg-muted/50">
                  <div className="flex justify-between w-full items-start">
                    <span className={`text-sm font-bold ${!notif.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {notif.title}
                    </span>
                    {!notif.is_read && (
                      <button 
                        onClick={(e) => { e.preventDefault(); markAsRead(notif.id); }}
                        className="text-[10px] font-medium text-blue-600 hover:text-blue-800"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                  <span className={`text-xs ${!notif.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {notif.message}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {new Date(notif.created_date).toLocaleDateString()}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

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
          <OrbitIcon className={`w-3.5 h-3.5 ${isAIOpen ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
          <span className="hidden sm:inline">Orbit</span>
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