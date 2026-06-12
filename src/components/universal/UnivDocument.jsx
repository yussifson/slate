import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { FolderOpen, Plus, Search, Trash2, Edit2, Loader2, XCircle, FileText, Download, Eye, UploadCloud } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';

const EMPTY_FORM = { name: '', type: 'Document', description: '', file_url: '', status: 'Active', tags: '' };
const TYPE_ICONS = { Document: '📄', Spreadsheet: '📊', Image: '🖼️', PDF: '📋', Contract: '📝', Report: '📈', Other: '📁' };
const STATUS_COLORS = { Active: 'bg-emerald-50 text-emerald-700 border-emerald-200', Archived: 'bg-muted text-muted-foreground border-border', Draft: 'bg-amber-50 text-amber-700 border-amber-200' };

export default function UnivDocument() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setUploading(true);
    setUploadProgress(0);
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 20;
      });
    }, 200);
    setTimeout(() => {
      clearInterval(interval);
      setUploading(false);
      setForm({ ...form, name: file.name || form.name, file_url: URL.createObjectURL(file) });
      toast.success('File attached successfully (mock)');
    }, 1500);
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  useEffect(() => {
    if (companyId) {
      fetchDocs();
      const ch = supabase.channel('docs_ch').on('postgres_changes', { event: '*', schema: 'public', table: 'univ_documents', filter: `company_id=eq.${companyId}` }, fetchDocs).subscribe();
      return () => supabase.removeChannel(ch);
    }
  }, [companyId]);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const __res = await powerSync.execute(`SELECT * FROM univ_documents WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
      const error = null;
      if (error && error.code !== '42P01') throw error;
      setRecords(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await (async () => { const _p = form; const _k = Object.keys(_p); const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE ${univ_documents} SET ${_k.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._v, editingId]); })();
      const error = null; const data = [];
        if (error) throw error;
        toast.success('Document updated!');
      } else {
        const { error } = await (async () => {
        const _p = { ...form, company_id: companyId };
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _pl = _k.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO univ_documents (${_k.join(', ')}) VALUES (${_pl})`, _v);
      })();
        if (error) throw error;
        toast.success('Document added!');
      }
      closeModal(); fetchDocs();
    } catch (err) { toast.error('Failed to save'); }
  };

  const remove = async (id) => {
    await powerSync.execute(`DELETE FROM univ_documents WHERE id = ?`, [id]);
      const error = null;
    if (error) toast.error('Failed to delete'); else { toast.success('Deleted'); fetchDocs(); }
  };

  const openModal = (r = null) => { setForm(r ? { ...r } : EMPTY_FORM); setEditingId(r?.id || null); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };
  const filtered = records.filter(r => {
    const match = `${r.name} ${r.description} ${r.tags}`.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'All' || r.type === typeFilter;
    return match && matchType;
  });

  const types = ['All', ...Object.keys(TYPE_ICONS)];

  
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
        <div><h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2"><FolderOpen className="w-7 h-7 text-primary" />Document Drive</h1><p className="text-muted-foreground text-sm font-medium mt-1">{records.length} documents stored.</p></div>
        <div className="flex items-center gap-2">

        
        
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 shadow-sm"><Plus className="w-4 h-4" />Add Document</button>
      </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        {['Active','Draft','Archived'].map(s => <div key={s} className="bg-card border border-border p-4 rounded-2xl shadow-sm"><p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{s}</p><p className="text-2xl font-black text-foreground">{records.filter(r=>r.status===s).length}</p></div>)}
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm"><p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total</p><p className="text-2xl font-black text-foreground">{records.length}</p></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
        <div className="relative flex-1"><Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm shadow-sm" /></div>
        <div className="flex gap-2 overflow-x-auto shrink-0">
          {types.map(t => <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 h-11 rounded-xl text-sm font-bold border whitespace-nowrap transition-all ${typeFilter===t?'bg-primary text-white border-primary':'bg-card border-border text-muted-foreground hover:text-foreground'}`}>{t}</button>)}
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0 bg-card border border-border rounded-2xl shadow-sm flex flex-col custom-scrollbar">
        <div className="grid grid-cols-12 gap-2 p-4 border-b border-border bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
          <div className="col-span-5">Document</div><div className="col-span-2">Type</div><div className="col-span-2">Status</div><div className="col-span-1">Tags</div><div className="col-span-2 text-right">Actions</div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          : filtered.length === 0 ? <div className="p-12 text-center text-muted-foreground"><FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" /><p className="font-medium">No documents found.</p></div>
          : filtered.map(r => (
            <div key={r.id} className="grid grid-cols-12 gap-2 p-4 border-b border-border hover:bg-muted/30 transition-colors items-center group">
              <div className="col-span-5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center text-lg shrink-0">{TYPE_ICONS[r.type]||'📁'}</div>
                <div><p className="font-bold text-sm text-foreground">{r.name}</p><p className="text-xs text-muted-foreground truncate max-w-[200px]">{r.description||'—'}</p></div>
              </div>
              <div className="col-span-2 text-sm text-muted-foreground">{r.type}</div>
              <div className="col-span-2"><span className={`px-2 py-0.5 text-[10px] font-bold uppercase border rounded-md ${STATUS_COLORS[r.status]||'bg-muted border-border'}`}>{r.status}</span></div>
              <div className="col-span-1 text-xs text-muted-foreground truncate">{r.tags||'—'}</div>
              <div className="col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {r.file_url && <a href={r.file_url} target="_blank" rel="noreferrer" className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary"><Eye className="w-3.5 h-3.5" /></a>}
                <button onClick={() => openModal(r)} className="p-1.5 bg-muted rounded-md text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove(r.id)} className="p-1.5 bg-red-50 rounded-md text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex justify-between items-center shrink-0"><h2 className="text-xl font-black">{editingId?'Edit Document':'Add Document'}</h2><button onClick={closeModal} className="p-2 bg-muted rounded-full text-muted-foreground"><XCircle className="w-5 h-5" /></button></div>
            <form onSubmit={save} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Document Name *</label><input required type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Type</label><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">{Object.keys(TYPE_ICONS).map(t=><option key={t}>{t}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">{Object.keys(STATUS_COLORS).map(s=><option key={s}>{s}</option>)}</select></div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">File Upload</label>
                  <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                    <input {...getInputProps()} />
                    <UploadCloud className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    {uploading ? (
                      <div className="w-full max-w-xs mx-auto">
                        <div className="flex justify-between text-xs mb-1"><span>Uploading...</span><span>{uploadProgress}%</span></div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary transition-all duration-200" style={{width: `${uploadProgress}%`}}></div></div>
                      </div>
                    ) : form.file_url ? (
                      <p className="text-sm font-bold text-emerald-600">File attached! Click or drag to replace.</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Drag & drop a file here, or click to select</p>
                    )}
                  </div>
                </div>

                <div className="col-span-2"><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">File URL (Manual Override)</label><input type="url" value={form.file_url} onChange={e=>setForm({...form,file_url:e.target.value})} placeholder="https://..." className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
                <div className="col-span-2"><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Description</label><textarea rows="2" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm resize-none"/></div>
                <div className="col-span-2"><label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Tags (comma-separated)</label><input type="text" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} placeholder="legal, 2024, contract..." className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm"/></div>
              </div>
              <div className="flex justify-end gap-3 mt-5 pt-5 border-t border-border"><button type="button" onClick={closeModal} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button><button type="submit" className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm">{editingId?'Update':'Add Document'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
