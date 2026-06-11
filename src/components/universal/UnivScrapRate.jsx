import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { motion } from 'framer-motion';
import { Trash2, Plus, Edit2, Save, X, RefreshCw } from 'lucide-react';

const UnivScrapRate = () => {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({batch_number: '', defect_count: '', total_produced: '', scrap_pct: ''});

  const tableName = 'univ_scraprates';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: records, error } = await supabase.from(tableName).select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching data:', error);
    } else {
      setData(records || []);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      const { error } = await supabase.from(tableName).update({ ...formData, company_id: companyId }).eq('id', editId);
      if (error) console.error('Error updating:', error);
    } else {
      const { error } = await supabase.from(tableName).insert([{ ...formData, company_id: companyId }]);
      if (error) console.error('Error inserting:', error);
    }
    setFormData({batch_number: '', defect_count: '', total_produced: '', scrap_pct: ''});
    setIsEditing(false);
    setEditId(null);
    fetchData();
  };

  const handleEdit = (record) => {
    setFormData({batch_number: record.batch_number || '', defect_count: record.defect_count || '', total_produced: record.total_produced || '', scrap_pct: record.scrap_pct || ''});
    setEditId(record.id);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) console.error('Error deleting:', error);
    else fetchData();
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
    <div className="p-6 max-w-6xl mx-auto bg-background min-h-screen font-sans ${view !== 'Default' ? 'hide-default' : ''}">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8 bg-card p-6 rounded-2xl shadow-sm border border-border"
      >
        <div className="view-header flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Trash2 size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Scrap Rate Analysis</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage and track scrap rate analysis records</p>
          </div>
        </div>
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
          onClick={() => { setIsEditing(true); setEditId(null); setFormData({batch_number: '', defect_count: '', total_produced: '', scrap_pct: ''}); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>New Record</span>
        </button>
      </div>
      </motion.div>

      {isEditing && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 bg-card p-6 rounded-2xl shadow-sm border border-border"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {editId ? 'Edit Record' : 'Create New Record'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted-foreground">Batch Number</label>
              <input
                type="text"
                name="batch_number"
                value={formData.batch_number}
                onChange={handleInputChange}
                className="p-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter batch number"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted-foreground">Defect Count</label>
              <input
                type="number"
                name="defect_count"
                value={formData.defect_count}
                onChange={handleInputChange}
                className="p-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter defect count"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted-foreground">Total Produced</label>
              <input
                type="number"
                name="total_produced"
                value={formData.total_produced}
                onChange={handleInputChange}
                className="p-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter total produced"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted-foreground">Scrap %</label>
              <input
                type="number"
                name="scrap_pct"
                value={formData.scrap_pct}
                onChange={handleInputChange}
                className="p-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter scrap %"
                required
              />
            </div>
            <div className="col-span-full flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => { setIsEditing(false); setEditId(null); setFormData({batch_number: '', defect_count: '', total_produced: '', scrap_pct: ''}); }}
                className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
              >
                <X size={18} /> Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Save size={18} /> Save Record
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center bg-background/50">
          <h3 className="font-semibold text-foreground">Recent Records</h3>
          <button onClick={fetchData} className="text-muted-foreground hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
            <RefreshCw size={32} className="animate-spin mb-3 text-blue-500" />
            <p>Loading data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
            <Trash2 size={48} className="mb-4 text-slate-300 stroke-[1.5]" />
            <p className="text-lg">No records found</p>
            <p className="text-sm mt-1">Click 'New Record' to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background text-muted-foreground text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Batch Number</th><th className="p-4 font-medium">Defect Count</th><th className="p-4 font-medium">Total Produced</th><th className="p-4 font-medium">Scrap %</th>
                  <th className="p-4 font-medium rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((record) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={record.id} 
                    className="hover:bg-background/80 transition-colors group"
                  >
                    
                    <td className="p-4 text-foreground">{record.batch_number}</td>
                    <td className="p-4 text-foreground">{record.defect_count}</td>
                    <td className="p-4 text-foreground">{record.total_produced}</td>
                    <td className="p-4 text-foreground">{record.scrap_pct}</td>
                    <td className="p-4">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(record)}
                          className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnivScrapRate;
