import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Calculator, ClipboardCheck, Plus, RefreshCw, TrendingUp } from 'lucide-react';
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

export default function JCLProjectFinance() {
  const companyId = useCompanyId();
  const { toast } = useToast();
  const [tab, setTab] = useState('overview');
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [variations, setVariations] = useState([]);
  const [claims, setClaims] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', amount: '' });

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
        JCLPhase5FinanceService.listProjects(companyId),
        JCLPhase5FinanceService.getPortfolioSummary(companyId),
        JCLPhase5FinanceService.listBudgets(companyId, projectId || undefined),
        JCLPhase5FinanceService.listVariations(companyId, projectId || undefined),
        JCLPhase5FinanceService.listClaims(companyId, projectId || undefined),
      ]);
      setProjects(projectRows);
      setSummary(summaryRows);
      setBudgets(budgetRows);
      setVariations(variationRows);
      setClaims(claimRows);
    } catch (error) {
      toast({ title: 'Project finance unavailable', description: error.message || 'Run the Phase 5 migration, then refresh.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [companyId, projectId]);

  const createRecord = async event => {
    event.preventDefault();
    if (!projectId || !form.title || !form.amount) return;
    try {
      if (tab === 'variations') await JCLPhase5FinanceService.createVariation({ companyId, projectId, variation: { title: form.title, description: form.description, proposed_value_adjustment: form.amount, cost_impact: form.amount } });
      if (tab === 'claims') await JCLPhase5FinanceService.createClaim({ companyId, projectId, claim: { description: form.description, current_claim_amount: form.amount } });
      setForm({ title: '', description: '', amount: '' });
      setShowForm(false);
      await load();
      toast({ title: 'Saved', description: `${tab === 'variations' ? 'Variation' : 'Progress claim'} created as a draft.` });
    } catch (error) {
      toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <main className="min-h-screen bg-muted/20 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Commercial control</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Project Finance</h1><p className="mt-1 text-sm text-muted-foreground">Budgets, commitments, costs, claims and forecast profitability.</p></div>
          <div className="flex gap-2"><select value={projectId} onChange={event => setProjectId(event.target.value)} className="h-10 rounded-lg border bg-background px-3 text-sm"><option value="">All projects</option>{projects.map(project => <option key={project.id} value={project.id}>{project.project_code} · {project.name}</option>)}</select><Button variant="outline" size="icon" onClick={load} aria-label="Refresh finance"><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /></Button></div>
        </header>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[['Approved budget', totals.budget], ['Actual cost', totals.actual], ['Commitments', totals.committed], ['Certified claims', totals.claims], ['Forecast final cost', totals.forecast]].map(([label, value]) => <div key={label} className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-lg font-bold">{currency(value)}</p></div>)}</section>
        <nav className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={cn('inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium', tab === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}><Icon className="h-4 w-4" />{label}</button>)}</nav>
        {tab === 'overview' && <section className="rounded-xl border bg-card p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Portfolio control view</h2><p className="text-sm text-muted-foreground">Confirmed accounting costs are separated from outstanding commitments.</p></div><Badge variant="outline">{summary.length} projects</Badge></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="p-3">Project</th><th className="p-3">Budget</th><th className="p-3">Actual</th><th className="p-3">Committed</th><th className="p-3">Forecast</th><th className="p-3">Variance</th></tr></thead><tbody>{summary.map(row => <tr key={row.project_id} className="border-b last:border-0"><td className="p-3 font-medium">{row.project_code} · {row.project_name}</td><td className="p-3">{currency(row.approved_budget)}</td><td className="p-3">{currency(row.actual_cost)}</td><td className="p-3">{currency(row.committed_cost)}</td><td className="p-3">{currency(row.forecast_final_cost)}</td><td className={cn('p-3 font-semibold', Number(row.forecast_variance) < 0 ? 'text-destructive' : 'text-emerald-600')}>{currency(row.forecast_variance)}</td></tr>)}</tbody></table>{!loading && summary.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No persisted project finance records found.</p>}</div></section>}
        {tab === 'budgets' && <FinanceList title="Project budgets" icon={Calculator} empty="No budgets have been created for this selection." rows={budgets} render={row => <><div><p className="font-medium">{row.budget_reference} · {row.title}</p><p className="text-xs text-muted-foreground">Version {row.version} · {row.currency}</p></div><Badge>{row.approval_status}</Badge></>} />}
        {(tab === 'variations' || tab === 'claims') && <section className="rounded-xl border bg-card p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">{tab === 'variations' ? 'Commercial variations' : 'Client progress claims'}</h2><p className="text-sm text-muted-foreground">{selectedProject ? selectedProject.name : 'Select a project to create a controlled draft.'}</p></div><Button onClick={() => setShowForm(value => !value)} disabled={!projectId}><Plus className="mr-2 h-4 w-4" />New draft</Button></div>{showForm && <form onSubmit={createRecord} className="mb-5 grid gap-3 rounded-xl border bg-muted/30 p-4 md:grid-cols-3"><Input placeholder="Title / reference" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} required /><Input placeholder="Amount" type="number" min="0" step="0.01" value={form.amount} onChange={event => setForm({ ...form, amount: event.target.value })} required /><Input placeholder="Description" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /><Button type="submit">Save draft</Button></form>}<div className="space-y-2">{(tab === 'variations' ? variations : claims).map(row => <div key={row.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="font-medium">{row.title || row.claim_reference}</p><p className="text-xs text-muted-foreground">{row.description || row.claim_date || 'Draft record'}</p></div><div className="text-right"><p className="font-semibold">{currency(row.proposed_value_adjustment || row.current_claim_amount)}</p><Badge variant="outline">{row.approval_status}</Badge></div></div>)}{!loading && (tab === 'variations' ? variations : claims).length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No records found.</p>}</div></section>}
      </div>
    </main>
  );
}

function FinanceList({ title, icon: Icon, rows, empty, render }) {
  return <section className="rounded-xl border bg-card p-5"><div className="mb-4 flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /><h2 className="font-semibold">{title}</h2></div><div className="space-y-2">{rows.map(row => <div key={row.id} className="flex items-center justify-between rounded-lg border p-3">{render(row)}</div>)}{rows.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">{empty}</p>}</div></section>;
}
