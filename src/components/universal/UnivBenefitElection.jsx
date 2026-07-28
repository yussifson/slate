import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { Plus, Trash2, Edit2, Loader2, XCircle, Search, Gift, User, HeartPulse, DollarSign, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const TABLE = 'univ_benefitelection';
const STATUS_COLORS = {
  "Active": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200",
  "Pending": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200",
  "Waived": "bg-muted text-[#71717a] dark:text-gray-400 border-muted-foreground/20",
  "Terminated": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200"
};

const BENEFIT_TYPES = ["Health Insurance", "Dental", "Vision", "Life Insurance", "401k", "FSA", "HSA", "Other"];
const COVERAGE_LEVELS = ["Individual", "Employee + Spouse", "Employee + Child(ren)", "Family", "N/A"];

const EMPTY = { employee_name: "", benefit_type: "Health Insurance", coverage_level: "Individual", start_date: new Date().toISOString().split('T')[0], cost: "", status: "Active" };

export default function UnivBenefitElection() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (companyId === undefined) return;
    setLoading(true);
    try {
      const __res = await powerSync.execute(`SELECT * FROM ${TABLE} WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
      setRecords(data || []);

      const __empRes = await powerSync.execute(`SELECT * FROM univ_hr_employees WHERE company_id = ? ORDER BY first_name ASC`, [companyId]);
      const empData = __empRes.rows ? (__empRes.rows._array || Array.from(__empRes.rows)) : [];
      setEmployees(empData || []);
    } catch (e) {
      console.error('[BenefitElection] fetch error:', e.message);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => { 
    fetchData();
    if (companyId) {
      const ch = supabase.channel('benefit_ch').on('postgres_changes', { event: '*', schema: 'public', table: TABLE, filter: `company_id=eq.${companyId}` }, fetchData).subscribe();
      return () => supabase.removeChannel(ch);
    }
  }, [fetchData, companyId]);

  const openAdd = () => { setForm({ ...EMPTY }); setEditId(null); setModal(true); };
  const openEdit = (r) => { setForm({ ...r }); setEditId(r.id); setModal(true); };
  const closeModal = () => { setModal(false); setEditId(null); setForm({ ...EMPTY }); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.employee_name) return toast.error('Employee is required');
    if (!form.benefit_type) return toast.error('Benefit type is required');
    
    setSaving(true);
    const payload = { ...form, company_id: companyId };
    
    try {
      if (editId) {
        const _payload = payload;
        const _keys = Object.keys(_payload);
        const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        await powerSync.execute(`UPDATE ${TABLE} SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, editId]);
        toast.success('Election updated!');
      } else {
        const _payload = { ...payload, id: crypto.randomUUID() };
        const _keys = Object.keys(_payload);
        const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _plhdr = _keys.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO ${TABLE} (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals);
        toast.success('Election added!');
      }
      closeModal();
      fetchData();
    } catch (error) {
      toast.error('Save failed: ' + error.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await powerSync.execute(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
      toast.success('Deleted');
      fetchData();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const getEmployeeName = (idOrName) => {
    const emp = employees.find(e => e.id === idOrName);
    if (emp) return `${emp.first_name} ${emp.last_name}`;
    return idOrName || 'â€”';
  };

  const filtered = records.filter(r => {
    const empName = getEmployeeName(r.employee_name);
    return `${empName} ${r.benefit_type} ${r.coverage_level} ${r.status}`.toLowerCase().includes(search.toLowerCase());
  });

  const handleExport = () => {
    const exportData = filtered;
    if (!exportData || exportData.length === 0) return alert('No data to export');
    const keys = Object.keys(exportData[0]).filter(k => k !== 'company_id' && k !== 'id');
    const csv = [keys.join(','), ...exportData.map(r => keys.map(k => '"' + (r[k]||'').toString().replace(/"/g, '""') + '"').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'export.csv'; a.click();
  };

  return (
    <div className={`h-full flex flex-col gap-6 p-6 bg-background overflow-auto ${view !== 'Default' ? 'hide-default' : ''}`}>
      {/* Header */}
      <div className="view-header flex items-center justify-between flex-wrap gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3 tracking-[-0.02em]">
            <span className="p-2.5 rounded-xl bg-primary/10 text-primary"><Gift className="w-6 h-6" /></span>
            Benefits & Insurance
          </h1>
          <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1 ml-0.5">Manage employee benefits, insurance elections, and perks.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-secondary/80 transition-all active:scale-95">
            Export CSV
          </button>
          <button onClick={openAdd} className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 active:scale-95 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm">
            <Plus className="w-4 h-4" /> Add Election
          </button>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col sm:flex-row gap-4 shrink-0 justify-between items-start sm:items-center">
        <div className="relative w-full max-w-sm shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search elections..." className="w-full h-11 pl-9 pr-4 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
        </div>
        
        {!loading && records.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            {Object.entries(
              records.reduce((acc, r) => {
                const s = r.status || 'Unknown';
                acc[s] = (acc[s] || 0) + 1;
                return acc;
              }, {})
            ).map(([s, count]) => (
              <div key={s} className={`px-3 py-1.5 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap ${STATUS_COLORS[s] || 'bg-muted text-[#71717a] dark:text-gray-400 border-muted'}`}>
                <span>{s}</span>
                <span className="bg-background/50 rounded-md px-1.5">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="flex-1 overflow-auto rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card custom-scrollbar hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="border-b border-primary/40 bg-muted/40 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider whitespace-nowrap tracking-[0.04em]">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">Benefit Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider whitespace-nowrap tracking-[0.04em]">Coverage Level</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider whitespace-nowrap tracking-[0.04em]">Monthly Cost</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider whitespace-nowrap tracking-[0.04em]">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider whitespace-nowrap tracking-[0.04em]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const empName = getEmployeeName(r.employee_name);
                return (
                  <motion.tr key={r.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="border-b border-primary/40 hover:bg-muted/20 transition-colors group align-middle">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-foreground flex items-center gap-2"><User className="w-4 h-4 text-[#71717a] dark:text-gray-400" /> {empName}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary opacity-70" />
                        <span className="font-semibold text-foreground">{r.benefit_type || 'â€”'}</span>
                      </div>
                      <div className="text-[10px] text-[#71717a] dark:text-gray-400 mt-1 ml-6 uppercase tracking-wider tracking-[0.04em]">Since: {r.start_date || 'â€”'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 rounded-md bg-secondary/50 text-secondary-foreground text-xs font-medium border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 tracking-[0.04em]">
                        {r.coverage_level || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {r.cost ? (
                        <span className="font-mono font-semibold text-foreground flex items-center">
                          <DollarSign className="w-3.5 h-3.5 text-[#71717a] dark:text-gray-400 mr-0.5" />{r.cost}
                        </span>
                      ) : <span className="text-[#71717a] dark:text-gray-400 text-xs tracking-[0.04em]">â€”</span>}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider border ${STATUS_COLORS[r.status] || 'bg-muted text-foreground'}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(r)} className="p-1.5 bg-muted rounded-xl hover:bg-muted/80 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-20 text-center text-[#71717a] dark:text-gray-400">
                    <Gift className="w-10 h-10 mx-auto mb-3 text-[#71717a] dark:text-gray-400/30" />
                    <p className="font-medium">No benefit elections found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full max-w-2xl rounded-2xl flex flex-col border-[0.5px] border-black/9 dark:border-white/8 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-2xl max-h-[90vh] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <div className="p-5 border-b flex justify-between items-center bg-muted/20 shrink-0">
              <h2 className="text-xl font-black flex items-center gap-2"><Gift className="w-5 h-5 text-primary" /> {editId ? 'Edit Benefit Election' : 'Add Benefit Election'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-muted rounded-full transition-colors"><XCircle className="w-5 h-5 text-[#71717a] dark:text-gray-400" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 overflow-y-auto custom-scrollbar flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Employee *</label>
                  <select required value={form.employee_name} onChange={e => setForm({...form, employee_name: e.target.value})} className="w-full h-11 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm appearance-none cursor-pointer">
                    <option value="">-- Select Employee --</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Benefit Type</label>
                  <select value={form.benefit_type} onChange={e => setForm({...form, benefit_type: e.target.value})} className="w-full h-11 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 text-sm cursor-pointer">
                    {BENEFIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Coverage Level</label>
                  <select value={form.coverage_level} onChange={e => setForm({...form, coverage_level: e.target.value})} className="w-full h-11 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 text-sm cursor-pointer">
                    {COVERAGE_LEVELS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Start Date</label>
                  <input type="date" required value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full h-11 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Monthly Cost ($)</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400 pointer-events-none" />
                    <input type="number" step="0.01" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} placeholder="0.00" className="w-full h-11 pl-9 pr-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 text-sm" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1.5 tracking-[0.04em]">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full h-11 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 text-sm cursor-pointer">
                  {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-5 border-t shrink-0">
                <button type="button" onClick={closeModal} className="h-11 px-6 bg-muted rounded-xl text-sm font-semibold hover:bg-muted/80 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="h-11 px-6 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editId ? 'Save Changes' : 'Add Election'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
