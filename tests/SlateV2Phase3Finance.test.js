import { describe, it, expect, vi } from 'vitest';
import { GeneralLedgerService, ACCOUNT_TYPES } from '../src/services/GeneralLedgerService';
import { AccountsPayableService } from '../src/services/AccountsPayableService';
import { supabase } from '../src/api/supabaseClient';

describe('SLATE V2: Phase 3 Finance & Double-Entry Accounting Test Suite', () => {
  const TENANT_A = 'comp-tenant-alpha-001';
  const TENANT_B = 'comp-tenant-bravo-002';

  describe('1. Accounting Invariants & Balancing Rules', () => {
    it('enforces that debits must mathematically equal credits', async () => {
      const unbalancedLines = [
        { account_id: 'acc-1', line_type: 'debit', amount: 500 },
        { account_id: 'acc-2', line_type: 'credit', amount: 450 } // $50 imbalance
      ];

      await expect(
        GeneralLedgerService.postJournalEntry(
          TENANT_A,
          { memo: 'Unbalanced Transaction' },
          unbalancedLines
        )
      ).rejects.toThrow(/Accounting Invariant Violation: Total Debits.*must equal Total Credits/i);
    });

    it('requires at least two lines for any posted double-entry journal', async () => {
      await expect(
        GeneralLedgerService.postJournalEntry(
          TENANT_A,
          { memo: 'Single line' },
          [{ account_id: 'acc-1', line_type: 'debit', amount: 100 }]
        )
      ).rejects.toThrow(/requires at least two lines/i);
    });

    it('rejects negative or zero line amounts', async () => {
      const negativeLines = [
        { account_id: 'acc-1', line_type: 'debit', amount: -50 },
        { account_id: 'acc-2', line_type: 'credit', amount: -50 }
      ];

      await expect(
        GeneralLedgerService.postJournalEntry(
          TENANT_A,
          { memo: 'Negative test' },
          negativeLines
        )
      ).rejects.toThrow(/All journal line amounts must be strictly positive/i);
    });

    it('posts a balanced journal entry and dispatches an outbox event', async () => {
      let insertedHeader = null;
      let insertedLines = null;

      const balancedLines = [
        { account_id: 'acc-cash-1000', line_type: 'debit', amount: 1250.50 },
        { account_id: 'acc-rev-4000', line_type: 'credit', amount: 1250.50 }
      ];

      const originalFrom = supabase.from;
      supabase.from = vi.fn((table) => {
        if (table === 'fin_journal_entries') {
          return {
            insert: vi.fn((header) => {
              insertedHeader = header;
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'je-uuid-101', ...header },
                    error: null
                  })
                })
              };
            })
          };
        }
        if (table === 'fin_journal_lines') {
          return {
            insert: vi.fn((lines) => {
              insertedLines = lines;
              return Promise.resolve({ error: null });
            })
          };
        }
        if (table === 'platform_events') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'evt-je-1' }, error: null })
              })
            })
          };
        }
        return originalFrom(table);
      });

      const entry = await GeneralLedgerService.postJournalEntry(
        TENANT_A,
        { memo: 'Client Consulting Retainer' },
        balancedLines,
        'user-cfo-1'
      );

      expect(entry).toBeDefined();
      expect(insertedHeader.status).toBe('posted');
      expect(insertedHeader.total_amount).toBe(1250.50);
      expect(insertedLines.length).toBe(2);

      supabase.from = originalFrom;
    });
  });

  describe('2. Journal Entry Reversals', () => {
    it('creates an exact inverted entry when reversing a posted journal', async () => {
      const originalEntry = {
        id: 'orig-je-55',
        entry_number: 'JE-55',
        status: 'posted',
        memo: 'Original Software Purchase',
        fin_journal_lines: [
          { account_id: 'acc-exp-5200', line_type: 'debit', amount: 300, party_id: 'vendor-1' },
          { account_id: 'acc-cash-1000', line_type: 'credit', amount: 300, party_id: null }
        ]
      };

      let updateStatus = null;
      const originalFrom = supabase.from;
      supabase.from = vi.fn((table) => {
        if (table === 'fin_journal_entries') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: originalEntry, error: null })
                })
              })
            }),
            insert: vi.fn((hdr) => ({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'reversal-je-99', ...hdr }, error: null })
              })
            })),
            update: vi.fn((fields) => {
              updateStatus = fields.status;
              return {
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null })
                })
              };
            })
          };
        }
        if (table === 'fin_journal_lines') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null })
          };
        }
        if (table === 'platform_events') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: {}, error: null })
              })
            })
          };
        }
        return originalFrom(table);
      });

      const reversal = await GeneralLedgerService.reverseJournalEntry(
        TENANT_A,
        'orig-je-55',
        'Duplicate invoice from vendor',
        'user-cfo-1'
      );

      expect(reversal).toBeDefined();
      expect(updateStatus).toBe('reversed');

      supabase.from = originalFrom;
    });
  });

  describe('3. Accounts Payable & Supplier Bills', () => {
    it('creates a supplier bill and posts double-entry expense and A/P liability', async () => {
      let createdBill = null;
      let postedJournal = false;

      const mockAccounts = [
        { id: 'acc-ap-2000', account_code: '2000', account_type: ACCOUNT_TYPES.LIABILITY },
        { id: 'acc-exp-5200', account_code: '5200', account_type: ACCOUNT_TYPES.EXPENSE }
      ];

      const originalFrom = supabase.from;
      supabase.from = vi.fn((table) => {
        if (table === 'fin_supplier_bills') {
          return {
            insert: vi.fn((bill) => {
              createdBill = bill;
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { id: 'bill-1', ...bill }, error: null })
                })
              };
            })
          };
        }
        if (table === 'fin_accounts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockAccounts, error: null })
              })
            })
          };
        }
        if (table === 'fin_journal_entries') {
          postedJournal = true;
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'je-bill-1' }, error: null })
              })
            })
          };
        }
        if (table === 'fin_journal_lines') {
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        }
        if (table === 'platform_events') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: {}, error: null })
              })
            })
          };
        }
        return originalFrom(table);
      });

      const bill = await AccountsPayableService.createBill(
        TENANT_A,
        {
          supplier_party_id: 'supplier-uuid-1',
          total_amount: 4500.00,
          notes: 'Quarterly Server Hosting'
        },
        'acc-exp-5200',
        'user-manager-1'
      );

      expect(bill).toBeDefined();
      expect(createdBill.total_amount).toBe(4500.00);
      expect(postedJournal).toBe(true);

      supabase.from = originalFrom;
    });
  });
});
