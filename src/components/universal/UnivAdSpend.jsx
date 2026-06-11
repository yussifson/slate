import React, { useState, useEffect } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, TrendingUp, MousePointerClick, CheckCircle } from 'lucide-react';

export default function UnivAdSpend() {
  const companyId = useCompanyId();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    platform: 'Google',
    amount_spent: '',
    clicks: '',
    conversions: '',
    roas: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: records, error } = await supabase.from('univ_adspend').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    if (!error && records) setData(records);
    setLoading(false);
  };

  const handleSave = async () => {
    if (editingId) {
      await supabase.from('univ_adspend').update({ ...formData, company_id: companyId }).eq('id', editingId);
    } else {
      await supabase.from('univ_adspend').insert([{ ...formData, company_id: companyId }]);
    }
    setFormData({ platform: 'Google', amount_spent: '', clicks: '', conversions: '', roas: '' });
    setIsEditing(false);
    setEditingId(null);
    fetchData();
  };

  const handleEdit = (item) => {
    setFormData({
      platform: item.platform || 'Google',
      amount_spent: item.amount_spent || '',
      clicks: item.clicks || '',
      conversions: item.conversions || '',
      roas: item.roas || ''
    });
    setEditingId(item.id);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    await supabase.from('univ_adspend').delete().eq('id', id);
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
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <TrendingUp className="text-emerald-600 w-8 h-8" />
            Ad Spend & ROAS
          </h1>
          <p className="text-gray-500 mt-2">Track advertising expenditures and return on investment.</p>
        </div>
        {!isEditing && (
          <div className="flex items-center gap-2">

        <button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV
        </button>

        <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Log Spend
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
            className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              {editingId ? 'Edit Ad Spend Record' : 'Log Ad Spend'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Platform</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                >
                  <option value="Google">Google Ads</option>
                  <option value="Facebook">Facebook Ads</option>
                  <option value="LinkedIn">LinkedIn Ads</option>
                  <option value="Twitter">Twitter Ads</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Spend ($)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  value={formData.amount_spent}
                  onChange={(e) => setFormData({ ...formData, amount_spent: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Clicks</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  value={formData.clicks}
                  onChange={(e) => setFormData({ ...formData, clicks: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Conversions</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  value={formData.conversions}
                  onChange={(e) => setFormData({ ...formData, conversions: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">ROAS (x)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  value={formData.roas}
                  onChange={(e) => setFormData({ ...formData, roas: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingId(null);
                  setFormData({ platform: 'Google', amount_spent: '', clicks: '', conversions: '', roas: '' });
                }}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-lg shadow hover:bg-emerald-700 transition-colors"
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow relative"
            >
              <div className="absolute top-0 right-0 p-3 flex gap-2">
                <button onClick={() => handleEdit(item)} className="p-1.5 bg-white/80 text-gray-500 hover:text-emerald-600 rounded-full shadow-sm hover:bg-emerald-50 transition-colors">
                  <Edit2 className="w-3 h-3" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-white/80 text-gray-500 hover:text-red-600 rounded-full shadow-sm hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-xl text-gray-800 mb-4">{item.platform}</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Spend</span>
                    <span className="text-2xl font-bold text-gray-700">${Number(item.amount_spent).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col">
                      <span className="flex items-center gap-1 text-xs text-gray-500 mb-1"><MousePointerClick className="w-3 h-3"/> Clicks</span>
                      <span className="font-medium text-gray-800">{Number(item.clicks).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="flex items-center gap-1 text-xs text-gray-500 mb-1"><CheckCircle className="w-3 h-3"/> Conv.</span>
                      <span className="font-medium text-gray-800">{Number(item.conversions).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">ROAS</span>
                    <span className="text-lg font-bold text-emerald-600">{Number(item.roas).toFixed(2)}x</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {data.length === 0 && !isEditing && (
            <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No ad spend data available.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
