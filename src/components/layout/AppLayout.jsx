import React, { useState } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAuth } from "@/lib/AuthContext";
import { useImpersonation } from "@/lib/ImpersonationContext";
import { Building2, X, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import Paywall from "@/pages/Paywall";

export default function AppLayout() {
  const { user } = useAuth();
  const { impersonatedCompany, stopImpersonation } = useImpersonation();
  const navigate = useNavigate();
  const [hideTrialBanner, setHideTrialBanner] = useState(false);

  const handleStopImpersonation = () => {
    stopImpersonation();
    navigate("/");
  };

  // Compute subscription state and trial countdown
  const subscriptionStatus = user?.subscription_status || 'trial';
  const companyCreatedDate = user?.company_created_date;
  const isSuperAdmin = user?.role === 'super_admin';

  let isExpired = false;
  let trialDaysLeft = 14;

  if (subscriptionStatus === 'trial' && companyCreatedDate) {
    const createdTime = new Date(companyCreatedDate).getTime();
    const elapsedDays = Math.floor((Date.now() - createdTime) / (1000 * 60 * 60 * 24));
    trialDaysLeft = 14 - elapsedDays;
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
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Trial Countdown Banner */}
        {subscriptionStatus === 'trial' && !hideTrialBanner && !isSuperAdmin && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 flex items-center justify-between gap-3 text-xs md:text-sm shrink-0 shadow-sm font-sans">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0 animate-pulse" />
              <span className="font-semibold">Free Trial Active:</span>
              <span>You have <strong className="font-extrabold">{trialDaysLeft} days</strong> remaining on your Optalflow trial.</span>
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
        <TopBar user={user} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-[1400px] w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}