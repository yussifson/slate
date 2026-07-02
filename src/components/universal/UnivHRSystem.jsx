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
    <div className="w-full">
      <div className="pb-6 shrink-0">
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

      <div className="flex-1 w-full pb-8">
        {activeTab === 'employees' && (
          <Suspense fallback={<div className="flex items-center justify-center py-20 text-[#71717a] dark:text-gray-400">Loading Employees...</div>}>
            <UnivHREmployee />
          </Suspense>
        )}
        {activeTab === 'departments' && <UnivDepartments />}
        {activeTab === 'roles' && <UnivAccessControl />}
        {activeTab === 'leave' && <UnivLeaveManagement />}
      </div>
    </div>
  );
}
