import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, User, Phone, CheckCircle2, XCircle, Clock, MoreHorizontal, Plus, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = {
  booking_reference: '',
  guest_name: '',
  guest_email: '',
  guest_phone: '',
  check_in: '',
  check_out: '',
  room_type: 'Standard',
  number_of_guests: 1,
  status: 'Pending',
  total_amount: 0
};

export default function UnivBooking() {
  const companyId = useCompanyId();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

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
        .select('*').eq('company_id', companyId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setBookings(data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        company_id: companyId,
        booking_reference: form.booking_reference || `BK-${Math.floor(1000 + Math.random() * 9000)}`,
        guest_name: form.guest_name,
        guest_email: form.guest_email || null,
        guest_phone: form.guest_phone || null,
        check_in: form.check_in || null,
        check_out: form.check_out || null,
        room_type: form.room_type,
        number_of_guests: Number(form.number_of_guests) || 1,
        status: form.status,
        total_amount: Number(form.total_amount) || 0
      };

      const { error } = await supabase.from('univ_bookings').insert(payload);
      if (error) throw error;
      toast.success('Booking created');
      setIsModalOpen(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to create booking');
    }
  };

  const filtered = bookings.filter(b => 
    `${b.guest_name} ${b.booking_reference} ${b.status} ${b.room_type}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Reservations</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage guest bookings, check-ins, and check-outs.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
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
          <div className="p-3 bg-amber-100 dark:bg-amber-500/10 text-amber-600 rounded-xl"><Clock className="w-5 h-5" /></div>
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
              placeholder="Search bookings..."
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
                <th className="p-4 font-semibold">Guest Name</th>
                <th className="p-4 font-semibold">Reference</th>
                <th className="p-4 font-semibold">Dates</th>
                <th className="p-4 font-semibold">Room & Guests</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Amount</th>
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
                  <td className="p-4">
                    <div className="font-bold text-foreground">{b.guest_name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                      {b.guest_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {b.guest_phone}</span>}
                    </div>
                  </td>
                  <td className="p-4 font-mono text-muted-foreground">{b.booking_reference}</td>
                  <td className="p-4">
                    <div className="text-foreground flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-emerald-500" /> In: {new Date(b.check_in).toLocaleDateString()}</div>
                    <div className="text-muted-foreground flex items-center gap-2 mt-1"><Calendar className="w-3.5 h-3.5 text-rose-500" /> Out: {new Date(b.check_out).toLocaleDateString()}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-foreground">{b.room_type}</div>
                    <div className="text-xs text-muted-foreground mt-1">{b.number_of_guests} Guest(s)</div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      b.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' :
                      b.status === 'Checked In' ? 'bg-purple-100 text-purple-700' :
                      b.status === 'Checked Out' ? 'bg-slate-100 text-slate-700' :
                      b.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {b.status === 'Confirmed' ? <CheckCircle2 className="w-3 h-3" /> :
                       b.status === 'Cancelled' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {b.status}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-emerald-600 text-right">
                    ${Number(b.total_amount).toFixed(2)}
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

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-foreground">New Booking</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Guest Name</label>
                    <input required value={form.guest_name} onChange={e => setForm({...form, guest_name: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Booking Ref (Optional)</label>
                    <input value={form.booking_reference} onChange={e => setForm({...form, booking_reference: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" placeholder="Auto-generated if empty" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Guest Email</label>
                    <input type="email" value={form.guest_email} onChange={e => setForm({...form, guest_email: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Guest Phone</label>
                    <input value={form.guest_phone} onChange={e => setForm({...form, guest_phone: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Check In</label>
                    <input type="date" required value={form.check_in} onChange={e => setForm({...form, check_in: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Check Out</label>
                    <input type="date" required value={form.check_out} onChange={e => setForm({...form, check_out: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Room Type</label>
                    <input required value={form.room_type} onChange={e => setForm({...form, room_type: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Guests</label>
                    <input type="number" min="1" required value={form.number_of_guests} onChange={e => setForm({...form, number_of_guests: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm">
                      <option>Pending</option>
                      <option>Confirmed</option>
                      <option>Checked In</option>
                      <option>Checked Out</option>
                      <option>Cancelled</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Total Amount</label>
                  <input type="number" step="any" value={form.total_amount} onChange={e => setForm({...form, total_amount: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90">Save Booking</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
