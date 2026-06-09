import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Award, BookOpen, Layers, CheckCircle2, ShieldCheck, Plus, Sparkles } from 'lucide-react';
import OrbitStatusBadge from '@/components/university/OrbitStatusBadge';

export default function UniResearchActivity() {
  const companyId = useCompanyId();

  const { data: research = [] } = useQuery({
    queryKey: ["cases", companyId, "uni_research"],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'uni_research' }),
    enabled: !!companyId
  });

  const activeProjects = research.filter(r => r.status === 'Active');
  const pendingEthics = research.filter(r => r.status === 'Ethics Review');

  const stats = [
    { label: 'Active Projects', value: activeProjects.length || 24, icon: Layers, color: 'var(--primary)' },
    { label: 'Publications & Journals', value: '142', icon: BookOpen, color: 'var(--color-info)' },
    { label: 'Ethics Approvals', value: `${pendingEthics.length || 12} Pending`, icon: ShieldCheck, color: 'var(--color-warning)' },
    { label: 'Grant Value YTD', value: '$1.4M', icon: Award, color: 'var(--color-success)' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-end justify-between border-b border-[var(--color-border-subtle)] pb-4">
        <div>
          <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight">Research Activity & Grants Hub</h1>
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Manage academic research proposals, publication indices, ethics reviews, and external grant awards.</p>
        </div>
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
        <div className="lg:col-span-2 bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-[var(--color-text-primary)]">Research & Projects Directory</h2>
              <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Academic investigations, field research, and publications portfolio.</p>
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] hover:opacity-90 text-white text-sm font-medium rounded-[var(--radius-md)] transition-all">
              <Plus className="w-4 h-4" /> Add Proposal
            </button>
          </div>
          <div className="p-6">
            {research.length === 0 ? (
              <div className="space-y-4">
                <div className="p-4 bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-[var(--text-sm)] text-[var(--color-text-primary)] flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[var(--color-warning)]" /> Quantum Cryptography Initiatives</h4>
                    <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)] mt-0.5">Principal Investigator: Dr. Alan Turing · Department of Physics</p>
                  </div>
                  <OrbitStatusBadge status="Active" />
                </div>
                <div className="p-4 bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-[var(--text-sm)] text-[var(--color-text-primary)] flex items-center gap-1.5">Machine Learning Ethics & Fairness</h4>
                    <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)] mt-0.5">Principal Investigator: Prof. Ada Lovelace · Computer Science School</p>
                  </div>
                  <OrbitStatusBadge status="Reviewing" label="Ethics Review" />
                </div>
                <div className="p-4 bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-[var(--text-sm)] text-[var(--color-text-primary)] flex items-center gap-1.5">Sustainable Bio-Concrete Development</h4>
                    <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)] mt-0.5">Principal Investigator: Dr. Richard Feynman · Department of Materials Engineering</p>
                  </div>
                  <OrbitStatusBadge status="Active" />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {research.map((item, i) => {
                  let info = {}; try { info = JSON.parse(item.notes); } catch(e){}
                  return (
                    <div key={i} className="p-4 bg-[var(--color-surface-1)] rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-[var(--color-text-primary)] text-[var(--text-sm)]">{info.title || "Research Project"}</h4>
                        <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)]">PI: {info.investigator || "Staff"} · Category: {info.category || "General"}</p>
                      </div>
                      <OrbitStatusBadge status={item.status === 'Active' ? 'Active' : 'Reviewing'} label={item.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6 h-fit shadow-sm">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-1">Ethics Approval Pipeline</h2>
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-6">Ethics clearances from Institutional Review Board (IRB).</p>
          <div className="space-y-6">
            <div className="p-4 bg-[var(--color-info-subtle)] border border-[var(--color-info)] rounded-[var(--radius-xl)] flex gap-3 items-start">
              <CheckCircle2 className="w-5 h-5 text-[var(--color-info)] mt-0.5 shrink-0" />
              <div>
                <h5 className="text-[var(--text-sm)] font-bold text-[var(--color-text-primary)]">IRB Review Meeting</h5>
                <p className="text-[var(--text-xs)] text-[var(--color-info)] opacity-90 mt-0.5">Scheduled for Monday at 10:00 AM. 4 applications are on the agenda.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[var(--text-xs)] pb-2 border-b border-[var(--color-border-subtle)]">
                <span className="font-semibold text-[var(--color-text-primary)]">Cognitive Development Analysis</span>
                <span className="text-[var(--color-warning)] font-bold">In Progress</span>
              </div>
              <div className="flex justify-between items-center text-[var(--text-xs)] pb-2 border-b border-[var(--color-border-subtle)]">
                <span className="font-semibold text-[var(--color-text-primary)]">Clinical Trial Phase 1</span>
                <span className="text-[var(--color-info)] font-bold">Approved</span>
              </div>
              <div className="flex justify-between items-center text-[var(--text-xs)]">
                <span className="font-semibold text-[var(--color-text-primary)]">Urban Heat Island Mitigation</span>
                <span className="text-[var(--color-danger)] font-bold">Revisions Requested</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
