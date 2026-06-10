import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Calendar, User, Phone, CheckCircle2, XCircle, Clock, MoreHorizontal, Plus, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivBooking() {
  const companyId = useCompanyId();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchBookings();
      const channel = supabase.channel('bookings_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_bookings', filter: `company_id=eq.${companyId}` }, () => {
          fetchBookings();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_bookings')
        .select('*')
        .eq('company_id', companyId)
        .order('check_in', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setBookings(data || []);
    } catch (err) {
      if (err.code === '42P01') {
        setBookings([
          { id: '1', booking_reference: 'BK-001', guest_name: 'John Doe', guest_email: 'john@example.com', check_in: '2026-10-15', check_out: '2026-10-20', room_type: 'Deluxe Suite', status: 'Confirmed', total_amount: 1500 },
          { id: '2', booking_reference: 'BK-002', guest_name: 'Jane Smith', guest_email: 'jane@example.com', check_in: '2026-11-01', check_out: '2026-11-05', room_type: 'Standard Room', status: 'Pending', total_amount: 600 },
          { id: '3', booking_reference: 'BK-003', guest_name: 'Robert Brown', guest_email: 'robert@example.com', check_in: '2026-09-10', check_out: '2026-09-15', room_type: 'Ocean View', status: 'Checked Out', total_amount: 1200 }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddBooking = async () => {
    const newBooking = {
      company_id: companyId,
      booking_reference: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      guest_name: 'New Guest',
      check_in: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      check_out: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      room_type: 'Standard Room',
      status: 'Pending',
      total_amount: 0
    };
    try {
      const { error } = await supabase.from('univ_bookings').insert(newBooking);
      if (error) throw error;
      toast.success('Booking created');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to create booking');
    }
  };

  const filtered = bookings.filter(b => 
    `${b.guest_name} ${b.booking_reference} ${b.room_type}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Reservations</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage guest bookings, check-ins, and check-outs.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAddBooking} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> New Booking
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 shrink-0">
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Bookings</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{bookings.length}</h3>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 rounded-xl"><FileText className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Confirmed</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{bookings.filter(b => b.status === 'Confirmed').length}</h3>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Pending</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{bookings.filter(b => b.status === 'Pending').length}</h3>
          </div>
          <div className="p-3 bg-orange-100 dark:bg-orange-500/10 text-orange-600 rounded-xl"><Clock className="w-5 h-5" /></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Checked In</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{bookings.filter(b => b.status === 'Checked In').length}</h3>
          </div>
          <div className="p-3 bg-purple-100 dark:bg-purple-500/10 text-purple-600 rounded-xl"><User className="w-5 h-5" /></div>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search reservations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-4 font-semibold">Ref ID</th>
                <th className="p-4 font-semibold">Guest Name</th>
                <th className="p-4 font-semibold">Dates</th>
                <th className="p-4 font-semibold">Room Type</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((b, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={b.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4 font-mono font-semibold text-primary">
                    {b.booking_reference}
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-foreground flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /> {b.guest_name}</div>
                    {b.guest_email && <div className="text-xs text-muted-foreground mt-0.5">{b.guest_email}</div>}
                  </td>
                  <td className="p-4 text-muted-foreground font-medium">
                    <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {b.check_in} <span className="text-xs font-normal opacity-50">to</span> {b.check_out}</div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {b.room_type || '—'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 w-fit ${
                      b.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      b.status === 'Checked In' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                      b.status === 'Pending' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-muted-foreground hover:text-primary transition-colors p-2"><MoreHorizontal className="w-4 h-4" /></button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
