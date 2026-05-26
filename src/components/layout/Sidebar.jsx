import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Briefcase, Users, Calendar,
  Receipt, CheckSquare, FolderOpen, Settings,
  Scale, UserCog, LogOut, CreditCard, UserCircle, UserPlus, GitBranch,
  BookOpen, Shield, TrendingUp, Trophy, Search, Mail, BarChart2, Download, MessageCircle, HeartHandshake,
  ChevronLeft, ChevronRight, PanelLeft, X
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useImpersonation } from "@/lib/ImpersonationContext";

const companyNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "My Dashboard", icon: UserCircle, path: "/my-dashboard" },
  { label: "Cases", icon: Briefcase, path: "/cases" },
  { label: "Leads", icon: UserPlus, path: "/leads" },
  { label: "Clients", icon: Users, path: "/clients" },
  { label: "Calendar", icon: Calendar, path: "/calendar" },
  { label: "Invoices", icon: Receipt, path: "/invoices" },
  { label: "Billing", icon: CreditCard, path: "/billing" },
  { label: "Tasks", icon: CheckSquare, path: "/tasks" },
  { label: "Documents", icon: FolderOpen, path: "/documents" },
  { label: "Pipeline", icon: GitBranch, path: "/pipeline" },
  { label: "Outcomes", icon: Trophy, path: "/outcomes" },
  { label: "HR", icon: HeartHandshake, path: "/hr" },
  { label: "Performance", icon: TrendingUp, path: "/performance" },
  { label: "Conflict Check", icon: Shield, path: "/conflict-check" },
  { label: "Legal Research", icon: BookOpen, path: "/research" },
  { label: "Audit Log", icon: Search, path: "/audit" },
  { label: "WhatsApp", icon: MessageCircle, path: "/whatsapp" },
  { label: "Email Inbox", icon: Mail, path: "/email-inbox" },
  { label: "Reports", icon: BarChart2, path: "/reports" },
  { label: "Export Data", icon: Download, path: "/export" },
  { label: "Team", icon: UserCog, path: "/team" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

const clientNav = [
  { label: "My Portal", icon: LayoutDashboard, path: "/client-portal" },
];

export default function Sidebar({ user }) {
  const { impersonatedCompany } = useImpersonation();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isAdmin = ["super_admin", "admin", "company_admin"].includes(user?.role);
  
  const activeCompanyLogo = impersonatedCompany?.logo_url || impersonatedCompany?.logo_light_url || user?.company_logo_url;
  const activeCompanyName = impersonatedCompany?.name || user?.company_name || "LexAfrica";
  
  const ROLE_PERMISSIONS = {
    lawyer: ["/", "/my-dashboard", "/cases", "/leads", "/clients", "/calendar", "/tasks", "/documents", "/conflict-check", "/research", "/email-inbox", "/reports", "/team"],
    paralegal: ["/my-dashboard", "/cases", "/clients", "/calendar", "/tasks", "/documents", "/research", "/email-inbox"],
    hr: ["/my-dashboard", "/hr", "/team", "/performance", "/documents", "/tasks", "/calendar"],
    finance: ["/my-dashboard", "/invoices", "/billing", "/tasks", "/documents", "/reports", "/export", "/calendar"],
    support: ["/my-dashboard", "/tasks", "/documents", "/calendar", "/whatsapp", "/email-inbox"]
  };

  const allowedPaths = isAdmin ? null : (ROLE_PERMISSIONS[user?.role] || ROLE_PERMISSIONS.support);

  const filteredCompanyNav = companyNav.filter(item => {
    if (isAdmin) return true;
    return allowedPaths.includes(item.path);
  });

  const baseNav = user?.role === "client" ? clientNav : filteredCompanyNav;
  const navItems = isAdmin
    ? [...baseNav, { label: "Firm Setup", icon: Settings, path: "/firm-setup" }]
    : baseNav;

  const NavContent = ({ collapsed }) => (
    <div className="flex flex-col h-full bg-sidebar overflow-x-hidden">
      {/* Logo area */}
      <div className={cn("py-5 border-b border-sidebar-border flex items-center transition-all", collapsed ? "px-4 justify-center" : "px-5 gap-3")}>
        {activeCompanyLogo ? (
          <img src={activeCompanyLogo} alt="Logo" className={cn("object-contain", collapsed ? "w-8 h-8" : "w-9 h-9")} />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
            <Scale className="w-5 h-5 text-white" />
          </div>
        )}
        {!collapsed && (
          <div className="animate-in fade-in zoom-in duration-200">
            <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight leading-tight whitespace-nowrap truncate max-w-[140px]">{activeCompanyName}</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider whitespace-nowrap">Law Management</p>
          </div>
        )}
      </div>

      {/* Section label */}
      {!collapsed ? (
        <div className="px-4 pt-5 pb-1.5 animate-in fade-in duration-200">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Platform</p>
        </div>
      ) : (
        <div className="pt-5" />
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 pb-3 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-all duration-150",
                collapsed ? "justify-center p-2" : "gap-3 px-3 py-2",
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className={cn("flex-shrink-0 transition-all", collapsed ? "w-5 h-5" : "w-4 h-4")} />
              {!collapsed && <span className="whitespace-nowrap animate-in fade-in duration-200">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className={cn("border-t border-sidebar-border bg-sidebar flex items-center transition-all", collapsed ? "p-3 justify-center flex-col gap-3" : "p-3 gap-3")}>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-primary">
            {(user?.full_name?.[0] || user?.company_name?.[0] || "A").toUpperCase()}
          </span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0 animate-in fade-in duration-200">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">
              {user?.full_name || user?.company_name || "Admin"}
            </p>
            <p className="text-[10px] text-muted-foreground capitalize truncate">{user?.role?.replace("_", " ")}</p>
          </div>
        )}
        <button onClick={() => base44.auth.logout()} className="text-muted-foreground hover:text-sidebar-foreground transition-colors" title={collapsed ? "Log out" : undefined}>
          <LogOut className={cn(collapsed ? "w-5 h-5" : "w-4 h-4")} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-4 z-50 p-2.5 rounded-xl bg-sidebar border border-sidebar-border shadow-sm text-foreground/80 hover:text-foreground hover:bg-sidebar-accent hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
      >
        <PanelLeft className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 flex flex-col shadow-2xl h-full bg-sidebar transition-transform animate-in slide-in-from-left-4">
            <button 
              onClick={() => setMobileOpen(false)} 
              className="absolute top-4 -right-16 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:scale-105 transition-all z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <NavContent collapsed={false} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 border-r border-sidebar-border shadow-sm transition-all duration-300 relative z-40",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-10 w-8 h-8 rounded-full bg-sidebar border border-sidebar-border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted hover:scale-105 active:scale-95 transition-all duration-200 z-50 cursor-pointer"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
        <NavContent collapsed={isCollapsed} />
      </aside>
    </>
  );
}