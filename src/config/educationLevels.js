export const EDUCATION_LEVELS = {
  preschool: {
    label: 'Preschool / Kindergarten',
    terms: {
      student: 'Child', students: 'Children',
      teacher: 'Educator', teachers: 'Educators',
      class: 'Room', classes: 'Rooms'
    },
    modules: ['/students', '/parents', '/teachers', '/classes', '/attendance', '/fees', '/notices', '/child-development', '/documents', '/chat', '/board', '/email-inbox']
  },
  primary: {
    label: 'Primary / Elementary School',
    terms: {
      student: 'Pupil', students: 'Pupils',
      teacher: 'Teacher', teachers: 'Teachers',
      class: 'Class', classes: 'Classes'
    },
    modules: ['/students', '/parents', '/teachers', '/classes', '/timetable', '/assignments', '/attendance', '/grades', '/exams', '/discipline', '/fees', '/library', '/transport', '/notices', '/documents', '/chat', '/board', '/email-inbox']
  },
  jhs: {
    label: 'Junior High School',
    terms: {
      student: 'Student', students: 'Students',
      teacher: 'Teacher', teachers: 'Teachers',
      class: 'Class', classes: 'Classes'
    },
    modules: ['/students', '/parents', '/teachers', '/classes', '/timetable', '/assignments', '/attendance', '/grades', '/exams', '/discipline', '/fees', '/library', '/transport', '/hostel', '/notices', '/documents', '/chat', '/board', '/email-inbox']
  },
  shs: {
    label: 'Senior High School',
    terms: {
      student: 'Student', students: 'Students',
      teacher: 'Teacher', teachers: 'Teachers',
      class: 'Form', classes: 'Forms'
    },
    modules: ['/students', '/parents', '/teachers', '/classes', '/programmes', '/timetable', '/assignments', '/attendance', '/grades', '/exams', '/discipline', '/fees', '/library', '/transport', '/hostel', '/notices', '/documents', '/chat', '/board', '/email-inbox']
  },
  university: {
    label: 'University / College',
    terms: {
      student: 'Undergraduate', students: 'Undergraduates',
      teacher: 'Lecturer', teachers: 'Lecturers',
      class: 'Course', classes: 'Courses'
    },
    modules: ['/students', '/parents', '/teachers', '/classes', '/faculties', '/departments', '/timetable', '/assignments', '/attendance', '/grades', '/exams', '/fees', '/library', '/hostel', '/notices', '/research-grants', '/documents', '/chat', '/board', '/email-inbox']
  },
  online: {
    label: 'Online Learning Platform',
    terms: {
      student: 'Learner', students: 'Learners',
      teacher: 'Instructor', teachers: 'Instructors',
      class: 'Course', classes: 'Courses'
    },
    modules: ['/students', '/teachers', '/classes', '/lms', '/assignments', '/exams', '/certificates', '/fees', '/notices', '/documents', '/chat', '/board', '/email-inbox']
  },
  vocational: {
    label: 'Vocational / Technical',
    terms: {
      student: 'Trainee', students: 'Trainees',
      teacher: 'Instructor', teachers: 'Instructors',
      class: 'Workshop', classes: 'Workshops'
    },
    modules: ['/students', '/teachers', '/classes', '/timetable', '/assignments', '/attendance', '/grades', '/exams', '/fees', '/notices', '/documents', '/chat', '/board', '/email-inbox']
  }
};
