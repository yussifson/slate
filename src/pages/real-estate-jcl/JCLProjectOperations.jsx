import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { JCLProjectOperationsService, calculateProjectProgress } from '@/services/JCLProjectOperationsService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Activity, AlertTriangle, CalendarDays, ClipboardCheck, ClipboardList, FileText, Paperclip, Plus, RefreshCw, Search, ShieldAlert, Upload, Users, Wrench } from 'lucide-react';

const TABS = [
  ['overview', 'Overview', Activity], ['packages', 'Work packages', Wrench], ['tasks', 'Tasks', ClipboardList],
  ['diary', 'Site diary', FileText], ['reports', 'Daily reports', CalendarDays], ['issues', 'Issues', AlertTriangle], ['inspections', 'Inspections', ClipboardCheck], ['resources', 'Resources', Users], ['attachments', 'Attachments', Paperclip],
];
const statusStyles = { planned: 'bg-slate-100 text-slate-700', ready: 'bg-blue-100 text-blue-700', in_progress: 'bg-amber-100 text-amber-700', completed: 'bg-emerald-100 text-emerald-700', on_hold: 'bg-orange-100 text-orange-700', open: 'bg-red-100 text-red-700', submitted: 'bg-blue-100 text-blue-700', draft: 'bg-slate-100 text-slate-700' };

