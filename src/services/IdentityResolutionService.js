/**
 * Slate V2: Identity Resolution Service (Phase 2 - Hardened)
 * 
 * Safely resolves and links legacy domain entities (clients, leads, staff_records, univ_re_clients)
 * to Core Party identities without duplicate creation or destructive data loss.
 * 
 * Features:
 * 1. Safe Multi-Tier Outcome Model (existing_mapping, high_confidence, ambiguous_match, new_party).
 * 2. Ambiguity & Shared Email Detection (blocks auto-merge when email matches multiple parties or name diverges).
 * 3. Concurrency Protection & Idempotent Upsert (prevents duplicate mappings under concurrent requests).
 */
import { supabase } from '../api/supabaseClient';
import { CorePartyService } from './CorePartyService';

export const MATCH_OUTCOMES = {
  EXISTING_MAPPING: 'existing_mapping',
  HIGH_CONFIDENCE_MATCH: 'high_confidence_match',
  AMBIGUOUS_REVIEW_REQUIRED: 'ambiguous_review_required',
  NEW_PARTY_CREATED: 'new_party_created',
  CONFLICTING_IDENTITY: 'conflicting_identity'
};

export const IdentityResolutionService = {
  /**
   * Resolve an existing record to a Core Party, or flag for review if ambiguous.
   * 
   * @param {string} companyId - Tenant company UUID
   * @param {string} sourceTable - e.g. 'clients', 'staff_records', 'leads', 'univ_re_clients'
   * @param {object} record - Source record data
   * @param {string} targetRole - Default role to attach ('client', 'vendor', 'employee', 'tenant', etc.)
   * @param {string} [actorId] - User initiating resolution
   */
  async resolveAndLink(companyId, sourceTable, record, targetRole, actorId = null) {
    if (!companyId || !sourceTable || !record || !record.id) {
      throw new Error('companyId, sourceTable, and record.id are required for identity resolution.');
    }

    // Tier 1: Check existing trusted mapping
    const { data: existingMap } = await supabase
      .from('core_party_mappings')
      .select('*, core_parties (*)')
      .eq('company_id', companyId)
      .eq('source_table', sourceTable)
      .eq('source_record_id', String(record.id))
      .maybeSingle();

    if (existingMap && existingMap.core_parties) {
      await CorePartyService.addRole(companyId, existingMap.party_id, targetRole);
      return {
        party: existingMap.core_parties,
        status: MATCH_OUTCOMES.EXISTING_MAPPING,
        mapping: existingMap
      };
    }

    // Tier 2: Evaluate matching evidence
    const primaryEmail = (record.email || record.user_email || '').trim().toLowerCase();
    const primaryName = (record.name || record.full_name || record.primary_name || '').trim();

    if (primaryEmail) {
      // Query all parties sharing this email within the tenant
      const { data: matchingParties } = await supabase
        .from('core_parties')
        .select('*')
        .eq('company_id', companyId)
        .ilike('email', primaryEmail);

      if (matchingParties && matchingParties.length > 0) {
        // Shared email ambiguity check: multiple distinct parties have this email
        if (matchingParties.length > 1) {
          return {
            party: null,
            status: MATCH_OUTCOMES.AMBIGUOUS_REVIEW_REQUIRED,
            reason: `Shared email detected: '${primaryEmail}' is associated with ${matchingParties.length} distinct parties in this organization. Manual review required.`,
            candidateParties: matchingParties
          };
        }

        const candidate = matchingParties[0];
        const candName = (candidate.primary_name || '').trim().toLowerCase();
        const incomingName = primaryName.toLowerCase();

        // Substantial name divergence check (e.g. info@company.com shared by John vs Alice)
        if (primaryName && candName && !candName.includes(incomingName) && !incomingName.includes(candName)) {
          return {
            party: null,
            status: MATCH_OUTCOMES.AMBIGUOUS_REVIEW_REQUIRED,
            reason: `Name divergence detected: Record name '${primaryName}' differs significantly from matched party '${candidate.primary_name}'. Manual review required.`,
            candidateParties: [candidate]
          };
        }

        // High confidence match: single party, compatible name
        await CorePartyService.addRole(companyId, candidate.id, targetRole);

        const mapping = await this.saveMappingSafely(
          companyId,
          candidate.id,
          sourceTable,
          String(record.id),
          0.95,
          'email_match'
        );

        await this.recordActivity(
          companyId,
          candidate.id,
          actorId,
          'Identity Linked (High Confidence Match)',
          'identity_linked',
          { source_table: sourceTable, source_record_id: record.id, match_strategy: 'email_match' }
        );

        return {
          party: candidate,
          status: MATCH_OUTCOMES.HIGH_CONFIDENCE_MATCH,
          mapping
        };
      }
    }

    // Tier 3: No existing match -> create new distinct party
    const newParty = await CorePartyService.createParty(
      companyId,
      {
        party_type: record.type === 'corporate' || record.organization ? 'organization' : 'individual',
        primary_name: primaryName || 'Unnamed Party',
        email: primaryEmail || null,
        phone: record.phone || null,
        legal_name: record.organization || null,
        status: 'active'
      },
      [targetRole],
      actorId
    );

    const mapping = await this.saveMappingSafely(
      companyId,
      newParty.id,
      sourceTable,
      String(record.id),
      1.0,
      'direct_create'
    );

    await this.recordActivity(
      companyId,
      newParty.id,
      actorId,
      'Core Party Created & Linked',
      'party_created',
      { source_table: sourceTable, source_record_id: record.id, match_strategy: 'direct_create' }
    );

    return {
      party: newParty,
      status: MATCH_OUTCOMES.NEW_PARTY_CREATED,
      mapping
    };
  },

  /**
   * Concurrency-safe mapping persistence using idempotent ON CONFLICT semantics
   */
  async saveMappingSafely(companyId, partyId, sourceTable, sourceRecordId, confidenceScore, matchStrategy) {
    const { data: mapping, error: mapErr } = await supabase
      .from('core_party_mappings')
      .upsert({
        company_id: companyId,
        party_id: partyId,
        source_table: sourceTable,
        source_record_id: sourceRecordId,
        confidence_score: confidenceScore,
        match_strategy: matchStrategy,
        updated_at: new Date().toISOString()
      }, { onConflict: 'company_id,source_table,source_record_id' })
      .select()
      .single();

    if (mapErr) {
      console.warn('[IdentityResolutionService] Mapping upsert warning:', mapErr.message);
      // Fallback query to retrieve existing mapping if conflict occurred
      const { data: existing } = await supabase
        .from('core_party_mappings')
        .select('*')
        .eq('company_id', companyId)
        .eq('source_table', sourceTable)
        .eq('source_record_id', sourceRecordId)
        .maybeSingle();
      return existing;
    }

    return mapping;
  },

  /**
   * Log an activity to a party's timeline with append-only guarantees
   */
  async recordActivity(companyId, partyId, actorId, summary, activityType = 'general', details = {}) {
    try {
      const { data, error } = await supabase
        .from('core_party_activities')
        .insert({
          company_id: companyId,
          party_id: partyId,
          actor_id: actorId,
          activity_type: activityType,
          summary: summary,
          details: details
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[IdentityResolutionService] recordActivity error:', err.message);
      return null;
    }
  },

  /**
   * Retrieve timeline activities for a party
   */
  async getPartyActivities(companyId, partyId) {
    if (!companyId || !partyId) return [];

    try {
      const { data, error } = await supabase
        .from('core_party_activities')
        .select('*')
        .eq('company_id', companyId)
        .eq('party_id', partyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('[IdentityResolutionService] getPartyActivities error:', err.message);
      return [];
    }
  }
};
