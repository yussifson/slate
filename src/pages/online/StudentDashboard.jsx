import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { BookOpen, PlayCircle, Award, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudentDashboard() {
  const companyId = useCompanyId();
  const navigate = useNavigate();

  const { data: courses = [] } = useQuery({
    queryKey: ["cases", companyId, "online_course"],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'online_course' }),
    enabled: !!companyId
  });

  const enrolledCourses = courses;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto py-6 px-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center bg-gradient-to-r from-[var(--color-module-online)] to-[hsl(213,89%,35%)] rounded-[var(--radius-xl)] p-8 text-white shadow-lg overflow-hidden relative"
      >
        {/* Noise overlay removed to fix 404 */}
        <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-white/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-display font-bold mb-2">Welcome back, Learner!</h1>
          <p className="opacity-90 max-w-lg">Pick up where you left off. You have 2 courses in progress and 1 new certificate available.</p>
        </div>
        <div className="hidden md:flex gap-6 relative z-10">
          <div className="text-center bg-black/10 p-5 rounded-xl backdrop-blur-md border border-white/20 shadow-inner">
            <h3 className="text-4xl font-bold font-display tracking-tight">0</h3>
            <p className="text-[10px] uppercase tracking-widest font-bold opacity-80 mt-1">Hours Learned</p>
          </div>
          <div className="text-center bg-black/10 p-5 rounded-xl backdrop-blur-md border border-white/20 shadow-inner">
            <h3 className="text-4xl font-bold font-display tracking-tight">0</h3>
            <p className="text-[10px] uppercase tracking-widest font-bold opacity-80 mt-1">Certificates</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] font-display">In Progress</h2>
            <button onClick={() => navigate('/o/courses')} className="text-sm font-semibold text-[var(--color-module-online)] hover:underline">View Catalog</button>
          </div>
          
          <div className="space-y-4">
            {enrolledCourses.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-10 text-center border-2 border-dashed border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] bg-[var(--color-surface-0)] glass-card"
              >
                <BookOpen className="w-12 h-12 mx-auto text-[var(--color-module-online)] opacity-30 mb-4" />
                <h3 className="font-semibold text-lg text-[var(--color-text-primary)]">No active courses</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1 mb-6">You aren't enrolled in any courses yet. Explore our catalog to start learning.</p>
                <button onClick={() => navigate('/o/courses')} className="px-5 py-2.5 bg-[var(--color-module-online)] text-white text-sm font-semibold rounded-full hover:opacity-90 transition-opacity shadow-md">
                  Browse Catalog
                </button>
              </motion.div>
            ) : (
              <AnimatePresence>
                {enrolledCourses.map((course, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={course.id || idx} 
                    className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-5 shadow-sm flex flex-col sm:flex-row gap-5 items-start sm:items-center group hover:border-[var(--color-module-online)] hover:shadow-md transition-all duration-300 glass-card"
                  >
                    <div className="w-full sm:w-48 aspect-video bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-surface-3)] rounded-[var(--radius-lg)] flex items-center justify-center relative overflow-hidden flex-shrink-0">
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors z-10" />
                      <PlayCircle className="w-10 h-10 text-[var(--color-module-online)] opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 z-20 drop-shadow-md" />
                      <div className="absolute bottom-0 left-0 h-1.5 bg-[var(--color-surface-1)] w-full z-20">
                        <div className="h-full bg-[var(--color-module-online)] w-[65%]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[var(--text-lg)] text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-module-online)] transition-colors">{course.title || 'Untitled Course'}</h3>
                      <p className="text-sm text-[var(--color-text-secondary)] mt-1.5 line-clamp-2 leading-relaxed">
                        {JSON.parse(course.notes || '{}').description || 'Continue your learning journey with module 4.'}
                      </p>
                      <div className="flex items-center gap-4 mt-4">
                        <span className="text-xs font-medium text-[var(--color-text-tertiary)] flex items-center gap-1.5">No progress yet</span>
                      </div>
                    </div>
                    <button onClick={() => navigate(`/o/learn/${course.id}`)} className="w-full sm:w-auto px-5 py-2.5 bg-[var(--color-surface-1)] text-[var(--color-module-online)] border border-[var(--color-module-online)]/30 text-sm font-semibold rounded-full hover:bg-[var(--color-module-online)] hover:text-white hover:border-[var(--color-module-online)] transition-colors whitespace-nowrap shadow-sm group-hover:shadow-md">
                      Resume
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6 shadow-sm glass-card">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-5 font-display flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-[var(--color-module-online)]" /> Upcoming Live Sessions
            </h2>
            <div className="text-center py-6 border-2 border-dashed border-[var(--color-border-subtle)] rounded-[var(--radius-lg)]">
              <p className="text-sm text-[var(--color-text-secondary)]">No upcoming sessions.</p>
            </div>
          </div>

          <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6 shadow-sm glass-card">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-5 font-display flex items-center gap-2">
              <Award className="w-5 h-5 text-[hsl(158,68%,38%)]" /> Earned Certificates
            </h2>
            <div className="space-y-3">
              <div className="text-center py-6 border-2 border-dashed border-[var(--color-border-subtle)] rounded-[var(--radius-lg)]">
                <p className="text-sm text-[var(--color-text-secondary)]">No certificates earned yet.</p>
              </div>
              <button onClick={() => navigate('/o/certificates')} className="w-full text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] py-2.5 transition-colors mt-2 hover:bg-[var(--color-surface-1)]">
                View All Certificates
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
