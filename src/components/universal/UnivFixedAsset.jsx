import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId } from '@/hooks/useCompanyId';
import { motion, AnimatePresence } from 'framer-motion';

import { supabase } from "@/api/supabaseClient";
import { Box, Plus, Trash2, Edit2, X, Check, Search, RefreshCw } from 'lucide-react';

export default function UnivFixedAsset() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    asset_name: '',
    purchase_price: '',
    depreciation: '',
    location: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const __res = await powerSync.execute(`SELECT * FROM univ_fixedassets WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      const fetchedData = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
      const error = null;
      
    if (error) {
      console.error('Error fetching univ_fixedassets:', error);
    } else {
      setData(fetchedData || []);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      const { error } = await supabase
        .from('univ_fixedassets')
        .update({ ...formData, company_id: companyId })
        .eq('id', editingId);
      if (error) console.error('Error updating:', error);
    } else {
      const { error } = await (async () => {
        const _p = { ...formData, id: crypto.randomUUID(), company_id: companyId };
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _pl = _k.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO univ_fixedassets (${_k.join(', ')}) VALUES (${_pl})`, _v);
      })();
      if (error) console.error('Error inserting:', error);
    }
    
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({     asset_name: '',
    purchase_price: '',
    depreciation: '',
    location: '' });
    fetchData();
  };

  const handleEdit = (record) => {
    setFormData({
      asset_name: record.asset_name || '',
      purchase_price: record.purchase_price || '',
      depreciation: record.depreciation || '',
      location: record.location || ''
    });
    setEditingId(record.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      await powerSync.execute(`DELETE FROM univ_fixedassets WHERE id = ?`, [id]);
      const error = null;
      if (error) console.error('Error deleting:', error);
      else fetchData();
    }
  };

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  
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
    <div className="p-6 max-w-7xl mx-auto text-foreground dark:text-slate-200 ${view !== 'Default' ? 'hide-default' : ''}">
      <div className="view-header flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <Box size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Fixed Asset Management</h1>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">Manage your fixed asset records efficiently</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-card dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
            />
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
            onClick={fetchData}
            className="p-2 bg-card dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg hover:bg-background dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => {
              setFormData({     asset_name: '',
    purchase_price: '',
    depreciation: '',
    location: '' });
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-blue-600/20"
          >
            <Plus size={18} />
            <span>Add New</span>
          </button>
      </div>
        </div>
      </div>

      <div className="bg-card dark:bg-slate-800 rounded-xl shadow-sm border border-border dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background dark:bg-slate-800/50 border-b border-border dark:border-slate-700">
                <th className="p-4 font-medium text-muted-foreground dark:text-muted-foreground">Asset Name</th>
                <th className="p-4 font-medium text-muted-foreground dark:text-muted-foreground">Purchase Price</th>
                <th className="p-4 font-medium text-muted-foreground dark:text-muted-foreground">Depreciation Rate</th>
                <th className="p-4 font-medium text-muted-foreground dark:text-muted-foreground">Location</th>
                <th className="p-4 font-medium text-muted-foreground dark:text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-muted-foreground">
                      <RefreshCw className="animate-spin mx-auto mb-2" />
                      Loading records...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-muted-foreground">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, idx) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={item.id}
                      className="border-b border-border dark:border-slate-700/50 hover:bg-background dark:hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="p-4">{item.asset_name}</td>
                      <td className="p-4">{item.purchase_price}</td>
                      <td className="p-4">{item.depreciation}</td>
                      <td className="p-4">{item.location}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEdit(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-border dark:border-slate-700"
            >
              <div className="flex items-center justify-between p-6 border-b border-border dark:border-slate-700">
                <h2 className="text-xl font-semibold">
                  {editingId ? 'Edit Record' : 'Add New Record'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-muted-foreground hover:text-muted-foreground hover:bg-muted dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-slate-300 mb-1">Asset Name</label>
                  <input 
                    type="text"
                    name="asset_name"
                    value={formData.asset_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-background dark:bg-slate-900/50 border border-border dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-slate-300 mb-1">Purchase Price</label>
                  <input 
                    type="number"
                    name="purchase_price"
                    value={formData.purchase_price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-background dark:bg-slate-900/50 border border-border dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-slate-300 mb-1">Depreciation Rate</label>
                  <input 
                    type="number"
                    name="depreciation"
                    value={formData.depreciation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-background dark:bg-slate-900/50 border border-border dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-slate-300 mb-1">Location</label>
                  <input 
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-background dark:bg-slate-900/50 border border-border dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-border dark:border-slate-700 text-muted-foreground dark:text-slate-300 rounded-lg hover:bg-background dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Check size={18} />
                    <span>{editingId ? 'Update' : 'Save'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
