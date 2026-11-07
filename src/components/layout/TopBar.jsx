import { OrbitLoader } from '@/components/ui/orbit-loader';
import React, { useState} from "react";
import { useLocation, useNavigate} from "react-router-dom";
import { useTranslation} from "react-i18next";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { LayoutDashboard, LayoutGrid, RefreshCw, Globe, PanelLeft, Sparkles, Layers, Component, ChevronDown, MoreHorizontal, Search, LifeBuoy, MessageSquare, CheckCircle2 } from "lucide-react";
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
 "/documents": "Smart Docs",
 "/smart-docs": "Smart Docs",
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

 const [currentVersion, setCurrentVersion] = useState(() => {
   return sessionStorage.getItem('slate_version_override') || localStorage.getItem('slate_version_override') || 'v1';
 });

 const handleRefresh = async () => {
 setIsRefreshing(true);
 await queryClient.invalidateQueries();
 setTimeout(() => {
 setIsRefreshing(false);
 toast({ title: t('data_refreshed', "Data refreshed"), description: t('everything_up_to_date', "Everything is up to date.")});
}, 500);
};

  const handleVersionChange = (newVersion) => {
    sessionStorage.setItem('slate_version_override', newVersion);
    localStorage.setItem('slate_version_override', newVersion);
    setCurrentVersion(newVersion);
    window.dispatchEvent(new CustomEvent('slate_version_change', { detail: { version: newVersion } }));
    toast({
      title: newVersion === 'v2' ? "Slate V2 OmniCore Activated" : "Slate V1 Classic Activated",
      description: newVersion === 'v2' ? "Universal Adaptive Dashboard active across all verticals" : "Classic standard dashboard interface active"
    });
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
    window.dispatchEvent(new CustomEvent('slate_industry_change', { detail: { industry: newIndustry } }));
    queryClient.clear();
    toast({
      title: t('industry_switched', "Industry Switched"),
      description: t('active_industry_changed', "Active industry changed to " + newIndustry)});
    // Route or stay on dashboard
    if (user?.role === 'super_admin') {
      if (location.pathname === '/' || location.pathname === '/v2/dashboard' || location.pathname === '/omnicore/dashboard') {
        // stay on dashboard so preview is instant
      } else {
        navigate('/admin');
      }
    } else {
      navigate('/');
    }
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
    <div className={`flex items-center ${inPopover ? 'flex-wrap gap-3' : 'gap-1.5 sm:gap-2.5'}`}>
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





      {/* Theme Toggle & Notifications */}
      <ThemeToggle />
      <UnivNotificationCenter />
    </div>
  );

  const activeCompanyName = company?.name || user?.company_name || user?.available_companies?.find(c => c.id === user?.company_id)?.name || "Slate";

  return (
  <>
  {/* ── NATIVE MOBILE TOP BAR ── */}
  <div className="md:hidden sticky top-0 left-0 right-0 w-full bg-[#005A9C] dark:bg-[#0B1418] border-b border-white/10 text-white pt-[env(safe-area-inset-top)] shadow-md z-[60]">
    <div className="flex items-center justify-between px-3 h-[52px] gap-2.5">
      {/* Left: User Profile Avatar */}
      <button 
        onClick={() => navigate('/personal-info')} 
        className="relative w-[34px] h-[34px] shrink-0 rounded-full bg-white/15 border border-white/20 flex items-center justify-center overflow-hidden active:scale-95 transition-transform" 
        aria-label="Open profile"
      >
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[12px] font-bold text-white">{initials}</span>
        )}
      </button>

      {/* Center: Search Bar (Working with instant focus and spotlight) */}
      <div className="flex-1 min-w-0 max-w-[280px]">
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('open-spotlight'));
            navigate('/search');
          }}
          className="w-full h-[36px] px-3 rounded-full bg-white/15 hover:bg-white/20 border border-white/15 flex items-center gap-2 text-white/80 transition-all active:scale-[0.98]"
          aria-label="Search"
        >
          <Search className="w-4 h-4 text-white/80 shrink-0" strokeWidth={2.2} />
          <span className="text-xs font-normal text-white/80 truncate">
            {t('search_placeholder', 'Search people, docs, tasks...')}
          </span>
        </button>
      </div>

      {/* Right: Notifications Icon */}
      <div className="shrink-0 flex items-center justify-center text-white">
        <UnivNotificationCenter />
      </div>
    </div>
  </div>

  {/* ── DESKTOP TOP BAR ── */}
 <div className="hidden md:flex h-[64px] bg-[#005A9C] dark:bg-[#0B1418]/95 border-b border-white/10 dark:border-white/5 text-white backdrop-blur-xl relative z-30 items-center pl-4 pr-5 lg:px-5 gap-3 shrink-0 w-full overflow-x-auto scrollbar-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {/* Breadcrumb space reserved for the sidebar rail */}
 <div className="flex items-center gap-2 shrink-0">
    <span className="font-bold text-sm tracking-tight text-white/90 capitalize">{title || 'Overview'}</span>
  </div>
 {/* Right */}
 <div className="flex items-center justify-end gap-1.5 sm:gap-3 ml-auto">
 {/* Super Admin Version Switcher (V1 Classic vs V2 OmniCore) */}
 {user?.role === 'super_admin' && (
 <DropdownMenu>
 <DropdownMenuTrigger className="hidden sm:flex items-center gap-1.5 border-[0.5px] border-black/9 dark:border-white/8 border-emerald-300 dark:border-emerald-800 bg-emerald-500/10 dark:bg-emerald-950/20 px-2 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors focus:outline-none shadow-sm">
 <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
 <span className="tracking-[0.02em]">{currentVersion === 'v2' ? 'Slate V2 OmniCore' : 'Slate V1 Classic'}</span>
 <ChevronDown className="w-3 h-3 opacity-50 shrink-0" />
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-60 p-1.5 shadow-xl rounded-xl">
 <DropdownMenuItem
   onClick={() => handleVersionChange('v1')}
   className={cn("flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors", currentVersion !== 'v2' && "bg-muted font-bold")}
 >
   <div className="flex flex-col">
     <span className="text-xs font-bold text-foreground">Slate V1 Classic</span>
     <span className="text-[11px] text-muted-foreground">Original standard interface</span>
   </div>
   {currentVersion !== 'v2' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
 </DropdownMenuItem>
 <DropdownMenuItem
   onClick={() => handleVersionChange('v2')}
   className={cn("flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors", currentVersion === 'v2' && "bg-muted font-bold")}
 >
   <div className="flex flex-col">
     <span className="text-xs font-bold text-foreground">Slate V2 OmniCore</span>
     <span className="text-[11px] text-muted-foreground">Universal Adaptive Engine</span>
   </div>
   {currentVersion === 'v2' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 )}
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

 {/* Clippad Full Capsule Search Bar */}
        <div className="hidden md:block w-full max-w-sm rounded-full p-[1px] bg-white/20 hover:bg-white/30 transition-all cursor-text group">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-spotlight'))}
            className="flex items-center h-9 w-full bg-[#00477D] dark:bg-[#101D22] rounded-full px-3.5 text-white/70 hover:text-white transition-colors"
            title="Search across people, docs, tasks... (⌘K)"
          >
            <Search className="w-4 h-4 shrink-0 text-white/60 group-hover:text-white" />
            <div className="w-[1px] h-4 bg-white/20 mx-2.5 shrink-0" />
            <span className="text-xs font-medium flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis text-white/60 group-hover:text-white/80">
              Search people, docs, tasks...
            </span>
            <kbd className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/60 border border-white/15 shrink-0 hidden lg:block font-bold">⌘K</kbd>
          </button>
        </div>

 {/* Secondary Options OR Popover */}
 {isPanelOpen ? (
 <Popover>
 <PopoverTrigger asChild>
 <Button variant="ghost" size="icon" className="w-8 h-8 rounded-xl bg-card border-[0.5px] border-black/9 dark:border-white/8">
 <MoreHorizontal className="w-4 h-4 text-[#71717a] dark:text-gray-400" />
 </Button>
 </PopoverTrigger>
 <PopoverContent align="end" className="w-[300px] p-3 shadow-xl border-slate-200 dark:border-border rounded-2xl z-[150]">
 <div className="mb-2 px-1">
 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Actions</p>
 </div>
 {renderSecondaryOptions(true)}
 </PopoverContent>
 </Popover>
 ) : (
   <>
     {renderSecondaryOptions(false)}
     <div className="hidden sm:block w-[1px] h-5 bg-black/10 dark:bg-white/10 mx-0.5" />
   </>
 )}

 {/* User */}
 <button onClick={() => navigate('/personal-info')} aria-label="Open profile" title="Open profile" className="flex items-center gap-2 sm:ml-1 hover:bg-muted/50 p-1 rounded-xl transition-colors">
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
