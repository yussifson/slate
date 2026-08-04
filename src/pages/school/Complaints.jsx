import React, { useState } from 'react';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Search, Trash2, Edit2, MessageSquare, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';
import SchoolPageShell from '@/components/school/SchoolPageShell';

const priorityConfig = {
  Low: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  High: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
  Urgent: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 animate-pulse',
};

const statusConfig = {
  Open: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400',
  'Under Review': 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400',
  Resolved: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400',
  Closed: 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400',
};

export default function Complaints() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const { data: complaints = [], isLoading } = useIndustryRecords('school_complaint');
  const { mutateAsync: saveRecord } = useMutateIndustryRecord();
  const { mutateAsync: deleteRecord } = useDeleteIndustryRecord();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    submitted_by: '',
    category: 'Academic',
    subject: '',
    description: '',
    priority: 'Medium',
    date: new Date().toISOString().split('T')[0],
    student_name: '',
    class_name: '',
    status: 'Open',
    resolution: '',
    resolved_by: '',
    resolved_date: null
  });

  const [resolveData, setResolveData] = useState({ resolution: '' });

  const filteredRecords = complaints.filter(record => {
    const d = record.data;
    if (!d) return false;
    const matchesSearch = d.subject?.toLowerCase().includes(search.toLowerCase()) || 
                          d.submitted_by?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openModal = (record = null) => {
    if (record) {
      setEditingId(record.id);
      setFormData({
        ...record.data,
      });
    } else {
      setEditingId(null);
      setFormData({
        submitted_by: '',
        category: 'Academic',
        subject: '',
        description: '',
        priority: 'Medium',
        date: new Date().toISOString().split('T')[0],
        student_name: '',
        class_name: '',
        status: 'Open',
        resolution: '',
        resolved_by: '',
        resolved_date: null
      });
    }
    setIsModalOpen(true);
  };

  const openResolveModal = (record) => {
    setEditingId(record.id);
    setFormData(record.data);
    setResolveData({ resolution: record.data.resolution || '' });
    setIsResolveModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.subject || !formData.submitted_by) {
      toast.error('Subject and Submitted By are required');
      return;
    }

    try {
      await saveRecord({
        id: editingId,
        recordType: 'school_complaint',
        payload: formData,
        searchText: `${formData.subject} ${formData.submitted_by} ${formData.student_name}`,
        status: formData.status
      });
      toast.success('Complaint saved successfully');
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Failed to save complaint');
    }
  };

  const handleResolve = async () => {
    if (!resolveData.resolution) {
      toast.error('Resolution text is required');
      return;
    }

    try {
      await saveRecord({
        id: editingId,
        recordType: 'school_complaint',
        payload: {
          ...formData,
          status: 'Resolved',
          resolution: resolveData.resolution,
          resolved_by: user?.name || 'Admin',
          resolved_date: new Date().toISOString().split('T')[0]
        },
        searchText: `${formData.subject} ${formData.submitted_by}`,
        status: 'Resolved'
      });
      toast.success('Complaint resolved');
      setIsResolveModalOpen(false);
    } catch (error) {
      toast.error('Failed to resolve complaint');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this complaint?')) {
      try {
        await deleteRecord({ id, recordType: 'school_complaint' });
        toast.success('Complaint deleted');
      } catch (error) {
        toast.error('Failed to delete complaint');
      }
    }
  };

  return (
    <SchoolPageShell
      title="Complaints & Feedback"
      subtitle="Track and resolve issues from parents and staff"
      breadcrumb={['School', 'Complaints']}
      actions={
        <Button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm h-10 px-5 text-sm font-medium">
          <Plus className="w-4 h-4 mr-2" /> Log Complaint
        </Button>
      }
    >
      <div className="bg-card border border-border/50 rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by subject or submitter..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-9 bg-background border-border/50 h-9 text-sm" 
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)} 
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="All">All Statuses</option>
          <option value="Open">Open</option>
          <option value="Under Review">Under Review</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
        <div className="ml-auto text-sm text-muted-foreground">{filteredRecords.length} records</div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground">Loading complaints...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-card rounded-xl border border-dashed border-border py-16 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No complaints found</p>
          </div>
        ) : (
          filteredRecords.map(record => {
            const data = record.data;
            const prioCls = priorityConfig[data.priority] || priorityConfig.Medium;
            const statCls = statusConfig[data.status] || statusConfig.Open;
            return (
              <div key={record.id} className="bg-card rounded-xl border border-border/50 shadow-sm p-6 hover:shadow-md transition-shadow relative group">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${prioCls}`}>{data.priority} Priority</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statCls}`}>{data.status}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">{data.category}</span>
                    </div>
                    <h3 className="font-bold text-lg text-foreground">{data.subject}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {data.status !== 'Resolved' && (
                      <Button size="sm" variant="outline" className="h-8 text-xs border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-indigo-500/30 dark:hover:bg-indigo-500/10" onClick={() => openResolveModal(record)}>
                        Resolve
                      </Button>
                    )}
                    <button className="p-1.5 rounded-lg border border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground" onClick={() => openModal(record)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500" onClick={() => handleDelete(record.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-foreground/80 leading-relaxed mb-4">{data.description}</p>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">Submitted by: <strong className="text-foreground">{data.submitted_by}</strong></span>
                  {data.student_name && <span className="flex items-center gap-1.5">Student: <strong className="text-foreground">{data.student_name} ({data.class_name || 'N/A'})</strong></span>}
                  <span className="flex items-center gap-1.5">Logged: <strong className="text-foreground">{data.date}</strong></span>
                </div>

                {data.status === 'Resolved' && data.resolution && (
                  <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400">
                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider mb-1">
                      <CheckCircle className="w-4 h-4" /> Resolved by {data.resolved_by} on {data.resolved_date}
                    </div>
                    <p className="text-sm">{data.resolution}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Log/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Complaint' : 'Log Complaint'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Submitted By *</Label>
                <Input value={formData.submitted_by} onChange={e => setFormData({ ...formData, submitted_by: e.target.value })} placeholder="e.g. Parent Name or Staff" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className={`w-full ${inputCls}`}>
                  <option>Academic</option>
                  <option>Facilities</option>
                  <option>Staff Misconduct</option>
                  <option>Bullying</option>
                  <option>Fees/Finance</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Student Name</Label>
                <Input value={formData.student_name} onChange={e => setFormData({ ...formData, student_name: e.target.value })} placeholder="John Doe (Optional)" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label>Class Name</Label>
                <Input value={formData.class_name} onChange={e => setFormData({ ...formData, class_name: e.target.value })} placeholder="Class 3A (Optional)" className="h-10" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className={`w-full ${inputCls}`}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className={`w-full ${inputCls}`}>
                  <option>Open</option>
                  <option>Under Review</option>
                  <option>Resolved</option>
                  <option>Closed</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder="Brief summary of the issue" className="h-10" />
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Details of complaint..." className="h-28 resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Complaint</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Modal */}
      <Dialog open={isResolveModalOpen} onOpenChange={setIsResolveModalOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Resolve Complaint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Incident Description</Label>
              <p className="mt-1.5 p-3 rounded-lg bg-muted text-sm text-foreground/80 border border-border">{formData.description}</p>
            </div>
            <div className="space-y-2">
              <Label>Resolution Actions *</Label>
              <Textarea value={resolveData.resolution} onChange={e => setResolveData({ resolution: e.target.value })} placeholder="Steps taken to resolve this feedback..." className="h-28 resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolveModalOpen(false)}>Cancel</Button>
            <Button onClick={handleResolve} className="bg-emerald-600 hover:bg-emerald-700 text-white">Mark Resolved</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SchoolPageShell>
  );
}
