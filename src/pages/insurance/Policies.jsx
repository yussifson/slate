import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { Shield, Search, Plus, Trash2, FileText, CheckCircle, MoreVertical, Eye, Edit, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { supabase } from "@/api/supabaseClient";

export default function Policies() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    policy_holder: '',
    policy_number: '',
    provider_name: 'Slate Insurance',
    coverage_type: 'Life',
    premium_amount: '',
    start_date: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  useEffect(() => {
    if (companyId) {
      fetchData();
      const channel = supabase.channel('univ_insurancepolicy_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_insurancepolicy', filter: `company_id=eq.${companyId}` }, () => fetchData())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const __res = await powerSync.execute(`SELECT * FROM univ_insurancepolicy WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      setPolicies(__res.rows ? (__res.rows._array || Array.from(__res.rows)) : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch policies');
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
        policy_holder: '',
        policy_number: `POL-${Math.floor(10000 + Math.random() * 90000)}`,
        provider_name: 'Slate Insurance',
        coverage_type: 'Life',
        premium_amount: '',
        start_date: new Date().toISOString().split('T')[0],
        status: 'Active'
      });
    }
    setIsModalOpen(true);
  };

  const saveItem = async (e) => {
    e.preventDefault();
    if (!formData.policy_holder.trim()) return toast.error("Please enter a policy holder name");

    try {
      if (editingItem) {
        await powerSync.execute(`UPDATE univ_insurancepolicy SET policy_holder = ?, policy_number = ?, provider_name = ?, coverage_type = ?, start_date = ?, premium_amount = ?, status = ? WHERE id = ?`, 
          [formData.policy_holder, formData.policy_number, formData.provider_name, formData.coverage_type, formData.start_date, formData.premium_amount, formData.status, editingItem.id]);
        toast.success('Policy updated successfully!');
      } else {
        const id = crypto.randomUUID();
        await powerSync.execute(`INSERT INTO univ_insurancepolicy (id, company_id, policy_holder, policy_number, provider_name, coverage_type, start_date, premium_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
          [id, companyId, formData.policy_holder, formData.policy_number, formData.provider_name, formData.coverage_type, formData.start_date, formData.premium_amount, formData.status]);
        toast.success('Policy created successfully!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to save policy');
    }
  };

  const deleteItem = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this policy?')) return;
    try {
      await powerSync.execute(`DELETE FROM univ_insurancepolicy WHERE id = ?`, [id]);
      toast.success('Policy removed!');
      fetchData();
    } catch (err) {
      toast.error('Failed to remove: ' + err.message);
    }
  };

  const handleUpdateStatus = async (policy, newStatus) => {
    try {
      await powerSync.execute(`UPDATE univ_insurancepolicy SET status = ? WHERE id = ?`, [newStatus, policy.id]);
      toast.success(`Status updated to ${newStatus}`);
      fetchData();
    } catch(err) {
      toast.error('Failed to update status');
    }
  };

  const filtered = policies.filter(p => 
    String(p.policy_holder || '').toLowerCase().includes(search.toLowerCase()) || 
    String(p.policy_number || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPremium = policies.reduce((sum, p) => sum + (Number(p.premium_amount) || 0), 0);

  return (
    <div className="space-y-6 school-page-enter font-dmsans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{t("policies", "Policies")}</h1>
          <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t("manage_insurance_policies_and_", "Manage insurance policies and coverage")}</p>
        </div>
        <Button onClick={() => openModal()} className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)]">
          <Plus className="w-4 h-4" /> {t("new_policy", "New Policy")}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-secondary flex items-center justify-center text-primary">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground tracking-[-0.02em]">{policies.length}</p>
            <p className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">{t("total_policies", "Total Policies")}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-secondary flex items-center justify-center text-primary">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground tracking-[-0.02em]">{policies.filter(p => p.status === 'Active').length}</p>
            <p className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">{t("active", "Active")}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground tracking-[-0.02em]">{policies.filter(p => p.status === 'Lapsed').length}</p>
            <p className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">{t("lapsed", "Lapsed")}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
            <span className="font-bold text-xl">$</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground tracking-[-0.02em]">${totalPremium.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            <p className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">{t("total_premium", "Total Premium")}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
            <Input 
              placeholder="Search policy number or holder..." 
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
                <th className="p-4">Policy No.</th>
                <th className="p-4">Holder & Type</th>
                <th className="p-4">Start Date</th>
                <th className="p-4 text-right">Premium</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((policy, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={policy.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  onClick={() => openModal(policy)}
                >
                  <td className="p-4 font-mono font-semibold text-primary">{policy.policy_number}</td>
                  <td className="p-4">
                    <p className="font-semibold text-foreground">{policy.policy_holder}</p>
                    <p className="text-[11px] text-[#71717a] font-medium tracking-wide mt-0.5">{policy.coverage_type} Insurance</p>
                  </td>
                  <td className="p-4 text-[#71717a] font-medium">{policy.start_date}</td>
                  <td className="p-4 text-right">
                    <p className="font-bold text-foreground">${Number(policy.premium_amount||0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                  </td>
                  <td className="p-4 text-center">
                    <select
                      onClick={e=>e.stopPropagation()}
                      value={policy.status}
                      onChange={e => handleUpdateStatus(policy, e.target.value)}
                      className={`rounded-lg border-0 px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-primary/40 ${
                        policy.status === 'Active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10' : 
                        policy.status === 'Lapsed' ? 'bg-red-50 text-red-700 dark:bg-red-500/10' : 
                        policy.status === 'Cancelled' ? 'bg-muted text-[#71717a]' : 'bg-orange-50 text-orange-700 dark:bg-orange-500/10'
                      }`}
                    >
                      <option value="Active">Active</option>
                      <option value="Lapsed">Lapsed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); openModal(policy); }} className="p-1.5 text-[#71717a] hover:text-primary"><Edit className="w-4 h-4" /></button>
                      <button onClick={(e) => deleteItem(policy.id, e)} className="p-1.5 text-[#71717a] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-[#71717a]">
                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold text-lg text-foreground">No policies found</p>
                    <p className="text-sm mt-1">Create a new policy to get started.</p>
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
                <h2 className="text-lg font-semibold tracking-[-0.02em]">{editingItem ? 'Edit Policy' : 'New Policy'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-muted rounded-full text-[#71717a] hover:text-foreground"><XCircle className="w-5 h-5"/></button>
              </div>
              <form onSubmit={saveItem} className="p-5 flex flex-col gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Policy Holder Name</label>
                  <input required value={formData.policy_holder} onChange={e=>setFormData({...formData, policy_holder: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Policy Number</label>
                    <input required value={formData.policy_number} onChange={e=>setFormData({...formData, policy_number: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Coverage Type</label>
                    <select required value={formData.coverage_type} onChange={e=>setFormData({...formData, coverage_type: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                      <option>Life</option>
                      <option>Health</option>
                      <option>Auto</option>
                      <option>Home</option>
                      <option>Commercial</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Start Date</label>
                    <input required type="date" value={formData.start_date} onChange={e=>setFormData({...formData, start_date: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Premium ($)</label>
                    <input required type="number" step="0.01" value={formData.premium_amount} onChange={e=>setFormData({...formData, premium_amount: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Status</label>
                  <select required value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option>Active</option>
                    <option>Pending</option>
                    <option>Lapsed</option>
                    <option>Cancelled</option>
                  </select>
                </div>
                <div className="mt-4 pt-4 border-t border-border/40 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-xl">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90">Save Policy</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
