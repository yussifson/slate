import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { Search, User, Phone, Activity, FileText, Download, Plus, HeartPulse, Stethoscope} from 'lucide-react';
import { toast} from 'react-hot-toast';

export default function UnivPatient() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');
 const [patients, setPatients] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');

 useEffect(() => {
 if (companyId) {
 fetchPatients();
 const channel = supabase.channel('patient_changes')
 .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_patients', filter: `company_id=eq.${companyId}`}, () => {
 fetchPatients();
}).subscribe();
 return () => { supabase.removeChannel(channel);};
}
}, [companyId]);

 const fetchPatients = async () => {
 setLoading(true);
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_patients WHERE company_id = ? ORDER BY first_name ASC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error && error.code !== '42P01') throw error;
 setPatients(data || []);
} catch (err) {
 console.error(err);
 toast.error(err.message || 'Failed to fetch patients');
} finally {
 setLoading(false);
}
};

 const handleAddPatient = async () => {
 if (!companyId) return;
 const newPatient = {
 company_id: companyId,
 patient_number: `PT-${Math.floor(1000 + Math.random() * 9000)}`,
 first_name: 'New',
 last_name: 'Patient',
 date_of_birth: '2000-01-01',
 status: 'Active'
};
 try {
 const { error} = await (async () => {
 const _p = newPatient;
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _pl = _k.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_patients (${_k.join(', ')}) VALUES (${_pl})`, _v); return { error: null};})();
 if (error) throw error;
 toast.success('Patient added');
 fetchPatients();
} catch (err) {
 console.error(err);
 toast.error(err.message || 'Failed to add patient');
}
};

 const filtered = patients.filter(p => 
 `${p.first_name} ${p.last_name} ${p.patient_number}`.toLowerCase().includes(searchTerm.toLowerCase())
 );

 
 const handleExport = () => {
 const exportData = (typeof records !== 'undefined' ? records : (typeof data !== 'undefined' ? data : []));
 if (!exportData || exportData.length === 0) return alert('No data to export');
 const keys = Object.keys(exportData[0]).filter(k => k !== 'company_id' && k !== 'id');
 const csv = [keys.join(','), ...exportData.map(r => keys.map(k => '"' + (r[k]||'').toString().replace(/"/g, '""') + '"').join(','))].join('\n');
 const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;'});
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url; a.download = 'export.csv'; a.click();
};

 return (
 <div className="flex flex-col h-full bg-background overflow-hidden ${view !== 'Default' ? 'hide-default' : ''}">
 <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
 <div>
 <h2 className="text-2xl font-bold text-foreground tracking-tight">Patient Records</h2>
 <p className="text-sm text-muted-foreground mt-1">Manage demographics, medical history, and status.</p>
 </div>
 <div className="flex gap-3">
 <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors">
 <Download className="w-4 h-4" /> Export
 </button>
 <div className="flex items-center gap-2">

 
 
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 -[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
 Export CSV
 </button>

 <button onClick={handleAddPatient} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors -primary/20">
 <Plus className="w-4 h-4" /> Add Patient
 </button>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 shrink-0">
 <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between ">
 <div>
 <p className="text-sm text-muted-foreground font-medium">Total Registered</p>
 <h3 className="text-2xl font-bold text-foreground mt-1">{patients.length}</h3>
 </div>
 <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 rounded-xl"><User className="w-5 h-5" /></div>
 </div>
 <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between ">
 <div>
 <p className="text-sm text-muted-foreground font-medium">Active Patients</p>
 <h3 className="text-2xl font-bold text-foreground mt-1">{patients.filter(p => p.status === 'Active').length}</h3>
 </div>
 <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-xl"><HeartPulse className="w-5 h-5" /></div>
 </div>
 <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between ">
 <div>
 <p className="text-sm text-muted-foreground font-medium">Discharged</p>
 <h3 className="text-2xl font-bold text-foreground mt-1">{patients.filter(p => p.status === 'Discharged').length}</h3>
 </div>
 <div className="p-3 bg-orange-100 dark:bg-orange-500/10 text-orange-600 rounded-xl"><Stethoscope className="w-5 h-5" /></div>
 </div>
 </div>

 <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
 <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
 <div className="relative w-72">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
 <input 
 type="text"
 placeholder="Search by name or ID..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
 />
 </div>
 </div>

 <div className="flex-1 overflow-auto custom-scrollbar">
 {loading ? (
 <div className="text-center p-12 text-muted-foreground">Loading patients...</div>
 ) : (
 <table className="w-full text-left text-sm whitespace-nowrap">
 <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
 <tr>
 <th className="p-4 font-semibold">Patient ID</th>
 <th className="p-4 font-semibold">Name</th>
 <th className="p-4 font-semibold">DOB / Age</th>
 <th className="p-4 font-semibold">Blood Group</th>
 <th className="p-4 font-semibold">Status</th>
 <th className="p-4 font-semibold text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map((p, idx) => (
 <motion.tr 
 initial={{ opacity: 0, y: 5}}
 animate={{ opacity: 1, y: 0}}
 transition={{ delay: idx * 0.02}}
 key={p.id} 
 className="hover:bg-muted/30 transition-colors group cursor-pointer"
 >
 <td className="p-4 font-mono font-semibold text-primary">
 {p.patient_number}
 </td>
 <td className="p-4">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
 {p.first_name.charAt(0)}{p.last_name.charAt(0)}
 </div>
 <div>
 <div className="font-semibold text-foreground">{p.first_name} {p.last_name}</div>
 <div className="text-[11px] text-muted-foreground">{p.gender || 'U'} • {p.phone || 'No phone'}</div>
 </div>
 </div>
 </td>
 <td className="p-4 text-muted-foreground font-medium">
 {p.date_of_birth || '—'}
 </td>
 <td className="p-4">
 {p.blood_group ? (
 <span className="px-2 py-1 rounded bg-red-50 text-red-700 dark:bg-red-500/10 border border-red-200 font-bold text-xs">
 {p.blood_group}
 </span>
 ) : '—'}
 </td>
 <td className="p-4">
 <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 w-fit ${
 p.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
 p.status === 'Discharged' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
 'bg-background text-foreground border-border'
}`}>
 {p.status === 'Active' && <Activity className="w-3 h-3" />}
 {p.status}
 </span>
 </td>
 <td className="p-4 text-right">
 <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded bg-card border border-border " title="View EMR"><FileText className="w-3.5 h-3.5" /></button>
 </div>
 </td>
 </motion.tr>
 ))}
 </tbody>
 </table>
 )}
 </div>
 </div>
 </div>
 );
}
