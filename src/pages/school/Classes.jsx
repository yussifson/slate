import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Users, Search, Plus, Trash2, Edit, MoreVertical, LayoutGrid, X } from 'lucide-react';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { motion } from 'framer-motion';

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
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    level: 'Primary',
    room: '',
    capacity: '',
    class_teacher: '',
    subject: '',
    academic_year: new Date().getFullYear().toString(),
    status: 'Active'
  });

  const classes = useMemo(() => classRecords.map(r => ({ id: r.id, ...r.data })), [classRecords]);
  const teachers = useMemo(() => teacherRecords.map(r => ({ id: r.id, ...r.data })), [teacherRecords]);

  const studentCountForClass = (className) => studentRecords.filter(r => r.data?.class_name === className).length;

  const filteredClasses = useMemo(() => {
    return classes.filter(c => 
      c.name?.toLowerCase().includes(search.toLowerCase()) || 
      c.class_teacher?.toLowerCase().includes(search.toLowerCase())
    );
  }, [classes, search]);

  const handleOpenAdd = () => {
    setFormData({
      name: PREDEFINED_CLASSES['Primary'][0],
      level: 'Primary',
      room: '',
      capacity: '40',
      class_teacher: '',
      subject: '',
      academic_year: new Date().getFullYear().toString(),
      status: 'Active'
    });
    setEditingId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (cls) => {
    setFormData({
      name: cls.name || '',
      level: cls.level || 'Primary',
      room: cls.room || '',
      capacity: cls.capacity || '',
      class_teacher: cls.class_teacher || '',
      subject: cls.subject || '',
      academic_year: cls.academic_year || new Date().getFullYear().toString(),
      status: cls.status || 'Active'
    });
    setEditingId(cls.id);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.level) {
      return toast.error("Class name and level are required");
    }

    const payload = { ...formData };
    
    mutate.mutate(
      {
        id: editingId,
        recordType: 'school_class',
        payload
      },
      {
        onSuccess: () => {
          toast.success(editingId ? "Class updated successfully" : "Class created successfully");
          setShowModal(false);
        },
        onError: () => {
          toast.error("Failed to save class");
        }
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate(
      { id: deleteTargetId, recordType: 'school_class' },
      {
        onSuccess: () => {
          toast.success("Class deleted");
          setDeleteTargetId(null);
        },
        onError: () => {
          toast.error("Failed to delete class");
          setDeleteTargetId(null);
        }
      }
    );
  };

  const handleLevelChange = (level) => {
    setFormData(prev => ({
      ...prev,
      level,
      name: PREDEFINED_CLASSES[level][0] // Reset to first available name for the new level
    }));
  };

  return (
    <div className="school-theme-root space-y-6 font-outfit p-6 bg-[#FCFAF7] dark:bg-zinc-950 min-h-screen text-[#1F1E1C] dark:text-zinc-50">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] p-8 text-[#1F1E1C] dark:text-zinc-50 shadow-sm">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-widest border-b-4 border-orange-400 inline-block pb-2 mb-4">Classes & Cohorts</h1>
          <p className="text-muted-foreground font-semibold uppercase tracking-wider">Manage class configurations and capacities</p>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <p className="text-sm font-black text-indigo-600 uppercase tracking-widest">Total Classes</p>
            <p className="text-4xl font-black">{classes.length}</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border-2 border-emerald-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
          <Input 
            placeholder="Search classes or teachers..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-10 rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 h-12" 
          />
        </div>
        <Button onClick={handleOpenAdd} className="bg-gradient-to-r from-indigo-600 to-orange-500 hover:opacity-90 text-white rounded-full font-semibold px-6 py-2.5 transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(99,102,241,0.15)]">
          <Plus className="w-5 h-5 mr-2" /> New Class
        </Button>
      </motion.div>

      {isClassesLoading ? (
        <div className="flex items-center justify-center py-20 text-emerald-800 font-bold uppercase tracking-widest animate-pulse">Loading Classes...</div>
      ) : filteredClasses.length === 0 ? (
        <div className="py-20 text-center text-gray-500 font-medium">No classes found. Add your first class!</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredClasses.map(c => (
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} key={c.id} className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.02)] p-6 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-300 relative group flex flex-col">
              <div className="absolute top-4 right-4 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-none hover:bg-emerald-100">
                      <MoreVertical className="w-5 h-5 text-emerald-800"/>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white border-2 border-emerald-300 rounded-none">
                    <DropdownMenuItem className="font-semibold text-emerald-800 rounded-none cursor-pointer" onClick={() => handleOpenEdit(c)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-700 font-black rounded-none cursor-pointer" onClick={() => setDeleteTargetId(c.id)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center">
                  <LayoutGrid className="w-6 h-6 text-[#1E3A8A]" />
                </div>
                <div>
                  <h3 className="font-black text-2xl text-emerald-900 leading-none">{c.name}</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-[#1E3A8A] text-white text-[10px] font-black uppercase tracking-widest">{c.level}</span>
                </div>
              </div>
              
              <div className="space-y-3 mb-6 flex-1 pt-4 border-t-2 border-emerald-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-emerald-800 flex items-center gap-2"><Users className="w-4 h-4"/> Enrolled:</span>
                  <span className="font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 border border-emerald-300">
                    {studentCountForClass(c.name)} {c.capacity ? `/ ${c.capacity}` : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-emerald-800">Teacher:</span>
                  <span className="font-medium text-[#1E3A8A]">{c.class_teacher || 'Unassigned'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-emerald-800">Room:</span>
                  <span className="font-medium text-[#1E3A8A]">{c.room || 'TBD'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-900/60 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-2xl w-full max-w-lg p-6 space-y-6 rounded-none max-h-[90vh] overflow-y-auto relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-emerald-800 hover:bg-emerald-100 p-1">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-emerald-900 uppercase tracking-wider border-b-4 border-emerald-200 pb-2">
              {editingId ? 'Edit Class' : 'Add New Class'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="text-xs font-black text-[#1E3A8A] uppercase tracking-widest">Educational Level</label>
                <select 
                  value={formData.level} 
                  onChange={e => handleLevelChange(e.target.value)} 
                  className="mt-1 w-full rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 px-3 py-2.5 h-11"
                >
                  {LEVEL_OPTIONS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-[#1E3A8A] uppercase tracking-widest">Class Name</label>
                <select 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="mt-1 w-full rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 px-3 py-2.5 h-11"
                >
                  {PREDEFINED_CLASSES[formData.level]?.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-[#1E3A8A] uppercase tracking-widest">Class Teacher</label>
                <select 
                  value={formData.class_teacher} 
                  onChange={e => setFormData({...formData, class_teacher: e.target.value})} 
                  className="mt-1 w-full rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 px-3 py-2.5 h-11"
                >
                  <option value="">-- Unassigned --</option>
                  {teachers.map(t => <option key={t.id} value={t.full_name || t.name}>{t.full_name || t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-[#1E3A8A] uppercase tracking-widest">Room Number/Name</label>
                <Input 
                  value={formData.room} 
                  onChange={e => setFormData({...formData, room: e.target.value})} 
                  className="mt-1 w-full rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 px-3 py-2.5 h-11" 
                  placeholder="e.g. Room 101"
                />
              </div>

              <div>
                <label className="text-xs font-black text-[#1E3A8A] uppercase tracking-widest">Capacity</label>
                <Input 
                  type="number"
                  value={formData.capacity} 
                  onChange={e => setFormData({...formData, capacity: e.target.value})} 
                  className="mt-1 w-full rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 px-3 py-2.5 h-11" 
                  placeholder="e.g. 40"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t-4 border-emerald-200">
              <Button variant="outline" className="flex-1 bg-white dark:bg-zinc-800 hover:bg-[#FAF8F5] dark:hover:bg-zinc-700 text-[#1F1E1C] dark:text-zinc-50 border border-[#E4DFD5] dark:border-zinc-700 rounded-full font-semibold px-6 py-2.5 transition-all hover:scale-[1.02]" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-gradient-to-r from-indigo-600 to-orange-500 hover:opacity-90 text-white rounded-full font-semibold px-6 py-2.5 transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(99,102,241,0.15)]" onClick={handleSave} disabled={mutate.isPending}>
                {mutate.isPending ? 'Saving...' : 'Save Class'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={deleteTargetId !== null} 
        onClose={() => setDeleteTargetId(null)} 
        onConfirm={handleDelete} 
        title="Delete Class" 
        message="Are you sure you want to permanently delete this class? This cannot be undone." 
      />
    </div>
  );
}
