import re

filepath = 'src/pages/OrbitBuildPage.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace lazy loads to add Phase 4
lazy_loads = '''const UnivNotification = React.lazy(() => import("@/components/universal/UnivNotification"));

// Phase 4 Universal Components
const UnivContactManagement = React.lazy(() => import("@/components/universal/UnivContactManagement"));
const UnivPayment = React.lazy(() => import("@/components/universal/UnivPayment"));
const UnivSubscription = React.lazy(() => import("@/components/universal/UnivSubscription"));
const UnivAssetManagement = React.lazy(() => import("@/components/universal/UnivAssetManagement"));
const UnivProcurement = React.lazy(() => import("@/components/universal/UnivProcurement"));
const UnivPOS = React.lazy(() => import("@/components/universal/UnivPOS"));
const UnivAttendance = React.lazy(() => import("@/components/universal/UnivAttendance"));
const UnivPayroll = React.lazy(() => import("@/components/universal/UnivPayroll"));
const UnivRecruitment = React.lazy(() => import("@/components/universal/UnivRecruitment"));
const UnivLeaveManagement = React.lazy(() => import("@/components/universal/UnivLeaveManagement"));'''

content = re.sub(r'const UnivNotification = React\.lazy\(\(\) => import\("@/components/universal/UnivNotification"\)\);', lazy_loads, content, flags=re.DOTALL)

# Update switch statement to add Phase 4
switch_logic = '''      case 'alerts':
      case 'reminders':
        return <UnivNotification />;
        
      // Phase 4 Components
      case 'contact_management':
      case 'contacts':
        return <UnivContactManagement />;
      case 'payment':
      case 'payments':
      case 'billing':
        return <UnivPayment />;
      case 'subscription':
      case 'subscriptions':
      case 'plans':
        return <UnivSubscription />;
      case 'asset_management':
      case 'assets':
        return <UnivAssetManagement />;
      case 'procurement':
      case 'purchasing':
        return <UnivProcurement />;
      case 'pos':
      case 'point_of_sale':
        return <UnivPOS />;
      case 'attendance':
      case 'time_tracking':
        return <UnivAttendance />;
      case 'payroll':
      case 'salaries':
        return <UnivPayroll />;
      case 'recruitment':
      case 'hiring':
      case 'applicants':
        return <UnivRecruitment />;
      case 'leave_management':
      case 'leaves':
      case 'time_off':
        return <UnivLeaveManagement />;

      case 'data_table':'''

content = re.sub(r'      case \'alerts\':\n      case \'reminders\':\n        return <UnivNotification />;\n        \n      case \'data_table\':', switch_logic, content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Mapped Phase 4 Univ components in OrbitBuildPage.jsx")
