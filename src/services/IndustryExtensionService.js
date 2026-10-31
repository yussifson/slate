/**
 * Slate V2: Industry Extension Framework Service
 * 
 * Manages industry extension discovery, dependency validation against active company capabilities,
 * lifecycle state management (installed, active, suspended, uninstalled), terminology mappings,
 * and record-level confidentiality controls (e.g. Legal Matter Privacy, Healthcare Patient Access Audits).
 */

import { supabase } from '../api/supabaseClient.js';
import { CapabilityService } from './CapabilityService.js';

export const IndustryExtensionService = {
  /**
   * Get all registered industry extensions from platform catalog
   */
  async getCatalog() {
    if (supabase && typeof supabase.from === 'function') {
      const { data, error } = await supabase
        .from('industry_extensions')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.warn('[IndustryExtensionService] Failed to load catalog from DB, using fallback:', error.message);
        return this.getFallbackCatalog();
      }
      return data || this.getFallbackCatalog();
    }
    return this.getFallbackCatalog();
  },

  /**
   * Get installed industry extensions for a specific tenant
   */
  async getInstalledIndustries(companyId) {
    if (!companyId) return [];

    if (supabase && typeof supabase.from === 'function') {
      const { data, error } = await supabase
        .from('company_industry_installations')
        .select(`
          id,
          company_id,
          industry_id,
          status,
          config,
          installed_at,
          industry_extensions (*)
        `)
        .eq('company_id', companyId);

      if (error || !data) return [];
      return data.map(item => ({
        ...item.industry_extensions,
        installation_id: item.id,
        status: item.status,
        config: item.config,
        installed_at: item.installed_at
      }));
    }
    return [];
  },

  /**
   * Install or configure an industry pack for a tenant with dependency validation.
   */
  async installIndustry(companyId, industryId, config = {}, installedBy = null) {
    if (!companyId || !industryId) {
      throw new Error('companyId and industryId are required for industry installation.');
    }

    // 1. Fetch extension manifest
    const catalog = await this.getCatalog();
    const industry = catalog.find(i => i.id === industryId);
    if (!industry) {
      throw new Error(`Industry extension '${industryId}' not found in catalog.`);
    }

    // 2. Validate required platform capabilities
    const requiredCaps = Array.isArray(industry.required_capabilities) ? industry.required_capabilities : [];
    if (requiredCaps.length > 0 && CapabilityService && typeof CapabilityService.getCompanyCapabilities === 'function') {
      const activeCaps = await CapabilityService.getCompanyCapabilities(companyId);
      const activeCapIds = new Set(activeCaps.map(c => c.id));

      for (const reqCap of requiredCaps) {
        if (!activeCapIds.has(reqCap)) {
          throw new Error(
            `Cannot install '${industry.name}': Required platform capability '${reqCap}' is not activated for this organization.`
          );
        }
      }
    }

    // 3. Upsert installation record
    const payload = {
      company_id: companyId,
      industry_id: industryId,
      status: 'active',
      config,
      installed_by: installedBy,
      updated_at: new Date().toISOString()
    };

    if (supabase && typeof supabase.from === 'function') {
      const { data, error } = await supabase
        .from('company_industry_installations')
        .upsert(payload, { onConflict: 'company_id,industry_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    return { id: `mock-inst-${Date.now()}`, ...payload };
  },

  /**
   * Safe suspension or uninstallation of an industry pack.
   * Invariant: Never deletes customer business records or financial transactions!
   */
  async updateLifecycleStatus(companyId, industryId, newStatus) {
    if (!['installed', 'configured', 'active', 'suspended', 'uninstalled'].includes(newStatus)) {
      throw new Error(`Invalid industry lifecycle status: ${newStatus}`);
    }

    if (supabase && typeof supabase.from === 'function') {
      const { data, error } = await supabase
        .from('company_industry_installations')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('company_id', companyId)
        .eq('industry_id', industryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    return { company_id: companyId, industry_id: industryId, status: newStatus };
  },

  /**
   * Legal Matter Confidentiality: Check if user has explicit matter-level access grant.
   */
  async checkMatterAccess(companyId, matterId, userId, requiredLevel = 'viewer') {
    if (!companyId || !matterId || !userId) return false;

    if (supabase && typeof supabase.from === 'function') {
      const { data, error } = await supabase
        .from('legal_matter_access_grants')
        .select('access_level')
        .eq('company_id', companyId)
        .eq('matter_id', matterId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) return false;
      return true;
    }
    return true;
  },

  /**
   * Clinical Access Auditing: Records immutable audit row whenever patient data is accessed.
   */
  async recordClinicalAudit(companyId, patientId, actorId, action, reason = '') {
    if (!companyId || !patientId || !actorId) return;

    if (supabase && typeof supabase.from === 'function') {
      try {
        await supabase.from('clinical_access_audit_logs').insert({
          company_id: companyId,
          patient_id: patientId,
          actor_id: actorId,
          access_action: action,
          reason,
          created_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('[IndustryExtensionService] Failed to record clinical audit log:', err);
      }
    }
  },

  getFallbackCatalog() {
    return [
      {
        id: 'legal_practice',
        name: 'Legal Practice Management',
        description: 'Matters, hearings, legal deadlines, and confidential trust accounting.',
        version: '2.0.0',
        icon: 'Scale',
        required_capabilities: ['core_foundation', 'documents'],
        optional_capabilities: ['finance', 'crm'],
        manifest: {
          entities: ['matters', 'hearings', 'retainers'],
          terminology: { account: 'Client', deal: 'Matter' }
        }
      },
      {
        id: 'real_estate',
        name: 'Real Estate & Properties',
        description: 'Properties, tenancy leases, rent schedules, and maintenance orders.',
        version: '2.0.0',
        icon: 'Building2',
        required_capabilities: ['core_foundation', 'documents'],
        optional_capabilities: ['finance', 'crm'],
        manifest: {
          entities: ['properties', 'leases', 'rent_payments'],
          terminology: { account: 'Tenant / Landlord', deal: 'Lease Agreement' }
        }
      },
      {
        id: 'healthcare',
        name: 'Healthcare Operations',
        description: 'Patient records, appointments, clinical encounters, and billing.',
        version: '2.0.0',
        icon: 'HeartPulse',
        required_capabilities: ['core_foundation'],
        optional_capabilities: ['finance', 'documents'],
        manifest: {
          entities: ['patients', 'appointments', 'encounters'],
          terminology: { account: 'Patient', deal: 'Episode of Care' }
        }
      },
      {
        id: 'education',
        name: 'Academic & Student Management',
        description: 'Students, enrollments, courses, attendance, and tuition management.',
        version: '2.0.0',
        icon: 'GraduationCap',
        required_capabilities: ['core_foundation'],
        optional_capabilities: ['finance', 'documents'],
        manifest: {
          entities: ['students', 'courses', 'enrollments'],
          terminology: { account: 'Student / Guardian', deal: 'Enrollment' }
        }
      },
      {
        id: 'logistics',
        name: 'Logistics & Fleet Operations',
        description: 'Fleet vehicles, drivers, shipments, dispatch, and proof of delivery.',
        version: '2.0.0',
        icon: 'Truck',
        required_capabilities: ['core_foundation'],
        optional_capabilities: ['finance', 'projects'],
        manifest: {
          entities: ['vehicles', 'drivers', 'shipments'],
          terminology: { account: 'Shipper / Consignee', deal: 'Freight Order' }
        }
      }
    ];
  }
};
