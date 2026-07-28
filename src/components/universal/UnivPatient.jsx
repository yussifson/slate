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
 if (companyId === undefined) return;
 const newPatient = {
 company_id: companyId,
 patient_number: `PT-${Math.floor(1000 + Math.random() * 9000)}`,
 first_name: 'New',
 last_name: 'Patient',
 email: `patient${Math.floor(Math.random() * 10000)}@example.com`,
 date_of_birth: '2000-01-01',
 status: 'Active'
};
 try {
 const { error} = await (async () => {
 const _payload = newPatient;
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_patients (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
 toast.success('Patient added');
 fetchPatients();
} catch (err) {
 console.error(err);
 toast.error(err.message || 'Failed to add patient');
}
};

 const handleInvitePatient = async (patient) => {
 if (!patient.email) {
 toast.error("This patient does not have an email address.");
 return;
 }
 toast.loading(`Inviting ${patient.first_name} to the Patient Portal...`, { id: "invite" });
 try {
 const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
 const { registerSchoolUser } = await import('@/api/authUtils');
 const res = await registerSchoolUser(patient.email, tempPassword, 'patient', companyId, `${patient.first_name} ${patient.last_name}`);
 
 if (res.error) throw res.error;
 
 await powerSync.execute(`UPDATE univ_patients SET portal_invited = true, portal_status = 'active' WHERE id = ?`, [patient.id]);
 fetchPatients();
 toast.success(`Invite Sent! Temp password: ${tempPassword}`, { id: "invite", duration: 10000 });
 } catch (err) {
 console.error(err);
 toast.error(err.message || 'Invite Failed', { id: "invite" });
 }
 };

 const filtered = patients.filter(p => 
 `${p.first_name} ${p.last_name} ${p.patient_number} ${p.email || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
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
 <h2 className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">Patient Records</h2>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Manage demographics, medical history, and status.</p>
 </div>
 <div className="flex gap-3">
 <button className="flex items-center gap-2 px-4 py-2 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Download className="w-4 h-4" /> Export
 </button>
 <div className="flex items-center gap-2">

 
 
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-secondary/80 -[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
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
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-4 flex items-center justify-between  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 font-medium">Total Registered</p>
 <h3 className="text-2xl font-semibold text-foreground mt-1 tracking-[-0.02em]">{patients.length}</h3>
 </div>
 <div className="p-3 bg-blue-100 dark:bg-blue-500/10/10 text-blue-600 rounded-xl"><User className="w-5 h-5" /></div>
 </div>
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-4 flex items-center justify-between  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 font-medium">Active Patients</p>
 <h3 className="text-2xl font-semibold text-foreground mt-1 tracking-[-0.02em]">{patients.filter(p => p.status === 'Active').length}</h3>
 </div>
 <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10/10 text-emerald-600 rounded-xl"><HeartPulse className="w-5 h-5" /></div>
 </div>
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-4 flex items-center justify-between  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 font-medium">Discharged</p>
 <h3 className="text-2xl font-semibold text-foreground mt-1 tracking-[-0.02em]">{patients.filter(p => p.status === 'Discharged').length}</h3>
 </div>
 <div className="p-3 bg-orange-100 dark:bg-orange-500/10/10 text-orange-600 rounded-xl"><Stethoscope className="w-5 h-5" /></div>
 </div>
 </div>

 <div className="flex-1 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
 <div className="relative w-72">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
 <input 
 type="text"
 placeholder="Search by name or ID..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full h-10 pl-10 pr-4 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
 />
 </div>
 </div>

 <div className="flex-1 overflow-auto custom-scrollbar">
 {loading ? (
 <div className="text-center p-12 text-[#71717a] dark:text-gray-400">Loading patients...</div>
 ) : (
 <table className="w-full text-left text-sm whitespace-nowrap">
 <thead className="bg-muted/50 text-xs uppercase tracking-wider text-[#71717a] dark:text-gray-400 sticky top-0 z-10 backdrop-blur-md tracking-[0.04em]">
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
 <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0 tracking-[0.04em]">
 {p.first_name.charAt(0)}{p.last_name.charAt(0)}
 </div>
 <div>
 <div className="font-semibold text-foreground">{p.first_name} {p.last_name}</div>
 <div className="text-[11px] text-[#71717a] dark:text-gray-400">{p.email || 'No email'} â€¢ {p.phone || 'No phone'}</div>
 </div>
 </div>
 </td>
 <td className="p-4 text-[#71717a] dark:text-gray-400 font-medium">
 {p.date_of_birth || 'â€”'}
 </td>
 <td className="p-4">
 {p.blood_group ? (
 <span className="px-2 py-1 rounded-md bg-red-50 text-red-700 dark:bg-red-500/10/10 border-[0.5px] border-black/9 dark:border-white/8 border-red-200 font-semibold text-xs tracking-[0.04em]">
 {p.blood_group}
 </span>
 ) : 'â€”'}
 </td>
 <td className="p-4">
 <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-lg border-[0.5px] border-black/9 dark:border-white/8 flex items-center gap-2 w-fit ${
 p.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
 p.status === 'Discharged' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
 'bg-background text-foreground border-primary/40'
}`}>
 {p.status === 'Active' && <Activity className="w-3 h-3" />}
 {p.status}
 </span>
 </td>
 <td className="p-4 text-right">
 <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button onClick={(e) => { e.stopPropagation(); handleInvitePatient(p); }} className="text-[#71717a] dark:text-gray-400 hover:text-primary transition-colors p-1.5 rounded-md bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" title="Invite to Portal"><User className="w-3.5 h-3.5" /></button>
 <button className="text-[#71717a] dark:text-gray-400 hover:text-primary transition-colors p-1.5 rounded-md bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" title="View EMR"><FileText className="w-3.5 h-3.5" /></button>
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
