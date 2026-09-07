import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate} from "react-router-dom";
import { useTranslation} from "react-i18next";
import { getSubdomainAndBase, isDesktopApp } from '@/lib/domainUtils';
import { cn} from "@/lib/utils";
import { useNavigation} from "@/hooks/useNavigation";
import { useAuth} from "@/lib/AuthContext";
import { useImpersonation} from "@/lib/ImpersonationContext";
import * as LucideIcons from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { base44 } from "@/api/base44Client";
import { getSavedAccounts } from '@/lib/multiAccountUtils';

const SHORT_NAMES = {
  "Dashboard": "Home",
  "Parents & Guardians": "Parents",
  "Teachers & Staff": "Teachers",
  "Classes & Subjects": "Classes",
  "Legal Research": "Research",
  "Conflict Check": "Conflicts",
  "Documents": "Docs",
  "Document Management": "Docs",
  "Case Outcomes": "Outcomes",
  "Email Inbox": "Inbox",
  "HR & Leave": "HR",
  "Institution Settings": "Settings",
  "Student Portal": "Portal",
  "Parent Portal": "Portal",
  "Teacher Evaluations": "Evals",
  "Support Center": "Support",
  "Fee Management": "Fees",
  "Canteen POS": "POS",
  "Asset Management": "Assets",
  "Inventory": "Inventory",
  "Executive Dashboard": "Home",
  "Land Parcels": "Land",
  "Land & Cadastral Parcels": "Land",
  "Land Management": "Land",
  "CRM Leads & Pipelines": "Leads",
  "CRM Leads": "Leads",
  "Leads": "Leads",
  "360° Customer Profiles": "Clients",
  "Customers & Clients": "Clients",
  "Clients": "Clients",
  "Customer Timeline": "Timeline",
  "Timeline": "Timeline",
  "Built Properties & Units": "Properties",
  "Properties": "Properties",
  "Viewing & Tours Calendar": "Viewings",
  "Viewings": "Viewings",
  "Purchase Offers & Terms": "Offers",
  "Offers": "Offers",
  "Counter Offers": "Counters",
  "Sales Deals & Closing": "Deals",
  "Deals": "Deals",
  "Tenancy Leases": "Leases",
  "Leases": "Leases",
  "Lease Renewals": "Renewals",
  "Renewals": "Renewals",
  "Maintenance Requests": "Maintenance",
  "Maintenance": "Maintenance",
  "Approved Contractors": "Contractors",
  "Contractors": "Contractors",
  "Contractor Reviews": "Reviews",
  "Reviews": "Reviews",
  "Trust Accounting": "Trust",
  "Escrow Holdings": "Escrow",
  "Escrow Accounts": "Escrow",
  "Escrow": "Escrow",
  "Rent Collection": "Rent",
  "Rent Payments": "Rent",
  "Payment Schedules": "Schedules",
  "Agent Commissions": "Commissions",
  "Commissions": "Commissions",
  "Commission Rules": "Rules",
  "Development Projects": "Projects",
  "Projects": "Projects",
  "Staff & Team Roster": "Staff",
  "HR & Team": "HR",
  "Document Templates": "Templates",
  "Templates": "Templates",
  "E-Signatures": "E-Sign",
  "Market Valuation & Comps": "Market",
  "Market Data": "Market",
  "Comparable Properties": "Comps",
  "Agent Metrics": "Metrics",
  "Audit Security Log": "Audit",
  "Audit Log": "Audit",
  "Human Resources": "HR"
};

