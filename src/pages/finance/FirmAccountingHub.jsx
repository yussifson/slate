import React, { useState, useEffect } from 'react';
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

export default function FirmAccountingHub() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('coa');
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

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (companyId) {
        const [accs, jvs, invs, bls, asts] = await Promise.all([
          FirmAccountingAPI.getAccounts(companyId),
          FirmAccountingAPI.getJournalEntries(companyId),
          FirmAccountingAPI.getInvoices(companyId),
          FirmAccountingAPI.getBills(companyId),
          FirmAccountingAPI.getFixedAssets(companyId)
        ]);
        setAccounts(accs);
        setJournalEntries(jvs);
        setInvoices(invs);
        setBills(bls);
        setFixedAssets(asts);
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
    <div className="p-6 space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Firm & Corporate Accounting</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Enterprise double-entry ledger, Chart of Accounts, Invoicing (AR), Bills (AP), Assets & Financials
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowInvoiceModal(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Create Invoice
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowJVModal(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Post Journal Voucher
          </Button>
        </div>
      </div>

      {/* Corporate KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-500" /> Total Accounts Receivable (AR)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-600">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">{invoices.length} active invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-rose-500" /> Total Accounts Payable (AP)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-rose-600">${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">{bills.length} vendor bills</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1.5">
              <LineChart className="w-4 h-4 text-primary" /> Net Corporate Income
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ${netIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Calculated from posted AR & AP</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-500" /> Chart of Accounts Code
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-indigo-600">{accounts.length} Accounts</div>
            <p className="text-xs text-muted-foreground mt-1">Double-entry structure active</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="coa" className="gap-2"><BookOpen className="w-4 h-4" /> Chart of Accounts</TabsTrigger>
          <TabsTrigger value="jv" className="gap-2"><FileText className="w-4 h-4" /> Journal Vouchers (GL)</TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2"><Receipt className="w-4 h-4" /> Invoices (AR)</TabsTrigger>
          <TabsTrigger value="bills" className="gap-2"><Receipt className="w-4 h-4" /> Bills Payable (AP)</TabsTrigger>
          <TabsTrigger value="assets" className="gap-2"><Landmark className="w-4 h-4" /> Fixed Assets</TabsTrigger>
        </TabsList>

        {/* 1. CHART OF ACCOUNTS */}
        <TabsContent value="coa" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Corporate Chart of Accounts (CoA)</h3>
            <Button size="sm" onClick={() => setShowAccountModal(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add Account Code
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4">Code</th>
                    <th className="text-left py-3 px-4">Account Name</th>
                    <th className="text-left py-3 px-4">Category Type</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {accounts.map(acc => (
                    <tr key={acc.id} className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-mono font-bold">{acc.code}</td>
                      <td className="py-3 px-4 font-medium">{acc.name}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="capitalize">{acc.type}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Active</Badge>
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
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">General Ledger Journal Vouchers</h3>
            <Button size="sm" onClick={() => setShowJVModal(true)} className="gap-2">
              <Plus className="w-4 h-4" /> New Journal Voucher
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4">JV #</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Description</th>
                    <th className="text-left py-3 px-4">Line Items</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {journalEntries.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-8 text-muted-foreground">No Journal Vouchers posted yet</td></tr>
                  ) : (
                    journalEntries.map(jv => (
                      <tr key={jv.id} className="hover:bg-muted/30">
                        <td className="py-3 px-4 font-mono font-bold text-primary">{jv.entry_number}</td>
                        <td className="py-3 px-4 text-muted-foreground">{new Date(jv.entry_date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 font-medium">{jv.description}</td>
                        <td className="py-3 px-4 text-xs font-mono">
                          {jv.lineItems?.map(l => `${l.debit > 0 ? `Dr $${l.debit}` : `Cr $${l.credit}`}`).join(' | ')}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="default" className="bg-emerald-600">Posted</Badge>
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
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Accounts Receivable (Customer Invoices)</h3>
            <Button size="sm" onClick={() => setShowInvoiceModal(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Create Invoice
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4">Invoice #</th>
                    <th className="text-left py-3 px-4">Customer</th>
                    <th className="text-left py-3 px-4">Due Date</th>
                    <th className="text-right py-3 px-4">Total Amount</th>
                    <th className="text-center py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-8 text-muted-foreground">No customer invoices created</td></tr>
                  ) : (
                    invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-muted/30">
                        <td className="py-3 px-4 font-mono font-bold">{inv.invoice_number}</td>
                        <td className="py-3 px-4 font-medium">{inv.customer_name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{new Date(inv.due_date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">
                          ${(inv.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline" className="capitalize">{inv.status}</Badge>
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
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Accounts Payable (Vendor Bills)</h3>
            <Button size="sm" onClick={() => setShowBillModal(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Record Vendor Bill
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4">Bill #</th>
                    <th className="text-left py-3 px-4">Vendor</th>
                    <th className="text-left py-3 px-4">Due Date</th>
                    <th className="text-right py-3 px-4">Total Amount</th>
                    <th className="text-center py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bills.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-8 text-muted-foreground">No vendor bills recorded</td></tr>
                  ) : (
                    bills.map(b => (
                      <tr key={b.id} className="hover:bg-muted/30">
                        <td className="py-3 px-4 font-mono font-bold">{b.bill_number}</td>
                        <td className="py-3 px-4 font-medium">{b.vendor_name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{new Date(b.due_date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-right font-bold text-rose-600">
                          ${(b.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="secondary" className="capitalize">{b.status}</Badge>
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
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Fixed Assets & Depreciation</h3>
            <Button size="sm" onClick={() => setShowAssetModal(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add Asset
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4">Asset Code</th>
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-right py-3 px-4">Cost</th>
                    <th className="text-right py-3 px-4">Accum. Depreciation</th>
                    <th className="text-right py-3 px-4">Net Book Value</th>
                    <th className="text-center py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fixedAssets.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-8 text-muted-foreground">No fixed assets registered</td></tr>
                  ) : (
                    fixedAssets.map(ast => (
                      <tr key={ast.id} className="hover:bg-muted/30">
                        <td className="py-3 px-4 font-mono font-bold">{ast.asset_code}</td>
                        <td className="py-3 px-4 font-medium">{ast.asset_name}</td>
                        <td className="py-3 px-4 text-right font-medium">${(ast.purchase_cost || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-rose-500">${(ast.accumulated_depreciation || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">${(ast.net_book_value || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-center">
                          <Button size="xs" variant="outline" onClick={() => handlePostDepreciation(ast.id)}>
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
    </div>
  );
}
