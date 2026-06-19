import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Users, Search, Plus, Phone, Mail, CheckCircle, MoreVertical, ShieldAlert, Activity } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function Clients() {
  const { t } = useTranslation();
  const { data: dbRecords = [], isLoading } = useIndustryRecords('insurance_client');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const clients = dbRecords.map(r => ({
    id: r.id,
    status: r.status || 'Active',
    ...r.data
  }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTargetId, setEditTargetId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    riskProfile: 'Low',
    lifetimeValue: '0'
  });

  const handleSave = () => {
    if (!formData.name.trim()) return toast.error("Client name is required");
    
    mutateRecord.mutate({
      id: editTargetId,
      recordType: 'insurance_client',
      payload: { ...formData, dateOnboarded: editTargetId ? formData.dateOnboarded : new Date().toISOString().split('T')[0] },
      status: formData.status || 'Active',
      searchText: `${formData.name} ${formData.email} ${formData.phone}`
    }, {
      onSuccess: () => {
        toast.success(editTargetId ? 'Client updated successfully!' : 'Client added successfully!');
        setShowModal(false);
        setEditTargetId(null);
      },
      onError: (err) => toast.error('Failed to save client: ' + err.message)
    });
  };

  const handleEdit = (client) => {
    setFormData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      riskProfile: client.riskProfile || 'Low',
      lifetimeValue: client.lifetimeValue || '0',
      dateOnboarded: client.dateOnboarded,
      status: client.status
    });
    setEditTargetId(client.id);
    setShowModal(true);
  };

  const openNewModal = () => {
    setFormData({ name: '', email: '', phone: '', address: '', riskProfile: 'Low', lifetimeValue: '0' });
    setEditTargetId(null);
    setShowModal(true);
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'insurance_client' }, {
      onSuccess: () => {
        toast.success('Client removed!');
        setDeleteTargetId(null);
      }
    });
  };

  const filtered = clients.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em]">{t("insurance_clients", "Policyholders & Clients")}</h1>
          <p className="text-sm text-[#71717a] mt-0.5">{t("manage_client_relationships", "Manage client relationships and risk profiles")}</p>
        </div>
        <Button onClick={openNewModal} className="gap-2 bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4" /> {t("new_client", "New Client")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-5 border-l-4 border-l-primary">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-foreground">{t("total_clients", "Total Clients")}</h3>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-semibold mt-2">{clients.length}</p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-5 border-l-4 border-l-amber-500">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-foreground">{t("high_risk", "High Risk Profile")}</h3>
            <ShieldAlert className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-semibold mt-2">{clients.filter(c => c.riskProfile === 'High').length}</p>
        </div>
        <div className="bg-card rounded-xl border-[0.5px] border-primary/40 p-5 border-l-4 border-l-green-500">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-foreground">{t("lifetime_value", "Avg Lifetime Value")}</h3>
            <Activity className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-semibold mt-2">
            ${clients.length > 0 ? Math.round(clients.reduce((sum, c) => sum + Number(c.lifetimeValue || 0), 0) / clients.length).toLocaleString() : 0}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border-[0.5px] border-primary/40 overflow-hidden">
        <div className="p-4 border-b border-primary/40 bg-muted/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
            <Input placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card border-b border-primary/40">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase">Client</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#71717a] uppercase">Contact</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#71717a] uppercase">Risk Profile</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] uppercase">LTV</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(client => (
                <tr key={client.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-card-foreground">{client.name}</p>
                    <p className="text-xs text-[#71717a]">Onboarded: {client.dateOnboarded}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-[#71717a]"><Mail className="w-3 h-3"/> {client.email}</div>
                    <div className="flex items-center gap-2 text-sm text-[#71717a] mt-1"><Phone className="w-3 h-3"/> {client.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      client.riskProfile === 'Low' ? 'bg-green-100 text-green-700' :
                      client.riskProfile === 'Medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {client.riskProfile} Risk
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-card-foreground">
                    ${Number(client.lifetimeValue || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(client)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteTargetId(client.id)} className="text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-[#71717a]">No clients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold">{editTargetId ? 'Edit Client' : 'New Client'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#71717a] uppercase">Full Name</label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Email</label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Phone</label>
                  <Input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Risk Profile</label>
                  <select value={formData.riskProfile} onChange={e => setFormData({...formData, riskProfile: e.target.value})} className="mt-1 w-full rounded-lg border-[0.5px] border-primary/40 bg-background px-3 py-2 text-sm">
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#71717a] uppercase">Lifetime Value ($)</label>
                  <Input type="number" value={formData.lifetimeValue} onChange={e => setFormData({...formData, lifetimeValue: e.target.value})} className="mt-1" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleSave}>Save</Button>
            </div>
          </div>
        </div>
      )}
      
      <ConfirmationModal isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} onConfirm={handleDelete} title="Delete Client" message="Are you sure you want to remove this client? This cannot be undone." />
    </div>
  );
}
