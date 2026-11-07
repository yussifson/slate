import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isDesktopApp } from '@/lib/domainUtils';
import { cn } from "@/lib/utils";
import { useNavigation } from "@/hooks/useNavigation";
import { useAuth } from "@/lib/AuthContext";
import { useImpersonation } from "@/lib/ImpersonationContext";
import * as LucideIcons from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { base44 } from "@/api/base44Client";
import { getSavedAccounts } from '@/lib/multiAccountUtils';

const SHORT_NAMES = {
  "Dashboard": "Home",
  "Properties": "Properties",
  "Clients": "Clients",
  "Viewings": "Viewings",
  "Offers": "Offers",
  "Counter Offers": "Counters",
  "CRM Leads": "Leads",
  "Tenancy Leases": "Leases",
  "Leases": "Leases",
  "Lease Renewals": "Renewals",
  "Renewals": "Renewals",
  "Maintenance": "Maintenance",
  "Maintenance Requests": "Maintenance",
  "Contractors": "Contractors",
  "Approved Contractors": "Contractors",
  "Reviews": "Reviews",
  "Contractor Reviews": "Reviews",
  "Trust Accounting": "Trust",
  "Firm Accounting": "Accounting",
  "Invoices": "Invoices",
  "Rent Payments": "Rent",
  "Commissions": "Commissions",
  "Front Desk": "Front Desk",
  "Item Register": "Items",
  "Custody Tracker": "Custody",
  "Procurement": "Procure",
  "Requisitions": "Requests",
  "Purchase Orders": "PO Orders",
  "Materials & Inventory": "Materials",
  "Engineering": "Engineers",
  "Drawings": "Drawings",
  "Projects": "Projects",
  "Project Operations": "Operations",
  "Project Collaboration": "Workspace",
  "Bill of Quantities": "BOQ",
  "Project Finance": "Proj Finance",
  "Smart Docs": "Docs",
  "E-Signatures": "E-Sign",
  "Client Portal": "Portal",
  "Audit Log": "Audit",
  "Live GPS": "GPS",
  "Human Resources": "HR",
  "Settings": "Settings",
  "Tasks": "Tasks",
  "Calendar": "Calendar",
  "Pipeline": "Pipeline",
  "Timeline": "Timeline",
  "Market Analytics": "Analytics"
};

// Priority tab paths by role
const ROLE_TABS = {
  marketing_executive: ['/real-estate/crm-leads', '/real-estate/clients', '/real-estate/viewings'],
  field_tracker: ['/real-estate/crm-leads', '/real-estate/clients', '/real-estate/viewings'],
  agent: ['/real-estate/crm-leads', '/real-estate/properties', '/real-estate/viewings'],
  accountant: ['/finance/accounting', '/invoices', '/real-estate/rent-payments'],
  finance: ['/finance/accounting', '/invoices', '/real-estate/rent-payments'],
  property_manager: ['/real-estate/properties', '/real-estate/leases', '/real-estate/maintenance'],
  lead_engineer: ['/engineering', '/engineering/drawings', '/jcl/projects'],
  site_supervisor: ['/engineering', '/jcl/project-operations', '/jcl/inventory'],
  quantity_surveyor: ['/boq', '/jcl/projects', '/jcl/project-finance'],
  procurement_officer: ['/jcl/procurement', '/jcl/requisitions', '/jcl/purchase-orders'],
  architect: ['/engineering/drawings', '/engineering', '/jcl/projects'],
  front_desk: ['/jcl/front-desk', '/jcl/item-register', '/real-estate/clients'],
  receptionist: ['/jcl/front-desk', '/jcl/item-register', '/real-estate/clients'],
  company_admin: ['/real-estate/properties', '/real-estate/crm-leads', '/finance/accounting'],
  admin: ['/real-estate/properties', '/real-estate/crm-leads', '/finance/accounting'],
  super_admin: ['/real-estate/properties', '/real-estate/crm-leads', '/finance/accounting']
};

