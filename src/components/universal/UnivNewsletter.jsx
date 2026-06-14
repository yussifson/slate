import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId } from '@/hooks/useCompanyId';

import { supabase } from "@/api/supabaseClient";
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, Mail, Users, Eye, Pointer } from 'lucide-react';

export default function UnivNewsletter() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    subject_line: '',
    send_date: '',
    recipient_count: '',
    open_rate: '',
    click_rate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const __res = await powerSync.execute(`SELECT * FROM univ_newsletter WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      const records = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
      const error = null;
    if (!error && records) setData(records);
    setLoading(false);
  };

  const handleSave = async () => {
    if (editingId) {
      await (async () => { const _p = { ...formData, id: crypto.randomUUID(), company_id: companyId }; const _k = Object.keys(_p); const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE univ_newsletter SET ${_k.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._v, editingId]); })();
      const error = null; const data = [];
    } else {
      await (async () => {
        const _p = { ...formData, id: crypto.randomUUID(), company_id: companyId };
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _pl = _k.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO univ_newsletter (${_k.join(', ')}) VALUES (${_pl})`, _v); return { error: null }; })();
    }
    setFormData({ subject_line: '', send_date: '', recipient_count: '', open_rate: '', click_rate: '' });
    setIsEditing(false);
    setEditingId(null);
    fetchData();
  };

  const handleEdit = (item) => {
    setFormData({
      subject_line: item.subject_line || '',
      send_date: item.send_date || '',
      recipient_count: item.recipient_count || '',
      open_rate: item.open_rate || '',
      click_rate: item.click_rate || ''
    });
    setEditingId(item.id);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    await powerSync.execute(`DELETE FROM univ_newsletter WHERE id = ?`, [id]);
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
    <div className="p-6 max-w-5xl mx-auto bg-background min-h-screen ${view !== 'Default' ? 'hide-default' : ''}">
      <div className="view-header flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Mail className="text-purple-600 w-8 h-8" />
            Newsletter Performance
          </h1>
          <p className="text-muted-foreground mt-2">Analyze engagement metrics for your campaigns.</p>
        </div>
        {!isEditing && (
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

        <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Newsletter
          </button>
      </div>
        )}
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-card p-6 rounded-xl shadow-md border border-border mb-8"
          >
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              {editingId ? 'Edit Newsletter' : 'Record Newsletter'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-muted-foreground mb-1">Subject Line</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  value={formData.subject_line}
                  onChange={(e) => setFormData({ ...formData, subject_line: e.target.value })}
                  placeholder="e.g. Exciting Updates for July!"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Send Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  value={formData.send_date}
                  onChange={(e) => setFormData({ ...formData, send_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Recipients</label>
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
                  <input
                    type="number"
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    value={formData.recipient_count}
                    onChange={(e) => setFormData({ ...formData, recipient_count: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Open Rate (%)</label>
                <div className="relative">
                  <Eye className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
                  <input
                    type="number"
                    step="0.1"
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    value={formData.open_rate}
                    onChange={(e) => setFormData({ ...formData, open_rate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Click Rate (%)</label>
                <div className="relative">
                  <Pointer className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
                  <input
                    type="number"
                    step="0.1"
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    value={formData.click_rate}
                    onChange={(e) => setFormData({ ...formData, click_rate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingId(null);
                  setFormData({ subject_line: '', send_date: '', recipient_count: '', open_rate: '', click_rate: '' });
                }}
                className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-lg shadow hover:bg-purple-700 transition-colors"
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="p-5 flex-grow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg text-foreground line-clamp-2" title={item.subject_line}>
                    "{item.subject_line || 'Untitled Newsletter'}"
                  </h3>
                  <div className="flex gap-2 shrink-0 ml-4">
                    <button onClick={() => handleEdit(item)} className="p-1 text-muted-foreground hover:text-purple-600 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1 text-muted-foreground hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mb-5">Sent: {item.send_date}</div>
                
                <div className="grid grid-cols-3 gap-4 text-center mt-auto">
                  <div className="bg-purple-50 rounded-lg p-3">
                    <span className="block text-xl font-bold text-purple-700">{Number(item.recipient_count).toLocaleString()}</span>
                    <span className="text-xs text-purple-600 font-medium uppercase">Recipients</span>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <span className="block text-xl font-bold text-blue-700">{item.open_rate}%</span>
                    <span className="text-xs text-blue-600 font-medium uppercase">Open Rate</span>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <span className="block text-xl font-bold text-emerald-700">{item.click_rate}%</span>
                    <span className="text-xs text-emerald-600 font-medium uppercase">Click Rate</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {data.length === 0 && !isEditing && (
            <div className="col-span-full py-12 text-center bg-card rounded-xl border border-dashed border-border">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground">No newsletter data available.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
