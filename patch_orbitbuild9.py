import re

filepath = 'src/pages/OrbitBuildPage.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace lazy loads to add Phase 9
lazy_loads = '''const UnivContractor = React.lazy(() => import("@/components/universal/UnivContractor"));

// Phase 9 Universal Components (Legal & Manufacturing Suites)
const UnivCaseManagement = React.lazy(() => import("@/components/universal/UnivCaseManagement"));
const UnivLegalDocument = React.lazy(() => import("@/components/universal/UnivLegalDocument"));
const UnivCourtCalendar = React.lazy(() => import("@/components/universal/UnivCourtCalendar"));
const UnivClientPortal = React.lazy(() => import("@/components/universal/UnivClientPortal"));
const UnivProduction = React.lazy(() => import("@/components/universal/UnivProduction"));
const UnivBOM = React.lazy(() => import("@/components/universal/UnivBOM"));
const UnivMachine = React.lazy(() => import("@/components/universal/UnivMachine"));
const UnivQualityControl = React.lazy(() => import("@/components/universal/UnivQualityControl"));'''

content = re.sub(r'const UnivContractor = React\.lazy\(\(\) => import\("@/components/universal/UnivContractor"\)\);', lazy_loads, content, flags=re.DOTALL)

# Update switch statement to add Phase 9
switch_logic = '''      case 'contractors':
      case 'subcontractors':
        return <UnivContractor />;

      // Phase 9 Components (Legal & Manufacturing)
      case 'cases':
      case 'case_management':
        return <UnivCaseManagement />;
      case 'legal_documents':
      case 'contracts':
        return <UnivLegalDocument />;
      case 'court_calendar':
      case 'hearings':
        return <UnivCourtCalendar />;
      case 'client_portal':
      case 'client_access':
        return <UnivClientPortal />;
      case 'production':
      case 'manufacturing':
      case 'production_runs':
        return <UnivProduction />;
      case 'bom':
      case 'bill_of_materials':
        return <UnivBOM />;
      case 'machines':
      case 'equipment_maintenance':
        return <UnivMachine />;
      case 'quality_control':
      case 'qc':
      case 'inspections':
        return <UnivQualityControl />;

      case 'data_table':'''

content = re.sub(r'      case \'contractors\':\n      case \'subcontractors\':\n        return <UnivContractor />;\n\n      case \'data_table\':', switch_logic, content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Mapped Phase 9 Univ components in OrbitBuildPage.jsx")
