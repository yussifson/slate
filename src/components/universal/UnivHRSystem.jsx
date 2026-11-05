import React, { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { isSuperAdmin } from '@/lib/constants';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, Building2, Shield, CalendarHeart, UserPlus, Clock, BadgeDollarSign, Target, GraduationCap, AlertCircle, ArrowUpCircle, Wallet } from 'lucide-react';
import PageHeader from '../shared/PageHeader';

import { powerSync } from '@/api/PowerSyncConnector';
const UnivHREmployee = React.lazy(() => import('./UnivHREmployee'));
import UnivDepartments from './UnivDepartments';
import UnivAccessControl from './UnivAccessControl';
import UnivLeaveManagement from './UnivLeaveManagement';

const HRRecruitmentPanel = React.lazy(() => import('../hr/HRRecruitmentPanel'));
const HRAttendancePanel = React.lazy(() => import('../hr/HRAttendancePanel'));
const HRPayrollPanel = React.lazy(() => import('../hr/HRPayrollPanel'));
const HRPerformancePanel = React.lazy(() => import('../hr/HRPerformancePanel'));
const HRTrainingPanel = React.lazy(() => import('../hr/HRTrainingPanel'));
const HRComplaintsPanel = React.lazy(() => import('../hr/HRComplaintsPanel'));
const HRPromotionsPanel = React.lazy(() => import('../hr/HRPromotionsPanel'));
const HRSalaryPanel = React.lazy(() => import('../hr/HRSalaryPanel'));

