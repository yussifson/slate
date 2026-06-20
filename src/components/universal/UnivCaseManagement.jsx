import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect } from 'react';
import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Briefcase, Plus, Scale, CheckCircle2, AlertCircle, Clock, MoreHorizontal, User, Trash2, Edit2, XCircle, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivCaseManagement() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  
  const [isDeadlinesOpen, setIsDeadlinesOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [deadlines, setDeadlines] = useState([]);
  
  // Case Form State
  const [caseForm, setCaseForm] = useState({
    case_number: '', client_name: '', case_type: '', status: 'Open', court_jurisdiction: '', filed_date: ''
  });

  // Deadline Form State
  const [deadlineForm, setDeadlineForm] = useState({
    title: '', deadline_date: '', is_critical: false, status: 'pending'
  });

  useEffect(() => {
    if (companyId) {
      fetchCases();
      const channel = supabase.channel('cases_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_cases', filter: `company_id=eq.${companyId}` }, () => fetchCases())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_case_deadlines', filter: `company_id=eq.${companyId}` }, () => {
           if (selectedCase) fetchDeadlines(selectedCase.id);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId, selectedCase]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const __res = await powerSync.execute(`SELECT * FROM univ_cases WHERE company_id = ? ORDER BY filed_date DESC`, [companyId]);
      setCases(__res.rows ? (__res.rows._array || Array.from(__res.rows)) : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeadlines = async (caseId) => {
    try {
      const __res = await powerSync.execute(`SELECT * FROM univ_case_deadlines WHERE case_id = ? ORDER BY deadline_date ASC`, [caseId]);
      setDeadlines(__res.rows ? (__res.rows._array || Array.from(__res.rows)) : []);
    } catch (err) {
      console.error(err);
    }
  };

  const openCaseModal = (c = null) => {
    if (c) {
      setEditingCase(c);
      setCaseForm({ ...c });
    } else {
      setEditingCase(null);
      setCaseForm({ case_number: `CAS-${Math.floor(1000+Math.random()*9000)}`, client_name: '', case_type: 'General Litigation', status: 'Open', court_jurisdiction: '', filed_date: new Date().toISOString().split('T')[0] });
    }
    setIsCaseModalOpen(true);
  };

  const saveCase = async (e) => {
    e.preventDefault();
    try {
      if (editingCase) {
        const _keys = Object.keys(caseForm).filter(k => k !== 'id' && k !== 'company_id' && k !== 'created_at');
        const _set = _keys.map(k => `${k} = ?`).join(', ');
        const _vals = _keys.map(k => caseForm[k]);
        await powerSync.execute(`UPDATE univ_cases SET ${_set} WHERE id = ? AND company_id = ?`, [..._vals, editingCase.id, companyId]);
        toast.success('Case updated');
      } else {
        const payload = { ...caseForm, id: crypto.randomUUID(), company_id: companyId };
        const _keys = Object.keys(payload);
        const _plhdr = _keys.map(()=>'?').join(', ');
        const _vals = Object.values(payload);
        await powerSync.execute(`INSERT INTO univ_cases (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals);
        toast.success('Case created');
      }
      setIsCaseModalOpen(false);
      fetchCases();
    } catch (err) {
      toast.error(err.message || 'Failed to save case');
    }
  };

  const deleteCase = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this case? All related deadlines will be orphaned.')) return;
    try {
      await powerSync.execute(`DELETE FROM univ_cases WHERE id = ?`, [id]);
      toast.success('Case deleted');
      fetchCases();
    } catch (err) {
      toast.error('Failed to delete case');
    }
  };

  const openDeadlines = (c) => {
    setSelectedCase(c);
    fetchDeadlines(c.id);
    setIsDeadlinesOpen(true);
  };

  const saveDeadline = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...deadlineForm, id: crypto.randomUUID(), company_id: companyId, case_id: selectedCase.id };
      const _keys = Object.keys(payload);
      const _plhdr = _keys.map(()=>'?').join(', ');
      const _vals = Object.values(payload);
      await powerSync.execute(`INSERT INTO univ_case_deadlines (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals);
      toast.success('Deadline added');
      setDeadlineForm({ title: '', deadline_date: '', is_critical: false, status: 'pending' });
      fetchDeadlines(selectedCase.id);
    } catch (err) {
      toast.error('Failed to add deadline');
    }
  };

  const deleteDeadline = async (id) => {
    try {
      await powerSync.execute(`DELETE FROM univ_case_deadlines WHERE id = ?`, [id]);
      fetchDeadlines(selectedCase.id);
    } catch (err) {
      toast.error('Failed to delete deadline');
    }
  };

  const filtered = cases.filter(c => 
    `${c.case_number} ${c.client_name} ${c.case_type} ${c.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`flex flex-col h-full bg-background overflow-hidden ${view !== 'Default' ? 'hide-default' : ''}`}>
      <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">Case Management</h2>
          <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Manage legal cases, deadlines, and jurisdictions.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => openCaseModal()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)]">
            <Plus className="w-4 h-4" /> Open New Case
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 shrink-0">
        <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-4 flex items-center justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div>
            <p className="text-sm text-[#71717a] dark:text-gray-400 font-medium">Total Cases</p>
            <h3 className="text-2xl font-semibold text-foreground mt-1 tracking-[-0.02em]">{cases.length}</h3>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 rounded-xl"><Briefcase className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-4 flex items-center justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div>
            <p className="text-sm text-[#71717a] dark:text-gray-400 font-medium">Open</p>
            <h3 className="text-2xl font-semibold text-foreground mt-1 tracking-[-0.02em]">{cases.filter(c => c.status === 'Open').length}</h3>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-xl"><Scale className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-4 flex items-center justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div>
            <p className="text-sm text-[#71717a] dark:text-gray-400 font-medium">In Progress</p>
            <h3 className="text-2xl font-semibold text-foreground mt-1 tracking-[-0.02em]">{cases.filter(c => c.status === 'In Progress').length}</h3>
          </div>
          <div className="p-3 bg-orange-100 dark:bg-orange-500/10 text-orange-600 rounded-xl"><Clock className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-4 flex items-center justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div>
            <p className="text-sm text-[#71717a] dark:text-gray-400 font-medium">Closed</p>
            <h3 className="text-2xl font-semibold text-foreground mt-1 tracking-[-0.02em]">{cases.filter(c => c.status === 'Closed').length}</h3>
          </div>
          <div className="p-3 bg-muted dark:bg-slate-800 text-[#71717a] dark:text-gray-400 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
        </div>
      </div>

      <div className="flex-1 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
            <input 
              type="text"
              placeholder="Search cases, clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-[11px] font-semibold tracking-[0.06em] uppercase text-[#71717a] dark:text-gray-400 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-4">Case Info</th>
                <th className="p-4">Client</th>
                <th className="p-4">Jurisdiction</th>
                <th className="p-4">Filed Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={c.id} 
                  onClick={() => openDeadlines(c)}
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4">
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-primary" /> {c.case_number}
                    </div>
                    <div className="text-xs text-[#71717a] dark:text-gray-400 mt-0.5 tracking-[0.04em]">{c.case_type}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium flex items-center gap-2.5"><User className="w-3.5 h-3.5 text-[#71717a] dark:text-gray-400"/> {c.client_name}</div>
                  </td>
                  <td className="p-4 text-[#71717a] dark:text-gray-400">
                    <div className="flex items-center gap-2.5"><Scale className="w-3.5 h-3.5" /> {c.court_jurisdiction || 'N/A'}</div>
                  </td>
                  <td className="p-4 text-[#71717a] dark:text-gray-400 text-xs tracking-[0.04em]">
                    {c.filed_date || '—'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-lg flex items-center gap-2 w-fit ${
                      c.status === 'Open' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10' : 
                      c.status === 'In Progress' ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10' : 
                      c.status === 'Closed' ? 'bg-muted text-foreground' : 
                      'bg-orange-50 text-orange-700 dark:bg-orange-500/10'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); openCaseModal(c); }} className="p-1.5 text-[#71717a] hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={(e) => deleteCase(c.id, e)} className="p-1.5 text-[#71717a] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Modal */}
      <AnimatePresence>
        {isCaseModalOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="bg-card w-full max-w-md rounded-2xl flex flex-col shadow-xl border-[0.5px] border-black/9 dark:border-white/8">
              <div className="p-5 border-b border-primary/40 flex justify-between items-center">
                <h2 className="text-lg font-semibold tracking-[-0.02em]">{editingCase ? 'Edit Case' : 'New Case'}</h2>
                <button onClick={() => setIsCaseModalOpen(false)} className="p-1.5 bg-muted rounded-full text-[#71717a] hover:text-foreground"><XCircle className="w-5 h-5"/></button>
              </div>
              <form onSubmit={saveCase} className="p-5 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Case Number</label>
                    <input required value={caseForm.case_number} onChange={e=>setCaseForm({...caseForm, case_number: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Client Name</label>
                    <input required value={caseForm.client_name} onChange={e=>setCaseForm({...caseForm, client_name: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Case Type</label>
                    <input required value={caseForm.case_type} onChange={e=>setCaseForm({...caseForm, case_type: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Jurisdiction</label>
                    <input value={caseForm.court_jurisdiction} onChange={e=>setCaseForm({...caseForm, court_jurisdiction: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Filed Date</label>
                    <input type="date" value={caseForm.filed_date} onChange={e=>setCaseForm({...caseForm, filed_date: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Status</label>
                    <select value={caseForm.status} onChange={e=>setCaseForm({...caseForm, status: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Closed</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/40 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsCaseModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-xl">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90">Save Case</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deadlines Sidebar / Modal */}
      <AnimatePresence>
        {isDeadlinesOpen && selectedCase && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-40 flex justify-end bg-background/80 backdrop-blur-sm">
            <motion.div initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} transition={{type:'spring', damping:25, stiffness:200}} className="w-full max-w-md bg-card border-l border-border/40 h-full flex flex-col shadow-2xl">
              <div className="p-6 border-b border-border/40 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">{selectedCase.case_number} Deadlines</h2>
                  <p className="text-sm text-[#71717a]">{selectedCase.client_name}</p>
                </div>
                <button onClick={() => setIsDeadlinesOpen(false)} className="p-2 bg-muted rounded-full text-[#71717a] hover:text-foreground"><XCircle className="w-5 h-5"/></button>
              </div>
              <div className="p-6 flex-1 overflow-auto bg-muted/10">
                <form onSubmit={saveDeadline} className="bg-card p-4 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 shadow-sm mb-6">
                  <h3 className="text-sm font-semibold mb-3">Add Deadline</h3>
                  <div className="space-y-3">
                    <input required placeholder="E.g., Discovery Cutoff, Motion to Dismiss" value={deadlineForm.title} onChange={e=>setDeadlineForm({...deadlineForm, title: e.target.value})} className="w-full h-9 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    <div className="flex gap-2">
                      <input required type="date" value={deadlineForm.deadline_date} onChange={e=>setDeadlineForm({...deadlineForm, deadline_date: e.target.value})} className="flex-1 h-9 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                      <label className="flex items-center gap-2 text-sm text-[#71717a] bg-background border-[0.5px] border-black/9 dark:border-white/8 px-3 rounded-lg cursor-pointer">
                        <input type="checkbox" checked={deadlineForm.is_critical} onChange={e=>setDeadlineForm({...deadlineForm, is_critical: e.target.checked})} className="accent-red-500" /> Critical (SOL)
                      </label>
                    </div>
                    <button type="submit" className="w-full h-9 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90">Add Deadline</button>
                  </div>
                </form>

                <div className="space-y-3">
                  {deadlines.map(d => (
                    <div key={d.id} className={`p-4 rounded-2xl border-[0.5px] flex items-center justify-between group ${d.is_critical ? 'border-red-200 bg-red-50 dark:bg-red-500/10' : 'border-black/9 dark:border-white/8 bg-card'}`}>
                      <div>
                        <div className="flex items-center gap-2">
                          {d.is_critical && <AlertCircle className="w-4 h-4 text-red-500" />}
                          <h4 className={`font-medium ${d.is_critical ? 'text-red-700 dark:text-red-400' : 'text-foreground'}`}>{d.title}</h4>
                        </div>
                        <div className="text-sm flex items-center gap-1 mt-1 text-[#71717a]">
                          <Calendar className="w-3.5 h-3.5" /> {d.deadline_date}
                        </div>
                      </div>
                      <button onClick={() => deleteDeadline(d.id)} className="p-2 text-[#71717a] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  ))}
                  {deadlines.length === 0 && (
                    <div className="text-center p-8 text-[#71717a] border-[0.5px] border-dashed rounded-2xl">No deadlines tracked for this matter.</div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
