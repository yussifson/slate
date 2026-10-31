/**
 * Slate V2: CRM, Sales & Commercial Operations Service (Phase 4)
 * 
 * Manages:
 * 1. Sales Pipelines & Configurable Stages (Kanban workflows, probabilities)
 * 2. Opportunities / Deals (expected revenue, weighted pipeline, won/lost handling)
 * 3. Commercial Quotations & Proposals (multi-line items, taxes, discounts, approvals)
 * 4. Sales Orders & Finance A/R Traceability (convert quote -> order -> invoice)
 * 5. Lead Lifecycle & Safe Party Conversion (integrating Core Party Graph)
 * 6. Customer Activities Timeline (calls, meetings, tasks, notes, follow-ups)
 */
import { supabase } from '../api/supabaseClient';
import { EventService } from './EventService';
import { CorePartyService } from './CorePartyService';
import { IdentityResolutionService } from './IdentityResolutionService';

export const DEFAULT_PIPELINE_STAGES = [
  { name: 'Prospect / Discovery', stage_order: 1, probability_percentage: 10, is_won: false, is_lost: false },
  { name: 'Qualification', stage_order: 2, probability_percentage: 25, is_won: false, is_lost: false },
  { name: 'Proposal / Quotation', stage_order: 3, probability_percentage: 50, is_won: false, is_lost: false },
  { name: 'Negotiation', stage_order: 4, probability_percentage: 75, is_won: false, is_lost: false },
  { name: 'Closed Won', stage_order: 5, probability_percentage: 100, is_won: true, is_lost: false },
  { name: 'Closed Lost', stage_order: 6, probability_percentage: 0, is_won: false, is_lost: true }
];

