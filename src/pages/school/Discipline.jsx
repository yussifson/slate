import React, { useState } from 'react';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Plus, Search, Trash2, Edit2, AlertTriangle, CheckCircle, Clock, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import toast from 'react-hot-toast';
import SchoolPageShell from '@/components/school/SchoolPageShell';

const severityConfig = {
  Minor: { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20', dot: 'bg-amber-500' },
  Moderate: { cls: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20', dot: 'bg-orange-500' },
  Severe: { cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20', dot: 'bg-rose-500' },
};
const statusConfig = {
  Open: { cls: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400', icon: AlertTriangle },
  'Under Review': { cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', icon: Clock },
  Resolved: { cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', icon: CheckCircle },
};

export default function Discipline() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const { data: disciplines = [], isLoading } = useIndustryRecords('school_discipline');
  const { mutateAsync: saveRecord } = useMutateIndustryRecord();
  const { mutateAsync: deleteRecord } = useDeleteIndustryRecord();

  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ student_id: '', student_name: '', class_name: '', incident_type: 'Fighting', severity: 'Moderate', date: new Date().toISOString().split('T')[0], description: '', action_taken: 'Warned', reported_by: user?.name || '', status: 'Open' });

  const filteredRecords = disciplines.filter(record => {
    const d = record.data;
    if (!d) return false;
    const matchesSearch = d.student_name?.toLowerCase().includes(search.toLowerCase()) || d.description?.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === 'All' || d.severity === severityFilter;
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const openModal = (record = null) => {
    if (record) {
      setEditingId(record.id);
      setFormData({ student_id: record.data.student_id || '', student_name: record.data.student_name || '', class_name: record.data.class_name || '', incident_type: record.data.incident_type || 'Fighting', severity: record.data.severity || 'Moderate', date: record.data.date || new Date().toISOString().split('T')[0], description: record.data.description || '', action_taken: record.data.action_taken || 'Warned', reported_by: record.data.reported_by || '', status: record.data.status || 'Open' });
    } else {
      setEditingId(null);
      setFormData({ student_id: '', student_name: '', class_name: '', incident_type: 'Fighting', severity: 'Moderate', date: new Date().toISOString().split('T')[0], description: '', action_taken: 'Warned', reported_by: user?.name || '', status: 'Open' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.student_name || !formData.incident_type) { toast.error('Student name and Incident type are required'); return; }
    try {
      await saveRecord({ id: editingId, recordType: 'school_discipline', payload: formData, searchText: `${formData.student_name} ${formData.incident_type} ${formData.description}`, status: formData.status });
      toast.success('Incident saved');
      setIsModalOpen(false);
    } catch (error) { toast.error('Failed to save incident'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this incident?')) {
      try { await deleteRecord({ id, recordType: 'school_discipline' }); toast.success('Incident deleted'); }
      catch (error) { toast.error('Failed to delete incident'); }
    }
  };

  const stats = {
    total: disciplines.length,
    open: disciplines.filter(d => d.data?.status === 'Open').length,
    resolved: disciplines.filter(d => d.data?.status === 'Resolved').length,
  };

  return (
    <SchoolPageShell
      title="Discipline Management"
      subtitle="Track and manage student disciplinary incidents"
      breadcrumb={['School', 'Discipline']}
      actions={
        <Button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm h-10 px-5 text-sm font-medium">
          <Plus className="w-4 h-4 mr-2" /> Log Incident
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Total Incidents', value: stats.total, color: 'bg-indigo-500/10 text-indigo-600', icon: AlertTriangle },
          { label: 'Open Cases', value: stats.open, color: 'bg-rose-500/10 text-rose-600', icon: AlertTriangle },
          { label: 'Resolved', value: stats.resolved, color: 'bg-emerald-500/10 text-emerald-600', icon: CheckCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-card rounded-xl border border-border/50 p-5 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}><Icon className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border/50 rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search student or description..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background border-border/50 h-9 text-sm" />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[150px] h-9 bg-background border-border/50 text-sm"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent><SelectItem value="All">All Severities</SelectItem><SelectItem value="Minor">Minor</SelectItem><SelectItem value="Moderate">Moderate</SelectItem><SelectItem value="Severe">Severe</SelectItem></SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] h-9 bg-background border-border/50 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="All">All Statuses</SelectItem><SelectItem value="Open">Open</SelectItem><SelectItem value="Under Review">Under Review</SelectItem><SelectItem value="Resolved">Resolved</SelectItem></SelectContent>
        </Select>
        <div className="ml-auto text-sm text-muted-foreground">{filteredRecords.length} records</div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Incident</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Severity</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action Taken</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">Loading records...</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-16 text-center text-muted-foreground">No disciplinary records found.</td></tr>
              ) : filteredRecords.map(record => {
                const d = record.data;
                const sevCfg = severityConfig[d.severity] || severityConfig.Minor;
                const statCfg = statusConfig[d.status] || statusConfig.Open;
                const StatusIcon = statCfg.icon;
                return (
                  <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-foreground text-sm">{d.student_name}</p>
                      <p className="text-xs text-muted-foreground">{d.class_name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-sm text-foreground">{d.incident_type}</p>
                      <p className="text-xs text-muted-foreground max-w-xs truncate">{d.description}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{d.date}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sevCfg.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sevCfg.dot}`} /> {d.severity}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{d.action_taken}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statCfg.cls}`}>
                        <StatusIcon className="w-3 h-3" /> {d.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => openModal(record)}><Edit2 className="w-3.5 h-3.5 mr-2" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(record.id)} className="text-destructive focus:text-destructive"><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Incident' : 'Log Disciplinary Incident'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Student Name *</Label><Input value={formData.student_name} onChange={e => setFormData({...formData, student_name: e.target.value})} placeholder="e.g. John Doe" className="h-10" /></div>
              <div className="space-y-2"><Label>Class</Label><Input value={formData.class_name} onChange={e => setFormData({...formData, class_name: e.target.value})} placeholder="e.g. Primary 3" className="h-10" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Incident Type *</Label>
                <Select value={formData.incident_type} onValueChange={v => setFormData({...formData, incident_type: v})}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Fighting">Fighting</SelectItem><SelectItem value="Bullying">Bullying</SelectItem><SelectItem value="Truancy">Truancy</SelectItem><SelectItem value="Misconduct">Misconduct</SelectItem><SelectItem value="Vandalism">Vandalism</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Severity</Label>
                <Select value={formData.severity} onValueChange={v => setFormData({...formData, severity: v})}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Minor">Minor</SelectItem><SelectItem value="Moderate">Moderate</SelectItem><SelectItem value="Severe">Severe</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="h-10" /></div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Open">Open</SelectItem><SelectItem value="Under Review">Under Review</SelectItem><SelectItem value="Resolved">Resolved</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Details of the incident" className="h-10" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Action Taken</Label>
                <Select value={formData.action_taken} onValueChange={v => setFormData({...formData, action_taken: v})}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Warned">Warned</SelectItem><SelectItem value="Suspension">Suspension</SelectItem><SelectItem value="Parent Called">Parent Called</SelectItem><SelectItem value="Counseling">Counseling</SelectItem><SelectItem value="Expelled">Expelled</SelectItem><SelectItem value="Pending">Pending</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Reported By</Label><Input value={formData.reported_by} onChange={e => setFormData({...formData, reported_by: e.target.value})} className="h-10" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Incident</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SchoolPageShell>
  );
}
