import re

filepath = 'src/pages/OrbitBuildPage.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace lazy loads to add Phase 5
lazy_loads = '''const UnivLeaveManagement = React.lazy(() => import("@/components/universal/UnivLeaveManagement"));

// Phase 5 Universal Components (Education Suite)
const UnivStudent = React.lazy(() => import("@/components/universal/UnivStudent"));
const UnivFaculty = React.lazy(() => import("@/components/universal/UnivFaculty"));
const UnivCourse = React.lazy(() => import("@/components/universal/UnivCourse"));
const UnivGradebook = React.lazy(() => import("@/components/universal/UnivGradebook"));
const UnivClassAttendance = React.lazy(() => import("@/components/universal/UnivClassAttendance"));
const UnivLMS = React.lazy(() => import("@/components/universal/UnivLMS"));
const UnivParentPortal = React.lazy(() => import("@/components/universal/UnivParentPortal"));'''

content = re.sub(r'const UnivLeaveManagement = React\.lazy\(\(\) => import\("@/components/universal/UnivLeaveManagement"\)\);', lazy_loads, content, flags=re.DOTALL)

# Update switch statement to add Phase 5
switch_logic = '''      case 'leaves':
      case 'time_off':
        return <UnivLeaveManagement />;

      // Phase 5 Components (Education Suite)
      case 'student_records':
      case 'students':
        return <UnivStudent />;
      case 'faculty':
      case 'teachers':
        return <UnivFaculty />;
      case 'courses':
      case 'subjects':
      case 'classes':
        return <UnivCourse />;
      case 'gradebook':
      case 'grades':
      case 'results':
        return <UnivGradebook />;
      case 'class_attendance':
        return <UnivClassAttendance />;
      case 'lms':
      case 'lessons':
      case 'assignments':
        return <UnivLMS />;
      case 'parent_portal':
      case 'guardians':
        return <UnivParentPortal />;

      case 'data_table':'''

content = re.sub(r'      case \'leaves\':\n      case \'time_off\':\n        return <UnivLeaveManagement />;\n\n      case \'data_table\':', switch_logic, content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Mapped Phase 5 Univ components in OrbitBuildPage.jsx")
