import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { BookOpen, Search, Plus, Clock, Users, Calendar, Award } from 'lucide-react';
import { ModuleBanner, ClassGridCard } from '@/components/school/SchoolViewKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function UniCourses() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');
  
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
      name: r.case_name || r.name || 'Untitled Course',
      code: extra.code || `CS${Math.floor(Math.random() * 800) + 101}`,
      teacher: extra.lecturer || 'Prof. Unassigned',
      students: extra.enrolled || Math.floor(Math.random() * 150) + 10,
      credits: extra.credits || [3, 4, 5][Math.floor(Math.random() * 3)],
      schedule: extra.schedule || 'MWF 10:00 AM',
      term: extra.term || 'Fall 2026',
      status: extra.status || 'Active'
    };
  });

  const filtered = courses.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <ModuleBanner
        title={t("uni_courses", "Course Catalog")}
        subtitle={t("manage_courses", "Manage academic courses, credit hours, and faculty assignments")}
        metrics={[
          { title: "Total Courses", value: courses.length, icon: BookOpen }
        ]}
      />
      
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by course name or code..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-9 border-slate-200 focus-visible:ring-primary" 
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/10">
            <Plus className="w-4 h-4" /> Create Course
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.length === 0 ? (
           <div className="col-span-full text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200 shadow-sm">
             <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <p className="text-lg">No courses found</p>
           </div>
        ) : (
           filtered.map(course => (
             <Card key={course.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group flex flex-col">
               <CardContent className="p-0 flex flex-col h-full">
                 <div className="p-5 border-b border-slate-100 flex-1">
                   <div className="flex justify-between items-start mb-3">
                     <Badge className="bg-primary/10 text-primary border-primary/20 font-mono">
                       {course.code}
                     </Badge>
                     <Badge variant="outline" className={course.status === 'Active' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-amber-600 border-amber-200 bg-amber-50'}>
                       {course.status}
                     </Badge>
                   </div>
                   <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                     {course.name}
                   </h3>
                   <p className="text-sm text-slate-500 mb-4">{course.teacher}</p>
                   
                   <div className="space-y-2 mt-auto">
                     <div className="flex items-center text-xs text-slate-500">
                       <Clock className="w-3.5 h-3.5 mr-2 text-slate-400" />
                       {course.schedule}
                     </div>
                     <div className="flex items-center text-xs text-slate-500">
                       <Calendar className="w-3.5 h-3.5 mr-2 text-slate-400" />
                       {course.term}
                     </div>
                   </div>
                 </div>
                 <div className="bg-slate-50 p-4 grid grid-cols-2 gap-2 divide-x divide-slate-200">
                   <div className="flex flex-col items-center justify-center">
                     <div className="flex items-center text-slate-600 mb-1">
                       <Users className="w-3.5 h-3.5 mr-1" />
                       <span className="text-xs font-medium">Enrolled</span>
                     </div>
                     <span className="font-bold text-slate-900">{course.students}</span>
                   </div>
                   <div className="flex flex-col items-center justify-center">
                     <div className="flex items-center text-slate-600 mb-1">
                       <Award className="w-3.5 h-3.5 mr-1" />
                       <span className="text-xs font-medium">Credits</span>
                     </div>
                     <span className="font-bold text-slate-900">{course.credits}</span>
                   </div>
                 </div>
               </CardContent>
             </Card>
           ))
        )}
      </div>
    </div>
  );
}
