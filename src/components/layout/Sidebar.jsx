import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ProfileAvatarDialog from "@/components/shared/ProfileAvatarDialog";
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
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const isAdmin = ["super_admin", "admin", "company_admin", "managing_partner"].includes(user?.role);
  const activeIndustry = sessionStorage.getItem('optalflow_industry_override') || impersonatedCompany?.industry_type || user?.company_industry || 'law';
  
  useEffect(() => {
    const fetchDynamicNav = async () => {
      try {
        let query = supabase
          .from('module_definitions')
          .select('id, name, icon, status, industry_type')
          .eq('is_active', true)
          .or(`company_id.eq.${user?.company_id || ''},shared_with.ilike.%${user?.company_id || ''}%`);
        
        if (!isAdmin) {
          query = query.eq('status', 'published');
        } else {
          query = query.in('status', ['published', 'draft']);
        }

        const { data } = await query;
        const filteredData = (data || []).filter(m => !m.industry_type || m.industry_type === activeIndustry);
        setDynamicModules(filteredData);
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
  }, [user?.company_id, activeIndustry, isAdmin]);

  const activeCompanyLogo = impersonatedCompany?.logo_url || impersonatedCompany?.logo_light_url || user?.company_logo_url;
  const activeCompanyName = impersonatedCompany?.name || user?.company_name || "LexAfrica";

  const industryData = INDUSTRIES[activeIndustry] || INDUSTRIES.law;
  const industryNav = getIndustryNav(activeIndustry);
  
  const savedModulesStr = localStorage.getItem(`active_modules_${user?.company_id}`);
  const activeModules = savedModulesStr ? JSON.parse(savedModulesStr) : null;
  const isOrbitMode = activeModules?.length === 1 && activeModules[0] === '__orbit__';
  
  const ROLE_PERMISSIONS = {
    lawyer: ["/my-dashboard", "/cases", "/leads", "/clients", "/calendar", "/tasks", "/documents", "/conflict-check", "/research", "/email-inbox", "/team"],
    paralegal: ["/my-dashboard", "/cases", "/clients", "/calendar", "/tasks", "/documents", "/research", "/email-inbox"],
    hr: ["/my-dashboard", "/hr", "/team", "/performance", "/documents", "/tasks", "/calendar"],
    finance: ["/my-dashboard", "/invoices", "/billing", "/tasks", "/documents", "/calendar"],
    support: ["/my-dashboard", "/tasks", "/documents", "/calendar", "/whatsapp", "/email-inbox"]
  };

  const allowedPaths = isAdmin ? null : (ROLE_PERMISSIONS[user?.role] || ROLE_PERMISSIONS.support);

  const filteredCompanyNav = isOrbitMode ? [] : industryNav.filter(item => {
    if (activeModules && !['/', '/settings', '/integrations', '/admin'].includes(item.path)) {
      if (!activeModules.includes(item.path)) return false;
    }
    if (isAdmin) return true;
    if (activeIndustry !== 'law') return true;
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
        {isOrbitMode && !collapsed && dynamicNavItems.length === 0 && (
          <div className="mx-1 my-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
            <div className="text-2xl mb-1">⚡</div>
            <p className="text-xs font-bold text-indigo-700 mb-1">Orbit Mode Active</p>
            <p className="text-[11px] text-indigo-500 leading-snug mb-2">Use the Module Builder to create your custom pages with AI.</p>
            <Link to="/modules/create" className="inline-block text-[11px] font-bold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
              + New Module
            </Link>
          </div>
        )}
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
          const IconComp = typeof item.icon === 'string' ? ICON_MAP[item.icon] || LayoutDashboard : item.icon;
          return (
            <div key={item.path} className="relative group">
              <Link
                to={item.path}
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

      <div className={cn("border-t border-sidebar-border bg-sidebar flex items-center transition-all", collapsed ? "p-3 justify-center flex-col gap-3" : "p-3 gap-3")}>
        <button 
          onClick={() => setShowAvatarDialog(true)}
          className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-primary transition-all overflow-hidden"
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-primary">
              {(user?.full_name?.[0] || user?.company_name?.[0] || "A").toUpperCase()}
            </span>
          )}
        </button>
        {!collapsed && (
          <div className="flex-1 min-w-0 animate-in fade-in duration-200">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">
              {user?.full_name || user?.company_name || "Admin"}
            </p>
            <p className="text-[10px] text-muted-foreground capitalize truncate">{user?.role?.replace("_", " ")}</p>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!collapsed)}
          className={cn(
            "hidden md:flex absolute -right-3 top-6 bg-primary text-primary-foreground rounded-full p-1 shadow-md hover:bg-primary/90 transition-transform hover:scale-110",
            collapsed && "rotate-180"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div 
        className={cn(
          "hidden md:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 relative z-30 h-screen",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
            <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
              <h2 className="text-lg font-bold text-sidebar-foreground">{t('menu', 'Menu')}</h2>
              <button 
                onClick={() => setMobileOpen(false)} 
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:scale-105 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
              {renderNavContent(false)}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 px-1">
          {navItems.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            const IconComp = typeof item.icon === 'string' ? ICON_MAP[item.icon] || LayoutDashboard : item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl min-w-[64px] transition-all",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", isActive ? "bg-primary/10" : "")}>
                  <IconComp className={cn("w-5 h-5 transition-transform", isActive ? "scale-110" : "")} />
                </div>
                <span className={cn("text-[10px] font-semibold leading-none", isActive ? "text-primary" : "")}>
                  {t(item.label.toLowerCase().replace(/\s+/g, '_'), item.label)}
                </span>
              </Link>
            );
          })}
          
          {/* More Tab */}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl min-w-[64px] transition-all text-muted-foreground hover:text-foreground"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors">
              <MoreHorizontal className="w-5 h-5 transition-transform" />
            </div>
            <span className="text-[10px] font-semibold leading-none">
              {t("more", "More")}
            </span>
          </button>
        </div>
      </nav>



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
      
      <ProfileAvatarDialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog} />
    </>
  );
}