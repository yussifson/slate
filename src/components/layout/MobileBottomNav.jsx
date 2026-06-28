import React, { useState} from "react";
import { Link, useLocation} from "react-router-dom";
import { useTranslation} from "react-i18next";
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
 const { user} = useAuth();
 const { impersonatedCompany} = useImpersonation();
 const { navItems} = useNavigation(user, impersonatedCompany);
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

 // We want to show exactly 4 items in the bottom nav + 1 "More" button
 const bottomNavItems = navItems.slice(0, 4);
 const overflowItems = navItems.slice(4);

 return (
 <>
 <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-background/95 backdrop-blur-xl border-t border-primary/40 -[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
 <div className="flex items-center justify-around h-16 px-1">
 {bottomNavItems.map((item) => {
   const isRootPath = ["/", "/s/", "/u/", "/v/", "/o/", "/admin", "/optavel", "/logistics", "/real-estate", "/retail", "/hotel", "/pharmacy", "/religion"].includes(item.path);
   const isActive = location.pathname === item.path || (!isRootPath && location.pathname.startsWith(item.path));
 const IconComp = typeof item.icon === 'string' ? (ICON_MAP[item.icon] || LayoutDashboard) : (item.icon || LayoutDashboard);
 
 return (
 <Link
 key={item.path}
 to={item.path}
 onClick={() => setMobileMenuOpen(false)}
 className={cn(
 "flex flex-col items-center justify-center gap-2 py-1 px-2 rounded-xl min-w-[64px] transition-all",
 isActive ? "text-primary" : "text-[#71717a] dark:text-gray-400 hover:text-foreground"
 )}
 >
 <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", isActive ? "bg-slate-100" : "")}>
 <IconComp className={cn("w-5 h-5 transition-transform", isActive ? "scale-110" : "")} />
 </div>
 <span className={cn("text-[10px] font-semibold leading-none", isActive ? "text-primary" : "")}>
 {t((item.label || '').toLowerCase().replace(/\s+/g, '_'), item.label)}
 </span>
 </Link>
 );
})}
 
 {/* More Tab */}
 <button
 onClick={() => setMobileMenuOpen(true)}
 className={cn(
 "flex flex-col items-center justify-center gap-2 py-1 px-2 rounded-xl min-w-[64px] transition-all",
 mobileMenuOpen ? "text-primary" : "text-[#71717a] dark:text-gray-400 hover:text-foreground"
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

 {/* Native Mobile Bottom Sheet for More Items */}
 {mobileMenuOpen && (
 <div className="md:hidden fixed inset-0 z-[70] flex flex-col justify-end">
 {/* Backdrop */}
 <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-300" onClick={() => setMobileMenuOpen(false)} />
 
 {/* Sheet */}
 <div className="relative w-full rounded-md-t-[32px] max-h-[85vh] bg-white dark:bg-slate-950 transition-transform animate-in slide-in-from-bottom-full overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 
 {/* Drag Handle & Header */}
 <div className="flex flex-col items-center pt-3 pb-2 border-b border-primary/40 dark:border-primary/40">
 <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 mb-4" />
 <div className="w-full flex items-center justify-between px-6">
 <h2 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">{t('menu', 'Menu')}</h2>
 <button 
 onClick={() => setMobileMenuOpen(false)} 
 className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Native Scrollable List */}
 <div className="flex-1 overflow-y-auto px-4 py-4 pb-[env(safe-area-inset-bottom)]">
 <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl overflow-hidden border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 divide-y divide-slate-100 dark:divide-slate-800/50 ">
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
 "flex items-center gap-4 px-5 py-4 transition-colors active:bg-slate-200/50 dark:active:bg-slate-800/50",
 isActive ? "bg-white dark:bg-slate-950" : "bg-transparent hover:bg-white/50 dark:hover:bg-slate-900"
 )}
 >
 <div className={cn(
 "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
 isActive ? "bg-primary/10 text-primary" : "bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
 )}>
 <IconComp className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
 </div>
 <span className={cn(
 "text-[16px] font-semibold tracking-tight flex-1",
 isActive ? "text-primary" : "text-slate-700 dark:text-slate-300"
 )}>
 {t((item.label || '').toLowerCase().replace(/\s+/g, '_'), item.label)}
 </span>
 {/* Chevron for native feel */}
 <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
 </Link>
 );
})}
          <div className="border-t border-primary/40 dark:border-primary/40 mt-4 pt-2">
            <div className="px-5 py-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-semibold tracking-tight text-slate-700 dark:text-slate-300">
                  {t('theme', 'Theme')}
                </span>
                <ThemeToggle />
              </div>

              {/* Language Switcher */}
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-semibold tracking-tight text-slate-700 dark:text-slate-300">Language</span>
                <select 
                  onChange={(e) => window.location.reload()} // Simplified for mobile
                  className="bg-transparent border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-lg px-2 py-1 text-sm text-foreground outline-none"
                >
                  <option value="en">English 🇬🇧</option>
                  <option value="es">Español 🇪🇸</option>
                  <option value="fr">Français 🇫🇷</option>
                </select>
              </div>

              {/* Workspace Switcher */}
              {user?.available_companies?.length > 1 && (
                <div className="flex items-center justify-between">
                  <span className="text-[16px] font-semibold tracking-tight text-slate-700 dark:text-slate-300">Workspace</span>
                  <select
                    value={user.company_id}
                    onChange={async (e) => {
                      const targetId = e.target.value;
                      if (!targetId || targetId === user.company_id) return;
                      // Update profiles directly via API
                      await base44.auth.updateProfile({ company_id: targetId });
                      window.location.href = '/';
                    }}
                    className="bg-transparent border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-lg px-2 py-1 text-sm text-foreground outline-none max-w-[150px] truncate"
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
                  <div className="flex items-center justify-between">
                    <span className="text-[16px] font-semibold tracking-tight text-amber-600 dark:text-amber-500">Industry</span>
                    <select
                      value={sessionStorage.getItem('slate_industry_override') || 'law'}
                      onChange={(e) => {
                        sessionStorage.setItem('slate_industry_override', e.target.value);
                        window.location.href = '/';
                      }}
                      className="bg-amber-50 dark:bg-amber-950/20 border-[0.5px] border-black/9 dark:border-white/8 border-amber-200 dark:border-amber-900 rounded-lg px-2 py-1 text-sm text-amber-700 dark:text-amber-400 outline-none"
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

                  <div className="flex items-center justify-between">
                    <span className="text-[16px] font-semibold tracking-tight text-indigo-600 dark:text-indigo-500">Components</span>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) window.location.href = `/orbit-test/${e.target.value}`;
                      }}
                      className="bg-indigo-50 dark:bg-indigo-950/20 border-[0.5px] border-black/9 dark:border-white/8 border-indigo-200 dark:border-indigo-900 rounded-lg px-2 py-1 text-sm text-indigo-700 dark:text-indigo-400 outline-none max-w-[140px]"
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
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                base44.auth.logout();
              }}
              className="w-full flex items-center gap-4 px-5 py-4 transition-colors active:bg-red-50 dark:active:bg-red-950/30 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-500">
                <LogOut className="w-4 h-4" strokeWidth={2} />
              </div>
              <span className="text-[16px] font-semibold tracking-tight flex-1 text-left">
                {t('log_out', 'Log out')}
              </span>
            </button>
          </div>
        </div>
 </div>
 </div>
 </div>
 )}
 </>
 );
}
