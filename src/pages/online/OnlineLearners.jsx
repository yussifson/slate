import React, { useState} from 'react';
import { useQuery} from "@tanstack/react-query";
import { base44} from "@/api/base44Client";
import { useCompanyId} from "@/hooks/useCompanyId";
import { Users, Search, Mail, Phone, Calendar, MoreHorizontal, GraduationCap} from 'lucide-react';

export default function OnlineLearners() {
 const companyId = useCompanyId();
 const [searchTerm, setSearchTerm] = useState('');

 const { data: learners = []} = useQuery({
 queryKey: ["cases", companyId, "online_learner"],
 queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'online_learner'}),
 enabled: !!companyId
});

 const filteredLearners = learners.filter(l => 
 (l.title || '').toLowerCase().includes(searchTerm.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="border-b border-primary/40 pb-4 flex justify-between items-end">
 <div>
 <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">Learners Directory</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Manage and communicate with all registered learners on the platform.</p>
 </div>
 <button className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-md-[var(--radius-md)] hover:opacity-90 transition-opacity">
 Add Learner
 </button>
 </div>

 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden flex flex-col">
 <div className="p-4 border-b border-primary/40 flex gap-4 bg-[var(--color-surface-1)]">
 <div className="relative flex-1 max-w-md">
 <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
 <input 
 type="text" 
 placeholder="Search learners by name..." 
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-md)] pl-9 pr-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body"
 />
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm">
 <thead className="bg-[var(--color-surface-1)] border-b border-primary/40 text-[var(--color-text-secondary)]">
 <tr>
 <th className="px-6 py-3 font-semibold">Learner Name</th>
 <th className="px-6 py-3 font-semibold">Contact Info</th>
 <th className="px-6 py-3 font-semibold">Joined Date</th>
 <th className="px-6 py-3 font-semibold">Enrolled Courses</th>
 <th className="px-6 py-3 font-semibold text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--color-border-subtle)] bg-[var(--color-surface-0)] text-[var(--color-text-primary)]">
 {filteredLearners.length === 0 ? (
 <tr>
 <td colSpan="5" className="px-6 py-12 text-center text-[var(--color-text-tertiary)]">
 <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
 <p className="font-medium text-[var(--color-text-secondary)]">No learners found</p>
 <p className="text-sm mt-1">Try adjusting your search or add a new learner.</p>
 </td>
 </tr>
 ) : (
 filteredLearners.map((learner, idx) => {
 let extra = {};
 try { extra = JSON.parse(learner.notes || '{}');} catch(e) {}
 
 return (
 <tr key={idx} className="hover:bg-[var(--color-surface-1)] transition-colors group">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-[var(--color-surface-2)] text-[var(--primary)] flex items-center justify-center font-semibold text-xs uppercase  tracking-[0.04em]">
 {(learner.title || 'U').charAt(0)}
 </div>
 <span className="font-medium">{learner.title || 'Unnamed Learner'}</span>
 </div>
 </td>
 <td className="px-6 py-4 space-y-1">
 {extra.email && (
 <div className="flex items-center gap-2.5 text-xs text-[var(--color-text-secondary)] tracking-[0.04em]">
 <Mail className="w-3.5 h-3.5" /> {extra.email}
 </div>
 )}
 {extra.phone && (
 <div className="flex items-center gap-2.5 text-xs text-[var(--color-text-secondary)] tracking-[0.04em]">
 <Phone className="w-3.5 h-3.5" /> {extra.phone}
 </div>
 )}
 {!extra.email && !extra.phone && <span className="text-xs italic text-[var(--color-text-tertiary)] tracking-[0.04em]">No contact info</span>}
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2.5 text-xs text-[var(--color-text-secondary)] tracking-[0.04em]">
 <Calendar className="w-3.5 h-3.5" /> 
 {new Date(learner.created_at || Date.now()).toLocaleDateString()}
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2.5 text-xs font-semibold text-[var(--color-text-primary)] tracking-[0.04em]">
 <GraduationCap className="w-4 h-4 text-[var(--primary)]" />
 {extra.enrolled_count || 0} courses
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <button className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--primary)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors opacity-0 group-hover:opacity-100">
 <MoreHorizontal className="w-4 h-4" />
 </button>
 </td>
 </tr>
 );
})
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
}
