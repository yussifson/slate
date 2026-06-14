import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, CalendarDays, UserCheck, UserX, UserMinus, AlertTriangle, MoreHorizontal, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivClassAttendance() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchAttendance();
      const channel = supabase.channel('class_attendance_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_class_attendance', filter: `company_id=eq.${companyId}` }, () => {
          fetchAttendance();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const __res = await powerSync.execute(`SELECT * FROM univ_class_attendance WHERE company_id = ? ORDER BY date DESC`, [companyId]);
      const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
      const error = null;
      if (error && error.code !== '42P01') throw error;
      setAttendance(data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (status) => {
    const newRecord = {
      company_id: companyId,
      student_id: '00000000-0000-0000-0000-000000000000',
      course_id: '00000000-0000-0000-0000-000000000000',
      student_name: 'Temp Student',
      course_name: 'Temp Course',
      date: new Date().toISOString().split('T')[0],
      status: status
    };
    try {
      const { error } = await (async () => {
        const _p = newRecord;
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _pl = _k.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO univ_class_attendance (${_k.join(', ')}) VALUES (${_pl})`, _v); return { error: null }; })();
      if (error) throw error;
      toast.success(`Marked as ${status}`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save');
    }
  };

  const filtered = attendance.filter(a => 
    `${a.student_name} ${a.course_name} ${a.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden ${view !== 'Default' ? 'hide-default' : ''}">
      <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Class Attendance</h2>
           <p className="text-sm text-muted-foreground mt-1">Track student presence in individual classes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shrink-0">
        <button onClick={() => handleMarkAttendance('Present')} className="bg-card border border-emerald-200 shadow-sm shadow-emerald-500/10 rounded-2xl p-4 flex items-center gap-3 hover:bg-emerald-50 transition-colors">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><UserCheck className="w-5 h-5" /></div>
          <div className="text-left">
            <h3 className="font-bold text-emerald-700">Present</h3>
            <p className="text-xs text-emerald-600/70">Mark all present</p>
          </div>
        </button>
        <button onClick={() => handleMarkAttendance('Late')} className="bg-card border border-orange-200 shadow-sm shadow-orange-500/10 rounded-2xl p-4 flex items-center gap-3 hover:bg-orange-50 transition-colors">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><AlertTriangle className="w-5 h-5" /></div>
          <div className="text-left">
            <h3 className="font-bold text-orange-700">Late</h3>
            <p className="text-xs text-orange-600/70">Mark selected</p>
          </div>
        </button>
        <button onClick={() => handleMarkAttendance('Absent')} className="bg-card border border-red-200 shadow-sm shadow-red-500/10 rounded-2xl p-4 flex items-center gap-3 hover:bg-red-50 transition-colors">
          <div className="p-3 bg-red-100 text-red-600 rounded-xl"><UserX className="w-5 h-5" /></div>
          <div className="text-left">
            <h3 className="font-bold text-red-700">Absent</h3>
            <p className="text-xs text-red-600/70">Mark selected</p>
          </div>
        </button>
        <button onClick={() => handleMarkAttendance('Excused')} className="bg-card border border-blue-200 shadow-sm shadow-blue-500/10 rounded-2xl p-4 flex items-center gap-3 hover:bg-blue-50 transition-colors">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><UserMinus className="w-5 h-5" /></div>
          <div className="text-left">
            <h3 className="font-bold text-blue-700">Excused</h3>
            <p className="text-xs text-blue-600/70">Mark selected</p>
          </div>
        </button>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search students, courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background border border-border px-3 py-2 rounded-xl">
            <CalendarDays className="w-4 h-4" /> {new Date().toLocaleDateString()}
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-4 font-semibold">Student</th>
                <th className="p-4 font-semibold">Course</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={a.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4 font-semibold text-foreground">
                    {a.student_name || 'Unknown Student'}
                  </td>
                  <td className="p-4 text-muted-foreground font-medium">
                    {a.course_name || 'Course'}
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {a.date}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center w-fit gap-1 ${
                      a.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      a.status === 'Late' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                      a.status === 'Excused' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {a.status === 'Present' && <UserCheck className="w-3 h-3" />}
                      {a.status === 'Late' && <AlertTriangle className="w-3 h-3" />}
                      {a.status === 'Absent' && <UserX className="w-3 h-3" />}
                      {a.status === 'Excused' && <UserMinus className="w-3 h-3" />}
                      {a.status}
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
