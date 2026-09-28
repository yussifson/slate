import { powerSync } from '@/api/PowerSyncConnector';
import { base44 } from '@/api/base44Client';

/**
 * ProductAdapter
 * Normalized read/write adapter for the 'Product/Service' primitive.
 * Primary sources: univ_retail_products, univ_pharmacy_drugs, time_entries.
 * Note: industry_records for 'asset'/'item'/'service_offering' and univ_re_properties are intentionally deferred.
 */
export const ProductAdapter = {
  /**
   * Fetch normalized product and service records for a given company.
   *
   * @param {string} companyId - Target company_id
   * @param {object} options - Optional query parameters
   * @returns {Promise<Array<NormalizedProduct>>}
   */
  async getProducts(companyId, options = {}) {
    if (!companyId) return [];
    const normalized = [];

    // 1. Fetch physical goods from 'univ_retail_products'
    try {
      const res = await powerSync.execute('SELECT * FROM univ_retail_products WHERE company_id = ?', [companyId]);
      const retailProducts = res?.rows?._array || [];
      retailProducts.forEach(p => {
        normalized.push({
          id: p.id,
          sourceTable: 'univ_retail_products',
          companyId: p.company_id,
          name: p.name || 'Unnamed Retail Product',
          sku: p.sku || null,
          type: 'physical_good',
          price: Number(p.price || 0),
          cost: Number(p.cost || 0),
          stockQuantity: Number(p.stock_quantity || 0),
          status: p.status || 'active',
          metadata: { category: p.category, barcode: p.barcode }
        });
      });
    } catch (err) {
      // Table may not exist or query fallback
    }

    // 2. Fetch pharmaceutical goods from 'univ_pharmacy_drugs'
    try {
      const res = await powerSync.execute('SELECT * FROM univ_pharmacy_drugs WHERE company_id = ?', [companyId]);
      const pharmacyDrugs = res?.rows?._array || [];
      pharmacyDrugs.forEach(d => {
        normalized.push({
          id: d.id,
          sourceTable: 'univ_pharmacy_drugs',
          companyId: d.company_id,
          name: d.brand_name || d.generic_name || 'Pharmacy Drug',
          sku: d.sku || d.ndc_code || null,
          type: 'pharmaceutical',
          price: Number(d.price || 0),
          cost: Number(d.cost || 0),
          stockQuantity: Number(d.stock_quantity || 0),
          status: d.status || 'active',
          metadata: { genericName: d.generic_name, dosageForm: d.dosage_form }
        });
      });
    } catch (err) {
      // Table may not exist
    }

    // 3. Fetch billable services from shared 'time_entries'
    try {
      const timeEntries = await base44.entities.TimeEntry.filter({ company_id: companyId });
      (timeEntries || []).forEach(te => {
        normalized.push({
          id: te.id,
          sourceTable: 'time_entries',
          companyId: te.company_id,
          name: te.description || 'Billable Service Time',
          sku: null,
          type: 'service',
          price: Number(te.hourly_rate || 0) * Number(te.hours || 0),
          cost: 0,
          stockQuantity: 1,
          status: 'active',
          metadata: { hours: te.hours, hourlyRate: te.hourly_rate, caseId: te.case_id }
        });
      });
    } catch (err) {
      console.warn('[ProductAdapter] Fetch from time_entries failed:', err);
    }

    return normalized;
  },

  /**
   * Create a product record.
   * Note: Direct physical product creation via base44 ORM is not supported; use vertical catalog APIs.
   */
  async createProduct(companyId, productData) {
    if (!companyId) throw new Error('Missing companyId');
    throw new Error('[ProductAdapter] Direct physical product creation via base44 ORM is not implemented; physical products must be managed via vertical catalog tables.');
  }
};
