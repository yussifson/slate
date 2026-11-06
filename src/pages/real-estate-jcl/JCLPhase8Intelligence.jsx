import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, BarChart3, Bell, CalendarClock, CheckCircle2, Download,
  FileSpreadsheet, Filter, Gauge, Loader2, Plus, RefreshCw, Search,
  ShieldAlert, Target, TrendingUp, Users, Wallet, XCircle
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const REPORT_SOURCES = {
  projects: { label: 'Projects', table: 'ops_projects', columns: ['name', 'status', 'project_type', 'location', 'created_at'] },
  properties: { label: 'Properties', table: 'univ_re_properties', columns: ['name', 'status', 'property_type', 'location', 'price', 'created_at'] },
  clients: { label: 'Clients', table: 'univ_re_clients', columns: ['name', 'status', 'email', 'phone', 'created_at'] },
  transactions: { label: 'Transactions', table: 'univ_re_transactions', columns: ['property_id', 'status', 'sale_price', 'closing_date', 'created_at'] },
  tasks: { label: 'Tasks', table: 'tasks', columns: ['title', 'status', 'priority', 'due_date', 'created_at'] },
  maintenance: { label: 'Maintenance', table: 'univ_re_maintenance', columns: ['title', 'status', 'priority', 'created_at'] },
};

const METRIC_DEFS = [
  { key: 'projects', label: 'Active projects', icon: BarChart3, table: 'ops_projects', filter: (q) => q.eq('status', 'active') },
  { key: 'clients', label: 'Active clients', icon: Users, table: 'univ_re_clients', filter: (q) => q.in('status', ['active', 'prospect', 'qualified']) },
  { key: 'properties', label: 'Managed properties', icon: TrendingUp, table: 'univ_re_properties', filter: (q) => q },
  { key: 'tasks', label: 'Open tasks', icon: CheckCircle2, table: 'tasks', filter: (q) => q.not('status', 'in', '(completed,Completed,done)') },
  { key: 'maintenance', label: 'Open maintenance', icon: ShieldAlert, table: 'univ_re_maintenance', filter: (q) => q.in('status', ['open', 'pending', 'in_progress']) },
];

function toRows(result) {
  return Array.isArray(result?.data) ? result.data : [];
}

async function countTenantRows(companyId, definition) {
  let query = supabase.from(definition.table).select('id', { count: 'exact', head: true }).eq('company_id', companyId);
  query = definition.filter(query);
  const result = await query;
  return { count: result.error ? null : (result.count || 0), error: result.error };
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}

function MetricCard({ metric, value }) {
  const Icon = metric.icon;
  return (
    <Card className="border-border/70 bg-card/80 shadow-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{metric.label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value === null ? '—' : value}</p>
          <p className="mt-1 text-xs text-muted-foreground">Live tenant-scoped record count</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
      </CardContent>
    </Card>
  );
}

