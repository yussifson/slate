import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { Car, User, Calendar, CreditCard, Settings, MapPin} from 'lucide-react';

import { supabase} from "@/api/supabaseClient";

const UnivCarRental = () => {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');

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
 const __res = await powerSync.execute(`SELECT * FROM univ_carrental WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error) throw error;
 setRentals(data || []);
} catch (error) {
 console.error('Error fetching rentals:', error);
} finally {
 setLoading(false);
}
};

 const handleChange = (e) => {
 setFormData({ ...formData, [e.target.name]: e.target.value});
};

 const handleSubmit = async (e) => {
 e.preventDefault();
 try {
 const { error} = await (async () => {
 const _payload = { ...formData, id: crypto.randomUUID(), company_id: companyId};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_carrental (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
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
 case 'Active': return 'bg-emerald-500/10 text-white -emerald-200';
 case 'Completed': return 'bg-slate-300 text-foreground -slate-200';
 case 'Cancelled': return 'bg-red-500/10 text-white -red-200';
 default: return 'bg-blue-500/10 text-white -blue-200'; // Reserved
}
};

 return (
 <div className="p-6 max-w-7xl mx-auto bg-background min-h-screen ${view !== 'Default' ? 'hide-default' : ''}">
 <motion.div initial={{ opacity: 0, y: -20}} animate={{ opacity: 1, y: 0}} className="mb-10 text-center">
 <h1 className="text-4xl font-black text-foreground flex items-center justify-center gap-3 tracking-[-0.02em]">
 <Car className="w-12 h-12 text-blue-600" />
 DriveSync Fleet
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-2 font-medium">Streamlined vehicle rental management</p>
 </motion.div>

 <div className="view-header grid lg:grid-cols-12 gap-8">
 <motion.div initial={{ opacity: 0, x: -20}} animate={{ opacity: 1, x: 0}} className="lg:col-span-4 bg-card p-6 rounded-3xl -slate-200/50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-xl font-semibold mb-6 text-foreground flex items-center gap-2 border-b pb-4">
 <Settings className="w-5 h-5 text-blue-500" /> New Booking
 </h2>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Customer Name</label>
 <div className="relative">
 <User className="w-4 h-4 absolute left-3 top-3.5 text-[#71717a] dark:text-gray-400" />
 <input type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} required className="w-full pl-10 p-3 bg-background rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Vehicle Model</label>
 <input type="text" name="vehicle_model" value={formData.vehicle_model} onChange={handleChange} required className="w-full p-3 bg-background rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 focus:ring-2 focus:ring-blue-500 outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">License Plate</label>
 <input type="text" name="license_plate" value={formData.license_plate} onChange={handleChange} required className="w-full p-3 bg-background rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase tracking-[0.04em]" />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Pick-up</label>
 <input type="date" name="rental_start_date" value={formData.rental_start_date} onChange={handleChange} required className="w-full p-3 bg-background rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Drop-off</label>
 <input type="date" name="rental_end_date" value={formData.rental_end_date} onChange={handleChange} required className="w-full p-3 bg-background rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Daily Rate ($)</label>
 <input type="number" step="0.01" name="daily_rate" value={formData.daily_rate} onChange={handleChange} required className="w-full p-3 bg-background rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 focus:ring-2 focus:ring-blue-500 outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Status</label>
 <select name="status" value={formData.status} onChange={handleChange} className="w-full p-3 bg-background rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 focus:ring-2 focus:ring-blue-500 outline-none font-medium">
 <option value="Reserved">Reserved</option>
 <option value="Active">Active</option>
 <option value="Completed">Completed</option>
 <option value="Cancelled">Cancelled</option>
 </select>
 </div>
 </div>
 <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-all -blue-200 mt-4">
 Confirm Booking
 </button>
 </form>
 </motion.div>

 <div className="lg:col-span-8">
 {loading ? (
 <div className="flex justify-center py-20"><Car className="w-12 h-12 text-blue-400 animate-bounce" /></div>
 ) : rentals.length === 0 ? (
 <div className="text-center py-20 bg-card rounded-3xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-[#71717a] dark:text-gray-400  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">No rentals recorded.</div>
 ) : (
 <div className="grid sm:grid-cols-2 gap-6">
 {rentals.map((rental, index) => (
 <motion.div key={rental.id || index} initial={{ opacity: 0, scale: 0.95}} animate={{ opacity: 1, scale: 1}} transition={{ delay: index * 0.05}} className="bg-card rounded-3xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden transition- hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-5 border-b border-primary/40 flex justify-between items-start">
 <div>
 <h3 className="font-semibold text-lg text-foreground">{rental.vehicle_model}</h3>
 <div className="bg-muted px-2 py-0.5 rounded-md font-mono text-xs font-semibold text-[#71717a] dark:text-gray-400 inline-block mt-1 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 tracking-[0.04em]">
 {rental.license_plate}
 </div>
 </div>
 <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusStyle(rental.status)}`}>
 {rental.status}
 </span>
 </div>
 
 <div className="p-5 space-y-4">
 <div className="flex items-center gap-3 text-foreground">
 <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><User className="w-4 h-4"/></div>
 <span className="font-medium">{rental.customer_name}</span>
 </div>
 
 <div className="bg-background rounded-2xl p-4 flex justify-between items-center relative">
 <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300">
 <MapPin className="w-4 h-4" />
 </div>
 <div>
 <p className="text-[10px] font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Pick-up</p>
 <p className="font-medium text-foreground text-sm">{rental.rental_start_date}</p>
 </div>
 <div className="text-right">
 <p className="text-[10px] font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Drop-off</p>
 <p className="font-medium text-foreground text-sm">{rental.rental_end_date}</p>
 </div>
 </div>

 <div className="flex justify-between items-center pt-2 border-t border-primary/40">
 <span className="text-sm font-medium text-[#71717a] dark:text-gray-400">Rate</span>
 <span className="font-black text-foreground">${rental.daily_rate}<span className="text-xs font-normal text-[#71717a] dark:text-gray-400 tracking-[0.04em]">/day</span></span>
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
