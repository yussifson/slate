import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, RefreshCw, Globe, PanelLeft, Sparkles, Layers, Component } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSuperAdmin } from "@/lib/constants";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";
import TimeTracker from "../shared/TimeTracker";
import { useCompany } from "@/hooks/useCompanyId";
import { INDUSTRIES } from "@/config/industries";
import ProfileAvatarDialog from "@/components/shared/ProfileAvatarDialog";
import { ORBIT_COMPONENTS_LIST } from "@/pages/admin/OrbitComponentTester";

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

const LANGUAGES = {
  en: { name: "English", flag: "🇬🇧" },
  es: { name: "Español", flag: "🇪🇸" },
  fr: { name: "Français", flag: "🇫🇷" },
  de: { name: "Deutsch", flag: "🇩🇪" },
  it: { name: "Italiano", flag: "🇮🇹" },
  pt: { name: "Português", flag: "🇵🇹" },
  nl: { name: "Nederlands", flag: "🇳🇱" },
  ru: { name: "Русский", flag: "🇷🇺" },
  zh: { name: "中文", flag: "🇨🇳" },
  ja: { name: "日本語", flag: "🇯🇵" },
  ko: { name: "한국어", flag: "🇰🇷" },
  ar: { name: "العربية", flag: "🇸🇦" },
  he: { name: "עברית", flag: "🇮🇱" },
  hi: { name: "हिन्दी", flag: "🇮🇳" },
  tr: { name: "Türkçe", flag: "🇹🇷" },
};

