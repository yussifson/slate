import React, { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, CheckCircle2, ChevronRight, ClipboardList, FolderKanban, Loader2, MapPin, Plus, Search, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCompanyId } from '@/hooks/useCompanyId';
import { JCLPhase1Service } from '@/services/JCLPhase1Service';

const TYPES = [
  ['new_construction', 'New construction'],
  ['takeover_completion', 'Takeover / completion'],
  ['renovation_extension', 'Renovation / extension'],
  ['engineering_consultancy', 'Engineering / technical consultancy'],
  ['planning_design', 'Planning and design'],
  ['landscaping_external_works', 'Landscaping / external works'],
  ['site_preparation_supervision', 'Site preparation / supervision'],
  ['other', 'Other approved service'],
];
const EMPTY = { client_party_id: '', title: '', description: '', engagement_type: 'new_construction', priority: 'medium', site_address: '', budget_min: '', budget_max: '', expected_start_date: '', expected_completion_date: '', objectives: '', requested_scope: '', constraints: '', desired_timeline: '' };

export default function JCLEngagements() {
  const companyId = useCompanyId();
  const [tab, setTab] = useState('engagements');
  const [engagements, setEngagements] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [nextEngagements, nextProjects, nextClients] = await Promise.all([
        JCLPhase1Service.listEngagements(companyId),
        JCLPhase1Service.listProjects(companyId),
        JCLPhase1Service.listClients(companyId),
      ]);
      setEngagements(nextEngagements);
      setProjects(nextProjects);
      setClients(nextClients);
    } catch (error) {
      console.error('[v0] JCL Phase 1 load failed:', error);
      toast.error('Unable to load JCL engagements');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [companyId]);

  const filtered = useMemo(() => engagements.filter((item) => `${item.title} ${item.engagement_number} ${item.client?.primary_name || ''}`.toLowerCase().includes(search.toLowerCase())), [engagements, search]);
  const typeLabel = (value) => TYPES.find(([key]) => key === value)?.[1] || value;
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.client_party_id || !form.title.trim()) {
      toast.error('Select a client and enter an engagement title');
      return;
    }
    setSaving(true);
    try {
      const engagement = await JCLPhase1Service.createEngagement(companyId, null, form);
      await JCLPhase1Service.saveRequirements(companyId, null, engagement.id, form);
      toast.success('Engagement created');
      setShowForm(false); setForm(EMPTY); await load(); setSelected(engagement);
    } catch (error) {
      console.error('[v0] JCL engagement create failed:', error);
      toast.error(error.message || 'Unable to create engagement');
    } finally { setSaving(false); }
  };

  const convert = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await JCLPhase1Service.convertToProject(companyId, null, selected);
      toast.success('Engagement converted to project');
      setSelected(null); await load(); setTab('projects');
    } catch (error) {
      console.error('[v0] JCL project conversion failed:', error);
      toast.error(error.message || 'Unable to create project');
    } finally { setSaving(false); }
  };

  return <div className="h-full overflow-auto bg-background p-5 sm:p-8">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary"><Sparkles className="h-4 w-4" /> JCL delivery foundation</div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Engagements & projects</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Capture the client brief, assess the opportunity, and convert approved work into a delivery project without brokerage steps.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm"><Plus className="h-4 w-4" /> New engagement</button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[['Open engagements', engagements.filter((x) => !['converted_to_project','lost','cancelled'].includes(x.status)).length, BriefcaseBusiness], ['Projects created', projects.length, FolderKanban], ['Needs assessment', engagements.filter((x) => ['consultation','requirements_gathering','assessment'].includes(x.status)).length, ClipboardList]].map(([label, value, Icon]) => <div key={label} className="rounded-2xl border border-border bg-card p-4"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{label}</span><Icon className="h-4 w-4 text-primary" /></div><p className="mt-2 text-2xl font-black">{value}</p></div>)}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {[['engagements', 'Engagement pipeline'], ['projects', 'Delivery projects']].map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>{label}</button>)}
        <div className="relative ml-auto min-w-[220px] flex-1 sm:max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search records" className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></div>
      </div>

      {loading ? <div className="flex h-48 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : tab === 'engagements' ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <button key={item.id} onClick={() => setSelected(item)} className="group rounded-2xl border border-border bg-card p-5 text-left transition hover:border-primary/50 hover:shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.engagement_number}</p><h2 className="mt-1 font-bold text-foreground">{item.title}</h2></div><ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" /></div><p className="mt-3 text-sm text-muted-foreground">{item.client?.primary_name || 'Client not linked'}</p><div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">{typeLabel(item.engagement_type)}</span><span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{item.status.replaceAll('_', ' ')}</span></div>{item.site_address && <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{item.site_address}</p>}</button>)}{filtered.length === 0 && <EmptyState label="No engagements yet" />}</div> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{projects.filter((item) => `${item.name} ${item.project_code}`.toLowerCase().includes(search.toLowerCase())).map((item) => <div key={item.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.project_code}</p><h2 className="mt-1 font-bold">{item.name}</h2></div><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div><p className="mt-3 text-sm text-muted-foreground">{item.client?.primary_name || 'Standalone service project'}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${item.progress_percentage || 0}%` }} /></div><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{item.status.replaceAll('_', ' ')}</span><span>{item.progress_percentage || 0}%</span></div></div>)}{projects.length === 0 && <EmptyState label="No projects created from engagements yet" />}</div>}

      {selected && <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm p-4" onClick={() => setSelected(null)}><aside onClick={(event) => event.stopPropagation()} className="ml-auto flex h-full max-w-lg flex-col overflow-auto rounded-2xl border border-border bg-card p-6 shadow-xl"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">{selected.engagement_number}</p><h2 className="mt-1 text-2xl font-black">{selected.title}</h2></div><button onClick={() => setSelected(null)} className="rounded-lg px-2 py-1 text-muted-foreground hover:bg-muted">Close</button></div><div className="mt-6 space-y-4 text-sm"><Detail label="Client" value={selected.client?.primary_name || 'Not linked'} /><Detail label="Type" value={typeLabel(selected.engagement_type)} /><Detail label="Status" value={selected.status.replaceAll('_', ' ')} /><Detail label="Site" value={selected.site_address || 'Not provided'} /><Detail label="Budget" value={selected.budget_max || selected.budget_min ? `${selected.budget_min || 0} - ${selected.budget_max || selected.budget_min}` : 'Not provided'} /><Detail label="Timeline" value={`${selected.expected_start_date || 'TBD'} → ${selected.expected_completion_date || 'TBD'}`} /></div>{selected.status !== 'converted_to_project' && !['lost','cancelled'].includes(selected.status) && <button disabled={saving} onClick={convert} className="mt-auto flex h-11 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-60"><FolderKanban className="h-4 w-4" /> Convert to project</button>}</aside></div>}

      {showForm && <div className="fixed inset-0 z-50 overflow-auto bg-background/80 backdrop-blur-sm p-4 flex items-center justify-center"><form onSubmit={submit} className="mx-auto my-6 max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-xl"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Phase 1 intake</p><h2 className="mt-1 text-2xl font-black">New client engagement</h2></div><button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-2 py-1 text-muted-foreground hover:bg-muted">Cancel</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Client" required><select value={form.client_party_id} onChange={(event) => update('client_party_id', event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"><option value="">Select existing client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.primary_name}</option>)}</select></Field><Field label="Engagement title" required><input value={form.title} onChange={(event) => update('title', event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="e.g. Ridgeway residence completion" /></Field><Field label="Engagement type"><select value={form.engagement_type} onChange={(event) => update('engagement_type', event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30">{TYPES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><Field label="Priority"><select value={form.priority} onChange={(event) => update('priority', event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></Field><Field label="Site / project address"><input value={form.site_address} onChange={(event) => update('site_address', event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="Address or site description" /></Field><Field label="Desired timeline"><input value={form.desired_timeline} onChange={(event) => update('desired_timeline', event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="e.g. Start Q3, complete in 8 months" /></Field><Field label="Budget minimum"><input type="number" min="0" value={form.budget_min} onChange={(event) => update('budget_min', event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></Field><Field label="Budget maximum"><input type="number" min="0" value={form.budget_max} onChange={(event) => update('budget_max', event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></Field><Field label="Expected start"><input type="date" value={form.expected_start_date} onChange={(event) => update('expected_start_date', event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></Field><Field label="Expected completion"><input type="date" value={form.expected_completion_date} onChange={(event) => update('expected_completion_date', event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></Field><Field label="Client objectives"><textarea value={form.objectives} onChange={(event) => update('objectives', event.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-input bg-card text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></Field><Field label="Requested scope"><textarea value={form.requested_scope} onChange={(event) => update('requested_scope', event.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-input bg-card text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></Field><Field label="Constraints / assumptions"><textarea value={form.constraints} onChange={(event) => update('constraints', event.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-input bg-card text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></Field><Field label="Project description"><textarea value={form.description} onChange={(event) => update('description', event.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-input bg-card text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></Field></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted">Cancel</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Create engagement</button></div></form></div>}
    </div>
  </div>;
}

function Field({ label, required, children }) { return <label className="block text-sm font-medium text-foreground">{label}{required && <span className="ml-1 text-destructive">*</span>}{children}</label>; }
function Detail({ label, value }) { return <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 font-medium capitalize">{value}</p></div>; }
function EmptyState({ label }) { return <div className="col-span-full rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">{label}</div>; }
