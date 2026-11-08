import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Layers, Plus, Search, RefreshCw, FileText, CheckCircle2, 
  Clock, AlertCircle, Edit3, Trash2, ExternalLink, Download,
  Compass, Ruler, HardHat, FileSpreadsheet, Sparkles
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { getCompanyProjects } from '@/services/ProjectLookupService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

const DISCIPLINES = [
  { value: 'architectural', label: 'Architectural Design' },
  { value: 'structural', label: 'Structural Engineering' },
  { value: 'civil', label: 'Civil Works & Drainage' },
  { value: 'electrical', label: 'Electrical & MEP' },
  { value: 'mechanical', label: 'Mechanical Systems' },
  { value: 'plumbing', label: 'Plumbing & Sanitation' },
  { value: 'geotechnical', label: 'Geotechnical & Soil' },
  { value: 'other', label: 'Other Engineering' }
];

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'text-muted-foreground border-border' },
  submitted: { label: 'Under Review', color: 'text-amber-600 border-amber-500/30 bg-amber-500/10' },
  approved: { label: 'Approved', color: 'text-emerald-600 border-emerald-500/30 bg-emerald-500/10' },
  approved_with_comments: { label: 'Approved w/ Notes', color: 'text-blue-600 border-blue-500/30 bg-blue-500/10' },
  revise_resubmit: { label: 'Revise & Resubmit', color: 'text-rose-600 border-rose-500/30 bg-rose-500/10' },
  rejected: { label: 'Rejected', color: 'text-rose-700 border-rose-600/40 bg-rose-600/10' }
};

