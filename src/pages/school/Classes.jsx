import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Users, Search, Plus, Trash2, Edit2, MoreHorizontal, LayoutGrid, X } from 'lucide-react';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { motion } from 'framer-motion';
import SchoolPageShell from '@/components/school/SchoolPageShell';
import { statCardStyle, filterBarStyle, iconBadgeStyle, STAT_COLORS, addButtonStyle } from '@/components/school/premiumStyles';

const LEVEL_OPTIONS = ['KG', 'Primary', 'JHS'];
const PREDEFINED_CLASSES = {
  'KG': ['KG 1', 'KG 2'],
  'Primary': ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'],
  'JHS': ['JHS 1 (Basic 7)', 'JHS 2 (Basic 8)', 'JHS 3 (Basic 9)']
};

export default function Classes() {
  const { t } = useTranslation();
  
  const { data: classRecords = [], isLoading: isClassesLoading } = useIndustryRecords('school_class');
  const { data: teacherRecords = [] } = useIndustryRecords('school_teacher');
  const { data: studentRecords = [] } = useIndustryRecords('school_student');
  
  const mutate = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '', level: 'Primary', room: '', capacity: '',
    class_teacher: '', subject: '',
    academic_year: new Date().getFullYear().toString(), status: 'Active'
  });

  const classes = useMemo(() => classRecords.map(r => ({ id: r.id, ...r.data })), [classRecords]);
  const teachers = useMemo(() => teacherRecords.map(r => ({ id: r.id, ...r.data })), [teacherRecords]);

  const filteredClasses = useMemo(() => {
    return classes.filter(c => 
      (levelFilter === 'All' || c.level === levelFilter) &&
      (c.name?.toLowerCase().includes(search.toLowerCase()) || 
       c.class_teacher?.toLowerCase().includes(search.toLowerCase()))
    );
  }, [classes, search, levelFilter]);

  const stats = useMemo(() => {
    const totalStudents = studentRecords.length;
    const levels = new Set(classes.map(c => c.level)).size;
    return { totalClasses: classes.length, totalStudents, levels };
  }, [classes, studentRecords]);

  const handleOpenAdd = () => {
    setFormData({ name: '', level: 'Primary', room: '', capacity: '40', class_teacher: '', subject: '', academic_year: '2025/2026', status: 'Active' });
    setEditingId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (c) => {
    setFormData({
      name: c.name || '', level: c.level || 'Primary', room: c.room || '',
      capacity: c.capacity || '40', class_teacher: c.class_teacher || '',
      subject: c.subject || '', academic_year: c.academic_year || '2025/2026',
      status: c.status || 'Active'
    });
    setEditingId(c.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Class name is required');
      return;
    }
    const payload = {
      recordType: 'school_class',
      payload: formData,
      status: formData.status,
      searchText: `${formData.name} ${formData.level} ${formData.class_teacher}`
    };

    try {
      if (editingId) {
        await mutate.mutateAsync({ id: editingId, ...payload });
        toast.success('Class updated');
      } else {
        await mutate.mutateAsync(payload);
        toast.success('Class created');
      }
      setShowModal(false);
    } catch (err) {
      toast.error('Failed to save class');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteRecord.mutateAsync({ id: deleteTargetId, recordType: 'school_class' });
      toast.success('Class deleted');
    } catch (err) {
      toast.error('Failed to delete class');
    } finally {
      setDeleteTargetId(null);
    }
  };

  return (
    <SchoolPageShell
      title="Classes & Subjects"
      subtitle="Manage class structure, room allocations, and class teachers"
      breadcrumb={['School', 'Classes']}
      actions={
        <Button onClick={handleOpenAdd} className="bg-[#0066fe] hover:bg-[#0055d4] text-white border-0 shadow-lg shadow-[#0066fe]/15 rounded-full px-6 h-10 text-sm font-semibold transition-all hover:scale-[1.02] hover:-translate-y-0.5">
          <Plus className="w-4 h-4 mr-2" /> Add Class
        </Button>
      }
    >
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Total Classes', value: stats.totalClasses, sub: 'Active class sections', icon: BookOpen, theme: 'blue' },
          { label: 'Total Students', value: stats.totalStudents, sub: 'Enrolled in classes', icon: Users, theme: 'green' },
          { label: 'Grade Levels', value: stats.levels, sub: 'Educational stages', icon: LayoutGrid, theme: 'orange' },
        ].map(({ label, value, sub, icon: Icon, theme }) => {
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
                {sub && <p className="text-[10px] text-slate-400/80 dark:text-zinc-500/80 mt-1 font-medium">{sub}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-100 dark:border-zinc-800/80 rounded-[1.75rem] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.02)] flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search classes or teachers..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-slate-50/50 hover:bg-slate-50 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 border-slate-200/50 dark:border-zinc-700/50 text-sm h-10 rounded-xl focus-visible:ring-1 focus-visible:ring-[#0066fe] transition-all" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {['All', ...LEVEL_OPTIONS].map(l => (
            <button key={l} onClick={() => setLevelFilter(l)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${levelFilter === l ? 'bg-[#0066fe] text-white shadow-sm' : 'bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-slate-400 dark:text-zinc-500 font-bold">{filteredClasses.length} classes</div>
      </div>

      {/* ── Class Cards Grid ── */}
      {isClassesLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="w-6 h-6 border-2 border-[#0066fe] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-[2.2rem] border border-dashed border-slate-200 dark:border-zinc-800 py-16 text-center shadow-[0_24px_64px_rgba(0,0,0,0.02)]">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-slate-400 dark:text-zinc-500 text-sm font-semibold">No classes found</p>
          <button onClick={handleOpenAdd} className="text-xs font-bold text-[#0066fe] hover:text-[#0055d4] transition-colors mt-2 block mx-auto">Create your first class →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredClasses.map(c => {
            const enrolled = studentRecords.filter(r => r.data?.class_name === c.name).length;
            const capacity = parseInt(c.capacity) || 40;
            const fillPct = Math.min(100, Math.round((enrolled / capacity) * 100));
            return (
              <motion.div key={c.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-[2.2rem] p-6 shadow-[0_20px_48px_rgba(0,0,0,0.02),0_1px_3px_rgba(0,0,0,0.01)] hover:-translate-y-1 hover:shadow-[0_32px_64px_rgba(0,0,0,0.04)] transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100/30 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-300">
                      <BookOpen className="w-5 h-5 text-[#0066fe]" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200/40 dark:border-zinc-700/40">
                        {c.level}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => handleOpenEdit(c)} className="cursor-pointer font-medium text-xs"><Edit2 className="w-3.5 h-3.5 mr-2" /> Edit Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTargetId(c.id)} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-900/20 cursor-pointer font-medium text-xs"><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Record</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-800 dark:text-zinc-150 text-base mb-1 tracking-tight">{c.name}</h3>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mb-4 font-semibold">{c.class_teacher ? `Teacher: ${c.class_teacher}` : 'No teacher assigned'}</p>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100/50 dark:border-zinc-800/40 mt-3">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400 dark:text-zinc-500">Enrolled Students</span>
                    <span className="text-slate-700 dark:text-zinc-300">{enrolled} / {capacity}</span>
                  </div>
                  <div className="w-full bg-slate-50 dark:bg-zinc-800/60 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#0066fe] h-full rounded-full transition-all duration-500" style={{ width: `${fillPct}%` }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Modal Form ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/30 pb-4 mb-4">
              <h3 className="text-lg font-bold text-foreground">{editingId ? 'Edit Class' : 'Create New Class'}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Class Name *</label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="mt-1 bg-background border-border/40 text-sm h-9" placeholder="e.g. Primary 1A" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Level</label>
                  <select value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })} className="w-full mt-1 bg-background border border-border/40 rounded-md h-9 px-3 text-sm text-foreground">
                    {LEVEL_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Room / Block</label>
                  <Input value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} className="mt-1 bg-background border-border/40 text-sm h-9" placeholder="e.g. Room 102" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Capacity</label>
                  <Input type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} className="mt-1 bg-background border-border/40 text-sm h-9" placeholder="40" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Class Teacher</label>
                <select value={formData.class_teacher} onChange={e => setFormData({ ...formData, class_teacher: e.target.value })} className="w-full mt-1 bg-background border border-border/40 rounded-md h-9 px-3 text-sm text-foreground">
                  <option value="">-- Unassigned --</option>
                  {teachers.map(t => <option key={t.id} value={t.full_name}>{t.full_name}</option>)}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/30">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="h-9 px-4 text-xs font-medium">Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-4 text-xs font-medium">{editingId ? 'Save Changes' : 'Create Class'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        open={!!deleteTargetId}
        onOpenChange={(op) => !op && setDeleteTargetId(null)}
        title="Delete Class"
        description="Are you sure you want to delete this class record? This will not delete enrolled students."
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        destructive
      />
    </SchoolPageShell>
  );
}
