import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { BaggageClaim, AlertCircle, CheckCircle, Clock, Plane, User, Tag} from 'lucide-react';

import { supabase} from "@/api/supabaseClient";

const UnivLuggageClaim = () => {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');

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
 const __res = await powerSync.execute(`SELECT * FROM univ_luggageclaim WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error) throw error;
 setClaims(data || []);
} catch (error) {
 console.error('Error fetching claims:', error);
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
 await powerSync.execute(`INSERT INTO univ_luggageclaim (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
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
 <div className="p-6 max-w-7xl mx-auto bg-muted min-h-screen ${view !== 'Default' ? 'hide-default' : ''}">
 <motion.div initial={{ opacity: 0, y: -20}} animate={{ opacity: 1, y: 0}} className="mb-8 flex items-center justify-between bg-card p-6 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="view-header flex items-center gap-4">
 <div className="bg-slate-800 p-4 rounded-xl text-white">
 <BaggageClaim className="w-8 h-8" />
 </div>
 <div>
 <h1 className="text-3xl font-semibold text-foreground tracking-[-0.02em]">Luggage Claim Desk</h1>
 <p className="text-[#71717a] dark:text-gray-400 font-medium mt-1">Track and resolve lost baggage incidents</p>
 </div>
 </div>
 </motion.div>

 <div className="grid lg:grid-cols-3 gap-6">
 <motion.div initial={{ opacity: 0, x: -20}} animate={{ opacity: 1, x: 0}} className="lg:col-span-1 bg-card p-6 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 h-fit hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-semibold mb-5 text-foreground border-b pb-2">File New Claim</h2>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-sm font-semibold text-[#71717a] dark:text-gray-400 mb-1">Passenger Name</label>
 <div className="relative">
 <User className="w-4 h-4 absolute left-3 top-3 text-[#71717a] dark:text-gray-400" />
 <input type="text" name="passenger_name" value={formData.passenger_name} onChange={handleChange} required className="w-full pl-9 p-2.5 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none" />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-sm font-semibold text-[#71717a] dark:text-gray-400 mb-1">Flight Number</label>
 <div className="relative">
 <Plane className="w-4 h-4 absolute left-3 top-3 text-[#71717a] dark:text-gray-400" />
 <input type="text" name="flight_number" value={formData.flight_number} onChange={handleChange} required className="w-full pl-9 p-2.5 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none uppercase font-mono text-sm tracking-[0.04em]" />
 </div>
 </div>
 <div>
 <label className="block text-sm font-semibold text-[#71717a] dark:text-gray-400 mb-1">Claim Tag #</label>
 <div className="relative">
 <Tag className="w-4 h-4 absolute left-3 top-3 text-[#71717a] dark:text-gray-400" />
 <input type="text" name="claim_tag" value={formData.claim_tag} onChange={handleChange} required className="w-full pl-9 p-2.5 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none font-mono text-sm" />
 </div>
 </div>
 </div>
 <div>
 <label className="block text-sm font-semibold text-[#71717a] dark:text-gray-400 mb-1">Bag Description</label>
 <input type="text" name="bag_type" value={formData.bag_type} onChange={handleChange} placeholder="e.g. Large blue Samsonite roller" required className="w-full p-2.5 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none" />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-sm font-semibold text-[#71717a] dark:text-gray-400 mb-1">Status</label>
 <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2.5 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none font-medium">
 <option value="Reported">Reported</option>
 <option value="In Progress">In Progress</option>
 <option value="Resolved">Resolved</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-semibold text-[#71717a] dark:text-gray-400 mb-1">Report Date</label>
 <input type="date" name="reported_date" value={formData.reported_date} onChange={handleChange} required className="w-full p-2.5 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none text-sm" />
 </div>
 </div>
 <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition-colors mt-2">
 Submit Claim
 </button>
 </form>
 </motion.div>

 <div className="lg:col-span-2">
 {loading ? (
 <div className="flex justify-center py-20"><BaggageClaim className="w-10 h-10 text-[#71717a] dark:text-gray-400 animate-pulse" /></div>
 ) : claims.length === 0 ? (
 <div className="text-center py-20 bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-[#71717a] dark:text-gray-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">No active claims.</div>
 ) : (
 <div className="flex flex-col gap-4">
 {claims.map((claim, index) => (
 <motion.div key={claim.id || index} initial={{ opacity: 0, x: 20}} animate={{ opacity: 1, x: 0}} transition={{ delay: index * 0.05}} className="bg-card p-5 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 transition- flex flex-col sm:flex-row gap-5 items-start hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="bg-background p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex-shrink-0 w-24 text-center">
 <p className="text-[10px] font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Tag No.</p>
 <p className="font-mono font-semibold text-foreground text-sm truncate">{claim.claim_tag}</p>
 </div>
 
 <div className="flex-1 min-w-0">
 <div className="flex justify-between items-start mb-2">
 <h3 className="font-semibold text-lg text-foreground truncate">{claim.passenger_name}</h3>
 <div className="flex items-center gap-2 bg-background px-3 py-1 rounded-full border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">
 {getStatusIcon(claim.status)}
 <span className="text-xs font-semibold text-foreground tracking-[0.04em]">{claim.status}</span>
 </div>
 </div>
 
 <p className="text-sm text-[#71717a] dark:text-gray-400 mb-3">{claim.bag_type}</p>
 
 <div className="flex flex-wrap gap-4 text-xs font-medium text-[#71717a] dark:text-gray-400 tracking-[0.04em]">
 <span className="flex items-center gap-2 bg-blue-50 text-blue-700 px-2 py-1 rounded-md"><Plane className="w-3 h-3"/> {claim.flight_number}</span>
 <span className="flex items-center gap-2"><AlertCircle className="w-3 h-3"/> Reported: {claim.reported_date}</span>
 {claim.resolution_date && (
 <span className="flex items-center gap-2 text-emerald-600"><CheckCircle className="w-3 h-3"/> Resolved: {claim.resolution_date}</span>
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
