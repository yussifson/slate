/**
 * Religious Organizations & Non-Profit Business Context Pack (Phase C)
 * 
 * Configures how OmniCore presents itself for Churches, Mosques, Synagogues & Non-Profit Organizations.
 * Terminology is dynamically pulled from central industries.js.
 */
import { createContextPack } from './createContextPack.js';

export const ReligiousOrgContextPack = createContextPack({
  industryKey: 'religion',
  capabilities: {
    CustomerManagement: {
      enabled: true,
      mode: 'congregants_and_families',
      emphasis: 'member_care_and_household_ministry',
      features: ['congregant_profiles', 'household_records', 'ministry_groups', 'volunteer_rosters', 'pastoral_care_notes']
    },
    Sales: {
      enabled: true,
      mode: 'donations_and_event_registrations',
      emphasis: 'tithes_offerings_and_events',
      features: ['tithe_contributions', 'pledge_tracking', 'ministry_events', 'volunteer_scheduling', 'sermon_resources']
    },
    Finance: {
      enabled: true,
      mode: 'fund_and_stewardship_accounting',
      emphasis: 'donation_receipting_and_restricted_funds',
      features: ['donation_receipts', 'restricted_ministry_funds', 'missionary_support', 'pledge_reconciliation', 'annual_giving_statements']
    }
  },
  dashboard: {
    defaultLanding: '/religion',
    primaryMetrics: [
      'active_congregation_count',
      'weekly_contributions_total',
      'active_ministries_count',
      'upcoming_events_count',
      'active_volunteers_count'
    ],
    quickActions: [
      { label: 'Record Contribution', path: '/religion/contributions', action: 'record_donation' },
      { label: 'Register Member', path: '/religion/members', action: 'register_member' },
      { label: 'Volunteer Schedule', path: '/religion/volunteers', action: 'manage_volunteers' }
    ]
  },
  industrySpecific: {
    domainNotes: 'Congregation management, pastoral care, household structuring, tithe and pledge bookkeeping, and volunteer ministry rostering.',
    customFields: [
      'member_envelope_number',
      'household_role',
      'baptism_date',
      'ministry_group_id',
      'pledge_commitment_amount',
      'giving_category',
      'tax_receipt_status'
    ],
    specializedEntities: [
      'congregants',
      'households',
      'donations',
      'pledges',
      'ministries',
      'volunteers',
      'events'
    ],
    complianceFlags: [
      'non_profit_tax_exemption_compliance',
      'donor_confidentiality',
      'child_ministry_safeguarding'
    ]
  }
});

export default ReligiousOrgContextPack;
