import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, UserPlus, Briefcase, FileText, Star, MoreHorizontal, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivRecruitment() {
  const companyId = useCompanyId();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchApplicants();
      const channel = supabase.channel('recruitment_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_recruitment', filter: `company_id=eq.${companyId}` }, () => {
          fetchApplicants();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_recruitment')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setApplicants(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const handleAddApplicant = async () => {
    const newApplicant = {
      company_id: companyId,
      applicant_name: 'New Applicant',
      job_title: 'Open Role',
      stage: 'Applied',
      rating: 0
    };
    try {
      const { error } = await supabase.from('univ_recruitment').insert(newApplicant);
      if (error) throw error;
      toast.success('Applicant added');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to add applicant');
    }
  };

  const filtered = applicants.filter(a => 
    `${a.applicant_name} ${a.job_title} ${a.stage}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Recruitment</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage job applicants and hiring stages.</p>
        </div>
        <button onClick={handleAddApplicant} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
          <UserPlus className="w-4 h-4" /> Add Applicant
        </button>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search applicants, roles..."
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
                <th className="p-4 font-semibold">Applicant Name</th>
                <th className="p-4 font-semibold">Job Title</th>
                <th className="p-4 font-semibold">Stage</th>
                <th className="p-4 font-semibold">Rating</th>
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
                  <td className="p-4 font-semibold text-foreground flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      {a.applicant_name.charAt(0)}
                    </div>
                    {a.applicant_name}
                  </td>
                  <td className="p-4 text-muted-foreground font-medium">
                    <div className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> {a.job_title}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border w-fit flex items-center gap-1 ${
                      a.stage === 'Applied' ? 'bg-slate-50 text-slate-700 border-slate-200' : 
                      a.stage === 'Interviewing' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      a.stage === 'Offered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      a.stage === 'Hired' ? 'bg-primary/10 text-primary border-primary/20' : 
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {a.stage === 'Offered' && <CheckCircle2 className="w-3 h-3" />}
                      {a.stage === 'Rejected' && <XCircle className="w-3 h-3" />}
                      {a.stage}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} className={`w-3.5 h-3.5 ${star <= (a.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200 dark:text-slate-700'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded bg-card border border-border shadow-sm"><FileText className="w-3.5 h-3.5" /></button>
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
