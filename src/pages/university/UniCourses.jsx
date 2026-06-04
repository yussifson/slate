import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { BookOpen, Search, Plus } from 'lucide-react';
import { ModuleBanner, ViewModeToggle, ClassGridCard } from '@/components/school/SchoolViewKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";

export default function UniCourses() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  
  const { data: records = [] } = useQuery({ 
    queryKey: ["cases", companyId, "uni_course"], 
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'uni_course' }), 
    enabled: !!companyId 
  });
  
  const courses = records.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
    return {
      id: r.id,
      name: r.case_name || r.name,
      subject: extra.code || 'Course Code',
      teacher: extra.lecturer || 'Unassigned',
      students: extra.enrolled || 0,
      schedule: extra.schedule || 'TBA',
      credits: extra.credits || 3,
      prerequisites: extra.prerequisites || 'None'
    };
  });

  const filtered = courses.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <ModuleBanner
        title={t("uni_courses", "Course Catalog")}
        subtitle={t("manage_courses", "Manage courses, credit hours, and lecturers")}
        metrics={[
          { title: "Total Courses", value: courses.length, icon: BookOpen }
        ]}
      />
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4" /> Add Course
          </Button>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
           <div className="text-center py-12 text-muted-foreground">
             <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
             <p>No courses found</p>
           </div>
        ) : viewMode === 'grid' ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-muted/20">
             {filtered.map(c => (
               <ClassGridCard key={c.id} classInfo={c} />
             ))}
           </div>
        ) : (
           <div className="p-6">List view under construction</div>
        )}
      </div>
    </div>
  );
}
