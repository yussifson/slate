import React, { useState, useEffect } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Car, User, Calendar, CreditCard, Settings, MapPin } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

const UnivCarRental = () => {
  const companyId = useCompanyId();

  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    customer_name: '',
    vehicle_model: '',
    license_plate: '',
    rental_start_date: '',
    rental_end_date: '',
    daily_rate: '',
    status: 'Reserved'
  });

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      const { data, error } = await supabase.from('univ_carrental').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
      if (error) throw error;
      setRentals(data || []);
    } catch (error) {
      console.error('Error fetching rentals:', error);
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
      const { error } = await supabase.from('univ_carrental').insert([{ ...formData, company_id: companyId }]);
      if (error) throw error;
      setFormData({
        customer_name: '',
        vehicle_model: '',
        license_plate: '',
        rental_start_date: '',
        rental_end_date: '',
        daily_rate: '',
        status: 'Reserved'
      });
      fetchRentals();
    } catch (error) {
      console.error('Error adding rental:', error);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-500 text-white shadow-emerald-200';
      case 'Completed': return 'bg-slate-300 text-foreground shadow-slate-200';
      case 'Cancelled': return 'bg-red-500 text-white shadow-red-200';
      default: return 'bg-blue-500 text-white shadow-blue-200'; // Reserved
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-background min-h-screen">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
        <h1 className="text-4xl font-black text-foreground flex items-center justify-center gap-3">
          <Car className="w-12 h-12 text-blue-600" />
          DriveSync Fleet
        </h1>
        <p className="text-muted-foreground mt-2 font-medium">Streamlined vehicle rental management</p>
      </motion.div>

      <div className="grid lg:grid-cols-12 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-4 bg-card p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-border">
          <h2 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2 border-b pb-4">
            <Settings className="w-5 h-5 text-blue-500" /> New Booking
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Customer Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
                <input type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} required className="w-full pl-10 p-3 bg-background rounded-xl border border-border focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Vehicle Model</label>
                <input type="text" name="vehicle_model" value={formData.vehicle_model} onChange={handleChange} required className="w-full p-3 bg-background rounded-xl border border-border focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">License Plate</label>
                <input type="text" name="license_plate" value={formData.license_plate} onChange={handleChange} required className="w-full p-3 bg-background rounded-xl border border-border focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Pick-up</label>
                <input type="date" name="rental_start_date" value={formData.rental_start_date} onChange={handleChange} required className="w-full p-3 bg-background rounded-xl border border-border focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Drop-off</label>
                <input type="date" name="rental_end_date" value={formData.rental_end_date} onChange={handleChange} required className="w-full p-3 bg-background rounded-xl border border-border focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Daily Rate ($)</label>
                <input type="number" step="0.01" name="daily_rate" value={formData.daily_rate} onChange={handleChange} required className="w-full p-3 bg-background rounded-xl border border-border focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full p-3 bg-background rounded-xl border border-border focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                  <option value="Reserved">Reserved</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-200 mt-4">
              Confirm Booking
            </button>
          </form>
        </motion.div>

        <div className="lg:col-span-8">
          {loading ? (
            <div className="flex justify-center py-20"><Car className="w-12 h-12 text-blue-400 animate-bounce" /></div>
          ) : rentals.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-border text-muted-foreground shadow-sm">No rentals recorded.</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {rentals.map((rental, index) => (
                <motion.div key={rental.id || index} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5 border-b border-border flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{rental.vehicle_model}</h3>
                      <div className="bg-muted px-2 py-0.5 rounded font-mono text-xs font-bold text-muted-foreground inline-block mt-1 border border-border">
                        {rental.license_plate}
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm ${getStatusStyle(rental.status)}`}>
                      {rental.status}
                    </span>
                  </div>
                  
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-3 text-foreground">
                      <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><User className="w-4 h-4"/></div>
                      <span className="font-medium">{rental.customer_name}</span>
                    </div>
                    
                    <div className="bg-background rounded-2xl p-4 flex justify-between items-center relative">
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Pick-up</p>
                        <p className="font-medium text-foreground text-sm">{rental.rental_start_date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Drop-off</p>
                        <p className="font-medium text-foreground text-sm">{rental.rental_end_date}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className="text-sm font-medium text-muted-foreground">Rate</span>
                      <span className="font-black text-foreground">${rental.daily_rate}<span className="text-xs font-normal text-muted-foreground">/day</span></span>
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

export default UnivCarRental;
