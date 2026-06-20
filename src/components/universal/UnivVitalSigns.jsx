import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { HeartPulse, Thermometer, Wind, Droplets, Activity, Plus} from 'lucide-react';

import { supabase} from "@/api/supabaseClient";

const UnivVitalSigns = () => {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');

 const [vitals, setVitals] = useState([]);
 const [loading, setLoading] = useState(true);
 const [formData, setFormData] = useState({
 patient_name: '',
 temperature: '',
 heart_rate: '',
 blood_pressure: '',
 respiratory_rate: '',
 oxygen_saturation: '',
 recorded_at: new Date().toISOString().slice(0, 16)
});

 useEffect(() => {
 fetchVitals();
}, []);

 const fetchVitals = async () => {
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_vitalsigns WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error) throw error;
 setVitals(data || []);
} catch (error) {
 console.error('Error fetching vitals:', error);
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
 await powerSync.execute(`INSERT INTO univ_vitalsigns (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
 setFormData({
 patient_name: '',
 temperature: '',
 heart_rate: '',
 blood_pressure: '',
 respiratory_rate: '',
 oxygen_saturation: '',
 recorded_at: new Date().toISOString().slice(0, 16)
});
 fetchVitals();
} catch (error) {
 console.error('Error adding vitals:', error);
}
};

 return (
 <div className="p-6 max-w-6xl mx-auto bg-rose-50/20 min-h-screen ${view !== 'Default' ? 'hide-default' : ''}">
 <motion.div initial={{ opacity: 0, y: -20}} animate={{ opacity: 1, y: 0}} className="mb-8 text-center">
 <h1 className="text-4xl font-semibold text-foreground flex items-center justify-center gap-3 tracking-[-0.02em]">
 <HeartPulse className="w-10 h-10 text-rose-500" />
 Vital Signs Monitor
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-2">Continuous patient monitoring</p>
 </motion.div>

 <div className="view-header grid lg:grid-cols-3 gap-8">
 <motion.div initial={{ opacity: 0, x: -20}} animate={{ opacity: 1, x: 0}} className="lg:col-span-1 bg-card p-6 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-rose-100 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-rose-600">
 <Plus className="w-5 h-5" /> Record Vitals
 </h2>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Patient Name</label>
 <input type="text" name="patient_name" value={formData.patient_name} onChange={handleChange} required className="w-full p-2.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Heart Rate (bpm)</label>
 <div className="relative">
 <Activity className="w-4 h-4 absolute left-3 top-3 text-rose-400" />
 <input type="number" name="heart_rate" value={formData.heart_rate} onChange={handleChange} className="w-full pl-9 p-2.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none" />
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Temp (°C/°F)</label>
 <div className="relative">
 <Thermometer className="w-4 h-4 absolute left-3 top-3 text-orange-400" />
 <input type="text" name="temperature" value={formData.temperature} onChange={handleChange} className="w-full pl-9 p-2.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none" />
 </div>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">BP (mmHg)</label>
 <input type="text" name="blood_pressure" value={formData.blood_pressure} onChange={handleChange} placeholder="120/80" className="w-full p-2.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none" />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">SpO2 (%)</label>
 <div className="relative">
 <Droplets className="w-4 h-4 absolute left-3 top-3 text-blue-400" />
 <input type="number" name="oxygen_saturation" value={formData.oxygen_saturation} onChange={handleChange} className="w-full pl-9 p-2.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none" />
 </div>
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Respiratory Rate</label>
 <div className="relative">
 <Wind className="w-4 h-4 absolute left-3 top-3 text-teal-400" />
 <input type="number" name="respiratory_rate" value={formData.respiratory_rate} onChange={handleChange} className="w-full pl-9 p-2.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none" />
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Time</label>
 <input type="datetime-local" name="recorded_at" value={formData.recorded_at} onChange={handleChange} required className="w-full p-2.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none" />
 </div>
 <button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-white font-medium py-3 rounded-xl transition-colors mt-2">
 Save Vitals
 </button>
 </form>
 </motion.div>

 <div className="lg:col-span-2 space-y-4">
 {loading ? (
 <div className="text-center py-20"><Activity className="w-10 h-10 text-rose-500 animate-spin mx-auto" /></div>
 ) : vitals.length === 0 ? (
 <div className="text-center py-20 bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-[#71717a] dark:text-gray-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">No vitals recorded yet.</div>
 ) : (
 <div className="grid sm:grid-cols-2 gap-4">
 {vitals.map((record, index) => (
 <motion.div key={record.id || index} initial={{ opacity: 0, scale: 0.95}} animate={{ opacity: 1, scale: 1}} transition={{ delay: index * 0.05}} className="bg-card p-5 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:border-rose-200 transition-colors hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex justify-between items-start mb-4">
 <div>
 <h3 className="font-semibold text-foreground">{record.patient_name}</h3>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{new Date(record.recorded_at).toLocaleString()}</p>
 </div>
 </div>
 
 <div className="grid grid-cols-2 gap-3 text-sm">
 <div className="bg-rose-50 p-2 rounded-xl flex flex-col items-center justify-center">
 <span className="text-[#71717a] dark:text-gray-400 text-xs mb-1 flex items-center gap-2 tracking-[0.04em]"><Activity className="w-3 h-3 text-rose-400" /> HR</span>
 <span className="font-semibold text-foreground">{record.heart_rate || '-'} <span className="text-[10px] font-normal">bpm</span></span>
 </div>
 <div className="bg-blue-50 p-2 rounded-xl flex flex-col items-center justify-center">
 <span className="text-[#71717a] dark:text-gray-400 text-xs mb-1 flex items-center gap-2 tracking-[0.04em]"><Droplets className="w-3 h-3 text-blue-400" /> SpO2</span>
 <span className="font-semibold text-foreground">{record.oxygen_saturation || '-'} <span className="text-[10px] font-normal">%</span></span>
 </div>
 <div className="bg-orange-50 p-2 rounded-xl flex flex-col items-center justify-center">
 <span className="text-[#71717a] dark:text-gray-400 text-xs mb-1 flex items-center gap-2 tracking-[0.04em]"><Thermometer className="w-3 h-3 text-orange-400" /> Temp</span>
 <span className="font-semibold text-foreground">{record.temperature || '-'}</span>
 </div>
 <div className="bg-background p-2 rounded-xl flex flex-col items-center justify-center border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">
 <span className="text-[#71717a] dark:text-gray-400 text-xs mb-1 tracking-[0.04em]">BP</span>
 <span className="font-semibold text-foreground">{record.blood_pressure || '-'}</span>
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

export default UnivVitalSigns;
