import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Clock, LogIn, LogOut, CheckCircle2, XCircle, Calendar as CalendarIcon, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivAttendance() {
  const companyId = useCompanyId();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchRecords();
      const channel = supabase.channel('attendance_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_attendance', filter: `company_id=eq.${companyId}` }, () => {
          fetchRecords();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_attendance')
        .select('*')
        .eq('company_id', companyId)
        .order('date', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setRecords(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const filtered = records.filter(r => 
    `${r.employee_name} ${r.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Attendance</h2>
           <p className="text-sm text-muted-foreground mt-1">Monitor employee check-ins and check-outs.</p>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-4 font-semibold">Employee</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Check In</th>
                <th className="p-4 font-semibold">Check Out</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={r.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4 font-medium text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" /> {r.employee_name || 'Unknown'}
                  </td>
                  <td className="p-4 text-muted-foreground flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" /> {r.date}
                  </td>
                  <td className="p-4 font-mono text-xs">
                    {r.check_in ? <span className="flex items-center gap-1 text-emerald-600"><LogIn className="w-3 h-3" /> {r.check_in}</span> : '—'}
                  </td>
                  <td className="p-4 font-mono text-xs">
                    {r.check_out ? <span className="flex items-center gap-1 text-red-600"><LogOut className="w-3 h-3" /> {r.check_out}</span> : '—'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center w-fit gap-1 ${
                      r.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      r.status === 'Late' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {r.status === 'Present' && <CheckCircle2 className="w-3 h-3" />}
                      {r.status === 'Late' && <Clock className="w-3 h-3" />}
                      {r.status === 'Absent' && <XCircle className="w-3 h-3" />}
                      {r.status}
                    </span>
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
