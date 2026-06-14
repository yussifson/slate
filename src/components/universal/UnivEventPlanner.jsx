import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { CalendarDays, Users, DollarSign, MapPin, Star, Plus} from 'lucide-react';

import { supabase} from "@/api/supabaseClient";

const UnivEventPlanner = () => {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');

 const [events, setEvents] = useState([]);
 const [loading, setLoading] = useState(true);
 const [formData, setFormData] = useState({
 event_name: '',
 organizer: '',
 event_date: '',
 location: '',
 expected_attendees: '',
 budget: '',
 status: 'Planning'
});

 useEffect(() => {
 fetchEvents();
}, []);

 const fetchEvents = async () => {
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_eventplanner WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error) throw error;
 setEvents(data || []);
} catch (error) {
 console.error('Error fetching events:', error);
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
 await powerSync.execute(`INSERT INTO univ_eventplanner (${_k.join(', ')}) VALUES (${_pl})`, _v); return { error: null};})();
 if (error) throw error;
 setFormData({
 event_name: '',
 organizer: '',
 event_date: '',
 location: '',
 expected_attendees: '',
 budget: '',
 status: 'Planning'
});
 fetchEvents();
} catch (error) {
 console.error('Error adding event:', error);
}
};

 const getStatusColor = (status) => {
 switch (status) {
 case 'Confirmed': return 'bg-purple-100 text-purple-700 border-purple-200';
 case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
 case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
 default: return 'bg-amber-100 text-amber-700 border-amber-200';
}
};

 return (
 <div className="p-6 max-w-7xl mx-auto bg-fuchsia-50/30 min-h-screen font-sans ${view !== 'Default' ? 'hide-default' : ''}">
 <motion.div initial={{ opacity: 0, y: -20}} animate={{ opacity: 1, y: 0}} className="mb-8">
 <h1 className="text-4xl font-extrabold text-foreground flex items-center gap-3">
 <Star className="w-10 h-10 text-fuchsia-500 fill-fuchsia-500/20" />
 Event Master
 </h1>
 <p className="text-muted-foreground mt-2 text-lg">Orchestrate perfect events from start to finish</p>
 </motion.div>

 <div className="view-header grid lg:grid-cols-12 gap-8">
 <motion.div initial={{ opacity: 0, x: -20}} animate={{ opacity: 1, x: 0}} className="lg:col-span-4 bg-card p-6 rounded-3xl border border-border">
 <h2 className="text-2xl font-bold mb-6 text-foreground">New Event</h2>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-muted-foreground mb-1">Event Name</label>
 <input type="text" name="event_name" value={formData.event_name} onChange={handleChange} required className="w-full p-3 bg-background rounded-xl border-none focus:ring-2 focus:ring-fuchsia-400 outline-none" />
 </div>
 <div>
 <label className="block text-sm font-medium text-muted-foreground mb-1">Organizer / Client</label>
 <input type="text" name="organizer" value={formData.organizer} onChange={handleChange} required className="w-full p-3 bg-background rounded-xl border-none focus:ring-2 focus:ring-fuchsia-400 outline-none" />
 </div>
 <div>
 <label className="block text-sm font-medium text-muted-foreground mb-1">Date & Time</label>
 <input type="datetime-local" name="event_date" value={formData.event_date} onChange={handleChange} required className="w-full p-3 bg-background rounded-xl border-none focus:ring-2 focus:ring-fuchsia-400 outline-none text-foreground" />
 </div>
 <div>
 <label className="block text-sm font-medium text-muted-foreground mb-1">Location</label>
 <div className="relative">
 <MapPin className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
 <input type="text" name="location" value={formData.location} onChange={handleChange} required className="w-full pl-10 p-3 bg-background rounded-xl border-none focus:ring-2 focus:ring-fuchsia-400 outline-none" />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-muted-foreground mb-1">Attendees</label>
 <div className="relative">
 <Users className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
 <input type="number" name="expected_attendees" value={formData.expected_attendees} onChange={handleChange} className="w-full pl-10 p-3 bg-background rounded-xl border-none focus:ring-2 focus:ring-fuchsia-400 outline-none" />
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-muted-foreground mb-1">Budget</label>
 <div className="relative">
 <DollarSign className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
 <input type="number" name="budget" value={formData.budget} onChange={handleChange} className="w-full pl-10 p-3 bg-background rounded-xl border-none focus:ring-2 focus:ring-fuchsia-400 outline-none" />
 </div>
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
 <select name="status" value={formData.status} onChange={handleChange} className="w-full p-3 bg-background rounded-xl border-none focus:ring-2 focus:ring-fuchsia-400 outline-none font-medium">
 <option value="Planning">Planning</option>
 <option value="Confirmed">Confirmed</option>
 <option value="Completed">Completed</option>
 <option value="Cancelled">Cancelled</option>
 </select>
 </div>
 <button type="submit" className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-4 rounded-xl transition-colors mt-4">
 Create Event
 </button>
 </form>
 </motion.div>

 <div className="lg:col-span-8">
 {loading ? (
 <div className="flex justify-center py-20"><CalendarDays className="w-12 h-12 text-fuchsia-300 animate-bounce" /></div>
 ) : events.length === 0 ? (
 <div className="text-center py-20 bg-card rounded-3xl border border-border text-muted-foreground">No events planned yet. Let's get started!</div>
 ) : (
 <div className="grid md:grid-cols-2 gap-6">
 {events.map((event, index) => (
 <motion.div key={event.id || index} initial={{ opacity: 0, scale: 0.95}} animate={{ opacity: 1, scale: 1}} transition={{ delay: index * 0.05}} className="bg-card p-6 rounded-3xl border border-border transition-all group">
 <div className="flex justify-between items-start mb-4">
 <h3 className="text-xl font-bold text-foreground leading-tight pr-4">{event.event_name}</h3>
 <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(event.status)}`}>{event.status}</span>
 </div>
 
 <div className="space-y-3 mb-6">
 <p className="flex items-center text-muted-foreground text-sm">
 <CalendarDays className="w-4 h-4 mr-2 text-fuchsia-400" /> 
 {new Date(event.event_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short'})}
 </p>
 <p className="flex items-center text-muted-foreground text-sm">
 <MapPin className="w-4 h-4 mr-2 text-fuchsia-400" /> {event.location}
 </p>
 </div>

 <div className="bg-background rounded-2xl p-4 grid grid-cols-2 gap-4">
 <div>
 <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Organizer</p>
 <p className="font-medium text-foreground text-sm truncate">{event.organizer}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Budget</p>
 <p className="font-bold text-emerald-600">${event.budget || '0'}</p>
 </div>
 <div className="col-span-2 border-t border-border pt-3 flex justify-between items-center">
 <span className="text-xs text-muted-foreground font-semibold uppercase">Est. Attendance</span>
 <span className="font-bold text-foreground flex items-center bg-card px-3 py-1 rounded-full border border-border ">
 <Users className="w-4 h-4 mr-1 text-muted-foreground" /> {event.expected_attendees || '0'}
 </span>
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

export default UnivEventPlanner;
