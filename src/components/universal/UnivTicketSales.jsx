import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { Ticket, Calendar, DollarSign, BarChart3, Tag} from 'lucide-react';

import { supabase} from "@/api/supabaseClient";

const UnivTicketSales = () => {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');

 const [tickets, setTickets] = useState([]);
 const [loading, setLoading] = useState(true);
 const [formData, setFormData] = useState({
 event_name: '',
 ticket_type: 'General Admission',
 price: '',
 quantity_available: '',
 quantity_sold: 0,
 sale_start_date: '',
 sale_end_date: ''
});

 useEffect(() => {
 fetchTickets();
}, []);

 const fetchTickets = async () => {
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_ticketsales WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error) throw error;
 setTickets(data || []);
} catch (error) {
 console.error('Error fetching tickets:', error);
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
 const _payload = { ...formData, quantity_sold: 0, id: crypto.randomUUID()};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_ticketsales (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
 setFormData({
 event_name: '',
 ticket_type: 'General Admission',
 price: '',
 quantity_available: '',
 quantity_sold: 0,
 sale_start_date: '',
 sale_end_date: ''
});
 fetchTickets();
} catch (error) {
 console.error('Error adding ticket:', error);
}
};

 const getProgress = (sold, available) => {
 if (!available || available == 0) return 0;
 return Math.min(100, Math.round((sold / available) * 100));
};

 return (
 <div className="p-6 max-w-7xl mx-auto bg-violet-50/50 min-h-screen ${view !== 'Default' ? 'hide-default' : ''}">
 <motion.div initial={{ opacity: 0, y: -20}} animate={{ opacity: 1, y: 0}} className="mb-8 flex items-center justify-between bg-card p-6 rounded-md-3xl border-[0.5px] border-black/9 dark:border-white/8 border-violet-100 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="view-header flex items-center gap-4">
 <div className="bg-violet-600 p-3 rounded-md-2xl text-white -violet-200">
 <Ticket className="w-8 h-8" />
 </div>
 <div>
 <h1 className="text-2xl font-semibold text-foreground tracking-[-0.02em]">Box Office Manager</h1>
 <p className="text-[#71717a] dark:text-gray-400 text-sm font-medium">Create and track ticket sales</p>
 </div>
 </div>
 </motion.div>

 <div className="grid lg:grid-cols-3 gap-6">
 <motion.div initial={{ opacity: 0, x: -20}} animate={{ opacity: 1, x: 0}} className="lg:col-span-1 bg-card p-6 rounded-md-3xl border-[0.5px] border-black/9 dark:border-white/8 border-violet-100 h-fit hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-semibold mb-5 text-foreground">Create Ticket Tier</h2>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Event Name</label>
 <input type="text" name="event_name" value={formData.event_name} onChange={handleChange} required className="w-full p-2.5 bg-background rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 focus:ring-2 focus:ring-violet-500 outline-none" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Ticket Type</label>
 <div className="relative">
 <Tag className="w-4 h-4 absolute left-3 top-3 text-[#71717a] dark:text-gray-400" />
 <select name="ticket_type" value={formData.ticket_type} onChange={handleChange} className="w-full pl-9 p-2.5 bg-background rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 focus:ring-2 focus:ring-violet-500 outline-none font-medium">
 <option value="General Admission">General Admission</option>
 <option value="VIP">VIP</option>
 <option value="Early Bird">Early Bird</option>
 <option value="Student">Student</option>
 <option value="Backstage Pass">Backstage Pass</option>
 </select>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Price ($)</label>
 <div className="relative">
 <DollarSign className="w-4 h-4 absolute left-3 top-3 text-[#71717a] dark:text-gray-400" />
 <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} required className="w-full pl-9 p-2.5 bg-background rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 focus:ring-2 focus:ring-violet-500 outline-none" />
 </div>
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Quantity</label>
 <input type="number" name="quantity_available" value={formData.quantity_available} onChange={handleChange} required className="w-full p-2.5 bg-background rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 focus:ring-2 focus:ring-violet-500 outline-none" />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Sale Starts</label>
 <input type="date" name="sale_start_date" value={formData.sale_start_date} onChange={handleChange} required className="w-full p-2.5 bg-background rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 focus:ring-2 focus:ring-violet-500 outline-none text-sm" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Sale Ends</label>
 <input type="date" name="sale_end_date" value={formData.sale_end_date} onChange={handleChange} required className="w-full p-2.5 bg-background rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 focus:ring-2 focus:ring-violet-500 outline-none text-sm" />
 </div>
 </div>
 <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-md-xl transition-all mt-2">
 Add Tickets
 </button>
 </form>
 </motion.div>

 <div className="lg:col-span-2">
 {loading ? (
 <div className="flex justify-center py-20"><BarChart3 className="w-10 h-10 text-violet-400 animate-pulse" /></div>
 ) : tickets.length === 0 ? (
 <div className="text-center py-20 bg-card rounded-md-3xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-[#71717a] dark:text-gray-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">No ticket tiers created yet.</div>
 ) : (
 <div className="grid sm:grid-cols-2 gap-4">
 {tickets.map((ticket, index) => {
 const progress = getProgress(ticket.quantity_sold, ticket.quantity_available);
 const isSoldOut = progress >= 100;
 
 return (
 <motion.div key={ticket.id || index} initial={{ opacity: 0, scale: 0.95}} animate={{ opacity: 1, scale: 1}} transition={{ delay: index * 0.05}} className="bg-card rounded-md-3xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden relative group hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-5 border-b border-primary/40 bg-gradient-to-r from-slate-50 to-white">
 <div className="flex justify-between items-start mb-2">
 <h3 className="font-semibold text-foreground truncate pr-2">{ticket.event_name}</h3>
 <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-md bg-violet-100 text-violet-700 whitespace-nowrap`}>
 ${ticket.price}
 </span>
 </div>
 <span className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase flex items-center gap-2 tracking-[0.04em]"><Tag className="w-3 h-3"/> {ticket.ticket_type}</span>
 </div>

 <div className="p-5">
 <div className="flex justify-between text-sm mb-2">
 <span className="text-[#71717a] dark:text-gray-400 font-medium">Sales Progress</span>
 <span className={`font-semibold ${isSoldOut ? 'text-red-500' : 'text-violet-600'}`}>
 {ticket.quantity_sold} / {ticket.quantity_available}
 </span>
 </div>
 <div className="w-full bg-muted rounded-md-full h-2.5 mb-5 overflow-hidden">
 <div className={`h-2.5 rounded-md-full ${isSoldOut ? 'bg-red-500/10' : 'bg-violet-500'}`} style={{ width: `${progress}%`}}></div>
 </div>

 <div className="flex items-center justify-between text-xs font-medium text-[#71717a] dark:text-gray-400 bg-background p-2 rounded-xl tracking-[0.04em]">
 <span className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {ticket.sale_start_date}</span>
 <span>to</span>
 <span>{ticket.sale_end_date}</span>
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

export default UnivTicketSales;
