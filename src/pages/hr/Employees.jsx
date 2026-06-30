import { useTranslation} from "react-i18next";
import { INDUSTRIES } from "@/config/industries";
import { useCompany } from "@/hooks/useCompanyId";
import { useState, useEffect } from 'react';
import { Users, Search, Plus, Mail, Phone, Briefcase, Trash2, MoreVertical, Edit, Eye, Network} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import { Link} from 'react-router-dom';
import { useNotifications} from '@/hooks/integrations/useNotifications';
import { useAuth} from '@/lib/AuthContext';
import { base44 } from "@/api/base44Client";
import { supabase } from "@/api/supabaseClient";
import { usePowerSync } from '@powersync/react';

const OrgNode = ({ employee, allEmployees }) => {
 const children = allEmployees.filter(e => e.reportsTo === employee.id);
 return (
 <div className="flex flex-col items-center">
 <div className="p-4 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm bg-card hover:border-primary/50 transition-colors w-48 relative z-10 flex flex-col items-center text-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg mb-2">
 {employee.name?.charAt(0).toUpperCase()}
 </div>
 <p className="font-semibold text-sm text-foreground truncate w-full">{employee.name}</p>
 <p className="text-xs text-primary font-medium truncate w-full tracking-[0.04em]">{employee.role}</p>
 <p className="text-[10px] text-[#71717a] dark:text-gray-400 uppercase tracking-wider truncate w-full mt-1 tracking-[0.04em]">{employee.departmentName}</p>
 </div>
 {children.length > 0 && (
 <div className="flex gap-6 pt-6 mt-0 border-t-2 border-primary/20 relative">
 <div className="absolute top-0 left-1/2 w-0.5 h-6 bg-primary/20 -translate-y-full"></div>
 <div className="absolute top-0 left-[calc(50%-1px)] w-0.5 h-6 bg-primary/20"></div>
 {children.map(c => <div key={c.id} className="relative pt-6"><div className="absolute top-0 left-1/2 w-0.5 h-6 bg-primary/20 -translate-x-1/2"></div><OrgNode employee={c} allEmployees={allEmployees} /></div>)}
 </div>
 )}
 </div>
 );
};

