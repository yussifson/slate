import React, { useState, useEffect } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { 
  generateTrialBalance, 
  generateProfitAndLoss, 
  generateBalanceSheet 
} from '@/api/financialReportsEngine';
import { 
  LineChart, 
  PieChart, 
  Scale, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivFinancialStatements() {
  const companyId = useCompanyId();
  const [activeTab, setActiveTab] = useState('pnl'); // pnl, bs, tb
  
  // Date states
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0] // Jan 1 of current year
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0] // Today
  );
  const [asOfDate, setAsOfDate] = useState(
    new Date().toISOString().split('T')[0] // Today
  );

  // Data states
  const [pnlData, setPnlData] = useState(null);
  const [bsData, setBsData] = useState(null);
  const [tbData, setTbData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (companyId) {
      handleRefresh();
    }
  }, [companyId, activeTab]);

  const handleRefresh = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      if (activeTab === 'pnl') {
        const data = await generateProfitAndLoss({ companyId, startDate, endDate });
        setPnlData(data);
      } else if (activeTab === 'bs') {
        const data = await generateBalanceSheet({ companyId, asOfDate });
        setBsData(data);
      } else if (activeTab === 'tb') {
        const data = await generateTrialBalance({ companyId, asOfDate });
        setTbData(data);
      }
    } catch (err) {
      toast.error('Failed to load financial report: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return '$' + parseFloat(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="h-full flex flex-col gap-6 p-6 bg-background overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2 tracking-[-0.02em]">
            <LineChart className="w-7 h-7 text-primary" /> Financial Statements
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time automated reports generated from posted General Ledger entries.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-muted/60 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('pnl')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'pnl' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LineChart className="w-4 h-4" /> Profit & Loss
          </button>
          <button
            onClick={() => setActiveTab('bs')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'bs' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <PieChart className="w-4 h-4" /> Balance Sheet
          </button>
          <button
            onClick={() => setActiveTab('tb')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'tb' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Scale className="w-4 h-4" /> Trial Balance
          </button>
        </div>
      </div>

      {/* Date Filters */}
      <div className="bg-card border rounded-xl p-4 flex items-end gap-4 shadow-sm">
        {activeTab === 'pnl' ? (
          <>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Start Date</label>
              <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="h-9 px-3 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">End Date</label>
              <input 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="h-9 px-3 border rounded-lg text-sm"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">As Of Date</label>
            <input 
              type="date" 
              value={asOfDate}
              onChange={e => setAsOfDate(e.target.value)}
              className="h-9 px-3 border rounded-lg text-sm"
            />
          </div>
        )}
        
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="h-9 px-4 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ml-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Report
        </button>
        <button
          className="h-9 px-4 border bg-background hover:bg-muted rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Report Content Container */}
      <div className="flex-1 bg-card border rounded-2xl p-8 shadow-sm overflow-auto">
        {loading && !pnlData && !bsData && !tbData ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <RefreshCw className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p className="font-medium">Aggregating General Ledger...</p>
          </div>
        ) : (
          <>
            {/* --- TAB: PROFIT & LOSS --- */}
            {activeTab === 'pnl' && pnlData && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10 border-b pb-6">
                  <h2 className="text-2xl font-serif font-bold text-foreground">Income Statement</h2>
                  <p className="text-muted-foreground font-medium mt-1">
                    For the Period {new Date(pnlData.period.startDate).toLocaleDateString()} to {new Date(pnlData.period.endDate).toLocaleDateString()}
                  </p>
                </div>

                {/* Revenue Section */}
                <div className="mb-8">
                  <h3 className="font-bold text-lg text-emerald-700 border-b border-emerald-100 pb-2 mb-3">Revenue</h3>
                  {pnlData.revenues.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-2">No revenue activity.</p>
                  ) : (
                    <div className="space-y-2">
                      {pnlData.revenues.map(acc => (
                        <div key={acc.id} className="flex justify-between text-sm py-1 hover:bg-muted/30 px-2 rounded">
                          <span className="text-muted-foreground">{acc.account_number} - {acc.account_name}</span>
                          <span className="font-mono">{formatCurrency(acc.balance)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base mt-4 pt-2 border-t px-2">
                    <span>Total Revenue</span>
                    <span className="font-mono">{formatCurrency(pnlData.totals.revenue)}</span>
                  </div>
                </div>

                {/* Expense Section */}
                <div className="mb-8">
                  <h3 className="font-bold text-lg text-rose-700 border-b border-rose-100 pb-2 mb-3">Expenses</h3>
                  {pnlData.expenses.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-2">No expense activity.</p>
                  ) : (
                    <div className="space-y-2">
                      {pnlData.expenses.map(acc => (
                        <div key={acc.id} className="flex justify-between text-sm py-1 hover:bg-muted/30 px-2 rounded">
                          <span className="text-muted-foreground">{acc.account_number} - {acc.account_name}</span>
                          <span className="font-mono">{formatCurrency(acc.balance)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base mt-4 pt-2 border-t px-2">
                    <span>Total Expenses</span>
                    <span className="font-mono">{formatCurrency(pnlData.totals.expense)}</span>
                  </div>
                </div>

                {/* Net Income */}
                <div className={`flex justify-between font-bold text-xl mt-12 p-4 rounded-xl border-2 ${
                  pnlData.totals.netIncome >= 0 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <span>Net Income (Loss)</span>
                  <span className="font-mono underline decoration-double underline-offset-4">
                    {formatCurrency(pnlData.totals.netIncome)}
                  </span>
                </div>
              </div>
            )}

            {/* --- TAB: BALANCE SHEET --- */}
            {activeTab === 'bs' && bsData && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10 border-b pb-6">
                  <h2 className="text-2xl font-serif font-bold text-foreground">Balance Sheet</h2>
                  <p className="text-muted-foreground font-medium mt-1">
                    As of {new Date(bsData.asOfDate).toLocaleDateString()}
                  </p>
                  
                  {bsData.isBalanced ? (
                    <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Equation Balanced
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">
                      <AlertCircle className="w-3.5 h-3.5" /> Out of Balance (Difference: {formatCurrency(Math.abs(bsData.totals.assets - bsData.totals.liabilitiesAndEquity))})
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Assets Column */}
                  <div>
                    <h3 className="font-bold text-xl text-blue-800 border-b-2 border-blue-200 pb-2 mb-4">Assets</h3>
                    {bsData.assets.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No assets recorded.</p>
                    ) : (
                      <div className="space-y-3">
                        {bsData.assets.map(acc => (
                          <div key={acc.id} className="flex justify-between text-sm hover:bg-muted/30 px-2 py-1 rounded">
                            <span className="text-muted-foreground">{acc.account_number} - {acc.account_name}</span>
                            <span className="font-mono">{formatCurrency(acc.balance)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg mt-6 pt-3 border-t-2 border-blue-800 px-2">
                      <span>Total Assets</span>
                      <span className="font-mono underline decoration-double underline-offset-4">{formatCurrency(bsData.totals.assets)}</span>
                    </div>
                  </div>

                  {/* Liabilities & Equity Column */}
                  <div>
                    <h3 className="font-bold text-xl text-rose-800 border-b-2 border-rose-200 pb-2 mb-4">Liabilities</h3>
                    {bsData.liabilities.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No liabilities recorded.</p>
                    ) : (
                      <div className="space-y-3">
                        {bsData.liabilities.map(acc => (
                          <div key={acc.id} className="flex justify-between text-sm hover:bg-muted/30 px-2 py-1 rounded">
                            <span className="text-muted-foreground">{acc.account_number} - {acc.account_name}</span>
                            <span className="font-mono">{formatCurrency(acc.balance)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base mt-4 pt-2 border-t border-rose-200 px-2 mb-8">
                      <span>Total Liabilities</span>
                      <span className="font-mono">{formatCurrency(bsData.totals.liabilities)}</span>
                    </div>

                    <h3 className="font-bold text-xl text-purple-800 border-b-2 border-purple-200 pb-2 mb-4">Equity</h3>
                    {bsData.equity.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No equity recorded.</p>
                    ) : (
                      <div className="space-y-3">
                        {bsData.equity.map(acc => (
                          <div key={acc.id} className="flex justify-between text-sm hover:bg-muted/30 px-2 py-1 rounded">
                            <span className="text-muted-foreground">{acc.account_number} - {acc.account_name}</span>
                            <span className="font-mono">{formatCurrency(acc.balance)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base mt-4 pt-2 border-t border-purple-200 px-2">
                      <span>Total Equity</span>
                      <span className="font-mono">{formatCurrency(bsData.totals.equity)}</span>
                    </div>

                    <div className="flex justify-between font-bold text-lg mt-8 pt-3 border-t-2 border-foreground px-2">
                      <span>Total Liabilities & Equity</span>
                      <span className="font-mono underline decoration-double underline-offset-4">{formatCurrency(bsData.totals.liabilitiesAndEquity)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB: TRIAL BALANCE --- */}
            {activeTab === 'tb' && tbData && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8 border-b pb-6">
                  <h2 className="text-2xl font-serif font-bold text-foreground">Trial Balance</h2>
                  <p className="text-muted-foreground font-medium mt-1">
                    As of {new Date(tbData.asOfDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase">Account</th>
                        <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase">Type</th>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground uppercase">Debit</th>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground uppercase">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {tbData.accounts.map(acc => (
                        <tr key={acc.accountId} className="hover:bg-muted/20">
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded mr-2">{acc.accountNumber}</span>
                            <span className="font-medium">{acc.accountName}</span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{acc.accountType}</td>
                          <td className="px-4 py-3 text-right font-mono text-blue-700">
                            {acc.netDebit > 0 ? formatCurrency(acc.netDebit) : '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-purple-700">
                            {acc.netCredit > 0 ? formatCurrency(acc.netCredit) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/20 border-t-2 font-bold">
                      <tr>
                        <td colSpan={2} className="px-4 py-4 text-right uppercase text-xs">Total Balance:</td>
                        <td className="px-4 py-4 text-right font-mono text-base border-b-4 border-double border-blue-700 text-blue-800">
                          {formatCurrency(tbData.totals.debit)}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-base border-b-4 border-double border-purple-700 text-purple-800">
                          {formatCurrency(tbData.totals.credit)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                <div className="mt-4 flex justify-end">
                  {tbData.isBalanced ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Trial Balance is Balanced
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-bold">
                      <AlertCircle className="w-4 h-4" /> Out of Balance by {formatCurrency(Math.abs(tbData.totals.debit - tbData.totals.credit))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