export default function MobileBottomNav() {
 const { t} = useTranslation();
 const location = useLocation();
 const navigate = useNavigate();
 const { user, switchAccount} = useAuth();
 const { impersonatedCompany} = useImpersonation();
 const { navItems} = useNavigation(user, impersonatedCompany);
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const [savedAccounts, setSavedAccounts] = useState([]);

 useEffect(() => {
   setSavedAccounts(getSavedAccounts());
 }, [user]);

 // We want to show exactly 4 items in the bottom nav + 1 "More" button
 const bottomNavItems = navItems.slice(0, 4);
 
 // Inject Integrations into overflow items if not present
 const baseOverflowItems = navItems.slice(4);
 const hasIntegrations = baseOverflowItems.some(i => i.path?.includes('/integrations'));
 const overflowItems = hasIntegrations ? baseOverflowItems : [
   ...baseOverflowItems,
   { label: 'Integrations', path: window.location.pathname.startsWith('/clipad') ? '/clipad/integrations' : '/integrations', icon: 'Plug' }
 ];

 return (
 <>
 <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white/80 dark:bg-background/80 backdrop-blur-2xl border-t border-black/5 dark:border-white/5 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
 <div className="flex items-center justify-around h-[52px] px-2 pt-1">
 {bottomNavItems.map((item) => {
   const isRootPath = ["/", "/s/", "/u/", "/v/", "/o/", "/admin", "/optavel", "/logistics", "/real-estate", "/retail", "/hotel", "/pharmacy", "/religion"].includes(item.path);
   const isActive = location.pathname === item.path || (!isRootPath && item.path && location.pathname.startsWith(item.path));
   const IconComp = typeof item.icon === 'string' ? (LucideIcons[item.icon] || LucideIcons.LayoutDashboard) : (item.icon || LucideIcons.LayoutDashboard);
   const shortLabel = SHORT_NAMES[item.label] || item.label;
 
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
 <span className={cn("text-[10px] font-medium leading-none tracking-tight transition-colors duration-200 truncate px-1 text-center w-full", isActive ? "text-primary" : "text-[#8E8E93] dark:text-[#98989D]")}>
 {t((shortLabel || '').toLowerCase().replace(/\s+/g, '_'), shortLabel)}
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
 <LucideIcons.MoreHorizontal className={cn("w-[22px] h-[22px] transition-transform duration-200", mobileMenuOpen ? "scale-110 drop-shadow-sm" : "")} strokeWidth={mobileMenuOpen ? 2.5 : 2} />
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
 <div className="relative w-full rounded-t-[20px] max-h-[88vh] bg-[#F2F2F7] dark:bg-card transition-transform animate-in slide-in-from-bottom-full overflow-hidden flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
 
 {/* Drag Handle & Header */}
 <div className="flex flex-col items-center pt-3 pb-2 bg-white dark:bg-card border-b border-black/5 dark:border-white/5">
 <div className="w-10 h-1 rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C] mb-3" />
           <div className="w-full flex items-center justify-between px-4 pb-1">
           <h2 className="text-[17px] font-semibold text-black dark:text-white tracking-[-0.41px]">{t('menu', 'Menu')}</h2>
           <button 
           onClick={() => setMobileMenuOpen(false)} 
           className="w-7 h-7 rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C] flex items-center justify-center text-[#8E8E93] hover:opacity-80 active:scale-95 transition-all"
           >
           <LucideIcons.X className="w-4 h-4" />
           </button>
           </div>
           </div>
          
           {/* Native Scrollable List */}
           <div className="flex-1 overflow-y-auto px-4 py-4 pb-[env(safe-area-inset-bottom)] -webkit-overflow-scrolling-touch">
           <div className="bg-white dark:bg-[#2C2C2E] rounded-[10px] overflow-hidden divide-y divide-[#E5E5EA] dark:divide-[#3A3A3C]">
           {overflowItems.map((item, index) => {
             const isRootPath = ["/", "/s/", "/u/", "/v/", "/o/", "/admin", "/optavel", "/logistics", "/real-estate", "/retail", "/hotel", "/pharmacy", "/religion"].includes(item.path);
             const isActive = location.pathname === item.path || (!isRootPath && item.path && location.pathname.startsWith(item.path));
             const IconComp = typeof item.icon === 'string' ? (LucideIcons[item.icon] || LucideIcons.LayoutDashboard) : (item.icon || LucideIcons.LayoutDashboard);
             const shortLabel = SHORT_NAMES[item.label] || item.label;
           
           return (
           <Link
           key={item.path}
           to={item.path}
           onClick={() => setMobileMenuOpen(false)}
           className={cn(
           "flex items-center gap-3.5 px-4 py-3 transition-colors active:bg-[#E5E5EA] dark:active:bg-[#3A3A3C]",
           isActive ? "bg-[#F2F2F7]/50 dark:bg-card/50" : "bg-transparent"
           )}
           >
           <div className={cn(
           "w-[30px] h-[30px] rounded-[7px] flex items-center justify-center transition-colors",
           isActive ? "bg-primary text-white drop-shadow-md" : "bg-white dark:bg-card text-primary"
           )}>
           <IconComp className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
           </div>
           <span className={cn(
           "text-[17px] tracking-[-0.41px] flex-1",
           isActive ? "text-primary font-semibold" : "text-black dark:text-white font-normal"
           )}>
           {t((shortLabel || '').toLowerCase().replace(/\s+/g, '_'), shortLabel)}
           </span>
           {/* Chevron for native feel */}
           <LucideIcons.ChevronRight className="w-[18px] h-[18px] text-[#C7C7CC] dark:text-[#5A5A5F]" strokeWidth={2.5} />
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

              {/* Account Switcher */}
              {savedAccounts.length > 1 && (
                <div className="flex flex-col border-t border-[#E5E5EA] dark:border-[#3A3A3C]">
                  <div className="px-4 py-2 bg-[#F2F2F7]/50 dark:bg-card/50">
                    <span className="text-[13px] uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D] font-semibold">Switch Account</span>
                  </div>
                  {savedAccounts.filter(acc => acc.id !== user?.id).map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        switchAccount(acc.id);
                      }}
                      className="flex items-center gap-3 px-4 py-3 bg-transparent active:bg-[#E5E5EA] dark:active:bg-[#3A3A3C] transition-colors border-b border-[#E5E5EA] dark:border-[#3A3A3C] last:border-b-0 w-full text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                        {acc.avatar_url ? (
                          <img src={acc.avatar_url} alt={acc.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400">
                            {acc.full_name ? acc.full_name[0].toUpperCase() : <LucideIcons.User className="w-4 h-4"/>}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[17px] tracking-[-0.41px] text-black dark:text-white font-normal truncate">{acc.full_name || 'User'}</span>
                        <span className="text-[13px] tracking-[-0.08px] text-[#8E8E93] truncate">{acc.email}</span>
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/login?prompt=login');
                    }}
                    className="flex items-center gap-3 px-4 py-3 bg-transparent active:bg-[#E5E5EA] dark:active:bg-[#3A3A3C] transition-colors w-full text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <LucideIcons.Plus className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[17px] tracking-[-0.41px] text-primary font-medium flex-1">Add another account</span>
                  </button>
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
                        if (user?.role === 'super_admin') {
                          navigate('/admin');
                        } else {
                          navigate('/');
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
              <LucideIcons.LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
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

