/**
 * Pharmacy Business Context Pack
 * 
 * Configures how OmniCore presents itself for the Pharmacy vertical.
 * Terminology is dynamically pulled from central industries.js.
 */
import { createContextPack } from './createContextPack.js';

export const PharmacyContextPack = createContextPack({
  industryKey: 'pharmacy',
  capabilities: {
    CustomerManagement: {
      enabled: true,
      mode: 'patient_records',
      emphasis: 'medical_history_and_insurance',
      features: ['patient_allergies', 'insurance_details', 'prescriber_linkage']
    },
    Sales: {
      enabled: true,
      mode: 'dispensing_and_otc',
      emphasis: 'prescription_verification_and_claims',
      features: ['rx_dispensing', 'refill_validation', 'otc_pos', 'controlled_substance_check']
    },
    Finance: {
      enabled: true,
      mode: 'healthcare_billing',
      emphasis: 'insurance_reimbursement_and_copays',
      features: ['insurance_claims_processing', 'patient_copay_ledger', 'supplier_consignment']
    }
  },
  dashboard: {
    defaultLanding: '/pharmacy/dashboard',
    primaryMetrics: [
      'prescriptions_dispensed_today',
      'pending_refill_requests',
      'unsettled_insurance_claims',
      'expiring_medications_count'
    ],
    quickActions: [
      { label: 'Dispense Rx', path: '/pharmacy/pos', action: 'dispense_prescription' },
      { label: 'New Prescription', path: '/pharmacy/prescriptions', action: 'intake_rx' },
      { label: 'File Claim', path: '/pharmacy/claims', action: 'file_insurance_claim' }
    ]
  },
  industrySpecific: {
    domainNotes: 'Regulated pharmacy dispensing, batch/expiry compliance, dosage instructions, and insurance claims.',
    customFields: [
      'prescription_number',
      'dosage_instructions',
      'drug_batch_number',
      'expiry_date',
      'insurance_claim_id',
      'controlled_substance_schedule',
      'refills_remaining',
      'prescribing_doctor'
    ],
    specializedEntities: [
      'prescriptions',
      'drug_catalog',
      'insurance_claims',
      'refill_schedules',
      'controlled_substances_log'
    ],
    complianceFlags: [
      'expiry_date_strict_enforcement',
      'narcotic_prescription_audit',
      'patient_hipaa_privacy'
    ]
  }
});
