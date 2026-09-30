/**
 * Law Firm Business Context Pack
 * 
 * Configures how OmniCore presents itself for the Legal / Law Firm vertical.
 * Terminology is dynamically pulled from central industries.js.
 */
import { createContextPack } from './createContextPack.js';

export const LawFirmContextPack = createContextPack({
  industryKey: 'law',
  capabilities: {
    CustomerManagement: {
      enabled: true,
      mode: 'matter_and_client_management',
      emphasis: 'case_history_and_conflict_checks',
      features: ['case_history', 'conflict_checks', 'retainers', 'client_matter_billing']
    },
    Sales: {
      enabled: true,
      mode: 'retainers_and_engagements',
      emphasis: 'retainers_and_legal_services',
      features: ['engagement_letters', 'retainer_agreements', 'hourly_rate_schedules']
    },
    Finance: {
      enabled: true,
      mode: 'legal_trust_accounting',
      emphasis: 'trust_accounting_and_time_billing',
      features: ['trust_accounting', 'iolta_compliance', 'billable_hours', 'retainer_drawdown', 'disbursement_tracking']
    }
  },
  dashboard: {
    defaultLanding: '/',
    primaryMetrics: [
      'active_matters',
      'unbilled_time_and_disbursements',
      'trust_account_balance',
      'upcoming_court_hearings'
    ],
    quickActions: [
      { label: 'New Case / Matter', path: '/cases', action: 'create_case' },
      { label: 'Log Billable Time', path: '/billing', action: 'log_time' },
      { label: 'Run Conflict Check', path: '/conflict-check', action: 'conflict_check' }
    ]
  },
  industrySpecific: {
    domainNotes: 'Legal practice management, matter-based tracking, court deadlines, IOLTA trust accounting, and attorney-client privilege.',
    customFields: [
      'case_number',
      'court_jurisdiction',
      'bar_number',
      'retainer_amount',
      'trust_account_id',
      'conflict_check_status',
      'billing_rate_hourly'
    ],
    specializedEntities: [
      'cases',
      'hearings',
      'conflict_check',
      'trust_accounting',
      'retainers',
      'smart_docs'
    ],
    complianceFlags: [
      'iolta_trust_isolation',
      'conflict_of_interest_check',
      'attorney_client_privilege'
    ]
  }
});
