import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Layers, Plus, Users, Edit2, Trash2, Search, Inbox, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import SchoolAPI from '@/api/SchoolAPI';
import SchoolPageShell from '@/components/school/SchoolPageShell';

export default function ClassesSubjects() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ name: '', level: '', teacher: '', capacity: 50 });

  const { data: classes = [], isLoading, refetch } = useQuery({
    queryKey: ['classes', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      return await SchoolAPI.getClasses(companyId);
    },
    enabled: !!companyId
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      try {
        const { powerSync } = await import('@/api/PowerSyncConnector');
        const result = await powerSync.execute('SELECT id, name FROM school_teachers WHERE company_id = ?', [companyId]);
        return result.rows._array || [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!companyId
  });

  const handleAddNew = () => {
    setFormData({ name: '', level: '', teacher: '', capacity: 50 });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (classItem) => {
    setFormData({
      name: classItem.name || '',
      level: classItem.level || '',
      teacher: classItem.teacher || '',
      capacity: classItem.capacity || 50
    });
    setEditingId(classItem.id);
    setShowForm(true);
  };

  const handleDelete = async (classItem) => {
    if (!confirm(`Delete ${classItem.name}?`)) return;
    try {
      await SchoolAPI.deleteClass(companyId, classItem.id, user.id);
      toast.success('Class deleted');
      refetch();
    } catch (e) {
      toast.error(e.message || 'Failed to delete class');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Class name is required');
      return;
    }
    try {
      if (editingId) {
        await SchoolAPI.updateClass(companyId, editingId, formData, user.id);
        toast.success('Class updated');
      } else {
        await SchoolAPI.addClass(companyId, formData, user.id);
        toast.success('Class added');
      }
      setShowForm(false);
      refetch();
    } catch (e) {
      toast.error(e.message || 'Failed to save class');
    }
  };

  const filtered = classes.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.level?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    totalClasses: classes.length,
    totalCapacity: classes.reduce((sum, c) => sum + (Number(c.capacity) || 0), 0),
    avgCapacity: classes.length > 0 ? Math.round(classes.reduce((sum, c) => sum + (Number(c.capacity) || 0), 0) / classes.length) : 0,
  };

  const inputCls = "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <SchoolPageShell
      title="Classes & Subjects"
      subtitle="Manage academic class divisions and subjects"
      breadcrumb={['School', 'Classes']}
      actions={
        <Button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm h-10 px-5 text-sm font-medium">
          <Plus className="w-4 h-4 mr-2" /> Add Class
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Total Classes', value: stats.totalClasses, icon: Layers, color: 'bg-indigo-500/10 text-indigo-600' },
          { label: 'Average Capacity', value: `${stats.avgCapacity} students`, icon: Users, color: 'bg-sky-500/10 text-sky-600' },
          { label: 'Total Capacity', value: stats.totalCapacity, icon: Users, color: 'bg-amber-500/10 text-amber-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-xl border border-border/50 p-5 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}><Icon className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search Filter */}
      <div className="bg-card border border-border/50 rounded-xl shadow-sm p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search classes or levels..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background border-border/50 h-9 text-sm" />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading classes...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border py-16 text-center">
          <Layers className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No class divisions found</p>
          <button onClick={handleAddNew} className="text-sm text-indigo-600 hover:underline mt-2">Add your first class →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(c => {
            const assignedTeacher = teachers.find(t => t.id === c.teacher);
            return (
              <div key={c.id} className="bg-card rounded-xl border border-border/50 shadow-sm p-5 hover:shadow-md transition-all flex flex-col justify-between group relative">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center"><Layers className="w-5 h-5 text-indigo-600" /></div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(c)} className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(c)} className="p-1 rounded-md hover:bg-rose-50 text-muted-foreground hover:text-rose-600 border border-border/50"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <h3 className="font-bold text-base text-foreground leading-snug">{c.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.level || 'No level specified'}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Teacher:</span>
                    <span className="font-semibold text-foreground">{assignedTeacher ? assignedTeacher.name : 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Capacity:</span>
                    <span className="font-semibold text-foreground">{c.capacity} students</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Class' : 'Add New Class'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Class Name *</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Grade 9A" className="h-10" />
            </div>
            <div className="space-y-2">
              <Label>Grade Level</Label>
              <Input value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })} placeholder="e.g. Primary 5" className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class Teacher</Label>
                <select value={formData.teacher} onChange={e => setFormData({ ...formData, teacher: e.target.value })} className={`w-full ${inputCls}`}>
                  <option value="">Select teacher...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Class Capacity</Label>
                <Input type="number" min="1" max="100" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })} className="h-10" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700 text-white">{editingId ? 'Update Class' : 'Add Class'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SchoolPageShell>
  );
}
