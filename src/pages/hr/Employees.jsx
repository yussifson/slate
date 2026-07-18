import { useTranslation} from "react-i18next";
import { INDUSTRIES } from "@/config/industries";
import { useCompany } from "@/hooks/useCompanyId";
import { useState, useEffect } from 'react';
import { Users, Search, Plus, Mail, Phone, Briefcase, Trash2, Edit, Eye, Network, BadgeCheck, CalendarDays, DollarSign, Building2} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import { Link} from 'react-router-dom';
import { useNotifications} from '@/hooks/integrations/useNotifications';
import { useAuth} from '@/lib/AuthContext';
import { base44 } from "@/api/base44Client";
import { supabase } from "@/api/supabaseClient";
import { usePowerSync } from '@powersync/react';

// ─── Department color map ─────────────────────────────────────────────────────
const DEPT_COLORS = {
  'Human Resources': { bg: 'from-indigo-500 to-indigo-600', light: 'bg-indigo-50 text-indigo-700' },
  'HR': { bg: 'from-indigo-500 to-indigo-600', light: 'bg-indigo-50 text-indigo-700' },
  'Finance': { bg: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-50 text-emerald-700' },
  'Operations': { bg: 'from-amber-500 to-amber-600', light: 'bg-amber-50 text-amber-700' },
  'IT & Support': { bg: 'from-cyan-500 to-cyan-600', light: 'bg-cyan-50 text-cyan-700' },
  'Administration': { bg: 'from-purple-500 to-purple-600', light: 'bg-purple-50 text-purple-700' },
};
const getDeptColor = (name) => DEPT_COLORS[name] || { bg: 'from-violet-500 to-violet-600', light: 'bg-violet-50 text-violet-700' };

const STATUS_STYLES = {
  'Active':     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  'On Leave':   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  'Terminated': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

// ─── Org Chart Node ──────────────────────────────────────────────────────────
const OrgNode = ({ employee, allEmployees }) => {
 const children = allEmployees.filter(e => e.reportsTo === employee.id);
 return (
 <div className="flex flex-col items-center">
 <div className="p-4 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-xl shadow-sm bg-card hover:border-primary/50 transition-colors w-48 relative z-10 flex flex-col items-center text-center hover:shadow-md transition-shadow duration-200">
 <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg mb-2">
 {employee.name?.charAt(0).toUpperCase()}
 </div>
 <p className="font-semibold text-sm text-foreground truncate w-full">{employee.name}</p>
 <p className="text-xs text-primary font-medium truncate w-full">{employee.role}</p>
 <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate w-full mt-1">{employee.departmentName}</p>
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
 const mutateRecord = useMutateIndustryRecord();
 const deleteRecord = useDeleteIndustryRecord();

 const handleCreateOrUpdateEmployee = async () => {
 if (!formData.name.trim()) return toast.error("Please enter a name");
 if (!editTargetId && createAccount && !password) return toast.error("Please provide a temporary password for the account");
 
 setIsSubmitting(true);
 try {
   if (editTargetId) {
      const emp = employees.find(e => e.id === editTargetId);
      const payload = { 
        name: formData.name,
        department: formData.departmentId,
        reports_to: formData.reportsTo,
        role: formData.role,
        email: formData.email,
        phone: formData.phone,
        salary: formData.salary,
        start_date: formData.startDate,
        employee_id: emp.employeeId,
        updated_at: new Date().toISOString()
      };
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
     let finalDeptId = formData.departmentId;
     if (useCustomDept && formData.departmentId && !departmentRecords.find(d => d.name === formData.departmentId)) {
         const newDeptId = crypto.randomUUID();
         await powerSync.execute("INSERT INTO platform_departments (id, company_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))", [newDeptId, user?.company_id, formData.departmentId, formData.departmentId]);
         finalDeptId = newDeptId;
     }
     let authUserId = null;
     if (createAccount) {
       try {
         const rawLoginEmail = formData.email.trim().toLowerCase();
         const [localPart, domain] = rawLoginEmail.split('@');
         const proxyEmail = `${localPart}+firm${(user?.company_id || '').replace(/-/g, '')}@${domain}`;

         const reg = await base44.auth.adminRegister({
           email: proxyEmail,
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
      const payload = { 
        id: newId, 
        company_id: user?.company_id, 
        name: formData.name,
        department: finalDeptId,
        reports_to: formData.reportsTo,
        role: finalRole,
        email: formData.email,
        phone: formData.phone,
        salary: formData.salary,
        start_date: formData.startDate,
        employee_id: employeeId,
        user_id: authUserId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
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

 const handleUpdateStatus = async (employee, newStatus) => {
   try {
     await powerSync.execute(`UPDATE univ_hr_employees SET status = ?, updated_at = ? WHERE id = ?`, [newStatus, new Date().toISOString(), employee.id]);
     setDbRecords(prev => prev.map(r => r.id === employee.id ? { ...r, status: newStatus } : r));
     toast.success(`Status updated to ${newStatus}`);
   } catch (err) {
     toast.error('Failed to update status: ' + err.message);
   }
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
 <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-card/50 h-full p-4 lg:p-8 font-dmsans">
   <div className="max-w-[1600px] mx-auto space-y-6">

    {/* ── Header ── */}
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("employees", "Employees")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("manage_staff_profiles_and_dire", "Manage staff profiles and directories")}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="bg-muted p-1 rounded-xl flex">
          <button onClick={() => setActiveTab('list')} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <Users className="w-4 h-4 inline-block mr-1.5" /> List
          </button>
          <button onClick={() => setActiveTab('org')} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'org' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <Network className="w-4 h-4 inline-block mr-1.5" /> Org Chart
          </button>
        </div>
        <Button onClick={openAdd} className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm">
          <Plus className="w-4 h-4" /> {t("add_employee", "Add Employee")}
        </Button>
      </div>
    </div>

    {/* ── Metric Cards ── */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Total Staff', value: totalStaff, icon: Users, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: 'Active Staff', value: activeStaff, icon: BadgeCheck, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        { label: 'On Leave', value: onLeave, icon: CalendarDays, gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        { label: 'Departments', value: departmentsCount, icon: Building2, gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
      ].map(({ label, value, icon: Icon, gradient, bg }) => (
        <div key={label} className={`${bg} rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 p-5 flex items-center gap-4 hover:shadow-md transition-all duration-200`}>
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>

    {/* ── Search ── */}
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white dark:bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8" />
    </div>

    {/* ── Content ── */}
    {isDbLoading ? (
      <div className="py-16 text-center text-muted-foreground">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading employees...
      </div>
    ) : activeTab === 'org' ? (
      <div className="p-8 overflow-auto min-h-[500px] flex justify-center bg-white dark:bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8">
        {employees.filter(e => !e.reportsTo || e.reportsTo === '' || e.reportsTo === 'None' || !employees.find(x => x.id === e.reportsTo)).map(root => (
          <div key={root.id} className="mx-8"><OrgNode employee={root} allEmployees={employees} /></div>
        ))}
      </div>
    ) : filtered.length === 0 ? (
      <div className="py-16 text-center text-muted-foreground bg-white dark:bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8">
        <Users className="w-14 h-14 mx-auto mb-3 opacity-20 text-primary" />
        <p className="font-semibold text-lg text-foreground">No employees found</p>
        <p className="text-sm mt-1">Add your first employee to get started.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(emp => {
          const deptColor = getDeptColor(emp.departmentName);
          const statusStyle = STATUS_STYLES[emp.status] || STATUS_STYLES['Active'];
          const initials = emp.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
          return (
            <div key={emp.id} className="group bg-white dark:bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
              
              {/* Card top accent bar */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${deptColor.bg}`} />

              {/* Card body */}
              <div className="p-5 flex-1">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${deptColor.bg} flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-foreground text-base leading-tight truncate">{emp.name}</h3>
                        <span className="inline-block mt-0.5 text-[10px] font-bold tracking-wider text-muted-foreground bg-slate-100 dark:bg-secondary rounded-full px-2 py-0.5">{emp.employeeId}</span>
                      </div>
                      <span className={`text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full shrink-0 ${statusStyle}`}>
                        {emp.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role & Dept */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${deptColor.light}`}>
                      {emp.roleName || emp.role || 'No Role'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{emp.departmentName}</span>
                  </div>
                  {emp.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                  )}
                  {emp.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      <span>{emp.phone}</span>
                    </div>
                  )}
                  {emp.salary && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span>${Number(emp.salary).toLocaleString()} / mo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Action Buttons ── */}
              <div className="px-5 pb-4 pt-2 border-t border-border/50 flex gap-2">
                <button onClick={() => setViewTargetId(emp.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40 dark:hover:bg-blue-900/40 transition-colors">
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                <button onClick={() => openEdit(emp)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40 dark:hover:bg-emerald-900/40 transition-colors">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => setDeleteTargetId(emp.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/40 dark:hover:bg-red-900/40 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>

              {/* Status quick-change */}
              <div className="px-5 pb-4">
                <select
                  value={emp.status}
                  onChange={e => handleUpdateStatus(emp, e.target.value)}
                  className="w-full rounded-xl border-[0.5px] border-black/9 dark:border-white/8 bg-slate-50 dark:bg-secondary px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option>Active</option>
                  <option>On Leave</option>
                  <option>Terminated</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>
    )}
   </div>

  {/* ── Add / Edit Modal ── */}
  {showModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
  <div className="bg-white dark:bg-card rounded-2xl w-full max-w-md shadow-2xl border-[0.5px] border-black/9 dark:border-white/8 max-h-[90vh] flex flex-col">
    <div className="p-6 border-b border-border/50">
      <h2 className="text-lg font-bold text-foreground">{editTargetId ? 'Edit Employee' : 'Add Employee'}</h2>
      <p className="text-sm text-muted-foreground mt-0.5">{editTargetId ? 'Update employee information' : 'Onboard a new team member'}</p>
    </div>
  <div className="space-y-3 overflow-y-auto flex-1 p-6">
  <div>
  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("full_name", "Full Name")}</label>
  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Alice Johnson" className="mt-1" />
  </div>
  <div>
  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("email", "Email")}</label>
  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="alice@example.com" className="mt-1" disabled={!!editTargetId} />
  </div>
   {!editTargetId && (
     <div className="space-y-3 p-3 bg-muted/30 rounded-xl border-[0.5px] border-black/9 dark:border-white/8">
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
           <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Temporary Password *</label>
           <Input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" className="mt-1 bg-background" />
         </div>
       )}
     </div>
   )}
  <div>
  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("phone", "Phone")}</label>
  <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+1 234 567 8900" className="mt-1" />
  </div>
  <div className="grid grid-cols-2 gap-3">
  <div>
  <div className="flex justify-between items-center">
     <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("department", "Department")}</label>
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
     <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("role", "Role")}</label>
     <span className="text-[10px] text-muted-foreground font-semibold">Manage in Roles page</span>
  </div>
      <select 
      value={formData.role} 
      onChange={e => setFormData({...formData, role: e.target.value})} 
      className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm text-foreground"
      >
      <option value="">Select Role...</option>
      <option value="company_admin">Company Admin (System Role)</option>
         {roleRecords.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>
  </div>
  </div>
  <div>
  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("reports_to", "Reports To (Manager/Senior)")}</label>
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
  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("salary", "Salary")}</label>
  <Input type="number" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} placeholder="6000" className="mt-1" />
  </div>
  <div>
  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("start_date", "Start Date")}</label>
  <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="mt-1" />
  </div>
  </div>
  </div>
  <div className="flex gap-3 p-6 border-t border-border/50">
  <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)} disabled={isSubmitting}>{t("cancel", "Cancel")}</Button>
  <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleCreateOrUpdateEmployee} disabled={isSubmitting}>{isSubmitting ? t("saving", "Saving...") : t("save", "Save")}</Button>
  </div>
  </div>
  </div>
  )}

  {/* ── View Details Sheet ── */}
  {viewTargetId && (
  <Sheet open={!!viewTargetId} onOpenChange={() => setViewTargetId(null)}>
  <SheetContent className="overflow-y-auto w-full sm:max-w-md">
  <SheetHeader>
  <SheetTitle>{t("employee_details", "Employee Details")}</SheetTitle>
  <SheetDescription>{t("read_only_view_of_employee_rec", "Read-only view of employee record.")}</SheetDescription>
  </SheetHeader>
  <div className="mt-6 space-y-4">
  {(() => {
  const emp = employees.find(e => e.id === viewTargetId);
  if (!emp) return null;
  const deptColor = getDeptColor(emp.departmentName);
  const initials = emp.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
  return (
    <div className="space-y-5">
      {/* Avatar header */}
      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-secondary rounded-2xl">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${deptColor.bg} flex items-center justify-center text-white font-bold text-xl shadow-md`}>
          {initials}
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">{emp.name}</h3>
          <span className={`text-xs font-bold tracking-wide px-2.5 py-1 rounded-full ${STATUS_STYLES[emp.status] || STATUS_STYLES['Active']}`}>{emp.status}</span>
        </div>
      </div>
      {/* Details */}
      {[
        { label: 'Employee ID', value: emp.employeeId },
        { label: 'Role', value: emp.roleName || emp.role },
        { label: 'Department', value: emp.departmentName },
        { label: 'Reports To', value: emp.reportsToName },
        { label: 'Email', value: emp.email },
        { label: 'Phone', value: emp.phone },
        { label: 'Salary', value: emp.salary ? `$${Number(emp.salary).toLocaleString()}` : '—' },
        { label: 'Start Date', value: emp.startDate },
      ].map(({ label, value }) => (
        <div key={label} className="flex justify-between py-2 border-b border-border/30">
          <span className="text-sm text-muted-foreground font-medium">{label}</span>
          <span className="text-sm font-semibold text-foreground text-right max-w-[60%]">{value || '—'}</span>
        </div>
      ))}
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
