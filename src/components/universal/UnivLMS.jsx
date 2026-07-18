import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { Search, BookOpen, Video, FileText, CheckSquare, Plus, Clock, MoreHorizontal, FileDown} from 'lucide-react';
import { toast} from 'react-hot-toast';

export default function UnivLMS() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');
 const [lessons, setLessons] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');

 useEffect(() => {
 if (companyId) {
 fetchLessons();
 const channel = supabase.channel('lms_changes')
 .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_lms_lessons', filter: `company_id=eq.${companyId}`}, () => {
 fetchLessons();
}).subscribe();
 return () => { supabase.removeChannel(channel);};
}
}, [companyId]);

 const fetchLessons = async () => {
 setLoading(true);
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_lms_lessons WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error && error.code !== '42P01') throw error;
 setLessons(data || []);
} catch (err) {
 // Mock data removed for production empty states
} finally {
 setLoading(false);
}
};

 const handleAddContent = async (type) => {
 const newContent = {
 company_id: companyId,
 course_id: '00000000-0000-0000-0000-000000000000',
 title: `New ${type}`,
 content_type: type,
 status: 'Draft',
 description: 'Course: temp-course-id'
};
 try {
 const { error} = await (async () => {
 const _payload = newContent;
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_lms_lessons (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
 toast.success(`${type} added to LMS`);
} catch (err) {
 if (err.code === '42P01') toast.error("Database table not initialized yet.");
 else toast.error('Failed to add content');
}
};

 const filtered = lessons.filter(l => 
 `${l.title} ${l.content_type} ${l.course_name}`.toLowerCase().includes(searchTerm.toLowerCase())
 );

 const getIcon = (type) => {
 switch(type) {
 case 'Lesson': return <Video className="w-5 h-5 text-blue-500" />;
 case 'Assignment': return <FileText className="w-5 h-5 text-purple-500" />;
 case 'Quiz': return <CheckSquare className="w-5 h-5 text-emerald-500" />;
 case 'Document': default: return <FileDown className="w-5 h-5 text-orange-500" />;
}
};

 return (
 <div className="flex flex-col h-full bg-background overflow-hidden ${view !== 'Default' ? 'hide-default' : ''}">
 <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
 <div>
 <h2 className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">Learning Management System</h2>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Manage lessons, assignments, quizzes, and course materials.</p>
 </div>
 <div className="flex gap-2">
 <button onClick={() => handleAddContent('Lesson')} className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 border-[0.5px] border-black/9 dark:border-white/8 border-blue-200 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors">
 <Video className="w-4 h-4" /> Lesson
 </button>
 <button onClick={() => handleAddContent('Assignment')} className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 border-[0.5px] border-black/9 dark:border-white/8 border-purple-200 rounded-xl text-sm font-semibold hover:bg-purple-100 transition-colors">
 <FileText className="w-4 h-4" /> Assignment
 </button>
 <button onClick={() => handleAddContent('Quiz')} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 border-[0.5px] border-black/9 dark:border-white/8 border-emerald-200 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors">
 <CheckSquare className="w-4 h-4" /> Quiz
 </button>
 </div>
 </div>

 <div className="flex-1 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
 <div className="relative w-72">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
 <input 
 type="text"
 placeholder="Search content..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full h-10 pl-10 pr-4 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
 />
 </div>
 </div>

 <div className="flex-1 overflow-auto custom-scrollbar">
 <table className="w-full text-left text-sm whitespace-nowrap">
 <thead className="bg-muted/50 text-xs uppercase tracking-wider text-[#71717a] dark:text-gray-400 sticky top-0 z-10 backdrop-blur-md tracking-[0.04em]">
 <tr>
 <th className="p-4 font-semibold w-16">Type</th>
 <th className="p-4 font-semibold">Title</th>
 <th className="p-4 font-semibold">Course</th>
 <th className="p-4 font-semibold">Due Date</th>
 <th className="p-4 font-semibold">Status</th>
 <th className="p-4 font-semibold text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map((l, idx) => (
 <motion.tr 
 initial={{ opacity: 0, y: 5}}
 animate={{ opacity: 1, y: 0}}
 transition={{ delay: idx * 0.02}}
 key={l.id} 
 className="hover:bg-muted/30 transition-colors group cursor-pointer"
 >
 <td className="p-4">
 <div className="p-2 bg-muted dark:bg-secondary rounded-xl w-fit">
 {getIcon(l.content_type)}
 </div>
 </td>
 <td className="p-4 font-semibold text-foreground">
 {l.title}
 </td>
 <td className="p-4 text-[#71717a] dark:text-gray-400 font-medium">
 <div className="flex items-center gap-2.5"><BookOpen className="w-3.5 h-3.5" /> {l.course_name || 'Course'}</div>
 </td>
 <td className="p-4 text-[#71717a] dark:text-gray-400 text-sm">
 {l.due_date ? <span className="flex items-center gap-2.5"><Clock className="w-3.5 h-3.5" /> {l.due_date}</span> : '—'}
 </td>
 <td className="p-4">
 <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-lg border ${
 l.status === 'Published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
 l.status === 'Archived' ? 'bg-background text-foreground border-primary/40' : 
 'bg-orange-50 text-orange-700 border-orange-200'
}`}>
 {l.status}
 </span>
 </td>
 <td className="p-4 text-right">
 <button className="text-[#71717a] dark:text-gray-400 hover:text-primary transition-colors p-2"><MoreHorizontal className="w-4 h-4" /></button>
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
