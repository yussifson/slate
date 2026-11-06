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
  { label: 'Attendance & Clock-In', path: '/hr/attendance', icon: Clock },
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
    <div className="w-full flex-1 flex flex-col md:flex-row h-[calc(100vh-64px)] min-h-0 overflow-hidden bg-background">
      {/* Mobile Sub-Header Toggle */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border/80 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#005A9C]/10 text-[#005A9C] dark:text-[#38bdf8] flex items-center justify-center">
            <activeItem.icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">{activeItem.label}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">HR Hub Navigation</p>
          </div>
        </div>
        <button
          onClick={() => setMobileSubNavOpen(prev => !prev)}
          className="p-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors"
          aria-label="Toggle HR Navigation"
        >
          {mobileSubNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Secondary Left Sidebar */}
      <aside className={cn(
        "bg-card border-r border-border/70 flex-col shrink-0 overflow-hidden transition-all duration-300 z-20",
        sidebarCollapsed ? "w-full md:w-[76px]" : "w-full md:w-56 lg:w-60",
        mobileSubNavOpen ? "flex" : "hidden md:flex",
        "h-full min-h-0"
      )}>
        <div className={cn("shrink-0 min-h-[76px] p-3 border-b border-border/60 bg-gradient-to-br from-primary/10 via-transparent to-transparent", sidebarCollapsed && "md:px-2")}>
          <div className={cn("flex items-center gap-3", sidebarCollapsed && "md:justify-center")}>

            <div className="w-9 h-9 rounded-xl bg-[#005A9C] text-white flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className={cn(sidebarCollapsed && "md:hidden")}>
              <h2 className="text-sm font-bold text-foreground tracking-tight">Human Resources</h2>
              <p className="text-[11px] text-muted-foreground">Workforce & Operations Hub</p>
            </div>
            <button
              type="button"
              onClick={() => setSidebarCollapsed(prev => !prev)}
              className="hidden md:inline-flex ml-auto h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-background/70 text-muted-foreground shadow-sm transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
              aria-label={sidebarCollapsed ? "Expand HR sidebar" : "Collapse HR sidebar"}
              title={sidebarCollapsed ? "Expand HR sidebar" : "Collapse HR sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          <div className={cn("px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground", sidebarCollapsed && "md:hidden")}>
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
                onClick={() => setMobileSubNavOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group",
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
                  <span className={cn("truncate", sidebarCollapsed && "md:hidden")}>{item.label}</span>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] shadow-[0_0_6px_rgba(255,107,0,0.8)]" />
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* HR Content Outlet */}
      <main className="flex-1 h-full min-h-0 min-w-0 overflow-y-auto p-3 sm:p-5 lg:p-6">
        <div className="w-full min-w-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
