import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Trash2, Award, TrendingUp, DollarSign, MoreVertical, Edit, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { supabase } from "@/api/supabaseClient";

export default function AgentPerformance() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    agent_name: '',
    region: 'North',
    policies_sold: 0,
    premium_collected: 0,
    claims_handled: 0,
    commission_earned: 0,
    rating: 5,
    status: 'Active'
  });

  useEffect(() => {
    if (companyId) {
      fetchData();
      const channel = supabase.channel('insurance_agents_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'insurance_agents', filter: `company_id=eq.${companyId}` }, () => fetchData())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const __res = await powerSync.execute(`SELECT * FROM insurance_agents WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      setAgents(__res.rows ? (__res.rows._array || Array.from(__res.rows)) : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch agents');
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
        agent_name: '',
        region: 'North',
        policies_sold: 0,
        premium_collected: 0,
        claims_handled: 0,
        commission_earned: 0,
        rating: 5,
        status: 'Active'
      });
    }
    setIsModalOpen(true);
  };

  const saveItem = async (e) => {
    e.preventDefault();
    if (!formData.agent_name.trim()) return toast.error("Please enter agent name");

    try {
      if (editingItem) {
        await powerSync.execute(
          `UPDATE insurance_agents SET agent_name = ?, region = ?, policies_sold = ?, premium_collected = ?, claims_handled = ?, commission_earned = ?, rating = ?, status = ? WHERE id = ?`, 
          [formData.agent_name, formData.region, formData.policies_sold, formData.premium_collected, formData.claims_handled, formData.commission_earned, formData.rating, formData.status, editingItem.id]
        );
        toast.success('Agent updated successfully!');
      } else {
        const id = crypto.randomUUID();
        const agentCode = `AGT-${Math.floor(1000 + Math.random() * 9000)}`;
        await powerSync.execute(
          `INSERT INTO insurance_agents (id, company_id, agent_name, region, policies_sold, premium_collected, claims_handled, commission_earned, rating, agent_code, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
          [id, companyId, formData.agent_name, formData.region, formData.policies_sold, formData.premium_collected, formData.claims_handled, formData.commission_earned, formData.rating, agentCode, formData.status]
        );
        toast.success('Agent added successfully!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to save agent');
    }
  };

  const deleteItem = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this agent?')) return;
    try {
      await powerSync.execute(`DELETE FROM insurance_agents WHERE id = ?`, [id]);
      toast.success('Agent removed!');
      fetchData();
    } catch (err) {
      toast.error('Failed to remove: ' + err.message);
    }
  };

  const handleUpdateStatus = async (agent, newStatus) => {
    try {
      await powerSync.execute(`UPDATE insurance_agents SET status = ? WHERE id = ?`, [newStatus, agent.id]);
      toast.success(`Agent status updated to ${newStatus}`);
      fetchData();
    } catch(err) {
      toast.error('Failed to update status');
    }
  };

  const filtered = agents.filter(a => 
    String(a.agent_name || '').toLowerCase().includes(search.toLowerCase()) || 
    String(a.agent_code || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalCommission = agents.reduce((sum, a) => sum + (Number(a.commission_earned) || 0), 0);
  const avgPolicies = agents.length > 0 ? (agents.reduce((sum, a) => sum + (Number(a.policies_sold) || 0), 0) / agents.length).toFixed(1) : 0;
  const topPerformer = [...agents].sort((a, b) => (Number(b.policies_sold) || 0) - (Number(a.policies_sold) || 0))[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{t("agent_performance", "Agent Performance")}</h1>
          <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t("track_agent_sales_commissions_", "Track agent sales, commissions, and ratings")}</p>
        </div>
        <Button onClick={() => openModal()} className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)]">
          <Plus className="w-4 h-4" /> {t("add_agent", "Add Agent")}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex flex-col justify-center shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-[#71717a] dark:text-gray-400 font-medium tracking-wide text-xs uppercase"><Users className="w-4 h-4"/> {t("total_agents", "Total Agents")}</div>
          <p className="text-2xl font-bold text-card-foreground tracking-[-0.02em]">{agents.length}</p>
        </div>
        <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex flex-col justify-center shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-primary font-medium tracking-wide text-xs uppercase"><TrendingUp className="w-4 h-4"/> {t("avg_policies_sold", "Avg Policies Sold")}</div>
          <p className="text-2xl font-bold text-card-foreground tracking-[-0.02em]">{avgPolicies}</p>
        </div>
        <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex flex-col justify-center shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-emerald-600 font-medium tracking-wide text-xs uppercase"><DollarSign className="w-4 h-4"/> {t("total_commission", "Total Commission")}</div>
          <p className="text-2xl font-bold text-card-foreground tracking-[-0.02em]">${totalCommission.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>
        <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-5 flex flex-col justify-center shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-amber-600 font-medium tracking-wide text-xs uppercase"><Award className="w-4 h-4"/> {t("top_performer", "Top Performer")}</div>
          <p className="text-lg font-bold text-card-foreground truncate tracking-[-0.01em]">{topPerformer ? topPerformer.agent_name : 'N/A'}</p>
          <p className="text-[11px] text-[#71717a] dark:text-gray-400 font-medium tracking-wide uppercase mt-0.5">{topPerformer ? `${topPerformer.policies_sold} policies` : ''}</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
            <Input 
              placeholder="Search agent name or code..." 
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
                <th className="p-4">Agent Info</th>
                <th className="p-4 text-center">Policies Sold</th>
                <th className="p-4 text-right">Premium Collected</th>
                <th className="p-4 text-right">Commission</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((agent, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={agent.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  onClick={() => openModal(agent)}
                >
                  <td className="p-4">
                    <p className="font-semibold text-foreground">{agent.agent_name}</p>
                    <p className="text-[11px] text-[#71717a] dark:text-gray-400 mt-0.5 tracking-[0.04em] uppercase">{agent.agent_code} • {agent.region}</p>
                    <div className="flex gap-0.5 mt-1.5">
                      {[...Array(5)].map((_, i) => (
                        <Award key={i} className={`w-3.5 h-3.5 ${i < Number(agent.rating) ? 'text-amber-500 fill-amber-500' : 'text-[#71717a]/30 dark:text-gray-400/30'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-bold text-foreground text-lg">{agent.policies_sold}</span>
                  </td>
                  <td className="p-4 text-right text-[#71717a] font-medium">
                    ${Number(agent.premium_collected).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </td>
                  <td className="p-4 text-right">
                    <p className="font-bold text-emerald-600">${Number(agent.commission_earned).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                  </td>
                  <td className="p-4 text-center">
                    <select
                      onClick={e=>e.stopPropagation()}
                      value={agent.status}
                      onChange={e => handleUpdateStatus(agent, e.target.value)}
                      className={`rounded-lg border-0 px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-primary/40 text-center ${
                        agent.status === 'Active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10' : 'bg-muted text-[#71717a]'
                      }`}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); openModal(agent); }} className="p-1.5 text-[#71717a] hover:text-primary"><Edit className="w-4 h-4" /></button>
                      <button onClick={(e) => deleteItem(agent.id, e)} className="p-1.5 text-[#71717a] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-[#71717a]">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold text-lg text-foreground">No agents found</p>
                    <p className="text-sm mt-1">Add an agent to start tracking performance.</p>
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
                <h2 className="text-lg font-semibold tracking-[-0.02em]">{editingItem ? 'Edit Agent' : 'Add Agent'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-muted rounded-full text-[#71717a] hover:text-foreground"><XCircle className="w-5 h-5"/></button>
              </div>
              <form onSubmit={saveItem} className="p-5 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Agent Name</label>
                    <input required value={formData.agent_name} onChange={e=>setFormData({...formData, agent_name: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Region</label>
                    <select required value={formData.region} onChange={e=>setFormData({...formData, region: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                      <option>North</option>
                      <option>South</option>
                      <option>East</option>
                      <option>West</option>
                      <option>Central</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Policies Sold</label>
                    <input required type="number" value={formData.policies_sold} onChange={e=>setFormData({...formData, policies_sold: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Premium Collected ($)</label>
                    <input required type="number" step="0.01" value={formData.premium_collected} onChange={e=>setFormData({...formData, premium_collected: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Commission Earned ($)</label>
                    <input required type="number" step="0.01" value={formData.commission_earned} onChange={e=>setFormData({...formData, commission_earned: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Claims Handled</label>
                    <input required type="number" value={formData.claims_handled} onChange={e=>setFormData({...formData, claims_handled: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Rating (1-5)</label>
                    <input required type="number" min="1" max="5" value={formData.rating} onChange={e=>setFormData({...formData, rating: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Status</label>
                    <select required value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/40 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-xl">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90">Save Agent</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
