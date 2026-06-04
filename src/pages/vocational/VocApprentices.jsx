import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Users, Search, Plus, MoreVertical, Briefcase, UserCheck, AlertCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";

const statusColors = { Active: 'bg-emerald-100 text-emerald-700', Completed: 'bg-blue-100 text-blue-700', Dropped: 'bg-red-100 text-red-700' };

export default function VocApprentices() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const queryClient = useQueryClient();
  const { data: records = [], isLoading } = useQuery({ 
    queryKey: ["voc_apprentices", companyId], 
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'voc_apprentice' }), 
    enabled: !!companyId 
  });
  
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', trade: '', enrollmentDate: '', status: 'Active' });
  const [editingId, setEditingId] = useState(null);

  const apprentices = records.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
    return {
      id: r.id,
      name: r.name,
      phone: r.phone,
      email: extra.email || '',
      trade: extra.trade || 'Undecided',
      enrollmentDate: extra.enrollmentDate || '',
      status: extra.status || 'Active',
      avatar: r.name?.substring(0,2).toUpperCase()
    };
  });

  const filtered = apprentices.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) || s.trade?.toLowerCase().includes(search.toLowerCase())
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!companyId) return toast.error("Workspace not loaded.");
    if (!formData.name) return toast.error("Please enter apprentice name");
    
    setIsSaving(true);
    try {
      const payload = {
        company_id: companyId,
        type: 'voc_apprentice',
        name: formData.name,
        phone: formData.phone,
        notes: JSON.stringify({
          email: formData.email,
          trade: formData.trade,
          enrollmentDate: formData.enrollmentDate,
          status: formData.status
        })
      };

      if (editingId) {
        await base44.entities.Client.update(editingId, payload);
        toast.success("Apprentice updated!");
      } else {
        await base44.entities.Client.create(payload);
        toast.success("Apprentice added!");
      }

      queryClient.invalidateQueries({ queryKey: ["voc_apprentices", companyId] });
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', phone: '', email: '', trade: '', enrollmentDate: '', status: 'Active' });
    } catch (err) {
      toast.error(err?.message || "Failed to save record");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this apprentice?")) {
      await base44.entities.Client.delete(id);
      queryClient.invalidateQueries({ queryKey: ["voc_apprentices", companyId] });
      toast.success("Apprentice deleted.");
    }
  };

  return (
    <div className="space-y-6">
      <ModuleBanner
        title={t("apprentices_directory", "Apprentices Directory")}
        subtitle={t("manage_apprentices", "Manage apprentices and their training progress")}
        metrics={[
          { title: "Total Apprentices", value: apprentices.length, icon: Users },
          { title: "Active", value: apprentices.filter(s => s.status === 'Active').length, icon: UserCheck },
          { title: "Completed", value: apprentices.filter(s => s.status === 'Completed').length, icon: Briefcase },
        ]}
      />
      
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or trade..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4" /> {t("add_apprentice", "Add Apprentice")}
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>{t("no_apprentices_found", "No apprentices found")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">Apprentice</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">Trade/Skill</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">Enrolled</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
                        {s.avatar}
                      </div>
                      <p className="font-semibold text-card-foreground">{s.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{s.trade}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{s.phone} <br/> {s.email}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{s.enrollmentDate}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[s.status] || 'bg-gray-100 text-gray-700'}`}>{s.status}</span></td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => {
                          setEditingId(s.id);
                          setFormData({ name: s.name, phone: s.phone, email: s.email, trade: s.trade, enrollmentDate: s.enrollmentDate, status: s.status });
                          setShowModal(true);
                        }}>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 font-medium" onClick={() => handleDelete(s.id)}>Delete</DropdownMenuItem>
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
          <div className="bg-card rounded-2xl shadow-sm w-full max-w-md overflow-hidden border border-border flex flex-col">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-card-foreground">{editingId ? 'Edit Apprentice' : 'Add Apprentice'}</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-bold text-muted-foreground uppercase">Name</label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-muted-foreground uppercase">Phone</label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-1" /></div>
                <div><label className="text-xs font-bold text-muted-foreground uppercase">Email</label><Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1" type="email" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-muted-foreground uppercase">Trade</label><Input value={formData.trade} placeholder="e.g. Carpentry" onChange={e => setFormData({...formData, trade: e.target.value})} className="mt-1" /></div>
                <div><label className="text-xs font-bold text-muted-foreground uppercase">Enrollment Date</label><Input value={formData.enrollmentDate} onChange={e => setFormData({...formData, enrollmentDate: e.target.value})} className="mt-1" type="date" /></div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>Active</option><option>Completed</option><option>Dropped</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-muted/30 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)} disabled={isSaving}>Cancel</Button>
              <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Apprentice'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
