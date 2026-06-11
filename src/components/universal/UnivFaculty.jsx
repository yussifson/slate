import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, User, Briefcase, Mail, Phone, Plus, MoreHorizontal, FileText, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivFaculty() {
  const companyId = useCompanyId();
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchFaculty();
      const channel = supabase.channel('faculty_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_faculty', filter: `company_id=eq.${companyId}` }, () => {
          fetchFaculty();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_faculty')
        .select('*').eq('company_id', companyId)
        .eq('company_id', companyId)
        .order('first_name', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setFaculty(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const handleAddFaculty = async () => {
    const newFac = {
      company_id: companyId,
      first_name: 'New',
      last_name: 'Faculty',
      title: 'Teacher',
      department: 'General',
      status: 'Active',
      hire_date: new Date().toISOString().split('T')[0]
    };
    try {
      const { error } = await supabase.from('univ_faculty').insert(newFac);
      if (error) throw error;
      toast.success('Faculty added');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save');
    }
  };

  const filtered = faculty.filter(f => 
    `${f.first_name} ${f.last_name} ${f.department} ${f.title}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Faculty & Staff</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage teachers, lecturers, and departmental staff.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={handleAddFaculty} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Faculty
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search faculty..."
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
                <th className="p-4 font-semibold">Name & Title</th>
                <th className="p-4 font-semibold">Department</th>
                <th className="p-4 font-semibold">Contact Info</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((f, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={f.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
                        {f.first_name.charAt(0)}{f.last_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{f.first_name} {f.last_name}</div>
                        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mt-0.5">{f.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground font-medium">
                    <div className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> {f.department || '—'}</div>
                  </td>
                  <td className="p-4">
                     <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        {f.email && <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {f.email}</span>}
                        {f.phone && <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {f.phone}</span>}
                     </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border ${
                      f.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      f.status === 'On Leave' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded bg-card border border-border shadow-sm"><MoreHorizontal className="w-3.5 h-3.5" /></button>
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
