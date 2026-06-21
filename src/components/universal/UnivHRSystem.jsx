import React, { useState, Suspense } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
const UnivHREmployee = React.lazy(() => import('./UnivHREmployee'));
import UnivDepartments from './UnivDepartments';
import UnivAccessControl from './UnivAccessControl';
import UnivLeaveManagement from './UnivLeaveManagement';
import { Users, Building2, Shield, CalendarHeart } from 'lucide-react';
import PageHeader from '../shared/PageHeader';

export default function UnivHRSystem() {
  const [activeTab, setActiveTab] = useState("employees");

  return (
    <div className="h-full flex flex-col w-full bg-background relative overflow-hidden custom-scrollbar">
      <div className="px-4 sm:px-6 lg:px-8 pt-8 pb-4 shrink-0">
        <PageHeader title="HR & Leave" subtitle="Manage your staff, departments, roles, and leave policies in one place." />
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6 w-full">
          <TabsList className="bg-muted p-1 rounded-xl grid w-full max-w-[500px] grid-cols-4">
            <TabsTrigger value="employees" className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2"><Users className="w-4 h-4" /><span className="hidden sm:inline">Employees</span></TabsTrigger>
            <TabsTrigger value="departments" className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2"><Building2 className="w-4 h-4" /><span className="hidden sm:inline">Departments</span></TabsTrigger>
            <TabsTrigger value="roles" className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2"><Shield className="w-4 h-4" /><span className="hidden sm:inline">Roles</span></TabsTrigger>
            <TabsTrigger value="leave" className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2"><CalendarHeart className="w-4 h-4" /><span className="hidden sm:inline">Leave</span></TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'employees' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none -z-10'}`}>
          <Suspense fallback={<div className="flex items-center justify-center h-full text-[#71717a] dark:text-gray-400">Loading Employees...</div>}>
            <UnivHREmployee />
          </Suspense>
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'departments' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none -z-10'}`}>
          <UnivDepartments />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'roles' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none -z-10'}`}>
          <UnivAccessControl />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'leave' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none -z-10'}`}>
          <UnivLeaveManagement />
        </div>
      </div>
    </div>
  );
}
