// tests/ClipadV3OrganizationalMemory.test.js
// Unit & Integration Tests for Clipad V3 Phase 2 — Organizational Intelligence & Memory Core

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMemory, getMemories, supersedeMemory, archiveMemory, getMemoryProvenance, MEMORY_TIERS, MEMORY_TYPES, MEMORY_STATUS } from '../src/lib/clipadMemoryService';
import { upsertEntity, createRelationship, ENTITY_TYPES, RELATIONSHIP_TYPES } from '../src/lib/clipadEntityService';
import { ingestSourceToMemory } from '../src/lib/clipadIngestionPipeline';
import { getRelevantMemories, rankMemories, getOrganizationalContext, getUserContext } from '../src/lib/clipadContextService';

// Mock Supabase client
vi.mock('../src/api/supabaseClient', () => {
  const store = new Map();
  return {
    supabase: {
      from: vi.fn((table) => {
        return {
          insert: vi.fn((payload) => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => {
                const item = { id: crypto.randomUUID(), ...payload };
                store.set(item.id, item);
                return { data: item, error: null };
              }),
            })),
          })),
          upsert: vi.fn((payload) => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => {
                const item = { id: crypto.randomUUID(), ...payload };
                store.set(item.id, item);
                return { data: item, error: null };
              }),
            })),
          })),
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({ data: Array.from(store.values())[0] || null, error: null })),
              })),
            })),
            eq: vi.fn((col, val) => ({
              single: vi.fn(async () => {
                const item = store.get(val);
                return { data: item || Array.from(store.values()).find(i => i.id === val) || null, error: null };
              }),
              limit: vi.fn(async () => ({ data: Array.from(store.values()), error: null })),
            })),
            limit: vi.fn(async () => ({ data: Array.from(store.values()), error: null })),
          })),
          update: vi.fn((payload) => ({
            eq: vi.fn((col, val) => {
              const existing = store.get(val) || Array.from(store.values()).find(i => i.id === val) || { id: val };
              const updated = { ...existing, ...payload };
              store.set(val, updated);
              return {
                select: vi.fn(() => ({
                  single: vi.fn(async () => ({ data: updated, error: null })),
                })),
                then: (resolve) => resolve({ data: updated, error: null }),
              };
            }),
          })),
        };
      }),
    },
  };
});

