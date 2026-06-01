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
    <div className="flex h-screen bg-background overflow-hidden relative">
      <Sidebar user={user} isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      <div className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto h-screen">
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
        <main className="flex-1 p-2 sm:p-4 lg:p-6 max-w-[1400px] w-full mx-auto pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
      <AiAssistant isOpen={isAIOpen} onClose={toggleAI} injectedContext={orbitContext} onContextConsumed={() => setOrbitContext(null)} />
      <GlobalChatPanel isOpen={isChatOpen} onClose={toggleChat} />
      <SpotlightSearch />
    </div>
  );
}