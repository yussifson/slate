import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';


import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { motion, AnimatePresence} from 'framer-motion';
import { Search, Home, Plus, CheckCircle2, Settings, Key, AlertCircle, Edit2, Trash2, XCircle} from 'lucide-react';
import { toast} from 'react-hot-toast';

const EMPTY_FORM = {
 room_number: '',
 room_type: 'Standard',
 floor: '1st Floor',
 price_per_night: '',
 status: 'Available',
 amenities: ''
};

export default function UnivRoom() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');
 const [rooms, setRooms] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [form, setForm] = useState(EMPTY_FORM);
 const [editingId, setEditingId] = useState(null);

 useEffect(() => {
 if (companyId) {
 fetchRooms();
 const channel = supabase.channel('rooms_changes')
 .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_rooms', filter: `company_id=eq.${companyId}`}, () => {
 fetchRooms();
}).subscribe();
 return () => { supabase.removeChannel(channel);};
}
}, [companyId]);

 const fetchRooms = async () => {
 setLoading(true);
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_rooms WHERE company_id = ? ORDER BY room_number ASC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error && error.code !== '42P01') throw error;
 setRooms(data || []);
} catch (err) {
 console.error(err);
 toast.error(err.message || 'Failed to fetch rooms');
} finally {
 setLoading(false);
}
};

 const handleOpenModal = (r = null) => {
 if (r) {
 setEditingId(r.id);
 setForm({
 room_number: r.room_number || '',
 room_type: r.room_type || 'Standard',
 floor: r.floor || '',
 price_per_night: r.price_per_night || '',
 status: r.status || 'Available',
 amenities: r.amenities || ''
});
} else {
 setEditingId(null);
 setForm({
 ...EMPTY_FORM,
 room_number: `R-${Math.floor(100 + Math.random() * 900)}`
});
}
 setIsModalOpen(true);
};

 const handleSave = async (e) => {
 e.preventDefault();
 try {
 const payload = {
 company_id: companyId,
 room_number: form.room_number.trim(),
 room_type: form.room_type.trim(),
 floor: form.floor.trim(),
 price_per_night: Number(form.price_per_night) || 0,
 status: form.status,
 amenities: form.amenities.trim()
};

 if (editingId) {
 const { error} = await (async () => { const _payload = payload; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE univ_rooms SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, editingId]); return { error: null};})();
 if (error) throw error;
 toast.success('Room updated');
} else {
 const { error} = await (async () => {
 const _payload = payload;
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_rooms (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
 toast.success('Room added');
}

 setIsModalOpen(false);
 setForm(EMPTY_FORM);
 fetchRooms();
} catch (err) {
 console.error(err);
 toast.error(err.message || 'Failed to save room');
}
};

 const handleDelete = async (id) => {
 if (!window.confirm('Are you sure you want to delete this room?')) return;
 try {
 await powerSync.execute(`DELETE FROM univ_rooms WHERE id = ?`, [id]);
 const error = null;
 if (error) throw error;
 toast.success('Room deleted');
 fetchRooms();
} catch (err) {
 console.error(err);
 toast.error(err.message || 'Failed to delete room');
}
};

 const filtered = rooms.filter(r => 
 `${r.room_number} ${r.room_type} ${r.status}`.toLowerCase().includes(searchTerm.toLowerCase())
 );

 
 const handleExport = () => {
 const exportData = (typeof records !== 'undefined' ? records : (typeof data !== 'undefined' ? data : []));
 if (!exportData || exportData.length === 0) return alert('No data to export');
 const keys = Object.keys(exportData[0]).filter(k => k !== 'company_id' && k !== 'id');
 const csv = [keys.join(','), ...exportData.map(r => keys.map(k => '"' + (r[k]||'').toString().replace(/"/g, '""') + '"').join(','))].join('\n');
 const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;'});
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url; a.download = 'export.csv'; a.click();
};

 return (
 <div className="flex flex-col h-full bg-background overflow-hidden relative ${view !== 'Default' ? 'hide-default' : ''}">
 <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
 <div>
 <h2 className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">Room Inventory</h2>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Manage rooms, pricing, and current availability status.</p>
 </div>
 <div className="flex gap-3">
 <div className="flex items-center gap-2">

 
 
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-secondary/80 -[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
 Export CSV
 </button>

 <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors -primary/20">
 <Plus className="w-4 h-4" /> Add Room
 </button>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 shrink-0">
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-4 flex items-center justify-between  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 font-medium">Total Rooms</p>
 <h3 className="text-2xl font-semibold text-foreground mt-1 tracking-[-0.02em]">{rooms.length}</h3>
 </div>
 <div className="p-3 bg-blue-100 dark:bg-blue-500/10/10 text-blue-600 rounded-xl"><Home className="w-5 h-5" /></div>
 </div>
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-4 flex items-center justify-between  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 font-medium">Available</p>
 <h3 className="text-2xl font-semibold text-foreground mt-1 tracking-[-0.02em]">{rooms.filter(r => r.status === 'Available').length}</h3>
 </div>
 <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10/10 text-emerald-600 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
 </div>
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-4 flex items-center justify-between  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 font-medium">Occupied</p>
 <h3 className="text-2xl font-semibold text-foreground mt-1 tracking-[-0.02em]">{rooms.filter(r => r.status === 'Occupied').length}</h3>
 </div>
 <div className="p-3 bg-orange-100 dark:bg-orange-500/10/10 text-orange-600 rounded-xl"><Key className="w-5 h-5" /></div>
 </div>
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-4 flex items-center justify-between  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 font-medium">Needs Attention</p>
 <h3 className="text-2xl font-semibold text-foreground mt-1 tracking-[-0.02em]">{rooms.filter(r => ['Cleaning', 'Maintenance'].includes(r.status)).length}</h3>
 </div>
 <div className="p-3 bg-red-100 dark:bg-red-500/10/10 text-red-600 rounded-xl"><AlertCircle className="w-5 h-5" /></div>
 </div>
 </div>

 <div className="flex-1 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
 <div className="relative w-72">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
 <input 
 type="text"
 placeholder="Search rooms..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full h-10 pl-10 pr-4 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
 />
 </div>
 </div>

 <div className="flex-1 overflow-auto custom-scrollbar p-4">
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
 {filtered.map((r, idx) => (
 <motion.div 
 initial={{ opacity: 0, scale: 0.95}}
 animate={{ opacity: 1, scale: 1}}
 transition={{ delay: idx * 0.02}}
 key={r.id} 
 className="bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-4 hover:border-primary/40 transition-colors relative group flex flex-col justify-between"
 >
 <div>
 <div className="flex justify-between items-start mb-3">
 <div className="flex items-center gap-2">
 <span className="font-semibold text-lg text-foreground">{r.room_number}</span>
 </div>
 </div>
 
 <div className="text-sm font-semibold text-[#71717a] dark:text-gray-400 mb-1">{r.room_type}</div>
 <div className="text-xs text-[#71717a] dark:text-gray-400 mb-2 tracking-[0.04em]">{r.floor || 'N/A'} • ${Number(r.price_per_night).toFixed(2)}/nt</div>
 {r.amenities && (
 <div className="text-[11px] text-[#71717a] dark:text-gray-400 italic mb-4 line-clamp-2">
 Amenities: {r.amenities}
 </div>
 )}
 </div>
 
 <div className="flex justify-between items-center pt-2 border-t border-primary/40 shrink-0">
 <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-lg border-[0.5px] border-black/9 dark:border-white/8 flex items-center gap-2 ${
 r.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
 r.status === 'Occupied' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
 r.status === 'Cleaning' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
 'bg-red-50 text-red-700 border-red-200'
}`}>
 {r.status}
 </span>
 
 <div className="flex items-center gap-2">
 <button onClick={() => handleOpenModal(r)} className="p-1 hover:bg-muted rounded-md text-[#71717a] dark:text-gray-400 hover:text-primary transition-colors">
 <Edit2 className="w-3.5 h-3.5" />
 </button>
 <button onClick={() => handleDelete(r.id)} className="p-1 hover:bg-muted rounded-md text-[#71717a] dark:text-gray-400 hover:text-destructive transition-colors">
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 </motion.div>
 ))}
 </div>

 {filtered.length === 0 && (
 <div className="text-center py-12 text-[#71717a] dark:text-gray-400">
 <Home className="w-12 h-12 mx-auto mb-3 opacity-20" />
 <p>No rooms found.</p>
 </div>
 )}
 </div>
 </div>

 <AnimatePresence>
 {isModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
 <motion.div
 initial={{ opacity: 0, scale: 0.95}}
 animate={{ opacity: 1, scale: 1}}
 exit={{ opacity: 0, scale: 0.95}}
 className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl w-full max-w-md overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 <div className="flex items-center justify-between p-4 border-b border-primary/40">
 <h3 className="font-semibold text-foreground">{editingId ? 'Edit Room' : 'Add Room'}</h3>
 <button onClick={() => setIsModalOpen(false)} className="text-[#71717a] dark:text-gray-400 hover:text-foreground">
 <XCircle className="w-5 h-5" />
 </button>
 </div>
 <form onSubmit={handleSave} className="p-4 space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-medium text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">Room Number</label>
 <input required value={form.room_number} onChange={e => setForm({...form, room_number: e.target.value})} className="w-full p-2 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm" />
 </div>
 <div>
 <label className="block text-xs font-medium text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">Room Type</label>
 <input required value={form.room_type} onChange={e => setForm({...form, room_type: e.target.value})} className="w-full p-2 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm" placeholder="e.g. Deluxe Suite" />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-medium text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">Floor</label>
 <input value={form.floor} onChange={e => setForm({...form, floor: e.target.value})} className="w-full p-2 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm" placeholder="e.g. 2nd Floor" />
 </div>
 <div>
 <label className="block text-xs font-medium text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">Price per Night</label>
 <input type="number" required value={form.price_per_night} onChange={e => setForm({...form, price_per_night: e.target.value})} className="w-full p-2 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm" />
 </div>
 </div>

 <div>
 <label className="block text-xs font-medium text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">Status</label>
 <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full p-2 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm">
 <option value="Available">Available</option>
 <option value="Occupied">Occupied</option>
 <option value="Cleaning">Cleaning</option>
 <option value="Maintenance">Maintenance</option>
 </select>
 </div>

 <div>
 <label className="block text-xs font-medium text-[#71717a] dark:text-gray-400 mb-1 tracking-[0.04em]">Amenities</label>
 <input value={form.amenities} onChange={e => setForm({...form, amenities: e.target.value})} className="w-full p-2 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm" placeholder="e.g. Wi-Fi, King Bed, Ocean View" />
 </div>

 <div className="pt-4 flex justify-end gap-2">
 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-[#71717a] dark:text-gray-400 hover:bg-muted rounded-xl">Cancel</button>
 <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90">Save Room</button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
}