export default function JCLEngineering() {
  const { user } = useAuth();
  const companyId = useCompanyId();

  const [activeTab, setActiveTab] = useState('drawings'); // 'drawings' | 'revisions' | 'disciplines'
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  // Data
  const [drawings, setDrawings] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [projects, setProjects] = useState([]);

  // Modals
  const [drawingModalOpen, setDrawingModalOpen] = useState(false);
  const [editingDrawing, setEditingDrawing] = useState(null);
  const [drawingForm, setDrawingForm] = useState({
    project_id: '',
    drawing_number: '',
    title: '',
    discipline: 'architectural',
    current_revision_number: 'A',
    current_status: 'submitted',
    cad_file_url: '',
    pdf_file_url: ''
  });

  const [revModalOpen, setRevModalOpen] = useState(false);
  const [selectedDrawingForRev, setSelectedDrawingForRev] = useState(null);
  const [revForm, setRevForm] = useState({
    revision_number: 'B',
    revision_description: '',
    file_url: '',
    review_status: 'submitted',
    review_comments: ''
  });

  const loadData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [dwgRes, projRes] = await Promise.all([
        supabase.from('jcl_technical_drawings')
          .select('*, ops_projects(id,name,project_code)')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false }),
        getCompanyProjects(companyId)
      ]);

      if (dwgRes.error && dwgRes.error.code !== '42P01') {
        console.warn('Drawings load issue:', dwgRes.error);
      }
      setDrawings(dwgRes.data || []);
      setProjects(projRes.data || []);

      // If we have drawings, fetch recent revisions
      if (dwgRes.data?.length > 0) {
        const revRes = await supabase.from('jcl_drawing_revisions')
          .select('*, jcl_technical_drawings(drawing_number, title)')
          .eq('company_id', companyId)
          .order('submitted_at', { ascending: false });
        setRevisions(revRes.data || []);
      }
    } catch (err) {
      console.error('Engineering load error:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Drawing Handlers
  const openCreateDrawing = () => {
    setEditingDrawing(null);
    setDrawingForm({
      project_id: projects[0]?.id || '',
      drawing_number: `DWG-${Date.now().toString().slice(-5)}`,
      title: '',
      discipline: 'architectural',
      current_revision_number: 'A',
      current_status: 'submitted',
      cad_file_url: '',
      pdf_file_url: ''
    });
    setDrawingModalOpen(true);
  };

  const openEditDrawing = (row) => {
    setEditingDrawing(row);
    setDrawingForm({
      project_id: row.project_id || '',
      drawing_number: row.drawing_number || '',
      title: row.title || '',
      discipline: row.discipline || 'architectural',
      current_revision_number: row.current_revision_number || 'A',
      current_status: row.current_status || 'submitted',
      cad_file_url: row.cad_file_url || '',
      pdf_file_url: row.pdf_file_url || ''
    });
    setDrawingModalOpen(true);
  };

  const saveDrawing = async (e) => {
    e.preventDefault();
    if (!drawingForm.project_id || !drawingForm.title.trim()) {
      toast.error('Project and drawing title are required');
      return;
    }
    try {
      if (editingDrawing) {
        const { error } = await supabase.from('jcl_technical_drawings')
          .update({
            project_id: drawingForm.project_id,
            drawing_number: drawingForm.drawing_number,
            title: drawingForm.title,
            discipline: drawingForm.discipline,
            current_revision_number: drawingForm.current_revision_number,
            current_status: drawingForm.current_status,
            cad_file_url: drawingForm.cad_file_url,
            pdf_file_url: drawingForm.pdf_file_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingDrawing.id)
          .eq('company_id', companyId);
        if (error) throw error;
        toast.success('Technical drawing updated');
      } else {
        const { error } = await supabase.from('jcl_technical_drawings')
          .insert({
            company_id: companyId,
            project_id: drawingForm.project_id,
            drawing_number: drawingForm.drawing_number,
            title: drawingForm.title,
            discipline: drawingForm.discipline,
            current_revision_number: drawingForm.current_revision_number,
            current_status: drawingForm.current_status,
            cad_file_url: drawingForm.cad_file_url || null,
            pdf_file_url: drawingForm.pdf_file_url || null
          });
        if (error) throw error;
        toast.success('Technical drawing registered');
      }
      setDrawingModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save drawing');
    }
  };

  const deleteDrawing = async (id, number) => {
    if (!window.confirm(`Delete drawing ${number}?`)) return;
    try {
      const { error } = await supabase.from('jcl_technical_drawings')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
      if (error) throw error;
      toast.success('Drawing deleted');
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete drawing');
    }
  };

  // Revision Handlers
  const openAddRevision = (drawing) => {
    setSelectedDrawingForRev(drawing);
    const nextChar = String.fromCharCode((drawing.current_revision_number || 'A').charCodeAt(0) + 1);
    setRevForm({
      revision_number: nextChar,
      revision_description: '',
      file_url: '',
      review_status: 'submitted',
      review_comments: ''
    });
    setRevModalOpen(true);
  };

  const saveRevision = async (e) => {
    e.preventDefault();
    if (!revForm.revision_description.trim()) {
      toast.error('Revision description is required');
      return;
    }
    try {
      const { error } = await supabase.from('jcl_drawing_revisions')
        .insert({
          company_id: companyId,
          drawing_id: selectedDrawingForRev.id,
          revision_number: revForm.revision_number,
          revision_description: revForm.revision_description,
          file_url: revForm.file_url || 'https://storage.jcl.com/drawings/rev',
          submitted_by: user?.id,
          review_status: revForm.review_status,
          review_comments: revForm.review_comments || null
        });
      if (error) throw error;

      // Update parent drawing revision number and status
      await supabase.from('jcl_technical_drawings')
        .update({
          current_revision_number: revForm.revision_number,
          current_status: revForm.review_status,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDrawingForRev.id)
        .eq('company_id', companyId);

      toast.success(`Revision ${revForm.revision_number} logged successfully`);
      setRevModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to save revision');
    }
  };

  const filteredDrawings = useMemo(() =>
    drawings.filter(d =>
      `${d.drawing_number} ${d.title} ${d.discipline} ${d.ops_projects?.name || ''}`.toLowerCase().includes(query.toLowerCase())
    ), [drawings, query]
  );

  return (
    <main className="min-h-full bg-background p-4 sm:p-6 lg:p-8 font-sans">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Native Mobile Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-[#005A9C] flex items-center justify-center text-white shadow-md shadow-[#005A9C]/20 shrink-0">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">Engineering</h1>
              <p className="text-xs text-muted-foreground font-medium">Drawing registers, technical revisions & approvals</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={openCreateDrawing} 
              size="sm" 
              className="bg-[#005A9C] hover:bg-[#00477D] text-white text-xs font-bold rounded-xl h-10 px-4 gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Technical Drawing</span><span className="sm:hidden">Add Drawing</span>
            </Button>
          </div>
        </div>

        {/* 2x2 Native Mobile Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-3.5 sm:p-4 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Total Drawings</span>
            <span className="text-xl sm:text-2xl font-black text-foreground">{drawings.length}</span>
          </div>

          <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-3.5 sm:p-4 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Approved Designs</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {drawings.filter(d => d.current_status === 'approved' || d.current_status === 'approved_with_comments').length}
            </span>
          </div>

          <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-3.5 sm:p-4 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Pending Review</span>
            <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
              {drawings.filter(d => d.current_status === 'submitted').length}
            </span>
          </div>

          <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-3.5 sm:p-4 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Revisions Logged</span>
            <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">{revisions.length}</span>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-card/90 backdrop-blur-xl p-2.5 sm:p-3 rounded-[20px] border border-border/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-9 text-xs h-9.5 rounded-xl bg-background border-border/80 w-full" 
              placeholder="Search drawings, disciplines, projects..." 
              value={query} 
              onChange={e => setQuery(e.target.value)} 
            />
          </div>
          <Badge variant="outline" className="text-xs font-bold px-3 py-1 rounded-xl self-end sm:self-auto">
            {filteredDrawings.length} Drawings Listed
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
          <TabsList className="bg-muted/60 p-1 border border-border">
            <TabsTrigger value="drawings" className="text-xs font-semibold">Drawing Register ({drawings.length})</TabsTrigger>
            <TabsTrigger value="revisions" className="text-xs font-semibold">Revision History ({revisions.length})</TabsTrigger>
          </TabsList>

          {/* TAB 1: DRAWING REGISTER */}
          <TabsContent value="drawings" className="m-0">
            <div className="space-y-3">
              {/* Mobile Native Card View (< md) */}
              <div className="md:hidden space-y-2.5">
                {filteredDrawings.length ? filteredDrawings.map(row => {
                  const statusInfo = STATUS_CONFIG[row.current_status] || STATUS_CONFIG.submitted;
                  return (
                    <div key={row.id} className="bg-card rounded-2xl p-3.5 border border-border shadow-xs active:scale-[0.99] transition-all space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="font-extrabold text-xs font-mono text-[#005A9C] dark:text-blue-400">{row.drawing_number}</span>
                          <h4 className="font-bold text-sm text-foreground truncate mt-0.5">{row.title}</h4>
                          <p className="text-[11px] text-muted-foreground capitalize mt-0.5">{row.discipline?.replace(/_/g, ' ')} · {row.ops_projects?.name || 'Unassigned Project'}</p>
                        </div>
                        <Badge variant="outline" className={cn("text-[9px] font-bold uppercase px-2 py-0.5 rounded-lg border shrink-0", statusInfo.color)}>
                          {statusInfo.label}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                        <Badge variant="outline" className="font-mono text-[10px] bg-muted/40">
                          Rev {row.current_revision_number}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">{row.created_at ? new Date(row.created_at).toLocaleDateString() : 'Active'}</span>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/40">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-xs font-bold px-2.5 text-[#005A9C] border-[#005A9C]/30 hover:bg-[#005A9C]/10 rounded-lg" 
                          onClick={() => openAddRevision(row)}
                        >
                          + Rev
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-xs font-bold text-muted-foreground hover:text-foreground rounded-lg"
                          onClick={() => openEditDrawing(row)}
                        >
                          <Edit3 className="size-3.5 mr-1" /> Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-xs font-bold text-rose-500 hover:text-rose-700 rounded-lg"
                          onClick={() => deleteDrawing(row.id, row.drawing_number)}
                        >
                          <Trash2 className="size-3.5 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
                    No technical drawings found.
                  </div>
                )}
              </div>

              {/* Desktop High-Density Table (>= md) */}
              <Card className="hidden md:block border border-border/80 shadow-xs bg-card rounded-[22px] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="p-3">Drawing Number</th>
                      <th className="p-3">Title & Discipline</th>
                      <th className="p-3">Project</th>
                      <th className="p-3">Rev</th>
                      <th className="p-3">Approval Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredDrawings.length ? filteredDrawings.map(row => {
                      const statusInfo = STATUS_CONFIG[row.current_status] || STATUS_CONFIG.submitted;
                      return (
                        <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-semibold text-foreground flex items-center gap-2">
                            <FileText className="h-4 w-4 text-[#005A9C]" />
                            {row.drawing_number}
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-foreground">{row.title}</div>
                            <div className="text-[11px] text-muted-foreground capitalize">{row.discipline?.replace(/_/g, ' ')}</div>
                          </td>
                          <td className="p-3 font-medium text-foreground">{row.ops_projects?.name || 'Unassigned'}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="font-mono text-[10px] bg-muted/30">
                              Rev {row.current_revision_number}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className={`text-[10px] font-semibold ${statusInfo.color}`}>
                              {statusInfo.label}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-[11px] px-2 text-[#005A9C] border-[#005A9C]/30 hover:bg-[#005A9C]/10" 
                                onClick={() => openAddRevision(row)}
                                title="Submit new revision"
                              >
                                + Rev
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-muted-foreground hover:text-foreground" 
                                onClick={() => openEditDrawing(row)}
                              >
                                <Edit3 className="size-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50" 
                                onClick={() => deleteDrawing(row.id, row.drawing_number)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-muted-foreground">
                          No technical drawings found. Click &quot;New Technical Drawing&quot; to upload architectural or structural sheets.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          </TabsContent>

          {/* TAB 2: REVISION HISTORY */}
          <TabsContent value="revisions" className="m-0">
            <Card className="border border-border/80 shadow-xs bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="p-3">Drawing Reference</th>
                      <th className="p-3">Revision</th>
                      <th className="p-3">Changes & Description</th>
                      <th className="p-3">Submitted At</th>
                      <th className="p-3">Review Status</th>
                      <th className="p-3">Reviewer Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {revisions.length ? revisions.map(rev => (
                      <tr key={rev.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-semibold text-foreground">
                          {rev.jcl_technical_drawings?.drawing_number || 'Drawing'} - {rev.jcl_technical_drawings?.title}
                        </td>
                        <td className="p-3 font-mono font-bold text-[#005A9C]">Rev {rev.revision_number}</td>
                        <td className="p-3 max-w-sm text-foreground">{rev.revision_description}</td>
                        <td className="p-3 text-muted-foreground">
                          {rev.submitted_at ? new Date(rev.submitted_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                            {rev.review_status?.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">{rev.review_comments || 'No comments'}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-muted-foreground">
                          No revision history records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* DIALOG 1: CREATE / EDIT DRAWING */}
        <Dialog open={drawingModalOpen} onOpenChange={setDrawingModalOpen}>
          <DialogContent className="max-w-lg bg-card border border-border">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                {editingDrawing ? 'Edit Technical Drawing' : 'Register Technical Drawing'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Log architectural, structural, civil, or MEP plans into JCL&apos;s project drawing repository.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={saveDrawing} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Select Project *</Label>
                  <Select value={drawingForm.project_id} onValueChange={v => setDrawingForm({ ...drawingForm, project_id: v })}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Drawing Number *</Label>
                  <Input 
                    required
                    placeholder="e.g. AR-101" 
                    value={drawingForm.drawing_number} 
                    onChange={e => setDrawingForm({ ...drawingForm, drawing_number: e.target.value })} 
                    className="text-xs" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Drawing Title *</Label>
                <Input 
                  required
                  placeholder="e.g. Ground Floor GA & Setting Out Plan" 
                  value={drawingForm.title} 
                  onChange={e => setDrawingForm({ ...drawingForm, title: e.target.value })} 
                  className="text-xs" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Discipline</Label>
                  <Select value={drawingForm.discipline} onValueChange={v => setDrawingForm({ ...drawingForm, discipline: v })}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DISCIPLINES.map(d => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Initial Revision</Label>
                  <Input 
                    placeholder="A" 
                    value={drawingForm.current_revision_number} 
                    onChange={e => setDrawingForm({ ...drawingForm, current_revision_number: e.target.value })} 
                    className="text-xs" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Approval Status</Label>
                  <Select value={drawingForm.current_status} onValueChange={v => setDrawingForm({ ...drawingForm, current_status: v })}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="approved_with_comments">Approved w/ Notes</SelectItem>
                      <SelectItem value="revise_resubmit">Revise & Resubmit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">PDF File Link / Storage URL</Label>
                  <Input 
                    placeholder="https://..." 
                    value={drawingForm.pdf_file_url} 
                    onChange={e => setDrawingForm({ ...drawingForm, pdf_file_url: e.target.value })} 
                    className="text-xs" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">CAD File Link (DWG/DXF)</Label>
                  <Input 
                    placeholder="https://..." 
                    value={drawingForm.cad_file_url} 
                    onChange={e => setDrawingForm({ ...drawingForm, cad_file_url: e.target.value })} 
                    className="text-xs" 
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDrawingModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-[#005A9C] hover:bg-[#00477D] text-white">
                  {editingDrawing ? 'Update Drawing' : 'Save Drawing'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG 2: LOG NEW REVISION */}
        <Dialog open={revModalOpen} onOpenChange={setRevModalOpen}>
          <DialogContent className="max-w-md bg-card border border-border">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                Log Drawing Revision: {selectedDrawingForRev?.drawing_number}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Log a new immutable revision without overwriting historical sheets.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={saveRevision} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">New Revision Code *</Label>
                  <Input 
                    required
                    placeholder="e.g. B, C, or 02" 
                    value={revForm.revision_number} 
                    onChange={e => setRevForm({ ...revForm, revision_number: e.target.value })} 
                    className="text-xs" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Status</Label>
                  <Select value={revForm.review_status} onValueChange={v => setRevForm({ ...revForm, review_status: v })}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="approved_with_comments">Approved w/ Comments</SelectItem>
                      <SelectItem value="revise_resubmit">Revise & Resubmit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Revision Description & Change Log *</Label>
                <Textarea 
                  required
                  rows={3} 
                  placeholder="e.g. Beam dimensions adjusted per structural engineer calculations" 
                  value={revForm.revision_description} 
                  onChange={e => setRevForm({ ...revForm, revision_description: e.target.value })} 
                  className="text-xs" 
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Reviewer Notes</Label>
                <Input 
                  placeholder="Optional review observations" 
                  value={revForm.review_comments} 
                  onChange={e => setRevForm({ ...revForm, review_comments: e.target.value })} 
                  className="text-xs" 
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setRevModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-[#005A9C] hover:bg-[#00477D] text-white">
                  Submit Revision
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
