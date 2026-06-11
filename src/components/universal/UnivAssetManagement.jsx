import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Monitor, Plus, Search, Trash2, Edit2, Loader2, XCircle, Package, Map as MapIcon, Wrench, History } from 'lucide-react';
import { toast } from 'react-hot-toast';

const STATUS_COLORS = { Active: 'bg-emerald-50 text-emerald-700 border-emerald-200', 'Under Maintenance': 'bg-amber-50 text-amber-700 border-amber-200', Retired: 'bg-muted text-muted-foreground border-border' };
const EMPTY_FORM = { name: '', category: 'Equipment', status: 'Active', purchase_date: new Date().toISOString().split('T')[0], purchase_value: 0, location: 'New York, USA' };

export default function UnivAssetManagement() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [maintenanceLogText, setMaintenanceLogText] = useState('');
  const [maintenanceLogs, setMaintenanceLogs] = useState({});
  const [form, setForm] = useState(EMPTY_FORM);

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
        purchase_value: Number(form.purchase_value) || 0,
        location: form.location || 'New York, USA'
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
        purchase_value: r.purchase_value || 0,
        location: r.location || 'New York, USA'
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
    <div className="h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8 ${view !== 'Default' ? 'hide-default' : ''}">
      <div className="view-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2"><Monitor className="w-7 h-7 text-primary" /> Asset Management</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Manage company equipment and physical assets.</p>
        </div>
        <div className="flex items-center gap-2">

        
        <div className="flex bg-muted p-1 rounded-lg border border-border mr-2 hidden sm:flex">
          {["Default","Grid","Kanban","Calendar","Dashboard"].map(v => (
            <button 
              key={v} 
              onClick={() => setView(v)} 
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === v ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {v}
            </button>
          ))}
        </div>
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"><Plus className="w-4 h-4" /> Add Asset</button>
      </div>
      </div>

      <div className="flex gap-3 shrink-0">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets..." className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm shadow-sm" />
        </div>
        <div className="flex bg-card border border-border rounded-xl p-1 shadow-sm gap-1 shrink-0">
          <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>List</button>
          <button onClick={() => setViewMode('map')} className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 ${viewMode === 'map' ? 'bg-primary text-white' : 'text-muted-foreground'}`}><MapIcon className="w-4 h-4" />Map View</button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-0">
        {viewMode === 'list' ? (
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
              <tr>
                {['Name', 'Category', 'Value', 'Purchase Date', 'Status', 'Actions'].map((h, i) => (
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
                  return (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => setSelectedAsset(r)}>
                    <td className="p-4"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold"><Package className="w-4 h-4" /></div><span className="font-bold text-foreground">{r.name}</span></div></td>
                    <td className="p-4 text-muted-foreground">{r.category}</td>
                    <td className="p-4 font-black">${Number(r.purchase_value).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td className="p-4 text-muted-foreground whitespace-nowrap">{r.purchase_date || '—'}</td>
                    <td className="p-4" onClick={e=>e.stopPropagation()}>
                      <select value={r.status} onChange={(e) => updateStatus(r.id, e.target.value)} className={`px-3 py-1 rounded-full text-xs font-bold border outline-none cursor-pointer ${STATUS_COLORS[r.status] || 'bg-muted text-muted-foreground'}`}>
                        {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="p-4" onClick={e=>e.stopPropagation()}>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
        ) : (
          <div className="flex-1 w-full h-full p-2 relative">
             <div className="absolute top-4 left-4 z-10 bg-card p-3 rounded-xl border border-border shadow-md max-w-xs">
               <h3 className="font-bold text-sm mb-2"><MapIcon className="w-4 h-4 inline-block mr-1"/>Asset Map Overview</h3>
               <p className="text-xs text-muted-foreground mb-3">Showing {filtered.length} locations across your organization.</p>
               <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                 {filtered.map(r=>(
                   <div key={r.id} className="text-xs border-b border-border pb-1 flex justify-between">
                     <span className="font-medium truncate mr-2">{r.name}</span>
                     <span className="text-muted-foreground truncate max-w-[100px]">{r.location || 'New York'}</span>
                   </div>
                 ))}
               </div>
             </div>
             <iframe width="100%" height="100%" src="https://maps.google.com/maps?q=New%20York&t=&z=13&ie=UTF8&iwloc=&output=embed" frameBorder="0" scrolling="no" className="rounded-xl border border-border"></iframe>
          </div>
        )}
      </div>

      {selectedAsset && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedAsset(null)}>
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-card border-l border-border shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/30">
              <div>
                <h3 className="font-black text-lg">{selectedAsset.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[selectedAsset.status] || 'bg-muted'}`}>{selectedAsset.status}</span>
              </div>
              <button onClick={() => setSelectedAsset(null)} className="p-1.5 bg-muted rounded-full"><XCircle className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            
            <div className="p-5 border-b border-border grid grid-cols-2 gap-4">
              <div><p className="text-[10px] uppercase font-bold text-muted-foreground">Category</p><p className="font-medium text-sm">{selectedAsset.category}</p></div>
              <div><p className="text-[10px] uppercase font-bold text-muted-foreground">Location</p><p className="font-medium text-sm">{selectedAsset.location || 'New York, USA'}</p></div>
              <div><p className="text-[10px] uppercase font-bold text-muted-foreground">Purchase Date</p><p className="font-medium text-sm">{selectedAsset.purchase_date}</p></div>
              <div><p className="text-[10px] uppercase font-bold text-muted-foreground">Value</p><p className="font-medium text-sm">${Number(selectedAsset.purchase_value).toLocaleString()}</p></div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-muted/10">
              <h4 className="font-bold text-sm flex items-center gap-2 mb-4 text-foreground"><History className="w-4 h-4"/> Maintenance Logs</h4>
              <div className="space-y-3">
                {(maintenanceLogs[selectedAsset.id] || []).map((log, i) => (
                  <div key={i} className="p-3 bg-card border border-border rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1"><Wrench className="w-3 h-3 text-primary"/>{log.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{log.text}</p>
                  </div>
                ))}
                {!(maintenanceLogs[selectedAsset.id]?.length) && <p className="text-xs text-muted-foreground italic text-center py-4">No maintenance logs found.</p>}
              </div>
            </div>
            <div className="p-4 border-t border-border bg-card">
              <textarea 
                value={maintenanceLogText} 
                onChange={(e) => setMaintenanceLogText(e.target.value)} 
                placeholder="Add new maintenance log..." 
                className="w-full h-20 p-3 bg-muted border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none resize-none mb-2"
              />
              <button 
                onClick={() => {
                  if(!maintenanceLogText.trim()) return;
                  const newLog = { date: new Date().toLocaleDateString(), text: maintenanceLogText };
                  setMaintenanceLogs(prev => ({
                    ...prev,
                    [selectedAsset.id]: [newLog, ...(prev[selectedAsset.id]||[])]
                  }));
                  setMaintenanceLogText('');
                }}
                className="w-full h-9 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                Add Log Entry
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Location</label><input type="text" value={form.location || ''} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g. New York, USA" className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" /></div>
              
              <div className="flex justify-end gap-3 mt-2 pt-5 border-t border-border">
                <button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors">Cancel</button>
                <button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors">{editingId ? 'Update' : 'Save Asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
