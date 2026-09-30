/**
 * Retail / POS Business Context Pack
 * 
 * Configures how OmniCore presents itself for the Retail vertical.
 * Terminology is dynamically pulled from central industries.js.
 */
import { createContextPack } from './createContextPack.js';

export const RetailContextPack = createContextPack({
  industryKey: 'retail',
  capabilities: {
    CustomerManagement: {
      enabled: true,
      mode: 'b2c_and_b2b',
      emphasis: 'loyalty_and_purchase_history',
      features: ['loyalty_points', 'purchase_history', 'store_credits']
    },
    Sales: {
      enabled: true,
      mode: 'pos_and_orders',
      emphasis: 'fast_checkout_and_promotions',
      features: ['pos_checkout', 'barcode_lookup', 'discounts_promotions', 'order_fulfillment']
    },
    Finance: {
      enabled: true,
      mode: 'retail_ledger',
      emphasis: 'cash_reconciliation_and_invoicing',
      features: ['cash_register_shifts', 'daily_till_reconciliation', 'rma_refunds']
    }
  },
  dashboard: {
    defaultLanding: '/retail-dashboard',
    primaryMetrics: [
      'daily_sales_volume',
      'active_shift_cash_balance',
      'top_selling_products',
      'low_stock_alerts'
    ],
    quickActions: [
      { label: 'New POS Sale', path: '/pos', action: 'launch_pos' },
      { label: 'Add Product', path: '/products', action: 'create_product' },
      { label: 'Receive Stock', path: '/purchase-orders', action: 'receive_stock' }
    ]
  },
  industrySpecific: {
    domainNotes: 'Retail POS, store inventory, barcode management, and multi-location operations.',
    customFields: [
      'barcode',
      'sku',
      'loyalty_points',
      'discount_tier',
      'register_id',
      'shift_id',
      'rma_number'
    ],
    specializedEntities: [
      'promotions',
      'barcodes',
      'rmas',
      'store_builder',
      'franchise_network'
    ],
    complianceFlags: [
      'tax_receipt_compliance',
      'drawer_count_verification'
    ]
  }
});
