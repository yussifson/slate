import { useTranslation} from "react-i18next";
import { INDUSTRIES } from "@/config/industries";
import { useCompany } from "@/hooks/useCompanyId";
import { useState, useEffect } from 'react';
import { X, Users, Search, Plus, Mail, Phone, Briefcase, Trash2, Edit, Eye, Network, BadgeCheck, CalendarDays, DollarSign, Building2} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import ExportButton from '@/components/shared/ExportButton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import { Link} from 'react-router-dom';
import { useNotifications} from '@/hooks/integrations/useNotifications';
import { useAuth} from '@/lib/AuthContext';
import { base44 } from "@/api/base44Client";
import { supabase } from "@/api/supabaseClient";
import { usePowerSync } from '@powersync/react';
import { DEFAULT_PLATFORM_ROLES } from '@/config/jclRolePermissions';
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
  'Suspended':  'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-300 dark:border-amber-800',
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

  const fetchEmps = async () => {
    if (!companyId) return;
    setIsDbLoading(true);
    try {
      const res = await powerSync.execute('SELECT * FROM univ_hr_employees WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
      const rows = res.rows?._array || Array.from(res.rows || []);
      if (rows.length > 0) {
        setDbRecords(rows);
      } else {
        // Fallback to Supabase direct query if local PowerSync is still syncing
        const { data: supaEmps } = await supabase
          .from('univ_hr_employees')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });
        if (supaEmps && supaEmps.length > 0) {
          setDbRecords(supaEmps);
        } else {
          setDbRecords([]);
        }
      }
    } catch (e) {
      try {
        const { data: supaEmps } = await supabase
          .from('univ_hr_employees')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });
        if (supaEmps) setDbRecords(supaEmps);
      } catch (err) {}
    }
    setIsDbLoading(false);
  };

  useEffect(() => {
    fetchEmps();
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
  employeeId: r.employee_id || r.id?.substring(0,6) || 'EMP',
  name: r.name || r.full_name || [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Unnamed Staff',
  departmentId: r.department || r.department_id,
  role: r.role,
  roleName: DEFAULT_PLATFORM_ROLES.find(d => d.id === r.role || d.label?.toLowerCase() === (r.role||'').toLowerCase())?.label || roleRecords.find(ro => ro.id === r.role || ro.name === r.role)?.name || r.role,
  email: r.email,
  phone: r.phone,
  salary: r.salary,
  reportsTo: r.reports_to,
  startDate: r.start_date,
  departmentName: departmentRecords.find(d => d.id === (r.department || r.department_id) || d.name === (r.department || r.department_id))?.name || r.department || 'Unassigned',
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
          employee_id: emp?.employeeId,
          updated_at: new Date().toISOString()
        };
        const _k = Object.keys(payload);
        const _v = Object.values(payload);
        await powerSync.execute(`UPDATE univ_hr_employees SET ${_k.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._v, editTargetId]);
        try {
          await supabase.from('univ_hr_employees').update(payload).eq('id', editTargetId);
        } catch (e) {
          console.warn('Direct Supabase update sync failed:', e);
        }

        // Mirror to staff_records
        if (formData.email) {
          try {
            await supabase.from('staff_records').update({
              full_name: formData.name,
              department: formData.departmentId,
              phone: formData.phone,
              salary: formData.salary ? String(formData.salary) : null,
              hire_date: formData.startDate,
              updated_at: new Date().toISOString()
            }).eq('company_id', companyId).ilike('user_email', formData.email);
          } catch (e) {
            console.warn('staff_records mirror update failed:', e);
          }

          // Crucial: Update the user's role in profiles table and by user_id
          try {
            const rawEmail = formData.email.trim().toLowerCase();
            const cleanEmail = rawEmail.replace(/\+firm[a-zA-Z0-9_-]+@/, '@');
            await supabase.from('profiles').update({
              role: formData.role,
              department: formData.departmentId,
              full_name: formData.name
            }).or(`email.ilike.${rawEmail},email.ilike.${cleanEmail}${emp?.userId ? `,id.eq.${emp.userId}` : ''}`);
          } catch (e) {
            console.warn('profiles role sync failed:', e);
          }
        }

        setDbRecords(prev => prev.map(r => r.id === editTargetId ? { ...r, ...payload } : r));
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
        if (createAccount && formData.email) {
          try {
            const rawLoginEmail = formData.email.trim().toLowerCase();
            const [localPart, domain] = rawLoginEmail.split('@');
            const proxyEmail = `${localPart}+firm${(user?.company_id || '').replace(/-/g, '')}@${domain}`;

            // Try adminRegister first
            try {
              const reg = await base44.auth.adminRegister({
                email: proxyEmail,
                password: password,
                company_id: user?.company_id,
                role: finalRole
              });
              authUserId = reg?.user?.id;
            } catch (regErr) {
              if (regErr?.message?.toLowerCase().includes('already registered') || regErr?.message?.toLowerCase().includes('already exists')) {
                // User already exists in Supabase Auth, sign in or fetch profile id
                try {
                  const signInCheck = await supabase.auth.signInWithPassword({ email: proxyEmail, password });
                  if (signInCheck.data?.user?.id) {
                    authUserId = signInCheck.data.user.id;
                  }
                } catch (e) {}
                if (!authUserId) {
                  const { data: existProf } = await supabase.from('profiles').select('id').eq('email', proxyEmail).maybeSingle();
                  authUserId = existProf?.id || null;
                }
              } else {
                // Try admin_create_user RPC fallback
                console.warn("adminRegister notice, trying admin_create_user RPC:", regErr?.message);
                const { data: rpcUserId, error: rpcErr } = await supabase.rpc('admin_create_user', {
                  user_email: proxyEmail,
                  user_password: password,
                  user_role: finalRole,
                  user_company_id: user?.company_id,
                  user_full_name: formData.name,
                  user_metadata: { company_id: user?.company_id, role: finalRole }
                });
                if (!rpcErr && rpcUserId) {
                  authUserId = rpcUserId;
                }
              }
            }
          } catch (err) {
            console.warn("Account auth registration notice:", err);
          }
        }

        const newId = crypto.randomUUID();
        const trimmedName = (formData.name || '').trim();
        const nameParts = trimmedName.split(' ');
        const firstName = nameParts[0] || 'Staff';
        const lastName = nameParts.slice(1).join(' ') || 'Member';

        const payload = { 
          id: newId, 
          company_id: user?.company_id, 
          name: trimmedName,
          first_name: firstName,
          last_name: lastName,
          department: finalDeptId,
          reports_to: formData.reportsTo || null,
          role: finalRole,
          email: formData.email,
          phone: formData.phone || null,
          salary: formData.salary ? Number(formData.salary) : null,
          start_date: formData.startDate,
          employee_id: employeeId,
          user_id: authUserId || null,
          status: 'Active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // 1. Insert into local PowerSync DB
        const _k = Object.keys(payload);
        const _v = Object.values(payload);
        await powerSync.execute(`INSERT INTO univ_hr_employees (${_k.join(', ')}) VALUES (${_k.map(()=>'?').join(', ')})`, _v);

        // 2. Direct insert into Supabase univ_hr_employees with required columns
        try {
          await supabase.from('univ_hr_employees').insert([payload]);
        } catch (supaErr) {
          console.warn('Direct Supabase insert into univ_hr_employees failed:', supaErr);
        }

        // 3. Mirror into profiles table so auth user is linked to company
        if (authUserId) {
          try {
            await supabase.from('profiles').upsert({
              id: authUserId,
              company_id: user?.company_id,
              company_name: user?.company_name || 'JCL Office',
              email: formData.email,
              full_name: trimmedName,
              role: finalRole
            });
          } catch (profErr) {
            console.warn('profile upsert notice:', profErr);
          }
        }

        // 4. Mirror into staff_records
        try {
          const staffPayload = {
            id: newId,
            company_id: user?.company_id,
            user_email: formData.email,
            full_name: trimmedName,
            role: finalRole,
            department: finalDeptId,
            phone: formData.phone || null,
            hire_date: formData.startDate,
            status: 'active',
            salary: formData.salary ? String(formData.salary) : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          if (authUserId) staffPayload.user_id = authUserId;

          await supabase.from('staff_records').upsert(staffPayload, { onConflict: 'id' });
          await powerSync.execute(
            `INSERT OR REPLACE INTO staff_records (id, company_id, user_email, full_name, role, department, phone, hire_date, status, salary, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [newId, user?.company_id, formData.email, trimmedName, finalRole, finalDeptId, formData.phone || null, formData.startDate, 'active', formData.salary ? String(formData.salary) : null, new Date().toISOString(), new Date().toISOString()]
          ).catch(() => {});
        } catch (staffErr) {
          console.warn('staff_records sync notice:', staffErr);
        }

        // 5. Update local state immediately so new employee shows in the UI right away
        setDbRecords(prev => [payload, ...prev]);

        toast.success(createAccount && authUserId ? 'Employee added and login account created successfully!' : 'Employee added successfully!');
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
     const nowIso = new Date().toISOString();
     await powerSync.execute(`UPDATE univ_hr_employees SET status = ?, updated_at = ? WHERE id = ?`, [newStatus, nowIso, employee.id]);
     try {
       await supabase.from('univ_hr_employees').update({ status: newStatus, updated_at: nowIso }).eq('id', employee.id);
       if (employee.email) {
         await supabase.from('staff_records').update({ status: newStatus.toLowerCase(), updated_at: nowIso }).eq('company_id', companyId).ilike('user_email', employee.email);
         await powerSync.execute(`UPDATE staff_records SET status = ?, updated_at = ? WHERE company_id = ? AND user_email LIKE ?`, [newStatus.toLowerCase(), nowIso, companyId, employee.email]);
       }
     } catch (syncErr) {
       console.warn('Backend sync error on status update:', syncErr);
     }
     setDbRecords(prev => prev.map(r => r.id === employee.id ? { ...r, status: newStatus } : r));
     toast.success(`Status updated to ${newStatus}`);
   } catch (err) {
     toast.error('Failed to update status: ' + err.message);
   }
};

 const handleDeleteEmployee = async () => {
   if (!deleteTargetId) return;
   try {
     const emp = employees.find(e => e.id === deleteTargetId);
     
     // 1. Delete from local PowerSync DB immediately
     await powerSync.execute('DELETE FROM univ_hr_employees WHERE id = ?', [deleteTargetId]);
     
     // 2. Delete from Supabase cloud database
     await supabase.from('univ_hr_employees').delete().eq('id', deleteTargetId);
     
     // 3. If employee is also in staff_records by email, clean that up as well
     if (emp?.email) {
       try {
         await supabase.from('staff_records').delete().eq('company_id', companyId).ilike('user_email', emp.email);
         await powerSync.execute('DELETE FROM staff_records WHERE company_id = ? AND user_email LIKE ?', [companyId, emp.email]);
       } catch (e) {
         console.warn('Failed to clean staff_records for deleted employee:', e);
       }
     }

     // 4. Update local state immediately so they disappear
     setDbRecords(prev => prev.filter(r => r.id !== deleteTargetId));
     toast.success('Employee deleted and removed from system successfully!');
     setDeleteTargetId(null);
   } catch (err) {
     console.error('Failed to remove employee:', err);
     toast.error('Failed to remove employee: ' + (err.message || 'Error occurred'));
     setDeleteTargetId(null);
   }
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
  <div className="w-full max-w-full overflow-x-hidden p-3 sm:p-6 pb-24 font-sans space-y-4 sm:space-y-6">
    <div className="w-full space-y-4 sm:space-y-6">

     {/* ── Native Header ── */}
     <div className="flex items-center justify-between gap-3 min-w-0 border-b pb-4 border-border/80">
       <div className="min-w-0">
         <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">{t("employees", "Employees & Staff")}</h1>
         <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">{t("manage_staff_profiles_and_dire", "Workforce directory and employee records")}</p>
       </div>
       <div className="flex items-center gap-2 shrink-0">
         <div className="bg-muted p-1 rounded-xl flex shrink-0">
           <button onClick={() => setActiveTab('list')} className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'list' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
             <Users className="w-3.5 h-3.5 inline-block sm:mr-1" /> <span className="hidden sm:inline">List</span>
           </button>
           <button onClick={() => setActiveTab('org')} className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'org' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
             <Network className="w-3.5 h-3.5 inline-block sm:mr-1" /> <span className="hidden sm:inline">Org Chart</span>
           </button>
         </div>
         <Button onClick={openAdd} size="sm" className="h-9 px-3 sm:px-4 text-xs font-bold bg-[#005A9C] hover:bg-[#00477D] text-white rounded-xl shadow-xs gap-1.5 shrink-0 active:scale-95 transition-all">
           <Plus className="w-4 h-4" /> <span className="hidden sm:inline">{t("add_employee", "Add Employee")}</span><span className="sm:hidden">Add</span>
         </Button>
       </div>
     </div>

     {/* ── 2x2 Modern Mobile Stats Grid ── */}
     <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
       <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
         <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Staff</div>
         <div className="text-lg sm:text-2xl font-black mt-0.5 text-foreground">{totalStaff}</div>
       </div>
       <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
         <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Staff</div>
         <div className="text-lg sm:text-2xl font-black mt-0.5 text-emerald-600">{activeStaff}</div>
       </div>
       <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
         <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">On Leave</div>
         <div className="text-lg sm:text-2xl font-black mt-0.5 text-amber-600">{onLeave}</div>
       </div>
       <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
         <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Departments</div>
         <div className="text-lg sm:text-2xl font-black mt-0.5 text-purple-600">{departmentsCount}</div>
       </div>
     </div>

     {/* ── Search Bar ── */}
     <div className="bg-card/90 backdrop-blur-xl p-2.5 sm:p-3 rounded-[20px] border border-border/80 shadow-xs flex items-center gap-2.5">
       <div className="relative flex-1">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
         <Input placeholder="Search employee name, role, department..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9.5 bg-background rounded-xl border-border/80 text-xs w-full" />
       </div>
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
      <div className="border border-border/80 rounded-2xl bg-card overflow-hidden shadow-xs w-full max-w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Role & Department</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Compensation</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map(emp => {
                const deptColor = getDeptColor(emp.departmentName);
                const statusStyle = STATUS_STYLES[emp.status] || STATUS_STYLES['Active'];
                const initials = emp.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
                return (
                  <tr key={emp.id} className="hover:bg-muted/40 transition-colors group">
                    {/* Employee avatar & name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${deptColor.bg} flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground text-xs leading-snug truncate">{emp.name}</p>
                          <span className="text-[10px] text-muted-foreground font-mono">{emp.employeeId || 'EMP'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role & Dept */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${deptColor.light}`}>
                          {emp.roleName || emp.role || 'General Staff'}
                        </span>
                        <p className="text-[11px] text-muted-foreground truncate">{emp.departmentName || 'General'}</p>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 text-[11px] text-muted-foreground">
                        {emp.email && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3 h-3 text-blue-500 shrink-0" />
                            <span className="truncate">{emp.email}</span>
                          </div>
                        )}
                        {emp.phone && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>{emp.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Salary */}
                    <td className="py-3.5 px-4">
                      {emp.salary ? (
                        <span className="font-semibold text-foreground text-xs">
                          ${Number(emp.salary).toLocaleString()} <span className="text-[10px] text-muted-foreground font-normal">/mo</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">—</span>
                      )}
                    </td>

                    {/* Status with quick change dropdown */}
                    <td className="py-3.5 px-4 text-center">
                      <select
                        value={emp.status}
                        onChange={e => handleUpdateStatus(emp, e.target.value)}
                        className={`text-[10px] font-bold tracking-wide px-2 py-1 rounded-lg border-0 cursor-pointer focus:ring-1 focus:ring-primary/40 ${statusStyle}`}
                      >
                        <option value="Active">Active</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Terminated">Terminated</option>
                      </select>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewTargetId(emp.id)}
                          className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEdit(emp)}
                          className="p-1.5 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          title="Edit Employee"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(emp.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    )}
   </div>

  {/* ── Add / Edit Modal ── */}
  {showModal && (
  <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-0 sm:p-4" role="dialog" aria-modal="true" onMouseDown={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
  <div className="bg-white dark:bg-card rounded-t-[28px] sm:rounded-2xl w-full sm:max-w-md shadow-2xl border-t sm:border border-border/80 max-h-[92dvh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 pb-[calc(1.5rem+env(safe-area-inset-bottom,20px))] sm:pb-0">
    <div className="sm:hidden w-12 h-1.5 rounded-full bg-black/20 dark:bg-white/20 mx-auto mt-3 mb-1 shrink-0" aria-hidden="true" />
    <div className="p-4 sm:p-6 border-b border-border/50 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-foreground">{editTargetId ? 'Edit Employee' : 'Add Employee'}</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{editTargetId ? 'Update employee information' : 'Onboard a new team member'}</p>
      </div>
      <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all" aria-label="Close">
        <X className="w-4 h-4" />
      </button>
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
      <optgroup label="Default Roles">
        {DEFAULT_PLATFORM_ROLES.map(r => (
          <option key={r.id} value={r.id}>{r.label} ({r.department})</option>
        ))}
      </optgroup>
      {roleRecords.length > 0 && (
        <optgroup label="Custom Roles">
          {roleRecords.map(r => <option key={r.id} value={r.name || r.id}>{r.name}</option>)}
        </optgroup>
      )}
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
