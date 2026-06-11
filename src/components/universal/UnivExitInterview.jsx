import React, { useState, useEffect } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Save, RefreshCw, X, Plus, FileText } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

export default function UnivExitInterview() {
  const companyId = useCompanyId();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employee_name: '',
    departure_date: '',
    reason: '',
    feedback: '',
    interviewer: ''
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('univ_exitinterview').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(50);
    if (!error && data) setItems(data);
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('univ_exitinterview').insert([{ ...formData, company_id: companyId }]);
    if (!error) {
      setShowForm(false);
      setFormData({ employee_name: '', departure_date: '', reason: '', feedback: '', interviewer: '' });
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
          <FileText className="text-blue-600" /> Exit Interview
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
          <h2 className="text-xl font-semibold mb-4 text-gray-700">New Exit Interview Entry</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1 capitalize">employee name</label>
              <input
                type="text"
                value={formData.employee_name}
                onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={`Enter employee name`}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1 capitalize">departure date</label>
              <input
                type="date"
                value={formData.departure_date}
                onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={`Enter departure date`}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1 capitalize">reason</label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={`Enter reason`}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1 capitalize">feedback</label>
              <input
                type="text"
                value={formData.feedback}
                onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={`Enter feedback`}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1 capitalize">interviewer</label>
              <input
                type="text"
                value={formData.interviewer}
                onChange={(e) => setFormData({ ...formData, interviewer: e.target.value })}
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={`Enter interviewer`}
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
                <p className="text-xs text-gray-500 uppercase font-semibold">employee name</p>
                <p className="text-gray-800 font-medium">{item.employee_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">departure date</p>
                <p className="text-gray-800 font-medium">{item.departure_date || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">reason</p>
                <p className="text-gray-800 font-medium">{item.reason || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">feedback</p>
                <p className="text-gray-800 font-medium">{item.feedback || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">interviewer</p>
                <p className="text-gray-800 font-medium">{item.interviewer || '-'}</p>
              </div>
            </div>
          </motion.div>
        ))}
        {items.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p>No exit interview records found. Create one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
