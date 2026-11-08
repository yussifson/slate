import React, { useState } from 'react';
import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import {
  Landmark, WalletCards, BarChart3, BookOpen, Receipt,
  FileText, LineChart, ShieldCheck, CheckCircle2, TrendingUp,
  Users, ShoppingBag, Wallet, BookCheck, BarChart2,
  ChevronDown, Calculator, ClipboardCheck,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Firm Accounting sub-features
const FIRM_SUB_ITEMS = [
  { id: 'coa', label: 'Chart of Accounts', icon: BookOpen },
  { id: 'invoices', label: 'Invoices (AR)', icon: Receipt },
  { id: 'bills', label: 'Bills (AP)', icon: FileText },
  { id: 'jv', label: 'General Ledger', icon: LineChart },
  { id: 'assets', label: 'Fixed Assets', icon: ShieldCheck },
  { id: 'bankrec', label: 'Bank Rec', icon: CheckCircle2 },
  { id: 'income', label: 'Income & Expenses', icon: TrendingUp },
  { id: 'payroll', label: 'Payroll & Tax', icon: Users },
  { id: 'tonefo', label: 'TONEFO Installments', icon: ShoppingBag },
  { id: 'petty_cash', label: 'Petty Cash', icon: Wallet },
  { id: 'statements', label: 'Financial Statements', icon: BookCheck },
  { id: 'reports', label: 'Reports', icon: BarChart2 },
];

// Project Finance sub-features
const PROJECT_FINANCE_SUB_ITEMS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'budgets', label: 'Budgets', icon: Calculator },
  { id: 'variations', label: 'Variations', icon: TrendingUp },
  { id: 'claims', label: 'Progress Claims', icon: ClipboardCheck },
];

