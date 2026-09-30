import { powerSync } from '@/api/PowerSyncConnector';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';

/**
 * LocationAdapter
 * Normalized read adapter for the 'Location/Branch/Property' primitive.
 * Primary sources: univ_retail_branches, univ_retail_storefronts, univ_re_properties.
 * Single-location tenant fallback: companies table.
 * Write target: Direct generic location creation via base44 ORM is deferred; vertical location tables are used.
 */
export const LocationAdapter = {
  /**
   * Fetch normalized location, branch, and property records for a given company.
   *
   * @param {string} companyId - Target company_id
   * @param {object} options - Optional query parameters
   * @returns {Promise<Array<NormalizedLocation>>}
   */
  async getLocations(companyId, options = {}) {
    if (!companyId) return [];
    const normalized = [];

    // 1. Fetch physical store branches from 'univ_retail_branches'
    try {
      const res = await powerSync.execute('SELECT * FROM univ_retail_branches WHERE company_id = ?', [companyId]);
      const branches = res?.rows?._array || [];
      branches.forEach(b => {
        normalized.push({
          id: b.id,
          sourceTable: 'univ_retail_branches',
          companyId: b.company_id,
          name: b.name || 'Retail Branch',
          type: 'branch',
          address: b.location || b.address || null,
          city: null,
          country: null,
          status: b.status || 'active',
          managerId: b.manager_id || null,
          phone: b.contact_phone || null,
          email: b.contact_email || null,
          metadata: {}
        });
      });
    } catch (err) {
      // Table may not exist or query fallback
    }

    // 2. Fetch digital storefronts from 'univ_retail_storefronts'
    try {
      const res = await powerSync.execute('SELECT * FROM univ_retail_storefronts WHERE company_id = ?', [companyId]);
      const storefronts = res?.rows?._array || [];
      storefronts.forEach(sf => {
        normalized.push({
          id: sf.id,
          sourceTable: 'univ_retail_storefronts',
          companyId: sf.company_id,
          name: sf.domain_name || 'Online Storefront',
          type: 'storefront',
          address: sf.domain_name || null,
          city: null,
          country: null,
          status: sf.is_active === 0 ? 'inactive' : 'active',
          managerId: null,
          phone: null,
          email: null,
          metadata: { themeConfig: sf.theme_config }
        });
      });
    } catch (err) {
      // Table may not exist
    }

    // 3. Fetch real estate properties from 'univ_re_properties'
    try {
      const res = await powerSync.execute('SELECT * FROM univ_re_properties WHERE company_id = ?', [companyId]);
      const properties = res?.rows?._array || [];
      properties.forEach(p => {
        normalized.push({
          id: p.id,
          sourceTable: 'univ_re_properties',
          companyId: p.company_id,
          name: p.address || 'Real Estate Property',
          type: p.property_type || 'property',
          address: p.address || null,
          city: p.city || null,
          country: p.country || null,
          status: p.status || 'active',
          managerId: p.agent_id || null,
          phone: null,
          email: null,
          metadata: {
            state: p.state,
            zipCode: p.zip_code,
            price: Number(p.price || 0),
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            squareFeet: p.square_feet,
            agentName: p.agent_name
          }
        });
      });
    } catch (err) {
      // Table may not exist
    }

    // 4. Single-location tenant fallback: use the 'companies' registration record
    if (normalized.length === 0) {
      try {
        let companyRecord = null;
        if (base44?.entities?.Company?.findUnique) {
          try {
            companyRecord = await base44.entities.Company.findUnique({ filter: { id: companyId } });
          } catch (e) {}
        }

        if (!companyRecord && supabase && typeof supabase.from === 'function') {
          const { data } = await supabase.from('companies').select('*').eq('id', companyId).maybeSingle();
          if (data) companyRecord = data;
        }

        if (companyRecord) {
          normalized.push({
            id: `hq-${companyRecord.id}`,
            sourceTable: 'companies',
            companyId: companyRecord.id,
            name: `${companyRecord.name || 'Company'} Headquarters`,
            type: 'headquarters',
            address: companyRecord.address || null,
            city: companyRecord.city || null,
            country: companyRecord.country || null,
            status: 'active',
            managerId: null,
            phone: companyRecord.phone || null,
            email: companyRecord.email || null,
            metadata: {
              isPrimaryHeadquarters: true,
              subdomain: companyRecord.subdomain,
              currency: companyRecord.currency
            }
          });
        }
      } catch (err) {
        console.warn('[LocationAdapter] Fallback fetch from companies table failed:', err);
      }
    }

    return normalized;
  },

  /**
   * Create a location record.
   * Note: Direct generic location creation via base44 ORM is not supported; use vertical branch/property tables.
   */
  async createLocation(companyId, locationData) {
    if (!companyId) throw new Error('Missing companyId');
    throw new Error('[LocationAdapter] Direct generic location creation via base44 ORM is not implemented; locations must be managed via vertical branch/property tables.');
  }
};

export default LocationAdapter;
