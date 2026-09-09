import React, { useState, useEffect } from 'react';
import { powerSync } from '@/api/PowerSyncConnector';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import {
  ACCOUNT_TYPES,
  seedDefaultAccountsIfEmpty,
  postJournalEntry,
  reverseJournalEntry,
} from '@/api/glEngine';
import {
  BookOpen,
  Plus,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  History,
  Layers,
  Trash2,
  XCircle,
  Loader2,
  FolderTree,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function UnivGeneralLedger() {
  const companyId = useCompanyId();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts' | 'entries' | 'audit'

  // Chart of Accounts State
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountSearch, setAccountSearch] = useState('');
  const [accountFilterType, setAccountFilterType] = useState('ALL');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountForm, setAccountForm] = useState({
    code: '',
    name: '',
    type: ACCOUNT_TYPES.ASSET,
    parent_id: '',
    description: '',
  });

  // Journal Entries State
  const [journalEntries, setJournalEntries] = useState([]);
  const [lineItems, setLineItems] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [entrySearch, setEntrySearch] = useState('');
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null); // For viewing line item details

  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    lines: [
      { accountId: '', debit: '', credit: '', description: '' },
      { accountId: '', debit: '', credit: '', description: '' },
    ],
  });

  // Audit Trail State
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(true);

  // Reversal Modal State
  const [reversalModalOpen, setReversalModalOpen] = useState(false);
  const [reversalTarget, setReversalTarget] = useState(null);
  const [reversalReason, setReversalReason] = useState('');
  const [isReversing, setIsReversing] = useState(false);

  useEffect(() => {
    if (companyId) {
      initData();
    }
  }, [companyId]);

  const initData = async () => {
    await seedDefaultAccountsIfEmpty(companyId);
    fetchAccounts();
    fetchJournalEntries();
    fetchAuditTrail();
  };

  // --- FETCHERS ---
  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await powerSync.execute(
        'SELECT * FROM gl_accounts WHERE company_id = ? ORDER BY code ASC',
        [companyId]
      );
      const data = res.rows ? (res.rows._array || Array.from(res.rows)) : [];
      setAccounts(data);
    } catch (err) {
      console.error('[UnivGeneralLedger] Fetch accounts error:', err);
      toast.error('Failed to load Chart of Accounts');
    } finally {
      setLoadingAccounts(false);
    }
  };

  const fetchJournalEntries = async () => {
    setLoadingEntries(true);
    try {
      const resEntries = await powerSync.execute(
        'SELECT * FROM gl_journal_entries WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      const entries = resEntries.rows ? (resEntries.rows._array || Array.from(resEntries.rows)) : [];

      const resLines = await powerSync.execute(
        'SELECT * FROM gl_journal_line_items WHERE company_id = ?',
        [companyId]
      );
      const lines = resLines.rows ? (resLines.rows._array || Array.from(resLines.rows)) : [];

      setJournalEntries(entries);
      setLineItems(lines);
    } catch (err) {
      console.error('[UnivGeneralLedger] Fetch entries error:', err);
      toast.error('Failed to load journal entries');
    } finally {
      setLoadingEntries(false);
    }
  };

  const fetchAuditTrail = async () => {
    setLoadingAudit(true);
    try {
      const res = await powerSync.execute(
        'SELECT * FROM gl_audit_trail WHERE company_id = ? ORDER BY performed_at DESC',
        [companyId]
      );
      const data = res.rows ? (res.rows._array || Array.from(res.rows)) : [];
      setAuditLogs(data);
    } catch (err) {
      console.error('[UnivGeneralLedger] Fetch audit error:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  // --- CHART OF ACCOUNTS ACTIONS ---
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!accountForm.code || !accountForm.name) {
      toast.error('Account Code and Name are required');
      return;
    }
    const now = new Date().toISOString();
    try {
      await powerSync.execute(
        `INSERT INTO gl_accounts (id, company_id, code, name, type, parent_id, is_active, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          companyId,
          accountForm.code.trim(),
          accountForm.name.trim(),
          accountForm.type,
          accountForm.parent_id || null,
          accountForm.description || '',
          now,
          now,
        ]
      );
      toast.success('Account created successfully');
      setIsAccountModalOpen(false);
      setAccountForm({ code: '', name: '', type: ACCOUNT_TYPES.ASSET, parent_id: '', description: '' });
      fetchAccounts();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to create account');
    }
  };

  const toggleAccountActive = async (acc) => {
    const newStatus = acc.is_active ? 0 : 1;
    try {
      await powerSync.execute('UPDATE gl_accounts SET is_active = ?, updated_at = ? WHERE id = ?', [
        newStatus,
        new Date().toISOString(),
        acc.id,
      ]);
      toast.success(`Account ${newStatus ? 'enabled' : 'disabled'}`);
      fetchAccounts();
    } catch {
      toast.error('Failed to toggle account status');
    }
  };

  // --- JOURNAL ENTRY ACTIONS ---
  const handleAddLineItem = () => {
    setEntryForm((prev) => ({
      ...prev,
      lines: [...prev.lines, { accountId: '', debit: '', credit: '', description: '' }],
    }));
  };

  const handleRemoveLineItem = (index) => {
    if (entryForm.lines.length <= 2) {
      toast.error('Journal Entry must contain at least 2 line items.');
      return;
    }
    setEntryForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  };

  const handleLineChange = (index, field, value) => {
    setEntryForm((prev) => {
      const updated = [...prev.lines];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, lines: updated };
    });
  };

  const calculateTotals = () => {
    const totalDebit = entryForm.lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    const totalCredit = entryForm.lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) <= 0.001 && totalDebit > 0;
    return { totalDebit, totalCredit, isBalanced, difference: Math.abs(totalDebit - totalCredit) };
  };

  const handlePostEntry = async (e) => {
    e.preventDefault();
    const { isBalanced } = calculateTotals();
    if (!isBalanced) {
      toast.error('Unbalanced entry! Debits must equal credits before posting.');
      return;
    }

    setIsPosting(true);
    try {
      await postJournalEntry({
        companyId,
        date: entryForm.date,
        description: entryForm.description,
        reference: entryForm.reference,
        postedBy: user?.email || 'System User',
        lines: entryForm.lines,
      });

      toast.success('Journal Entry posted successfully!');
      setIsEntryModalOpen(false);
      setEntryForm({
        date: new Date().toISOString().split('T')[0],
        description: '',
        reference: '',
        lines: [
          { accountId: '', debit: '', credit: '', description: '' },
          { accountId: '', debit: '', credit: '', description: '' },
        ],
      });
      fetchJournalEntries();
      fetchAuditTrail();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to post entry');
    } finally {
      setIsPosting(false);
    }
  };

  // --- REVERSAL ACTIONS ---
  const handleOpenReversal = (entry) => {
    setReversalTarget(entry);
    setReversalReason('');
    setReversalModalOpen(true);
  };

  const handleExecuteReversal = async (e) => {
    e.preventDefault();
    if (!reversalTarget) return;

    setIsReversing(true);
    try {
      await reverseJournalEntry({
        companyId,
        originalEntryId: reversalTarget.id,
        reversedBy: user?.email || 'System User',
        reason: reversalReason,
      });

      toast.success(`Entry ${reversalTarget.entry_number} reversed successfully!`);
      setReversalModalOpen(false);
      setReversalTarget(null);
      fetchJournalEntries();
      fetchAuditTrail();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Reversal failed');
    } finally {
      setIsReversing(false);
    }
  };

  // --- FILTERED DATA ---
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
      acc.code.toLowerCase().includes(accountSearch.toLowerCase());
    const matchesType = accountFilterType === 'ALL' || acc.type === accountFilterType;
    return matchesSearch && matchesType;
  });

  const filteredEntries = journalEntries.filter((entry) => {
    return (
      entry.entry_number.toLowerCase().includes(entrySearch.toLowerCase()) ||
      entry.description?.toLowerCase().includes(entrySearch.toLowerCase()) ||
      entry.reference?.toLowerCase().includes(entrySearch.toLowerCase())
    );
  });

  const { totalDebit, totalCredit, isBalanced, difference } = calculateTotals();

  return (
    <div className="h-full flex flex-col gap-6 p-6 bg-background overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2 tracking-[-0.02em]">
            <BookOpen className="w-7 h-7 text-primary" /> General Ledger & Chart of Accounts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Universal double-entry accounting engine, accounts, and immutable audit trail.
          </p>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex items-center bg-muted/60 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'accounts' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FolderTree className="w-4 h-4" /> Chart of Accounts
          </button>
          <button
            onClick={() => setActiveTab('entries')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'entries' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="w-4 h-4" /> Journal Entries
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'audit' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="w-4 h-4" /> Audit Trail
          </button>
        </div>
      </div>

      {/* TAB 1: CHART OF ACCOUNTS */}
      {activeTab === 'accounts' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="relative max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  placeholder="Search code or name..."
                  className="w-full h-9 pl-9 pr-4 bg-card border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 outline-none"
                />
              </div>
              <select
                value={accountFilterType}
                onChange={(e) => setAccountFilterType(e.target.value)}
                className="h-9 px-3 bg-card border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary/40 outline-none"
              >
                <option value="ALL">All Account Types</option>
                {Object.values(ACCOUNT_TYPES).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsAccountModalOpen(true)}
              className="h-9 px-4 bg-primary text-primary-foreground rounded-xl text-xs font-bold flex items-center gap-2 hover:opacity-90 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add New Account
            </button>
          </div>

          {loadingAccounts ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-2xl border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b text-xs text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-left">Code</th>
                    <th className="px-4 py-3 text-left">Account Name</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono font-bold text-xs">{acc.code}</td>
                      <td className="px-4 py-3 font-semibold">{acc.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            acc.type === ACCOUNT_TYPES.ASSET
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                              : acc.type === ACCOUNT_TYPES.LIABILITY
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                              : acc.type === ACCOUNT_TYPES.EQUITY
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                              : acc.type === ACCOUNT_TYPES.REVENUE
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                          }`}
                        >
                          {acc.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{acc.description || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            acc.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {acc.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => toggleAccountActive(acc)}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          {acc.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAccounts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                        No accounts found matching your query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: JOURNAL ENTRIES */}
      {activeTab === 'entries' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="relative max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={entrySearch}
                onChange={(e) => setEntrySearch(e.target.value)}
                placeholder="Search entries or ref..."
                className="w-full h-9 pl-9 pr-4 bg-card border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 outline-none"
              />
            </div>

            <button
              onClick={() => setIsEntryModalOpen(true)}
              className="h-9 px-4 bg-primary text-primary-foreground rounded-xl text-xs font-bold flex items-center gap-2 hover:opacity-90 shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Journal Entry
            </button>
          </div>

          {loadingEntries ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-2xl border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b text-xs text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-left">Entry #</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-left">Reference</th>
                    <th className="px-4 py-3 text-left">Posted By</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredEntries.map((entry) => {
                    const entryLines = lineItems.filter((l) => l.journal_entry_id === entry.id);
                    const totalAmount = entryLines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);

                    return (
                      <React.Fragment key={entry.id}>
                        <tr className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-mono font-bold text-xs">{entry.entry_number}</td>
                          <td className="px-4 py-3 text-xs">{entry.entry_date}</td>
                          <td className="px-4 py-3 font-medium text-xs max-w-xs truncate">{entry.description}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{entry.reference || '—'}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{entry.posted_by}</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                entry.status === 'posted'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                              }`}
                            >
                              {entry.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
                              className="px-2.5 py-1 text-xs font-semibold bg-muted rounded-lg hover:bg-muted/80"
                            >
                              {selectedEntry?.id === entry.id ? 'Hide Lines' : 'View Lines'}
                            </button>
                            {entry.status === 'posted' && (
                              <button
                                onClick={() => handleOpenReversal(entry)}
                                className="px-2.5 py-1 text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-lg hover:bg-rose-100 flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" /> Reverse
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Expandable Line Items */}
                        {selectedEntry?.id === entry.id && (
                          <tr className="bg-muted/20">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="rounded-xl border bg-card p-3">
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                  Line Items Details ({entryLines.length} lines)
                                </div>
                                <table className="w-full text-xs">
                                  <thead className="border-b bg-muted/40 font-semibold text-muted-foreground">
                                    <tr>
                                      <th className="px-3 py-2 text-left">Account</th>
                                      <th className="px-3 py-2 text-left">Line Description</th>
                                      <th className="px-3 py-2 text-right">Debit</th>
                                      <th className="px-3 py-2 text-right">Credit</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {entryLines.map((l) => {
                                      const acc = accounts.find((a) => a.id === l.account_id);
                                      return (
                                        <tr key={l.id}>
                                          <td className="px-3 py-2 font-mono">
                                            {acc ? `[${acc.code}] ${acc.name}` : l.account_id}
                                          </td>
                                          <td className="px-3 py-2 text-muted-foreground">{l.description}</td>
                                          <td className="px-3 py-2 text-right font-semibold">
                                            {l.debit > 0 ? `$${l.debit.toFixed(2)}` : '—'}
                                          </td>
                                          <td className="px-3 py-2 text-right font-semibold">
                                            {l.credit > 0 ? `$${l.credit.toFixed(2)}` : '—'}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                  <tfoot className="border-t font-bold bg-muted/30">
                                    <tr>
                                      <td colSpan={2} className="px-3 py-2 text-right">
                                        Total:
                                      </td>
                                      <td className="px-3 py-2 text-right">${totalAmount.toFixed(2)}</td>
                                      <td className="px-3 py-2 text-right">${totalAmount.toFixed(2)}</td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {filteredEntries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">
                        No journal entries recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="flex flex-col gap-4">
          <div className="text-xs text-muted-foreground">
            Immutability record: Posted entries cannot be modified or deleted. All reversals and postings are permanently logged below.
          </div>
          {loadingAudit ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-2xl border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b text-xs text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-left">Timestamp</th>
                    <th className="px-4 py-3 text-left">Action</th>
                    <th className="px-4 py-3 text-left">Performed By</th>
                    <th className="px-4 py-3 text-left">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {new Date(log.performed_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            log.action === 'POST'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-xs">{log.performed_by}</td>
                      <td className="px-4 py-3 text-xs">{log.details}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground text-sm">
                        No audit trail entries logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- MODAL: CREATE ACCOUNT --- */}
      <AnimatePresence>
        {isAccountModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card w-full max-w-md rounded-2xl border p-6 shadow-xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Add Chart of Account</h3>
                <button onClick={() => setIsAccountModalOpen(false)}>
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Account Code</label>
                  <input
                    required
                    type="text"
                    value={accountForm.code}
                    onChange={(e) => setAccountForm({ ...accountForm, code: e.target.value })}
                    placeholder="e.g. 1050"
                    className="w-full h-10 px-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Account Name</label>
                  <input
                    required
                    type="text"
                    value={accountForm.name}
                    onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                    placeholder="e.g. Petty Cash Account"
                    className="w-full h-10 px-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Account Type</label>
                  <select
                    value={accountForm.type}
                    onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
                    className="w-full h-10 px-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {Object.values(ACCOUNT_TYPES).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={accountForm.description}
                    onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })}
                    className="w-full p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAccountModalOpen(false)}
                    className="px-4 py-2 rounded-xl border text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
                    Create Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: NEW JOURNAL ENTRY --- */}
      <AnimatePresence>
        {isEntryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card w-full max-w-3xl rounded-2xl border p-6 shadow-xl my-8"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold">Create Manual Journal Entry</h3>
                  <p className="text-xs text-muted-foreground">Debits and credits must balance exactly before posting.</p>
                </div>
                <button onClick={() => setIsEntryModalOpen(false)}>
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handlePostEntry} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Date</label>
                    <input
                      required
                      type="date"
                      value={entryForm.date}
                      onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })}
                      className="w-full h-9 px-3 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Reference / Doc #</label>
                    <input
                      type="text"
                      placeholder="e.g. INV-9901"
                      value={entryForm.reference}
                      onChange={(e) => setEntryForm({ ...entryForm, reference: e.target.value })}
                      className="w-full h-9 px-3 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Posted By</label>
                    <input
                      disabled
                      type="text"
                      value={user?.email || 'System User'}
                      className="w-full h-9 px-3 border rounded-xl text-xs bg-muted text-muted-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Header Description</label>
                  <input
                    required
                    type="text"
                    placeholder="Brief summary of entry reason..."
                    value={entryForm.description}
                    onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })}
                    className="w-full h-9 px-3 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* Line Items Builder Table */}
                <div className="border rounded-xl p-3 bg-muted/10 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-muted-foreground">Journal Line Items</span>
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Line
                    </button>
                  </div>

                  <div className="space-y-2">
                    {entryForm.lines.map((line, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <select
                            required
                            value={line.accountId}
                            onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                            className="w-full h-9 px-2 border rounded-lg text-xs outline-none"
                          >
                            <option value="">Select Account...</option>
                            {accounts.map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                [{acc.code}] {acc.name} ({acc.type})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            placeholder="Line note (opt)"
                            value={line.description}
                            onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                            className="w-full h-9 px-2 border rounded-lg text-xs outline-none"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Debit ($)"
                            value={line.debit}
                            onChange={(e) => {
                              handleLineChange(idx, 'debit', e.target.value);
                              if (e.target.value) handleLineChange(idx, 'credit', ''); // Mutual exclusivity
                            }}
                            className="w-full h-9 px-2 border rounded-lg text-xs font-mono font-semibold text-right outline-none"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Credit ($)"
                            value={line.credit}
                            onChange={(e) => {
                              handleLineChange(idx, 'credit', e.target.value);
                              if (e.target.value) handleLineChange(idx, 'debit', ''); // Mutual exclusivity
                            }}
                            className="w-full h-9 px-2 border rounded-lg text-xs font-mono font-semibold text-right outline-none"
                          />
                        </div>
                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Balancing Footer */}
                  <div className="border-t pt-3 flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      {isBalanced ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Entry Balanced!
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> Unbalanced (Diff: ${difference.toFixed(2)})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-6 font-mono">
                      <span>Total Debit: ${totalDebit.toFixed(2)}</span>
                      <span>Total Credit: ${totalCredit.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEntryModalOpen(false)}
                    className="px-4 py-2 rounded-xl border text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isBalanced || isPosting}
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50 flex items-center gap-2"
                  >
                    {isPosting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Post Journal Entry
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: REVERSAL REASON --- */}
      <AnimatePresence>
        {reversalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card w-full max-w-md rounded-2xl border p-6 shadow-xl space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-rose-600 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5" /> Reverse Entry {reversalTarget?.entry_number}
                </h3>
                <button onClick={() => setReversalModalOpen(false)}>
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                In compliance with double-entry accounting rules, this entry cannot be deleted. Reversing it will generate an offsetting journal entry.
              </p>

              <form onSubmit={handleExecuteReversal} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Reason for Reversal</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Data entry error in amount, client refund issued..."
                    value={reversalReason}
                    onChange={(e) => setReversalReason(e.target.value)}
                    className="w-full p-3 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500/40"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReversalModalOpen(false)}
                    className="px-4 py-2 rounded-xl border text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isReversing}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center gap-2"
                  >
                    {isReversing && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Confirm Reversal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
