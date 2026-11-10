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
  "CRM Leads": "CRM",
  "CRM": "CRM",
  "Leads": "CRM",
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
  "Custody Tracker": "Assets",
  "Asset Taking Register": "Assets",
  "Asset Custody Register": "Assets",
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
  lead_engineer: ['/engineering/drawings', '/jcl/projects', '/jcl/project-operations'],
  site_supervisor: ['/engineering/drawings', '/jcl/project-operations', '/jcl/inventory'],
  quantity_surveyor: ['/boq', '/jcl/projects', '/jcl/project-finance'],
  procurement_officer: ['/jcl/requisitions', '/jcl/purchase-orders', '/jcl/inventory'],
  architect: ['/engineering/drawings', '/jcl/projects', '/boq'],
  front_desk: ['/jcl/front-desk', '/jcl/item-register', '/real-estate/clients'],
  receptionist: ['/jcl/front-desk', '/jcl/item-register', '/real-estate/clients'],
  company_admin: ['/real-estate/properties', '/real-estate/crm-leads', '/finance/accounting'],
  admin: ['/real-estate/properties', '/real-estate/crm-leads', '/finance/accounting'],
  super_admin: ['/real-estate/properties', '/real-estate/crm-leads', '/finance/accounting'],
  general_manager: ['/', '/hr', '/finance/accounting', '/real-estate/clients']
};

// Category order matching JCL workflow
const CATEGORY_ORDER = [
  'Operations',
  'Secretary',
  'Marketing',
  'Procurement',
  'Engineering',
  'Properties',
  'Finance',
  'Human Resources',
  'System Admin'
];

