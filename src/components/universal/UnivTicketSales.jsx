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
 const _p = { ...formData, quantity_sold: 0, id: crypto.randomUUID()};
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _pl = _k.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_ticketsales (${_k.join(', ')}) VALUES (${_pl})`, _v); return { error: null};})();
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
 <motion.div initial={{ opacity: 0, y: -20}} animate={{ opacity: 1, y: 0}} className="mb-8 flex items-center justify-between bg-card p-6 rounded-3xl border border-violet-100">
 <div className="view-header flex items-center gap-4">
 <div className="bg-violet-600 p-3 rounded-2xl text-white -violet-200">
 <Ticket className="w-8 h-8" />
 </div>
 <div>
 <h1 className="text-2xl font-bold text-foreground">Box Office Manager</h1>
 <p className="text-muted-foreground text-sm font-medium">Create and track ticket sales</p>
 </div>
 </div>
 </motion.div>

 <div className="grid lg:grid-cols-3 gap-6">
 <motion.div initial={{ opacity: 0, x: -20}} animate={{ opacity: 1, x: 0}} className="lg:col-span-1 bg-card p-6 rounded-3xl border border-violet-100 h-fit">
 <h2 className="text-lg font-bold mb-5 text-foreground">Create Ticket Tier</h2>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Event Name</label>
 <input type="text" name="event_name" value={formData.event_name} onChange={handleChange} required className="w-full p-2.5 bg-background rounded-xl border border-border focus:ring-2 focus:ring-violet-500 outline-none" />
 </div>
 <div>
 <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Ticket Type</label>
 <div className="relative">
 <Tag className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
 <select name="ticket_type" value={formData.ticket_type} onChange={handleChange} className="w-full pl-9 p-2.5 bg-background rounded-xl border border-border focus:ring-2 focus:ring-violet-500 outline-none font-medium">
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
 <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Price ($)</label>
 <div className="relative">
 <DollarSign className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
 <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} required className="w-full pl-9 p-2.5 bg-background rounded-xl border border-border focus:ring-2 focus:ring-violet-500 outline-none" />
 </div>
 </div>
 <div>
 <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Quantity</label>
 <input type="number" name="quantity_available" value={formData.quantity_available} onChange={handleChange} required className="w-full p-2.5 bg-background rounded-xl border border-border focus:ring-2 focus:ring-violet-500 outline-none" />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Sale Starts</label>
 <input type="date" name="sale_start_date" value={formData.sale_start_date} onChange={handleChange} required className="w-full p-2.5 bg-background rounded-xl border border-border focus:ring-2 focus:ring-violet-500 outline-none text-sm" />
 </div>
 <div>
 <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Sale Ends</label>
 <input type="date" name="sale_end_date" value={formData.sale_end_date} onChange={handleChange} required className="w-full p-2.5 bg-background rounded-xl border border-border focus:ring-2 focus:ring-violet-500 outline-none text-sm" />
 </div>
 </div>
 <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-all mt-2">
 Add Tickets
 </button>
 </form>
 </motion.div>

 <div className="lg:col-span-2">
 {loading ? (
 <div className="flex justify-center py-20"><BarChart3 className="w-10 h-10 text-violet-400 animate-pulse" /></div>
 ) : tickets.length === 0 ? (
 <div className="text-center py-20 bg-card rounded-3xl border border-border text-muted-foreground">No ticket tiers created yet.</div>
 ) : (
 <div className="grid sm:grid-cols-2 gap-4">
 {tickets.map((ticket, index) => {
 const progress = getProgress(ticket.quantity_sold, ticket.quantity_available);
 const isSoldOut = progress >= 100;
 
 return (
 <motion.div key={ticket.id || index} initial={{ opacity: 0, scale: 0.95}} animate={{ opacity: 1, scale: 1}} transition={{ delay: index * 0.05}} className="bg-card rounded-3xl border border-border overflow-hidden relative group">
 <div className="p-5 border-b border-slate-50 bg-gradient-to-r from-slate-50 to-white">
 <div className="flex justify-between items-start mb-2">
 <h3 className="font-bold text-foreground truncate pr-2">{ticket.event_name}</h3>
 <span className={`px-2 py-1 text-[10px] font-black uppercase rounded bg-violet-100 text-violet-700 whitespace-nowrap`}>
 ${ticket.price}
 </span>
 </div>
 <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1"><Tag className="w-3 h-3"/> {ticket.ticket_type}</span>
 </div>

 <div className="p-5">
 <div className="flex justify-between text-sm mb-2">
 <span className="text-muted-foreground font-medium">Sales Progress</span>
 <span className={`font-bold ${isSoldOut ? 'text-red-500' : 'text-violet-600'}`}>
 {ticket.quantity_sold} / {ticket.quantity_available}
 </span>
 </div>
 <div className="w-full bg-muted rounded-full h-2.5 mb-5 overflow-hidden">
 <div className={`h-2.5 rounded-full ${isSoldOut ? 'bg-red-500' : 'bg-violet-500'}`} style={{ width: `${progress}%`}}></div>
 </div>

 <div className="flex items-center justify-between text-xs font-medium text-muted-foreground bg-background p-2 rounded-lg">
 <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {ticket.sale_start_date}</span>
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
