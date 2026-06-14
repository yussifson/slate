import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { BookOpen, Users, Search, Plus, Trash2, Layers, MoreVertical, Hash, LayoutGrid } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import ConfirmationModal from '@/components/ConfirmationModal';
import { motion } from 'framer-motion';

export default function Classes() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [viewDetails, setViewDetails] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const queryClient = useQueryClient();
  const { data: records = [], isLoading: isDbLoading } = useQuery({ 
    queryKey: ["cases", companyId], 
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }), 
    enabled: !!companyId 
  });
  
  const mutateClass = useMutation({
    mutationFn: (data) => data.id ? base44.entities.LegalCase.update(data.id, data) : base44.entities.LegalCase.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cases", companyId] })
  });

  const deleteClass = useMutation({
    mutationFn: (id) => base44.entities.LegalCase.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cases", companyId] })
  });

  const [formData, setFormData] = useState({
    name: '', subject: '', teacher: 'Mr. John Doe', room: '', schedule: '', courses: '', allowSelfRegistration: false
  });

  const classesData = records.map(r => {
    let extra = {}; try { extra = JSON.parse(r.description || '{}'); } catch(e) {}
    return { id: r.id, name: r.title || 'Untitled Class', subject: r.case_type || 'General', teacher: r.assigned_staff_name || 'Unassigned', room: extra.room || 'TBD', schedule: extra.schedule || 'TBD', students: extra.students || 0, courses: extra.courses || '', allowSelfRegistration: !!extra.allowSelfRegistration, stage: r.stage || 'active' };
  });

  const handleCreateClass = () => {
    if (!companyId) return toast.error("Workspace not loaded.");
    if (!formData.name.trim() || !formData.subject.trim()) return toast.error("Please enter a class name and subject");
    const payload = { company_id: companyId, title: formData.name, case_type: formData.subject, assigned_staff_name: formData.teacher, status: 'active', stage: 'primary', description: JSON.stringify({ room: formData.room || 'TBD', schedule: formData.schedule || 'TBD', students: 0, courses: formData.courses || '', allowSelfRegistration: formData.allowSelfRegistration }) };
    if (editingId) mutateClass.mutate({ id: editingId, ...payload }, { onSuccess: () => { toast.success("Updated!"); setShowModal(false); setEditingId(null); } });
    else mutateClass.mutate(payload, { onSuccess: () => { toast.success("Created!"); setShowModal(false); } });
  };

  const handleDeleteClass = () => {
    if (!deleteTargetId) return;
    deleteClass.mutate(deleteTargetId, { onSuccess: () => { toast.success("Removed!"); setDeleteTargetId(null); } });
  };

  const filtered = classesData.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.teacher?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 font-dmsans p-4 bg-emerald-50 min-h-screen">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-emerald-600 p-8 border-4 border-emerald-900 text-white">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-widest border-b-4 border-emerald-400 inline-block pb-2 mb-4">{t("classes_subjects", "Class Roster")}</h1>
          <p className="text-emerald-100 font-bold uppercase tracking-wider">Manage students, cohorts, and subjects</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-sm font-black text-emerald-300 uppercase tracking-widest">Total Classes</p>
            <p className="text-3xl font-black">{classesData.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-emerald-300 uppercase tracking-widest">Capacity</p>
            <p className="text-3xl font-black">{classesData.reduce((a,c)=>a+c.students,0)}</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border-2 border-emerald-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
          <Input placeholder="Search classes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-emerald-50 border-emerald-200 rounded-none shadow-none font-bold focus-visible:ring-emerald-500" />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button onClick={() => setShowModal(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-none border-2 border-emerald-800 rounded-none font-bold uppercase">
            <Plus className="w-4 h-4" /> {t("add_class", "New Class")}
          </Button>
        </div>
      </motion.div>

      {isDbLoading ? (
        <div className="py-12 text-center text-emerald-600 font-bold uppercase">Loading classes...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(c => (
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} key={c.id} className="bg-white border-2 border-emerald-300 shadow-none p-5 relative group flex flex-col">
              <div className="absolute top-4 right-4 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0 rounded-none hover:bg-emerald-100"><MoreVertical className="w-4 h-4 text-emerald-800"/></Button></DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white border-2 border-emerald-300 rounded-none">
                    <DropdownMenuItem className="font-bold text-emerald-800 rounded-none" onClick={() => setViewDetails(c)}>View Roster</DropdownMenuItem>
                    <DropdownMenuItem className="font-bold text-emerald-800 rounded-none" onClick={() => { setEditingId(c.id); setFormData({name: c.name, subject: c.subject, teacher: c.teacher, room: c.room, schedule: c.schedule, courses: c.courses||'', allowSelfRegistration: !!c.allowSelfRegistration}); setShowModal(true); }}>Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-700 font-black rounded-none" onClick={() => setDeleteTargetId(c.id)}>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="w-12 h-12 bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="font-black text-2xl text-emerald-900 leading-none mb-1">{c.name}</h3>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4">{c.subject}</p>
              
              <div className="space-y-2 mb-6 flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-emerald-800">Teacher:</span>
                  <span className="font-medium text-emerald-700">{c.teacher}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-emerald-800">Room:</span>
                  <span className="font-medium text-emerald-700">{c.room}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-emerald-800">Capacity:</span>
                  <span className="font-black text-emerald-900 bg-emerald-100 px-2 border border-emerald-300">{c.students}</span>
                </div>
              </div>
              <Button onClick={() => setViewDetails(c)} variant="outline" className="w-full bg-emerald-50 border-2 border-emerald-300 font-black text-emerald-800 uppercase rounded-none hover:bg-emerald-600 hover:text-white transition-colors">
                Open Roster
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-900/60 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white border-4 border-emerald-500 w-full max-w-md p-6 space-y-4 rounded-none max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black text-emerald-900 uppercase tracking-wider border-b-2 border-emerald-200 pb-2">{editingId ? 'Edit Class' : 'Add Class'}</h2>
            <div className="space-y-4">
              <div><label className="text-xs font-black text-emerald-700 uppercase tracking-widest">Class Name</label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 border-2 border-emerald-200 bg-emerald-50 rounded-none font-bold" /></div>
              <div><label className="text-xs font-black text-emerald-700 uppercase tracking-widest">Subject</label><Input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="mt-1 border-2 border-emerald-200 bg-emerald-50 rounded-none font-bold" /></div>
              <div>
                <label className="text-xs font-black text-emerald-700 uppercase tracking-widest">Teacher</label>
                <select value={formData.teacher} onChange={e => setFormData({...formData, teacher: e.target.value})} className="mt-1 w-full border-2 border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900 rounded-none focus:outline-none">
                  {['Mr. John Doe','Mrs. Jane Smith','Mr. Kwesi Asante'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-black text-emerald-700 uppercase tracking-widest">Room</label><Input value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} className="mt-1 border-2 border-emerald-200 bg-emerald-50 rounded-none font-bold" /></div>
                <div><label className="text-xs font-black text-emerald-700 uppercase tracking-widest">Schedule</label><Input value={formData.schedule} onChange={e => setFormData({...formData, schedule: e.target.value})} className="mt-1 border-2 border-emerald-200 bg-emerald-50 rounded-none font-bold" /></div>
              </div>
            </div>
            <div className="flex gap-4 pt-4 border-t-2 border-emerald-200">
              <Button variant="outline" className="flex-1 rounded-none border-2 border-emerald-300 font-bold text-emerald-800 hover:bg-emerald-50 uppercase" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase border-2 border-emerald-800" onClick={handleCreateClass}>Save</Button>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmationModal isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} onConfirm={handleDeleteClass} title="Disband Class" message="Permanently delete this cohort?" />
    </div>
  );
}
