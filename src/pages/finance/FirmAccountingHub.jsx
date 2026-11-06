import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2, BookOpen, Receipt, FileText, Landmark, LineChart,
  Plus, Search, RefreshCw, CheckCircle2, ArrowUpRight, ArrowDownLeft,
  DollarSign, TrendingUp, Users, ShoppingBag, BarChart2,
  Banknote, Shield,
  ClipboardList, BarChart, Phone, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { FirmAccountingAPI } from '@/api/FirmAccountingAPI';
import { powerSync } from '@/api/PowerSyncConnector';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

// ── Ghana Payroll Tax Helpers ──────────────────────────────────
const GHANA_PAYE_BRACKETS = [
  { band: 490, rate: 0 },
  { band: 110, rate: 0.05 },
  { band: 130, rate: 0.10 },
  { band: 3000, rate: 0.175 },
  { band: 16395, rate: 0.25 },
  { band: Infinity, rate: 0.30 },
];
const SSNIT_EMPLOYEE_RATE = 0.055;
const SSNIT_EMPLOYER_RATE = 0.13;

function calcGhanaPayroll(basicSalary) {
  const salary = Number(basicSalary) || 0;
  const ssnitEmployee = +(salary * SSNIT_EMPLOYEE_RATE).toFixed(2);
  const ssnitEmployer = +(salary * SSNIT_EMPLOYER_RATE).toFixed(2);
  const taxableIncome = salary - ssnitEmployee;

  let paye = 0;
  let remaining = taxableIncome;
  for (const bracket of GHANA_PAYE_BRACKETS) {
    if (remaining <= 0) break;
    const taxable = Math.min(remaining, bracket.band === Infinity ? remaining : bracket.band);
    paye += taxable * bracket.rate;
    remaining -= taxable;
  }
  paye = +paye.toFixed(2);
  const netPay = +(salary - ssnitEmployee - paye).toFixed(2);
  return { salary, ssnitEmployee, ssnitEmployer, paye, netPay };
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
const nowDate = () => new Date().toISOString().split('T')[0];

// ── Safe row extraction for PowerSync ─────────────────────────
function extractRows(res) {
  return res?.rows?._array || (res?.rows ? Array.from(res.rows) : []);
}

// ── Currency formatter ─────────────────────────────────────────
function fmt(n) {
  return 'GH₵ ' + (Number(n) || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 });
}

// ── Tab configuration ──────────────────────────────────────────
const TABS = [
  { id: 'coa',      label: 'Chart of Accounts',    icon: BookOpen,      color: 'indigo'  },
  { id: 'invoices', label: 'Invoices (AR)',         icon: Receipt,       color: 'emerald' },
  { id: 'bills',    label: 'Bills (AP)',            icon: FileText,      color: 'rose'    },
  { id: 'jv',       label: 'General Ledger',       icon: LineChart,     color: 'purple'  },
  { id: 'assets',   label: 'Fixed Assets',         icon: Landmark,      color: 'amber'   },
  { id: 'bankrec',  label: 'Bank Rec',             icon: CheckCircle2,  color: 'teal'    },
  { id: 'income',   label: 'Income & Expenses',    icon: TrendingUp,    color: 'blue'    },
  { id: 'payroll',  label: 'Payroll & Tax',        icon: Users,         color: 'violet'  },
  { id: 'tonefo',   label: 'TONEFO Installments',  icon: ShoppingBag,   color: 'orange'  },
  { id: 'reports',  label: 'Reports',              icon: BarChart2,     color: 'pink'    },
];

