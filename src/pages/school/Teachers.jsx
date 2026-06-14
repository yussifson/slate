import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Users, Search, Plus, Mail, Phone, MoreVertical, Briefcase, GraduationCap, Calendar, CheckSquare, ListTodo, ClipboardCheck } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { registerSchoolUser } from '@/api/authUtils';
import { motion } from 'framer-motion';

export default function Teachers() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('directory'); // directory or command_center

  const { data: records = [], isLoading } = useQuery({ 
    queryKey: ["staff_records", companyId], 
    queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId }), 
    enabled: !!companyId 
  });

  const mutateTeacher = useMutation({
    mutationFn: (data) => data.id ? base44.entities.StaffRecord.update(data.id, data) : base44.entities.StaffRecord.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff_records", companyId] })
  });

  const deleteTeacher = useMutation({
    mutationFn: (id) => base44.entities.StaffRecord.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff_records", companyId] })
  });

  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', department: 'Academics', position: 'Teacher', 
    qualifications: '', subjects: '', defaultPassword: ''
  });

  const [departmentFilter, setDepartmentFilter] = useState('All');
  const departments = ['All', 'Academics', 'Administration', 'Support', 'Finance'];

  const allStaff = records.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
    return {
      id: r.id,
      name: r.full_name,
      email: r.email,
      phone: r.phone,
      department: r.department || 'Academics',
      position: r.position || 'Teacher',
      qualifications: extra.qualifications || '',
      subjects: extra.subjects || '',
      avatar: r.full_name?.substring(0,2).toUpperCase(),
      status: r.status || 'Active'
    };
  });

  const filtered = allStaff.filter(staff =>
    (departmentFilter === 'All' || staff.department === departmentFilter) &&
    (staff.name?.toLowerCase().includes(search.toLowerCase()) || 
     staff.position?.toLowerCase().includes(search.toLowerCase()) ||
     staff.subjects?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSave = async () => {
    if (!companyId) return toast.error("Workspace not loaded. Refresh the page and try again.");
    if (!formData.full_name || !formData.email) return toast.error("Name and Email are required");
    
    if (!editingId && !formData.defaultPassword) {
      return toast.error("Login Password is required for new teachers.");
    }
    
    if (!editingId) {
      const email = formData.email.trim().toLowerCase();
      const { error: authErr } = await registerSchoolUser(email, formData.defaultPassword, 'teacher', companyId, formData.full_name);
      if (authErr) {
        if (authErr.message?.includes('already registered')) return toast.error(`Email (${email}) is already registered!`);
        return toast.error(`Teacher Auth Error: ${authErr.message}`);
      }
    }

    const payload = {
      company_id: companyId,
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      department: formData.department || 'Academics',
      position: formData.position,
      status: 'Active',
      notes: JSON.stringify({ qualifications: formData.qualifications, subjects: formData.subjects })
    };

    const onDone = {
      onSuccess: () => {
        toast.success(editingId ? "Teacher updated successfully!" : `Teacher added!`);
        setShowModal(false);
        setEditingId(null);
        setFormData({ full_name: '', email: '', phone: '', department: 'Academics', position: 'Teacher', qualifications: '', subjects: '', defaultPassword: '' });
      },
      onError: (err) => toast.error(err?.message || "Failed to save teacher"),
    };

    if (editingId) mutateTeacher.mutate({ id: editingId, ...payload }, onDone);
    else mutateTeacher.mutate(payload, onDone);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header & Nav */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b-4 border-emerald-950 pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-emerald-950 tracking-tight leading-none mb-2 uppercase">
            Faculty <span className="text-emerald-500">Hub</span>
          </h1>
          <p className="text-sm font-bold text-emerald-700 uppercase tracking-widest">Manage staff records & daily command center.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {['command_center', 'directory'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-5 py-3 font-black uppercase tracking-widest text-xs transition-colors border-4 whitespace-nowrap ${activeTab === tab ? 'bg-emerald-500 border-emerald-950 text-emerald-950' : 'bg-transparent border-transparent text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300'}`}>
              {tab === 'command_center' ? <ClipboardCheck className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'command_center' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-emerald-400 border-4 border-emerald-950 p-6 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-950 flex items-center justify-center text-emerald-400"><Calendar className="w-6 h-6" /></div>
                <h3 className="font-black text-emerald-950 text-sm uppercase tracking-widest">Today's Classes</h3>
              </div>
              <p className="text-5xl font-black text-emerald-950 mb-1">4</p>
              <p className="text-sm font-bold text-emerald-800 uppercase tracking-widest">Periods Scheduled</p>
            </div>
            
            <div className="bg-white border-4 border-emerald-950 p-6 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-500 border-2 border-emerald-950 flex items-center justify-center text-emerald-950"><CheckSquare className="w-6 h-6" /></div>
                <h3 className="font-black text-emerald-950 text-sm uppercase tracking-widest">Pending Grading</h3>
              </div>
              <p className="text-5xl font-black text-emerald-500 mb-1">12</p>
              <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Assignments to review</p>
            </div>

            <div className="bg-emerald-950 border-4 border-emerald-950 p-6 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-500 border-2 border-emerald-950 flex items-center justify-center text-emerald-950"><ListTodo className="w-6 h-6" /></div>
                <h3 className="font-black text-emerald-50 text-sm uppercase tracking-widest">Action Items</h3>
              </div>
              <div className="space-y-3 mt-2">
                <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black uppercase tracking-widest py-3 border-2 border-emerald-950 transition-colors">Take Attendance</button>
                <button className="w-full bg-transparent hover:bg-emerald-800 text-emerald-50 font-black uppercase tracking-widest py-3 border-2 border-emerald-500 transition-colors">Post Notice</button>
              </div>
            </div>
          </div>

          <div className="bg-white border-4 border-emerald-950">
            <div className="p-6 border-b-4 border-emerald-950 bg-emerald-50">
              <h3 className="font-black text-emerald-950 uppercase tracking-widest flex items-center gap-3"><Calendar className="w-5 h-5 text-emerald-500" /> Today's Timetable</h3>
            </div>
            <div className="divide-y-4 divide-emerald-100 p-0">
              {[
                { time: '08:00 AM', subject: 'Mathematics (Grade 10)', room: 'Room 302' },
                { time: '10:30 AM', subject: 'Advanced Calculus', room: 'Lab 4' },
                { time: '01:00 PM', subject: 'Physics 101', room: 'Room 305' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-6 p-6 hover:bg-emerald-50 transition-colors">
                  <div className="w-32 shrink-0 text-center font-black text-emerald-950 bg-emerald-200 border-2 border-emerald-950 py-3 uppercase tracking-widest text-sm">{item.time}</div>
                  <div className="flex-1">
                    <p className="font-black text-emerald-950 text-xl uppercase tracking-wider">{item.subject}</p>
                    <p className="text-base font-bold text-emerald-600">{item.room}</p>
                  </div>
                  <button className="px-6 py-2 bg-emerald-950 text-emerald-50 font-black uppercase tracking-widest text-xs hover:bg-emerald-800 transition-colors">Start</button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'directory' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Search & Filter */}
          <div className="bg-white border-4 border-emerald-950 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 font-black" />
              <input placeholder="Search directory..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-emerald-50 border-2 border-emerald-950 font-bold text-emerald-950 placeholder-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-200 uppercase tracking-wider" />
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex bg-emerald-100 p-1 border-2 border-emerald-950 overflow-x-auto">
                {departments.map(d => (
                  <button
                    key={d}
                    onClick={() => setDepartmentFilter(d)}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors ${departmentFilter === d ? 'bg-emerald-950 text-emerald-50' : 'text-emerald-700 hover:bg-emerald-200'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <button onClick={() => { setEditingId(null); setFormData({ full_name: '', email: '', phone: '', department: 'Academics', position: 'Teacher', qualifications: '', subjects: '', defaultPassword: ''}); setShowModal(true); }} className="px-6 py-3 bg-emerald-500 text-emerald-950 font-black uppercase tracking-widest border-4 border-emerald-950 hover:bg-emerald-400 transition-colors flex items-center gap-2 shrink-0">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center"><div className="text-emerald-500 font-black animate-pulse text-xl uppercase tracking-widest">{t("loading", "Loading Staff...")}</div></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-emerald-50 border-4 border-emerald-950 border-dashed">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-emerald-300" />
              <p className="font-black text-2xl text-emerald-950 uppercase tracking-widest mb-2">No Staff Found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map(teacher => (
                <div key={teacher.id} className="bg-white border-4 border-emerald-950 p-6 flex flex-col items-center text-center relative hover:bg-emerald-50 transition-colors">
                  <div className="absolute top-4 right-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-10 w-10 flex items-center justify-center bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-2 border-emerald-950 transition-colors">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-4 border-emerald-950 rounded-none bg-white font-bold uppercase tracking-widest text-xs p-2">
                        <DropdownMenuItem onClick={() => {
                          setEditingId(teacher.id);
                          setFormData({ full_name: teacher.name, phone: teacher.phone, email: teacher.email, position: teacher.position, qualifications: teacher.qualifications, subjects: teacher.subjects, department: teacher.department });
                          setShowModal(true);
                        }} className="focus:bg-emerald-100 focus:text-emerald-950 cursor-pointer p-3 mb-1">Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer p-3" onClick={() => {
                          if (window.confirm("Are you sure?")) deleteTeacher.mutate(teacher.id);
                        }}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="w-24 h-24 bg-emerald-500 border-4 border-emerald-950 flex items-center justify-center text-emerald-950 font-black text-3xl mb-6">
                    {teacher.avatar}
                  </div>
                  <h3 className="font-black text-emerald-950 text-2xl tracking-tight mb-1">{teacher.name}</h3>
                  <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-6">{teacher.position}</p>
                  
                  <div className="w-full space-y-3 mt-auto">
                    <div className="flex items-center gap-3 bg-emerald-50 border-2 border-emerald-200 p-3">
                      <div className="w-8 h-8 bg-emerald-950 flex items-center justify-center shrink-0"><GraduationCap className="w-4 h-4 text-emerald-400" /></div>
                      <span className="truncate font-bold text-emerald-800 text-sm">{teacher.qualifications || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-emerald-50 border-2 border-emerald-200 p-3">
                      <div className="w-8 h-8 bg-emerald-950 flex items-center justify-center shrink-0"><Briefcase className="w-4 h-4 text-emerald-400" /></div>
                      <span className="truncate font-bold text-emerald-800 text-sm">{teacher.subjects || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/80 backdrop-blur-sm p-4 font-sans">
          <div className="bg-white border-4 border-emerald-950 w-full max-w-lg p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-black text-emerald-950 uppercase tracking-tight">{editingId ? 'Edit Staff' : 'Add Staff'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-emerald-700 uppercase tracking-widest block mb-2">Full Name</label>
                <input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full px-4 py-3 bg-emerald-50 border-2 border-emerald-950 font-bold text-emerald-950 focus:outline-none focus:ring-4 focus:ring-emerald-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-emerald-700 uppercase tracking-widest block mb-2">Email *</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-emerald-50 border-2 border-emerald-950 font-bold text-emerald-950 focus:outline-none focus:ring-4 focus:ring-emerald-200" />
                </div>
                <div>
                  <label className="text-xs font-black text-emerald-700 uppercase tracking-widest block mb-2">Phone</label>
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-emerald-50 border-2 border-emerald-950 font-bold text-emerald-950 focus:outline-none focus:ring-4 focus:ring-emerald-200" />
                </div>
              </div>
              {!editingId && (
                <div>
                  <label className="text-xs font-black text-emerald-700 uppercase tracking-widest block mb-2">Login Password *</label>
                  <input value={formData.defaultPassword} placeholder="Required for staff login" onChange={e => setFormData({...formData, defaultPassword: e.target.value})} className="w-full px-4 py-3 bg-emerald-50 border-2 border-emerald-950 font-bold text-emerald-950 focus:outline-none focus:ring-4 focus:ring-emerald-200" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-emerald-700 uppercase tracking-widest block mb-2">Department</label>
                  <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-4 py-3 bg-emerald-50 border-2 border-emerald-950 font-bold text-emerald-950 focus:outline-none focus:ring-4 focus:ring-emerald-200">
                    {departments.filter(d => d !== 'All').map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-emerald-700 uppercase tracking-widest block mb-2">Role / Title</label>
                  <input value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full px-4 py-3 bg-emerald-50 border-2 border-emerald-950 font-bold text-emerald-950 focus:outline-none focus:ring-4 focus:ring-emerald-200" placeholder="e.g. Math Teacher" />
                </div>
              </div>
              
              {formData.department === 'Academics' && (
                <>
                  <div>
                    <label className="text-xs font-black text-emerald-700 uppercase tracking-widest block mb-2">Qualifications</label>
                    <input value={formData.qualifications} onChange={e => setFormData({...formData, qualifications: e.target.value})} className="w-full px-4 py-3 bg-emerald-50 border-2 border-emerald-950 font-bold text-emerald-950 focus:outline-none focus:ring-4 focus:ring-emerald-200" placeholder="B.Ed Mathematics" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-emerald-700 uppercase tracking-widest block mb-2">Subjects Taught</label>
                    <input value={formData.subjects} onChange={e => setFormData({...formData, subjects: e.target.value})} className="w-full px-4 py-3 bg-emerald-50 border-2 border-emerald-950 font-bold text-emerald-950 focus:outline-none focus:ring-4 focus:ring-emerald-200" placeholder="Math, Physics" />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-4 pt-4">
              <button className="flex-1 bg-white text-emerald-950 font-black uppercase tracking-widest py-4 border-4 border-emerald-950 hover:bg-emerald-50 transition-colors" onClick={() => setShowModal(false)} disabled={mutateTeacher.isPending}>Cancel</button>
              <button className="flex-1 bg-emerald-500 text-emerald-950 font-black uppercase tracking-widest py-4 border-4 border-emerald-950 hover:bg-emerald-400 transition-colors" onClick={handleSave} disabled={mutateTeacher.isPending}>
                {mutateTeacher.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
