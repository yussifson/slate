import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { BookOpen, Search, PlayCircle, Clock, Users, Star, ArrowRight } from 'lucide-react';

export default function OnlineCourses() {
  const companyId = useCompanyId();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: courses = [] } = useQuery({
    queryKey: ["cases", companyId, "online_course"],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'online_course' }),
    enabled: !!companyId
  });

  const filteredCourses = courses.filter(c => 
    (c.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-[var(--color-border-subtle)] pb-4 flex justify-between items-end">
        <div>
          <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight">Course Catalog</h1>
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Manage learning modules, update curriculum, and track course performance.</p>
        </div>
        <button className="px-4 py-2 bg-[var(--color-module-online)] text-white text-sm font-medium rounded-[var(--radius-md)] hover:opacity-90 transition-opacity">
          Create Course
        </button>
      </div>

      <div className="flex items-center gap-4 bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
          <input 
            type="text" 
            placeholder="Search catalog..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] pl-9 pr-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-module-online)] focus:ring-1 focus:ring-[var(--color-module-online)] font-body"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.length === 0 ? (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] bg-[var(--color-surface-0)]">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20 text-[var(--color-text-tertiary)]" />
            <p className="font-medium text-[var(--color-text-primary)]">No courses found</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">Adjust your search or create a new course.</p>
          </div>
        ) : (
          filteredCourses.map((course, idx) => {
            let extra = {};
            try { extra = JSON.parse(course.notes || '{}'); } catch(e) {}
            
            return (
              <div key={idx} className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] shadow-sm overflow-hidden flex flex-col group hover:border-[var(--color-module-online)] transition-colors">
                <div className="aspect-video bg-[var(--color-surface-2)] relative flex items-center justify-center">
                  <PlayCircle className="w-10 h-10 text-[var(--color-module-online)] opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-2 right-2 px-2 py-1 bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] text-[10px] font-bold rounded shadow-sm text-[var(--color-text-secondary)] uppercase tracking-wider">
                    {extra.level || 'Beginner'}
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-[var(--color-text-primary)] mb-1">{course.title || 'Untitled Course'}</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mb-4 flex-1">
                    {course.description || 'No description provided.'}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-text-secondary)] pt-4 border-t border-[var(--color-border-subtle)]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" /> {extra.duration || '4 Weeks'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" /> {extra.enrolled || 0} Enrolled
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <Star className="w-3.5 h-3.5 text-[var(--color-warning)] fill-[var(--color-warning)]" /> 
                      <span className="font-medium text-[var(--color-text-primary)]">{extra.rating || '4.8'}</span> 
                      ({extra.reviews || 0} reviews)
                    </div>
                  </div>
                </div>
                <div className="bg-[var(--color-surface-1)] border-t border-[var(--color-border-subtle)] px-5 py-3">
                  <button className="text-sm font-semibold text-[var(--color-module-online)] flex items-center gap-1 hover:opacity-80 transition-opacity w-full justify-between">
                    Manage Course <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
