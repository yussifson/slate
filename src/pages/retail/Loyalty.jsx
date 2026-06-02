import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Star, Search, Plus, Edit, Trash2, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function Loyalty() {
  const { t } = useTranslation();
  const { data: dbRecords = [], isLoading } = useIndustryRecords('loyalty');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const members = dbRecords.map(r => ({
    id: r.id,
    memberId: r.data?.memberId || `MBR-${r.id?.slice(0, 5).toUpperCase()}`,
    customerName: r.data?.customerName || 'Unnamed Member',
    points: parseInt(r.data?.points) || 0,
    tier: r.data?.tier || 'Bronze',
  }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    customerName: '', points: '', tier: 'Bronze'
  });

  const openEdit = (mbr) => {
    setEditingId(mbr.id);
    setFormData({ customerName: mbr.customerName, points: mbr.points, tier: mbr.tier });
    setShowModal(true);
  };

  const handleSave = () => {
    mutateRecord.mutate({
      ...(editingId ? { id: editingId } : {}),
      recordType: 'loyalty',
      payload: {
        customerName: formData.customerName,
        points: parseInt(formData.points) || 0,
        tier: formData.tier
      },
      status: 'active',
      searchText: `${formData.customerName} ${formData.tier}`
    }, {
      onSuccess: () => {
        toast.success(editingId ? 'Member updated!' : 'Member added!');
        setShowModal(false);
        setEditingId(null);
      }
    });
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
        <Button onClick={() => { setEditingId(null); setFormData({ customerName: '', points: '', tier: 'Bronze' }); setShowModal(true); }} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> Add Member
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/20 flex items-center justify-center text-blue-600"><Star className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-card-foreground">{members.length}</p><p className="text-xs text-muted-foreground">Total Members</p></div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/20 flex items-center justify-center text-purple-600"><Award className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-card-foreground">{members.filter(m => m.tier === 'Gold').length}</p><p className="text-xs text-muted-foreground">Gold Tier Members</p></div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
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
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${m.tier === 'Gold' ? 'bg-amber-100 text-amber-700' : m.tier === 'Silver' ? 'bg-slate-200 text-slate-700' : 'bg-orange-100 text-orange-800'}`}>{m.tier}</span>
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
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-card-foreground">{editingId ? 'Edit Member' : 'Add Member'}</h2>
            <div className="space-y-3">
               <div><label className="text-xs font-bold text-muted-foreground uppercase">Customer Name</label><Input value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} className="mt-1" /></div>
               <div><label className="text-xs font-bold text-muted-foreground uppercase">Points</label><Input type="number" value={formData.points} onChange={e => setFormData({ ...formData, points: e.target.value })} className="mt-1" /></div>
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">Tier</label>
                 <select value={formData.tier} onChange={e => setFormData({...formData, tier: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                   <option>Bronze</option><option>Silver</option><option>Gold</option>
                 </select>
               </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-blue-600 text-white" onClick={handleSave}>Save</Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} onConfirm={() => { deleteRecord.mutate({ id: deleteTargetId, recordType: 'loyalty' }); setDeleteTargetId(null); }} title="Remove Member" message="Are you sure you want to remove this member from the program?" />
    </div>
  );
}
