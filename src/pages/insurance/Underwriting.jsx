import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, FileSignature, CheckCircle2, XCircle, AlertTriangle, MoreVertical, Edit, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { generateText } from '@/lib/cloudflareAI';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { supabase } from "@/api/supabaseClient";

export default function Underwriting() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isUnderwriting, setIsUnderwriting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    applicant_name: '',
    policy_type: 'Life Insurance',
    risk_score: 'Low',
    premium_quote: '',
    sum_insured_requested: '',
    status: 'Pending Review',
    application_id: '',
    submitted_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (companyId) {
      fetchData();
      const channel = supabase.channel('insurance_underwriting_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'insurance_underwriting', filter: `company_id=eq.${companyId}` }, () => fetchData())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const __res = await powerSync.execute(`SELECT * FROM insurance_underwriting WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      setApplications(__res.rows ? (__res.rows._array || Array.from(__res.rows)) : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
    } else {
      setEditingItem(null);
      setFormData({
        applicant_name: '',
        policy_type: 'Life Insurance',
        risk_score: 'Low',
        premium_quote: '',
        sum_insured_requested: '',
        status: 'Pending Review',
        application_id: `UW-${Math.floor(1000 + Math.random() * 9000)}`,
        submitted_date: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const saveItem = async (e) => {
    e.preventDefault();
    if (!formData.applicant_name.trim()) return toast.error("Please enter applicant name");

    try {
      if (editingItem) {
        await powerSync.execute(
          `UPDATE insurance_underwriting SET applicant_name = ?, policy_type = ?, risk_score = ?, premium_quote = ?, sum_insured_requested = ?, status = ? WHERE id = ?`, 
          [formData.applicant_name, formData.policy_type, formData.risk_score, formData.premium_quote, formData.sum_insured_requested, formData.status, editingItem.id]
        );
        toast.success('Application updated successfully!');
      } else {
        const id = crypto.randomUUID();
        await powerSync.execute(
          `INSERT INTO insurance_underwriting (id, company_id, applicant_name, policy_type, risk_score, premium_quote, sum_insured_requested, application_id, submitted_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
          [id, companyId, formData.applicant_name, formData.policy_type, formData.risk_score, formData.premium_quote, formData.sum_insured_requested, formData.application_id, formData.submitted_date, formData.status]
        );
        toast.success('Application added successfully!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to save application');
    }
  };

  const deleteItem = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this application?')) return;
    try {
      await powerSync.execute(`DELETE FROM insurance_underwriting WHERE id = ?`, [id]);
      toast.success('Application removed!');
      fetchData();
    } catch (err) {
      toast.error('Failed to remove: ' + err.message);
    }
  };

  const handleUpdateDecision = async (app, newDecision) => {
    try {
      await powerSync.execute(`UPDATE insurance_underwriting SET status = ? WHERE id = ?`, [newDecision, app.id]);
      toast.success(`Decision updated to ${newDecision}`);
      fetchData();
    } catch(err) {
      toast.error('Failed to update decision');
    }
  };

  const runAIUnderwriting = async (app, e) => {
    e.stopPropagation();
    setIsUnderwriting(true);
    const tId = toast.loading('Running AI Underwriting Rules Engine...');
    try {
      const prompt = `You are an AI Underwriter for an insurance company. 
Evaluate this application:
Applicant: ${app.applicant_name}
Product: ${app.policy_type}
Risk Level: ${app.risk_score}
Premium Quote: $${app.premium_quote}
Sum Requested: $${app.sum_insured_requested}

Rules:
- Low risk & premium quote > 0 & sum < 1000000 -> Approved
- High risk -> Rejected
- Medium risk -> Conditionally Approved
- Sum requested > 1000000 -> Conditionally Approved

Output ONLY one of these exact strings based on the rules: Approved, Rejected, Conditionally Approved.`;
      const decision = await generateText(prompt);
      await handleUpdateDecision(app, decision.trim());
      toast.success(`AI decided: ${decision.trim()}`, { id: tId });
    } catch (err) {
      toast.error('AI Underwriting failed', { id: tId });
    } finally {
      setIsUnderwriting(false);
    }
  };

  const filtered = applications.filter(a => 
    String(a.applicant_name || '').toLowerCase().includes(search.toLowerCase()) || 
    String(a.application_id || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 school-page-enter font-dmsans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{t("underwriting", "Underwriting")}</h1>
          <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t("evaluate_risk_and_process_insu", "Evaluate risk and process insurance applications")}</p>
        </div>
        <Button onClick={() => openModal()} className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)]">
          <Plus className="w-4 h-4" /> {t("new_application", "New Application")}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex flex-col justify-center shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-[#71717a] dark:text-gray-400 font-medium tracking-wide text-xs uppercase"><FileSignature className="w-4 h-4"/> {t("total_applications", "Total Applications")}</div>
          <p className="text-2xl font-bold text-card-foreground tracking-[-0.02em]">{applications.length}</p>
        </div>
        <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex flex-col justify-center shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-amber-600 font-medium tracking-wide text-xs uppercase"><Clock className="w-4 h-4"/> {t("pending_review", "Pending Review")}</div>
          <p className="text-2xl font-bold text-card-foreground tracking-[-0.02em]">{applications.filter(a => a.status === 'Pending Review').length}</p>
        </div>
        <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex flex-col justify-center shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-primary font-medium tracking-wide text-xs uppercase"><CheckCircle2 className="w-4 h-4"/> {t("approved", "Approved")}</div>
          <p className="text-2xl font-bold text-card-foreground tracking-[-0.02em]">{applications.filter(a => a.status === 'Approved' || a.status === 'Conditionally Approved').length}</p>
        </div>
        <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex flex-col justify-center shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-red-600 font-medium tracking-wide text-xs uppercase"><AlertTriangle className="w-4 h-4"/> {t("high_risk", "High Risk")}</div>
          <p className="text-2xl font-bold text-card-foreground tracking-[-0.02em]">{applications.filter(a => a.risk_score === 'High').length}</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
            <Input 
              placeholder="Search application ID or applicant..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-10 h-10 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:ring-2 focus:ring-primary/40" 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-[11px] font-semibold tracking-[0.06em] uppercase text-[#71717a] dark:text-gray-400">
              <tr>
                <th className="p-4">App ID</th>
                <th className="p-4">Applicant & Product</th>
                <th className="p-4 text-center">Risk Level</th>
                <th className="p-4 text-right">Quote & Sum</th>
                <th className="p-4 text-center">Decision</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((app, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={app.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  onClick={() => openModal(app)}
                >
                  <td className="p-4">
                    <p className="font-mono font-semibold text-primary">{app.application_id}</p>
                    <p className="text-[10px] text-[#71717a] dark:text-gray-400 mt-0.5">{app.submitted_date}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-foreground">{app.applicant_name}</p>
                    <p className="text-[11px] text-[#71717a] font-medium tracking-wide mt-0.5">{app.policy_type}</p>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 inline-flex items-center rounded-lg text-[10px] uppercase tracking-wider font-semibold ${
                      app.risk_score === 'Low' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10' : 
                      app.risk_score === 'Medium' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10' : 'bg-red-50 text-red-700 dark:bg-red-500/10'
                    }`}>
                      {app.risk_score} Risk
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <p className="font-bold text-foreground">${Number(app.premium_quote||0).toLocaleString(undefined, {minimumFractionDigits: 2})} <span className="text-[10px] font-medium text-[#71717a] font-normal uppercase">/yr</span></p>
                    <p className="text-[11px] text-[#71717a] font-medium mt-0.5 tracking-wide">Sum: ${Number(app.sum_insured_requested||0).toLocaleString()}</p>
                  </td>
                  <td className="p-4 text-center">
                    <select
                      onClick={e=>e.stopPropagation()}
                      value={app.status}
                      onChange={e => handleUpdateDecision(app, e.target.value)}
                      className={`rounded-lg border-0 px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-primary/40 text-center ${
                        app.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10' : 
                        app.status === 'Rejected' ? 'bg-red-50 text-red-700 dark:bg-red-500/10' : 
                        app.status === 'Conditionally Approved' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10' : 
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <option value="Pending Review">Pending Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Conditionally Approved">Conditionally Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {app.status === 'Pending Review' && (
                        <button onClick={(e) => runAIUnderwriting(app, e)} className="p-1.5 text-amber-500 hover:text-amber-600" title="Run AI Underwriting">
                          <Sparkles className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); openModal(app); }} className="p-1.5 text-[#71717a] hover:text-primary"><Edit className="w-4 h-4" /></button>
                      <button onClick={(e) => deleteItem(app.id, e)} className="p-1.5 text-[#71717a] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-[#71717a]">
                    <FileSignature className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold text-lg text-foreground">No applications found</p>
                    <p className="text-sm mt-1">Submit a new application to see it here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="bg-card w-full max-w-md rounded-2xl flex flex-col shadow-xl border-[0.5px] border-black/9 dark:border-white/8">
              <div className="p-5 border-b border-border/40 flex justify-between items-center">
                <h2 className="text-lg font-semibold tracking-[-0.02em]">{editingItem ? 'Edit Application' : 'New Application'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-muted rounded-full text-[#71717a] hover:text-foreground"><XCircle className="w-5 h-5"/></button>
              </div>
              <form onSubmit={saveItem} className="p-5 flex flex-col gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Applicant Name</label>
                  <input required value={formData.applicant_name} onChange={e=>setFormData({...formData, applicant_name: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Product Type</label>
                    <select required value={formData.policy_type} onChange={e=>setFormData({...formData, policy_type: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                      <option>Life Insurance</option>
                      <option>Health Insurance</option>
                      <option>Property Insurance</option>
                      <option>Auto Insurance</option>
                      <option>Commercial Liability</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Risk Level</label>
                    <select required value={formData.risk_score} onChange={e=>setFormData({...formData, risk_score: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Premium Quote ($)</label>
                    <input required type="number" step="0.01" value={formData.premium_quote} onChange={e=>setFormData({...formData, premium_quote: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Sum Insured Requested ($)</label>
                    <input required type="number" value={formData.sum_insured_requested} onChange={e=>setFormData({...formData, sum_insured_requested: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Decision</label>
                  <select required value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option>Pending Review</option>
                    <option>Approved</option>
                    <option>Conditionally Approved</option>
                    <option>Rejected</option>
                  </select>
                </div>
                <div className="mt-4 pt-4 border-t border-border/40 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-xl">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90">Save Application</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
