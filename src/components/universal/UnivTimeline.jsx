import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, Circle, Flag, Calendar, Plus, X, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivTimeline({
  title = "Project Timeline",
  subtitle = "Track milestones and phase completion.",
  milestones: propMilestones
}) {
  const companyId = useCompanyId();
  const [dbMilestones, setDbMilestones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    status: 'upcoming' // completed, current, upcoming
  });

  useEffect(() => {
    if (companyId && !propMilestones) {
      fetchProjects();
      const channel = supabase.channel('timeline_projects')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_projects', filter: `company_id=eq.${companyId}` }, () => {
          fetchProjects();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId, propMilestones]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_projects')
        .select('*').eq('company_id', companyId)
        .eq('company_id', companyId)
        .order('start_date', { ascending: true });
      if (error && error.code !== '42P01') throw error;

      // Map projects to milestone structure
      const mapped = (data || []).map(p => ({
        id: p.id,
        title: p.project_name,
        description: p.description || '',
        date: p.start_date || p.end_date || '',
        status: p.status === 'Completed' ? 'completed' : (p.status === 'Active' ? 'current' : 'upcoming')
      }));
      setDbMilestones(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setForm({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      status: 'upcoming'
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Milestone title is required');
      return;
    }

    const projectStatus = form.status === 'completed' ? 'Completed' : (form.status === 'current' ? 'Active' : 'Planning');
    const newProject = {
      company_id: companyId,
      project_name: form.title.trim(),
      description: form.description.trim() || null,
      start_date: form.date || null,
      end_date: form.date || null,
      status: projectStatus,
      budget: 0,
      completion_percentage: form.status === 'completed' ? 100 : (form.status === 'current' ? 50 : 0)
    };

    try {
      const { error } = await supabase.from('univ_projects').insert(newProject);
      if (error) throw error;
      toast.success('Milestone added');
      setIsModalOpen(false);
      fetchProjects();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save milestone');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this milestone?')) return;
    try {
      const { error } = await supabase.from('univ_projects').delete().eq('id', id);
      if (error) throw error;
      toast.success('Milestone deleted');
      fetchProjects();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to delete milestone');
    }
  };

  // Default hardcoded list if not logged in / no data
  const defaultMilestones = [
    { id: 'm1', title: 'Project Kickoff', date: '2026-06-01', status: 'completed', description: 'Initial requirements gathering and team alignment.' },
    { id: 'm2', title: 'Phase 1 Delivery', date: '2026-06-15', status: 'current', description: 'Core generic UI components deployed to staging.' },
    { id: 'm3', title: 'Client Review', date: '2026-06-20', status: 'upcoming', description: 'Feedback loop with stakeholders.' },
    { id: 'm4', title: 'Final Launch', date: '2026-07-01', status: 'upcoming', description: 'Production deployment and hand-off.' }
  ];

  const milestonesList = propMilestones || (dbMilestones.length > 0 ? dbMilestones : defaultMilestones);

  
  const handleExport = () => {
    const exportData = (typeof records !== 'undefined' ? records : (typeof data !== 'undefined' ? data : []));
    if (!exportData || exportData.length === 0) return alert('No data to export');
    const keys = Object.keys(exportData[0]).filter(k => k !== 'company_id' && k !== 'id');
    const csv = [keys.join(','), ...exportData.map(r => keys.map(k => '"' + (r[k]||'').toString().replace(/"/g, '""') + '"').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'export.csv'; a.click();
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl w-full mx-auto py-8 px-4 sm:px-6">
        <div className="flex items-center justify-between mb-10">
          <div>
             <h2 className="text-2xl font-bold text-foreground tracking-tight">{title}</h2>
             <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>
          {!propMilestones && (
            <div className="flex items-center gap-2">

        <button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
               <Plus className="w-4 h-4" /> Add Milestone
            </button>
      </div>
          )}
        </div>

        <div className="relative border-l-2 border-border ml-3 sm:ml-6 space-y-8 pb-12">
          {milestonesList.map((ms, index) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              key={ms.id} 
              className="relative pl-8 sm:pl-12 group animate-fade-in"
            >
              {/* Timeline Node */}
              <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-background transition-colors ${
                ms.status === 'completed' ? 'bg-emerald-500 text-white' : 
                ms.status === 'current' ? 'bg-primary text-white' : 
                'bg-muted border-2 border-border text-transparent'
              }`}>
                {ms.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                {ms.status === 'current' && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
              </div>

              {/* Content Card */}
              <div className={`bg-card border rounded-2xl p-5 sm:p-6 transition-all duration-300 relative ${ms.status === 'current' ? 'border-primary shadow-md' : 'border-border shadow-sm group-hover:border-primary/40'}`}>
                 {!propMilestones && ms.id !== 'm1' && ms.id !== 'm2' && ms.id !== 'm3' && ms.id !== 'm4' && (
                   <button 
                     onClick={() => handleDelete(ms.id)}
                     className="absolute top-4 right-4 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                 )}
                 <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                   <h3 className="text-lg font-bold text-foreground pr-8">{ms.title}</h3>
                   <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                     <Calendar className="w-3.5 h-3.5" /> {ms.date}
                   </span>
                 </div>
                 <p className="text-sm text-muted-foreground leading-relaxed">
                   {ms.description}
                 </p>
                 
                 {/* Decorative elements based on status */}
                 {ms.status === 'completed' && (
                   <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                     <CheckCircle2 className="w-4 h-4" /> Completed on time
                   </div>
                 )}
                 {ms.status === 'current' && (
                   <div className="mt-4">
                     <div className="flex justify-between text-xs font-semibold mb-1">
                       <span className="text-primary">In Progress</span>
                       <span className="text-muted-foreground">65%</span>
                     </div>
                     <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                       <div className="h-full bg-primary rounded-full w-[65%]"></div>
                     </div>
                   </div>
                 )}
              </div>
            </motion.div>
          ))}
          
          {/* End Flag */}
          <div className="absolute -left-[11px] bottom-0 w-5 h-5 rounded-full bg-muted border-2 border-border flex items-center justify-center ring-4 ring-background text-muted-foreground">
             <Flag className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Add Milestone Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl relative"
          >
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-bold text-foreground mb-4">Add Project Milestone</h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Milestone/Project Title *</label>
                <input 
                  type="text" 
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Design Review"
                  required
                  className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Date</label>
                <input 
                  type="date" 
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Status</label>
                <select 
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                >
                  <option value="upcoming">Upcoming (Planning)</option>
                  <option value="current">Current (Active)</option>
                  <option value="completed">Completed (Finished)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Description</label>
                <textarea 
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Details about milestone deliverables..."
                  rows="3"
                  className="w-full p-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border text-foreground hover:bg-muted/50 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-xl text-sm font-medium transition-colors shadow-sm"
                >
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
