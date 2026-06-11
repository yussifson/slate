import React, { useState, useEffect } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { BaggageClaim, AlertCircle, CheckCircle, Clock, Plane, User, Tag } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

const UnivLuggageClaim = () => {
  const companyId = useCompanyId();

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    passenger_name: '',
    flight_number: '',
    claim_tag: '',
    bag_type: '',
    status: 'Reported',
    reported_date: new Date().toISOString().slice(0, 10),
    resolution_date: ''
  });

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const { data, error } = await supabase.from('univ_luggageclaim').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
      if (error) throw error;
      setClaims(data || []);
    } catch (error) {
      console.error('Error fetching claims:', error);
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
      const { error } = await supabase.from('univ_luggageclaim').insert([{ ...formData, company_id: companyId }]);
      if (error) throw error;
      setFormData({
        passenger_name: '',
        flight_number: '',
        claim_tag: '',
        bag_type: '',
        status: 'Reported',
        reported_date: new Date().toISOString().slice(0, 10),
        resolution_date: ''
      });
      fetchClaims();
    } catch (error) {
      console.error('Error adding claim:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Resolved': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'In Progress': return <Clock className="w-5 h-5 text-blue-500" />;
      default: return <AlertCircle className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-slate-100 min-h-screen">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="bg-slate-800 p-4 rounded-xl text-white">
            <BaggageClaim className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Luggage Claim Desk</h1>
            <p className="text-slate-500 font-medium mt-1">Track and resolve lost baggage incidents</p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <h2 className="text-lg font-bold mb-5 text-slate-800 border-b pb-2">File New Claim</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Passenger Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input type="text" name="passenger_name" value={formData.passenger_name} onChange={handleChange} required className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Flight Number</label>
                <div className="relative">
                  <Plane className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input type="text" name="flight_number" value={formData.flight_number} onChange={handleChange} required className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none uppercase font-mono text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Claim Tag #</label>
                <div className="relative">
                  <Tag className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input type="text" name="claim_tag" value={formData.claim_tag} onChange={handleChange} required className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none font-mono text-sm" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Bag Description</label>
              <input type="text" name="bag_type" value={formData.bag_type} onChange={handleChange} placeholder="e.g. Large blue Samsonite roller" required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none font-medium">
                  <option value="Reported">Reported</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Report Date</label>
                <input type="date" name="reported_date" value={formData.reported_date} onChange={handleChange} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none text-sm" />
              </div>
            </div>
            <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg transition-colors mt-2">
              Submit Claim
            </button>
          </form>
        </motion.div>

        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex justify-center py-20"><BaggageClaim className="w-10 h-10 text-slate-400 animate-pulse" /></div>
          ) : claims.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 text-slate-500">No active claims.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {claims.map((claim, index) => (
                <motion.div key={claim.id || index} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-5 items-start">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex-shrink-0 w-24 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tag No.</p>
                    <p className="font-mono font-bold text-slate-800 text-sm truncate">{claim.claim_tag}</p>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-slate-800 truncate">{claim.passenger_name}</h3>
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                        {getStatusIcon(claim.status)}
                        <span className="text-xs font-bold text-slate-700">{claim.status}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-3">{claim.bag_type}</p>
                    
                    <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded"><Plane className="w-3 h-3"/> {claim.flight_number}</span>
                      <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Reported: {claim.reported_date}</span>
                      {claim.resolution_date && (
                        <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="w-3 h-3"/> Resolved: {claim.resolution_date}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnivLuggageClaim;
