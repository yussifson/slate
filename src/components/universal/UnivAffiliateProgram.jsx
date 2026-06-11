import React, { useState, useEffect } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/api/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, Share2, Link, DollarSign, MousePointerClick } from 'lucide-react';

export default function UnivAffiliateProgram() {
  const companyId = useCompanyId();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    affiliate_name: '',
    tracking_link: '',
    click_count: '',
    conversion_count: '',
    payout_amount: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: records, error } = await supabase.from('univ_affiliateprogram').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    if (!error && records) setData(records);
    setLoading(false);
  };

  const handleSave = async () => {
    if (editingId) {
      await supabase.from('univ_affiliateprogram').update({ ...formData, company_id: companyId }).eq('id', editingId);
    } else {
      await supabase.from('univ_affiliateprogram').insert([{ ...formData, company_id: companyId }]);
    }
    setFormData({ affiliate_name: '', tracking_link: '', click_count: '', conversion_count: '', payout_amount: '' });
    setIsEditing(false);
    setEditingId(null);
    fetchData();
  };

  const handleEdit = (item) => {
    setFormData({
      affiliate_name: item.affiliate_name || '',
      tracking_link: item.tracking_link || '',
      click_count: item.click_count || '',
      conversion_count: item.conversion_count || '',
      payout_amount: item.payout_amount || ''
    });
    setEditingId(item.id);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    await supabase.from('univ_affiliateprogram').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Share2 className="text-indigo-500 w-8 h-8" />
            Affiliate Program
          </h1>
          <p className="text-slate-500 mt-2">Manage partners, track links, and monitor payouts.</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Affiliate
          </button>
        )}
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-6 rounded-xl shadow-md border border-slate-200 mb-8 overflow-hidden"
          >
            <h2 className="text-xl font-semibold mb-4 text-slate-700">
              {editingId ? 'Edit Affiliate' : 'New Affiliate Partner'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-1">Affiliate Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={formData.affiliate_name}
                  onChange={(e) => setFormData({ ...formData, affiliate_name: e.target.value })}
                  placeholder="e.g. Tech Blogger Pro"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Tracking Link</label>
                <div className="relative">
                  <Link className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={formData.tracking_link}
                    onChange={(e) => setFormData({ ...formData, tracking_link: e.target.value })}
                    placeholder="?ref=bloggerpro"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Clicks</label>
                <div className="relative">
                  <MousePointerClick className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={formData.click_count}
                    onChange={(e) => setFormData({ ...formData, click_count: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Conversions</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={formData.conversion_count}
                  onChange={(e) => setFormData({ ...formData, conversion_count: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Total Payout ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={formData.payout_amount}
                    onChange={(e) => setFormData({ ...formData, payout_amount: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingId(null);
                  setFormData({ affiliate_name: '', tracking_link: '', click_count: '', conversion_count: '', payout_amount: '' });
                }}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-indigo-500 text-white px-6 py-2 rounded-lg shadow hover:bg-indigo-600 transition-colors"
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-sm font-medium text-slate-600 uppercase tracking-wider">
                <th className="p-4">Affiliate Partner</th>
                <th className="p-4 text-center">Performance (Clicks / Conv)</th>
                <th className="p-4 text-right">Total Payout</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-800 text-base">{item.affiliate_name || 'Unnamed Affiliate'}</div>
                    <div className="text-sm text-indigo-500 font-mono flex items-center gap-1 mt-1">
                      <Link className="w-3 h-3" /> {item.tracking_link || 'No link setup'}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <span className="block font-bold text-slate-700">{Number(item.click_count).toLocaleString() || 0}</span>
                        <span className="text-[10px] text-slate-400 uppercase">Clicks</span>
                      </div>
                      <div className="text-slate-300">|</div>
                      <div className="text-center">
                        <span className="block font-bold text-emerald-600">{Number(item.conversion_count).toLocaleString() || 0}</span>
                        <span className="text-[10px] text-slate-400 uppercase">Conv.</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className="font-black text-slate-800 text-lg">
                      ${Number(item.payout_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-white shadow-sm border border-slate-100 rounded-md hover:bg-indigo-50 transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-rose-600 bg-white shadow-sm border border-slate-100 rounded-md hover:bg-rose-50 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && !isEditing && (
            <div className="py-16 text-center">
              <Share2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No active affiliate programs.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