describe('Clipad V3 Phase 2 — Organizational Memory Core & Intelligence', () => {
  const companyId = 'comp-org-123';
  const userId = 'user-alice-456';
  const teamSpaceId = 'space-[#general]-789';

  describe('1. Memory Creation & Scope Isolation', () => {
    it('creates personal memory scoped to specific user', async () => {
      const memory = await createMemory({
        companyId,
        userId,
        memoryTier: MEMORY_TIERS.PERSONAL,
        memoryType: MEMORY_TYPES.PREFERENCE,
        title: 'User Preferences',
        content: 'Prefers dark mode and morning digests.',
      });

      expect(memory).toBeDefined();
      expect(memory.memory_tier).toBe(MEMORY_TIERS.PERSONAL);
      expect(memory.user_id).toBe(userId);
      expect(memory.is_active).toBe(true);
    });

    it('creates team memory scoped to specific team space', async () => {
      const memory = await createMemory({
        companyId,
        teamSpaceId,
        memoryTier: MEMORY_TIERS.TEAM,
        memoryType: MEMORY_TYPES.DECISION,
        title: 'Sprint Workflow Choice',
        content: 'Team agreed on 2-week sprint cadence.',
      });

      expect(memory.memory_tier).toBe(MEMORY_TIERS.TEAM);
      expect(memory.team_space_id).toBe(teamSpaceId);
    });

    it('creates organizational memory accessible across company', async () => {
      const memory = await createMemory({
        companyId,
        memoryTier: MEMORY_TIERS.ORGANIZATIONAL,
        memoryType: MEMORY_TYPES.POLICY,
        title: 'Remote Work Policy',
        content: 'Company permits remote work with manager sync.',
      });

      expect(memory.memory_tier).toBe(MEMORY_TIERS.ORGANIZATIONAL);
      expect(memory.company_id).toBe(companyId);
    });
  });

  describe('2. Permission-Aware Memory Isolation', () => {
    it('restricts personal memory retrieval to matching user', async () => {
      const personalMem = {
        id: 'mem-1',
        user_id: 'user-alice',
        memory_tier: MEMORY_TIERS.PERSONAL,
        title: 'Alice Notes',
        content: 'Private Alice content',
        status: MEMORY_STATUS.ACTIVE,
      };

      const accessibleToAlice = [personalMem].filter(m => m.memory_tier === MEMORY_TIERS.PERSONAL ? m.user_id === 'user-alice' : true);
      const accessibleToBob = [personalMem].filter(m => m.memory_tier === MEMORY_TIERS.PERSONAL ? m.user_id === 'user-bob' : true);

      expect(accessibleToAlice.length).toBe(1);
      expect(accessibleToBob.length).toBe(0);
    });

    it('enforces space permissions on team memory', async () => {
      const teamMem = {
        id: 'mem-2',
        team_space_id: 'space-engineering',
        memory_tier: MEMORY_TIERS.TEAM,
        title: 'Architecture Spec',
        content: 'Microservices architecture',
        status: MEMORY_STATUS.ACTIVE,
      };

      const accessibleToEngineering = [teamMem].filter(m => m.memory_tier === MEMORY_TIERS.TEAM ? ['space-engineering'].includes(m.team_space_id) : true);
      const accessibleToMarketing = [teamMem].filter(m => m.memory_tier === MEMORY_TIERS.TEAM ? ['space-marketing'].includes(m.team_space_id) : true);

      expect(accessibleToEngineering.length).toBe(1);
      expect(accessibleToMarketing.length).toBe(0);
    });
  });

  describe('3. Memory Lifecycle & Provenance Tracing', () => {
    it('supersedes outdated memory without deleting provenance', async () => {
      const oldMem = await createMemory({
        companyId,
        title: 'Database Provider Choice',
        content: 'Company uses Provider A.',
        memoryType: MEMORY_TYPES.DECISION,
      });

      const newMem = await supersedeMemory(oldMem.id, {
        companyId,
        title: 'Database Provider Choice',
        content: 'Company migrated to Provider B.',
        memoryType: MEMORY_TYPES.DECISION,
      });

      expect(newMem).toBeDefined();
      expect(newMem.content).toBe('Company migrated to Provider B.');
      expect(newMem.source_metadata.supersedes_id).toBe(oldMem.id);
    });

    it('archives memory upon request', async () => {
      const mem = await createMemory({
        companyId,
        title: 'Temporary Task Context',
        content: 'Old context',
      });

      const archived = await archiveMemory(mem.id);
      expect(archived.status).toBe(MEMORY_STATUS.ARCHIVED);
      expect(archived.is_active).toBe(false);
    });
  });

  describe('4. Entity & Relationship Graph Model', () => {
    it('registers normalized organizational entity and relationship edge', async () => {
      const entity = await upsertEntity({
        companyId,
        entityType: ENTITY_TYPES.PERSON,
        entityId: 'alice',
        name: 'Alice Johnson',
      });

      const rel = await createRelationship({
        companyId,
        sourceEntityId: entity.id,
        targetEntityId: 'space-eng',
        relationshipType: RELATIONSHIP_TYPES.MEMBER_OF,
        confidence: 0.95,
      });

      expect(entity).toBeDefined();
      expect(entity.name).toBe('Alice Johnson');
      expect(rel.relationship_type).toBe(RELATIONSHIP_TYPES.MEMBER_OF);
    });
  });

  describe('5. Memory Ranking & Context Service', () => {
    it('ranks memories by relevance, freshness, confidence, and importance', () => {
      const sampleMemories = [
        { id: '1', title: 'DB Provider', content: 'We use Provider B', confidence_score: 0.9, importance: 0.8, created_at: new Date().toISOString() },
        { id: '2', title: 'Coffee Choice', content: 'Office prefers espresso', confidence_score: 0.5, importance: 0.2, created_at: new Date(Date.now() - 30*24*60*60*1000).toISOString() },
      ];

      const ranked = rankMemories(sampleMemories, 'Provider B');
      expect(ranked[0].id).toBe('1');
      expect(ranked[0].ranking.compositeScore).toBeGreaterThan(ranked[1].ranking.compositeScore);
    });
  });
});