function DataQuality({ failures }) {
  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><ShieldAlert className="h-4 w-4 text-amber-500" />Data quality and source coverage</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {failures.length === 0 ? <p className="text-sm text-muted-foreground">All configured sources responded successfully.</p> : failures.map((failure) => (
          <div key={failure.key} className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div><p className="text-sm font-medium">{failure.label}</p><p className="text-xs text-muted-foreground">{failure.message || 'Source is unavailable or not yet provisioned.'}</p></div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ExecutiveDashboard({ companyId }) {
  const [metrics, setMetrics] = useState(() => Object.fromEntries(METRIC_DEFS.map((metric) => [metric.key, null])));
  const [failures, setFailures] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const results = await Promise.all(METRIC_DEFS.map((metric) => countTenantRows(companyId, metric)));
    const next = {};
    const nextFailures = [];
    results.forEach((result, index) => {
      const metric = METRIC_DEFS[index];
      next[metric.key] = result.count;
      if (result.error) nextFailures.push({ key: metric.key, label: metric.label, message: result.error.message });
    });
    setMetrics(next);
    setFailures(nextFailures);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Executive intelligence</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Business performance</h2><p className="mt-1 text-sm text-muted-foreground">A traceable view of persisted JCL records. No estimates or fabricated metrics.</p></div><Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />Refresh</Button></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{METRIC_DEFS.map((metric) => <MetricCard key={metric.key} metric={metric} value={loading ? null : metrics[metric.key]} />)}</div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]"><Card className="border-border/70 bg-card/80"><CardHeader><CardTitle className="text-base">Management attention</CardTitle></CardHeader><CardContent className="space-y-3"><AttentionRow icon={AlertTriangle} title="Overdue task review" detail={metrics.tasks === null ? 'Task source unavailable' : `${metrics.tasks} open tasks require operational review`} tone="amber" /><AttentionRow icon={Wallet} title="Financial source boundary" detail="Budget, commitments, payments and profitability appear only when their Phase 5 source tables are available." tone="blue" /><AttentionRow icon={CalendarClock} title="Handover readiness" detail="Connect handover and defect records to surface completion obligations without guessing." tone="purple" /></CardContent></Card><DataQuality failures={failures} /></div>
    </div>
  );
}

function AttentionRow({ icon: Icon, title, detail, tone }) {
  return <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3"><div className={cn('rounded-lg p-2', tone === 'amber' && 'bg-amber-500/10 text-amber-600', tone === 'blue' && 'bg-blue-500/10 text-blue-600', tone === 'purple' && 'bg-purple-500/10 text-purple-600')}><Icon className="h-4 w-4" /></div><div><p className="text-sm font-medium">{title}</p><p className="text-xs leading-5 text-muted-foreground">{detail}</p></div></div>;
}

function ReportBuilder({ companyId, user }) {
  const [sourceKey, setSourceKey] = useState('projects');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const source = REPORT_SOURCES[sourceKey];

  const runReport = async () => {
    if (!companyId) return;
    setLoading(true); setError('');
    let query = supabase.from(source.table).select(source.columns.join(',')).eq('company_id', companyId).order('created_at', { ascending: false }).limit(250);
    const result = await query;
    if (result.error) { setRows([]); setError(result.error.message); } else { setRows(toRows(result)); }
    setLoading(false);
  };

  useEffect(() => { runReport(); }, [companyId, sourceKey]);
  const filteredRows = useMemo(() => rows.filter((row) => !search || Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(search.toLowerCase()))), [rows, search]);

  const exportCsv = () => {
    const columns = source.columns;
    const csv = [columns.join(','), ...filteredRows.map((row) => columns.map((column) => `"${String(row[column] ?? '').replaceAll('"', '""')}"`).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `jcl-${sourceKey}-report.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  return <Card className="border-border/70 bg-card/80"><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="text-base">Approved report builder</CardTitle><p className="mt-1 text-xs text-muted-foreground">Uses allowlisted sources and tenant-scoped queries only.</p></div><Button variant="outline" size="sm" onClick={exportCsv} disabled={!filteredRows.length}><Download className="mr-2 h-4 w-4" />Export CSV</Button></div></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-[220px_1fr_auto]"><select value={sourceKey} onChange={(event) => setSourceKey(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">{Object.entries(REPORT_SOURCES).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search returned records" className="pl-9" /></div><Button onClick={runReport} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="mr-2 h-4 w-4" />}Run report</Button></div>{error ? <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div> : <div className="overflow-x-auto rounded-lg border border-border/60"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground"><tr>{source.columns.map((column) => <th key={column} className="px-3 py-3 font-medium">{column.replaceAll('_', ' ')}</th>)}</tr></thead><tbody className="divide-y divide-border/50">{filteredRows.map((row, index) => <tr key={row.id || index} className="hover:bg-muted/30">{source.columns.map((column) => <td key={column} className="max-w-[240px] truncate px-3 py-3">{column.includes('_at') || column.includes('date') ? formatDate(row[column]) : String(row[column] ?? '—')}</td>)}</tr>)}{!filteredRows.length && <tr><td colSpan={source.columns.length} className="px-3 py-10 text-center text-sm text-muted-foreground">{loading ? 'Loading persisted records…' : 'No records matched this report.'}</td></tr>}</tbody></table></div>}<p className="text-xs text-muted-foreground">Showing {filteredRows.length} of {rows.length} authorized records. Prepared for {user?.email || 'the current user'}.</p></CardContent></Card>;
}

function ConfiguredLists({ companyId, kind }) {
  const table = kind === 'kpis' ? 'jcl_kpi_definitions' : 'jcl_bi_alerts';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let mounted = true; setLoading(true); supabase.from(table).select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(50).then(({ data, error }) => { if (mounted) { setRows(error ? [] : (data || [])); setLoading(false); } }); return () => { mounted = false; }; }, [companyId, table]);
  return <Card className="border-border/70 bg-card/80"><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-base">{kind === 'kpis' ? 'Configured KPIs and targets' : 'Business intelligence alerts'}</CardTitle><Badge variant="outline">{rows.length} records</Badge></div></CardHeader><CardContent>{loading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading persisted configuration…</div> : !rows.length ? <div className="rounded-lg border border-dashed border-border p-8 text-center"><Target className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-sm font-medium">No {kind === 'kpis' ? 'KPIs' : 'alerts'} configured</p><p className="mt-1 text-xs text-muted-foreground">Create configuration after applying the Phase 8 migration. This screen never invents targets or alerts.</p></div> : <div className="space-y-2">{rows.map((row) => <div key={row.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3"><div><p className="text-sm font-medium">{row.name || row.title || 'Untitled record'}</p><p className="text-xs text-muted-foreground">{row.description || row.status || 'Configured record'}</p></div><Badge variant="secondary">{row.status || (row.is_active ? 'Active' : 'Inactive')}</Badge></div>)}</div>}</CardContent></Card>;
}

export default function JCLPhase8Intelligence() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const tabs = [{ id: 'overview', label: 'Executive dashboard', icon: Gauge }, { id: 'reports', label: 'Report builder', icon: FileSpreadsheet }, { id: 'kpis', label: 'KPI management', icon: Target }, { id: 'alerts', label: 'BI alerts', icon: Bell }];
  return <div className="min-h-full w-full bg-background p-4 pb-24 sm:p-6 lg:p-8"><div className="mx-auto max-w-[1500px] space-y-6"><header className="flex flex-col gap-4 border-b border-border/60 pb-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary"><BarChart3 className="h-4 w-4" />JCL intelligence</div><h1 className="mt-2 text-3xl font-semibold tracking-tight">Business intelligence & reporting</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Executive visibility across projects, property operations, clients and workforce records with traceable tenant-scoped data.</p></div><Badge variant="outline" className="w-fit gap-2 px-3 py-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />Live data sources</Badge></header><nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Intelligence navigation">{tabs.map(({ id, label, icon: Icon }) => <Button key={id} variant={tab === id ? 'default' : 'outline'} size="sm" onClick={() => setTab(id)} className="shrink-0"><Icon className="mr-2 h-4 w-4" />{label}</Button>)}</nav>{!companyId ? <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Select or load a company to view authorized intelligence.</CardContent></Card> : tab === 'overview' ? <ExecutiveDashboard companyId={companyId} /> : tab === 'reports' ? <ReportBuilder companyId={companyId} user={user} /> : <ConfiguredLists companyId={companyId} kind={tab} />}</div></div>;
}
