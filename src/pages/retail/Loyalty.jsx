import React, { useState, useEffect} from 'react';
import { useTranslation} from "react-i18next";
import { Star, Search, Plus, Edit, Trash2, Award, Check, Bot, Lock, Sparkles } from 'lucide-react';
import { ViewModeToggle, RetailStatCard, LoyaltyGridCard} from '@/components/retail/RetailViewKit';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { toast} from 'react-hot-toast';
import { generateText } from '@/lib/cloudflareAI';
import ConfirmationModal from '@/components/ConfirmationModal';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';

export default function Loyalty() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const isProOrAbove = true; // Temporary bypass
  const { t} = useTranslation();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [dbRecords, setDbRecords] = useState([]);
  const [customerRecords, setCustomerRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchRecords = async () => {
      setIsLoading(true);
      try {
        const res = await powerSync.execute('SELECT l.*, c.name as customer_name FROM univ_retail_loyalty l LEFT JOIN univ_retail_customers c ON l.customer_name = c.cust_id WHERE l.company_id = ? ORDER BY l.created_at DESC', [companyId]);
        if(active) setDbRecords(res.rows._array || Array.from(res.rows));

        const custRes = await powerSync.execute('SELECT * FROM univ_retail_customers WHERE company_id = ?', [companyId]);
        if(active) setCustomerRecords(custRes.rows._array || Array.from(custRes.rows));
      } catch(e){}
      setIsLoading(false);
    };
    if (companyId) fetchRecords();
    return () => { active = false; };
  }, [companyId]);

  const customers = customerRecords.map(r => ({
  id: r.cust_id,
  name: r.name || 'Unnamed Customer'
 }));

  const members = dbRecords.map(r => ({
  id: r.id,
  memberId: `MBR-${r.id?.slice(0, 5).toUpperCase()}`,
  customerId: r.customer_name || '',
  customerName: r.customer_name ? (customers.find(c => c.id === r.customer_name)?.name || 'Unknown') : 'Unnamed Member',
  points: parseInt(r.points) || 0,
  tier: r.tier || 'Bronze'}));

 const [search, setSearch] = useState('');
 const [viewMode, setViewMode] = useState('list');
 const [showModal, setShowModal] = useState(false);
 const [deleteTargetId, setDeleteTargetId] = useState(null);
 const [editingId, setEditingId] = useState(null);

 // Use array for multi-select
 const [formData, setFormData] = useState({
 customerIds: [], points: '', tier: 'Bronze'
});

 const openEdit = (mbr) => {
 setEditingId(mbr.id);
 setFormData({ customerIds: mbr.customerId ? [mbr.customerId] : [], points: mbr.points, tier: mbr.tier});
 setShowModal(true);
};

 const toggleCustomer = (cId) => {
 setFormData(prev => {
 const idx = prev.customerIds.indexOf(cId);
 if (idx > -1) {
 return { ...prev, customerIds: prev.customerIds.filter(id => id !== cId)};
} else {
 return { ...prev, customerIds: [...prev.customerIds, cId]};
}
});
};

 
  const handleAIAwardCopilot = async (mbr) => {
    if (!isProOrAbove) {
      toast.error('AI Insights are available on Pro or Enterprise plans.');
      return;
    }
    setIsGenerating(true);
    setAiInsight('');
    try {
      const prompt = `You are a Retail Loyalty Expert AI. Provide a 2-sentence strategy for this loyalty member:
Member: ${mbr.customerName}
Tier: ${mbr.tier}
Points: ${mbr.points}
Suggest an exclusive perk or engagement strategy.`;
      const response = await generateText(prompt);
      setAiInsight(response);
    } catch (e) {
      toast.error('AI Copilot failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
  if (formData.customerIds.length === 0) {
  toast.error("Please select at least one customer.");
  return;
 }

  try {
  if (editingId) {
  // Edit mode (single update, usually 1 customer anyway)
  const cId = formData.customerIds[0];
  await powerSync.execute(`UPDATE univ_retail_loyalty SET customer_name=?, points=?, tier=?, status=? WHERE id=?`, 
    [cId, parseInt(formData.points) || 0, formData.tier, 'Active', editingId]
  );
  toast.success('Member updated!');
 } else {
  // Create mode (multi-select assignment)
   for (const cId of formData.customerIds) {
     await powerSync.execute(`INSERT INTO univ_retail_loyalty (id, created_at, company_id, customer_name, points, tier, joined, status) VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'Active')`, 
       [crypto.randomUUID(), companyId, cId, parseInt(formData.points) || 0, formData.tier]
     );
  }
  toast.success(`Successfully assigned to ${formData.customerIds.length} customer(s)!`);
 }
  setShowModal(false);
  setEditingId(null);
  const res = await powerSync.execute('SELECT l.*, c.name as customer_name FROM univ_retail_loyalty l LEFT JOIN univ_retail_customers c ON l.customer_name = c.cust_id WHERE l.company_id = ? ORDER BY l.created_at DESC', [companyId]);
  setDbRecords(res.rows._array || Array.from(res.rows));
 } catch (err) {
  toast.error("Failed to save loyalty data: " + err.message);
 }
 };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await powerSync.execute(`DELETE FROM univ_retail_loyalty WHERE id=?`, [deleteTargetId]);
      toast.success('Member removed successfully!');
      setDeleteTargetId(null);
      setDbRecords(dbRecords.filter(m => m.id !== deleteTargetId));
    } catch (err) {
      toast.error('Failed to delete member: ' + err.message);
    }
  };

 const filteredMembers = members.filter(m =>
 (m.memberId || '').toLowerCase().includes((search || '').toLowerCase()) || 
 (m.customerName || '').toLowerCase().includes((search || '').toLowerCase())
 );

 return (
 <div className="space-y-6 school-page-enter font-dmsans">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">Loyalty Program</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">Manage rewards and tiers for your best customers.</p>
 </div>
 <Button onClick={() => { setEditingId(null); setFormData({ customerIds: [], points: '', tier: 'Bronze'}); setShowModal(true);}} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
 <Plus className="w-4 h-4" /> Add Member(s)
 </Button>
 </div>

 <div className="flex items-center justify-end">
 <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <RetailStatCard label="Total Members" value={members.length} icon={Star} />
 <RetailStatCard label="Gold Tier Members" value={members.filter(m => m.tier === 'Gold').length} icon={Award} />
 </div>

 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/40 bg-muted/50">
 <div className="relative max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
 </div>
 </div>
 <div className="overflow-x-auto">
 {isLoading ? <div className="py-12 text-center">Loading...</div> : filteredMembers.length === 0 ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400">
 <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
 <p className="font-semibold">No loyalty members yet.</p>
 </div>
 ) : viewMode === 'grid' ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 p-6">
 {filteredMembers.map(m => (
 <LoyaltyGridCard
 key={m.id}
 member={m}
 onEdit={() => openEdit(m)}
 onDelete={() => setDeleteTargetId(m.id)}
 />
 ))}
 </div>
 ) : (
 <table className="w-full text-sm">
 <thead className="bg-card border-b border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <tr>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Member ID</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Customer Name</th>
 <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Points</th>
 <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Tier</th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filteredMembers.map(m => (
 <tr key={m.id} className="hover:bg-muted/50 transition-colors">
 <td className="px-6 py-4 font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{m.memberId}</td>
 <td className="px-6 py-4 text-[#71717a] dark:text-gray-400">{m.customerName}</td>
 <td className="px-6 py-4 text-center font-semibold text-primary">{m.points}</td>
 <td className="px-6 py-4 text-center">
 <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${m.tier === 'Gold' ? 'bg-amber-100 text-amber-700' : m.tier === 'Silver' ? 'bg-slate-200 text-slate-700 dark:text-foreground' : 'bg-orange-100 text-orange-800'}`}>{m.tier}</span>
 </td>
 <td className="px-6 py-4 text-right">
 <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Edit className="w-4 h-4" /></Button>
 <Button variant="ghost" size="icon" className="text-red-600" onClick={() => setDeleteTargetId(m.id)}><Trash2 className="w-4 h-4" /></Button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 )}
 </div>
 </div>

 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{editingId ? 'Edit Member' : 'Add Member(s)'}</h2>
            {editingId && (
              <Button size="sm" variant="outline" className="gap-2 bg-primary/5 text-primary border-primary/20" onClick={() => {
                const mbr = members.find(m => m.id === editingId);
                if(mbr) handleAIAwardCopilot(mbr);
              }} disabled={isGenerating}>
                {isGenerating ? <Sparkles className="w-4 h-4 animate-spin" /> : (!isProOrAbove ? <Lock className="w-4 h-4" /> : <Bot className="w-4 h-4" />)}
                {isGenerating ? 'Analyzing...' : 'AI Reward Copilot'}
              </Button>
            )}
          </div>
          {aiInsight && (
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
              <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2"><Bot className="w-4 h-4"/> AI Reward Copilot</h3>
              <p className="text-sm text-foreground font-medium">{aiInsight}</p>
            </div>
          )}
 <div className="space-y-4">
 
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-2 block tracking-[0.04em]">
 {editingId ? 'Customer' : 'Select Customer(s)'}
 </label>
 {editingId ? (
 <select value={formData.customerIds[0] || ''} onChange={e => setFormData({...formData, customerIds: [e.target.value]})} className="flex h-10 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm mt-1">
 {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
 </select>
 ) : (
 <div className="border-[0.5px] border-black/9 dark:border-white/8 rounded-lg max-h-48 overflow-y-auto bg-white dark:bg-card/40 p-2 space-y-1 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {customers.length === 0 ? (
 <p className="text-sm text-slate-500 dark:text-muted-foreground text-center py-2">No customers available.</p>
 ) : (
 customers.map(c => (
 <div 
 key={c.id} 
 onClick={() => toggleCustomer(c.id)}
 className={`flex items-center justify-between p-2 rounded-md cursor-pointer text-sm ${formData.customerIds.includes(c.id) ? 'bg-orange-50 border-[0.5px] border-black/9 dark:border-white/8 border-orange-200 text-orange-700 font-medium' : 'hover:bg-slate-50 dark:bg-secondary/50 text-slate-700 dark:text-foreground'}`}
 >
 {c.name}
 {formData.customerIds.includes(c.id) && <Check className="w-4 h-4 text-orange-600" />}
 </div>
 ))
 )}
 </div>
 )}
 </div>

 <div><label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Initial Points</label><Input type="number" value={formData.points} onChange={e => setFormData({ ...formData, points: e.target.value})} className="mt-1" /></div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Tier</label>
 <select value={formData.tier} onChange={e => setFormData({...formData, tier: e.target.value})} className="flex h-10 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm mt-1">
 <option>Bronze</option><option>Silver</option><option>Gold</option>
 </select>
 </div>
 </div>
 <div className="flex gap-3 pt-4 border-t">
 <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
 <Button className="flex-1 bg-orange-600 text-white" onClick={handleSave}>Save</Button>
 </div>
 </div>
 </div>
 )}
 <ConfirmationModal isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} onConfirm={handleDelete} title="Delete Member" message="Are you sure you want to remove this member from the program?" />
 </div>
 );
}


