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
     const { data } = await powerSync.execute(`SELECT * FROM online_certificates WHERE company_id = ? AND student_id = ? ORDER BY issue_date DESC`, [companyId, user?.id]);
     return data || [];
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
       <button onClick={() => navigate('/settings')} className="px-8 py-3 bg-[var(--primary)] text-white font-medium rounded-md-[var(--radius-md)] hover:opacity-90 transition-opacity shadow-sm">
         Upgrade to Pro
       </button>
     </div>
   );
 }

 const handleDownload = (cert) => {
   // Simple print invocation for the certificate
   // In a real app, you might use jspdf or html2canvas here
   toast({ title: "Downloading Certificate", description: "Preparing PDF for " + cert.course_title });
   setTimeout(() => {
     window.print();
   }, 500);
 };

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto py-6">
 <div className="border-b border-primary/40 pb-4 flex justify-between items-end">
 <div>
 <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">My Certificates</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">View, download, and share your earned course certificates.</p>
 </div>
 </div>

 {certificates.length === 0 ? (
 <div className="p-12 text-center border-2 border-dashed border-primary/40 rounded-md-[var(--radius-xl)] bg-[var(--color-surface-0)]">
 <Award className="w-16 h-16 mx-auto text-[var(--color-text-tertiary)] mb-4" />
 <h2 className="text-xl font-semibold font-display text-[var(--color-text-primary)]">No Certificates Yet</h2>
 <p className="text-[var(--color-text-secondary)] mt-2">Complete a course to earn your first certificate.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {certificates.map(cert => (
 <div key={cert.id} className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden flex flex-col group hover:border-[var(--primary)] transition-colors shadow-sm hover:shadow-md">
 <div className="p-8 bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-surface-2)] flex flex-col items-center justify-center text-center border-b border-primary/40 relative">
 <div className="absolute top-4 right-4 bg-white dark:bg-slate-900/40/50 backdrop-blur rounded-full p-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <ShieldCheck className="w-5 h-5 text-[var(--color-success)]" />
 </div>
 <Award className="w-16 h-16 text-[var(--primary)] mb-4" />
 <h2 className="font-serif text-2xl font-semibold text-[var(--color-text-primary)] mb-1 tracking-[-0.02em]">Certificate of Completion</h2>
 <p className="text-sm text-[var(--color-text-secondary)] mb-4">This certifies that you have successfully completed</p>
 <h3 className="font-display text-xl font-semibold text-[var(--primary)]">{cert.course_title}</h3>
 <p className="text-xs text-[var(--color-text-tertiary)] mt-4 tracking-[0.04em]">Issued to: {cert.student_name || user?.full_name}</p>
 </div>
 <div className="p-5 flex items-center justify-between bg-[var(--color-surface-0)]">
 <div>
 <p className="text-xs text-[var(--color-text-secondary)] tracking-[0.04em] uppercase font-semibold">Issued On</p>
 <p className="font-medium text-sm text-[var(--color-text-primary)] mt-0.5">{new Date(cert.issue_date).toLocaleDateString()}</p>
 </div>
 <div>
 <p className="text-xs text-[var(--color-text-secondary)] tracking-[0.04em] uppercase font-semibold text-right">Status</p>
 <p className="font-bold text-sm text-[var(--color-success)] text-right mt-0.5 uppercase tracking-wide">{cert.status}</p>
 </div>
 </div>
 <div className="p-4 border-t border-primary/40 bg-[var(--color-surface-1)] flex gap-3">
 <button onClick={() => handleDownload(cert)} className="flex-1 flex justify-center items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-md-[var(--radius-md)] hover:opacity-90 transition-opacity">
 <Download className="w-4 h-4" /> Download PDF
 </button>
 <button className="flex justify-center items-center gap-2 px-4 py-2 bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-[var(--color-text-primary)] text-sm font-medium rounded-md-[var(--radius-md)] hover:bg-[var(--color-surface-2)] transition-colors">
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
