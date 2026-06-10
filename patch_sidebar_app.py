import sys

# Update App.jsx
with open('src/App.jsx', 'r', encoding='utf-8') as f:
    app_content = f.read()

app_content = app_content.replace('path="/modules/BOLT"', 'path="/slate/BOLT"')
app_content = app_content.replace('path="/modules/create"', 'path="/slate/create"')
app_content = app_content.replace('path="/modules/edit/:id"', 'path="/slate/edit/:id"')

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(app_content)

# Update Sidebar.jsx
with open('src/components/layout/Sidebar.jsx', 'r', encoding='utf-8') as f:
    sidebar_content = f.read()

# Replace /modules/edit/ with /slate/edit/
sidebar_content = sidebar_content.replace('/modules/edit/', '/slate/edit/')

# Replace OrbitBolt call to action inside isOrbitMode
orbit_cta_start = sidebar_content.find('{/* Call to action for OrbitBolt */}')
if orbit_cta_start != -1:
    orbit_cta_end = sidebar_content.find('</div>', orbit_cta_start) + 6 # end of div
    # Wait, it is inside another div:
    # <div className="mt-8 px-4 pb-6">
    #   <Link to="/modules/BOLT" ...
    # </div>
    # Let's just replace the whole thing if it matches exactly
    pass

# We can just do a simple replacement for the OrbitBolt call to action to an empty string.
orbit_cta = '''            {/* Call to action for OrbitBolt */}
            <div className="mt-8 px-4 pb-6">
              <Link to="/modules/BOLT" className="inline-block text-[11px] font-bold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors">
                <Zap className="w-3.5 h-3.5 inline-block mr-1" /> Try OrbitBolt AI
              </Link>
            </div>'''
sidebar_content = sidebar_content.replace(orbit_cta, '')

# Modify navItems
nav_items_old = '''  const appBuilderItem = { label: "OrbitBolt AI Builder", icon: "Zap", path: "/modules/BOLT" };
  const pagesItem = { label: "AI Pages (Beta)", icon: "LayoutDashboard", path: "/pages/fleet-dashboard" };
  const marketplaceItem = { label: "Marketplace", icon: "Store", path: "/marketplace" };
  let navItems = isAdmin
    ? [...baseNav, ...dynamicNavItems, ...customPageItems, pagesItem, appBuilderItem, marketplaceItem, { label: "Firm Setup", icon: "Settings", path: "/firm-setup" }]
    : [...baseNav, ...dynamicNavItems, ...customPageItems, pagesItem, marketplaceItem];'''

nav_items_new = '''  const createSlateItem = { label: "Create Slate", icon: "PlusCircle", path: "/slate/create" };
  const marketplaceItem = { label: "Marketplace", icon: "Store", path: "/marketplace" };
  let navItems = isAdmin
    ? [...baseNav, ...dynamicNavItems, ...customPageItems, createSlateItem, marketplaceItem, { label: "Firm Setup", icon: "Settings", path: "/firm-setup" }]
    : [...baseNav, ...dynamicNavItems, ...customPageItems, marketplaceItem];'''

sidebar_content = sidebar_content.replace(nav_items_old, nav_items_new)

with open('src/components/layout/Sidebar.jsx', 'w', encoding='utf-8') as f:
    f.write(sidebar_content)
print("Updated App.jsx and Sidebar.jsx")
