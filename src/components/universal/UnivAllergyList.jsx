import { OrbitLoader } from '@/components/ui/orbit-loader';
import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { AlertCircle, User, Calendar, Pill, ShieldAlert, Plus, AlertTriangle} from 'lucide-react';

import { supabase} from "@/api/supabaseClient";

const UnivAllergyList = () => {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');

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
 const __res = await powerSync.execute(`SELECT * FROM univ_allergylist WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error) throw error;
 setAllergies(data || []);
} catch (error) {
 console.error('Error fetching allergies:', error);
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
 await powerSync.execute(`INSERT INTO univ_allergylist (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
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
 <div className="p-6 max-w-6xl mx-auto bg-amber-50/30 min-h-screen ${view !== 'Default' ? 'hide-default' : ''}">
 <motion.div initial={{ opacity: 0, y: -20}} animate={{ opacity: 1, y: 0}} className="mb-8 text-center">
 <h1 className="text-4xl font-semibold text-foreground flex items-center justify-center gap-3 tracking-[-0.02em]">
 <AlertCircle className="w-10 h-10 text-red-500" />
 Allergy Registry
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-2">Track patient allergies and reactions</p>
 </motion.div>

 <div className="view-header grid md:grid-cols-3 gap-8">
 <motion.div initial={{ opacity: 0, x: -20}} animate={{ opacity: 1, x: 0}} className="md:col-span-1 bg-card p-6 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
 <Plus className="w-5 h-5 text-red-500" /> Log Allergy
 </h2>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Patient Name</label>
 <div className="relative">
 <User className="w-5 h-5 absolute left-3 top-2.5 text-[#71717a] dark:text-gray-400" />
 <input type="text" name="patient_name" value={formData.patient_name} onChange={handleChange} required className="w-full pl-10 p-2.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" />
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Allergen</label>
 <input type="text" name="allergen" value={formData.allergen} onChange={handleChange} required className="w-full p-2.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Severity</label>
 <select name="reaction_severity" value={formData.reaction_severity} onChange={handleChange} className="w-full p-2.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-red-500 outline-none">
 <option value="Mild">Mild</option>
 <option value="Moderate">Moderate</option>
 <option value="Severe">Severe</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Diagnosed Date</label>
 <input type="date" name="diagnosed_date" value={formData.diagnosed_date} onChange={handleChange} className="w-full p-2.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Medications/Treatment</label>
 <input type="text" name="medications" value={formData.medications} onChange={handleChange} className="w-full p-2.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
 <textarea name="notes" value={formData.notes} onChange={handleChange} className="w-full p-2.5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-red-500 outline-none h-20"></textarea>
 </div>
 <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-xl transition-colors flex justify-center items-center gap-2">
 <ShieldAlert className="w-5 h-5" /> Save Entry
 </button>
 </form>
 </motion.div>

 <div className="md:col-span-2 grid grid-cols-1 gap-4 content-start">
 {loading ? (
 <div className="text-center py-10"><OrbitLoader size="md" /></div>
 ) : allergies.length === 0 ? (
 <div className="text-center py-10 bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-[#71717a] dark:text-gray-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">No allergy records found.</div>
 ) : (
 allergies.map((record, index) => (
 <motion.div key={record.id || index} initial={{ opacity: 0, scale: 0.95}} animate={{ opacity: 1, scale: 1}} transition={{ delay: index * 0.05}} className="bg-card p-5 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex flex-col sm:flex-row gap-4 transition- hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className={`p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 flex-shrink-0 self-start ${getSeverityColor(record.reaction_severity)}`}>
 <AlertTriangle className="w-6 h-6" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex justify-between items-start mb-2">
 <h3 className="text-lg font-semibold text-foreground truncate">{record.allergen}</h3>
 <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getSeverityColor(record.reaction_severity)}`}>{record.reaction_severity}</span>
 </div>
 <div className="text-sm text-[#71717a] dark:text-gray-400 mb-3"><User className="w-4 h-4 inline mr-1 text-[#71717a] dark:text-gray-400" />{record.patient_name}</div>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[#71717a] dark:text-gray-400 bg-background p-3 rounded-xl">
 {record.diagnosed_date && <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-[#71717a] dark:text-gray-400" /> {record.diagnosed_date}</div>}
 {record.medications && <div className="flex items-center gap-2"><Pill className="w-4 h-4 text-[#71717a] dark:text-gray-400" /> {record.medications}</div>}
 </div>
 {record.notes && <p className="text-sm text-[#71717a] dark:text-gray-400 mt-3 italic border-l-2 border-primary/40 pl-3">"{record.notes}"</p>}
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

