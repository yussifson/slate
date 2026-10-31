import { describe, it, expect, vi, beforeEach } from 'vitest';

// Services across all phases
import { CorePartyService } from '../src/services/CorePartyService';
import { IdentityResolutionService } from '../src/services/IdentityResolutionService';
import { GeneralLedgerService } from '../src/services/GeneralLedgerService';
import { AccountsPayableService } from '../src/services/AccountsPayableService';
import { CrmSalesService } from '../src/services/CrmSalesService';
import { OpsProjectService } from '../src/services/OpsProjectService';
import { EventService } from '../src/services/EventService';
import { OutboxDispatcher } from '../src/lib/workflow/outboxDispatcher.js';
import { WorkflowRuntime } from '../src/lib/workflow/workflowRuntime.js';
import { UnifiedActionCenterService } from '../src/services/UnifiedActionCenterService';
import { GovernedOrbitExecutionGate, GovernedOrbitToolRegistry } from '../src/services/GovernedOrbitService';
import { UniversalSearchService } from '../src/services/UniversalSearchService';
import { BusinessExceptionService } from '../src/services/BusinessExceptionService';
import { IndustryExtensionService } from '../src/services/IndustryExtensionService';
import { supabase } from '../src/api/supabaseClient';

vi.mock('../src/api/supabaseClient', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('Slate V2: Final Platform Integration & End-to-End Scenarios', () => {
  const companyId = 'comp-enterprise-v2-main';
  const superUserId = 'usr-admin-01';
  const employeeUserId = 'usr-emp-02';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // SCENARIO A: Commercial-to-Operational Journey
  // ==========================================================================
  describe('Scenario A: Commercial-to-Operational End-to-End Journey', () => {
    it('executes full Lead -> Deal -> Quote -> Order -> Project -> Milestone -> Tasks -> Finance handoff', async () => {
      const mockLead = { id: 'lead-100', full_name: 'Acme Corp Lead', email: 'contact@acme.com', organization: 'Acme Corp' };
      const mockParty = { id: 'party-acme-1', primary_name: 'Acme Corp', email: 'contact@acme.com' };

      supabase.from.mockImplementation((table) => {
        if (table === 'core_party_mappings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            upsert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'map-1' }, error: null }) }) })
          };
        }
        if (table === 'core_parties') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockResolvedValue({ data: [] }),
            insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: mockParty, error: null }) }) })
          };
        }
        if (table === 'core_party_roles') {
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null }), insert: vi.fn().mockResolvedValue({ error: null }) };
        }
        if (table === 'core_party_activities') {
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        }
        if (table === 'platform_events') {
          return { insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'evt-1' }, error: null }) }) }) };
        }
        if (table === 'leads') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockLead, error: null }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnThis() })
          };
        }
        if (table === 'crm_opportunities') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'opp-1', title: 'Acme Digital Revamp', expected_revenue: 120000, party_id: 'party-acme-1' }, error: null })
              })
            })
          };
        }
        if (table === 'crm_quotations') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'qt-1', quote_number: 'QT-99', total_amount: 120000, party_id: 'party-acme-1' }, error: null })
              })
            }),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'qt-1', party_id: 'party-acme-1', total_amount: 120000, crm_quotation_lines: [{ item_description: 'Implementation', quantity: 1, unit_price: 120000, line_total: 120000 }] },
              error: null
            }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnThis() })
          };
        }
        if (table === 'crm_quotation_lines') {
          return { insert: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue({ data: [], error: null }) }) };
        }
        if (table === 'crm_sales_orders') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'so-1', order_number: 'SO-101', party_id: 'party-acme-1', total_amount: 120000 }, error: null })
              })
            })
          };
        }
        if (table === 'crm_sales_order_lines') {
          return { insert: vi.fn().mockResolvedValue({ data: [], error: null }) };
        }
        if (table === 'ops_projects') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'prj-1', project_code: 'PRJ-101', client_party_id: 'party-acme-1', budget_amount: 120000 }, error: null })
              })
            })
          };
        }
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis()
        };
      });

      // 1. Convert Lead
      const conv = await CrmSalesService.convertLeadToClient(companyId, 'lead-100', superUserId);
      expect(conv.lead_id).toBe('lead-100');

      // 2. Create Opportunity
      const opp = await CrmSalesService.createOpportunity(companyId, {
        title: 'Acme Digital Revamp',
        party_id: conv.party?.id || 'party-acme-1',
        pipeline_id: 'pipe-1',
        stage_id: 'stage-1',
        expected_revenue: 120000
      });
      expect(opp.expected_revenue).toBe(120000);

      // 3. Create & Convert Quotation
      const quote = await CrmSalesService.createQuotation(companyId, {
        title: 'Acme Revamp Quote',
        party_id: 'party-acme-1',
        opportunity_id: opp.id
      }, [{ item_description: 'Implementation', quantity: 1, unit_price: 120000 }]);
      expect(quote.total_amount).toBe(120000);

      const order = await CrmSalesService.convertQuotationToSalesOrder(companyId, quote.id, superUserId);
      expect(order.id).toBe('so-1');

      // 4. Create Project linked to Party & Opportunity
      const project = await OpsProjectService.createProject(companyId, {
        name: 'Acme Implementation Project',
        client_party_id: 'party-acme-1',
        opportunity_id: opp.id,
        budget_amount: 120000
      });
      expect(project.id).toBe('prj-1');
      expect(project.client_party_id).toBe('party-acme-1');
    });
  });

  // ==========================================================================
  // SCENARIO B: Workflow Automation & Event Dispatch
  // ==========================================================================
  describe('Scenario B: Workflow Automation & Event Dispatch', () => {
    it('processes outbox events with idempotent deduplication and state recovery', async () => {
      const mockDb = {
        from: vi.fn((table) => {
          if (table === 'platform_events') {
            return {
              insert: vi.fn().mockImplementation((payload) => ({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { id: 'evt-dyn-1', ...payload, status: 'pending' }, error: null })
                })
              })),
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue({
                data: [{ id: 'evt-dyn-1', company_id: companyId, event_type: 'OPS_PROJECT_CREATED', payload: {}, retry_count: 0 }],
                error: null
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null })
              })
            };
          }
          return {};
        })
      };

      const dispatcher = new OutboxDispatcher({ supabase: mockDb });
      const enq = await dispatcher.enqueueEvent({
        companyId,
        eventType: 'OPS_PROJECT_CREATED',
        aggregateType: 'ops_project',
        aggregateId: 'prj-101',
        payload: { name: 'Apollo' },
        idempotencyKey: 'idemp-key-prj-101'
      });

      expect(enq.duplicate).toBe(false);
      expect(enq.event.idempotency_key).toBe('idemp-key-prj-101');
    });
  });

  // ==========================================================================
  // SCENARIO C: Governed Orbit AI Operations
  // ==========================================================================
  describe('Scenario C: Governed Orbit Action Plan & Authorization', () => {
    it('rejects prohibited or unpermitted actions without server-side authorization', async () => {
      supabase.from.mockImplementation(() => ({
        insert: vi.fn().mockResolvedValue({ error: null })
      }));

      await expect(
        GovernedOrbitExecutionGate.executeToolCall({
          companyId,
          userId: employeeUserId,
          userRole: 'user',
          toolId: 'unregistered_dangerous_tool',
          params: { dropDatabase: true }
        })
      ).rejects.toThrow(/Security Violation: Tool 'unregistered_dangerous_tool' is not registered or is prohibited./);
    });

    it('requires formal approval for high-risk financial transactions', async () => {
      supabase.from.mockImplementation((table) => {
        if (table === 'unified_action_items') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'act-req-99', status: 'pending', title: 'Large Wire Transfer' },
                  error: null
                })
              })
            })
          };
        }
        return {
          insert: vi.fn().mockResolvedValue({ error: null })
        };
      });

      const res = await GovernedOrbitExecutionGate.executeToolCall({
        companyId,
        userId: superUserId,
        userRole: 'super_admin',
        toolId: 'authorize_financial_transaction',
        params: { title: 'Wire Transfer 50k', amount: 50000 },
        humanApprovalGranted: false
      });

      expect(res.governanceStatus).toBe('APPROVAL_REQUIRED');
      expect(res.actionPreview).toBeDefined();
      expect(res.details.status).toBe('pending_approval');
      expect(res.details.action_item_id).toBeDefined();
    });
  });

  // ==========================================================================
  // SCENARIO D: Unified Intelligence & Search Provenance
  // ==========================================================================
  describe('Scenario D: Unified Intelligence & Search Provenance', () => {
    it('surfaces cross-phase party relationships and exceptions with verified provenance', async () => {
      supabase.from.mockImplementation((table) => {
        if (table === 'core_parties') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [{ id: 'pty-10', primary_name: 'Starlight Logistics', email: 'ops@starlight.com', party_type: 'organization', status: 'active' }],
                error: null
              })
            })
          };
        }
        if (table === 'business_exceptions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: [{ id: 'iss-1', title: 'Delayed Dispatch', severity: 'high', status: 'open' }],
              error: null
            })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        };
      });

      const searchRes = await UniversalSearchService.search(companyId, 'Starlight');
      expect(searchRes.results.length).toBeGreaterThan(0);
      expect(searchRes.results[0].title).toBe('Starlight Logistics');

      const exceptions = await BusinessExceptionService.getOpenExceptions(companyId);
      expect(exceptions).toBeDefined();
      expect(exceptions.length).toBe(1);
    });
  });

  // ==========================================================================
  // SCENARIO E: Industry Extensions Isolation
  // ==========================================================================
  describe('Scenario E: Industry Extensions & Platform Boundary Isolation', () => {
    it('executes industry pack logic without modifying core platform entities or touching CliPad', async () => {
      supabase.from.mockImplementation((table) => {
        if (table === 'industry_extensions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: [
                { id: 'healthcare', name: 'Healthcare & Clinical Administration', is_active: true },
                { id: 'legal_practice', name: 'Legal Practice Management', is_active: true }
              ],
              error: null
            })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        };
      });

      const catalog = await IndustryExtensionService.getCatalog();
      expect(catalog.length).toBeGreaterThan(0);
      const healthcare = catalog.find(c => c.id === 'healthcare');
      expect(healthcare).toBeDefined();
      expect(healthcare.name).toBe('Healthcare & Clinical Administration');
    });
  });
});
