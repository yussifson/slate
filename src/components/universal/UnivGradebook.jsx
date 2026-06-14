import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { Search, Edit3, User, BookOpen, Star, Percent, Award, Download, TrendingUp} from 'lucide-react';
import { toast} from 'react-hot-toast';

export default function UnivGradebook() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');
 const [grades, setGrades] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');

 useEffect(() => {
 if (companyId) {
 fetchGrades();
 const channel = supabase.channel('gradebook_changes')
 .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_gradebook', filter: `company_id=eq.${companyId}`}, () => {
 fetchGrades();
}).subscribe();
 return () => { supabase.removeChannel(channel);};
}
}, [companyId]);

 const fetchGrades = async () => {
 setLoading(true);
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_gradebook WHERE company_id = ? ORDER BY date_recorded DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error && error.code !== '42P01') throw error;
 setGrades(data || []);
} catch (err) {
 // Mock data removed for production empty states
} finally {
 setLoading(false);
}
};

 const handleRecordGrade = async () => {
 const newGrade = {
 company_id: companyId,
 student_id: '00000000-0000-0000-0000-000000000000',
 course_id: '00000000-0000-0000-0000-000000000000',
 assessment_name: 'Quiz 1',
 score: Math.floor(Math.random() * 30) + 70,
 max_score: 100,
 grade: 'B+',
 date_recorded: new Date().toISOString().split('T')[0],
 remarks: 'Student: temp-student-id | Course: temp-course-id'
};
 try {
 const { error} = await (async () => {
 const _p = newGrade;
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _pl = _k.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_gradebook (${_k.join(', ')}) VALUES (${_pl})`, _v); return { error: null};})();
 if (error) throw error;
 toast.success('Grade recorded');
} catch (err) {
 if (err.code === '42P01') toast.error("Database table not initialized yet.");
 else toast.error('Failed to record grade');
}
};

 const filtered = grades.filter(g => 
 `${g.student_name} ${g.course_name} ${g.assessment_name}`.toLowerCase().includes(searchTerm.toLowerCase())
 );

 return (
 <div className="flex flex-col h-full bg-background overflow-hidden ${view !== 'Default' ? 'hide-default' : ''}">
 <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
 <div>
 <h2 className="text-2xl font-bold text-foreground tracking-tight">Gradebook</h2>
 <p className="text-sm text-muted-foreground mt-1">Record assessments, track performance, and publish grades.</p>
 </div>
 <div className="flex gap-3">
 <button className="flex items-center gap-2 px-4 py-2 bg-card border border-primary/40 rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors">
 <Download className="w-4 h-4" /> Export CSV
 </button>
 <button onClick={handleRecordGrade} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors -primary/20">
 <Edit3 className="w-4 h-4" /> Record Grade
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 shrink-0">
 <div className="bg-card border border-primary/40 rounded-2xl p-4 flex items-center justify-between ">
 <div>
 <p className="text-sm text-muted-foreground font-medium">Class Average</p>
 <h3 className="text-2xl font-bold text-foreground mt-1">86.4%</h3>
 </div>
 <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 rounded-xl"><Percent className="w-5 h-5" /></div>
 </div>
 <div className="bg-card border border-primary/40 rounded-2xl p-4 flex items-center justify-between ">
 <div>
 <p className="text-sm text-muted-foreground font-medium">Top Performers</p>
 <h3 className="text-2xl font-bold text-foreground mt-1">12</h3>
 </div>
 <div className="p-3 bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 rounded-xl"><Star className="w-5 h-5" /></div>
 </div>
 <div className="bg-card border border-primary/40 rounded-2xl p-4 flex items-center justify-between ">
 <div>
 <p className="text-sm text-muted-foreground font-medium">Assessments Completed</p>
 <h3 className="text-2xl font-bold text-foreground mt-1">{grades.length}</h3>
 </div>
 <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-xl"><Award className="w-5 h-5" /></div>
 </div>
 </div>

 <div className="flex-1 bg-card border border-primary/40 rounded-2xl overflow-hidden flex flex-col">
 <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
 <div className="relative w-72">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
 <input 
 type="text"
 placeholder="Search students, courses..."
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
 <th className="p-4 font-semibold">Student</th>
 <th className="p-4 font-semibold">Course</th>
 <th className="p-4 font-semibold">Assessment</th>
 <th className="p-4 font-semibold">Score</th>
 <th className="p-4 font-semibold">Grade</th>
 <th className="p-4 font-semibold text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map((g, idx) => (
 <motion.tr 
 initial={{ opacity: 0, y: 5}}
 animate={{ opacity: 1, y: 0}}
 transition={{ delay: idx * 0.02}}
 key={g.id} 
 className="hover:bg-muted/30 transition-colors group cursor-pointer"
 >
 <td className="p-4 font-medium text-foreground flex items-center gap-2">
 <User className="w-4 h-4 text-muted-foreground" /> {g.student_name || `Student ${g.student_id?.slice(0,4)}`}
 </td>
 <td className="p-4 text-muted-foreground">
 <div className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {g.course_name || 'Course'}</div>
 </td>
 <td className="p-4 font-semibold text-foreground">
 {g.assessment_name}
 </td>
 <td className="p-4">
 <div className="flex items-center gap-2">
 <div className="w-16 h-2 bg-muted dark:bg-slate-800 rounded-full overflow-hidden">
 <div className="h-full bg-primary rounded-full" style={{ width: `${(g.score / g.max_score) * 100}%`}}></div>
 </div>
 <span className="font-bold text-foreground text-xs">{g.score}/{g.max_score}</span>
 </div>
 </td>
 <td className="p-4">
 <span className={`px-3 py-1 font-bold text-sm rounded-lg flex items-center w-fit gap-1 ${
 g.grade?.includes('A') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20' : 
 g.grade?.includes('B') ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20' : 
 'bg-orange-100 text-orange-700 dark:bg-orange-500/20'
}`}>
 {g.grade}
 {g.grade?.includes('A') && <TrendingUp className="w-3 h-3 ml-1" />}
 </span>
 </td>
 <td className="p-4 text-right">
 <button className="text-muted-foreground hover:text-primary transition-colors p-2"><Edit3 className="w-4 h-4" /></button>
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
