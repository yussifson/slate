import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Plus, Trash2, Clock, CheckCircle, AlertCircle, MoreVertical, Eye, Edit, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { usePayment } from "@/hooks/integrations/usePayment";
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { supabase } from "@/api/supabaseClient";

export default function Premiums() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { processPayment, isPaymentLoading } = usePayment();
  const [premiums, setPremiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    policy_number: '',
    client_name: '',
    amount: '',
    due_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    payment_method: 'Bank Transfer',
    status: 'Pending',
    receipt_number: '',
    paid_date: ''
  });

  useEffect(() => {
    if (companyId) {
      fetchData();
      const channel = supabase.channel('insurance_premiums_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'insurance_premiums', filter: `company_id=eq.${companyId}` }, () => fetchData())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const __res = await powerSync.execute(`SELECT * FROM insurance_premiums WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      setPremiums(__res.rows ? (__res.rows._array || Array.from(__res.rows)) : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch premium records');
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
        policy_number: '',
        client_name: '',
        amount: '',
        due_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        payment_method: 'Bank Transfer',
        status: 'Pending',
        receipt_number: '',
        paid_date: ''
      });
    }
    setIsModalOpen(true);
  };

  const saveItem = async (e) => {
    e.preventDefault();
    if (!formData.client_name.trim() || !formData.policy_number.trim()) return toast.error("Please enter policy holder and number");

    try {
      if (editingItem) {
        await powerSync.execute(
          `UPDATE insurance_premiums SET policy_number = ?, client_name = ?, amount = ?, due_date = ?, payment_method = ?, status = ? WHERE id = ?`, 
          [formData.policy_number, formData.client_name, formData.amount, formData.due_date, formData.payment_method, formData.status, editingItem.id]
        );
        toast.success('Premium record updated!');
      } else {
        const id = crypto.randomUUID();
        const receipt = `RCP-${Math.floor(1000 + Math.random() * 9000)}`;
        
        if (formData.payment_method === 'Credit Card') {
          try {
            await processPayment({
              companyId,
              provider: 'stripe',
              amount: parseFloat(formData.amount),
              currency: 'USD',
              reference: receipt,
              customerName: formData.client_name
            });
            toast.success("Payment processed successfully via Stripe");
          } catch (err) {
            console.error("Payment failed", err);
            return toast.error("Payment failed: " + err.message);
          }
        }

        await powerSync.execute(
          `INSERT INTO insurance_premiums (id, company_id, policy_number, client_name, amount, due_date, payment_method, receipt_number, paid_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
          [id, companyId, formData.policy_number, formData.client_name, formData.amount, formData.due_date, formData.payment_method, receipt, '', 'Pending']
        );
        toast.success('Premium record created!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to save premium record');
    }
  };

  const deleteItem = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this record?')) return;
    try {
      await powerSync.execute(`DELETE FROM insurance_premiums WHERE id = ?`, [id]);
      toast.success('Record removed!');
      fetchData();
    } catch (err) {
      toast.error('Failed to remove: ' + err.message);
    }
  };

  const handleUpdateStatus = async (premium, newStatus) => {
    const paidDate = newStatus === 'Paid' ? new Date().toISOString().split('T')[0] : '';
    try {
      await powerSync.execute(`UPDATE insurance_premiums SET status = ?, paid_date = ? WHERE id = ?`, [newStatus, paidDate, premium.id]);
      toast.success(`Payment marked as ${newStatus}`);
      fetchData();
    } catch(err) {
      toast.error('Failed to update status');
    }
  };

  const filtered = premiums.filter(p => 
    String(p.client_name || '').toLowerCase().includes(search.toLowerCase()) || 
    String(p.policy_number || '').toLowerCase().includes(search.toLowerCase()) ||
    String(p.receipt_number || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalCollected = premiums.filter(p => p.status === 'Paid').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{t("premiums", "Premiums")}</h1>
          <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t("manage_policy_premium_payments", "Manage policy premium payments and collections")}</p>
        </div>
        <Button onClick={() => openModal()} className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)]">
          <Plus className="w-4 h-4" /> {t("record_payment", "Record Payment")}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex flex-col justify-center shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-primary font-medium tracking-wide text-xs uppercase"><CheckCircle className="w-4 h-4"/> {t("collected", "Collected")}</div>
          <p className="text-2xl font-bold text-card-foreground tracking-[-0.02em]">${totalCollected.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>
        <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex flex-col justify-center shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-[#71717a] dark:text-gray-400 font-medium tracking-wide text-xs uppercase"><DollarSign className="w-4 h-4"/> {t("total_payments", "Total Payments")}</div>
          <p className="text-2xl font-bold text-card-foreground tracking-[-0.02em]">{premiums.length}</p>
        </div>
        <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex flex-col justify-center shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-amber-600 font-medium tracking-wide text-xs uppercase"><Clock className="w-4 h-4"/> {t("pending", "Pending")}</div>
          <p className="text-2xl font-bold text-card-foreground tracking-[-0.02em]">{premiums.filter(p => p.status === 'Pending').length}</p>
        </div>
        <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex flex-col justify-center shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-red-600 font-medium tracking-wide text-xs uppercase"><AlertCircle className="w-4 h-4"/> {t("overdue", "Overdue")}</div>
          <p className="text-2xl font-bold text-card-foreground tracking-[-0.02em]">{premiums.filter(p => p.status === 'Overdue').length}</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
            <Input 
              placeholder="Search receipt, policy or holder..." 
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
                <th className="p-4">Receipt Info</th>
                <th className="p-4">Policy Info</th>
                <th className="p-4">Due Date</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((premium, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={premium.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  onClick={() => openModal(premium)}
                >
                  <td className="p-4">
                    <p className="font-mono font-semibold text-primary">{premium.receipt_number}</p>
                    <p className="text-[11px] text-[#71717a] mt-0.5 tracking-[0.04em]">{premium.payment_method}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-foreground">{premium.client_name}</p>
                    <p className="text-[11px] text-[#71717a] font-medium tracking-wide mt-0.5">{premium.policy_number}</p>
                  </td>
                  <td className="p-4 text-[#71717a] font-medium">
                    {premium.due_date}
                    {premium.paid_date && <p className="text-[10px] text-emerald-600 mt-0.5 font-semibold uppercase tracking-wider">Paid: {premium.paid_date}</p>}
                  </td>
                  <td className="p-4 text-right">
                    <p className="font-bold text-foreground">${Number(premium.amount||0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                  </td>
                  <td className="p-4 text-center">
                    <select
                      onClick={e=>e.stopPropagation()}
                      value={premium.status}
                      onChange={e => handleUpdateStatus(premium, e.target.value)}
                      className={`rounded-lg border-0 px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-primary/40 text-center ${
                        premium.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10' : 
                        premium.status === 'Overdue' ? 'bg-red-50 text-red-700 dark:bg-red-500/10' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); openModal(premium); }} className="p-1.5 text-[#71717a] hover:text-primary"><Edit className="w-4 h-4" /></button>
                      <button onClick={(e) => deleteItem(premium.id, e)} className="p-1.5 text-[#71717a] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-[#71717a]">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold text-lg text-foreground">No premium records found</p>
                    <p className="text-sm mt-1">Record a new payment to see it here.</p>
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
                <h2 className="text-lg font-semibold tracking-[-0.02em]">{editingItem ? 'Edit Premium Record' : 'Record Payment'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-muted rounded-full text-[#71717a] hover:text-foreground"><XCircle className="w-5 h-5"/></button>
              </div>
              <form onSubmit={saveItem} className="p-5 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Policy Holder</label>
                    <input required value={formData.client_name} onChange={e=>setFormData({...formData, client_name: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Policy Number</label>
                    <input required value={formData.policy_number} onChange={e=>setFormData({...formData, policy_number: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Amount ($)</label>
                    <input required type="number" step="0.01" value={formData.amount} onChange={e=>setFormData({...formData, amount: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Due Date</label>
                    <input required type="date" value={formData.due_date} onChange={e=>setFormData({...formData, due_date: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Payment Method</label>
                    <select required value={formData.payment_method} onChange={e=>setFormData({...formData, payment_method: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                      <option>Bank Transfer</option>
                      <option>Credit Card</option>
                      <option>Cash</option>
                      <option>Check</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Status</label>
                    <select required value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                      <option>Pending</option>
                      <option>Paid</option>
                      <option>Overdue</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/40 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-xl">Cancel</button>
                  <button type="submit" disabled={isPaymentLoading} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50">
                    {isPaymentLoading ? 'Processing...' : (editingItem ? 'Save Record' : 'Record Payment')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
