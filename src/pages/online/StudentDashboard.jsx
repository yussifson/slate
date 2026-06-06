import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { BookOpen, PlayCircle, Award, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
  const companyId = useCompanyId();
  const navigate = useNavigate();

  // For a real app we would filter courses by enrolled student ID.
  const { data: courses = [] } = useQuery({
    queryKey: ["cases", companyId, "online_course"],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'online_course' }),
    enabled: !!companyId
  });

  const enrolledCourses = courses.slice(0, 3); // mock enrollment

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto py-6 px-4">
      <div className="flex justify-between items-center bg-gradient-to-r from-[var(--color-module-online)] to-[var(--color-success)] rounded-[var(--radius-xl)] p-8 text-white shadow-md">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Welcome back, Learner!</h1>
          <p className="opacity-90 max-w-lg">Pick up where you left off. You have 2 courses in progress and 1 new certificate available.</p>
        </div>
        <div className="hidden md:flex gap-6">
          <div className="text-center bg-white/20 p-4 rounded-xl backdrop-blur-sm border border-white/30">
            <h3 className="text-3xl font-bold font-display">12</h3>
            <p className="text-xs uppercase tracking-wider font-semibold opacity-90 mt-1">Hours Learned</p>
          </div>
          <div className="text-center bg-white/20 p-4 rounded-xl backdrop-blur-sm border border-white/30">
            <h3 className="text-3xl font-bold font-display">3</h3>
            <p className="text-xs uppercase tracking-wider font-semibold opacity-90 mt-1">Certificates</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] font-display">In Progress</h2>
            <button onClick={() => navigate('/o/courses')} className="text-sm font-semibold text-[var(--color-module-online)] hover:underline">View Catalog</button>
          </div>
          
          <div className="space-y-4">
            {enrolledCourses.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] bg-[var(--color-surface-0)]">
                <BookOpen className="w-12 h-12 mx-auto text-[var(--color-text-tertiary)] mb-3" />
                <p className="font-medium text-[var(--color-text-primary)]">No active courses</p>
                <button onClick={() => navigate('/o/courses')} className="mt-3 px-4 py-2 bg-[var(--color-surface-1)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] text-sm font-medium rounded-[var(--radius-md)] hover:bg-[var(--color-surface-2)] transition-colors">
                  Browse Catalog
                </button>
              </div>
            ) : (
              enrolledCourses.map((course, idx) => (
                <div key={idx} className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-5 shadow-sm flex flex-col sm:flex-row gap-5 items-start sm:items-center group hover:border-[var(--color-module-online)] transition-colors">
                  <div className="w-full sm:w-48 aspect-video bg-[var(--color-surface-2)] rounded-[var(--radius-md)] flex items-center justify-center relative overflow-hidden flex-shrink-0">
                    <PlayCircle className="w-8 h-8 text-[var(--color-module-online)] opacity-60 z-10" />
                    <div className="absolute bottom-0 left-0 h-1 bg-[var(--color-surface-1)] w-full">
                      <div className="h-full bg-[var(--color-module-online)] w-[65%]" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[var(--text-lg)] text-[var(--color-text-primary)] truncate">{course.title || 'Untitled Course'}</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                      {JSON.parse(course.notes || '{}').description || 'Continue your learning journey with module 4.'}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs font-semibold text-[var(--color-module-online)]">65% Complete</span>
                      <span className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 2h 15m left</span>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/o/learn/${course.id}`)} className="w-full sm:w-auto px-4 py-2 bg-[var(--color-surface-1)] text-[var(--color-text-primary)] border border-[var(--color-border-default)] text-sm font-medium rounded-[var(--radius-md)] hover:bg-[var(--color-module-online)] hover:text-white hover:border-[var(--color-module-online)] transition-colors whitespace-nowrap">
                    Resume
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 font-display">Upcoming Live Sessions</h2>
            <div className="space-y-4">
              <div className="p-3 bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)]">
                <div className="text-xs font-bold text-[var(--color-warning)] uppercase tracking-wider mb-1">Today, 2:00 PM</div>
                <h4 className="font-semibold text-[var(--color-text-primary)] text-sm">Advanced React Patterns Q&A</h4>
                <button className="text-xs font-semibold text-[var(--color-module-online)] mt-2 flex items-center gap-1 hover:underline">
                  Join Room <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 font-display flex items-center gap-2">
              <Award className="w-5 h-5 text-[var(--color-success)]" /> Earned Certificates
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 hover:bg-[var(--color-surface-1)] rounded-[var(--radius-md)] transition-colors cursor-pointer border border-transparent hover:border-[var(--color-border-subtle)]">
                <div className="w-10 h-10 bg-[var(--color-success-subtle)] text-[var(--color-success)] rounded-full flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-[var(--color-text-primary)] text-sm truncate">React Foundations</h4>
                  <p className="text-xs text-[var(--color-text-secondary)]">Issued: Sep 15, 2026</p>
                </div>
              </div>
              <button onClick={() => navigate('/o/certificates')} className="w-full text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] py-2 transition-colors">
                View All Certificates
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
