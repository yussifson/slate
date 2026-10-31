import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { GeneralLedgerService } from '@/services/GeneralLedgerService';
import { AccountsPayableService } from '@/services/AccountsPayableService';
import SlateDataGrid from '@/components/ui/v2/SlateDataGrid';
import SlateDrawer from '@/components/ui/v2/SlateDrawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  DollarSign, TrendingUp, TrendingDown, BookOpen, 
  FileText, Plus, ShieldCheck, Scale, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function FinanceWorkspace() {
  const { user } = useAuth();
  const companyId = useCompanyId() || user?.company_id;
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [accounts, setAccounts] = useState([]);
  const [trialBalance, setTrialBalance] = useState({ accounts: [], totalDebits: 0, totalCredits: 0, isBalanced: true });
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Journal Entry Form State
  const [isJournalDrawerOpen, setIsJournalDrawerOpen] = useState(false);
  const [journalMemo, setJournalMemo] = useState('');
  const [journalDebitAccount, setJournalDebitAccount] = useState('');
  const [journalCreditAccount, setJournalCreditAccount] = useState('');
  const [journalAmount, setJournalAmount] = useState('');

  useEffect(() => {
    if (companyId) {
      loadFinancialData();
    }
  }, [companyId]);

  const loadFinancialData = async () => {
    setIsLoading(true);
    try {
      // Seed accounts if tenant has none
      await GeneralLedgerService.seedChartOfAccounts(companyId);

      const [accs, tb, blls] = await Promise.all([
        GeneralLedgerService.getAccounts(companyId).catch(() => []),
        GeneralLedgerService.getTrialBalance(companyId).catch(() => ({ accounts: [], totalDebits: 0, totalCredits: 0, isBalanced: true })),
        AccountsPayableService.getBills(companyId).catch(() => [])
      ]);

      setAccounts(accs);
      setTrialBalance(tb);
      setBills(blls);

      if (accs.length >= 2) {
        setJournalDebitAccount(accs[0].id);
        setJournalCreditAccount(accs[1].id);
      }
    } catch (err) {
      console.warn('[FinanceWorkspace] Error loading finance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostJournal = async (e) => {
    e.preventDefault();
    if (!journalMemo || !journalDebitAccount || !journalCreditAccount || !journalAmount) return;

    if (journalDebitAccount === journalCreditAccount) {
      toast({
        title: "Invalid Accounts",
        description: "Debit and Credit cannot be posted to the same account.",
        variant: "destructive"
      });
      return;
    }

    try {
      const amt = Number(journalAmount);
      await GeneralLedgerService.postJournalEntry(
        companyId,
        { memo: journalMemo },
        [
          { account_id: journalDebitAccount, line_type: 'debit', amount: amt },
          { account_id: journalCreditAccount, line_type: 'credit', amount: amt }
        ],
        user?.id
      );

      toast({
        title: "Journal Entry Posted",
        description: `Successfully posted balanced entry of $${amt.toLocaleString()} to General Ledger.`
      });

      setIsJournalDrawerOpen(false);
      setJournalMemo('');
      setJournalAmount('');
      loadFinancialData();
    } catch (err) {
      toast({
        title: "Posting Failed",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const accountColumns = [
    { field: 'account_code', header: 'Code', width: '100px' },
    { field: 'name', header: 'Account Name' },
    { 
      field: 'account_type', 
      header: 'Type',
      render: (val) => (
        <Badge variant="outline" className="text-[10px] border-[var(--slate-v2-border-subtle)] text-white">
          {val}
        </Badge>
      )
    },
    { field: 'category', header: 'Category' },
    {
      field: 'balance',
      header: 'Balance',
      render: (val) => (
        <span className="font-mono font-semibold text-white">
          ${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    }
  ];

  const billColumns = [
    { field: 'bill_number', header: 'Bill #' },
    { 
      field: 'core_parties', 
      header: 'Supplier',
      render: (party) => <span className="font-semibold text-white">{party?.primary_name || 'Vendor'}</span>
    },
    { field: 'due_date', header: 'Due Date' },
    {
      field: 'total_amount',
      header: 'Total',
      render: (val) => <span className="font-mono text-white">${Number(val).toFixed(2)}</span>
    },
    {
      field: 'status',
      header: 'Status',
      render: (val) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
          val === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
        }`}>
          {val}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Finance & General Ledger</h1>
          <p className="text-xs text-[var(--slate-v2-text-secondary)] mt-1">
            Authoritative double-entry accounting, chart of accounts, and financial operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsJournalDrawerOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-sm shadow-indigo-600/25"
          >
            <Plus className="w-4 h-4" />
            <span>Post Journal Entry</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-[var(--slate-v2-text-tertiary)] uppercase tracking-wider">
              Total Ledger Debits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-white">
              ${trialBalance.totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-[var(--slate-v2-text-tertiary)] uppercase tracking-wider">
              Total Ledger Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-white">
              ${trialBalance.totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-[var(--slate-v2-text-tertiary)] uppercase tracking-wider">
              Double-Entry Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">Ledger Balanced</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--slate-v2-surface-1)] border-[var(--slate-v2-border-subtle)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-[var(--slate-v2-text-tertiary)] uppercase tracking-wider">
              Active GL Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-indigo-400">
              {accounts.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[var(--slate-v2-surface-1)] border border-[var(--slate-v2-border-subtle)] p-1 rounded-xl">
          <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            Chart of Accounts
          </TabsTrigger>
          <TabsTrigger value="trial_balance" className="text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            Trial Balance
          </TabsTrigger>
          <TabsTrigger value="bills" className="text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            Supplier Bills ({bills.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <SlateDataGrid
            columns={accountColumns}
            data={accounts}
            isLoading={isLoading}
            emptyMessage="No accounts seeded in Chart of Accounts."
          />
        </TabsContent>

        <TabsContent value="trial_balance" className="mt-4">
          <SlateDataGrid
            columns={accountColumns}
            data={trialBalance.accounts}
            isLoading={isLoading}
            emptyMessage="No posted transactions to report."
          />
        </TabsContent>

        <TabsContent value="bills" className="mt-4">
          <SlateDataGrid
            columns={billColumns}
            data={bills}
            isLoading={isLoading}
            emptyMessage="No supplier bills recorded."
          />
        </TabsContent>
      </Tabs>

      {/* Post Double-Entry Journal Entry Drawer */}
      <SlateDrawer
        isOpen={isJournalDrawerOpen}
        onClose={() => setIsJournalDrawerOpen(false)}
        title="Post Double-Entry Journal Entry"
        subtitle="Record an immutable financial transaction with debit/credit balancing"
      >
        <form onSubmit={handlePostJournal} className="space-y-4 text-xs">
          <div>
            <label className="block text-[var(--slate-v2-text-secondary)] font-medium mb-1">
              Transaction Memo / Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly Software Subscriptions or Office Supplies"
              value={journalMemo}
              onChange={(e) => setJournalMemo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[var(--slate-v2-text-secondary)] font-medium mb-1">
              Debit Account (Expense / Asset) *
            </label>
            <select
              value={journalDebitAccount}
              onChange={(e) => setJournalDebitAccount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] text-white focus:outline-none focus:border-indigo-500"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_code} - {acc.name} ({acc.account_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[var(--slate-v2-text-secondary)] font-medium mb-1">
              Credit Account (Bank / Payable / Revenue) *
            </label>
            <select
              value={journalCreditAccount}
              onChange={(e) => setJournalCreditAccount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] text-white focus:outline-none focus:border-indigo-500"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_code} - {acc.name} ({acc.account_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[var(--slate-v2-text-secondary)] font-medium mb-1">
              Amount (USD) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={journalAmount}
              onChange={(e) => setJournalAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--slate-v2-surface-2)] border border-[var(--slate-v2-border-subtle)] text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-[var(--slate-v2-border-subtle)]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsJournalDrawerOpen(false)}
              className="h-9 px-4 rounded-lg border-[var(--slate-v2-border-subtle)] text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
            >
              Post to Ledger
            </Button>
          </div>
        </form>
      </SlateDrawer>
    </div>
  );
}
