/**
 * Real Estate Business Context Pack (Phase C)
 * 
 * Configures how OmniCore presents itself for Real Estate & Property Development verticals (including JCL).
 * Terminology is dynamically pulled from central industries.js.
 */
import { createContextPack } from './createContextPack.js';

export const RealEstateContextPack = createContextPack({
  industryKey: 'real_estate',
  capabilities: {
    CustomerManagement: {
      enabled: true,
      mode: 'leads_tenants_buyers',
      emphasis: 'lead_lifecycle_and_tenant_relations',
      features: ['crm_leads', 'tenant_leases', 'buyer_profiles', 'agent_assignments', 'investor_records']
    },
    Sales: {
      enabled: true,
      mode: 'property_sales_and_deals',
      emphasis: 'property_listings_and_deal_closings',
      features: ['property_listings', 'deal_pipeline', 'commission_tracking', 'installment_plans', 'site_visits']
    },
    Finance: {
      enabled: true,
      mode: 'real_estate_accounting',
      emphasis: 'rent_roll_and_commission_settlements',
      features: ['rent_roll', 'security_deposits', 'commission_payouts', 'land_acquisition_costs', 'escrow_tracking']
    }
  },
  dashboard: {
    defaultLanding: '/real-estate',
    primaryMetrics: [
      'active_listings_count',
      'total_crm_leads',
      'monthly_deal_volume',
      'active_leases_count',
      'land_parcels_under_management'
    ],
    quickActions: [
      { label: 'New Property Listing', path: '/real-estate/properties', action: 'create_listing' },
      { label: 'Add CRM Lead', path: '/real-estate/leads', action: 'create_lead' },
      { label: 'Land Parcel Management', path: '/real-estate/land', action: 'view_land' }
    ]
  },
  industrySpecific: {
    domainNotes: 'Commercial and residential real estate brokerage, property management, land subdivision, tenant lease tracking, and JCL executive dashboards.',
    customFields: [
      'property_type',
      'zoning_type',
      'listing_price',
      'square_feet',
      'bedrooms',
      'bathrooms',
      'agent_id',
      'parcel_number',
      'lease_start_date',
      'lease_end_date'
    ],
    specializedEntities: [
      'properties',
      'land_parcels',
      'leads',
      'deals',
      'leases',
      'agents',
      'commissions'
    ],
    complianceFlags: [
      'escrow_account_segregation',
      'fair_housing_compliance',
      'lease_renewal_notice_rules'
    ]
  }
});

export default RealEstateContextPack;