export default function Employees() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const { notifyTeam} = useNotifications();
  const powerSync = usePowerSync();
  const companyId = user?.company_id;
 
  const [dbRecords, setDbRecords] = useState([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const fetchEmps = async () => {
      setIsDbLoading(true);
      try {
        const res = await powerSync.execute('SELECT * FROM univ_hr_employees WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
        if(active) setDbRecords(res.rows._array || Array.from(res.rows));
      } catch(e){}
      setIsDbLoading(false);
    };
    if (companyId) fetchEmps();
    return () => { active = false; };
  }, [companyId]);
        
 const [departmentRecords, setDepartmentRecords] = useState([]);
  const [roleRecords, setRoleRecords] = useState([]);
  useEffect(() => {
    let active = true;
    const fetchRoles = async () => {
      try {
        const res = await powerSync.execute('SELECT * FROM platform_roles WHERE company_id = ?', [companyId]);
        if(active) setRoleRecords(res.rows._array || Array.from(res.rows));
      } catch(e){}
    };
    if (companyId) fetchRoles();
    return () => { active = false; };
  }, [companyId]);
  useEffect(() => {
    let active = true;
    const fetchDepts = async () => {
      try {
        const res = await powerSync.execute('SELECT * FROM platform_departments WHERE company_id = ?', [companyId]);
        if(active) setDepartmentRecords(res.rows._array || Array.from(res.rows));
      } catch(e){}
    };
    if (companyId) fetchDepts();
    return () => { active = false; };
  }, [companyId]);
 const employees = dbRecords.map(r => ({
  id: r.id,
  status: r.status || 'Active',
  employeeId: r.employee_id || r.id.substring(0,6),
  name: r.name,
  departmentId: r.department_id,
  role: r.role,
  roleName: roleRecords.find(ro => ro.id === r.role)?.name || r.role,
  email: r.email,
  phone: r.phone,
  salary: r.salary,
  reportsTo: r.reports_to,
  startDate: r.start_date,
  departmentName: departmentRecords.find(d => d.id === r.department_id)?.name || 'Unassigned',
  reportsToName: dbRecords.find(s => s.id === r.reports_to)?.name || 'None'
}));

 const [search, setSearch] = useState('');
 const [showModal, setShowModal] = useState(false);
  const { company } = useCompany();
  const activeIndustry = company?.industry_type || "law";
  const predefinedRoles = INDUSTRIES[activeIndustry]?.roles || [];
  const predefinedDepts = INDUSTRIES[activeIndustry]?.departments || [];
  const [useCustomRole, setUseCustomRole] = useState(false);
  const [useCustomDept, setUseCustomDept] = useState(false);
 const [deleteTargetId, setDeleteTargetId] = useState(null);
 const [editTargetId, setEditTargetId] = useState(null);
 const [viewTargetId, setViewTargetId] = useState(null);
 const [activeTab, setActiveTab] = useState('list');

 const [formData, setFormData] = useState({
 name: '',
 departmentId: '',
 reportsTo: '',
 role: '',
 email: '',
 phone: '',
 salary: '',
 startDate: new Date().toISOString().split('T')[0]
});
 const [password, setPassword] = useState('');
 const [isSubmitting, setIsSubmitting] = useState(false);

 const [createAccount, setCreateAccount] = useState(true);

 const handleCreateOrUpdateEmployee = async () => {
 if (!formData.name.trim()) return toast.error("Please enter a name");
 if (!editTargetId && createAccount && !password) return toast.error("Please provide a temporary password for the account");
 
 setIsSubmitting(true);
 try {
   if (editTargetId) {
     const emp = employees.find(e => e.id === editTargetId);
     const payload = { ...formData, employeeId: emp.employeeId};
     
     
        const _k = Object.keys(payload);
        const _v = Object.values(payload);
        await powerSync.execute(`UPDATE univ_hr_employees SET ${_k.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._v, editTargetId]);
        
     
     toast.success('Employee updated successfully!');
     setShowModal(false);
     setEditTargetId(null);
     setFormData({ name: '', departmentId: '', reportsTo: '', role: '', email: '', phone: '', salary: '', startDate: new Date().toISOString().split('T')[0] });
     setPassword('');
   } else {
     const employeeId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
     
     let finalRole = formData.role || 'staff';
     if (useCustomRole && formData.role && !roleRecords.find(r => r.name === formData.role)) {
         await powerSync.execute('INSERT INTO platform_roles (id, company_id, name, description) VALUES (uuid(), ?, ?, ?)', [user?.company_id, formData.role, formData.role]);
     }
     
     // Auto-save custom department
     let finalDeptId = formData.departmentId;
     if (useCustomDept && formData.departmentId && !departmentRecords.find(d => d.name === formData.departmentId)) {
         const newDeptId = crypto.randomUUID();
         await powerSync.execute("INSERT INTO platform_departments (id, company_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))", [newDeptId, user?.company_id, formData.departmentId, formData.departmentId]);
         finalDeptId = newDeptId;
     }

     let authUserId = null;
     if (createAccount) {
       try {
         const reg = await base44.auth.register({
           email: formData.email,
           password: password,
           company_id: user?.company_id,
           role: finalRole
         });
         authUserId = reg?.user?.id;
       } catch (err) {
         throw new Error("Failed to create user account: " + err.message);
       }
     }
     
     const newId = crypto.randomUUID();
     const payload = { id: newId, company_id: user?.company_id, ...formData, role: finalRole, departmentId: finalDeptId, employeeId, user_id: authUserId || null, created_at: new Date().toISOString() };
    
     const _k = Object.keys(payload);
     const _v = Object.values(payload);
     await powerSync.execute(`INSERT INTO univ_hr_employees (${_k.join(', ')}) VALUES (${_k.map(()=>'?').join(', ')})`, _v);
     
     if (authUserId) {
       await supabase.from("staff_records").update({ user_id: authUserId }).eq("company_id", user?.company_id).ilike("user_email", formData.email);
     }
     
     toast.success(createAccount ? 'Employee added and account created successfully!' : 'Employee added successfully!');
     notifyTeam({ companyId: user?.company_id, provider: 'slack', message: `New employee onboarded: ${formData.name} as ${formData.role}`, channel: '#general'}).catch(console.error);
     powerSync.execute(`INSERT INTO univ_notifications (id, company_id, created_at, title, message, type, read) VALUES (?, ?, ?, ?, ?, ?, ?)`, [crypto.randomUUID(), user?.company_id, new Date().toISOString(), "New Hire", `${formData.name} was onboarded as ${formData.role}`, "info", 0]).catch(console.error);
     setShowModal(false);
     setFormData({ name: '', departmentId: '', reportsTo: '', role: '', email: '', phone: '', salary: '', startDate: new Date().toISOString().split('T')[0] });
     setPassword('');
     setCreateAccount(true);
   }
 } catch (err) {
   toast.error(err.message || 'An error occurred');
 } finally {
   setIsSubmitting(false);
 }
};

 const openEdit = (emp) => {
 setFormData({
 name: emp.name || '',
 departmentId: emp.departmentId || '',
 reportsTo: emp.reportsTo || '',
 role: emp.role || '',
 email: emp.email || '',
 phone: emp.phone || '',
 salary: emp.salary || '',
 startDate: emp.startDate || new Date().toISOString().split('T')[0]
});
 setEditTargetId(emp.id);
 setShowModal(true);
};

 const openAdd = () => {
 setFormData({
 name: '', departmentId: '', reportsTo: '', role: '', email: '', phone: '', salary: '', startDate: new Date().toISOString().split('T')[0]
});
 setEditTargetId(null);
 setShowModal(true);
};

 const handleUpdateStatus = (employee, newStatus) => {
 const payload = { ...employee};
 delete payload.id;
 delete payload.status;
 delete payload.departmentName;
 delete payload.reportsToName;
 
 mutateRecord.mutate({
 id: employee.id,
 recordType: 'staff',
 payload,
 status: newStatus,
 searchText: `${employee.name} ${employee.employeeId}`
}, {
 onSuccess: () => toast.success(`Status updated to ${newStatus}`)
});
};

 const handleDeleteEmployee = () => {
 if (!deleteTargetId) return;
 deleteRecord.mutate(deleteTargetId, {
 onSuccess: () => {
 toast.success('Employee removed successfully!');
 setDeleteTargetId(null);
},
 onError: (err) => {
 toast.error('Failed to remove employee: ' + err.message);
 setDeleteTargetId(null);
}
});
};

 const filtered = employees.filter(e => 
 e.name?.toLowerCase().includes(search.toLowerCase()) || 
 e.departmentName?.toLowerCase().includes(search.toLowerCase()) ||
 e.employeeId?.toLowerCase().includes(search.toLowerCase())
 );

 const totalStaff = employees.length;
 const activeStaff = employees.filter(e => e.status === 'Active').length;
 const onLeave = employees.filter(e => e.status === 'On Leave').length;
 const departmentsCount = new Set(employees.map(e => e.departmentId).filter(Boolean)).size;

 return (
 <div className="space-y-6 school-page-enter font-dmsans">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("employees", "Employees")}</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t("manage_staff_profiles_and_dire", "Manage staff profiles and directories")}</p>
 </div>
 <div className="flex gap-2">
 <div className="bg-muted p-1 rounded-xl flex">
 <button onClick={() => setActiveTab('list')} className={`px-4 py-1.5 text-sm font-semibold rounded-xl transition-all ${activeTab === 'list' ? 'bg-background shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm text-foreground' : 'text-[#71717a] dark:text-gray-400 hover:text-foreground'}`}><Users className="w-4 h-4 inline-block mr-1.5" /> List</button>
 <button onClick={() => setActiveTab('org')} className={`px-4 py-1.5 text-sm font-semibold rounded-xl transition-all ${activeTab === 'org' ? 'bg-background shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm text-foreground' : 'text-[#71717a] dark:text-gray-400 hover:text-foreground'}`}><Network className="w-4 h-4 inline-block mr-1.5" /> Org Chart</button>
 </div>
 <Button onClick={openAdd} className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl">
 <Plus className="w-4 h-4" /> {t("add_employee", "Add Employee")}
 </Button>
 </div>
 </div>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="stat-card-premium bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 flex items-center gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary">
 <Users className="w-5 h-5" />
 </div>
 <div>
 <p className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{totalStaff}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("total_staff", "Total Staff")}</p>
 </div>
 </div>
 <div className="stat-card-premium bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 flex items-center gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary">
 <Users className="w-5 h-5" />
 </div>
 <div>
 <p className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{activeStaff}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("active_staff", "Active Staff")}</p>
 </div>
 </div>
 <div className="stat-card-premium bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 flex items-center gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
 <Users className="w-5 h-5" />
 </div>
 <div>
 <p className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{onLeave}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("on_leave", "On Leave")}</p>
 </div>
 </div>
 <div className="stat-card-premium bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 flex items-center gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary">
 <Briefcase className="w-5 h-5" />
 </div>
 <div>
 <p className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{departmentsCount}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("departments", "Departments")}</p>
 </div>
 </div>
 </div>
  <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200 flex flex-col">
  <div className="p-4 border-b border-primary/40 bg-muted/50 shrink-0">
  <div className="relative max-w-md">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
  <Input placeholder="Search employee name or department..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
  </div>
  </div>
  <div className="overflow-x-auto w-full">
 {isDbLoading ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400">{t("loading_employees", "Loading employees...")}</div>
 ) : filtered.length === 0 ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400">
 <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
 <p className="font-semibold text-lg text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("no_employees_found", "No employees found")}</p>
 <p className="text-xs mt-1 tracking-[0.04em]">{t(
 "add_your_first_employee_to_get",
 "Add your first employee to get started."
 )}</p>
 </div>
 ) : activeTab === 'org' ? (
 <div className="p-8 overflow-auto min-h-[500px] flex justify-center bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar">
 {employees.filter(e => !e.reportsTo || e.reportsTo === '' || e.reportsTo === 'None' || !employees.find(x => x.id === e.reportsTo)).map(root => (
 <div key={root.id} className="mx-8"><OrgNode employee={root} allEmployees={employees} /></div>
 ))}
 {employees.length > 0 && employees.filter(e => !e.reportsTo || e.reportsTo === '' || e.reportsTo === 'None' || !employees.find(x => x.id === e.reportsTo)).length === 0 && (
 <div className="text-center text-[#71717a] dark:text-gray-400 mt-20">Could not find any root employees (no manager).</div>
 )}
 </div>
 ) : (
 <table className="w-full text-sm">
 <thead className="bg-card border-b border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <tr>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("employee", "Employee")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("role_department", "Role & Department")}</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("contact_info", "Contact Info")}</th>
 <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("status", "Status")}</th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("action", "Action")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map(emp => {
 return (
 <tr key={emp.id} className="hover:bg-muted/50 transition-colors">
 <td className="px-6 py-4">
 <p className="font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{emp.name}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 mt-0.5 tracking-[0.04em]">{emp.employeeId}</p>
 </td>
 <td className="px-6 py-4">
 <p className="font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{emp.roleName}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 flex items-center gap-2 mt-0.5 tracking-[0.04em]"><Briefcase className="w-3 h-3"/> {emp.departmentName}</p>
 {emp.reportsToName !== 'None' && (
 <p className="text-[10px] text-[#71717a] dark:text-gray-400/80 mt-1 uppercase tracking-wider font-semibold tracking-[0.04em]">Reports to: {emp.reportsToName}</p>
 )}
 </td>
 <td className="px-6 py-4 text-[#71717a] dark:text-gray-400 space-y-1">
 <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5"/> {emp.email}</div>
 <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5"/> {emp.phone}</div>
 </td>
 <td className="px-6 py-4 text-center">
 <select
 value={emp.status}
 onChange={e => handleUpdateStatus(emp, e.target.value)}
 className="rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-2 py-1 text-xs font-semibold tracking-[0.04em]"
 >
 <option>{t("active", "Active")}</option>
 <option>{t("on_leave", "On Leave")}</option>
 <option>{t("terminated", "Terminated")}</option>
 </select>
 </td>
 <td className="px-6 py-4 text-right">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" className="h-8 w-8 p-0">
 <span className="sr-only">{t("open_menu", "Open menu")}</span>
 <MoreVertical className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => setViewTargetId(emp.id)}>
 <Eye className="mr-2 h-4 w-4" />
 {t("view_details", "View Details")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => openEdit(emp)}>
 <Edit className="mr-2 h-4 w-4" />
 {t("edit", "Edit")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setDeleteTargetId(emp.id)} className="text-red-600">
 <Trash2 className="mr-2 h-4 w-4" />
 {t("delete", "Delete")}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </td>
 </tr>
 );
})}
 </tbody>
 </table>
 )}
 </div>
 </div>
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 max-h-[90vh] flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-semibold text-card-foreground flex-shrink-0 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{editTargetId ? 'Edit Employee' : 'Add Employee'}</h2>
 <div className="space-y-3 overflow-y-auto flex-1 pr-2">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("full_name", "Full Name")}</label>
 <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Alice Johnson" className="mt-1" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("email", "Email")}</label>
 <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="alice@example.com" className="mt-1" disabled={!!editTargetId} />
 </div>
  {!editTargetId && (
    <div className="space-y-3 p-3 bg-muted/30 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/20">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
        <input 
          type="checkbox" 
          checked={createAccount} 
          onChange={e => setCreateAccount(e.target.checked)}
          className="w-4 h-4 rounded text-primary focus:ring-primary border-primary/50"
        />
        Create User Login Account
      </label>
      
      {createAccount && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Temporary Password *</label>
          <Input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" className="mt-1 bg-background" />
        </div>
      )}
    </div>
  )}
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("phone", "Phone")}</label>
 <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+1 234 567 8900" className="mt-1" />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <div className="flex justify-between items-center">
    <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("department", "Department")}</label>
    <button type="button" onClick={() => setUseCustomDept(!useCustomDept)} className="text-[10px] text-primary hover:underline font-semibold">{useCustomDept ? 'Select Predefined' : 'Add Custom'}</button>
 </div>
 {useCustomDept ? (
     <Input value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})} placeholder="Custom Department" className="mt-1" />
 ) : (
     <select 
     value={formData.departmentId} 
     onChange={e => setFormData({...formData, departmentId: e.target.value})} 
     className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm text-foreground"
     >
     <option value="">Select Department...</option>
     {predefinedDepts.map(d => <option key={d.value} value={d.label}>{d.label}</option>)}
     <optgroup label="Custom Departments">
        {departmentRecords.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
     </optgroup>
     </select>
 )}
 </div>
 <div>
 <div className="flex justify-between items-center">
    <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("role", "Role")}</label>
    <span className="text-[10px] text-muted-foreground font-semibold">Manage in Roles page</span>
 </div>
     <select 
     value={formData.role} 
     onChange={e => setFormData({...formData, role: e.target.value})} 
     className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm text-foreground"
     >
     <option value="">Select Role...</option>
        {roleRecords.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
     </select>
 </div>
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("reports_to", "Reports To (Manager/Senior)")}</label>
 <select 
 value={formData.reportsTo} 
 onChange={e => setFormData({...formData, reportsTo: e.target.value})} 
 className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm text-foreground"
 >
 <option value="">Select Manager/Senior...</option>
 {employees.filter(e => e.id !== editTargetId).map(e => <option key={e.id} value={e.id}>{e.name} - {e.role}</option>)}
 </select>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("salary", "Salary")}</label>
 <Input type="number" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} placeholder="6000" className="mt-1" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("start_date", "Start Date")}</label>
 <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="mt-1" />
 </div>
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)} disabled={isSubmitting}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleCreateOrUpdateEmployee} disabled={isSubmitting}>{isSubmitting ? t("saving", "Saving...") : t("save", "Save")}</Button>
 </div>
 </div>
 </div>
 )}
 {viewTargetId && (
 <Sheet open={!!viewTargetId} onOpenChange={() => setViewTargetId(null)}>
 <SheetContent className="overflow-y-auto">
 <SheetHeader>
 <SheetTitle>{t("employee_details", "Employee Details")}</SheetTitle>
 <SheetDescription>{t("read_only_view_of_employee_rec", "Read-only view of employee record.")}</SheetDescription>
 </SheetHeader>
 <div className="mt-6 space-y-4">
 {(() => {
 const emp = employees.find(e => e.id === viewTargetId);
 if (!emp) return null;
 return (
 <div className="space-y-4 text-sm">
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("id", "ID:")}</span> <p className="font-medium">{emp.employeeId}</p></div>
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("name", "Name:")}</span> <p className="font-medium">{emp.name}</p></div>
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("department", "Department:")}</span> <p className="font-medium">{emp.departmentName}</p></div>
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("reports_to", "Reports To:")}</span> <p className="font-medium">{emp.reportsToName}</p></div>
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("role", "Role:")}</span> <p className="font-medium">{emp.role}</p></div>
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("email", "Email:")}</span> <p className="font-medium">{emp.email}</p></div>
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("phone", "Phone:")}</span> <p className="font-medium">{emp.phone}</p></div>
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("salary", "Salary:")}</span> <p className="font-medium">${emp.salary}</p></div>
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("start_date", "Start Date:")}</span> <p className="font-medium">{emp.startDate}</p></div>
 <div><span className="font-semibold text-[#71717a] dark:text-gray-400">{t("status", "Status:")}</span> <p className="font-medium">{emp.status}</p></div>
 </div>
 );
})()}
 </div>
 </SheetContent>
 </Sheet>
 )}
 <ConfirmationModal
 isOpen={deleteTargetId !== null}
 onClose={() => setDeleteTargetId(null)}
 onConfirm={handleDeleteEmployee}
 title="Remove Employee"
 message="Are you sure you want to completely remove this employee? This action is permanent."
 />
 </div>
 );
}
