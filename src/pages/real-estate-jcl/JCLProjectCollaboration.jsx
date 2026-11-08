import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, AlertTriangle, ArrowUpRight, CheckCircle2, FileText, Filter, Flag, MessageCircle, Paperclip, Plus, Search, Send, ShieldAlert, SlidersHorizontal, Users } from 'lucide-react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { JCLProjectOperationsService } from '@/services/JCLProjectOperationsService';
import { JCLProjectCollaborationService } from '@/services/JCLProjectCollaborationService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const tabs = [
  ['overview', 'Overview', Activity], ['tasks', 'Tasks', CheckCircle2], ['diary', 'Diary', FileText], ['documents', 'Documents', Paperclip],
  ['messages', 'Messages', MessageCircle], ['risks', 'Risks', AlertTriangle], ['resources', 'Resources', Users], ['activity', 'Activity', Flag],
];
const badge = { open: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', high: 'bg-red-100 text-red-700', low: 'bg-slate-100 text-slate-700', resolved: 'bg-emerald-100 text-emerald-700', completed: 'bg-emerald-100 text-emerald-700', in_progress: 'bg-amber-100 text-amber-700' };

function EmptyState({ title, copy, action }) {
  return <div className="rounded-2xl border border-dashed bg-card px-6 py-12 text-center"><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{copy}</p>{action}</div>;
}

export default function JCLProjectCollaboration() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [projectId, setProjectId] = useState('all');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState(null);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');

  const projectsQuery = useQuery({ queryKey: ['jcl-projects', companyId], queryFn: () => JCLProjectOperationsService.list(companyId), enabled: Boolean(companyId) });
  const collaborationQuery = useQuery({ queryKey: ['jcl-collaboration', companyId, projectId], queryFn: () => JCLProjectCollaborationService.load(companyId, projectId), enabled: Boolean(companyId) });
  const projects = projectsQuery.data?.projects || [];
  const selectedProject = projects.find((item) => item.id === projectId);
  const collab = collaborationQuery.data || {};
  const tasks = (projectsQuery.data?.project_tasks || []).filter((item) => projectId === 'all' || item.project_id === projectId);
  const diary = (projectsQuery.data?.site_diary || []).filter((item) => projectId === 'all' || item.project_id === projectId);
  const attachments = (projectsQuery.data?.project_attachments || []).filter((item) => projectId === 'all' || item.project_id === projectId);
  const queryText = search.toLowerCase();
  const visible = (items = []) => items.filter((item) => !queryText || JSON.stringify(item).toLowerCase().includes(queryText));
  const risks = visible(collab.risks).filter((item) => filter === 'all' || item.status === filter);
  const messages = visible(collab.messages);

  const refresh = () => { queryClient.invalidateQueries({ queryKey: ['jcl-collaboration', companyId] }); queryClient.invalidateQueries({ queryKey: ['jcl-projects', companyId] }); };
  const saveDialog = async (payload) => {
    try {
      const table = dialog.type === 'risk' ? 'ops_project_risks' : 'ops_project_milestones';
      await JCLProjectCollaborationService.create(table, companyId, { ...payload, project_id: dialog.projectId, created_by: user?.id || null });
      setDialog(null); refresh(); toast({ title: 'Saved', description: 'The collaboration record is now available to the team.' });
    } catch (error) { toast({ title: 'Could not save', description: error.message, variant: 'destructive' }); }
  };
  const sendMessage = async () => {
    if (!message.trim()) return;
    const target = projectId === 'all' ? projects[0]?.id : projectId;
    if (!target) return toast({ title: 'Choose a project first', variant: 'destructive' });
    try {
      await JCLProjectCollaborationService.create('ops_project_messages', companyId, { project_id: target, body: message.trim(), author_id: user?.id || null, message_type: 'message' });
      setMessage(''); refresh();
    } catch (error) { toast({ title: 'Could not send message', description: error.message, variant: 'destructive' }); }
  };
  const projectName = (id) => projects.find((item) => item.id === id)?.name || 'Unassigned project';

  if (projectsQuery.isLoading) return <div className="flex min-h-full items-center justify-center text-sm text-muted-foreground">Loading project workspace…</div>;

  return <main className="w-full max-w-full overflow-x-hidden min-h-screen bg-background p-3.5 sm:p-6 lg:p-8 pb-24 sm:pb-12 font-sans">
    <header className="mx-auto max-w-[1600px] space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">Project Workspace</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={refresh} className="rounded-xl text-xs font-bold h-9">
            <Activity className="mr-1.5 h-3.5 w-3.5" />Refresh
          </Button>
          {['risks', 'milestones'].includes(tab) && (
            <Button size="sm" className="bg-[#005A9C] text-white rounded-xl text-xs font-bold h-9 gap-1.5" onClick={() => setDialog({ type: tab === 'risks' ? 'risk' : 'milestone', projectId: projectId === 'all' ? projects[0]?.id : projectId })}>
              <Plus className="h-3.5 w-3.5" />New {tab === 'risks' ? 'risk' : 'milestone'}
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3 lg:flex-row">
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="w-full lg:w-80 text-xs h-9.5 rounded-xl">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.project_code ? `${project.project_code} · ` : ''}{project.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9 text-xs h-9.5 rounded-xl bg-background" placeholder="Search tasks, documents, messages or risks" />
        </div>
        <Button variant="outline" size="sm" className="h-9.5 text-xs rounded-xl" onClick={() => setFilter(filter === 'all' ? 'open' : 'all')}>
          <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />{filter === 'all' ? 'All statuses' : 'Open only'}
        </Button>
      </div>

      <div className="w-full overflow-x-auto scrollbar-none pb-1">
        <nav className="inline-flex w-auto min-w-full sm:min-w-0 gap-2 p-1 bg-muted/60 rounded-2xl border border-border">
          {tabs.map(([value, label, Icon]) => (
            <button key={value} onClick={() => setTab(value)} className={`flex items-center justify-center gap-1.5 shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${tab === value ? 'bg-[#005A9C] text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'overview' && <Overview projects={projects} tasks={tasks} risks={collab.risks || []} messages={messages} projectName={projectName} setTab={setTab} />}
      {tab === 'tasks' && <ListPanel title="Tasks" items={tasks} empty="No tasks match this view." render={(item) => <div key={item.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center"><div className="flex-1"><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{projectName(item.project_id)} · {item.assigned_to || 'Unassigned'} · {item.due_date || 'No deadline'}</p></div><Badge className={badge[item.status] || ''}>{item.status || 'planned'}</Badge></div>} />}
      {tab === 'diary' && <ListPanel title="Site diary" items={visible(diary)} empty="No diary entries match this view." render={(item) => <div key={item.id} className="p-4"><div className="flex justify-between gap-4"><p className="font-medium">{item.work_performed || item.title || 'Site update'}</p><Badge variant="outline">{item.entry_date || item.created_at?.slice(0, 10)}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{item.notes || item.general_conditions || 'No additional notes.'}</p></div>} />}
      {tab === 'documents' && <ListPanel title="Project documents" items={visible(attachments)} empty="No documents or photos uploaded for this project." render={(item) => <div key={item.id} className="flex items-center gap-3 p-4"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Paperclip className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate font-medium">{item.filename}</p><p className="text-xs text-muted-foreground">{projectName(item.project_id)} · {item.content_type || 'Document'}</p></div><Badge variant="outline">{item.created_at?.slice(0, 10) || 'Uploaded'}</Badge></div>} />}
      {tab === 'messages' && <section className="grid gap-5 lg:grid-cols-[1fr_320px]"><div className="rounded-2xl border bg-card"><div className="border-b p-5"><h2 className="font-semibold">Team messages</h2><p className="text-sm text-muted-foreground">Decisions, questions and updates stay attached to the project.</p></div><div className="max-h-[520px] divide-y overflow-auto">{messages.length ? messages.map((item) => <div key={item.id} className="p-5"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">{item.author_name || item.author_id || 'Team member'}</p><span className="text-xs text-muted-foreground">{item.created_at?.slice(0, 16).replace('T', ' ')}</span></div><p className="mt-2 whitespace-pre-wrap text-sm">{item.body}</p><p className="mt-2 text-xs text-muted-foreground">{projectName(item.project_id)}</p></div>) : <EmptyState title="No messages yet" copy="Start the project conversation with a decision or update." />}</div><div className="border-t p-4"><div className="flex gap-2"><Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write an update or decision…" className="min-h-20" /><Button size="icon" className="shrink-0" onClick={sendMessage} aria-label="Send message"><Send className="h-4 w-4" /></Button></div><p className="mt-2 text-xs text-muted-foreground">Use @mentions in the message body after the Phase 7 migration is applied.</p></div></div><div className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">Project members</h2><div className="mt-4 space-y-3">{(collab.members || []).map((member) => <div key={member.id} className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">{(member.display_name || member.user_id || 'U').slice(0, 2).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-medium">{member.display_name || member.user_id}</p><p className="text-xs text-muted-foreground">{member.role || 'Member'}</p></div></div>)}{!collab.members?.length && <p className="text-sm text-muted-foreground">No members assigned yet.</p>}</div></div></section>}
      {tab === 'risks' && <ListPanel title="Risk register" items={risks} empty="No risks match this view." render={(item) => <div key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start"><div className="mt-0.5 rounded-lg bg-red-100 p-2 text-red-700"><ShieldAlert className="h-4 w-4" /></div><div className="flex-1"><p className="font-medium">{item.title}</p><p className="text-sm text-muted-foreground">{item.mitigation || item.description || 'No mitigation recorded.'}</p><p className="mt-2 text-xs text-muted-foreground">{projectName(item.project_id)} · owner: {item.owner_name || 'Unassigned'}</p></div><Badge className={badge[item.severity] || ''}>{item.severity || 'medium'}</Badge></div>} />}
      {tab === 'resources' && <ListPanel title="Resource allocations" items={projectsQuery.data?.resource_allocations || []} empty="No resource allocations recorded." render={(item) => <div key={item.id} className="flex items-center gap-4 p-4"><Users className="h-4 w-4 text-primary" /><div className="flex-1"><p className="font-medium">{item.employee_name || item.employee_id || 'Employee'}</p><p className="text-xs text-muted-foreground">{projectName(item.project_id)} · {item.role_on_project || 'Team member'}</p></div><Badge variant="outline">{item.status || 'active'}</Badge></div>} />}
      {tab === 'activity' && <ListPanel title="Activity timeline" items={collab.activity || []} empty="No activity has been recorded yet." render={(item) => <div key={item.id} className="flex gap-4 p-4"><div className="mt-1 h-2 w-2 rounded-full bg-primary" /><div><p className="text-sm"><span className="font-medium">{item.actor_name || item.actor_id || 'Team member'}</span> {item.description || item.action || 'updated the project'}</p><p className="mt-1 text-xs text-muted-foreground">{item.created_at?.slice(0, 16).replace('T', ' ')}</p></div></div>} />}
    </header>
    {dialog && <CollaborationDialog dialog={dialog} onClose={() => setDialog(null)} onSave={saveDialog} />}
  </main>;
}

function Overview({ projects, tasks, risks, messages, projectName, setTab }) {
  const openRisks = risks.filter((item) => !['resolved', 'closed'].includes(item.status)).length;
  return <section className="space-y-5"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Projects" value={projects.length} /><Metric label="Open tasks" value={tasks.filter((item) => item.status !== 'done').length} /><Metric label="Open risks" value={openRisks} tone={openRisks ? 'text-red-600' : 'text-emerald-600'} /><Metric label="Messages" value={messages.length} /></div><div className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]"><div className="rounded-2xl border bg-card p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Active project portfolio</h2><p className="text-sm text-muted-foreground">Start with the work that needs attention.</p></div><Button variant="ghost" size="sm" onClick={() => setTab('tasks')}>View tasks <ArrowUpRight className="ml-1 h-4 w-4" /></Button></div><div className="mt-4 divide-y">{projects.slice(0, 8).map((project) => <div key={project.id} className="flex items-center gap-4 py-4"><div className="h-10 w-10 rounded-xl bg-primary/10" /><div className="min-w-0 flex-1"><p className="truncate font-medium">{project.name}</p><p className="text-xs text-muted-foreground">{project.project_code || 'No reference'} · {project.status || 'active'}</p></div><Badge variant="outline">{projectName(project.id)}</Badge></div>)}{!projects.length && <EmptyState title="No projects yet" copy="Create a project before assigning site work." />}</div></div><div className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">Working principles</h2><div className="mt-4 space-y-3 text-sm text-muted-foreground"><p>Keep decisions inside the project workspace.</p><p>Assign one accountable owner to each risk.</p><p>Use the activity timeline for audit-ready context.</p></div></div></div></section>;
}
function Metric({ label, value, tone = 'text-foreground' }) { return <div className="rounded-2xl border bg-card p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p><p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p></div>; }
function ListPanel({ title, items, empty, render }) { return <section className="rounded-2xl border bg-card"><div className="border-b p-5"><h2 className="font-semibold">{title}</h2><p className="text-sm text-muted-foreground">{items.length} record{items.length === 1 ? '' : 's'}</p></div>{items.length ? <div className="divide-y">{items.map(render)}</div> : <div className="p-5"><EmptyState title={empty} copy="Use the relevant action to add the first record." /></div>}</section>; }
function CollaborationDialog({ dialog, onClose, onSave }) { const [form, setForm] = useState({ status: dialog.type === 'risk' ? 'open' : 'planned', severity: 'medium' }); const set = (key, value) => setForm((current) => ({ ...current, [key]: value })); const risk = dialog.type === 'risk'; return <Dialog open onOpenChange={onClose}><DialogContent><DialogHeader><DialogTitle>New {risk ? 'risk' : 'milestone'}</DialogTitle></DialogHeader><div className="grid gap-4 py-2"><Input placeholder={risk ? 'Risk title' : 'Milestone name'} value={form.title || ''} onChange={(event) => set('title', event.target.value)} /><Textarea placeholder={risk ? 'Description and mitigation' : 'Milestone outcome'} value={form.description || ''} onChange={(event) => set('description', event.target.value)} />{risk && <Input placeholder="Owner name" value={form.owner_name || ''} onChange={(event) => set('owner_name', event.target.value)} />}<Select value={risk ? form.severity : form.status} onValueChange={(value) => set(risk ? 'severity' : 'status', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(risk ? ['low', 'medium', 'high'] : ['planned', 'in_progress', 'completed']).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div><DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(form)}>Save</Button></DialogFooter></DialogContent></Dialog>; }
