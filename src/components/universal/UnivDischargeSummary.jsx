import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { FileText, Calendar, Pill, CheckCircle2, User, Home } from 'lucide-react';

import { supabase } from "@/api/supabaseClient";

const UnivDischargeSummary = () => {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');

  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    patient_name: '',
    admission_date: '',
    discharge_date: '',
    final_diagnosis: '',
    treatment_given: '',
    discharge_medications: '',
    follow_up_instructions: ''
  });

  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    try {
      const __res = await powerSync.execute(`SELECT * FROM univ_dischargesummary WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
      const error = null;
      if (error) throw error;
      setSummaries(data || []);
    } catch (error) {
      console.error('Error fetching summaries:', error);
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
        const _p = { ...formData, id: crypto.randomUUID(), company_id: companyId };
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _pl = _k.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO univ_dischargesummary (${_k.join(', ')}) VALUES (${_pl})`, _v); return { error: null }; })();
      if (error) throw error;
      setFormData({
        patient_name: '',
        admission_date: '',
        discharge_date: '',
        final_diagnosis: '',
        treatment_given: '',
        discharge_medications: '',
        follow_up_instructions: ''
      });
      fetchSummaries();
    } catch (error) {
      console.error('Error adding summary:', error);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-muted min-h-screen ${view !== 'Default' ? 'hide-default' : ''}">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center bg-card p-8 rounded-3xl shadow-sm border border-border">
        <h1 className="text-4xl font-extrabold text-foreground flex items-center justify-center gap-3">
          <Home className="w-10 h-10 text-emerald-500" />
          Discharge Summaries
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Patient transition and aftercare planning</p>
      </motion.div>

      <div className="view-header grid md:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card p-6 rounded-3xl shadow-sm border border-border">
          <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-500" /> New Summary
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Patient Name</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
                <input type="text" name="patient_name" value={formData.patient_name} onChange={handleChange} required className="w-full pl-10 p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Admission Date</label>
                <input type="date" name="admission_date" value={formData.admission_date} onChange={handleChange} required className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Discharge Date</label>
                <input type="date" name="discharge_date" value={formData.discharge_date} onChange={handleChange} required className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Final Diagnosis</label>
              <input type="text" name="final_diagnosis" value={formData.final_diagnosis} onChange={handleChange} required className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Treatment Given</label>
              <textarea name="treatment_given" value={formData.treatment_given} onChange={handleChange} rows="2" className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"></textarea>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Discharge Meds</label>
              <textarea name="discharge_medications" value={formData.discharge_medications} onChange={handleChange} rows="2" className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"></textarea>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Follow-up Instructions</label>
              <textarea name="follow_up_instructions" value={formData.follow_up_instructions} onChange={handleChange} rows="2" className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"></textarea>
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg">
              <CheckCircle2 className="w-6 h-6" /> Finalize Discharge
            </button>
          </form>
        </motion.div>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-20"><Activity className="w-10 h-10 text-emerald-500 animate-spin mx-auto" /></div>
          ) : summaries.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-border text-muted-foreground">No summaries found.</div>
          ) : (
            summaries.map((summary, index) => (
              <motion.div key={summary.id || index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-card p-6 rounded-3xl shadow-sm border border-border relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-emerald-400"></div>
                <h3 className="text-xl font-bold text-foreground mb-2 pl-2">{summary.patient_name}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4 pl-2 font-medium">
                  <span className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full"><Calendar className="w-4 h-4" /> Admitted: {summary.admission_date}</span>
                  <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full"><Home className="w-4 h-4" /> Discharged: {summary.discharge_date}</span>
                </div>
                
                <div className="space-y-3 pl-2">
                  <div className="bg-background p-3 rounded-xl border border-border">
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Final Diagnosis</span>
                    <p className="text-foreground font-medium mt-1">{summary.final_diagnosis}</p>
                  </div>
                  {(summary.treatment_given || summary.discharge_medications) && (
                    <div className="grid grid-cols-2 gap-3">
                      {summary.treatment_given && (
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                          <span className="text-xs uppercase font-bold text-blue-400 tracking-wider">Treatment</span>
                          <p className="text-foreground text-sm mt-1 line-clamp-2" title={summary.treatment_given}>{summary.treatment_given}</p>
                        </div>
                      )}
                      {summary.discharge_medications && (
                        <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                          <span className="text-xs uppercase font-bold text-orange-400 tracking-wider flex items-center gap-1"><Pill className="w-3 h-3"/> Meds</span>
                          <p className="text-foreground text-sm mt-1 line-clamp-2" title={summary.discharge_medications}>{summary.discharge_medications}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {summary.follow_up_instructions && (
                    <div className="bg-slate-800 text-white p-3 rounded-xl">
                      <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Follow-up</span>
                      <p className="text-slate-200 text-sm mt-1">{summary.follow_up_instructions}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UnivDischargeSummary;
