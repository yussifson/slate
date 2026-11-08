import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Calculator, ClipboardCheck, Plus, TrendingUp, Layers, DollarSign, ArrowUpRight, ArrowDownLeft, FileText, CheckCircle2 } from 'lucide-react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { JCLPhase5FinanceService } from '@/services/JCLPhase5FinanceService';

const currency = value => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 }).format(Number(value || 0));

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'budgets', label: 'Budgets', icon: Calculator },
  { id: 'variations', label: 'Variations', icon: TrendingUp },
  { id: 'claims', label: 'Progress Claims', icon: ClipboardCheck },
];

export default function JCLProjectFinance({ defaultTab, isStandalonePage = false }) {
  const companyId = useCompanyId();
  const { toast } = useToast();
  const [tab, setTab] = useState(defaultTab || 'overview');

  useEffect(() => {
    if (defaultTab) {
      setTab(defaultTab);
    }
  }, [defaultTab]);
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [variations, setVariations] = useState([]);
  const [claims, setClaims] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', amount: '', projectId: '' });
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ title: '', totalAmount: '', currency: 'GHS', notes: '', projectId: '' });

  const selectedProject = useMemo(() => projects.find(project => project.id === projectId), [projects, projectId]);

  const totals = useMemo(() => summary.reduce((acc, row) => ({
    budget: acc.budget + Number(row.approved_budget || 0),
    actual: acc.actual + Number(row.actual_cost || 0),
    committed: acc.committed + Number(row.committed_cost || 0),
    claims: acc.claims + Number(row.certified_claims || 0),
    forecast: acc.forecast + Number(row.forecast_final_cost || 0),
  }), { budget: 0, actual: 0, committed: 0, claims: 0, forecast: 0 }), [summary]);

  const load = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [projectRows, summaryRows, budgetRows, variationRows, claimRows] = await Promise.all([
        JCLPhase5FinanceService.listProjects(companyId).catch(() => []),
        JCLPhase5FinanceService.getPortfolioSummary(companyId).catch(() => []),
        JCLPhase5FinanceService.listBudgets(companyId, projectId || undefined).catch(() => []),
        JCLPhase5FinanceService.listVariations(companyId, projectId || undefined).catch(() => []),
        JCLPhase5FinanceService.listClaims(companyId, projectId || undefined).catch(() => []),
      ]);
      setProjects(projectRows);
      setSummary(summaryRows);
      setBudgets(budgetRows);
      setVariations(variationRows);
      setClaims(claimRows);
    } catch (error) {
      toast({ title: 'Project finance notice', description: error.message || 'Connecting to project finance service...', variant: 'default' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [companyId, projectId]);

  const createRecord = async event => {
    event.preventDefault();
    const targetProjectId = form.projectId || projectId || (projects[0]?.id) || '';
    if (!form.title || !form.amount) {
      toast({ title: 'Validation error', description: 'Please provide a title and amount.', variant: 'destructive' });
      return;
    }
    try {
      if (tab === 'variations') {
        await JCLPhase5FinanceService.createVariation({
          companyId,
          projectId: targetProjectId,
          variation: {
            title: form.title,
            description: form.description,
            proposed_value_adjustment: form.amount,
            cost_impact: form.amount
          }
        });
      }
      if (tab === 'claims') {
        await JCLPhase5FinanceService.createClaim({
          companyId,
          projectId: targetProjectId,
          claim: {
            description: form.description || form.title,
            current_claim_amount: form.amount
          }
        });
      }
      setForm({ title: '', description: '', amount: '', projectId: '' });
      setShowForm(false);
      await load();
      toast({ title: 'Saved', description: `${tab === 'variations' ? 'Variation' : 'Progress claim'} created successfully.` });
    } catch (error) {
      toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
    }
  };

  const createBudgetRecord = async event => {
    event.preventDefault();
    const targetProjectId = budgetForm.projectId || projectId || (projects[0]?.id) || '';
    if (!budgetForm.title) {
      toast({ title: 'Validation error', description: 'Budget title is required.', variant: 'destructive' });
      return;
    }
    try {
      await JCLPhase5FinanceService.createBudget({
        companyId,
        projectId: targetProjectId,
        budget: {
          title: budgetForm.title,
          currency: budgetForm.currency || 'GHS',
          notes: budgetForm.notes || '',
          amount: Number(budgetForm.totalAmount) || 0
        },
        lines: [
          {
            cost_code: 'BUD-01',
            description: budgetForm.title,
            category: 'Capital Budget',
            quantity: 1,
            unit_rate: Number(budgetForm.totalAmount) || 0
          }
        ]
      });
      setBudgetForm({ title: '', totalAmount: '', currency: 'GHS', notes: '', projectId: '' });
      setShowBudgetModal(false);
      await load();
      toast({ title: 'Budget Saved', description: 'Project budget created successfully.' });
    } catch (error) {
      toast({ title: 'Could not save budget', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6 pb-20 overflow-x-hidden">
      {/* ── Header: Title & Project Selector ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/90 border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#005A9C] shrink-0" />
            Project Finance
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Commercial control, project budgets, progress claims, and forecast profitability.</p>
        </div>
        <div className="w-full sm:w-auto shrink-0">
          <select
            value={projectId}
            onChange={event => setProjectId(event.target.value)}
            className="w-full sm:w-64 h-10 rounded-xl border border-border bg-background px-3 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#005A9C]/40 shadow-xs"
          >
            <option value="">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.project_code || 'PRJ'} · {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Mobile 2x2 Dedicated Stats Grid (< md) ── */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:hidden">
        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Calculator className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">Approved Budget</span>
          </div>
          <p className="text-sm font-black text-foreground truncate">{currency(totals.budget)}</p>
          <span className="text-[9px] text-muted-foreground font-semibold">{summary.length} active projects</span>
        </div>

        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <ArrowDownLeft className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">Actual Cost</span>
          </div>
          <p className="text-sm font-black text-rose-600 truncate">{currency(totals.actual)}</p>
          <span className="text-[9px] text-muted-foreground font-semibold">Confirmed accounting</span>
        </div>

        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <ClipboardCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">Certified Claims</span>
          </div>
          <p className="text-sm font-black text-emerald-600 truncate">{currency(totals.claims)}</p>
          <span className="text-[9px] text-muted-foreground font-semibold">Client invoiced</span>
        </div>

        <div className="bg-card/95 border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">Forecast Final</span>
          </div>
          <p className="text-sm font-black text-indigo-600 truncate">{currency(totals.forecast)}</p>
          <span className="text-[9px] text-muted-foreground font-semibold">Total expected cost</span>
        </div>
      </div>

      {/* ── Desktop Executive KPI Cards (>= md) ── */}
      <div className="hidden md:grid md:grid-cols-5 gap-3">
        {[
          { label: 'Approved Budget', value: totals.budget, icon: Calculator, color: 'text-blue-600' },
          { label: 'Actual Cost', value: totals.actual, icon: ArrowDownLeft, color: 'text-rose-600' },
          { label: 'Commitments', value: totals.committed, icon: Layers, color: 'text-amber-600' },
          { label: 'Certified Claims', value: totals.claims, icon: ClipboardCheck, color: 'text-emerald-600' },
          { label: 'Forecast Final Cost', value: totals.forecast, icon: TrendingUp, color: 'text-indigo-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={cn('w-4 h-4', color)} />
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
            </div>
            <p className={cn('text-lg font-black tracking-tight mt-1', color)}>{currency(value)}</p>
          </div>
        ))}
      </div>

      {/* ── Horizontally Scrollable Sub-tabs Pill Bar (Hidden when standalone page) ── */}
      {!isStandalonePage && (
        <div className="w-full overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
          <div className="flex items-center gap-1.5 min-w-max bg-card/90 border border-border/80 p-1.5 rounded-2xl shadow-xs">
            {tabs.map(({ id, label, icon: Icon }) => {
              const isActive = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
                    isActive
                      ? 'bg-[#005A9C] text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB CONTENT ── */}

      {/* Overview Tab */}
      {tab === 'overview' && (
        <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Portfolio Commercial Control View</h2>
              <p className="text-xs text-muted-foreground">Confirmed accounting costs are separated from commitments and certified claims.</p>
            </div>
            <Badge variant="outline" className="self-start sm:self-auto font-bold text-xs">{summary.length} Projects Tracked</Badge>
          </div>

          {/* Mobile Native Card View (< md) */}
          <div className="md:hidden space-y-2.5">
            {summary.map(row => (
              <div key={row.project_id} className="p-3.5 bg-muted/20 border border-border/60 rounded-xl space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-xs text-[#005A9C] block">{row.project_code || 'PRJ'}</span>
                    <p className="font-bold text-sm text-foreground">{row.project_name}</p>
                  </div>
                  <Badge variant="outline" className={cn('font-bold text-[10px]', Number(row.forecast_variance) < 0 ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20')}>
                    Var: {currency(row.forecast_variance)}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/40">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Budget</span>
                    <span className="font-bold text-foreground">{currency(row.approved_budget)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Actual Cost</span>
                    <span className="font-bold text-rose-600">{currency(row.actual_cost)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Committed</span>
                    <span className="font-bold text-amber-600">{currency(row.committed_cost)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Forecast</span>
                    <span className="font-bold text-indigo-600">{currency(row.forecast_final_cost)}</span>
                  </div>
                </div>
              </div>
            ))}
            {!loading && summary.length === 0 && (
              <div className="py-12 text-center text-xs text-muted-foreground">No project finance records found.</div>
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                  <th className="p-3">Project</th>
                  <th className="p-3 text-right">Budget</th>
                  <th className="p-3 text-right">Actual Cost</th>
                  <th className="p-3 text-right">Committed</th>
                  <th className="p-3 text-right">Forecast Final</th>
                  <th className="p-3 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summary.map(row => (
                  <tr key={row.project_id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-bold text-foreground">
                      <span className="text-[#005A9C] font-mono mr-1.5">{row.project_code}</span>
                      {row.project_name}
                    </td>
                    <td className="p-3 text-right font-medium">{currency(row.approved_budget)}</td>
                    <td className="p-3 text-right font-bold text-rose-600">{currency(row.actual_cost)}</td>
                    <td className="p-3 text-right font-medium text-amber-600">{currency(row.committed_cost)}</td>
                    <td className="p-3 text-right font-bold text-indigo-600">{currency(row.forecast_final_cost)}</td>
                    <td className={cn('p-3 text-right font-black', Number(row.forecast_variance) < 0 ? 'text-destructive' : 'text-emerald-600')}>
                      {currency(row.forecast_variance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && summary.length === 0 && (
              <div className="py-12 text-center text-xs text-muted-foreground">No project finance records found.</div>
            )}
          </div>
        </section>
      )}

      {/* Budgets Tab */}
      {tab === 'budgets' && (
        <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-[#005A9C] shrink-0" />
              <div>
                <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Project Budgets Register</h2>
                <p className="text-xs text-muted-foreground">Approved and draft capital budgets for active projects.</p>
              </div>
            </div>
            <Button
              onClick={() => setShowBudgetModal(value => !value)}
              className="w-full sm:w-auto h-9 px-3.5 gap-1.5 text-xs font-semibold bg-[#005A9C] hover:bg-[#00477D] text-white shadow-sm shrink-0 whitespace-nowrap justify-center"
            >
              <Plus className="w-3.5 h-3.5" />
              New Budget Draft
            </Button>
          </div>

          {showBudgetModal && (
            <form onSubmit={createBudgetRecord} className="mb-5 grid gap-3 rounded-xl border border-border/80 bg-muted/30 p-4 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <label className="text-[11px] font-bold text-muted-foreground uppercase mb-1 block">Project Reference</label>
                <select
                  value={budgetForm.projectId || projectId}
                  onChange={event => setBudgetForm({ ...budgetForm, projectId: event.target.value })}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#005A9C]/40"
                >
                  <option value="">General Company Operations</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.project_code || 'PRJ'} · {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                placeholder="Budget Title (e.g. Phase 1 Construction Budget)"
                value={budgetForm.title}
                onChange={event => setBudgetForm({ ...budgetForm, title: event.target.value })}
                required
                className="h-9 text-xs"
              />
              <Input
                placeholder="Total Allocated Amount (GH₵)"
                type="number"
                min="0"
                step="0.01"
                value={budgetForm.totalAmount}
                onChange={event => setBudgetForm({ ...budgetForm, totalAmount: event.target.value })}
                required
                className="h-9 text-xs"
              />
              <Input
                placeholder="Notes / Scope Description"
                value={budgetForm.notes}
                onChange={event => setBudgetForm({ ...budgetForm, notes: event.target.value })}
                className="h-9 text-xs"
              />
              <div className="sm:col-span-3 flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowBudgetModal(false)} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs bg-[#005A9C] text-white">
                  Save Budget Draft
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {budgets.map(row => (
              <div key={row.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 p-3 sm:p-4">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">{row.budget_reference} · {row.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Version {row.version} · Currency: {row.currency || 'GHS'}</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Badge variant="outline" className="font-semibold text-xs capitalize">{row.approval_status || 'Draft'}</Badge>
                </div>
              </div>
            ))}
            {!loading && budgets.length === 0 && (
              <div className="py-12 text-center text-xs text-muted-foreground">No project budgets found for this selection.</div>
            )}
          </div>
        </section>
      )}

      {/* Variations & Claims Tab */}
      {(tab === 'variations' || tab === 'claims') && (
        <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
                {tab === 'variations' ? 'Commercial Variations' : 'Client Progress Claims'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {selectedProject ? selectedProject.name : 'Create or review project financial drafts across all projects.'}
              </p>
            </div>
            <Button
              onClick={() => setShowForm(value => !value)}
              className="w-full sm:w-auto h-9 px-3.5 gap-1.5 text-xs font-semibold bg-[#005A9C] hover:bg-[#00477D] text-white shadow-sm shrink-0 whitespace-nowrap justify-center"
            >
              <Plus className="w-3.5 h-3.5" />
              New {tab === 'variations' ? 'Variation' : 'Claim'} Draft
            </Button>
          </div>

          {showForm && (
            <form onSubmit={createRecord} className="mb-5 grid gap-3 rounded-xl border border-border/80 bg-muted/30 p-4 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <label className="text-[11px] font-bold text-muted-foreground uppercase mb-1 block">Project Reference</label>
                <select
                  value={form.projectId || projectId}
                  onChange={event => setForm({ ...form, projectId: event.target.value })}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#005A9C]/40"
                >
                  <option value="">General Company Operations</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.project_code || 'PRJ'} · {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                placeholder="Title / Reference"
                value={form.title}
                onChange={event => setForm({ ...form, title: event.target.value })}
                required
                className="h-9 text-xs"
              />
              <Input
                placeholder="Amount (GH₵)"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={event => setForm({ ...form, amount: event.target.value })}
                required
                className="h-9 text-xs"
              />
              <Input
                placeholder="Description / Reason"
                value={form.description}
                onChange={event => setForm({ ...form, description: event.target.value })}
                className="h-9 text-xs"
              />
              <div className="sm:col-span-3 flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs bg-[#005A9C] text-white">
                  Save Draft
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {(tab === 'variations' ? variations : claims).map(row => (
              <div key={row.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 p-3 sm:p-4">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">{row.title || row.claim_reference}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{row.description || row.claim_date || 'Draft record'}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto pt-2 sm:pt-0 border-t sm:border-0 border-border/40">
                  <span className="font-black text-sm text-foreground">
                    {currency(row.proposed_value_adjustment || row.current_claim_amount)}
                  </span>
                  <Badge variant="outline" className="font-semibold text-xs capitalize">
                    {row.approval_status || 'Draft'}
                  </Badge>
                </div>
              </div>
            ))}
            {!loading && (tab === 'variations' ? variations : claims).length === 0 && (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No {tab === 'variations' ? 'variations' : 'progress claims'} recorded for this selection.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
