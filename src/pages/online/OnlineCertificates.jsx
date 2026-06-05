import React from 'react';
import { Card } from "@/components/ui/card";
import { Award, Download, Share2, Verify, CheckCircle2, ShieldCheck, Link as LinkIcon } from 'lucide-react';

export default function OnlineCertificates() {
  const certificates = [
    { id: "CERT-9482-110", course: "UI Design Fundamentals", date: "June 4, 2026", instructor: "Sarah Jenkins", verifiable: true },
    { id: "CERT-3391-002", course: "Advanced React Patterns", date: "May 15, 2026", instructor: "Dan Abramov", verifiable: true },
  ];

  return (
    <div className="h-[calc(100vh-64px)] bg-void flex flex-col font-body text-text-primary overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border bg-overlay shrink-0 flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-display font-medium mb-2">My Certificates</h1>
            <p className="text-text-secondary text-sm">View, download, and share your verified achievements.</p>
        </div>
        <div className="flex gap-4">
            <div className="text-right">
                <div className="text-xs text-text-muted font-mono mb-1">Total Earned</div>
                <div className="text-2xl font-bold text-orbit-light">{certificates.length}</div>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              
              {certificates.length === 0 ? (
                  <div className="col-span-full py-20 text-center border border-dashed border-border rounded-xl bg-surface/20">
                      <Award className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium text-text-secondary">No certificates yet</h3>
                      <p className="text-text-muted text-sm mt-1">Complete a course to earn your first certificate.</p>
                  </div>
              ) : (
                  certificates.map(cert => (
                      <div key={cert.id} className="bg-deep border border-border rounded-xl overflow-hidden hover:border-orbit/50 transition-colors group relative flex flex-col">
                          
                          {/* Certificate Visual Preview */}
                          <div className="aspect-[4/3] bg-surface relative p-6 flex flex-col justify-between overflow-hidden">
                              {/* Decorative bg */}
                              <div className="absolute inset-0 bg-gradient-to-br from-orbit/10 to-transparent pointer-events-none"></div>
                              <div className="absolute -top-12 -right-12 w-32 h-32 bg-orbit/20 rounded-full blur-2xl"></div>
                              
                              <div className="relative z-10 flex justify-between items-start">
                                  <ShieldCheck className="w-8 h-8 text-orbit-light" />
                                  <div className="text-[10px] font-mono text-text-muted bg-void/80 px-2 py-1 rounded border border-border">
                                      ID: {cert.id}
                                  </div>
                              </div>

                              <div className="relative z-10 text-center flex-1 flex flex-col justify-center items-center">
                                  <div className="text-xs font-medium text-text-secondary uppercase tracking-widest mb-4">Certificate of Completion</div>
                                  <h3 className="font-display font-medium text-lg text-orbit-light leading-tight px-4">{cert.course}</h3>
                              </div>

                              <div className="relative z-10 flex justify-between items-end mt-4">
                                  <div>
                                      <div className="w-16 h-px bg-border mb-1"></div>
                                      <div className="text-[10px] text-text-muted">{cert.instructor}</div>
                                  </div>
                                  <div>
                                      <div className="w-16 h-px bg-border mb-1"></div>
                                      <div className="text-[10px] text-text-muted text-right">{cert.date}</div>
                                  </div>
                              </div>
                          </div>

                          {/* Action Bar */}
                          <div className="p-4 bg-overlay border-t border-border flex justify-between items-center shrink-0">
                              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-400/10 px-2 py-1 rounded">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button className="p-1.5 rounded text-text-secondary hover:text-orbit-light hover:bg-surface transition-colors" title="Copy Link">
                                      <LinkIcon className="w-4 h-4" />
                                  </button>
                                  <button className="p-1.5 rounded text-text-secondary hover:text-orbit-light hover:bg-surface transition-colors" title="Share to LinkedIn">
                                      <Share2 className="w-4 h-4" />
                                  </button>
                                  <button className="p-1.5 rounded text-text-secondary hover:text-orbit-light hover:bg-surface transition-colors" title="Download PDF">
                                      <Download className="w-4 h-4" />
                                  </button>
                              </div>
                          </div>
                      </div>
                  ))
              )}

          </div>
      </div>
    </div>
  );
}
