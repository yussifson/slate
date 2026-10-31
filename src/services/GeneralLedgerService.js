/**
 * Slate V2: General Ledger & Double-Entry Accounting Service (Phase 3)
 * 
 * Enforces fundamental accounting invariants:
 * 1. Debits MUST equal Credits for every posted entry.
 * 2. Immutable posted entries (corrections mandate reversal journals).
 * 3. Tenant-scoped accounts and transactions.
 * 4. Automatic trial balance and balance sheet generation.
 */
import { supabase } from '../api/supabaseClient';
import { EventService } from './EventService';

export const ACCOUNT_TYPES = {
  ASSET: 'Asset',
  LIABILITY: 'Liability',
  EQUITY: 'Equity',
  REVENUE: 'Revenue',
  EXPENSE: 'Expense'
};

export const DEFAULT_CHART_OF_ACCOUNTS = [
  { code: '1000', name: 'Cash and Operating Bank Accounts', type: ACCOUNT_TYPES.ASSET, category: 'Current Asset' },
  { code: '1100', name: 'Accounts Receivable (A/R)', type: ACCOUNT_TYPES.ASSET, category: 'Current Asset' },
  { code: '1200', name: 'Prepaid Expenses & Advances', type: ACCOUNT_TYPES.ASSET, category: 'Current Asset' },
  { code: '1500', name: 'Property, Plant & Equipment', type: ACCOUNT_TYPES.ASSET, category: 'Fixed Asset' },
  { code: '2000', name: 'Accounts Payable (A/P)', type: ACCOUNT_TYPES.LIABILITY, category: 'Current Liability' },
  { code: '2100', name: 'Accrued Payroll & Taxes', type: ACCOUNT_TYPES.LIABILITY, category: 'Current Liability' },
  { code: '2200', name: 'Client Retainers & Unearned Revenue', type: ACCOUNT_TYPES.LIABILITY, category: 'Current Liability' },
  { code: '3000', name: 'Common Stock & Owner Capital', type: ACCOUNT_TYPES.EQUITY, category: 'Equity' },
  { code: '3100', name: 'Retained Earnings', type: ACCOUNT_TYPES.EQUITY, category: 'Equity' },
  { code: '4000', name: 'Operating Sales & Service Income', type: ACCOUNT_TYPES.REVENUE, category: 'Operating Revenue' },
  { code: '4100', name: 'Consulting & Professional Fees', type: ACCOUNT_TYPES.REVENUE, category: 'Operating Revenue' },
  { code: '5000', name: 'Payroll & Compensation Expenses', type: ACCOUNT_TYPES.EXPENSE, category: 'Operating Expense' },
  { code: '5100', name: 'Rent, Facilities & Utilities', type: ACCOUNT_TYPES.EXPENSE, category: 'Operating Expense' },
  { code: '5200', name: 'Software, Subscriptions & Tech', type: ACCOUNT_TYPES.EXPENSE, category: 'Operating Expense' },
  { code: '5300', name: 'Legal, Accounting & Professional Fees', type: ACCOUNT_TYPES.EXPENSE, category: 'Operating Expense' }
];

