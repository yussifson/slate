import re

filepath = 'src/pages/OrbitBuildPage.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace lazy loads
lazy_loads = '''// New Universal Components
const UnivCRM = React.lazy(() => import("@/components/universal/UnivCRM"));
const UnivInvoice = React.lazy(() => import("@/components/universal/UnivInvoice"));
const UnivAppointments = React.lazy(() => import("@/components/universal/UnivAppointments"));
const UnivInventory = React.lazy(() => import("@/components/universal/UnivInventory"));
const UnivHREmployee = React.lazy(() => import("@/components/universal/UnivHREmployee"));

// Phase 2 Universal Components
const UnivDataGrid = React.lazy(() => import("@/components/universal/UnivDataGrid"));
const UnivKanban = React.lazy(() => import("@/components/universal/UnivKanban"));
const UnivCalendar = React.lazy(() => import("@/components/universal/UnivCalendar"));
const UnivDashboard = React.lazy(() => import("@/components/universal/UnivDashboard"));
const UnivAnalytics = React.lazy(() => import("@/components/universal/UnivAnalytics"));
const UnivForm = React.lazy(() => import("@/components/universal/UnivForm"));
const UnivSearch = React.lazy(() => import("@/components/universal/UnivSearch"));'''

content = re.sub(r'// New Universal Components.*?const UnivHREmployee = React.lazy\(\(\) => import\("@/components/universal/UnivHREmployee"\)\);', lazy_loads, content, flags=re.DOTALL)

# Update switch statement to replace Dynamic* fallbacks
switch_logic = '''    switch (pageDef.component_id) {
      case 'crm':
        return <UnivCRM />;
      case 'invoice':
      case 'payment':
        return <UnivInvoice />;
      case 'appointment':
      case 'calendar':
      case 'booking':
      case 'scheduling':
        return <UnivAppointments />;
      case 'inventory':
      case 'asset_management':
        return <UnivInventory />;
      case 'hr_employee':
      case 'contact_management':
        return <UnivHREmployee />;
        
      // Generic Generic Views (Phase 2)
      case 'dashboard_widgets':
      case 'dashboard':
        return <UnivDashboard />;
      case 'analytics':
      case 'reports':
        return <UnivAnalytics />;
      case 'kanban':
      case 'pipeline':
        return <UnivKanban />;
      case 'form_wizard':
      case 'approval':
      case 'form':
        return <UnivForm />;
      case 'search':
        return <UnivSearch />;
      case 'data_table':
      case 'pos':
      default:
        return <UnivDataGrid title={pageDef.page_name} />;
    }'''

content = re.sub(r'switch \(pageDef.component_id\).*?}\n  };', switch_logic + "\n  };", content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Mapped Phase 2 Univ components in OrbitBuildPage.jsx")
