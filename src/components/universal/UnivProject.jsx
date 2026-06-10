import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, HardHat, Plus, Activity, AlertTriangle, Calendar, Building, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivProject() {
  const companyId = useCompanyId();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchProjects();
      const channel = supabase.channel('projects_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_projects', filter: `company_id=eq.${companyId}` }, () => {
          fetchProjects();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_projects')
        .select('*')
        .eq('company_id', companyId)
        .order('start_date', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setProjects(data || []);
    } catch (err) {
      if (err.code === '42P01') {
        setProjects([
          { id: '1', project_name: 'Downtown Commercial Tower', client_name: 'City Developers', start_date: '2025-01-15', end_date: '2027-06-30', budget: 15000000, status: 'Active', completion_percentage: 45 },
          { id: '2', project_name: 'Residential Block A', client_name: 'HomeCorp', start_date: '2026-03-01', end_date: '2026-12-15', budget: 2500000, status: 'Planning', completion_percentage: 5 },
          { id: '3', project_name: 'Highway Expansion', client_name: 'Gov Transport', start_date: '2024-05-10', end_date: '2025-11-20', budget: 8500000, status: 'Completed', completion_percentage: 100 }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async () => {
    const newProject = {
      company_id: companyId,
      project_name: 'New Construction Project',
      client_name: 'Client A',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 86400000 * 365).toISOString().split('T')[0],
      budget: 1000000,
      status: 'Planning',
      completion_percentage: 0
    };
    try {
      const { error } = await supabase.from('univ_projects').insert(newProject);
      if (error) throw error;
      toast.success('Project created');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to create project');
    }
  };

  const filtered = projects.filter(p => 
    `${p.project_name} ${p.client_name} ${p.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Project Management</h2>
           <p className="text-sm text-muted-foreground mt-1">Track construction projects, budgets, and overall progress.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAddProject} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 shrink-0">
         {filtered.map((p, idx) => (
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: idx * 0.05 }}
             key={p.id} 
             className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors shadow-sm group"
           >
             <div className="flex justify-between items-start mb-3">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                   <HardHat className="w-5 h-5" />
                 </div>
                 <div>
                   <h3 className="font-bold text-foreground line-clamp-1">{p.project_name}</h3>
                   <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 font-medium"><Building className="w-3 h-3" /> {p.client_name || 'Internal'}</div>
                 </div>
               </div>
               <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"><MoreHorizontal className="w-4 h-4" /></button>
             </div>

             <div className="my-4 space-y-3">
               <div className="flex items-center justify-between text-sm">
                 <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Start</span>
                 <span className="font-medium">{p.start_date}</span>
               </div>
               <div className="flex items-center justify-between text-sm">
                 <span className="text-muted-foreground flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> End</span>
                 <span className="font-medium">{p.end_date}</span>
               </div>
               <div className="flex items-center justify-between text-sm">
                 <span className="text-muted-foreground flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500">Budget</span>
                 <span className="font-bold text-emerald-600 dark:text-emerald-500">${Number(p.budget).toLocaleString()}</span>
               </div>
             </div>

             <div className="pt-4 border-t border-border">
               <div className="flex justify-between items-end mb-1.5">
                 <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded border ${
                   p.status === 'Active' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                   p.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                   p.status === 'Planning' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                   'bg-slate-50 text-slate-700 border-slate-200'
                 }`}>
                   {p.status}
                 </span>
                 <span className="text-xs font-bold text-foreground">{p.completion_percentage}%</span>
               </div>
               <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                 <div className={`h-full rounded-full ${p.status === 'Completed' ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${p.completion_percentage}%` }}></div>
               </div>
             </div>
           </motion.div>
         ))}
      </div>
    </div>
  );
}
