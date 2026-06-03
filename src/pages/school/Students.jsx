import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Users, Search, Plus, GraduationCap, Phone, Mail, Filter, MoreVertical, CheckCircle, XCircle, Clock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { ViewModeToggle, StudentGridCard } from '@/components/school/SchoolViewKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { registerSchoolUser } from "@/api/authUtils";
import { toast } from 'react-hot-toast';
import { useNotifications } from "@/hooks/integrations/useNotifications";
import { useCompanyId } from "@/hooks/useCompanyId";
import { MessageSquare, Settings } from "lucide-react";
import IDFormatSettings from '@/components/school/IDFormatSettings';

const feeColors = { Paid: 'bg-green-100 text-green-700', Owing: 'bg-red-100 text-red-700', Partial: 'bg-amber-100 text-amber-700' };
const statusColors = { Active: 'bg-blue-100 text-blue-700', Suspended: 'bg-red-100 text-red-700', Graduated: 'bg-purple-100 text-purple-700' };

export default function Students() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { notifyTeam } = useNotifications();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('personal');

  // Real Database Hooks
  const queryClient = useQueryClient();
  const { data: records = [], isLoading } = useQuery({ 
    queryKey: ["clients", companyId, "student"], 
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'student' }), 
    enabled: !!companyId 
  });
  
  const mutateStudent = useMutation({
    mutationFn: (data) => data.id ? base44.entities.Client.update(data.id, data) : base44.entities.Client.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients", companyId] })
  });

  const deleteStudent = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients", companyId] })
  });

  const { data: schoolSettings } = useQuery({
    queryKey: ['school_settings', companyId],
    queryFn: async () => {
      const records = await base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'school_settings' });
      let data = { studentPrefix: 'STU', studentIncludeYear: true };
      if (records.length > 0 && records[0].notes) {
        try { data = typeof records[0].notes === 'string' ? JSON.parse(records[0].notes) : records[0].notes; } catch(e) {}
      }
      return data;
    },
    enabled: !!companyId
  });

  // Form State
  const [formData, setFormData] = useState({ 
    firstName: '', lastName: '', email: '', dateOfBirth: '', gender: 'Female', class: 'Grade 7B', 
    parentName: '', parentPhone: '', parentEmail: '', address: '', medicalNotes: '', previousSchool: '', studentId: '', parentId: '', defaultPassword: '', parentPassword: '' 
  });
  const [editingId, setEditingId] = useState(null);
  const [viewDetails, setViewDetails] = useState(null);

  // Map DB records to UI format
  const students = records.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
    return {
      id: r.id,
      name: r.name,
      studentId: r.id_number,
      phone: r.phone,
      status: r.status || 'Active',
      class: extra.class || 'Unknown',
      age: extra.age || 0,
      gender: extra.gender || 'Unknown',
      parent: extra.parent || '',
      feeStatus: extra.feeStatus || 'Unknown',
      avatar: extra.avatar || r.name?.substring(0,2).toUpperCase()
    };
  });

  const classes = ['All', 'Grade 7B', 'Grade 8C', 'Grade 9A', 'Grade 9B', 'Grade 10A', 'Grade 10B', 'Grade 11A', 'Grade 12A'];
  const filtered = students.filter(s =>
    (filterClass === 'All' || s.class === filterClass) &&
    (s.name?.toLowerCase().includes(search.toLowerCase()) || s.studentId?.includes(search))
  );

  const stats = [
    { label: 'Total Students', value: students.length, color: 'bg-blue-500', icon: Users },
    { label: 'Active', value: students.filter(s => s.status === 'Active').length, color: 'bg-green-500', icon: CheckCircle },
    { label: 'Fees Owing', value: students.filter(s => s.feeStatus !== 'Paid').length, color: 'bg-red-500', icon: XCircle },
    { label: 'Classes', value: 8, color: 'bg-purple-500', icon: GraduationCap },
  ];

  const [isEnrolling, setIsEnrolling] = useState(false);

  const handleEnroll = async () => {
    if (!companyId) return toast.error("Workspace not loaded. Refresh the page and try again.");
    const fullName = formData.firstName ? `${formData.firstName} ${formData.lastName}`.trim() : formData.name;
    if (!fullName) return toast.error("Please enter student name");
    
    setIsEnrolling(true);

    try {
      const prefix = schoolSettings?.studentPrefix || 'STU';
      const yearStr = schoolSettings?.studentIncludeYear ? `${new Date().getFullYear()}-` : '';
      const seq = Math.floor(1000 + Math.random() * 9000);
      
      // Auto-generate Parent ID
      const parentPrefix = schoolSettings?.parentPrefix || 'PAR';
      
      if (!formData.firstName || !formData.lastName || !formData.parentName || !formData.defaultPassword || !formData.parentPassword || !formData.email || !formData.parentEmail) {
        toast.error(t("please_fill_required_fields", "Please fill all required fields, including Student Email, Parent Email, and their Passwords."));
        return;
      }

      const studentId = formData.studentId || `${prefix}-${yearStr}${seq}`;
      const parentId = formData.parentId || `${parentPrefix}-${yearStr}${seq}`;
      
      const studentEmail = formData.email.trim().toLowerCase();
      const parentEmail = formData.parentEmail.trim().toLowerCase();
      const defaultPassword = formData.defaultPassword || 'password123';
      const parentPassword = formData.parentPassword || 'password123';
      
      const age = formData.dateOfBirth ? new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear() : formData.age || 0;

      if (!editingId) {
        // Only generate auth accounts on initial creation
        const { error: stuAuthErr } = await registerSchoolUser(studentEmail, defaultPassword, 'student', companyId, fullName);
        if (stuAuthErr && !stuAuthErr.message?.includes('already registered')) {
          throw new Error(`Student Auth Error: ${stuAuthErr.message}`);
        }
        
        const parentFullName = formData.parentName || `Parent of ${fullName}`;
        const { error: parAuthErr } = await registerSchoolUser(parentEmail, parentPassword, 'parent', companyId, parentFullName);
        if (parAuthErr && !parAuthErr.message?.includes('already registered')) {
          throw new Error(`Parent Auth Error: ${parAuthErr.message}`);
        }
      }
      
      const studentPayload = {
        company_id: companyId,
        type: 'student',
        name: fullName,
        id_number: studentId,
        phone: formData.parentPhone,
        status: formData.status || 'active',
        notes: JSON.stringify({
          class: formData.class,
          age,
          gender: formData.gender,
          parent: formData.parentName,
          parentEmail: parentEmail,
          parentId: parentId,
          address: formData.address,
          medicalNotes: formData.medicalNotes,
          previousSchool: formData.previousSchool,
          feeStatus: formData.feeStatus || 'Owing',
          avatar: fullName.substring(0,2).toUpperCase()
        })
      };

      const parentPayload = {
        company_id: companyId,
        type: 'parent',
        name: formData.parentName || `Parent of ${fullName}`,
        id_number: parentId,
        phone: formData.parentPhone,
        status: 'active',
        notes: JSON.stringify({
          email: parentEmail,
          address: formData.address,
          linkedStudentId: studentId,
          avatar: formData.parentName ? formData.parentName.substring(0,2).toUpperCase() : 'PA'
        })
      };

      if (editingId) {
        await base44.entities.Client.update(editingId, studentPayload);
        toast.success("Student updated successfully!");
      } else {
        // Create both records
        await Promise.all([
          base44.entities.Client.create(studentPayload),
          base44.entities.Client.create(parentPayload)
        ]);
        toast.success(`Student & Parent enrolled successfully! IDs: ${studentId} & ${parentId}.`);
      }

      queryClient.invalidateQueries({ queryKey: ["clients", companyId] });
      setShowModal(false);
      setEditingId(null);
      setFormData({ firstName: '', lastName: '', email: '', dateOfBirth: '', gender: 'Female', class: 'Grade 7B', parentName: '', parentPhone: '', parentEmail: '', address: '', medicalNotes: '', previousSchool: '', studentId: '', parentId: '', defaultPassword: '', parentPassword: '' });
      setActiveTab('personal');
    } catch (err) {
      toast.error(err?.message || "Failed to save records");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      deleteStudent.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl border border-white/10 mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">{t("students_directory", "Students Directory")}</h1>
            <p className="text-emerald-100 font-medium text-lg">{t("manage_enrollment", "Manage enrollments, assign classes, and track fees.")}</p>
          </div>
          <div className="flex gap-2 bg-white/10 p-2 rounded-[1.5rem] backdrop-blur-md border border-white/20 shadow-inner">
            <Button variant="ghost" onClick={() => setShowSettings(!showSettings)} className="gap-2 text-white hover:bg-white/20 rounded-xl font-bold">
              <Settings className="w-4 h-4" /> {t("id_settings", "ID Settings")}
            </Button>
            <Button onClick={() => setShowModal(true)} className="gap-2 bg-white text-emerald-900 hover:bg-white/90 rounded-xl font-bold shadow-md">
              <Plus className="w-4 h-4" /> {t("enroll_student", "Enroll Student")}
            </Button>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
          <GraduationCap className="w-64 h-64" />
        </div>
      </div>
      
      {showSettings && <IDFormatSettings />}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${s.color} text-white flex items-center justify-center`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {classes.map(c => {
              return (
                <button key={c} onClick={() => setFilterClass(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterClass === c ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground hover:bg-slate-200'}`}>
                  {c}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
        </div>
      </div>
      {/* Student Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>{t("no_students_found", "No students found")}</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 bg-muted/20">
            {filtered.map(s => (
              <StudentGridCard
                key={s.id}
                student={s}
                onView={() => setViewDetails(s)}
                onEdit={() => {
                  setEditingId(s.id);
                  setFormData({ 
                    ...s, 
                    firstName: s.name?.split(' ')[0] || '', 
                    lastName: s.name?.split(' ').slice(1).join(' ') || '',
                    email: s.email || '',
                    parentName: s.parent || '',
                    parentPhone: s.phone || '',
                    parentEmail: s.parentEmail || '',
                    address: s.address || '',
                    medicalNotes: s.medicalNotes || '',
                    previousSchool: s.previousSchool || '',
                    dateOfBirth: s.dateOfBirth || '',
                  });
                  setShowModal(true);
                }}
                onDelete={() => handleDelete(s.id)}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  {['Student', 'ID', 'Class', 'Age', 'Parent / Guardian', 'Fee Status', 'Status', 'Actions'].map(h => {
                    return (<th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">{h}</th>);
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
              {filtered.map(s => {
                return (
                  <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                          {s.avatar}
                        </div>
                        <div>
                          <p className="font-semibold text-card-foreground">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.gender}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{s.studentId}</td>
                    <td className="px-4 py-3"><Link to={`/classes`} className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded-md hover:underline">{s.class}</Link></td>
                    <td className="px-4 py-3 text-foreground">{s.age} {t("yrs", "yrs")}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-foreground font-medium">{s.parent}</p>
                        <p className="text-xs text-muted-foreground">{s.phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${feeColors[s.feeStatus] || 'bg-gray-100 text-gray-700'}`}>{s.feeStatus}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[s.status] || 'bg-blue-100 text-blue-700'}`}>{s.status}</span></td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => setViewDetails(s)}>{t("view_details", "View Details")}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setEditingId(s.id);
                            setFormData({ 
                              ...s, 
                              firstName: s.name?.split(' ')[0] || '', 
                              lastName: s.name?.split(' ').slice(1).join(' ') || '',
                              email: s.email || '',
                              parentName: s.parent || '',
                              parentPhone: s.phone || '',
                              parentEmail: s.parentEmail || '',
                              address: s.address || '',
                              medicalNotes: s.medicalNotes || '',
                              previousSchool: s.previousSchool || '',
                              dateOfBirth: s.dateOfBirth || '',
                            });
                            setShowModal(true);
                          }}>
                            {t("edit", "Edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 font-medium" onClick={() => handleDelete(s.id)}>{t("delete", "Delete")}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
              </tbody>
      </table>
          </div>
        )}
      </div>
      {/* Tabbed Wizard Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-border flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-card-foreground">{editingId ? 'Edit Student' : 'Enroll Student'}</h2>
              <div className="flex gap-4 mt-4 border-b border-border">
                {['personal', 'academic', 'parent'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 text-sm font-semibold capitalize border-b-2 transition-colors ${
                      activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              {activeTab === 'personal' && (
                <div className="space-y-4 animate-in fade-in zoom-in duration-200">
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{t("student_id", "Student ID")}</label>
                    <Input 
                      value={formData.studentId || "Auto-generated on save"} 
                      readOnly 
                      className="mt-1 bg-transparent border-0 shadow-none font-mono font-bold text-blue-700 px-0 h-6 focus-visible:ring-0" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("first_name", "First Name")}</label><Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="mt-1" /></div>
                    <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("last_name", "Last Name")}</label><Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="mt-1" /></div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase">{t("student_email", "Student Login Email")}</label>
                    <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1" type="email" placeholder="student@example.com" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("dob", "Date of Birth")}</label><Input type="date" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} className="mt-1" /></div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase">{t("gender", "Gender")}</label>
                      <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option>Female</option><option>Male</option><option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("address", "Home Address")}</label><Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="mt-1" /></div>
                    <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("default_password", "Login Password")}</label><Input value={formData.defaultPassword} placeholder="Default: password123" onChange={e => setFormData({...formData, defaultPassword: e.target.value})} className="mt-1" /></div>
                  </div>
                </div>
              )}

              {activeTab === 'academic' && (
                <div className="space-y-4 animate-in fade-in zoom-in duration-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase">{t("class", "Class/Level")}</label>
                      <select value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        {classes.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase">{t("status", "Status")}</label>
                      <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option>Active</option><option>Suspended</option><option>Graduated</option>
                      </select>
                    </div>
                  </div>
                  <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("previous_school", "Previous School")}</label><Input value={formData.previousSchool} onChange={e => setFormData({...formData, previousSchool: e.target.value})} className="mt-1" /></div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase">{t("medical_notes", "Medical Notes")}</label>
                    <textarea value={formData.medicalNotes} onChange={e => setFormData({...formData, medicalNotes: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-20" placeholder="Allergies, conditions..." />
                  </div>
                </div>
              )}

              {activeTab === 'parent' && (
                <div className="space-y-4 animate-in fade-in zoom-in duration-200">
                  <div className="bg-purple-50/50 dark:bg-purple-900/10 p-3 rounded-xl border border-purple-100 dark:border-purple-900/30">
                    <label className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">{t("parent_id", "Parent ID")}</label>
                    <Input 
                      value={formData.parentId || "Auto-generated on save"} 
                      readOnly 
                      className="mt-1 bg-transparent border-0 shadow-none font-mono font-bold text-purple-700 px-0 h-6 focus-visible:ring-0" 
                    />
                  </div>
                  <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("parent_name", "Parent/Guardian Name")}</label><Input value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} className="mt-1" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("parent_phone", "Parent Phone")}</label><Input value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} className="mt-1" /></div>
                    <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("parent_email", "Parent Email")}</label><Input value={formData.parentEmail} onChange={e => setFormData({...formData, parentEmail: e.target.value})} className="mt-1" type="email" /></div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase">{t("parent_password", "Parent Login Password")} *</label>
                    <Input value={formData.parentPassword} onChange={e => setFormData({...formData, parentPassword: e.target.value})} className="mt-1" type="text" placeholder="Required for parent login" />
                    {!editingId && <p className="text-[10px] text-muted-foreground mt-1">This will be the password the parent uses to log in.</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border bg-muted/30 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setActiveTab('personal'); }} disabled={isEnrolling}>{t("cancel", "Cancel")}</Button>
              {activeTab !== 'parent' ? (
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setActiveTab(activeTab === 'personal' ? 'academic' : 'parent')}>{t("next", "Next")}</Button>
              ) : (
                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleEnroll} disabled={isEnrolling}>
                  {isEnrolling ? 'Saving...' : 'Save Student & Parent'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* View Details Sheet */}
      <Sheet open={!!viewDetails} onOpenChange={(open) => !open && setViewDetails(null)}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t("student_details", "Student Details")}</SheetTitle>
            <SheetDescription>{t("comprehensive_view_of_student_", "Comprehensive view of student records.")}</SheetDescription>
          </SheetHeader>
          {viewDetails && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
                  {viewDetails.avatar}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-card-foreground">{viewDetails.name}</h3>
                  <p className="text-sm text-muted-foreground">{viewDetails.studentId}</p>
                  <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusColors[viewDetails.status] || 'bg-blue-100 text-blue-700'}`}>
                    {viewDetails.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("class", "Class")}</p>
                  <Link to="/classes" className="text-primary hover:underline font-medium">{viewDetails.class}</Link>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("age", "Age")}</p>
                  <p className="font-medium text-foreground">{viewDetails.age} {t("yrs", "yrs")}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("gender", "Gender")}</p>
                  <p className="font-medium text-foreground">{viewDetails.gender}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("fee_status", "Fee Status")}</p>
                  <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${feeColors[viewDetails.feeStatus] || 'bg-gray-100 text-gray-700'}`}>
                    {viewDetails.feeStatus}
                  </span>
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-xl border border-border">
                <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Phone className="w-4 h-4"/> {t("guardian_info", "Guardian Info")}</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">{t("name", "Name:")}</span> {viewDetails.parent}</p>
                  <p><span className="text-muted-foreground">{t("phone", "Phone:")}</span> {viewDetails.phone}</p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
