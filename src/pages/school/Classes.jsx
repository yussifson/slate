import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Users, Search, Plus, Trash2, Edit, MoreVertical, LayoutGrid, X } from 'lucide-react';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Card } from '@/components/ui/card';
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Classes & Cohorts</h1>
            <p className="text-muted-foreground mt-2">Manage class configurations and capacities</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Classes</p>
              <p className="text-lg font-bold text-foreground">{classes.length}</p>
            </div>
            <Button onClick={handleOpenAdd} className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary hover:to-teal-700 text-white shadow-md border-0 rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Add Class
            </Button>
          </div>
        </div>

        <Card className="p-2 px-4 mb-6 border border-border/50 bg-card/50 backdrop-blur-md flex items-center rounded-2xl shadow-sm">
          <div className="relative flex-1 flex items-center">
            <Search className="w-5 h-5 text-muted-foreground mr-2" />
            <Input 
              placeholder="Search classes or teachers..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="border-0 bg-transparent focus-visible:ring-0 px-0 shadow-none text-base flex-1"
            />
          </div>
        </Card>

      {isClassesLoading ? (
        <div className="flex items-center justify-center py-20 text-emerald-800 font-bold uppercase tracking-widest animate-pulse">Loading Classes...</div>
      ) : filteredClasses.length === 0 ? (
        <div className="py-20 text-center text-gray-500 font-medium">No classes found. Add your first class!</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredClasses.map(c => (
            <Card key={c.id} className="relative group overflow-hidden border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
              <div className="absolute top-4 right-4 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-md hover:bg-muted">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(c)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeleteTargetId(c.id)} className="text-destructive focus:text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-foreground">{c.name}</h3>
                    <p className="text-sm font-medium text-muted-foreground">{c.level}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border/50">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4"/> Enrolled</span>
                    <span className="font-bold text-foreground">
                      {students.filter(s => s.class_name === c.name).length} 
                      <span className="text-muted-foreground font-normal"> / {c.capacity || 40}</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-2"><BookOpen className="w-4 h-4"/> Teacher</span>
                    <span className="font-bold text-foreground">{c.class_teacher || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-2"><LayoutGrid className="w-4 h-4"/> Room</span>
                    <span className="font-bold text-foreground">{c.room || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-card border border-border w-full max-w-md p-6 space-y-6 rounded-2xl my-8 relative shadow-xl">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {editingId ? 'Edit Class' : 'New Class'}
              </h2>
              <p className="text-muted-foreground mt-1">Configure class details and capacity.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Academic Level</label>
                <select 
                  value={formData.level} 
                  onChange={e => {
                    const level = e.target.value;
                    setFormData({...formData, level, name: PREDEFINED_CLASSES[level][0]});
                  }} 
                  className="mt-1.5 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {LEVEL_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Class Name</label>
                <select 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="mt-1.5 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {PREDEFINED_CLASSES[formData.level]?.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Class Teacher</label>
                <select 
                  value={formData.class_teacher} 
                  onChange={e => setFormData({...formData, class_teacher: e.target.value})} 
                  className="mt-1.5 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">-- Unassigned --</option>
                  {teachers.map(t => <option key={t.id} value={t.full_name || t.name}>{t.full_name || t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Room Number/Name</label>
                <Input 
                  value={formData.room} 
                  onChange={e => setFormData({...formData, room: e.target.value})} 
                  className="mt-1.5" 
                  placeholder="e.g. Room 101"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Capacity</label>
                <Input 
                  type="number"
                  value={formData.capacity} 
                  onChange={e => setFormData({...formData, capacity: e.target.value})} 
                  className="mt-1.5" 
                  placeholder="e.g. 40"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-gradient-to-r from-primary to-teal-600 hover:from-primary hover:to-teal-700 text-white shadow-md border-0" onClick={handleSave} disabled={mutate.isPending}>
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
    </div>
  );
}
