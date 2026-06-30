import { supabase} from '@/api/supabaseClient';
import React, { useState, useEffect} from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate} from "react-router-dom";
import { useTranslation} from "react-i18next";
import ProfileAvatarDialog from "@/components/shared/ProfileAvatarDialog";
import { cn} from "@/lib/utils";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
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
 FileSearch, LayoutGrid, BedDouble, BellRing, MoreHorizontal, Pencil, Trash2, Eye, EyeOff, Zap, Store
, ShieldAlert, HeartPulse, FilePlus, FileCheck, Gavel, CalendarDays, CalendarCheck, UserCheck, PenTool, Target, Calculator, Home, Moon, CalendarSearch, Wallet, PieChart, ArrowUpRight, ArrowDownLeft, Laptop, Smartphone, MessageSquare, LineChart, Brain, PackageSearch, Globe, Archive
} from "lucide-react";
import { base44} from "@/api/base44Client";
import { useImpersonation} from "@/lib/ImpersonationContext";
import { INDUSTRIES, getIndustryNav} from "@/config/industries";

const clientNav = [
 { label: "My Portal", icon: "LayoutDashboard", path: "/client-portal"},
];

const ICON_MAP = {
 LayoutDashboard, Briefcase, Users, Calendar, Receipt, CheckSquare, FolderOpen, Settings,
 Scale, UserCog, LogOut, CreditCard, UserCircle, UserPlus, GitBranch, BookOpen, Shield,
 TrendingUp, Trophy, Search, Mail, BarChart2, Download, MessageCircle, HeartHandshake,
 GraduationCap, BookMarked, ClipboardList, Bus, FileText, Stethoscope, Bed, Pill,
 FlaskConical, Activity, Sparkles, UtensilsCrossed, Star, ShoppingCart, Package, Truck,
 Tag, Layers, Bell, Award, Library, Building2, AlertCircle, Clock, Network, AlertTriangle,
 Gift, Banknote, CalendarOff, HandCoins, Users2, Blocks, Map, Warehouse, Car, MapPin, Archive,
 FileSearch, LayoutGrid, BedDouble, BellRing, CheckSquare2: CheckSquare, Zap, Store
, ShieldAlert, HeartPulse, FilePlus, FileCheck, Gavel, CalendarDays, CalendarCheck, UserCheck, PenTool, Target, Calculator, Home, Moon, CalendarSearch, Wallet, PieChart, ArrowUpRight, ArrowDownLeft, Laptop, Smartphone, MessageSquare, LineChart, Brain, PackageSearch, Globe};

import { generateText } from '@/lib/cloudflareAI';
import { powerSync} from "@/api/PowerSyncConnector";
import { useAuth} from "@/lib/AuthContext";
import { useCompanyId} from "@/hooks/useCompanyId";
import { useQuery, useQueryClient} from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from "@/components/ui/dialog";
import { Button} from "@/components/ui/button";
import { Input} from "@/components/ui/input";
import { useVideo} from "@/lib/VideoContext";

