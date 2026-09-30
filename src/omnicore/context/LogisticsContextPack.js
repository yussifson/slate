/**
 * Logistics & Supply Chain Business Context Pack (Phase C)
 * 
 * Configures how OmniCore presents itself for Logistics, Freight, Fleet & Transport companies.
 * Terminology is dynamically pulled from central industries.js.
 */
import { createContextPack } from './createContextPack.js';

export const LogisticsContextPack = createContextPack({
  industryKey: 'logistics',
  capabilities: {
    CustomerManagement: {
      enabled: true,
      mode: 'shippers_consignees_brokers',
      emphasis: 'shipper_accounts_and_delivery_networks',
      features: ['shipper_profiles', 'consignee_records', 'freight_broker_contracts', 'delivery_destinations', 'sla_tracking']
    },
    Sales: {
      enabled: true,
      mode: 'freight_orders_and_shipments',
      emphasis: 'shipment_bookings_dispatch_and_tracking',
      features: ['shipment_orders', 'waybill_generation', 'driver_dispatch', 'proof_of_delivery', 'route_planning']
    },
    Finance: {
      enabled: true,
      mode: 'freight_billing_and_fleet_expenses',
      emphasis: 'waybill_invoicing_and_carrier_settlements',
      features: ['freight_invoices', 'fuel_surcharges', 'demurrage_charges', 'driver_trip_settlements', 'fleet_maintenance_costs']
    }
  },
  dashboard: {
    defaultLanding: '/logistics',
    primaryMetrics: [
      'active_shipments_in_transit',
      'on_time_delivery_percentage',
      'fleet_utilization_rate',
      'pending_dispatch_queue',
      'total_freight_revenue'
    ],
    quickActions: [
      { label: 'Create Shipment', path: '/logistics/shipments', action: 'create_shipment' },
      { label: 'Dispatch Driver', path: '/logistics/dispatch', action: 'dispatch_trip' },
      { label: 'Fleet Analytics', path: '/logistics/analytics', action: 'view_fleet_metrics' }
    ]
  },
  industrySpecific: {
    domainNotes: 'Freight transportation, fleet telematics, dispatch management, multi-stop routing, driver settlement, and cargo tracking.',
    customFields: [
      'waybill_number',
      'tracking_code',
      'origin_hub',
      'destination_hub',
      'cargo_weight_kg',
      'vehicle_registration',
      'driver_id',
      'delivery_status'
    ],
    specializedEntities: [
      'shipments',
      'waybills',
      'vehicles',
      'drivers',
      'routes',
      'trips',
      'proof_of_delivery'
    ],
    complianceFlags: [
      'driver_hours_of_service_compliance',
      'cargo_insurance_coverage',
      'hazardous_materials_certification'
    ]
  }
});

export default LogisticsContextPack;