export default function TopBar({ user, isSidebarCollapsed, toggleSidebar, isAIOpen, toggleAI, isChatOpen, toggleChat }) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const { company } = useCompany();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => {
      setIsRefreshing(false);
      toast({ title: t('data_refreshed', "Data refreshed"), description: t('everything_up_to_date', "Everything is up to date.") });
    }, 500);
  };

  const handleIndustryChange = (newIndustry) => {
    if (!navigator.onLine) {
      toast({
        title: t('offline_mode', "Offline Mode"),
        description: t('cannot_switch_industry_offline', "Cannot switch industries while offline. Please reconnect."),
        variant: "destructive",
      });
      return;
    }
    sessionStorage.setItem('slate_industry_override', newIndustry);
    queryClient.clear();
    toast({
      title: t('industry_switched', "Industry Switched"),
      description: t('active_industry_changed', "Active industry changed"),
    });
    navigate('/');
    setTimeout(() => {
      window.location.href = '/';
    }, 50);
  };

  const pathKey = Object.keys(PAGE_TITLES).filter(k => k !== "/").find(k => location.pathname.startsWith(k)) || (location.pathname === "/" ? "/" : "/");
  const defaultTitle = PAGE_TITLES[pathKey] || "Dashboard";
  const title = t(defaultTitle.toLowerCase().replace(/\s+/g, '_'), defaultTitle);

  const nameStr = user?.full_name || user?.first_name || "User";
  const initials = nameStr.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const displayName = isSuperAdmin(user) ? t('super_admin', "Super Admin") : nameStr;

  const currentIndustry = sessionStorage.getItem('slate_industry_override') || company?.industry_type || 'law';

  const currentLang = LANGUAGES[i18n.language?.split('-')[0]] || LANGUAGES.en;

  return (
    <div className="h-12 border-b border-border bg-card sticky top-0 z-30 flex items-center pl-4 pr-5 lg:px-5 gap-3">
      {/* Sidebar Toggle & Breadcrumb */}
      {/* Sidebar Toggle & Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 text-sm flex-1 min-w-0">
        <button 
          onClick={toggleSidebar}
          className="hidden lg:flex p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title={isSidebarCollapsed ? t('expand_sidebar', "Expand sidebar") : t('collapse_sidebar', "Collapse sidebar")}
        >
          <PanelLeft className="w-5 h-5" />
        </button>
        <div className="h-4 w-px bg-border hidden lg:block mx-1"></div>
        <LayoutDashboard className="w-4 h-4 text-muted-foreground hidden sm:block shrink-0" />
        <span className="font-bold sm:font-medium text-foreground truncate max-w-[100px] sm:max-w-none text-base sm:text-sm">{title}</span>
      </div>
      {/* Right */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Super Admin Industry Switcher */}
        {user?.role === 'super_admin' && (
          <div className="hidden sm:flex items-center gap-1.5 border border-amber-200 dark:border-amber-900 bg-amber-500/10 dark:bg-amber-950/20 px-2 py-1 rounded-md text-xs font-bold text-amber-700 dark:text-amber-400">
            <Layers className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            <select
              value={currentIndustry}
              onChange={e => handleIndustryChange(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-xs pr-4 cursor-pointer text-amber-700 dark:text-amber-400"
            >
              {Object.entries(INDUSTRIES).map(([key, ind]) => {
                return (
                  <option key={key} value={key} className="bg-card text-foreground">
                    {ind.icon} {ind.name}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Super Admin Orbit Component Tester Switcher */}
        {user?.role === 'super_admin' && (
          <div className="hidden md:flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-900 bg-indigo-500/10 dark:bg-indigo-950/20 px-2 py-1 rounded-md text-xs font-bold text-indigo-700 dark:text-indigo-400">
            <Component className="w-3.5 h-3.5" />
            <select
              value=""
              onChange={e => { if (e.target.value) navigate(`/orbit-test/${e.target.value}`) }}
              className="bg-transparent border-none outline-none font-bold text-xs pr-2 cursor-pointer text-indigo-700 dark:text-indigo-400 max-w-[140px]"
            >
              <option value="" disabled>Orbit Build Components</option>
              {ORBIT_COMPONENTS_LIST.map(compName => (
                <option key={compName} value={compName} className="bg-card text-foreground">
                  {compName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Language Switcher */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-md px-2.5 py-1 hover:bg-muted/50 bg-card">
          <Globe className="w-3.5 h-3.5" />
          <select 
            value={i18n.language?.split('-')[0] || 'en'} 
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="bg-transparent border-none outline-none cursor-pointer focus:ring-0"
          >
            {Object.entries(LANGUAGES).map(([key, lang]) => {
              return (
                <option key={key} value={key} className="bg-card text-foreground">
                  {lang.name} {lang.flag}
                </option>
              );
            })}
          </select>
        </div>

        {/* Orbit AI Toggle */}
        <Button
          onClick={toggleAI}
          variant="ghost"
          size="icon"
          className={`relative overflow-hidden sm:w-auto sm:px-3 sm:py-1.5 text-xs font-bold rounded-lg border transition-all duration-300 ${
            isAIOpen
              ? "bg-gradient-to-r from-primary to-primary text-white border-primary shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-95"
              : "bg-card text-foreground border-border hover:border-slate-200 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/50 hover:text-primary hover:shadow-[0_0_10px_rgba(59,130,246,0.15)]"
          }`}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
          <Sparkles className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${isAIOpen ? "animate-spin text-white" : "text-primary"} sm:mr-1.5`} style={{ animationDuration: '3s' }} />
          <span className="hidden sm:inline">{t("orbit_ai", "Orbit AI")}</span>
          <span className="flex h-1.5 w-1.5 relative absolute sm:static right-1 top-1 sm:right-auto sm:top-auto">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/70 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
          </span>
        </Button>

        {/* Global Chat Toggle */}
        <Button
          onClick={toggleChat}
          variant="ghost"
          size="icon"
          className={`relative overflow-hidden sm:w-auto sm:px-3 sm:py-1.5 text-xs font-bold rounded-lg border transition-all duration-300 ${
            isChatOpen
              ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-95"
              : "bg-card text-foreground border-border hover:border-slate-200 hover:bg-slate-50 hover:text-primary dark:hover:bg-slate-100 hover:shadow-[0_0_10px_rgba(59,130,246,0.15)]"
          }`}
        >
          <span className="absolute inset-0 bg-slate-100 opacity-0 hover:opacity-100 transition-opacity duration-300" />
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${isChatOpen ? "text-white" : "text-primary"} sm:mr-1.5`}><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
          <span className="hidden sm:inline">Chat</span>
        </Button>

        {/* Global Time Tracker */}
        <div className="hidden sm:block">
          {currentIndustry === 'law' && <TimeTracker />}
        </div>

        {/* Premium Theme Toggle & Notifications */}
        <ThemeToggle />
        <NotificationBell user={user} />

        {/* User */}
        <button onClick={() => setShowAvatarDialog(true)} className="flex items-center gap-2 sm:ml-1 hover:bg-muted/50 p-1 rounded-lg transition-colors">
          <span className="hidden sm:block text-sm font-medium text-foreground">{displayName}</span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center shadow-sm hover:ring-2 hover:ring-primary transition-all overflow-hidden">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] sm:text-[11px] font-bold text-white">{initials}</span>
            )}
          </div>
        </button>

        {/* Refresh */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:block">{isRefreshing ? "Refreshing..." : "Refresh"}</span>
        </Button>
      </div>
      <ProfileAvatarDialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog} />
    </div>
  );
}