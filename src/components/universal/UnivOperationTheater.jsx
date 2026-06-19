import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Scissors, User, Clock, Activity, Settings, CalendarDays } from 'lucide-react';

import { supabase } from "@/api/supabaseClient";

const UnivOperationTheater = () => {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');

  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    patient_name: '',
    procedure_name: '',
    surgeon: '',
    operating_room: '',
    start_time: '',
    end_time: '',
    status: 'Scheduled'
  });

  useEffect(() => {
    fetchOperations();
  }, []);

  const fetchOperations = async () => {
    try {
      const __res = await powerSync.execute(`SELECT * FROM univ_operationtheater WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
      const error = null;
      if (error) throw error;
      setOperations(data || []);
    } catch (error) {
      console.error('Error fetching operations:', error);
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
        const _payload = { ...formData, id: crypto.randomUUID(), company_id: companyId };
        const _keys = Object.keys(_payload);
        const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _plhdr = _keys.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO univ_operationtheater (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null }; })();
      if (error) throw error;
      setFormData({
        patient_name: '',
        procedure_name: '',
        surgeon: '',
        operating_room: '',
        start_time: '',
        end_time: '',
        status: 'Scheduled'
      });
      fetchOperations();
    } catch (error) {
      console.error('Error adding operation:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'in progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-slate-900 min-h-screen text-slate-100 ${view !== 'Default' ? 'hide-default' : ''}">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="view-header text-3xl font-semibold flex items-center gap-3 text-white tracking-[-0.02em]">
            <Scissors className="w-8 h-8 text-teal-400" />
            Operation Theater Manager
          </h1>
          <p className="text-[#71717a] dark:text-gray-400 mt-1">Schedule and monitor surgical procedures</p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 bg-slate-800 p-6 rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-teal-400">
            <Settings className="w-5 h-5" /> Schedule Procedure
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Patient Name</label>
              <input type="text" name="patient_name" value={formData.patient_name} onChange={handleChange} required className="w-full p-2.5 bg-slate-900 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:border-teal-500 outline-none text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Procedure</label>
              <input type="text" name="procedure_name" value={formData.procedure_name} onChange={handleChange} required className="w-full p-2.5 bg-slate-900 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:border-teal-500 outline-none text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Surgeon</label>
              <input type="text" name="surgeon" value={formData.surgeon} onChange={handleChange} required className="w-full p-2.5 bg-slate-900 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:border-teal-500 outline-none text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Operating Room</label>
                <input type="text" name="operating_room" value={formData.operating_room} onChange={handleChange} required className="w-full p-2.5 bg-slate-900 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:border-teal-500 outline-none text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2.5 bg-slate-900 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:border-teal-500 outline-none text-white">
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Start Time</label>
                <input type="datetime-local" name="start_time" value={formData.start_time} onChange={handleChange} className="w-full p-2.5 bg-slate-900 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:border-teal-500 outline-none text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">End Time</label>
                <input type="datetime-local" name="end_time" value={formData.end_time} onChange={handleChange} className="w-full p-2.5 bg-slate-900 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus:border-teal-500 outline-none text-white text-sm" />
              </div>
            </div>
            <button type="submit" className="w-full bg-teal-600 hover:bg-teal-500 text-white font-medium py-3 rounded-xl transition-colors mt-4">
              Save Schedule
            </button>
          </form>
        </motion.div>

        <div className="lg:col-span-2 grid gap-4">
          {loading ? (
            <div className="text-center py-20"><Activity className="w-10 h-10 text-teal-500 animate-spin mx-auto" /></div>
          ) : operations.length === 0 ? (
            <div className="text-center py-20 bg-slate-800 rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-[#71717a] dark:text-gray-400">No operations scheduled.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {operations.map((op, index) => (
                <motion.div key={op.id || index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-slate-800 p-5 rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex flex-col h-full relative overflow-hidden">
                  <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-semibold rounded-md-bl-lg ${getStatusColor(op.status)}`}>
                    {op.status}
                  </div>
                  <h3 className="text-xl font-semibold text-teal-300 mb-1 mt-2">{op.procedure_name}</h3>
                  <div className="text-slate-300 flex items-center gap-2 mb-4"><User className="w-4 h-4 text-[#71717a] dark:text-gray-400" /> Patient: {op.patient_name}</div>
                  
                  <div className="space-y-2 mt-auto text-sm text-[#71717a] dark:text-gray-400 bg-slate-900/50 p-4 rounded-md-xl">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2"><User className="w-4 h-4" /> Surgeon:</span>
                      <span className="text-slate-200">{op.surgeon}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> OR:</span>
                      <span className="text-slate-200">{op.operating_room}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-primary/40">
                      <span className="flex items-center gap-2 text-teal-400"><Clock className="w-4 h-4" /> Time:</span>
                      <span className="text-slate-200">
                        {new Date(op.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || 'TBD'} - 
                        {new Date(op.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || 'TBD'}
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

export default UnivOperationTheater;
