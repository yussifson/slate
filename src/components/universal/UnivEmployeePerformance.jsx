import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { Plus, Trash2, Edit2, Loader2, XCircle, Search, Award, Star, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const TABLE = 'univ_employeeperformances';
const STATUS_COLORS = {
  "Scheduled": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "In Progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Completed": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "Acknowledged": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
};
const EMPTY = { employee_name: "", reviewer_name: "", review_period: "Q1 2026", overall_rating: "0", strengths: "", areas_for_improvement: "", goals: "", review_date: new Date().toISOString().split('T')[0], status: "Scheduled" };

const StarRating = ({ rating, onChange }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star.toString())}
          className={`focus:outline-none transition-colors ${Number(rating) >= star ? 'text-amber-400' : 'text-muted-foreground/30 hover:text-amber-200'}`}
        >
          <Star className="w-6 h-6 fill-current" />
        </button>
      ))}
    </div>
  );
};

const DisplayStars = ({ rating }) => {
  const r = Number(rating) || 0;
  if (!r) return <span className="text-muted-foreground text-xs font-bold">Unrated</span>;
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < r ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`} />
      ))}
    </div>
  );
};

export default function UnivEmployeePerformance() {
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
    if (!companyId) return;
    setLoading(true);
    try {
      const __res = await powerSync.execute(`SELECT * FROM ${TABLE} WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
      setRecords(data || []);

      const __empRes = await powerSync.execute(`SELECT * FROM univ_hr_employees WHERE company_id = ? ORDER BY first_name ASC`, [companyId]);
      const empData = __empRes.rows ? (__empRes.rows._array || Array.from(__empRes.rows)) : [];
      setEmployees(empData || []);
    } catch (e) {
      console.error('[EmployeePerformance] fetch error:', e.message);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => { 
    fetchData();
    if (companyId) {
      const ch = supabase.channel('perf_ch').on('postgres_changes', { event: '*', schema: 'public', table: TABLE, filter: `company_id=eq.${companyId}` }, fetchData).subscribe();
      return () => supabase.removeChannel(ch);
    }
  }, [fetchData, companyId]);

  const openAdd = () => { setForm({ ...EMPTY }); setEditId(null); setModal(true); };
  const openEdit = (r) => { setForm({ ...r }); setEditId(r.id); setModal(true); };
  const closeModal = () => { setModal(false); setEditId(null); setForm({ ...EMPTY }); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.employee_name || !form.reviewer_name) return toast.error('Employee and Reviewer are required');
    
    setSaving(true);
    const payload = { ...form, company_id: companyId };
    
    try {
      if (editId) {
        const _payload = payload;
        const _keys = Object.keys(_payload);
        const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        await powerSync.execute(`UPDATE ${TABLE} SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, editId]);
        toast.success('Record updated!');
      } else {
        const _payload = { ...payload, id: crypto.randomUUID() };
        const _keys = Object.keys(_payload);
        const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _plhdr = _keys.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO ${TABLE} (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals);
        toast.success('Record added!');
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
    return idOrName || '—';
  };

  const filtered = records.filter(r => {
    const empName = getEmployeeName(r.employee_name);
    const revName = getEmployeeName(r.reviewer_name);
    return `${empName} ${revName} ${r.status} ${r.review_period}`.toLowerCase().includes(search.toLowerCase());
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
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-primary/10 text-primary"><Award className="w-6 h-6" /></span>
            Employee Performance
          </h1>
          <p className="text-sm text-muted-foreground mt-1 ml-0.5">Track employee performance reviews and OKR goals.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 transition-all active:scale-95">
            Export CSV
          </button>
          <button onClick={openAdd} className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 active:scale-95 transition-all">
            <Plus className="w-4 h-4" /> Add Record
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm shrink-0">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee performance..." className="w-full h-10 pl-9 pr-4 bg-card border border-primary/40 rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="flex-1 overflow-auto rounded-2xl border border-primary/40 bg-card custom-scrollbar">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="border-b border-primary/40 bg-muted/40 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Reviewer</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Goals / OKRs</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const empName = getEmployeeName(r.employee_name);
                const revName = getEmployeeName(r.reviewer_name);
                return (
                  <motion.tr key={r.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="border-b border-primary/40 hover:bg-muted/20 transition-colors group align-top">
                    <td className="px-4 py-4">
                      <p className="font-bold text-foreground flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /> {empName}</p>
                      <p className="text-xs text-muted-foreground mt-1 ml-6">{r.review_period}</p>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground font-medium">{revName}</td>
                    <td className="px-4 py-4">
                      <DisplayStars rating={r.overall_rating} />
                    </td>
                    <td className="px-4 py-4 max-w-xs">
                      <div className="mb-2">
                        <span className="text-[10px] uppercase font-bold text-primary tracking-wider block mb-0.5">Goals</span>
                        <p className="text-muted-foreground text-xs line-clamp-2">{r.goals || '—'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-primary/10">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider block">Strengths</span>
                          <p className="text-xs text-muted-foreground truncate">{r.strengths || '—'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider block">To Improve</span>
                          <p className="text-xs text-muted-foreground truncate">{r.areas_for_improvement || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${STATUS_COLORS[r.status] || 'bg-muted text-foreground'}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(r)} className="p-1.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-20 text-center text-muted-foreground">
                    <Award className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="font-medium">No employee performance records found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats Bar */}
      {!loading && records.length > 0 && (
        <div className="flex gap-4 shrink-0 flex-wrap">
          {Object.entries(
            records.reduce((acc, r) => {
              const s = r.status || 'Unknown';
              acc[s] = (acc[s] || 0) + 1;
              return acc;
            }, {})
          ).map(([s, count]) => (
            <div key={s} className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${STATUS_COLORS[s] || 'bg-muted text-muted-foreground'}`}>
              <span>{s}</span>
              <span className="bg-card/40 rounded-full px-1.5">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full max-w-2xl rounded-2xl flex flex-col border shadow-2xl max-h-[90vh]">
            <div className="p-5 border-b flex justify-between items-center bg-muted/20 shrink-0">
              <h2 className="text-xl font-black flex items-center gap-2"><Award className="w-5 h-5 text-primary" /> {editId ? 'Edit Review' : 'Add Performance Review'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-muted rounded-full transition-colors"><XCircle className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 overflow-y-auto custom-scrollbar flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Employee *</label>
                  <select required value={form.employee_name} onChange={e => setForm({...form, employee_name: e.target.value})} className="w-full h-11 px-3 bg-background border border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm appearance-none cursor-pointer">
                    <option value="">-- Select Employee --</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Reviewer *</label>
                  <select required value={form.reviewer_name} onChange={e => setForm({...form, reviewer_name: e.target.value})} className="w-full h-11 px-3 bg-background border border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm appearance-none cursor-pointer">
                    <option value="">-- Select Reviewer --</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Review Period</label>
                  <input type="text" value={form.review_period} onChange={e => setForm({...form, review_period: e.target.value})} placeholder="e.g. Q1 2026, Annual 2025" className="w-full h-11 px-3 bg-background border border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full h-11 px-3 bg-background border border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 text-sm cursor-pointer">
                    {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Overall Rating</label>
                <StarRating rating={form.overall_rating} onChange={val => setForm({...form, overall_rating: val})} />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary uppercase mb-1.5">Goals / OKRs</label>
                <textarea rows="3" value={form.goals} onChange={e => setForm({...form, goals: e.target.value})} className="w-full p-3 bg-background border border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 text-sm resize-none" placeholder="What are the key objectives for the next period?" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-600 uppercase mb-1.5">Strengths</label>
                  <textarea rows="3" value={form.strengths} onChange={e => setForm({...form, strengths: e.target.value})} className="w-full p-3 bg-background border border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 text-sm resize-none" placeholder="Key achievements..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-600 uppercase mb-1.5">Areas for Improvement</label>
                  <textarea rows="3" value={form.areas_for_improvement} onChange={e => setForm({...form, areas_for_improvement: e.target.value})} className="w-full p-3 bg-background border border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/40 text-sm resize-none" placeholder="Skills to develop..." />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-5 border-t shrink-0">
                <button type="button" onClick={closeModal} className="h-11 px-6 bg-muted rounded-xl text-sm font-bold hover:bg-muted/80 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="h-11 px-6 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editId ? 'Save Changes' : 'Create Review'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
