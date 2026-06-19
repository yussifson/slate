import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { AlertOctagon, Clock, Activity, User, MapPin} from 'lucide-react';

import { supabase} from "@/api/supabaseClient";

const UnivTriage = () => {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');

 const [triageList, setTriageList] = useState([]);
 const [loading, setLoading] = useState(true);
 const [formData, setFormData] = useState({
 patient_name: '',
 arrival_time: new Date().toISOString().slice(0, 16),
 priority_level: 'Level 3 - Urgent',
 symptoms: '',
 assigned_department: '',
 notes: ''
});

 useEffect(() => {
 fetchTriageList();
}, []);

 const fetchTriageList = async () => {
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_triage WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error) throw error;
 setTriageList(data || []);
} catch (error) {
 console.error('Error fetching triage list:', error);
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
 await powerSync.execute(`INSERT INTO univ_triage (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
 setFormData({
 patient_name: '',
 arrival_time: new Date().toISOString().slice(0, 16),
 priority_level: 'Level 3 - Urgent',
 symptoms: '',
 assigned_department: '',
 notes: ''
});
 fetchTriageList();
} catch (error) {
 console.error('Error adding triage record:', error);
}
};

 const getPriorityColor = (level) => {
 if (!level) return 'bg-muted text-foreground border-primary/40';
 if (level.includes('Level 1')) return 'bg-red-600 text-white border-red-700 animate-pulse';
 if (level.includes('Level 2')) return 'bg-orange-500/10 text-white border-orange-600';
 if (level.includes('Level 3')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
 if (level.includes('Level 4')) return 'bg-green-100 text-green-800 border-green-300';
 return 'bg-blue-100 text-blue-800 border-blue-300';
};

 return (
 <div className="p-6 max-w-7xl mx-auto bg-background min-h-screen ${view !== 'Default' ? 'hide-default' : ''}">
 <motion.div initial={{ opacity: 0, y: -20}} animate={{ opacity: 1, y: 0}} className="mb-8 flex flex-col md:flex-row justify-between items-center bg-card p-6 rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="view-header flex items-center gap-4">
 <div className="bg-red-100 p-4 rounded-md-full">
 <AlertOctagon className="w-8 h-8 text-red-600" />
 </div>
 <div>
 <h1 className="text-3xl font-semibold text-foreground tracking-[-0.02em]">ER Triage</h1>
 <p className="text-[#71717a] dark:text-gray-400">Emergency Department Prioritization</p>
 </div>
 </div>
 </motion.div>

 <div className="grid lg:grid-cols-3 gap-6">
 <motion.div initial={{ opacity: 0, x: -20}} animate={{ opacity: 1, x: 0}} className="lg:col-span-1 bg-card p-6 rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 h-fit hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-xl font-semibold text-foreground mb-6 border-b pb-2">New Assessment</h2>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Patient Name</label>
 <input type="text" name="patient_name" value={formData.patient_name} onChange={handleChange} required className="w-full p-2.5 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" />
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Priority Level</label>
 <select name="priority_level" value={formData.priority_level} onChange={handleChange} className="w-full p-2.5 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-medium">
 <option value="Level 1 - Resuscitation">Level 1 - Resuscitation (Immediate)</option>
 <option value="Level 2 - Emergent">Level 2 - Emergent (15 mins)</option>
 <option value="Level 3 - Urgent">Level 3 - Urgent (30 mins)</option>
 <option value="Level 4 - Less Urgent">Level 4 - Less Urgent (1-2 hrs)</option>
 <option value="Level 5 - Non-Urgent">Level 5 - Non-Urgent (2-24 hrs)</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Chief Symptoms</label>
 <textarea name="symptoms" value={formData.symptoms} onChange={handleChange} required rows={3} className="w-full p-2.5 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"></textarea>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Dept/Zone</label>
 <input type="text" name="assigned_department" value={formData.assigned_department} onChange={handleChange} className="w-full p-2.5 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" />
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Arrival Time</label>
 <input type="datetime-local" name="arrival_time" value={formData.arrival_time} onChange={handleChange} className="w-full p-2.5 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm" />
 </div>
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Notes</label>
 <input type="text" name="notes" value={formData.notes} onChange={handleChange} className="w-full p-2.5 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" />
 </div>
 <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-all mt-4">
 Submit Assessment
 </button>
 </form>
 </motion.div>

 <div className="lg:col-span-2">
 {loading ? (
 <div className="flex justify-center py-20"><Activity className="w-12 h-12 text-red-500 animate-spin" /></div>
 ) : triageList.length === 0 ? (
 <div className="text-center py-20 bg-card rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-[#71717a] dark:text-gray-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">No patients in triage queue.</div>
 ) : (
 <div className="flex flex-col gap-4">
 {triageList.map((patient, index) => (
 <motion.div key={patient.id || index} initial={{ opacity: 0, x: 20}} animate={{ opacity: 1, x: 0}} transition={{ delay: index * 0.05}} className={`p-5 rounded-md-2xl border-2 flex flex-col sm:flex-row gap-4 bg-card ${getPriorityColor(patient.priority_level).includes('red-600') ? 'border-red-500' : 'border-primary/40'}`}>
 <div className={`px-4 py-2 rounded-md-xl text-center font-semibold text-sm h-fit ${getPriorityColor(patient.priority_level)}`}>
 {patient.priority_level?.split(' - ')[0]}
 </div>
 <div className="flex-1">
 <div className="flex justify-between items-start mb-2">
 <h3 className="text-xl font-semibold text-foreground">{patient.patient_name}</h3>
 <div className="flex items-center text-[#71717a] dark:text-gray-400 text-sm font-medium bg-muted px-3 py-1 rounded-md-full">
 <Clock className="w-4 h-4 mr-1" />
 {new Date(patient.arrival_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
 </div>
 </div>
 <p className="text-foreground mb-3 bg-background p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">{patient.symptoms}</p>
 <div className="flex flex-wrap gap-4 text-sm font-medium text-[#71717a] dark:text-gray-400">
 {patient.assigned_department && (
 <span className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg"><MapPin className="w-4 h-4" /> {patient.assigned_department}</span>
 )}
 {patient.notes && <span className="text-[#71717a] dark:text-gray-400 italic">Note: {patient.notes}</span>}
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

export default UnivTriage;
