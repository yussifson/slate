import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Sparkles, CheckCircle2, Clock, AlertTriangle, Plus, Brush, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivHousekeeping() {
  const companyId = useCompanyId();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchTasks();
      const channel = supabase.channel('housekeeping_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_housekeeping', filter: `company_id=eq.${companyId}` }, () => {
          fetchTasks();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_housekeeping')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setTasks(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    const newTask = {
      company_id: companyId,
      room_id: 'temp-room-id',
      task_type: 'Routine Cleaning',
      status: 'Pending',
      priority: 'Medium'
    };
    try {
      const { error } = await supabase.from('univ_housekeeping').insert(newTask);
      if (error) throw error;
      toast.success('Task created');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to create task');
    }
  };

  const filtered = tasks.filter(t => 
    `${t.room_id} ${t.task_type} ${t.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Housekeeping</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage cleaning schedules and maintenance requests.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAddTask} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 shrink-0">
        <button className="bg-card border border-border shadow-sm rounded-2xl p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Sparkles className="w-5 h-5" /></div>
          <div>
            <h3 className="font-bold text-foreground text-lg">{tasks.length}</h3>
            <p className="text-xs text-muted-foreground">Total Tasks</p>
          </div>
        </button>
        <button className="bg-card border border-emerald-200 shadow-sm shadow-emerald-500/10 rounded-2xl p-4 flex items-center gap-3 hover:bg-emerald-50 transition-colors text-left">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
          <div>
            <h3 className="font-bold text-emerald-700 text-lg">{tasks.filter(t => t.status === 'Completed').length}</h3>
            <p className="text-xs text-emerald-600/70">Completed</p>
          </div>
        </button>
        <button className="bg-card border border-orange-200 shadow-sm shadow-orange-500/10 rounded-2xl p-4 flex items-center gap-3 hover:bg-orange-50 transition-colors text-left">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><Clock className="w-5 h-5" /></div>
          <div>
            <h3 className="font-bold text-orange-700 text-lg">{tasks.filter(t => t.status === 'In Progress').length}</h3>
            <p className="text-xs text-orange-600/70">In Progress</p>
          </div>
        </button>
        <button className="bg-card border border-red-200 shadow-sm shadow-red-500/10 rounded-2xl p-4 flex items-center gap-3 hover:bg-red-50 transition-colors text-left">
          <div className="p-3 bg-red-100 text-red-600 rounded-xl"><AlertTriangle className="w-5 h-5" /></div>
          <div>
            <h3 className="font-bold text-red-700 text-lg">{tasks.filter(t => t.status === 'Pending').length}</h3>
            <p className="text-xs text-red-600/70">Pending</p>
          </div>
        </button>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search tasks..."
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
                <th className="p-4 font-semibold">Room</th>
                <th className="p-4 font-semibold">Task Type</th>
                <th className="p-4 font-semibold">Priority</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Notes</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={t.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4 font-bold text-foreground">
                    Room {t.room_id?.replace('R-', '') || 'Unknown'}
                  </td>
                  <td className="p-4 font-semibold text-foreground flex items-center gap-2">
                    <Brush className="w-4 h-4 text-primary" /> {t.task_type}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border w-fit ${
                      t.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200' : 
                      t.priority === 'Medium' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 w-fit ${
                      t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      t.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {t.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                      {t.status === 'In Progress' && <Clock className="w-3 h-3" />}
                      {t.status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground text-xs truncate max-w-[200px]">
                    {t.notes || '—'}
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
