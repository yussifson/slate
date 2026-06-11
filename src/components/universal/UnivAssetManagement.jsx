import React, { useState, useEffect } from 'react';

import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Monitor, Plus, Search, Trash2, Edit2, Loader2, XCircle, Package, TrendingDown, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const STATUS_COLORS = { Active: 'bg-emerald-50 text-emerald-700 border-emerald-200', 'Under Maintenance': 'bg-amber-50 text-amber-700 border-amber-200', Retired: 'bg-muted text-muted-foreground border-border' };
const EMPTY_FORM = { name: '', category: 'Equipment', status: 'Active', purchase_date: new Date().toISOString().split('T')[0], purchase_value: 0 };

export default function UnivAssetManagement() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [timelineId, setTimelineId] = useState(null);

  useEffect(() => {
    if (companyId) {
      fetchRecords();
      const ch = supabase.channel('assets_ch').on('postgres_changes', { event: '*', schema: 'public', table: 'univ_assets', filter: `company_id=eq.${companyId}` }, fetchRecords).subscribe();
      return () => supabase.removeChannel(ch);
    }
  }, [companyId]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('univ_assets').select('*').eq('company_id', companyId).order('name', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setRecords(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const saveRecord = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        company_id: companyId,
        name: form.name,
        category: form.category,
        status: form.status,
        purchase_date: form.purchase_date || null,
        purchase_value: Number(form.purchase_value) || 0
      };
      
      if (editingId) {
        const { error } = await supabase.from('univ_assets').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Updated!');
      } else {
        const { error } = await supabase.from('univ_assets').insert(payload);
        if (error) throw error;
        toast.success('Asset added!');
      }
      closeModal(); fetchRecords();
    } catch (err) { console.error(err); toast.error(err.message || 'Failed to save'); }
  };

  const deleteRecord = async (id) => {
    const { error } = await supabase.from('univ_assets').delete().eq('id', id);
    if (error) toast.error('Failed to delete'); else { toast.success('Deleted'); fetchRecords(); }
  };

  const updateStatus = async (id, status) => {
    const { error } = await supabase.from('univ_assets').update({ status }).eq('id', id);
    if (error) toast.error('Failed to update status'); else fetchRecords();
  };

  const openModal = (r = null) => { 
    if (r) {
      setForm({
        name: r.name,
        category: r.category,
        status: r.status,
        purchase_date: r.purchase_date || '',
        purchase_value: r.purchase_value || 0
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setEditingId(r?.id || null); 
    setIsModalOpen(true); 
  };
  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };

  const filtered = records.filter(r => {
    return `${r.name} ${r.category} ${r.status}`.toLowerCase().includes(search.toLowerCase());
  });

  const handleExport = () => {
    const exportData = filtered;
    if (!exportData || exportData.length === 0) return alert('No data to export');
    const keys = Object.keys(exportData[0]).filter(k => k !== 'company_id' && k !== 'id');
    const csv = [keys.join(','), ...exportData.map(r => keys.map(k => '"' + (r[k]||'').toString().replace(/"/g, '""') + '"').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'assets_export.csv'; a.click();
  };

  const generateDepreciationData = (value) => {
    const points = [];
    let currentVal = value;
    for(let i=0; i<5; i++) {
      points.push({ year: i, value: currentVal });
      currentVal = currentVal * 0.8; // 20% depreciation per year
    }
    return points;
  };

  const timelineRecord = records.find(r => r.id === timelineId);

  return (
    <div className={`h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8 ${view !== 'Default' ? 'hide-default' : ''}`}>
      <div className="view-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2"><Monitor className="w-7 h-7 text-primary" /> Asset Management</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Manage company equipment and track assignment.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
            <TrendingDown className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"><Plus className="w-4 h-4" /> Add Asset</button>
        </div>
      </div>

      <div className="flex gap-3 shrink-0">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets..." className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm shadow-sm" />
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-0">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
              <tr>
                {['Name', 'Category', 'Value', 'Depreciation', 'Status', 'Actions'].map((h, i) => (
                  <th key={i} className="p-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">No assets found.</td></tr>
              ) : (
                filtered.map(r => {
                  const data = generateDepreciationData(r.purchase_value || 0);
                  return (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="p-4"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold"><Package className="w-4 h-4" /></div><span className="font-bold text-foreground">{r.name}</span></div></td>
                    <td className="p-4 text-muted-foreground">{r.category}</td>
                    <td className="p-4 font-black">${Number(r.purchase_value).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td className="p-4">
                      <div className="w-24 h-8 opacity-70 group-hover:opacity-100 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data}>
                            <Line type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={2} dot={false} isAnimationActive={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </td>
                    <td className="p-4">
                      <select value={r.status} onChange={(e) => updateStatus(r.id, e.target.value)} className={`px-3 py-1 rounded-full text-xs font-bold border outline-none cursor-pointer ${STATUS_COLORS[r.status] || 'bg-muted text-muted-foreground'}`}>
                        {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setTimelineId(r.id)} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary transition-colors"><Clock className="w-4 h-4" /></button>
                        <button onClick={() => openModal(r)} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => deleteRecord(r.id)} className="p-1.5 bg-red-50 rounded-md text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/20">
              <h2 className="text-xl font-black text-foreground flex items-center gap-2"><Monitor className="w-5 h-5 text-primary" /> {editingId ? 'Edit Asset' : 'New Asset'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveRecord} className="p-5 flex flex-col gap-4">
              <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Asset Name *</label><input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Category</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"><option>Equipment</option><option>Vehicle</option><option>Building</option><option>IT Hardware</option><option>Furniture</option></select></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">{Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Purchase Value</label><input type="number" step="0.01" value={form.purchase_value} onChange={e => setForm({...form, purchase_value: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Purchase Date</label><input type="date" value={form.purchase_date} onChange={e => setForm({...form, purchase_date: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div>
              </div>
              
              <div className="flex justify-end gap-3 mt-2 pt-5 border-t border-border">
                <button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors">Cancel</button>
                <button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors">{editingId ? 'Update' : 'Save Asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {timelineId && timelineRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl flex flex-col p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-black">{timelineRecord.name}</h2>
                <p className="text-sm text-muted-foreground">Assignment Timeline</p>
              </div>
              <button onClick={() => setTimelineId(null)} className="p-2 hover:bg-muted rounded-full text-muted-foreground"><XCircle className="w-5 h-5" /></button>
            </div>

            <div className="relative pl-6 border-l-2 border-border space-y-6">
              <div className="relative">
                <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-emerald-500 border-4 border-card"></div>
                <p className="text-sm font-bold">Assigned to Engineering Dept</p>
                <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-amber-500 border-4 border-card"></div>
                <p className="text-sm font-bold">Under Maintenance</p>
                <p className="text-xs text-muted-foreground">2 months ago</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-blue-500 border-4 border-card"></div>
                <p className="text-sm font-bold">Purchased</p>
                <p className="text-xs text-muted-foreground">{timelineRecord.purchase_date || 'Unknown'}</p>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
