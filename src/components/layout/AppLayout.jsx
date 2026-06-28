import { powerSync} from '@/api/PowerSyncConnector';
import { supabase} from '@/api/supabaseClient';
import { useTranslation} from "react-i18next";
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileBottomNav from "./MobileBottomNav";
import { useAuth} from "@/lib/AuthContext";
import { useImpersonation} from "@/lib/ImpersonationContext";
import { Building2, X, Clock, CreditCard, WifiOff} from "lucide-react";
import { Button} from "@/components/ui/button";
import Paywall from "@/pages/Paywall";
import AiAssistant from "@/components/AiAssistant";
import GlobalChatPanel from "@/components/chat/GlobalChatPanel";
import SpotlightSearch from "./SpotlightSearch";
import GlobalVideoOverlay from "@/components/video/GlobalVideoOverlay";
import OrbitBoltWorkspace from "@/components/orbitbolt/OrbitBoltWorkspace";
import FeatureAnnouncementModal from "./FeatureAnnouncementModal";

export default function AppLayout() {
 const { t} = useTranslation();
  const { user } = useAuth();
  const { impersonatedCompany, stopImpersonation } = useImpersonation();
  const navigate = useNavigate();
  const location = useLocation();
  const [hideTrialBanner, setHideTrialBanner] = useState(false);
 const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
 const [isOffline, setIsOffline] = useState(!navigator.onLine);
 const [hideOfflineBanner, setHideOfflineBanner] = useState(false);

 const [isAIOpen, setIsAIOpen] = useState(false);
 const [isChatOpen, setIsChatOpen] = useState(false);
 const [isBoltOpen, setIsBoltOpen] = useState(false);
 const [isPrefsLoaded, setIsPrefsLoaded] = useState(false);
 const [orbitContext, setOrbitContext] = useState(null);
 const [uiPrefsId, setUiPrefsId] = useState(null);

 useEffect(() => {
 if (!user?.email || !user?.company_id || isPrefsLoaded) return;
 
 // Fetch UI prefs
 const fetchPrefs = async () => {
 try {
 const { supabase} = await import("@/api/supabaseClient");
 const { data} = await supabase
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

 // Dynamic Industry Theming - Removed to enforce unified Optavel theme across all suites
 useEffect(() => {
 // Clean up any legacy classes just in case
 document.body.classList.remove('theme-school', 'theme-university', 'theme-online');
 // We let index.css :root handle the unified primary colors
}, [user?.company_industry, impersonatedCompany?.industry || impersonatedCompany?.industry_type]);

 const toggleChat = () => {
 const newState = !isChatOpen;
 setIsChatOpen(newState);
 if (isAIOpen && newState) setIsAIOpen(false); // Close AI if opening chat
 if (isBoltOpen && newState) setIsBoltOpen(false); // Close Bolt if opening chat
};

 const toggleBolt = () => {
 const newState = !isBoltOpen;
 setIsBoltOpen(newState);
 if (isAIOpen && newState) setIsAIOpen(false);
 if (isChatOpen && newState) setIsChatOpen(false);
};

 const toggleAI = async () => {
 const newState = !isAIOpen;
 setIsAIOpen(newState);
 if (isChatOpen && newState) setIsChatOpen(false); // Close chat if opening AI
 if (isBoltOpen && newState) setIsBoltOpen(false); // Close Bolt if opening AI
 
 if (user?.email && user?.company_id) {
 try {
 const { supabase} = await import("@/api/supabaseClient");
 const recordId = uiPrefsId || crypto.randomUUID();
 if (!uiPrefsId) setUiPrefsId(recordId);

 await (async () => {
 const _payload = {
 id: recordId,
 company_id: user.company_id,
 industry: 'core',
 record_type: 'ui_prefs',
 search_text: user.email,
 data: { isAIOpen: newState}
};
  await supabase.from('industry_records').upsert(_payload);
})();
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
 const isSuperAdmin = ['super_admin', 'admin'].includes(user?.role);

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
 <div className="flex h-[100dvh] bg-slate-50/50 dark:bg-background overflow-hidden relative selection:bg-primary/20 w-full">
 {/* Global Ambient Orbit Background - Unified Optavel Theme */}
 <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-all duration-1000 bg-white dark:bg-[#0A0F1C] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {/* Clean White Background with subtle Emerald Green accents */}
 <div className="absolute inset-0 bg-gradient-to-br from-[hsl(158,68%,38%)]/[0.03] via-transparent to-[hsl(158,68%,38%)]/[0.06] dark:from-[hsl(158,68%,38%)]/10 dark:via-[#0A0F1C] dark:to-[hsl(158,68%,38%)]/20" />
 
 {/* Soft Radial Glows - Emerald Green */}
 <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[hsl(158,68%,38%)]/5 blur-[150px] mix-blend-multiply dark:mix-blend-screen" />
 <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[hsl(158,68%,38%)]/5 blur-[160px] mix-blend-multiply dark:mix-blend-screen" />
 </div>

 <div className="z-10 flex">
 <Sidebar user={user} isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
 </div>
 <div className="flex-1 flex flex-col overflow-hidden h-screen z-30 relative">
 {/* Offline Banner */}
 {isOffline && !hideOfflineBanner && (
 <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between gap-3 text-xs md:text-sm shrink-0 font-sans z-50 tracking-[0.04em]">
 <div className="flex items-center gap-2">
 <span className="relative flex h-2 w-2 shrink-0">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"></span>
 <span className="relative inline-flex rounded-full h-2 w-2 bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"></span>
 </span>
 <WifiOff className="w-4 h-4 shrink-0" />
 <span className="font-semibold uppercase tracking-wider text-[11px] tracking-[0.04em]">{t("offline_mode_active", "Offline Mode Active")}</span>
 <span className="hidden md:inline font-medium text-red-100">{t(
 "you_are_currently_disconnected",
 "· You are currently disconnected. Changes will sync automatically when you reconnect."
 )}</span>
 </div>
 <button 
 onClick={() => setHideOfflineBanner(true)}
 className="p-1 hover:bg-white/10 rounded-full transition-colors shrink-0 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 title="Dismiss"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 )}

 {/* Trial Countdown Banner */}
 {subscriptionStatus === 'trial' && !hideTrialBanner && !isSuperAdmin && (
 <div className="mx-3 mt-3 mb-1 rounded-xl bg-gradient-to-b from-primary/90 to-primary text-white px-5 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs md:text-sm shrink-0 font-sans border-[0.5px] border-black/9 dark:border-white/8 border-white/20 relative overflow-hidden tracking-[0.04em]">
 {/* Shimmer effect */}
 <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
 
 <div className="flex items-center gap-2 relative z-10">
 <Clock className="w-5 h-5 shrink-0 animate-pulse text-white/90" />
 <span className="font-semibold tracking-tight">{t("free_trial_active", "Free Trial Active:")}</span>
 <span className="text-white/90">{t("you_have", "You have")} <strong className="font-extrabold text-white text-base bg-primary/20 px-1.5 py-0.5 rounded-md">{trialDaysLeft} {t("days", "days")}</strong> {t("remaining_on_your_slate_trial", "remaining on your Slate trial.")}</span>
 </div>
 <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
 <Link to="/settings" className="w-full sm:w-auto">
 <Button
 size="sm"
 className="w-full h-8 bg-white hover:bg-white/90 text-primary font-extrabold text-xs gap-2.5 shrink-0 rounded-xl transition-all hover:scale-105 tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 <CreditCard className="w-3.5 h-3.5" /> {t("upgrade_plan", "Upgrade Plan")}
 </Button>
 </Link>
 <button 
 onClick={() => setHideTrialBanner(true)}
 className="p-1 hover:bg-white/10 rounded-full transition-colors shrink-0 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
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
 className="h-7 text-white hover:bg-amber-600 hover:text-white gap-2.5 shrink-0"
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
 isBoltOpen={isBoltOpen}
 toggleBolt={toggleBolt}
 />
  <div className="flex-1 relative flex overflow-hidden">
   <main className="flex-1 w-full mx-auto px-6 md:px-8 lg:px-10 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6 overflow-y-auto">
     <AnimatePresence mode="wait">
       <motion.div
         key={location.pathname}
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, y: -10 }}
         transition={{ duration: 0.15, ease: "easeOut" }}
         className="h-full"
       >
         <Outlet />
       </motion.div>
     </AnimatePresence>
   </main>
  <div id="right-docked-panel-portal" className="flex shrink-0 h-full empty:hidden z-40 relative bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[-4px_0_24px_rgba(0,0,0,0.02)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"></div>
  <GlobalVideoOverlay />
 </div>
 </div>
 <MobileBottomNav />
 <AiAssistant isOpen={isAIOpen} onClose={toggleAI} injectedContext={orbitContext} onContextConsumed={() => setOrbitContext(null)} />
 <GlobalChatPanel isOpen={isChatOpen} onClose={toggleChat} />
 {isBoltOpen && <OrbitBoltWorkspace onClose={toggleBolt} />}
 <SpotlightSearch />
 <FeatureAnnouncementModal />
 </div>
 );
}