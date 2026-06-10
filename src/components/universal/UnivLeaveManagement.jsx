import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, CalendarDays, Check, X, Clock, FileText, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivLeaveManagement() {
  const companyId = useCompanyId();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchLeaves();
      const channel = supabase.channel('leave_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_leave_management', filter: `company_id=eq.${companyId}` }, () => {
          fetchLeaves();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_leave_management')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setLeaves(data || []);
    } catch (err) {
      if (err.code === '42P01') {
        setLeaves([
          { id: '1', employee_id: 'emp1', leave_type: 'Annual', start_date: '2026-07-01', end_date: '2026-07-14', status: 'Pending', reason: 'Summer vacation' },
          { id: '2', employee_id: 'emp2', leave_type: 'Sick', start_date: '2026-06-10', end_date: '2026-06-11', status: 'Approved', reason: 'Flu' },
          { id: '3', employee_id: 'emp3', leave_type: 'Maternity', start_date: '2026-08-01', end_date: '2026-11-01', status: 'Pending', reason: 'Maternity Leave' }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLeave = async () => {
    const newLeave = {
      company_id: companyId,
      employee_id: 'current_user',
      leave_type: 'Annual',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      status: 'Pending',
      reason: 'Personal time off'
    };
    try {
      const { error } = await supabase.from('univ_leave_management').insert(newLeave);
      if (error) throw error;
      toast.success('Leave requested');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to request leave');
    }
  };

  const filtered = leaves.filter(l => 
    `${l.leave_type} ${l.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Leave Management</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage employee time off and approvals.</p>
        </div>
        <button onClick={handleRequestLeave} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
          <Plus className="w-4 h-4" /> Request Leave
        </button>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search leaves..."
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
                <th className="p-4 font-semibold">Employee</th>
                <th className="p-4 font-semibold">Leave Type</th>
                <th className="p-4 font-semibold">Duration</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Approvals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((l, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={l.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4 font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                      Emp {l.employee_id}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-foreground">
                    <div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-muted-foreground" /> {l.leave_type}</div>
                  </td>
                  <td className="p-4 text-xs font-mono text-muted-foreground">
                    <div className="flex items-center gap-2">
                       <CalendarDays className="w-3.5 h-3.5" />
                       {l.start_date} <br/> {l.end_date}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border w-fit flex items-center gap-1 ${
                      l.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      l.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : 
                      'bg-orange-50 text-orange-700 border-orange-200'
                    }`}>
                      {l.status === 'Pending' && <Clock className="w-3 h-3" />}
                      {l.status === 'Approved' && <CheckCircle2 className="w-3 h-3" />}
                      {l.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                      {l.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {l.status === 'Pending' ? (
                        <>
                          <button className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 transition-colors p-1.5 rounded-lg border border-emerald-200 shadow-sm"><Check className="w-4 h-4" /></button>
                          <button className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors p-1.5 rounded-lg border border-red-200 shadow-sm"><X className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Processed</span>
                      )}
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
