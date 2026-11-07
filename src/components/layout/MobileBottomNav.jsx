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
  "Contractors": "Contractors",
  "Reviews": "Reviews",
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

// Category order matching JCL workflow
const CATEGORY_ORDER = [
  'Operations',
  'Marketing',
  'Secretary',
  'Properties',
  'Procurement',
  'Engineering',
  'Finance',
  'Documents',
  'System Admin',
  'Human Resources'
];

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
  const { bottomNavItems, categorizedOverflow } = useMemo(() => {
    const homeItem = navItems.find(i => i.path === '/') || { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' };
    
    // Items that must strictly live inside "More" and never on the bottom tabs
    const excludeFromBottom = ['/', '/real-estate/field-tracker', '/real-estate/analytics', '/settings', '/integrations', '/automations', '/portal'];
    
    const roleKey = (user?.role || 'agent').toLowerCase();
    const preferredPaths = ROLE_TABS[roleKey] || ROLE_TABS.agent;

    const chosenItems = [];
    
    // Pick preferred role paths if present in navItems
    for (const p of preferredPaths) {
      const match = navItems.find(i => i.path === p);
      if (match && !chosenItems.some(c => c.path === match.path)) {
        chosenItems.push(match);
      }
      if (chosenItems.length === 3) break;
    }

    // Fill remaining up to 3
    if (chosenItems.length < 3) {
      for (const item of navItems) {
        if (!excludeFromBottom.includes(item.path) && !chosenItems.some(c => c.path === item.path)) {
          chosenItems.push(item);
        }
        if (chosenItems.length === 3) break;
      }
    }

    const tabs = [homeItem, ...chosenItems];

    // Build categorized items for "More" bottom sheet
    const overflow = navItems.filter(item => !tabs.some(tab => tab.path === item.path));

    // Ensure Integrations is present
    if (!overflow.some(i => i.path?.includes('/integrations'))) {
      overflow.push({ label: 'Integrations', path: '/integrations', icon: 'Blocks', section: 'System Admin' });
    }

    // Group overflow items by section
    const grouped = {};
    for (const item of overflow) {
      const section = item.section || 'General';
      if (!grouped[section]) grouped[section] = [];
      grouped[section].push(item);
    }

    // Sort categories according to CATEGORY_ORDER
    const orderedSections = Object.keys(grouped).sort((a, b) => {
      const idxA = CATEGORY_ORDER.indexOf(a);
      const idxB = CATEGORY_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return {
      bottomNavItems: tabs,
      categorizedOverflow: orderedSections.map(sec => ({
        section: sec,
        items: grouped[sec]
      }))
    };
  }, [navItems, user?.role]);

  return (
    <>
      {/* ── NATIVE MOBILE BOTTOM BAR (Deep Teal & JCL Brand Style) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-[#005A9C] dark:bg-[#0B1418] border-t border-white/10 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.2)]">
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
                <div className={cn("relative flex items-center justify-center mb-1 transition-colors duration-200", isActive ? "text-[#FF6B00]" : "text-white/70")}>
                  <IconComp className={cn("w-[21px] h-[21px] transition-transform duration-200", isActive ? "scale-110 drop-shadow-md text-[#FF6B00]" : "")} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn("text-[10px] leading-none tracking-tight transition-colors duration-200 truncate px-0.5 text-center w-full", isActive ? "text-[#FF6B00] font-bold" : "text-white/70 font-medium")}>
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
            <div className={cn("relative flex items-center justify-center mb-1 transition-colors duration-200", mobileMenuOpen ? "text-[#FF6B00]" : "text-white/70")}>
              <LucideIcons.MoreHorizontal className={cn("w-[21px] h-[21px] transition-transform duration-200", mobileMenuOpen ? "scale-110 drop-shadow-md text-[#FF6B00]" : "")} strokeWidth={mobileMenuOpen ? 2.5 : 2} />
            </div>
            <span className={cn("text-[10px] leading-none tracking-tight transition-colors duration-200", mobileMenuOpen ? "text-[#FF6B00] font-bold" : "text-white/70 font-medium")}>
              {t("more", "More")}
            </span>
          </button>
        </div>
      </nav>

      {/* ── NATIVE CATEGORIZED BOTTOM SHEET FOR MORE ITEMS ── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[70] flex flex-col justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300" onClick={() => setMobileMenuOpen(false)} />

          {/* Sheet */}
          <div className="relative w-full rounded-t-[26px] max-h-[88vh] bg-[#0B1418] text-white transition-transform animate-in slide-in-from-bottom-full overflow-hidden flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10">

            {/* Drag Handle & Header */}
            <div className="flex flex-col items-center pt-3 pb-2.5 bg-[#091114] border-b border-white/10 shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-white/20 mb-3" />
              <div className="w-full flex items-center justify-between px-4 pb-0.5">
                <div>
                  <h2 className="text-[17px] font-bold text-white tracking-[-0.3px]">All Features & Departments</h2>
                  <p className="text-[11px] text-white/60 font-medium">JCL Office Mobile Workspace</p>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:opacity-80 active:scale-95 transition-all"
                  aria-label="Close"
                >
                  <LucideIcons.X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Categorized Scrollable List */}
            <div className="flex-1 overflow-y-auto px-3.5 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] -webkit-overflow-scrolling-touch space-y-4">
              
              {categorizedOverflow.map((group) => (
                <div key={group.section} className="space-y-1.5">
                  {/* Category Header */}
                  <div className="px-2 pt-1 flex items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#FF6B00]">
                      {group.section}
                    </span>
                    <div className="flex-1 h-[0.5px] bg-white/10" />
                  </div>

                  {/* Category Items Card */}
                  <div className="bg-[#101D22] rounded-2xl overflow-hidden divide-y divide-white/5 border border-white/10 shadow-md">
                    {group.items.map((item) => {
                      const isRootPath = ["/", "/admin"].includes(item.path);
                      const isActive = location.pathname === item.path || (!isRootPath && item.path && location.pathname.startsWith(item.path));
                      const IconComp = typeof item.icon === 'string' ? (LucideIcons[item.icon] || LucideIcons.LayoutDashboard) : (item.icon || LucideIcons.LayoutDashboard);

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3.5 px-4 py-3.5 transition-colors active:bg-white/5",
                            isActive ? "bg-[#005A9C]/25 text-[#FF6B00]" : "bg-transparent text-white"
                          )}
                        >
                          <div className={cn(
                            "w-[34px] h-[34px] rounded-xl flex items-center justify-center shrink-0 transition-colors",
                            isActive ? "bg-[#FF6B00] text-white shadow-md" : "bg-white/10 text-[#00A3FF]"
                          )}>
                            <IconComp className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
                          </div>
                          <span className={cn(
                            "flex-1 text-[15px] tracking-[-0.2px] truncate",
                            isActive ? "text-[#FF6B00] font-bold" : "text-white font-medium"
                          )}>
                            {item.label}
                          </span>
                          <LucideIcons.ChevronRight className="w-4 h-4 text-white/40 shrink-0" strokeWidth={2.2} />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Preferences & Quick Controls (Appearance, Workspace, Account) */}
              <div className="space-y-1.5 pt-2">
                <div className="px-2 pt-1 flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/60">
                    Preferences & Accounts
                  </span>
                  <div className="flex-1 h-[0.5px] bg-white/10" />
                </div>

                <div className="bg-[#101D22] rounded-2xl overflow-hidden divide-y divide-white/5 border border-white/10 shadow-md">
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-[34px] h-[34px] rounded-xl bg-white/10 flex items-center justify-center text-white">
                        <LucideIcons.Moon className="w-4 h-4" />
                      </div>
                      <span className="text-[15px] font-medium text-white">Appearance</span>
                    </div>
                    <ThemeToggle />
                  </div>

                  {/* Workspace Switcher */}
                  {user?.available_companies?.length > 1 && (
                    <div className="flex items-center justify-between px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-[34px] h-[34px] rounded-xl bg-white/10 flex items-center justify-center text-white">
                          <LucideIcons.Layers className="w-4 h-4" />
                        </div>
                        <span className="text-[15px] font-medium text-white">Workspace</span>
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
                        className="bg-transparent border-0 text-white/80 text-[14px] font-medium outline-none max-w-[150px] truncate text-right cursor-pointer"
                      >
                        {user.available_companies.map(comp => (
                          <option key={comp.id} value={comp.id} className="bg-[#101D22] text-white">{comp.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Account Switcher */}
                  {savedAccounts.length > 1 && (
                    <div className="flex flex-col">
                      <div className="px-4 py-2 bg-white/5">
                        <span className="text-[11px] uppercase tracking-wider text-white/60 font-bold">Switch Account</span>
                      </div>
                      {savedAccounts.filter(acc => acc.id !== user?.id).map(acc => (
                        <button
                          key={acc.id}
                          onClick={() => {
                            setMobileMenuOpen(false);
                            switchAccount(acc.id);
                          }}
                          className="flex items-center gap-3 px-4 py-3 bg-transparent active:bg-white/5 transition-colors border-t border-white/5 w-full text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center overflow-hidden shrink-0">
                            {acc.avatar_url ? (
                              <img src={acc.avatar_url} alt={acc.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[12px] font-bold text-white">
                                {acc.full_name ? acc.full_name[0].toUpperCase() : <LucideIcons.User className="w-4 h-4"/>}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[14px] text-white font-medium truncate">{acc.full_name || 'User'}</span>
                            <span className="text-[12px] text-white/60 truncate">{acc.email}</span>
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          navigate('/login?prompt=login');
                        }}
                        className="flex items-center gap-3 px-4 py-3 bg-transparent active:bg-white/5 transition-colors w-full text-left border-t border-white/5"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#005A9C] flex items-center justify-center shrink-0">
                          <LucideIcons.Plus className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[14px] text-white font-medium flex-1">Add another account</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