const TAB_COLORS = {
  indigo:  { icon: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',  badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',  btn: 'bg-primary hover:bg-primary/90 shadow-indigo-600/20' },
  emerald: { icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30', btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' },
  rose:    { icon: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',          badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',          btn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' },
  purple:  { icon: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',  badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',  btn: 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20' },
  amber:   { icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',      badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',      btn: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' },
  teal:    { icon: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',          badge: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',          btn: 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20' },
  blue:    { icon: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',          badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',          btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' },
  violet:  { icon: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',  badge: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30',  btn: 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/20' },
  orange:  { icon: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',  badge: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30',  btn: 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20' },
  pink:    { icon: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',          badge: 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/30',          btn: 'bg-pink-600 hover:bg-pink-700 shadow-pink-600/20' },
};

// ── Reusable table shell ───────────────────────────────────────
function TableShell({ headers, children }) {
  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
              {headers.map((h, i) => (
                <th key={i} className={cn('py-3 px-4', h.right && 'text-right', h.center && 'text-center')}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, desc, color = 'indigo' }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
      <div className={cn('h-14 w-14 rounded-2xl flex items-center justify-center border shadow-inner', TAB_COLORS[color].icon)}>
        <Icon className="h-7 w-7" />
      </div>
      <p className="font-extrabold text-sm text-foreground">{title}</p>
      <p className="text-[11px] text-muted-foreground max-w-[240px]">{desc}</p>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, color = 'indigo', action }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[13px] font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
        <Icon className={cn('h-4 w-4', `text-${color}-600 dark:text-${color}-400`)} />
        {title}
      </h2>
      {action}
    </div>
  );
}

// ── Filter bar ─────────────────────────────────────────────────
function FilterBar({ search, onSearch, placeholder = 'Search...', rightSlot }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-card border border-border/80 p-3 rounded-xl shadow-xs">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={placeholder} value={search} onChange={e => onSearch(e.target.value)} className="pl-9 h-9 text-xs bg-background" />
        </div>
        {rightSlot}
      </div>
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color = 'indigo' }) {
  const c = TAB_COLORS[color];
  return (
    <Card className="rounded-[22px] border border-border/80 bg-card/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
      <CardContent className="p-5 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
          <p className="text-2xl font-extrabold text-foreground tracking-tight">{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground font-semibold">{sub}</p>}
        </div>
        <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center border shadow-inner', c.icon)}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Status badge ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    paid: 'emerald', active: 'emerald', posted: 'emerald', reconciled: 'emerald', approved: 'emerald', collected: 'emerald',
    draft: 'amber', pending: 'amber', in_progress: 'amber', partial: 'amber',
    overdue: 'rose', rejected: 'rose', disposed: 'rose',
    sent: 'blue', installment: 'blue',
    cancelled: 'rose', fully_depreciated: 'purple',
  };
  const color = map[status] || 'indigo';
  return (
    <Badge variant="outline" className={cn('text-[9px] uppercase font-bold px-2 py-0.5', TAB_COLORS[color].badge)}>
      {status?.replace(/_/g, ' ')}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────
export default function FirmAccountingHub() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(tabFromUrl || 'coa');
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [financeNavCollapsed, setFinanceNavCollapsed] = useState(false);

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const handleTabChange = (val) => {
    setActiveTab(val);
    setSearch('');
    setSearchParams({ tab: val });
  };

  // ── Data states ──────────────────────────────────────────────
  const [accounts, setAccounts] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [bills, setBills] = useState([]);
  const [fixedAssets, setFixedAssets] = useState([]);
  const [bankRecs, setBankRecs] = useState([]);
  const [officeIncome, setOfficeIncome] = useState([]);
  const [officeExpenses, setOfficeExpenses] = useState([]);
  const [projectExpenses, setProjectExpenses] = useState([]);
  const [payrollEmployees, setPayrollEmployees] = useState([]);
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [tonefoCases, setTonefoCases] = useState([]);
  const [tonefoPayments, setTonefoPayments] = useState([]);
  const [incomeSubTab, setIncomeSubTab] = useState('income');

  // ── Modal states ─────────────────────────────────────────────
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showJVModal, setShowJVModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showBankRecModal, setShowBankRecModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showProjectExpenseModal, setShowProjectExpenseModal] = useState(false);
  const [showPayrollEmployeeModal, setShowPayrollEmployeeModal] = useState(false);
  const [showPayrollRunModal, setShowPayrollRunModal] = useState(false);
  const [showTonefoSaleModal, setShowTonefoSaleModal] = useState(false);
  const [showTonefoPaymentModal, setShowTonefoPaymentModal] = useState(false);
  const [selectedTonefoCase, setSelectedTonefoCase] = useState(null);

  // ── Form states ──────────────────────────────────────────────
  const [accountForm, setAccountForm] = useState({ code: '', name: '', type: 'Asset', description: '' });
  const [jvForm, setJvForm] = useState({ description: '', reference: '', entryDate: nowDate(), lineItems: [{ accountId: '', debit: 0, credit: 0 }, { accountId: '', debit: 0, credit: 0 }] });
  const [invoiceForm, setInvoiceForm] = useState({ customerName: '', customerEmail: '', dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], items: [{ description: 'Professional Services', quantity: 1, unitPrice: 1500, taxRate: 0 }] });
  const [billForm, setBillForm] = useState({ vendorName: '', vendorEmail: '', dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], items: [{ description: 'Office Supplies', quantity: 1, unitPrice: 450 }] });
  const [assetForm, setAssetForm] = useState({ assetName: '', category: 'Equipment', purchaseCost: 5000, salvageValue: 500, usefulLifeYears: 5 });
  const [bankRecForm, setBankRecForm] = useState({ statementBalance: 0, statementDate: nowDate() });
  const [incomeForm, setIncomeForm] = useState({ source: '', amount: '', category: 'Agency Fee', description: '', date: nowDate() });
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: 'Rent', vendor: '', date: nowDate() });
  const [projExpenseForm, setProjExpenseForm] = useState({ projectName: '', description: '', amount: '', category: 'Materials', date: nowDate() });
  const [employeeForm, setEmployeeForm] = useState({ name: '', position: '', department: '', basicSalary: '', startDate: nowDate() });
  const [payrollRunForm, setPayrollRunForm] = useState({ period: '', notes: '' });
  const [tonefoSaleForm, setTonefoSaleForm] = useState({ customerName: '', customerPhone: '', itemDescription: '', totalPrice: '', depositPaid: '', installmentMonths: 6 });
  const [tonefoPaymentForm, setTonefoPaymentForm] = useState({ amount: '', paymentDate: nowDate(), notes: '' });

  // ── Load data ────────────────────────────────────────────────
  const loadData = async () => {
    setIsLoading(true);
    try {
      if (!companyId) return;

      const [accs, jvs, invs, bls, asts, recs] = await Promise.all([
        FirmAccountingAPI.getAccounts(companyId).catch(() => []),
        FirmAccountingAPI.getJournalEntries(companyId).catch(() => []),
        FirmAccountingAPI.getInvoices(companyId).catch(() => []),
        FirmAccountingAPI.getBills(companyId).catch(() => []),
        FirmAccountingAPI.getFixedAssets(companyId).catch(() => []),
        FirmAccountingAPI.getBankReconciliations(companyId).catch(() => []),
      ]);
      setAccounts(accs || []);
      setJournalEntries(jvs || []);
      setInvoices(invs || []);
      setBills(bls || []);
      setFixedAssets(asts || []);
      setBankRecs(recs || []);

      // New tables
      const [incRes, expRes, projRes, empRes, runRes, tonefoRes, tpayRes] = await Promise.all([
        powerSync.execute('SELECT * FROM jcl_office_income WHERE company_id = ? ORDER BY date DESC', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM jcl_office_expenses WHERE company_id = ? ORDER BY date DESC', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM jcl_project_expenses WHERE company_id = ? ORDER BY date DESC', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM jcl_payroll_employees WHERE company_id = ? ORDER BY name ASC', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM jcl_payroll_runs WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM jcl_installment_sales WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM jcl_installment_payments WHERE company_id = ? ORDER BY payment_date DESC', [companyId]).catch(() => ({ rows: [] })),
      ]);
      setOfficeIncome(extractRows(incRes));
      setOfficeExpenses(extractRows(expRes));
      setProjectExpenses(extractRows(projRes));
      setPayrollEmployees(extractRows(empRes));
      setPayrollRuns(extractRows(runRes));
      setTonefoCases(extractRows(tonefoRes));
      setTonefoPayments(extractRows(tpayRes));
    } catch (e) {
      console.error('[FirmAccountingHub] Load failed:', e);
      toast.error('Failed to load accounting data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [companyId]);

  // ── Handlers — CoA ───────────────────────────────────────────
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      await FirmAccountingAPI.createAccount(companyId, accountForm);
      toast.success('Account added to Chart of Accounts');
      setShowAccountModal(false);
      setAccountForm({ code: '', name: '', type: 'Asset', description: '' });
      loadData();
    } catch (err) { toast.error(err.message || 'Failed to create account'); }
  };

  // ── Handlers — JV ────────────────────────────────────────────
  const handlePostJV = async (e) => {
    e.preventDefault();
    try {
      await FirmAccountingAPI.postJournalEntry(companyId, jvForm, user?.id);
      toast.success('Journal Voucher posted successfully');
      setShowJVModal(false);
      loadData();
    } catch (err) { toast.error(err.message || 'Failed to post Journal Voucher'); }
  };

  // ── Handlers — Invoices ──────────────────────────────────────
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      await FirmAccountingAPI.createInvoice(companyId, invoiceForm, user?.id);
      toast.success('Invoice created & GL posted');
      setShowInvoiceModal(false);
      loadData();
    } catch (err) { toast.error(err.message || 'Failed to create invoice'); }
  };

  // ── Handlers — Bills ─────────────────────────────────────────
  const handleCreateBill = async (e) => {
    e.preventDefault();
    try {
      await FirmAccountingAPI.createBill(companyId, billForm, user?.id);
      toast.success('Vendor bill recorded & AP updated');
      setShowBillModal(false);
      loadData();
    } catch (err) { toast.error(err.message || 'Failed to record bill'); }
  };

  // ── Handlers — Assets ────────────────────────────────────────
  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      await FirmAccountingAPI.createFixedAsset(companyId, assetForm);
      toast.success('Fixed asset registered');
      setShowAssetModal(false);
      loadData();
    } catch (err) { toast.error(err.message || 'Failed to add asset'); }
  };

  const handleDepreciate = async (assetId) => {
    try {
      const amt = await FirmAccountingAPI.postAssetDepreciation(companyId, assetId, user?.id);
      toast.success(`Monthly depreciation of ${fmt(amt)} posted`);
      loadData();
    } catch (err) { toast.error('Depreciation posting failed'); }
  };

  // ── Handlers — Bank Rec ──────────────────────────────────────
  const handleBankRec = async (e) => {
    e.preventDefault();
    try {
      const glBal = invoices.reduce((s, i) => s + (i.total_amount || 0), 0) - bills.reduce((s, b) => s + (b.total_amount || 0), 0);
      await FirmAccountingAPI.createBankReconciliation(companyId, {
        accountId: accounts[0]?.id || 'bank-op',
        statementBalance: bankRecForm.statementBalance,
        glBalance: glBal,
        statementDate: bankRecForm.statementDate,
      }, user?.id);
      toast.success('Bank reconciliation recorded');
      setShowBankRecModal(false);
      loadData();
    } catch (err) { toast.error('Reconciliation failed'); }
  };

  // ── Handlers — Office Income ─────────────────────────────────
  const handleAddIncome = async (e) => {
    e.preventDefault();
    try {
      await powerSync.execute(
        'INSERT INTO jcl_office_income (id, company_id, source, amount, category, description, date, created_at) VALUES (?,?,?,?,?,?,?,?)',
        [generateUUID(), companyId, incomeForm.source, Number(incomeForm.amount), incomeForm.category, incomeForm.description, incomeForm.date, new Date().toISOString()]
      );
      toast.success('Income recorded');
      setShowIncomeModal(false);
      setIncomeForm({ source: '', amount: '', category: 'Agency Fee', description: '', date: nowDate() });
      loadData();
    } catch (err) { toast.error('Failed to record income'); }
  };

  // ── Handlers — Office Expenses ───────────────────────────────
  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await powerSync.execute(
        'INSERT INTO jcl_office_expenses (id, company_id, description, amount, category, vendor, date, created_at) VALUES (?,?,?,?,?,?,?,?)',
        [generateUUID(), companyId, expenseForm.description, Number(expenseForm.amount), expenseForm.category, expenseForm.vendor, expenseForm.date, new Date().toISOString()]
      );
      toast.success('Expense recorded');
      setShowExpenseModal(false);
      setExpenseForm({ description: '', amount: '', category: 'Rent', vendor: '', date: nowDate() });
      loadData();
    } catch (err) { toast.error('Failed to record expense'); }
  };

  // ── Handlers — Project Expenses ──────────────────────────────
  const handleAddProjectExpense = async (e) => {
    e.preventDefault();
    try {
      await powerSync.execute(
        'INSERT INTO jcl_project_expenses (id, company_id, project_name, description, amount, category, date, created_at) VALUES (?,?,?,?,?,?,?,?)',
        [generateUUID(), companyId, projExpenseForm.projectName, projExpenseForm.description, Number(projExpenseForm.amount), projExpenseForm.category, projExpenseForm.date, new Date().toISOString()]
      );
      toast.success('Project expense recorded');
      setShowProjectExpenseModal(false);
      setProjExpenseForm({ projectName: '', description: '', amount: '', category: 'Materials', date: nowDate() });
      loadData();
    } catch (err) { toast.error('Failed to record project expense'); }
  };

  // ── Handlers — Payroll ───────────────────────────────────────
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const calc = calcGhanaPayroll(employeeForm.basicSalary);
      await powerSync.execute(
        'INSERT INTO jcl_payroll_employees (id, company_id, name, position, department, basic_salary, ssnit_employee, ssnit_employer, paye, net_pay, start_date, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [generateUUID(), companyId, employeeForm.name, employeeForm.position, employeeForm.department, calc.salary, calc.ssnitEmployee, calc.ssnitEmployer, calc.paye, calc.netPay, employeeForm.startDate, 'active', new Date().toISOString()]
      );
      toast.success(`${employeeForm.name} added — Net Pay: ${fmt(calc.netPay)}`);
      setShowPayrollEmployeeModal(false);
      setEmployeeForm({ name: '', position: '', department: '', basicSalary: '', startDate: nowDate() });
      loadData();
    } catch (err) { toast.error('Failed to add employee'); }
  };

  const handleRunPayroll = async (e) => {
    e.preventDefault();
    try {
      const totalNet = payrollEmployees.filter(emp => emp.status === 'active').reduce((s, emp) => s + (emp.net_pay || 0), 0);
      const totalGross = payrollEmployees.filter(emp => emp.status === 'active').reduce((s, emp) => s + (emp.basic_salary || 0), 0);
      const totalPaye = payrollEmployees.filter(emp => emp.status === 'active').reduce((s, emp) => s + (emp.paye || 0), 0);
      const totalSsnit = payrollEmployees.filter(emp => emp.status === 'active').reduce((s, emp) => s + (emp.ssnit_employee || 0) + (emp.ssnit_employer || 0), 0);
      await powerSync.execute(
        'INSERT INTO jcl_payroll_runs (id, company_id, period, employee_count, total_gross, total_net, total_paye, total_ssnit, notes, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        [generateUUID(), companyId, payrollRunForm.period, payrollEmployees.filter(e => e.status === 'active').length, totalGross, totalNet, totalPaye, totalSsnit, payrollRunForm.notes, 'posted', new Date().toISOString()]
      );
      toast.success(`Payroll run posted — ${fmt(totalNet)} net pay to ${payrollEmployees.filter(e => e.status === 'active').length} employees`);
      setShowPayrollRunModal(false);
      setPayrollRunForm({ period: '', notes: '' });
      loadData();
    } catch (err) { toast.error('Failed to run payroll'); }
  };

  // ── Handlers — TONEFO ────────────────────────────────────────
  const handleAddTonefoSale = async (e) => {
    e.preventDefault();
    try {
      const total = Number(tonefoSaleForm.totalPrice);
      const deposit = Number(tonefoSaleForm.depositPaid);
      const balance = total - deposit;
      const installAmt = balance / Math.max(1, Number(tonefoSaleForm.installmentMonths));
      await powerSync.execute(
        'INSERT INTO jcl_installment_sales (id, company_id, customer_name, customer_phone, item_description, total_price, deposit_paid, outstanding_balance, installment_months, monthly_installment, amount_collected, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [generateUUID(), companyId, tonefoSaleForm.customerName, tonefoSaleForm.customerPhone, tonefoSaleForm.itemDescription, total, deposit, balance, Number(tonefoSaleForm.installmentMonths), +installAmt.toFixed(2), deposit, balance <= 0 ? 'paid' : 'installment', new Date().toISOString()]
      );
      toast.success(`Sale recorded for ${tonefoSaleForm.customerName}`);
      setShowTonefoSaleModal(false);
      setTonefoSaleForm({ customerName: '', customerPhone: '', itemDescription: '', totalPrice: '', depositPaid: '', installmentMonths: 6 });
      loadData();
    } catch (err) { toast.error('Failed to record sale'); }
  };

  const handleRecordTonefoPayment = async (e) => {
    e.preventDefault();
    if (!selectedTonefoCase) return;
    try {
      const payAmt = Number(tonefoPaymentForm.amount);
      const newCollected = (selectedTonefoCase.amount_collected || 0) + payAmt;
      const newBalance = (selectedTonefoCase.total_price || 0) - newCollected;
      const newStatus = newBalance <= 0 ? 'paid' : 'installment';
      await powerSync.execute(
        'INSERT INTO jcl_installment_payments (id, company_id, sale_id, amount, payment_date, notes, created_at) VALUES (?,?,?,?,?,?,?)',
        [generateUUID(), companyId, selectedTonefoCase.id, payAmt, tonefoPaymentForm.paymentDate, tonefoPaymentForm.notes, new Date().toISOString()]
      );
      await powerSync.execute(
        'UPDATE jcl_installment_sales SET amount_collected = ?, outstanding_balance = ?, status = ? WHERE id = ?',
        [newCollected, Math.max(0, newBalance), newStatus, selectedTonefoCase.id]
      );
      toast.success(`Payment of ${fmt(payAmt)} recorded`);
      setShowTonefoPaymentModal(false);
      setSelectedTonefoCase(null);
      setTonefoPaymentForm({ amount: '', paymentDate: nowDate(), notes: '' });
      loadData();
    } catch (err) { toast.error('Failed to record payment'); }
  };

  // ── KPI computations ─────────────────────────────────────────
  const totalAR = invoices.reduce((s, i) => s + (i.total_amount || 0), 0);
  const totalAP = bills.reduce((s, b) => s + (b.total_amount || 0), 0);
  const netIncome = totalAR - totalAP;
  const totalIncomeRecorded = officeIncome.reduce((s, i) => s + (i.amount || 0), 0);
  const totalExpensesRecorded = officeExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalProjExp = projectExpenses.reduce((s, p) => s + (p.amount || 0), 0);
  const totalPayroll = payrollRuns.reduce((s, r) => s + (r.total_net || 0), 0);
  const totalOutstanding = tonefoCases.reduce((s, t) => s + (t.outstanding_balance || 0), 0);
  const totalCollected = tonefoCases.reduce((s, t) => s + (t.amount_collected || 0), 0);
  const activeEmployees = payrollEmployees.filter(e => e.status === 'active').length;

  // ── Filtered lists ───────────────────────────────────────────
  const q = search.toLowerCase();
  const filteredAccounts = accounts.filter(a => !q || a.name?.toLowerCase().includes(q) || a.code?.includes(q));
  const filteredInvoices = invoices.filter(i => !q || i.customer_name?.toLowerCase().includes(q) || i.invoice_number?.toLowerCase().includes(q));
  const filteredBills = bills.filter(b => !q || b.vendor_name?.toLowerCase().includes(q) || b.bill_number?.toLowerCase().includes(q));
  const filteredJVs = journalEntries.filter(j => !q || j.description?.toLowerCase().includes(q) || j.entry_number?.toLowerCase().includes(q));
  const filteredAssets = fixedAssets.filter(a => !q || a.asset_name?.toLowerCase().includes(q) || a.asset_code?.toLowerCase().includes(q));
  const filteredBankRecs = bankRecs.filter(r => !q || r.statement_date?.includes(q));
  const filteredIncome = officeIncome.filter(i => !q || i.source?.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q));
  const filteredExpenses = officeExpenses.filter(e => !q || e.description?.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q));
  const filteredProjExp = projectExpenses.filter(p => !q || p.project_name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
  const filteredEmployees = payrollEmployees.filter(e => !q || e.name?.toLowerCase().includes(q) || e.position?.toLowerCase().includes(q));
  const filteredTonefo = tonefoCases.filter(t => !q || t.customer_name?.toLowerCase().includes(q) || t.item_description?.toLowerCase().includes(q));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading Firm Accounting Suite...</span>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 p-3 sm:p-5 lg:p-6 pb-28 space-y-6 font-sans">

      {/* ── 1. Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-primary/70 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Firm Accounting</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              JCL Real Estate corporate accounting — income, expenses, payroll, TONEFO installments & reports
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} className="h-9 px-3 text-xs gap-1.5 border-border">
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} /> Refresh
          </Button>
          <Button onClick={() => setShowInvoiceModal(true)} size="sm" className="h-9 px-4 text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-md shadow-indigo-600/20 gap-1.5">
            <Plus className="h-4 w-4" /> New Invoice
          </Button>
        </div>
      </div>

      {/* ── 2. KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total AR (Invoices)" value={fmt(totalAR)} sub={`${invoices.length} invoices`} icon={DollarSign} color="emerald" />
        <KpiCard label="Total AP (Bills)" value={fmt(totalAP)} sub={`${bills.length} vendor bills`} icon={Receipt} color="rose" />
        <KpiCard label="Net Operating Income" value={fmt(netIncome)} sub="Invoices minus Bills" icon={LineChart} color={netIncome >= 0 ? 'indigo' : 'rose'} />
        <KpiCard label="TONEFO Outstanding" value={fmt(totalOutstanding)} sub={`${tonefoCases.length} customers`} icon={ShoppingBag} color="orange" />
      </div>

      {/* ── 3. Tab Navigation ── */}
      <nav aria-label="Finance sections" className={cn('w-full rounded-2xl border border-border/60 bg-card/90 p-2 shadow-sm transition-all', financeNavCollapsed && 'md:w-fit')}>
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-1 pb-2 mb-2">
          {!financeNavCollapsed && <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Finance sections</span>}
          <button
            type="button"
            onClick={() => setFinanceNavCollapsed(prev => !prev)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label={financeNavCollapsed ? 'Expand Finance navigation' : 'Collapse Finance navigation'}
            title={financeNavCollapsed ? 'Expand Finance navigation' : 'Collapse Finance navigation'}
          >
            {financeNavCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        <div className={cn('flex flex-wrap gap-2', financeNavCollapsed && 'md:flex-col')}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'inline-flex min-h-10 items-center gap-2 rounded-xl px-3.5 py-2.5 text-left text-[11px] font-semibold transition-all',
                  financeNavCollapsed && 'md:w-10 md:justify-center md:px-0',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                title={financeNavCollapsed ? tab.label : undefined}
                aria-label={financeNavCollapsed ? tab.label : undefined}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {!financeNavCollapsed && tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB: CHART OF ACCOUNTS                                */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'coa' && (
        <div className="space-y-4">
          <SectionHeader icon={BookOpen} title="Corporate Chart of Accounts" color="indigo"
            action={<Button size="sm" onClick={() => setShowAccountModal(true)} className={cn('gap-1.5 h-8 text-xs font-semibold text-white shadow-md', TAB_COLORS.indigo.btn)}><Plus className="w-3.5 h-3.5" /> Add Account</Button>} />
          <FilterBar search={search} onSearch={setSearch} placeholder="Search accounts by code or name..." />
          <TableShell headers={[{ label: 'Code' }, { label: 'Account Name' }, { label: 'Type' }, { label: 'Status' }]}>
            {filteredAccounts.length === 0 ? (
              <tr><td colSpan={4}><EmptyState icon={BookOpen} title="No Accounts Yet" desc="Add your first account code to begin building the Chart of Accounts." color="indigo" /></td></tr>
            ) : filteredAccounts.map(acc => (
              <tr key={acc.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{acc.code}</td>
                <td className="py-3 px-4 font-semibold text-foreground">{acc.name}</td>
                <td className="py-3 px-4"><Badge variant="outline" className={TAB_COLORS.indigo.badge}>{acc.type}</Badge></td>
                <td className="py-3 px-4"><Badge variant="outline" className={TAB_COLORS.emerald.badge}>Active</Badge></td>
              </tr>
            ))}
          </TableShell>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB: INVOICES (AR)                                     */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <SectionHeader icon={Receipt} title="Accounts Receivable — Customer Invoices" color="emerald"
            action={<Button size="sm" onClick={() => setShowInvoiceModal(true)} className={cn('gap-1.5 h-8 text-xs font-semibold text-white shadow-md', TAB_COLORS.emerald.btn)}><Plus className="w-3.5 h-3.5" /> Create Invoice</Button>} />
          <FilterBar search={search} onSearch={setSearch} placeholder="Search by customer or invoice number..." />
          <TableShell headers={[{ label: 'Invoice #' }, { label: 'Customer' }, { label: 'Issue Date' }, { label: 'Due Date' }, { label: 'Total', right: true }, { label: 'Status', center: true }]}>
            {filteredInvoices.length === 0 ? (
              <tr><td colSpan={6}><EmptyState icon={Receipt} title="No Invoices Created" desc="Create your first customer invoice. GL journal entry posts automatically." color="emerald" /></td></tr>
            ) : filteredInvoices.map(inv => (
              <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-foreground">{inv.invoice_number}</td>
                <td className="py-3 px-4 font-semibold text-foreground">{inv.customer_name}</td>
                <td className="py-3 px-4 text-muted-foreground font-medium">{inv.issue_date || '—'}</td>
                <td className="py-3 px-4 text-muted-foreground font-medium">{inv.due_date}</td>
                <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">{fmt(inv.total_amount)}</td>
                <td className="py-3 px-4 text-center"><StatusBadge status={inv.status} /></td>
              </tr>
            ))}
          </TableShell>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB: BILLS (AP)                                        */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'bills' && (
        <div className="space-y-4">
          <SectionHeader icon={FileText} title="Accounts Payable — Vendor Bills" color="rose"
            action={<Button size="sm" onClick={() => setShowBillModal(true)} className={cn('gap-1.5 h-8 text-xs font-semibold text-white shadow-md', TAB_COLORS.rose.btn)}><Plus className="w-3.5 h-3.5" /> Record Bill</Button>} />
          <FilterBar search={search} onSearch={setSearch} placeholder="Search by vendor or bill number..." />
          <TableShell headers={[{ label: 'Bill #' }, { label: 'Vendor' }, { label: 'Due Date' }, { label: 'Total', right: true }, { label: 'Status', center: true }]}>
            {filteredBills.length === 0 ? (
              <tr><td colSpan={5}><EmptyState icon={FileText} title="No Bills Recorded" desc="Record a vendor bill. GL AP journal entry posts automatically." color="rose" /></td></tr>
            ) : filteredBills.map(b => (
              <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-foreground">{b.bill_number}</td>
                <td className="py-3 px-4 font-semibold text-foreground">{b.vendor_name}</td>
                <td className="py-3 px-4 text-muted-foreground font-medium">{b.due_date}</td>
                <td className="py-3 px-4 text-right font-extrabold text-rose-600 dark:text-rose-400">{fmt(b.total_amount)}</td>
                <td className="py-3 px-4 text-center"><StatusBadge status={b.status} /></td>
              </tr>
            ))}
          </TableShell>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB: GENERAL LEDGER / JOURNAL VOUCHERS                */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'jv' && (
        <div className="space-y-4">
          <SectionHeader icon={LineChart} title="General Ledger — Journal Vouchers (Double-Entry)" color="purple"
            action={<Button size="sm" onClick={() => setShowJVModal(true)} className={cn('gap-1.5 h-8 text-xs font-semibold text-white shadow-md', TAB_COLORS.purple.btn)}><Plus className="w-3.5 h-3.5" /> Post JV Entry</Button>} />
          <FilterBar search={search} onSearch={setSearch} placeholder="Search journal entries..." />
          <TableShell headers={[{ label: 'JV #' }, { label: 'Date' }, { label: 'Description' }, { label: 'Reference' }, { label: 'Status', center: true }]}>
            {filteredJVs.length === 0 ? (
              <tr><td colSpan={5}><EmptyState icon={LineChart} title="No Journal Entries" desc="Post double-entry journal vouchers to the general ledger." color="purple" /></td></tr>
            ) : filteredJVs.map(jv => (
              <tr key={jv.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-purple-600 dark:text-purple-400">{jv.entry_number}</td>
                <td className="py-3 px-4 text-muted-foreground font-medium">{jv.entry_date}</td>
                <td className="py-3 px-4 font-semibold text-foreground">{jv.description}</td>
                <td className="py-3 px-4 font-mono text-muted-foreground">{jv.reference || '—'}</td>
                <td className="py-3 px-4 text-center"><StatusBadge status={jv.status || 'posted'} /></td>
              </tr>
            ))}
          </TableShell>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB: FIXED ASSETS                                      */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'assets' && (
        <div className="space-y-4">
          <SectionHeader icon={Landmark} title="Fixed Assets & Depreciation Schedule" color="amber"
            action={<Button size="sm" onClick={() => setShowAssetModal(true)} className={cn('gap-1.5 h-8 text-xs font-semibold text-white shadow-md', TAB_COLORS.amber.btn)}><Plus className="w-3.5 h-3.5" /> Add Asset</Button>} />
          <FilterBar search={search} onSearch={setSearch} placeholder="Search assets by name or code..." />

          {filteredAssets.length === 0 ? (
            <div className="border border-border rounded-xl bg-card overflow-hidden">
              <EmptyState icon={Landmark} title="No Fixed Assets" desc="Register company assets and run monthly depreciation automatically." color="amber" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAssets.map(ast => {
                const pct = ast.purchase_cost > 0 ? Math.min(100, ((ast.accumulated_depreciation || 0) / ast.purchase_cost) * 100) : 0;
                return (
                  <div key={ast.id} className="bg-card/95 backdrop-blur-xl rounded-[26px] border border-border/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-xl hover:border-amber-500/50 transition-all flex flex-col justify-between overflow-hidden group">
                    <div className="p-5 pb-4 space-y-3.5 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                            <Landmark className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-[14px] text-foreground group-hover:text-amber-600 transition-colors truncate">{ast.asset_name}</h3>
                            <span className="text-[10px] font-bold text-muted-foreground">{ast.asset_code} · {ast.category}</span>
                          </div>
                        </div>
                        <StatusBadge status={ast.status || 'active'} />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground font-semibold">Depreciation</span>
                          <span className="font-bold text-amber-600">{pct.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-2xl border border-border/50 space-y-1">
                        <div className="flex justify-between"><span className="font-medium">Purchase Cost</span><span className="font-bold">{fmt(ast.purchase_cost)}</span></div>
                        <div className="flex justify-between"><span className="font-medium">Accum. Depreciation</span><span className="font-bold text-rose-500">-{fmt(ast.accumulated_depreciation)}</span></div>
                      </div>
                    </div>
                    <div className="p-4 px-5 border-t border-border/70 bg-muted/15 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-wider block">Net Book Value</span>
                        <span className="text-base font-black text-emerald-600">{fmt(ast.net_book_value)}</span>
                      </div>
                      <Button size="sm" onClick={() => handleDepreciate(ast.id)} className="text-xs h-8 px-3 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm gap-1">
                        <ArrowDownLeft className="w-3.5 h-3.5" /> Depreciate
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB: BANK RECONCILIATION                               */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'bankrec' && (
        <div className="space-y-4">
          <SectionHeader icon={CheckCircle2} title="Bank Statement Reconciliation" color="teal"
            action={<Button size="sm" onClick={() => setShowBankRecModal(true)} className={cn('gap-1.5 h-8 text-xs font-semibold text-white shadow-md', TAB_COLORS.teal.btn)}><Plus className="w-3.5 h-3.5" /> Start Reconciliation</Button>} />
          <FilterBar search={search} onSearch={setSearch} placeholder="Search reconciliations..." />
          <TableShell headers={[{ label: 'Statement Date' }, { label: 'Bank Balance', right: true }, { label: 'GL Balance', right: true }, { label: 'Difference', right: true }, { label: 'Status', center: true }]}>
            {filteredBankRecs.length === 0 ? (
              <tr><td colSpan={5}><EmptyState icon={CheckCircle2} title="No Reconciliations" desc="Compare bank statement balance against the general ledger to reconcile." color="teal" /></td></tr>
            ) : filteredBankRecs.map(rec => {
              const diff = Math.abs(rec.difference || 0);
              return (
                <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-foreground">{rec.statement_date}</td>
                  <td className="py-3 px-4 text-right font-medium">{fmt(rec.statement_balance)}</td>
                  <td className="py-3 px-4 text-right font-medium">{fmt(rec.gl_balance)}</td>
                  <td className={cn('py-3 px-4 text-right font-extrabold', diff < 0.01 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>{fmt(rec.difference)}</td>
                  <td className="py-3 px-4 text-center"><StatusBadge status={rec.status} /></td>
                </tr>
              );
            })}
          </TableShell>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB: INCOME & EXPENSES                                 */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'income' && (
        <div className="space-y-5">
          {/* Sub-tabs */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/50 w-fit">
            {[
              { id: 'income', label: 'Office Income', icon: ArrowUpRight },
              { id: 'expenses', label: 'Office Expenses', icon: ArrowDownLeft },
              { id: 'project', label: 'Project Expenses', icon: Building2 },
            ].map(sub => {
              const SubIcon = sub.icon;
              return (
                <button key={sub.id} onClick={() => setIncomeSubTab(sub.id)}
                  className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all',
                    incomeSubTab === sub.id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                  <SubIcon className="w-3.5 h-3.5" />{sub.label}
                </button>
              );
            })}
          </div>

          {/* Office Income */}
          {incomeSubTab === 'income' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <KpiCard label="Total Income Recorded" value={fmt(totalIncomeRecorded)} sub={`${officeIncome.length} entries`} icon={ArrowUpRight} color="blue" />
                <KpiCard label="Net P&L (Income - Expenses)" value={fmt(totalIncomeRecorded - totalExpensesRecorded)} sub="Office level" icon={TrendingUp} color={totalIncomeRecorded >= totalExpensesRecorded ? 'emerald' : 'rose'} />
              </div>
              <SectionHeader icon={ArrowUpRight} title="Office Income Records" color="blue"
                action={<Button size="sm" onClick={() => setShowIncomeModal(true)} className={cn('gap-1.5 h-8 text-xs font-semibold text-white shadow-md', TAB_COLORS.blue.btn)}><Plus className="w-3.5 h-3.5" /> Record Income</Button>} />
              <FilterBar search={search} onSearch={setSearch} placeholder="Search income records..." />
              <TableShell headers={[{ label: 'Date' }, { label: 'Source' }, { label: 'Category' }, { label: 'Description' }, { label: 'Amount', right: true }]}>
                {filteredIncome.length === 0 ? (
                  <tr><td colSpan={5}><EmptyState icon={ArrowUpRight} title="No Income Recorded" desc="Record office income: agency fees, commissions, rent income, consulting fees, etc." color="blue" /></td></tr>
                ) : filteredIncome.map(inc => (
                  <tr key={inc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-muted-foreground">{inc.date}</td>
                    <td className="py-3 px-4 font-semibold text-foreground">{inc.source}</td>
                    <td className="py-3 px-4"><Badge variant="outline" className={TAB_COLORS.blue.badge}>{inc.category}</Badge></td>
                    <td className="py-3 px-4 text-muted-foreground">{inc.description || '—'}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">{fmt(inc.amount)}</td>
                  </tr>
                ))}
              </TableShell>
            </div>
          )}

          {/* Office Expenses */}
          {incomeSubTab === 'expenses' && (
            <div className="space-y-4">
              <KpiCard label="Total Office Expenses" value={fmt(totalExpensesRecorded)} sub={`${officeExpenses.length} entries`} icon={ArrowDownLeft} color="rose" />
              <SectionHeader icon={ArrowDownLeft} title="Office Expenses" color="rose"
                action={<Button size="sm" onClick={() => setShowExpenseModal(true)} className={cn('gap-1.5 h-8 text-xs font-semibold text-white shadow-md', TAB_COLORS.rose.btn)}><Plus className="w-3.5 h-3.5" /> Record Expense</Button>} />
              <FilterBar search={search} onSearch={setSearch} placeholder="Search expenses..." />
              <TableShell headers={[{ label: 'Date' }, { label: 'Description' }, { label: 'Category' }, { label: 'Vendor / Payee' }, { label: 'Amount', right: true }]}>
                {filteredExpenses.length === 0 ? (
                  <tr><td colSpan={5}><EmptyState icon={ArrowDownLeft} title="No Expenses Recorded" desc="Track office-level expenses: rent, utilities, salaries, marketing, admin costs." color="rose" /></td></tr>
                ) : filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-muted-foreground">{exp.date}</td>
                    <td className="py-3 px-4 font-semibold text-foreground">{exp.description}</td>
                    <td className="py-3 px-4"><Badge variant="outline" className={TAB_COLORS.rose.badge}>{exp.category}</Badge></td>
                    <td className="py-3 px-4 text-muted-foreground">{exp.vendor || '—'}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-rose-600 dark:text-rose-400">{fmt(exp.amount)}</td>
                  </tr>
                ))}
              </TableShell>
            </div>
          )}

          {/* Project Expenses */}
          {incomeSubTab === 'project' && (
            <div className="space-y-4">
              <KpiCard label="Total Project Costs" value={fmt(totalProjExp)} sub={`${projectExpenses.length} entries`} icon={Building2} color="amber" />
              <SectionHeader icon={Building2} title="Project-Linked Expenses" color="amber"
                action={<Button size="sm" onClick={() => setShowProjectExpenseModal(true)} className={cn('gap-1.5 h-8 text-xs font-semibold text-white shadow-md', TAB_COLORS.amber.btn)}><Plus className="w-3.5 h-3.5" /> Add Project Cost</Button>} />
              <FilterBar search={search} onSearch={setSearch} placeholder="Search by project name or description..." />
              <TableShell headers={[{ label: 'Date' }, { label: 'Project' }, { label: 'Description' }, { label: 'Category' }, { label: 'Amount', right: true }]}>
                {filteredProjExp.length === 0 ? (
                  <tr><td colSpan={5}><EmptyState icon={Building2} title="No Project Expenses" desc="Track costs linked to specific real estate projects: materials, contractors, permits." color="amber" /></td></tr>
                ) : filteredProjExp.map(pe => (
                  <tr key={pe.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-muted-foreground">{pe.date}</td>
                    <td className="py-3 px-4 font-semibold text-foreground">{pe.project_name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{pe.description}</td>
                    <td className="py-3 px-4"><Badge variant="outline" className={TAB_COLORS.amber.badge}>{pe.category}</Badge></td>
                    <td className="py-3 px-4 text-right font-extrabold text-amber-600 dark:text-amber-400">{fmt(pe.amount)}</td>
                  </tr>
                ))}
              </TableShell>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB: PAYROLL & TAX (Ghana PAYE / SSNIT)               */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'payroll' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Active Employees" value={activeEmployees} sub="On payroll roster" icon={Users} color="violet" />
            <KpiCard label="Total Payroll Runs" value={fmt(totalPayroll)} sub={`${payrollRuns.length} runs`} icon={Banknote} color="indigo" />
            <KpiCard label="Monthly Gross (Active)" value={fmt(payrollEmployees.filter(e => e.status === 'active').reduce((s, e) => s + (e.basic_salary || 0), 0))} sub="Total gross salaries" icon={DollarSign} color="emerald" />
            <KpiCard label="Monthly Net (Active)" value={fmt(payrollEmployees.filter(e => e.status === 'active').reduce((s, e) => s + (e.net_pay || 0), 0))} sub="After PAYE & SSNIT" icon={Shield} color="teal" />
          </div>

          <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20 text-xs">
            <p className="font-bold text-violet-700 dark:text-violet-300 mb-1">🇬🇭 Ghana Tax Compliance</p>
            <p className="text-muted-foreground">PAYE calculated per GRA 2024 progressive brackets. SSNIT: Employee 5.5% + Employer 13%. Tier 1 & Tier 2 included.</p>
          </div>

          {/* Employees */}
          <SectionHeader icon={Users} title="Employee Payroll Roster" color="violet"
            action={<Button size="sm" onClick={() => setShowPayrollEmployeeModal(true)} className={cn('gap-1.5 h-8 text-xs font-semibold text-white shadow-md', TAB_COLORS.violet.btn)}><Plus className="w-3.5 h-3.5" /> Add Employee</Button>} />
          <FilterBar search={search} onSearch={setSearch} placeholder="Search employees by name or position..." />

          {filteredEmployees.length === 0 ? (
            <div className="border border-border rounded-xl bg-card overflow-hidden">
              <EmptyState icon={Users} title="No Employees Added" desc="Add employees to the payroll roster. Ghana PAYE & SSNIT are calculated automatically." color="violet" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map(emp => {
                const tax = calcGhanaPayroll(emp.basic_salary);
                return (
                  <div key={emp.id} className="bg-card/95 backdrop-blur-xl rounded-[26px] border border-border/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-xl hover:border-violet-500/50 transition-all overflow-hidden group">
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 font-extrabold text-sm">
                          {emp.name?.charAt(0)?.toUpperCase() || 'E'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-extrabold text-[14px] text-foreground truncate">{emp.name}</h3>
                          <p className="text-[11px] text-muted-foreground">{emp.position} · {emp.department}</p>
                        </div>
                        <StatusBadge status={emp.status || 'active'} />
                      </div>
                      <div className="text-xs bg-muted/30 p-3 rounded-2xl border border-border/50 space-y-1.5">
                        <div className="flex justify-between"><span className="text-muted-foreground font-medium">Gross Salary</span><span className="font-bold">{fmt(emp.basic_salary)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground font-medium">SSNIT (Employee)</span><span className="font-bold text-rose-500">-{fmt(emp.ssnit_employee)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground font-medium">PAYE Tax</span><span className="font-bold text-rose-500">-{fmt(emp.paye)}</span></div>
                        <div className="flex justify-between border-t border-border pt-1 mt-1"><span className="text-muted-foreground font-bold">Net Pay</span><span className="font-extrabold text-emerald-600">{fmt(emp.net_pay)}</span></div>
                        <div className="flex justify-between text-[10px] pt-1 text-muted-foreground"><span>Employer SSNIT (13%)</span><span>{fmt(emp.basic_salary * 0.13)}</span></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Payroll Runs */}
          <SectionHeader icon={ClipboardList} title="Payroll Run History" color="violet"
            action={<Button size="sm" onClick={() => setShowPayrollRunModal(true)} disabled={activeEmployees === 0} className={cn('gap-1.5 h-8 text-xs font-semibold text-white shadow-md', TAB_COLORS.violet.btn)}><Banknote className="w-3.5 h-3.5" /> Run Payroll</Button>} />
          <TableShell headers={[{ label: 'Period' }, { label: 'Employees', center: true }, { label: 'Total Gross', right: true }, { label: 'Total PAYE', right: true }, { label: 'Total SSNIT', right: true }, { label: 'Total Net', right: true }, { label: 'Status', center: true }]}>
            {payrollRuns.length === 0 ? (
              <tr><td colSpan={7}><EmptyState icon={Banknote} title="No Payroll Runs" desc="Add employees above then click Run Payroll to generate a payroll record." color="violet" /></td></tr>
            ) : payrollRuns.map(run => (
              <tr key={run.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 font-semibold text-foreground">{run.period}</td>
                <td className="py-3 px-4 text-center text-muted-foreground">{run.employee_count}</td>
                <td className="py-3 px-4 text-right font-medium">{fmt(run.total_gross)}</td>
                <td className="py-3 px-4 text-right text-rose-500 font-medium">{fmt(run.total_paye)}</td>
                <td className="py-3 px-4 text-right text-rose-500 font-medium">{fmt(run.total_ssnit)}</td>
                <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">{fmt(run.total_net)}</td>
                <td className="py-3 px-4 text-center"><StatusBadge status={run.status || 'posted'} /></td>
              </tr>
            ))}
          </TableShell>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB: TONEFO INSTALLMENTS                               */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'tonefo' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Customers" value={tonefoCases.length} sub="Electronics sales" icon={ShoppingBag} color="orange" />
            <KpiCard label="Total Collected" value={fmt(totalCollected)} sub="Payments received" icon={ArrowUpRight} color="emerald" />
            <KpiCard label="Outstanding Balance" value={fmt(totalOutstanding)} sub="Still owed" icon={ArrowDownLeft} color="rose" />
            <KpiCard label="Active Installments" value={tonefoCases.filter(t => t.status === 'installment').length} sub="Ongoing payments" icon={Phone} color="orange" />
          </div>

          <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 text-xs">
            <p className="font-bold text-orange-700 dark:text-orange-300 mb-1">📱 TONEFO Electronics — Installment Tracker</p>
            <p className="text-muted-foreground">Track customer purchases on installment. Record full or partial payments, monitor outstanding balances per customer.</p>
          </div>

          <SectionHeader icon={ShoppingBag} title="TONEFO Customer Sales" color="orange"
            action={<Button size="sm" onClick={() => setShowTonefoSaleModal(true)} className={cn('gap-1.5 h-8 text-xs font-semibold text-white shadow-md', TAB_COLORS.orange.btn)}><Plus className="w-3.5 h-3.5" /> New Sale</Button>} />
          <FilterBar search={search} onSearch={setSearch} placeholder="Search by customer name or item..." />

          {filteredTonefo.length === 0 ? (
            <div className="border border-border rounded-xl bg-card overflow-hidden">
              <EmptyState icon={ShoppingBag} title="No Sales Recorded" desc="Record a TONEFO electronics sale. Track installment payments per customer." color="orange" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTonefo.map(sale => {
                const progress = sale.total_price > 0 ? Math.min(100, ((sale.amount_collected || 0) / sale.total_price) * 100) : 0;
                const casePayments = tonefoPayments.filter(p => p.sale_id === sale.id);
                return (
                  <div key={sale.id} className="bg-card/95 backdrop-blur-xl rounded-[26px] border border-border/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-xl hover:border-orange-500/50 transition-all flex flex-col justify-between overflow-hidden group">
                    <div className="p-5 pb-4 space-y-3.5 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 font-extrabold text-sm shrink-0">
                            {sale.customer_name?.charAt(0)?.toUpperCase() || 'C'}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-[14px] text-foreground truncate">{sale.customer_name}</h3>
                            <p className="text-[11px] text-muted-foreground truncate">{sale.item_description}</p>
                          </div>
                        </div>
                        <StatusBadge status={sale.status} />
                      </div>
                      {sale.customer_phone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" />{sale.customer_phone}
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground font-semibold">Payment Progress</span>
                          <span className="font-bold text-orange-600">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-2xl border border-border/50 space-y-1">
                        <div className="flex justify-between"><span className="font-medium">Total Price</span><span className="font-bold">{fmt(sale.total_price)}</span></div>
                        <div className="flex justify-between"><span className="font-medium">Collected</span><span className="font-bold text-emerald-600">{fmt(sale.amount_collected)}</span></div>
                        <div className="flex justify-between"><span className="font-medium">Monthly Installment</span><span className="font-bold text-indigo-600">{fmt(sale.monthly_installment)}</span></div>
                        <div className="flex justify-between text-[10px] pt-1 border-t border-border"><span>Payments: {casePayments.length}</span><span>Months: {sale.installment_months}</span></div>
                      </div>
                    </div>
                    <div className="p-4 px-5 border-t border-border/70 bg-muted/15 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-wider block">Outstanding</span>
                        <span className={cn('text-base font-black', (sale.outstanding_balance || 0) <= 0 ? 'text-emerald-600' : 'text-rose-600')}>{fmt(Math.max(0, sale.outstanding_balance))}</span>
                      </div>
                      {sale.status !== 'paid' && (
                        <Button size="sm" onClick={() => { setSelectedTonefoCase(sale); setShowTonefoPaymentModal(true); }}
                          className="text-xs h-8 px-3 font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-sm gap-1">
                          <Plus className="w-3.5 h-3.5" /> Payment
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Payment history */}
          {tonefoPayments.length > 0 && (
            <>
              <SectionHeader icon={Banknote} title="All Payment Records" color="orange" />
              <TableShell headers={[{ label: 'Date' }, { label: 'Customer' }, { label: 'Item' }, { label: 'Amount', right: true }, { label: 'Notes' }]}>
                {tonefoPayments.map(pay => {
                  const sale = tonefoCases.find(s => s.id === pay.sale_id);
                  return (
                    <tr key={pay.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-muted-foreground">{pay.payment_date}</td>
                      <td className="py-3 px-4 font-semibold text-foreground">{sale?.customer_name || '—'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{sale?.item_description || '—'}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">{fmt(pay.amount)}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{pay.notes || '—'}</td>
                    </tr>
                  );
                })}
              </TableShell>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB: REPORTS                                           */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'reports' && (
        <div className="space-y-5">
          <SectionHeader icon={BarChart2} title="Financial Reports Dashboard" color="pink" />

          {/* P&L Summary */}
          <div className="bg-card/95 backdrop-blur-xl rounded-[26px] border border-border/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 space-y-4">
            <h3 className="text-[13px] font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
              <BarChart className="h-4 w-4 text-pink-600" /> Profit & Loss Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Total Income</span>
                <p className="text-xl font-extrabold text-emerald-600">{fmt(totalIncomeRecorded + totalAR)}</p>
                <p className="text-[11px] text-muted-foreground">Office income + AR invoices</p>
              </div>
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Total Expenses</span>
                <p className="text-xl font-extrabold text-rose-600">{fmt(totalExpensesRecorded + totalAP + totalProjExp + totalPayroll)}</p>
                <p className="text-[11px] text-muted-foreground">Office + AP + Projects + Payroll</p>
              </div>
              <div className={cn('border rounded-2xl p-4 space-y-1', (totalIncomeRecorded + totalAR) >= (totalExpensesRecorded + totalAP + totalProjExp + totalPayroll) ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-rose-500/5 border-rose-500/20')}>
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Net Profit / Loss</span>
                <p className={cn('text-xl font-extrabold', (totalIncomeRecorded + totalAR) >= (totalExpensesRecorded + totalAP + totalProjExp + totalPayroll) ? 'text-indigo-600' : 'text-rose-600')}>
                  {fmt((totalIncomeRecorded + totalAR) - (totalExpensesRecorded + totalAP + totalProjExp + totalPayroll))}
                </p>
                <p className="text-[11px] text-muted-foreground">Combined net position</p>
              </div>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="bg-card/95 backdrop-blur-xl rounded-[26px] border border-border/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 space-y-4">
            <h3 className="text-[13px] font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-pink-600" /> Expense Breakdown
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Office Expenses', value: totalExpensesRecorded, color: 'rose' },
                { label: 'Vendor Bills (AP)', value: totalAP, color: 'rose' },
                { label: 'Project Expenses', value: totalProjExp, color: 'amber' },
                { label: 'Payroll (Net Pay)', value: totalPayroll, color: 'violet' },
              ].map(row => {
                const total = totalExpensesRecorded + totalAP + totalProjExp + totalPayroll;
                const pct = total > 0 ? (row.value / total) * 100 : 0;
                return (
                  <div key={row.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-foreground">{row.label}</span>
                      <span className="font-bold text-foreground">{fmt(row.value)} <span className="text-muted-foreground font-normal">({pct.toFixed(0)}%)</span></span>
                    </div>
                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', `bg-${row.color}-500`)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payroll Summary */}
          <div className="bg-card/95 backdrop-blur-xl rounded-[26px] border border-border/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 space-y-4">
            <h3 className="text-[13px] font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-pink-600" /> Payroll & Tax Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {[
                { label: 'Active Staff', value: activeEmployees + ' employees', color: 'violet' },
                { label: 'Monthly Gross Payroll', value: fmt(payrollEmployees.filter(e => e.status === 'active').reduce((s, e) => s + (e.basic_salary || 0), 0)), color: 'indigo' },
                { label: 'Monthly PAYE (GRA)', value: fmt(payrollEmployees.filter(e => e.status === 'active').reduce((s, e) => s + (e.paye || 0), 0)), color: 'rose' },
                { label: 'Monthly SSNIT', value: fmt(payrollEmployees.filter(e => e.status === 'active').reduce((s, e) => s + (e.ssnit_employee || 0) + (e.basic_salary || 0) * 0.13, 0)), color: 'amber' },
              ].map(item => (
                <div key={item.label} className={cn('rounded-2xl p-4 border', `bg-${item.color}-500/5 border-${item.color}-500/20`)}>
                  <span className={cn('text-[10px] font-black uppercase tracking-wider', `text-${item.color}-700 dark:text-${item.color}-300`)}>{item.label}</span>
                  <p className="text-lg font-extrabold text-foreground mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* TONEFO Collection Summary */}
          <div className="bg-card/95 backdrop-blur-xl rounded-[26px] border border-border/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 space-y-4">
            <h3 className="text-[13px] font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-pink-600" /> TONEFO Collection Report
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Sales Value', value: fmt(tonefoCases.reduce((s, t) => s + (t.total_price || 0), 0)), color: 'orange' },
                { label: 'Total Collected', value: fmt(totalCollected), color: 'emerald' },
                { label: 'Outstanding', value: fmt(totalOutstanding), color: 'rose' },
                { label: 'Collection Rate', value: tonefoCases.length > 0 ? ((totalCollected / tonefoCases.reduce((s, t) => s + (t.total_price || 0), 0)) * 100).toFixed(1) + '%' : '0%', color: 'indigo' },
              ].map(item => (
                <div key={item.label} className={cn('rounded-2xl p-4 border', `bg-${item.color}-500/5 border-${item.color}-500/20`)}>
                  <span className={cn('text-[10px] font-black uppercase tracking-wider', `text-${item.color}-700 dark:text-${item.color}-300`)}>{item.label}</span>
                  <p className="text-lg font-extrabold text-foreground mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* SHEETS / MODALS                                         */}
      {/* ══════════════════════════════════════════════════════ */}

      {/* Add Account */}
      <Sheet open={showAccountModal} onOpenChange={setShowAccountModal}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4"><SheetTitle>Add Account to Chart of Accounts</SheetTitle><SheetDescription>Configure a new GL account code</SheetDescription></SheetHeader>
          <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
            <div><Label className="text-xs">Account Code (e.g. 1300)</Label><Input value={accountForm.code} onChange={e => setAccountForm({ ...accountForm, code: e.target.value })} placeholder="1300" className="h-9 text-xs mt-1" required /></div>
            <div><Label className="text-xs">Account Name</Label><Input value={accountForm.name} onChange={e => setAccountForm({ ...accountForm, name: e.target.value })} placeholder="Software Subscriptions" className="h-9 text-xs mt-1" required /></div>
            <div><Label className="text-xs">Type</Label>
              <Select value={accountForm.type} onValueChange={v => setAccountForm({ ...accountForm, type: v })}>
                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{['Asset','Liability','Equity','Revenue','Expense'].map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full h-9 text-xs font-bold bg-primary hover:bg-primary/90 text-white mt-2">Add Account</Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Journal Entry */}
      <Sheet open={showJVModal} onOpenChange={setShowJVModal}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4"><SheetTitle>Post Journal Voucher</SheetTitle><SheetDescription>Double-entry — Debits must equal Credits</SheetDescription></SheetHeader>
          <form onSubmit={handlePostJV} className="space-y-4 text-xs">
            <div><Label className="text-xs">Description</Label><Input value={jvForm.description} onChange={e => setJvForm({ ...jvForm, description: e.target.value })} placeholder="Monthly rent accrual" className="h-9 text-xs mt-1" required /></div>
            <div><Label className="text-xs">Reference</Label><Input value={jvForm.reference} onChange={e => setJvForm({ ...jvForm, reference: e.target.value })} placeholder="REF-001" className="h-9 text-xs mt-1" /></div>
            <div className="space-y-3 border p-3 rounded-lg bg-muted/20">
              <span className="text-xs font-bold uppercase text-muted-foreground">Line 1 — Debit</span>
              <Select value={jvForm.lineItems[0].accountId} onValueChange={v => { const li = [...jvForm.lineItems]; li[0].accountId = v; setJvForm({ ...jvForm, lineItems: li }); }}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id} className="text-xs">{a.code} — {a.name}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" placeholder="Debit amount" onChange={e => { const li = [...jvForm.lineItems]; li[0].debit = Number(e.target.value); li[0].credit = 0; setJvForm({ ...jvForm, lineItems: li }); }} className="h-9 text-xs" required />
            </div>
            <div className="space-y-3 border p-3 rounded-lg bg-muted/20">
              <span className="text-xs font-bold uppercase text-muted-foreground">Line 2 — Credit</span>
              <Select value={jvForm.lineItems[1].accountId} onValueChange={v => { const li = [...jvForm.lineItems]; li[1].accountId = v; setJvForm({ ...jvForm, lineItems: li }); }}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id} className="text-xs">{a.code} — {a.name}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" placeholder="Credit amount" onChange={e => { const li = [...jvForm.lineItems]; li[1].credit = Number(e.target.value); li[1].debit = 0; setJvForm({ ...jvForm, lineItems: li }); }} className="h-9 text-xs" required />
            </div>
            <Button type="submit" className="w-full h-9 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white">Post Journal Entry</Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Create Invoice */}
      <Sheet open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4"><SheetTitle>Create Customer Invoice</SheetTitle><SheetDescription>Invoice auto-posts AR journal entry to GL</SheetDescription></SheetHeader>
          <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
            <div><Label className="text-xs">Customer Name</Label><Input value={invoiceForm.customerName} onChange={e => setInvoiceForm({ ...invoiceForm, customerName: e.target.value })} placeholder="Acme Corp" className="h-9 text-xs mt-1" required /></div>
            <div><Label className="text-xs">Customer Email</Label><Input value={invoiceForm.customerEmail} onChange={e => setInvoiceForm({ ...invoiceForm, customerEmail: e.target.value })} placeholder="billing@acme.com" className="h-9 text-xs mt-1" /></div>
            <div><Label className="text-xs">Service / Item Description</Label><Input value={invoiceForm.items[0].description} onChange={e => { const items = [...invoiceForm.items]; items[0].description = e.target.value; setInvoiceForm({ ...invoiceForm, items }); }} className="h-9 text-xs mt-1" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Amount (GH₵)</Label><Input type="number" value={invoiceForm.items[0].unitPrice} onChange={e => { const items = [...invoiceForm.items]; items[0].unitPrice = Number(e.target.value); setInvoiceForm({ ...invoiceForm, items }); }} className="h-9 text-xs mt-1" required /></div>
              <div><Label className="text-xs">Due Date</Label><Input type="date" value={invoiceForm.dueDate} onChange={e => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} className="h-9 text-xs mt-1" required /></div>
            </div>
            <Button type="submit" className="w-full h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white">Create & Post Invoice</Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Record Bill */}
      <Sheet open={showBillModal} onOpenChange={setShowBillModal}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4"><SheetTitle>Record Vendor Bill</SheetTitle><SheetDescription>Bill auto-posts AP journal to GL</SheetDescription></SheetHeader>
          <form onSubmit={handleCreateBill} className="space-y-4 text-xs">
            <div><Label className="text-xs">Vendor Name</Label><Input value={billForm.vendorName} onChange={e => setBillForm({ ...billForm, vendorName: e.target.value })} placeholder="Dell Commercial" className="h-9 text-xs mt-1" required /></div>
            <div><Label className="text-xs">Bill Description</Label><Input value={billForm.items[0].description} onChange={e => { const items = [...billForm.items]; items[0].description = e.target.value; setBillForm({ ...billForm, items }); }} className="h-9 text-xs mt-1" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Amount (GH₵)</Label><Input type="number" value={billForm.items[0].unitPrice} onChange={e => { const items = [...billForm.items]; items[0].unitPrice = Number(e.target.value); setBillForm({ ...billForm, items }); }} className="h-9 text-xs mt-1" required /></div>
              <div><Label className="text-xs">Due Date</Label><Input type="date" value={billForm.dueDate} onChange={e => setBillForm({ ...billForm, dueDate: e.target.value })} className="h-9 text-xs mt-1" required /></div>
            </div>
            <Button type="submit" className="w-full h-9 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white">Record Vendor Bill</Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Add Asset */}
      <Sheet open={showAssetModal} onOpenChange={setShowAssetModal}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4"><SheetTitle>Register Fixed Asset</SheetTitle><SheetDescription>Capital expenditure asset — straight-line depreciation</SheetDescription></SheetHeader>
          <form onSubmit={handleCreateAsset} className="space-y-4 text-xs">
            <div><Label className="text-xs">Asset Name</Label><Input value={assetForm.assetName} onChange={e => setAssetForm({ ...assetForm, assetName: e.target.value })} placeholder="Office Workstations" className="h-9 text-xs mt-1" required /></div>
            <div><Label className="text-xs">Category</Label>
              <Select value={assetForm.category} onValueChange={v => setAssetForm({ ...assetForm, category: v })}>
                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{['Equipment','Furniture','Vehicle','Building','Land','IT & Technology','Other'].map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Purchase Cost (GH₵)</Label><Input type="number" value={assetForm.purchaseCost} onChange={e => setAssetForm({ ...assetForm, purchaseCost: Number(e.target.value) })} className="h-9 text-xs mt-1" required /></div>
              <div><Label className="text-xs">Salvage Value (GH₵)</Label><Input type="number" value={assetForm.salvageValue} onChange={e => setAssetForm({ ...assetForm, salvageValue: Number(e.target.value) })} className="h-9 text-xs mt-1" /></div>
            </div>
            <div><Label className="text-xs">Useful Life (Years)</Label><Input type="number" value={assetForm.usefulLifeYears} onChange={e => setAssetForm({ ...assetForm, usefulLifeYears: Number(e.target.value) })} className="h-9 text-xs mt-1" required /></div>
            <Button type="submit" className="w-full h-9 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white">Register Asset</Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Bank Reconciliation */}
      <Sheet open={showBankRecModal} onOpenChange={setShowBankRecModal}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4"><SheetTitle>Reconcile Bank Statement</SheetTitle><SheetDescription>Compare bank ending balance against GL ledger</SheetDescription></SheetHeader>
          <form onSubmit={handleBankRec} className="space-y-4 text-xs">
            <div><Label className="text-xs">Statement Date</Label><Input type="date" value={bankRecForm.statementDate} onChange={e => setBankRecForm({ ...bankRecForm, statementDate: e.target.value })} className="h-9 text-xs mt-1" required /></div>
            <div><Label className="text-xs">Bank Statement Ending Balance (GH₵)</Label><Input type="number" step="0.01" onChange={e => setBankRecForm({ ...bankRecForm, statementBalance: Number(e.target.value) })} className="h-9 text-xs mt-1" required /></div>
            <Button type="submit" className="w-full h-9 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white">Run Reconciliation</Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Record Office Income */}
      <Sheet open={showIncomeModal} onOpenChange={setShowIncomeModal}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4"><SheetTitle>Record Office Income</SheetTitle><SheetDescription>Track company revenue — agency fees, commissions, rent, etc.</SheetDescription></SheetHeader>
          <form onSubmit={handleAddIncome} className="space-y-4 text-xs">
            <div><Label className="text-xs">Income Source</Label><Input value={incomeForm.source} onChange={e => setIncomeForm({ ...incomeForm, source: e.target.value })} placeholder="e.g. Acme Client Agency Fee" className="h-9 text-xs mt-1" required /></div>
            <div><Label className="text-xs">Category</Label>
              <Select value={incomeForm.category} onValueChange={v => setIncomeForm({ ...incomeForm, category: v })}>
                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{['Agency Fee','Commission','Rent Income','Consulting Fee','Property Management Fee','Sale Proceeds','Other'].map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Amount (GH₵)</Label><Input type="number" step="0.01" value={incomeForm.amount} onChange={e => setIncomeForm({ ...incomeForm, amount: e.target.value })} className="h-9 text-xs mt-1" required /></div>
              <div><Label className="text-xs">Date</Label><Input type="date" value={incomeForm.date} onChange={e => setIncomeForm({ ...incomeForm, date: e.target.value })} className="h-9 text-xs mt-1" /></div>
            </div>
            <div><Label className="text-xs">Notes / Description</Label><Input value={incomeForm.description} onChange={e => setIncomeForm({ ...incomeForm, description: e.target.value })} placeholder="Optional description" className="h-9 text-xs mt-1" /></div>
            <Button type="submit" className="w-full h-9 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white">Record Income</Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Record Office Expense */}
      <Sheet open={showExpenseModal} onOpenChange={setShowExpenseModal}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4"><SheetTitle>Record Office Expense</SheetTitle><SheetDescription>Track office-level operating costs</SheetDescription></SheetHeader>
          <form onSubmit={handleAddExpense} className="space-y-4 text-xs">
            <div><Label className="text-xs">Description</Label><Input value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="e.g. Office Rent — September" className="h-9 text-xs mt-1" required /></div>
            <div><Label className="text-xs">Category</Label>
              <Select value={expenseForm.category} onValueChange={v => setExpenseForm({ ...expenseForm, category: v })}>
                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{['Rent','Utilities','Internet & Phone','Salaries','Marketing','Office Supplies','Vehicle & Fuel','Bank Charges','Taxes','Insurance','Repairs & Maintenance','Subscriptions','Admin','Other'].map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Amount (GH₵)</Label><Input type="number" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} className="h-9 text-xs mt-1" required /></div>
              <div><Label className="text-xs">Date</Label><Input type="date" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} className="h-9 text-xs mt-1" /></div>
            </div>
            <div><Label className="text-xs">Vendor / Payee</Label><Input value={expenseForm.vendor} onChange={e => setExpenseForm({ ...expenseForm, vendor: e.target.value })} placeholder="e.g. Electricity Company of Ghana" className="h-9 text-xs mt-1" /></div>
            <Button type="submit" className="w-full h-9 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white">Record Expense</Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Record Project Expense */}
      <Sheet open={showProjectExpenseModal} onOpenChange={setShowProjectExpenseModal}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4"><SheetTitle>Add Project Expense</SheetTitle><SheetDescription>Track costs tied to a specific real estate project</SheetDescription></SheetHeader>
          <form onSubmit={handleAddProjectExpense} className="space-y-4 text-xs">
            <div><Label className="text-xs">Project Name</Label><Input value={projExpenseForm.projectName} onChange={e => setProjExpenseForm({ ...projExpenseForm, projectName: e.target.value })} placeholder="e.g. Adjiringanor Residential Block A" className="h-9 text-xs mt-1" required /></div>
            <div><Label className="text-xs">Description</Label><Input value={projExpenseForm.description} onChange={e => setProjExpenseForm({ ...projExpenseForm, description: e.target.value })} placeholder="e.g. Roofing materials purchase" className="h-9 text-xs mt-1" required /></div>
            <div><Label className="text-xs">Category</Label>
              <Select value={projExpenseForm.category} onValueChange={v => setProjExpenseForm({ ...projExpenseForm, category: v })}>
                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{['Materials','Labour','Equipment Hire','Permits & Fees','Contractor Payment','Site Costs','Surveying','Architecture & Design','Other'].map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Amount (GH₵)</Label><Input type="number" step="0.01" value={projExpenseForm.amount} onChange={e => setProjExpenseForm({ ...projExpenseForm, amount: e.target.value })} className="h-9 text-xs mt-1" required /></div>
              <div><Label className="text-xs">Date</Label><Input type="date" value={projExpenseForm.date} onChange={e => setProjExpenseForm({ ...projExpenseForm, date: e.target.value })} className="h-9 text-xs mt-1" /></div>
            </div>
            <Button type="submit" className="w-full h-9 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white">Add Project Expense</Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Add Employee */}
      <Sheet open={showPayrollEmployeeModal} onOpenChange={setShowPayrollEmployeeModal}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4"><SheetTitle>Add Employee to Payroll</SheetTitle><SheetDescription>Ghana PAYE & SSNIT calculated automatically</SheetDescription></SheetHeader>
          <form onSubmit={handleAddEmployee} className="space-y-4 text-xs">
            <div><Label className="text-xs">Full Name</Label><Input value={employeeForm.name} onChange={e => setEmployeeForm({ ...employeeForm, name: e.target.value })} placeholder="Kofi Mensah" className="h-9 text-xs mt-1" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Position / Role</Label><Input value={employeeForm.position} onChange={e => setEmployeeForm({ ...employeeForm, position: e.target.value })} placeholder="Sales Agent" className="h-9 text-xs mt-1" required /></div>
              <div><Label className="text-xs">Department</Label><Input value={employeeForm.department} onChange={e => setEmployeeForm({ ...employeeForm, department: e.target.value })} placeholder="Sales" className="h-9 text-xs mt-1" /></div>
            </div>
            <div><Label className="text-xs">Basic Salary (GH₵ / Month)</Label><Input type="number" step="0.01" value={employeeForm.basicSalary} onChange={e => setEmployeeForm({ ...employeeForm, basicSalary: e.target.value })} placeholder="3000" className="h-9 text-xs mt-1" required /></div>
            {employeeForm.basicSalary && (
              <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/20 text-[11px] space-y-1">
                {(() => { const c = calcGhanaPayroll(employeeForm.basicSalary); return (
                  <>
                    <div className="flex justify-between"><span className="text-muted-foreground">SSNIT (5.5% employee)</span><span className="font-bold text-rose-500">-{fmt(c.ssnitEmployee)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">PAYE Tax</span><span className="font-bold text-rose-500">-{fmt(c.paye)}</span></div>
                    <div className="flex justify-between border-t border-border pt-1 font-bold"><span>Net Take-Home Pay</span><span className="text-emerald-600">{fmt(c.netPay)}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Employer SSNIT (13%)</span><span>{fmt(c.ssnitEmployer)}</span></div>
                  </>
                ); })()}
              </div>
            )}
            <div><Label className="text-xs">Start Date</Label><Input type="date" value={employeeForm.startDate} onChange={e => setEmployeeForm({ ...employeeForm, startDate: e.target.value })} className="h-9 text-xs mt-1" /></div>
            <Button type="submit" className="w-full h-9 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white">Add to Payroll</Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Run Payroll */}
      <Sheet open={showPayrollRunModal} onOpenChange={setShowPayrollRunModal}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4"><SheetTitle>Run Payroll</SheetTitle><SheetDescription>Process payroll for all active employees</SheetDescription></SheetHeader>
          <form onSubmit={handleRunPayroll} className="space-y-4 text-xs">
            <div><Label className="text-xs">Payroll Period (e.g. September 2026)</Label><Input value={payrollRunForm.period} onChange={e => setPayrollRunForm({ ...payrollRunForm, period: e.target.value })} placeholder="September 2026" className="h-9 text-xs mt-1" required /></div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1.5">
              <p className="font-bold text-foreground">Processing {activeEmployees} active employees</p>
              <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Total Gross</span><span className="font-bold">{fmt(payrollEmployees.filter(e => e.status === 'active').reduce((s, e) => s + (e.basic_salary || 0), 0))}</span></div>
              <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Total Net Pay</span><span className="font-bold text-emerald-600">{fmt(payrollEmployees.filter(e => e.status === 'active').reduce((s, e) => s + (e.net_pay || 0), 0))}</span></div>
            </div>
            <div><Label className="text-xs">Notes</Label><Input value={payrollRunForm.notes} onChange={e => setPayrollRunForm({ ...payrollRunForm, notes: e.target.value })} placeholder="Optional notes" className="h-9 text-xs mt-1" /></div>
            <Button type="submit" className="w-full h-9 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white">Post Payroll Run</Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* TONEFO New Sale */}
      <Sheet open={showTonefoSaleModal} onOpenChange={setShowTonefoSaleModal}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4"><SheetTitle>Record TONEFO Sale</SheetTitle><SheetDescription>Electronics sale on installment or full payment</SheetDescription></SheetHeader>
          <form onSubmit={handleAddTonefoSale} className="space-y-4 text-xs">
            <div><Label className="text-xs">Customer Name</Label><Input value={tonefoSaleForm.customerName} onChange={e => setTonefoSaleForm({ ...tonefoSaleForm, customerName: e.target.value })} placeholder="Ama Owusu" className="h-9 text-xs mt-1" required /></div>
            <div><Label className="text-xs">Customer Phone</Label><Input value={tonefoSaleForm.customerPhone} onChange={e => setTonefoSaleForm({ ...tonefoSaleForm, customerPhone: e.target.value })} placeholder="0244 000 000" className="h-9 text-xs mt-1" /></div>
            <div><Label className="text-xs">Item Description</Label><Input value={tonefoSaleForm.itemDescription} onChange={e => setTonefoSaleForm({ ...tonefoSaleForm, itemDescription: e.target.value })} placeholder="Samsung Galaxy S24 Ultra (256GB)" className="h-9 text-xs mt-1" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Total Price (GH₵)</Label><Input type="number" step="0.01" value={tonefoSaleForm.totalPrice} onChange={e => setTonefoSaleForm({ ...tonefoSaleForm, totalPrice: e.target.value })} className="h-9 text-xs mt-1" required /></div>
              <div><Label className="text-xs">Deposit Paid (GH₵)</Label><Input type="number" step="0.01" value={tonefoSaleForm.depositPaid} onChange={e => setTonefoSaleForm({ ...tonefoSaleForm, depositPaid: e.target.value })} className="h-9 text-xs mt-1" /></div>
            </div>
            <div><Label className="text-xs">Installment Months</Label>
              <Select value={String(tonefoSaleForm.installmentMonths)} onValueChange={v => setTonefoSaleForm({ ...tonefoSaleForm, installmentMonths: Number(v) })}>
                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{[1,2,3,4,6,9,12,18,24].map(m => <SelectItem key={m} value={String(m)} className="text-xs">{m === 1 ? 'Full Payment' : `${m} months`}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {tonefoSaleForm.totalPrice && (
              <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20 text-[11px] space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Outstanding Balance</span><span className="font-bold">{fmt(Number(tonefoSaleForm.totalPrice) - Number(tonefoSaleForm.depositPaid || 0))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Monthly Installment</span><span className="font-bold text-orange-600">{fmt((Number(tonefoSaleForm.totalPrice) - Number(tonefoSaleForm.depositPaid || 0)) / Math.max(1, tonefoSaleForm.installmentMonths))}</span></div>
              </div>
            )}
            <Button type="submit" className="w-full h-9 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white">Record Sale</Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* TONEFO Record Payment */}
      <Sheet open={showTonefoPaymentModal} onOpenChange={setShowTonefoPaymentModal}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Record Installment Payment</SheetTitle>
            <SheetDescription>{selectedTonefoCase?.customer_name} — {selectedTonefoCase?.item_description}</SheetDescription>
          </SheetHeader>
          {selectedTonefoCase && (
            <div className="mb-4 p-3 rounded-xl bg-muted/30 border border-border text-xs space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Outstanding</span><span className="font-bold text-rose-500">{fmt(selectedTonefoCase.outstanding_balance)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Monthly Installment</span><span className="font-bold">{fmt(selectedTonefoCase.monthly_installment)}</span></div>
            </div>
          )}
          <form onSubmit={handleRecordTonefoPayment} className="space-y-4 text-xs">
            <div><Label className="text-xs">Payment Amount (GH₵)</Label><Input type="number" step="0.01" value={tonefoPaymentForm.amount} onChange={e => setTonefoPaymentForm({ ...tonefoPaymentForm, amount: e.target.value })} className="h-9 text-xs mt-1" required /></div>
            <div><Label className="text-xs">Payment Date</Label><Input type="date" value={tonefoPaymentForm.paymentDate} onChange={e => setTonefoPaymentForm({ ...tonefoPaymentForm, paymentDate: e.target.value })} className="h-9 text-xs mt-1" /></div>
            <div><Label className="text-xs">Notes</Label><Input value={tonefoPaymentForm.notes} onChange={e => setTonefoPaymentForm({ ...tonefoPaymentForm, notes: e.target.value })} placeholder="Cash / MoMo / Bank Transfer" className="h-9 text-xs mt-1" /></div>
            <Button type="submit" className="w-full h-9 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white">Record Payment</Button>
          </form>
        </SheetContent>
      </Sheet>

    </div>
  );
}
