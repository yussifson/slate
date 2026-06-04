import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, BookOpen, Clock, Users, PlayCircle, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function OnlineCourses() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: courses = [], isLoading } = useQuery({ 
    queryKey: ["online_courses", companyId], 
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'online_course' }), 
    enabled: !!companyId 
  });

  const filteredCourses = courses.filter(c => 
    c.case_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("online_courses", "Course Catalog")} 
        subtitle="Create, manage, and publish your online courses." 
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search courses..." 
            className="pl-9 bg-white border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white shadow-sm">
          <Plus className="h-4 w-4 mr-2" /> Create Course
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading courses...</div>
      ) : filteredCourses.length === 0 ? (
        <Card className="border-slate-200 shadow-sm border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No courses found</h3>
            <p className="text-sm text-slate-500 mb-4">Get started by creating your first online course.</p>
            <Button variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50">
              <Plus className="h-4 w-4 mr-2" /> Create Course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            let meta = {};
            try { meta = JSON.parse(course.notes || '{}'); } catch(e) {}
            
            const isPublished = course.status === 'Active';
            
            return (
              <Card key={course.id} className="group overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  {meta.thumbnail ? (
                    <img src={meta.thumbnail} alt={course.case_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                      <PlayCircle className="w-16 h-16 text-purple-300 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={cn(
                      "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm",
                      isPublished ? "bg-emerald-500/90 text-white" : "bg-amber-500/90 text-white"
                    )}>
                      {isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="bg-black/70 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> {meta.rating || '4.8'}
                    </span>
                  </div>
                </div>
                
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">{meta.category || 'Development'}</p>
                    <p className="text-sm font-black text-slate-900">${meta.price || '49.99'}</p>
                  </div>
                  
                  <h3 className="font-bold text-lg text-slate-900 leading-tight mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                    {course.case_name}
                  </h3>
                  
                  <div className="mt-auto pt-4 space-y-3">
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {meta.duration || '4h 30m'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> {meta.enrollments || '1,234'} enrolled
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 flex gap-2">
                      <Button variant="outline" className="flex-1 text-slate-600">Edit</Button>
                      <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">Manage</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
