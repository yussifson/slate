import React, { useState, useEffect } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, Image as ImageIcon, Type, File, UploadCloud, Link } from 'lucide-react';

export default function UnivBrandAsset() {
  const companyId = useCompanyId();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    asset_name: '',
    asset_type: 'Logo',
    file_url: '',
    uploaded_by: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: records, error } = await supabase.from('univ_brandasset').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    if (!error && records) setData(records);
    setLoading(false);
  };

  const handleSave = async () => {
    if (editingId) {
      await supabase.from('univ_brandasset').update({ ...formData, company_id: companyId }).eq('id', editingId);
    } else {
      await supabase.from('univ_brandasset').insert([{ ...formData, company_id: companyId }]);
    }
    setFormData({ asset_name: '', asset_type: 'Logo', file_url: '', uploaded_by: '' });
    setIsEditing(false);
    setEditingId(null);
    fetchData();
  };

  const handleEdit = (item) => {
    setFormData({
      asset_name: item.asset_name || '',
      asset_type: item.asset_type || 'Logo',
      file_url: item.file_url || '',
      uploaded_by: item.uploaded_by || ''
    });
    setEditingId(item.id);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    await supabase.from('univ_brandasset').delete().eq('id', id);
    fetchData();
  };

  const getAssetIcon = (type) => {
    switch (type) {
      case 'Logo': return <ImageIcon className="w-8 h-8 text-blue-500" />;
      case 'Font': return <Type className="w-8 h-8 text-orange-500" />;
      case 'Guidelines': return <File className="w-8 h-8 text-purple-500" />;
      default: return <ImageIcon className="w-8 h-8 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <UploadCloud className="text-pink-600 w-8 h-8" />
            Brand Assets
          </h1>
          <p className="text-gray-500 mt-2">Centralized hub for logos, fonts, and brand guidelines.</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg shadow hover:bg-pink-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Asset
          </button>
        )}
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              {editingId ? 'Edit Asset' : 'Upload New Asset'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Asset Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  value={formData.asset_name}
                  onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                  placeholder="e.g. Primary Logo (Dark Mode)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Asset Type</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none bg-white"
                  value={formData.asset_type}
                  onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                >
                  <option value="Logo">Logo / Image</option>
                  <option value="Font">Typography / Font</option>
                  <option value="Guidelines">Brand Guidelines</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">File URL</label>
                <div className="relative">
                  <Link className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                    value={formData.file_url}
                    onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Uploaded By</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  value={formData.uploaded_by}
                  onChange={(e) => setFormData({ ...formData, uploaded_by: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingId(null);
                  setFormData({ asset_name: '', asset_type: 'Logo', file_url: '', uploaded_by: '' });
                }}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-pink-600 text-white px-6 py-2 rounded-lg shadow hover:bg-pink-700 transition-colors"
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {data.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group"
            >
              <div className="h-32 bg-gray-50 border-b border-gray-100 flex items-center justify-center relative">
                {getAssetIcon(item.asset_type)}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg p-1 shadow-sm">
                  <button onClick={() => handleEdit(item)} className="p-1.5 text-gray-500 hover:text-pink-600 rounded-md hover:bg-pink-50 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-500 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">{item.asset_type}</span>
                <h3 className="font-semibold text-gray-800 line-clamp-1 mb-2" title={item.asset_name}>{item.asset_name || 'Unnamed Asset'}</h3>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-gray-500 truncate pr-2">By {item.uploaded_by || 'Unknown'}</span>
                  {item.file_url && (
                    <a href={item.file_url} target="_blank" rel="noreferrer" className="text-pink-600 hover:text-pink-800 text-xs font-medium flex items-center gap-1">
                      <Link className="w-3 h-3" /> View
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {data.length === 0 && !isEditing && (
            <div className="col-span-full py-16 text-center bg-white rounded-xl border border-dashed border-gray-300">
              <UploadCloud className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No brand assets uploaded.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
