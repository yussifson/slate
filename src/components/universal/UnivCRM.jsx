import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, MoreHorizontal, User, Mail, Phone, Calendar as CalendarIcon, Loader2, DollarSign, Trash2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];

export default function UnivCRM() {
  const companyId = useCompanyId();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchLeads();
      const channel = supabase.channel('crm_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_crm_leads', filter: `company_id=eq.${companyId}` }, () => {
          fetchLeads();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_crm_leads')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error; // ignore table doesn't exist error for preview
      setLeads(data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLead = async (e) => {
    if (e) e.preventDefault();
    if (!newLeadName.trim()) return;
    const newLead = {
      company_id: companyId,
      first_name: newLeadName,
      last_name: '',
      status: 'New',
      value: 0
    };
    try {
      const { error } = await supabase.from('univ_crm_leads').insert(newLead);
      if (error) throw error;
      toast.success('Lead added');
      setIsAdding(false);
      setNewLeadName('');
    } catch (err) {
      toast.error('Failed to add lead');
    }
  };

  const handleDeleteLead = async (id) => {
    try {
      const { error } = await supabase.from('univ_crm_leads').delete().eq('id', id);
      if (error) throw error;
      toast.success('Lead deleted');
    } catch (err) {
      toast.error('Failed to delete lead');
    }
  };

  const updateLeadStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase.from('univ_crm_leads').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const filteredLeads = leads.filter(l => 
    `${l.first_name} ${l.last_name} ${l.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="mb-6 p-4 bg-card border border-primary/20 rounded-2xl shadow-sm mx-1">
          <form onSubmit={handleAddLead} className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Lead Name</label>
              <input 
                autoFocus
                type="text" 
                value={newLeadName} 
                onChange={e => setNewLeadName(e.target.value)} 
                placeholder="Enter lead name..." 
                className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" 
              />
            </div>
            <button type="submit" className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90">Save Lead</button>
            <button type="button" onClick={() => setIsAdding(false)} className="h-10 px-4 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80 border border-border">Cancel</button>
          </form>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto flex gap-4 pb-4 snap-x">
        {loading && leads.length === 0 ? (
          <div className="w-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          STAGES.map(stage => {
            const stageLeads = filteredLeads.filter(l => l.status === stage);
            return (
              <div key={stage} className="flex-shrink-0 w-80 bg-muted/30 border border-border rounded-2xl flex flex-col snap-center">
                <div className="p-4 border-b border-border/50 flex justify-between items-center bg-card/40 rounded-t-2xl">
                  <h3 className="font-bold text-sm text-foreground tracking-tight">{stage}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-background border border-border text-xs font-medium text-muted-foreground shadow-sm">
                    {stageLeads.length}
                  </span>
                </div>
                <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                  <AnimatePresence>
                    {stageLeads.map(lead => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={lead.id} 
                        className="bg-card border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors"></div>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">{lead.first_name} {lead.last_name}</h4>
                            {lead.email && <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1"><Mail className="w-3 h-3" /> {lead.email}</p>}
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => handleDeleteLead(lead.id)} className="text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity p-1">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500 bg-muted/50 p-2 rounded-lg">
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <DollarSign className="w-3 h-3" /> {Number(lead.value || 0).toLocaleString()}
                          </span>
                          {/* Quick Actions (Simulated) */}
                          <div className="flex gap-2">
                             {stage !== 'New' && <button onClick={() => updateLeadStatus(lead.id, STAGES[STAGES.indexOf(stage)-1])} className="hover:text-primary">&larr;</button>}
                             {stage !== 'Lost' && <button onClick={() => updateLeadStatus(lead.id, STAGES[STAGES.indexOf(stage)+1])} className="hover:text-primary">&rarr;</button>}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {stageLeads.length === 0 && (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-border/60 rounded-xl text-xs text-muted-foreground font-medium">
                      No leads in {stage}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