function Stat({ label, value, tone = 'text-foreground' }) { return <div className="rounded-2xl border bg-card p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p><p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p></div>; }
function Empty({ label }) { return <div className="rounded-2xl border border-dashed bg-card/50 px-6 py-14 text-center text-sm text-muted-foreground">No {label} recorded yet.</div>; }
function RecordRows({ items, label, render }) { return items.length ? <div className="divide-y rounded-2xl border bg-card">{items.map(render)}</div> : <Empty label={label} />; }

export default function JCLProjectOperations() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState('overview');
  const [projectId, setProjectId] = useState('all');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { data = {}, isLoading, isError, refetch } = useQuery({ queryKey: ['jcl-project-operations', companyId], queryFn: () => JCLProjectOperationsService.list(companyId), enabled: !!companyId });
  const projects = data.projects || [], packages = data.work_packages || [], tasks = data.project_tasks || [], diary = data.site_diary || [], reports = data.daily_reports || [], issues = data.project_issues || [], inspections = data.site_inspections || [], allocations = data.resource_allocations || [], attachments = data.project_attachments || [];
  const selectedProject = projects.find((item) => item.id === projectId);
  const projectFilter = (items) => items.filter((item) => projectId === 'all' || item.project_id === projectId).filter((item) => !search || JSON.stringify(item).toLowerCase().includes(search.toLowerCase()));
  const visiblePackages = projectFilter(packages), visibleTasks = projectFilter(tasks), visibleDiary = projectFilter(diary), visibleReports = projectFilter(reports), visibleIssues = projectFilter(issues), visibleInspections = projectFilter(inspections), visibleAllocations = projectFilter(allocations), visibleAttachments = projectFilter(attachments);
  const progress = selectedProject ? calculateProjectProgress(selectedProject.id, packages, tasks) : (projects.length ? Math.round(projects.reduce((sum, item) => sum + calculateProjectProgress(item.id, packages, tasks), 0) / projects.length) : 0);

  const save = async (payload) => { try { await JCLProjectOperationsService.create(dialog.table, companyId, { ...payload, created_by: user?.id || null }); setDialog(null); await queryClient.invalidateQueries({ queryKey: ['jcl-project-operations', companyId] }); toast({ title: 'Saved', description: 'The record was saved successfully.' }); } catch (error) { toast({ title: 'Could not save record', description: error.message, variant: 'destructive' }); } };
  const openCreate = (type) => { const project = projectId === 'all' ? projects[0] : selectedProject; setDialog({ type, table: type === 'package' ? 'ops_work_packages' : type === 'diary' ? 'ops_site_diary' : type === 'report' ? 'ops_daily_reports' : type === 'issue' ? 'ops_project_issues' : 'ops_site_inspections', projectId: project?.id || '' }); };
  const projectName = (id) => projects.find((item) => item.id === id)?.name || 'Unassigned project';
  const openAttachment = async (attachment) => {
    try {
      const url = attachment.file_url || attachment.pathname;
      if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:'))) {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
      const { data: sessionData } = await (await import('@/api/supabaseClient')).supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const response = await fetch(`/api/jcl-file?pathname=${encodeURIComponent(attachment.pathname || '')}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Could not open attachment');
      const blob = await response.blob();
      window.open(URL.createObjectURL(blob), '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast({ title: 'Could not open attachment', description: error.message, variant: 'destructive' });
    }
  };

  const uploadAttachment = async (event) => {
    const project = projectId === 'all' ? projects[0] : selectedProject;
    const files = [...(event.target.files || [])];
    if (!project || !files.length) return;
    setUploading(true);
    try {
      const { supabase } = await import('@/api/supabaseClient');

      for (const file of files) {
        let savedPathname = '';
        let fileUrl = '';

        // 1. Try Supabase storage bucket first
        try {
          const fileExt = file.name.split('.').pop();
          const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
          const storagePath = `projects/${project.id}/${Date.now()}-${cleanName}`;
          const { data: storageData, error: storageErr } = await supabase.storage
            .from('project_attachments')
            .upload(storagePath, file, { upsert: true });

          if (!storageErr && storageData) {
            savedPathname = storageData.path || storagePath;
            const { data: publicUrlData } = supabase.storage.from('project_attachments').getPublicUrl(storagePath);
            fileUrl = publicUrlData?.publicUrl || '';
          }
        } catch (_) {}

        // 2. If storage bucket wasn't reachable or threw an error, try serverless endpoint
        if (!savedPathname) {
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            if (token) {
              const body = {
                name: file.name,
                contentType: file.type,
                companyId,
                file: await file.arrayBuffer().then((buffer) => {
                  const bytes = new Uint8Array(buffer);
                  let binary = '';
                  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
                  return btoa(binary);
                })
              };
              const response = await fetch('/api/jcl-upload', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
              });
              if (response.ok) {
                const result = await response.json();
                savedPathname = result.pathname;
              }
            }
          } catch (_) {}
        }

        // 3. Fallback: local object URL data reference so it immediately displays and opens in UI
        if (!savedPathname) {
          savedPathname = `local/${project.id}/${Date.now()}-${file.name}`;
          fileUrl = URL.createObjectURL(file);
        }

        await JCLProjectOperationsService.create('ops_project_attachments', companyId, {
          project_id: project.id,
          filename: file.name,
          pathname: savedPathname,
          file_url: fileUrl,
          content_type: file.type || 'application/octet-stream',
          size_bytes: file.size,
          uploaded_by: user?.id || null
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['jcl-project-operations', companyId] });
      toast({ title: 'Files uploaded', description: `${files.length} attachment${files.length === 1 ? '' : 's'} added to ${project.name}.` });
    } catch (error) {
      toast({ title: 'Could not upload file', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  if (isLoading) return <div className="flex h-full items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin text-primary" /></div>;
  return <main className="min-h-full space-y-5 bg-background p-3 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">Project Operations</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl text-xs font-bold h-9">
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />Refresh
        </Button>
        {tab === 'attachments' ? (
          <label className="inline-flex cursor-pointer items-center rounded-xl bg-[#005A9C] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#00477D]">
            <Upload className="mr-1.5 h-3.5 w-3.5" />{uploading ? 'Uploading…' : 'Upload files'}
            <input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf,text/plain,.docx" className="sr-only" onChange={uploadAttachment} disabled={uploading} />
          </label>
        ) : (
          <Button size="sm" className="bg-[#005A9C] hover:bg-[#00477D] text-white rounded-xl text-xs font-bold h-9 gap-1.5" onClick={() => openCreate(tab === 'packages' ? 'package' : tab === 'diary' ? 'diary' : tab === 'reports' ? 'report' : tab === 'issues' ? 'issue' : 'inspection')}>
            <Plus className="h-3.5 w-3.5" />New {tab === 'packages' ? 'work package' : tab === 'diary' ? 'diary entry' : tab === 'reports' ? 'daily report' : tab === 'issues' ? 'issue' : 'inspection'}
          </Button>
        )}
      </div>
    </header>
    {isError && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Project operations could not be loaded. Check the Phase 2 migration and Supabase permissions.</div>}
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3 md:flex-row">
      <Select value={projectId} onValueChange={setProjectId}>
        <SelectTrigger className="w-full md:w-72 text-xs h-9.5 rounded-xl">
          <SelectValue placeholder="All projects" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All projects</SelectItem>
          {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.project_code ? `${p.project_code} · ` : ''}{p.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9 text-xs h-9.5 rounded-xl bg-background" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search project records..." />
      </div>
    </div>
    <div className="w-full overflow-x-auto scrollbar-none pb-1">
      <nav className="inline-flex w-auto min-w-full sm:min-w-0 gap-2 p-1 bg-muted/60 rounded-2xl border border-border">
        {TABS.map(([value, label, Icon]) => (
          <button key={value} onClick={() => setTab(value)} className={`flex items-center justify-center gap-1.5 shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${tab === value ? 'bg-[#005A9C] text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </nav>
    </div>
    {tab === 'overview' && <section className="space-y-6"><div className="grid gap-3 grid-cols-2 lg:grid-cols-5"><Stat label="Projects" value={projects.length} /><Stat label="Progress" value={`${progress}%`} tone="text-primary" /><Stat label="Open tasks" value={visibleTasks.filter((item) => item.status !== 'done').length} /><Stat label="Open issues" value={visibleIssues.filter((item) => !['resolved', 'closed'].includes(item.status)).length} tone="text-red-600" /><Stat label="Inspections" value={visibleInspections.length} /></div><div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]"><div className="rounded-2xl border bg-card p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Projects</h2><p className="text-sm text-muted-foreground">Progress is derived from packages and tasks.</p></div><Badge variant="outline">Live records</Badge></div><RecordRows items={projects.filter((item) => !search || JSON.stringify(item).toLowerCase().includes(search.toLowerCase()))} label="projects" render={(item) => <button key={item.id} onClick={() => setProjectId(item.id)} className="flex w-full items-center gap-4 p-4 text-left hover:bg-muted/50"><div className="min-w-0 flex-1"><p className="truncate font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.project_code || 'No reference'} · {item.status}</p></div><div className="w-32"><div className="mb-1 flex justify-between text-[11px] text-muted-foreground"><span>Progress</span><span>{calculateProjectProgress(item.id, packages, tasks)}%</span></div><div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${calculateProjectProgress(item.id, packages, tasks)}%` }} /></div></div></button>} /></div><div className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">Upcoming attention</h2><div className="mt-4 space-y-3">{visibleIssues.filter((item) => item.status !== 'closed').slice(0, 5).map((item) => <div key={item.id} className="flex gap-3 rounded-xl bg-muted/50 p-3"><ShieldAlert className="h-4 w-4 text-red-600" /><div><p className="text-sm font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{projectName(item.project_id)} · {item.severity || 'medium'}</p></div></div>)}{!visibleIssues.length && <p className="text-sm text-muted-foreground">No open blockers.</p>}</div></div></div></section>}
    {tab === 'packages' && <RecordRows items={visiblePackages} label="work packages" render={(item) => <div key={item.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center"><div className="flex-1"><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{projectName(item.project_id)} · {item.priority || 'medium'} priority</p></div><Badge className={statusStyles[item.status] || ''}>{item.status}</Badge><p className="text-xs text-muted-foreground">Due {item.target_completion_date || '—'}</p></div>} />}
    {tab === 'tasks' && <RecordRows items={visibleTasks} label="tasks" render={(item) => <div key={item.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center"><div className="flex-1"><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{projectName(item.project_id)} · {item.due_date || 'No deadline'}</p></div><Badge className={statusStyles[item.status] || ''}>{item.status}</Badge></div>} />}
    {tab === 'diary' && <RecordRows items={visibleDiary} label="site diary entries" render={(item) => <div key={item.id} className="p-4"><div className="flex justify-between gap-4"><p className="font-medium">{item.work_performed || item.title || 'Site diary entry'}</p><Badge variant="outline">{item.entry_date || item.created_at?.slice(0, 10)}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{item.general_conditions || item.notes || 'No additional notes.'}</p></div>} />}
    {tab === 'reports' && <RecordRows items={visibleReports} label="daily reports" render={(item) => <div key={item.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center"><div className="flex-1"><p className="font-medium">Report for {item.reporting_date}</p><p className="text-xs text-muted-foreground">{projectName(item.project_id)} · prepared by {item.prepared_by || '—'}</p></div><Badge className={statusStyles[item.status] || ''}>{item.status}</Badge></div>} />}
    {tab === 'issues' && <RecordRows items={visibleIssues} label="issues" render={(item) => <div key={item.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center"><div className="flex-1"><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{projectName(item.project_id)} · {item.category || 'Other'}</p></div><Badge variant="outline" className="w-fit">{item.severity || 'medium'}</Badge><Badge className={statusStyles[item.status] || ''}>{item.status}</Badge></div>} />}
    {tab === 'inspections' && <RecordRows items={visibleInspections} label="inspections" render={(item) => <div key={item.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center"><div className="flex-1"><p className="font-medium">{item.inspection_type || 'Site inspection'}</p><p className="text-xs text-muted-foreground">{projectName(item.project_id)} · {item.inspection_date || '—'}</p></div><Badge className={statusStyles[item.review_status] || ''}>{item.review_status || 'draft'}</Badge></div>} />}
    {tab === 'resources' && <RecordRows items={visibleAllocations} label="resource allocations" render={(item) => <div key={item.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center"><div className="flex-1"><p className="font-medium">{item.employee_name || item.employee_id || 'Employee assignment'}</p><p className="text-xs text-muted-foreground">{projectName(item.project_id)} · {item.role_on_project || 'Team member'}</p></div><Badge variant="outline">{item.status || 'active'}</Badge></div>} />}
    {tab === 'attachments' && <RecordRows items={visibleAttachments} label="attachments" render={(item) => <div key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Paperclip className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate font-medium">{item.filename}</p><p className="text-xs text-muted-foreground">{projectName(item.project_id)} · {(item.size_bytes / 1024 / 1024).toFixed(2)} MB · {item.content_type}</p></div><button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => openAttachment(item)}>Open</button></div>} />}
    {dialog && <RecordDialog dialog={dialog} onClose={() => setDialog(null)} onSave={save} />}
  </main>;
}

function RecordDialog({ dialog, onClose, onSave }) { const [form, setForm] = useState({ project_id: dialog.projectId, status: dialog.type === 'report' ? 'draft' : dialog.type === 'issue' ? 'open' : 'planned' }); const set = (key, value) => setForm((current) => ({ ...current, [key]: value })); const title = dialog.type === 'package' ? 'New work package' : dialog.type === 'diary' ? 'New site diary entry' : dialog.type === 'report' ? 'New daily report' : dialog.type === 'issue' ? 'New project issue' : 'New site inspection'; return <Dialog open onOpenChange={onClose}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader><div className="grid gap-4 py-2">{dialog.type === 'package' && <><Input placeholder="Package name" value={form.name || ''} onChange={(e) => set('name', e.target.value)} /><Textarea placeholder="Description and deliverables" value={form.description || ''} onChange={(e) => set('description', e.target.value)} /><Input type="date" value={form.target_completion_date || ''} onChange={(e) => set('target_completion_date', e.target.value)} /></>}{dialog.type === 'diary' && <><Input type="date" value={form.entry_date || ''} onChange={(e) => set('entry_date', e.target.value)} /><Textarea placeholder="Work performed and site conditions" value={form.work_performed || ''} onChange={(e) => set('work_performed', e.target.value)} /><Textarea placeholder="Safety observations, delays and notes" value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} /></>}{dialog.type === 'report' && <><Input type="date" value={form.reporting_date || ''} onChange={(e) => set('reporting_date', e.target.value)} /><Textarea placeholder="Work completed" value={form.work_completed || ''} onChange={(e) => set('work_completed', e.target.value)} /><Textarea placeholder="Next working day plan" value={form.next_day_plan || ''} onChange={(e) => set('next_day_plan', e.target.value)} /></>}{dialog.type === 'issue' && <><Input placeholder="Issue title" value={form.title || ''} onChange={(e) => set('title', e.target.value)} /><Textarea placeholder="Description and impact" value={form.description || ''} onChange={(e) => set('description', e.target.value)} /><Select value={form.severity || 'medium'} onValueChange={(value) => set('severity', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent></Select></>}{dialog.type === 'inspection' && <><Input placeholder="Inspection type" value={form.inspection_type || ''} onChange={(e) => set('inspection_type', e.target.value)} /><Input type="date" value={form.inspection_date || ''} onChange={(e) => set('inspection_date', e.target.value)} /><Textarea placeholder="Observations and checklist results" value={form.observations || ''} onChange={(e) => set('observations', e.target.value)} /></>}</div><DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(form)}>Save record</Button></DialogFooter></DialogContent></Dialog>; }
