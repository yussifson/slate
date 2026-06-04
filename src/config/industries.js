// Central industry configuration — single source of truth for the entire platform

export const INDUSTRIES = {
  law: {
    name: 'Law Firm',
    icon: '⚖️',
    terms: {
      client: 'Client', clients: 'Clients',
      case: 'Case', cases: 'Cases',
      staff: 'Lawyer', staffPlural: 'Lawyers',
      venue: 'Court', intake: 'Intake Form',
      hearing: 'Hearing', hearings: 'Hearings',
    },
    roles: [
      { value: 'company_admin', label: 'Managing Partner' },
      { value: 'lawyer', label: 'Lawyer / Associate' },
      { value: 'paralegal', label: 'Paralegal' },
      { value: 'legal_secretary', label: 'Legal Secretary' },
      { value: 'finance', label: 'Finance Officer' },
      { value: 'hr', label: 'HR Manager' },
      { value: 'client', label: 'Client (Portal)' },
    ],
    nav: [
      { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
      { label: 'Cases', path: '/cases', icon: 'Briefcase' },
      { label: 'Clients', path: '/clients', icon: 'Users' },
      { label: 'Leads', path: '/leads', icon: 'UserPlus' },
      { label: 'Calendar', path: '/calendar', icon: 'Calendar' },
      { label: 'Billing', path: '/billing', icon: 'Receipt' },
      { label: 'Pipeline', path: '/pipeline', icon: 'GitBranch' },
      { label: 'Legal Research', path: '/research', icon: 'BookOpen' },
      { label: 'Conflict Check', path: '/conflict-check', icon: 'Shield' },
      { label: 'Documents', path: '/documents', icon: 'FolderOpen' },
      { label: 'Case Outcomes', path: '/outcomes', icon: 'Trophy' },
      { label: 'Email Inbox', path: '/email-inbox', icon: 'Mail' },
      { label: 'WhatsApp', path: '/whatsapp', icon: 'MessageCircle' },
      { label: 'Tasks', path: '/tasks', icon: 'CheckSquare' },
      { label: 'HR & Leave', path: '/hr', icon: 'HeartHandshake' },
      { label: 'Reports', path: '/reports', icon: 'BarChart2' },
      { label: 'Audit Log', path: '/audit', icon: 'Search' },
      { label: 'Integrations', path: '/integrations', icon: 'Blocks' },
      { label: 'Settings', path: '/settings', icon: 'Settings' },
    ],
  },

  school: {
    name: 'School',
    icon: '🏫',
    terms: {
      client: 'Student', clients: 'Students',
      case: 'Class', cases: 'Classes',
      staff: 'Teacher', staffPlural: 'Teachers',
      venue: 'Campus', intake: 'Enrollment Form',
      hearing: 'Class Session', hearings: 'Class Sessions',
    },
    roles: [
      { value: 'company_admin', label: 'School Principal' },
      { value: 'teacher', label: 'Teacher' },
      { value: 'accountant', label: 'Accountant' },
      { value: 'librarian', label: 'Librarian' },
      { value: 'hr', label: 'HR Officer' },
      { value: 'parent', label: 'Parent / Guardian' },
      { value: 'student', label: 'Student' },
    ],
    nav: [
      { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
      { label: 'Students', path: '/students', icon: 'Users' },
      { label: 'Parents & Guardians', path: '/parents', icon: 'HeartHandshake' },
      { label: 'Teachers & Staff', path: '/teachers', icon: 'Briefcase' },
      { label: 'Classes & Subjects', path: '/classes', icon: 'BookOpen' },
      { label: 'Timetable', path: '/timetable', icon: 'Calendar' },
      { label: 'Assignments', path: '/assignments', icon: 'FileText' },
      { label: 'Attendance', path: '/attendance', icon: 'CheckSquare' },
      { label: 'Grades', path: '/grades', icon: 'Award' },
      { label: 'Exams', path: '/exams', icon: 'FileText' },
      { label: 'Discipline', path: '/discipline', icon: 'Scale' },
      { label: 'Fee Management', path: '/fees', icon: 'Banknote' },
      { label: 'Library', path: '/library', icon: 'Library' },
      { label: 'Transport', path: '/transport', icon: 'Bus' },
      { label: 'Hostel', path: '/hostel', icon: 'BedDouble' },
      { label: 'Canteen POS', path: '/canteen-pos', icon: 'UtensilsCrossed' },
      { label: 'Noticeboard', path: '/notices', icon: 'Bell' },
      { label: 'Complaints', path: '/complaints', icon: 'AlertTriangle' },
      { label: 'Student Portal', path: '/student-portal', icon: 'GraduationCap' },
      { label: 'Parent Portal', path: '/parent-portal', icon: 'HeartHandshake' },
      { label: 'Gamification', path: '/gamification', icon: 'Trophy' },
      { label: 'Campus Marketplace', path: '/marketplace', icon: 'Store' },
      { label: 'Teacher Evaluations', path: '/teacher-evaluations', icon: 'ClipboardCheck' },
      { label: 'Support Center', path: '/support-center', icon: 'LifeBuoy' },
      { label: 'Documents', path: '/documents', icon: 'FolderOpen' },
      { label: 'Tasks', path: '/tasks', icon: 'CheckSquare2' },
      { label: 'HR & Leave', path: '/hr', icon: 'HeartHandshake' },
      { label: 'Reports', path: '/reports', icon: 'BarChart2' },
      { label: 'Integrations', path: '/integrations', icon: 'Blocks' },
      { label: 'Institution Settings', path: '/institution-settings', icon: 'Building' },
      { label: 'Settings', path: '/settings', icon: 'Settings' },
    ],
  },

  highschool: {
    name: 'High School',
    icon: '🏫',
    terms: {
      client: 'Student', clients: 'Students',
      case: 'Class', cases: 'Classes',
      staff: 'Teacher', staffPlural: 'Teachers',
      venue: 'Campus', intake: 'Enrollment',
      hearing: 'Session', hearings: 'Sessions',
    },
    roles: [
      { value: 'company_admin', label: 'Principal' },
      { value: 'teacher', label: 'Teacher' },
      { value: 'accountant', label: 'Accountant' },
      { value: 'hr', label: 'HR Officer' },
      { value: 'student', label: 'Student' },
    ],
    nav: [
      { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
      { label: 'Students', path: '/students', icon: 'Users' },
      { label: 'Classes', path: '/classes', icon: 'BookOpen' },
      { label: 'Timetable', path: '/timetable', icon: 'Calendar' },
      { label: 'Grades', path: '/grades', icon: 'Award' },
      { label: 'Fee Management', path: '/fees', icon: 'Banknote' },
      { label: 'Settings', path: '/settings', icon: 'Settings' },
    ],
  },

  university: {
    name: 'University',
    icon: '🎓',
    terms: {
      client: 'Student', clients: 'Students',
      case: 'Course', cases: 'Courses',
      staff: 'Professor', staffPlural: 'Professors',
      venue: 'Campus', intake: 'Admissions',
      hearing: 'Lecture', hearings: 'Lectures',
    },
    roles: [
      { value: 'company_admin', label: 'Dean / VC' },
      { value: 'professor', label: 'Professor' },
      { value: 'finance', label: 'Finance' },
      { value: 'student', label: 'Student' },
    ],
    nav: [
      { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
      { label: 'Students', path: '/students', icon: 'Users' },
      { label: 'Courses', path: '/courses', icon: 'BookOpen' },
      { label: 'Faculty', path: '/faculty', icon: 'Briefcase' },
      { label: 'Admissions', path: '/admissions', icon: 'FileText' },
      { label: 'Finance', path: '/finance', icon: 'Banknote' },
      { label: 'Settings', path: '/settings', icon: 'Settings' },
    ],
  },

  college: {
    name: 'College',
    icon: '🎓',
    terms: {
      client: 'Student', clients: 'Students',
      case: 'Course', cases: 'Courses',
      staff: 'Lecturer', staffPlural: 'Lecturers',
      venue: 'Campus', intake: 'Admissions',
      hearing: 'Lecture', hearings: 'Lectures',
    },
    roles: [
      { value: 'company_admin', label: 'Principal / Dean' },
      { value: 'lecturer', label: 'Lecturer' },
      { value: 'finance', label: 'Finance' },
      { value: 'student', label: 'Student' },
    ],
    nav: [
      { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
      { label: 'Students', path: '/students', icon: 'Users' },
      { label: 'Courses', path: '/courses', icon: 'BookOpen' },
      { label: 'Faculty', path: '/faculty', icon: 'Briefcase' },
      { label: 'Admissions', path: '/admissions', icon: 'FileText' },
      { label: 'Finance', path: '/finance', icon: 'Banknote' },
      { label: 'Settings', path: '/settings', icon: 'Settings' },
    ],
  },

  online: {
    name: 'Online Learning',
    icon: '💻',
    terms: {
      client: 'Learner', clients: 'Learners',
      case: 'Course', cases: 'Courses',
      staff: 'Instructor', staffPlural: 'Instructors',
      venue: 'Platform', intake: 'Registration',
      hearing: 'Live Session', hearings: 'Live Sessions',
    },
    roles: [
      { value: 'company_admin', label: 'Platform Admin' },
      { value: 'instructor', label: 'Instructor' },
      { value: 'learner', label: 'Learner' },
    ],
    nav: [
      { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
      { label: 'Learners', path: '/learners', icon: 'Users' },
      { label: 'Courses', path: '/courses', icon: 'BookOpen' },
      { label: 'Sales', path: '/sales', icon: 'Banknote' },
      { label: 'Settings', path: '/settings', icon: 'Settings' },
    ],
  },

  vocational: {
    name: 'Vocational / Technical',
    icon: '🔧',
    terms: {
      client: 'Apprentice', clients: 'Apprentices',
      case: 'Program', cases: 'Programs',
      staff: 'Instructor', staffPlural: 'Instructors',
      venue: 'Workshop', intake: 'Enrollment',
      hearing: 'Practical', hearings: 'Practicals',
    },
    roles: [
      { value: 'company_admin', label: 'Director' },
      { value: 'instructor', label: 'Instructor' },
      { value: 'apprentice', label: 'Apprentice' },
    ],
    nav: [
      { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
      { label: 'Apprentices', path: '/apprentices', icon: 'Users' },
      { label: 'Programs', path: '/programs', icon: 'BookOpen' },
      { label: 'Workshops', path: '/workshops', icon: 'Building2' },
      { label: 'Settings', path: '/settings', icon: 'Settings' },
    ],
  },

  hospital: {
    name: 'Hospital',
    icon: '🏥',
    terms: {
      client: 'Patient', clients: 'Patients',
      case: 'Admission', cases: 'Admissions',
      staff: 'Doctor', staffPlural: 'Doctors',
      venue: 'Ward', intake: 'Patient Registration',
      hearing: 'Appointment', hearings: 'Appointments',
    },
    roles: [
      { value: 'company_admin', label: 'Hospital Director' },
      { value: 'doctor', label: 'Doctor' },
      { value: 'nurse', label: 'Nurse' },
      { value: 'receptionist', label: 'Receptionist' },
      { value: 'pharmacist', label: 'Pharmacist' },
      { value: 'lab_technician', label: 'Lab Technician' },
      { value: 'finance', label: 'Finance Officer' },
    ],
    nav: [
      { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
      { label: 'Patients', path: '/patients', icon: 'Users' },
      { label: 'Appointments', path: '/appointments', icon: 'Calendar' },
      { label: 'Ward Management', path: '/wards', icon: 'Building2' },
      { label: 'Prescriptions', path: '/prescriptions', icon: 'Pill' },
      { label: 'Lab Results', path: '/lab-results', icon: 'FlaskConical' },
      { label: 'Pharmacy', path: '/pharmacy', icon: 'ShoppingBag' },
      { label: 'Insurance Claims', path: '/claims', icon: 'Shield' },
      { label: 'Billing', path: '/billing', icon: 'Receipt' },
      { label: 'Staff', path: '/team', icon: 'UserCog' },
      { label: 'Documents', path: '/documents', icon: 'FolderOpen' },
      { label: 'Tasks', path: '/tasks', icon: 'CheckSquare' },
      { label: 'HR & Leave', path: '/hr', icon: 'HeartHandshake' },
      { label: 'Reports', path: '/reports', icon: 'BarChart2' },
      { label: 'Integrations', path: '/integrations', icon: 'Blocks' },
      { label: 'Settings', path: '/settings', icon: 'Settings' },
    ],
  },

  hotel: {
    name: 'Hotel',
    icon: '🏨',
    terms: {
      client: 'Guest', clients: 'Guests',
      case: 'Booking', cases: 'Bookings',
      staff: 'Staff', staffPlural: 'Staff',
      venue: 'Property', intake: 'Reservation',
      hearing: 'Reservation', hearings: 'Reservations',
    },
    roles: [
      { value: 'company_admin', label: 'Hotel Manager' },
      { value: 'receptionist', label: 'Receptionist' },
      { value: 'housekeeper', label: 'Housekeeper' },
      { value: 'chef', label: 'Chef' },
      { value: 'waiter', label: 'Waiter / Server' },
      { value: 'finance', label: 'Finance Officer' },
      { value: 'maintenance', label: 'Maintenance Staff' },
    ],
    nav: [
      { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
      { label: 'Front Desk', path: '/front-desk', icon: 'Building2' },
      { label: 'Reservations', path: '/reservations', icon: 'Calendar' },
      { label: 'Room Management', path: '/rooms', icon: 'BedDouble' },
      { label: 'Housekeeping', path: '/housekeeping', icon: 'Sparkles' },
      { label: 'Restaurant / POS', path: '/restaurant', icon: 'UtensilsCrossed' },
      { label: 'Guest Requests', path: '/guest-requests', icon: 'BellRing' },
      { label: 'Billing', path: '/billing', icon: 'Receipt' },
      { label: 'Staff', path: '/team', icon: 'UserCog' },
      { label: 'Documents', path: '/documents', icon: 'FolderOpen' },
      { label: 'HR & Leave', path: '/hr', icon: 'HeartHandshake' },
      { label: 'Reports', path: '/reports', icon: 'BarChart2' },
      { label: 'Integrations', path: '/integrations', icon: 'Blocks' },
      { label: 'Settings', path: '/settings', icon: 'Settings' },
    ],
  },

  church: {
    name: 'Church',
    icon: '⛪',
    terms: {
      client: 'Member', clients: 'Members',
      case: 'Ministry', cases: 'Ministries',
      staff: 'Pastor', staffPlural: 'Pastors',
      venue: 'Branch', intake: 'Member Registration',
      hearing: 'Event', hearings: 'Events',
    },
    roles: [
      { value: 'company_admin', label: 'Senior Pastor' },
      { value: 'elder', label: 'Elder / Deacon' },
      { value: 'ministry_leader', label: 'Ministry Leader' },
      { value: 'treasurer', label: 'Treasurer' },
      { value: 'volunteer', label: 'Volunteer' },
      { value: 'member', label: 'Member' },
    ],
    nav: [
      { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
      { label: 'Members', path: '/members', icon: 'Users' },
      { label: 'Ministries', path: '/ministries', icon: 'Layers' },
      { label: 'Events & Services', path: '/events', icon: 'Calendar' },
      { label: 'Tithe & Offerings', path: '/tithes', icon: 'HandCoins' },
      { label: 'Volunteers', path: '/volunteers', icon: 'HeartHandshake' },
      { label: 'Sermon Library', path: '/sermons', icon: 'BookOpen' },
      { label: 'Small Groups', path: '/small-groups', icon: 'Users2' },
      { label: 'Prayer Requests', path: '/prayers', icon: 'Star' },
      { label: 'Attendance', path: '/attendance', icon: 'CheckSquare' },
      { label: 'Documents', path: '/documents', icon: 'FolderOpen' },
      { label: 'Tasks', path: '/tasks', icon: 'CheckSquare2' },
      { label: 'Reports', path: '/reports', icon: 'BarChart2' },
      { label: 'Integrations', path: '/integrations', icon: 'Blocks' },
      { label: 'Settings', path: '/settings', icon: 'Settings' },
    ],
  },

  insurance: {
    name: 'Insurance Agency',
    icon: '🛡️',
    terms: {
      client: 'Policyholder', clients: 'Policyholders',
      case: 'Claim', cases: 'Claims',
      staff: 'Agent', staffPlural: 'Agents',
      venue: 'Branch', intake: 'Policy Application',
      hearing: 'Meeting', hearings: 'Meetings',
    },
    roles: [
      { value: 'company_admin', label: 'Agency Director' },
      { value: 'underwriter', label: 'Underwriter' },
      { value: 'agent', label: 'Insurance Agent' },
      { value: 'claims_adjuster', label: 'Claims Adjuster' },
      { value: 'finance', label: 'Finance Officer' },
      { value: 'client', label: 'Customer (Portal)' },
    ],
    nav: [
      { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
      { label: 'Policies', path: '/policies', icon: 'Shield' },
      { label: 'Claims', path: '/claims', icon: 'AlertCircle' },
      { label: 'Leads / CRM', path: '/leads', icon: 'UserPlus' },
      { label: 'Customers', path: '/clients', icon: 'Users' },
      { label: 'Premium Collection', path: '/premiums', icon: 'CreditCard' },
      { label: 'Underwriting', path: '/underwriting', icon: 'FileSearch' },
      { label: 'Agent Performance', path: '/agent-performance', icon: 'TrendingUp' },
      { label: 'Billing', path: '/billing', icon: 'Receipt' },
      { label: 'Staff', path: '/team', icon: 'UserCog' },
      { label: 'Documents', path: '/documents', icon: 'FolderOpen' },
      { label: 'HR & Leave', path: '/hr', icon: 'HeartHandshake' },
      { label: 'Reports', path: '/reports', icon: 'BarChart2' },
      { label: 'Integrations', path: '/integrations', icon: 'Blocks' },
      { label: 'Settings', path: '/settings', icon: 'Settings' },
    ],
  },

  retail: {
    name: 'Retail / POS',
    icon: '🛒',
    terms: {
      client: 'Customer', clients: 'Customers',
      case: 'Order', cases: 'Orders',
      staff: 'Cashier', staffPlural: 'Staff',
      venue: 'Store', intake: 'New Order',
      hearing: 'Shift', hearings: 'Shifts',
    },
    roles: [
      { value: 'company_admin', label: 'Store Manager' },
      { value: 'supervisor', label: 'Supervisor' },
      { value: 'cashier', label: 'Cashier' },
      { value: 'inventory_manager', label: 'Inventory Manager' },
      { value: 'finance', label: 'Finance Officer' },
    ],
    nav: [
      { label: 'Overview', path: '/retail-dashboard', icon: 'LayoutDashboard' },
      { label: 'Point of Sale', path: '/pos', icon: 'ShoppingCart' },
      { label: 'Inventory', path: '/inventory', icon: 'Package' },
      { label: 'Purchase Orders', path: '/purchase-orders', icon: 'FileText' },
      { label: 'Products', path: '/products', icon: 'Tag' },
      { label: 'Promotions', path: '/promotions', icon: 'Percent' },
      { label: 'Orders', path: '/orders', icon: 'ClipboardList' },
      { label: 'Customers', path: '/clients', icon: 'Users' },
      { label: 'Suppliers', path: '/suppliers', icon: 'Truck' },
      { label: 'Loyalty Program', path: '/loyalty', icon: 'Star' },
      { label: 'Shifts', path: '/shifts', icon: 'Clock' },
      { label: 'Billing', path: '/billing', icon: 'Receipt' },
      { label: 'Staff', path: '/team', icon: 'UserCog' },
      { label: 'HR & Leave', path: '/hr', icon: 'HeartHandshake' },
      { label: 'Reports', path: '/reports', icon: 'BarChart2' },
      { label: 'Integrations', path: '/integrations', icon: 'Blocks' },
      { label: 'Settings', path: '/settings', icon: 'Settings' },
    ],
  },

  logistics: {
    name: 'Logistics',
    icon: '🚚',
    terms: {
      client: 'Shipper', clients: 'Shippers',
      case: 'Shipment', cases: 'Shipments',
      staff: 'Driver', staffPlural: 'Drivers',
      venue: 'Hub', intake: 'Pickup Request',
      hearing: 'Dispatch', hearings: 'Dispatches',
    },
    roles: [
      { value: 'company_admin', label: 'Operations Manager' },
      { value: 'dispatcher', label: 'Dispatcher' },
      { value: 'driver', label: 'Driver' },
      { value: 'warehouse_staff', label: 'Warehouse Staff' },
      { value: 'finance', label: 'Finance Officer' },
      { value: 'client', label: 'Customer (Tracking)' },
    ],
    nav: [
      { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
      { label: 'Shipments', path: '/shipments', icon: 'Package' },
      { label: 'Dispatch Board', path: '/dispatch', icon: 'LayoutGrid' },
      { label: 'Drivers', path: '/drivers', icon: 'Truck' },
      { label: 'Routes', path: '/routes', icon: 'Map' },
      { label: 'Warehouse', path: '/warehouse', icon: 'Warehouse' },
      { label: 'Fleet', path: '/fleet', icon: 'Car' },
      { label: 'Customers', path: '/clients', icon: 'Users' },
      { label: 'Pickup Requests', path: '/pickups', icon: 'MapPin' },
      { label: 'Billing', path: '/billing', icon: 'Receipt' },
      { label: 'Staff', path: '/team', icon: 'UserCog' },
      { label: 'HR & Leave', path: '/hr', icon: 'HeartHandshake' },
      { label: 'Reports', path: '/reports', icon: 'BarChart2' },
      { label: 'Integrations', path: '/integrations', icon: 'Blocks' },
      { label: 'Settings', path: '/settings', icon: 'Settings' },
    ],
  },

  hr: {
    name: 'HR / ERP',
    icon: '👥',
    terms: {
      client: 'Employee', clients: 'Employees',
      case: 'Project', cases: 'Projects',
      staff: 'Manager', staffPlural: 'Managers',
      venue: 'Department', intake: 'Job Application',
      hearing: 'Interview', hearings: 'Interviews',
    },
    roles: [
      { value: 'company_admin', label: 'HR Director' },
      { value: 'hr_manager', label: 'HR Manager' },
      { value: 'recruiter', label: 'Recruiter' },
      { value: 'department_head', label: 'Department Head' },
      { value: 'payroll_officer', label: 'Payroll Officer' },
      { value: 'employee', label: 'Employee' },
    ],
    nav: [
      { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
      { label: 'Employees', path: '/employees', icon: 'Users' },
      { label: 'Recruitment', path: '/recruitment', icon: 'UserPlus' },
      { label: 'Payroll', path: '/payroll', icon: 'Banknote' },
      { label: 'Leave Management', path: '/leave', icon: 'CalendarOff' },
      { label: 'Performance', path: '/performance', icon: 'TrendingUp' },
      { label: 'Training', path: '/training', icon: 'GraduationCap' },
      { label: 'Org Chart', path: '/org-chart', icon: 'Network' },
      { label: 'Disciplinary', path: '/disciplinary', icon: 'AlertTriangle' },
      { label: 'Benefits', path: '/benefits', icon: 'Gift' },
      { label: 'Documents', path: '/documents', icon: 'FolderOpen' },
      { label: 'Tasks', path: '/tasks', icon: 'CheckSquare' },
      { label: 'Reports', path: '/reports', icon: 'BarChart2' },
      { label: 'Integrations', path: '/integrations', icon: 'Blocks' },
      { label: 'Settings', path: '/settings', icon: 'Settings' },
    ],
  },

  optalflow: {
    name: 'Optalflow Admin',
    icon: '⚙️',
    terms: {
      client: 'Firm', clients: 'Firms',
      case: 'Subscription', cases: 'Subscriptions',
      staff: 'Admin', staffPlural: 'Admins',
      venue: 'Data Center', intake: 'Firm Onboarding',
      hearing: 'Audit Event', hearings: 'Audit Events',
    },
    roles: [
      { value: 'super_admin', label: 'Platform Administrator' }
    ],
    nav: [
      { label: 'Platform Overview', path: '/admin', icon: 'LayoutDashboard' },
      { label: 'Firms & Quotas', path: '/admin/firms', icon: 'Building2' },
      { label: 'System Users', path: '/admin/users', icon: 'Users2' },
      { label: 'Revenue & Billing', path: '/admin/billing', icon: 'CreditCard' },
      { label: 'Security & Audit', path: '/admin/security', icon: 'Shield' },
      { label: 'System Broadcasts', path: '/admin/broadcasts', icon: 'BellRing' },

      { label: 'Integrations', path: '/integrations', icon: 'Blocks' },
      { label: 'Settings', path: '/settings', icon: 'Settings' },
    ],
  },
};

import { EDUCATION_LEVELS } from './educationLevels';

export const getIndustryTerms = (industryKey, educationLevel) => {
  const ind = INDUSTRIES[industryKey] || INDUSTRIES.law;
  
  if (industryKey === 'school' && educationLevel && EDUCATION_LEVELS[educationLevel]) {
    return { ...ind.terms, ...EDUCATION_LEVELS[educationLevel].terms };
  }
  
  return ind.terms;
};

import i18n from '@/i18n/config.js';

export const getTerm = (industryKey, termKey, educationLevel) => {
  const terms = getIndustryTerms(industryKey, educationLevel);
  const englishTerm = terms[termKey] || termKey;
  const translationKey = `industry_${industryKey}_${termKey}`;
  return i18n.t(translationKey, { defaultValue: englishTerm });
};

export const getIndustryNav = (industryKey, educationLevel) => {
  const ind = INDUSTRIES[industryKey] || INDUSTRIES.law;
  let nav = [...ind.nav];
  
  if (industryKey === 'school' && educationLevel && EDUCATION_LEVELS[educationLevel]) {
     const allowedModules = EDUCATION_LEVELS[educationLevel].modules;
     nav = nav.filter(n => allowedModules.includes(n.path) || n.path === '/' || n.path === '/settings' || n.path === '/integrations' || n.path === '/hr' || n.path === '/documents' || n.path === '/tasks');
  }
  
  // Ensure Email Inbox exists globally across all industries
  if (!nav.find(n => n.path === '/email-inbox')) {
    // Insert it right before Integrations/Settings
    const insertIndex = Math.max(0, nav.length - 2);
    nav.splice(insertIndex, 0, { label: 'Email Inbox', path: '/email-inbox', icon: 'Mail' });
  }

  // Ensure Chat exists globally
  if (!nav.find(n => n.path === '/chat')) {
    // Insert it before Email Inbox
    const insertIndex = Math.max(0, nav.length - 3);
    nav.splice(insertIndex, 0, { label: 'Team Chat', path: '/chat', icon: 'MessageSquare' });
  }

  // Ensure Board exists globally
  if (!nav.find(n => n.path === '/board')) {
    const insertIndex = Math.max(0, nav.length - 3);
    nav.splice(insertIndex, 0, { label: 'Video Calls', path: '/board', icon: 'Video' });
  }
  
  return nav;
};

export const getIndustryRoles = (industryKey) => {
  const ind = INDUSTRIES[industryKey] || INDUSTRIES.law;
  return ind.roles;
};

export const clientNav = [
  { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
  { label: 'Cases / Projects', path: '/client-cases', icon: 'Briefcase' },
  { label: 'Team Chat', path: '/chat', icon: 'MessageSquare' },
  { label: 'Video Calls', path: '/board', icon: 'Video' },
  { label: 'Billing', path: '/billing', icon: 'Receipt' },
  { label: 'Documents', path: '/documents', icon: 'FolderOpen' },
  { label: 'Settings', path: '/settings', icon: 'Settings' }
];
