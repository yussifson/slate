import React, { useState, useEffect } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Save, RefreshCw, X, Plus, User } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

export default function UnivBeneficiaryList() {
  const companyId = useCompanyId();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    beneficiary_name: '',
    contact_info: '',
    needs: '',
    status: '',
    assigned_to: ''
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('univ_beneficiarylist').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(50);
    if (!error && data) setItems(data);
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('univ_beneficiarylist').insert([{ ...formData, company_id: companyId }]);
    if (!error) {
      setShowForm(false);
      setFormData({ beneficiary_name: '', contact_info: '', needs: '', status: '', assigned_to: '' });
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
          <User className="text-blue-600" /> Beneficiary List
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
          <h2 className="text-xl font-semibold mb-4 text-gray-700">New Beneficiary List Entry</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1 capitalize">beneficiary name</label>
              <input
                type="text"
                value={formData.beneficiary_name}
                onChange={(e) => setFormData({ ...formData, beneficiary_name: e.target.value })}
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={`Enter beneficiary name`}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1 capitalize">contact info</label>
              <input
                type="text"
                value={formData.contact_info}
                onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={`Enter contact info`}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1 capitalize">needs</label>
              <input
                type="text"
                value={formData.needs}
                onChange={(e) => setFormData({ ...formData, needs: e.target.value })}
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={`Enter needs`}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1 capitalize">status</label>
              <input
                type="text"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={`Enter status`}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1 capitalize">assigned to</label>
              <input
                type="text"
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={`Enter assigned to`}
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
                <p className="text-xs text-gray-500 uppercase font-semibold">beneficiary name</p>
                <p className="text-gray-800 font-medium">{item.beneficiary_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">contact info</p>
                <p className="text-gray-800 font-medium">{item.contact_info || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">needs</p>
                <p className="text-gray-800 font-medium">{item.needs || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">status</p>
                <p className="text-gray-800 font-medium">{item.status || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">assigned to</p>
                <p className="text-gray-800 font-medium">{item.assigned_to || '-'}</p>
              </div>
            </div>
          </motion.div>
        ))}
        {items.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p>No beneficiary list records found. Create one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
