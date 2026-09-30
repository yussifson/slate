/**
 * Hospital / Healthcare Business Context Pack (Phase C)
 * 
 * Configures how OmniCore presents itself for Hospitals, Clinics & Healthcare providers.
 * Terminology is dynamically pulled from central industries.js.
 */
import { createContextPack } from './createContextPack.js';

export const HospitalContextPack = createContextPack({
  industryKey: 'hospital',
  capabilities: {
    CustomerManagement: {
      enabled: true,
      mode: 'patient_health_records',
      emphasis: 'patient_demographics_and_clinical_history',
      features: ['patient_records', 'medical_history', 'insurance_policies', 'next_of_kin', 'triage_records']
    },
    Sales: {
      enabled: true,
      mode: 'clinical_encounters_and_services',
      emphasis: 'consultations_procedures_and_admissions',
      features: ['doctor_appointments', 'surgery_scheduling', 'lab_diagnostic_orders', 'inpatient_admissions', 'bed_allocation']
    },
    Finance: {
      enabled: true,
      mode: 'medical_billing_and_claims',
      emphasis: 'hmo_insurance_claims_and_co_pays',
      features: ['medical_claims', 'insurance_pre_authorization', 'patient_co_pay', 'ward_charges', 'pharmacy_dispensation_billing']
    }
  },
  dashboard: {
    defaultLanding: '/hospital',
    primaryMetrics: [
      'inpatient_bed_occupancy_rate',
      'outpatient_visits_today',
      'surgeries_scheduled_today',
      'pending_diagnostic_results',
      'emergency_admissions_count'
    ],
    quickActions: [
      { label: 'Register Patient', path: '/hospital/patients', action: 'register_patient' },
      { label: 'Schedule Appointment', path: '/hospital/appointments', action: 'book_appointment' },
      { label: 'Operation Theater', path: '/hospital/ot', action: 'view_ot_schedule' }
    ]
  },
  industrySpecific: {
    domainNotes: 'Clinical workflows, electronic health records (EHR), outpatient scheduling, operation theater management, bed rostering, and pharmacy integration.',
    customFields: [
      'medical_record_number',
      'blood_group',
      'assigned_doctor_id',
      'ward_number',
      'bed_number',
      'admission_date',
      'discharge_date',
      'insurance_provider'
    ],
    specializedEntities: [
      'patients',
      'appointments',
      'doctors',
      'wards',
      'beds',
      'prescriptions',
      'diagnostic_orders',
      'medical_claims'
    ],
    complianceFlags: [
      'hipaa_privacy_compliance',
      'patient_consent_verification',
      'prescription_drug_dispensation_audit'
    ]
  }
});

export default HospitalContextPack;