export const CrmSalesService = {
  // ==========================================================================
  // 1. PIPELINE & STAGE MANAGEMENT
  // ==========================================================================

  /**
   * Ensure standard default pipeline exists for a company
   */
  async ensureDefaultPipeline(companyId) {
    if (!companyId) return null;

    const { data: existing } = await supabase
      .from('crm_pipelines')
      .select('*, crm_pipeline_stages(*)')
      .eq('company_id', companyId)
      .eq('is_default', true)
      .maybeSingle();

    if (existing && existing.crm_pipeline_stages && existing.crm_pipeline_stages.length > 0) {
      return existing;
    }

    // Create default pipeline
    const { data: pipeline, error: pipeErr } = await supabase
      .from('crm_pipelines')
      .insert({
        company_id: companyId,
        name: 'Standard Sales Pipeline',
        description: 'Standard enterprise B2B sales progression',
        is_default: true,
        is_active: true
      })
      .select()
      .single();

    if (pipeErr) {
      console.warn('[CrmSalesService] Failed to create default pipeline:', pipeErr);
      return null;
    }

    // Insert default stages
    const stagePayloads = DEFAULT_PIPELINE_STAGES.map(s => ({
      company_id: companyId,
      pipeline_id: pipeline.id,
      name: s.name,
      stage_order: s.stage_order,
      probability_percentage: s.probability_percentage,
      is_won: s.is_won,
      is_lost: s.is_lost
    }));

    const { data: stages } = await supabase
      .from('crm_pipeline_stages')
      .insert(stagePayloads)
      .select();

    return { ...pipeline, crm_pipeline_stages: stages || [] };
  },

  /**
   * Get all active pipelines with ordered stages for a company
   */
  async getPipelines(companyId) {
    if (!companyId) return [];

    const { data, error } = await supabase
      .from('crm_pipelines')
      .select(`
        *,
        crm_pipeline_stages (*)
      `)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[CrmSalesService] Error fetching pipelines:', error);
      return [];
    }

    if (!data || data.length === 0) {
      const defaultPipe = await this.ensureDefaultPipeline(companyId);
      return defaultPipe ? [defaultPipe] : [];
    }

    // Sort stages by stage_order
    return data.map(pipe => ({
      ...pipe,
      crm_pipeline_stages: (pipe.crm_pipeline_stages || []).sort((a, b) => a.stage_order - b.stage_order)
    }));
  },

  // ==========================================================================
  // 2. OPPORTUNITY / DEAL MANAGEMENT
  // ==========================================================================

  /**
   * List opportunities with party information and current stage
   */
  async listOpportunities(companyId, filters = {}) {
    if (!companyId) return [];

    let query = supabase
      .from('crm_opportunities')
      .select(`
        *,
        core_parties (id, primary_name, email, phone),
        crm_pipeline_stages (id, name, stage_order, probability_percentage, is_won, is_lost),
        crm_pipelines (id, name)
      `)
      .eq('company_id', companyId);

    if (filters.pipelineId) {
      query = query.eq('pipeline_id', filters.pipelineId);
    }
    if (filters.stageId) {
      query = query.eq('stage_id', filters.stageId);
    }
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.partyId) {
      query = query.eq('party_id', filters.partyId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.warn('[CrmSalesService] Error listing opportunities:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Create an opportunity
   */
  async createOpportunity(companyId, oppData, actorId = null) {
    if (!companyId || !oppData.title || !oppData.pipeline_id || !oppData.stage_id) {
      throw new Error('company_id, title, pipeline_id, and stage_id are required to create an opportunity.');
    }

    const payload = {
      company_id: companyId,
      title: oppData.title.trim(),
      party_id: oppData.party_id || null,
      pipeline_id: oppData.pipeline_id,
      stage_id: oppData.stage_id,
      expected_revenue: Number(oppData.expected_revenue) || 0,
      currency: oppData.currency || 'USD',
      probability_override: oppData.probability_override !== undefined ? Number(oppData.probability_override) : null,
      expected_close_date: oppData.expected_close_date || null,
      assigned_to: oppData.assigned_to || actorId || null,
      source: oppData.source || 'direct',
      competitors: oppData.competitors || null,
      status: 'open',
      custom_attributes: oppData.custom_attributes || {}
    };

    const { data, error } = await supabase
      .from('crm_opportunities')
      .insert(payload)
      .select(`
        *,
        core_parties (id, primary_name),
        crm_pipeline_stages (id, name, probability_percentage)
      `)
      .single();

    if (error) throw error;

    // Emit event
    await EventService.publishEvent(
      companyId,
      'CRM_OPPORTUNITY_CREATED',
      'crm_opportunity',
      data.id,
      { title: data.title, expected_revenue: data.expected_revenue, party_id: data.party_id }
    );

    return data;
  },

  /**
   * Move an opportunity to a new stage with probability & status update
   */
  async updateOpportunityStage(companyId, oppId, newStageId, actorId = null, reason = null) {
    if (!companyId || !oppId || !newStageId) {
      throw new Error('company_id, oppId, and newStageId are required.');
    }

    // Fetch the stage details to check won/lost flags
    const { data: stage, error: stageErr } = await supabase
      .from('crm_pipeline_stages')
      .select('*')
      .eq('id', newStageId)
      .eq('company_id', companyId)
      .single();

    if (stageErr || !stage) {
      throw new Error(`Pipeline stage not found: ${newStageId}`);
    }

    let status = 'open';
    const updatePayload = {
      stage_id: newStageId,
      updated_at: new Date().toISOString()
    };

    if (stage.is_won) {
      status = 'won';
      updatePayload.status = 'won';
      updatePayload.actual_close_date = new Date().toISOString().split('T')[0];
      if (reason) updatePayload.win_reason = reason;
    } else if (stage.is_lost) {
      status = 'lost';
      updatePayload.status = 'lost';
      updatePayload.actual_close_date = new Date().toISOString().split('T')[0];
      if (reason) updatePayload.loss_reason = reason;
    } else {
      updatePayload.status = 'open';
    }

    const { data, error } = await supabase
      .from('crm_opportunities')
      .update(updatePayload)
      .eq('id', oppId)
      .eq('company_id', companyId)
      .select(`
        *,
        core_parties (id, primary_name),
        crm_pipeline_stages (id, name, probability_percentage)
      `)
      .single();

    if (error) throw error;

    // Emit stage transition event
    await EventService.publishEvent(
      companyId,
      status === 'won' ? 'CRM_OPPORTUNITY_WON' : status === 'lost' ? 'CRM_OPPORTUNITY_LOST' : 'CRM_OPPORTUNITY_STAGE_CHANGED',
      'crm_opportunity',
      oppId,
      { new_stage_id: newStageId, stage_name: stage.name, status, reason }
    );

    return data;
  },

  // ==========================================================================
  // 3. LEAD MANAGEMENT & SAFE PARTY CONVERSION
  // ==========================================================================

  /**
   * Convert a legacy lead into a full Core Party client without duplicates
   */
  async convertLeadToClient(companyId, leadId, actorId = null) {
    if (!companyId || !leadId) {
      throw new Error('companyId and leadId are required to convert lead.');
    }

    // 1. Fetch lead
    const { data: lead, error: leadErr } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('company_id', companyId)
      .single();

    if (leadErr || !lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    // 2. Use IdentityResolutionService to link or create Core Party safely
    const resolution = await IdentityResolutionService.resolveAndLink(
      companyId,
      'leads',
      {
        id: lead.id,
        primary_name: lead.full_name || lead.organization || 'Prospective Lead',
        email: lead.email,
        phone: lead.phone,
        type: lead.organization ? 'organization' : 'individual'
      },
      'client',
      actorId
    );

    // 3. Mark lead as converted
    await supabase
      .from('leads')
      .update({ status: 'converted', updated_at: new Date().toISOString() })
      .eq('id', leadId)
      .eq('company_id', companyId);

    // 4. Emit event
    await EventService.publishEvent(
      companyId,
      'CRM_LEAD_CONVERTED',
      'lead',
      leadId,
      { party_id: resolution.party?.id, resolution_status: resolution.status }
    );

    return {
      lead_id: leadId,
      party: resolution.party,
      resolution_status: resolution.status
    };
  },

  // ==========================================================================
  // 4. COMMERCIAL QUOTATIONS
  // ==========================================================================

  /**
   * Create quotation with calculated line totals, tax, and discount
   */
  async createQuotation(companyId, quoteData, lines = [], actorId = null) {
    if (!companyId || !quoteData.party_id || !quoteData.title) {
      throw new Error('company_id, party_id, and title are required for a quotation.');
    }
    if (!Array.isArray(lines) || lines.length === 0) {
      throw new Error('Quotation requires at least one line item.');
    }

    // Calculate totals deterministically
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const computedLines = lines.map((line, idx) => {
      const qty = Number(line.quantity) || 1;
      const price = Number(line.unit_price) || 0;
      const discount = Number(line.discount_amount) || 0;
      const taxRate = Number(line.tax_rate) || 0;

      const rawTotal = (qty * price) - discount;
      const lineTax = (rawTotal * (taxRate / 100));
      const lineTotal = Math.max(0, rawTotal + lineTax);

      subtotal += (qty * price);
      totalDiscount += discount;
      totalTax += lineTax;

      return {
        item_description: line.item_description || `Line ${idx + 1}`,
        quantity: qty,
        unit_price: price,
        discount_amount: discount,
        tax_rate: taxRate,
        line_total: Math.round(lineTotal * 100) / 100,
        sort_order: idx + 1
      };
    });

    const quoteTotal = Math.max(0, subtotal - totalDiscount + totalTax);
    const quoteNumber = quoteData.quote_number || `QT-${Date.now().toString().slice(-6)}`;

    // Insert quotation header
    const { data: quote, error: quoteErr } = await supabase
      .from('crm_quotations')
      .insert({
        company_id: companyId,
        quote_number: quoteNumber,
        title: quoteData.title.trim(),
        party_id: quoteData.party_id,
        opportunity_id: quoteData.opportunity_id || null,
        status: 'draft',
        currency: quoteData.currency || 'USD',
        subtotal_amount: Math.round(subtotal * 100) / 100,
        discount_amount: Math.round(totalDiscount * 100) / 100,
        tax_amount: Math.round(totalTax * 100) / 100,
        total_amount: Math.round(quoteTotal * 100) / 100,
        issue_date: quoteData.issue_date || new Date().toISOString().split('T')[0],
        valid_until: quoteData.valid_until || null,
        terms_conditions: quoteData.terms_conditions || null,
        notes: quoteData.notes || null,
        created_by: actorId
      })
      .select()
      .single();

    if (quoteErr) throw quoteErr;

    // Insert quotation lines
    const linePayloads = computedLines.map(l => ({
      ...l,
      company_id: companyId,
      quotation_id: quote.id
    }));

    const { data: insertedLines, error: linesErr } = await supabase
      .from('crm_quotation_lines')
      .insert(linePayloads)
      .select();

    if (linesErr) throw linesErr;

    // Emit event
    await EventService.publishEvent(
      companyId,
      'CRM_QUOTATION_CREATED',
      'crm_quotation',
      quote.id,
      { quote_number: quote.quote_number, total_amount: quote.total_amount, party_id: quote.party_id }
    );

    return { ...quote, lines: insertedLines || [] };
  },

  /**
   * Approve a quotation
   */
  async approveQuotation(companyId, quotationId, approvedBy) {
    const { data, error } = await supabase
      .from('crm_quotations')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        updated_at: new Date().toISOString()
      })
      .eq('id', quotationId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) throw error;

    await EventService.publishEvent(
      companyId,
      'CRM_QUOTATION_APPROVED',
      'crm_quotation',
      quotationId,
      { approved_by: approvedBy }
    );

    return data;
  },

  // ==========================================================================
  // 5. SALES ORDERS & FINANCE TRACEABILITY
  // ==========================================================================

  /**
   * Convert an accepted quotation into a confirmed Sales Order
   */
  async convertQuotationToSalesOrder(companyId, quotationId, actorId = null) {
    if (!companyId || !quotationId) {
      throw new Error('company_id and quotationId are required.');
    }

    // 1. Fetch quotation and its lines
    const { data: quote, error: quoteErr } = await supabase
      .from('crm_quotations')
      .select('*, crm_quotation_lines(*)')
      .eq('id', quotationId)
      .eq('company_id', companyId)
      .single();

    if (quoteErr || !quote) {
      throw new Error(`Quotation not found: ${quotationId}`);
    }

    // 2. Mark quote as accepted
    await supabase
      .from('crm_quotations')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', quotationId)
      .eq('company_id', companyId);

    // 3. Create Sales Order
    const orderNumber = `SO-${Date.now().toString().slice(-6)}`;
    const { data: order, error: orderErr } = await supabase
      .from('crm_sales_orders')
      .insert({
        company_id: companyId,
        order_number: orderNumber,
        party_id: quote.party_id,
        quotation_id: quote.id,
        opportunity_id: quote.opportunity_id,
        order_date: new Date().toISOString().split('T')[0],
        currency: quote.currency,
        subtotal_amount: quote.subtotal_amount,
        discount_amount: quote.discount_amount,
        tax_amount: quote.tax_amount,
        total_amount: quote.total_amount,
        status: 'confirmed',
        created_by: actorId
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    // 4. Copy lines
    if (quote.crm_quotation_lines && quote.crm_quotation_lines.length > 0) {
      const orderLines = quote.crm_quotation_lines.map(l => ({
        company_id: companyId,
        sales_order_id: order.id,
        item_description: l.item_description,
        quantity: l.quantity,
        unit_price: l.unit_price,
        discount_amount: l.discount_amount,
        tax_rate: l.tax_rate,
        line_total: l.line_total,
        sort_order: l.sort_order
      }));

      await supabase
        .from('crm_sales_order_lines')
        .insert(orderLines);
    }

    // 5. Emit event
    await EventService.publishEvent(
      companyId,
      'CRM_SALES_ORDER_CREATED',
      'crm_sales_order',
      order.id,
      { order_number: order.order_number, total_amount: order.total_amount, quotation_id: quote.id }
    );

    return order;
  },

  // ==========================================================================
  // 6. ACTIVITIES & UNIFIED TIMELINE
  // ==========================================================================

  /**
   * Log an activity (call, meeting, task, note, follow-up)
   */
  async logActivity(companyId, activityData, actorId = null) {
    if (!companyId || !activityData.title || !activityData.activity_type) {
      throw new Error('company_id, title, and activity_type are required.');
    }

    const payload = {
      company_id: companyId,
      party_id: activityData.party_id || null,
      opportunity_id: activityData.opportunity_id || null,
      activity_type: activityData.activity_type,
      title: activityData.title.trim(),
      description: activityData.description || null,
      due_date: activityData.due_date || null,
      status: activityData.status || 'pending',
      assigned_to: activityData.assigned_to || actorId || null,
      created_by: actorId
    };

    const { data, error } = await supabase
      .from('crm_activities')
      .insert(payload)
      .select(`
        *,
        core_parties (id, primary_name)
      `)
      .single();

    if (error) throw error;

    await EventService.publishEvent(
      companyId,
      'CRM_ACTIVITY_LOGGED',
      'crm_activity',
      data.id,
      { activity_type: data.activity_type, title: data.title, party_id: data.party_id }
    );

    return data;
  },

  /**
   * Get unified activities timeline for a party or opportunity
   */
  async getActivityTimeline(companyId, filter = {}) {
    if (!companyId) return [];

    let query = supabase
      .from('crm_activities')
      .select(`
        *,
        core_parties (id, primary_name)
      `)
      .eq('company_id', companyId);

    if (filter.partyId) {
      query = query.eq('party_id', filter.partyId);
    }
    if (filter.opportunityId) {
      query = query.eq('opportunity_id', filter.opportunityId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.warn('[CrmSalesService] Error fetching activities timeline:', error);
      return [];
    }
    return data || [];
  }
};
