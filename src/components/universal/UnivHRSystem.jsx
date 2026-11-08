import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import { 
  Users, Building2, Shield, CalendarHeart, BadgeDollarSign, 
  Target, GraduationCap, UserPlus, AlertCircle, Wallet, ArrowUpRight, ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UnivHRSystem() {
  const { user } = useAuth();
  const companyId = user?.company_id;

  // 1. Fetch live staff count & roles
  const { data: staff = [] } = useQuery({
    queryKey: ["staff", companyId],
    queryFn: async () => {
      const res = await powerSync.execute(
        "SELECT id, name as full_name, email, role, department, status, salary FROM univ_hr_employees WHERE company_id = ?",
        [companyId]
      );
      return res.rows?._array || [];
    },
    enabled: !!companyId
  });

  // 2. Fetch departments count
  const { data: depts = [] } = useQuery({
    queryKey: ["univ_hr_departments", companyId],
    queryFn: async () => {
      const res = await powerSync.execute(
        "SELECT id, name FROM univ_hr_departments WHERE company_id = ?",
        [companyId]
      );
      return res.rows?._array || [];
    },
    enabled: !!companyId
  });

  // 3. Fetch leaves
  const { data: leaves = [] } = useQuery({
    queryKey: ["univ_hr_leave", companyId],
    queryFn: async () => {
      const res = await powerSync.execute(
        "SELECT id, status FROM univ_hr_leave WHERE company_id = ?",
        [companyId]
      );
      return res.rows?._array || [];
    },
    enabled: !!companyId
  });

  // 4. Fetch recruitment candidates
  const { data: candidates = [] } = useQuery({
    queryKey: ["univ_hr_candidates", companyId],
    queryFn: async () => {
      const res = await powerSync.execute(
        "SELECT id, stage FROM univ_hr_candidates WHERE company_id = ?",
        [companyId]
      );
      return res.rows?._array || [];
    },
    enabled: !!companyId
  });

  const activeStaffCount = staff.filter(s => s.status === 'Active' || s.status === 'active').length;
  const pendingLeaves = leaves.filter(l => l.status === 'Pending' || l.status === 'pending').length;
  const openCandidates = candidates.filter(c => c.stage !== 'Hired' && c.stage !== 'Rejected').length;
  const totalPayroll = staff.reduce((acc, s) => acc + (Number(s.salary) || 0), 0);

  const modules = [
    { label: 'Employees & Staff', value: staff.length, sub: `${activeStaffCount} active staff`, path: '/hr/employees', icon: Users, color: 'text-blue-500' },
    { label: 'Departments', value: depts.length || 'Manage', sub: 'Org structure', path: '/hr/departments', icon: Building2, color: 'text-purple-500' },
    { label: 'Roles & Permissions', value: 'RBAC', sub: 'Access control matrix', path: '/hr/roles', icon: Shield, color: 'text-emerald-500' },
    { label: 'Company Items Issued', value: 'Custody', sub: 'Assets & trackers', path: '/hr/assets', icon: ShieldCheck, color: 'text-cyan-500' },
    { label: 'Leave Requests', value: leaves.length, sub: `${pendingLeaves} pending approval`, path: '/hr/leave', icon: CalendarHeart, color: 'text-amber-500' },
    { label: 'Payroll & Salaries', value: totalPayroll > 0 ? `$${totalPayroll.toLocaleString()}` : 'Review', sub: 'Monthly payroll', path: '/hr/payroll', icon: BadgeDollarSign, color: 'text-emerald-500' },
    { label: 'Performance & KPIs', value: 'Reviews', sub: 'Quarterly appraisals', path: '/hr/performance', icon: Target, color: 'text-rose-500' },
    { label: 'Recruitment & ATS', value: candidates.length, sub: `${openCandidates} in pipeline`, path: '/hr/recruitment', icon: UserPlus, color: 'text-indigo-500' },
    { label: 'Training & Development', value: 'Programs', sub: 'Courses & progress', path: '/hr/training', icon: GraduationCap, color: 'text-teal-500' },
    { label: 'Complaints & Grievances', value: 'Tickets', sub: 'Resolution desk', path: '/hr/complaints', icon: AlertCircle, color: 'text-orange-500' },
    { label: 'Salary Benchmarks', value: 'Market', sub: 'Compensation levels', path: '/hr/salary', icon: Wallet, color: 'text-violet-500' },
  ];

  return (
    <div className="w-full max-w-full overflow-x-hidden p-3 sm:p-6 pb-24 font-sans space-y-4 sm:space-y-6">
      {/* ── Native Header ── */}
      <div className="flex items-center justify-between gap-3 min-w-0 border-b pb-4 border-border/80">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">Human Resources</h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">Workforce operations, directory, and administration</p>
        </div>
      </div>

      {/* ── 2x2 Modern Mobile Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Staff</div>
          <div className="text-lg sm:text-2xl font-black mt-0.5 text-foreground">{staff.length}</div>
        </div>
        <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Staff</div>
          <div className="text-lg sm:text-2xl font-black mt-0.5 text-emerald-600">{activeStaffCount}</div>
        </div>
        <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Pending Leaves</div>
          <div className="text-lg sm:text-2xl font-black mt-0.5 text-amber-600">{pendingLeaves}</div>
        </div>
        <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Pipeline</div>
          <div className="text-lg sm:text-2xl font-black mt-0.5 text-indigo-600">{openCandidates}</div>
        </div>
      </div>

      {/* ── Direct Module Navigation Cards (Responsive Grid) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
        {modules.map(({ label, value, sub, path, icon: Icon, color }) => (
          <Link
            key={path}
            to={path}
            className="group rounded-[20px] border border-border/80 bg-card p-4 transition-all duration-200 hover:border-primary/50 hover:shadow-sm active:scale-[0.99] flex items-center justify-between"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0 border border-border/50">
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">
                  {label}
                </h3>
                <p className="text-[10px] text-muted-foreground font-medium truncate">{sub}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 pl-2">
              <span className="text-xs font-bold text-foreground">{value}</span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
