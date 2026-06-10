import re

filepath = 'src/components/layout/Sidebar.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add the orbitBuild query
orbit_query = '''
  const { data: orbitBuildConfig } = useQuery({
    queryKey: ['orbit_build_config', companyId],
    queryFn: async () => {
      if (activeIndustry !== 'orbit_build') return null;
      const { data } = await supabase
        .from('industry_records')
        .select('data')
        .eq('company_id', companyId)
        .eq('industry', 'orbit_build')
        .eq('record_type', 'workspace_config')
        .single();
      return data?.data?.pages || [];
    },
    enabled: !!companyId && activeIndustry === 'orbit_build'
  });

  const orbitBuildNavItems = (orbitBuildConfig || []).map(p => ({
    id: p.page_name,
    label: p.page_name,
    icon: p.icon || "LayoutDashboard",
    path: /ob/,
    isDynamic: true,
    component_id: p.component_id
  }));
'''

content = content.replace("const customPageItems = customPages.map(p => ({", orbit_query + "\n  const customPageItems = customPages.map(p => ({")

# Append orbitBuildNavItems to navItems
old_nav = '''  let navItems = isAdmin
    ? [...baseNav, ...dynamicNavItems, ...customPageItems, createSlateItem, marketplaceItem, { label: "Firm Setup", icon: "Settings", path: "/firm-setup" }]
    : [...baseNav, ...dynamicNavItems, ...customPageItems, marketplaceItem];'''

new_nav = '''  let navItems = isAdmin
    ? [...baseNav, ...orbitBuildNavItems, ...dynamicNavItems, ...customPageItems, createSlateItem, marketplaceItem, { label: "Firm Setup", icon: "Settings", path: "/firm-setup" }]
    : [...baseNav, ...orbitBuildNavItems, ...dynamicNavItems, ...customPageItems, marketplaceItem];'''

content = content.replace(old_nav, new_nav)

# If industry is orbit_build, baseNav should be coreOrbitNav
content = content.replace("const baseNav = user?.role === \"client\" ? clientNav : filteredCompanyNav;", "const baseNav = user?.role === \"client\" ? clientNav : (activeIndustry === 'orbit_build' ? coreOrbitNav : filteredCompanyNav);")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Sidebar.jsx patched for OrbitBuild!")
