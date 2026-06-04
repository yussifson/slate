import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileBottomNav from "./MobileBottomNav";
import { useAuth } from "@/lib/AuthContext";
import { useImpersonation } from "@/lib/ImpersonationContext";
import { Building2, X, Clock, CreditCard, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Paywall from "@/pages/Paywall";
import AiAssistant from "@/components/AiAssistant";
import GlobalChatPanel from "@/components/chat/GlobalChatPanel";
import SpotlightSearch from "./SpotlightSearch";
import GlobalVideoOverlay from "@/components/video/GlobalVideoOverlay";

export default function AppLayout() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { impersonatedCompany, stopImpersonation } = useImpersonation();
  const navigate = useNavigate();
  const [hideTrialBanner, setHideTrialBanner] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hideOfflineBanner, setHideOfflineBanner] = useState(false);

  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPrefsLoaded, setIsPrefsLoaded] = useState(false);
  const [orbitContext, setOrbitContext] = useState(null);
  const [uiPrefsId, setUiPrefsId] = useState(null);

  useEffect(() => {
    if (!user?.email || !user?.company_id || isPrefsLoaded) return;
    
    // Fetch UI prefs
    const fetchPrefs = async () => {
      try {
        const { supabase } = await import("@/api/supabaseClient");
        const { data } = await supabase
          .from('industry_records')
          .select('id, data')
          .eq('company_id', user.company_id)
          .eq('record_type', 'ui_prefs')
          .eq('search_text', user.email)
          .maybeSingle();

        if (data) {
          setUiPrefsId(data.id);
          if (data.data) {
            setIsAIOpen(!!data.data.isAIOpen);
          }
        }
      } catch (e) {
        console.error("Failed to fetch UI prefs", e);
      } finally {
        setIsPrefsLoaded(true);
      }
    };
    fetchPrefs();
  }, [user, isPrefsLoaded]);

  // Dynamic Industry Theming
  useEffect(() => {
    const activeIndustry = impersonatedCompany?.industry_type || user?.company_industry;
    if (activeIndustry) {
      const industry = activeIndustry.toLowerCase();
      let primaryColor = '221 83% 53%'; // Default Blue (Law/Core)
      if (industry === 'school' || industry === 'highschool') {
        primaryColor = '213 89% 50%'; // Google Blue (#1A73E8)
        document.body.classList.add('theme-school');
      } else {
        document.body.classList.remove('theme-school');
        if (industry === 'retail') {
          primaryColor = '24 98% 50%'; // Sunset Orange
        } else if (industry === 'hotel') {
          primaryColor = '251 52% 40%'; // Deep Violet/Purple (#443199)
        } else if (industry === 'hospital') {
          primaryColor = '175 84% 32%'; // Peaceful Teal/Medical Green (#0d9488)
        } else if (industry === 'insurance') {
          primaryColor = '275 100% 50%'; // Vibrant Purple (#9400FF)
        }
      }
      document.documentElement.style.setProperty('--primary', primaryColor);
      document.documentElement.style.setProperty('--ring', primaryColor);
    } else {
      document.body.classList.remove('theme-school');
    }
  }, [user?.company_industry, impersonatedCompany?.industry_type]);

  const toggleChat = () => {
    const newState = !isChatOpen;
    setIsChatOpen(newState);
    if (isAIOpen && newState) setIsAIOpen(false); // Close AI if opening chat
  };

  const toggleAI = async () => {
    const newState = !isAIOpen;
    setIsAIOpen(newState);
    if (isChatOpen && newState) setIsChatOpen(false); // Close chat if opening AI
    
    if (user?.email && user?.company_id) {
      try {
        const { supabase } = await import("@/api/supabaseClient");
        const recordId = uiPrefsId || crypto.randomUUID();
        if (!uiPrefsId) setUiPrefsId(recordId);

        await supabase.from('industry_records').upsert({
          id: recordId,
          company_id: user.company_id,
          industry: 'core',
          record_type: 'ui_prefs',
          search_text: user.email,
          data: { isAIOpen: newState }
        });
      } catch (e) {
        console.error("Failed to save UI prefs", e);
      }
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleOrbitInject = (e) => {
      setOrbitContext(e.detail);
      setIsAIOpen(true);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("orbit:inject", handleOrbitInject);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("orbit:inject", handleOrbitInject);
    };
  }, []);

  const handleStopImpersonation = () => {
    stopImpersonation();
    navigate("/");
  };

  // Compute subscription state and trial countdown
  const subscriptionStatus = user?.subscription_status || 'trial';
  const companyCreatedDate = user?.company_created_date;
  const isSuperAdmin = user?.role === 'super_admin';

  let isExpired = false;
  let trialDaysLeft = user?.company_trial_days || 14;

  if (subscriptionStatus === 'trial' && companyCreatedDate) {
    const createdTime = new Date(companyCreatedDate).getTime();
    const elapsedDays = Math.floor((Date.now() - createdTime) / (1000 * 60 * 60 * 24));
    trialDaysLeft = (user?.company_trial_days || 14) - elapsedDays;
    if (trialDaysLeft <= 0) {
      isExpired = true;
    }
  } else if (subscriptionStatus === 'expired' || subscriptionStatus === 'inactive') {
    isExpired = true;
  }

  // Bypass paywall for super_admins managing the SaaS platform itself
  if (isSuperAdmin) {
    isExpired = false;
  }

  // If subscription is expired or inactive, render the Paywall screen
  if (isExpired) {
    return <Paywall />;
  }

  return (
    <div className="flex h-screen bg-slate-50/50 dark:bg-background overflow-hidden relative selection:bg-primary/20">
      {/* Global Ambient Orbit Background */}
      {(() => {
        const industry = (impersonatedCompany?.industry_type || user?.company_industry || '').toLowerCase();
        
        if (industry === 'insurance') {
          return (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-all duration-1000 bg-slate-50/30 dark:bg-slate-950/30">
              <div className="absolute inset-0 bg-gradient-to-br from-[#9400FF]/5 via-transparent to-[#9400FF]/10 mix-blend-normal" />
              <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#9400FF]/15 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
              <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#9400FF]/15 blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.04] dark:opacity-[0.08]" />
            </div>
          );
        } else if (industry === 'hospital') {
          return (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-all duration-1000 bg-emerald-50/20 dark:bg-emerald-950/20">
              <div className="absolute inset-0 bg-gradient-to-b from-[#0d9488]/5 via-transparent to-[#0d9488]/10" />
              <div className="absolute top-0 right-0 w-[100%] h-[50%] bg-gradient-to-b from-[#0d9488]/10 to-transparent opacity-60 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-[100%] h-[50%] bg-gradient-to-t from-[#0d9488]/10 to-transparent opacity-60 blur-3xl" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/clean-medical.png')] opacity-[0.03] dark:opacity-[0.05]" />
            </div>
          );
        } else if (industry === 'hotel') {
          return (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-all duration-1000 bg-slate-100/40 dark:bg-slate-900/60">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#443199]/10 via-[#dabcff]/5 to-[#443199]/10 mix-blend-multiply dark:mix-blend-color-dodge" />
              <div className="absolute top-1/4 left-1/4 w-[40%] h-[40%] rounded-full bg-amber-200/10 blur-[100px] mix-blend-overlay" />
              <div className="absolute bottom-1/4 right-1/4 w-[40%] h-[40%] rounded-full bg-[#443199]/20 blur-[100px]" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.06] dark:opacity-[0.1]" />
            </div>
          );
        } else if (industry === 'school' || industry === 'highschool') {
          return (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-all duration-1000 bg-[#f8fafc] dark:bg-slate-950">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1A73E8]/8 via-[#e8f0fe]/30 to-[#1A73E8]/5 dark:from-[#1A73E8]/10 dark:via-transparent dark:to-[#1A73E8]/8" />
              <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-[#1A73E8]/12 blur-[140px] mix-blend-multiply dark:mix-blend-screen" />
              <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] rounded-full bg-[#4285F4]/8 blur-[140px] mix-blend-multiply dark:mix-blend-screen" />
              <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] rounded-full bg-[#1A73E8]/5 blur-[100px]" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] dark:opacity-[0.04]" />
            </div>
          );
        }

        // Default Ambient Orbit Background
        return (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-1000">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen transition-colors duration-1000" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen transition-colors duration-1000" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] dark:opacity-[0.05] transition-opacity" />
          </div>
        );
      })()}

      <div className="z-10 flex">
        <Sidebar user={user} isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      </div>
      <div className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto h-screen z-10 relative backdrop-blur-[2px]">
        {/* Offline Banner */}
        {isOffline && !hideOfflineBanner && (
          <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between gap-3 text-xs md:text-sm shrink-0 shadow-sm font-sans z-50">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <WifiOff className="w-4 h-4 shrink-0" />
              <span className="font-semibold uppercase tracking-wider text-[11px]">{t("offline_mode_active", "Offline Mode Active")}</span>
              <span className="hidden md:inline font-medium text-red-100">{t(
                "you_are_currently_disconnected",
                "· You are currently disconnected. Changes will sync automatically when you reconnect."
              )}</span>
            </div>
            <button 
              onClick={() => setHideOfflineBanner(true)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors shrink-0"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Trial Countdown Banner */}
        {subscriptionStatus === 'trial' && !hideTrialBanner && !isSuperAdmin && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 flex items-center justify-between gap-3 text-xs md:text-sm shrink-0 shadow-sm font-sans">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0 animate-pulse" />
              <span className="font-semibold">{t("free_trial_active", "Free Trial Active:")}</span>
              <span>{t("you_have", "You have")} <strong className="font-extrabold">{trialDaysLeft} {t("days", "days")}</strong> {t("remaining_on_your_lexafrica_tr", "remaining on your LexAfrica trial.")}</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/settings">
                <Button
                  size="sm"
                  className="h-7 bg-white hover:bg-slate-50 text-orange-700 hover:text-orange-850 font-bold text-[11px] gap-1 shrink-0 rounded-lg shadow-sm"
                >
                  <CreditCard className="w-3.5 h-3.5" /> {t("upgrade_plan", "Upgrade Plan")}
                </Button>
              </Link>
              <button 
                onClick={() => setHideTrialBanner(true)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {impersonatedCompany && (
          <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between gap-3 text-sm shrink-0">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{t("managing_as", "Managing as:")}</span>
              <span>{impersonatedCompany.name}</span>
              <span className="text-amber-100">· {impersonatedCompany.country} · {impersonatedCompany.subscription_plan}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-white hover:bg-amber-600 hover:text-white gap-1.5 shrink-0"
              onClick={handleStopImpersonation}
            >
              <X className="w-3.5 h-3.5" /> {t("exit_firm_view", "Exit Firm View")}
            </Button>
          </div>
        )}
        <TopBar 
          user={user} 
          isSidebarCollapsed={isSidebarCollapsed} 
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          isAIOpen={isAIOpen}
          toggleAI={toggleAI}
          isChatOpen={isChatOpen}
          toggleChat={toggleChat}
        />
        <div className="flex-1 relative flex flex-col overflow-hidden">
          <main className="flex-1 p-2 sm:p-4 lg:p-6 max-w-[1400px] w-full mx-auto pb-24 md:pb-6 overflow-y-auto">
            <Outlet />
          </main>
          <GlobalVideoOverlay />
        </div>
      </div>
      <MobileBottomNav />
      <AiAssistant isOpen={isAIOpen} onClose={toggleAI} injectedContext={orbitContext} onContextConsumed={() => setOrbitContext(null)} />
      <GlobalChatPanel isOpen={isChatOpen} onClose={toggleChat} />
      <SpotlightSearch />
    </div>
  );
}