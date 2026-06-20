import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect } from 'react';
import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, ShieldAlert, UserCheck, Calendar, AlertCircle, Edit2, Trash2, XCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivConflictcheck() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    entity_name: '', checked_by: '', date_checked: new Date().toISOString().split('T')[0], result: 'Clear'
  });

  useEffect(() => {
    if (companyId) {
      fetchData();
      const channel = supabase.channel('univ_conflictcheck_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_conflictcheck', filter: `company_id=eq.${companyId}` }, () => fetchData())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const __res = await powerSync.execute(`SELECT * FROM univ_conflictcheck WHERE company_id = ? ORDER BY date_checked DESC, created_at DESC`, [companyId]);
      setData(__res.rows ? (__res.rows._array || Array.from(__res.rows)) : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch conflict checks');
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
      setForm({ entity_name: '', checked_by: '', date_checked: new Date().toISOString().split('T')[0], result: 'Clear' });
    }
    setIsModalOpen(true);
  };

  const saveItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await powerSync.execute(`UPDATE univ_conflictcheck SET entity_name = ?, checked_by = ?, date_checked = ?, result = ? WHERE id = ?`, 
          [form.entity_name, form.checked_by, form.date_checked, form.result, editingItem.id]);
        toast.success('Conflict check updated');
      } else {
        const id = crypto.randomUUID();
        await powerSync.execute(`INSERT INTO univ_conflictcheck (id, company_id, entity_name, checked_by, date_checked, result) VALUES (?, ?, ?, ?, ?, ?)`, 
          [id, companyId, form.entity_name, form.checked_by, form.date_checked, form.result]);
        toast.success('Conflict check added');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    }
  };

  const deleteItem = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this conflict check record?')) return;
    try {
      await powerSync.execute(`DELETE FROM univ_conflictcheck WHERE id = ?`, [id]);
      toast.success('Record deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const filtered = data.filter(item => 
    String(item.entity_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(item.checked_by || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`flex flex-col h-full bg-background overflow-hidden ${view !== 'Default' ? 'hide-default' : ''}`}>
      <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">Conflict Checks</h2>
          <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Run and log ethical conflict checks for new clients and matters.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)]">
            <Plus className="w-4 h-4" /> New Check
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
            <input 
              type="text"
              placeholder="Search entities or staff..."
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
                <th className="p-4">Entity / Party Name</th>
                <th className="p-4">Checked By</th>
                <th className="p-4">Date Checked</th>
                <th className="p-4">Result</th>
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
                      <ShieldAlert className="w-4 h-4 text-[#71717a]" /> {item.entity_name}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium flex items-center gap-2 text-[#71717a]"><UserCheck className="w-3.5 h-3.5"/> {item.checked_by}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-[#71717a]"><Calendar className="w-3.5 h-3.5"/> {item.date_checked}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-lg flex items-center gap-2 w-fit ${
                      item.result === 'Clear' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10' : 
                      item.result === 'Conflict Found' ? 'bg-red-50 text-red-700 dark:bg-red-500/10' : 
                      'bg-orange-50 text-orange-700 dark:bg-orange-500/10'
                    }`}>
                      {item.result === 'Clear' && <CheckCircle2 className="w-3 h-3" />}
                      {item.result === 'Conflict Found' && <AlertCircle className="w-3 h-3" />}
                      {item.result}
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
                    <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No conflict checks found.
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
                <h2 className="text-lg font-semibold tracking-[-0.02em]">{editingItem ? 'Edit Check' : 'New Conflict Check'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-muted rounded-full text-[#71717a] hover:text-foreground"><XCircle className="w-5 h-5"/></button>
              </div>
              <form onSubmit={saveItem} className="p-5 flex flex-col gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Entity / Party Name</label>
                  <input required value={form.entity_name} onChange={e=>setForm({...form, entity_name: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Checked By (Attorney/Staff)</label>
                  <input required value={form.checked_by} onChange={e=>setForm({...form, checked_by: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Date Checked</label>
                    <input required type="date" value={form.date_checked} onChange={e=>setForm({...form, date_checked: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Result</label>
                    <select required value={form.result} onChange={e=>setForm({...form, result: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                      <option>Clear</option>
                      <option>Pending Investigation</option>
                      <option>Conflict Found</option>
                      <option>Waiver Signed</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/40 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-xl">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90">Save Record</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
