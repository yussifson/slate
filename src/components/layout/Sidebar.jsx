import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Briefcase, Users, Calendar, Receipt, CheckSquare, FolderOpen, Settings,
  UserCog, LogOut, CreditCard, UserCircle, UserPlus, GitBranch, BookOpen, Shield, TrendingUp,
  Trophy, Search, Mail, BarChart2, Download, MessageCircle, HeartHandshake, ChevronLeft,
  ChevronRight, PanelLeft, X, Award, FileText, Building2, ShoppingCart, Package, Tag,
  ClipboardList, Truck, Star, Clock, Map, Car, Warehouse, MapPin, BellRing, Sparkles,
  UtensilsCrossed, Layers, HandCoins, Users2, Network, GraduationCap, Banknote, CalendarOff,
  Gift, AlertTriangle, AlertCircle, FileSearch, CheckSquare2, Library, Pill, FlaskConical,
  ShoppingBag, BedDouble, LayoutGrid, PanelLeftClose
} from "lucide-react";
import { supabase } from "@/api/supabaseClient";
import { useImpersonation } from "@/lib/ImpersonationContext";
import { useCompany } from "@/hooks/useCompanyId";
import { getIndustryNav, INDUSTRIES } from "@/config/industries";

// Map icon string names to actual Lucide components
const ICON_MAP = {
  LayoutDashboard, Briefcase, Users, Calendar, Receipt, CheckSquare, FolderOpen, Settings,
  UserCog, LogOut, CreditCard, UserCircle, UserPlus, GitBranch, BookOpen, Shield, TrendingUp,
  Trophy, Search, Mail, BarChart2, Download, MessageCircle, HeartHandshake, Award, FileText,
  Building2, ShoppingCart, Package, Tag, ClipboardList, Truck, Star, Clock, Map, Car,
  Warehouse, MapPin, BellRing, Sparkles, UtensilsCrossed, Layers, HandCoins, Users2, Network,
  GraduationCap, Banknote, CalendarOff, Gift, AlertTriangle, AlertCircle, FileSearch,
  CheckSquare2, Library, Pill, FlaskConical, ShoppingBag, BedDouble, LayoutGrid
};

const ADMIN_ROLES = ["super_admin", "admin", "company_admin"];

// Role-based path filtering (shared base paths allowed for most roles)
const ROLE_ALLOWED_PATHS = {
  // Law
  lawyer:          ["/", "/my-dashboard", "/cases", "/leads", "/clients", "/calendar", "/tasks", "/documents", "/conflict-check", "/research", "/email-inbox", "/reports", "/team"],
  paralegal:       ["/my-dashboard", "/cases", "/clients", "/calendar", "/tasks", "/documents", "/research", "/email-inbox"],
  legal_secretary: ["/my-dashboard", "/cases", "/clients", "/calendar", "/tasks", "/documents", "/email-inbox"],
  // School
  teacher:         ["/", "/students", "/classes", "/timetable", "/attendance", "/grades", "/exams", "/tasks", "/documents"],
  accountant:      ["/", "/fees", "/invoices", "/reports", "/tasks", "/documents"],
  librarian:       ["/library", "/documents", "/tasks"],
  parent:          ["/parent-portal"],
  student:         ["/grades", "/attendance", "/timetable"],
  // Hospital
  doctor:          ["/", "/patients", "/appointments", "/prescriptions", "/lab-results", "/documents", "/tasks"],
  nurse:           ["/", "/patients", "/appointments", "/wards", "/tasks", "/documents"],
  receptionist:    ["/", "/patients", "/appointments", "/invoices", "/tasks"],
  pharmacist:      ["/pharmacy", "/prescriptions", "/tasks", "/documents"],
  lab_technician:  ["/lab-results", "/patients", "/tasks"],
  // Hotel
  housekeeper:     ["/housekeeping", "/tasks"],
  chef:            ["/restaurant", "/tasks"],
  waiter:          ["/restaurant", "/guest-requests"],
  maintenance:     ["/tasks", "/documents"],
  // Church
  elder:           ["/", "/members", "/ministries", "/events", "/tithes", "/documents", "/tasks"],
  ministry_leader: ["/members", "/ministries", "/events", "/volunteers", "/tasks"],
  treasurer:       ["/tithes", "/reports", "/invoices"],
  volunteer:       ["/events", "/volunteers", "/tasks"],
  member:          ["/small-groups", "/prayers", "/events", "/sermons"],
  // Insurance
  underwriter:     ["/", "/policies", "/underwriting", "/claims", "/documents", "/tasks"],
  agent:           ["/", "/leads", "/clients", "/policies", "/premiums", "/tasks"],
  claims_adjuster: ["/claims", "/clients", "/documents", "/tasks"],
  // Retail
  supervisor:      ["/", "/pos", "/inventory", "/orders", "/shifts", "/reports"],
  cashier:         ["/pos", "/orders", "/shifts"],
  inventory_manager:["/inventory", "/products", "/suppliers", "/tasks", "/reports"],
  // Logistics
  dispatcher:      ["/", "/shipments", "/dispatch", "/drivers", "/routes", "/pickups"],
  driver:          ["/dispatch", "/shipments"],
  warehouse_staff: ["/warehouse", "/shipments", "/tasks"],
  // HR
  hr_manager:      ["/", "/employees", "/recruitment", "/leave", "/performance", "/training", "/disciplinary", "/benefits", "/reports"],
  recruiter:       ["/recruitment", "/employees", "/tasks", "/documents"],
  department_head: ["/employees", "/performance", "/leave", "/tasks", "/documents"],
  payroll_officer: ["/payroll", "/employees", "/benefits", "/reports"],
  employee:        ["/my-dashboard", "/leave", "/tasks", "/documents", "/training"],
  // Shared
  hr:              ["/my-dashboard", "/hr", "/team", "/performance", "/documents", "/tasks", "/calendar", "/leave"],
  finance:         ["/my-dashboard", "/invoices", "/billing", "/tasks", "/documents", "/reports", "/export", "/calendar"],
};

