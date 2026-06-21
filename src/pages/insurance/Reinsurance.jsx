import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { Search, Plus, Shield, ShieldAlert, ArrowRightLeft, FileSignature, MoreVertical, Edit, Trash2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { supabase } from "@/api/supabaseClient";

export default function Reinsurance() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    treaty_name: '',
    reinsurer: '',
    ceded_premium: '',
    coverage_limit: '',
    effective_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 31536000000).toISOString().split('T')[0],
    status: 'Active'
  });

  useEffect(() => {
    if (companyId) {
      fetchData();
      const channel = supabase.channel('insurance_reinsurance_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'insurance_reinsurance', filter: `company_id=eq.${companyId}` }, () => fetchData())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const __res = await powerSync.execute(`SELECT * FROM insurance_reinsurance WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      setContracts(__res.rows ? (__res.rows._array || Array.from(__res.rows)) : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch contracts');
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
        treaty_name: '',
        reinsurer: '',
        ceded_premium: '',
        coverage_limit: '',
        effective_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 31536000000).toISOString().split('T')[0],
        status: 'Active'
      });
    }
    setIsModalOpen(true);
  };

  const saveItem = async (e) => {
    e.preventDefault();
    if (!formData.treaty_name.trim()) return toast.error("Treaty name is required");

    try {
      if (editingItem) {
        await powerSync.execute(
          `UPDATE insurance_reinsurance SET treaty_name = ?, reinsurer = ?, ceded_premium = ?, coverage_limit = ?, effective_date = ?, expiry_date = ?, status = ? WHERE id = ?`, 
          [formData.treaty_name, formData.reinsurer, formData.ceded_premium, formData.coverage_limit, formData.effective_date, formData.expiry_date, formData.status, editingItem.id]
        );
        toast.success('Contract updated successfully!');
      } else {
        const id = crypto.randomUUID();
        await powerSync.execute(
          `INSERT INTO insurance_reinsurance (id, company_id, treaty_name, reinsurer, ceded_premium, coverage_limit, effective_date, expiry_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
          [id, companyId, formData.treaty_name, formData.reinsurer, formData.ceded_premium, formData.coverage_limit, formData.effective_date, formData.expiry_date, formData.status]
        );
        toast.success('Contract added successfully!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to save contract');
    }
  };

  const deleteItem = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this contract? This cannot be undone.')) return;
    try {
      await powerSync.execute(`DELETE FROM insurance_reinsurance WHERE id = ?`, [id]);
      toast.success('Contract removed!');
      fetchData();
    } catch (err) {
      toast.error('Failed to remove: ' + err.message);
    }
  };

  const handleUpdateStatus = async (contract, newStatus) => {
    try {
      await powerSync.execute(`UPDATE insurance_reinsurance SET status = ? WHERE id = ?`, [newStatus, contract.id]);
      toast.success(`Status updated to ${newStatus}`);
      fetchData();
    } catch(err) {
      toast.error('Failed to update status');
    }
  };

  const filtered = contracts.filter(c => 
    String(c.treaty_name || '').toLowerCase().includes(search.toLowerCase()) || 
    String(c.reinsurer || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalCeded = contracts.reduce((sum, c) => sum + (Number(c.ceded_premium) || 0), 0);
  const totalCoverage = contracts.reduce((sum, c) => sum + (Number(c.coverage_limit) || 0), 0);

  return (
    <div className="space-y-6 school-page-enter font-dmsans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{t("reinsurance", "Reinsurance Management")}</h1>
          <p className="text-sm text-[#71717a] mt-0.5">{t("manage_ceded_premiums", "Manage ceded premiums and reinsurance treaties")}</p>
        </div>
        <Button onClick={() => openModal()} className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)]">
          <Plus className="w-4 h-4" /> {t("new_contract", "New Contract")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex items-center justify-between shadow-sm">
          <div>
            <h3 className="font-semibold text-primary tracking-wide text-xs uppercase mb-1">{t("active_treaties", "Active Treaties")}</h3>
            <p className="text-3xl font-bold text-card-foreground tracking-[-0.02em]">{contracts.filter(c => c.status === 'Active').length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <FileSignature className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex items-center justify-between shadow-sm">
          <div>
            <h3 className="font-semibold text-amber-600 tracking-wide text-xs uppercase mb-1">{t("ceded_premium", "Total Ceded Premium")}</h3>
            <p className="text-3xl font-bold text-card-foreground tracking-[-0.02em]">${totalCeded.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex items-center justify-between shadow-sm">
          <div>
            <h3 className="font-semibold text-emerald-600 tracking-wide text-xs uppercase mb-1">{t("reinsurance_coverage", "Reinsurance Coverage Limit")}</h3>
            <p className="text-3xl font-bold text-card-foreground tracking-[-0.02em]">${totalCoverage.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
            <Input 
              placeholder="Search treaty or reinsurer..." 
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
                <th className="p-4">Treaty Name</th>
                <th className="p-4">Reinsurer</th>
                <th className="p-4 text-right">Ceded Premium</th>
                <th className="p-4 text-right">Coverage Limit</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((contract, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={contract.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  onClick={() => openModal(contract)}
                >
                  <td className="p-4">
                    <p className="font-semibold text-foreground">{contract.treaty_name}</p>
                    <p className="text-[10px] text-[#71717a] uppercase tracking-wide mt-0.5">{contract.effective_date} to {contract.expiry_date}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 font-medium text-primary"><Shield className="w-4 h-4"/> {contract.reinsurer}</div>
                  </td>
                  <td className="p-4 text-right font-bold text-foreground">
                    ${Number(contract.ceded_premium || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </td>
                  <td className="p-4 text-right font-bold text-foreground">
                    ${Number(contract.coverage_limit || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </td>
                  <td className="p-4 text-center">
                    <select
                      onClick={e=>e.stopPropagation()}
                      value={contract.status}
                      onChange={e => handleUpdateStatus(contract, e.target.value)}
                      className={`rounded-lg border-0 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-primary/40 text-center ${
                        contract.status === 'Active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10' :
                        contract.status === 'Expired' ? 'bg-red-50 text-red-700 dark:bg-red-500/10' :
                        'bg-amber-50 text-amber-700 dark:bg-amber-500/10'
                      }`}
                    >
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); openModal(contract); }} className="p-1.5 text-[#71717a] hover:text-primary"><Edit className="w-4 h-4" /></button>
                      <button onClick={(e) => deleteItem(contract.id, e)} className="p-1.5 text-[#71717a] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-[#71717a]">
                    <FileSignature className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold text-lg text-foreground">No treaties found</p>
                    <p className="text-sm mt-1">Create a new contract to get started.</p>
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
                <h2 className="text-lg font-semibold tracking-[-0.02em]">{editingItem ? 'Edit Contract' : 'New Contract'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-muted rounded-full text-[#71717a] hover:text-foreground"><XCircle className="w-5 h-5"/></button>
              </div>
              <form onSubmit={saveItem} className="p-5 flex flex-col gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Treaty Name</label>
                  <input required value={formData.treaty_name} onChange={e=>setFormData({...formData, treaty_name: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Reinsurer</label>
                  <input required value={formData.reinsurer} onChange={e=>setFormData({...formData, reinsurer: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="e.g. Munich Re" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Ceded Premium ($)</label>
                    <input required type="number" step="0.01" value={formData.ceded_premium} onChange={e=>setFormData({...formData, ceded_premium: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Coverage Limit ($)</label>
                    <input required type="number" step="0.01" value={formData.coverage_limit} onChange={e=>setFormData({...formData, coverage_limit: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Effective Date</label>
                    <input required type="date" value={formData.effective_date} onChange={e=>setFormData({...formData, effective_date: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Expiry Date</label>
                    <input required type="date" value={formData.expiry_date} onChange={e=>setFormData({...formData, expiry_date: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Status</label>
                  <select required value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option>Active</option>
                    <option>Pending</option>
                    <option>Expired</option>
                  </select>
                </div>
                <div className="mt-4 pt-4 border-t border-border/40 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-xl">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90">Save Contract</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
