import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarClock, CheckCircle2, ClipboardCheck, FileText, GitPullRequest, Plus, RefreshCw, Search, Wrench } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { JCLEngineeringService } from '@/services/JCLEngineeringService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const tabs = ['overview', 'assignments', 'requirements', 'drawings', 'submissions', 'reports', 'issues', 'changes'];
const labels = { draft: 'Draft', assigned: 'Assigned', in_progress: 'In progress', submitted: 'Submitted', under_review: 'Under review', completed: 'Completed', open: 'Open', resolved: 'Resolved', verified: 'Verified', closed: 'Closed' };

function Metric({ label, value, icon: Icon, tone = 'bg-primary/10 text-primary' }) {
  return <Card><CardContent className="flex items-start justify-between p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p></div><span className={`rounded-lg p-2 ${tone}`}><Icon className="size-4" /></span></CardContent></Card>;
}

function Register({ rows, columns, empty }) {
  return <Card><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b bg-muted/40 text-left text-muted-foreground"><tr>{columns.map((column) => <th className="whitespace-nowrap p-4 font-medium" key={column.label}>{column.label}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row) => <tr className="border-b last:border-0" key={row.id}>{columns.map((column) => <td className="p-4" key={column.label}>{column.render ? column.render(row) : row[column.key] || '—'}</td>)}</tr>) : <tr><td className="p-10 text-center text-muted-foreground" colSpan={columns.length}>{empty}</td></tr>}</tbody></table></div></CardContent></Card>;
}

