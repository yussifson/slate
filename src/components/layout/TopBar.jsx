import { OrbitLoader } from '@/components/ui/orbit-loader';
import React, { useState} from "react";
import { useLocation, useNavigate} from "react-router-dom";
import { useTranslation} from "react-i18next";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { LayoutDashboard, LayoutGrid, RefreshCw, Globe, PanelLeft, Sparkles, Layers, Component, ChevronDown, MoreHorizontal, Search, LifeBuoy, MessageSquare } from "lucide-react";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button} from "@/components/ui/button";
import { getSubdomainAndBase, isDesktopApp } from '@/lib/domainUtils';
import { isSuperAdmin} from "@/lib/constants";
import { useQueryClient} from "@tanstack/react-query";
import { useToast} from "@/components/ui/use-toast";
import ThemeToggle from "./ThemeToggle";
import UnivNotificationCenter from "@/components/universal/UnivNotificationCenter";
import AppLauncher from "./AppLauncher";

import { useCompany} from "@/hooks/useCompanyId";
import { INDUSTRIES} from "@/config/industries";
import ProfileAvatarDialog from "@/components/shared/ProfileAvatarDialog";
import { ORBIT_COMPONENTS_LIST} from "@/pages/admin/OrbitComponentTester";
import { powerSync} from "@/api/PowerSyncConnector";
import { cn } from "@/lib/utils";

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
 "/client-portal": "Client Portal"};