export default function UnivHRSystem() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();
  const companyId = user?.company_id;
  const isAdmin = user?.role === "company_admin" || user?.role === "hr" || isSuperAdmin(user);
  const currency = "USD"; // Fallback for components that expect it

  // Fetch all necessary data for the HR modules
  const { data: staff = [] } = useQuery({
    queryKey: ["staff", companyId],
    queryFn: async () => {
      const res = await powerSync.execute("SELECT id, name as full_name, email, role, department, status, salary, start_date as hire_date, phone, company_id FROM univ_hr_employees WHERE company_id = ?", [companyId]);
      return res.rows?._array || [];
    },
    enabled: !!companyId
  });

  const { data: leaves = [] } = useQuery({
    queryKey: ["leaves", companyId],
    queryFn: () => base44.entities.LeaveRequest.filter({ company_id: companyId }, "-created_at", 200),
    enabled: !!companyId
  });

  const { data: complaints = [] } = useQuery({
    queryKey: ["complaints", companyId],
    queryFn: () => base44.entities.HRComplaint.filter({ company_id: companyId }, "-created_at", 100),
    enabled: !!companyId
  });

  const { data: promotions = [] } = useQuery({
    queryKey: ["promotions", companyId],
    queryFn: () => base44.entities.Promotion.filter({ company_id: companyId }, "-created_at", 100),
    enabled: !!companyId
  });

  return (
    <div className="w-full flex flex-col h-full">
      <div className="pb-4 shrink-0">
        <PageHeader title="HR & Leave" subtitle="Manage your staff, departments, roles, and leave policies in one place." />
        
        {/* Enterprise-style horizontal scrolling tabs */}
        <div className="mt-6 border-b border-border/60">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="hidden">
              
              <TabsTrigger value="employees" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-3 py-3 text-sm font-medium transition-all flex items-center gap-2 hover:bg-muted/50">
                <Users className="w-4 h-4 opacity-70" />Employees
              </TabsTrigger>
              
              <TabsTrigger value="departments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-3 py-3 text-sm font-medium transition-all flex items-center gap-2 hover:bg-muted/50">
                <Building2 className="w-4 h-4 opacity-70" />Departments
              </TabsTrigger>
              
              <TabsTrigger value="roles" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-3 py-3 text-sm font-medium transition-all flex items-center gap-2 hover:bg-muted/50">
                <Shield className="w-4 h-4 opacity-70" />Roles
              </TabsTrigger>
              
              <TabsTrigger value="leave" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-3 py-3 text-sm font-medium transition-all flex items-center gap-2 hover:bg-muted/50">
                <CalendarHeart className="w-4 h-4 opacity-70" />Leave
              </TabsTrigger>
              
              <TabsTrigger value="attendance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-3 py-3 text-sm font-medium transition-all flex items-center gap-2 hover:bg-muted/50">
                <Clock className="w-4 h-4 opacity-70" />Attendance
              </TabsTrigger>
              
              <TabsTrigger value="payroll" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-3 py-3 text-sm font-medium transition-all flex items-center gap-2 hover:bg-muted/50">
                <BadgeDollarSign className="w-4 h-4 opacity-70" />Payroll
              </TabsTrigger>
              
              <TabsTrigger value="performance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-3 py-3 text-sm font-medium transition-all flex items-center gap-2 hover:bg-muted/50">
                <Target className="w-4 h-4 opacity-70" />Performance
              </TabsTrigger>
              
              <TabsTrigger value="training" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-3 py-3 text-sm font-medium transition-all flex items-center gap-2 hover:bg-muted/50">
                <GraduationCap className="w-4 h-4 opacity-70" />Training
              </TabsTrigger>
              
              <TabsTrigger value="recruitment" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-3 py-3 text-sm font-medium transition-all flex items-center gap-2 hover:bg-muted/50">
                <UserPlus className="w-4 h-4 opacity-70" />Recruitment
              </TabsTrigger>
              
              <TabsTrigger value="complaints" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-3 py-3 text-sm font-medium transition-all flex items-center gap-2 hover:bg-muted/50">
                <AlertCircle className="w-4 h-4 opacity-70" />Complaints
              </TabsTrigger>
              
              <TabsTrigger value="promotions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-3 py-3 text-sm font-medium transition-all flex items-center gap-2 hover:bg-muted/50">
                <ArrowUpCircle className="w-4 h-4 opacity-70" />Promotions
              </TabsTrigger>
              
              <TabsTrigger value="salary" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-3 py-3 text-sm font-medium transition-all flex items-center gap-2 hover:bg-muted/50">
                <Wallet className="w-4 h-4 opacity-70" />Salary
              </TabsTrigger>

            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex-1 w-full pb-8 pt-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-card p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">HR workspace</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">People operations at a glance</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Use the dedicated HR sidebar to move between your workforce modules. This overview keeps the main dashboard focused on status and quick access.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['Employees', staff.length, '/hr/employees', Users],
                ['Departments', 'Manage', '/hr/departments', Building2],
                ['Attendance', 'Today', '/hr/attendance', Clock],
                ['Leave requests', leaves.length, '/hr/leave', CalendarHeart],
                ['Recruitment', 'Open', '/hr/recruitment', UserPlus],
                ['Payroll', 'Review', '/hr/payroll', BadgeDollarSign],
              ].map(([label, value, href, Icon]) => (
                <a key={href} href={href} className="group rounded-2xl border border-border/60 bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                  <div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><ArrowUpCircle className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" /></div>
                  <p className="mt-4 text-sm font-semibold text-foreground">{label}</p><p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{value}</p>
                </a>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'employees' && (
          <Suspense fallback={<div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading Employees...</div>}>
            <UnivHREmployee />
          </Suspense>
        )}
        {activeTab === 'departments' && <UnivDepartments />}
        {activeTab === 'roles' && <UnivAccessControl />}
        {activeTab === 'leave' && <UnivLeaveManagement />}
        
        <Suspense fallback={<div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading Panel...</div>}>
          {activeTab === 'attendance' && <HRAttendancePanel companyId={companyId} staff={staff} isAdmin={isAdmin} user={user} />}
          {activeTab === 'payroll' && <HRPayrollPanel companyId={companyId} staff={staff} currency={currency} isAdmin={isAdmin} leaves={leaves} user={user} />}
          {activeTab === 'performance' && <HRPerformancePanel companyId={companyId} staff={staff} isAdmin={isAdmin} user={user} />}
          {activeTab === 'training' && <HRTrainingPanel companyId={companyId} staff={staff} isAdmin={isAdmin} user={user} />}
          {activeTab === 'recruitment' && <HRRecruitmentPanel companyId={companyId} staff={staff} isAdmin={isAdmin} user={user} />}
          {activeTab === 'complaints' && <HRComplaintsPanel companyId={companyId} complaints={complaints} staff={staff} isAdmin={isAdmin} user={user} />}
          {activeTab === 'promotions' && <HRPromotionsPanel companyId={companyId} promotions={promotions} staff={staff} currency={currency} isAdmin={isAdmin} user={user} />}
          {activeTab === 'salary' && <HRSalaryPanel companyId={companyId} staff={staff} currency={currency} isAdmin={isAdmin} user={user} />}
        </Suspense>
      </div>
    </div>
  );
}
