import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, MonitorSpeaker, Plus, Activity, AlertTriangle, Settings, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivMachine() {
  const companyId = useCompanyId();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchMachines();
      const channel = supabase.channel('machines_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_machines', filter: `company_id=eq.${companyId}` }, () => {
          fetchMachines();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchMachines = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_machines')
        .select('*')
        .eq('company_id', companyId)
        .order('machine_name', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setMachines(data || []);
    } catch (err) {
      if (err.code === '42P01') {
        setMachines([
          { id: '1', machine_name: 'CNC Milling Machine - A1', serial_number: 'SN-00921A', location: 'Shop Floor 1', status: 'Operational', last_maintenance: '2026-05-10', next_maintenance: '2026-08-10' },
          { id: '2', machine_name: 'Laser Cutter - C3', serial_number: 'SN-00812C', location: 'Fabrication Bay', status: 'Maintenance', last_maintenance: '2026-01-15', next_maintenance: '2026-06-01' },
          { id: '3', machine_name: 'Injection Molder - B2', serial_number: 'SN-00744B', location: 'Shop Floor 2', status: 'Operational', last_maintenance: '2026-04-20', next_maintenance: '2026-07-20' }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddMachine = async () => {
    const newMachine = {
      company_id: companyId,
      machine_name: `Machine ${Math.floor(100 + Math.random() * 900)}`,
      serial_number: `SN-${Math.floor(10000 + Math.random() * 90000)}`,
      location: 'Main Floor',
      status: 'Operational',
      last_maintenance: new Date().toISOString().split('T')[0],
      next_maintenance: new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0]
    };
    try {
      const { error } = await supabase.from('univ_machines').insert(newMachine);
      if (error) throw error;
      toast.success('Machine added');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to add machine');
    }
  };

  const filtered = machines.filter(m => 
    `${m.machine_name} ${m.serial_number} ${m.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Machine Maintenance</h2>
           <p className="text-sm text-muted-foreground mt-1">Track equipment status, serial numbers, and maintenance schedules.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAddMachine} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Machine
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search machines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((m, idx) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                key={m.id} 
                className="bg-background border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors shadow-sm flex flex-col h-full group"
              >
                <div className="flex justify-between items-start mb-4 border-b border-border pb-4">
                  <div>
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <MonitorSpeaker className="w-5 h-5 text-primary" /> <span className="line-clamp-1">{m.machine_name}</span>
                    </h3>
                    <code className="text-xs font-mono font-bold bg-muted px-1.5 py-0.5 rounded border border-border mt-2 inline-block">
                      {m.serial_number}
                    </code>
                  </div>
                  <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 ${
                    m.status === 'Operational' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                    m.status === 'Maintenance' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                    'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {m.status === 'Operational' && <Activity className="w-3 h-3" />}
                    {m.status === 'Maintenance' && <Settings className="w-3 h-3" />}
                    {m.status === 'Offline' && <AlertTriangle className="w-3 h-3" />}
                    {m.status}
                  </span>
                </div>

                <div className="space-y-3 mb-4 flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium text-foreground">{m.location || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Maint.</span>
                    <span className="font-medium text-foreground">{m.last_maintenance || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Next Maint.</span>
                    <span className="font-bold text-orange-600 dark:text-orange-500">{m.next_maintenance || '—'}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                   <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Manage <MoreHorizontal className="w-3 h-3" />
                   </button>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
               <MonitorSpeaker className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No machines found.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
