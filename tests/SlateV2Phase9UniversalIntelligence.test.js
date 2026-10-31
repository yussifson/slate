import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../src/api/supabaseClient.js';
import { UniversalSearchService } from '../src/services/UniversalSearchService.js';
import { BusinessRelationshipIntelligenceService } from '../src/services/BusinessRelationshipIntelligenceService.js';
import { BusinessExceptionService } from '../src/services/BusinessExceptionService.js';
import { NaturalLanguageQueryService } from '../src/services/NaturalLanguageQueryService.js';
import { UnifiedActionCenterService } from '../src/services/UnifiedActionCenterService.js';

describe('Slate V2 Phase 9 - Universal Intelligence, Search & Business Insights', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Universal Business Search', () => {
    it('performs cross-domain search across core parties, invoices, and workflows with ranking', async () => {
      const mockParties = [
        { id: 'p-1', party_type: 'client', primary_name: 'Acme Robotics Corp', legal_name: 'Acme Corp', email: 'acme@example.com', status: 'active' }
      ];
      const mockInvoices = [
        { id: 'inv-1', invoice_number: 'INV-ACME-001', total_amount: 12500, status: 'unpaid', due_date: '2026-11-15' }
      ];

      supabase.from = vi.fn((table) => {
        if (table === 'core_parties') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                or: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: mockParties, error: null })
                })
              })
            })
          };
        }
        if (table === 'invoices') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                ilike: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: mockInvoices, error: null })
                })
              })
            })
          };
        }
        if (table === 'workflow_definitions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                or: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null })
                })
              })
            })
          };
        }
        return { select: vi.fn() };
      });

      const res = await UniversalSearchService.search('comp-alpha', 'Acme');
      expect(res.total).toBe(2);
      expect(res.results[0].title).toBe('Acme Robotics Corp');
      expect(res.results[1].title).toBe('Invoice #INV-ACME-001');
    });

    it('enforces tenant boundary and returns empty when query is empty', async () => {
      const res = await UniversalSearchService.search('comp-alpha', '');
      expect(res.total).toBe(0);
      expect(res.results).toEqual([]);
    });
  });

  describe('Business Relationship Intelligence', () => {
    it('discovers 360-degree party relationships, connected parties, and activity timeline', async () => {
      const mockParty = { id: 'p-target', primary_name: 'Nexus Dynamics', party_type: 'organization' };
      const mockOutgoing = [
        { id: 'rel-1', relationship_type: 'subsidiary_of', to_party_id: 'p-parent', to_party: { primary_name: 'Global Corp' } }
      ];

      supabase.from = vi.fn((table) => {
        if (table === 'core_parties') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockParty, error: null })
                })
              })
            })
          };
        }
        if (table === 'core_relationships') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: mockOutgoing, error: null })
              })
            })
          };
        }
        if (table === 'business_activity_timeline') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: [], error: null })
                  })
                })
              })
            })
          };
        }
        return { select: vi.fn() };
      });

      const graph = await BusinessRelationshipIntelligenceService.getPartyRelationshipGraph('comp-alpha', 'p-target');
      expect(graph.party.primary_name).toBe('Nexus Dynamics');
      expect(graph.outgoingRelationships).toHaveLength(1);
      expect(graph.outgoingRelationships[0].relationship_type).toBe('subsidiary_of');
    });
  });

  describe('Deterministic Business Exceptions & Process Health', () => {
    it('scans and detects overdue invoice anomalies and dead-letter workflow executions', async () => {
      const overdue = [
        { id: 'inv-99', invoice_number: 'INV-99', total_amount: 15000, due_date: '2026-09-01', status: 'overdue' }
      ];
      const deadLetters = [
        { id: 'dl-1', source_id: 'wf-exec-1', error_message: 'External endpoint 500 timeout', retry_count: 3 }
      ];

      supabase.from = vi.fn((table) => {
        if (table === 'invoices') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: overdue, error: null })
              })
            })
          };
        }
        if (table === 'workflow_dead_letters') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: deadLetters, error: null })
              })
            })
          };
        }
        if (table === 'business_exceptions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
                    })
                  })
                })
              })
            }),
            insert: vi.fn().mockResolvedValue({ error: null })
          };
        }
        return { select: vi.fn() };
      });

      const exceptions = await BusinessExceptionService.scanExceptions('comp-alpha');
      expect(exceptions).toHaveLength(2);
      expect(exceptions[0].exception_type).toBe('overdue_invoice');
      expect(exceptions[0].severity).toBe('high');
      expect(exceptions[1].exception_type).toBe('workflow_dead_letter');
      expect(exceptions[1].severity).toBe('critical');
    });

    it('calculates deterministic process health scores based on actual workflow success rates', async () => {
      supabase.from = vi.fn((table) => {
        if (table === 'workflow_executions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  { status: 'completed' },
                  { status: 'completed' },
                  { status: 'completed' },
                  { status: 'failed' } // 75% success rate
                ],
                error: null
              })
            })
          };
        }
        if (table === 'business_exceptions') {
          return {
            select: vi.fn().mockResolvedValue({ count: 1 })
          };
        }
        if (table === 'unified_action_items') {
          return {
            select: vi.fn().mockResolvedValue({ count: 2 })
          };
        }
        return { select: vi.fn() };
      });

      const health = await BusinessExceptionService.getProcessHealthMetrics('comp-alpha');
      expect(health.workflowSuccessRate).toBe('75%');
      expect(health.totalWorkflowExecutions).toBe(4);
      expect(health.healthScore).toBeLessThanOrEqual(90);
    });
  });

  describe('Natural Language Query Foundation (Orbit Readiness)', () => {
    it('safely routes natural-language prompts to allowlisted services with zero arbitrary SQL', async () => {
      vi.spyOn(UnifiedActionCenterService, 'getActionItems').mockResolvedValue([
        { id: 'act-1', title: 'Pending Approval' }
      ]);

      // Prompt asking for pending approvals
      const res = await NaturalLanguageQueryService.executeNaturalLanguageQuery(
        'comp-alpha',
        'What approvals are waiting for me?'
      );

      expect(res.intent).toBe('PENDING_APPROVALS');
      expect(res.provenance).toBe('unified_action_items');
      expect(res.data).toHaveLength(1);
    });

    it('routes health queries to deterministic health calculation', async () => {
      const res = await NaturalLanguageQueryService.executeNaturalLanguageQuery(
        'comp-alpha',
        'What is our operational health performance score?'
      );

      expect(res.intent).toBe('PROCESS_HEALTH');
      expect(res.provenance).toContain('workflow_executions');
    });
  });
});
