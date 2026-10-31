import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../src/api/supabaseClient.js';
import { IndustryExtensionService } from '../src/services/IndustryExtensionService.js';
import { CapabilityService } from '../src/services/CapabilityService.js';

describe('Slate V2 Phase 8 - Industry Extension Framework & Pack Verification', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Extension Catalog & Dependency Validation', () => {
    it('loads the catalog of verified industry extensions', async () => {
      vi.spyOn(IndustryExtensionService, 'getCatalog').mockResolvedValue(
        IndustryExtensionService.getFallbackCatalog()
      );

      const catalog = await IndustryExtensionService.getCatalog();
      expect(catalog.length).toBeGreaterThanOrEqual(5);

      const industryIds = catalog.map(c => c.id);
      expect(industryIds).toContain('legal_practice');
      expect(industryIds).toContain('real_estate');
      expect(industryIds).toContain('healthcare');
      expect(industryIds).toContain('education');
      expect(industryIds).toContain('logistics');
    });

    it('blocks industry installation if required platform capabilities are missing', async () => {
      vi.spyOn(IndustryExtensionService, 'getCatalog').mockResolvedValue(
        IndustryExtensionService.getFallbackCatalog()
      );

      // Mock CapabilityService returning ONLY 'core_foundation' (missing 'documents')
      vi.spyOn(CapabilityService, 'getCompanyCapabilities').mockResolvedValue([
        { id: 'core_foundation', name: 'Core Foundation' }
      ]);

      await expect(
        IndustryExtensionService.installIndustry('comp-tenant-01', 'legal_practice')
      ).rejects.toThrow(/Required platform capability 'documents' is not activated/);
    });

    it('successfully activates industry pack when required capabilities are satisfied', async () => {
      vi.spyOn(IndustryExtensionService, 'getCatalog').mockResolvedValue(
        IndustryExtensionService.getFallbackCatalog()
      );

      vi.spyOn(CapabilityService, 'getCompanyCapabilities').mockResolvedValue([
        { id: 'core_foundation', name: 'Core Foundation' },
        { id: 'documents', name: 'Document Vault' }
      ]);

      supabase.from = vi.fn((table) => {
        if (table === 'company_industry_installations') {
          return {
            upsert: vi.fn().mockImplementation((payload) => ({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'inst-999', ...payload },
                  error: null
                })
              })
            }))
          };
        }
        return { select: vi.fn() };
      });

      const res = await IndustryExtensionService.installIndustry(
        'comp-tenant-01',
        'legal_practice',
        { practice_area: 'corporate' },
        'admin-user'
      );

      expect(res.industry_id).toBe('legal_practice');
      expect(res.status).toBe('active');
    });
  });

  describe('Lifecycle State Management & Safe Suspension', () => {
    it('updates lifecycle status safely without deleting underlying records', async () => {
      supabase.from = vi.fn((table) => {
        if (table === 'company_industry_installations') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { company_id: 'comp-tenant-01', industry_id: 'real_estate', status: 'suspended' },
                      error: null
                    })
                  })
                })
              })
            })
          };
        }
        return { select: vi.fn() };
      });

      const res = await IndustryExtensionService.updateLifecycleStatus(
        'comp-tenant-01',
        'real_estate',
        'suspended'
      );

      expect(res.status).toBe('suspended');
    });

    it('rejects invalid lifecycle status transitions', async () => {
      await expect(
        IndustryExtensionService.updateLifecycleStatus('comp-tenant-01', 'real_estate', 'destroyed')
      ).rejects.toThrow(/Invalid industry lifecycle status/);
    });
  });

  describe('Industry Security: Confidentiality & Auditing', () => {
    it('verifies explicit record-level access grants for confidential legal matters', async () => {
      supabase.from = vi.fn((table) => {
        if (table === 'legal_matter_access_grants') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { access_level: 'lead_counsel' },
                      error: null
                    })
                  })
                })
              })
            })
          };
        }
        return { select: vi.fn() };
      });

      const hasAccess = await IndustryExtensionService.checkMatterAccess(
        'comp-tenant-01',
        'matter-case-007',
        'lawyer-uuid-1'
      );

      expect(hasAccess).toBe(true);
    });

    it('records immutable audit logs on clinical patient record access', async () => {
      let loggedAudit = null;
      supabase.from = vi.fn((table) => {
        if (table === 'clinical_access_audit_logs') {
          return {
            insert: vi.fn().mockImplementation((payload) => {
              loggedAudit = payload;
              return Promise.resolve({ error: null });
            })
          };
        }
        return { select: vi.fn() };
      });

      await IndustryExtensionService.recordClinicalAudit(
        'comp-tenant-01',
        'patient-xyz',
        'doctor-user-1',
        'view_encounter',
        'Routine follow-up consultation'
      );

      expect(loggedAudit).not.toBeNull();
      expect(loggedAudit.patient_id).toBe('patient-xyz');
      expect(loggedAudit.access_action).toBe('view_encounter');
      expect(loggedAudit.actor_id).toBe('doctor-user-1');
    });
  });
});
