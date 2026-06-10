import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Book, GraduationCap, Clock, CheckCircle2, MoreHorizontal, Download, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivCourse() {
  const companyId = useCompanyId();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchCourses();
      const channel = supabase.channel('courses_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_courses', filter: `company_id=eq.${companyId}` }, () => {
          fetchCourses();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_courses')
        .select('*')
        .eq('company_id', companyId)
        .order('course_code', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setCourses(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async () => {
    const newCourse = {
      company_id: companyId,
      course_code: `CRS${Math.floor(Math.random() * 1000)}`,
      course_name: 'New Course',
      department: 'General',
      credits: 3,
      status: 'Upcoming'
    };
    try {
      const { error } = await supabase.from('univ_courses').insert(newCourse);
      if (error) throw error;
      toast.success('Course added');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to add course');
    }
  };

  const filtered = courses.filter(c => 
    `${c.course_code} ${c.course_name} ${c.department}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Courses</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage subjects, credits, and syllabi.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={handleAddCourse} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Course
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-4 font-semibold">Course Code</th>
                <th className="p-4 font-semibold">Course Name</th>
                <th className="p-4 font-semibold">Department</th>
                <th className="p-4 font-semibold">Credits</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={c.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4 font-mono font-bold text-primary">
                    {c.course_code}
                  </td>
                  <td className="p-4 font-semibold text-foreground">
                    <div className="flex items-center gap-2"><Book className="w-4 h-4 text-muted-foreground" /> {c.course_name}</div>
                  </td>
                  <td className="p-4 text-muted-foreground font-medium">
                    {c.department}
                  </td>
                  <td className="p-4 font-bold text-foreground">
                    <div className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-purple-500" /> {c.credits} CR</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center w-fit gap-1 ${
                      c.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      c.status === 'Upcoming' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {c.status === 'Active' && <CheckCircle2 className="w-3 h-3" />}
                      {c.status === 'Upcoming' && <Clock className="w-3 h-3" />}
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-muted-foreground hover:text-primary transition-colors p-2"><MoreHorizontal className="w-4 h-4" /></button>
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
