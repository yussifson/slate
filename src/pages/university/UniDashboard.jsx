import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Users, BookOpen, Building, GraduationCap, DollarSign, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import OrbitEmptyState from '@/components/university/OrbitEmptyState';

export default function UniDashboard() {
  const companyId = useCompanyId();

  const { data: students = [] } = useQuery({
    queryKey: ["clients", companyId, "uni_student"],
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'uni_student' }),
    enabled: !!companyId
  });

  const { data: admissions = [] } = useQuery({
    queryKey: ["clients", companyId, "uni_admission"],
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'uni_admission' }),
    enabled: !!companyId
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["cases", companyId, "uni_course"],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'uni_course' }),
    enabled: !!companyId
  });

  const { data: faculties = [] } = useQuery({
    queryKey: ["cases", companyId, "uni_faculty"],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'uni_faculty' }),
    enabled: !!companyId
  });

  const { data: finances = [] } = useQuery({
    queryKey: ["cases", companyId, "uni_finance"],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'uni_finance' }),
    enabled: !!companyId
  });

  const recentStudents = students.slice(0, 4);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-[var(--color-border-subtle)] pb-4">
        <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight">University Dashboard</h1>
        <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Comprehensive overview of campus activities and metrics.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[var(--radius-xl)] p-6 text-white shadow-md shadow-indigo-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white/90">New Admissions</h3>
            <GraduationCap className="w-5 h-5 text-white/80" />
          </div>
          <div>
            <div className="text-[var(--text-3xl)] font-display font-bold tracking-tight">{admissions.length}</div>
            <p className="text-[var(--text-sm)] text-indigo-100 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +12% from last term
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[var(--radius-xl)] p-6 text-white shadow-md shadow-emerald-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white/90">Financials (YTD)</h3>
            <DollarSign className="w-5 h-5 text-white/80" />
          </div>
          <div>
            <div className="text-[var(--text-3xl)] font-display font-bold tracking-tight">${finances.length * 1500 + 45000}</div>
            <p className="text-[var(--text-sm)] text-emerald-100 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> Steady cash flow
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-[var(--radius-xl)] p-6 text-white shadow-md shadow-amber-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white/90">Upcoming Events</h3>
            <Calendar className="w-5 h-5 text-white/80" />
          </div>
          <div>
            <div className="text-[var(--text-3xl)] font-display font-bold tracking-tight">8</div>
            <p className="text-[var(--text-sm)] text-amber-100 mt-1">
              Next: Orientation
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-[var(--radius-xl)] p-6 text-white shadow-md shadow-rose-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white/90">Pending Actions</h3>
            <Building className="w-5 h-5 text-white/80" />
          </div>
          <div>
            <div className="text-[var(--text-3xl)] font-display font-bold tracking-tight">14</div>
            <p className="text-[var(--text-sm)] text-rose-100 mt-1">
              Requires attention
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6 shadow-sm">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-1">Recent Enrollments</h2>
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-6">Latest students who have completed registration.</p>
          
          {students.length === 0 ? (
            <OrbitEmptyState icon={Users} title="No recent enrollments" description="No students have enrolled recently." moduleColor="var(--color-module-orbit)" />
          ) : (
            <div className="space-y-4">
              {recentStudents.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-module-orbit)] text-white flex items-center justify-center font-bold">
                      {s.name?.substring(0, 2).toUpperCase() || 'UN'}
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text-sm)] text-[var(--color-text-primary)]">{s.name}</p>
                      <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)]">{s.email || 'No email provided'}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-[11px] font-bold tracking-wider uppercase rounded-[var(--radius-sm)] border border-[var(--color-module-orbit)] text-[var(--color-module-orbit)] bg-white">
                    Enrolled
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-1 bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6 shadow-sm h-fit">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-1">Quick Actions</h2>
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-6">Manage key areas</p>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 border border-[var(--color-border-default)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors">
              <span className="flex items-center gap-2 font-medium text-sm"><GraduationCap className="w-4 h-4 text-[var(--color-module-admissions)]" /> Review Admissions</span>
              <ArrowRight className="w-4 h-4 text-[var(--color-text-tertiary)]" />
            </button>
            <button className="w-full flex items-center justify-between p-3 border border-[var(--color-border-default)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors">
              <span className="flex items-center gap-2 font-medium text-sm"><DollarSign className="w-4 h-4 text-[var(--color-module-finance)]" /> Process Payments</span>
              <ArrowRight className="w-4 h-4 text-[var(--color-text-tertiary)]" />
            </button>
            <button className="w-full flex items-center justify-between p-3 border border-[var(--color-border-default)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors">
              <span className="flex items-center gap-2 font-medium text-sm"><BookOpen className="w-4 h-4 text-[var(--color-module-courses)]" /> Update Courses</span>
              <ArrowRight className="w-4 h-4 text-[var(--color-text-tertiary)]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