export default function Sidebar({ user }) {
  const { impersonatedCompany } = useImpersonation();
  const { company } = useCompany();
  const industry = company?.industry_type || user?.company_industry || "law";
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('optalflow_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('optalflow_sidebar_collapsed', isCollapsed);
  }, [isCollapsed]);

  const isAdmin = ADMIN_ROLES.includes(user?.role);
  const isSuperAdmin = user?.role === "super_admin";

  const activeCompanyLogo = impersonatedCompany?.logo_url || user?.company_logo_url || (isSuperAdmin ? "/optalflow-favicon.svg" : null);
  const activeCompanyName = impersonatedCompany?.name || user?.company_name || "Optalflow";
  const industryInfo = INDUSTRIES[industry] || INDUSTRIES.law;

  // Get the industry-specific nav
  const industryNav = getIndustryNav(industry);

  // Filter based on role
  const allowedPaths = isAdmin ? null : (ROLE_ALLOWED_PATHS[user?.role] || ["/my-dashboard", "/tasks", "/documents"]);

  const filteredNav = industryNav.filter(item => {
    if (isAdmin) return true;
    return allowedPaths.includes(item.path);
  });

  // Add super admin link for platform admins
  const navItems = isSuperAdmin
    ? [...filteredNav, { label: "Platform Admin", path: "/admin", icon: "Settings" }]
    : filteredNav;

  // Client portal override
  const finalNav = user?.role === "client" || user?.role === "student" || user?.role === "member"
    ? [{ label: "My Portal", path: "/client-portal", icon: "LayoutDashboard" }, ...filteredNav.filter(n => allowedPaths?.includes(n.path))]
    : navItems;

  const NavContent = ({ collapsed }) => (
    <div className="flex flex-col h-full bg-sidebar overflow-x-hidden">
      {/* Logo / Company Header */}
      <div className={cn("py-4 border-b-2 border-primary/80 flex items-center transition-all", collapsed ? "px-4 justify-center" : "px-4 gap-3")}>
        <div className={cn("rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 font-bold text-primary", collapsed ? "w-9 h-9 text-base" : "w-9 h-9 text-sm")}>
          {activeCompanyLogo
            ? <img src={activeCompanyLogo} alt="Logo" className="w-full h-full object-contain rounded-xl" />
            : industryInfo.icon}
        </div>
        {!collapsed && (
          <div className="animate-in fade-in duration-200 min-w-0 flex-1">
            <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight leading-tight truncate max-w-[140px]">{activeCompanyName}</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{industryInfo.name} Suite</p>
          </div>
        )}
        
        {/* Modern Sidebar Toggle inside Header */}
        {!collapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-all shrink-0 ml-auto"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav items */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Navigation</p>
        </div>
      )}
      {collapsed && <div className="pt-4" />}

      <nav className="flex-1 px-2 pb-3 space-y-0.5 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {finalNav.map((item) => {
          const IconComponent = ICON_MAP[item.icon] || LayoutDashboard;
          const isRootPath = item.path === "/" || item.path === "/admin";
          const isActive = isRootPath
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-all duration-150",
                collapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2",
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <IconComponent className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
              {!collapsed && <span className="whitespace-nowrap animate-in fade-in duration-200 truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className={cn("border-t border-sidebar-border bg-sidebar flex items-center transition-all", collapsed ? "p-3 justify-center flex-col gap-2" : "p-3 gap-3")}>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-primary">
            {(user?.full_name?.[0] || user?.email?.[0] || "A").toUpperCase()}
          </span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0 animate-in fade-in duration-200">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.full_name || user?.email || "User"}</p>
            <p className="text-[10px] text-muted-foreground capitalize truncate">{user?.role?.replace(/_/g, " ")}</p>
          </div>
        )}
        <button
          onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
          className="text-muted-foreground hover:text-red-500 transition-colors"
          title="Log out"
        >
          <LogOut className={cn(collapsed ? "w-5 h-5" : "w-4 h-4")} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-4 z-50 p-2.5 rounded-xl bg-sidebar border border-sidebar-border shadow-sm text-foreground/80 hover:bg-sidebar-accent transition-all"
      >
        <PanelLeft className="w-5 h-5" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 flex flex-col shadow-2xl h-full bg-sidebar animate-in slide-in-from-left-4">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 -right-14 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center text-slate-600 z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <NavContent collapsed={false} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 border-r-4 border-primary shadow-[4px_0_15px_-3px_rgba(37,99,235,0.15)] dark:shadow-[4px_0_15px_-3px_rgba(59,130,246,0.2)] transition-all duration-300 relative z-40 bg-sidebar",
        isCollapsed ? "w-[60px]" : "w-60"
      )}>
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="absolute left-1/2 -translate-x-1/2 top-4 p-1.5 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-all z-50"
          >
            <PanelLeftClose className="w-4 h-4 rotate-180" />
          </button>
        )}
        <NavContent collapsed={isCollapsed} />
      </aside>
    </>
  );
}