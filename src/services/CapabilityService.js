/**
 * Slate V2: Platform Capability Service
 * 
 * Manages capability registration, tenant activation, dependency resolution,
 * and entitlement validation.
 */
import { supabase } from '../api/supabaseClient';
import { base44 } from '../api/base44Client';

export const CapabilityService = {
  /**
   * Get all platform-level capabilities
   */
  async getCatalog() {
    try {
      const { data, error } = await supabase
        .from('platform_capabilities')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) {
        console.warn('[CapabilityService] Failed to fetch catalog from Supabase, returning fallbacks:', error.message);
        return this.getFallbackCatalog();
      }
      return data || this.getFallbackCatalog();
    } catch (err) {
      console.warn('[CapabilityService] Network error fetching catalog:', err);
      return this.getFallbackCatalog();
    }
  },

  /**
   * Get activated capabilities for a specific company
   */
  async getCompanyCapabilities(companyId) {
    if (!companyId) return [];

    try {
      const { data, error } = await supabase
        .from('company_capabilities')
        .select(`
          id,
          company_id,
          capability_id,
          is_enabled,
          config,
          enabled_at,
          platform_capabilities (*)
        `)
        .eq('company_id', companyId)
        .eq('is_enabled', true);

      if (error || !data || data.length === 0) {
        // Return default core capabilities if none stored
        return this.getDefaultCompanyCapabilities(companyId);
      }

      return data.map(item => ({
        ...item.platform_capabilities,
        company_capability_id: item.id,
        is_enabled: item.is_enabled,
        config: item.config,
        enabled_at: item.enabled_at
      }));
    } catch (err) {
      console.warn('[CapabilityService] Error fetching company capabilities:', err);
      return this.getDefaultCompanyCapabilities(companyId);
    }
  },

  /**
   * Activate or update a capability for a tenant
   */
  async activateCapability(companyId, capabilityId, config = {}, activatedBy = null) {
    if (!companyId || !capabilityId) {
      throw new Error('companyId and capabilityId are required to activate a capability.');
    }

    // Verify dependencies
    const catalog = await this.getCatalog();
    const target = catalog.find(c => c.id === capabilityId);
    if (target && Array.isArray(target.dependencies) && target.dependencies.length > 0) {
      const active = await this.getCompanyCapabilities(companyId);
      const activeIds = new Set(active.map(a => a.id));
      for (const dep of target.dependencies) {
        if (!activeIds.has(dep)) {
          throw new Error(`Cannot activate '${target.name}': Missing required dependency '${dep}'.`);
        }
      }
    }

    const payload = {
      company_id: companyId,
      capability_id: capabilityId,
      is_enabled: true,
      config,
      activated_by: activatedBy,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('company_capabilities')
      .upsert(payload, { onConflict: 'company_id,capability_id' })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to activate capability '${capabilityId}': ${error.message}`);
    }

    return data;
  },

  /**
   * Deactivate a capability for a tenant (Core capabilities cannot be deactivated)
   */
  async deactivateCapability(companyId, capabilityId) {
    if (capabilityId === 'core_foundation') {
      throw new Error('Core Business Foundation cannot be deactivated.');
    }

    const { error } = await supabase
      .from('company_capabilities')
      .update({ is_enabled: false, updated_at: new Date().toISOString() })
      .eq('company_id', companyId)
      .eq('capability_id', capabilityId);

    if (error) {
      throw new Error(`Failed to deactivate capability '${capabilityId}': ${error.message}`);
    }
    return { success: true };
  },

  /**
   * Static fallback catalog for offline or unmigrated instances
   */
  getFallbackCatalog() {
    return [
      { id: 'core_foundation', category: 'core', name: 'Core Business Foundation', description: 'Identity, Party Graph, and Organization Management', icon: 'ShieldCheck', default_enabled: true, version: '2.0.0' },
      { id: 'finance', category: 'standard', name: 'Finance & Accounting', description: 'General Ledger, Invoicing, Tax, and Cash Flow', icon: 'DollarSign', default_enabled: true, version: '2.0.0' },
      { id: 'crm', category: 'standard', name: 'Customer Relationship Management', description: 'Pipeline, Leads, Contact Management, and Interactions', icon: 'Users', default_enabled: true, version: '2.0.0' },
      { id: 'projects', category: 'standard', name: 'Projects & Operations', description: 'Task coordination, workload allocation, and deadlines', icon: 'CheckSquare', default_enabled: true, version: '2.0.0' },
      { id: 'documents', category: 'standard', name: 'Document Vault & E-Sign', description: 'Contracts, templates, versioning, and digital signing', icon: 'FileText', default_enabled: true, version: '2.0.0' },
      { id: 'legal_practice', category: 'industry', name: 'Legal Practice Management', description: 'Matters, court calendar, conflict checks, and billable hours', icon: 'Scale', default_enabled: false, version: '2.0.0' },
      { id: 'real_estate', category: 'industry', name: 'Real Estate & Properties', description: 'Properties, tenant leases, trust accounting, and contractors', icon: 'Building2', default_enabled: false, version: '2.0.0' },
      { id: 'healthcare', category: 'industry', name: 'Healthcare & Clinical Administration', description: 'Patient records, clinical appointments, and encounters', icon: 'HeartPulse', default_enabled: false, version: '2.0.0' },
      { id: 'education', category: 'industry', name: 'Academic & Student Management', description: 'Student records, attendance, terms, and grade reporting', icon: 'GraduationCap', default_enabled: false, version: '2.0.0' }
    ];
  },

  getDefaultCompanyCapabilities(companyId) {
    return this.getFallbackCatalog()
      .filter(c => c.default_enabled)
      .map(c => ({
        ...c,
        company_capability_id: `default-${c.id}`,
        is_enabled: true,
        config: {},
        enabled_at: new Date().toISOString()
      }));
  }
};
