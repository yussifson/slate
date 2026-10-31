import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmSalesService, DEFAULT_PIPELINE_STAGES } from '../src/services/CrmSalesService';
import { supabase } from '../src/api/supabaseClient';
import { EventService } from '../src/services/EventService';
import { IdentityResolutionService } from '../src/services/IdentityResolutionService';

// Mock Supabase & EventService
vi.mock('../src/api/supabaseClient', () => {
  return {
    supabase: {
      from: vi.fn()
    }
  };
});

vi.mock('../src/services/EventService', () => {
  return {
    EventService: {
      publishEvent: vi.fn().mockResolvedValue({ id: 'evt-123' })
    }
  };
});

vi.mock('../src/services/IdentityResolutionService', () => {
  return {
    IdentityResolutionService: {
      resolveAndLink: vi.fn()
    }
  };
});

describe('Slate V2: Phase 4 — CRM, Sales & Commercial Operations', () => {
  const mockCompanyId = 'company-test-uuid-4444';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Pipelines & Opportunities', () => {
    it('creates default pipeline if none exists', async () => {
      const mockPipeline = { id: 'pipe-1', company_id: mockCompanyId, name: 'Standard Sales Pipeline', is_default: true };
      const mockStages = DEFAULT_PIPELINE_STAGES.map((s, idx) => ({ ...s, id: `stage-${idx}`, pipeline_id: 'pipe-1' }));

      supabase.from.mockImplementation((table) => {
        if (table === 'crm_pipelines') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockPipeline, error: null })
              })
            })
          };
        }
        if (table === 'crm_pipeline_stages') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({ data: mockStages, error: null })
            })
          };
        }
        return {};
      });

      const result = await CrmSalesService.ensureDefaultPipeline(mockCompanyId);
      expect(result).toBeDefined();
      expect(result.id).toBe('pipe-1');
      expect(result.crm_pipeline_stages.length).toBe(6);
    });

    it('creates an opportunity with validation and publishes an event', async () => {
      const mockOpp = {
        id: 'opp-100',
        company_id: mockCompanyId,
        title: 'Global Retail Deal',
        expected_revenue: 75000,
        pipeline_id: 'pipe-1',
        stage_id: 'stage-1',
        status: 'open'
      };

      supabase.from.mockImplementation((table) => {
        if (table === 'crm_opportunities') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockOpp, error: null })
              })
            })
          };
        }
        return {};
      });

      const opp = await CrmSalesService.createOpportunity(mockCompanyId, {
        title: 'Global Retail Deal',
        expected_revenue: 75000,
        pipeline_id: 'pipe-1',
        stage_id: 'stage-1'
      });

      expect(opp.id).toBe('opp-100');
      expect(EventService.publishEvent).toHaveBeenCalledWith(
        mockCompanyId,
        'CRM_OPPORTUNITY_CREATED',
        'crm_opportunity',
        'opp-100',
        expect.objectContaining({ title: 'Global Retail Deal', expected_revenue: 75000 })
      );
    });

    it('transitions opportunity to Won stage and sets close date', async () => {
      const mockWonStage = { id: 'stage-won', name: 'Closed Won', is_won: true, is_lost: false };
      const updatedOpp = { id: 'opp-100', status: 'won', stage_id: 'stage-won' };

      supabase.from.mockImplementation((table) => {
        if (table === 'crm_pipeline_stages') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockWonStage, error: null })
          };
        }
        if (table === 'crm_opportunities') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: updatedOpp, error: null })
              })
            })
          };
        }
        return {};
      });

      const result = await CrmSalesService.updateOpportunityStage(mockCompanyId, 'opp-100', 'stage-won', 'user-1', 'Signed contract');
      expect(result.status).toBe('won');
      expect(EventService.publishEvent).toHaveBeenCalledWith(
        mockCompanyId,
        'CRM_OPPORTUNITY_WON',
        'crm_opportunity',
        'opp-100',
        expect.objectContaining({ status: 'won' })
      );
    });
  });

  describe('Commercial Quotations & Sales Orders', () => {
    it('creates a quotation with deterministic tax, discount, and line calculations', async () => {
      const mockLines = [
        { item_description: 'Software License', quantity: 10, unit_price: 100, discount_amount: 50, tax_rate: 10 }
      ];
      // Calculation: (10 * 100) - 50 = 950. Tax: 950 * 10% = 95. Line total: 1045.

      const mockQuote = {
        id: 'quote-555',
        company_id: mockCompanyId,
        quote_number: 'QT-1001',
        title: 'Enterprise License',
        subtotal_amount: 1000,
        discount_amount: 50,
        tax_amount: 95,
        total_amount: 1045,
        status: 'draft',
        party_id: 'party-customer'
      };

      supabase.from.mockImplementation((table) => {
        if (table === 'crm_quotations') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockQuote, error: null })
              })
            })
          };
        }
        if (table === 'crm_quotation_lines') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({ data: [{ ...mockLines[0], line_total: 1045 }], error: null })
            })
          };
        }
        return {};
      });

      const quote = await CrmSalesService.createQuotation(mockCompanyId, {
        title: 'Enterprise License',
        party_id: 'party-customer'
      }, mockLines);

      expect(quote.total_amount).toBe(1045);
      expect(quote.tax_amount).toBe(95);
      expect(EventService.publishEvent).toHaveBeenCalledWith(
        mockCompanyId,
        'CRM_QUOTATION_CREATED',
        'crm_quotation',
        'quote-555',
        expect.objectContaining({ total_amount: 1045 })
      );
    });

    it('converts an accepted quotation into a confirmed sales order', async () => {
      const mockQuote = {
        id: 'quote-555',
        company_id: mockCompanyId,
        party_id: 'party-customer',
        currency: 'USD',
        subtotal_amount: 1000,
        discount_amount: 50,
        tax_amount: 95,
        total_amount: 1045,
        crm_quotation_lines: [
          { item_description: 'Software License', quantity: 10, unit_price: 100, discount_amount: 50, tax_rate: 10, line_total: 1045, sort_order: 1 }
        ]
      };

      const mockOrder = {
        id: 'so-888',
        company_id: mockCompanyId,
        order_number: 'SO-9999',
        total_amount: 1045,
        status: 'confirmed'
      };

      supabase.from.mockImplementation((table) => {
        if (table === 'crm_quotations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockQuote, error: null }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis()
            })
          };
        }
        if (table === 'crm_sales_orders') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockOrder, error: null })
              })
            })
          };
        }
        if (table === 'crm_sales_order_lines') {
          return {
            insert: vi.fn().mockResolvedValue({ data: [], error: null })
          };
        }
        return {};
      });

      const order = await CrmSalesService.convertQuotationToSalesOrder(mockCompanyId, 'quote-555', 'user-1');
      expect(order.id).toBe('so-888');
      expect(order.status).toBe('confirmed');
      expect(EventService.publishEvent).toHaveBeenCalledWith(
        mockCompanyId,
        'CRM_SALES_ORDER_CREATED',
        'crm_sales_order',
        'so-888',
        expect.objectContaining({ total_amount: 1045, quotation_id: 'quote-555' })
      );
    });
  });

  describe('Lead Safe Conversion', () => {
    it('safely converts a lead into a client party without duplicate party creation', async () => {
      const mockLead = {
        id: 'lead-123',
        company_id: mockCompanyId,
        full_name: 'Jane Doe',
        email: 'jane@enterprise.com',
        phone: '+1 555-0199',
        organization: 'Enterprise Inc.'
      };

      const mockParty = {
        id: 'party-resolved-99',
        primary_name: 'Jane Doe',
        email: 'jane@enterprise.com'
      };

      IdentityResolutionService.resolveAndLink.mockResolvedValue({
        party: mockParty,
        status: 'high_confidence_match'
      });

      supabase.from.mockImplementation((table) => {
        if (table === 'leads') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockLead, error: null }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis()
            })
          };
        }
        return {};
      });

      const result = await CrmSalesService.convertLeadToClient(mockCompanyId, 'lead-123', 'actor-1');

      expect(IdentityResolutionService.resolveAndLink).toHaveBeenCalledWith(
        mockCompanyId,
        'leads',
        expect.objectContaining({ email: 'jane@enterprise.com' }),
        'client',
        'actor-1'
      );
      expect(result.party.id).toBe('party-resolved-99');
      expect(EventService.publishEvent).toHaveBeenCalledWith(
        mockCompanyId,
        'CRM_LEAD_CONVERTED',
        'lead',
        'lead-123',
        expect.objectContaining({ party_id: 'party-resolved-99' })
      );
    });
  });
});
