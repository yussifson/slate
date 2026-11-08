import React, { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { isSuperAdmin } from '@/lib/constants';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [activeTab, setActiveTab] = useState("employees");
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
    <div className="w-full flex flex-col min-h-screen p-3 sm:p-6 pb-[max(96px,env(safe-area-inset-bottom))] overflow-x-hidden">
      <div className="pb-4 shrink-0">
        <PageHeader title="HR & Leave" subtitle="Manage your staff, departments, roles, and leave policies in one place." />
        
        {/* Mobile dropdown for HR tabs */}
        <div className="md:hidden mt-4">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-card border border-border text-foreground font-semibold text-xs shadow-xs"
          >
            <option value="employees">Employees</option>
            <option value="departments">Departments</option>
            <option value="roles">Roles</option>
            <option value="leave">Leave</option>
            <option value="attendance">Attendance</option>
            <option value="payroll">Payroll</option>
            <option value="performance">Performance</option>
            <option value="training">Training</option>
            <option value="recruitment">Recruitment</option>
            <option value="complaints">Complaints</option>
            <option value="promotions">Promotions</option>
            <option value="salary">Salary</option>
          </select>
        </div>

        {/* Enterprise-style horizontal scrolling tabs */}
        <div className="mt-4 md:mt-6 border-b border-border/60">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-transparent p-0 w-full flex justify-start overflow-x-auto overflow-y-hidden whitespace-nowrap gap-1 md:gap-3 scrollbar-hide h-auto rounded-none border-0">
              
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
