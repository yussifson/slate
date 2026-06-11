import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompanyId } from '@/lib/hooks/useCompanyId';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, Mail, Phone, Building2, Plus, Search, 
  Trash2, Edit2, Loader2, User, XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export default function UnivContactManagement() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingData, setViewingData] = useState(null);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', phone: '', type: 'client', company_name: '' });

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['univ_contacts', companyId],
    queryFn: async () => {
      const res = await base44.db.from('univ_contacts').select('*').eq('company_id', companyId).order('first_name', { ascending: true });
      if (res.error) throw res.error;
      return res.data;
    },
    enabled: !!companyId
  });

  const mutateRecord = useMutation({
    mutationFn: async (payload) => {
      if (editingId) return await base44.db.from('univ_contacts').update(payload).eq('id', editingId);
      return await base44.db.from('univ_contacts').insert([{ ...payload, company_id: companyId }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_contacts']);
      toast.success(editingId ? "Contact updated" : "Contact added");
      setIsModalOpen(false);
      setEditingId(null);
    }
  });

  const deleteRecord = useMutation({
    mutationFn: async (id) => await base44.db.from('univ_contacts').delete().eq('id', id),
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_contacts']);
      toast.success("Contact deleted");
      setViewingData(null);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutateRecord.mutate(formData);
  };

  const openModal = (record = null) => {
    if (record) {
      setFormData(record);
      setEditingId(record.id);
    } else {
      setFormData({ first_name: '', last_name: '', email: '', phone: '', type: 'client', company_name: '' });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const filteredData = contacts.filter(c => 
    c.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" /> Contacts Directory
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Manage your clients, vendors, and partners.</p>
        </div>
        <button onClick={() => openModal()} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </div>

      <div className="relative shrink-0">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input 
          type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search contacts..." 
          className="w-full h-12 pl-10 pr-4 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm shadow-sm"
        />
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar bg-card border border-border rounded-2xl shadow-sm">
        {isLoading ? (
          <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {filteredData.map(c => (
              <div key={c.id} onClick={() => setViewingData(c)} className="bg-background border border-border p-5 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xl font-black mb-3">
                  {c.first_name?.[0]}{c.last_name?.[0]}
                </div>
                <h3 className="font-bold text-foreground">{c.first_name} {c.last_name}</h3>
                <p className="text-xs text-muted-foreground font-medium mt-1">{c.company_name || 'No Company'}</p>
                <span className={`mt-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  c.type === 'client' ? 'bg-blue-100 text-blue-700' : 
                  c.type === 'vendor' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
                }`}>{c.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black text-foreground">{editingId ? 'Edit Contact' : 'New Contact'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-muted hover:bg-muted/80 rounded-full text-muted-foreground transition-colors"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">First Name</label>
                  <input required type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Last Name</label>
                  <input required type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Phone</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Company</label>
                  <input type="text" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm">
                    <option value="client">Client</option>
                    <option value="vendor">Vendor</option>
                    <option value="partner">Partner</option>
                    <option value="lead">Lead</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border">
                <button type="button" onClick={() => setIsModalOpen(false)} className="h-10 px-5 bg-muted rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" disabled={mutateRecord.isPending} className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm">{mutateRecord.isPending ? 'Saving...' : 'Save Contact'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sheet */}
      <Sheet open={!!viewingData} onOpenChange={(open) => !open && setViewingData(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-md border-l border-border">
          <SheetHeader className="pb-6 border-b border-border text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center text-4xl font-black mb-2">
              {viewingData?.first_name?.[0]}{viewingData?.last_name?.[0]}
            </div>
            <SheetTitle className="text-2xl font-black">{viewingData?.first_name} {viewingData?.last_name}</SheetTitle>
            <SheetDescription className="text-sm font-medium mt-1">{viewingData?.company_name || 'Independent'}</SheetDescription>
            <span className={`mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              viewingData?.type === 'client' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
            }`}>{viewingData?.type}</span>
          </SheetHeader>
          {viewingData && (
            <div className="mt-6 space-y-4">
              <div className="bg-muted/50 p-4 rounded-xl border border-border space-y-4">
                <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-medium">{viewingData.email || '-'}</span></div>
                <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-medium">{viewingData.phone || '-'}</span></div>
                <div className="flex items-center gap-3"><Building2 className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-medium">{viewingData.company_name || '-'}</span></div>
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={() => { openModal(viewingData); setViewingData(null); }} className="flex-1 h-11 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"><Edit2 className="w-4 h-4" /> Edit Contact</button>
                <button onClick={() => deleteRecord.mutate(viewingData.id)} className="w-11 h-11 bg-red-50 text-red-600 rounded-xl flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

    </div>
  );
}
