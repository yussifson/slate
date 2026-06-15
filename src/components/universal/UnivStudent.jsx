import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { Search, GraduationCap, User, BookOpen, Clock, MoreHorizontal, FileText, Download, Plus} from 'lucide-react';
import { toast} from 'react-hot-toast';

export default function UnivStudent() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');
 const [students, setStudents] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');

 useEffect(() => {
 if (companyId) {
 fetchStudents();
 const channel = supabase.channel('student_changes')
 .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_students', filter: `company_id=eq.${companyId}`}, () => {
 fetchStudents();
}).subscribe();
 return () => { supabase.removeChannel(channel);};
}
}, [companyId]);

 const fetchStudents = async () => {
 setLoading(true);
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_students WHERE company_id = ? ORDER BY first_name ASC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error && error.code !== '42P01') throw error;
 setStudents(data || []);
} catch (err) {
 console.error(err);
} finally {
 setLoading(false);
}
};

 const handleAddStudent = async () => {
 const newStudent = {
 company_id: companyId,
 student_id_number: `STD-${Math.floor(Math.random() * 1000)}`,
 first_name: 'New',
 last_name: 'Student',
 grade_level: '9th Grade',
 status: 'Enrolled',
 enrollment_date: new Date().toISOString().split('T')[0] || null
};
 try {
 const { error} = await (async () => {
 const _payload = newStudent;
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_students (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
 toast.success('Student added');
} catch (err) {
 console.error(err);
 toast.error(err.message || 'Failed to add student');
}
};

 const filtered = students.filter(s => 
 `${s.first_name || ''} ${s.last_name || ''} ${s.student_id_number || ''} ${s.grade_level || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
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
 <h2 className="text-2xl font-bold text-foreground tracking-tight">Student Records</h2>
 <p className="text-sm text-muted-foreground mt-1">Manage enrollments, grades, and profiles.</p>
 </div>
 <div className="flex gap-3">
 <button className="flex items-center gap-2 px-4 py-2 bg-card border border-primary/40 rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors">
 <Download className="w-4 h-4" /> Export
 </button>
 <div className="flex items-center gap-2">

 
 
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 -[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
 Export CSV
 </button>

 <button onClick={handleAddStudent} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors -primary/20">
 <Plus className="w-4 h-4" /> Add Student
 </button>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 shrink-0">
 <div className="bg-card border border-primary/40 rounded-2xl p-4 flex items-center justify-between ">
 <div>
 <p className="text-sm text-muted-foreground font-medium">Total Students</p>
 <h3 className="text-2xl font-bold text-foreground mt-1">{students.length}</h3>
 </div>
 <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 rounded-xl"><User className="w-5 h-5" /></div>
 </div>
 <div className="bg-card border border-primary/40 rounded-2xl p-4 flex items-center justify-between ">
 <div>
 <p className="text-sm text-muted-foreground font-medium">Enrolled</p>
 <h3 className="text-2xl font-bold text-foreground mt-1">{students.filter(s => s.status === 'Enrolled').length}</h3>
 </div>
 <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-xl"><BookOpen className="w-5 h-5" /></div>
 </div>
 <div className="bg-card border border-primary/40 rounded-2xl p-4 flex items-center justify-between ">
 <div>
 <p className="text-sm text-muted-foreground font-medium">Alumni</p>
 <h3 className="text-2xl font-bold text-foreground mt-1">{students.filter(s => s.status === 'Graduated').length}</h3>
 </div>
 <div className="p-3 bg-purple-100 dark:bg-purple-500/10 text-purple-600 rounded-xl"><GraduationCap className="w-5 h-5" /></div>
 </div>
 </div>

 <div className="flex-1 bg-card border border-primary/40 rounded-2xl overflow-hidden flex flex-col">
 <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
 <div className="relative w-72">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
 <input 
 type="text"
 placeholder="Search students..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full h-10 pl-10 pr-4 bg-background border border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
 />
 </div>
 </div>

 <div className="flex-1 overflow-auto custom-scrollbar">
 <table className="w-full text-left text-sm whitespace-nowrap">
 <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
 <tr>
 <th className="p-4 font-semibold">Student ID</th>
 <th className="p-4 font-semibold">Name</th>
 <th className="p-4 font-semibold">Grade/Level</th>
 <th className="p-4 font-semibold">Status</th>
 <th className="p-4 font-semibold">Guardian</th>
 <th className="p-4 font-semibold text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map((s, idx) => (
 <motion.tr 
 initial={{ opacity: 0, y: 5}}
 animate={{ opacity: 1, y: 0}}
 transition={{ delay: idx * 0.02}}
 key={s.id} 
 className="hover:bg-muted/30 transition-colors group cursor-pointer"
 >
 <td className="p-4 font-mono font-semibold text-foreground">
 {s.student_id_number}
 </td>
 <td className="p-4">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
 {(s.first_name || '').charAt(0)}{(s.last_name || '').charAt(0)}
 </div>
 <div className="font-semibold text-foreground">{s.first_name} {s.last_name}</div>
 </div>
 </td>
 <td className="p-4 text-muted-foreground font-medium">
 {s.grade_level}
 </td>
 <td className="p-4">
 <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border ${
 s.status === 'Enrolled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
 s.status === 'Graduated' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
 'bg-background text-foreground border-primary/40'
}`}>
 {s.status}
 </span>
 </td>
 <td className="p-4 text-muted-foreground text-sm">
 {s.guardian_name || '—'}
 </td>
 <td className="p-4 text-right">
 <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded bg-card border border-primary/40 "><FileText className="w-3.5 h-3.5" /></button>
 <button className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded bg-card border border-primary/40 "><MoreHorizontal className="w-3.5 h-3.5" /></button>
 </div>
 </td>
 </motion.tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
}
