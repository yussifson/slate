import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Phone, Mail, MoreVertical, ShieldAlert, Activity, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { supabase } from "@/api/supabaseClient";

export default function Clients() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    risk_profile: 'Low',
    lifetime_value: '0',
    date_onboarded: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  useEffect(() => {
    if (companyId) {
      fetchData();
      const channel = supabase.channel('insurance_policyholders_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'insurance_policyholders', filter: `company_id=eq.${companyId}` }, () => fetchData())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const __res = await powerSync.execute(`SELECT * FROM insurance_policyholders WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      setClients(__res.rows ? (__res.rows._array || Array.from(__res.rows)) : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch clients');
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
        name: '',
        email: '',
        phone: '',
        address: '',
        risk_profile: 'Low',
        lifetime_value: '0',
        date_onboarded: new Date().toISOString().split('T')[0],
        status: 'Active'
      });
    }
    setIsModalOpen(true);
  };

  const saveItem = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Client name is required");

    try {
      if (editingItem) {
        await powerSync.execute(
          `UPDATE insurance_policyholders SET name = ?, email = ?, phone = ?, address = ?, risk_profile = ?, lifetime_value = ?, date_onboarded = ?, status = ? WHERE id = ?`, 
          [formData.name, formData.email, formData.phone, formData.address, formData.risk_profile, formData.lifetime_value, formData.date_onboarded, formData.status, editingItem.id]
        );
        toast.success('Client updated successfully!');
      } else {
        const id = crypto.randomUUID();
        await powerSync.execute(
          `INSERT INTO insurance_policyholders (id, company_id, name, email, phone, address, risk_profile, lifetime_value, date_onboarded, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
          [id, companyId, formData.name, formData.email, formData.phone, formData.address, formData.risk_profile, formData.lifetime_value, formData.date_onboarded, formData.status]
        );
        toast.success('Client added successfully!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to save client');
    }
  };

  const deleteItem = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this client? This cannot be undone.')) return;
    try {
      await powerSync.execute(`DELETE FROM insurance_policyholders WHERE id = ?`, [id]);
      toast.success('Client removed!');
      fetchData();
    } catch (err) {
      toast.error('Failed to remove: ' + err.message);
    }
  };

  const filtered = clients.filter(c => 
    String(c.name || '').toLowerCase().includes(search.toLowerCase()) || 
    String(c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 school-page-enter font-dmsans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{t("insurance_clients", "Policyholders & Clients")}</h1>
          <p className="text-sm text-[#71717a] mt-0.5">{t("manage_client_relationships", "Manage client relationships and risk profiles")}</p>
        </div>
        <Button onClick={() => openModal()} className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)]">
          <Plus className="w-4 h-4" /> {t("new_client", "New Client")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex items-center justify-between shadow-sm">
          <div>
            <h3 className="font-semibold text-[#71717a] tracking-wide text-xs uppercase mb-1">{t("total_clients", "Total Clients")}</h3>
            <p className="text-3xl font-bold text-card-foreground tracking-[-0.02em]">{clients.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Users className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex items-center justify-between shadow-sm">
          <div>
            <h3 className="font-semibold text-amber-600 tracking-wide text-xs uppercase mb-1">{t("high_risk", "High Risk Profile")}</h3>
            <p className="text-3xl font-bold text-card-foreground tracking-[-0.02em]">{clients.filter(c => c.risk_profile === 'High').length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex items-center justify-between shadow-sm">
          <div>
            <h3 className="font-semibold text-emerald-600 tracking-wide text-xs uppercase mb-1">{t("lifetime_value", "Avg Lifetime Value")}</h3>
            <p className="text-3xl font-bold text-card-foreground tracking-[-0.02em]">
              ${clients.length > 0 ? Math.round(clients.reduce((sum, c) => sum + Number(c.lifetime_value || 0), 0) / clients.length).toLocaleString() : 0}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="p-4 border-b border-primary/40 bg-muted/20">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
            <Input 
              placeholder="Search name or email..." 
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
                <th className="p-4">Client</th>
                <th className="p-4">Contact</th>
                <th className="p-4 text-center">Risk Profile</th>
                <th className="p-4 text-right">LTV</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((client, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={client.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  onClick={() => openModal(client)}
                >
                  <td className="p-4">
                    <p className="font-semibold text-foreground">{client.name}</p>
                    <p className="text-[11px] text-[#71717a] font-medium tracking-wide mt-0.5">Onboarded: {client.date_onboarded}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-[11px] font-medium text-[#71717a]"><Mail className="w-3.5 h-3.5"/> {client.email}</div>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-[#71717a] mt-1"><Phone className="w-3.5 h-3.5"/> {client.phone}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 inline-flex items-center rounded-lg text-[10px] uppercase tracking-wider font-semibold ${
                      client.risk_profile === 'Low' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10' :
                      client.risk_profile === 'Medium' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10' :
                      'bg-red-50 text-red-700 dark:bg-red-500/10'
                    }`}>
                      {client.risk_profile} Risk
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-foreground">
                    ${Number(client.lifetime_value || 0).toLocaleString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); openModal(client); }} className="p-1.5 text-[#71717a] hover:text-primary"><MoreVertical className="w-4 h-4" /></button>
                      <button onClick={(e) => deleteItem(client.id, e)} className="p-1.5 text-[#71717a] hover:text-red-500"><XCircle className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-[#71717a]">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold text-lg text-foreground">No clients found</p>
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
                <h2 className="text-lg font-semibold tracking-[-0.02em]">{editingItem ? 'Edit Client' : 'New Client'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-muted rounded-full text-[#71717a] hover:text-foreground"><XCircle className="w-5 h-5"/></button>
              </div>
              <form onSubmit={saveItem} className="p-5 flex flex-col gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Full Name</label>
                  <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Email</label>
                    <input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Phone</label>
                    <input type="tel" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Risk Profile</label>
                    <select required value={formData.risk_profile} onChange={e=>setFormData({...formData, risk_profile: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Lifetime Value ($)</label>
                    <input type="number" step="0.01" value={formData.lifetime_value} onChange={e=>setFormData({...formData, lifetime_value: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Status</label>
                  <select required value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
                <div className="mt-4 pt-4 border-t border-border/40 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-xl">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90">Save Client</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
