export const EDUCATION_LEVELS = {
  preschool: {
    label: 'Preschool / Kindergarten',
    terms: {
      student: 'Child', students: 'Children',
      teacher: 'Educator', teachers: 'Educators',
      class: 'Room', classes: 'Rooms'
    },
    modules: ['/students', '/parents', '/teachers', '/classes', '/attendance', '/fees', '/notices', '/child-development', '/student-portal', '/parent-portal', '/documents', '/chat', '/board', '/email-inbox', ]
  },
  primary: {
    label: 'Primary / Elementary School',
    terms: {
      student: 'Pupil', students: 'Pupils',
      teacher: 'Teacher', teachers: 'Teachers',
      class: 'Class', classes: 'Classes'
    },
    modules: ['/students', '/parents', '/teachers', '/classes', '/timetable', '/assignments', '/attendance', '/grades', '/exams', '/discipline', '/fees', '/library', '/transport', '/notices', '/student-portal', '/parent-portal', '/documents', '/chat', '/board', '/email-inbox']
  },
  jhs: {
    label: 'Junior High School',
    terms: {
      student: 'Student', students: 'Students',
      teacher: 'Teacher', teachers: 'Teachers',
      class: 'Class', classes: 'Classes'
    },
    modules: ['/students', '/parents', '/teachers', '/classes', '/timetable', '/assignments', '/attendance', '/grades', '/exams', '/discipline', '/fees', '/library', '/transport', '/hostel', '/notices', '/student-portal', '/parent-portal', '/documents', '/chat', '/board', '/email-inbox']
  },
  shs: {
    label: 'Senior High School',
    terms: {
      student: 'Student', students: 'Students',
      teacher: 'Teacher', teachers: 'Teachers',
      class: 'Form', classes: 'Forms'
    },
    modules: ['/students', '/parents', '/teachers', '/classes', '/programmes', '/timetable', '/assignments', '/attendance', '/grades', '/exams', '/discipline', '/fees', '/library', '/transport', '/hostel', '/notices', '/student-portal', '/parent-portal', '/documents', '/chat', '/board', '/email-inbox', '/s/students/profiles', '/s/students/promotion', '/s/students/transfers', '/s/students/discipline', '/s/students/medical', '/s/admissions/review', '/s/admissions/decisions', '/s/admissions/enrollment', '/s/academics/streams', '/s/academics/subjects', '/s/academics/electives', '/s/academics/calendar', '/s/attendance/daily', '/s/attendance/class', '/s/attendance/teacher', '/s/attendance/reports', '/s/exams/internal', '/s/exams/mock', '/s/exams/assessment', '/s/exams/results', '/s/exams/report-cards', '/s/boarding/dormitories', '/s/boarding/allocation', '/s/boarding/masters', '/s/boarding/attendance', '/s/parent/progress', '/s/parent/attendance', '/s/parent/fees', '/s/parent/communication', '/s/finance/invoices', '/s/finance/payments', '/s/finance/scholarships', '/s/finance/reports', '/s/library/books', '/s/library/borrowing', '/s/library/returns', '/s/library/digital', '/s/transport/buses', '/s/transport/routes', '/s/transport/assignments', '/s/comms/notices', '/s/comms/sms', '/s/comms/whatsapp', '/s/comms/email', '/s/analytics/academic', '/s/analytics/attendance', '/s/analytics/financial']
  },
  university: {
    label: 'University / College',
    terms: {
      student: 'Undergraduate', students: 'Undergraduates',
      teacher: 'Lecturer', teachers: 'Lecturers',
      class: 'Course', classes: 'Courses'
    },
    modules: ['/students', '/parents', '/teachers', '/classes', '/faculties', '/departments', '/timetable', '/assignments', '/attendance', '/grades', '/exams', '/fees', '/library', '/hostel', '/notices', '/research-grants', '/student-portal', '/parent-portal', '/documents', '/chat', '/board', '/email-inbox']
  },
  online: {
    label: 'Online Learning Platform',
    terms: {
      student: 'Learner', students: 'Learners',
      teacher: 'Instructor', teachers: 'Instructors',
      class: 'Course', classes: 'Courses'
    },
    modules: ['/students', '/teachers', '/classes', '/lms', '/assignments', '/exams', '/certificates', '/fees', '/notices', '/student-portal', '/parent-portal', '/documents', '/chat', '/board', '/email-inbox']
  },
  vocational: {
    label: 'Vocational / Technical',
    terms: {
      student: 'Trainee', students: 'Trainees',
      teacher: 'Instructor', teachers: 'Instructors',
      class: 'Workshop', classes: 'Workshops'
    },
    modules: ['/students', '/teachers', '/classes', '/timetable', '/assignments', '/attendance', '/grades', '/exams', '/fees', '/notices', '/student-portal', '/parent-portal', '/documents', '/chat', '/board', '/email-inbox']
  }
};
