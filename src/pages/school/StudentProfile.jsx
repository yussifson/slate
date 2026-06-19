import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Mail, Phone, GraduationCap, HeartPulse, Shield, BookOpen } from 'lucide-react';

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('academics');

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      const rec = await base44.entities.Client.get(id);
      if (!rec || String(rec.company_id) !== String(companyId)) throw new Error("Student not found");
      let extra = {};
      try { extra = JSON.parse(rec.notes || '{}'); } catch(e) {}
      return { ...rec, ...extra };
    },
    enabled: !!id && !!companyId
  });

  if (isLoading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-[var(--primary)] font-semibold animate-pulse text-lg tracking-tight">Loading Profile...</div>
    </div>
  );
  if (!student) return <div className="p-8 text-center text-[var(--color-destructive)] font-medium border-[0.5px] border-black/9 dark:border-white/8 border-[var(--color-destructive)]/30 rounded-md-[var(--radius-xl)] bg-[var(--color-destructive)]/5">Student not found.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-primary/40 pb-4">
        <Button variant="ghost" onClick={() => navigate('/school/students')} className="gap-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--primary)] rounded-full">
          <ArrowLeft className="w-5 h-5" /> Back to Directory
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Profile Sidebar */}
        <div className="space-y-6 md:col-span-1">
          <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-6 text-center rounded-md-[var(--radius-xl)]">
            <div className="w-24 h-24 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full mx-auto flex items-center justify-center text-3xl font-semibold mb-4 border-[0.5px] border-black/9 dark:border-white/8 border-[var(--primary)]/20 tracking-[-0.02em]">
              {student.avatar || student.name?.substring(0, 2).toUpperCase()}
            </div>
            <h2 className="text-xl font-display font-semibold text-[var(--color-text-primary)] mb-1 leading-tight tracking-tight">{student.name}</h2>
            <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-4 tracking-[0.04em]">{student.id_number}</p>
            <div className="inline-block px-3 py-1 bg-[var(--color-surface-1)] text-[var(--primary)] text-[10px] font-semibold uppercase tracking-[var(--tracking-widest)] border-[0.5px] border-black/9 dark:border-white/8 border-[var(--primary)]/20 rounded-full tracking-[0.04em]">
              {student.status || 'Active'}
            </div>
          </div>

          <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden">
            <div className="bg-[var(--color-surface-1)] border-b border-primary/20 text-[var(--color-text-primary)] p-4 font-semibold text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--primary)]"/> Overview
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col">
                <span className="text-[var(--color-text-tertiary)] text-[11px] font-semibold uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Class</span>
                <span className="font-semibold text-[var(--color-text-primary)] text-base">{student.class}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[var(--color-text-tertiary)] text-[11px] font-semibold uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Gender</span>
                <span className="font-semibold text-[var(--color-text-primary)] text-base">{student.gender}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[var(--color-text-tertiary)] text-[11px] font-semibold uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Date of Birth</span>
                <span className="font-semibold text-[var(--color-text-primary)] text-base">{student.dateOfBirth || `${student.age} yrs`}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Details */}
        <div className="md:col-span-3">
          {/* Custom Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 scrollbar-hide overflow-x-auto">
            <button onClick={() => setActiveTab('academics')} className={`px-5 py-2.5 font-semibold text-sm transition-colors rounded-full whitespace-nowrap ${activeTab === 'academics' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 text-[var(--color-text-secondary)] hover:border-primary/40'}`}>Academics</button>
            <button onClick={() => setActiveTab('contact')} className={`px-5 py-2.5 font-semibold text-sm transition-colors rounded-full whitespace-nowrap ${activeTab === 'contact' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 text-[var(--color-text-secondary)] hover:border-primary/40'}`}>Contact Info</button>
            <button onClick={() => setActiveTab('medical')} className={`px-5 py-2.5 font-semibold text-sm transition-colors rounded-full whitespace-nowrap ${activeTab === 'medical' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 text-[var(--color-text-secondary)] hover:border-primary/40'}`}>Medical</button>
          </div>

          <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] min-h-[400px]">
            {activeTab === 'academics' && (
              <div className="p-8 animate-in fade-in">
                <h3 className="text-2xl font-display font-semibold text-[var(--color-text-primary)] mb-6 flex items-center gap-3 tracking-tight tracking-[-0.02em]">
                  <div className="w-10 h-10 rounded-md-[var(--radius-md)] bg-[var(--primary)]/10 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  Academic Dossier
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[var(--color-surface-1)] p-5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-md-[var(--radius-lg)]">
                    <span className="text-[var(--color-text-tertiary)] text-[11px] font-semibold uppercase tracking-[var(--tracking-widest)] block mb-1 tracking-[0.04em]">Previous School</span>
                    <span className="font-semibold text-[var(--color-text-primary)] text-lg">{student.previousSchool || 'N/A'}</span>
                  </div>
                  <div className="bg-[var(--color-surface-1)] p-5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-md-[var(--radius-lg)]">
                    <span className="text-[var(--color-text-tertiary)] text-[11px] font-semibold uppercase tracking-[var(--tracking-widest)] block mb-1 tracking-[0.04em]">Transfer Status</span>
                    <span className="font-semibold text-[var(--color-text-primary)] text-lg">{student.transferStatus || 'No'}</span>
                  </div>
                  <div className="bg-[var(--color-surface-1)] p-5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-md-[var(--radius-lg)]">
                    <span className="text-[var(--color-text-tertiary)] text-[11px] font-semibold uppercase tracking-[var(--tracking-widest)] block mb-1 tracking-[0.04em]">Alumni Status</span>
                    <span className="font-semibold text-[var(--color-text-primary)] text-lg">{student.alumniStatus || 'Active'}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="p-8 animate-in fade-in">
                <h3 className="text-2xl font-display font-semibold text-[var(--color-text-primary)] mb-6 flex items-center gap-3 tracking-tight tracking-[-0.02em]">
                  <div className="w-10 h-10 rounded-md-[var(--radius-md)] bg-[var(--primary)]/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  Contact & Guardians
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 bg-[var(--color-surface-1)] rounded-md-[var(--radius-lg)] p-5">
                    <span className="text-[var(--color-text-tertiary)] text-[11px] font-semibold uppercase tracking-[var(--tracking-widest)] flex items-center gap-2 mb-2 tracking-[0.04em]"><User className="w-3.5 h-3.5"/> Parent/Guardian</span>
                    <p className="font-semibold text-[var(--color-text-primary)] text-xl">{student.parent || 'Not Provided'}</p>
                  </div>
                  <div className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 bg-[var(--color-surface-1)] rounded-md-[var(--radius-lg)] p-5">
                    <span className="text-[var(--color-text-tertiary)] text-[11px] font-semibold uppercase tracking-[var(--tracking-widest)] flex items-center gap-2 mb-2 tracking-[0.04em]"><Phone className="w-3.5 h-3.5"/> Phone</span>
                    <p className="font-semibold text-[var(--color-text-primary)] text-xl">{student.phone || 'Not Provided'}</p>
                  </div>
                  <div className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 bg-[var(--color-surface-1)] rounded-md-[var(--radius-lg)] p-5">
                    <span className="text-[var(--color-text-tertiary)] text-[11px] font-semibold uppercase tracking-[var(--tracking-widest)] flex items-center gap-2 mb-2 tracking-[0.04em]"><Mail className="w-3.5 h-3.5"/> Email</span>
                    <p className="font-semibold text-[var(--color-text-primary)] text-base truncate">{student.parentEmail || 'Not Provided'}</p>
                  </div>
                  <div className="border-[0.5px] border-black/9 dark:border-white/8 border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 rounded-md-[var(--radius-lg)] p-5">
                    <span className="text-[var(--color-destructive)] text-[11px] font-semibold uppercase tracking-[var(--tracking-widest)] flex items-center gap-2 mb-2 tracking-[0.04em]"><Shield className="w-3.5 h-3.5"/> Emergency Contact</span>
                    <p className="font-semibold text-[var(--color-destructive)] text-xl">{student.emergencyContactName || 'Not Provided'}</p>
                    {student.emergencyContactPhone && <p className="font-medium text-[var(--color-destructive)]/80 mt-1">{student.emergencyContactPhone}</p>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'medical' && (
              <div className="p-8 animate-in fade-in">
                <h3 className="text-2xl font-display font-semibold text-[var(--color-text-primary)] mb-6 flex items-center gap-3 tracking-tight tracking-[-0.02em]">
                  <div className="w-10 h-10 rounded-md-[var(--radius-md)] bg-[var(--primary)]/10 flex items-center justify-center">
                    <HeartPulse className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  Health Records
                </h3>
                <div className="bg-[var(--color-surface-1)] border-l-4 border-[var(--primary)] rounded-md-r-[var(--radius-lg)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm">
                  <p className="text-sm font-medium text-[var(--color-text-secondary)] leading-relaxed">
                    {student.medicalNotes || "No medical conditions or allergies reported in the current system records."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
