import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect } from 'react';
import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, FileText, Calendar, Edit2, Trash2, XCircle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivBriefs() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    case_name: '', brief_type: 'Appellate Brief', due_date: new Date().toISOString().split('T')[0], status: 'Drafting'
  });

  useEffect(() => {
    if (companyId) {
      fetchData();
      const channel = supabase.channel('univ_briefs_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_briefs', filter: `company_id=eq.${companyId}` }, () => fetchData())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const __res = await powerSync.execute(`SELECT * FROM univ_briefs WHERE company_id = ? ORDER BY due_date ASC`, [companyId]);
      setData(__res.rows ? (__res.rows._array || Array.from(__res.rows)) : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch briefs');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({ ...item });
    } else {
      setEditingItem(null);
      setForm({ case_name: '', brief_type: 'Appellate Brief', due_date: new Date().toISOString().split('T')[0], status: 'Drafting' });
    }
    setIsModalOpen(true);
  };

  const saveItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await powerSync.execute(`UPDATE univ_briefs SET case_name = ?, brief_type = ?, due_date = ?, status = ? WHERE id = ?`, 
          [form.case_name, form.brief_type, form.due_date, form.status, editingItem.id]);
        toast.success('Brief updated');
      } else {
        const id = crypto.randomUUID();
        await powerSync.execute(`INSERT INTO univ_briefs (id, company_id, case_name, brief_type, due_date, status) VALUES (?, ?, ?, ?, ?, ?)`, 
          [id, companyId, form.case_name, form.brief_type, form.due_date, form.status]);
        toast.success('Brief added');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to save brief');
    }
  };

  const deleteItem = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this brief?')) return;
    try {
      await powerSync.execute(`DELETE FROM univ_briefs WHERE id = ?`, [id]);
      toast.success('Brief deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete brief');
    }
  };

  const filtered = data.filter(item => 
    String(item.case_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(item.brief_type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`flex flex-col h-full bg-background overflow-hidden ${view !== 'Default' ? 'hide-default' : ''}`}>
      <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">Legal Briefs</h2>
          <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Manage appellate briefs, memorandums, and drafting deadlines.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)]">
            <Plus className="w-4 h-4" /> Add Brief
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
            <input 
              type="text"
              placeholder="Search case names or brief types..."
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
                <th className="p-4">Case Name</th>
                <th className="p-4">Brief Type</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((item, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={item.id} 
                  onClick={() => openModal(item)}
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4">
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> {item.case_name}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-[#71717a]">{item.brief_type}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-foreground"><Calendar className="w-3.5 h-3.5 text-[#71717a]"/> {item.due_date}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-lg flex items-center gap-2 w-fit ${
                      item.status === 'Filed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10' : 
                      item.status === 'Review' ? 'bg-orange-50 text-orange-700 dark:bg-orange-500/10' : 
                      'bg-blue-50 text-blue-700 dark:bg-blue-500/10'
                    }`}>
                      {item.status === 'Filed' && <CheckCircle2 className="w-3 h-3" />}
                      {item.status === 'Review' && <Clock className="w-3 h-3" />}
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); openModal(item); }} className="p-1.5 text-[#71717a] hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={(e) => deleteItem(item.id, e)} className="p-1.5 text-[#71717a] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-[#71717a]">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No legal briefs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="bg-card w-full max-w-sm rounded-2xl flex flex-col shadow-xl border-[0.5px] border-black/9 dark:border-white/8">
              <div className="p-5 border-b border-border/40 flex justify-between items-center">
                <h2 className="text-lg font-semibold tracking-[-0.02em]">{editingItem ? 'Edit Brief' : 'New Brief'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-muted rounded-full text-[#71717a] hover:text-foreground"><XCircle className="w-5 h-5"/></button>
              </div>
              <form onSubmit={saveItem} className="p-5 flex flex-col gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Case Name</label>
                  <input required value={form.case_name} onChange={e=>setForm({...form, case_name: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Brief Type</label>
                    <input required value={form.brief_type} onChange={e=>setForm({...form, brief_type: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Due Date</label>
                    <input required type="date" value={form.due_date} onChange={e=>setForm({...form, due_date: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Status</label>
                  <select required value={form.status} onChange={e=>setForm({...form, status: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option>Drafting</option>
                    <option>Review</option>
                    <option>Filed</option>
                  </select>
                </div>
                <div className="mt-4 pt-4 border-t border-border/40 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-xl">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90">Save Brief</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
