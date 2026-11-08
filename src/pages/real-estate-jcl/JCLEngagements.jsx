import React, { useEffect, useMemo, useState } from 'react';
import { 
  BriefcaseBusiness, 
  CheckCircle2, 
  ChevronRight, 
  ClipboardList, 
  FolderKanban, 
  Loader2, 
  MapPin, 
  Plus, 
  Search, 
  Sparkles, 
  X, 
  Clock, 
  Calendar, 
  Save, 
  Percent,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
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

const EMPTY = { 
  client_party_id: '', 
  title: '', 
  description: '', 
  engagement_type: 'new_construction', 
  priority: 'medium', 
  site_address: '', 
  budget_min: '', 
  budget_max: '', 
  expected_start_date: '', 
  expected_completion_date: '', 
  objectives: '', 
  requested_scope: '', 
  constraints: '', 
  desired_timeline: '' 
};

export default function JCLEngagements() {
  const companyId = useCompanyId();
  // Sub-tabs: 'ongoing' (in progress / planned), 'engagements' (draft/assessment), 'delivered' (completed / converted)
  const [tab, setTab] = useState('ongoing');
  const [engagements, setEngagements] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Selected detail modal
  const [selectedEngagement, setSelectedEngagement] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectEditState, setProjectEditState] = useState({
    status: '',
    progress_percentage: 0,
    target_end_date: '',
    notes: '',
  });

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
      setEngagements(nextEngagements || []);
      setProjects(nextProjects || []);
      setClients(nextClients || []);
    } catch (error) {
      console.error('[v0] JCL Phase 1 load failed:', error);
      toast.error('Unable to load JCL engagements');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [companyId]);

  const typeLabel = (value) => TYPES.find(([key]) => key === value)?.[1] || value;
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  // Ongoing projects: planned, in_progress, on_hold, active
  const ongoingProjects = useMemo(() => {
    return projects.filter((p) => {
      const s = (p.status || '').toLowerCase();
      return !['completed', 'delivered', 'cancelled', 'archived'].includes(s);
    }).filter((p) => `${p.name || ''} ${p.project_code || ''} ${p.client?.primary_name || ''}`.toLowerCase().includes(search.toLowerCase()));
  }, [projects, search]);

  // Delivered projects: delivered, completed
  const deliveredProjects = useMemo(() => {
    return projects.filter((p) => {
      const s = (p.status || '').toLowerCase();
      return ['completed', 'delivered'].includes(s);
    }).filter((p) => `${p.name || ''} ${p.project_code || ''} ${p.client?.primary_name || ''}`.toLowerCase().includes(search.toLowerCase()));
  }, [projects, search]);

  // Draft engagements: not converted, draft, requirements_gathering, assessment, under_review, approved
  const draftEngagements = useMemo(() => {
    return engagements.filter((e) => {
      const s = (e.status || '').toLowerCase();
      return !['converted_to_project', 'delivered', 'completed', 'lost', 'cancelled'].includes(s);
    }).filter((e) => `${e.title || ''} ${e.engagement_number || ''} ${e.client?.primary_name || ''}`.toLowerCase().includes(search.toLowerCase()));
  }, [engagements, search]);

  const openProjectModal = (project) => {
    setSelectedProject(project);
    setProjectEditState({
      status: project.status || 'in_progress',
      progress_percentage: project.progress_percentage || 0,
      target_end_date: project.target_end_date || '',
      notes: '',
    });
  };

  const handleSaveProject = async () => {
    if (!selectedProject) return;
    setSaving(true);
    try {
      await JCLPhase1Service.updateProject(companyId, selectedProject.id, {
        status: projectEditState.status,
        progress_percentage: Number(projectEditState.progress_percentage),
        target_end_date: projectEditState.target_end_date,
        internal_notes: projectEditState.notes,
      });

      // Optimistically update local project list
      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProject.id
            ? { ...p, status: projectEditState.status, progress_percentage: Number(projectEditState.progress_percentage), target_end_date: projectEditState.target_end_date }
            : p
        )
      );

      toast.success('Project status and progress updated successfully');
      setSelectedProject(null);
    } catch (err) {
      console.error('Failed to update project:', err);
      toast.error('Failed to save project updates');
    } finally {
      setSaving(false);
    }
  };

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
      setShowForm(false); 
      setForm(EMPTY); 
      await load(); 
      setSelectedEngagement(engagement);
    } catch (error) {
      console.error('[v0] JCL engagement create failed:', error);
      toast.error(error.message || 'Unable to create engagement');
    } finally { setSaving(false); }
  };

  const convert = async () => {
    if (!selectedEngagement) return;
    setSaving(true);
    try {
      await JCLPhase1Service.convertToProject(companyId, null, selectedEngagement);
      toast.success('Engagement converted to project');
      setSelectedEngagement(null); 
      await load(); 
      setTab('ongoing');
    } catch (error) {
      console.error('[v0] JCL project conversion failed:', error);
      toast.error(error.message || 'Unable to create project');
    } finally { setSaving(false); }
  };

  return (
    <div className="h-full overflow-auto bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-4 w-4" /> JCL Project Hub
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Projects & Engagements</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Oversee ongoing construction projects, manage draft client briefs, and review delivered contracts.
            </p>
          </div>
          <button 
            onClick={() => setShowForm(true)} 
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-opacity"
          >
            <Plus className="h-4 w-4" /> New engagement
          </button>
        </header>

        {/* Stats counter cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div 
            onClick={() => setTab('ongoing')}
            className={`cursor-pointer rounded-2xl border p-4 transition-all ${tab === 'ongoing' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card hover:border-border/80'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Ongoing Projects</span>
              <FolderKanban className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-black">{ongoingProjects.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Active site execution</p>
          </div>

          <div 
            onClick={() => setTab('engagements')}
            className={`cursor-pointer rounded-2xl border p-4 transition-all ${tab === 'engagements' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card hover:border-border/80'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Draft Engagements</span>
              <BriefcaseBusiness className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-black">{draftEngagements.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Briefing & under assessment</p>
          </div>

          <div 
            onClick={() => setTab('delivered')}
            className={`cursor-pointer rounded-2xl border p-4 transition-all ${tab === 'delivered' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card hover:border-border/80'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Delivered Projects</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-black">{deliveredProjects.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Completed handovers</p>
          </div>
        </div>

        {/* Navigation tabs & Search bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
          <button 
            onClick={() => setTab('ongoing')} 
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-all ${tab === 'ongoing' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
          >
            Ongoing Projects ({ongoingProjects.length})
          </button>
          <button 
            onClick={() => setTab('engagements')} 
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-all ${tab === 'engagements' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
          >
            Draft Engagements ({draftEngagements.length})
          </button>
          <button 
            onClick={() => setTab('delivered')} 
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-all ${tab === 'delivered' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
          >
            Delivered Projects ({deliveredProjects.length})
          </button>
          
          <div className="relative ml-auto min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input 
              value={search} 
              onChange={(event) => setSearch(event.target.value)} 
              placeholder="Search by code, title, or client..." 
              className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" 
            />
          </div>
        </div>

        {/* Content table */}
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
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {draftEngagements.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedEngagement(item)}
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
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          {item.status?.replaceAll('_', ' ') || 'Draft'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedEngagement(item); }}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                          Details <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {draftEngagements.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                        No draft engagements found. Click "New engagement" above to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Ongoing & Delivered Projects Table */
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3.5 px-4">Project Code</th>
                    <th className="py-3.5 px-4">Project Name</th>
                    <th className="py-3.5 px-4">Client</th>
                    <th className="py-3.5 px-4">Budget</th>
                    <th className="py-3.5 px-4">Progress %</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {(tab === 'ongoing' ? ongoingProjects : deliveredProjects).map((item) => (
                    <tr 
                      key={item.id} 
                      onClick={() => openProjectModal(item)}
                      className="group hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-primary">
                        {item.project_code}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {item.client?.primary_name || <span className="italic text-muted-foreground/60">Delivery Project</span>}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-foreground">
                        {item.budget_amount ? `$${Number(item.budget_amount).toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 min-w-[170px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                (item.progress_percentage || 0) >= 100 
                                  ? 'bg-emerald-500' 
                                  : (item.progress_percentage || 0) > 50 
                                    ? 'bg-primary' 
                                    : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, item.progress_percentage || 0)}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-bold text-foreground w-10 text-right">
                            {item.progress_percentage || 0}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          ['completed', 'delivered'].includes(item.status) 
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : item.status === 'in_progress'
                              ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                              : 'bg-muted text-muted-foreground border border-border'
                        }`}>
                          {item.status?.replaceAll('_', ' ') || 'Active'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); openProjectModal(item); }}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                          Update Status <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(tab === 'ongoing' ? ongoingProjects : deliveredProjects).length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                        {tab === 'ongoing' ? 'No ongoing projects at the moment.' : 'No delivered projects found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RESPONSIVE POPUP MODAL: Project Status & Progress Percentage Editor */}
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div 
              className="relative w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-primary">
                    <span>{selectedProject.project_code}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="capitalize text-muted-foreground">{selectedProject.project_type || 'Construction'}</span>
                  </div>
                  <h2 className="text-xl font-black text-foreground mt-1">{selectedProject.name}</h2>
                </div>
                <button 
                  onClick={() => setSelectedProject(null)} 
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 space-y-5 text-sm">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-muted/40 rounded-xl">
                    <span className="text-muted-foreground block font-medium">Client</span>
                    <span className="font-semibold text-foreground text-sm mt-0.5 block truncate">
                      {selectedProject.client?.primary_name || 'Direct Project'}
                    </span>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-xl">
                    <span className="text-muted-foreground block font-medium">Budget</span>
                    <span className="font-semibold text-foreground text-sm mt-0.5 block">
                      {selectedProject.budget_amount ? `$${Number(selectedProject.budget_amount).toLocaleString()}` : '—'}
                    </span>
                  </div>
                </div>

                {/* Status Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Project Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'planned', label: 'Planned' },
                      { key: 'in_progress', label: 'In Progress' },
                      { key: 'on_hold', label: 'On Hold' },
                      { key: 'delivered', label: 'Delivered' },
                      { key: 'completed', label: 'Completed' },
                      { key: 'cancelled', label: 'Cancelled' },
                    ].map((st) => (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() => {
                          const isDelivered = ['delivered', 'completed'].includes(st.key);
                          setProjectEditState((prev) => ({
                            ...prev,
                            status: st.key,
                            progress_percentage: isDelivered ? 100 : prev.progress_percentage,
                          }));
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                          projectEditState.status === st.key
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'border-border bg-card text-foreground hover:bg-muted'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress Percentage Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Execution Progress
                    </label>
                    <div className="flex items-center gap-1 font-mono text-base font-black text-primary">
                      <span>{projectEditState.progress_percentage}%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={projectEditState.progress_percentage}
                    onChange={(e) => setProjectEditState((prev) => ({ ...prev, progress_percentage: Number(e.target.value) }))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                    <span>0% (Kickoff)</span>
                    <span>50% (Milestone)</span>
                    <span>100% (Delivered)</span>
                  </div>
                </div>

                {/* Target Completion Date */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Target End Date
                  </label>
                  <input
                    type="date"
                    value={projectEditState.target_end_date}
                    onChange={(e) => setProjectEditState((prev) => ({ ...prev, target_end_date: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveProject}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RESPONSIVE POPUP MODAL: Engagement Detail */}
        {selectedEngagement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div 
              className="relative w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div>
                  <p className="font-mono text-xs font-bold text-primary">{selectedEngagement.engagement_number}</p>
                  <h2 className="text-xl font-black text-foreground mt-1">{selectedEngagement.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedEngagement(null)} 
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 space-y-3 text-sm max-h-[60vh] overflow-y-auto pr-1">
                <Detail label="Client" value={selectedEngagement.client?.primary_name || 'Not linked'} />
                <Detail label="Type" value={typeLabel(selectedEngagement.engagement_type)} />
                <Detail label="Status" value={selectedEngagement.status?.replaceAll('_', ' ')} />
                <Detail label="Site Address" value={selectedEngagement.site_address || 'Not provided'} />
                <Detail 
                  label="Budget Window" 
                  value={selectedEngagement.budget_max || selectedEngagement.budget_min ? `$${Number(selectedEngagement.budget_min || 0).toLocaleString()} - $${Number(selectedEngagement.budget_max || selectedEngagement.budget_min).toLocaleString()}` : 'Not provided'} 
                />
                <Detail 
                  label="Target Timeline" 
                  value={`${selectedEngagement.expected_start_date || 'TBD'} → ${selectedEngagement.expected_completion_date || 'TBD'}`} 
                />
                {selectedEngagement.description && (
                  <Detail label="Description" value={selectedEngagement.description} />
                )}
                {selectedEngagement.requested_scope && (
                  <Detail label="Requested Scope" value={selectedEngagement.requested_scope} />
                )}
              </div>

              <div className="mt-6 flex justify-between gap-3 border-t border-border pt-4">
                <button 
                  type="button" 
                  onClick={() => setSelectedEngagement(null)} 
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
                >
                  Close
                </button>
                {selectedEngagement.status !== 'converted_to_project' && !['lost', 'cancelled'].includes(selectedEngagement.status) && (
                  <button 
                    disabled={saving} 
                    onClick={convert} 
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-60 shadow-sm hover:opacity-90"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderKanban className="h-4 w-4" />}
                    Convert to Project
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: New Client Engagement */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
            <form 
              onSubmit={submit} 
              className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Phase 1 Intake</p>
                  <h2 className="mt-1 text-2xl font-black">New Client Engagement</h2>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 max-h-[65vh] overflow-y-auto pr-1">
                <Field label="Client" required>
                  <select 
                    value={form.client_party_id} 
                    onChange={(event) => update('client_party_id', event.target.value)} 
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Select existing client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>{client.primary_name}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Engagement title" required>
                  <input 
                    value={form.title} 
                    onChange={(event) => update('title', event.target.value)} 
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" 
                    placeholder="e.g. Ridgeway residence completion" 
                  />
                </Field>

                <Field label="Engagement type">
                  <select 
                    value={form.engagement_type} 
                    onChange={(event) => update('engagement_type', event.target.value)} 
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {TYPES.map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Priority">
                  <select 
                    value={form.priority} 
                    onChange={(event) => update('priority', event.target.value)} 
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </Field>

                <Field label="Site / project address">
                  <input 
                    value={form.site_address} 
                    onChange={(event) => update('site_address', event.target.value)} 
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" 
                    placeholder="Address or site description" 
                  />
                </Field>

                <Field label="Desired timeline">
                  <input 
                    value={form.desired_timeline} 
                    onChange={(event) => update('desired_timeline', event.target.value)} 
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" 
                    placeholder="e.g. Start Q3, complete in 8 months" 
                  />
                </Field>

                <Field label="Budget minimum ($)">
                  <input 
                    type="number" 
                    min="0" 
                    value={form.budget_min} 
                    onChange={(event) => update('budget_min', event.target.value)} 
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" 
                  />
                </Field>

                <Field label="Budget maximum ($)">
                  <input 
                    type="number" 
                    min="0" 
                    value={form.budget_max} 
                    onChange={(event) => update('budget_max', event.target.value)} 
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" 
                  />
                </Field>

                <Field label="Expected start">
                  <input 
                    type="date" 
                    value={form.expected_start_date} 
                    onChange={(event) => update('expected_start_date', event.target.value)} 
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" 
                  />
                </Field>

                <Field label="Expected completion">
                  <input 
                    type="date" 
                    value={form.expected_completion_date} 
                    onChange={(event) => update('expected_completion_date', event.target.value)} 
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" 
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Client objectives">
                    <textarea 
                      value={form.objectives} 
                      onChange={(event) => update('objectives', event.target.value)} 
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-input bg-card text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" 
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field label="Requested scope">
                    <textarea 
                      value={form.requested_scope} 
                      onChange={(event) => update('requested_scope', event.target.value)} 
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-input bg-card text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" 
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field label="Project description">
                    <textarea 
                      value={form.description} 
                      onChange={(event) => update('description', event.target.value)} 
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-input bg-card text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" 
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button 
                  disabled={saving} 
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 shadow-sm"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create engagement
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, children }) { 
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}{required && <span className="ml-1 text-destructive">*</span>}
      {children}
    </label>
  ); 
}

function Detail({ label, value }) { 
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className="mt-1 font-medium capitalize text-foreground">{value}</p>
    </div>
  ); 
}
