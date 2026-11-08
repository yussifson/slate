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
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    if (event?.preventDefault) event.preventDefault();
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
    <div className="flex flex-col h-full bg-background text-foreground p-3 sm:p-5 md:p-6 space-y-3.5 sm:space-y-5 overflow-y-auto font-sans pb-24">
      {/* Clean Native Mobile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-[#005A9C] flex items-center justify-center text-white shadow-md shadow-[#005A9C]/20 shrink-0">
            <FolderKanban className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">Projects & Engagements</h1>
            <p className="text-xs text-muted-foreground font-medium">Manage client intake, site execution & completions</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm"
            onClick={() => setShowForm(true)} 
            className="bg-[#005A9C] hover:bg-[#00477D] text-white text-xs font-bold rounded-xl h-10 px-4 gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> <span>New Engagement</span>
          </Button>
        </div>
      </div>

      {/* 2x2 Native Mobile Metric Hero Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
        <div 
          onClick={() => setTab('ongoing')}
          className={`cursor-pointer bg-card/90 backdrop-blur-xl border rounded-[20px] p-3 sm:p-4 shadow-xs transition-all ${tab === 'ongoing' ? 'border-[#005A9C] ring-1 ring-[#005A9C]' : 'border-border/80'}`}
        >
          <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Ongoing Projects</span>
          <span className="text-xl sm:text-2xl font-black text-foreground">{ongoingProjects.length}</span>
          <span className="text-[10px] text-muted-foreground mt-1 block">Active site builds</span>
        </div>

        <div 
          onClick={() => setTab('engagements')}
          className={`cursor-pointer bg-card/90 backdrop-blur-xl border rounded-[20px] p-3 sm:p-4 shadow-xs transition-all ${tab === 'engagements' ? 'border-amber-500 ring-1 ring-amber-500' : 'border-border/80'}`}
        >
          <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Draft Briefs</span>
          <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{draftEngagements.length}</span>
          <span className="text-[10px] text-muted-foreground mt-1 block">Intake & review</span>
        </div>

        <div 
          onClick={() => setTab('delivered')}
          className={`col-span-2 sm:col-span-1 cursor-pointer bg-card/90 backdrop-blur-xl border rounded-[20px] p-3 sm:p-4 shadow-xs transition-all ${tab === 'delivered' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-border/80'}`}
        >
          <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Delivered</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{deliveredProjects.length}</span>
          <span className="text-[10px] text-muted-foreground mt-1 block">Completed handovers</span>
        </div>
      </div>

      {/* Navigation tabs & Search bar */}
      <div className="bg-card/90 backdrop-blur-xl p-2.5 sm:p-3 rounded-[20px] border border-border/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5 sm:pb-0">
          <button 
            onClick={() => setTab('ongoing')} 
            className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${tab === 'ongoing' ? 'bg-[#005A9C] text-white shadow-xs' : 'text-muted-foreground hover:bg-muted'}`}
          >
            Ongoing ({ongoingProjects.length})
          </button>
          <button 
            onClick={() => setTab('engagements')} 
            className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${tab === 'engagements' ? 'bg-[#005A9C] text-white shadow-xs' : 'text-muted-foreground hover:bg-muted'}`}
          >
            Draft Briefs ({draftEngagements.length})
          </button>
          <button 
            onClick={() => setTab('delivered')} 
            className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${tab === 'delivered' ? 'bg-[#005A9C] text-white shadow-xs' : 'text-muted-foreground hover:bg-muted'}`}
          >
            Delivered ({deliveredProjects.length})
          </button>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input 
            value={search} 
            onChange={(event) => setSearch(event.target.value)} 
            placeholder="Search code, title, client..." 
            className="pl-8 text-xs h-9 rounded-xl bg-background border-border/80 w-full"
          />
        </div>
      </div>

      {/* Content area: Mobile Cards + Desktop Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : tab === 'engagements' ? (
        <div className="space-y-3">
          {/* Mobile Native Card View (< md) */}
          <div className="md:hidden space-y-2.5">
            {draftEngagements.length ? draftEngagements.map(item => (
              <div 
                key={item.id} 
                onClick={() => setSelectedEngagement(item)}
                className="bg-card rounded-2xl p-3.5 border border-border shadow-xs active:scale-[0.99] transition-all space-y-2.5 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-extrabold text-xs font-mono text-[#005A9C] dark:text-blue-400">{item.engagement_number}</span>
                    <h4 className="font-bold text-sm text-foreground truncate mt-0.5">{item.title}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.client?.primary_name || 'Unlinked Client'}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/40 shrink-0">
                    {item.status?.replaceAll('_', ' ') || 'Draft'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                  <span className="text-[11px] font-semibold text-primary">
                    {typeLabel(item.engagement_type)}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                    {item.site_address || 'No site listed'}
                  </span>
                </div>

                <div className="flex items-center justify-end pt-1 border-t border-border/40">
                  <span className="text-xs font-bold text-primary flex items-center gap-0.5">
                    View Details <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
                No draft engagements found.
              </div>
            )}
          </div>

          {/* Desktop High-Density Table (>= md) */}
          <div className="hidden md:block rounded-[22px] border border-border/80 bg-card shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border/80">
                  <tr>
                    <th className="p-3.5">Ref Code</th>
                    <th className="p-3.5">Engagement Title</th>
                    <th className="p-3.5">Client Name</th>
                    <th className="p-3.5">Engagement Type</th>
                    <th className="p-3.5">Site Location</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {draftEngagements.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedEngagement(item)}
                      className="group hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <td className="p-3.5 font-mono font-bold text-[#005A9C]">
                        {item.engagement_number}
                      </td>
                      <td className="p-3.5 font-semibold text-foreground">
                        {item.title}
                      </td>
                      <td className="p-3.5 text-muted-foreground">
                        {item.client?.primary_name || <span className="italic text-muted-foreground/60">Unlinked</span>}
                      </td>
                      <td className="p-3.5 font-medium text-foreground">
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-primary text-[11px]">
                          {typeLabel(item.engagement_type)}
                        </span>
                      </td>
                      <td className="p-3.5 text-muted-foreground truncate max-w-[200px]">
                        {item.site_address ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                            {item.site_address}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          {item.status?.replaceAll('_', ' ') || 'Draft'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); setSelectedEngagement(item); }}
                          className="h-7 text-xs font-semibold"
                        >
                          Details <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {draftEngagements.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-muted-foreground">
                        No draft engagements found. Click "New engagement" above to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Ongoing & Delivered Projects View */
        <div className="space-y-3">
          {/* Mobile Native Card View (< md) */}
          <div className="md:hidden space-y-2.5">
            {(tab === 'ongoing' ? ongoingProjects : deliveredProjects).length ? (tab === 'ongoing' ? ongoingProjects : deliveredProjects).map(item => (
              <div 
                key={item.id} 
                onClick={() => openProjectModal(item)}
                className="bg-card rounded-2xl p-3.5 border border-border shadow-xs active:scale-[0.99] transition-all space-y-2.5 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-extrabold text-xs font-mono text-[#005A9C] dark:text-blue-400">{item.project_code}</span>
                    <h4 className="font-bold text-sm text-foreground truncate mt-0.5">{item.name}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.client?.primary_name || 'Delivery Project'}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                    ['completed', 'delivered'].includes(item.status) 
                      ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' 
                      : 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/40'
                  }`}>
                    {item.status?.replaceAll('_', ' ') || 'Active'}
                  </Badge>
                </div>

                {/* Progress bar in mobile card */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Completion</span>
                    <span className="font-mono font-bold text-foreground">{item.progress_percentage || 0}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        (item.progress_percentage || 0) >= 100 
                          ? 'bg-emerald-500' 
                          : (item.progress_percentage || 0) > 50 
                            ? 'bg-[#005A9C]' 
                            : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, item.progress_percentage || 0)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                  <span className="font-mono font-bold text-foreground text-[11px]">
                    {item.budget_amount ? `$${Number(item.budget_amount).toLocaleString()}` : 'No Budget'}
                  </span>
                  <span className="text-xs font-bold text-[#005A9C] flex items-center gap-0.5">
                    Update <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
                {tab === 'ongoing' ? 'No ongoing projects at the moment.' : 'No delivered projects found.'}
              </div>
            )}
          </div>

          {/* Desktop High-Density Table (>= md) */}
          <div className="hidden md:block rounded-[22px] border border-border/80 bg-card shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border/80">
                  <tr>
                    <th className="p-3.5">Project Code</th>
                    <th className="p-3.5">Project Name</th>
                    <th className="p-3.5">Client</th>
                    <th className="p-3.5">Budget</th>
                    <th className="p-3.5">Progress %</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {(tab === 'ongoing' ? ongoingProjects : deliveredProjects).map((item) => (
                    <tr 
                      key={item.id} 
                      onClick={() => openProjectModal(item)}
                      className="group hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <td className="p-3.5 font-mono font-bold text-[#005A9C]">
                        {item.project_code}
                      </td>
                      <td className="p-3.5 font-semibold text-foreground">
                        {item.name}
                      </td>
                      <td className="p-3.5 text-muted-foreground">
                        {item.client?.primary_name || <span className="italic text-muted-foreground/60">Delivery Project</span>}
                      </td>
                      <td className="p-3.5 font-mono font-semibold text-foreground">
                        {item.budget_amount ? `$${Number(item.budget_amount).toLocaleString()}` : '—'}
                      </td>
                      <td className="p-3.5 min-w-[170px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                (item.progress_percentage || 0) >= 100 
                                  ? 'bg-emerald-500' 
                                  : (item.progress_percentage || 0) > 50 
                                    ? 'bg-[#005A9C]' 
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
                      <td className="p-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ['completed', 'delivered'].includes(item.status) 
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : item.status === 'in_progress'
                              ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                              : 'bg-muted text-muted-foreground border border-border'
                        }`}>
                          {item.status?.replaceAll('_', ' ') || 'Active'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); openProjectModal(item); }}
                          className="h-7 text-xs font-semibold"
                        >
                          Update <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(tab === 'ongoing' ? ongoingProjects : deliveredProjects).length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-muted-foreground">
                        {tab === 'ongoing' ? 'No ongoing projects at the moment.' : 'No delivered projects found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG: Project Status & Progress Percentage Editor */}
      <Dialog open={!!selectedProject} onOpenChange={(open) => { if (!open) setSelectedProject(null); }}>
        <DialogContent className="max-w-xl bg-card text-card-foreground">
          {selectedProject && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-primary">
                  <span>{selectedProject.project_code}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="capitalize text-muted-foreground">{selectedProject.project_type || 'Construction'}</span>
                </div>
                <DialogTitle className="text-xl font-black text-foreground mt-1">
                  {selectedProject.name}
                </DialogTitle>
                <DialogDescription>
                  Adjust project lifecycle stage, completion percentage, and timeline targets.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-sm">
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
                  <Label className="text-xs font-semibold mb-2 block">Project Status</Label>
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
                    <Label className="text-xs font-semibold">Execution Progress</Label>
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
                  <Label className="text-xs font-semibold mb-1.5 block">Target End Date</Label>
                  <Input
                    type="date"
                    value={projectEditState.target_end_date}
                    onChange={(e) => setProjectEditState((prev) => ({ ...prev, target_end_date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedProject(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveProject}
                  className="bg-primary text-primary-foreground gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG: Engagement Detail & Conversion */}
      <Dialog open={!!selectedEngagement} onOpenChange={(open) => { if (!open) setSelectedEngagement(null); }}>
        <DialogContent className="max-w-xl bg-card text-card-foreground">
          {selectedEngagement && (
            <>
              <DialogHeader>
                <p className="font-mono text-xs font-bold text-primary">{selectedEngagement.engagement_number}</p>
                <DialogTitle className="text-xl font-black text-foreground mt-1">
                  {selectedEngagement.title}
                </DialogTitle>
                <DialogDescription>
                  Client brief specifications, timeline targets, and conversion readiness.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2 text-sm max-h-[60vh] overflow-y-auto pr-1">
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

              <DialogFooter className="pt-2 flex justify-between sm:justify-between items-center w-full">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setSelectedEngagement(null)}
                >
                  Close
                </Button>
                {selectedEngagement.status !== 'converted_to_project' && !['lost', 'cancelled'].includes(selectedEngagement.status) && (
                  <Button 
                    disabled={saving} 
                    onClick={convert} 
                    className="bg-primary text-primary-foreground gap-2"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderKanban className="h-4 w-4" />}
                    Convert to Project
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG: New Client Engagement Form (Standard Dialog Pattern) */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl bg-card text-card-foreground">
          <DialogHeader>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Phase 1 Intake</span>
            </div>
            <DialogTitle className="text-xl font-black text-foreground">
              New Client Engagement
            </DialogTitle>
            <DialogDescription>
              Capture initial client brief, requirements, site address, and budgetary parameters.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4 py-2">
            <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
              {/* Row 1: Client & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Client *</Label>
                  <Select 
                    value={form.client_party_id || ''} 
                    onValueChange={(val) => update('client_party_id', val)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select existing client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.primary_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Engagement Title *</Label>
                  <Input 
                    required
                    value={form.title} 
                    onChange={(e) => update('title', e.target.value)} 
                    placeholder="e.g. Ridgeway residence completion" 
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Row 2: Type & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Engagement Type</Label>
                  <Select 
                    value={form.engagement_type} 
                    onValueChange={(val) => update('engagement_type', val)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Priority</Label>
                  <Select 
                    value={form.priority} 
                    onValueChange={(val) => update('priority', val)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 3: Site Address & Desired Timeline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Site / Project Address</Label>
                  <Input 
                    value={form.site_address} 
                    onChange={(e) => update('site_address', e.target.value)} 
                    placeholder="Address or site description" 
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Desired Timeline</Label>
                  <Input 
                    value={form.desired_timeline} 
                    onChange={(e) => update('desired_timeline', e.target.value)} 
                    placeholder="e.g. Start Q3, complete in 8 months" 
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Row 4: Budget Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Budget Minimum ($)</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    value={form.budget_min} 
                    onChange={(e) => update('budget_min', e.target.value)} 
                    placeholder="0.00"
                    className="mt-1 font-mono"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Budget Maximum ($)</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    value={form.budget_max} 
                    onChange={(e) => update('budget_max', e.target.value)} 
                    placeholder="0.00"
                    className="mt-1 font-mono"
                  />
                </div>
              </div>

              {/* Row 5: Expected Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Expected Start Date</Label>
                  <Input 
                    type="date" 
                    value={form.expected_start_date} 
                    onChange={(e) => update('expected_start_date', e.target.value)} 
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Expected Completion Date</Label>
                  <Input 
                    type="date" 
                    value={form.expected_completion_date} 
                    onChange={(e) => update('expected_completion_date', e.target.value)} 
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Scope & Objectives */}
              <div>
                <Label className="text-xs font-semibold">Client Objectives</Label>
                <Textarea 
                  rows={2}
                  value={form.objectives} 
                  onChange={(e) => update('objectives', e.target.value)} 
                  placeholder="Key deliverables and client goals..." 
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Requested Scope</Label>
                <Textarea 
                  rows={2}
                  value={form.requested_scope} 
                  onChange={(e) => update('requested_scope', e.target.value)} 
                  placeholder="Specific engineering, architectural, or construction tasks requested..." 
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Project Description & Notes</Label>
                <Textarea 
                  rows={2}
                  value={form.description} 
                  onChange={(e) => update('description', e.target.value)} 
                  placeholder="General description, constraints, and initial observations..." 
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving} 
                className="bg-primary text-primary-foreground gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Engagement
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
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
