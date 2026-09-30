/**
 * Insurance & Risk Underwriting Business Context Pack (Phase C)
 * 
 * Configures how OmniCore presents itself for Insurance carriers, brokers, and agencies.
 * Terminology is dynamically pulled from central industries.js.
 */
import { createContextPack } from './createContextPack.js';

export const InsuranceContextPack = createContextPack({
  industryKey: 'insurance',
  capabilities: {
    CustomerManagement: {
      enabled: true,
      mode: 'policyholders_and_beneficiaries',
      emphasis: 'policyholder_profiles_and_underwriting_risk',
      features: ['policyholder_profiles', 'beneficiary_records', 'risk_scorecards', 'agent_broker_accounts', 'customer_claim_history']
    },
    Sales: {
      enabled: true,
      mode: 'policy_quotes_and_underwriting',
      emphasis: 'policy_issuance_renewals_and_endorsements',
      features: ['insurance_quotes', 'policy_issuance', 'policy_renewals', 'endorsements', 'coverage_terms']
    },
    Finance: {
      enabled: true,
      mode: 'premium_billing_and_claims_settlement',
      emphasis: 'premium_collections_claims_reserves_and_payouts',
      features: ['premium_invoicing', 'claims_settlements', 'loss_reserves', 'broker_commissions', 'reinsurance_recoveries']
    }
  },
  dashboard: {
    defaultLanding: '/insurance',
    primaryMetrics: [
      'active_policies_count',
      'gross_written_premium',
      'portfolio_loss_ratio',
      'pending_claims_queue',
      'policy_renewal_rate'
    ],
    quickActions: [
      { label: 'Issue New Policy', path: '/insurance/policies', action: 'create_policy' },
      { label: 'File Claim', path: '/insurance/claims', action: 'file_claim' },
      { label: 'Underwriting Review', path: '/insurance/underwriting', action: 'review_quotes' }
    ]
  },
  industrySpecific: {
    domainNotes: 'Policy administration systems (PAS), claims adjudication, risk appraisal, actuarial reserves, and premium billing.',
    customFields: [
      'policy_number',
      'claim_number',
      'coverage_type',
      'deductible_amount',
      'coverage_limit',
      'premium_frequency',
      'effective_date',
      'expiration_date'
    ],
    specializedEntities: [
      'policies',
      'claims',
      'quotes',
      'endorsements',
      'beneficiaries',
      'adjusters',
      'loss_reserves'
    ],
    complianceFlags: [
      'insurance_solvency_reporting',
      'claims_adjudication_audit_trail',
      'fraud_detection_monitoring'
    ]
  }
});

export default InsuranceContextPack;
