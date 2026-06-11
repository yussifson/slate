import React, { useState, useEffect } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, Search, Hash, Target, Link as LinkIcon } from 'lucide-react';

export default function UnivSeoKeyword() {
  const companyId = useCompanyId();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    keyword: '',
    search_volume: '',
    difficulty: '',
    current_rank: '',
    target_url: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: records, error } = await supabase.from('univ_seokeyword').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    if (!error && records) setData(records);
    setLoading(false);
  };

  const handleSave = async () => {
    if (editingId) {
      await supabase.from('univ_seokeyword').update({ ...formData, company_id: companyId }).eq('id', editingId);
    } else {
      await supabase.from('univ_seokeyword').insert([{ ...formData, company_id: companyId }]);
    }
    setFormData({ keyword: '', search_volume: '', difficulty: '', current_rank: '', target_url: '' });
    setIsEditing(false);
    setEditingId(null);
    fetchData();
  };

  const handleEdit = (item) => {
    setFormData({
      keyword: item.keyword || '',
      search_volume: item.search_volume || '',
      difficulty: item.difficulty || '',
      current_rank: item.current_rank || '',
      target_url: item.target_url || ''
    });
    setEditingId(item.id);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    await supabase.from('univ_seokeyword').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-stone-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-3">
            <Search className="text-teal-600 w-8 h-8" />
            SEO Keyword Tracker
          </h1>
          <p className="text-stone-500 mt-2">Monitor target keywords and search rankings.</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg shadow hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Keyword
          </button>
        )}
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-6 rounded-xl shadow-md border border-stone-200 mb-8"
          >
            <h2 className="text-xl font-semibold mb-4 text-stone-700">
              {editingId ? 'Edit Keyword' : 'Add New Keyword'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-stone-600 mb-1">Keyword</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-2.5 w-5 h-5 text-stone-400" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    value={formData.keyword}
                    onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                    placeholder="e.g. b2b marketing software"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">Search Volume</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  value={formData.search_volume}
                  onChange={(e) => setFormData({ ...formData, search_volume: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">Difficulty (0-100)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">Current Rank</label>
                <div className="relative">
                  <Target className="absolute left-3 top-2.5 w-5 h-5 text-stone-400" />
                  <input
                    type="number"
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    value={formData.current_rank}
                    onChange={(e) => setFormData({ ...formData, current_rank: e.target.value })}
                  />
                </div>
              </div>
              <div className="md:col-span-2 lg:col-span-5">
                <label className="block text-sm font-medium text-stone-600 mb-1">Target URL</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-2.5 w-5 h-5 text-stone-400" />
                  <input
                    type="url"
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    value={formData.target_url}
                    onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                    placeholder="https://yoursite.com/page"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingId(null);
                  setFormData({ keyword: '', search_volume: '', difficulty: '', current_rank: '', target_url: '' });
                }}
                className="flex items-center gap-2 px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-teal-600 text-white px-6 py-2 rounded-lg shadow hover:bg-teal-700 transition-colors"
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-sm font-medium text-stone-500">
                <th className="p-4">Keyword</th>
                <th className="p-4">Search Volume</th>
                <th className="p-4">Difficulty</th>
                <th className="p-4">Rank</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-stone-800">{item.keyword || '-'}</div>
                    <div className="text-xs text-stone-500 truncate max-w-[200px]" title={item.target_url}>{item.target_url}</div>
                  </td>
                  <td className="p-4 font-medium text-stone-700">
                    {Number(item.search_volume).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-stone-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.difficulty > 70 ? 'bg-red-500' : item.difficulty > 30 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${item.difficulty || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-stone-600">{item.difficulty}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold text-sm">
                      {item.current_rank || '-'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-stone-400 hover:text-teal-600 rounded-md hover:bg-teal-50 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-stone-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && !isEditing && (
            <div className="py-12 text-center">
              <Search className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500">No SEO keywords tracked.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
