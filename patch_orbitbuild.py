import re

filepath = 'src/pages/OrbitBuildPage.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace lazy loads
lazy_loads = '''const DynamicTable = React.lazy(() => import("@/components/ui/DynamicTable"));
const DynamicDashboard = React.lazy(() => import("@/components/ui/DynamicDashboard"));
const DynamicKanbanView = React.lazy(() => import("@/components/ui/DynamicKanbanView"));
const DynamicCalendarView = React.lazy(() => import("@/components/ui/DynamicCalendarView"));
const DynamicDirectoryView = React.lazy(() => import("@/components/ui/DynamicDirectoryView"));
const DynamicFormWizard = React.lazy(() => import("@/components/ui/DynamicFormWizard"));

// New Universal Components
const UnivCRM = React.lazy(() => import("@/components/universal/UnivCRM"));
const UnivInvoice = React.lazy(() => import("@/components/universal/UnivInvoice"));
const UnivAppointments = React.lazy(() => import("@/components/universal/UnivAppointments"));
const UnivInventory = React.lazy(() => import("@/components/universal/UnivInventory"));
const UnivHREmployee = React.lazy(() => import("@/components/universal/UnivHREmployee"));'''

content = re.sub(r'const DynamicTable.*DynamicFormWizard\s*=\s*React.lazy\(\(\) => import\("@/components/ui/DynamicFormWizard"\)\);', lazy_loads, content, flags=re.DOTALL)

# Update switch statement
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
        
      // Fallbacks to Generic Dynamic Views
      case 'dashboard_widgets':
      case 'analytics':
        return <DynamicDashboard data={DUMMY_DATA} fieldDefinitions={DUMMY_FIELDS} />;
      case 'kanban':
        return <DynamicKanbanView data={DUMMY_DATA} fieldDefinitions={DUMMY_FIELDS} />;
      case 'form_wizard':
      case 'approval':
        return <DynamicFormWizard data={DUMMY_DATA} fieldDefinitions={DUMMY_FIELDS} />;
      case 'data_table':
      case 'pos':
      default:
        return <DynamicTable data={DUMMY_DATA} fieldDefinitions={DUMMY_FIELDS} />;
    }'''

content = re.sub(r'switch \(pageDef.component_id\).*?}\n  };', switch_logic + "\n  };", content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Mapped Univ components in OrbitBuildPage.jsx")
