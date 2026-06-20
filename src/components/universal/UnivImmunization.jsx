import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { Syringe, User, Calendar, Activity, Plus, CheckCircle, Clock} from 'lucide-react';

import { supabase} from "@/api/supabaseClient";

const UnivImmunization = () => {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');

 const [immunizations, setImmunizations] = useState([]);
 const [loading, setLoading] = useState(true);
 const [formData, setFormData] = useState({
 patient_name: '',
 vaccine_name: '',
 dose_number: '',
 administered_date: '',
 administered_by: '',
 notes: ''
});

 useEffect(() => {
 fetchImmunizations();
}, []);

 const fetchImmunizations = async () => {
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_immunization WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error) throw error;
 setImmunizations(data || []);
} catch (error) {
 console.error('Error fetching immunizations:', error);
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
 await powerSync.execute(`INSERT INTO univ_immunization (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
 setFormData({
 patient_name: '',
 vaccine_name: '',
 dose_number: '',
 administered_date: '',
 administered_by: '',
 notes: ''
});
 fetchImmunizations();
} catch (error) {
 console.error('Error adding immunization:', error);
}
};

 return (
 <div className="p-6 max-w-6xl mx-auto bg-background min-h-screen ${view !== 'Default' ? 'hide-default' : ''}">
 <motion.div initial={{ opacity: 0, y: -20}} animate={{ opacity: 1, y: 0}} className="mb-8 text-center">
 <h1 className="text-4xl font-semibold text-foreground flex items-center justify-center gap-3 tracking-[-0.02em]">
 <Syringe className="w-10 h-10 text-blue-600" />
 Immunization Tracker
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-2">Manage patient vaccination records</p>
 </motion.div>

 <div className="view-header grid md:grid-cols-3 gap-8">
 <motion.div initial={{ opacity: 0, x: -20}} animate={{ opacity: 1, x: 0}} className="md:col-span-1 bg-card p-6 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
 <Plus className="w-5 h-5 text-blue-500" /> New Record
 </h2>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Patient Name</label>
 <div className="relative">
 <User className="w-5 h-5 absolute left-3 top-2.5 text-[#71717a] dark:text-gray-400" />
 <input type="text" name="patient_name" value={formData.patient_name} onChange={handleChange} required className="w-full pl-10 p-2.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Vaccine Name</label>
 <input type="text" name="vaccine_name" value={formData.vaccine_name} onChange={handleChange} required className="w-full p-2.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Dose #</label>
 <input type="number" name="dose_number" value={formData.dose_number} onChange={handleChange} required className="w-full p-2.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Date</label>
 <input type="date" name="administered_date" value={formData.administered_date} onChange={handleChange} required className="w-full p-2.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Administered By</label>
 <input type="text" name="administered_by" value={formData.administered_by} onChange={handleChange} required className="w-full p-2.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
 <textarea name="notes" value={formData.notes} onChange={handleChange} className="w-full p-2.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24"></textarea>
 </div>
 <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors flex justify-center items-center gap-2">
 <CheckCircle className="w-5 h-5" /> Save Record
 </button>
 </form>
 </motion.div>

 <div className="md:col-span-2 space-y-4">
 {loading ? (
 <div className="text-center py-10"><OrbitLoader size="md" /></div>
 ) : immunizations.length === 0 ? (
 <div className="text-center py-10 bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-[#71717a] dark:text-gray-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">No immunization records found.</div>
 ) : (
 immunizations.map((record, index) => (
 <motion.div key={record.id || index} initial={{ opacity: 0, y: 10}} animate={{ opacity: 1, y: 0}} transition={{ delay: index * 0.05}} className="bg-card p-5 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex items-start gap-4 transition- hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Syringe className="w-6 h-6" /></div>
 <div className="flex-1">
 <h3 className="text-lg font-semibold text-foreground">{record.patient_name}</h3>
 <div className="flex flex-wrap gap-4 text-sm text-[#71717a] dark:text-gray-400 mt-2">
 <span className="flex items-center gap-2 font-medium text-indigo-600">{record.vaccine_name} (Dose {record.dose_number})</span>
 <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {record.administered_date}</span>
 <span className="flex items-center gap-2"><User className="w-4 h-4" /> {record.administered_by}</span>
 </div>
 {record.notes && <p className="text-sm text-[#71717a] dark:text-gray-400 mt-3 bg-background p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">{record.notes}</p>}
 </div>
 </motion.div>
 ))
 )}
 </div>
 </div>
 </div>
 );
};

export default UnivImmunization;
