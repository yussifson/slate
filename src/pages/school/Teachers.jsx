import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Users, Search, Plus, Mail, Phone, MoreVertical, Briefcase, GraduationCap, MapPin, Calendar } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { ViewModeToggle, ClassGridCard, ModuleBanner } from '@/components/school/SchoolViewKit';
import { registerSchoolUser } from '@/api/authUtils';

export default function Teachers() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

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

  // Since we use the generic Employee table, we filter for academics/teachers
  const teachers = records.filter(r => r.department === 'Academics' || r.position?.toLowerCase().includes('teacher')).map(r => {
    let extra = {};
    try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
    return {
      id: r.id,
      name: r.full_name,
      email: r.email,
      phone: r.phone,
      position: r.position || 'Teacher',
      qualifications: extra.qualifications || 'B.Ed',
      subjects: extra.subjects || 'General',
      avatar: r.full_name?.substring(0,2).toUpperCase(),
      status: r.status || 'Active'
    };
  });

  const filtered = teachers.filter(teacher =>
    teacher.name?.toLowerCase().includes(search.toLowerCase()) || 
    teacher.subjects?.toLowerCase().includes(search.toLowerCase())
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
        if (authErr.message?.includes('already registered')) {
          return toast.error(`Email (${email}) is already registered! Please use a unique email.`);
        }
        return toast.error(`Teacher Auth Error: ${authErr.message}`);
      }
    }

    const payload = {
      company_id: companyId,
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      department: 'Academics',
      position: formData.position,
      status: 'Active',
      notes: JSON.stringify({
        qualifications: formData.qualifications,
        subjects: formData.subjects
      })
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

    if (editingId) {
      mutateTeacher.mutate({ id: editingId, ...payload }, onDone);
    } else {
      mutateTeacher.mutate(payload, onDone);
    }
  };

  return (
    <div className="space-y-6">
      <ModuleBanner
        title={t("teachers_staff", "Teachers & Staff")}
        subtitle={t("manage_academic_staff", "Manage academic staff, subjects, and qualifications")}
        metrics={[
          { title: "Total Teachers", value: teachers.length, icon: Users },
          { title: "Departments", value: new Set(teachers.map(t => t.department)).size || 1, icon: Briefcase },
          { title: "Active", value: teachers.filter(t => t.status === 'Active').length, icon: Users },
          { title: "On Leave", value: teachers.filter(t => t.status === 'On Leave').length, icon: Calendar }
        ]}
      />
      
      {/* Search */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or subject..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-3">
          <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
          <Button onClick={() => setShowModal(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4" /> {t("add_teacher", "Add Teacher")}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">{t("loading", "Loading...")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-600" />
          <p className="font-semibold text-lg text-card-foreground">{t("no_teachers_found", "No teachers found")}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(teacher => (
            <div key={teacher.id} className="bg-card/60 backdrop-blur-md rounded-3xl border border-border/60 p-6 shadow-sm  hover:-translate-y-1.5 transition-all duration-300 group relative overflow-hidden flex flex-col items-center text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 via-transparent to-transparent dark:from-emerald-900/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 bg-background/50 hover:bg-background/80 shadow-sm backdrop-blur-sm rounded-full">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setEditingId(teacher.id);
                      setFormData({ full_name: teacher.name, phone: teacher.phone, email: teacher.email, position: teacher.position, qualifications: teacher.qualifications, subjects: teacher.subjects });
                      setShowModal(true);
                    }}>{t("edit", "Edit")}</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600 font-medium" onClick={() => {
                      if (window.confirm("Are you sure?")) deleteTeacher.mutate(teacher.id);
                    }}>{t("delete", "Delete")}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="w-20 h-20 rounded-[1.25rem] bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border border-white/50 shadow-inner flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-black text-2xl mb-4 group-hover:scale-105 transition-transform duration-300 relative z-10">
                {teacher.avatar}
              </div>
              <h3 className="font-extrabold text-card-foreground text-xl tracking-tight group-hover:text-emerald-600 transition-colors relative z-10">{teacher.name}</h3>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4 opacity-90 relative z-10">{teacher.position}</p>
              
              <div className="w-full space-y-2 mt-auto relative z-10">
                <div className="flex items-center gap-3 text-xs text-muted-foreground bg-slate-50/50 dark:bg-slate-900/50 border border-border/50 p-2.5 rounded-xl shadow-sm">
                  <div className="w-6 h-6 rounded-md bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm shrink-0"><GraduationCap className="w-3.5 h-3.5 text-emerald-500" /></div>
                  <span className="truncate font-medium">{teacher.qualifications}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground bg-slate-50/50 dark:bg-slate-900/50 border border-border/50 p-2.5 rounded-xl shadow-sm">
                  <div className="w-6 h-6 rounded-md bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm shrink-0"><Briefcase className="w-3.5 h-3.5 text-emerald-500" /></div>
                  <span className="truncate font-medium">{teacher.subjects}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Subjects</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Contact</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                        {p.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-card-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.position}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs font-medium">{p.subjects}</td>
                  <td className="px-4 py-3">
                    <p className="text-foreground text-xs flex items-center gap-1"><Phone className="w-3 h-3"/> {p.phone}</p>
                    <p className="text-muted-foreground text-xs flex items-center gap-1"><Mail className="w-3 h-3"/> {p.email}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditingId(p.id);
                          setFormData({ full_name: p.name, phone: p.phone, email: p.email, position: p.position, qualifications: p.qualifications, subjects: p.subjects });
                          setShowModal(true);
                        }}>{t("edit", "Edit")}</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 font-medium" onClick={() => {
                          if (window.confirm("Are you sure?")) deleteTeacher.mutate(p.id);
                        }}>{t("delete", "Delete")}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-sm w-full max-w-md p-6 space-y-4 border border-border max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-lg font-bold text-card-foreground">{editingId ? 'Edit Teacher' : 'Add Teacher'}</h2>
            <div className="space-y-3">
              <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("full_name", "Full Name")}</label><Input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("email", "Email")} *</label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1" /></div>
                <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("phone", "Phone")}</label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-1" /></div>
              </div>
              {!editingId && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("default_password", "Login Password")} *</label>
                  <Input value={formData.defaultPassword} placeholder="Required for teacher login" onChange={e => setFormData({...formData, defaultPassword: e.target.value})} className="mt-1" />
                </div>
              )}
              <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("position", "Position")}</label><Input value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="mt-1" placeholder="Senior Teacher" /></div>
              <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("qualifications", "Qualifications")}</label><Input value={formData.qualifications} onChange={e => setFormData({...formData, qualifications: e.target.value})} className="mt-1" placeholder="B.Ed Mathematics" /></div>
              <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("subjects_taught", "Subjects Taught")}</label><Input value={formData.subjects} onChange={e => setFormData({...formData, subjects: e.target.value})} className="mt-1" placeholder="Math, Physics" /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)} disabled={mutateTeacher.isPending}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave} disabled={mutateTeacher.isPending}>
                {mutateTeacher.isPending ? 'Saving...' : 'Save Teacher'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
