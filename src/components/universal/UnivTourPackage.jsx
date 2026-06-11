import React, { useState, useEffect } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Map, Plane, CalendarDays, Users, DollarSign, Check, Info } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

const UnivTourPackage = () => {
  const companyId = useCompanyId();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    package_name: '',
    destination: '',
    duration_days: '',
    price_per_person: '',
    max_participants: '',
    inclusions: '',
    start_date: ''
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase.from('univ_tourpackage').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
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
      const { error } = await supabase.from('univ_tourpackage').insert([{ ...formData, company_id: companyId }]);
      if (error) throw error;
      setFormData({
        package_name: '',
        destination: '',
        duration_days: '',
        price_per_person: '',
        max_participants: '',
        inclusions: '',
        start_date: ''
      });
      fetchPackages();
    } catch (error) {
      console.error('Error adding package:', error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-orange-50/40 min-h-screen">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-orange-900 flex items-center justify-center gap-3">
          <Plane className="w-10 h-10 text-orange-500" />
          Wanderlust Tours
        </h1>
        <p className="text-orange-700/60 mt-2 font-medium">Curate and manage exclusive travel experiences</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 bg-card p-8 rounded-3xl shadow-sm border border-orange-100 h-fit">
          <h2 className="text-2xl font-bold mb-6 text-orange-900 border-b border-orange-50 pb-2">New Package</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">Package Name</label>
              <input type="text" name="package_name" value={formData.package_name} onChange={handleChange} required className="w-full p-3 bg-orange-50/50 rounded-xl border border-orange-100 focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">Destination</label>
              <div className="relative">
                <Map className="w-5 h-5 absolute left-3 top-3 text-orange-400" />
                <input type="text" name="destination" value={formData.destination} onChange={handleChange} required className="w-full pl-10 p-3 bg-orange-50/50 rounded-xl border border-orange-100 focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">Duration (Days)</label>
                <input type="number" name="duration_days" value={formData.duration_days} onChange={handleChange} required className="w-full p-3 bg-orange-50/50 rounded-xl border border-orange-100 focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">Start Date</label>
                <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required className="w-full p-3 bg-orange-50/50 rounded-xl border border-orange-100 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">Price / Person</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-3.5 text-orange-400" />
                  <input type="number" step="0.01" name="price_per_person" value={formData.price_per_person} onChange={handleChange} required className="w-full pl-9 p-3 bg-orange-50/50 rounded-xl border border-orange-100 focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">Max Guests</label>
                <div className="relative">
                  <Users className="w-4 h-4 absolute left-3 top-3.5 text-orange-400" />
                  <input type="number" name="max_participants" value={formData.max_participants} onChange={handleChange} required className="w-full pl-9 p-3 bg-orange-50/50 rounded-xl border border-orange-100 focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-orange-900/60 uppercase mb-1">Inclusions (comma separated)</label>
              <textarea name="inclusions" value={formData.inclusions} onChange={handleChange} rows="3" placeholder="Flights, Hotel, Breakfast..." className="w-full p-3 bg-orange-50/50 rounded-xl border border-orange-100 focus:ring-2 focus:ring-orange-500 outline-none transition-all"></textarea>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-200 mt-2">
              Create Package
            </button>
          </form>
        </motion.div>

        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex justify-center py-20"><Plane className="w-12 h-12 text-orange-400 animate-bounce" /></div>
          ) : packages.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-orange-100 text-orange-400 font-medium">No tour packages created yet.</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {packages.map((pkg, index) => (
                <motion.div key={pkg.id || index} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} className="bg-card rounded-3xl shadow-sm border border-orange-100 overflow-hidden group hover:shadow-md transition-all">
                  <div className="h-32 bg-orange-100 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                    {/* Placeholder abstract pattern for image */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500 via-transparent to-transparent bg-[length:20px_20px]"></div>
                    <div className="absolute bottom-4 left-4 right-4 z-20">
                      <h3 className="font-bold text-xl text-white leading-tight">{pkg.package_name}</h3>
                      <p className="text-orange-200 text-sm font-medium flex items-center gap-1 mt-1"><Map className="w-4 h-4"/> {pkg.destination}</p>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      <div className="bg-orange-50/50 p-2 rounded-xl text-center border border-orange-50">
                        <CalendarDays className="w-4 h-4 mx-auto text-orange-500 mb-1" />
                        <p className="text-[10px] font-bold text-orange-900/50 uppercase">Duration</p>
                        <p className="font-bold text-orange-900">{pkg.duration_days}d</p>
                      </div>
                      <div className="bg-orange-50/50 p-2 rounded-xl text-center border border-orange-50">
                        <Users className="w-4 h-4 mx-auto text-orange-500 mb-1" />
                        <p className="text-[10px] font-bold text-orange-900/50 uppercase">Capacity</p>
                        <p className="font-bold text-orange-900">{pkg.max_participants}</p>
                      </div>
                      <div className="bg-orange-50/50 p-2 rounded-xl text-center border border-orange-50">
                        <DollarSign className="w-4 h-4 mx-auto text-orange-500 mb-1" />
                        <p className="text-[10px] font-bold text-orange-900/50 uppercase">Price</p>
                        <p className="font-bold text-orange-900">${pkg.price_per_person}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1"><Info className="w-3 h-3"/> Highlights</p>
                      <div className="flex flex-wrap gap-2">
                        {pkg.inclusions ? pkg.inclusions.split(',').map((inc, i) => (
                          <span key={i} className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md flex items-center gap-1 border border-border">
                            <Check className="w-3 h-3 text-emerald-500" /> {inc.trim()}
                          </span>
                        )) : <span className="text-xs text-muted-foreground">None specified</span>}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">Departure</span>
                      <span className="font-bold text-foreground">{new Date(pkg.start_date).toLocaleDateString()}</span>
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

export default UnivTourPackage;