// Department classification mapping for JCL
const getJCLCategory = (item) => {
  const p = (item.path || '').split('?')[0];
  const normalizedLabel = (item.label || '').trim().toLowerCase();

  // Secretary
  if (['/jcl/front-desk', '/jcl/item-register'].includes(p) ||
      ['front desk', 'item register'].includes(normalizedLabel)) {
    return 'Secretary';
  }

  // Asset Taking / Custody Register is shared between Secretary and Human Resources
  if (p === '/jcl/employee-assets' || ['asset taking register', 'asset custody register', 'custody tracker', 'employee custody', 'company assets'].includes(normalizedLabel)) {
    if (item.section === 'Human Resources' || normalizedLabel.includes('(hr)')) {
      return 'Human Resources';
    }
    return 'Secretary';
  }

  // Marketing
  if (['/real-estate/crm-leads', '/real-estate/clients', '/real-estate/viewings', '/real-estate/offers',
       '/real-estate/counter-offers', '/jcl/engagements', '/real-estate/customer-timeline', '/real-estate/analytics'].includes(p) ||
      p.startsWith('/real-estate/crm') ||
      ['crm leads', 'leads', 'clients', 'viewings', 'offers', 'counter offers', 'counters', 'engagement', 'engagements & projects', 'timeline', 'market analytics', 'analytics'].includes(normalizedLabel)) {
    return 'Marketing';
  }

  // Procurement
  if (['/jcl/procurement', '/jcl/requisitions', '/jcl/purchase-orders', '/jcl/inventory'].includes(p) ||
      p.startsWith('/procurement') ||
      ['procurement', 'requisitions', 'purchase orders', 'materials & inventory', 'materials', 'suppliers'].includes(normalizedLabel)) {
    return 'Procurement';
  }

  // Engineering
  if (['/engineering', '/engineering/drawings', '/jcl/projects', '/jcl/project-operations', '/jcl/project-collaboration', '/boq'].includes(p) ||
      ['engineering', 'drawings', 'projects', 'project operations', 'project collaboration', 'bill of quantities', 'boq'].includes(normalizedLabel)) {
    return 'Engineering';
  }

  // Properties
  if (['/real-estate/properties', '/real-estate/land', '/real-estate/leases', '/real-estate/lease-renewals',
       '/real-estate/maintenance', '/real-estate/contractors', '/real-estate/contractor-reviews'].includes(p) ||
      p.startsWith('/real-estate/land') ||
      ['properties', 'land parcels', 'leases', 'renewals', 'maintenance', 'contractors', 'reviews', 'contractor reviews'].includes(normalizedLabel)) {
    return 'Properties';
  }

  // Finance
  if (['/finance/accounting', '/invoices', '/real-estate/rent-payments', '/real-estate/payment-schedules',
       '/real-estate/commissions', '/jcl/project-finance', '/real-estate/trust-accounting'].includes(p) ||
      p.startsWith('/finance/accounting') || p.startsWith('/real-estate/rent-payments') ||
      ['firm accounting', 'accounting', 'invoices', 'rent payments', 'payment schedules', 'commissions', 'project finance', 'trust accounting'].includes(normalizedLabel)) {
    return 'Finance';
  }

  // Human Resources
  if (['/hr', '/team', '/employees', '/hr/assets'].includes(p) ||
      ['human resources', 'hr', 'hr & leave', 'team', 'employees', 'staff', 'custody tracker (hr)', 'assets (hr)'].includes(normalizedLabel)) {
    return 'Human Resources';
  }

  // System Admin (strictly system admin items)
  if (['/portal', '/client-portal', '/real-estate/audit-log', '/real-estate/field-tracker',
       '/integrations', '/settings', '/admin', '/firm-setup'].includes(p) ||
      ['client portal', 'portal', 'audit log', 'live gps', 'field tracker', 'integrations', 'settings', 'firm setup'].includes(normalizedLabel)) {
    return 'System Admin';
  }

  // Operations (Dashboard, Intelligence, Calendar, Tasks, Time Tracker, Pipeline, Smart Docs, E-Signatures, Notifications)
  if (['/', '/intelligence', '/calendar', '/tasks', '/time-tracking', '/pipeline', '/smart-docs', '/real-estate/e-signatures', '/notifications'].includes(p) ||
      ['dashboard', 'home', 'intelligence', 'calendar', 'tasks', 'time tracking', 'time tracker', 'pipeline', 'smart docs', 'docs', 'e-signatures', 'signatures', 'notifications'].includes(normalizedLabel)) {
    return 'Operations';
  }

  // Fallback to item.section if defined and valid, else Operations
  if (item.section && CATEGORY_ORDER.includes(item.section)) {
    return item.section;
  }

  return 'Operations';
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
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (sec) => {
    setExpandedSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

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

    // Group overflow items by section using the exact JCL department classification
    const grouped = {};
    for (const item of overflow) {
      // Exclude marketplace or unconfigured items if any leaked through
      if (item.path === '/marketplace' || item.path === '/slate/BOLT') continue;

      const section = getJCLCategory(item);

      // In the Finance section on the mobile More menu, only show Finance (opens the full Finance Suite)
      if (section === 'Finance') {
        const p = (item.path || '').toLowerCase();
        const l = (item.label || '').toLowerCase();
        if (p !== '/finance' && l !== 'finance') {
          continue;
        }
      }

      // User requested: remove redundant "Procurement" button from the mobile More menu (keep Requisitions, Purchase Orders, Materials)
      if (section === 'Procurement') {
        const p = (item.path || '').toLowerCase();
        const l = (item.label || '').toLowerCase().trim();
        if (p === '/jcl/procurement' || l === 'procurement') {
          continue;
        }
      }

      // User requested: remove redundant "Engineering" button from the mobile More menu (keep Drawings, Projects, Operations, BOQ)
      if (section === 'Engineering') {
        const p = (item.path || '').toLowerCase();
        const l = (item.label || '').toLowerCase().trim();
        if (p === '/engineering' || l === 'engineering') {
          continue;
        }
      }

      if (!grouped[section]) grouped[section] = [];
      // Deduplicate items with identical paths or labels within the section
      if (!grouped[section].some(existing => existing.path === item.path || existing.label?.toLowerCase() === item.label?.toLowerCase())) {
        grouped[section].push(item);
      }
    }

    // Ensure Marketing always includes CRM Leads in More sheet
    if (!grouped['Marketing']) grouped['Marketing'] = [];
    if (!grouped['Marketing'].some(i => i.path === '/real-estate/crm-leads')) {
      grouped['Marketing'].unshift({ label: 'CRM Leads', path: '/real-estate/crm-leads', icon: 'Target', section: 'Marketing' });
    } else {
      // Ensure the label clearly says CRM Leads
      const item = grouped['Marketing'].find(i => i.path === '/real-estate/crm-leads');
      if (item) item.label = 'CRM Leads';
    }

    // Ensure Engineering includes all core operational sub-modules
    if (!grouped['Engineering']) grouped['Engineering'] = [];
    if (!grouped['Engineering'].some(i => i.path === '/engineering/drawings')) {
      grouped['Engineering'].push({ label: 'Drawings', path: '/engineering/drawings', icon: 'Layers', section: 'Engineering' });
    }
    if (!grouped['Engineering'].some(i => i.path === '/jcl/projects')) {
      grouped['Engineering'].push({ label: 'Projects', path: '/jcl/projects', icon: 'BriefcaseBusiness', section: 'Engineering' });
    }
    if (!grouped['Engineering'].some(i => i.path === '/jcl/project-operations')) {
      grouped['Engineering'].push({ label: 'Project Operations', path: '/jcl/project-operations', icon: 'Briefcase', section: 'Engineering' });
    }
    if (!grouped['Engineering'].some(i => i.path === '/jcl/project-collaboration')) {
      grouped['Engineering'].push({ label: 'Project Collaboration', path: '/jcl/project-collaboration', icon: 'MessageCircle', section: 'Engineering' });
    }
    if (!grouped['Engineering'].some(i => i.path === '/boq')) {
      grouped['Engineering'].push({ label: 'Bill of Quantities', path: '/boq', icon: 'Calculator', section: 'Engineering' });
    }

    // Ensure Procurement includes Requisitions & Purchase Orders
    if (!grouped['Procurement']) grouped['Procurement'] = [];
    if (!grouped['Procurement'].some(i => i.path === '/jcl/requisitions')) {
      grouped['Procurement'].unshift({ label: 'Requisitions', path: '/jcl/requisitions', icon: 'ClipboardList', section: 'Procurement' });
    }
    if (!grouped['Procurement'].some(i => i.path === '/jcl/purchase-orders')) {
      grouped['Procurement'].push({ label: 'Purchase Orders', path: '/jcl/purchase-orders', icon: 'FileText', section: 'Procurement' });
    }
    if (!grouped['Procurement'].some(i => i.path === '/jcl/inventory')) {
      grouped['Procurement'].push({ label: 'Materials & Inventory', path: '/jcl/inventory', icon: 'Package', section: 'Procurement' });
    }

    // Ensure Operations puts Notifications strictly last (after E-Signatures)
    if (grouped['Operations']) {
      const opsOrder = [
        '/',
        '/intelligence',
        '/calendar',
        '/tasks',
        '/time-tracking',
        '/pipeline',
        '/smart-docs',
        '/real-estate/e-signatures',
        '/notifications'
      ];
      grouped['Operations'].sort((a, b) => {
        const idxA = opsOrder.indexOf(a.path);
        const idxB = opsOrder.indexOf(b.path);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        // If not matched, notifications must always be last
        if (a.path === '/notifications' || a.label?.toLowerCase() === 'notifications') return 1;
        if (b.path === '/notifications' || b.label?.toLowerCase() === 'notifications') return -1;
        return 0;
      });
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
      <nav style={{ backgroundColor: "#005A9C", color: "#ffffff" }} className="md:hidden fixed bottom-0 left-0 right-0 z-[60] border-t border-white/15 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.25)]">
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
          <div className="relative w-full rounded-t-[26px] max-h-[88vh] bg-background text-foreground transition-transform animate-in slide-in-from-bottom-full overflow-hidden flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-border">

            {/* Drag Handle & Header */}
            <div className="flex flex-col items-center pt-3 pb-2.5 bg-muted/40 border-b border-border/80 shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-white/20 mb-3" />
              <div className="w-full flex items-center justify-between px-4 pb-0.5">
                <div>
                  <h2 className="text-[17px] font-bold text-foreground tracking-[-0.3px]">All Features & Departments</h2>
                  <p className="text-[11px] text-muted-foreground font-medium">JCL Office Mobile Workspace</p>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:opacity-80 active:scale-95 transition-all"
                  aria-label="Close"
                >
                  <LucideIcons.X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Categorized Scrollable List */}
            <div className="flex-1 overflow-y-auto px-3.5 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] -webkit-overflow-scrolling-touch space-y-4">
              
              {categorizedOverflow.map((group) => {
                const isExpanded = !!expandedSections[group.section];
                const hasActive = group.items.some(i => location.pathname === i.path || (i.path !== "/" && location.pathname.startsWith(i.path)));

                return (
                  <div key={group.section} className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs transition-all">
                    {/* Expandable Category Header */}
                    <button
                      onClick={() => toggleSection(group.section)}
                      className="w-full flex items-center justify-between px-4 py-3 active:bg-muted/50 transition-colors text-left select-none"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={cn("text-xs font-bold uppercase tracking-wider", hasActive ? "text-primary" : "text-foreground")}>
                          {group.section}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-medium">
                          ({group.items.length})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasActive && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                        <LucideIcons.ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")} />
                      </div>
                    </button>

                    {/* Collapsible Child Links */}
                    {isExpanded && (
                      <div className="divide-y divide-border/60 border-t border-border/80 bg-muted/15 animate-in fade-in duration-150">
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
                                "flex items-center gap-3.5 px-4 py-3.5 text-sm transition-all duration-150 active:bg-muted/60 pl-5 min-h-[48px]",
                                isActive ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-muted/30 font-medium"
                              )}
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 shadow-xs",
                                isActive ? "bg-primary text-white" : "bg-card border border-border text-primary"
                              )}>
                                <IconComp className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
                              </div>
                              <span className="flex-1 truncate text-[13.5px] leading-tight">
                                {item.label}
                              </span>
                              <LucideIcons.ChevronRight className={cn("w-4 h-4 shrink-0 transition-transform", isActive ? "text-primary translate-x-0.5" : "text-muted-foreground/40")} />
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Preferences & Quick Controls (Appearance, Workspace, Account) */}
              <div className="space-y-1.5 pt-2">
                <div className="px-2 pt-1 flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    Preferences & Accounts
                  </span>
                  <div className="flex-1 h-[0.5px] bg-muted" />
                </div>

                <div className="bg-card rounded-2xl overflow-hidden divide-y divide-border/60 border border-border shadow-xs">
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-[34px] h-[34px] rounded-xl bg-muted flex items-center justify-center text-foreground">
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
                        <div className="w-[34px] h-[34px] rounded-xl bg-muted flex items-center justify-center text-foreground">
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
                        className="bg-transparent border-0 text-foreground/80 text-[14px] font-medium outline-none max-w-[150px] truncate text-right cursor-pointer"
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
                      <div className="px-4 py-2 bg-muted/50">
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Switch Account</span>
                      </div>
                      {savedAccounts.filter(acc => acc.id !== user?.id).map(acc => (
                        <button
                          key={acc.id}
                          onClick={() => {
                            setMobileMenuOpen(false);
                            switchAccount(acc.id);
                          }}
                          className="flex items-center gap-3 px-4 py-3 bg-transparent active:bg-muted/50 transition-colors border-t border-white/5 w-full text-left"
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
                        className="flex items-center gap-3 px-4 py-3 bg-transparent active:bg-muted/50 transition-colors w-full text-left border-t border-white/5"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#005A9C] flex items-center justify-center shrink-0">
                          <LucideIcons.Plus className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[14px] text-foreground font-medium flex-1">Add another account</span>
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
