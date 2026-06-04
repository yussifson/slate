import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Presentation, Search, Plus, MoreVertical, MapPin, Clock, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";

export default function VocWorkshops() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const queryClient = useQueryClient();
  const { data: records = [], isLoading } = useQuery({ 
    queryKey: ["voc_workshops", companyId], 
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'voc_workshop' }), 
    enabled: !!companyId 
  });
  
  const [formData, setFormData] = useState({ title: '', description: '', status: 'Scheduled', date: '', location: '', maxParticipants: '' });
  const [editingId, setEditingId] = useState(null);

  const workshops = records.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
    return {
      id: r.id,
      title: r.title,
      description: r.description || '',
      status: r.status || 'Scheduled',
      date: extra.date || '',
      location: extra.location || '',
      maxParticipants: extra.maxParticipants || ''
    };
  });

  const filtered = workshops.filter(s =>
    s.title?.toLowerCase().includes(search.toLowerCase()) || s.location?.toLowerCase().includes(search.toLowerCase())
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!companyId) return toast.error("Workspace not loaded.");
    if (!formData.title) return toast.error("Please enter workshop title");
    
    setIsSaving(true);
    try {
      const payload = {
        company_id: companyId,
        case_type: 'voc_workshop',
        title: formData.title,
        description: formData.description,
        status: formData.status,
        notes: JSON.stringify({
          date: formData.date,
          location: formData.location,
          maxParticipants: formData.maxParticipants
        })
      };

      if (editingId) {
        await base44.entities.LegalCase.update(editingId, payload);
        toast.success("Workshop updated!");
      } else {
        await base44.entities.LegalCase.create(payload);
        toast.success("Workshop added!");
      }

      queryClient.invalidateQueries({ queryKey: ["voc_workshops", companyId] });
      setShowModal(false);
      setEditingId(null);
      setFormData({ title: '', description: '', status: 'Scheduled', date: '', location: '', maxParticipants: '' });
    } catch (err) {
      toast.error(err?.message || "Failed to save record");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this workshop?")) {
      await base44.entities.LegalCase.delete(id);
      queryClient.invalidateQueries({ queryKey: ["voc_workshops", companyId] });
      toast.success("Workshop deleted.");
    }
  };

  return (
    <div className="space-y-6">
      <ModuleBanner
        title={t("workshops_seminars", "Workshops & Seminars")}
        subtitle={t("manage_workshops", "Organize short-term practical sessions")}
        metrics={[
          { title: "Total Workshops", value: workshops.length, icon: Presentation },
          { title: "Upcoming", value: workshops.filter(s => s.status === 'Scheduled').length, icon: Clock }
        ]}
      />
      
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by title or location..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
          <Plus className="w-4 h-4" /> {t("add_workshop", "Add Workshop")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
            <Presentation className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>{t("no_workshops_found", "No workshops found")}</p>
          </div>
        ) : (
          filtered.map(w => (
            <div key={w.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5 border-b border-border bg-muted/20 relative">
                <div className="absolute top-4 right-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => {
                        setEditingId(w.id);
                        setFormData(w);
                        setShowModal(true);
                      }}>Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600 font-medium" onClick={() => handleDelete(w.id)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                  <Presentation className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground pr-8">{w.title}</h3>
                <span className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${w.status === 'Scheduled' ? 'bg-amber-100 text-amber-700' : w.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>{w.status}</span>
              </div>
              <div className="p-5 space-y-3">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{w.description || "No description provided."}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{w.date || 'TBD'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{w.location || 'TBD'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>Max: {w.maxParticipants || 'Unlimited'} participants</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-sm w-full max-w-md overflow-hidden border border-border flex flex-col">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-card-foreground">{editingId ? 'Edit Workshop' : 'Add Workshop'}</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-bold text-muted-foreground uppercase">Title</label><Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1" /></div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-20 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-muted-foreground uppercase">Date/Time</label><Input type="datetime-local" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="mt-1" /></div>
                <div><label className="text-xs font-bold text-muted-foreground uppercase">Location</label><Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-muted-foreground uppercase">Max Participants</label><Input type="number" value={formData.maxParticipants} onChange={e => setFormData({...formData, maxParticipants: e.target.value})} className="mt-1" /></div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>Scheduled</option><option>Ongoing</option><option>Completed</option><option>Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-muted/30 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)} disabled={isSaving}>Cancel</Button>
              <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Workshop'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
