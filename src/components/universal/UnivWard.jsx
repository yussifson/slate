import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Bed, Plus, CheckCircle2, User, MoreHorizontal, Activity, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivWard() {
  const companyId = useCompanyId();
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchWards();
      const channel = supabase.channel('wards_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_wards', filter: `company_id=eq.${companyId}` }, () => {
          fetchWards();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchWards = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_wards')
        .select('*')
        .eq('company_id', companyId)
        .order('ward_name', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setWards(data || []);
    } catch (err) {
      if (err.code === '42P01') {
        setWards([
          { id: '1', ward_name: 'ICU', bed_number: 'ICU-01', status: 'Occupied', patient_id: 'John Doe', admission_date: new Date().toISOString() },
          { id: '2', ward_name: 'General Ward A', bed_number: 'GWA-12', status: 'Available', patient_id: null, admission_date: null },
          { id: '3', ward_name: 'Maternity', bed_number: 'MAT-05', status: 'Maintenance', patient_id: null, admission_date: null }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddBed = async () => {
    const newBed = {
      company_id: companyId,
      ward_name: 'General Ward B',
      bed_number: `GWB-${Math.floor(Math.random() * 50)}`,
      status: 'Available'
    };
    try {
      const { error } = await supabase.from('univ_wards').insert(newBed);
      if (error) throw error;
      toast.success('Bed added');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to add bed');
    }
  };

  const filtered = wards.filter(w => 
    `${w.ward_name} ${w.bed_number} ${w.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Wards & Beds</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage bed availability and patient admissions.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAddBed} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Bed
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 shrink-0">
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Beds</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{wards.length}</h3>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 rounded-xl"><Bed className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Available</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{wards.filter(w => w.status === 'Available').length}</h3>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Occupied</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{wards.filter(w => w.status === 'Occupied').length}</h3>
          </div>
          <div className="p-3 bg-red-100 dark:bg-red-500/10 text-red-600 rounded-xl"><Activity className="w-5 h-5" /></div>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search wards, beds..."
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
                <th className="p-4 font-semibold">Ward & Bed</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Patient</th>
                <th className="p-4 font-semibold">Admission Date</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((w, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={w.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4">
                    <div className="font-semibold text-foreground flex items-center gap-2">
                       <Bed className="w-4 h-4 text-primary" /> {w.bed_number}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{w.ward_name}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 w-fit ${
                      w.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      w.status === 'Occupied' ? 'bg-red-50 text-red-700 border-red-200' : 
                      'bg-orange-50 text-orange-700 border-orange-200'
                    }`}>
                      {w.status === 'Available' && <CheckCircle2 className="w-3 h-3" />}
                      {w.status === 'Occupied' && <Activity className="w-3 h-3" />}
                      {w.status === 'Maintenance' && <AlertCircle className="w-3 h-3" />}
                      {w.status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {w.patient_id ? (
                      <span className="flex items-center gap-1.5 font-medium"><User className="w-3.5 h-3.5 text-slate-400" /> {w.patient_id}</span>
                    ) : '—'}
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {w.admission_date ? new Date(w.admission_date).toLocaleDateString() : '—'}
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