export const GeneralLedgerService = {
  /**
   * Seed standard Chart of Accounts for a tenant if none exist
   */
  async seedChartOfAccounts(companyId) {
    if (!companyId) return [];

    const { data: existing } = await supabase
      .from('fin_accounts')
      .select('id')
      .eq('company_id', companyId)
      .limit(1);

    if (existing && existing.length > 0) {
      return this.getAccounts(companyId);
    }

    const payloads = DEFAULT_CHART_OF_ACCOUNTS.map(acc => ({
      company_id: companyId,
      account_code: acc.code,
      name: acc.name,
      account_type: acc.type,
      category: acc.category,
      is_active: true
    }));

    const { data, error } = await supabase
      .from('fin_accounts')
      .insert(payloads)
      .select();

    if (error) {
      console.warn('[GeneralLedgerService] Seed error:', error.message);
    }
    return data || [];
  },

  /**
   * Retrieve accounts list for a tenant
   */
  async getAccounts(companyId) {
    if (!companyId) return [];

    const { data, error } = await supabase
      .from('fin_accounts')
      .select('*')
      .eq('company_id', companyId)
      .order('account_code', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Post a double-entry journal with strict mathematical balancing
   * 
   * @param {string} companyId - Tenant company UUID
   * @param {object} entryData - Header data (memo, entry_date, period, source_document_type, etc.)
   * @param {Array} lines - Array of { account_id, line_type: 'debit'|'credit', amount: number, party_id?: string }
   * @param {string} postedBy - User profile UUID
   */
  async postJournalEntry(companyId, entryData, lines = [], postedBy = null) {
    if (!companyId || !entryData.memo) {
      throw new Error('companyId and memo are required to post a journal entry.');
    }

    if (!Array.isArray(lines) || lines.length < 2) {
      throw new Error('A double-entry journal requires at least two lines (at least one debit and one credit).');
    }

    // Mathematical Double-Entry Balancing Verification
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      const amt = Number(line.amount);
      if (isNaN(amt) || amt <= 0) {
        throw new Error(`Invalid line amount: ${line.amount}. All journal line amounts must be strictly positive.`);
      }
      if (line.line_type === 'debit') totalDebit += amt;
      else if (line.line_type === 'credit') totalCredit += amt;
      else throw new Error(`Invalid line_type: ${line.line_type}. Must be 'debit' or 'credit'.`);
    }

    // Fix floating point precision to 2 decimal places
    const diff = Math.abs(Math.round(totalDebit * 100) - Math.round(totalCredit * 100)) / 100;
    if (diff > 0.001) {
      throw new Error(`Accounting Invariant Violation: Total Debits ($${totalDebit.toFixed(2)}) must equal Total Credits ($${totalCredit.toFixed(2)}). Discrepancy: $${diff.toFixed(2)}.`);
    }

    const entryNumber = entryData.entry_number || `JE-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const period = entryData.period || nowIso.slice(0, 7); // 'YYYY-MM'

    // 1. Insert Header
    const { data: header, error: headerError } = await supabase
      .from('fin_journal_entries')
      .insert({
        company_id: companyId,
        entry_number: entryNumber,
        entry_date: entryData.entry_date || nowIso.slice(0, 10),
        period: period,
        memo: entryData.memo,
        status: 'posted',
        total_amount: totalDebit,
        source_document_type: entryData.source_document_type || 'manual_journal',
        source_document_id: entryData.source_document_id || null,
        posted_by: postedBy,
        posted_at: nowIso
      })
      .select()
      .single();

    if (headerError) {
      throw new Error(`Failed to post journal entry: ${headerError.message}`);
    }

    // 2. Insert Lines
    const linePayloads = lines.map(line => ({
      company_id: companyId,
      journal_entry_id: header.id,
      account_id: line.account_id,
      party_id: line.party_id || null,
      line_type: line.line_type,
      amount: Number(line.amount),
      description: line.description || entryData.memo
    }));

    const { error: lineError } = await supabase
      .from('fin_journal_lines')
      .insert(linePayloads);

    if (lineError) {
      // Revert header if line insertion failed
      await supabase.from('fin_journal_entries').delete().eq('id', header.id);
      throw new Error(`Failed to insert journal lines: ${lineError.message}`);
    }

    // 3. Publish outbox event
    await EventService.publishEvent(
      companyId,
      'finance.journal.posted',
      'journal_entry',
      header.id,
      { entry_number: entryNumber, total_amount: totalDebit, memo: entryData.memo }
    );

    return header;
  },

  /**
   * Reverse an existing posted journal entry with an immutable reversing entry
   */
  async reverseJournalEntry(companyId, entryId, reason = 'Entry Reversal', reversedBy = null) {
    if (!companyId || !entryId) throw new Error('companyId and entryId are required.');

    // Fetch original entry
    const { data: original, error: origError } = await supabase
      .from('fin_journal_entries')
      .select('*, fin_journal_lines (*)')
      .eq('id', entryId)
      .eq('company_id', companyId)
      .single();

    if (origError || !original) {
      throw new Error(`Original journal entry '${entryId}' not found.`);
    }

    if (original.status === 'reversed') {
      throw new Error(`Journal entry #${original.entry_number} is already reversed.`);
    }

    // Create inverted lines (swap debits and credits)
    const reversedLines = original.fin_journal_lines.map(line => ({
      account_id: line.account_id,
      party_id: line.party_id,
      line_type: line.line_type === 'debit' ? 'credit' : 'debit',
      amount: line.amount,
      description: `Reversal: ${line.description || original.memo}`
    }));

    const reversingEntry = await this.postJournalEntry(
      companyId,
      {
        memo: `Reversal of #${original.entry_number}: ${reason}`,
        source_document_type: 'reversal',
        source_document_id: original.id,
        reversal_of_entry_id: original.id
      },
      reversedLines,
      reversedBy
    );

    // Mark original as reversed
    await supabase
      .from('fin_journal_entries')
      .update({ status: 'reversed', updated_at: new Date().toISOString() })
      .eq('id', entryId)
      .eq('company_id', companyId);

    return reversingEntry;
  },

  /**
   * Calculate Trial Balance from posted journal lines
   */
  async getTrialBalance(companyId) {
    if (!companyId) return { accounts: [], totalDebits: 0, totalCredits: 0, isBalanced: true };

    const { data: accounts } = await supabase
      .from('fin_accounts')
      .select('id, account_code, name, account_type, category')
      .eq('company_id', companyId)
      .order('account_code', { ascending: true });

    const { data: lines } = await supabase
      .from('fin_journal_lines')
      .select('account_id, line_type, amount, fin_journal_entries!inner(status)')
      .eq('company_id', companyId)
      .eq('fin_journal_entries.status', 'posted');

    const accountTotals = {};
    (accounts || []).forEach(acc => {
      accountTotals[acc.id] = { ...acc, debit: 0, credit: 0, balance: 0 };
    });

    (lines || []).forEach(l => {
      if (accountTotals[l.account_id]) {
        const amt = Number(l.amount);
        if (l.line_type === 'debit') accountTotals[l.account_id].debit += amt;
        else if (l.line_type === 'credit') accountTotals[l.account_id].credit += amt;
      }
    });

    let sumDebits = 0;
    let sumCredits = 0;

    const reportRows = Object.values(accountTotals).map(acc => {
      sumDebits += acc.debit;
      sumCredits += acc.credit;
      // Normal balance: Asset/Expense = Debit - Credit, Liab/Equity/Rev = Credit - Debit
      const isDebitNormal = acc.account_type === 'Asset' || acc.account_type === 'Expense';
      acc.balance = isDebitNormal ? (acc.debit - acc.credit) : (acc.credit - acc.debit);
      return acc;
    });

    const isBalanced = Math.abs(Math.round(sumDebits * 100) - Math.round(sumCredits * 100)) === 0;

    return {
      accounts: reportRows,
      totalDebits: sumDebits,
      totalCredits: sumCredits,
      isBalanced
    };
  }
};
