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

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : tab === 'engagements' ? (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3.5 px-4">Ref Code</th>
                  <th className="py-3.5 px-4">Engagement Title</th>
                  <th className="py-3.5 px-4">Client Name</th>
                  <th className="py-3.5 px-4">Engagement Type</th>
                  <th className="py-3.5 px-4">Site Location</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className="group hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-primary">
                      {item.engagement_number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      {item.title}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {item.client?.primary_name || <span className="italic text-muted-foreground/60">Unlinked</span>}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-foreground">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-primary">
                        {typeLabel(item.engagement_type)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground truncate max-w-[200px]">
                      {item.site_address ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                          {item.site_address}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        item.status === 'converted_to_project' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        item.status === 'under_review' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                        'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}>
                        {item.status.replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelected(item); }}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-all"
                      >
                        Details <ChevronRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      No engagements found matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3.5 px-4">Project Code</th>
                  <th className="py-3.5 px-4">Project Name</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Budget</th>
                  <th className="py-3.5 px-4">Progress</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {projects
                  .filter((item) => `${item.name} ${item.project_code}`.toLowerCase().includes(search.toLowerCase()))
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-primary">
                        {item.project_code}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {item.client?.primary_name || <span className="italic text-muted-foreground/60">Standalone Delivery Project</span>}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-foreground">
                        {item.budget_amount ? `${Number(item.budget_amount).toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 min-w-[150px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-300"
                              style={{ width: `${item.progress_percentage || 0}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-muted-foreground w-8 text-right">
                            {item.progress_percentage || 0}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {item.status?.replaceAll('_', ' ') || 'Active'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" /> Ready
                        </span>
                      </td>
                    </tr>
                  ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      No delivery projects created from engagements yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm p-4" onClick={() => setSelected(null)}><aside onClick={(event) => event.stopPropagation()} className="ml-auto flex h-full max-w-lg flex-col overflow-auto rounded-2xl border border-border bg-card p-6 shadow-xl"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">{selected.engagement_number}</p><h2 className="mt-1 text-2xl font-black">{selected.title}</h2></div><button onClick={() => setSelected(null)} className="rounded-lg px-2 py-1 text-muted-foreground hover:bg-muted">Close</button></div><div className="mt-6 space-y-4 text-sm"><Detail label="Client" value={selected.client?.primary_name || 'Not linked'} /><Detail label="Type" value={typeLabel(selected.engagement_type)} /><Detail label="Status" value={selected.status.replaceAll('_', ' ')} /><Detail label="Site" value={selected.site_address || 'Not provided'} /><Detail label="Budget" value={selected.budget_max || selected.budget_min ? `${selected.budget_min || 0} - ${selected.budget_max || selected.budget_min}` : 'Not provided'} /><Detail label="Timeline" value={`${selected.expected_start_date || 'TBD'} → ${selected.expected_completion_date || 'TBD'}`} /></div>{selected.status !== 'converted_to_project' && !['lost','cancelled'].includes(selected.status) && <button disabled={saving} onClick={convert} className="mt-auto flex h-11 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-60"><FolderKanban className="h-4 w-4" /> Convert to project</button>}</aside></div>}

      {showForm && <div className="fixed inset-0 z-50 overflow-auto bg-background/80 backdrop-blur-sm p-4 flex items-center justify-center"><form onSubmit={submit} className="mx-auto my-6 max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-xl"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Phase 1 intake</p><h2 className="mt-1 text-2xl font-black">New client engagement</h2></div><button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-2 py-1 text-muted-foreground hover:bg-muted">Cancel</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Client" required><select value={form.client_party_id} onChange={(event) => update('client_party_id', event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"><option value="">Select existing client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.primary_name}</option>)}</select></Field><Field label="Engagement title" required><input value={form.title} onChange={(event) => update('title', event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="e.g. Ridgeway residence completion" /></Field><Field label="Engagement type"><select value={form.engagement_type} onChange={(event) => update('engagement_type', event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30">{TYPES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><Field label="Priority"><select value={form.priority} onChange={(event) => update('priority', event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></Field><Field label="Site / project address"><input value={form.site_address} onChange={(event) => update('site_address', event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="Address or site description" /></Field><Field label="Desired timeline"><input value={form.desired_timeline} onChange={(event) => update('desired_timeline', event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="e.g. Start Q3, complete in 8 months" /></Field><Field label="Budget minimum"><input type="number" min="0" value={form.budget_min} onChange={(event) => update('budget_min', event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></Field><Field label="Budget maximum"><input type="number" min="0" value={form.budget_max} onChange={(event) => update('budget_max', event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></Field><Field label="Expected start"><input type="date" value={form.expected_start_date} onChange={(event) => update('expected_start_date', event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></Field><Field label="Expected completion"><input type="date" value={form.expected_completion_date} onChange={(event) => update('expected_completion_date', event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></Field><Field label="Client objectives"><textarea value={form.objectives} onChange={(event) => update('objectives', event.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-input bg-card text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></Field><Field label="Requested scope"><textarea value={form.requested_scope} onChange={(event) => update('requested_scope', event.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-input bg-card text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></Field><Field label="Constraints / assumptions"><textarea value={form.constraints} onChange={(event) => update('constraints', event.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-input bg-card text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></Field><Field label="Project description"><textarea value={form.description} onChange={(event) => update('description', event.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-input bg-card text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></Field></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted">Cancel</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Create engagement</button></div></form></div>}
    </div>
  </div>;
}

function Field({ label, required, children }) { return <label className="block text-sm font-medium text-foreground">{label}{required && <span className="ml-1 text-destructive">*</span>}{children}</label>; }
function Detail({ label, value }) { return <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 font-medium capitalize">{value}</p></div>; }
function EmptyState({ label }) { return <div className="col-span-full rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">{label}</div>; }
