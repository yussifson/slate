import React, { useCallback, useEffect, useState } from 'react';
import { 
  Plus, Search, Edit3, Trash2, RefreshCw, Layers, 
  FileText, CheckCircle2, Clock, AlertCircle, Eye, Download, History 
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';

export default function JCLTechnicalDrawings() {
  const { user } = useAuth();
  const companyId = useCompanyId();

  const [drawings, setDrawings] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState('all');

  // Drawing Modal
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

  // Revision Modal
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
        supabase.from('ops_projects')
          .select('id, name, project_code')
          .eq('company_id', companyId)
          .order('name')
      ]);

      if (dwgRes.error && dwgRes.error.code !== '42P01') {
        console.warn('Drawings load issue:', dwgRes.error);
      }
      setDrawings(dwgRes.data || []);
      setProjects(projRes.data || []);

      if (dwgRes.data?.length > 0) {
        const revRes = await supabase.from('jcl_drawing_revisions')
          .select('*, jcl_technical_drawings(drawing_number, title)')
          .eq('company_id', companyId)
          .order('submitted_at', { ascending: false });
        setRevisions(revRes.data || []);
      }
    } catch (err) {
      console.error('Drawings load error:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { loadData(); }, [loadData]);

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

  const handleSaveDrawing = async (e) => {
    e.preventDefault();
    if (!drawingForm.title) {
      toast.error('Title is required');
      return;
    }
    const pid = drawingForm.project_id || projects[0]?.id;
    if (!pid) {
      toast.error('Please associate with a project');
      return;
    }

    try {
      if (editingDrawing) {
        const { error } = await supabase.from('jcl_technical_drawings').update({
          project_id: pid,
          drawing_number: drawingForm.drawing_number,
          title: drawingForm.title,
          discipline: drawingForm.discipline,
          current_revision_number: drawingForm.current_revision_number,
          current_status: drawingForm.current_status,
          cad_file_url: drawingForm.cad_file_url,
          pdf_file_url: drawingForm.pdf_file_url,
          updated_at: new Date().toISOString()
        }).eq('id', editingDrawing.id).eq('company_id', companyId);
        if (error) throw error;
        toast.success('Drawing record updated');
      } else {
        const { error } = await supabase.from('jcl_technical_drawings').insert({
          company_id: companyId,
          project_id: pid,
          drawing_number: drawingForm.drawing_number,
          title: drawingForm.title,
          discipline: drawingForm.discipline,
          current_revision_number: drawingForm.current_revision_number,
          current_status: drawingForm.current_status,
          cad_file_url: drawingForm.cad_file_url,
          pdf_file_url: drawingForm.pdf_file_url,
          created_by: user?.id
        });
        if (error) throw error;
        toast.success('New technical drawing registered');
      }
      setDrawingModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to save drawing');
    }
  };

  const handleDeleteDrawing = async (id) => {
    if (!window.confirm('Delete this technical drawing and all associated revisions?')) return;
    try {
      const { error } = await supabase.from('jcl_technical_drawings')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
      if (error) throw error;
      toast.success('Drawing deleted');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const openAddRevision = (dwg) => {
    setSelectedDrawingForRev(dwg);
    const nextRev = String.fromCharCode((dwg.current_revision_number || 'A').charCodeAt(0) + 1);
    setRevForm({
      revision_number: nextRev,
      revision_description: '',
      file_url: '',
      review_status: 'submitted',
      review_comments: ''
    });
    setRevModalOpen(true);
  };

  const handleSaveRevision = async (e) => {
    e.preventDefault();
    if (!selectedDrawingForRev) return;
    try {
      const { error: revErr } = await supabase.from('jcl_drawing_revisions').insert({
        company_id: companyId,
        drawing_id: selectedDrawingForRev.id,
        revision_number: revForm.revision_number,
        revision_description: revForm.revision_description,
        file_url: revForm.file_url,
        review_status: revForm.review_status,
        review_comments: revForm.review_comments,
        submitted_by: user?.id,
        submitted_at: new Date().toISOString()
      });
      if (revErr) throw revErr;

      await supabase.from('jcl_technical_drawings').update({
        current_revision_number: revForm.revision_number,
        current_status: revForm.review_status,
        pdf_file_url: revForm.file_url || selectedDrawingForRev.pdf_file_url,
        updated_at: new Date().toISOString()
      }).eq('id', selectedDrawingForRev.id);

      toast.success(`Revision ${revForm.revision_number} submitted`);
      setRevModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to submit revision');
    }
  };

  const filtered = drawings.filter(d => {
    const matchQuery = `${d.drawing_number || ''} ${d.title || ''} ${d.ops_projects?.name || ''}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchDisc = disciplineFilter === 'all' || d.discipline === disciplineFilter;
    return matchQuery && matchDisc;
  });

  return (
    <div className="flex flex-col h-full bg-background text-foreground p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5 border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" /> Technical Drawings Register
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Architectural, Structural, MEP and Civil blueprint version control with engineering revision audits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button size="sm" onClick={openCreateDrawing} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" /> Register Drawing
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registered Drawings</div>
          <div className="text-2xl font-bold mt-1">{drawings.length}</div>
        </div>
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Approved for Construction</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">
            {drawings.filter(d => ['approved', 'ifc', 'approved_as_noted'].includes(d.current_status)).length}
          </div>
        </div>
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Under Engineering Review</div>
          <div className="text-2xl font-bold mt-1 text-amber-600">
            {drawings.filter(d => ['submitted', 'in_review'].includes(d.current_status)).length}
          </div>
        </div>
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revision History Logs</div>
          <div className="text-2xl font-bold mt-1 text-blue-600">{revisions.length}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search drawing #, title, project..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Disciplines" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Disciplines</SelectItem>
              <SelectItem value="architectural">Architectural (ARCH)</SelectItem>
              <SelectItem value="structural">Structural (STR)</SelectItem>
              <SelectItem value="mep">MEP (Mech/Elec/Plumb)</SelectItem>
              <SelectItem value="civil">Civil & External (CIV)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Drawings Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground border-b">
              <tr>
                <th className="p-4 font-semibold">Drawing Number</th>
                <th className="p-4 font-semibold">Title</th>
                <th className="p-4 font-semibold">Project</th>
                <th className="p-4 font-semibold">Discipline</th>
                <th className="p-4 font-semibold text-center">Rev</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No drawings registered yet. Click "Register Drawing" to add one.
                  </td>
                </tr>
              ) : (
                filtered.map((dwg) => (
                  <tr key={dwg.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-mono font-medium text-foreground">{dwg.drawing_number}</td>
                    <td className="p-4 font-semibold text-foreground">{dwg.title}</td>
                    <td className="p-4 text-foreground">
                      {dwg.ops_projects?.name || <span className="text-muted-foreground italic">General</span>}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase bg-muted border">
                        {dwg.discipline}
                      </span>
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-foreground">
                      {dwg.current_revision_number || 'A'}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className={`font-semibold capitalize ${
                        dwg.current_status === 'approved' || dwg.current_status === 'ifc' ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' :
                        dwg.current_status === 'rejected' ? 'border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/40' :
                        'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                      }`}>
                        {dwg.current_status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10"
                          onClick={() => openAddRevision(dwg)}
                        >
                          <History className="w-3.5 h-3.5" /> +Rev
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDrawing(dwg)}>
                          <Edit3 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteDrawing(dwg.id)}>
                          <Trash2 className="w-4 h-4 text-destructive hover:text-destructive/80" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawing Modal */}
      <Dialog open={drawingModalOpen} onOpenChange={setDrawingModalOpen}>
        <DialogContent className="max-w-lg bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>{editingDrawing ? 'Edit Technical Drawing' : 'Register Technical Drawing'}</DialogTitle>
            <DialogDescription>
              Architectural, structural, or MEP drawing register entry with CAD/PDF blueprints.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveDrawing} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Project *</Label>
              <Select 
                value={drawingForm.project_id} 
                onValueChange={(val) => setDrawingForm({ ...drawingForm, project_id: val })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} {p.project_code ? `(${p.project_code})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Drawing Number *</Label>
                <Input 
                  required
                  value={drawingForm.drawing_number} 
                  onChange={(e) => setDrawingForm({ ...drawingForm, drawing_number: e.target.value })} 
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Discipline</Label>
                <Select 
                  value={drawingForm.discipline} 
                  onValueChange={(val) => setDrawingForm({ ...drawingForm, discipline: val })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="architectural">Architectural</SelectItem>
                    <SelectItem value="structural">Structural</SelectItem>
                    <SelectItem value="mep">MEP</SelectItem>
                    <SelectItem value="civil">Civil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Drawing Title *</Label>
              <Input 
                required
                placeholder="e.g. Ground Floor GA & Setting Out Plan"
                value={drawingForm.title} 
                onChange={(e) => setDrawingForm({ ...drawingForm, title: e.target.value })} 
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Revision</Label>
                <Input 
                  value={drawingForm.current_revision_number} 
                  onChange={(e) => setDrawingForm({ ...drawingForm, current_revision_number: e.target.value })} 
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Status</Label>
                <Select 
                  value={drawingForm.current_status} 
                  onValueChange={(val) => setDrawingForm({ ...drawingForm, current_status: val })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="ifc">Issued for Construction (IFC)</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">PDF / CAD File URL</Label>
              <Input 
                placeholder="https://storage.supabase.co/.../drawing.pdf"
                value={drawingForm.pdf_file_url} 
                onChange={(e) => setDrawingForm({ ...drawingForm, pdf_file_url: e.target.value })} 
                className="mt-1 font-mono text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDrawingModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary text-primary-foreground">Save Drawing</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Revision Modal */}
      <Dialog open={revModalOpen} onOpenChange={setRevModalOpen}>
        <DialogContent className="max-w-md bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Add Drawing Revision</DialogTitle>
            <DialogDescription>
              Upload and record a new revision for {selectedDrawingForRev?.drawing_number} ({selectedDrawingForRev?.title}).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveRevision} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">New Revision Code *</Label>
              <Input 
                required
                value={revForm.revision_number} 
                onChange={(e) => setRevForm({ ...revForm, revision_number: e.target.value })} 
                className="mt-1 font-mono uppercase"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Revision Summary / Changes</Label>
              <Textarea 
                rows={3}
                placeholder="Detail changes made from previous revision..."
                value={revForm.revision_description} 
                onChange={(e) => setRevForm({ ...revForm, revision_description: e.target.value })} 
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Blueprint File URL</Label>
              <Input 
                placeholder="https://..."
                value={revForm.file_url} 
                onChange={(e) => setRevForm({ ...revForm, file_url: e.target.value })} 
                className="mt-1 font-mono text-xs"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setRevModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary text-primary-foreground">Record Revision</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
