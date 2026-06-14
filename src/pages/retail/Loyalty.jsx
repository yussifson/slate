import React, { useState} from 'react';
import { useTranslation} from "react-i18next";
import { Star, Search, Plus, Edit, Trash2, Award, Check} from 'lucide-react';
import { ViewModeToggle, RetailStatCard, LoyaltyGridCard} from '@/components/retail/RetailViewKit';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function Loyalty() {
 const { t} = useTranslation();
 const { data: dbRecords = [], isLoading} = useIndustryRecords('loyalty');
 const { data: customerRecords = []} = useIndustryRecords('customer');
 const mutateRecord = useMutateIndustryRecord();
 const deleteRecord = useDeleteIndustryRecord();

 const customers = customerRecords.map(r => ({
 id: r.id,
 name: r.data?.name || 'Unnamed Customer'
}));

 const members = dbRecords.map(r => ({
 id: r.id,
 memberId: r.data?.memberId || `MBR-${r.id?.slice(0, 5).toUpperCase()}`,
 customerId: r.data?.customerId || '',
 customerName: r.data?.customerId ? (customers.find(c => c.id === r.data.customerId)?.name || 'Unknown') : (r.data?.customerName || 'Unnamed Member'),
 points: parseInt(r.data?.points) || 0,
 tier: r.data?.tier || 'Bronze',
}));

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

 const handleSave = async () => {
 if (formData.customerIds.length === 0) {
 toast.error("Please select at least one customer.");
 return;
}

 try {
 if (editingId) {
 // Edit mode (single update, usually 1 customer anyway)
 const cId = formData.customerIds[0];
 await mutateRecord.mutateAsync({
 id: editingId,
 recordType: 'loyalty',
 payload: {
 customerId: cId,
 points: parseInt(formData.points) || 0,
 tier: formData.tier
},
 status: 'active',
 searchText: `${cId} ${formData.tier}`
});
 toast.success('Member updated!');
} else {
 // Create mode (multi-select assignment)
 for (const cId of formData.customerIds) {
 await mutateRecord.mutateAsync({
 recordType: 'loyalty',
 payload: {
 customerId: cId,
 points: parseInt(formData.points) || 0,
 tier: formData.tier
},
 status: 'active',
 searchText: `${cId} ${formData.tier}`
});
}
 toast.success(`Successfully assigned to ${formData.customerIds.length} customer(s)!`);
}
 setShowModal(false);
 setEditingId(null);
} catch (err) {
 toast.error("Failed to save loyalty data");
}
};

 const filtered = members.filter(m => 
 m.memberId.toLowerCase().includes(search.toLowerCase()) || 
 m.customerName.toLowerCase().includes(search.toLowerCase())
 );

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-card-foreground">Loyalty Program</h1>
 <p className="text-sm text-muted-foreground mt-0.5">Manage rewards and tiers for your best customers.</p>
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

 <div className="bg-card rounded-xl border border-border overflow-hidden">
 <div className="p-4 border-b border-border bg-muted/50">
 <div className="relative max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
 </div>
 </div>
 <div className="overflow-x-auto">
 {isLoading ? <div className="py-12 text-center">Loading...</div> : filtered.length === 0 ? (
 <div className="py-12 text-center text-muted-foreground">
 <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
 <p className="font-semibold">No loyalty members yet.</p>
 </div>
 ) : viewMode === 'grid' ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 p-6">
 {filtered.map(m => (
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
 <thead className="bg-card border-b border-border">
 <tr>
 <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Member ID</th>
 <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Customer Name</th>
 <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Points</th>
 <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Tier</th>
 <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map(m => (
 <tr key={m.id} className="hover:bg-muted/50 transition-colors">
 <td className="px-6 py-4 font-bold text-card-foreground">{m.memberId}</td>
 <td className="px-6 py-4 text-muted-foreground">{m.customerName}</td>
 <td className="px-6 py-4 text-center font-bold text-primary">{m.points}</td>
 <td className="px-6 py-4 text-center">
 <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${m.tier === 'Gold' ? 'bg-amber-100 text-amber-700' : m.tier === 'Silver' ? 'bg-slate-200 text-slate-700 dark:text-slate-300' : 'bg-orange-100 text-orange-800'}`}>{m.tier}</span>
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
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
 <h2 className="text-lg font-bold text-card-foreground">{editingId ? 'Edit Member' : 'Add Member(s)'}</h2>
 <div className="space-y-4">
 
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">
 {editingId ? 'Customer' : 'Select Customer(s)'}
 </label>
 {editingId ? (
 <select value={formData.customerIds[0] || ''} onChange={e => setFormData({...formData, customerIds: [e.target.value]})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
 {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
 </select>
 ) : (
 <div className="border rounded-md max-h-48 overflow-y-auto bg-white dark:bg-slate-900/40 p-2 space-y-1">
 {customers.length === 0 ? (
 <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-2">No customers available.</p>
 ) : (
 customers.map(c => (
 <div 
 key={c.id} 
 onClick={() => toggleCustomer(c.id)}
 className={`flex items-center justify-between p-2 rounded cursor-pointer text-sm ${formData.customerIds.includes(c.id) ? 'bg-orange-50 border border-orange-200 text-orange-700 font-medium' : 'hover:bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'}`}
 >
 {c.name}
 {formData.customerIds.includes(c.id) && <Check className="w-4 h-4 text-orange-600" />}
 </div>
 ))
 )}
 </div>
 )}
 </div>

 <div><label className="text-xs font-bold text-muted-foreground uppercase">Initial Points</label><Input type="number" value={formData.points} onChange={e => setFormData({ ...formData, points: e.target.value})} className="mt-1" /></div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">Tier</label>
 <select value={formData.tier} onChange={e => setFormData({...formData, tier: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
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
 <ConfirmationModal isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} onConfirm={() => { deleteRecord.mutate({ id: deleteTargetId, recordType: 'loyalty'}); setDeleteTargetId(null);}} title="Delete Member" message="Are you sure you want to remove this member from the program?" />
 </div>
 );
}
