import re

filepath = 'src/pages/OrbitBuildPage.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace lazy loads to add Phase 3
lazy_loads = '''const UnivForm = React.lazy(() => import("@/components/universal/UnivForm"));
const UnivSearch = React.lazy(() => import("@/components/universal/UnivSearch"));

// Phase 3 Universal Components
const UnivTimeline = React.lazy(() => import("@/components/universal/UnivTimeline"));
const UnivDocument = React.lazy(() => import("@/components/universal/UnivDocument"));
const UnivMessaging = React.lazy(() => import("@/components/universal/UnivMessaging"));
const UnivNotification = React.lazy(() => import("@/components/universal/UnivNotification"));'''

content = re.sub(r'const UnivForm = React\.lazy\(\(\) => import\("@/components/universal/UnivForm"\)\);\nconst UnivSearch = React\.lazy\(\(\) => import\("@/components/universal/UnivSearch"\)\);', lazy_loads, content, flags=re.DOTALL)

# Update switch statement to add Phase 3
switch_logic = '''      case 'search':
        return <UnivSearch />;
        
      // Phase 3 Components
      case 'timeline':
      case 'project_planning':
      case 'milestones':
        return <UnivTimeline />;
      case 'document':
      case 'files':
      case 'storage':
        return <UnivDocument />;
      case 'messaging':
      case 'chat':
      case 'conversations':
        return <UnivMessaging />;
      case 'notification':
      case 'alerts':
      case 'reminders':
        return <UnivNotification />;
        
      case 'data_table':'''

content = re.sub(r'      case \'search\':\n        return <UnivSearch />;.*?case \'data_table\':', switch_logic, content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Mapped Phase 3 Univ components in OrbitBuildPage.jsx")