export default function JCLEngineering() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = tabs.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'overview';
  const [data, setData] = useState({ assignments: [], requirements: [], drawings: [], submissions: [], reports: [], issues: [], changes: [], stats: {} });
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ project_id: '', discipline: 'architectural', title: '', description: '', target_completion_date: '', priority: 'medium' });

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [nextData, projectResult] = await Promise.all([JCLEngineeringService.dashboard(companyId), supabase.from('ops_projects').select('id,name,project_code').eq('company_id', companyId).order('name')]);
      if (projectResult.error) throw projectResult.error;
      setData(nextData); setProjects(projectResult.data || []);
      if (!form.project_id && projectResult.data?.[0]) setForm((current) => ({ ...current, project_id: projectResult.data[0].id }));
    } catch (error) { toast.error(error.message || 'Unable to load engineering records'); } finally { setLoading(false); }
  }, [companyId, form.project_id]);
  useEffect(() => { load(); }, [load]);

  const match = (row) => `${row.assignment_reference || ''} ${row.requirement_reference || ''} ${row.title || ''} ${row.description || ''} ${row.discipline || ''}`.toLowerCase().includes(query.toLowerCase());
  const submitAssignment = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return toast.error('Add an assignment title.');
    try { await JCLEngineeringService.createAssignment(companyId, user?.id, form); toast.success('Engineering assignment created'); setShowForm(false); setForm((current) => ({ ...current, title: '', description: '' })); await load(); } catch (error) { toast.error(error.message); }
  };
  const status = (value) => <Badge variant="secondary">{labels[value] || value || '—'}</Badge>;
  const filtered = (rows) => rows.filter(match);
  const s = data.stats;

  return <main className="min-h-full bg-background p-4 sm:p-6 lg:p-8"><div className="mx-auto flex max-w-7xl flex-col gap-6">
    <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">JCL Royal Group / Project delivery</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Engineering & technical records</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Manage engineering assignments, design records, reviews, approvals and technical issues against live construction projects.</p></div><div className="flex gap-2"><Button variant="outline" onClick={load} disabled={loading}><RefreshCw data-icon="inline-start" className={loading ? 'animate-spin' : ''} />Refresh</Button><Button onClick={() => setShowForm((value) => !value)}><Plus data-icon="inline-start" />New assignment</Button></div></header>
    {showForm && <Card><CardHeader><CardTitle>Create engineering assignment</CardTitle><CardDescription>Link the technical responsibility to a project and preserve its delivery target.</CardDescription></CardHeader><CardContent><form className="grid gap-4 md:grid-cols-2" onSubmit={submitAssignment}><div className="grid gap-2"><Label htmlFor="engineering-project">Project</Label><Select value={form.project_id} onValueChange={(value) => setForm({ ...form, project_id: value })}><SelectTrigger id="engineering-project"><SelectValue placeholder="Select project" /></SelectTrigger><SelectContent>{projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.project_code} · {project.name}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="engineering-discipline">Discipline</Label><Select value={form.discipline} onValueChange={(value) => setForm({ ...form, discipline: value })}><SelectTrigger id="engineering-discipline"><SelectValue /></SelectTrigger><SelectContent>{['architectural','structural','civil','electrical','mechanical','plumbing','geotechnical','environmental','quantity_surveying','other'].map((value) => <SelectItem key={value} value={value}>{value.replace('_', ' ')}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2 md:col-span-2"><Label htmlFor="assignment-title">Assignment title</Label><Input id="assignment-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Issue structural foundation package" /></div><div className="grid gap-2"><Label htmlFor="assignment-target">Target completion</Label><Input id="assignment-target" type="date" value={form.target_completion_date} onChange={(event) => setForm({ ...form, target_completion_date: event.target.value })} /></div><div className="grid gap-2"><Label htmlFor="assignment-priority">Priority</Label><Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value })}><SelectTrigger id="assignment-priority"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent></Select></div><div className="grid gap-2 md:col-span-2"><Label htmlFor="assignment-description">Scope and notes</Label><Textarea id="assignment-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the expected technical deliverable" /></div><div className="flex justify-end gap-2 md:col-span-2"><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button type="submit">Save assignment</Button></div></form></CardContent></Card>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Engineering assignments" value={s.assignments || 0} icon={Wrench} /><Metric label="Active projects" value={s.activeProjects || 0} icon={GitPullRequest} tone="bg-sky-500/10 text-sky-600" /><Metric label="Pending submissions" value={s.pendingSubmissions || 0} icon={ClipboardCheck} tone="bg-amber-500/10 text-amber-600" /><Metric label="Open technical issues" value={s.openIssues || 0} icon={AlertCircle} tone="bg-rose-500/10 text-rose-600" /></section>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">Technical registers</h2><p className="text-sm text-muted-foreground">Live Supabase records, scoped to your company and project access.</p></div><div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search engineering registers" className="pl-9" placeholder="Search technical records" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div>
    <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })}><TabsList className="flex h-auto flex-wrap justify-start gap-1"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="assignments">Assignments</TabsTrigger><TabsTrigger value="requirements">Requirements</TabsTrigger><TabsTrigger value="drawings">Drawings</TabsTrigger><TabsTrigger value="submissions">Submissions</TabsTrigger><TabsTrigger value="reports">Reports</TabsTrigger><TabsTrigger value="issues">Issues</TabsTrigger><TabsTrigger value="changes">Design changes</TabsTrigger></TabsList>
      <TabsContent value="overview"><div className="grid gap-4 md:grid-cols-3"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarClock className="size-4 text-primary" />Review control</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{s.overdueReviews || 0}</p><p className="text-sm text-muted-foreground">overdue technical reviews require action.</p></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="size-4 text-primary" />Drawing control</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{s.drawingsAwaitingReview || 0}</p><p className="text-sm text-muted-foreground">drawing records are awaiting review.</p></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="size-4 text-primary" />Approved revisions</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{s.approvedRevisions || 0}</p><p className="text-sm text-muted-foreground">approved revisions remain preserved in history.</p></CardContent></Card></div></TabsContent>
      <TabsContent value="assignments"><Register rows={filtered(data.assignments)} empty="No engineering assignments yet." columns={[{ label: 'Reference', key: 'assignment_reference' }, { label: 'Title', key: 'title' }, { label: 'Discipline', key: 'discipline' }, { label: 'Target', key: 'target_completion_date' }, { label: 'Status', render: (row) => status(row.status) }]} /></TabsContent>
      <TabsContent value="requirements"><Register rows={filtered(data.requirements)} empty="No technical requirements yet." columns={[{ label: 'Reference', key: 'requirement_reference' }, { label: 'Title', key: 'title' }, { label: 'Discipline', key: 'discipline' }, { label: 'Required', key: 'required_date' }, { label: 'Status', render: (row) => status(row.status) }]} /></TabsContent>
      <TabsContent value="drawings"><Register rows={filtered(data.drawings)} empty="No drawings registered yet." columns={[{ label: 'Drawing no.', key: 'drawing_number' }, { label: 'Title', key: 'title' }, { label: 'Discipline', key: 'discipline' }, { label: 'Revision', key: 'current_revision' }, { label: 'Approval', render: (row) => status(row.approval_status) }]} /></TabsContent>
      <TabsContent value="submissions"><Register rows={filtered(data.submissions)} empty="No technical submissions yet." columns={[{ label: 'Reference', key: 'submission_reference' }, { label: 'Purpose', key: 'purpose' }, { label: 'Submitted', key: 'submitted_at' }, { label: 'Response due', key: 'required_response_date' }, { label: 'Status', render: (row) => status(row.status) }]} /></TabsContent>
      <TabsContent value="reports"><Register rows={filtered(data.reports)} empty="No technical reports yet." columns={[{ label: 'Reference', key: 'report_reference' }, { label: 'Title', key: 'title' }, { label: 'Type', key: 'report_type' }, { label: 'Revision', key: 'revision' }, { label: 'Review', render: (row) => status(row.review_status) }]} /></TabsContent>
      <TabsContent value="issues"><Register rows={filtered(data.issues)} empty="No technical issues yet." columns={[{ label: 'Reference', key: 'issue_reference' }, { label: 'Title', key: 'title' }, { label: 'Discipline', key: 'discipline' }, { label: 'Severity', key: 'severity' }, { label: 'Status', render: (row) => status(row.status) }]} /></TabsContent>
      <TabsContent value="changes"><Register rows={filtered(data.changes)} empty="No design changes yet." columns={[{ label: 'Reference', key: 'change_reference' }, { label: 'Description', key: 'description' }, { label: 'Impact', key: 'technical_impact' }, { label: 'Decision', key: 'approval_status' }, { label: 'Status', render: (row) => status(row.status) }]} /></TabsContent>
    </Tabs>
  </div></main>;
}
