import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { BookOpen, Plus, Users, Search, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from "@tanstack/react-query";
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { powerSync } from '@/api/PowerSyncConnector';
import SchoolPageShell from '@/components/school/SchoolPageShell';

export default function TeachersStaff() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: 'Teacher', department: '', qualification: '' });

  const { data: teachers = [], isLoading, refetch } = useQuery({
    queryKey: ['teachers', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      try {
        const result = await powerSync.execute(
          'SELECT * FROM school_teachers WHERE company_id = ? ORDER BY name ASC',
          [companyId]
        );
        return result.rows._array || [];
      } catch (e) {
        console.error('Error fetching teachers:', e);
        return [];
      }
    },
    enabled: !!companyId
  });

  const handleAddNew = () => {
    setFormData({ name: '', email: '', phone: '', role: 'Teacher', department: '', qualification: '' });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (teacher) => {
    setFormData({
      name: teacher.name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      role: teacher.role || 'Teacher',
      department: teacher.department || '',
      qualification: teacher.qualification || ''
    });
    setEditingId(teacher.id);
    setShowForm(true);
  };

  const handleDelete = async (teacher) => {
    if (!confirm(`Delete ${teacher.name}?`)) return;
    try {
      await powerSync.execute('DELETE FROM school_teachers WHERE id = ?', [teacher.id]);
      toast.success('Teacher deleted');
      refetch();
    } catch (e) {
      toast.error('Failed to delete teacher');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }
    try {
      if (editingId) {
        await powerSync.execute(
          'UPDATE school_teachers SET name = ?, email = ?, phone = ?, role = ?, department = ?, qualification = ? WHERE id = ?',
          [formData.name, formData.email, formData.phone, formData.role, formData.department, formData.qualification, editingId]
        );
        toast.success('Teacher updated');
      } else {
        const id = `teacher_${Date.now()}`;
        await powerSync.execute(
          'INSERT INTO school_teachers (id, company_id, name, email, phone, role, department, qualification) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [id, companyId, formData.name, formData.email, formData.phone, formData.role, formData.department, formData.qualification]
        );
        toast.success('Teacher added');
      }
      setShowForm(false);
      refetch();
    } catch (e) {
      toast.error(e.message || 'Failed to save teacher');
    }
  };

  const filtered = teachers.filter(t => 
    t.name?.toLowerCase().includes(search.toLowerCase()) || 
    t.email?.toLowerCase().includes(search.toLowerCase()) ||
    t.department?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    totalStaff: teachers.length,
    teachersCount: teachers.filter(t => t.role === 'Teacher').length,
    departmentsCount: [...new Set(teachers.map(t => t.department).filter(Boolean))].length,
  };

  const inputCls = "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <SchoolPageShell
      title="Teachers & Staff"
      subtitle="Manage teaching and support staff members"
      breadcrumb={['School', 'Staff']}
      actions={
        <Button onClick={handleAddNew} className="bg-[#0066fe] hover:bg-[#0055d4] text-white border-0 shadow-lg shadow-[#0066fe]/15 rounded-full px-6 h-10 text-sm font-semibold transition-all hover:scale-[1.02] hover:-translate-y-0.5">
          <Plus className="w-4 h-4 mr-2" /> Add Staff
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Total Staff', value: stats.totalStaff, icon: BookOpen, theme: 'blue' },
          { label: 'Teachers', value: stats.teachersCount, icon: Users, theme: 'green' },
          { label: 'Departments', value: stats.departmentsCount, icon: Users, theme: 'orange' },
        ].map(({ label, value, icon: Icon, theme }) => {
          const styles = {
            blue: {
              card: 'bg-blue-50/30 dark:bg-blue-950/10 border-blue-100/60 dark:border-blue-900/20',
              iconBg: 'bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100/30',
              iconColor: 'text-blue-600 dark:text-blue-400'
            },
            green: {
              card: 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100/60 dark:border-emerald-900/20',
              iconBg: 'bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100/30',
              iconColor: 'text-emerald-600 dark:text-emerald-400'
            },
            orange: {
              card: 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-100/60 dark:border-amber-900/20',
              iconBg: 'bg-amber-50/80 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100/30',
              iconColor: 'text-amber-600 dark:text-amber-400'
            }
          };
          const themeStyle = styles[theme] || styles.blue;
          return (
            <div 
              key={label}
              className={`border rounded-[2.2rem] p-6 shadow-[0_20px_48px_rgba(0,0,0,0.02),0_1px_3px_rgba(0,0,0,0.01)] hover:-translate-y-1 hover:shadow-[0_32px_64px_rgba(0,0,0,0.04)] transition-all duration-300 flex items-center gap-5 relative overflow-hidden group ${themeStyle.card}`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-50/50 dark:from-zinc-800/10 to-transparent rounded-full pointer-events-none" />
              <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-300 ${themeStyle.iconBg}`}>
                <Icon className={`w-5 h-5 ${themeStyle.iconColor}`} />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-slate-800 dark:text-zinc-100 tracking-tight leading-none">{value}</p>
                <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-2">{label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-100 dark:border-zinc-800/80 rounded-[1.75rem] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.02)] flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search staff members..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-slate-50/50 hover:bg-slate-50 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 border-slate-200/50 dark:border-zinc-700/50 text-sm h-10 rounded-xl focus-visible:ring-1 focus-visible:ring-[#0066fe] transition-all" />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading staff...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border py-16 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No staff members found</p>
          <button onClick={handleAddNew} className="text-sm text-indigo-600 hover:underline mt-2">Add your first staff member →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(t => (
            <div key={t.id} className="bg-card rounded-xl border border-border/50 shadow-sm p-5 hover:shadow-md transition-all flex flex-col justify-between group relative">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center"><BookOpen className="w-5 h-5 text-indigo-600" /></div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(t)} className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(t)} className="p-1 rounded-md hover:bg-rose-50 text-muted-foreground hover:text-rose-600 border border-border/50"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <h3 className="font-bold text-base text-foreground leading-snug">{t.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t.role} · {t.department || 'General'}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-border/50 space-y-1.5 text-xs text-muted-foreground">
                <p className="truncate">📧 {t.email}</p>
                {t.phone && <p>📞 {t.phone}</p>}
                {t.qualification && <p className="truncate">🎓 {t.qualification}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Dr. James Wilson" className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="james@school.com" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+1234567890" className="h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className={`w-full ${inputCls}`}>
                  <option value="Teacher">Teacher</option>
                  <option value="Head of Department">Head of Department</option>
                  <option value="Assistant">Assistant</option>
                  <option value="Admin">Admin Staff</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} placeholder="e.g. Mathematics" className="h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Qualification</Label>
              <Input value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} placeholder="e.g. B.Ed, M.Sc" className="h-10" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700 text-white">{editingId ? 'Update' : 'Add Staff'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SchoolPageShell>
  );
}
