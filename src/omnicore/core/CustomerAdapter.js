import { powerSync } from '@/api/PowerSyncConnector';
import { supabase } from '@/api/supabaseClient';
import { base44 } from '@/api/base44Client';

/**
 * CustomerAdapter
 * Normalized read/write adapter for the 'Customer' primitive.
 * Maps across: clients, univ_retail_customers, univ_pharmacy_customers, univ_re_clients, industry_records.
 */
export const CustomerAdapter = {
  /**
   * Fetch normalized customer records for a given company.
   *
   * @param {string} companyId - Target company_id
   * @param {object} options - Optional filters { industryType, limit }
   * @returns {Promise<Array<NormalizedCustomer>>}
   */
  async getCustomers(companyId, options = {}) {
    if (!companyId) return [];
    const normalized = [];

    // 1. Fetch from shared 'clients' table
    try {
      const clients = await base44.entities.Client.filter({ company_id: companyId });
      (clients || []).forEach(c => {
        normalized.push({
          id: c.id,
          sourceTable: 'clients',
          companyId: c.company_id,
          name: c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unnamed Client',
          email: c.email || null,
          phone: c.phone || null,
          type: c.client_type || 'individual',
          status: c.status || 'active',
          metadata: { notes: c.notes, address: c.address }
        });
      });
    } catch (err) {
      console.warn('[CustomerAdapter] Fetch from clients table failed:', err);
    }

    // 2. Fetch from 'univ_retail_customers' if present
    try {
      const res = await powerSync.execute('SELECT * FROM univ_retail_customers WHERE company_id = ?', [companyId]);
      const retailCusts = res?.rows?._array || [];
      retailCusts.forEach(c => {
        normalized.push({
          id: c.id,
          sourceTable: 'univ_retail_customers',
          companyId: c.company_id,
          name: c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim(),
          email: c.email || null,
          phone: c.phone || null,
          type: 'retail_customer',
          status: 'active',
          metadata: { loyaltyPoints: c.loyalty_points, tier: c.tier }
        });
      });
    } catch (err) {
      // Table may not exist or query fallback
    }

    // 3. Fetch from 'industry_records' (member/client records)
    try {
      const { data } = await supabase
        .from('industry_records')
        .select('*')
        .eq('company_id', companyId)
        .in('record_type', ['member', 'client', 'donor', 'customer']);

      (data || []).forEach(rec => {
        const payload = typeof rec.data === 'string' ? JSON.parse(rec.data || '{}') : (rec.data || {});
        normalized.push({
          id: rec.id,
          sourceTable: 'industry_records',
          companyId: rec.company_id,
          name: payload.name || payload.full_name || 'Industry Record Contact',
          email: payload.email || null,
          phone: payload.phone || null,
          type: rec.record_type,
          status: payload.status || 'active',
          metadata: payload
        });
      });
    } catch (err) {
      // Fallback
    }

    return normalized;
  },

  /**
   * Create a customer using existing base44 ORM write path (additive/opt-in).
   */
  async createCustomer(companyId, customerData) {
    return base44.entities.Client.create({
      company_id: companyId,
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      notes: customerData.notes || ''
    });
  }
};
