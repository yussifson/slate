import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Users, Building2, Shield, CalendarHeart, Clock,
  BadgeDollarSign, Target, GraduationCap, UserPlus,
  AlertCircle, Wallet, LayoutDashboard, ShieldCheck,
  Menu, X, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

const HR_NAV_ITEMS = [
  { label: 'HR Overview', path: '/hr', icon: LayoutDashboard, exact: true },
  { label: 'Employees & Staff', path: '/hr/employees', icon: Users },
  { label: 'Departments', path: '/hr/departments', icon: Building2 },
  { label: 'Roles & Permissions', path: '/hr/roles', icon: Shield },
  { label: 'Company Items Issued', path: '/hr/assets', icon: ShieldCheck },
  { label: 'Leave Management', path: '/hr/leave', icon: CalendarHeart },
  { label: 'Payroll & Salaries', path: '/hr/payroll', icon: BadgeDollarSign },
  { label: 'Performance & KPIs', path: '/hr/performance', icon: Target },
  { label: 'Recruitment & ATS', path: '/hr/recruitment', icon: UserPlus },
  { label: 'Training & Development', path: '/hr/training', icon: GraduationCap },
  { label: 'Complaints & Grievances', path: '/hr/complaints', icon: AlertCircle },
  { label: 'Salary Benchmarks', path: '/hr/salary', icon: Wallet },
];

export default function HRLayout() {
  const location = useLocation();
  const [mobileSubNavOpen, setMobileSubNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Active section finder for mobile header badge
  const activeItem = HR_NAV_ITEMS.find(item => 
    item.exact ? location.pathname === item.path : (location.pathname === item.path || location.pathname.startsWith(item.path + '/'))
  ) || HR_NAV_ITEMS[0];

    return (
    <div className="w-full flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-background">
      {/* ── Native Mobile Horizontal Tab Bar (< md) ── */}
      <div className="md:hidden shrink-0 sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border/80 px-3 py-2.5 shadow-xs overflow-x-auto scrollbar-hide -mx-1">
        <div className="flex items-center gap-2 min-w-max px-1">
          {HR_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact 
              ? location.pathname === item.path 
              : (location.pathname === item.path || location.pathname.startsWith(item.path + '/'));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 active:scale-95",
                  isActive
                    ? "bg-[#005A9C] text-white border-[#005A9C] shadow-xs"
                    : "bg-background text-muted-foreground border-border/80 hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-white" : "text-muted-foreground")} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* ── Desktop Secondary Left Sidebar (>= md) ── */}
      <aside className={cn(
        "hidden md:flex bg-card border-r border-border/70 flex-col shrink-0 overflow-hidden transition-all duration-300 z-20 h-full",
        sidebarCollapsed ? "w-[76px]" : "w-56 lg:w-60"
      )}>
        <div className={cn("shrink-0 h-14 p-3 border-b border-border/60 bg-gradient-to-br from-primary/10 via-transparent to-transparent flex items-center justify-between", sidebarCollapsed && "px-2 justify-center")}>
          <div className={cn("flex items-center gap-2.5 min-w-0", sidebarCollapsed && "hidden")}>
            <div className="w-8 h-8 rounded-xl bg-[#005A9C] text-white flex items-center justify-center shadow-sm shrink-0">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-foreground tracking-tight truncate">Human Resources</h2>
              <p className="text-[10px] text-muted-foreground truncate">Workforce Hub</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(prev => !prev)}
            className="hidden md:inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border/70 bg-background/70 text-muted-foreground shadow-xs transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary shrink-0"
            aria-label={sidebarCollapsed ? "Expand HR sidebar" : "Collapse HR sidebar"}
            title={sidebarCollapsed ? "Expand HR sidebar" : "Collapse HR sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          <div className={cn("px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground", sidebarCollapsed && "hidden")}>
            HR Modules & Workflows
          </div>
          {HR_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact 
              ? location.pathname === item.path 
              : (location.pathname === item.path || location.pathname.startsWith(item.path + '/'));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group",
                  isActive
                    ? "bg-[#005A9C] text-white shadow-sm font-semibold dark:bg-[#005A9C] dark:text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  <span className={cn("truncate", sidebarCollapsed && "hidden")}>{item.label}</span>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] shadow-[0_0_6px_rgba(255,107,0,0.8)]" />
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* HR Content Outlet (Independently Scrollable) */}
      <main className="flex-1 h-full min-h-0 min-w-0 overflow-y-auto p-2.5 sm:p-5 lg:p-6 pb-24 md:pb-8">
        <div className="w-full min-w-0 max-w-full overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}