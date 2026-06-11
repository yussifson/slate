import React, { useState, useEffect } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Save, RefreshCw, X, Plus, Activity } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

export default function UnivInKindDonation() {
  const companyId = useCompanyId();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    donor_name: '',
    item_description: '',
    estimated_value: '',
    date_received: '',
    condition: ''
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('univ_inkinddonation').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(50);
    if (!error && data) setItems(data);
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('univ_inkinddonation').insert([{ ...formData, company_id: companyId }]);
    if (!error) {
      setShowForm(false);
      setFormData({ donor_name: '', item_description: '', estimated_value: '', date_received: '', condition: '' });
      fetchItems();
    } else {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Activity className="text-blue-600" /> In-Kind Donation
        </h1>
        <div className="flex gap-2">
          <button onClick={fetchItems} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors shadow-md">
            <Plus size={20} /> Add New
          </button>
        </div>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8 relative">
          <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
          <h2 className="text-xl font-semibold mb-4 text-gray-700">New In-Kind Donation Entry</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1 capitalize">donor name</label>
              <input
                type="text"
                value={formData.donor_name}
                onChange={(e) => setFormData({ ...formData, donor_name: e.target.value })}
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={`Enter donor name`}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1 capitalize">item description</label>
              <input
                type="text"
                value={formData.item_description}
                onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={`Enter item description`}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1 capitalize">estimated value</label>
              <input
                type="number"
                value={formData.estimated_value}
                onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={`Enter estimated value`}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1 capitalize">date received</label>
              <input
                type="date"
                value={formData.date_received}
                onChange={(e) => setFormData({ ...formData, date_received: e.target.value })}
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={`Enter date received`}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1 capitalize">condition</label>
              <input
                type="text"
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={`Enter condition`}
              />
            </div>
          </div>
          <button onClick={handleSave} disabled={loading} className="mt-6 flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50">
            <Save size={20} /> Save Entry
          </button>
        </motion.div>
      )}

      <div className="grid gap-4">
        {items.map((item) => (
          <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">donor name</p>
                <p className="text-gray-800 font-medium">{item.donor_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">item description</p>
                <p className="text-gray-800 font-medium">{item.item_description || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">estimated value</p>
                <p className="text-gray-800 font-medium">{item.estimated_value || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">date received</p>
                <p className="text-gray-800 font-medium">{item.date_received || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">condition</p>
                <p className="text-gray-800 font-medium">{item.condition || '-'}</p>
              </div>
            </div>
          </motion.div>
        ))}
        {items.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p>No in-kind donation records found. Create one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
