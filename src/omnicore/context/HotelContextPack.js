/**
 * Hotel / Hospitality Business Context Pack
 * 
 * Configures how OmniCore presents itself for the Hotel vertical.
 * Terminology is dynamically pulled from central industries.js.
 */
import { createContextPack } from './createContextPack.js';

export const HotelContextPack = createContextPack({
  industryKey: 'hotel',
  capabilities: {
    CustomerManagement: {
      enabled: true,
      mode: 'guest_profiles_and_crm',
      emphasis: 'guest_preferences_and_loyalty',
      features: ['guest_preferences', 'stay_history', 'vip_status', 'room_preferences']
    },
    Sales: {
      enabled: true,
      mode: 'reservations_and_pos',
      emphasis: 'room_bookings_and_amenity_charges',
      features: ['room_reservations', 'direct_booking', 'restaurant_pos', 'event_banquet_booking']
    },
    Finance: {
      enabled: true,
      mode: 'hospitality_folio',
      emphasis: 'guest_folios_and_night_audit',
      features: ['guest_folio_ledger', 'night_audit', 'room_deposits', 'split_billing', 'tax_and_tourism_levy']
    }
  },
  dashboard: {
    defaultLanding: '/',
    primaryMetrics: [
      'occupancy_rate',
      'arrivals_today',
      'departures_today',
      'pending_guest_requests',
      'room_turnover_status'
    ],
    quickActions: [
      { label: 'New Reservation', path: '/reservations', action: 'create_reservation' },
      { label: 'Front Desk Check-In', path: '/front-desk', action: 'check_in' },
      { label: 'Housekeeping Status', path: '/housekeeping', action: 'view_housekeeping' }
    ]
  },
  industrySpecific: {
    domainNotes: 'Hospitality and hotel property management, room inventory, guest folios, housekeeping workflows, and POS integration.',
    customFields: [
      'room_number',
      'room_type',
      'check_in_date',
      'check_out_date',
      'reservation_status',
      'keycard_id',
      'folio_id',
      'vip_tier'
    ],
    specializedEntities: [
      'reservations',
      'rooms',
      'housekeeping',
      'guest_requests',
      'restaurant_pos',
      'loyalty'
    ],
    complianceFlags: [
      'guest_data_privacy',
      'night_audit_reconciliation',
      'tourism_tax_compliance'
    ]
  }
});
