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

const LEVEL_OPTIONS = ['KG', 'Primary', 'JHS'];
const PREDEFINED_CLASSES = {
  'KG': ['KG 1', 'KG 2'],
  'Primary': ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'],
  'JHS': ['JHS 1 (Basic 7)', 'JHS 2 (Basic 8)', 'JHS 3 (Basic 9)']
};
const LEVEL_COLORS = {
  'KG': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400',
  'Primary': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400',
  'JHS': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400',
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
    return { total: classes.length, totalStudents, levels };
  }, [classes, studentRecords]);

  const handleOpenAdd = () => {
    setFormData({ name: PREDEFINED_CLASSES['Primary'][0], level: 'Primary', room: '', capacity: '40', class_teacher: '', subject: '', academic_year: new Date().getFullYear().toString(), status: 'Active' });
    setEditingId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (cls) => {
    setFormData({ name: cls.name || '', level: cls.level || 'Primary', room: cls.room || '', capacity: cls.capacity || '', class_teacher: cls.class_teacher || '', subject: cls.subject || '', academic_year: cls.academic_year || new Date().getFullYear().toString(), status: cls.status || 'Active' });
    setEditingId(cls.id);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.level) return toast.error("Class name and level are required");
    mutate.mutate(
      { id: editingId, recordType: 'school_class', payload: { ...formData } },
      {
        onSuccess: () => { toast.success(editingId ? "Class updated" : "Class created"); setShowModal(false); },
        onError: () => toast.error("Failed to save class")
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate(
      { id: deleteTargetId, recordType: 'school_class' },
      { onSuccess: () => { toast.success("Class deleted"); setDeleteTargetId(null); }, onError: () => { toast.error("Failed to delete class"); setDeleteTargetId(null); } }
    );
  };

  return (
    <SchoolPageShell
      title="Classes & Cohorts"
      subtitle="Manage class configurations, teachers, and capacity"
      breadcrumb={['School', 'Classes & Cohorts']}
      actions={
        <Button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm h-10 px-5 text-sm font-medium">
          <Plus className="w-4 h-4 mr-2" /> Add Class
        </Button>
      }
    >
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Total Classes', value: stats.total, icon: BookOpen, color: 'bg-indigo-500/10 text-indigo-600' },
          { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'bg-emerald-500/10 text-emerald-600' },
          { label: 'Levels', value: stats.levels, icon: LayoutGrid, color: 'bg-amber-500/10 text-amber-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-xl border border-border/50 p-5 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
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
          <Input placeholder="Search classes or teachers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background border-border/50 text-sm h-9" />
        </div>
        <div className="flex items-center gap-2">
          {['All', ...LEVEL_OPTIONS].map(l => (
            <button key={l} onClick={() => setLevelFilter(l)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${levelFilter === l ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="ml-auto text-sm text-muted-foreground">{filteredClasses.length} classes</div>
      </div>

      {/* Class Cards Grid */}
      {isClassesLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading classes...</div>
      ) : filteredClasses.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border py-16 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No classes found</p>
          <button onClick={handleOpenAdd} className="text-sm text-indigo-600 hover:underline mt-2">Create your first class →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredClasses.map(c => {
            const enrolled = studentRecords.filter(r => r.data?.class_name === c.name).length;
            const capacity = parseInt(c.capacity) || 40;
            const fillPct = Math.min(100, Math.round((enrolled / capacity) * 100));
            const isFull = fillPct >= 90;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${LEVEL_COLORS[c.level] || 'bg-muted text-muted-foreground'}`}>
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

                  <h3 className="font-bold text-lg text-foreground tracking-tight">{c.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.class_teacher || 'No teacher assigned'}</p>

                  <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Enrolled</span>
                      <span className={`font-semibold ${isFull ? 'text-rose-600' : 'text-foreground'}`}>{enrolled} / {capacity}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${isFull ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${fillPct}%` }} />
                    </div>
                    {c.room && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5"><LayoutGrid className="w-3.5 h-3.5" /> Room</span>
                        <span className="font-medium text-foreground">{c.room}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-5">
              <h2 className="text-lg font-bold text-white">{editingId ? 'Edit Class' : 'New Class'}</h2>
              <p className="text-indigo-100 text-sm mt-0.5">Configure class details and capacity.</p>
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Academic Level</label>
                <select value={formData.level} onChange={e => { const level = e.target.value; setFormData({...formData, level, name: PREDEFINED_CLASSES[level][0]}); }} className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {LEVEL_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Class Name</label>
                <select value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {PREDEFINED_CLASSES[formData.level]?.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Class Teacher</label>
                <select value={formData.class_teacher} onChange={e => setFormData({...formData, class_teacher: e.target.value})} className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">-- Unassigned --</option>
                  {teachers.map(t => <option key={t.id} value={t.full_name || t.name}>{t.full_name || t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Room</label>
                  <Input value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} className="mt-1.5 h-10" placeholder="e.g. Room 101" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Capacity</label>
                  <Input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} className="mt-1.5 h-10" placeholder="e.g. 40" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 h-10" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSave} disabled={mutate.isPending}>
                  {mutate.isPending ? 'Saving...' : editingId ? 'Update Class' : 'Create Class'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmationModal isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} onConfirm={handleDelete} title="Delete Class" message="Are you sure you want to permanently delete this class? This cannot be undone." />
    </SchoolPageShell>
  );
}
