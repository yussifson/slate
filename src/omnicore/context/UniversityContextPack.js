/**
 * University & Higher Education Business Context Pack (Phase C)
 * 
 * Configures how OmniCore presents itself for Universities, Colleges & Academic Institutions.
 * Terminology is dynamically pulled from central industries.js.
 */
import { createContextPack } from './createContextPack.js';

export const UniversityContextPack = createContextPack({
  industryKey: 'university',
  capabilities: {
    CustomerManagement: {
      enabled: true,
      mode: 'student_academic_records',
      emphasis: 'student_lifecycle_and_advising',
      features: ['student_profiles', 'guardian_records', 'faculty_advisors', 'alumni_records', 'academic_standing']
    },
    Sales: {
      enabled: true,
      mode: 'academic_enrollment_and_programs',
      emphasis: 'course_registration_and_degree_audits',
      features: ['course_registration', 'term_enrollment', 'degree_audits', 'transcript_requests', 'graduation_tracking']
    },
    Finance: {
      enabled: true,
      mode: 'tuition_and_scholarship_billing',
      emphasis: 'student_tuition_and_financial_aid',
      features: ['tuition_invoicing', 'scholarship_disbursements', 'payment_plans', 'housing_fees', 'library_charges']
    }
  },
  dashboard: {
    defaultLanding: '/university',
    primaryMetrics: [
      'total_enrolled_students',
      'active_courses_count',
      'tuition_collection_rate',
      'faculty_roster_count',
      'hostel_residence_occupancy'
    ],
    quickActions: [
      { label: 'Enroll Student', path: '/university/students', action: 'enroll_student' },
      { label: 'Course Catalog', path: '/university/courses', action: 'view_courses' },
      { label: 'Tuition Billing', path: '/university/fees', action: 'manage_fees' }
    ]
  },
  industrySpecific: {
    domainNotes: 'Higher education academic administration, course registration, semester grading, faculty workloads, student housing, and tuition accounting.',
    customFields: [
      'student_id_number',
      'major_program',
      'academic_year',
      'gpa',
      'credits_completed',
      'faculty_department',
      'financial_aid_status'
    ],
    specializedEntities: [
      'students',
      'faculty',
      'courses',
      'enrollments',
      'departments',
      'tuition_schedules',
      'hostels'
    ],
    complianceFlags: [
      'ferpa_student_privacy',
      'accreditation_record_retention',
      'grade_audit_trail'
    ]
  }
});

export default UniversityContextPack;
