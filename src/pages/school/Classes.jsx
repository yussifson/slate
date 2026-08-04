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
        <Button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white" style={addButtonStyle}>
          <Plus className="w-4 h-4 mr-2" /> Add Class
        </Button>
      }
    >
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        {[
          { label: 'Total Classes', value: stats.totalClasses, sub: 'Active class sections', icon: BookOpen, color: STAT_COLORS.blue },
          { label: 'Total Students', value: stats.totalStudents, sub: 'Enrolled in classes', icon: Users, color: STAT_COLORS.green },
          { label: 'Grade Levels', value: stats.levels, sub: 'Educational stages', icon: LayoutGrid, color: STAT_COLORS.orange },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} style={statCardStyle} className="group hover:shadow-lg transition-all duration-200">
            <div className="flex items-start gap-4">
              <div style={iconBadgeStyle(color.bg)}>
                <Icon style={{ width: 22, height: 22, color: color.icon }} />
              </div>
              <div className="flex-1">
                <p style={{ color: color.label, fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{label}</p>
                <p className="text-foreground" style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{value}</p>
                <p className="text-muted-foreground/60" style={{ fontSize: '12px', marginTop: '6px' }}>{sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div style={filterBarStyle} className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <Input placeholder="Search classes or teachers..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-background border-border/40 text-sm h-9" style={{ borderRadius: '10px' }} />
        </div>
        <div className="flex items-center gap-1.5">
          {['All', ...LEVEL_OPTIONS].map(l => (
            <button key={l} onClick={() => setLevelFilter(l)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${levelFilter === l ? 'bg-indigo-600 text-white' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-muted-foreground/60 font-medium">{filteredClasses.length} classes</div>
      </div>

      {/* ── Class Cards Grid ── */}
      {isClassesLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <div style={{ width: '28px', height: '28px', border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="bg-card rounded-2xl border border-dashed border-border/60 py-16 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No classes found</p>
          <button onClick={handleOpenAdd} className="text-sm text-indigo-600 hover:underline mt-2">Create your first class →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredClasses.map(c => {
            const enrolled = studentRecords.filter(r => r.data?.class_name === c.name).length;
            const capacity = parseInt(c.capacity) || 40;
            const fillPct = Math.min(100, Math.round((enrolled / capacity) * 100));
            return (
              <motion.div key={c.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl border border-border/40 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div style={iconBadgeStyle('rgba(99, 102, 241, 0.08)')}>
                      <BookOpen style={{ width: 20, height: 20, color: '#6366f1' }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                        {c.level}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => handleOpenEdit(c)}><Edit2 className="w-3.5 h-3.5 mr-2" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTargetId(c.id)} className="text-destructive focus:text-destructive"><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <h3 className="font-bold text-foreground text-lg mb-1">{c.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4">{c.class_teacher ? `Teacher: ${c.class_teacher}` : 'No teacher assigned'}</p>

                  <div className="space-y-2 pt-3 border-t border-border/30">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-muted-foreground">Enrolled Students</span>
                      <span className="text-foreground font-semibold">{enrolled} / {capacity}</span>
                    </div>
                    <div className="w-full bg-muted/50 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${fillPct}%` }} />
                    </div>
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
