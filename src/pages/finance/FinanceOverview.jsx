import React, { useEffect, useState } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { 
  Building2, TrendingUp, DollarSign, Receipt, LineChart, 
  WalletCards, BarChart3, Calculator, ShoppingBag, ArrowUpRight, 
  ArrowDownRight, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NavLink } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { powerSync } from '@/api/PowerSyncConnector';
import { JCLPhase5FinanceService } from '@/services/JCLPhase5FinanceService';
import { cn } from '@/lib/utils';

function fmt(n) {
  return 'GH₵ ' + (Number(n) || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 });
}

export default function FinanceOverview() {
  const companyId = useCompanyId();
  const [loading, setLoading] = useState(true);
  
  // Executive Metrics
  const [totalAR, setTotalAR] = useState(0);
  const [totalAP, setTotalAP] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalClaims, setTotalClaims] = useState(0);
  const [trustBalance, setTrustBalance] = useState(0);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [recentBills, setRecentBills] = useState([]);
  const [projectSummaries, setProjectSummaries] = useState([]);

  const loadOverview = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [invRes, billRes, trustRes, portfolioRes] = await Promise.all([
        supabase.from('jcl_invoices').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(6),
        supabase.from('jcl_bills').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(6),
        powerSync.execute('SELECT balance FROM real_estate_trust_accounts WHERE company_id = ? LIMIT 1', [companyId]).catch(() => ({ rows: [] })),
        JCLPhase5FinanceService.getPortfolioSummary(companyId).catch(() => [])
      ]);

      const invList = invRes.data || [];
      const billList = billRes.data || [];
      const trustRow = trustRes?.rows?._array?.[0] || trustRes?.rows?.[0];
      const portfolio = Array.isArray(portfolioRes) ? portfolioRes : [];

      const arSum = invList.reduce((acc, i) => acc + (Number(i.total_amount) || 0), 0);
      const apSum = billList.reduce((acc, b) => acc + (Number(b.total_amount) || 0), 0);
      const bgtSum = portfolio.reduce((acc, p) => acc + (Number(p.approved_budget) || 0), 0);
      const claimSum = portfolio.reduce((acc, p) => acc + (Number(p.certified_claims) || 0), 0);

      setTotalAR(arSum);
      setTotalAP(apSum);
      setTrustBalance(Number(trustRow?.balance) || 0);
      setTotalBudget(bgtSum);
      setTotalClaims(claimSum);
      setRecentInvoices(invList);
      setRecentBills(billList);
      setProjectSummaries(portfolio);
    } catch (err) {
      console.warn('[FinanceOverview] load err:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [companyId]);

  const netCorporateIncome = totalAR - totalAP;

  return (
    <div className="w-full max-w-full space-y-6 pb-20 overflow-x-hidden">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/90 border border-border/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#005A9C] to-[#00477D] text-white flex items-center justify-center shadow-md shadow-[#005A9C]/20 shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Finance & Commercial Overview
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Consolidated treasury, corporate accounting, trust accounts, and project commercial control.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadOverview} size="sm" variant="outline" className="h-9 px-3 text-xs font-semibold rounded-xl gap-1.5">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh Data
          </Button>
          <NavLink to="/finance/invoices">
            <Button size="sm" className="h-9 px-4 text-xs font-bold bg-[#005A9C] hover:bg-[#00477D] text-white rounded-xl shadow-xs">
              New Invoice
            </Button>
          </NavLink>
        </div>
      </div>

      {/* ── Primary KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Accounts Receivable</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-emerald-600 tracking-tight">{fmt(totalAR)}</p>
          <p className="text-[11px] text-muted-foreground mt-1 font-medium">Billed client receivables</p>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Accounts Payable</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-rose-600 tracking-tight">{fmt(totalAP)}</p>
          <p className="text-[11px] text-muted-foreground mt-1 font-medium">Vendor bills & obligations</p>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Net Operating Cash</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <LineChart className="w-4 h-4" />
            </div>
          </div>
          <p className={cn("text-lg sm:text-2xl font-black tracking-tight", netCorporateIncome >= 0 ? "text-[#005A9C]" : "text-rose-600")}>
            {fmt(netCorporateIncome)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1 font-medium">Corporate AR minus AP</p>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Commitments</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-amber-600 tracking-tight">{fmt(totalBudget)}</p>
          <p className="text-[11px] text-muted-foreground mt-1 font-medium">{projectSummaries.length} active site budgets</p>
        </div>
      </div>

      {/* ── Quick Access Department Shortcuts ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Trust Accounting Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <WalletCards className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold text-xs">
                Audited Escrow
              </Badge>
            </div>
            <h3 className="text-base font-bold text-foreground">Trust Accounting</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Fiduciary client deposits, real estate escrow holdings, ledger audits, and statutory reconciliations.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Escrow Balance: {fmt(trustBalance)}</span>
            <NavLink to="/finance/trust-accounting">
              <Button size="sm" variant="ghost" className="h-8 text-xs font-bold text-primary gap-1">
                Open Trust <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </NavLink>
          </div>
        </div>

        {/* Firm Accounting Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 font-bold text-xs">
                11 Sub-Modules
              </Badge>
            </div>
            <h3 className="text-base font-bold text-foreground">Firm Accounting</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Corporate Chart of Accounts, General Ledger, vendor bills, fixed assets depreciation, and payroll runs.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Operating Spread: {fmt(netCorporateIncome)}</span>
            <NavLink to="/finance/chart-of-accounts">
              <Button size="sm" variant="ghost" className="h-8 text-xs font-bold text-primary gap-1">
                Open Accounts <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </NavLink>
          </div>
        </div>

        {/* Project Finance Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold text-xs">
                Site Control
              </Badge>
            </div>
            <h3 className="text-base font-bold text-foreground">Project Finance</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Engineering project commercial control, baseline budgets, variation orders, progress claims, and forecast profitability.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Claims Certified: {fmt(totalClaims)}</span>
            <NavLink to="/finance/project-finance">
              <Button size="sm" variant="ghost" className="h-8 text-xs font-bold text-primary gap-1">
                Open Projects <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </NavLink>
          </div>
        </div>
      </div>

      {/* ── Recent Financial Activity Tables ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Invoices */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/60">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" /> Recent Client Invoices
            </h3>
            <NavLink to="/finance/invoices" className="text-xs font-bold text-primary hover:underline">
              View All
            </NavLink>
          </div>
          {recentInvoices.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No client invoices recorded yet.</p>
          ) : (
            <div className="space-y-2.5">
              {recentInvoices.slice(0, 5).map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-border/50 text-xs">
                  <div>
                    <span className="font-bold text-foreground block">{inv.customer_name || 'Client'}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{inv.invoice_number || 'INV'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-emerald-600 block">{fmt(inv.total_amount)}</span>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold py-0">{inv.status || 'Active'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Vendor Bills */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/60">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-600" /> Recent Vendor Bills
            </h3>
            <NavLink to="/finance/bills" className="text-xs font-bold text-primary hover:underline">
              View All
            </NavLink>
          </div>
          {recentBills.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No vendor bills recorded yet.</p>
          ) : (
            <div className="space-y-2.5">
              {recentBills.slice(0, 5).map(b => (
                <div key={b.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-border/50 text-xs">
                  <div>
                    <span className="font-bold text-foreground block">{b.vendor_name || 'Vendor'}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{b.bill_number || 'BILL'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-rose-600 block">{fmt(b.total_amount)}</span>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold py-0">{b.status || 'Pending'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
