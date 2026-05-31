import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Briefcase, Users, Calendar,
  Receipt, CheckSquare, FolderOpen, Settings,
  Scale, UserCog, LogOut, CreditCard, UserCircle, UserPlus, GitBranch,
  BookOpen, Shield, TrendingUp, Trophy, Search, Mail, BarChart2, Download, MessageCircle, HeartHandshake,
  ChevronLeft, ChevronRight, PanelLeft, X,
  GraduationCap, BookMarked, ClipboardList, Bus, FileText,
  Stethoscope, Bed, Pill, FlaskConical, Activity,
  Sparkles, UtensilsCrossed, Star,
  ShoppingCart, Package, Truck, Tag, Layers, Bell,
  Award, Library, Building2, AlertCircle, Clock,
  Network, AlertTriangle, Gift, Banknote, CalendarOff,
  HandCoins, Users2, Blocks, Map, Warehouse, Car, MapPin,
  FileSearch, LayoutGrid, BedDouble, BellRing, MoreHorizontal, Pencil, Trash2, Eye
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useImpersonation } from "@/lib/ImpersonationContext";
import { INDUSTRIES, getIndustryNav } from "@/config/industries";

const clientNav = [
  { label: "My Portal", icon: "LayoutDashboard", path: "/client-portal" },
];

const ICON_MAP = {
  LayoutDashboard, Briefcase, Users, Calendar, Receipt, CheckSquare, FolderOpen, Settings,
  Scale, UserCog, LogOut, CreditCard, UserCircle, UserPlus, GitBranch, BookOpen, Shield,
  TrendingUp, Trophy, Search, Mail, BarChart2, Download, MessageCircle, HeartHandshake,
  GraduationCap, BookMarked, ClipboardList, Bus, FileText, Stethoscope, Bed, Pill,
  FlaskConical, Activity, Sparkles, UtensilsCrossed, Star, ShoppingCart, Package, Truck,
  Tag, Layers, Bell, Award, Library, Building2, AlertCircle, Clock, Network, AlertTriangle,
  Gift, Banknote, CalendarOff, HandCoins, Users2, Blocks, Map, Warehouse, Car, MapPin,
  FileSearch, LayoutGrid, BedDouble, BellRing, CheckSquare2: CheckSquare
};

