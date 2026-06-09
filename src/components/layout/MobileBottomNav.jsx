import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/hooks/useNavigation";
import { useAuth } from "@/lib/AuthContext";
import { useImpersonation } from "@/lib/ImpersonationContext";
import { X, MoreHorizontal, LayoutDashboard, Briefcase, Users, Calendar, Inbox, Blocks, ShoppingCart, Settings, Shield, PanelLeft } from "lucide-react";

// Mapping string icons to components
const ICON_MAP = {
  LayoutDashboard, Briefcase, Users, Calendar, Inbox, Blocks, ShoppingCart, Settings, Shield
};

export default function MobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuth();
  const { impersonatedCompany } = useImpersonation();
  const { navItems } = useNavigation(user, impersonatedCompany);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // We want to show exactly 4 items in the bottom nav + 1 "More" button
  const bottomNavItems = navItems.slice(0, 4);
  const overflowItems = navItems.slice(4);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-background/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 px-1">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            const IconComp = typeof item.icon === 'string' ? ICON_MAP[item.icon] || LayoutDashboard : item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl min-w-[64px] transition-all",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", isActive ? "bg-slate-100" : "")}>
                  <IconComp className={cn("w-5 h-5 transition-transform", isActive ? "scale-110" : "")} />
                </div>
                <span className={cn("text-[10px] font-semibold leading-none", isActive ? "text-primary" : "")}>
                  {t(item.label.toLowerCase().replace(/\s+/g, '_'), item.label)}
                </span>
              </Link>
            );
          })}
          
          {/* More Tab */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl min-w-[64px] transition-all",
              mobileMenuOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", mobileMenuOpen ? "bg-slate-100" : "")}>
              <MoreHorizontal className={cn("w-5 h-5 transition-transform", mobileMenuOpen ? "scale-110" : "")} />
            </div>
            <span className={cn("text-[10px] font-semibold leading-none", mobileMenuOpen ? "text-primary" : "")}>
              {t("more", "More")}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile overlay / Drawer for More Items */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[70] flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-full rounded-t-3xl shadow-2xl max-h-[85vh] bg-card transition-transform animate-in slide-in-from-bottom-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">{t('menu', 'Menu')}</h2>
              <button 
                onClick={() => setMobileMenuOpen(false)} 
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:scale-105 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 pb-20">
              <div className="space-y-1">
                {overflowItems.map(item => {
                   const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
                   const IconComp = typeof item.icon === 'string' ? ICON_MAP[item.icon] || LayoutDashboard : item.icon;
                   
                   return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                        isActive ? "bg-slate-100 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <IconComp className="w-5 h-5" />
                      {t(item.label.toLowerCase().replace(/\s+/g, '_'), item.label)}
                    </Link>
                   );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
