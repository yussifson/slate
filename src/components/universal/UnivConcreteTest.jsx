import React, { useState, useEffect } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { motion } from 'framer-motion';
import { Hammer, Plus, Edit2, Trash2, Save, X, RefreshCw } from 'lucide-react';

const UnivConcreteTest = () => {
  const companyId = useCompanyId();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({batch_id: '', slump_result: '', strength: '', test_date: ''});

  const tableName = 'univ_concretetests';

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
    setFormData({batch_id: '', slump_result: '', strength: '', test_date: ''});
    setIsEditing(false);
    setEditId(null);
    fetchData();
  };

  const handleEdit = (record) => {
    setFormData({batch_id: record.batch_id || '', slump_result: record.slump_result || '', strength: record.strength || '', test_date: record.test_date || ''});
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
    <div className="p-6 max-w-6xl mx-auto bg-slate-50 min-h-screen font-sans">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Hammer size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Concrete Testing</h1>
            <p className="text-slate-500 text-sm mt-1">Manage and track concrete testing records</p>
          </div>
        </div>
        <div className="flex items-center gap-2">

        <button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button
          onClick={() => { setIsEditing(true); setEditId(null); setFormData({batch_id: '', slump_result: '', strength: '', test_date: ''}); }}
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
          className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            {editId ? 'Edit Record' : 'Create New Record'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-600">Batch ID</label>
              <input
                type="text"
                name="batch_id"
                value={formData.batch_id}
                onChange={handleInputChange}
                className="p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter batch id"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-600">Slump Test (mm)</label>
              <input
                type="number"
                name="slump_result"
                value={formData.slump_result}
                onChange={handleInputChange}
                className="p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter slump test (mm)"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-600">Compressive Strength (MPa)</label>
              <input
                type="number"
                name="strength"
                value={formData.strength}
                onChange={handleInputChange}
                className="p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter compressive strength (mpa)"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-600">Test Date</label>
              <input
                type="date"
                name="test_date"
                value={formData.test_date}
                onChange={handleInputChange}
                className="p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter test date"
                required
              />
            </div>
            <div className="col-span-full flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => { setIsEditing(false); setEditId(null); setFormData({batch_id: '', slump_result: '', strength: '', test_date: ''}); }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-semibold text-slate-700">Recent Records</h3>
          <button onClick={fetchData} className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center">
            <RefreshCw size={32} className="animate-spin mb-3 text-blue-500" />
            <p>Loading data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <Hammer size={48} className="mb-4 text-slate-300 stroke-[1.5]" />
            <p className="text-lg">No records found</p>
            <p className="text-sm mt-1">Click 'New Record' to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Batch ID</th><th className="p-4 font-medium">Slump Test (mm)</th><th className="p-4 font-medium">Compressive Strength (MPa)</th><th className="p-4 font-medium">Test Date</th>
                  <th className="p-4 font-medium rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((record) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={record.id} 
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    
                    <td className="p-4 text-slate-700">{record.batch_id}</td>
                    <td className="p-4 text-slate-700">{record.slump_result}</td>
                    <td className="p-4 text-slate-700">{record.strength}</td>
                    <td className="p-4 text-slate-700">{record.test_date}</td>
                    <td className="p-4">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(record)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

export default UnivConcreteTest;
