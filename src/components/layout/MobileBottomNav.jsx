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
  "Firm Accounting": "Firm Accounting",
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
  "Human Resources": "HR",
  "Live GPS": "Live GPS",
  "Field GPS": "Field GPS",
  "Front Desk": "Front Desk",
  "Guest Requests": "Requests",
  "Guests": "Guests",
  "Procurement": "Procurement",
  "Purchase Orders": "PO Orders",
  "Suppliers": "Suppliers",
  "Workspace Settings": "Settings",
  "Integrations Hub": "Integrations",
  "Automations Engine": "Automations"
};

// Department Category Definitions aligned with JCL Two-Panel Sidebar
const JCL_DEPT_CATEGORIES = [
  {
    id: "overview",
    title: "Overview & Intelligence",
    icon: LucideIcons.LayoutDashboard,
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    explicitItems: [
      { label: "Dashboard", path: "/", icon: LucideIcons.LayoutDashboard },
      { label: "Live GPS", path: "/real-estate/field-tracker", icon: LucideIcons.MapPin },
      { label: "Customer Timeline", path: "/real-estate/customer-timeline", icon: LucideIcons.Clock },
      { label: "Market Data", path: "/real-estate/market-data", icon: LucideIcons.Globe },
      { label: "Analytics & Insights", path: "/real-estate/analytics", icon: LucideIcons.LineChart }
    ]
  },
  {
    id: "sales",
    title: "Sales & CRM",
    icon: LucideIcons.Sparkles,
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    explicitItems: [
      { label: "CRM Leads", path: "/real-estate/crm-leads", icon: LucideIcons.Sparkles },
      { label: "Clients Directory", path: "/real-estate/clients", icon: LucideIcons.Users },
      { label: "Tours & Viewings", path: "/real-estate/viewings", icon: LucideIcons.Eye },
      { label: "Purchase Offers", path: "/real-estate/offers", icon: LucideIcons.FileText },
      { label: "Counter Offers", path: "/real-estate/counter-offers", icon: LucideIcons.MessageCircle },
      { label: "Deals & Transactions", path: "/real-estate/transactions", icon: LucideIcons.Banknote },
      { label: "Field GPS", path: "/real-estate/marketer-tracker", icon: LucideIcons.MapPin }
    ]
  },
  {
    id: "properties",
    title: "Land & Properties",
    icon: LucideIcons.Home,
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    explicitItems: [
      { label: "Land Parcels", path: "/real-estate/land", icon: LucideIcons.Compass },
      { label: "Properties Portfolio", path: "/real-estate/properties", icon: LucideIcons.Home },
      { label: "Leases & Contracts", path: "/real-estate/leases", icon: LucideIcons.FileCheck },
      { label: "Lease Renewals", path: "/real-estate/lease-renewals", icon: LucideIcons.RotateCcw }
    ]
  },
  {
    id: "frontdesk",
    title: "Front Desk & Reception",
    icon: LucideIcons.Building2,
    badgeColor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    explicitItems: [
      { label: "Front Desk", path: "/front-desk", icon: LucideIcons.Building2 },
      { label: "Guest Requests", path: "/guest-requests", icon: LucideIcons.Bell },
      { label: "Guests Directory", path: "/guests", icon: LucideIcons.Users }
    ]
  },
  {
    id: "procurement",
    title: "Procurement & Inventory",
    icon: LucideIcons.ShoppingBag,
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    explicitItems: [
      { label: "Procurement Hub", path: "/procurement", icon: LucideIcons.ShoppingBag },
      { label: "Purchase Orders", path: "/purchase-orders", icon: LucideIcons.FileText },
      { label: "Suppliers Directory", path: "/suppliers", icon: LucideIcons.Truck }
    ]
  },
  {
    id: "facilities",
    title: "Facilities & Maintenance",
    icon: LucideIcons.Wrench,
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    explicitItems: [
      { label: "Maintenance Tickets", path: "/real-estate/maintenance", icon: LucideIcons.Wrench },
      { label: "Approved Contractors", path: "/real-estate/contractors", icon: LucideIcons.Users2 },
      { label: "Contractor Reviews", path: "/real-estate/contractor-reviews", icon: LucideIcons.Star }
    ]
  },
  {
    id: "finance",
    title: "Finance & Accounting",
    icon: LucideIcons.Wallet,
    badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    explicitItems: [
      { label: "Trust Accounting", path: "/real-estate/trust-accounting", icon: LucideIcons.Wallet },
      { label: "Firm Accounting", path: "/finance/accounting", icon: LucideIcons.Landmark },
      { label: "Escrow Accounts", path: "/real-estate/escrow", icon: LucideIcons.Lock },
      { label: "Rent Payments", path: "/real-estate/rent-payments", icon: LucideIcons.CreditCard },
      { label: "Payment Schedules", path: "/real-estate/payment-schedules", icon: LucideIcons.Calendar },
      { label: "Agent Commissions", path: "/real-estate/commissions", icon: LucideIcons.TrendingUp },
      { label: "Commission Rules", path: "/real-estate/commission-rules", icon: LucideIcons.Settings }
    ]
  },
  {
    id: "projects",
    title: "Projects & Engineering",
    icon: LucideIcons.Briefcase,
    badgeColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    explicitItems: [
      { label: "Projects & Tasks", path: "/tasks", icon: LucideIcons.Briefcase },
      { label: "HR & Team Roster", path: "/hr", icon: LucideIcons.HeartHandshake },
      { label: "Civil Engineering & QS", path: "/real-estate/team-management", icon: LucideIcons.UserCheck }
    ]
  },
  {
    id: "governance",
    title: "Docs & Governance",
    icon: LucideIcons.FileText,
    badgeColor: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    explicitItems: [
      { label: "Smart Docs", path: "/smart-docs", icon: LucideIcons.FileText },
      { label: "E-Signatures Hub", path: "/real-estate/e-signatures", icon: LucideIcons.PenTool },
      { label: "Executive Reports", path: "/reports", icon: LucideIcons.ClipboardList },
      { label: "Audit & Compliance Log", path: "/real-estate/audit-log", icon: LucideIcons.ShieldCheck }
    ]
  },
  {
    id: "settings",
    title: "Settings & System",
    icon: LucideIcons.Settings,
    badgeColor: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    explicitItems: [
      { label: "Workspace Settings", path: "/settings", icon: LucideIcons.Settings },
      { label: "Integrations Hub", path: "/integrations", icon: LucideIcons.Blocks },
      { label: "Automations Engine", path: "/automations", icon: LucideIcons.Zap }
    ]
  }
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
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    setSavedAccounts(getSavedAccounts());
  }, [user]);

  // We want to show exactly 4 items in the bottom nav + 1 "More" button
  const bottomNavItems = navItems.slice(0, 4);

  // Filter out removed modules (Marketplace, BOLT, Firm Setup)
  const isExcludedItem = (item) => {
    const p = (item.path || '').toLowerCase();
    const l = (item.label || '').toLowerCase();
    return p.includes('marketplace') || p.includes('bolt') || l.includes('marketplace') || l.includes('bolt');
  };

  // Group items by our official departments
  const categorizedGroups = useMemo(() => {
    return JCL_DEPT_CATEGORIES.map(cat => ({
      ...cat,
      items: cat.explicitItems.filter(i => !isExcludedItem(i))
    }));
  }, []);

  // Auto-expand category that contains the current active route
  useEffect(() => {
    if (mobileMenuOpen) {
      const activeCat = categorizedGroups.find(g => 
        g.items.some(i => location.pathname === i.path || (i.path !== "/" && location.pathname.startsWith(i.path)))
      );
      if (activeCat) {
        setExpandedCategories(prev => ({
          ...prev,
          [activeCat.id]: true
        }));
      }
    }
  }, [mobileMenuOpen, location.pathname, categorizedGroups]);

  const toggleCategory = (catId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-background/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)] transition-colors duration-200">
        <div className="flex items-center justify-around h-[56px] px-2 pt-1">
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
                className="relative flex flex-col items-center justify-center w-full h-full min-w-[56px] active:scale-95 transition-transform duration-100 ease-in-out"
              >
                <div className={cn("relative flex items-center justify-center mb-0.5 transition-colors duration-200", isActive ? "text-primary" : "text-muted-foreground")}>
                  <IconComp className={cn("w-5 h-5 transition-transform duration-200", isActive ? "scale-110 drop-shadow-sm" : "")} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn("text-[10px] font-medium leading-none tracking-tight transition-colors duration-200 truncate px-1 text-center w-full", isActive ? "text-primary font-semibold" : "text-muted-foreground")}>
                  {t((shortLabel || '').toLowerCase().replace(/\s+/g, '_'), shortLabel)}
                </span>
              </Link>
            );
          })}

          {/* More Tab Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="relative flex flex-col items-center justify-center w-full h-full min-w-[56px] active:scale-95 transition-transform duration-100 ease-in-out cursor-pointer"
            aria-label="More navigation categories"
          >
            <div className={cn("relative flex items-center justify-center mb-0.5 transition-colors duration-200", mobileMenuOpen ? "text-primary" : "text-muted-foreground")}>
              <LucideIcons.MoreHorizontal className={cn("w-5 h-5 transition-transform duration-200", mobileMenuOpen ? "scale-110 drop-shadow-sm" : "")} strokeWidth={mobileMenuOpen ? 2.5 : 2} />
            </div>
            <span className={cn("text-[10px] font-medium leading-none tracking-tight transition-colors duration-200", mobileMenuOpen ? "text-primary font-semibold" : "text-muted-foreground")}>
              {t("more", "More")}
            </span>
          </button>
        </div>
      </nav>

      {/* Native Mobile Bottom Sheet / Modal Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[70] flex flex-col justify-end animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)} 
          />

          {/* Bottom Sheet Modal */}
          <div className="relative w-full rounded-t-[24px] max-h-[88vh] bg-background text-foreground border-t border-border shadow-2xl transition-transform animate-in slide-in-from-bottom duration-300 overflow-hidden flex flex-col">
            
            {/* Grab Handle & Sheet Header */}
            <div className="flex flex-col items-center pt-3 pb-2.5 px-4 bg-muted/40 border-b border-border/80 shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 mb-2.5" />
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center p-0.5">
                    <img src="/jcl-logo.png" alt="JCL" className="w-full h-full object-contain" />
                  </div>
                  <h2 className="text-base font-bold tracking-tight text-foreground">{t('departments_and_tools', 'Departments & Tools')}</h2>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="w-7 h-7 rounded-full bg-muted hover:bg-muted/80 active:scale-95 flex items-center justify-center text-muted-foreground transition-all"
                  aria-label="Close menu"
                >
                  <LucideIcons.X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-[max(80px,env(safe-area-inset-bottom))] -webkit-overflow-scrolling-touch">
              
              {/* Category Accordions */}
              <div className="space-y-2.5">
                {categorizedGroups.map((group) => {
                  const isExpanded = !!expandedCategories[group.id];
                  const GroupIcon = group.icon || LucideIcons.Folder;
                  const hasActiveRoute = group.items.some(i => location.pathname === i.path || (i.path !== "/" && location.pathname.startsWith(i.path)));

                  return (
                    <div 
                      key={group.id} 
                      className={cn(
                        "rounded-xl border transition-all duration-200 overflow-hidden",
                        hasActiveRoute ? "border-primary/40 bg-card shadow-sm" : "border-border/80 bg-card/60"
                      )}
                    >
                      {/* Department Accordion Header */}
                      <button
                        onClick={() => toggleCategory(group.id)}
                        className="w-full flex items-center justify-between px-3.5 py-3 select-none active:bg-muted/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border", group.badgeColor)}>
                            <GroupIcon className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className={cn("text-sm font-semibold truncate", hasActiveRoute ? "text-primary" : "text-foreground")}>
                              {group.title}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate">
                              {group.items.length} {group.items.length === 1 ? 'module' : 'modules'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {hasActiveRoute && (
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          )}
                          <div className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200 text-muted-foreground", isExpanded && "rotate-180")}>
                            <LucideIcons.ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </button>

                      {/* Accordion Expandable Child Links */}
                      {isExpanded && (
                        <div className="border-t border-border/60 divide-y divide-border/40 bg-muted/20 animate-in fade-in slide-in-from-top-1 duration-150">
                          {group.items.map((item) => {
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
                                  "flex items-center justify-between px-4 py-2.5 text-xs transition-colors active:bg-muted/60 pl-11",
                                  isActive ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted/30"
                                )}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <IconComp className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                                  <span className="truncate">{shortLabel}</span>
                                </div>
                                <LucideIcons.ChevronRight className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground/40")} />
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Preferences & System Tools Card */}
              <div className="rounded-xl border border-border/80 bg-card divide-y divide-border/60 overflow-hidden mt-4">
                {/* Theme Selector */}
                <div className="flex items-center justify-between px-3.5 py-3">
                  <span className="text-sm font-medium text-foreground">{t('theme', 'Theme')}</span>
                  <ThemeToggle />
                </div>

                {/* Language Switcher */}
                <div className="flex items-center justify-between px-3.5 py-3">
                  <span className="text-sm font-medium text-foreground">{t('language', 'Language')}</span>
                  <select 
                    onChange={() => window.location.reload()}
                    className="bg-transparent border-0 pr-0 text-muted-foreground text-sm outline-none cursor-pointer"
                    style={{ direction: 'rtl' }}
                  >
                    <option value="en">English 🇬🇧</option>
                    <option value="es">Español 🇪🇸</option>
                    <option value="fr">Français 🇫🇷</option>
                  </select>
                </div>

                {/* Workspace Switcher */}
                {user?.available_companies?.length > 1 && (
                  <div className="flex items-center justify-between px-3.5 py-3">
                    <span className="text-sm font-medium text-foreground">{t('workspace', 'Workspace')}</span>
                    <select
                      value={user.company_id}
                      onChange={async (e) => {
                        const targetId = e.target.value;
                        if (!targetId || targetId === user.company_id) return;
                        await base44.auth.updateProfile({ company_id: targetId });
                        const isNativeApp = isDesktopApp();
                        if (isNativeApp) {
                          navigate('/');
                          setTimeout(() => window.location.reload(), 100);
                        } else {
                          window.location.href = '/';
                        }
                      }}
                      className="bg-transparent border-0 pr-0 text-muted-foreground text-sm outline-none max-w-[150px] truncate cursor-pointer"
                      style={{ direction: 'rtl' }}
                    >
                      {user.available_companies.map(comp => (
                        <option key={comp.id} value={comp.id}>{comp.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Multi Account Switcher */}
                {savedAccounts.length > 1 && (
                  <div className="flex flex-col">
                    <div className="px-3.5 py-2 bg-muted/40">
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Switch Account</span>
                    </div>
                    {savedAccounts.filter(acc => acc.id !== user?.id).map(acc => (
                      <button
                        key={acc.id}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          switchAccount(acc.id);
                        }}
                        className="flex items-center gap-3 px-3.5 py-2.5 bg-transparent active:bg-muted transition-colors border-b border-border/40 last:border-b-0 w-full text-left"
                      >
                        <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                          {acc.avatar_url ? (
                            <img src={acc.avatar_url} alt={acc.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-muted-foreground">
                              {acc.full_name ? acc.full_name[0].toUpperCase() : <LucideIcons.User className="w-3.5 h-3.5"/>}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-medium text-foreground truncate">{acc.full_name || 'User'}</span>
                          <span className="text-[10px] text-muted-foreground truncate">{acc.email}</span>
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('/login?prompt=login');
                      }}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 bg-transparent active:bg-muted transition-colors w-full text-left text-primary"
                    >
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <LucideIcons.Plus className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-xs font-medium">Add another account</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Log out Button */}
              <div className="rounded-xl border border-destructive/20 bg-card overflow-hidden">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    base44.auth.logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 active:bg-destructive/10 text-destructive transition-colors text-sm font-medium"
                >
                  <LucideIcons.LogOut className="w-4 h-4" strokeWidth={2} />
                  <span>{t('log_out', 'Log out')}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
