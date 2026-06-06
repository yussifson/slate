import React from 'react';
import { Award, Download, ExternalLink, ShieldCheck } from 'lucide-react';

export default function OnlineCertificates() {
  const certificates = [
    { id: 1, title: 'React Foundations', issued: 'Sep 15, 2026', grade: '95%', instructor: 'Sarah Jenkins', courseId: 'c1' },
    { id: 2, title: 'Advanced State Management', issued: 'Oct 01, 2026', grade: '92%', instructor: 'Michael Chen', courseId: 'c2' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto py-6">
      <div className="border-b border-[var(--color-border-subtle)] pb-4 flex justify-between items-end">
        <div>
          <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight">My Certificates</h1>
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">View, download, and share your earned course certificates.</p>
        </div>
      </div>

      {certificates.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] bg-[var(--color-surface-0)]">
          <Award className="w-16 h-16 mx-auto text-[var(--color-text-tertiary)] mb-4" />
          <h2 className="text-xl font-bold font-display text-[var(--color-text-primary)]">No Certificates Yet</h2>
          <p className="text-[var(--color-text-secondary)] mt-2">Complete a course to earn your first certificate.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map(cert => (
            <div key={cert.id} className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] shadow-sm overflow-hidden flex flex-col group hover:border-[var(--color-module-online)] transition-colors">
              <div className="p-8 bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-surface-2)] flex flex-col items-center justify-center text-center border-b border-[var(--color-border-subtle)] relative">
                <div className="absolute top-4 right-4 bg-white/50 backdrop-blur rounded-full p-2">
                  <ShieldCheck className="w-5 h-5 text-[var(--color-success)]" />
                </div>
                <Award className="w-16 h-16 text-[var(--color-module-online)] mb-4" />
                <h2 className="font-serif text-2xl font-bold text-[var(--color-text-primary)] mb-1">Certificate of Completion</h2>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">This certifies that you have successfully completed</p>
                <h3 className="font-display text-xl font-bold text-[var(--color-module-online)]">{cert.title}</h3>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-4">Instructor: {cert.instructor}</p>
              </div>
              <div className="p-5 flex items-center justify-between bg-[var(--color-surface-0)]">
                <div>
                  <p className="text-xs text-[var(--color-text-secondary)]">Issued On</p>
                  <p className="font-semibold text-sm text-[var(--color-text-primary)]">{cert.issued}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-secondary)]">Final Grade</p>
                  <p className="font-semibold text-sm text-[var(--color-success)]">{cert.grade}</p>
                </div>
              </div>
              <div className="p-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] flex gap-3">
                <button className="flex-1 flex justify-center items-center gap-2 px-4 py-2 bg-[var(--color-module-online)] text-white text-sm font-medium rounded-[var(--radius-md)] hover:opacity-90 transition-opacity">
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                <button className="flex justify-center items-center gap-2 px-4 py-2 bg-[var(--color-surface-0)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] text-sm font-medium rounded-[var(--radius-md)] hover:bg-[var(--color-surface-2)] transition-colors">
                  <ExternalLink className="w-4 h-4" /> Share Link
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
