import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Users, Search, Plus, GraduationCap } from 'lucide-react';
import { ModuleBanner, ViewModeToggle, StudentGridCard } from '@/components/school/SchoolViewKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { toast } from 'react-hot-toast';

export default function UniStudents() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  
  const { data: records = [] } = useQuery({ 
    queryKey: ["clients", companyId, "uni_student"], 
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'uni_student' }), 
    enabled: !!companyId 
  });
  
  const students = records.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
    return {
      id: r.id,
      name: r.name,
      studentId: r.id_number,
      phone: r.phone,
      status: r.status || 'Active',
      class: extra.major || 'Unknown Major', 
      major: extra.major || 'Unknown',
      faculty: extra.faculty || 'Unknown',
      enrollmentYear: extra.enrollmentYear || 'Unknown',
      feeStatus: extra.feeStatus || 'Paid',
      avatar: extra.avatar || r.name?.substring(0,2).toUpperCase()
    };
  });

  const filtered = students.filter(s =>
    (s.name?.toLowerCase().includes(search.toLowerCase()) || s.studentId?.includes(search))
  );

  return (
    <div className="space-y-6">
      <ModuleBanner
        title={t("uni_students", "University Students")}
        subtitle={t("manage_uni_students", "Manage university student records, majors, and enrollment")}
        metrics={[
          { title: "Total Students", value: students.length, icon: Users }
        ]}
      />
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4" /> Add Student
          </Button>
        </div>
      </div>
      
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No students found</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 bg-muted/20">
            {filtered.map(s => (
              <StudentGridCard key={s.id} student={s} />
            ))}
          </div>
        ) : (
          <div className="p-6">List view under construction</div>
        )}
      </div>
    </div>
  );
}
