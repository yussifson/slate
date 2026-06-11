import React, { useState, useEffect } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { AlertCircle, User, Calendar, Pill, ShieldAlert, Plus, AlertTriangle } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

const UnivAllergyList = () => {
  const companyId = useCompanyId();

  const [allergies, setAllergies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    patient_name: '',
    allergen: '',
    reaction_severity: 'Mild',
    diagnosed_date: '',
    medications: '',
    notes: ''
  });

  useEffect(() => {
    fetchAllergies();
  }, []);

  const fetchAllergies = async () => {
    try {
      const { data, error } = await supabase.from('univ_allergylist').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
      if (error) throw error;
      setAllergies(data || []);
    } catch (error) {
      console.error('Error fetching allergies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('univ_allergylist').insert([{ ...formData, company_id: companyId }]);
      if (error) throw error;
      setFormData({
        patient_name: '',
        allergen: '',
        reaction_severity: 'Mild',
        diagnosed_date: '',
        medications: '',
        notes: ''
      });
      fetchAllergies();
    } catch (error) {
      console.error('Error adding allergy:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'severe': return 'bg-red-100 text-red-700 border-red-200';
      case 'moderate': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-amber-50/30 min-h-screen">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-slate-800 flex items-center justify-center gap-3">
          <AlertCircle className="w-10 h-10 text-red-500" />
          Allergy Registry
        </h1>
        <p className="text-slate-500 mt-2">Track patient allergies and reactions</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="md:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-red-500" /> Log Allergy
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                <input type="text" name="patient_name" value={formData.patient_name} onChange={handleChange} required className="w-full pl-10 p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Allergen</label>
              <input type="text" name="allergen" value={formData.allergen} onChange={handleChange} required className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
              <select name="reaction_severity" value={formData.reaction_severity} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none">
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosed Date</label>
              <input type="date" name="diagnosed_date" value={formData.diagnosed_date} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Medications/Treatment</label>
              <input type="text" name="medications" value={formData.medications} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none h-20"></textarea>
            </div>
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> Save Entry
            </button>
          </form>
        </motion.div>

        <div className="md:col-span-2 grid grid-cols-1 gap-4 content-start">
          {loading ? (
            <div className="text-center py-10"><AlertCircle className="w-8 h-8 text-red-500 animate-spin mx-auto" /></div>
          ) : allergies.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-500">No allergy records found.</div>
          ) : (
            allergies.map((record, index) => (
              <motion.div key={record.id || index} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow">
                <div className={`p-3 rounded-xl border flex-shrink-0 self-start ${getSeverityColor(record.reaction_severity)}`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-slate-800 truncate">{record.allergen}</h3>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getSeverityColor(record.reaction_severity)}`}>{record.reaction_severity}</span>
                  </div>
                  <div className="text-sm text-slate-600 mb-3"><User className="w-4 h-4 inline mr-1 text-slate-400" />{record.patient_name}</div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                    {record.diagnosed_date && <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> {record.diagnosed_date}</div>}
                    {record.medications && <div className="flex items-center gap-2"><Pill className="w-4 h-4 text-slate-400" /> {record.medications}</div>}
                  </div>
                  {record.notes && <p className="text-sm text-slate-600 mt-3 italic border-l-2 border-slate-300 pl-3">"{record.notes}"</p>}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UnivAllergyList;
