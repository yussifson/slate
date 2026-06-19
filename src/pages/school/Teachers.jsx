import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Users, Search, Plus, Mail, Phone, MoreVertical, Briefcase, GraduationCap, Calendar, CheckSquare, ListTodo, ClipboardCheck } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { registerSchoolUser } from '@/api/authUtils';

export default function Teachers() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      {/* Header & Nav */}
      <div className="border-b border-primary/40 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">
            Faculty <span className="text-[var(--primary)]">Hub</span>
          </h1>
          <p className="text-[var(--color-text-secondary)] font-medium mt-1 text-sm">Manage staff records & daily command center.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {['command_center', 'directory'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-5 py-2.5 font-semibold text-sm transition-colors rounded-md-full whitespace-nowrap ${activeTab === tab ? 'bg-[var(--primary)] text-white' : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--primary)]'}`}>
              {tab === 'command_center' ? <ClipboardCheck className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              <span className="capitalize">{tab.replace('_', ' ')}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'command_center' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 flex flex-col justify-center relative overflow-hidden stat-card-premium hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-12 h-12 rounded-md-[var(--radius-lg)] flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)' }}>
                  <Calendar className="w-6 h-6 text-[var(--primary)]" />
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)] text-sm">Today's Classes</h3>
              </div>
              <p className="text-[var(--text-3xl)] font-display font-semibold text-[var(--color-text-primary)] mb-1 relative z-10 tracking-tight tracking-[-0.02em]">4</p>
              <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] relative z-10 tracking-[0.04em]">Periods Scheduled</p>
            </div>
            
            <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 flex flex-col justify-center relative overflow-hidden stat-card-premium hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-12 h-12 rounded-md-[var(--radius-lg)] flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, transparent)' }}>
                  <CheckSquare className="w-6 h-6 text-[var(--color-warning)]" />
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)] text-sm">Pending Grading</h3>
              </div>
              <p className="text-[var(--text-3xl)] font-display font-semibold text-[var(--color-warning)] mb-1 relative z-10 tracking-tight tracking-[-0.02em]">12</p>
              <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)] relative z-10 tracking-[0.04em]">Assignments to review</p>
            </div>

            <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-md-[var(--radius-lg)] flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-info) 15%, transparent)' }}>
                  <ListTodo className="w-6 h-6 text-[var(--color-info)]" />
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)] text-sm">Action Items</h3>
              </div>
              <div className="space-y-3 mt-2">
                <Button className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-md-full">Take Attendance</Button>
                <Button variant="outline" className="w-full border-primary/40 text-[var(--primary)] rounded-md-full hover:bg-[var(--primary)] hover:text-white">Post Notice</Button>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden">
            <div className="p-6 border-b border-primary/20 bg-[var(--color-surface-1)]">
              <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--primary)]" /> Today's Timetable
              </h3>
            </div>
            <div className="divide-y divide-primary/10">
              {[
                { time: '08:00 AM', subject: 'Mathematics (Grade 10)', room: 'Room 302' },
                { time: '10:30 AM', subject: 'Advanced Calculus', room: 'Lab 4' },
                { time: '01:00 PM', subject: 'Physics 101', room: 'Room 305' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-5 hover:bg-[var(--color-surface-2)] transition-colors">
                  <div className="w-24 shrink-0 text-center font-semibold text-[var(--primary)] bg-[var(--primary)]/10 rounded-md-[var(--radius-md)] py-1.5 text-xs tracking-[0.04em]">
                    {item.time}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[var(--color-text-primary)]">{item.subject}</p>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{item.room}</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-md-full border-primary/30 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white">Start</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'directory' && (
        <div className="space-y-6">
          {/* Search & Filter */}
          <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
              <Input placeholder="Search directory..." value={search} onChange={e => setSearch(e.target.value)} className="pl-12 rounded-md-full border-primary/30 bg-[var(--color-surface-1)] h-11" />
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                {departments.map(d => (
                  <button
                    key={d}
                    onClick={() => setDepartmentFilter(d)}
                    className={`px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors rounded-md-full ${departmentFilter === d ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <Button onClick={() => { setEditingId(null); setFormData({ full_name: '', email: '', phone: '', department: 'Academics', position: 'Teacher', qualifications: '', subjects: '', defaultPassword: ''}); setShowModal(true); }} className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-md-full shrink-0">
                <Plus className="w-4 h-4 mr-2" /> Add Staff
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center"><div className="text-[var(--primary)] font-semibold animate-pulse text-lg">{t("loading", "Loading Staff...")}</div></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-dashed border-primary/30 rounded-md-[var(--radius-xl)]">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-tertiary)]" />
              <p className="font-semibold text-[var(--color-text-primary)] text-lg mb-2">No Staff Found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map(teacher => (
                <div key={teacher.id} className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 flex flex-col items-center text-center relative hover:border-[var(--primary)]/50 transition-colors">
                  <div className="absolute top-4 right-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 rounded-md-full flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-md-[var(--radius-lg)] bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/20">
                        <DropdownMenuItem onClick={() => {
                          setEditingId(teacher.id);
                          setFormData({ full_name: teacher.name, phone: teacher.phone, email: teacher.email, position: teacher.position, qualifications: teacher.qualifications, subjects: teacher.subjects, department: teacher.department });
                          setShowModal(true);
                        }} className="cursor-pointer">Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-[var(--color-destructive)] focus:text-[var(--color-destructive)] cursor-pointer" onClick={() => {
                          if (window.confirm("Are you sure?")) deleteTeacher.mutate(teacher.id);
                        }}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="w-20 h-20 rounded-md-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-semibold text-2xl mb-4 border-[0.5px] border-black/9 dark:border-white/8 border-[var(--primary)]/20 tracking-[-0.02em]">
                    {teacher.avatar}
                  </div>
                  <h3 className="font-display font-semibold text-[var(--color-text-primary)] text-xl tracking-tight mb-1">{teacher.name}</h3>
                  <p className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[var(--tracking-widest)] mb-6 tracking-[0.04em]">{teacher.position}</p>
                  
                  <div className="w-full space-y-2 mt-auto">
                    <div className="flex items-center gap-3 bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 rounded-md-[var(--radius-lg)] p-2.5">
                      <div className="w-8 h-8 rounded-md-[var(--radius-md)] bg-[var(--primary)]/10 flex items-center justify-center shrink-0"><GraduationCap className="w-4 h-4 text-[var(--primary)]" /></div>
                      <span className="truncate font-medium text-[var(--color-text-secondary)] text-sm">{teacher.qualifications || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 rounded-md-[var(--radius-lg)] p-2.5">
                      <div className="w-8 h-8 rounded-md-[var(--radius-md)] bg-[var(--primary)]/10 flex items-center justify-center shrink-0"><Briefcase className="w-4 h-4 text-[var(--primary)]" /></div>
                      <span className="truncate font-medium text-[var(--color-text-secondary)] text-sm">{teacher.subjects || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-sans">
          <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] w-full max-w-lg p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-xl">
            <h2 className="text-xl font-display font-semibold text-[var(--color-text-primary)] tracking-tight">{editingId ? 'Edit Staff' : 'Add Staff'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Full Name</label>
                <Input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="rounded-md-[var(--radius-lg)]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Email *</label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="rounded-md-[var(--radius-lg)]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Phone</label>
                  <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="rounded-md-[var(--radius-lg)]" />
                </div>
              </div>
              {!editingId && (
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Login Password *</label>
                  <Input value={formData.defaultPassword} placeholder="Required for staff login" onChange={e => setFormData({...formData, defaultPassword: e.target.value})} className="rounded-md-[var(--radius-lg)]" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Department</label>
                  <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full flex h-10 w-full rounded-md-[var(--radius-lg)] border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-[#71717a] dark:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ease-out hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/10">
                    {departments.filter(d => d !== 'All').map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Role / Title</label>
                  <Input value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="rounded-md-[var(--radius-lg)]" placeholder="e.g. Math Teacher" />
                </div>
              </div>
              
              {formData.department === 'Academics' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Qualifications</label>
                    <Input value={formData.qualifications} onChange={e => setFormData({...formData, qualifications: e.target.value})} className="rounded-md-[var(--radius-lg)]" placeholder="B.Ed Mathematics" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 tracking-[0.04em]">Subjects Taught</label>
                    <Input value={formData.subjects} onChange={e => setFormData({...formData, subjects: e.target.value})} className="rounded-md-[var(--radius-lg)]" placeholder="Math, Physics" />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1 rounded-md-full border-primary/30" onClick={() => setShowModal(false)} disabled={mutateTeacher.isPending}>Cancel</Button>
              <Button className="flex-1 rounded-md-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white" onClick={handleSave} disabled={mutateTeacher.isPending}>
                {mutateTeacher.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
