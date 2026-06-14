import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId } from '@/hooks/useCompanyId';

import { supabase } from "@/api/supabaseClient";
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, Mic, FileText, BarChart2 } from 'lucide-react';

export default function UnivPressRelease() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    publish_date: '',
    distributor: '',
    status: 'Draft',
    views: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const __res = await powerSync.execute(`SELECT * FROM univ_pressrelease WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      const records = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
      const error = null;
    if (!error && records) setData(records);
    setLoading(false);
  };

  const handleSave = async () => {
    if (editingId) {
      await (async () => { const _p = { ...formData, id: crypto.randomUUID(), company_id: companyId }; const _k = Object.keys(_p); const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE univ_pressrelease SET ${_k.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._v, editingId]); })();
      const error = null; const data = [];
    } else {
      await (async () => {
        const _p = { ...formData, id: crypto.randomUUID(), company_id: companyId };
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _pl = _k.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO univ_pressrelease (${_k.join(', ')}) VALUES (${_pl})`, _v); return { error: null }; })();
    }
    setFormData({ title: '', publish_date: '', distributor: '', status: 'Draft', views: '' });
    setIsEditing(false);
    setEditingId(null);
    fetchData();
  };

  const handleEdit = (item) => {
    setFormData({
      title: item.title || '',
      publish_date: item.publish_date || '',
      distributor: item.distributor || '',
      status: item.status || 'Draft',
      views: item.views || ''
    });
    setEditingId(item.id);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    await powerSync.execute(`DELETE FROM univ_pressrelease WHERE id = ?`, [id]);
    fetchData();
  };

  
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
    <div className="p-6 max-w-6xl mx-auto bg-background min-h-screen ${view !== 'Default' ? 'hide-default' : ''}">
      <div className="view-header flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Mic className="text-rose-600 w-8 h-8" />
            Press Releases
          </h1>
          <p className="text-muted-foreground mt-2">Manage and track PR distribution and performance.</p>
        </div>
        {!isEditing && (
          <div className="flex items-center gap-2">

        
        
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg shadow hover:bg-rose-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Release
          </button>
      </div>
        )}
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card p-6 rounded-xl shadow-md border border-border mb-8"
          >
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              {editingId ? 'Edit Press Release' : 'Create Press Release'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-muted-foreground mb-1">Title / Headline</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Acme Corp Announces New Product Line"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-card"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Draft">Draft</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Published">Published</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Distributor</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  value={formData.distributor}
                  onChange={(e) => setFormData({ ...formData, distributor: e.target.value })}
                  placeholder="e.g. PR Newswire, BusinessWire"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Publish Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  value={formData.publish_date}
                  onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Total Views</label>
                <div className="relative">
                  <BarChart2 className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
                  <input
                    type="number"
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    value={formData.views}
                    onChange={(e) => setFormData({ ...formData, views: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingId(null);
                  setFormData({ title: '', publish_date: '', distributor: '', status: 'Draft', views: '' });
                }}
                className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-rose-600 text-white px-6 py-2 rounded-lg shadow hover:bg-rose-700 transition-colors"
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card p-5 rounded-xl shadow-sm border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow"
            >
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.status === 'Published' ? 'bg-green-100 text-green-800' : item.status === 'Scheduled' ? 'bg-amber-100 text-amber-800' : 'bg-muted text-foreground'}`}>
                    {item.status}
                  </span>
                  <span className="text-sm text-muted-foreground">{item.publish_date}</span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">{item.title || 'Untitled Release'}</h3>
                <div className="text-sm text-muted-foreground">Distributor: {item.distributor || 'N/A'}</div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-6 md:w-1/3">
                <div className="text-center">
                  <span className="block text-2xl font-black text-rose-600">{Number(item.views).toLocaleString() || 0}</span>
                  <span className="text-xs uppercase font-semibold text-muted-foreground">Views</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(item)} className="p-2 text-muted-foreground hover:text-rose-600 bg-background hover:bg-rose-50 rounded-lg transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-muted-foreground hover:text-red-600 bg-background hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {data.length === 0 && !isEditing && (
            <div className="py-12 text-center bg-card rounded-xl border border-dashed border-border">
              <Mic className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-muted-foreground">No press releases found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
