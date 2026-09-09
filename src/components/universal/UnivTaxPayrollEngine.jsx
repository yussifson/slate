import React, { useState, useEffect } from 'react';
import { powerSync } from '@/api/PowerSyncConnector';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { processPayrollRun, postPayrollRunToGL } from '@/api/payrollEngine';
import { calculateEmployeeTaxBreakdown, calculateGhanaInvoiceTax } from '@/api/ghanaTaxEngine';
import {
  Calculator,
  Users,
  FileText,
  DollarSign,
  Play,
  Loader2,
  Building,
  Briefcase
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivTaxPayrollEngine() {
  const companyId = useCompanyId();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('payroll'); // 'payroll' | 'calculator' | 'reports'

  // Payroll State
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [payrollPeriod, setPayrollPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [payrollResult, setPayrollResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Calculator State
  const [calcInput, setCalcInput] = useState({ basicSalary: '', allowances: '', reliefs: '', tier3: '' });
  const [calcResult, setCalcResult] = useState(null);
  const [invoiceInput, setInvoiceInput] = useState({ amount: '', isFlatRate: false });
  const [invoiceResult, setInvoiceResult] = useState(null);

  useEffect(() => {
    if (companyId) fetchEmployees();
  }, [companyId]);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      // Look for staff in a common HR table (fallback to mock if none)
      const res = await powerSync.execute(
        `SELECT id, name as staff_name, email as staff_email, salary as basicSalary FROM profiles WHERE company_id = ? AND role != 'client'`,
        [companyId]
      );
      const data = res.rows ? (res.rows._array || Array.from(res.rows)) : [];
      setEmployees(data);
    } catch (err) {
      console.error('[UnivTaxPayrollEngine] Fetch employees error:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // --- TAB: PAYROLL RUN ---
  const handleRunPayroll = async () => {
    if (employees.length === 0) {
      toast.error('No employees found to process.');
      return;
    }
    setIsProcessing(true);
    try {
      // Mocking some allowances/reliefs for demo if not present in DB
      const staffList = employees.map(emp => ({
        ...emp,
        name: emp.staff_name,
        email: emp.staff_email,
        basicSalary: parseFloat(emp.basicSalary) || 0,
        allowances: 0,
        taxReliefs: 0,
      })).filter(emp => emp.basicSalary > 0);

      const result = processPayrollRun(staffList);
      setPayrollResult(result);
      toast.success(`Processed payroll for ${result.processedItems.length} employees`);
    } catch (err) {
      toast.error(err.message || 'Failed to process payroll');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePostToGL = async () => {
    if (!payrollResult) return;
    setIsPosting(true);
    try {
      await postPayrollRunToGL({
        companyId,
        period: payrollPeriod,
        totals: payrollResult.totals,
        postedBy: user?.email || 'System User'
      });
      toast.success('Payroll run successfully posted to General Ledger!');
      setPayrollResult(null); // Clear after posting
    } catch (err) {
      toast.error(err.message || 'Failed to post to GL');
    } finally {
      setIsPosting(false);
    }
  };

  // --- TAB: CALCULATOR ---
  const handleCalculateSalary = (e) => {
    e.preventDefault();
    const result = calculateEmployeeTaxBreakdown({
      basicSalary: parseFloat(calcInput.basicSalary) || 0,
      allowances: parseFloat(calcInput.allowances) || 0,
      taxReliefs: parseFloat(calcInput.reliefs) || 0,
      voluntaryTier3: parseFloat(calcInput.tier3) || 0,
    });
    setCalcResult(result);
  };

  const handleCalculateInvoice = (e) => {
    e.preventDefault();
    const result = calculateGhanaInvoiceTax(
      parseFloat(invoiceInput.amount) || 0,
      invoiceInput.isFlatRate
    );
    setInvoiceResult(result);
  };

  return (
    <div className="h-full flex flex-col gap-6 p-6 bg-background overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2 tracking-[-0.02em]">
            <Calculator className="w-7 h-7 text-primary" /> Ghana Tax & Payroll Engine
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            GRA PAYE, SSNIT Tiers 1-3, and Automated GL Payroll Accounting.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-muted/60 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'payroll' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4" /> Payroll Run
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'calculator' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calculator className="w-4 h-4" /> Tax Simulator
          </button>
        </div>
      </div>

      {/* TAB 1: PAYROLL RUN */}
      {activeTab === 'payroll' && (
        <div className="flex flex-col gap-6">
          <div className="bg-card border rounded-2xl p-5 flex items-end gap-4 shadow-sm">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Payroll Period</label>
              <input 
                type="month" 
                value={payrollPeriod}
                onChange={e => setPayrollPeriod(e.target.value)}
                className="h-10 px-3 border rounded-xl text-sm focus:ring-2 outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Eligible Employees</label>
              <div className="h-10 px-4 bg-muted/30 border border-transparent rounded-xl flex items-center text-sm font-semibold">
                {loadingEmployees ? <Loader2 className="w-4 h-4 animate-spin" /> : `${employees.length} Active Staff Found`}
              </div>
            </div>
            <button
              onClick={handleRunPayroll}
              disabled={isProcessing || loadingEmployees}
              className="h-10 px-6 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Generate Payroll Run
            </button>
          </div>

          {payrollResult && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 border rounded-2xl bg-card overflow-hidden">
                <div className="p-4 border-b bg-muted/20 font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> Payslip Breakdown
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 border-b text-muted-foreground uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Employee</th>
                        <th className="px-4 py-3 text-right">Gross Pay</th>
                        <th className="px-4 py-3 text-right">SSNIT (5.5%)</th>
                        <th className="px-4 py-3 text-right">PAYE Tax</th>
                        <th className="px-4 py-3 text-right">Total Ded.</th>
                        <th className="px-4 py-3 text-right text-emerald-600">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {payrollResult.processedItems.map(item => (
                        <tr key={item.staffId} className="hover:bg-muted/10">
                          <td className="px-4 py-3 font-semibold">{item.staffName}</td>
                          <td className="px-4 py-3 text-right font-mono">${item.grossPay.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-mono text-rose-600">-${item.employeeSSNIT.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-mono text-rose-600">-${item.payeTax.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-mono text-rose-600">-${item.totalDeductions.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">${item.netPay.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border rounded-2xl bg-card p-5 flex flex-col gap-4">
                <h3 className="font-bold text-lg border-b pb-2">Run Summary & Posting</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Gross Pay:</span>
                    <span className="font-mono font-semibold">${payrollResult.totals.grossPay.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Total PAYE Liability:</span>
                    <span className="font-mono font-semibold">${payrollResult.totals.payeTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Total SSNIT Liability (19%):</span>
                    <span className="font-mono font-semibold">${(payrollResult.totals.employeeSSNIT + payrollResult.totals.employerSSNIT).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-emerald-600 font-bold">
                    <span>Total Net Payable:</span>
                    <span className="font-mono">${payrollResult.totals.netPay.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed pt-2 font-bold text-primary">
                    <span>Total Cost to Employer:</span>
                    <span className="font-mono">${payrollResult.totals.totalPayrollCost.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-auto pt-6">
                  <button
                    onClick={handlePostToGL}
                    disabled={isPosting}
                    className="w-full h-11 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                  >
                    {isPosting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Building className="w-5 h-5" />}
                    Post Accrual to General Ledger
                  </button>
                  <p className="text-[10px] text-center text-muted-foreground mt-2">
                    Generates balanced double-entry journal lines.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Salary Tax Simulator */}
          <div className="border rounded-2xl bg-card p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b pb-3">
              <Briefcase className="w-5 h-5 text-primary" /> Salary PAYE & SSNIT Simulator
            </h2>
            <form onSubmit={handleCalculateSalary} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Basic Salary (GHS)</label>
                <input required type="number" step="0.01" value={calcInput.basicSalary} onChange={e => setCalcInput({...calcInput, basicSalary: e.target.value})} className="w-full h-10 px-3 border rounded-xl text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Allowances (GHS)</label>
                <input type="number" step="0.01" value={calcInput.allowances} onChange={e => setCalcInput({...calcInput, allowances: e.target.value})} className="w-full h-10 px-3 border rounded-xl text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Approved Reliefs</label>
                <input type="number" step="0.01" value={calcInput.reliefs} onChange={e => setCalcInput({...calcInput, reliefs: e.target.value})} className="w-full h-10 px-3 border rounded-xl text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Voluntary Tier 3</label>
                <input type="number" step="0.01" value={calcInput.tier3} onChange={e => setCalcInput({...calcInput, tier3: e.target.value})} className="w-full h-10 px-3 border rounded-xl text-sm outline-none" />
              </div>
              <div className="col-span-2">
                <button type="submit" className="w-full h-10 bg-primary text-primary-foreground rounded-xl font-bold text-sm">Calculate Breakdown</button>
              </div>
            </form>

            {calcResult && (
              <div className="mt-4 p-4 bg-muted/20 border rounded-xl space-y-2 text-sm font-mono">
                <div className="flex justify-between"><span>Gross Pay:</span> <span>{calcResult.grossPay.toFixed(2)}</span></div>
                <div className="flex justify-between text-rose-600"><span>SSNIT (5.5%):</span> <span>-{calcResult.employeeSSNIT.toFixed(2)}</span></div>
                <div className="flex justify-between text-rose-600"><span>Taxable Income:</span> <span>{calcResult.taxableIncome.toFixed(2)}</span></div>
                <div className="flex justify-between text-rose-600"><span>PAYE Tax:</span> <span>-{calcResult.payeTax.toFixed(2)}</span></div>
                <div className="flex justify-between border-t pt-2 font-bold text-emerald-600 text-base"><span>Net Take-Home:</span> <span>{calcResult.netPay.toFixed(2)}</span></div>
                
                <div className="mt-4 border-t pt-4">
                  <div className="text-xs font-bold text-muted-foreground mb-2 font-sans uppercase">GRA Tax Bracket Breakdown</div>
                  {calcResult.payeBreakdown.filter(b => b.taxable > 0).map((b, i) => (
                    <div key={i} className="flex justify-between text-xs text-muted-foreground">
                      <span>{b.label} ({(b.rate * 100).toFixed(1)}%)</span>
                      <span>Tax: {b.tax.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Invoice Tax Simulator */}
          <div className="border rounded-2xl bg-card p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b pb-3">
              <DollarSign className="w-5 h-5 text-primary" /> Invoice VAT & Levies
            </h2>
            <form onSubmit={handleCalculateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Invoice Base Amount (GHS)</label>
                <input required type="number" step="0.01" value={invoiceInput.amount} onChange={e => setInvoiceInput({...invoiceInput, amount: e.target.value})} className="w-full h-10 px-3 border rounded-xl text-sm outline-none" />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={invoiceInput.isFlatRate} onChange={e => setInvoiceInput({...invoiceInput, isFlatRate: e.target.checked})} className="w-4 h-4 rounded border-gray-300" />
                Use VAT Flat Rate Scheme (3%)
              </label>
              <button type="submit" className="w-full h-10 bg-primary text-primary-foreground rounded-xl font-bold text-sm">Calculate Tax</button>
            </form>

            {invoiceResult && (
              <div className="mt-4 p-4 bg-muted/20 border rounded-xl space-y-2 text-sm font-mono">
                <div className="flex justify-between"><span>Base Amount:</span> <span>{invoiceResult.baseAmount.toFixed(2)}</span></div>
                {!invoiceInput.isFlatRate && (
                  <>
                    <div className="flex justify-between text-rose-600 text-xs"><span>NHIL (2.5%):</span> <span>+{invoiceResult.nhil.toFixed(2)}</span></div>
                    <div className="flex justify-between text-rose-600 text-xs"><span>GETFund (2.5%):</span> <span>+{invoiceResult.getFund.toFixed(2)}</span></div>
                    <div className="flex justify-between text-rose-600 text-xs"><span>COVID Levy (1%):</span> <span>+{invoiceResult.covidLevy.toFixed(2)}</span></div>
                    <div className="flex justify-between text-rose-600 text-xs"><span>Standard VAT (15%):</span> <span>+{invoiceResult.vat.toFixed(2)}</span></div>
                  </>
                )}
                {invoiceInput.isFlatRate && (
                  <div className="flex justify-between text-rose-600 text-xs"><span>Flat Rate VAT (3%):</span> <span>+{invoiceResult.vat.toFixed(2)}</span></div>
                )}
                <div className="flex justify-between border-t pt-2 font-bold text-lg"><span>Total Invoice Amount:</span> <span>{invoiceResult.totalAmount.toFixed(2)}</span></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
