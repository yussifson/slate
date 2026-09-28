import { powerSync } from '@/api/PowerSyncConnector';
import { base44 } from '@/api/base44Client';

/**
 * SupplierAdapter
 * Normalized read/write adapter for the 'Supplier' primitive.
 * Primary sources: univ_retail_suppliers, univ_pharmacy_suppliers, expenses.
 * Note: univ_re_contractors and industry_records for 'vendor'/'supplier' are intentionally deferred.
 */
export const SupplierAdapter = {
  /**
   * Fetch normalized supplier and vendor records for a given company.
   *
   * @param {string} companyId - Target company_id
   * @param {object} options - Optional query parameters
   * @returns {Promise<Array<NormalizedSupplier>>}
   */
  async getSuppliers(companyId, options = {}) {
    if (!companyId) return [];
    const normalized = [];

    // 1. Fetch from 'univ_retail_suppliers'
    try {
      const res = await powerSync.execute('SELECT * FROM univ_retail_suppliers WHERE company_id = ?', [companyId]);
      const retailSuppliers = res?.rows?._array || [];
      retailSuppliers.forEach(s => {
        normalized.push({
          id: s.id,
          sourceTable: 'univ_retail_suppliers',
          companyId: s.company_id,
          name: s.name || s.company_name || 'Retail Supplier',
          contactPerson: s.contact_person || s.name || null,
          email: s.email || null,
          phone: s.phone || null,
          status: s.status || 'active',
          metadata: { category: s.category, address: s.address }
        });
      });
    } catch (err) {
      // Table may not exist or query fallback
    }

    // 2. Fetch from 'univ_pharmacy_suppliers'
    try {
      const res = await powerSync.execute('SELECT * FROM univ_pharmacy_suppliers WHERE company_id = ?', [companyId]);
      const pharmacySuppliers = res?.rows?._array || [];
      pharmacySuppliers.forEach(s => {
        normalized.push({
          id: s.id,
          sourceTable: 'univ_pharmacy_suppliers',
          companyId: s.company_id,
          name: s.name || s.supplier_name || 'Pharmacy Vendor',
          contactPerson: s.contact_person || null,
          email: s.email || null,
          phone: s.phone || null,
          status: s.status || 'active',
          metadata: { licenseNumber: s.license_number }
        });
      });
    } catch (err) {
      // Table may not exist
    }

    // 3. Fetch vendor associations from shared 'expenses'
    try {
      const expenses = await base44.entities.Expense.filter({ company_id: companyId });
      const vendorSet = new Set();
      (expenses || []).forEach(exp => {
        const vendorName = exp.vendor || exp.payee;
        if (vendorName && !vendorSet.has(vendorName)) {
          vendorSet.add(vendorName);
          normalized.push({
            id: `vendor-${exp.id}`,
            sourceTable: 'expenses',
            companyId: exp.company_id,
            name: vendorName,
            contactPerson: null,
            email: null,
            phone: null,
            status: 'active',
            metadata: { category: exp.category, expenseId: exp.id }
          });
        }
      });
    } catch (err) {
      console.warn('[SupplierAdapter] Fetch from expenses failed:', err);
    }

    return normalized;
  },

  /**
   * Create a supplier record.
   * Note: Direct supplier creation via base44 ORM is not supported; use vertical supplier tables.
   */
  async createSupplier(companyId, supplierData) {
    if (!companyId) throw new Error('Missing companyId');
    throw new Error('[SupplierAdapter] Direct supplier entity creation via base44 ORM is not implemented; suppliers must be managed via vertical supplier tables.');
  }
};
