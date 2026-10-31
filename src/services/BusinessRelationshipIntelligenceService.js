/**
 * Slate V2: Business Relationship Intelligence Service
 * 
 * Explores bidirectional graph relationships, activities, and linked transactions
 * anchored on Core Parties, ensuring cross-company tenant isolation.
 */

import { supabase } from '../api/supabaseClient.js';

export const BusinessRelationshipIntelligenceService = {
  /**
   * Get complete 360-degree relationship graph for a core party
   */
  async getPartyRelationshipGraph(companyId, partyId) {
    if (!companyId || !partyId) {
      throw new Error('companyId and partyId are required to retrieve relationship graph.');
    }

    const graph = {
      party: null,
      outgoingRelationships: [],
      incomingRelationships: [],
      relatedEntities: {
        invoices: [],
        tasks: [],
        timeline: []
      }
    };

    if (supabase && typeof supabase.from === 'function') {
      try {
        // 1. Fetch Party details
        const { data: party, error: pErr } = await supabase
          .from('core_parties')
          .select('*')
          .eq('id', partyId)
          .eq('company_id', companyId)
          .single();

        if (pErr || !party) {
          throw new Error('Party record not found or cross-tenant unauthorized.');
        }
        graph.party = party;

        // 2. Fetch Outgoing relationships (from_party_id = partyId)
        const { data: outgoing } = await supabase
          .from('core_relationships')
          .select(`
            id,
            relationship_type,
            notes,
            to_party_id,
            to_party:core_parties!to_party_id (id, primary_name, party_type)
          `)
          .eq('company_id', companyId)
          .eq('from_party_id', partyId);

        if (outgoing) graph.outgoingRelationships = outgoing;

        // 3. Fetch Incoming relationships (to_party_id = partyId)
        const { data: incoming } = await supabase
          .from('core_relationships')
          .select(`
            id,
            relationship_type,
            notes,
            from_party_id,
            from_party:core_parties!from_party_id (id, primary_name, party_type)
          `)
          .eq('company_id', companyId)
          .eq('to_party_id', partyId);

        if (incoming) graph.incomingRelationships = incoming;

        // 4. Fetch linked Activity Timeline
        const { data: activities } = await supabase
          .from('business_activity_timeline')
          .select('*')
          .eq('company_id', companyId)
          .eq('entity_id', partyId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (activities) graph.relatedEntities.timeline = activities;
      } catch (err) {
        console.warn('[RelationshipIntelligence] Graph retrieval error:', err);
      }
    }

    return graph;
  }
};
