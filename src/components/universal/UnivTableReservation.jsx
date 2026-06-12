import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Utensils, Users, Clock, Hash, CheckCircle2, User } from 'lucide-react';

import { supabase } from "@/api/supabaseClient";

const UnivTableReservation = () => {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    guest_name: '',
    table_number: '',
    party_size: '',
    reservation_time: '',
    special_requests: '',
    status: 'Confirmed'
  });

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const __res = await powerSync.execute(`SELECT * FROM univ_tablereservation WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
      const error = null;
      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await (async () => {
        const _p = { ...formData, company_id: companyId };
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _pl = _k.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO univ_tablereservation (${_k.join(', ')}) VALUES (${_pl})`, _v);
      })();
      if (error) throw error;
      setFormData({
        guest_name: '',
        table_number: '',
        party_size: '',
        reservation_time: '',
        special_requests: '',
        status: 'Confirmed'
      });
      fetchReservations();
    } catch (error) {
      console.error('Error adding reservation:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Seated': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Completed': return 'bg-muted text-foreground border-border';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-stone-50 min-h-screen font-serif ${view !== 'Default' ? 'hide-default' : ''}">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-stone-800 flex items-center justify-center gap-3">
          <Utensils className="w-10 h-10 text-stone-600" />
          Maitre D' Planner
        </h1>
        <p className="text-stone-500 mt-2 font-sans">Elegant dining room management</p>
      </motion.div>

      <div className="view-header grid lg:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 bg-card p-8 rounded-xl shadow-md border border-stone-200 h-fit">
          <h2 className="text-xl font-bold mb-6 text-stone-800 border-b border-stone-100 pb-3 font-sans">Book a Table</h2>
          <form onSubmit={handleSubmit} className="space-y-5 font-sans">
            <div>
              <label className="block text-sm font-semibold text-stone-600 mb-1">Guest Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input type="text" name="guest_name" value={formData.guest_name} onChange={handleChange} required className="w-full pl-9 p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-400 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-stone-600 mb-1">Table No.</label>
                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input type="text" name="table_number" value={formData.table_number} onChange={handleChange} required className="w-full pl-9 p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-400 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-600 mb-1">Party Size</label>
                <div className="relative">
                  <Users className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input type="number" name="party_size" value={formData.party_size} onChange={handleChange} required min="1" className="w-full pl-9 p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-400 outline-none" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-600 mb-1">Date & Time</label>
              <input type="datetime-local" name="reservation_time" value={formData.reservation_time} onChange={handleChange} required className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-400 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-600 mb-1">Special Requests</label>
              <textarea name="special_requests" value={formData.special_requests} onChange={handleChange} rows="2" className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-400 outline-none"></textarea>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-600 mb-1">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-400 outline-none">
                <option value="Confirmed">Confirmed</option>
                <option value="Seated">Seated</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-stone-800 hover:bg-stone-700 text-stone-50 font-bold py-3 rounded-lg transition-colors mt-2">
              Reserve Table
            </button>
          </form>
        </motion.div>

        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex justify-center py-20"><Utensils className="w-10 h-10 text-stone-400 animate-pulse" /></div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-xl shadow-sm border border-stone-200 text-stone-400 font-sans">No reservations for today.</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 font-sans">
              {reservations.map((res, index) => (
                <motion.div key={res.id || index} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} className="bg-card p-5 rounded-xl shadow-sm border border-stone-200 relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-lg border-b border-l ${getStatusColor(res.status)}`}>
                    {res.status}
                  </div>
                  
                  <div className="flex items-center gap-3 mb-4 mt-2">
                    <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center border border-stone-200 shrink-0">
                      <span className="font-serif text-lg font-bold text-stone-700">{res.table_number}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-stone-800 leading-tight">{res.guest_name}</h3>
                      <p className="text-xs text-stone-500 font-medium flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3"/> Party of {res.party_size}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-stone-600 bg-stone-50 p-3 rounded-lg border border-stone-100">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-stone-400" />
                      <span>{new Date(res.reservation_time).toLocaleString([], {weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    {res.special_requests && (
                      <div className="pt-2 border-t border-stone-200 mt-2 italic text-stone-500">
                        "{res.special_requests}"
                      </div>
                    )}
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

export default UnivTableReservation;
