import React, { useState, Suspense } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
const UnivHREmployee = React.lazy(() => import('./UnivHREmployee'));
import UnivDepartments from './UnivDepartments';
import UnivAccessControl from './UnivAccessControl';
import UnivLeaveManagement from './UnivLeaveManagement';
import { Users, Building2, Shield, CalendarHeart, UserPlus, Clock, BadgeDollarSign, Target, GraduationCap, AlertCircle, ArrowUpCircle, Wallet } from 'lucide-react';
import PageHeader from '../shared/PageHeader';

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

  return (
    <div className="w-full">
      <div className="pb-6 shrink-0">
        <PageHeader title="HR & Leave" subtitle="Manage your staff, departments, roles, and leave policies in one place." />
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6 w-full">
          <TabsList className="bg-muted p-1 rounded-xl flex flex-wrap gap-1 justify-start w-full">
            <TabsTrigger value="employees" className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2"><Users className="w-4 h-4" /><span className="hidden sm:inline">Employees</span></TabsTrigger>
            <TabsTrigger value="departments" className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2"><Building2 className="w-4 h-4" /><span className="hidden sm:inline">Departments</span></TabsTrigger>
            <TabsTrigger value="roles" className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2"><Shield className="w-4 h-4" /><span className="hidden sm:inline">Roles</span></TabsTrigger>
            <TabsTrigger value="leave" className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2"><CalendarHeart className="w-4 h-4" /><span className="hidden sm:inline">Leave</span></TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2"><Clock className="w-4 h-4" /><span className="hidden sm:inline">Attendance</span></TabsTrigger>
            <TabsTrigger value="payroll" className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2"><BadgeDollarSign className="w-4 h-4" /><span className="hidden sm:inline">Payroll</span></TabsTrigger>
            <TabsTrigger value="performance" className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2"><Target className="w-4 h-4" /><span className="hidden sm:inline">Performance</span></TabsTrigger>
            <TabsTrigger value="training" className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2"><GraduationCap className="w-4 h-4" /><span className="hidden sm:inline">Training</span></TabsTrigger>
            <TabsTrigger value="recruitment" className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2"><UserPlus className="w-4 h-4" /><span className="hidden sm:inline">Recruitment</span></TabsTrigger>
            <TabsTrigger value="complaints" className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /><span className="hidden sm:inline">Complaints</span></TabsTrigger>
            <TabsTrigger value="promotions" className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2"><ArrowUpCircle className="w-4 h-4" /><span className="hidden sm:inline">Promotions</span></TabsTrigger>
            <TabsTrigger value="salary" className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2"><Wallet className="w-4 h-4" /><span className="hidden sm:inline">Salary</span></TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 w-full pb-8">
        {activeTab === 'employees' && (
          <Suspense fallback={<div className="flex items-center justify-center py-20 text-[#71717a] dark:text-gray-400">Loading Employees...</div>}>
            <UnivHREmployee />
          </Suspense>
        )}
        {activeTab === 'departments' && <UnivDepartments />}
        {activeTab === 'roles' && <UnivAccessControl />}
        {activeTab === 'leave' && <UnivLeaveManagement />}
        <Suspense fallback={<div className="flex items-center justify-center py-20 text-[#71717a]">Loading...</div>}>
          {activeTab === 'attendance' && <HRAttendancePanel />}
          {activeTab === 'payroll' && <HRPayrollPanel />}
          {activeTab === 'performance' && <HRPerformancePanel />}
          {activeTab === 'training' && <HRTrainingPanel />}
          {activeTab === 'recruitment' && <HRRecruitmentPanel />}
          {activeTab === 'complaints' && <HRComplaintsPanel />}
          {activeTab === 'promotions' && <HRPromotionsPanel />}
          {activeTab === 'salary' && <HRSalaryPanel />}
        </Suspense>
      </div>
    </div>
  );
}
