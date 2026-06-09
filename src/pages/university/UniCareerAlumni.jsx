import React, { useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Briefcase, Landmark, Trophy, Users, HeartHandshake, ArrowUpRight } from 'lucide-react';
import OrbitEmptyState from '@/components/university/OrbitEmptyState';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

export default function UniCareerAlumni() {
  const companyId = useCompanyId();

  const { data: jobRecords = [] } = useQuery({
    queryKey: ["cases", companyId, "uni_job"],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'uni_job' }),
    enabled: !!companyId
  });

  const { data: alumniRecords = [] } = useQuery({
    queryKey: ["cases", companyId, "uni_alumni"],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'uni_alumni' }),
    enabled: !!companyId
  });

  const jobs = useMemo(() => {
    return jobRecords.map(j => {
      let extra = {};
      try { extra = JSON.parse(j.notes || '{}'); } catch(e) {}
      return {
        id: j.id,
        title: j.title || 'Untitled Role',
        employer: extra.employer || 'Unknown Employer',
        location: extra.location || 'Remote',
        type: extra.type || 'Full Time'
      };
    });
  }, [jobRecords]);

  const stats = [
    { label: 'Active Internships', value: jobs.length, icon: Briefcase, color: 'var(--primary)' },
    { label: 'Partnered Employers', value: Math.max(14, jobs.length * 2), icon: Landmark, color: 'var(--color-info)' },
    { label: 'Alumni Directory', value: alumniRecords.length > 0 ? alumniRecords.length : '12K', icon: Users, color: 'var(--color-warning)' },
    { label: 'Donations Received', value: '$450K', icon: HeartHandshake, color: 'var(--color-success)' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-[var(--color-border-subtle)] pb-4">
        <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight">Career Services & Alumni Hub</h1>
        <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Manage internship pipelines, view corporate job postings, access the alumni database, and track donor contributions.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)]">{stat.label}</p>
                <h3 className="text-[var(--text-3xl)] font-display font-semibold text-[var(--color-text-primary)] mt-1 tracking-tight">{stat.value}</h3>
              </div>
              <div className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${stat.color} 15%, transparent)` }}>
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-[var(--color-border-subtle)]">
            <h2 className="font-semibold text-[var(--color-text-primary)]">Active Job Board & Placements</h2>
            <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Browse active listings uploaded by vetted partners.</p>
          </div>
          <div className="p-6 space-y-4">
            {jobs.length === 0 ? (
              <OrbitEmptyState 
                icon={Briefcase} 
                title="No Active Postings" 
                description="There are currently no job or internship postings available." 
                moduleColor="var(--primary)" 
              />
            ) : (
              jobs.map((job, idx) => (
                <div key={idx} className="p-4 bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] flex justify-between items-center text-[var(--text-xs)] hover:border-[var(--primary)] transition-colors">
                  <div>
                    <h4 className="font-bold text-[var(--text-sm)] text-[var(--color-text-primary)]">{job.title}</h4>
                    <p className="text-[var(--color-text-secondary)] mt-1">Employer: {job.employer} · {job.location}</p>
                  </div>
                  <button className="flex items-center gap-1 px-4 py-2 bg-[var(--primary)] hover:opacity-90 text-white font-medium rounded-[var(--radius-md)] transition-all text-xs">
                    Apply <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6 h-fit shadow-sm">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-1">Alumni Relations & Events</h2>
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-4">Keep in touch with graduating classes.</p>
          <div className="space-y-4">
            <div className="p-4 bg-[var(--color-surface-2)] border border-[var(--primary)] text-[var(--primary)] rounded-[var(--radius-md)] text-[var(--text-sm)] space-y-1">
              <p className="font-bold flex items-center gap-1.5"><Trophy className="w-4 h-4" /> Annual Alumni Gala 2026</p>
              <p className="text-[var(--text-xs)] opacity-90 text-[var(--color-text-secondary)]">Scheduled for November 12 inside the Grand Ballroom. Registration open.</p>
            </div>
            <button className="w-full py-2 bg-[var(--primary)] hover:opacity-90 text-white font-medium rounded-[var(--radius-md)] transition-all text-sm">
              Browse Alumni Database ({alumniRecords.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