import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Sidebar({ user, isCollapsed, setIsCollapsed }) {
  const { t } = useTranslation();
  const { impersonatedCompany } = useImpersonation();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dynamicModules, setDynamicModules] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [renameData, setRenameData] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const isAdmin = ["super_admin", "admin", "company_admin", "managing_partner"].includes(user?.role);
  
  useEffect(() => {
    const fetchDynamicNav = async () => {
      try {
        let query = supabase
          .from('module_definitions')
          .select('id, name, icon, status')
          .eq('is_active', 'true')
          .or(`company_id.eq.${user?.company_id || ''},shared_with.ilike.%${user?.company_id || ''}%`);
        
        if (!isAdmin) {
          query = query.eq('status', 'published');
        } else {
          query = query.in('status', ['published', 'draft']);
        }

        const { data } = await query;
        setDynamicModules(data || []);
      } catch (err) {
        console.error("Failed to load dynamic nav", err);
      }
    };
    if (user?.company_id) {
      fetchDynamicNav();
      const channel = supabase.channel('sidebar-modules')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'module_definitions' }, () => {
          fetchDynamicNav();
        })
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.company_id]);

  const activeCompanyLogo = impersonatedCompany?.logo_url || impersonatedCompany?.logo_light_url || user?.company_logo_url;
  const activeCompanyName = impersonatedCompany?.name || user?.company_name || "LexAfrica";

  const activeIndustry = sessionStorage.getItem('optalflow_industry_override') || impersonatedCompany?.industry_type || user?.company_industry || 'law';
  const industryData = INDUSTRIES[activeIndustry] || INDUSTRIES.law;
  const industryNav = getIndustryNav(activeIndustry);
  
  const savedModulesStr = localStorage.getItem(`active_modules_${user?.company_id}`);
  const activeModules = savedModulesStr ? JSON.parse(savedModulesStr) : null;
  
  const ROLE_PERMISSIONS = {
    lawyer: ["/my-dashboard", "/cases", "/leads", "/clients", "/calendar", "/tasks", "/documents", "/conflict-check", "/research", "/email-inbox", "/team"],
    paralegal: ["/my-dashboard", "/cases", "/clients", "/calendar", "/tasks", "/documents", "/research", "/email-inbox"],
    hr: ["/my-dashboard", "/hr", "/team", "/performance", "/documents", "/tasks", "/calendar"],
    finance: ["/my-dashboard", "/invoices", "/billing", "/tasks", "/documents", "/calendar"],
    support: ["/my-dashboard", "/tasks", "/documents", "/calendar", "/whatsapp", "/email-inbox"]
  };

  const allowedPaths = isAdmin ? null : (ROLE_PERMISSIONS[user?.role] || ROLE_PERMISSIONS.support);

  const filteredCompanyNav = industryNav.filter(item => {
    if (activeModules && !['/', '/settings', '/integrations', '/admin'].includes(item.path)) {
      if (!activeModules.includes(item.path)) return false;
    }
    if (isAdmin) return true;
    if (activeIndustry !== 'law') return true; // Only apply strict law role filtering in law mode for now
    return allowedPaths.includes(item.path);
  });

  const dynamicNavItems = dynamicModules.map(m => ({
    id: m.id,
    label: m.name,
    icon: m.icon || "Sparkles",
    status: m.status || "published",
    path: `/m/${m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`,
    isDynamic: true
  }));

  const baseNav = user?.role === "client" ? clientNav : filteredCompanyNav;
  const appBuilderItem = { label: "Module Builder", icon: "Blocks", path: "/modules/create" };
  const marketplaceItem = { label: "Marketplace", icon: "ShoppingCart", path: "/marketplace" };
  let navItems = isAdmin
    ? [...baseNav, ...dynamicNavItems, appBuilderItem, marketplaceItem, { label: "Firm Setup", icon: "Settings", path: "/firm-setup" }]
    : [...baseNav, ...dynamicNavItems, marketplaceItem];
    
  if (user?.role === "super_admin") {
    navItems = [...navItems, { label: "Super Admin Portal", icon: "Shield", path: "/system-admin" }];
  }

  const handleDeleteModule = (id, name) => {
    setDeleteData({ id, name });
  };

  const handleRenameModule = (id, currentName) => {
    setRenameData({ id, currentName, newName: currentName });
  };

  const confirmDelete = async () => {
    if (deleteData) {
      setDynamicModules(prev => prev.filter(m => m.id !== deleteData.id));
      await supabase.from('module_definitions').delete().eq('id', deleteData.id);
      setDeleteData(null);
    }
  };

  const confirmRename = async () => {
    if (renameData && renameData.newName.trim() !== "" && renameData.newName !== renameData.currentName) {
      setDynamicModules(prev => prev.map(m => m.id === renameData.id ? { ...m, name: renameData.newName } : m));
      await supabase.from('module_definitions').update({ name: renameData.newName }).eq('id', renameData.id);
      setRenameData(null);
    } else {
      setRenameData(null);
    }
  };

  const handleTogglePublish = async (id, currentStatus) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    setDynamicModules(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
    await supabase.from('module_definitions').update({ status: newStatus }).eq('id', id);
  };

  const renderNavContent = (collapsed) => (
    <div className="flex flex-col h-full bg-sidebar overflow-x-hidden">
      <div className={cn("py-5 border-b border-sidebar-border flex items-center transition-all", collapsed ? "px-4 justify-center" : "px-5 gap-3")}>
        {activeCompanyLogo ? (
          <img src={activeCompanyLogo} alt="Logo" className={cn("object-contain", collapsed ? "w-8 h-8" : "w-9 h-9")} />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-sm text-lg">
            {industryData.icon}
          </div>
        )}
        {!collapsed && (
          <div className="animate-in fade-in zoom-in duration-200">
            <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight leading-tight whitespace-nowrap truncate max-w-[140px]">{activeCompanyName}</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider whitespace-nowrap">{industryData.name}</p>
          </div>
        )}
      </div>

      {/* Section label */}
      {!collapsed ? (
        <div className="px-4 pt-5 pb-1.5 animate-in fade-in duration-200">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">{t('platform', 'Platform')}</p>
        </div>
      ) : (
        <div className="pt-5" />
      )}

      <nav className="flex-1 px-3 pb-3 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
          const IconComp = typeof item.icon === 'string' ? ICON_MAP[item.icon] || LayoutDashboard : item.icon;
          return (
            <div key={item.path} className="relative group">
              <Link
                to={item.path}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? t(item.label.toLowerCase().replace(/\s+/g, '_'), item.label) : undefined}
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-all duration-150 relative",
                  collapsed ? "justify-center p-2" : "gap-3 px-3 py-2 pr-8",
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <IconComp className={cn("flex-shrink-0 transition-all", collapsed ? "w-5 h-5" : "w-4 h-4")} />
                {!collapsed && (
                  <div className="flex items-center gap-2 overflow-hidden flex-1 animate-in fade-in duration-200">
                    <span className="whitespace-nowrap truncate">{t(item.label.toLowerCase().replace(/\s+/g, '_'), item.label)}</span>
                    {item.status === 'draft' && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded-sm">Draft</span>
                    )}
                  </div>
                )}
              </Link>
              
              {!collapsed && item.isDynamic && (
                <div className={cn("absolute right-2 top-1/2 -translate-y-1/2 transition-opacity", openMenuId === item.id ? "opacity-100 z-50" : "opacity-0 group-hover:opacity-100 z-10")}>
                  <button 
                    onClick={(e) => { e.preventDefault(); setOpenMenuId(openMenuId === item.id ? null : item.id); }}
                    className="p-1 rounded hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  
                  {openMenuId === item.id && (
                    <div className="absolute right-0 mt-1 w-36 bg-sidebar border border-sidebar-border shadow-xl rounded-md overflow-hidden">
                      <div className="py-1">
                        <button onClick={(e) => { e.preventDefault(); handleTogglePublish(item.id, item.status); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-xs text-sidebar-foreground hover:bg-sidebar-accent flex items-center gap-2 transition-colors">
                          <Eye className="w-3 h-3" /> {item.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button onClick={(e) => { e.preventDefault(); handleRenameModule(item.id, item.label); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-xs text-sidebar-foreground hover:bg-sidebar-accent flex items-center gap-2 transition-colors">
                          <Pencil className="w-3 h-3" /> Rename
                        </button>
                        <button onClick={(e) => { e.preventDefault(); navigate(`/modules/edit/${item.id}`); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-xs text-sidebar-foreground hover:bg-sidebar-accent flex items-center gap-2 transition-colors">
                          <Settings className="w-3 h-3" /> Customize
                        </button>
                        <button onClick={(e) => { e.preventDefault(); handleDeleteModule(item.id, item.label); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
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
        className="lg:hidden fixed top-3 start-4 z-50 p-2.5 rounded-xl bg-sidebar border border-sidebar-border shadow-sm text-foreground/80 hover:text-foreground hover:bg-sidebar-accent hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
      >
        <PanelLeft className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 flex flex-col shadow-2xl h-full bg-sidebar transition-transform animate-in ltr:slide-in-from-left-4 rtl:slide-in-from-right-4">
            <button 
              onClick={() => setMobileOpen(false)} 
              className="absolute top-4 -end-16 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:scale-105 transition-all z-10"
            >
              <X className="w-6 h-6" />
            </button>
            {renderNavContent(false)}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 border-e-[3px] border-e-blue-500 shadow-sm transition-all duration-300 relative z-40",
        isCollapsed ? "w-[80px] min-w-[80px] max-w-[80px]" : "w-[256px] min-w-[256px] max-w-[256px]"
      )}>
        {renderNavContent(isCollapsed)}
      </aside>

      <Dialog open={!!renameData} onOpenChange={(open) => !open && setRenameData(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Module</DialogTitle>
            <DialogDescription>
              Enter a new name for this module.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={renameData?.newName || ''} 
              onChange={e => setRenameData({...renameData, newName: e.target.value})}
              placeholder="Module Name"
              onKeyDown={e => {
                if (e.key === 'Enter') confirmRename();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameData(null)}>Cancel</Button>
            <Button onClick={confirmRename}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteData} onOpenChange={(open) => !open && setDeleteData(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Module</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete '{deleteData?.name}' and all its records? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteData(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete Module</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}