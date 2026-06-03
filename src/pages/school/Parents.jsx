import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Users, Search, Plus, Phone, Mail, MoreVertical, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import IDFormatSettings from '@/components/school/IDFormatSettings';

export default function Parents() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { data: records = [], isLoading } = useQuery({ 
    queryKey: ["clients", companyId], 
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'parent' }), 
    enabled: !!companyId 
  });

  const { data: schoolSettings } = useQuery({
    queryKey: ['school_settings', companyId],
    queryFn: async () => {
      const records = await base44.entities.IndustryRecord.filter({ company_id: companyId, record_type: 'school_settings' });
      return records.length > 0 ? records[0].data : { parentPrefix: 'PAR' };
    },
    enabled: !!companyId
  });

  const mutateParent = useMutation({
    mutationFn: (data) => data.id ? base44.entities.Client.update(data.id, data) : base44.entities.Client.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients", companyId] })
  });

  const deleteParent = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients", companyId] })
  });

  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '', parentId: ''
  });

  const parents = records.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
    return {
      id: r.id,
      name: r.name,
      parentId: r.id_number,
      phone: r.phone,
      email: extra.email || '',
      address: extra.address || '',
      avatar: r.name?.substring(0,2).toUpperCase()
    };
  });

  const filtered = parents.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) || p.parentId?.includes(search)
  );

  const handleEnroll = () => {
    if (!companyId) return toast.error("Workspace not loaded. Refresh the page and try again.");
    if (!formData.name) return toast.error("Please enter parent name");
    
    // Auto-generate a random parent ID based on settings
    const prefix = schoolSettings?.parentPrefix || 'PAR';
    const seq = Math.floor(1000 + Math.random() * 9000);
    const generatedId = `${prefix}-${seq}`;
    
    const parentId = formData.parentId || generatedId;
    
    const payload = {
      company_id: companyId,
      type: 'parent',
      name: formData.name,
      id_number: parentId,
      phone: formData.phone,
      status: 'active',
      notes: JSON.stringify({
        email: formData.email,
        address: formData.address,
        avatar: formData.name.substring(0,2).toUpperCase()
      })
    };

    const onDone = {
      onSuccess: () => {
        toast.success(editingId ? "Parent updated successfully!" : `Parent added! Default Password: password123`);
        setShowModal(false);
        setEditingId(null);
        setFormData({ name: '', phone: '', email: '', address: '', parentId: '' });
      },
      onError: (err) => toast.error(err?.message || "Failed to save parent"),
    };

    if (editingId) {
      mutateParent.mutate({ id: editingId, ...payload }, onDone);
    } else {
      mutateParent.mutate(payload, onDone);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">{t("parents", "Parents & Guardians")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("manage_parent_profiles", "Manage parent profiles and access credentials")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSettings(!showSettings)} className="gap-2">
            <Settings className="w-4 h-4" /> {t("id_settings", "ID Settings")}
          </Button>
          <Button onClick={() => setShowModal(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4" /> {t("add_parent", "Add Parent")}
          </Button>
        </div>
      </div>
      
      {showSettings && <IDFormatSettings />}

      {/* Search */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Parent Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>{t("no_parents_found", "No parents found")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Parent / Guardian</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">ID / Login ID</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Contact Info</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Address</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                        {p.avatar}
                      </div>
                      <p className="font-semibold text-card-foreground">{p.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.parentId}</td>
                  <td className="px-4 py-3">
                    <p className="text-foreground text-xs flex items-center gap-1"><Phone className="w-3 h-3"/> {p.phone}</p>
                    <p className="text-muted-foreground text-xs flex items-center gap-1"><Mail className="w-3 h-3"/> {p.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{p.address}</td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditingId(p.id);
                          setFormData({ name: p.name, phone: p.phone, email: p.email, address: p.address, parentId: p.parentId });
                          setShowModal(true);
                        }}>{t("edit", "Edit")}</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 font-medium" onClick={() => {
                          if (window.confirm("Are you sure?")) deleteParent.mutate(p.id);
                        }}>{t("delete", "Delete")}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-border">
            <h2 className="text-lg font-bold text-card-foreground">{editingId ? 'Edit Parent' : 'Add Parent'}</h2>
            <div className="space-y-3">
              <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("full_name", "Full Name")}</label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1" placeholder="Kwame Owusu" /></div>
              <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("phone", "Phone")}</label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("email", "Email")}</label><Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1" type="email" /></div>
              <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("address", "Address")}</label><Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="mt-1" /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)} disabled={mutateParent.isPending}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleEnroll} disabled={mutateParent.isPending}>
                {mutateParent.isPending ? 'Saving...' : 'Save Parent'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
