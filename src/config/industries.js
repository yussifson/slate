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
      { label: 'Automations', path: '/automations', icon: 'Zap' },
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
      { label: 'Automations', path: '/automations', icon: 'Zap' },
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
      { label: 'Dashboard', path: '/s/', icon: 'LayoutDashboard' },
      
      { section: 'Administration', label: 'Directory', path: '/s/students', icon: 'Users' },
      { label: 'Profiles', path: '/s/student-profiles', icon: 'UserCircle' },
      { label: 'Promotions', path: '/s/promotion', icon: 'TrendingUp' },
      { label: 'Transfers', path: '/s/transfers', icon: 'ArrowRightLeft' },
      { label: 'Discipline', path: '/s/discipline', icon: 'ShieldAlert' },
      { label: 'Medical', path: '/s/medical', icon: 'HeartPulse' },
      
      { section: 'Admissions', label: 'Applications', path: '/s/admissions', icon: 'FilePlus' },
      { label: 'Review', path: '/s/applicant-review', icon: 'FileCheck' },
      { label: 'Decisions', path: '/s/admission-decisions', icon: 'Gavel' },
      { label: 'Enrollment', path: '/s/enrollment', icon: 'UserPlus' },
      
      { section: 'Academics', label: 'Classes', path: '/s/classes', icon: 'BookOpen' },
      { label: 'Programmes', path: '/s/programmes', icon: 'Layers' },
      { label: 'Houses', path: '/s/houses', icon: 'Shield' },
      { label: 'Streams', path: '/s/streams', icon: 'GitBranch' },
      { label: 'Subjects', path: '/s/subjects', icon: 'BookOpen' },
      { label: 'Electives', path: '/s/electives', icon: 'Library' },
      { label: 'Calendar', path: '/s/academic-calendar', icon: 'CalendarDays' },
      { label: 'Timetable', path: '/s/timetable', icon: 'Calendar' },
      
      { section: 'Attendance', label: 'Daily', path: '/s/daily-attendance', icon: 'CalendarCheck' },
      { label: 'Classes', path: '/s/class-attendance', icon: 'Users' },
      { label: 'Teachers', path: '/s/teacher-attendance', icon: 'UserCheck' },
      { label: 'Reports', path: '/s/attendance-reports', icon: 'BarChart2' },
      
      { section: 'Examinations', label: 'Internal', path: '/s/internal-exams', icon: 'PenTool' },
      { label: 'Mock Exams', path: '/s/mock-exams', icon: 'Target' },
      { label: 'Assessment', path: '/s/assessment', icon: 'ClipboardList' },
      { label: 'Grades', path: '/s/grades', icon: 'Award' },
      { label: 'Results', path: '/s/results', icon: 'Calculator' },
      { label: 'Report Cards', path: '/s/report-cards', icon: 'FileText' },
      
      { section: 'Boarding', label: 'Dormitories', path: '/s/dormitories', icon: 'Home' },
      { label: 'Allocation', path: '/s/room-allocation', icon: 'BedDouble' },
      { label: 'Masters', path: '/s/house-masters', icon: 'UserCog' },
      { label: 'Attendance', path: '/s/boarding-attendance', icon: 'Moon' },
      
      { section: 'Finance', label: 'Fees', path: '/s/fees', icon: 'Banknote' },
      { label: 'Invoices', path: '/s/invoices', icon: 'Receipt' },
      { label: 'Payments', path: '/s/payments', icon: 'Banknote' },
      { label: 'Scholarships', path: '/s/scholarships', icon: 'Award' },
      { label: 'Reports', path: '/s/financial-reports', icon: 'PieChart' },
      
      { section: 'Library', label: 'Books', path: '/s/books', icon: 'BookMarked' },
      { label: 'Borrowing', path: '/s/borrowing', icon: 'ArrowUpRight' },
      { label: 'Returns', path: '/s/returns', icon: 'ArrowDownLeft' },
      { label: 'Digital', path: '/s/digital-resources', icon: 'Laptop' },
      
      { section: 'Transport', label: 'Buses', path: '/s/buses', icon: 'Bus' },
      { label: 'Routes', path: '/s/bus-routes', icon: 'Map' },
      { label: 'Assignments', path: '/s/bus-assignments', icon: 'MapPin' },
      
      { section: 'Comms', label: 'Notices', path: '/s/notices', icon: 'Bell' },
      { label: 'SMS', path: '/s/sms', icon: 'Smartphone' },
      { label: 'WhatsApp', path: '/s/whatsapp', icon: 'MessageSquare' },
      { label: 'Email', path: '/s/email-comms', icon: 'Mail' },
      
      { section: 'Portal', label: 'Progress', path: '/s/parent-progress', icon: 'LineChart' },
      { label: 'Attendance', path: '/s/parent-attendance', icon: 'CalendarSearch' },
      { label: 'Fees', path: '/s/parent-fees', icon: 'Wallet' },
      { label: 'Messages', path: '/s/parent-comms', icon: 'MessageCircle' },
      
      { section: 'Analytics', label: 'Academic', path: '/s/academic-analytics', icon: 'LineChart' },
      { label: 'Attendance', path: '/s/attendance-analytics', icon: 'Activity' },
      { label: 'Financial', path: '/s/financial-analytics', icon: 'TrendingUp' },
      
      { section: 'System', label: 'Settings', path: '/settings', icon: 'Settings' },
    ],
  },

  university: {
    name: 'University',
    icon: '🎓',
    terms: {
      client: 'Student', clients: 'Students',
      case: 'Course', cases: 'Courses',
      staff: 'Lecturer', staffPlural: 'Lecturers',
      venue: 'Campus', intake: 'Admission Form',
      hearing: 'Session', hearings: 'Sessions',
    },
    roles: [
      { value: 'company_admin', label: 'Chancellor / Dean' },
      { value: 'lecturer', label: 'Lecturer' },
      { value: 'student', label: 'Student' },
    ],
    nav: [
      { label: 'Dashboard', path: '/u/', icon: 'LayoutDashboard' },
      
      { section: 'Executive Pages', label: 'Enrollment', path: '/u/enrollment', icon: 'Users' },
      { label: 'Revenue', path: '/u/revenue', icon: 'TrendingUp' },
      { label: 'Faculties', path: '/u/faculties', icon: 'Building' },
      { label: 'Research Activity', path: '/u/research-activity', icon: 'FlaskConical' },
      { label: 'Graduation Stats', path: '/u/graduation-stats', icon: 'GraduationCap' },

      { section: 'Academic Structure', label: 'Structure', path: '/u/academic-structure', icon: 'Network' },
      { label: 'Course Catalog', path: '/u/courses', icon: 'BookOpen' },
      { label: 'Registration Portal', path: '/u/registration', icon: 'ClipboardCheck' },

      { section: 'Student Info', label: 'Students Directory', path: '/u/students', icon: 'UserSquare2' },
      
      { section: 'Admissions', label: 'Portal', path: '/u/admissions', icon: 'PlusSquare' },

      { section: 'Learning & Exams', label: 'LMS WorkSlates', path: '/u/lms', icon: 'FolderOpen' },
      { label: 'Exams & Grading', path: '/u/exams', icon: 'Award' },

      { section: 'Campus Life', label: 'Hostels', path: '/u/hostel', icon: 'BedDouble' },
      { label: 'Library Catalog', path: '/u/library', icon: 'Library' },
      { label: 'Career & Alumni', path: '/u/career-alumni', icon: 'Briefcase' },
      { label: 'Finance Operations', path: '/u/finance', icon: 'Banknote' },

      { section: 'System', label: 'Settings', path: '/settings', icon: 'Settings' },
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
      { label: 'Dashboard', path: '/o/', icon: 'LayoutDashboard' },
      { label: 'Learners', path: '/o/learners', icon: 'Users' },
      { label: 'Courses', path: '/o/courses', icon: 'BookOpen' },
      { label: 'Sales', path: '/o/sales', icon: 'Banknote' },

      { section: 'Course Creation', label: 'Builder', path: '/o/builder', icon: 'Hammer' },
      { label: 'Media Manager', path: '/o/media', icon: 'Image' },

      { section: 'Student Experience', label: 'Student Dashboard', path: '/o/student-dashboard', icon: 'PlayCircle' },
      { label: 'Notes', path: '/o/notes', icon: 'StickyNote' },
      { label: 'Assessments', path: '/o/assessments', icon: 'ClipboardCheck' },
      { label: 'Certificates', path: '/o/certificates', icon: 'Award' },
      { label: 'Live Sessions', path: '/o/live', icon: 'Video' },
      
      { section: 'E-commerce', label: 'Subscriptions', path: '/o/subscriptions', icon: 'RefreshCw' },
      { label: 'Affiliates', path: '/o/affiliates', icon: 'Users2' },
      { label: 'Corporate', path: '/o/corporate', icon: 'Building2' },
      
      { section: 'Community & AI', label: 'Community', path: '/o/community', icon: 'MessageSquare' },
      
      { section: 'System', label: 'Settings', path: '/settings', icon: 'Settings' },
    ],
  },

  vocational: {
    name: 'Vocational / Technical',
    icon: '🔧',
    terms: {
      client: 'Trainee', clients: 'Trainees',
      case: 'Program', cases: 'Programs',
      staff: 'Instructor', staffPlural: 'Instructors',
      venue: 'Workshop', intake: 'Enrollment',
      hearing: 'Practical', hearings: 'Practicals',
    },
    roles: [
      { value: 'company_admin', label: 'Director' },
      { value: 'instructor', label: 'Instructor' },
      { value: 'apprentice', label: 'Trainee' },
    ],
    nav: [
      { label: 'Dashboard', path: '/v/', icon: 'LayoutDashboard' },
      
      { section: 'Programs', label: 'Trades', path: '/v/trades', icon: 'BookOpen' },
      { label: 'Courses', path: '/v/courses', icon: 'FileText' },
      { label: 'Workshops', path: '/v/workshops', icon: 'Building2' },
      { label: 'Practical Modules', path: '/v/practical-modules', icon: 'Layers' },
      
      { section: 'Trainee Management', label: 'Profiles', path: '/v/trainee-profiles', icon: 'Users' },
      { label: 'Progress', path: '/v/training-progress', icon: 'TrendingUp' },
      
      { section: 'Assessments', label: 'Workshop Ass.', path: '/v/workshop-assessments', icon: 'CheckSquare' },
      { label: 'Practical Exams', path: '/v/practical-exams', icon: 'PenTool' },
      { label: 'Skill Demos', path: '/v/skill-demonstrations', icon: 'Sparkles' },
      { label: 'Competency', path: '/v/competency-tracking', icon: 'Target' },
      
      { section: 'Equipment', label: 'Inventory', path: '/v/equipment-inventory', icon: 'Package' },
      { label: 'Reservations', path: '/v/equipment-reservations', icon: 'Calendar' },
      { label: 'Maintenance', path: '/v/maintenance', icon: 'Wrench' },
      
      { section: 'Attachments', label: 'Internships', path: '/v/internship-tracking', icon: 'Briefcase' },
      { label: 'Ind. Attachments', path: '/v/industrial-attachments', icon: 'Building2' },
      { label: 'Evaluations', path: '/v/employer-evaluations', icon: 'Star' },
      
      { section: 'Certification', label: 'Certificates', path: '/v/certificates', icon: 'Award' },
      { label: 'Skill Badges', path: '/v/skill-badges', icon: 'ShieldCheck' },
      { label: 'Qualifications', path: '/v/qualification-tracking', icon: 'GraduationCap' },
      
      { section: 'Placements', label: 'Job Opportunities', path: '/v/job-opportunities', icon: 'Search' },
      { label: 'Employers', path: '/v/employers', icon: 'Users2' },
      { label: 'Placement Reports', path: '/v/placement-reports', icon: 'FileText' },
      
      { section: 'Analytics', label: 'Certification Rates', path: '/v/certification-rates', icon: 'PieChart' },
      { label: 'Employment Rates', path: '/v/employment-rates', icon: 'TrendingUp' },
      { label: 'Course Performance', path: '/v/course-performance', icon: 'BarChart2' },
      
      { section: 'System', label: 'Settings', path: '/settings', icon: 'Settings' },
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
      { label: 'Automations', path: '/automations', icon: 'Zap' },
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
      { label: 'Automations', path: '/automations', icon: 'Zap' },
      { label: 'Settings', path: '/settings', icon: 'Settings' },
    ],
  },

  religion: {
    name: 'Religion',
    icon: '⛪',
    terms: {
      client: 'Member', clients: 'Members',
      case: 'Group', cases: 'Groups',
      staff: 'Pastor', staffPlural: 'Pastors',
      venue: 'Branch', intake: 'Member Registration',
      hearing: 'Event', hearings: 'Events',
    },
    roles: [
      { value: 'company_admin', label: 'Senior Pastor' },
      { value: 'elder', label: 'Elder / Deacon' },
      { value: 'group_leader', label: 'Group Leader' },
      { value: 'treasurer', label: 'Treasurer' },
      { value: 'volunteer', label: 'Volunteer' },
      { value: 'member', label: 'Member' },
    ],
    nav: [
      { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
      { label: 'Members', path: '/members', icon: 'Users' },
      { label: 'Groups', path: '/groups', icon: 'Layers' },
      { label: 'Events & Services', path: '/events', icon: 'Calendar' },
      { label: 'Donation & Offerings', path: '/donations', icon: 'HandCoins' },
      { label: 'Volunteers', path: '/volunteers', icon: 'HeartHandshake' },
      { label: 'Sermon Library', path: '/sermons', icon: 'BookOpen' },
      { label: 'Small Groups', path: '/small-groups', icon: 'Users2' },
      { label: 'Prayer Requests', path: '/prayers', icon: 'Star' },
      { label: 'Attendance', path: '/attendance', icon: 'CheckSquare' },
      { label: 'Documents', path: '/documents', icon: 'FolderOpen' },
      { label: 'Tasks', path: '/tasks', icon: 'CheckSquare2' },
      { label: 'Reports', path: '/reports', icon: 'BarChart2' },
      { label: 'Integrations', path: '/integrations', icon: 'Blocks' },
      { label: 'Automations', path: '/automations', icon: 'Zap' },
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
      { label: 'Automations', path: '/automations', icon: 'Zap' },
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
      { label: 'Inventory', path: '/retail-inventory', icon: 'Package' },
      { label: 'Purchase Orders', path: '/purchase-orders', icon: 'FileText' },
      { label: 'Products', path: '/products', icon: 'Tag' },
      { label: 'Promotions', path: '/promotions', icon: 'Percent' },
      { label: 'Orders', path: '/orders', icon: 'ClipboardList' },
      { label: 'Customers', path: '/retail-customers', icon: 'Users' },
      { label: 'Suppliers', path: '/suppliers', icon: 'Truck' },
      { label: 'Loyalty Program', path: '/loyalty', icon: 'Star' },
      { label: 'Shifts', path: '/shifts', icon: 'Clock' },
      { label: 'Billing', path: '/billing', icon: 'Receipt' },
      { label: 'Staff', path: '/team', icon: 'UserCog' },
      { label: 'HR & Leave', path: '/hr', icon: 'HeartHandshake' },
      { label: 'Reports', path: '/reports', icon: 'BarChart2' },
      { label: 'Integrations', path: '/integrations', icon: 'Blocks' },
      { label: 'Automations', path: '/automations', icon: 'Zap' },
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
      
      { section: 'Fleet Management', label: 'Vehicle Management', path: '/fleet', icon: 'Car' },
      { label: 'Vehicle Profiles', path: '/fleet/profiles', icon: 'FileText' },
      { label: 'Vehicle Registration', path: '/fleet/registration', icon: 'FileText' },
      { label: 'Vehicle Insurance', path: '/fleet/insurance', icon: 'Shield' },
      { label: 'Vehicle Licensing', path: '/fleet/licensing', icon: 'Award' },
      { label: 'Service Records', path: '/fleet/service', icon: 'Wrench' },
      { label: 'Maintenance Schedule', path: '/fleet/maintenance', icon: 'Calendar' },
      { label: 'Preventive Maintenance', path: '/fleet/preventive', icon: 'CheckCircle' },
      { label: 'Breakdown Management', path: '/fleet/breakdowns', icon: 'AlertTriangle' },
      { label: 'Tire Management', path: '/fleet/tires', icon: 'Zap' },
      { label: 'Fuel Management', path: '/fleet/fuel', icon: 'Droplet' },
      { label: 'Spare Parts', path: '/fleet/spare-parts', icon: 'Package' },
      { label: 'Asset Tracking', path: '/fleet/assets', icon: 'Cog' },
      { label: 'Vehicle Utilization', path: '/fleet/utilization', icon: 'TrendingUp' },
      { label: 'Vehicle Downtime', path: '/fleet/downtime', icon: 'Clock' },
      { label: 'Vehicle Inspections', path: '/fleet/inspections', icon: 'CheckSquare' },
      
      { section: 'Driver Management', label: 'Driver Profiles', path: '/drivers', icon: 'Truck' },
      { label: 'Driver Licenses', path: '/drivers/licenses', icon: 'Award' },
      { label: 'Driver Certifications', path: '/drivers/certifications', icon: 'Badge' },
      { label: 'Driver Training', path: '/drivers/training', icon: 'BookOpen' },
      { label: 'Driver Attendance', path: '/drivers/attendance', icon: 'Clock' },
      { label: 'Driver Scheduling', path: '/drivers/schedule', icon: 'Calendar' },
      { label: 'Driver Payroll', path: '/drivers/payroll', icon: 'Banknote' },
      { label: 'Driver Performance', path: '/drivers/performance', icon: 'TrendingUp' },
      { label: 'Safety Incidents', path: '/drivers/safety', icon: 'AlertCircle' },
      { label: 'Driver Violations', path: '/drivers/violations', icon: 'AlertTriangle' },
      { label: 'Driver Rewards', path: '/drivers/rewards', icon: 'Gift' },
      { label: 'Driver Documents', path: '/drivers/documents', icon: 'FileText' },
      { label: 'Driver Mobile App', path: '/driver-mobile-app', icon: 'Smartphone' },
      
      { section: 'Dispatch & Operations', label: 'Dispatch Centers', path: '/dispatch/centers', icon: 'Building2' },
      { label: 'Trip Planning', path: '/dispatch/trips', icon: 'Map' },
      { label: 'Trip Assignments', path: '/dispatch/assignments', icon: 'CheckSquare' },
      { label: 'Load Management', path: '/dispatch/loads', icon: 'Package' },
      { label: 'Route Planning', path: '/routes', icon: 'Map' },
      { label: 'Route Optimization', path: '/dispatch/optimization', icon: 'Zap' },
      { label: 'Dispatch Calendar', path: '/dispatch/calendar', icon: 'Calendar' },
      { label: 'Dispatch Board', path: '/dispatch', icon: 'LayoutGrid' },
      { label: 'Real-Time Monitoring', path: '/dispatch/monitoring', icon: 'Activity' },
      { label: 'Multi-Stop Delivery', path: '/dispatch/multi-stop', icon: 'Navigation' },
      
      { section: 'Core Operations', label: 'Shipments', path: '/shipments', icon: 'Package' },
      { label: 'Warehouse', path: '/warehouse', icon: 'Warehouse' },
      { label: 'Pickup Requests', path: '/pickups', icon: 'MapPin' },
      { label: 'Proof of Delivery', path: '/proof-of-delivery', icon: 'CheckCircle' },
      { label: 'Returns', path: '/returns', icon: 'RefreshCw' },
      { label: 'Incidents', path: '/incidents', icon: 'AlertTriangle' },
      
      { section: 'Business', label: 'Customers', path: '/clients', icon: 'Users' },
      { label: 'Billing', path: '/billing', icon: 'Receipt' },
      
      { section: 'Analytics & Reporting', label: 'Advanced Analytics', path: '/logistics-analytics', icon: 'BarChart2' },
      { label: 'Reports', path: '/reports', icon: 'FileText' },
      
      { section: 'Administration', label: 'Staff', path: '/team', icon: 'UserCog' },
      { label: 'HR & Leave', path: '/hr', icon: 'HeartHandshake' },
      { label: 'Integrations', path: '/integrations', icon: 'Blocks' },
      { label: 'Automations', path: '/automations', icon: 'Zap' },
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
      { label: 'Automations', path: '/automations', icon: 'Zap' },
      { label: 'Settings', path: '/settings', icon: 'Settings' },
    ],
  },

  slate: {
    name: 'Slate Admin',
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
      { label: 'Pricing & Plans', path: '/admin/pricing', icon: 'Crown' },
      { label: 'Revenue & Billing', path: '/admin/billing', icon: 'CreditCard' },
      { label: 'Security & Audit', path: '/admin/security', icon: 'Shield' },
      { label: 'System Broadcasts', path: '/admin/broadcasts', icon: 'BellRing' },
      { label: 'Enterprise Requests', path: '/admin/enterprise-requests', icon: 'Building2' },

      { label: 'Integrations', path: '/integrations', icon: 'Blocks' },
      { label: 'Automations', path: '/automations', icon: 'Zap' },
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
