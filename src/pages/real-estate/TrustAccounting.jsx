import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, TrendingUp, Plus, ArrowUpRight, ArrowDownLeft, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RealEstateAPI } from '@/api/RealEstateAPI';
import { toast } from 'react-hot-toast';

export default function TrustAccounting() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [accounts, setAccounts] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [filteredLedger, setFilteredLedger] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [viewingHistoryId, setViewingHistoryId] = useState(null);
  const [accountFormData, setAccountFormData] = useState({
    accountName: '',
    accountType: 'operating',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountHolderName: '',
    currency: 'USD',
  });
  const [transactionFormData, setTransactionFormData] = useState({
    accountId: '',
    transactionType: 'deposit',
    amount: 0,
    description: '',
    referenceNumber: '',
    transactionDate: new Date().toISOString().split('T')[0],
  });

  // Fetch trust accounts and ledger
  useEffect(() => {
    const fetchData = async () => {
      try {
        const accountsRes = await powerSync.execute(
          'SELECT * FROM univ_re_trust_accounts WHERE company_id = ? ORDER BY created_at DESC',
          [companyId]
        );
        const ledgerRes = await powerSync.execute(
          'SELECT * FROM univ_re_trust_ledger WHERE company_id = ? ORDER BY transaction_date DESC',
          [companyId]
        );
        setAccounts(accountsRes.rows._array || Array.from(accountsRes.rows));
        setLedger(ledgerRes.rows._array || Array.from(ledgerRes.rows));
      } catch (e) {
        console.error('[TrustAccounting] Fetch failed:', e);
        toast.error('Failed to load trust accounting data');
      }
      setIsLoading(false);
    };

    if (companyId) fetchData();
  }, [companyId]);

  // Filter ledger transactions
  useEffect(() => {
    let filtered = ledger;
    if (search) {
      filtered = filtered.filter(t =>
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.reference_number?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.transaction_type === typeFilter);
    }
    setFilteredLedger(filtered);
  }, [ledger, search, typeFilter]);

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAccountId) {
        await RealEstateAPI.updateTrustAccount(companyId, editingAccountId, accountFormData, user.id);
        toast.success('Trust account updated successfully');
      } else {
        await RealEstateAPI.createTrustAccount(companyId, accountFormData, user.id);
        toast.success('Trust account created successfully');
      }
      setShowAccountForm(false);
      setEditingAccountId(null);
      setAccountFormData({
        accountName: '',
        accountType: 'operating',
        bankName: '',
        accountNumber: '',
        routingNumber: '',
        accountHolderName: '',
        currency: 'USD',
      });

      const accountsRes = await powerSync.execute(
        'SELECT * FROM univ_re_trust_accounts WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setAccounts(accountsRes.rows._array || Array.from(accountsRes.rows));
    } catch (e) {
      console.error('[TrustAccounting] Account submit failed:', e);
      toast.error('Failed to save trust account');
    }
  };

  const handleEditAccount = (account) => {
    setAccountFormData({
      accountName: account.account_name || '',
      accountType: account.account_type || 'operating',
      bankName: account.bank_name || '',
      accountNumber: account.account_number || '',
      routingNumber: account.routing_number || '',
      accountHolderName: account.account_holder_name || '',
      currency: account.currency || 'USD',
    });
    setEditingAccountId(account.id);
    setShowAccountForm(true);
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trust account?')) return;
    try {
      await RealEstateAPI.deleteTrustAccount(companyId, id, user.id);
      toast.success('Trust account deleted successfully');
      setAccounts(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error('[TrustAccounting] Delete account failed:', e);
      toast.error('Failed to delete trust account');
    }
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    try {
      const amount = Number(transactionFormData.amount);
      if (editingTransactionId) {
        await RealEstateAPI.updateTrustLedgerEntry(companyId, editingTransactionId, transactionFormData, user.id);
        toast.success('Transaction updated successfully');
      } else {
        await RealEstateAPI.createTrustLedgerEntry(companyId, transactionFormData, user.id);
        toast.success('Transaction recorded successfully');
        
        // Optimistically update the local account balance
        const balanceAdjustment = transactionFormData.transactionType === 'deposit' || transactionFormData.transactionType === 'transfer' ? amount : -amount;
        setAccounts(prev => prev.map(acc => {
          if (acc.id === transactionFormData.accountId) {
            return { ...acc, balance: (acc.balance || 0) + balanceAdjustment };
          }
          return acc;
        }));
      }
      setShowTransactionForm(false);
      setEditingTransactionId(null);
      setTransactionFormData({
        accountId: '',
        transactionType: 'deposit',
        amount: 0,
        description: '',
        referenceNumber: '',
        transactionDate: new Date().toISOString().split('T')[0],
      });

      const ledgerRes = await powerSync.execute(
        'SELECT * FROM univ_re_trust_ledger WHERE company_id = ? ORDER BY transaction_date DESC',
        [companyId]
      );
      setLedger(ledgerRes.rows._array || Array.from(ledgerRes.rows));
    } catch (e) {
      console.error('[TrustAccounting] Submit failed:', e);
      toast.error('Failed to save transaction');
    }
  };

  const handleEditTransaction = (transaction) => {
    setTransactionFormData({
      accountId: transaction.account_id || '',
      transactionType: transaction.transaction_type || 'deposit',
      amount: transaction.amount || 0,
      description: transaction.description || '',
      referenceNumber: transaction.reference_number || '',
      transactionDate: new Date(transaction.transaction_date).toISOString().split('T')[0],
    });
    setEditingTransactionId(transaction.id);
    setShowTransactionForm(true);
  };

  // Calculate KPIs
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const totalDeposits = ledger
    .filter(t => t.transaction_type === 'deposit')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalWithdrawals = ledger
    .filter(t => t.transaction_type === 'withdrawal')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trust Accounting</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage trust accounts, escrow, and ledger transactions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAccountForm(true)} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" /> Create Account
          </Button>
          <Button onClick={() => { setShowTransactionForm(true); setEditingTransactionId(null); }} className="gap-2">
            <Plus className="w-4 h-4" /> Record Transaction
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">{accounts.length} accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4" />
              Total Deposits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">Recorded transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4" />
              Total Withdrawals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">Released funds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ledger.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          Trust Accounts
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'ledger' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          Ledger Transactions
        </button>
      </div>

      {/* Trust Accounts Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.length === 0 ? (
            <Card className="text-center col-span-full py-16 border-dashed bg-slate-50/50 dark:bg-slate-900/30">
              <Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-30" />
              <p className="text-muted-foreground text-lg font-medium">No trust accounts configured</p>
              <Button onClick={() => setShowAccountForm(true)} variant="outline" className="mt-6 gap-2 rounded-full">
                <Plus className="w-4 h-4" /> Add Your First Account
              </Button>
            </Card>
          ) : (
            accounts.map(account => (
              <Card key={account.id} className="group overflow-hidden border-transparent shadow-sm hover:shadow-xl hover:-translate-y-1 dark:border-white/10 dark:bg-slate-900/50 bg-white/70 backdrop-blur-md transition-all duration-300 flex flex-col">
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                          <Wallet className="w-4 h-4" />
                        </div>
                        {account.account_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-2 font-medium capitalize">{account.account_type} Account</p>
                    </div>
                    <Badge variant={account.reconciliation_status === 'reconciled' ? 'default' : 'secondary'} className="shadow-sm">
                      {account.reconciliation_status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 flex-1 flex flex-col">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-900/10 rounded-xl border border-blue-100/50 dark:border-blue-800/30">
                    <p className="text-xs text-blue-600/70 dark:text-blue-400/70 font-semibold uppercase tracking-wider mb-1">Current Balance</p>
                    <p className="text-3xl font-extrabold text-blue-700 dark:text-blue-400 tracking-tight">
                      ${(account.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm flex-1">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Bank</p>
                      <p className="font-semibold text-foreground line-clamp-1">{account.bank_name}</p>
                    </div>
                    {account.account_number && (
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Account #</p>
                        <p className="font-mono text-sm font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded w-fit">
                          ****{account.account_number.slice(-4)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 mt-auto border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button size="sm" variant="outline" className="flex-1 transition-colors dark:hover:bg-white/5 dark:border-white/10" onClick={() => setViewingHistoryId(account.id)}>
                      <Eye className="w-4 h-4 mr-1" /> History
                    </Button>
                    <Button size="sm" variant="outline" className="transition-colors dark:hover:bg-white/5 dark:border-white/10" onClick={() => handleEditAccount(account)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 transition-colors" onClick={() => handleDeleteAccount(account.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Ledger Tab */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by description, reference..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="withdrawal">Withdrawals</SelectItem>
                <SelectItem value="transfer">Transfers</SelectItem>
                <SelectItem value="fee">Fees</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transactions Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Type</th>
                    <th className="text-left py-3 px-4 font-medium">Description</th>
                    <th className="text-right py-3 px-4 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 font-medium">Reference</th>
                    <th className="text-center py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-muted-foreground">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map(entry => (
                      <tr key={entry.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">{new Date(entry.transaction_date).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <Badge variant={entry.transaction_type === 'deposit' ? 'default' : 'secondary'}>
                            {entry.transaction_type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{entry.description}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={entry.transaction_type === 'deposit' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                            ${(entry.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">{entry.reference_number || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleEditTransaction(entry)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Create Trust Account Modal */}
      <Sheet open={showAccountForm} onOpenChange={setShowAccountForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create Trust Account</SheetTitle>
            <SheetDescription>Add a new trust account for holding client funds</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleAccountSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium">Account Name</label>
              <Input
                value={accountFormData.accountName}
                onChange={(e) => setAccountFormData({ ...accountFormData, accountName: e.target.value })}
                placeholder="e.g., Client Trust Account A"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Account Type</label>
                <Select value={accountFormData.accountType} onValueChange={(value) => setAccountFormData({ ...accountFormData, accountType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operating">Operating</SelectItem>
                    <SelectItem value="escrow">Escrow</SelectItem>
                    <SelectItem value="commission">Commission</SelectItem>
                    <SelectItem value="reserve">Reserve</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Currency</label>
                <Input
                  value={accountFormData.currency}
                  onChange={(e) => setAccountFormData({ ...accountFormData, currency: e.target.value })}
                  placeholder="USD"
                  maxLength="3"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Bank Name</label>
              <Input
                value={accountFormData.bankName}
                onChange={(e) => setAccountFormData({ ...accountFormData, bankName: e.target.value })}
                placeholder="Bank name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Account Number</label>
                <Input
                  value={accountFormData.accountNumber}
                  onChange={(e) => setAccountFormData({ ...accountFormData, accountNumber: e.target.value })}
                  placeholder="****1234"
                  type="password"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Routing Number</label>
                <Input
                  value={accountFormData.routingNumber}
                  onChange={(e) => setAccountFormData({ ...accountFormData, routingNumber: e.target.value })}
                  placeholder="Routing #"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Account Holder Name</label>
              <Input
                value={accountFormData.accountHolderName}
                onChange={(e) => setAccountFormData({ ...accountFormData, accountHolderName: e.target.value })}
                placeholder="Full name"
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Create Account
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowAccountForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Transaction Form Modal */}
      <Sheet open={showTransactionForm} onOpenChange={setShowTransactionForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingTransactionId ? 'Edit Transaction' : 'Record Transaction'}</SheetTitle>
            <SheetDescription>Add a new trust accounting transaction</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleTransactionSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium">Trust Account</label>
              <Select value={transactionFormData.accountId} onValueChange={(value) => setTransactionFormData({ ...transactionFormData, accountId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Transaction Type</label>
                <Select value={transactionFormData.transactionType} onValueChange={(value) => setTransactionFormData({ ...transactionFormData, transactionType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="fee">Fee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={transactionFormData.transactionDate}
                  onChange={(e) => setTransactionFormData({ ...transactionFormData, transactionDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Amount ($)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={transactionFormData.amount}
                onChange={(e) => setTransactionFormData({ ...transactionFormData, amount: parseFloat(e.target.value) })}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={transactionFormData.description}
                onChange={(e) => setTransactionFormData({ ...transactionFormData, description: e.target.value })}
                placeholder="Details about this transaction..."
                className="w-full p-2 border rounded text-sm"
                rows="3"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Reference Number</label>
              <Input
                value={transactionFormData.referenceNumber}
                onChange={(e) => setTransactionFormData({ ...transactionFormData, referenceNumber: e.target.value })}
                placeholder="e.g., Check #, Wire confirmation"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingTransactionId ? 'Update Transaction' : 'Record Transaction'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowTransactionForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* History Modal */}
      <Sheet open={!!viewingHistoryId} onOpenChange={(open) => !open && setViewingHistoryId(null)}>
        <SheetContent className="w-full max-w-lg overflow-y-auto sm:max-w-xl">
          <SheetHeader className="mb-6">
            <SheetTitle>Transaction History</SheetTitle>
            <SheetDescription>
              {accounts.find(a => a.id === viewingHistoryId)?.account_name || 'Account'} Ledger
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4">
            {ledger.filter(t => t.account_id === viewingHistoryId).length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed">
                <p className="text-muted-foreground">No transactions recorded yet.</p>
              </div>
            ) : (
              <div className="relative border-l border-border ml-3 space-y-6">
                {ledger.filter(t => t.account_id === viewingHistoryId).map(entry => (
                  <div key={entry.id} className="relative pl-6">
                    <span className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background ring-4 ring-background ${
                      entry.transaction_type === 'deposit' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-start justify-between">
                        <span className="font-semibold text-sm">{entry.description}</span>
                        <span className={`font-bold text-sm ${entry.transaction_type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                          {entry.transaction_type === 'deposit' ? '+' : '-'}${Math.abs(entry.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{new Date(entry.transaction_date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="capitalize">{entry.transaction_type}</span>
                        {entry.reference_number && (
                          <>
                            <span>•</span>
                            <span className="font-mono">Ref: {entry.reference_number}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
