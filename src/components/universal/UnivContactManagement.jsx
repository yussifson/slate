import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Users, Plus, Search, Trash2, Edit2, Loader2, XCircle, Mail, Phone, Building2, LayoutGrid, List } from 'lucide-react';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = { name: '', email: '', phone: '', company: '', type: 'Client', address: '', notes: '' };
const TYPE_COLORS = { Client: 'bg-blue-50 text-blue-700 border-blue-200', Vendor: 'bg-violet-50 text-violet-700 border-violet-200', Partner: 'bg-emerald-50 text-emerald-700 border-emerald-200', Other: 'bg-muted text-muted-foreground border-border' };

export default function UnivContactManagement() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (companyId) {
      fetch();
      const ch = supabase.channel('contacts_ch').on('postgres_changes', { event: '*', schema: 'public', table: 'univ_contacts', filter: `company_id=eq.${companyId}` }, fetch).subscribe();
      return () => supabase.removeChannel(ch);
    }
  }, [companyId]);

  const fetch = async () => {
    setLoading(true);
    try {
      const __res = await powerSync.execute(`SELECT * FROM univ_contacts WHERE company_id = ?`, [companyId]);
      const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
      const error = null;
      if (error && error.code !== '42P01') throw error;
      setRecords((data || []).map(r => ({
        ...r,
        name: `${r.first_name} ${r.last_name}`.trim(),
        company: r.organization
      })).sort((a,b) => a.name.localeCompare(b.name)));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await (async () => {
          const _p = {
            first_name: form.name.split(' ')[0] || '',
            last_name: form.name.split(' ').slice(1).join(' ') || '',
            email: form.email,
            phone: form.phone,
            organization: form.company,
            type: form.type,
            notes: form.notes
          };
          const _k = Object.keys(_p);
          const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
          await powerSync.execute(`UPDATE univ_contacts SET ${_k.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._v, editingId]);
        })();
        const error = null;
        if (error) throw error;
        toast.success('Contact updated!');
      } else {
        await (async () => {
          const _p = {
            id: crypto.randomUUID(),
            company_id: companyId,
            first_name: form.name.split(' ')[0] || '',
            last_name: form.name.split(' ').slice(1).join(' ') || '',
            email: form.email,
            phone: form.phone,
            organization: form.company,
            type: form.type,
            notes: form.notes
          };
          const _k = Object.keys(_p);
          const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
          await powerSync.execute(`INSERT INTO univ_contacts (${_k.join(',')}) VALUES (${_k.map(()=>'?').join(',')})`, _v);
        })();
        const error = null;
        if (error) throw error;
        toast.success('Contact added!');
      }
      closeModal(); fetch();
    } catch (err) { console.error(err); toast.error(err.message || 'Failed to save contact'); }
  };

  const remove = async (id) => {
    await powerSync.execute(`DELETE FROM univ_contacts WHERE id = ?`, [id]);
    const error = null;
    if (error) toast.error('Failed to delete'); else { toast.success('Deleted'); setSelected(null); }
  };

  const openModal = (r = null) => { setForm(r ? { ...r } : EMPTY_FORM); setEditingId(r?.id || null); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };
  const filtered = records.filter(r => `${r.name} ${r.email} ${r.company} ${r.type}`.toLowerCase().includes(search.toLowerCase()));
  const gradients = ['from-violet-500 to-purple-600', 'from-cyan-500 to-blue-600', 'from-emerald-500 to-teal-600', 'from-orange-500 to-amber-600', 'from-pink-500 to-rose-600'];
  const grad = (n) => gradients[(n || '?').charCodeAt(0) % gradients.length];

  
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
        <div><h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2"><Users className="w-7 h-7 text-primary" />Contact Management</h1><p className="text-muted-foreground text-sm font-medium mt-1">{records.length} contacts — clients, vendors, partners.</p></div>
        <div className="flex items-center gap-2">

        
        <div className="flex bg-muted p-1 rounded-lg border border-border mr-2 hidden sm:flex">
          {["Default","Grid","Calendar","Dashboard"].map(v => (
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

        <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 shadow-sm"><Plus className="w-4 h-4" />Add Contact</button>
      </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        {['Client','Vendor','Partner','Other'].map(t => <div key={t} className="bg-card border border-border p-4 rounded-2xl shadow-sm"><p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{t}s</p><p className="text-2xl font-black text-foreground">{records.filter(r => r.type === t).length}</p></div>)}
      </div>

      <div className="flex gap-3 shrink-0">
        <div className="relative flex-1"><Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..." className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm shadow-sm" /></div>
        <div className="flex bg-card border border-border rounded-xl p-1 shadow-sm gap-1">
          <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-primary text-white' : 'text-muted-foreground'}`}><List className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted-foreground'}`}><LayoutGrid className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0 custom-scrollbar">
        {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
            {filtered.map(r => (
              <div key={r.id} onClick={() => setSelected(r)} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer">
                <div className="flex flex-col items-center text-center">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${grad(r.name)} flex items-center justify-center text-white text-xl font-black mb-3`}>{(r.name || '?').charAt(0).toUpperCase()}</div>
                  <h3 className="font-bold text-base text-foreground">{r.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.company || '—'}</p>
                  <span className={`mt-2 px-2 py-0.5 text-[10px] font-bold uppercase border rounded-md ${TYPE_COLORS[r.type] || 'bg-muted border-border text-muted-foreground'}`}>{r.type}</span>
                  <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); openModal(r); }} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary"><Edit2 className="w-3 h-3" /></button>
                    <button onClick={e => { e.stopPropagation(); remove(r.id); }} className="p-1.5 bg-red-50 rounded-md text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed border-border rounded-2xl"><Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" /><p className="font-medium">No contacts found.</p></div>}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border"><tr>{['Contact','Company','Type','Phone','Actions'].map(h => <th key={h} className="p-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-border">
                {filtered.map(r => (
                  <tr key={r.id} onClick={() => setSelected(r)} className="hover:bg-muted/30 transition-colors group cursor-pointer">
                    <td className="p-4"><div className="flex items-center gap-3"><div className={`w-9 h-9 rounded-full bg-gradient-to-br ${grad(r.name)} flex items-center justify-center text-white text-xs font-black shrink-0`}>{(r.name||'?').charAt(0).toUpperCase()}</div><div><p className="font-bold text-foreground">{r.name}</p><p className="text-xs text-muted-foreground">{r.email}</p></div></div></td>
                    <td className="p-4 text-muted-foreground">{r.company || '—'}</td>
                    <td className="p-4"><span className={`px-2 py-0.5 text-[10px] font-bold uppercase border rounded-md ${TYPE_COLORS[r.type]}`}>{r.type}</span></td>
                    <td className="p-4 text-muted-foreground">{r.phone || '—'}</td>
                    <td className="p-4"><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={e=>{e.stopPropagation();openModal(r);}} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button><button onClick={e=>{e.stopPropagation();remove(r.id);}} className="p-1.5 bg-red-50 rounded-md text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button></div></td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No contacts found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-card border-l border-border shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex justify-between items-center"><h3 className="font-black text-lg">Contact</h3><button onClick={() => setSelected(null)} className="p-1.5 bg-muted rounded-full"><XCircle className="w-4 h-4 text-muted-foreground" /></button></div>
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              <div className="flex flex-col items-center text-center mb-5">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${grad(selected.name)} flex items-center justify-center text-white text-2xl font-black mb-3`}>{(selected.name||'?').charAt(0).toUpperCase()}</div>
                <h3 className="font-black text-xl">{selected.name}</h3>
                <span className={`mt-2 px-3 py-1 text-[11px] font-bold uppercase border rounded-full ${TYPE_COLORS[selected.type]}`}>{selected.type}</span>
              </div>
              <div className="space-y-2">
                {[{icon:<Building2 className="w-4 h-4"/>,label:'Company',value:selected.company},{icon:<Mail className="w-4 h-4"/>,label:'Email',value:selected.email},{icon:<Phone className="w-4 h-4"/>,label:'Phone',value:selected.phone}].map((f,i)=>f.value?(<div key={i} className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl"><span className="text-primary shrink-0">{f.icon}</span><div><p className="text-[10px] font-bold text-muted-foreground uppercase">{f.label}</p><p className="text-sm font-medium">{f.value}</p></div></div>):null)}
                {selected.notes && <div className="p-3 bg-muted/40 rounded-xl"><p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Notes</p><p className="text-sm">{selected.notes}</p></div>}
              </div>
            </div>
            <div className="p-5 border-t border-border flex gap-2">
              <button onClick={()=>{openModal(selected);setSelected(null);}} className="flex-1 h-9 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1"><Edit2 className="w-3.5 h-3.5"/>Edit</button>
              <button onClick={()=>remove(selected.id)} className="flex-1 h-9 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold flex items-center justify-center gap-1 hover:bg-red-100"><Trash2 className="w-3.5 h-3.5"/>Delete</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex justify-between items-center shrink-0"><h2 className="text-xl font-black">{editingId?'Edit Contact':'Add Contact'}</h2><button onClick={closeModal} className="p-2 bg-muted rounded-full text-muted-foreground"><XCircle className="w-5 h-5" /></button></div>
            <form onSubmit={save} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Full Name *</label><input required type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Phone</label><input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Company</label><input type="text" value={form.company} onChange={e=>setForm({...form,company:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Type</label><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">{Object.keys(TYPE_COLORS).map(t=><option key={t}>{t}</option>)}</select></div>
                <div className="col-span-2"><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Notes</label><textarea rows="2" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm resize-none"/></div>
              </div>
              <div className="flex justify-end gap-3 mt-5 pt-5 border-t border-border">
                <button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm">{editingId?'Update':'Add Contact'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
