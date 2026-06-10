import re

filepath = 'src/pages/OrbitBuildPage.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace lazy loads to add Phase 6
lazy_loads = '''const UnivParentPortal = React.lazy(() => import("@/components/universal/UnivParentPortal"));

// Phase 6 Universal Components (Healthcare Suite)
const UnivPatient = React.lazy(() => import("@/components/universal/UnivPatient"));
const UnivEMR = React.lazy(() => import("@/components/universal/UnivEMR"));
const UnivPrescription = React.lazy(() => import("@/components/universal/UnivPrescription"));
const UnivLab = React.lazy(() => import("@/components/universal/UnivLab"));
const UnivWard = React.lazy(() => import("@/components/universal/UnivWard"));
const UnivTelemedicine = React.lazy(() => import("@/components/universal/UnivTelemedicine"));'''

content = re.sub(r'const UnivParentPortal = React\.lazy\(\(\) => import\("@/components/universal/UnivParentPortal"\)\);', lazy_loads, content, flags=re.DOTALL)

# Update switch statement to add Phase 6
switch_logic = '''      case 'parent_portal':
      case 'guardians':
        return <UnivParentPortal />;

      // Phase 6 Components (Healthcare Suite)
      case 'patient_records':
      case 'patients':
        return <UnivPatient />;
      case 'emr':
      case 'medical_records':
      case 'clinical_notes':
        return <UnivEMR />;
      case 'prescriptions':
      case 'medications':
      case 'pharmacy':
        return <UnivPrescription />;
      case 'lab_results':
      case 'labs':
      case 'diagnostics':
        return <UnivLab />;
      case 'ward_management':
      case 'wards':
      case 'beds':
        return <UnivWard />;
      case 'telemedicine':
      case 'video_consult':
      case 'virtual_visit':
        return <UnivTelemedicine />;

      case 'data_table':'''

content = re.sub(r'      case \'parent_portal\':\n      case \'guardians\':\n        return <UnivParentPortal />;\n\n      case \'data_table\':', switch_logic, content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Mapped Phase 6 Univ components in OrbitBuildPage.jsx")
