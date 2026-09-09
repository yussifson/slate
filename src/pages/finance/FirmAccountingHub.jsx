import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Building2, BookOpen, Receipt, FileText, Landmark, LineChart, 
  Plus, Search, RefreshCw, CheckCircle2, ArrowUpRight, ArrowDownLeft, DollarSign, Wallet
} from 'lucide-react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { FirmAccountingAPI } from '@/api/FirmAccountingAPI';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function FirmAccountingHub() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(tabFromUrl || 'coa');

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (val) => {
    setActiveTab(val);
    setSearchParams({ tab: val });
  };
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [accounts, setAccounts] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [bills, setBills] = useState([]);
  const [fixedAssets, setFixedAssets] = useState([]);

  // Modal states
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showJVModal, setShowJVModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);

  // Form states
  const [accountForm, setAccountForm] = useState({ code: '', name: '', type: 'Asset', description: '' });
  const [jvForm, setJvForm] = useState({
    description: '',
    reference: '',
    entryDate: new Date().toISOString().split('T')[0],
    lineItems: [
      { accountId: '', debit: 0, credit: 0, description: '' },
      { accountId: '', debit: 0, credit: 0, description: '' }
    ]
  });
  const [invoiceForm, setInvoiceForm] = useState({
    customerName: '', customerEmail: '', dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    items: [{ description: 'Professional Services', quantity: 1, unitPrice: 1500, taxRate: 0 }]
  });
  const [billForm, setBillForm] = useState({
    vendorName: '', vendorEmail: '', dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    items: [{ description: 'Office Equipment & Supplies', quantity: 1, unitPrice: 450 }]
  });
  const [assetForm, setAssetForm] = useState({
    assetName: '', category: 'Equipment', purchaseCost: 5000, salvageValue: 500, usefulLifeYears: 5
  });

  const [bankReconciliations, setBankReconciliations] = useState([]);
  const [showBankRecModal, setShowBankRecModal] = useState(false);
  const [bankRecForm, setBankRecForm] = useState({ accountId: '', statementBalance: 0, glBalance: 0, statementDate: new Date().toISOString().split('T')[0] });

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (companyId) {
        const [accs, jvs, invs, bls, asts, recs] = await Promise.all([
          FirmAccountingAPI.getAccounts(companyId),
          FirmAccountingAPI.getJournalEntries(companyId),
          FirmAccountingAPI.getInvoices(companyId),
          FirmAccountingAPI.getBills(companyId),
          FirmAccountingAPI.getFixedAssets(companyId),
          FirmAccountingAPI.getBankReconciliations(companyId)
        ]);
        setAccounts(accs);
        setJournalEntries(jvs);
        setInvoices(invs);
        setBills(bls);
        setFixedAssets(asts);
        setBankReconciliations(recs);
      }
    } catch (e) {
      console.error('[FirmAccountingHub] Load failed:', e);
      toast.error('Failed to load accounting data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  // Handlers
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      await FirmAccountingAPI.createAccount(companyId, accountForm);
      toast.success('Account created in Chart of Accounts');
      setShowAccountModal(false);
      loadData();
    } catch (e) {
      toast.error(e.message || 'Failed to create account');
    }
  };

  const handlePostJV = async (e) => {
    e.preventDefault();
    try {
      await FirmAccountingAPI.postJournalEntry(companyId, jvForm, user?.id);
      toast.success('Double-entry Journal Voucher posted successfully');
      setShowJVModal(false);
      loadData();
    } catch (e) {
      toast.error(e.message || 'Failed to post Journal Voucher');
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      await FirmAccountingAPI.createInvoice(companyId, invoiceForm, user?.id);
      toast.success('Invoice created & GL Journal posted');
      setShowInvoiceModal(false);
      loadData();
    } catch (e) {
      toast.error(e.message || 'Failed to create invoice');
    }
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    try {
      await FirmAccountingAPI.createBill(companyId, billForm, user?.id);
      toast.success('Vendor Bill recorded & AP updated');
      setShowBillModal(false);
      loadData();
    } catch (e) {
      toast.error(e.message || 'Failed to record bill');
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      await FirmAccountingAPI.createFixedAsset(companyId, assetForm);
      toast.success('Fixed Asset registered');
      setShowAssetModal(false);
      loadData();
    } catch (e) {
      toast.error(e.message || 'Failed to add asset');
    }
  };

  const handlePostDepreciation = async (assetId) => {
    try {
      const depAmt = await FirmAccountingAPI.postAssetDepreciation(companyId, assetId, user?.id);
      toast.success(`Monthly depreciation of $${depAmt.toFixed(2)} posted to GL`);
      loadData();
    } catch (e) {
      toast.error('Depreciation posting failed');
    }
  };

  // KPIs
  const totalRevenue = invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const totalExpenses = bills.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const netIncome = totalRevenue - totalExpenses;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading Firm Accounting Suite...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 pb-28 w-full max-w-full space-y-6 font-sans">
      {/* ── 1. Executive Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Firm & Corporate Accounting
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enterprise double-entry general ledger, Chart of Accounts, Accounts Receivable (AR), Accounts Payable (AP), and Financial Statements
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="h-9 px-3 text-xs gap-1.5 border-border rounded-xl"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            onClick={() => setShowInvoiceModal(true)}
            size="sm"
            className="h-9 px-3.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 gap-1.5 rounded-xl"
          >
            <Plus className="h-4 w-4" />
            Create Invoice
          </Button>

          <Button
            onClick={() => setShowJVModal(true)}
            variant="outline"
            size="sm"
            className="h-9 px-3 text-xs font-semibold gap-1.5 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-xl"
          >
            <Plus className="h-3.5 w-3.5" />
            Journal Entry
          </Button>
        </div>
      </div>

      {/* ── 2. Corporate KPI Hero Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-[22px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Accounts Receivable (AR)</span>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-muted-foreground font-semibold">{invoices.length} active invoices</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-inner">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Accounts Payable (AP)</span>
              <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
                ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-muted-foreground font-semibold">{bills.length} vendor bills</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-inner">
              <Receipt className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Net Operating Income</span>
              <p className={`text-2xl font-extrabold tracking-tight ${netIncome >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                ${netIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-muted-foreground font-semibold">Real-time ledger net</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-inner">
              <LineChart className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Chart of Accounts</span>
              <p className="text-2xl font-extrabold text-foreground tracking-tight">
                {accounts.length} Accounts
              </p>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Double-Entry Active
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-inner">
              <BookOpen className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Executive Tabs Navigation & Content ── */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-muted/60 p-1.5 rounded-2xl border border-border/60 grid grid-cols-2 md:grid-cols-6 w-full h-auto gap-1">
          <TabsTrigger value="coa" className="gap-2 rounded-xl text-xs font-semibold py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"><BookOpen className="w-4 h-4 text-indigo-500" /> Chart of Accounts</TabsTrigger>
          <TabsTrigger value="jv" className="gap-2 rounded-xl text-xs font-semibold py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"><FileText className="w-4 h-4 text-purple-500" /> Journal Vouchers</TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2 rounded-xl text-xs font-semibold py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"><Receipt className="w-4 h-4 text-emerald-500" /> Invoices (AR)</TabsTrigger>
          <TabsTrigger value="bills" className="gap-2 rounded-xl text-xs font-semibold py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"><Receipt className="w-4 h-4 text-rose-500" /> Bills Payable (AP)</TabsTrigger>
          <TabsTrigger value="assets" className="gap-2 rounded-xl text-xs font-semibold py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"><Landmark className="w-4 h-4 text-amber-500" /> Fixed Assets</TabsTrigger>
          <TabsTrigger value="bankrec" className="gap-2 rounded-xl text-xs font-semibold py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"><CheckCircle2 className="w-4 h-4 text-teal-500" /> Bank Feed Rec</TabsTrigger>
        </TabsList>

        {/* 1. CHART OF ACCOUNTS */}
        <TabsContent value="coa" className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-base font-bold text-foreground">Corporate Chart of Accounts (CoA)</h3>
            <Button size="sm" onClick={() => setShowAccountModal(true)} className="gap-1.5 h-8 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="w-3.5 h-3.5" /> Add Account Code
            </Button>
          </div>

          <Card className="rounded-[24px] border border-border/80 bg-card/90 backdrop-blur-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="text-left py-3.5 px-5">Code</th>
                    <th className="text-left py-3.5 px-5">Account Name</th>
                    <th className="text-left py-3.5 px-5">Category Type</th>
                    <th className="text-left py-3.5 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {accounts.map(acc => (
                    <tr key={acc.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{acc.code}</td>
                      <td className="py-3.5 px-5 font-bold text-foreground">{acc.name}</td>
                      <td className="py-3.5 px-5">
                        <Badge variant="outline" className="capitalize rounded-lg font-semibold border-border">{acc.type}</Badge>
                      </td>
                      <td className="py-3.5 px-5">
                        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-0 font-semibold rounded-lg">Active</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* 2. JOURNAL VOUCHERS */}
        <TabsContent value="jv" className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-base font-bold text-foreground">General Ledger Journal Vouchers</h3>
            <Button size="sm" onClick={() => setShowJVModal(true)} className="gap-1.5 h-8 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="w-3.5 h-3.5" /> New Journal Voucher
            </Button>
          </div>

          <Card className="rounded-[24px] border border-border/80 bg-card/90 backdrop-blur-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="text-left py-3.5 px-5">JV #</th>
                    <th className="text-left py-3.5 px-5">Date</th>
                    <th className="text-left py-3.5 px-5">Description</th>
                    <th className="text-left py-3.5 px-5">Line Items</th>
                    <th className="text-left py-3.5 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {journalEntries.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-10 text-muted-foreground font-medium">No Journal Vouchers posted yet</td></tr>
                  ) : (
                    journalEntries.map(jv => (
                      <tr key={jv.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-purple-600 dark:text-purple-400">{jv.entry_number}</td>
                        <td className="py-3.5 px-5 text-muted-foreground font-medium">{new Date(jv.entry_date).toLocaleDateString()}</td>
                        <td className="py-3.5 px-5 font-bold text-foreground">{jv.description}</td>
                        <td className="py-3.5 px-5 text-xs font-mono">
                          {jv.lineItems?.map(l => `${l.debit > 0 ? `Dr $${l.debit}` : `Cr $${l.credit}`}`).join(' | ')}
                        </td>
                        <td className="py-3.5 px-5">
                          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-0 font-semibold rounded-lg">Posted</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* 3. INVOICES */}
        <TabsContent value="invoices" className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-base font-bold text-foreground">Accounts Receivable (Customer Invoices)</h3>
            <Button size="sm" onClick={() => setShowInvoiceModal(true)} className="gap-1.5 h-8 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-3.5 h-3.5" /> Create Invoice
            </Button>
          </div>

          <Card className="rounded-[24px] border border-border/80 bg-card/90 backdrop-blur-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="text-left py-3.5 px-5">Invoice #</th>
                    <th className="text-left py-3.5 px-5">Customer</th>
                    <th className="text-left py-3.5 px-5">Due Date</th>
                    <th className="text-right py-3.5 px-5">Total Amount</th>
                    <th className="text-center py-3.5 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {invoices.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-10 text-muted-foreground font-medium">No customer invoices created</td></tr>
                  ) : (
                    invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-foreground">{inv.invoice_number}</td>
                        <td className="py-3.5 px-5 font-bold text-foreground">{inv.customer_name}</td>
                        <td className="py-3.5 px-5 text-muted-foreground font-medium">{new Date(inv.due_date).toLocaleDateString()}</td>
                        <td className="py-3.5 px-5 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                          ${(inv.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <Badge variant="outline" className="capitalize rounded-lg font-semibold border-border">{inv.status}</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* 4. BILLS */}
        <TabsContent value="bills" className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-base font-bold text-foreground">Accounts Payable (Vendor Bills)</h3>
            <Button size="sm" onClick={() => setShowBillModal(true)} className="gap-1.5 h-8 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white">
              <Plus className="w-3.5 h-3.5" /> Record Vendor Bill
            </Button>
          </div>

          <Card className="rounded-[24px] border border-border/80 bg-card/90 backdrop-blur-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="text-left py-3.5 px-5">Bill #</th>
                    <th className="text-left py-3.5 px-5">Vendor</th>
                    <th className="text-left py-3.5 px-5">Due Date</th>
                    <th className="text-right py-3.5 px-5">Total Amount</th>
                    <th className="text-center py-3.5 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {bills.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-10 text-muted-foreground font-medium">No vendor bills recorded</td></tr>
                  ) : (
                    bills.map(b => (
                      <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-foreground">{b.bill_number}</td>
                        <td className="py-3.5 px-5 font-bold text-foreground">{b.vendor_name}</td>
                        <td className="py-3.5 px-5 text-muted-foreground font-medium">{new Date(b.due_date).toLocaleDateString()}</td>
                        <td className="py-3.5 px-5 text-right font-extrabold text-rose-600 dark:text-rose-400">
                          ${(b.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <Badge variant="secondary" className="capitalize rounded-lg font-semibold">{b.status}</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* 5. FIXED ASSETS */}
        <TabsContent value="assets" className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-base font-bold text-foreground">Fixed Assets & Depreciation</h3>
            <Button size="sm" onClick={() => setShowAssetModal(true)} className="gap-1.5 h-8 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="w-3.5 h-3.5" /> Add Asset
            </Button>
          </div>

          <Card className="rounded-[24px] border border-border/80 bg-card/90 backdrop-blur-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="text-left py-3.5 px-5">Asset Code</th>
                    <th className="text-left py-3.5 px-5">Name</th>
                    <th className="text-right py-3.5 px-5">Cost</th>
                    <th className="text-right py-3.5 px-5">Accum. Depreciation</th>
                    <th className="text-right py-3.5 px-5">Net Book Value</th>
                    <th className="text-center py-3.5 px-5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {fixedAssets.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-10 text-muted-foreground font-medium">No fixed assets registered</td></tr>
                  ) : (
                    fixedAssets.map(ast => (
                      <tr key={ast.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-amber-600 dark:text-amber-400">{ast.asset_code}</td>
                        <td className="py-3.5 px-5 font-bold text-foreground">{ast.asset_name}</td>
                        <td className="py-3.5 px-5 text-right font-medium">${(ast.purchase_cost || 0).toLocaleString()}</td>
                        <td className="py-3.5 px-5 text-right text-rose-500 font-medium">${(ast.accumulated_depreciation || 0).toLocaleString()}</td>
                        <td className="py-3.5 px-5 text-right font-extrabold text-emerald-600 dark:text-emerald-400">${(ast.net_book_value || 0).toLocaleString()}</td>
                        <td className="py-3.5 px-5 text-center">
                          <Button size="xs" variant="outline" className="rounded-lg h-7 px-2.5 text-xs font-semibold" onClick={() => handlePostDepreciation(ast.id)}>
                            Depreciate Month
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* 6. BANK RECONCILIATION */}
        <TabsContent value="bankrec" className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-base font-bold text-foreground">Bank Statement Reconciliation</h3>
            <Button size="sm" onClick={() => setShowBankRecModal(true)} className="gap-1.5 h-8 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white">
              <Plus className="w-3.5 h-3.5" /> Start Reconciliation
            </Button>
          </div>

          <Card className="rounded-[24px] border border-border/80 bg-card/90 backdrop-blur-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="text-left py-3.5 px-5">Statement Date</th>
                    <th className="text-right py-3.5 px-5">Bank Statement Balance</th>
                    <th className="text-right py-3.5 px-5">GL Ledger Balance</th>
                    <th className="text-right py-3.5 px-5">Difference</th>
                    <th className="text-center py-3.5 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {bankReconciliations.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-10 text-muted-foreground font-medium">No bank reconciliations performed yet</td></tr>
                  ) : (
                    bankReconciliations.map(rec => (
                      <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-5 font-mono font-medium text-foreground">{new Date(rec.statement_date).toLocaleDateString()}</td>
                        <td className="py-3.5 px-5 text-right font-medium text-foreground">${(rec.statement_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3.5 px-5 text-right font-medium text-foreground">${(rec.gl_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className={`py-3.5 px-5 text-right font-extrabold ${Math.abs(rec.difference || 0) < 0.01 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          ${(rec.difference || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <Badge variant={rec.status === 'reconciled' ? 'default' : 'secondary'} className="capitalize rounded-lg font-semibold">
                            {rec.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CREATE INVOICE MODAL */}
      <Sheet open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create Customer Invoice (AR)</SheetTitle>
            <SheetDescription>Generate invoice & auto-post AR journal entry</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleCreateInvoice} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Customer Name</label>
              <Input value={invoiceForm.customerName} onChange={e => setInvoiceForm({ ...invoiceForm, customerName: e.target.value })} placeholder="Acme Corp" required />
            </div>
            <div>
              <label className="text-sm font-medium">Customer Email</label>
              <Input value={invoiceForm.customerEmail} onChange={e => setInvoiceForm({ ...invoiceForm, customerEmail: e.target.value })} placeholder="billing@acme.com" />
            </div>
            <div>
              <label className="text-sm font-medium">Service / Product Description</label>
              <Input value={invoiceForm.items[0].description} onChange={e => {
                const newItems = [...invoiceForm.items];
                newItems[0].description = e.target.value;
                setInvoiceForm({ ...invoiceForm, items: newItems });
              }} required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Amount ($)</label>
                <Input type="number" value={invoiceForm.items[0].unitPrice} onChange={e => {
                  const newItems = [...invoiceForm.items];
                  newItems[0].unitPrice = Number(e.target.value);
                  setInvoiceForm({ ...invoiceForm, items: newItems });
                }} required />
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input type="date" value={invoiceForm.dueDate} onChange={e => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} required />
              </div>
            </div>
            <Button type="submit" className="w-full">Create & Post Invoice</Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* CREATE JOURNAL VOUCHER MODAL */}
      <Sheet open={showJVModal} onOpenChange={setShowJVModal}>
        <SheetContent className="w-full max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Post Journal Voucher (Double Entry)</SheetTitle>
            <SheetDescription>Ensure sum of Debits equals sum of Credits</SheetDescription>
          </SheetHeader>
          <form onSubmit={handlePostJV} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">JV Description</label>
              <Input value={jvForm.description} onChange={e => setJvForm({ ...jvForm, description: e.target.value })} placeholder="Monthly rent accrual" required />
            </div>
            <div className="space-y-3 border p-3 rounded-lg bg-muted/20">
              <span className="text-xs font-bold uppercase text-muted-foreground">Line Item 1 (Debit)</span>
              <Select value={jvForm.lineItems[0].accountId} onValueChange={v => {
                const items = [...jvForm.lineItems];
                items[0].accountId = v;
                setJvForm({ ...jvForm, lineItems: items });
              }}>
                <SelectTrigger><SelectValue placeholder="Select Debit Account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Debit Amount ($)" onChange={e => {
                const items = [...jvForm.lineItems];
                items[0].debit = Number(e.target.value);
                items[0].credit = 0;
                setJvForm({ ...jvForm, lineItems: items });
              }} required />
            </div>

            <div className="space-y-3 border p-3 rounded-lg bg-muted/20">
              <span className="text-xs font-bold uppercase text-muted-foreground">Line Item 2 (Credit)</span>
              <Select value={jvForm.lineItems[1].accountId} onValueChange={v => {
                const items = [...jvForm.lineItems];
                items[1].accountId = v;
                setJvForm({ ...jvForm, lineItems: items });
              }}>
                <SelectTrigger><SelectValue placeholder="Select Credit Account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Credit Amount ($)" onChange={e => {
                const items = [...jvForm.lineItems];
                items[1].credit = Number(e.target.value);
                items[1].debit = 0;
                setJvForm({ ...jvForm, lineItems: items });
              }} required />
            </div>
            <Button type="submit" className="w-full">Post Journal Entry</Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* CREATE ACCOUNT CODE MODAL */}
      <Sheet open={showAccountModal} onOpenChange={setShowAccountModal}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Account Code to CoA</SheetTitle>
            <SheetDescription>Configure a new account in Chart of Accounts</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleCreateAccount} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Account Code (Numeric)</label>
              <Input value={accountForm.code} onChange={e => setAccountForm({ ...accountForm, code: e.target.value })} placeholder="e.g. 1300" required />
            </div>
            <div>
              <label className="text-sm font-medium">Account Title / Name</label>
              <Input value={accountForm.name} onChange={e => setAccountForm({ ...accountForm, name: e.target.value })} placeholder="Software Subscriptions" required />
            </div>
            <div>
              <label className="text-sm font-medium">Category Type</label>
              <Select value={accountForm.type} onValueChange={v => setAccountForm({ ...accountForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asset">Asset</SelectItem>
                  <SelectItem value="Liability">Liability</SelectItem>
                  <SelectItem value="Equity">Equity</SelectItem>
                  <SelectItem value="Revenue">Revenue</SelectItem>
                  <SelectItem value="Expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Add Account</Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* CREATE VENDOR BILL MODAL */}
      <Sheet open={showBillModal} onOpenChange={setShowBillModal}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Record Vendor Bill (AP)</SheetTitle>
            <SheetDescription>Log vendor liability & post AP journal</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleCreateBill} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Vendor Name</label>
              <Input value={billForm.vendorName} onChange={e => setBillForm({ ...billForm, vendorName: e.target.value })} placeholder="Dell Commercial" required />
            </div>
            <div>
              <label className="text-sm font-medium">Bill Item Description</label>
              <Input value={billForm.items[0].description} onChange={e => {
                const items = [...billForm.items];
                items[0].description = e.target.value;
                setBillForm({ ...billForm, items });
              }} required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Amount ($)</label>
                <Input type="number" value={billForm.items[0].unitPrice} onChange={e => {
                  const items = [...billForm.items];
                  items[0].unitPrice = Number(e.target.value);
                  setBillForm({ ...billForm, items });
                }} required />
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input type="date" value={billForm.dueDate} onChange={e => setBillForm({ ...billForm, dueDate: e.target.value })} required />
              </div>
            </div>
            <Button type="submit" className="w-full">Record Vendor Bill</Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* ADD FIXED ASSET MODAL */}
      <Sheet open={showAssetModal} onOpenChange={setShowAssetModal}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Fixed Asset</SheetTitle>
            <SheetDescription>Register capital expenditure asset</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleCreateAsset} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Asset Name</label>
              <Input value={assetForm.assetName} onChange={e => setAssetForm({ ...assetForm, assetName: e.target.value })} placeholder="MacBook Pro Workstations" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Purchase Cost ($)</label>
                <Input type="number" value={assetForm.purchaseCost} onChange={e => setAssetForm({ ...assetForm, purchaseCost: Number(e.target.value) })} required />
              </div>
              <div>
                <label className="text-sm font-medium">Salvage Value ($)</label>
                <Input type="number" value={assetForm.salvageValue} onChange={e => setAssetForm({ ...assetForm, salvageValue: Number(e.target.value) })} required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Useful Life (Years)</label>
              <Input type="number" value={assetForm.usefulLifeYears} onChange={e => setAssetForm({ ...assetForm, usefulLifeYears: Number(e.target.value) })} required />
            </div>
            <Button type="submit" className="w-full">Register Asset</Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* START BANK RECONCILIATION MODAL */}
      <Sheet open={showBankRecModal} onOpenChange={setShowBankRecModal}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Reconcile Bank Statement</SheetTitle>
            <SheetDescription>Compare bank statement ending balance against GL</SheetDescription>
          </SheetHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              const selectedAcc = accounts[0];
              const glBal = totalRevenue - totalExpenses;
              await FirmAccountingAPI.createBankReconciliation(companyId, {
                accountId: selectedAcc?.id || 'bank-op',
                statementBalance: bankRecForm.statementBalance,
                glBalance: glBal,
                statementDate: bankRecForm.statementDate
              }, user?.id);
              toast.success('Bank reconciliation entry recorded');
              setShowBankRecModal(false);
              loadData();
            } catch (err) {
              toast.error('Reconciliation failed');
            }
          }} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Statement Date</label>
              <Input type="date" value={bankRecForm.statementDate} onChange={e => setBankRecForm({ ...bankRecForm, statementDate: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm font-medium">Bank Statement Ending Balance ($)</label>
              <Input type="number" step="0.01" onChange={e => setBankRecForm({ ...bankRecForm, statementBalance: Number(e.target.value) })} required />
            </div>
            <Button type="submit" className="w-full">Run Reconciliation Match</Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
