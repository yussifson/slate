import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { BookOpen, Search, Plus, MoreVertical, Calendar } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";

export default function VocPrograms() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const queryClient = useQueryClient();
  const { data: records = [], isLoading } = useQuery({ 
    queryKey: ["voc_programs", companyId], 
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'voc_program' }), 
    enabled: !!companyId 
  });
  
  const [formData, setFormData] = useState({ title: '', description: '', status: 'Active', duration: '', instructor: '', cost: '' });
  const [editingId, setEditingId] = useState(null);

  const programs = records.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
    return {
      id: r.id,
      title: r.title,
      description: r.description || '',
      status: r.status || 'Active',
      duration: extra.duration || '',
      instructor: extra.instructor || '',
      cost: extra.cost || ''
    };
  });

  const filtered = programs.filter(s =>
    s.title?.toLowerCase().includes(search.toLowerCase()) || s.instructor?.toLowerCase().includes(search.toLowerCase())
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!companyId) return toast.error("Workspace not loaded.");
    if (!formData.title) return toast.error("Please enter program title");
    
    setIsSaving(true);
    try {
      const payload = {
        company_id: companyId,
        case_type: 'voc_program',
        title: formData.title,
        description: formData.description,
        status: formData.status,
        notes: JSON.stringify({
          duration: formData.duration,
          instructor: formData.instructor,
          cost: formData.cost
        })
      };

      if (editingId) {
        await base44.entities.LegalCase.update(editingId, payload);
        toast.success("Program updated!");
      } else {
        await base44.entities.LegalCase.create(payload);
        toast.success("Program added!");
      }

      queryClient.invalidateQueries({ queryKey: ["voc_programs", companyId] });
      setShowModal(false);
      setEditingId(null);
      setFormData({ title: '', description: '', status: 'Active', duration: '', instructor: '', cost: '' });
    } catch (err) {
      toast.error(err?.message || "Failed to save record");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this program?")) {
      await base44.entities.LegalCase.delete(id);
      queryClient.invalidateQueries({ queryKey: ["voc_programs", companyId] });
      toast.success("Program deleted.");
    }
  };

  return (
    <div className="space-y-6">
      <ModuleBanner
        title={t("vocational_programs", "Vocational Programs")}
        subtitle={t("manage_programs", "Manage trades, curriculums and courses")}
        metrics={[
          { title: "Total Programs", value: programs.length, icon: BookOpen },
          { title: "Active", value: programs.filter(s => s.status === 'Active').length, icon: Calendar }
        ]}
      />
      
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by title or instructor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4" /> {t("add_program", "Add Program")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>{t("no_programs_found", "No programs found")}</p>
          </div>
        ) : (
          filtered.map(p => (
            <div key={p.id} className="bg-card rounded-xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow relative">
              <div className="absolute top-4 right-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => {
                      setEditingId(p.id);
                      setFormData(p);
                      setShowModal(true);
                    }}>Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600 font-medium" onClick={() => handleDelete(p.id)}>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1 pr-8">{p.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{p.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Instructor:</span> <span className="font-medium">{p.instructor || 'TBA'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Duration:</span> <span className="font-medium">{p.duration || '-'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cost:</span> <span className="font-medium">{p.cost || 'Free'}</span></div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>{p.status}</span>
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
              <h2 className="text-xl font-bold text-card-foreground">{editingId ? 'Edit Program' : 'Add Program'}</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-bold text-muted-foreground uppercase">Title</label><Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1" /></div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-20 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-muted-foreground uppercase">Instructor</label><Input value={formData.instructor} onChange={e => setFormData({...formData, instructor: e.target.value})} className="mt-1" /></div>
                <div><label className="text-xs font-bold text-muted-foreground uppercase">Duration (e.g. 6 mos)</label><Input value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-muted-foreground uppercase">Cost</label><Input value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} className="mt-1" /></div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>Active</option><option>Draft</option><option>Archived</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-muted/30 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)} disabled={isSaving}>Cancel</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Program'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