export default function FinanceLayout({ children }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || '';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isFirmAccounting = location.pathname.startsWith('/finance/accounting');
  const isProjectFinance = location.pathname.startsWith('/jcl/project-finance');
  const isTrustAccounting = location.pathname.startsWith('/real-estate/trust-accounting') || location.pathname.startsWith('/real-estate/escrow');

  // Firm accounting active tab resolution (defaults to coa)
  const activeFirmTab = isFirmAccounting ? (currentTab || 'coa') : '';
  const activeProjTab = isProjectFinance ? (currentTab || 'overview') : '';

  // Main primary sections
  const primarySections = [
    {
      id: 'firm',
      label: 'Firm Accounting',
      path: '/finance/accounting',
      icon: Landmark,
      isActive: isFirmAccounting,
      subItems: FIRM_SUB_ITEMS,
    },
    {
      id: 'project',
      label: 'Project Finance',
      path: '/jcl/project-finance',
      icon: BarChart3,
      isActive: isProjectFinance,
      subItems: PROJECT_FINANCE_SUB_ITEMS,
    },
    {
      id: 'trust',
      label: 'Trust Accounting',
      path: '/real-estate/trust-accounting',
      icon: WalletCards,
      isActive: isTrustAccounting,
      subItems: [],
    },
  ];

  return (
    <div className="w-full flex-1 flex flex-col md:flex-row min-h-[calc(100vh-120px)] w-full max-w-full overflow-x-hidden bg-background">
      
      {/* ── Native Mobile Horizontal Sub-nav Tab Bar (< md) ── */}
      <div className="md:hidden sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border/80 px-2.5 py-2 shadow-xs overflow-x-auto scrollbar-none -mx-1">
        {/* Tier 1: Main Pillars */}
        <div className="flex items-center gap-1.5 min-w-max pb-1.5 border-b border-border/40">
          {primarySections.map((sec) => {
            const Icon = sec.icon;
            return (
              <NavLink
                key={sec.id}
                to={sec.path}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0",
                  sec.isActive
                    ? "bg-[#005A9C] text-white border-[#005A9C] shadow-xs"
                    : "bg-background text-muted-foreground border-border/80 hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5 shrink-0", sec.isActive ? "text-white" : "text-muted-foreground")} />
                <span>{sec.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Tier 2: Contextual Sub-modules */}
        {isFirmAccounting && (
          <div className="flex items-center gap-1.5 min-w-max pt-1.5">
            {FIRM_SUB_ITEMS.map((sub) => {
              const Icon = sub.icon;
              const isActive = activeFirmTab === sub.id;
              return (
                <NavLink
                  key={sub.id}
                  to={`/finance/accounting?tab=${sub.id}`}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/30 font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  <span>{sub.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}

        {isProjectFinance && (
          <div className="flex items-center gap-1.5 min-w-max pt-1.5">
            {PROJECT_FINANCE_SUB_ITEMS.map((sub) => {
              const Icon = sub.icon;
              const isActive = activeProjTab === sub.id;
              return (
                <NavLink
                  key={sub.id}
                  to={`/jcl/project-finance?tab=${sub.id}`}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/30 font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  <span>{sub.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Desktop Secondary Left Inner Sidebar (>= md) ── */}
      <aside className={cn(
        "hidden md:flex bg-card border-r border-border/70 flex-col shrink-0 overflow-hidden transition-all duration-300 z-20",
        sidebarCollapsed ? "w-[76px]" : "w-60 lg:w-64",
        "h-full min-h-0 self-start sticky top-16 max-h-[calc(100vh-4rem)]"
      )}>
        {/* Header with expand/collapse */}
        <div className={cn("shrink-0 min-h-[72px] p-3 border-b border-border/60 bg-gradient-to-br from-[#005A9C]/10 via-transparent to-transparent flex items-center justify-between", sidebarCollapsed && "px-2 justify-center")}>
          <div className={cn("flex items-center gap-2.5 min-w-0", sidebarCollapsed && "hidden")}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#005A9C] to-[#00477D] text-white flex items-center justify-center shadow-md shadow-[#005A9C]/20 shrink-0">
              <Landmark className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-foreground tracking-tight truncate">Finance Hub</h2>
              <p className="text-[10px] text-muted-foreground truncate">Corporate, Project & Trust</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(prev => !prev)}
            className="h-8 w-8 inline-flex items-center justify-center rounded-xl border border-border/70 bg-background/70 text-muted-foreground shadow-sm transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary shrink-0"
            aria-label={sidebarCollapsed ? "Expand Finance sidebar" : "Collapse Finance sidebar"}
            title={sidebarCollapsed ? "Expand Finance sidebar" : "Collapse Finance sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="min-h-0 flex-1 overflow-y-auto p-2.5 space-y-3 scrollbar-thin">
          {primarySections.map((sec) => {
            const Icon = sec.icon;
            const hasSubItems = sec.subItems && sec.subItems.length > 0;
            const isExpanded = sec.isActive;

            return (
              <div key={sec.id} className="space-y-1">
                {/* Main pillar button */}
                <NavLink
                  to={sec.path}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all group",
                    sec.isActive
                      ? "bg-[#005A9C] text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      sec.isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    <span className={cn("truncate", sidebarCollapsed && "hidden")}>{sec.label}</span>
                  </div>
                  {!sidebarCollapsed && hasSubItems && (
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform opacity-70", isExpanded && "rotate-180")} />
                  )}
                </NavLink>

                {/* Sub-items (nested under active pillar) */}
                {!sidebarCollapsed && isExpanded && hasSubItems && (
                  <div className="pl-4 pr-1 py-1 space-y-0.5 border-l-2 border-border/60 ml-3.5">
                    {sec.subItems.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = sec.id === 'firm' 
                        ? activeFirmTab === sub.id 
                        : activeProjTab === sub.id;

                      return (
                        <NavLink
                          key={sub.id}
                          to={`${sec.path}?tab=${sub.id}`}
                          className={cn(
                            "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all",
                            isSubActive
                              ? "bg-primary/10 text-primary font-bold shadow-2xs"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <SubIcon className={cn("w-3.5 h-3.5 shrink-0", isSubActive ? "text-primary" : "text-muted-foreground")} />
                            <span className="truncate">{sub.label}</span>
                          </div>
                          {isSubActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] shadow-[0_0_6px_rgba(255,107,0,0.8)] shrink-0" />
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ── Finance Content Outlet ── */}
      <main className="flex-1 min-w-0 min-h-0 overflow-y-auto p-2.5 sm:p-5 lg:p-6 pb-24 md:pb-8">
        <div className="w-full min-w-0 max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
