import React, { useState, useEffect } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Package, Truck, MapPin, Scale, Barcode, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

const UnivPalletTracker = () => {
  const companyId = useCompanyId();

  const [pallets, setPallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    pallet_id: '',
    contents: '',
    weight: '',
    origin: '',
    destination: '',
    current_location: '',
    status: 'In Transit'
  });

  useEffect(() => {
    fetchPallets();
  }, []);

  const fetchPallets = async () => {
    try {
      const { data, error } = await supabase.from('univ_pallettracker').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
      if (error) throw error;
      setPallets(data || []);
    } catch (error) {
      console.error('Error fetching pallets:', error);
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
      const { error } = await supabase.from('univ_pallettracker').insert([{ ...formData, company_id: companyId }]);
      if (error) throw error;
      setFormData({
        pallet_id: '',
        contents: '',
        weight: '',
        origin: '',
        destination: '',
        current_location: '',
        status: 'In Transit'
      });
      fetchPallets();
    } catch (error) {
      console.error('Error adding pallet:', error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered': return 'bg-emerald-500 text-white';
      case 'Delayed': return 'bg-red-500 text-white';
      case 'Processing': return 'bg-amber-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-slate-900 min-h-screen text-slate-200">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase tracking-wider">
            <Package className="w-10 h-10 text-emerald-400" />
            Logistics Nexus
          </h1>
          <p className="text-slate-400 mt-1 font-mono text-sm">Pallet Tracking & Routing System</p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-12 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-4 bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit">
          <h2 className="text-lg font-bold mb-6 text-white uppercase tracking-wider flex items-center gap-2"><Barcode className="w-5 h-5 text-emerald-400" /> Register Pallet</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Pallet ID</label>
              <input type="text" name="pallet_id" value={formData.pallet_id} onChange={handleChange} required className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-emerald-400 font-mono uppercase" placeholder="PLT-XXXX" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Contents Description</label>
              <input type="text" name="contents" value={formData.contents} onChange={handleChange} required className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded focus:ring-1 focus:ring-emerald-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Weight (kg)</label>
                <div className="relative">
                  <Scale className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input type="number" step="0.1" name="weight" value={formData.weight} onChange={handleChange} required className="w-full pl-9 p-2.5 bg-slate-900 border border-slate-700 rounded focus:ring-1 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-sm">
                  <option value="Processing">Processing</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Origin</label>
                <input type="text" name="origin" value={formData.origin} onChange={handleChange} required className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Destination</label>
                <input type="text" name="destination" value={formData.destination} onChange={handleChange} required className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Current Location</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input type="text" name="current_location" value={formData.current_location} onChange={handleChange} required className="w-full pl-9 p-2.5 bg-slate-900 border border-slate-700 rounded focus:ring-1 focus:ring-emerald-500 outline-none" />
              </div>
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded uppercase tracking-wider text-sm transition-colors mt-2">
              Log Pallet
            </button>
          </form>
        </motion.div>

        <div className="lg:col-span-8">
          {loading ? (
            <div className="flex justify-center py-20"><Truck className="w-12 h-12 text-emerald-500 animate-pulse" /></div>
          ) : pallets.length === 0 ? (
            <div className="text-center py-20 bg-slate-800 rounded-xl border border-slate-700 text-slate-500 font-mono">NO DATA AVAILABLE</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {pallets.map((pallet, index) => (
                <motion.div key={pallet.id || index} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-500 transition-colors">
                  <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Barcode className="w-5 h-5 text-slate-400" />
                      <span className="font-mono font-bold text-emerald-400">{pallet.pallet_id}</span>
                    </div>
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${getStatusBadge(pallet.status)}`}>
                      {pallet.status}
                    </span>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-bold mb-1">Contents</p>
                      <p className="font-medium text-slate-200 truncate">{pallet.contents}</p>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-900 p-3 rounded-lg relative overflow-hidden">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 w-[calc(100%-3rem)] h-0.5 bg-slate-700 dashed-border"></div>
                      <div className="relative z-10 flex-1">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Origin</p>
                        <p className="font-bold text-slate-300 text-sm">{pallet.origin}</p>
                      </div>
                      <div className="relative z-10 bg-slate-800 p-1.5 rounded-full border border-slate-600">
                        <Truck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="relative z-10 flex-1 text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Destination</p>
                        <p className="font-bold text-slate-300 text-sm">{pallet.destination}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-700">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-300 truncate max-w-[120px]" title={pallet.current_location}>{pallet.current_location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-300 font-mono">{pallet.weight} kg</span>
                      </div>
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

export default UnivPalletTracker;
