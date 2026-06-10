import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Home, Plus, CheckCircle2, MoreHorizontal, Settings, Key, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivRoom() {
  const companyId = useCompanyId();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchRooms();
      const channel = supabase.channel('rooms_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_rooms', filter: `company_id=eq.${companyId}` }, () => {
          fetchRooms();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_rooms')
        .select('*')
        .eq('company_id', companyId)
        .order('room_number', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setRooms(data || []);
    } catch (err) {
      if (err.code === '42P01') {
        setRooms([
          { id: '1', room_number: '101', room_type: 'Standard Room', floor: '1st Floor', price_per_night: 150, status: 'Available' },
          { id: '2', room_number: '102', room_type: 'Standard Room', floor: '1st Floor', price_per_night: 150, status: 'Occupied' },
          { id: '3', room_number: '201', room_type: 'Deluxe Suite', floor: '2nd Floor', price_per_night: 350, status: 'Cleaning' },
          { id: '4', room_number: 'PH1', room_type: 'Penthouse', floor: 'Top Floor', price_per_night: 800, status: 'Maintenance' }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async () => {
    const newRoom = {
      company_id: companyId,
      room_number: `R-${Math.floor(100 + Math.random() * 900)}`,
      room_type: 'Standard',
      floor: 'Ground',
      price_per_night: 100,
      status: 'Available'
    };
    try {
      const { error } = await supabase.from('univ_rooms').insert(newRoom);
      if (error) throw error;
      toast.success('Room added');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to add room');
    }
  };

  const filtered = rooms.filter(r => 
    `${r.room_number} ${r.room_type} ${r.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Room Inventory</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage rooms, pricing, and current availability status.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAddRoom} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Room
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 shrink-0">
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Rooms</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{rooms.length}</h3>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 rounded-xl"><Home className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Available</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{rooms.filter(r => r.status === 'Available').length}</h3>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Occupied</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{rooms.filter(r => r.status === 'Occupied').length}</h3>
          </div>
          <div className="p-3 bg-orange-100 dark:bg-orange-500/10 text-orange-600 rounded-xl"><Key className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Needs Attention</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{rooms.filter(r => ['Cleaning', 'Maintenance'].includes(r.status)).length}</h3>
          </div>
          <div className="p-3 bg-red-100 dark:bg-red-500/10 text-red-600 rounded-xl"><AlertCircle className="w-5 h-5" /></div>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((r, idx) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.02 }}
                key={r.id} 
                className="bg-background border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors shadow-sm relative group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                   <div className="flex items-center gap-2">
                     <span className="font-bold text-lg text-foreground">{r.room_number}</span>
                   </div>
                   <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"><Settings className="w-4 h-4" /></button>
                </div>
                
                <div className="text-sm font-semibold text-muted-foreground mb-1">{r.room_type}</div>
                <div className="text-xs text-muted-foreground mb-4">{r.floor || 'N/A'} • ${r.price_per_night}/nt</div>
                
                <div className="flex justify-between items-center">
                  <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 ${
                    r.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                    r.status === 'Occupied' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                    r.status === 'Cleaning' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                    'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {r.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
               <Home className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No rooms found.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
