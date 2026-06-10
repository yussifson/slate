import re

filepath = 'src/App.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
import_statement = "import OrbitBuildPage from './pages/OrbitBuildPage';\n"
if 'import OrbitBuildPage' not in content:
    content = content.replace("import SHSRoutes from './pages/highschool/SHSRoutes';", import_statement + "import SHSRoutes from './pages/highschool/SHSRoutes';")

# Add Route
route_statement = '      <Route path="/ob/:pageName" element={<OrbitBuildPage />} />\n'
if '<Route path="/ob/:pageName"' not in content:
    content = content.replace('      {/* Core / Shared Pages */}\n', '      {/* Core / Shared Pages */}\n' + route_statement)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("App.jsx patched for OrbitBuild routes!")
