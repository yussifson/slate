import { useState, useEffect } from "react";
import { powerSync } from "@/api/PowerSyncConnector";
import { INDUSTRIES, getIndustryNav, clientNav } from "@/config/industries";

export function useNavigation(user, impersonatedCompany) {
  const [dynamicModules, setDynamicModules] = useState([]);
  
  const isAdmin = ["super_admin", "admin", "company_admin", "managing_partner"].includes(user?.role);
  const activeIndustry = sessionStorage.getItem('slate_industry_override') || impersonatedCompany?.industry_type || user?.company_industry || 'law';

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
      const channelName = `sidebar-modules-${Date.now()}-${Math.random()}`;
      const channel = supabase.channel(channelName)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'module_definitions' }, () => {
          fetchDynamicNav();
        })
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.company_id, activeIndustry, isAdmin]);

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
  const appBuilderItem = { label: "OrbitBolt AI Builder", icon: "Zap", path: "/slate/BOLT" };
  const marketplaceItem = { label: "Marketplace", icon: "ShoppingCart", path: "/marketplace" };
  
  let navItems = isAdmin
    ? [...baseNav, ...dynamicNavItems, appBuilderItem, marketplaceItem, { label: "Firm Setup", icon: "Settings", path: "/firm-setup" }]
    : [...baseNav, ...dynamicNavItems, marketplaceItem];
    
  if (user?.role === "super_admin") {
    navItems = [...navItems, { label: "Super Admin Portal", icon: "Shield", path: "/system-admin" }];
  }

  return { navItems, isAdmin, activeIndustry };
}
