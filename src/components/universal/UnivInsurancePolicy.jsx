import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { Shield, CreditCard, Calendar, User, FileText, CheckCircle} from 'lucide-react';

import { supabase} from "@/api/supabaseClient";

const UnivInsurancePolicy = () => {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');

 const [policies, setPolicies] = useState([]);
 const [loading, setLoading] = useState(true);
 const [formData, setFormData] = useState({
 policy_holder: '',
 policy_number: '',
 provider_name: '',
 coverage_type: 'Comprehensive',
 start_date: '',
 end_date: '',
 premium_amount: ''
});

 useEffect(() => {
 fetchPolicies();
}, []);

 const fetchPolicies = async () => {
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_insurancepolicy WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error) throw error;
 setPolicies(data || []);
} catch (error) {
 console.error('Error fetching policies:', error);
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
 const _p = { ...formData, id: crypto.randomUUID(), company_id: companyId};
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _pl = _k.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_insurancepolicy (${_k.join(', ')}) VALUES (${_pl})`, _v); return { error: null};})();
 if (error) throw error;
 setFormData({
 policy_holder: '',
 policy_number: '',
 provider_name: '',
 coverage_type: 'Comprehensive',
 start_date: '',
 end_date: '',
 premium_amount: ''
});
 fetchPolicies();
} catch (error) {
 console.error('Error adding policy:', error);
}
};

 const isExpired = (endDate) => {
 if (!endDate) return false;
 return new Date(endDate) < new Date();
};

 return (
 <div className="p-6 max-w-7xl mx-auto bg-blue-50/50 min-h-screen ${view !== 'Default' ? 'hide-default' : ''}">
 <motion.div initial={{ opacity: 0, y: -20}} animate={{ opacity: 1, y: 0}} className="mb-10 text-center">
 <h1 className="text-4xl font-black text-blue-900 flex items-center justify-center gap-3 tracking-tight">
 <Shield className="w-12 h-12 text-blue-600" />
 Policy Vault
 </h1>
 <p className="text-blue-600/70 mt-2 font-medium">Secure Insurance Policy Management</p>
 </motion.div>

 <div className="view-header grid lg:grid-cols-3 gap-8">
 <motion.div initial={{ opacity: 0, x: -20}} animate={{ opacity: 1, x: 0}} className="lg:col-span-1 bg-card p-6 rounded-3xl border border-blue-100 h-fit">
 <h2 className="text-xl font-bold mb-6 text-blue-900 border-b border-blue-50 pb-3">Add Policy</h2>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-blue-900/60 uppercase mb-1">Policy Holder</label>
 <input type="text" name="policy_holder" value={formData.policy_holder} onChange={handleChange} required className="w-full p-3 bg-blue-50/50 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
 </div>
 <div>
 <label className="block text-xs font-bold text-blue-900/60 uppercase mb-1">Provider Name</label>
 <input type="text" name="provider_name" value={formData.provider_name} onChange={handleChange} required className="w-full p-3 bg-blue-50/50 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-blue-900/60 uppercase mb-1">Policy Number</label>
 <input type="text" name="policy_number" value={formData.policy_number} onChange={handleChange} required className="w-full p-3 bg-blue-50/50 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
 </div>
 <div>
 <label className="block text-xs font-bold text-blue-900/60 uppercase mb-1">Coverage</label>
 <select name="coverage_type" value={formData.coverage_type} onChange={handleChange} className="w-full p-3 bg-blue-50/50 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all">
 <option value="Comprehensive">Comprehensive</option>
 <option value="Third-Party">Third-Party</option>
 <option value="Health">Health</option>
 <option value="Life">Life</option>
 <option value="Home">Home</option>
 </select>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-blue-900/60 uppercase mb-1">Start Date</label>
 <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required className="w-full p-3 bg-blue-50/50 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" />
 </div>
 <div>
 <label className="block text-xs font-bold text-blue-900/60 uppercase mb-1">End Date</label>
 <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} required className="w-full p-3 bg-blue-50/50 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" />
 </div>
 </div>
 <div>
 <label className="block text-xs font-bold text-blue-900/60 uppercase mb-1">Premium Amount</label>
 <div className="relative">
 <span className="absolute left-4 top-3 text-blue-400 font-bold">$</span>
 <input type="number" step="0.01" name="premium_amount" value={formData.premium_amount} onChange={handleChange} required className="w-full pl-8 p-3 bg-blue-50/50 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
 </div>
 </div>
 <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all mt-2">
 Save Policy
 </button>
 </form>
 </motion.div>

 <div className="lg:col-span-2">
 {loading ? (
 <div className="flex justify-center py-20"><Shield className="w-12 h-12 text-blue-400 animate-pulse" /></div>
 ) : policies.length === 0 ? (
 <div className="text-center py-20 bg-card rounded-3xl border border-blue-100 text-blue-400 font-medium">No policies stored yet.</div>
 ) : (
 <div className="grid md:grid-cols-2 gap-6">
 {policies.map((policy, index) => {
 const expired = isExpired(policy.end_date);
 return (
 <motion.div key={policy.id || index} initial={{ opacity: 0, scale: 0.9}} animate={{ opacity: 1, scale: 1}} transition={{ delay: index * 0.05}} className={`relative bg-gradient-to-br ${expired ? 'from-slate-50 to-slate-100 border-border' : 'from-blue-600 to-blue-800 text-white border-transparent'} p-6 rounded-3xl border overflow-hidden`}>
 {/* Background decoration */}
 <div className="absolute -right-6 -top-6 opacity-10">
 <Shield className="w-32 h-32" />
 </div>
 
 <div className="relative z-10">
 <div className="flex justify-between items-start mb-6">
 <div>
 <h3 className={`font-black text-xl ${expired ? 'text-foreground' : 'text-white'}`}>{policy.provider_name}</h3>
 <span className={`text-xs font-bold uppercase tracking-wider ${expired ? 'text-muted-foreground' : 'text-blue-200'}`}>{policy.coverage_type} Coverage</span>
 </div>
 {expired ? (
 <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-md">EXPIRED</span>
 ) : (
 <CheckCircle className="text-blue-300 w-6 h-6" />
 )}
 </div>

 <div className="space-y-4">
 <div>
 <p className={`text-xs uppercase font-bold ${expired ? 'text-muted-foreground' : 'text-blue-300'}`}>Policy Holder</p>
 <p className={`font-medium text-lg ${expired ? 'text-foreground' : 'text-white'}`}>{policy.policy_holder}</p>
 </div>
 
 <div className={`p-3 rounded-xl ${expired ? 'bg-muted/60/50' : 'bg-card/10 backdrop-blur-sm'}`}>
 <p className={`text-xs uppercase font-bold ${expired ? 'text-muted-foreground' : 'text-blue-200'}`}>Policy Number</p>
 <p className={`font-mono text-lg tracking-widest ${expired ? 'text-foreground' : 'text-white'}`}>{policy.policy_number}</p>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <p className={`text-xs uppercase font-bold ${expired ? 'text-muted-foreground' : 'text-blue-300'}`}>Valid Thru</p>
 <p className={`font-medium ${expired ? 'text-foreground' : 'text-white'}`}>{policy.end_date}</p>
 </div>
 <div>
 <p className={`text-xs uppercase font-bold ${expired ? 'text-muted-foreground' : 'text-blue-300'}`}>Premium</p>
 <p className={`font-medium ${expired ? 'text-foreground' : 'text-white'}`}>${policy.premium_amount}</p>
 </div>
 </div>
 </div>
 </div>
 </motion.div>
 );
})}
 </div>
 )}
 </div>
 </div>
 </div>
 );
};

export default UnivInsurancePolicy;
