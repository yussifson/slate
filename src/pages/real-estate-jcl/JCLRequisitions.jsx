import React, { useCallback, useEffect, useState } from 'react';
import { 
  Plus, Search, Edit3, Trash2, RefreshCw, ClipboardList, 
  Clock, CheckCircle2, AlertCircle, FileText 
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { getCompanyProjects } from '@/services/ProjectLookupService';
import { JCLProcurementService } from '@/services/JCLProcurementService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { createNotificationEvent } from '@/utils/notificationDispatcher';

const blankRequisitionForm = { 
  project_id: '', 
  department: 'Construction', 
  priority: 'normal', 
  required_date: '', 
  description: '', 
  justification: '',
  status: 'draft'
};

const statusLabels = { 
  draft: 'Draft', 
  submitted: 'Submitted', 
  under_review: 'Under Review', 
  approved: 'Approved', 
  rejected: 'Rejected'
};

export default function JCLRequisitions() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  
  const [requisitions, setRequisitions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState(null);
  const [form, setForm] = useState(blankRequisitionForm);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [resReq, resProj] = await Promise.all([
        supabase
          .from('jcl_purchase_requisitions')
          .select('id, reference, status, priority, required_date, project_id, description, justification, department, created_at, ops_projects(id,name,project_code)')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false }),
        getCompanyProjects(companyId)
      ]);

      if (resReq.error) throw resReq.error;
      setRequisitions(resReq.data || []);
      setProjects(resProj.data || []);
    } catch (err) {
      console.error('Requisitions load error:', err);
      toast.error(err.message || 'Unable to load requisitions');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditingReq(null);
    setForm({ ...blankRequisitionForm, project_id: projects[0]?.id || '' });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingReq(row);
    setForm({
      project_id: row.project_id || '',
      department: row.department || 'Construction',
      priority: row.priority || 'normal',
      required_date: row.required_date || '',
      description: row.description || '',
      justification: row.justification || '',
      status: row.status || 'draft'
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.description) {
      toast.error('Description is required');
      return;
    }
    setSaving(true);
    try {
      if (editingReq) {
        await JCLProcurementService.updateRequisition(companyId, editingReq.id, form);
        toast.success('Requisition updated successfully');
      } else {
        await JCLProcurementService.createRequisition(companyId, user?.id, form);
        toast.success('Requisition created successfully');
      createNotificationEvent({
        company_id: companyId,
        recipient_email: user?.email,
        recipient_name: user?.full_name || 'Procurement',
        title: 'Material Requisition Created',
        message: `New requisition created for ${form.department || 'Construction'}: ${form.description || 'Materials'}`,
        type: 'requisition',
        related_id: '/jcl/requisitions'
      }).catch(() => {});
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Save error:', err);
      toast.error(err.message || 'Unable to save requisition');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this requisition?')) return;
    try {
      await JCLProcurementService.deleteRequisition(companyId, id);
      toast.success('Requisition deleted');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Unable to delete');
    }
  };

  const filtered = requisitions.filter(r => {
    const matchQuery = `${r.reference || ''} ${r.description || ''} ${r.department || ''} ${r.ops_projects?.name || ''}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchQuery && matchStatus;
  });

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen flex flex-col bg-background text-foreground p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 pb-24 sm:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-[#005A9C] flex items-center justify-center text-white shadow-md shadow-[#005A9C]/20 shrink-0">
            <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">Purchase Requisitions</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={openCreate} className="bg-[#005A9C] hover:bg-[#00477D] text-white text-xs font-bold rounded-xl h-10 px-4 gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Requisition</span><span className="sm:hidden">Request</span>
          </Button>
        </div>
      </div>

      {/* 2x2 Stats Grid for Mobile (< md), Horizontal for Desktop (>= md) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-3.5 sm:p-4 shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Total Requests</div>
          <div className="text-xl sm:text-2xl font-black text-foreground">{requisitions.length}</div>
        </div>
        <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-3.5 sm:p-4 shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Pending Review</div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            {requisitions.filter(r => ['draft', 'submitted', 'under_review'].includes(r.status)).length}
          </div>
        </div>
        <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-3.5 sm:p-4 shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Approved</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {requisitions.filter(r => r.status === 'approved').length}
          </div>
        </div>
        <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-3.5 sm:p-4 shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Rejected</div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
            {requisitions.filter(r => r.status === 'rejected').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card/90 backdrop-blur-xl p-2.5 sm:p-3 rounded-[20px] border border-border/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search reference, project, description..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 text-xs h-9.5 rounded-xl bg-background border-border/80 w-full"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 text-xs font-semibold h-9.5 rounded-xl bg-background border-border/80">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content: Mobile Cards (< md) & Desktop Table (>= md) */}
      <div className="space-y-3">
        {/* Mobile View */}
        <div className="md:hidden space-y-2.5">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
              No requisitions found. Click "Request" to create one.
            </div>
          ) : (
            filtered.map((req) => (
              <div key={req.id} className="bg-card rounded-2xl p-3.5 border border-border shadow-xs active:scale-[0.99] transition-all space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-extrabold text-xs font-mono text-[#005A9C] dark:text-blue-400">{req.reference}</span>
                    <h4 className="font-bold text-sm text-foreground truncate mt-0.5">{req.description || 'No description provided'}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {req.ops_projects?.name || 'General / Unassigned'} · {req.department}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg border shrink-0 ${
                    req.status === 'approved' ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' :
                    req.status === 'rejected' ? 'border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/40' :
                    'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                  }`}>
                    {statusLabels[req.status] || req.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                  <span className="text-[11px] text-muted-foreground">
                    Required: {req.required_date ? new Date(req.required_date).toLocaleDateString() : 'ASAP'}
                  </span>
                  <span className={`text-[10px] font-bold uppercase ${
                    req.priority === 'urgent' ? 'text-rose-600' :
                    req.priority === 'high' ? 'text-amber-600' :
                    'text-muted-foreground'
                  }`}>
                    {req.priority} priority
                  </span>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/40">
                  <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs font-bold text-muted-foreground hover:text-foreground rounded-lg" onClick={() => openEdit(req)}>
                    <Edit3 className="size-3.5 mr-1" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs font-bold text-rose-500 hover:text-rose-700 rounded-lg" onClick={() => handleDelete(req.id)}>
                    <Trash2 className="size-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-[22px] border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border/80">
                <tr>
                  <th className="p-3.5">Reference</th>
                  <th className="p-3.5">Project</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Required Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-muted-foreground">
                      No requisitions found. Click "New Requisition" to create one.
                    </td>
                  </tr>
                ) : (
                  filtered.map((req) => (
                    <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5 font-mono font-medium text-foreground">{req.reference}</td>
                      <td className="p-3.5 text-foreground font-medium">
                        {req.ops_projects?.name || <span className="text-muted-foreground italic">General / Unassigned</span>}
                      </td>
                      <td className="p-3.5 text-muted-foreground">{req.department}</td>
                      <td className="p-3.5 max-w-xs truncate text-foreground" title={req.description}>
                        {req.description}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                          req.priority === 'urgent' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                          req.priority === 'high' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {req.priority?.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5 text-muted-foreground">
                        {req.required_date ? new Date(req.required_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-3.5">
                        <Badge variant="outline" className={`text-[10px] font-bold uppercase ${
                          req.status === 'approved' ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' :
                          req.status === 'rejected' ? 'border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/40' :
                          'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                        }`}>
                          {statusLabels[req.status] || req.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(req)} className="h-7 w-7 text-muted-foreground hover:text-foreground">
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(req.id)} className="h-7 w-7 text-destructive hover:text-destructive/80">
                            <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>{editingReq ? 'Edit Requisition' : 'Create Purchase Requisition'}</DialogTitle>
            <DialogDescription>
              Submit an operational material or service requisition for management review and procurement.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Project Association</Label>
              <Select value={form.project_id || 'unassigned'} onValueChange={(val) => setForm({ ...form, project_id: val })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Project (or General Site)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">General Operations / Unassigned</SelectItem>
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
                <Label className="text-xs font-semibold">Department</Label>
                <Input 
                  value={form.department} 
                  onChange={(e) => setForm({ ...form, department: e.target.value })} 
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Priority</Label>
                <Select value={form.priority} onValueChange={(val) => setForm({ ...form, priority: val })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Required By Date</Label>
                <Input 
                  type="date" 
                  value={form.required_date} 
                  onChange={(e) => setForm({ ...form, required_date: e.target.value })} 
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Status</Label>
                <Select value={form.status} onValueChange={(val) => setForm({ ...form, status: val })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Material / Service Description *</Label>
              <Textarea 
                required
                rows={3}
                placeholder="List required materials, quantities, specifications, and grade..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Business Justification</Label>
              <Textarea 
                rows={2}
                placeholder="Why is this requisition needed right now?"
                value={form.justification}
                onChange={(e) => setForm({ ...form, justification: e.target.value })}
                className="mt-1"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground">
                {saving ? 'Saving...' : editingReq ? 'Update Requisition' : 'Submit Requisition'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
