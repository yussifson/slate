import React, { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Sparkles, Home, Wrench, Wallet, Briefcase,
  FileText, Settings, Compass, Users, Clock, Eye, MessageCircle,
  Banknote, FileCheck, RotateCcw, Users2, Star, Lock, CreditCard,
  Calendar, TrendingUp, Receipt, HeartHandshake, PenTool, Globe,
  LineChart, ClipboardList, Blocks, Zap, ChevronDown, Plus,
  MessageSquare, LifeBuoy, RefreshCw, LogOut, ShieldCheck, UserCheck, Landmark,
  BookOpen, CheckCircle2, Building2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { powerSync } from "@/api/PowerSyncConnector";
import { supabase } from "@/api/supabaseClient";
import ProfileAvatarDialog from "@/components/shared/ProfileAvatarDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

// Top-level Department Rail Sections
const JCL_DEPARTMENTS = [
  {
    id: "overview",
    label: "Overview & Intelligence",
    icon: LayoutDashboard,
    color: "emerald",
    items: [
      { label: "Dashboard", path: "/", icon: LayoutDashboard },
      { label: "Customer Timeline", path: "/real-estate/customer-timeline", icon: Clock },
      { label: "Market Data", path: "/real-estate/market-data", icon: Globe },
      { label: "Analytics & Insights", path: "/real-estate/analytics", icon: LineChart }
    ]
  },
  {
    id: "sales",
    label: "Sales & CRM",
    icon: Sparkles,
    color: "amber",
    actionLabel: "New Lead",
    actionPath: "/real-estate/crm-leads",
    items: [
      { label: "CRM Leads", path: "/real-estate/crm-leads", icon: Sparkles, badgeKey: "leads" },
      { label: "Clients Directory", path: "/real-estate/clients", icon: Users },
      { label: "Tours & Viewings", path: "/real-estate/viewings", icon: Eye, badgeKey: "viewings" },
      { label: "Purchase Offers", path: "/real-estate/offers", icon: FileText, badgeKey: "offers" },
      { label: "Counter Offers", path: "/real-estate/counter-offers", icon: MessageCircle },
      { label: "Deals & Transactions", path: "/real-estate/transactions", icon: Banknote }
    ]
  },
  {
    id: "property",
    label: "Land & Properties",
    icon: Home,
    color: "blue",
    actionLabel: "Add Property",
    actionPath: "/real-estate/properties",
    items: [
      { label: "Land Parcels", path: "/real-estate/land", icon: Compass },
      { label: "Properties Portfolio", path: "/real-estate/properties", icon: Home },
      { label: "Leases & Contracts", path: "/real-estate/leases", icon: FileCheck },
      { label: "Lease Renewals", path: "/real-estate/lease-renewals", icon: RotateCcw, badgeKey: "renewals" }
    ]
  },
  {
    id: "facilities",
    label: "Facilities & Maintenance",
    icon: Wrench,
    color: "purple",
    actionLabel: "New Work Order",
    actionPath: "/real-estate/maintenance",
    items: [
      { label: "Maintenance Tickets", path: "/real-estate/maintenance", icon: Wrench, badgeKey: "tickets" },
      { label: "Approved Contractors", path: "/real-estate/contractors", icon: Users2 },
      { label: "Contractor Reviews", path: "/real-estate/contractor-reviews", icon: Star }
    ]
  },
  {
    id: "finance",
    label: "Finance & Accounting",
    icon: Wallet,
    color: "indigo",
    actionLabel: "Record Payment",
    actionPath: "/real-estate/rent-payments",
    items: [
      { label: "Trust Accounting", path: "/real-estate/trust-accounting", icon: Wallet },
      { label: "Firm Accounting", path: "/finance/accounting", icon: Landmark },
      { label: "Chart of Accounts", path: "/finance/accounting?tab=coa", icon: BookOpen },
      { label: "Invoices & AR", path: "/finance/accounting?tab=invoices", icon: Receipt },
      { label: "Bills & AP", path: "/finance/accounting?tab=bills", icon: FileText },
      { label: "General Ledger (JV)", path: "/finance/accounting?tab=jv", icon: LineChart },
      { label: "Bank Feed Rec", path: "/finance/accounting?tab=bankrec", icon: CheckCircle2 },
      { label: "Fixed Assets", path: "/finance/accounting?tab=assets", icon: Building2 },
      { label: "Escrow Accounts", path: "/real-estate/escrow", icon: Lock },
      { label: "Rent Payments", path: "/real-estate/rent-payments", icon: CreditCard },
      { label: "Payment Schedules", path: "/real-estate/payment-schedules", icon: Calendar },
      { label: "Agent Commissions", path: "/real-estate/commissions", icon: TrendingUp },
      { label: "Commission Rules", path: "/real-estate/commission-rules", icon: Settings }
    ]
  },
  {
    id: "projects",
    label: "Projects & Engineering",
    icon: Briefcase,
    color: "orange",
    actionLabel: "New Project",
    actionPath: "/tasks",
    items: [
      { label: "Projects & Tasks", path: "/tasks", icon: Briefcase },
      { label: "HR & Team Roster", path: "/hr", icon: HeartHandshake },
      { label: "Civil Engineering & QS", path: "/real-estate/team-management", icon: UserCheck }
    ]
  },
  {
    id: "governance",
    label: "Docs & Governance",
    icon: FileText,
    color: "teal",
    actionLabel: "New Smart Doc",
    actionPath: "/real-estate/document-templates",
    items: [
      { label: "Smart Docs", path: "/real-estate/document-templates", icon: FileText },
      { label: "E-Signatures Hub", path: "/real-estate/e-signatures", icon: PenTool },
      { label: "Executive Reports", path: "/reports", icon: ClipboardList },
      { label: "Audit & Compliance Log", path: "/real-estate/audit-log", icon: ShieldCheck }
    ]
  },
  {
    id: "settings",
    label: "Settings & System",
    icon: Settings,
    color: "slate",
    items: [
      { label: "Integrations Hub", path: "/integrations", icon: Blocks },
      { label: "Automations Engine", path: "/automations", icon: Zap },
      { label: "Workspace Settings", path: "/settings", icon: Settings }
    ]
  }
];

export default function JCLTwoPanelSidebar({
  user,
  companyId,
  companyData,
  impersonatedCompany,
  isAdmin,
  customRolePermissions
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);

  // Active Rail Department State (defaults to current route match or 'overview')
  const [activeDeptId, setActiveDeptId] = useState(() => {
    const currentPath = location.pathname;
    const found = JCL_DEPARTMENTS.find(d => d.items.some(item => item.path === currentPath));
    return found ? found.id : "overview";
  });

  // Query live counts for dynamic badges
  const { data: counts = {} } = useQuery({
    queryKey: ["jcl_sidebar_counts", companyId],
    queryFn: async () => {
      if (!companyId) return {};
      try {
        const [leadsRes, viewingsRes, offersRes, ticketsRes] = await Promise.all([
          powerSync.execute("SELECT count(*) as cnt FROM univ_re_leads WHERE company_id = ? AND status = 'new'", [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute("SELECT count(*) as cnt FROM univ_re_viewings WHERE company_id = ? AND status = 'scheduled'", [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute("SELECT count(*) as cnt FROM univ_re_offers WHERE company_id = ? AND status = 'pending'", [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute("SELECT count(*) as cnt FROM univ_re_maintenance WHERE company_id = ? AND status = 'open'", [companyId]).catch(() => ({ rows: [] }))
        ]);

        return {
          leads: leadsRes.rows._array?.[0]?.cnt || 0,
          viewings: viewingsRes.rows._array?.[0]?.cnt || 0,
          offers: offersRes.rows._array?.[0]?.cnt || 0,
          tickets: ticketsRes.rows._array?.[0]?.cnt || 0,
          renewals: 2
        };
      } catch (_e) {
        return {};
      }
    },
    enabled: !!companyId,
    refetchInterval: 30000
  });

  const activeDepartment = useMemo(() => {
    return JCL_DEPARTMENTS.find(d => d.id === activeDeptId) || JCL_DEPARTMENTS[0];
  }, [activeDeptId]);

  // Filter items by RBAC permissions
  const filteredDeptItems = useMemo(() => {
    if (isAdmin || !customRolePermissions) return activeDepartment.items;
    return activeDepartment.items.filter(item => customRolePermissions.includes(item.path));
  }, [activeDepartment, isAdmin, customRolePermissions]);

  const companyName = companyData?.name || impersonatedCompany?.name || user?.company_name || "JCL Royal Group";

  return (
    <div className="flex h-full select-none font-sans text-slate-900 dark:text-slate-100 border-r border-slate-200/80 dark:border-border shrink-0 bg-white dark:bg-background">
      {/* ── 1. NARROW ICON RAIL (Far Left, ~56px) ── */}
      <div className="w-14 shrink-0 flex flex-col items-center justify-between py-3 border-r border-slate-200/70 dark:border-border/70 bg-[#FAFAFA] dark:bg-background/90 z-20">
        <div className="flex flex-col items-center gap-3 w-full px-2">
          {/* Brand Emblem */}
          <div className="h-9 w-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm flex items-center justify-center shadow-sm">
            JCL
          </div>

          <div className="w-8 h-[1px] bg-slate-200 dark:bg-border my-1" />

          {/* Department Rail Icons */}
          <div className="flex flex-col gap-1.5 w-full items-center">
            {JCL_DEPARTMENTS.map(dept => {
              const IconComponent = dept.icon;
              const isActive = activeDeptId === dept.id;
              return (
                <button
                  key={dept.id}
                  onClick={() => setActiveDeptId(dept.id)}
                  title={dept.label}
                  className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 group relative",
                    isActive
                      ? "bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                  )}
                >
                  <IconComponent className="h-4 w-4 shrink-0" />
                  {/* Active Pill Indicator Dot */}
                  {isActive && (
                    <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-4 bg-emerald-600 dark:bg-emerald-400 rounded-r-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rail Utility Icons */}
        <div className="flex flex-col gap-1.5 w-full items-center px-2">
          <button
            onClick={() => navigate('/chat')}
            title="Chat & Support"
            className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate('/settings')}
            title="Settings"
            className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── 2. EXPANDED NAVIGATION PANEL (~230px) ── */}
      <div className="w-[230px] shrink-0 flex flex-col justify-between p-3.5 bg-white dark:bg-background z-10">
        <div className="space-y-4">
          {/* Workspace Switcher Header */}
          <div className="pb-3 border-b border-slate-200/70 dark:border-border/70 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="font-extrabold text-sm text-slate-900 dark:text-white truncate leading-tight">
                  {companyName}
                </h2>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  real_estate_jcl
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 text-xs">
                  <DropdownMenuLabel>Switch Workspace</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    Workspace Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => supabase.auth.signOut().then(() => navigate('/login'))}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Switch firm</span>
            </button>
          </div>

          {/* Department Header & Group Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {activeDepartment.label}
              </span>
              {activeDepartment.actionPath && (
                <button
                  onClick={() => navigate(activeDepartment.actionPath)}
                  title={activeDepartment.actionLabel || "Add New"}
                  className="h-5 w-5 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Department Item List */}
            <div className="space-y-0.5">
              {filteredDeptItems.map(item => {
                const ItemIcon = item.icon;
                const isItemActive = location.pathname === item.path;
                const badgeValue = item.badgeKey ? counts[item.badgeKey] : null;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "h-9 px-2.5 rounded-xl flex items-center justify-between text-xs font-semibold transition-all duration-150 group",
                      isItemActive
                        ? "bg-slate-200/70 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-extrabold"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ItemIcon className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isItemActive ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                      )} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {/* Numeric Badge Pill */}
                    {badgeValue > 0 && (
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors",
                        isItemActive
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                          : "bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      )}>
                        {badgeValue}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Utility Profile Bar */}
        <div className="pt-3 border-t border-slate-200/70 dark:border-border/70 space-y-1">
          <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
            <button
              onClick={() => setShowAvatarDialog(true)}
              className="flex items-center gap-2 min-w-0 text-left"
            >
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-500 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                {(user?.full_name || user?.email || "A")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {user?.full_name || "Assigned Broker"}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
            </button>

            <button
              onClick={() => supabase.auth.signOut().then(() => navigate('/login'))}
              title="Sign Out"
              className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {showAvatarDialog && (
        <ProfileAvatarDialog
          isOpen={showAvatarDialog}
          onClose={() => setShowAvatarDialog(false)}
          user={user}
        />
      )}
    </div>
  );
}
