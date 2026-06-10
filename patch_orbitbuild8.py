import re

filepath = 'src/pages/OrbitBuildPage.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace lazy loads to add Phase 8
lazy_loads = '''const UnivDining = React.lazy(() => import("@/components/universal/UnivDining"));

// Phase 8 Universal Components (Logistics & Construction Suites)
const UnivFleet = React.lazy(() => import("@/components/universal/UnivFleet"));
const UnivDispatch = React.lazy(() => import("@/components/universal/UnivDispatch"));
const UnivRoute = React.lazy(() => import("@/components/universal/UnivRoute"));
const UnivDelivery = React.lazy(() => import("@/components/universal/UnivDelivery"));
const UnivWarehouse = React.lazy(() => import("@/components/universal/UnivWarehouse"));
const UnivProject = React.lazy(() => import("@/components/universal/UnivProject"));
const UnivBOQ = React.lazy(() => import("@/components/universal/UnivBOQ"));
const UnivSiteInspection = React.lazy(() => import("@/components/universal/UnivSiteInspection"));
const UnivSafety = React.lazy(() => import("@/components/universal/UnivSafety"));
const UnivContractor = React.lazy(() => import("@/components/universal/UnivContractor"));'''

content = re.sub(r'const UnivDining = React\.lazy\(\(\) => import\("@/components/universal/UnivDining"\)\);', lazy_loads, content, flags=re.DOTALL)

# Update switch statement to add Phase 8
switch_logic = '''      case 'dining_orders':
      case 'restaurant_orders':
      case 'pos_orders':
        return <UnivDining />;

      // Phase 8 Components (Logistics & Construction)
      case 'fleet':
      case 'vehicles':
        return <UnivFleet />;
      case 'dispatch':
      case 'driver_dispatch':
        return <UnivDispatch />;
      case 'route_planning':
      case 'routes':
        return <UnivRoute />;
      case 'deliveries':
      case 'delivery_tracking':
        return <UnivDelivery />;
      case 'warehouse':
      case 'storage':
        return <UnivWarehouse />;
      case 'projects':
      case 'construction_projects':
        return <UnivProject />;
      case 'boq':
      case 'bill_of_quantities':
        return <UnivBOQ />;
      case 'site_inspections':
      case 'snag_list':
        return <UnivSiteInspection />;
      case 'safety':
      case 'incidents':
        return <UnivSafety />;
      case 'contractors':
      case 'subcontractors':
        return <UnivContractor />;

      case 'data_table':'''

content = re.sub(r'      case \'dining_orders\':\n      case \'restaurant_orders\':\n      case \'pos_orders\':\n        return <UnivDining />;\n\n      case \'data_table\':', switch_logic, content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Mapped Phase 8 Univ components in OrbitBuildPage.jsx")
