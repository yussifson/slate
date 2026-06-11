import React, { useState, useEffect } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, Mic, FileText, BarChart2 } from 'lucide-react';

export default function UnivPressRelease() {
  const companyId = useCompanyId();

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
    const { data: records, error } = await supabase.from('univ_pressrelease').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    if (!error && records) setData(records);
    setLoading(false);
  };

  const handleSave = async () => {
    if (editingId) {
      await supabase.from('univ_pressrelease').update({ ...formData, company_id: companyId }).eq('id', editingId);
    } else {
      await supabase.from('univ_pressrelease').insert([{ ...formData, company_id: companyId }]);
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
    await supabase.from('univ_pressrelease').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Mic className="text-rose-600 w-8 h-8" />
            Press Releases
          </h1>
          <p className="text-slate-500 mt-2">Manage and track PR distribution and performance.</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg shadow hover:bg-rose-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Release
          </button>
        )}
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-6 rounded-xl shadow-md border border-slate-200 mb-8"
          >
            <h2 className="text-xl font-semibold mb-4 text-slate-700">
              {editingId ? 'Edit Press Release' : 'Create Press Release'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-1">Title / Headline</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
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
                <label className="block text-sm font-medium text-slate-600 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Draft">Draft</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Published">Published</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Distributor</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  value={formData.distributor}
                  onChange={(e) => setFormData({ ...formData, distributor: e.target.value })}
                  placeholder="e.g. PR Newswire, BusinessWire"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Publish Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  value={formData.publish_date}
                  onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Total Views</label>
                <div className="relative">
                  <BarChart2 className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
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
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
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
              className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow"
            >
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.status === 'Published' ? 'bg-green-100 text-green-800' : item.status === 'Scheduled' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>
                    {item.status}
                  </span>
                  <span className="text-sm text-slate-500">{item.publish_date}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">{item.title || 'Untitled Release'}</h3>
                <div className="text-sm text-slate-600">Distributor: {item.distributor || 'N/A'}</div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-6 md:w-1/3">
                <div className="text-center">
                  <span className="block text-2xl font-black text-rose-600">{Number(item.views).toLocaleString() || 0}</span>
                  <span className="text-xs uppercase font-semibold text-slate-400">Views</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {data.length === 0 && !isEditing && (
            <div className="py-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
              <Mic className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No press releases found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