export default function TopBar({ user, isSidebarCollapsed, toggleSidebar, isAIOpen, toggleAI, isChatOpen, toggleChat, isBoltOpen, toggleBolt}) {
 const { t, i18n} = useTranslation();
 const location = useLocation();
 const navigate = useNavigate();
 const queryClient = useQueryClient();
 const { toast} = useToast();
 const [isRefreshing, setIsRefreshing] = useState(false);
 const [showAvatarDialog, setShowAvatarDialog] = useState(false);
 const { company} = useCompany();

 const handleRefresh = async () => {
 setIsRefreshing(true);
 await queryClient.invalidateQueries();
 setTimeout(() => {
 setIsRefreshing(false);
 toast({ title: t('data_refreshed', "Data refreshed"), description: t('everything_up_to_date', "Everything is up to date.")});
}, 500);
};

 const handleIndustryChange = (newIndustry) => {
 if (!navigator.onLine) {
 toast({
 title: t('offline_mode', "Offline Mode"),
 description: t('cannot_switch_industry_offline', "Cannot switch industries while offline. Please reconnect."),
 variant: "destructive"});
 return;
}
 sessionStorage.setItem('slate_industry_override', newIndustry);
 queryClient.clear();
 toast({
 title: t('industry_switched', "Industry Switched"),
 description: t('active_industry_changed', "Active industry changed")});
 navigate('/');
 setTimeout(() => {
 window.location.reload();
}, 100);
};

 const handleSwitchWorkspace = async (targetCompanyId) => {
 if (!targetCompanyId || targetCompanyId === user?.company_id) return;
 try {
 const keys = Object.keys({ company_id: targetCompanyId});
 const values = Object.values({ company_id: targetCompanyId}).map(v => typeof v === 'object' ? JSON.stringify(v) : v);
 const setClause = keys.map(k => `${k} = ?`).join(', ');
 await powerSync.execute(`UPDATE ${'profiles'.replace(/['"`]/g, '')} SET ${setClause} WHERE id = ?`, [...values, user.id]);
 const error = null;
 if (error) throw error;
 
 const targetCompany = user?.available_companies?.find(c => c.id === targetCompanyId);
 toast({ title: t('switching_workspace', "Switching Workspace..."), description: targetCompany?.name || "Loading..."});
 
  const isNativeApp = isDesktopApp();
  if (targetCompany?.subdomain && !isNativeApp) {
    let targetBase = window.location.hostname.split('.').slice(-2).join('.');
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      targetBase = window.location.hostname;
    }
    const port = window.location.port ? `:${window.location.port}` : '';
    const targetHost = `${targetCompany.subdomain}.${targetBase}${port}`;
    window.location.href = `${window.location.protocol}//${targetHost}/`;
  } else {
    navigate('/');
    // Optional reload to reset application state
    setTimeout(() => window.location.reload(), 100);
  }
} catch (e) {
 console.error(e);
 toast({ title: "Error", description: "Failed to switch workspace.", variant: "destructive"});
}
};

 const pathKey = Object.keys(PAGE_TITLES).filter(k => k !== "/").find(k => location.pathname.startsWith(k)) || (location.pathname === "/" ? "/" : "/");
 const defaultTitle = PAGE_TITLES[pathKey] || "Dashboard";
 const title = t(defaultTitle.toLowerCase().replace(/\s+/g, '_'), defaultTitle);

 const nameStr = user?.full_name || user?.first_name || "User";
 const initials = nameStr.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
 const displayName = isSuperAdmin(user) ? t('super_admin', "Super Admin") : nameStr;

 const currentIndustry = sessionStorage.getItem('slate_industry_override') || company?.industry_type || 'law';

 const isPanelOpen = isAIOpen || isBoltOpen;

 const renderSecondaryOptions = (inPopover = false) => (
    <div className={`flex items-center ${inPopover ? 'flex-wrap gap-3' : 'gap-2 sm:gap-2'}`}>
      {/* Workspace Switcher */}
      {user?.available_companies?.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger className={`hidden sm:flex items-center gap-1.5 text-xs font-medium text-foreground border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-lg px-2 py-1.5 hover:bg-muted/50 bg-card tracking-[0.02em] transition-colors focus:outline-none shadow-sm ${inPopover ? '!flex' : ''}`}>
            <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="max-w-[80px] truncate">{user.available_companies.find(c => c.id === user.company_id)?.name || "Workspace"}</span>
            <ChevronDown className="w-3 h-3 opacity-50 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            {user.available_companies.map(comp => (
              <DropdownMenuItem key={comp.id} onClick={() => handleSwitchWorkspace(comp.id)}>
                {comp.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Language Switcher */}
      <LanguageSwitcher className={`hidden lg:flex items-center gap-1.5 text-xs font-medium text-[#71717a] dark:text-gray-400 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-lg px-2 py-1.5 hover:bg-muted/50 bg-card tracking-[0.02em] transition-colors focus:outline-none shadow-sm ${inPopover ? '!flex' : ''} h-[28px] max-w-[110px]`} />





      {/* Support & Premium Theme Toggle & Notifications */}
      <Button
        variant="ghost"
        size="sm"
        className={`hidden lg:flex items-center gap-1.5 text-xs font-medium text-foreground border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-lg px-2 py-1.5 hover:bg-muted/50 bg-card tracking-[0.02em] transition-colors focus:outline-none shadow-sm h-[28px] ${inPopover ? '!flex' : ''}`}
        onClick={() => window.open('mailto:support@optavel.com', '_blank')}
      >
        <LifeBuoy className="w-3.5 h-3.5 text-primary" />
        <span>Support</span>
      </Button>
      <AppLauncher />
      <ThemeToggle />
      <UnivNotificationCenter />

      {/* Refresh */}
      <Button
        variant="ghost"
        size="sm"
        className={`hidden md:flex gap-2.5 text-xs text-[#71717a] dark:text-gray-400 hover:text-foreground tracking-[0.04em] ${inPopover ? '!flex' : ''}`}
        onClick={handleRefresh}
        disabled={isRefreshing}
      >
        {isRefreshing ? <OrbitLoader size="sm" /> : <RefreshCw className="w-4 h-4" />}
        <span className="hidden sm:block">Refresh</span>
      </Button>
    </div>
  );

  return (
  <>
  {/* ── NATIVE MOBILE TOP BAR ── */}
  <div className="md:hidden relative w-full bg-white/80 dark:bg-card/80 backdrop-blur-2xl border-b border-black/5 dark:border-white/5 pt-[env(safe-area-inset-top)] shadow-sm z-[60]">
 <div className="flex items-center justify-between px-4 h-[44px]">
 {/* Left: Avatar */}
 <button onClick={() => setShowAvatarDialog(true)} className="relative w-[30px] h-[30px] rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-center overflow-hidden active:scale-95 transition-transform">
 {user?.avatar_url ? (
 <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
 ) : (
 <span className="text-[11px] font-semibold text-primary">{initials}</span>
 )}
 </button>

 {/* Center: Page Title / Logo */}
 <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none">
 {location.pathname === '/' ? (
   <>
    <div className="w-[18px] h-[18px] bg-primary rounded-[5px] flex items-center justify-center">
      <div className="w-2 h-2 bg-white rounded-sm transform rotate-45" />
    </div>
    <span className="font-semibold text-[17px] tracking-[-0.41px] text-black dark:text-white">Slate</span>
   </>
 ) : (
   <span className="font-semibold text-[17px] tracking-[-0.41px] text-black dark:text-white truncate max-w-[150px]">{title}</span>
 )}
 </div>

 {/* Right: AI & Notifications */}
 <div className="flex items-center gap-1">
 <AppLauncher />
 <button onClick={toggleChat} className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors active:scale-95", isChatOpen ? "bg-primary/10 text-primary" : "text-[#8E8E93]")}>
 <MessageSquare className="w-[18px] h-[18px]" strokeWidth={2.5} />
 </button>
 <button onClick={toggleAI} className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors active:scale-95", isAIOpen ? "bg-primary/10 text-primary" : "text-[#8E8E93]")}>
 <Sparkles className="w-[18px] h-[18px]" strokeWidth={2.5} />
 </button>
 <div className="scale-90 origin-right">
                <UnivNotificationCenter />
              </div>
 </div>
 </div>
 </div>

 {/* ── DESKTOP TOP BAR ── */}
 <div className="hidden md:flex h-12 border-t-[3px] border-t-primary border-b border-primary/40 bg-background/80 backdrop-blur-xl relative z-30 items-center pl-4 pr-5 lg:px-5 gap-3 shrink-0 w-full overflow-x-auto scrollbar-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {/* Sidebar Toggle & Breadcrumb */}
 <div className="flex items-center gap-2 sm:gap-3 text-sm shrink-0 mr-4">
 <button 
 onClick={toggleSidebar}
 className="hidden lg:flex p-1.5 rounded-lg hover:bg-muted text-[#71717a] dark:text-gray-400 hover:text-foreground transition-colors"
 title={isSidebarCollapsed ? t('expand_sidebar', "Expand sidebar") : t('collapse_sidebar', "Collapse sidebar")}
 >
 <PanelLeft className="w-5 h-5" />
 </button>
 </div>
 {/* Right */}
 <div className="flex items-center justify-end gap-2 sm:gap-2 ml-auto">
 {/* Super Admin Industry Switcher */}
 {user?.role === 'super_admin' && (
 <DropdownMenu>
 <DropdownMenuTrigger className="hidden sm:flex items-center gap-1.5 border-[0.5px] border-black/9 dark:border-white/8 border-amber-200 dark:border-amber-900 bg-amber-500/10 dark:bg-amber-950/20 px-2 py-1.5 rounded-lg text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors focus:outline-none">
 <Layers className="w-3.5 h-3.5 animate-spin shrink-0" style={{ animationDuration: '6s'}} />
 <span className="max-w-[80px] truncate tracking-[0.02em]">{INDUSTRIES[currentIndustry]?.name || currentIndustry}</span>
 <ChevronDown className="w-3 h-3 opacity-50 shrink-0" />
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-72 max-h-[60vh] overflow-y-auto">
 <div className="p-2 space-y-1">
 {Object.entries(INDUSTRIES).map(([key, ind]) => (
 <DropdownMenuItem key={key} onClick={() => handleIndustryChange(key)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
 <span className="text-lg shrink-0">{ind.icon}</span>
 <span className="text-sm font-medium">{ind.name}</span>
 </DropdownMenuItem>
 ))}
 </div>
 </DropdownMenuContent>
 </DropdownMenu>
 )}

 {/* Super Admin Orbit Component Tester Switcher */}
 {user?.role === 'super_admin' && (
 <DropdownMenu>
 <DropdownMenuTrigger className="hidden lg:flex items-center gap-1.5 border-[0.5px] border-black/9 dark:border-white/8 border-indigo-200 dark:border-indigo-900 bg-indigo-500/10 dark:bg-indigo-950/20 px-2 py-1.5 rounded-lg text-xs font-medium text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors focus:outline-none shadow-sm">
 <Component className="w-3.5 h-3.5 shrink-0" />
 <span className="max-w-[80px] truncate tracking-[0.02em]">Orbit Build</span>
 <ChevronDown className="w-3 h-3 opacity-50 shrink-0" />
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-96 max-h-[70vh] overflow-y-auto">
 <div className="grid grid-cols-2 gap-1 p-2">
 {ORBIT_COMPONENTS_LIST.map(compName => (
 <DropdownMenuItem key={compName} onClick={() => navigate(`/orbit-test/${compName}`)} className="col-span-1 px-3 py-2 rounded-lg hover:bg-indigo-500/10 cursor-pointer transition-colors text-sm font-medium text-foreground">
 {compName}
 </DropdownMenuItem>
 ))}
 </div>
 </DropdownMenuContent>
 </DropdownMenu>
 )}

 {/* Spotlight Search Toggle */}
 <Button
  onClick={() => window.dispatchEvent(new CustomEvent('open-spotlight'))}
  variant="ghost"
  size="icon"
  className="shrink-0 group relative overflow-hidden w-8 h-8 flex items-center justify-center rounded-xl border-[0.5px] border-black/9 dark:border-white/8 transition-all duration-300 bg-card text-foreground border-primary/40 hover:border-primary/40 hover:bg-slate-50 hover:text-primary dark:hover:bg-slate-100 shadow-sm"
  title="Spotlight Search (⌘K)"
 >
  <LayoutGrid className="w-4 h-4 text-[#71717a] dark:text-gray-400 group-hover:text-primary transition-colors" />
 </Button>

 {/* Orbit Bolt Toggle */}
 {!['client', 'patient', 'guest', 'parent', 'student', 'learner', 'trainee', 'customer', 'policyholder', 'member', 'tenant', 'landlord', 'employee'].includes(user?.role?.toLowerCase()) && (
 <Button
 onClick={toggleBolt}
 variant="ghost"
 size="icon"
 className={`shrink-0 sm:ml-1 relative overflow-hidden sm:w-auto sm:px-3 sm:py-1.5 text-xs font-semibold rounded-xl border-[0.5px] border-black/9 dark:border-white/8 transition-all duration-300 ${
 isBoltOpen
 ? "bg-gradient-to-r from-primary/80 to-primary text-white border-primary -[0_0_15px_rgba(var(--primary),0.5)] scale-95"
 : "bg-card text-foreground border-primary/40 hover:border-primary/50 hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/10 hover:text-primary -[0_0_10px_rgba(var(--primary),0.15)]"
}`}
 >
 <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${isBoltOpen ? "text-white fill-current" : "text-primary fill-current"} sm:mr-1.5`}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  <span className="hidden sm:inline">{t("orbit_build", "Orbit Build")}</span>
  </Button>
 )}

 {/* Orbit Flow Toggle */}
 <Button
 onClick={toggleChat}
 variant="ghost"
 size="icon"
 className={`shrink-0 relative overflow-hidden sm:w-auto sm:px-3 sm:py-1.5 text-xs font-semibold rounded-xl border-[0.5px] border-black/9 dark:border-white/8 transition-all duration-300 ${
 isChatOpen
 ? "bg-gradient-to-r from-primary to-primary text-white border-primary -[0_0_15px_rgba(var(--primary),0.5)] scale-95"
 : "bg-card text-foreground border-primary/40 hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/10 hover:text-primary -[0_0_10px_rgba(var(--primary),0.15)]"
 }`}
 >
 <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
 <MessageSquare className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${isChatOpen ? "text-white" : "text-primary"} sm:mr-1.5`} />
 <span className="hidden sm:inline">{t("orbit_flow", "Orbit Flow")}</span>
 </Button>

 {/* Orbit AI Toggle */}
 <Button
 onClick={toggleAI}
 variant="ghost"
 size="icon"
 className={`shrink-0 relative overflow-hidden sm:w-auto sm:px-3 sm:py-1.5 text-xs font-semibold rounded-xl border-[0.5px] border-black/9 dark:border-white/8 transition-all duration-300 ${
 isAIOpen
 ? "bg-gradient-to-r from-primary to-primary text-white border-primary -[0_0_15px_rgba(59,130,246,0.5)] scale-95"
 : "bg-card text-foreground border-primary/40 hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/50 hover:text-primary -[0_0_10px_rgba(59,130,246,0.15)]"
}`}
 >
 <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
 <Sparkles className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${isAIOpen ? "animate-spin text-white" : "text-primary"} sm:mr-1.5`} style={{ animationDuration: '3s'}} />
 <span className="hidden sm:inline">{t("orbit_ai", "Orbit AI")}</span>
 <span className="flex h-1.5 w-1.5 relative absolute sm:static right-1 top-1 sm:right-auto sm:top-auto">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/70 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
 </span>
 </Button>

 {/* Secondary Options OR Popover */}
 {isPanelOpen ? (
 <Popover>
 <PopoverTrigger asChild>
 <Button variant="ghost" size="icon" className="w-8 h-8 rounded-xl bg-card border-[0.5px] border-black/9 dark:border-white/8">
 <MoreHorizontal className="w-4 h-4 text-[#71717a] dark:text-gray-400" />
 </Button>
 </PopoverTrigger>
 <PopoverContent align="end" className="w-[300px] p-3 shadow-xl border-slate-200 dark:border-slate-800 rounded-2xl z-[150]">
 <div className="mb-2 px-1">
 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Actions</p>
 </div>
 {renderSecondaryOptions(true)}
 </PopoverContent>
 </Popover>
 ) : (
 renderSecondaryOptions(false)
 )}

 {/* User */}
 <button onClick={() => setShowAvatarDialog(true)} className="flex items-center gap-2 sm:ml-1 hover:bg-muted/50 p-1 rounded-xl transition-colors">
 <span className="hidden sm:block text-sm font-medium text-foreground">{displayName}</span>
 <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center hover:ring-2 hover:ring-primary transition-all overflow-hidden border border-black/10 dark:border-white/10">
 {user?.avatar_url ? (
 <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
 ) : (
 <span className="text-[10px] sm:text-[11px] font-semibold text-white">{initials}</span>
 )}
 </div>
 </button>
 </div>
 </div>
 <ProfileAvatarDialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog} />
 </>
 );
}
