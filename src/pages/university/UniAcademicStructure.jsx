import React, { useMemo} from 'react';
import { useQuery} from "@tanstack/react-query";
import { base44} from "@/api/base44Client";
import { useCompanyId} from "@/hooks/useCompanyId";
import { Building2, School, Landmark, GraduationCap, ChevronRight, Plus} from 'lucide-react';
import OrbitEmptyState from '@/components/university/OrbitEmptyState';

export default function UniAcademicStructure() {
 const companyId = useCompanyId();

 const { data: records = []} = useQuery({
 queryKey: ["cases", companyId, "uni_faculty"],
 queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'uni_faculty'}),
 enabled: !!companyId
});

 const structure = useMemo(() => {
 return records.map(fac => {
 let extra = {};
 try {
 extra = JSON.parse(fac.notes || '{}');
} catch (e) {}
 
 return {
 id: fac.id,
 faculty: fac.title || 'Unnamed Faculty',
 icon: Building2,
 schools: extra.schools || []
};
});
}, [records]);

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="border-b border-[var(--color-border-subtle)] pb-4">
 <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight">University Academic Structure</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Manage faculties, departments, schools, course programs, majors, and minors.</p>
 </div>

 <div className="flex justify-between items-center bg-[var(--color-surface-0)] p-4 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] ">
 <div className="flex gap-3">
 <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:opacity-90 text-white text-sm font-medium rounded-[var(--radius-md)] transition-all">
 <Plus className="w-4 h-4" /> Add Faculty
 </button>
 <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-primary)] border border-[var(--color-border-default)] text-sm font-medium rounded-[var(--radius-md)] transition-all">
 <Plus className="w-4 h-4" /> Add Department
 </button>
 </div>
 <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)]">Total Faculties: {structure.length}</p>
 </div>

 <div className="space-y-6">
 {structure.length === 0 ? (
 <OrbitEmptyState 
 icon={Building2} 
 title="No Academic Structure" 
 description="Create faculties to define your university's academic branches." 
 moduleColor="var(--primary)" 
 />
 ) : (
 structure.map((fac, idx) => (
 <div key={idx} className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] hover:border-[var(--primary)] transition-colors rounded-[var(--radius-xl)] overflow-hidden">
 <div className="flex items-center gap-4 bg-[var(--color-surface-1)] px-6 py-4 border-b border-[var(--color-border-subtle)]">
 <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--primary)] text-white flex items-center justify-center -glow-sm -[var(--primary)]">
 <fac.icon className="w-5 h-5" />
 </div>
 <div>
 <h2 className="text-[var(--text-lg)] font-display font-semibold text-[var(--color-text-primary)] tracking-tight">{fac.faculty}</h2>
 <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)]">Academic Board Jurisdiction</p>
 </div>
 </div>
 
 <div className="p-6 space-y-6">
 {fac.schools && fac.schools.length > 0 ? fac.schools.map((school, sIdx) => (
 <div key={sIdx} className="pl-4 border-l-2 border-[var(--color-border-subtle)] space-y-4">
 <div className="flex items-center gap-2 text-[var(--color-text-primary)] font-semibold text-[var(--text-sm)]">
 <School className="w-4 h-4 text-[var(--primary)]" /> {school.name}
 </div>
 
 {school.departments && school.departments.map((dept, dIdx) => (
 <div key={dIdx} className="pl-6 border-l-2 border-dashed border-[var(--color-border-subtle)] space-y-3">
 <div className="text-[var(--color-text-secondary)] font-bold text-[var(--text-xs)] flex items-center gap-1.5">
 <Landmark className="w-3.5 h-3.5" style={{ color: 'var(--color-info)'}} /> {dept.name}
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
 {dept.programs && dept.programs.map((prog, pIdx) => (
 <div key={pIdx} className="bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] p-4 rounded-[var(--radius-lg)] flex flex-col justify-between hover:bg-[var(--color-surface-2)] transition-colors">
 <div>
 <p className="font-bold text-[var(--text-xs)] text-[var(--color-text-primary)] flex items-center gap-1.5">
 <GraduationCap className="w-4 h-4 text-[var(--primary)]" /> {prog.name}
 </p>
 <div className="mt-2 space-y-1">
 {prog.majors && prog.majors.length > 0 && (
 <p className="text-[10px] text-[var(--color-text-secondary)]">
 <strong className="text-[var(--color-text-primary)]">Majors:</strong> {prog.majors.join(", ")}
 </p>
 )}
 {prog.minors && prog.minors.length > 0 && (
 <p className="text-[10px] text-[var(--color-text-secondary)]">
 <strong className="text-[var(--color-text-primary)]">Minors:</strong> {prog.minors.join(", ")}
 </p>
 )}
 </div>
 </div>
 <button className="self-end text-[10px] font-semibold flex items-center gap-0.5 mt-4 text-[var(--primary)] hover:opacity-80 transition-opacity">
 View Curriculum <ChevronRight className="w-3 h-3" />
 </button>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 )) : (
 <p className="text-sm text-[var(--color-text-secondary)] italic">No schools assigned to this faculty.</p>
 )}
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 );
}
