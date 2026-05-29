import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAuth } from "@/lib/AuthContext";
import { useImpersonation } from "@/lib/ImpersonationContext";
import { Building2, X, Clock, CreditCard, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Paywall from "@/pages/Paywall";
import AiAssistant from "@/components/AiAssistant";
import SpotlightSearch from "./SpotlightSearch";

export default function AppLayout() {
  const { user } = useAuth();
  const { impersonatedCompany, stopImpersonation } = useImpersonation();
  const navigate = useNavigate();
  const [hideTrialBanner, setHideTrialBanner] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
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
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar user={user} isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      <div className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto h-screen">
        {/* Trial Countdown Banner */}
        {subscriptionStatus === 'trial' && !hideTrialBanner && !isSuperAdmin && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 flex items-center justify-between gap-3 text-xs md:text-sm shrink-0 shadow-sm font-sans">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0 animate-pulse" />
              <span className="font-semibold">Free Trial Active:</span>
              <span>You have <strong className="font-extrabold">{trialDaysLeft} days</strong> remaining on your LexAfrica trial.</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/settings">
                <Button
                  size="sm"
                  className="h-7 bg-white hover:bg-slate-50 text-orange-700 hover:text-orange-850 font-bold text-[11px] gap-1 shrink-0 rounded-lg shadow-sm"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Upgrade Plan
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
              <span className="font-semibold">Managing as:</span>
              <span>{impersonatedCompany.name}</span>
              <span className="text-amber-100">· {impersonatedCompany.country} · {impersonatedCompany.subscription_plan}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-white hover:bg-amber-600 hover:text-white gap-1.5 shrink-0"
              onClick={handleStopImpersonation}
            >
              <X className="w-3.5 h-3.5" /> Exit Firm View
            </Button>
          </div>
        )}
        <TopBar 
          user={user} 
          isSidebarCollapsed={isSidebarCollapsed} 
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
        <main className="flex-1 p-4 lg:p-6 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
      <AiAssistant />
      <SpotlightSearch />
      {isOffline && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-600/90 hover:bg-red-700/90 backdrop-blur-md text-white font-semibold px-4 py-2.5 rounded-full flex items-center gap-2.5 shadow-lg border border-red-500/20 select-none animate-pulse">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <WifiOff className="w-4 h-4 shrink-0" />
          <span className="text-xs tracking-wider uppercase font-bold">Offline Mode Active</span>
        </div>
      )}
    </div>
  );
}