export default function Sidebar({ user, isCollapsed, setIsCollapsed}) {
 const { t} = useTranslation();
 const { impersonatedCompany} = useImpersonation();
 const queryClient = useQueryClient();
 const companyId = useCompanyId();
 const location = useLocation();
 const navigate = useNavigate();
 const [mobileOpen, setMobileOpen] = useState(false);
 const [dynamicModules, setDynamicModules] = useState([]);
 const [openMenuId, setOpenMenuId] = useState(null);
 const [renameData, setRenameData] = useState(null);
 const [deleteData, setDeleteData] = useState(null);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [isAiSorting, setIsAiSorting] = useState(false);

  useEffect(() => {
    if (!companyId || !location.pathname) return;
    const key = `slate_page_clicks_${companyId}`;
    try {
      const clicks = JSON.parse(localStorage.getItem(key) || '{}');
      clicks[location.pathname] = (clicks[location.pathname] || 0) + 1;
      localStorage.setItem(key, JSON.stringify(clicks));
    } catch(e) {}
  }, [location.pathname, companyId]);

  const isAdmin = ["super_admin", "admin", "company_admin", "managing_partner"].includes(user?.role);
  const [rolePermissions, setRolePermissions] = useState(isAdmin ? null : undefined);

  useEffect(() => {
    let active = true;
    const fetchPermissions = async () => {
      if (!user?.id || !companyId || isAdmin) {
        if(active) setRolePermissions(null); // Admins see everything
        return;
      }
      try {
        // 1. Get employee record for current user
        const empRes = await powerSync.execute('SELECT role FROM univ_hr_employees WHERE user_id = ? AND company_id = ? LIMIT 1', [user.id, companyId]);
        if (empRes.rows?.length > 0) {
          const roleId = empRes.rows._array[0].role;
          if (roleId) {
            // 2. Get permissions for role
            const permRes = await powerSync.execute('SELECT feature_path FROM platform_role_permissions WHERE role_id = ?', [roleId]);
            if(active) setRolePermissions(permRes.rows._array.map(p => p.feature_path));
          } else {
            if(active) setRolePermissions([]); // No role assigned = no access
          }
        } else {
          if(active) setRolePermissions([]); // Not an employee record = no access (strict fallback)
        }
      } catch (e) { console.error(e); }
    };
    fetchPermissions();
    return () => { active = false; };
  }, [user?.id, companyId, isAdmin]);

  // Filter function
  const filterByRole = (navItems) => {
    if (rolePermissions === undefined) return []; // Still loading, show nothing to prevent flashing
    if (rolePermissions === null) return navItems; // Admin or unfiltered access
    
    return navItems.filter(item => {
      // Always allow main dashboard
      if (item.path === '/') return true;
      // Allow settings if they explicitly have settings permission
      if (item.path === '/settings' && !rolePermissions.includes('/settings')) return false;
      // Check if path is in permissions
      return rolePermissions.includes(item.path);
    });
  };

 const { activeRoomUrl} = useVideo();
 const activeIndustry = sessionStorage.getItem('slate_industry_override') || impersonatedCompany?.industry || impersonatedCompany?.industry_type || user?.company_industry || 'law';
 
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

 const { data} = await query;
 const filteredData = (data || []).filter(m => !m.industry_type || m.industry_type === activeIndustry);
 setDynamicModules(filteredData);
} catch (err) {
 console.error("Failed to load dynamic nav", err);
}
};
 if (user?.company_id) {
 fetchDynamicNav();
 const channel = supabase.channel('sidebar-modules')
 .on('postgres_changes', { event: '*', schema: 'public', table: 'module_definitions'}, () => {
 fetchDynamicNav();
})
 .subscribe();
 return () => {
 supabase.removeChannel(channel);
};
}
}, [user?.company_id, activeIndustry, isAdmin]);

 const { data: companyData} = useQuery({
 queryKey: ['company', user?.company_id],
 queryFn: async () => {
 if (!user?.company_id) return null;
 const { data} = await powerSync.execute('SELECT * FROM companies WHERE id = ? LIMIT 1', [user.company_id]).then(res => ({ data: res.rows._array[0]}));
 return data;
},
 enabled: !!user?.company_id
});

 const activeCompanyLogoDark = companyData?.logo_url || impersonatedCompany?.logo_url || user?.company_logo_url;
 const activeCompanyLogoLight = companyData?.logo_light_url || impersonatedCompany?.logo_light_url || activeCompanyLogoDark;
 const activeCompanyName = companyData?.name || impersonatedCompany?.name || user?.company_name || "Slate";
 const activeEducationLevel = impersonatedCompany?.industry || impersonatedCompany?.industry_type || companyData?.industry_type || 'primary';

 const industryData = INDUSTRIES[activeIndustry] || INDUSTRIES.law;
 const industryNavRaw = getIndustryNav(activeIndustry, activeEducationLevel);
  const industryNav = filterByRole(industryNavRaw);
 
 const savedModulesStr = localStorage.getItem(`active_modules_${companyId}`);
 const localModules = savedModulesStr ? JSON.parse(savedModulesStr) : null;
 
 // Silent background sync for active modules
 const { data: dbModules} = useQuery({
 queryKey: ['active_modules_sync', companyId],
 queryFn: async () => {
 if (!companyId) return null;
 const { data, error} = await supabase
 .from('industry_records')
 .select('data')
 .eq('company_id', companyId)
 .eq('record_type', 'active_modules')
 .maybeSingle();
 
  if (!error && data?.data) {
  const currentStr = localStorage.getItem(`active_modules_${companyId}`);
  const newStr = JSON.stringify(data.data);
  if (currentStr !== newStr) {
  localStorage.setItem(`active_modules_${companyId}`, newStr);
  }
  return data.data;
 } else if (!data?.data && savedModulesStr) {
  // DB is missing the modules but we have them locally! Sync UP to DB
  try {
    const parsedLocal = JSON.parse(savedModulesStr);
    supabase.from('industry_records').insert({
      id: crypto.randomUUID(),
      company_id: companyId,
      industry: 'custom',
      record_type: 'active_modules',
      search_text: 'auto-synced active modules',
      data: parsedLocal
    }).then(({error}) => {
      if(error) console.error("Auto-sync UP failed:", error);
    });
    return parsedLocal;
  } catch(e) {}
 }
  return null;
},
 enabled: !!companyId
});

 const activeModules = dbModules || localModules;
 const isOrbitMode = activeModules?.length === 1 && activeModules[0] === '__orbit__';
 
 const ROLE_PERMISSIONS = {
 // Law Firm Roles
 lawyer: ["/my-dashboard", "/cases", "/leads", "/clients", "/calendar", "/tasks", "/documents", "/conflict-check", "/research", "/email-inbox", "/chat", "/board", "/team"],
 paralegal: ["/my-dashboard", "/cases", "/clients", "/calendar", "/tasks", "/documents", "/research", "/email-inbox", "/chat", "/board"],
 legal_secretary: ["/my-dashboard", "/clients", "/calendar", "/tasks", "/documents", "/whatsapp", "/email-inbox", "/chat"],
 finance: ["/my-dashboard", "/invoices", "/billing", "/tasks", "/documents", "/calendar", "/reports", "/email-inbox", "/chat"],
 hr: ["/my-dashboard", "/hr", "/team", "/performance", "/documents", "/tasks", "/calendar", "/chat"],
 client: ["/", "/client-cases", "/billing", "/documents", "/settings", "/chat", "/board"],
 
 // School Roles
 teacher: ["/", "/classes", "/timetable", "/assignments", "/attendance", "/grades", "/exams", "/discipline", "/library", "/notices", "/marketplace", "/documents", "/tasks", "/reports", "/chat", "/board", "/email-inbox"],
 student: ["/student-portal", "/chat", "/board"],
 parent: ["/parent-portal", "/chat", "/board"],
 accountant: ["/", "/fees", "/reports", "/documents", "/tasks", "/email-inbox", "/chat"],
 librarian: ["/", "/library", "/documents", "/tasks", "/email-inbox", "/chat"],

 // Hospital Roles
 doctor: ["/", "/patients", "/appointments", "/wards", "/prescriptions", "/lab-results", "/documents", "/tasks", "/chat", "/board", "/email-inbox"],
 nurse: ["/", "/patients", "/wards", "/prescriptions", "/lab-results", "/tasks", "/chat", "/email-inbox"],
 receptionist: ["/", "/patients", "/appointments", "/claims", "/chat", "/email-inbox", "/front-desk", "/reservations", "/guests", "/room-management", "/guest-requests", "/billing"],
 pharmacist: ["/", "/prescriptions", "/pharmacy", "/chat", "/email-inbox"],
 lab_technician: ["/", "/lab-results", "/tasks", "/chat"],

 // Hotel Roles (receptionist combined above to share path if needed, but they use different modules)
 housekeeper: ["/", "/rooms", "/housekeeping", "/guest-requests", "/tasks", "/chat"],
 chef: ["/", "/restaurant", "/inventory", "/tasks", "/chat"],
 waiter: ["/", "/restaurant", "/guest-requests", "/chat"],
 maintenance: ["/", "/rooms", "/guest-requests", "/tasks", "/chat"],

 // Religion Roles
 elder: ["/", "/members", "/groups", "/events", "/donations", "/volunteers", "/prayers", "/attendance", "/documents", "/chat", "/board", "/milestones"],
 group_leader: ["/", "/groups", "/events", "/volunteers", "/small-groups", "/prayers", "/attendance", "/documents", "/chat"],
 treasurer: ["/", "/donations", "/reports", "/documents", "/chat"],
 volunteer: ["/", "/events", "/volunteers", "/tasks", "/chat"],
 member: ["/", "/events", "/small-groups", "/prayers", "/sermons", "/donations", "/milestones"],

 // Insurance Agency Roles
 underwriter: ["/", "/policies", "/claims", "/underwriting", "/documents", "/chat", "/email-inbox"],
 agent: ["/", "/policies", "/leads", "/clients", "/agent-performance", "/documents", "/chat", "/board", "/email-inbox"],
 claims_adjuster: ["/", "/policies", "/claims", "/documents", "/tasks", "/chat", "/email-inbox"],

 // Retail / POS Roles
 supervisor: ["/retail-dashboard", "/retail-hq", "/pos", "/orders", "/retail-inventory", "/products", "/barcodes", "/rmas", "/promotions", "/retail-customers", "/shifts", "/reports", "/tasks", "/chat", "/email-inbox"],
 cashier: ["/retail-dashboard", "/pos", "/orders", "/retail-customers", "/loyalty", "/shifts", "/tasks"],
 inventory_manager: ["/retail-dashboard", "/retail-inventory", "/purchase-orders", "/products", "/barcodes", "/rmas", "/suppliers", "/shifts", "/tasks"],
 
 // Logistics Roles
 dispatcher: ["/", "/shipments", "/dispatch", "/drivers", "/routes", "/fleet", "/pickups", "/chat", "/email-inbox"],
 driver: ["/", "/dispatch", "/routes", "/pickups", "/tasks", "/chat"],
 warehouse_staff: ["/", "/shipments", "/warehouse", "/inventory", "/tasks", "/chat"],

 // HR / ERP Roles
 hr_manager: ["/", "/employees", "/recruitment", "/payroll", "/leave", "/performance", "/training", "/org-chart", "/disciplinary", "/benefits", "/documents", "/reports", "/tasks", "/chat", "/email-inbox"],
 recruiter: ["/", "/recruitment", "/documents", "/tasks", "/chat"],
 department_head: ["/", "/employees", "/leave", "/performance", "/training", "/org-chart", "/tasks", "/chat"],
 payroll_officer: ["/", "/employees", "/payroll", "/benefits", "/reports", "/documents", "/chat"],
 employee: ["/", "/leave", "/training", "/org-chart", "/benefits", "/tasks", "/chat"],

 support: ["/my-dashboard", "/", "/tasks", "/documents", "/calendar", "/whatsapp", "/email-inbox", "/chat"]
};

 const FEATURE_PATHS = {
 'Dashboard': ['/'],
 'Access Control': ['/admin/users', '/settings'],
 'Documents': ['/documents'],
 'Projects': ['/cases', '/projects'],
 'CRM Leads': ['/leads', '/clients'],
 'Invoices': ['/billing', '/invoices'],
 'HR Employees': ['/hr', '/employees', '/team'],
 'Inventory': ['/inventory', '/products'],
 'Messaging': ['/chat', '/whatsapp'],
 'Support Tickets': ['/support-center', '/complaints'],
 'Appointments': ['/calendar', '/appointments'],
 'Payroll': ['/payroll'],
 'Asset Management': ['/equipment-inventory', '/fleet'],
 'Procurement': ['/purchase-orders', '/suppliers'],
 'Analytics': ['/reports', '/analytics']
};

 const { data: univAccessData} = useQuery({
 queryKey: ['univ_role', user?.role, companyId],
 queryFn: async () => {
 if (!user?.role || !companyId) return null;
 const { data} = await supabase
 .from('univ_roles')
 .select('permissions')
 .eq('company_id', companyId)
 .eq('role_name', user.role)
 .maybeSingle();
 return data;
},
 enabled: !!user?.role && !!companyId && !isAdmin
});

 const univAllowedPaths = React.useMemo(() => {
 if (!univAccessData?.permissions) return null;
 const paths = ['/', '/settings', '/chat', '/board', '/email-inbox'];
 
 // Map the permission keys back to actual paths from the industry nav
 industryNavRaw.forEach(navItem => {
   const label = navItem.label || navItem.section;
   if (label && univAccessData.permissions[label]?.read) {
     if (navItem.path) paths.push(navItem.path);
   }
 });
 return paths;
}, [univAccessData, industryNavRaw]);

 const allowedPaths = isAdmin ? null : (univAllowedPaths || ROLE_PERMISSIONS[user?.role] || ROLE_PERMISSIONS.support);

 const coreOrbitNav = [
 { label: "Dashboard", path: "/", icon: "Sparkles"},
 { label: "Inbox", path: "/email-inbox", icon: "Mail"},
 { label: "Chat", path: "/chat", icon: "MessageCircle"},
 { label: "Board", path: "/board", icon: "LayoutGrid"},
 { label: "Feature Insider", path: "/feature-insider", icon: "FlaskConical"},
 { label: "Feature Vault", path: "/feature-vault", icon: "Archive"},
 { label: "Settings", path: "/settings", icon: "Settings"}
 ];

 const adminNav = [
    { label: "Overview", path: "/admin", icon: "LayoutDashboard"},
    { label: "Intelligence", path: "/admin/intelligence", icon: "Cpu"},
    { label: "Rollouts", path: "/admin/rollout", icon: "ToggleRight"},
    { label: "Quotas", path: "/admin/quotas", icon: "Database"},
    { label: "Workspaces", path: "/admin/firms", icon: "Building2"},
    { label: "Users", path: "/admin/users", icon: "Users"},
    { label: "Pricing", path: "/admin/pricing", icon: "Crown"},
    { label: "Global Invoices", path: "/admin/billing", icon: "DollarSign"},
    { label: "Security", path: "/admin/security", icon: "ShieldCheck"},
    { label: "Broadcasts", path: "/admin/broadcasts", icon: "Megaphone"},
    { label: "Enterprise Requests", path: "/admin/enterprise-requests", icon: "Building2"},
    { label: "Partner Applications", path: "/admin/partners", icon: "Handshake"},
    { label: "Feature Insider", path: "/admin/feature-insider", icon: "FlaskConical"}
 ];

 const isSuiteAdmin = ["super_admin", "admin"].includes(user?.role);

  let filteredCompanyNav = (isSuiteAdmin && location.pathname.startsWith('/admin')) ? adminNav : (isOrbitMode ? coreOrbitNav : industryNav.filter(item => {
 // If activeModules is explicitly set (Custom Selection mode)
 if (activeModules && !['/', '/settings', '/integrations', '/admin', '/email-inbox', '/chat', '/board', '/hr', '/roles', '/departments'].includes(item.path)) {
 // If it's not in the active modules, completely hide it
 if (!activeModules.includes(item.path)) return false;
 // If it IS in the active modules, bypass role restrictions so the user can actually see what they selected!
 return true;
}
 // If no activeModules override (Template mode), fallback to role permissions
 if (isAdmin) return true;
 if (!allowedPaths) return true;
 return allowedPaths.includes(item.path);
}));

  // Inject Branch Manager
  if (user?.role === 'company_admin' || user?.available_companies?.length >= 1) {
    filteredCompanyNav = [...filteredCompanyNav, { label: "Branch Manager", path: "/branch-manager", icon: "LayoutGrid" }];
  }

 const { data: customPages = []} = useQuery({
 queryKey: ['custom_pages', companyId],
 queryFn: () => base44.entities.LegalCase.filter({
 company_id: companyId,
 case_type: 'custom_page'
}),
 enabled: !!companyId
});

  const { data: navOverridesData } = useQuery({
    queryKey: ['nav_overrides', companyId],
    queryFn: async () => {
      if (!companyId) return { id: null, overrides: {} };
      const res = await powerSync.execute(`SELECT id, data FROM industry_records WHERE company_id = ? AND record_type = 'nav_overrides'`, [companyId]);
      if (res.rows?._array?.length > 0) {
        let raw = res.rows._array[0].data;
        let parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
        return { id: res.rows._array[0].id, overrides: parsed };
      }
      return { id: crypto.randomUUID(), overrides: {} };
    },
    enabled: !!companyId
  });

  const saveNavOverrides = async (newOverrides) => {
    const recordId = navOverridesData?.id || crypto.randomUUID();
    const payload = {
      id: recordId,
      company_id: companyId,
      record_type: 'nav_overrides',
      industry: activeIndustry || 'orbit_build',
      data: newOverrides,
      created_at: new Date().toISOString()
    };
    const _keys = Object.keys(payload);
    const _vals = Object.values(payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
    const existing = await powerSync.getOptional('SELECT id FROM industry_records WHERE id = ?', [payload.id]);
    if (existing) {
      await powerSync.execute(`UPDATE industry_records SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, payload.id]);
    } else {
      await powerSync.execute(`INSERT INTO industry_records (${_keys.join(', ')}) VALUES (${_keys.map(()=>'?').join(', ')})`, _vals);
    }
    queryClient.invalidateQueries({ queryKey: ['nav_overrides', companyId] });
  };

  const handleAiSmartSort = async () => {
    if (isAiSorting) return;
    setIsAiSorting(true);
    const toastId = toast.loading("AI is analyzing your usage and rearranging the sidebar...");
    try {
      const key = `slate_page_clicks_${companyId}`;
      const clicks = JSON.parse(localStorage.getItem(key) || '{}');
      const itemsToSort = navItems.map(n => ({ path: n.path, label: n.label, clicks: clicks[n.path] || 0 }));
      
      const prompt = `You are an expert UX designer. Rearrange these sidebar navigation items based on the user's click frequency and logical grouping. Output a raw JSON array of strings, where each string is the path of the item, ordered from most important (top) to least important (bottom). 
      Items: ${JSON.stringify(itemsToSort)}
      ONLY output the raw JSON array (e.g. ["/path1", "/path2"]), nothing else.`;

      const response = await generateText(prompt);
      let parsedOrder = [];
      try {
        const text = typeof response === 'string' ? response : JSON.stringify(response);
        const match = text.match(/\[.*\]/s);
        if (match) {
          parsedOrder = JSON.parse(match[0]);
        }
      } catch(e) {
        console.error("Parse failed", e);
      }

      if (parsedOrder && parsedOrder.length > 0) {
        const currentOverrides = navOverridesData?.overrides || {};
        const newOverrides = { ...currentOverrides };
        parsedOrder.forEach((path, idx) => {
          newOverrides[path] = { ...(newOverrides[path] || {}), order: idx + 1 };
        });
        await saveNavOverrides(newOverrides);
        toast.success("Sidebar smartly arranged!", { id: toastId });
      } else {
        toast.error("AI couldn't arrange right now.", { id: toastId });
      }
    } catch(err) {
      console.error(err);
      toast.error("AI Sorting failed", { id: toastId });
    } finally {
      setIsAiSorting(false);
    }
  };

  const handleDeleteStaticModule = async (path) => {
    try {
      const currentOverrides = navOverridesData?.overrides || {};
      const newOverrides = { ...currentOverrides, [path]: { ...(currentOverrides[path] || {}), deleted: true } };
      await saveNavOverrides(newOverrides);
      toast.success("Page deleted permanently");
    } catch(err) {
      toast.error("Failed to delete page");
    }
  };

  const handleMoveOrder = async (path, direction) => {
    try {
      const currentOverrides = navOverridesData?.overrides || {};
      const allPaths = navItems.map(i => i.path);
      const currentIndex = allPaths.indexOf(path);
      if (currentIndex === -1) return;
      
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= allPaths.length) return;

      const newOverrides = { ...currentOverrides };
      allPaths.forEach((p, i) => {
        if (!newOverrides[p]) newOverrides[p] = {};
        newOverrides[p].order = newOverrides[p].order || (i + 1) * 10;
      });

      const currentOrder = newOverrides[path].order;
      const targetPath = allPaths[targetIndex];
      const targetOrder = newOverrides[targetPath].order;
      
      newOverrides[path].order = targetOrder;
      newOverrides[targetPath].order = currentOrder;

      await saveNavOverrides(newOverrides);
      toast.success("Order updated");
    } catch(err) {
      toast.error("Failed to reorder");
    }
  };

  const handleHideStaticModule = async (path) => {
    try {
      const currentOverrides = navOverridesData?.overrides || {};
      const newOverrides = { ...currentOverrides, [path]: { ...(currentOverrides[path] || {}), hidden: true } };
      await saveNavOverrides(newOverrides);
      toast.success("Page hidden");
    } catch (err) {
      console.error(err);
      toast.error("Failed to hide page");
    }
  };

 const rawDynamicNavItems = dynamicModules.map(m => ({
 id: m.id,
 label: m.name,
 icon: m.icon || "Sparkles",
 status: m.status || "published",
 path: `/m/${(m.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`,
 isDynamic: true
}));

 const dynamicNavItems = rawDynamicNavItems.filter(item => {
 if (isAdmin) return true;
 if (!univAccessData?.permissions) return true;
 
 const normalizedItemName = (item.label || '').toLowerCase().replace(/\s/g, '');
 let foundInRbac = false;
 for (const [feat, perms] of Object.entries(univAccessData.permissions)) {
 const normalizedFeat = feat.toLowerCase().replace(/\s/g, '');
 if (normalizedItemName.includes(normalizedFeat) || normalizedFeat.includes(normalizedItemName)) {
 foundInRbac = true;
 if (perms.read) return true;
 }
 }
 return !foundInRbac;
});

 
 const { data: orbitBuildData} = useQuery({
 queryKey: ['orbit_build_config', companyId],
 queryFn: async () => {
 const { data, error} = await supabase
 .from('industry_records')
 .select('data')
 .eq('company_id', companyId)
 .eq('industry', 'orbit_build')
 .eq('record_type', 'workspace_config')
 .order('created_at', { ascending: false})
 .limit(1)
 .maybeSingle();
 
 if (error) {
 console.error("Failed to fetch orbit config:", error);
}
 return data?.data || null;
},
 enabled: !!companyId
});
 
 // Force dashboard to be at the top and mapped to the dashboard component correctly
 const orbitBuildNavItemsRaw = (orbitBuildData?.pages || [])
 .filter(p => p.component_id !== 'dashboard')
 .map((p, idx) => {
 return {
 id: p.page_name,
 label: p.page_name,
 icon: p.icon || "LayoutDashboard",
 path: `/ob/${(p.page_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
 isDynamic: true,
 component_id: p.component_id
};
});

 // Pass it through and filter by RBAC
 const orbitBuildNavItems = orbitBuildNavItemsRaw.filter(item => {
 if (isAdmin) return true;
 if (!univAccessData?.permissions) return true; // fallback if no role found
 
 const normalizedItemName = (item.label || '').toLowerCase().replace(/\s/g, '');
 let foundInRbac = false;
 for (const [feat, perms] of Object.entries(univAccessData.permissions)) {
 const normalizedFeat = feat.toLowerCase().replace(/\s/g, '');
 if (normalizedItemName.includes(normalizedFeat) || normalizedFeat.includes(normalizedItemName)) {
 foundInRbac = true;
 if (perms.read) return true;
 }
 }
 return !foundInRbac;
});
 
 const customPageItems = customPages.map(p => ({
 id: p.id,
 label: p.data?.pageTitle || p.search_text,
 icon: "LayoutDashboard",
 path: `/pages/${p.search_text}`,
 isDynamic: true
}));
 
 const baseNav = user?.role === "client" ? clientNav : (activeIndustry === 'orbit_build' ? coreOrbitNav : filteredCompanyNav);
 const createSlateItem = { label: "Create Slate", icon: "PlusCircle", path: "/slate/create"};
 const marketplaceItem = { label: "Marketplace", icon: "Store", path: "/marketplace"};
 const notificationsItem = { label: "Notifications", icon: "Bell", path: "/notifications"};
 
 // Put AI pages FIRST, then dynamic modules, custom pages, and FINALLY the baseNav (Chat, Board, Settings)
 // Extract dashboard from baseNav to put it at the very top
 const dashboardNav = baseNav.filter(item => item.label === "Dashboard" || item.path === "/");
 const intelligenceNav = [{ label: "Intelligence", icon: "Brain", path: "/intelligence"}];
 const remainingBaseNav = baseNav.filter(item => item.label !== "Dashboard" && item.path !== "/");
 
 let rawNavItems = isAdmin
 ? [...dashboardNav, ...intelligenceNav, ...orbitBuildNavItems, ...dynamicNavItems, ...customPageItems, ...remainingBaseNav, notificationsItem, createSlateItem, marketplaceItem, { label: "Firm Setup", icon: "Settings", path: "/firm-setup"}]
 : [...dashboardNav, ...intelligenceNav, ...orbitBuildNavItems, ...dynamicNavItems, ...customPageItems, ...remainingBaseNav, notificationsItem, marketplaceItem];

if (user?.role === "super_admin") {
    rawNavItems.push({ label: "Global Admin", icon: "Globe", path: "/super-admin" });
    rawNavItems.push({ label: "Enterprise Admin", icon: "Building2", path: "/enterprise-admin" });
} else if (user?.role === "enterprise_admin" || isAdmin) {
    rawNavItems.push({ label: "Enterprise Admin", icon: "Building2", path: "/enterprise-admin" });
}

  if (!rawNavItems.some(n => n.path === '/feature-insider')) {
    rawNavItems.push({ label: "Feature Insider", path: "/feature-insider", icon: "FlaskConical" });
  }

  // Deduplicate by label to prevent double Dashboards, and apply static nav overrides
  const seenLabels = new Set();
  let navItems = [];
  for (const item of rawNavItems) {
    const key = item.label?.toLowerCase() || '';
    if (!seenLabels.has(key)) {
      seenLabels.add(key);
      const override = navOverridesData?.overrides?.[item.path] || {};
      if (override.hidden || override.deleted) continue;
      if (override.customName) {
        navItems.push({ ...item, label: override.customName });
      } else {
        navItems.push(item);
      }
    }
  }

  navItems.sort((a, b) => {
    const aOrder = navOverridesData?.overrides?.[a.path]?.order || 9999;
    const bOrder = navOverridesData?.overrides?.[b.path]?.order || 9999;
    return aOrder - bOrder;
  });

 const handleDeleteModule = (id, name) => {
 setDeleteData({ id, name});
};

  const handleRenameModule = (id, currentName, isOrbitBuild = false, isStatic = false, path = '') => {
  setRenameData({ id, currentName, newName: currentName, isOrbitBuild, isStatic, path });
 };

 const confirmDelete = async () => {
 if (deleteData) {
 setDynamicModules(prev => prev.filter(m => m.id !== deleteData.id));
 await powerSync.execute(`DELETE FROM module_definitions WHERE id = ?`, [deleteData.id]);
 setDeleteData(null);
}
};

  const confirmRename = async () => {
  if (renameData && renameData.newName.trim() !== "" && renameData.newName !== renameData.currentName) {
  if (renameData.isStatic) {
    try {
      const currentOverrides = navOverridesData?.overrides || {};
      const newOverrides = { ...currentOverrides, [renameData.path]: { ...(currentOverrides[renameData.path] || {}), customName: renameData.newName } };
      await saveNavOverrides(newOverrides);
      toast.success("Page renamed");
    } catch (err) {
      toast.error("Failed to rename page");
    }
  } else if (renameData.isOrbitBuild) {
 // OrbitBuild components are stored in industry_records
 if (orbitBuildData && orbitBuildData.pages) {
 const updatedPages = orbitBuildData.pages.map(p => 
 p.page_name === renameData.currentName ? { ...p, page_name: renameData.newName} : p
 );
 await (async () => {
 const _payload = { data: { ...orbitBuildData, pages: updatedPages}};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 await powerSync.execute(`UPDATE industry_records SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE company_id = ? AND industry = 'orbit_build' AND record_type = 'workspace_config'`, [..._vals, companyId]);
})();
 // Invalidate to refresh sidebar
 queryClient.invalidateQueries(['orbit_build_config', companyId]);
}
} else {
 setDynamicModules(prev => prev.map(m => m.id === renameData.id ? { ...m, name: renameData.newName} : m));
 await (async () => { const _payload = {name: renameData.newName}; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE module_definitions SET ${_keys.map(k => k+' = ?').join(', ')} WHERE id = ?`, [..._vals, renameData.id]);})();
}
 setRenameData(null);
} else {
 setRenameData(null);
}
};

 const handleTogglePublish = async (id, currentStatus) => {
 const newStatus = currentStatus === 'published' ? 'draft' : 'published';
 setDynamicModules(prev => prev.map(m => m.id === id ? { ...m, status: newStatus} : m));
 await (async () => { const _payload = {status: newStatus}; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE module_definitions SET ${_keys.map(k => k+' = ?').join(', ')} WHERE id = ?`, [..._vals, id]);})();
};

 const renderNavContent = (collapsed) => (
 <div className="flex flex-col h-full bg-sidebar overflow-x-hidden">
 <div className={cn("py-5 border-b border-sidebar-border-[0.5px] border-black/9 dark:border-white/8 flex items-center transition-all", collapsed ? "px-4 justify-center" : "px-5 gap-3")}>
 {activeCompanyLogoDark || activeCompanyLogoLight ? (
   <>
     <img src={activeCompanyLogoDark || activeCompanyLogoLight} alt="Logo" className={cn("object-contain hidden dark:block", collapsed ? "w-8 h-8" : "w-9 h-9")} />
     <img src={activeCompanyLogoLight || activeCompanyLogoDark} alt="Logo" className={cn("object-contain block dark:hidden", collapsed ? "w-8 h-8" : "w-9 h-9")} />
   </>
 ) : (
 <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 text-lg">
 {industryData.icon}
 </div>
 )}
 {!collapsed && (
 <div className="animate-in fade-in zoom-in duration-200">
 <div className="flex flex-col">
 <span className="font-semibold text-foreground leading-tight tracking-tight mt-0.5">{activeCompanyName}</span>
 <span className="text-[9px] font-extrabold text-[#71717a] dark:text-gray-400 uppercase tracking-widest leading-none mt-1 tracking-[0.04em]">
 {companyData?.tagline || (activeIndustry === 'orbit_build' ? (orbitBuildData?.industry_name || 'Custom Wixlate') : industryData.name)}
 </span>
 </div>
 </div>
 )}
 </div>

 {/* Section label */}
 {!collapsed ? (
 <div className="px-4 pt-5 pb-1.5 animate-in fade-in duration-200 flex justify-between items-center">
 <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-[0.08em] whitespace-nowrap">{t('platform', 'Platform')}</p>
 <button onClick={handleAiSmartSort} disabled={isAiSorting} className="flex items-center gap-1 text-[9px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full hover:bg-primary/20 transition-colors">
   <Sparkles className={cn("w-2.5 h-2.5", isAiSorting && "animate-spin")} /> {isAiSorting ? 'Sorting...' : 'AI Sort'}
 </button>
 </div>
 ) : (
 <div className="pt-5" />
 )}

 <nav className="flex-1 px-3 pb-3 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-primary">
 {isOrbitMode && !collapsed && dynamicNavItems.length === 0 && orbitBuildNavItems.length === 0 && (
 <div className="mx-1 my-3 p-3 rounded-xl bg-slate-50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-center">
 <div className="text-2xl mb-1 tracking-[-0.02em]">⚡</div>
 <p className="text-xs font-semibold text-primary/90 mb-1 tracking-[0.04em]">Orbit Mode Active</p>
 <p className="text-[11px] text-primary leading-snug mb-2">Use the Slate Builder to create your custom pages with AI.</p>

 </div>
 )}
 {navItems.map((item, idx) => {
 const isRootPath = ["/", "/s/", "/u/", "/v/", "/o/", "/admin", "/optavel", "/logistics", "/real-estate", "/retail", "/hotel", "/pharmacy", "/religion"].includes(item.path);
 const isActive = location.pathname === item.path || (!isRootPath && location.pathname.startsWith(item.path));
 const IconComp = typeof item.icon === 'string' ? (ICON_MAP[item.icon] || LayoutDashboard) : (item.icon || LayoutDashboard);
 const showSection = item.section && !collapsed;
 const isVideoCallItem = item.path === '/board' || item.label?.toLowerCase().includes('video');
 const showLiveDot = isVideoCallItem && !!activeRoomUrl;
 return (
 <div key={item.path}>
 {showSection && (
 <div className="pt-4 pb-1.5 px-1 first:pt-0">
 <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/40">{t((item.section || '').toLowerCase().replace(/\s+/g, '_'), item.section)}</p>
 </div>
 )}
 <div className="relative group">
 <Link
 to={item.path}
 title={collapsed ? t((item.label || '').toLowerCase().replace(/\s+/g, '_'), item.label) : undefined}
 className={cn(
 "flex items-center rounded-xl text-sm transition-all duration-150 relative",
 collapsed ? "justify-center p-2" : "gap-3 px-3 py-2 pr-8",
 isActive
 ? "bg-primary/10 text-primary font-medium border-l-2 border-l-primary"
 : "text-sidebar-foreground/70 font-normal hover:text-sidebar-foreground hover:bg-sidebar-accent"
 )}
 >

 <span className="relative flex-shrink-0">
 <IconComp className={cn("transition-all", collapsed ? "w-5 h-5" : "w-4 h-4")} />
 {showLiveDot && (
 <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500/10" />
 </span>
 )}
 </span>
 {!collapsed && (
 <div className="flex items-center gap-2 overflow-hidden flex-1 animate-in fade-in duration-200">
 <span className="whitespace-nowrap truncate">{t((item.label || '').toLowerCase().replace(/\s+/g, '_'), item.label)}</span>
 {item.status === 'draft' && (
 <span className="text-[9px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded-sm tracking-[0.04em]">Draft</span>
 )}
 </div>
 )}
 </Link>
 
  {!collapsed && (
  <div className={cn("absolute right-2 top-1/2 -translate-y-1/2 transition-opacity", openMenuId === (item.id || item.path) ? "opacity-100 z-50" : "opacity-0 group-hover:opacity-100 z-10")}>
  <button 
  onClick={(e) => { e.preventDefault(); setOpenMenuId(openMenuId === (item.id || item.path) ? null : (item.id || item.path));}}
  className="p-1 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground"
  >
  <MoreHorizontal className="w-4 h-4" />
  </button>
  
  {openMenuId === (item.id || item.path) && (
  <div className="absolute right-0 mt-1 w-36 bg-sidebar border-[0.5px] border-black/9 dark:border-white/8 border-sidebar-border-[0.5px] border-black/9 dark:border-white/8 rounded-lg overflow-hidden shadow-md">
  <div className="py-1">
  {item.isDynamic ? (
    <>
      {!item.component_id && (
      <button onClick={(e) => { e.preventDefault(); handleTogglePublish(item.id, item.status); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-xs text-sidebar-foreground hover:bg-sidebar-accent flex items-center gap-2 transition-colors tracking-[0.04em]">
      <Eye className="w-3 h-3" /> {item.status === 'published' ? 'Unpublish' : 'Publish'}
      </button>
      )}
      <button onClick={(e) => { e.preventDefault(); handleRenameModule(item.id, item.label, !!item.component_id); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-xs text-sidebar-foreground hover:bg-sidebar-accent flex items-center gap-2 transition-colors tracking-[0.04em]">
      <Pencil className="w-3 h-3" /> Rename
      </button>
      {!item.component_id && (
      <>
      <button onClick={(e) => { e.preventDefault(); navigate(`/slate/edit/${item.id}`); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-xs text-sidebar-foreground hover:bg-sidebar-accent flex items-center gap-2 transition-colors tracking-[0.04em]">
      <Settings className="w-3 h-3" /> Customize
      </button>
      <button onClick={(e) => { e.preventDefault(); handleDeleteModule(item.id, item.label); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-500/10/10 flex items-center gap-2 transition-colors tracking-[0.04em]">
      <Trash2 className="w-3 h-3" /> Delete
      </button>
      </>
      )}
    </>
  ) : (
    <>
      <button onClick={(e) => { e.preventDefault(); handleMoveOrder(item.path, 'up'); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-xs text-sidebar-foreground hover:bg-sidebar-accent flex items-center gap-2 transition-colors tracking-[0.04em]">
      <ArrowUpRight className="w-3 h-3" /> Move Up
      </button>
      <button onClick={(e) => { e.preventDefault(); handleMoveOrder(item.path, 'down'); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-xs text-sidebar-foreground hover:bg-sidebar-accent flex items-center gap-2 transition-colors tracking-[0.04em]">
      <ArrowDownLeft className="w-3 h-3" /> Move Down
      </button>
      <button onClick={(e) => { e.preventDefault(); handleRenameModule(item.id, item.label, false, true, item.path); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-xs text-sidebar-foreground hover:bg-sidebar-accent flex items-center gap-2 transition-colors tracking-[0.04em]">
      <Pencil className="w-3 h-3" /> Rename
      </button>
      <button onClick={(e) => { e.preventDefault(); handleHideStaticModule(item.path); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-xs text-amber-500 hover:bg-amber-500/10 flex items-center gap-2 transition-colors tracking-[0.04em]">
      <EyeOff className="w-3 h-3" /> Hide Page
      </button>
      <button onClick={(e) => { e.preventDefault(); handleDeleteStaticModule(item.path); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors tracking-[0.04em]">
      <Trash2 className="w-3 h-3" /> Delete Page
      </button>
    </>
  )}
  </div>
  </div>
  )}
  </div>
  )}
 </div>
 </div>
 );
})}
 </nav>

 {/* Ongoing Call Banner */}
 {activeRoomUrl && (
 <div
 onClick={() => navigate('/board')}
 className="mx-3 mb-3 cursor-pointer rounded-xl bg-green-500/10/10 border-[0.5px] border-black/9 dark:border-white/8 border-green-500/30 p-3 flex items-center gap-2.5 hover:bg-green-500/10/20 transition-colors"
 >
 <span className="relative flex h-3 w-3 shrink-0">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
 <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500/10" />
 </span>
 {!collapsed && (
 <div className="flex-1 min-w-0">
 <p className="text-xs font-semibold text-green-600 dark:text-green-400 leading-tight tracking-[0.04em]">Live Call Active</p>
 <p className="text-[10px] text-green-600/70 dark:text-green-400/70 truncate">Click to return to call</p>
 </div>
 )}
 </div>
 )}

 {/* Modern User Profile & Dropdown Section */}
 <div className="mt-auto p-3 border-t border-sidebar-border-[0.5px] border-black/9 dark:border-white/8 bg-sidebar">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
 <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 overflow-hidden">
 {user?.avatar_url ? (
 <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
 ) : (
 <span className="text-xs font-semibold text-primary tracking-[0.04em]">
 {(user?.full_name?.[0] || user?.company_name?.[0] || "A").toUpperCase()}
 </span>
 )}
 </div>
 
 {!collapsed && (
 <div className="flex-1 text-left min-w-0 animate-in fade-in duration-200">
 <p className="text-[13px] font-medium leading-none text-foreground">
 {user?.full_name || user?.company_name || (user?.role === "super_admin" ? "Super Admin" : "Admin")}
 </p>
 <p className="text-[11px] text-foreground/50 capitalize truncate mt-0.5">
 {user?.role?.replace("_", " ")}
 </p>
 </div>
 )}
 
 {!collapsed && (
 <MoreHorizontal className="w-4 h-4 text-[#71717a] dark:text-gray-400 flex-shrink-0 ml-auto" />
 )}
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent className="w-56" align="end" side="right" sideOffset={8}>
 <DropdownMenuLabel className="font-normal">
 <div className="flex flex-col space-y-1">
 <p className="text-sm font-medium leading-none">{user?.full_name || (user?.role === "super_admin" ? "Super Admin" : "Admin")}</p>
 <p className="text-xs leading-none text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{user?.email}</p>
 </div>
 </DropdownMenuLabel>
 <DropdownMenuSeparator />
 <DropdownMenuItem onClick={() => setShowAvatarDialog(true)} className="cursor-pointer">
 <UserCircle className="w-4 h-4 mr-2" />
 Change Avatar
 </DropdownMenuItem>
 {isSuiteAdmin && (
 <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
 <Settings className="w-4 h-4 mr-2" />
 Settings
 </DropdownMenuItem>
 )}
 <DropdownMenuItem onClick={() => setShowRestoreDialog(true)} className="cursor-pointer">
 <Eye className="w-4 h-4 mr-2" />
 Restore Pages
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem onClick={() => base44.auth.logout()} className="text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer">
 <LogOut className="w-4 h-4 mr-2" />
 Log out
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>

 </div>
 );

 return (
 <>
 {/* Desktop sidebar - Strictly hidden on mobile */}
 <aside className={cn(
 "hidden md:flex flex-col h-screen sticky top-0 border-r-2 border-r-primary/30 transition-all duration-300 relative z-[1] bg-sidebar",
 isCollapsed ? "w-[80px] min-w-[80px] max-w-[80px]" : "w-[256px] min-w-[256px] max-w-[256px]"
 )}>
 {renderNavContent(isCollapsed)}
 </aside>

 <Dialog open={!!renameData} onOpenChange={(open) => !open && setRenameData(null)}>
 <DialogContent className="sm:max-w-[425px]">
 <DialogHeader>
 <DialogTitle>Rename Slate</DialogTitle>
 <DialogDescription>
 Enter a new name for this slate.
 </DialogDescription>
 </DialogHeader>
 <div className="py-4">
 <Input 
 value={renameData?.newName || ''} 
 onChange={e => setRenameData({...renameData, newName: e.target.value})}
 placeholder="Slate Name"
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
 <DialogTitle>Delete Slate</DialogTitle>
 <DialogDescription>
 Are you sure you want to delete '{deleteData?.name}' and all its records? This action cannot be undone.
 </DialogDescription>
 </DialogHeader>
 <DialogFooter className="mt-4">
 <Button variant="outline" onClick={() => setDeleteData(null)}>Cancel</Button>
 <Button variant="destructive" onClick={confirmDelete}>Delete Slate</Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Restore Hidden Pages</DialogTitle>
        <DialogDescription>
          Click on a hidden page to restore it to your sidebar.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-2 max-h-[300px] overflow-y-auto">
        {Object.entries(navOverridesData?.overrides || {}).filter(([_, data]) => data.hidden || (isAdmin && data.deleted)).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No hidden or deleted pages.</p>
        ) : (
          Object.entries(navOverridesData?.overrides || {}).filter(([_, data]) => data.hidden || (isAdmin && data.deleted)).map(([path, data]) => {
            // Find original label by matching path across rawNavItems or just using path
            const originalItem = rawNavItems.find(i => i.path === path);
            const label = data.customName || originalItem?.label || path;
            return (
              <div key={path} className="flex items-center justify-between p-2 rounded-lg border">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{label}</span>
                  {data.deleted && <span className="text-[9px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-semibold">Deleted</span>}
                </div>
                <Button size="sm" variant="outline" onClick={async () => {
                  try {
                    const currentOverrides = navOverridesData?.overrides || {};
                    const newOverrides = { ...currentOverrides, [path]: { ...currentOverrides[path], hidden: false, deleted: false } };
                    await saveNavOverrides(newOverrides);
                    toast.success("Page restored");
                  } catch (err) {
                    toast.error("Failed to restore page");
                  }
                }}>
                  Restore
                </Button>
              </div>
            );
          })
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
 
 <ProfileAvatarDialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog} />
 </>
 );
}
