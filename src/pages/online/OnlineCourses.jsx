import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { BookOpen, Search, PlayCircle, Clock, Users, Star, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from "@/components/ui/use-toast";

export default function OnlineCourses() {
  const companyId = useCompanyId();
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: courses = [], isLoading } = useQuery({
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
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-[var(--color-module-online)] text-white text-sm font-medium rounded-[var(--radius-md)] hover:opacity-90 transition-opacity">
            Create Course
          </button>
        </div>
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
        {isLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] shadow-sm overflow-hidden flex flex-col animate-pulse">
              <div className="aspect-video bg-[var(--color-surface-2)] w-full"></div>
              <div className="p-5 flex flex-col flex-1 gap-3">
                <div className="h-5 bg-[var(--color-surface-2)] rounded w-3/4"></div>
                <div className="h-4 bg-[var(--color-surface-2)] rounded w-full"></div>
                <div className="h-4 bg-[var(--color-surface-2)] rounded w-5/6 mb-4"></div>
                <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-[var(--color-border-subtle)]">
                  <div className="h-3 bg-[var(--color-surface-2)] rounded w-16"></div>
                  <div className="h-3 bg-[var(--color-surface-2)] rounded w-20"></div>
                </div>
              </div>
            </div>
          ))
        ) : filteredCourses.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-full py-16 text-center border-2 border-dashed border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] bg-[var(--color-surface-0)] glass-card"
          >
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30 text-[var(--color-module-online)]" />
            <h3 className="font-semibold text-lg text-[var(--color-text-primary)] mb-1">No courses found</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-sm mx-auto">Get started by creating your first online course.</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {filteredCourses.map((course, idx) => {
              let extra = {};
              try { extra = JSON.parse(course.notes || '{}'); } catch(e) {}
              
              return (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  key={course.id || idx} 
                  className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] shadow-sm overflow-hidden flex flex-col group hover:border-[var(--color-module-online)] transition-all duration-300 hover:shadow-md glass-card"
                >
                  <div className="aspect-video bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-surface-3)] relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors z-10" />
                    <PlayCircle className="w-12 h-12 text-[var(--color-module-online)] opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 z-20 drop-shadow-md" />
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 dark:bg-black/50 backdrop-blur-sm border border-white/20 dark:border-white/10 text-[10px] font-bold rounded-md shadow-sm text-[var(--color-text-primary)] uppercase tracking-wider z-20">
                      {extra.level || 'Beginner'}
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-[var(--text-lg)] text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--color-module-online)] transition-colors">{course.title || 'Untitled Course'}</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4 flex-1 leading-relaxed">
                      {extra.description || 'No description provided for this course module.'}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs text-[var(--color-text-secondary)] pt-4 border-t border-[var(--color-border-subtle)]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-4 h-4 text-[var(--color-text-tertiary)]" /> {extra.duration || '4 Weeks'}
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Users className="w-4 h-4 text-[var(--color-text-tertiary)]" /> {(extra.enrolled || 0).toLocaleString()} Enrolled
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2 mt-1">
                        <div className="flex items-center">
                          {[1,2,3,4,5].map(star => (
                            <Star key={star} className={`w-3.5 h-3.5 ${star <= Math.floor(extra.rating || 4) ? 'text-[var(--color-warning)] fill-[var(--color-warning)]' : 'text-[var(--color-border-strong)]'}`} />
                          ))}
                        </div>
                        <span className="font-bold text-[var(--color-text-primary)] ml-1">{extra.rating || '4.8'}</span> 
                        <span className="text-[var(--color-text-tertiary)]">({(extra.reviews || 0).toLocaleString()} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[var(--color-surface-1)] border-t border-[var(--color-border-subtle)] px-5 py-3 group-hover:bg-[var(--color-module-online)] transition-colors duration-300">
                    <button className="text-sm font-semibold text-[var(--color-module-online)] group-hover:text-white flex items-center gap-1 transition-colors w-full justify-between">
                      Manage Course <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