export default function MobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, switchAccount } = useAuth();
  const { impersonatedCompany } = useImpersonation();
  const { navItems } = useNavigation(user, impersonatedCompany);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState([]);

  useEffect(() => {
    setSavedAccounts(getSavedAccounts());
  }, [user]);

  // Compute dynamic role-based 4 tabs: Home + 3 role-relevant items
  const { bottomNavItems, overflowItems } = useMemo(() => {
    const homeItem = navItems.find(i => i.path === '/') || { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' };
    
    // Items that must strictly live inside "More" and never on the bottom tabs
    const excludeFromBottom = ['/', '/real-estate/field-tracker', '/real-estate/analytics', '/settings', '/integrations', '/automations', '/portal'];
    
    const roleKey = (user?.role || 'agent').toLowerCase();
    const preferredPaths = ROLE_TABS[roleKey] || ROLE_TABS.agent;

    const chosenItems = [];
    
    // 1. Pick preferred role paths if present in navItems
    for (const p of preferredPaths) {
      const match = navItems.find(i => i.path === p);
      if (match && !chosenItems.some(c => c.path === match.path)) {
        chosenItems.push(match);
      }
      if (chosenItems.length === 3) break;
    }

    // 2. If fewer than 3, fill with first available valid navItems
    if (chosenItems.length < 3) {
      for (const item of navItems) {
        if (!excludeFromBottom.includes(item.path) && !chosenItems.some(c => c.path === item.path)) {
          chosenItems.push(item);
        }
        if (chosenItems.length === 3) break;
      }
    }

    const tabs = [homeItem, ...chosenItems];

    // Overflow items are all nav items not in the bottom tabs
    const overflow = navItems.filter(item => !tabs.some(tab => tab.path === item.path));

    // Ensure Integrations exists in overflow if not already present
    if (!overflow.some(i => i.path?.includes('/integrations'))) {
      overflow.push({ label: 'Integrations', path: '/integrations', icon: 'Blocks', section: 'System Admin' });
    }

    return { bottomNavItems: tabs, overflowItems: overflow };
  }, [navItems, user?.role]);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-2xl border-t border-black/5 dark:border-white/10 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around h-[54px] px-1 pt-1">
          {bottomNavItems.map((item) => {
            const isRootPath = ["/", "/admin"].includes(item.path);
            const isActive = location.pathname === item.path || (!isRootPath && item.path && location.pathname.startsWith(item.path));
            const IconComp = typeof item.icon === 'string' ? (LucideIcons[item.icon] || LucideIcons.LayoutDashboard) : (item.icon || LucideIcons.LayoutDashboard);
            const shortLabel = SHORT_NAMES[item.label] || item.label;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="relative flex flex-col items-center justify-center w-full h-full min-w-[60px] active:scale-95 transition-transform duration-100 ease-in-out"
              >
                <div className={cn("relative flex items-center justify-center mb-1 transition-colors duration-200", isActive ? "text-primary" : "text-[#8E8E93] dark:text-[#98989D]")}>
                  <IconComp className={cn("w-[21px] h-[21px] transition-transform duration-200", isActive ? "scale-110 drop-shadow-xs" : "")} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn("text-[10px] font-medium leading-none tracking-tight transition-colors duration-200 truncate px-0.5 text-center w-full", isActive ? "text-primary font-bold" : "text-[#8E8E93] dark:text-[#98989D]")}>
                  {t((shortLabel || '').toLowerCase().replace(/\s+/g, '_'), shortLabel)}
                </span>
              </Link>
            );
          })}

          {/* More Tab */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="relative flex flex-col items-center justify-center w-full h-full min-w-[60px] active:scale-95 transition-transform duration-100 ease-in-out"
          >
            <div className={cn("relative flex items-center justify-center mb-1 transition-colors duration-200", mobileMenuOpen ? "text-primary" : "text-[#8E8E93] dark:text-[#98989D]")}>
              <LucideIcons.MoreHorizontal className={cn("w-[21px] h-[21px] transition-transform duration-200", mobileMenuOpen ? "scale-110 drop-shadow-xs" : "")} strokeWidth={mobileMenuOpen ? 2.5 : 2} />
            </div>
            <span className={cn("text-[10px] font-medium leading-none tracking-tight transition-colors duration-200", mobileMenuOpen ? "text-primary font-bold" : "text-[#8E8E93] dark:text-[#98989D]")}>
              {t("more", "More")}
            </span>
          </button>
        </div>
      </nav>

      {/* Native Mobile Bottom Sheet for More Items */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[70] flex flex-col justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300" onClick={() => setMobileMenuOpen(false)} />

          {/* Sheet */}
          <div className="relative w-full rounded-t-[24px] max-h-[88vh] bg-[#F8F9FA] dark:bg-[#121824] transition-transform animate-in slide-in-from-bottom-full overflow-hidden flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border-t border-black/5 dark:border-white/10">

            {/* Drag Handle & Header */}
            <div className="flex flex-col items-center pt-3 pb-2.5 bg-white dark:bg-[#1A2234] border-b border-black/5 dark:border-white/5 shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C] mb-3" />
              <div className="w-full flex items-center justify-between px-4 pb-0.5">
                <div>
                  <h2 className="text-[17px] font-bold text-foreground tracking-[-0.3px]">All Features & Tools</h2>
                  <p className="text-[11px] text-muted-foreground font-medium">JCL Office Mobile Workspace</p>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#E5E5EA] dark:bg-[#2C3549] flex items-center justify-center text-[#8E8E93] hover:opacity-80 active:scale-95 transition-all"
                  aria-label="Close"
                >
                  <LucideIcons.X className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>

            {/* Native Scrollable List */}
            <div className="flex-1 overflow-y-auto px-3.5 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] -webkit-overflow-scrolling-touch space-y-4">
              
              {/* Feature Grid / List */}
              <div className="bg-white dark:bg-[#1A2234] rounded-2xl overflow-hidden divide-y divide-black/5 dark:divide-white/5 border border-black/5 dark:border-white/5 shadow-2xs">
                {overflowItems.map((item) => {
                  const isRootPath = ["/", "/admin"].includes(item.path);
                  const isActive = location.pathname === item.path || (!isRootPath && item.path && location.pathname.startsWith(item.path));
                  const IconComp = typeof item.icon === 'string' ? (LucideIcons[item.icon] || LucideIcons.LayoutDashboard) : (item.icon || LucideIcons.LayoutDashboard);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3.5 px-4 py-3.5 transition-colors active:bg-black/5 dark:active:bg-white/5",
                        isActive ? "bg-primary/5 dark:bg-primary/10" : "bg-transparent"
                      )}
                    >
                      <div className={cn(
                        "w-[34px] h-[34px] rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        isActive ? "bg-primary text-white shadow-xs" : "bg-[#F2F2F7] dark:bg-[#242E44] text-primary"
                      )}>
                        <IconComp className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        {item.section && (
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none mb-0.5">
                            {item.section}
                          </span>
                        )}
                        <span className={cn(
                          "text-[15px] tracking-[-0.2px] truncate",
                          isActive ? "text-primary font-bold" : "text-foreground font-medium"
                        )}>
                          {item.label}
                        </span>
                      </div>
                      <LucideIcons.ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0" strokeWidth={2.2} />
                    </Link>
                  );
                })}
              </div>

              {/* Preferences & Quick Controls */}
              <div className="bg-white dark:bg-[#1A2234] rounded-2xl overflow-hidden divide-y divide-black/5 dark:divide-white/5 border border-black/5 dark:border-white/5 shadow-2xs">
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-[34px] h-[34px] rounded-xl bg-[#F2F2F7] dark:bg-[#242E44] flex items-center justify-center text-foreground">
                      <LucideIcons.Moon className="w-4 h-4" />
                    </div>
                    <span className="text-[15px] font-medium text-foreground">Appearance</span>
                  </div>
                  <ThemeToggle />
                </div>

                {/* Workspace Switcher */}
                {user?.available_companies?.length > 1 && (
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-[34px] h-[34px] rounded-xl bg-[#F2F2F7] dark:bg-[#242E44] flex items-center justify-center text-foreground">
                        <LucideIcons.Layers className="w-4 h-4" />
                      </div>
                      <span className="text-[15px] font-medium text-foreground">Workspace</span>
                    </div>
                    <select
                      value={user.company_id}
                      onChange={async (e) => {
                        const targetId = e.target.value;
                        if (!targetId || targetId === user.company_id) return;
                        await base44.auth.updateProfile({ company_id: targetId });
                        if (isDesktopApp()) {
                          navigate('/');
                          setTimeout(() => window.location.reload(), 100);
                        } else {
                          window.location.href = '/';
                        }
                      }}
                      className="bg-transparent border-0 text-muted-foreground text-[14px] font-medium outline-none max-w-[150px] truncate text-right cursor-pointer"
                    >
                      {user.available_companies.map(comp => (
                        <option key={comp.id} value={comp.id}>{comp.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Account Switcher */}
                {savedAccounts.length > 1 && (
                  <div className="flex flex-col">
                    <div className="px-4 py-2 bg-black/[0.02] dark:bg-white/[0.02]">
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Switch Account</span>
                    </div>
                    {savedAccounts.filter(acc => acc.id !== user?.id).map(acc => (
                      <button
                        key={acc.id}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          switchAccount(acc.id);
                        }}
                        className="flex items-center gap-3 px-4 py-3 bg-transparent active:bg-black/5 dark:active:bg-white/5 transition-colors border-t border-black/5 dark:border-white/5 w-full text-left"
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
                          <span className="text-[14px] text-foreground font-medium truncate">{acc.full_name || 'User'}</span>
                          <span className="text-[12px] text-muted-foreground truncate">{acc.email}</span>
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('/login?prompt=login');
                      }}
                      className="flex items-center gap-3 px-4 py-3 bg-transparent active:bg-black/5 dark:active:bg-white/5 transition-colors w-full text-left border-t border-black/5 dark:border-white/5"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <LucideIcons.Plus className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-[14px] text-primary font-medium flex-1">Add another account</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
