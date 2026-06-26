import React, { useRef } from 'react';
import { Award, Download, ExternalLink, ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { powerSync } from "@/api/PowerSyncConnector";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useToast } from "@/components/ui/use-toast";

export default function OnlineCertificates() {
  const { user, currentPlan } = useAuth();
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const { toast } = useToast();

  const isProOrAbove = ['super_admin', 'admin'].includes(user?.role) || currentPlan === 'pro' || currentPlan === 'enterprise';

  const { data: certificates = [] } = useQuery({
    queryKey: ["online_certificates", companyId, user?.id],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT * FROM online_certificates WHERE company_id = ? AND student_id = ? ORDER BY issue_date DESC`,
        [companyId, user?.id]
      );
      return rows || [];
    },
    enabled: !!companyId && !!user?.id && isProOrAbove
  });

  if (!isProOrAbove) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] p-8 text-center animate-in fade-in duration-500 max-w-lg mx-auto">
        <div className="w-20 h-20 bg-[var(--color-surface-2)] rounded-full flex items-center justify-center mb-6 border-[0.5px] border-black/9 dark:border-white/8 shadow-sm">
          <Lock className="w-10 h-10 text-[var(--color-text-tertiary)]" />
        </div>
        <h2 className="text-2xl font-semibold font-display text-[var(--color-text-primary)] mb-3 tracking-tight">Premium Feature</h2>
        <p className="text-[var(--text-md)] text-[var(--color-text-secondary)] mb-8 leading-relaxed">Official course certificates are only available on Pro and Enterprise plans. Upgrade your plan to generate, customize, and issue automated certificates.</p>
        <button onClick={() => navigate('/settings')} className="px-8 py-3 bg-[var(--primary)] text-white font-medium rounded-[var(--radius-md)] hover:opacity-90 transition-opacity shadow-sm">
          Upgrade to Pro
        </button>
      </div>
    );
  }

  const handleDownload = async (cert) => {
    toast({ title: "Downloading Certificate", description: "Preparing PDF for " + cert.course_title });
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById(`cert-content-${cert.id}`);
      const opt = {
        margin:       0.5,
        filename:     `${cert.course_title}_Certificate.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
      };
      html2pdf().set(opt).from(element).save();
      toast({ title: "Success", description: "Certificate downloaded successfully" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto py-6">
      <div className="border-b border-primary/40 pb-4 flex justify-between items-end">
        <div>
          <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">My Certificates</h1>
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">View and download your earned course certificates.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Blockchain Verified
        </div>
      </div>

      {certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-primary/20 rounded-2xl text-[var(--color-text-tertiary)]">
          <Award className="w-14 h-14 mb-4 opacity-20" />
          <p className="font-semibold text-[var(--color-text-secondary)]">No certificates yet</p>
          <p className="text-sm mt-1">Complete a course to earn your first certificate.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map(cert => (
            <div key={cert.id} className="bg-[var(--color-surface-0)] border border-primary/40 rounded-2xl overflow-hidden shadow-sm">
              {/* Printable cert body */}
              <div id={`cert-content-${cert.id}`} className="p-8 text-center bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20">
                <Award className="w-12 h-12 mx-auto text-violet-500 mb-3" />
                <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-2">Certificate of Completion</p>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">{cert.course_title || 'Course'}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">Awarded to <strong>{cert.student_name || user?.email}</strong></p>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  Issued {cert.issue_date ? new Date(cert.issue_date).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-primary/40 bg-[var(--color-surface-1)]">
                <span className="text-xs text-[var(--color-text-tertiary)] font-mono truncate max-w-[180px]">
                  ID: {cert.id?.slice(0, 16)}…
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(cert)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                  {cert.certificate_url && (
                    <a
                      href={cert.certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-primary/40 text-[var(--color-text-primary)] text-xs font-semibold rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
