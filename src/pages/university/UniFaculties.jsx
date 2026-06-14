import React, { useState} from 'react';
import { useQuery} from "@tanstack/react-query";
import { base44} from "@/api/base44Client";
import { useCompanyId} from "@/hooks/useCompanyId";
import { Building, Search, Plus, MapPin, Users, BookOpen, MoreVertical} from 'lucide-react';
import OrbitEmptyState from '@/components/university/OrbitEmptyState';

function cn(...classes) { return classes.filter(Boolean).join(' ');}

export default function UniFaculties() {
 const companyId = useCompanyId();
 const [search, setSearch] = useState('');
 
 const { data: records = []} = useQuery({ 
 queryKey: ["cases", companyId, "uni_faculty"], 
 queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'uni_faculty'}), 
 enabled: !!companyId 
});
 
 const faculties = records.map(r => {
 let extra = {};
 try { extra = JSON.parse(r.notes || '{}');} catch(e) {}
 return {
 id: r.id,
 name: r.case_name || r.name || 'Unnamed Faculty',
 dean: extra.dean || 'Dr. Smith',
 departments: extra.departments || Math.floor(Math.random() * 8) + 2,
 staffCount: extra.staffCount || Math.floor(Math.random() * 100) + 20,
 building: extra.building || 'Main Campus',
 color: extra.color || 'var(--primary)'
};
});

 const filtered = faculties.filter(f => f.name?.toLowerCase().includes(search.toLowerCase()));

 const inputClass = "w-full bg-[var(--color-surface-1)] border border-primary/40 rounded-[var(--radius-md)] pl-9 pr-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body";

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="flex items-end justify-between border-b border-primary/40 pb-4">
 <div>
 <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight">Faculties & Departments</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Manage university faculties, departments, and leadership.</p>
 </div>
 <div className="flex items-center gap-3">
 <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:opacity-90 text-white text-sm font-medium rounded-[var(--radius-md)] transition-all">
 <Plus className="w-4 h-4" /> Add Faculty
 </button>
 </div>
 </div>
 
 <div className="bg-[var(--color-surface-0)] rounded-[var(--radius-xl)] border border-primary/40 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
 <div className="relative flex-1 w-full max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
 <input placeholder="Search faculties..." value={search} onChange={e => setSearch(e.target.value)} className={inputClass} />
 </div>
 <div className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)]">
 Total Faculties: {faculties.length}
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filtered.length === 0 ? (
 <div className="col-span-full">
 <OrbitEmptyState icon={Building} title="No faculties found" description="There are no faculties matching your criteria." moduleColor="var(--primary)" />
 </div>
 ) : (
 filtered.map(faculty => (
 <div key={faculty.id} className="bg-[var(--color-surface-0)] border border-primary/40 hover:border-[var(--primary)] transition-colors rounded-[var(--radius-xl)] overflow-hidden flex flex-col">
 <div className="h-2 w-full" style={{ backgroundColor: faculty.color}} />
 <div className="p-6 flex-1 flex flex-col">
 <div className="flex justify-between items-start mb-4">
 <div>
 <h3 className="text-[var(--text-xl)] font-display font-bold text-[var(--color-text-primary)] mb-1">
 {faculty.name}
 </h3>
 <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)] flex items-center">
 <MapPin className="w-3 h-3 mr-1" /> {faculty.building}
 </p>
 </div>
 <button className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
 <MoreVertical className="w-5 h-5" />
 </button>
 </div>
 
 <div className="space-y-3 mb-6">
 <div className="flex justify-between items-center text-[var(--text-sm)]">
 <span className="text-[var(--color-text-secondary)]">Dean</span>
 <span className="font-semibold text-[var(--color-text-primary)]">{faculty.dean}</span>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4 border-t border-primary/40 pt-4 mt-auto">
 <div className="text-center p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-1)]">
 <div className="flex items-center justify-center text-[var(--color-text-tertiary)] mb-1">
 <BookOpen className="w-4 h-4 mr-1" />
 </div>
 <p className="text-[var(--text-lg)] font-bold text-[var(--color-text-primary)]">{faculty.departments}</p>
 <p className="text-[10px] uppercase font-semibold text-[var(--color-text-tertiary)] tracking-wider">Depts</p>
 </div>
 <div className="text-center p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-1)]">
 <div className="flex items-center justify-center text-[var(--color-text-tertiary)] mb-1">
 <Users className="w-4 h-4 mr-1" />
 </div>
 <p className="text-[var(--text-lg)] font-bold text-[var(--color-text-primary)]">{faculty.staffCount}</p>
 <p className="text-[10px] uppercase font-semibold text-[var(--color-text-tertiary)] tracking-wider">Staff</p>
 </div>
 </div>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 );
}
