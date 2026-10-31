/**
 * Slate V2: Core Party Service
 * 
 * Provides unified management for individuals and organizations,
 * their contextual roles, and cross-party relationships with strict tenant isolation.
 */
import { supabase } from '../api/supabaseClient';
import { base44 } from '../api/base44Client';

export const CorePartyService = {
  /**
   * List parties for a tenant with optional filtering by role or search term
   */
  async listParties(companyId, options = {}) {
    if (!companyId) return [];

    const { roleType, search, status = 'active', limit = 100 } = options;

    try {
      let query = supabase
        .from('core_parties')
        .select(`
          id,
          company_id,
          party_type,
          primary_name,
          legal_name,
          tax_identifier,
          email,
          phone,
          website,
          status,
          custom_attributes,
          created_at,
          core_party_roles (id, role_type, role_status, metadata)
        `)
        .eq('company_id', companyId);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.or(`primary_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      query = query.order('primary_name', { ascending: true }).limit(limit);

      const { data, error } = await query;
      if (error) {
        console.warn('[CorePartyService] listParties error, using base44 fallback:', error.message);
        return await this.listPartiesFallback(companyId, options);
      }

      // Filter by roleType if requested
      if (roleType && roleType !== 'all') {
        return (data || []).filter(party => 
          party.core_party_roles?.some(r => r.role_type === roleType && r.role_status === 'active')
        );
      }

      return data || [];
    } catch (err) {
      console.warn('[CorePartyService] Exception in listParties:', err);
      return await this.listPartiesFallback(companyId, options);
    }
  },

  /**
   * Get single party with roles and relationships
   */
  async getParty(partyId, companyId) {
    if (!partyId || !companyId) return null;

    try {
      const { data: party, error } = await supabase
        .from('core_parties')
        .select(`
          *,
          core_party_roles (*),
          from_relationships:core_relationships!from_party_id (*),
          to_relationships:core_relationships!to_party_id (*)
        `)
        .eq('id', partyId)
        .eq('company_id', companyId)
        .single();

      if (error) throw error;
      return party;
    } catch (err) {
      console.warn(`[CorePartyService] Error getting party ${partyId}:`, err);
      return null;
    }
  },

  /**
   * Create a new party with initial roles
   */
  async createParty(companyId, partyData, roles = [], createdBy = null) {
    if (!companyId || !partyData.primary_name) {
      throw new Error('companyId and primary_name are required.');
    }

    const payload = {
      company_id: companyId,
      party_type: partyData.party_type || 'individual',
      primary_name: partyData.primary_name,
      legal_name: partyData.legal_name || null,
      tax_identifier: partyData.tax_identifier || null,
      email: partyData.email || null,
      phone: partyData.phone || null,
      website: partyData.website || null,
      status: partyData.status || 'active',
      custom_attributes: partyData.custom_attributes || {},
      created_by: createdBy
    };

    const { data: party, error: partyError } = await supabase
      .from('core_parties')
      .insert(payload)
      .select()
      .single();

    if (partyError) {
      throw new Error(`Failed to create core party: ${partyError.message}`);
    }

    // Attach initial roles
    if (roles && roles.length > 0) {
      const rolePayloads = roles.map(r => ({
        company_id: companyId,
        party_id: party.id,
        role_type: typeof r === 'string' ? r : r.role_type,
        role_status: r.role_status || 'active',
        metadata: r.metadata || {}
      }));

      const { error: roleError } = await supabase
        .from('core_party_roles')
        .insert(rolePayloads);

      if (roleError) {
        console.warn('[CorePartyService] Role assignment warning:', roleError.message);
      }
    }

    return party;
  },

  /**
   * Add a role to an existing party with tenant ownership check
   */
  async addRole(companyId, partyId, roleType, metadata = {}) {
    if (!companyId || !partyId || !roleType) {
      throw new Error('companyId, partyId, and roleType are required.');
    }

    // Tenant check: verify target party belongs to companyId
    const { data: ownerParty, error: checkError } = await supabase
      .from('core_parties')
      .select('id')
      .eq('id', partyId)
      .eq('company_id', companyId)
      .single();

    if (checkError || !ownerParty) {
      throw new Error(`Cross-tenant security violation: Party '${partyId}' does not belong to company '${companyId}'.`);
    }

    const { data, error } = await supabase
      .from('core_party_roles')
      .upsert({
        company_id: companyId,
        party_id: partyId,
        role_type: roleType,
        role_status: 'active',
        metadata,
        updated_at: new Date().toISOString()
      }, { onConflict: 'company_id,party_id,role_type' })
      .select()
      .single();

    if (error) throw new Error(`Failed to add role: ${error.message}`);
    return data;
  },

  /**
   * Add relationship between two parties with strict cross-tenant verification
   */
  async addRelationship(companyId, fromPartyId, toPartyId, relationshipType, notes = '', metadata = {}) {
    if (!companyId || !fromPartyId || !toPartyId || !relationshipType) {
      throw new Error('companyId, fromPartyId, toPartyId, and relationshipType are required.');
    }

    if (fromPartyId === toPartyId) {
      throw new Error('Cannot create self-referential relationship on the same party.');
    }

    // Tenant check: verify BOTH fromPartyId and toPartyId belong to companyId
    const { data: verifiedParties, error: checkError } = await supabase
      .from('core_parties')
      .select('id')
      .eq('company_id', companyId)
      .in('id', [fromPartyId, toPartyId]);

    if (checkError || !verifiedParties || verifiedParties.length < 2) {
      throw new Error(`Cross-tenant security violation: Both parties must belong to company '${companyId}'.`);
    }

    const { data, error } = await supabase
      .from('core_relationships')
      .insert({
        company_id: companyId,
        from_party_id: fromPartyId,
        to_party_id: toPartyId,
        relationship_type: relationshipType,
        notes,
        metadata
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to add relationship: ${error.message}`);
    return data;
  },

  /**
   * Fallback using Base44 client if direct Supabase fails
   */
  async listPartiesFallback(companyId, options) {
    try {
      const records = await base44.CoreParty?.list ? await base44.CoreParty.list(companyId) : [];
      return records || [];
    } catch {
      return [];
    }
  }
};
