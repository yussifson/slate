import re

filepath = 'src/pages/OrbitBuildPage.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace lazy loads to add Phase 7
lazy_loads = '''const UnivTelemedicine = React.lazy(() => import("@/components/universal/UnivTelemedicine"));

// Phase 7 Universal Components (Hospitality Suite)
const UnivBooking = React.lazy(() => import("@/components/universal/UnivBooking"));
const UnivRoom = React.lazy(() => import("@/components/universal/UnivRoom"));
const UnivHousekeeping = React.lazy(() => import("@/components/universal/UnivHousekeeping"));
const UnivMenu = React.lazy(() => import("@/components/universal/UnivMenu"));
const UnivDining = React.lazy(() => import("@/components/universal/UnivDining"));'''

content = re.sub(r'const UnivTelemedicine = React\.lazy\(\(\) => import\("@/components/universal/UnivTelemedicine"\)\);', lazy_loads, content, flags=re.DOTALL)

# Update switch statement to add Phase 7
switch_logic = '''      case 'video_consult':
      case 'virtual_visit':
        return <UnivTelemedicine />;

      // Phase 7 Components (Hospitality Suite)
      case 'bookings':
      case 'reservations':
        return <UnivBooking />;
      case 'rooms':
      case 'room_inventory':
        return <UnivRoom />;
      case 'housekeeping':
      case 'cleaning':
        return <UnivHousekeeping />;
      case 'menu':
      case 'restaurant_menu':
        return <UnivMenu />;
      case 'dining_orders':
      case 'restaurant_orders':
      case 'pos_orders':
        return <UnivDining />;

      case 'data_table':'''

content = re.sub(r'      case \'video_consult\':\n      case \'virtual_visit\':\n        return <UnivTelemedicine />;\n\n      case \'data_table\':', switch_logic, content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Mapped Phase 7 Univ components in OrbitBuildPage.jsx")
