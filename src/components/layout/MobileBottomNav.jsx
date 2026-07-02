import React, { useState} from "react";
import { Link, useLocation, useNavigate} from "react-router-dom";
import { useTranslation} from "react-i18next";
import { getSubdomainAndBase, isDesktopApp } from '@/lib/domainUtils';
import { cn} from "@/lib/utils";
import { useNavigation} from "@/hooks/useNavigation";
import { useAuth} from "@/lib/AuthContext";
import { useImpersonation} from "@/lib/ImpersonationContext";
import { X, MoreHorizontal, LayoutDashboard, Briefcase, Users, Calendar, Inbox, Blocks, ShoppingCart, Settings, Shield, PanelLeft, ChevronRight, LogOut} from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { base44 } from "@/api/base44Client";

// Mapping string icons to components
const ICON_MAP = {
 LayoutDashboard, Briefcase, Users, Calendar, Inbox, Blocks, ShoppingCart, Settings, Shield
};

export default function MobileBottomNav() {
 const { t} = useTranslation();
 const location = useLocation();
 const navigate = useNavigate();
 const { user} = useAuth();
 const { impersonatedCompany} = useImpersonation();
 const { navItems} = useNavigation(user, impersonatedCompany);
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

 // We want to show exactly 4 items in the bottom nav + 1 "More" button
 const bottomNavItems = navItems.slice(0, 4);
 const overflowItems = navItems.slice(4);

 return (
 <>
 <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-t border-black/5 dark:border-white/5 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
 <div className="flex items-center justify-around h-[52px] px-2 pt-1">
 {bottomNavItems.map((item) => {
   const isRootPath = ["/", "/s/", "/u/", "/v/", "/o/", "/admin", "/optavel", "/logistics", "/real-estate", "/retail", "/hotel", "/pharmacy", "/religion"].includes(item.path);
   const isActive = location.pathname === item.path || (!isRootPath && location.pathname.startsWith(item.path));
 const IconComp = typeof item.icon === 'string' ? (ICON_MAP[item.icon] || LayoutDashboard) : (item.icon || LayoutDashboard);
 
 return (
 <Link
 key={item.path}
 to={item.path}
 onClick={() => setMobileMenuOpen(false)}
 className="relative flex flex-col items-center justify-center w-full h-full min-w-[64px] active:scale-95 transition-transform duration-100 ease-in-out"
 >
 <div className={cn("relative flex items-center justify-center mb-0.5 transition-colors duration-200", isActive ? "text-primary" : "text-[#8E8E93] dark:text-[#98989D]")}>
 <IconComp className={cn("w-[22px] h-[22px] transition-transform duration-200", isActive ? "scale-110 drop-shadow-sm" : "")} strokeWidth={isActive ? 2.5 : 2} />
 </div>
 <span className={cn("text-[10px] font-medium leading-none tracking-tight transition-colors duration-200", isActive ? "text-primary" : "text-[#8E8E93] dark:text-[#98989D]")}>
 {t((item.label || '').toLowerCase().replace(/\s+/g, '_'), item.label)}
 </span>
 </Link>
 );
})}
 
 {/* More Tab */}
 <button
 onClick={() => setMobileMenuOpen(true)}
 className="relative flex flex-col items-center justify-center w-full h-full min-w-[64px] active:scale-95 transition-transform duration-100 ease-in-out"
 >
 <div className={cn("relative flex items-center justify-center mb-0.5 transition-colors duration-200", mobileMenuOpen ? "text-primary" : "text-[#8E8E93] dark:text-[#98989D]")}>
 <MoreHorizontal className={cn("w-[22px] h-[22px] transition-transform duration-200", mobileMenuOpen ? "scale-110 drop-shadow-sm" : "")} strokeWidth={mobileMenuOpen ? 2.5 : 2} />
 </div>
 <span className={cn("text-[10px] font-medium leading-none tracking-tight transition-colors duration-200", mobileMenuOpen ? "text-primary" : "text-[#8E8E93] dark:text-[#98989D]")}>
 {t("more", "More")}
 </span>
 </button>
 </div>
 </nav>

 {/* Native Mobile Bottom Sheet for More Items */}
 {mobileMenuOpen && (
 <div className="md:hidden fixed inset-0 z-[70] flex flex-col justify-end">
 {/* Backdrop */}
 <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" onClick={() => setMobileMenuOpen(false)} />
 
 {/* Sheet */}
 <div className="relative w-full rounded-t-[20px] max-h-[88vh] bg-[#F2F2F7] dark:bg-[#1C1C1E] transition-transform animate-in slide-in-from-bottom-full overflow-hidden flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
 
 {/* Drag Handle & Header */}
 <div className="flex flex-col items-center pt-3 pb-2 bg-white dark:bg-[#1C1C1E] border-b border-black/5 dark:border-white/5">
 <div className="w-10 h-1 rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C] mb-3" />
 <div className="w-full flex items-center justify-between px-4 pb-1">
 <h2 className="text-[17px] font-semibold text-black dark:text-white tracking-[-0.41px]">{t('menu', 'Menu')}</h2>
 <button 
 onClick={() => setMobileMenuOpen(false)} 
 className="w-7 h-7 rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C] flex items-center justify-center text-[#8E8E93] hover:opacity-80 active:scale-95 transition-all"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Native Scrollable List */}
 <div className="flex-1 overflow-y-auto px-4 py-4 pb-[env(safe-area-inset-bottom)] -webkit-overflow-scrolling-touch">
 <div className="bg-white dark:bg-[#2C2C2E] rounded-[10px] overflow-hidden divide-y divide-[#E5E5EA] dark:divide-[#3A3A3C]">
 {overflowItems.map((item, index) => {
   const isRootPath = ["/", "/s/", "/u/", "/v/", "/o/", "/admin", "/optavel", "/logistics", "/real-estate", "/retail", "/hotel", "/pharmacy", "/religion"].includes(item.path);
   const isActive = location.pathname === item.path || (!isRootPath && location.pathname.startsWith(item.path));
 const IconComp = typeof item.icon === 'string' ? (ICON_MAP[item.icon] || LayoutDashboard) : (item.icon || LayoutDashboard);
 
 return (
 <Link
 key={item.path}
 to={item.path}
 onClick={() => setMobileMenuOpen(false)}
 className={cn(
 "flex items-center gap-3.5 px-4 py-3 transition-colors active:bg-[#E5E5EA] dark:active:bg-[#3A3A3C]",
 isActive ? "bg-[#F2F2F7]/50 dark:bg-[#1C1C1E]/50" : "bg-transparent"
 )}
 >
 <div className={cn(
 "w-[30px] h-[30px] rounded-[7px] flex items-center justify-center transition-colors",
 isActive ? "bg-primary text-white drop-shadow-md" : "bg-white dark:bg-[#1C1C1E] text-primary"
 )}>
 <IconComp className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
 </div>
 <span className={cn(
 "text-[17px] tracking-[-0.41px] flex-1",
 isActive ? "text-primary font-semibold" : "text-black dark:text-white font-normal"
 )}>
 {t((item.label || '').toLowerCase().replace(/\s+/g, '_'), item.label)}
 </span>
 {/* Chevron for native feel */}
 <ChevronRight className="w-[18px] h-[18px] text-[#C7C7CC] dark:text-[#5A5A5F]" strokeWidth={2.5} />
 </Link>
 );
})}
 </div>
          <div className="mt-5 bg-white dark:bg-[#2C2C2E] rounded-[10px] overflow-hidden divide-y divide-[#E5E5EA] dark:divide-[#3A3A3C]">
            <div className="flex flex-col">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[17px] tracking-[-0.41px] text-black dark:text-white font-normal">
                  {t('theme', 'Theme')}
                </span>
                <ThemeToggle />
              </div>

              {/* Language Switcher */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E5EA] dark:border-[#3A3A3C]">
                <span className="text-[17px] tracking-[-0.41px] text-black dark:text-white font-normal">Language</span>
                <select 
                  onChange={(e) => window.location.reload()} // Simplified for mobile
                  className="bg-transparent border-0 pr-0 text-[#8E8E93] text-[17px] outline-none"
                  style={{ direction: 'rtl' }}
                >
                  <option value="en">English 🇬🇧</option>
                  <option value="es">Español 🇪🇸</option>
                  <option value="fr">Français 🇫🇷</option>
                </select>
              </div>

              {/* Workspace Switcher */}
              {user?.available_companies?.length > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E5EA] dark:border-[#3A3A3C]">
                  <span className="text-[17px] tracking-[-0.41px] text-black dark:text-white font-normal">Workspace</span>
                  <select
                    value={user.company_id}
                    onChange={async (e) => {
                      const targetId = e.target.value;
                      if (!targetId || targetId === user.company_id) return;
                      // Update profiles directly via API
                      await base44.auth.updateProfile({ company_id: targetId });
                      const isNativeApp = isDesktopApp();
                      if (isNativeApp) {
                        navigate('/');
                        setTimeout(() => window.location.reload(), 100);
                      } else {
                        window.location.href = '/';
                      }
                    }}
                    className="bg-transparent border-0 pr-0 text-[#8E8E93] text-[17px] outline-none max-w-[150px] truncate"
                    style={{ direction: 'rtl' }}
                  >
                    {user.available_companies.map(comp => (
                      <option key={comp.id} value={comp.id}>{comp.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Super Admin Switchers */}
              {user?.role === 'super_admin' && (
                <>
                  <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E5EA] dark:border-[#3A3A3C]">
                    <span className="text-[17px] tracking-[-0.41px] text-amber-600 dark:text-amber-500 font-normal">Industry</span>
                    <select
                      value={sessionStorage.getItem('slate_industry_override') || 'law'}
                      onChange={(e) => {
                        sessionStorage.setItem('slate_industry_override', e.target.value);
                        const isNativeApp = isDesktopApp();
                        if (isNativeApp) {
                          navigate('/');
                          setTimeout(() => window.location.reload(), 100);
                        } else {
                          window.location.href = '/';
                        }
                      }}
                      className="bg-transparent border-0 pr-0 text-[#8E8E93] text-[17px] outline-none"
                      style={{ direction: 'rtl' }}
                    >
                      <option value="law">Law Firm</option>
                      <option value="accounting">Accounting</option>
                      <option value="consulting">Consulting</option>
                      <option value="real_estate">Real Estate</option>
                      <option value="agency">Creative Agency</option>
                      <option value="tech">Tech Startup</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="healthcare">Healthcare</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E5EA] dark:border-[#3A3A3C]">
                    <span className="text-[17px] tracking-[-0.41px] text-indigo-600 dark:text-indigo-500 font-normal">Components</span>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) window.location.href = `/orbit-test/${e.target.value}`;
                      }}
                      className="bg-transparent border-0 pr-0 text-[#8E8E93] text-[17px] outline-none max-w-[140px]"
                      style={{ direction: 'rtl' }}
                    >
                      <option value="" disabled>View Component...</option>
                      <option value="AdminDashboard">Admin Dashboard</option>
                      <option value="UniversalBilling">Universal Billing</option>
                      <option value="TeamDirectory">Team Directory</option>
                      <option value="ClientPortal">Client Portal</option>
                      <option value="DocumentVault">Document Vault</option>
                      <option value="KanbanBoard">Kanban Board</option>
                      <option value="SecurityAudit">Security Audit</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
            
            <div className="mt-5 mb-8 bg-white dark:bg-[#2C2C2E] rounded-[10px] overflow-hidden">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                base44.auth.logout();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 transition-colors active:bg-[#E5E5EA] dark:active:bg-[#3A3A3C] text-[#FF3B30] dark:text-[#FF453A]"
            >
              <LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
              <span className="text-[17px] font-normal tracking-[-0.41px]">
                {t('log_out', 'Log out')}
              </span>
            </button>
            </div>
            </div>
        </div>
 </div>
 )}
 </>
 );
}

