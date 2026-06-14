import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { Search, Users, Link as LinkIcon, Mail, Settings, CheckCircle2, Copy} from 'lucide-react';
import { toast} from 'react-hot-toast';

export default function UnivParentPortal() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');
 const [accesses, setAccesses] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');

 useEffect(() => {
 if (companyId) {
 fetchAccesses();
 const channel = supabase.channel('parent_portal_changes')
 .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_parent_portal_access', filter: `company_id=eq.${companyId}`}, () => {
 fetchAccesses();
}).subscribe();
 return () => { supabase.removeChannel(channel);};
}
}, [companyId]);

 const fetchAccesses = async () => {
 setLoading(true);
 try {
 const [accessRes, studentRes] = await Promise.all([
 powerSync.execute('SELECT * FROM univ_parent_portal_access WHERE company_id = ? ORDER BY parent_name ASC', [companyId]).then(r => ({ data: r.rows ? (r.rows._array || Array.from(r.rows)) : [], error: null})),
 powerSync.execute('SELECT id, first_name, last_name FROM univ_students WHERE company_id = ?', [companyId]).then(r => ({ data: r.rows ? (r.rows._array || Array.from(r.rows)) : [], error: null}))
 ]);

 if (accessRes.error && accessRes.error.code !== '42P01') throw accessRes.error;
 
 const studentsMap = {};
 if (studentRes.data) {
 studentRes.data.forEach(s => {
 studentsMap[s.id] = `${s.first_name} ${s.last_name}`;
});
}
 
 const mapped = (accessRes.data || []).map(a => ({
 ...a,
 student_name: studentsMap[a.student_id] || ''
}));
 setAccesses(mapped);
} catch (err) {
 console.error(err);
 toast.error(err.message || 'Failed to fetch accesses');
} finally {
 setLoading(false);
}
};

 const generateAccessCode = async () => {
 if (!companyId) return;
 try {
 // Find a student in this company to link, otherwise fallback to dummy UUID
 const { data: students} = await supabase
 .from('univ_students')
 .select('id')
 .eq('company_id', companyId)
 .limit(1);
 
 const studentId = (students && students.length > 0) ? students[0].id : '00000000-0000-0000-0000-000000000000';

 const newAccess = {
 company_id: companyId,
 student_id: studentId,
 parent_name: 'New Parent',
 parent_email: 'parent@example.com',
 access_code: `PP-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
 status: 'Pending'
};

 const { error} = await (async () => {
 const _p = newAccess;
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _pl = _k.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_parent_portal_access (${_k.join(', ')}) VALUES (${_pl})`, _v); return { error: null};})();
 if (error) throw error;
 toast.success('Access code generated');
 fetchAccesses();
} catch (err) {
 console.error(err);
 toast.error(err.message || 'Failed to generate code');
}
};

 const copyCode = (code) => {
 navigator.clipboard.writeText(code);
 toast.success('Access code copied!');
};

 const filtered = accesses.filter(a => 
 `${a.parent_name} ${a.student_name} ${a.parent_email}`.toLowerCase().includes(searchTerm.toLowerCase())
 );

 return (
 <div className="flex flex-col h-full bg-background overflow-hidden ${view !== 'Default' ? 'hide-default' : ''}">
 <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
 <div>
 <h2 className="text-2xl font-bold text-foreground tracking-tight">Parent Portal Access</h2>
 <p className="text-sm text-muted-foreground mt-1">Manage guardian access to student data, fees, and results.</p>
 </div>
 <button onClick={generateAccessCode} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors -primary/20">
 <LinkIcon className="w-4 h-4" /> Generate Access Code
 </button>
 </div>

 <div className="flex-1 bg-card border border-primary/40 rounded-2xl overflow-hidden flex flex-col">
 <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
 <div className="relative w-72">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
 <input 
 type="text"
 placeholder="Search parents, students..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full h-10 pl-10 pr-4 bg-background border border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
 />
 </div>
 </div>

 <div className="flex-1 overflow-auto custom-scrollbar">
 {loading ? (
 <div className="text-center p-12 text-muted-foreground">Loading parent portal access...</div>
 ) : (
 <table className="w-full text-left text-sm whitespace-nowrap">
 <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
 <tr>
 <th className="p-4 font-semibold">Guardian Info</th>
 <th className="p-4 font-semibold">Linked Student</th>
 <th className="p-4 font-semibold">Access Code</th>
 <th className="p-4 font-semibold">Status</th>
 <th className="p-4 font-semibold text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map((a, idx) => (
 <motion.tr 
 initial={{ opacity: 0, y: 5}}
 animate={{ opacity: 1, y: 0}}
 transition={{ delay: idx * 0.02}}
 key={a.id} 
 className="hover:bg-muted/30 transition-colors group cursor-pointer"
 >
 <td className="p-4">
 <div className="font-semibold text-foreground">{a.parent_name}</div>
 <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" /> {a.parent_email}</div>
 </td>
 <td className="p-4 font-medium text-foreground">
 <div className="flex items-center gap-2">
 <Users className="w-4 h-4 text-primary/60" /> 
 {a.student_name || `Student ${a.student_id?.slice(0,8)}`}
 </div>
 </td>
 <td className="p-4">
 <div className="flex items-center gap-2">
 <code className="bg-muted px-2 py-1 rounded text-xs font-mono font-bold tracking-wider border border-primary/40">{a.access_code}</code>
 <button onClick={() => copyCode(a.access_code)} className="text-muted-foreground hover:text-foreground transition-colors"><Copy className="w-3.5 h-3.5" /></button>
 </div>
 </td>
 <td className="p-4">
 <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center w-fit gap-1 ${
 a.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
 'bg-orange-50 text-orange-700 border-orange-200'
}`}>
 {a.status === 'Active' && <CheckCircle2 className="w-3 h-3" />}
 {a.status}
 </span>
 </td>
 <td className="p-4 text-right">
 <button className="text-muted-foreground hover:text-primary transition-colors p-2"><Settings className="w-4 h-4" /></button>
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
