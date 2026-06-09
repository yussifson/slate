import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { BookOpen, Search, Plus, Calendar, MoreVertical, CheckCircle, FileText, Upload } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import { format } from "date-fns";

export default function Assignments() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { data: records = [], isLoading } = useIndustryRecords('assignment');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const [formData, setFormData] = useState({
    title: '', class: 'Grade 10', subject: '', dueDate: '', description: ''
  });

  const assignments = records.map(r => ({
    id: r.id,
    ...r.data
  }));

  const filtered = assignments.filter(a =>
    a.title?.toLowerCase().includes(search.toLowerCase()) || 
    a.class?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!formData.title || !formData.subject) return toast.error("Title and subject are required");
    
    const payload = {
      title: formData.title,
      class: formData.class,
      subject: formData.subject,
      dueDate: formData.dueDate,
      description: formData.description,
      dateCreated: new Date().toISOString(),
      status: 'Active'
    };

    if (editingId) {
      mutateRecord.mutate({
        id: editingId, recordType: 'assignment', payload, status: 'active',
        searchText: `${formData.title} ${formData.class} ${formData.subject}`
      }, {
        onSuccess: () => { toast.success("Assignment updated"); setShowModal(false); setEditingId(null); }
      });
    } else {
      mutateRecord.mutate({
        recordType: 'assignment', payload, status: 'active',
        searchText: `${formData.title} ${formData.class} ${formData.subject}`
      }, {
        onSuccess: () => { toast.success("Assignment created"); setShowModal(false); }
      });
    }
  };

  return (
    <div className="space-y-6 school-page-enter font-dmsans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl school-heading font-extrabold tracking-tight">{t("assignments", "Assignments & Homework")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("manage_class_assignments", "Manage class assignments and homework tracks")}</p>
        </div>
        <Button onClick={() => { setFormData({title: '', class: 'Grade 10', subject: '', dueDate: '', description: ''}); setShowModal(true); }} className="gap-2 bg-primary hover:bg-primary text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold">
          <Plus className="w-4 h-4" /> {t("create_assignment", "Create Assignment")}
        </Button>
      </div>
      
      {/* Search */}
      <div className="school-card p-5">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search assignments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">{t("loading", "Loading...")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 school-card">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20 text-primary" />
          <p className="font-semibold text-lg text-card-foreground">{t("no_assignments", "No assignments found")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(a => (
            <div key={a.id} className="bg-card/60 backdrop-blur-md rounded-3xl border border-border/60 p-6 shadow-sm  hover:-translate-y-1.5 transition-all duration-300 group relative overflow-hidden flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-transparent dark:from-primary/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none transform translate-x-1/4 -translate-y-1/4 scale-150 z-0">
                <FileText className="w-32 h-32 text-primary dark:text-primary/70" />
              </div>
              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 bg-background/50 hover:bg-background/80 shadow-sm backdrop-blur-sm rounded-full">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setEditingId(a.id);
                      setFormData({ title: a.title, class: a.class, subject: a.subject, dueDate: a.dueDate, description: a.description });
                      setShowModal(true);
                    }}>{t("edit", "Edit")}</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => deleteRecord.mutate({ id: a.id, recordType: 'assignment' })}>{t("delete", "Delete")}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex items-start gap-4 mb-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/10 dark:from-primary/40 dark:to-primary/40 border border-white/50 shadow-inner text-primary dark:text-primary/70 dark:text-primary/70 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-card-foreground text-lg line-clamp-1 tracking-tight group-hover:text-primary dark:text-primary/70 transition-colors">{a.title}</h3>
                  <p className="text-xs font-bold text-primary dark:text-primary/70 dark:text-primary/70 uppercase tracking-widest mt-1 opacity-90">{a.subject} • {a.class}</p>
                </div>
              </div>
              
              <div className="bg-slate-50/50 dark:bg-slate-900/50 border border-border/50 p-4 rounded-xl shadow-sm mb-5 relative z-10 flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{a.description}</p>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto relative z-10">
                <span className="text-xs font-bold flex items-center gap-2 text-slate-500 uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-primary" /> Due: {a.dueDate ? format(new Date(a.dueDate), 'MMM d, yyyy') : 'No Date'}
                </span>
                <span className="bg-slate-50 dark:bg-primary/20 text-primary dark:text-primary/30 border border-primary/20 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md shadow-sm">{t("active", "Active")}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-[#1E3A8A]/10 w-full max-w-md p-6 space-y-4 border border-border max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-lg font-bold text-card-foreground">{editingId ? 'Edit Assignment' : 'Create Assignment'}</h2>
            <div className="space-y-3">
              <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("title", "Title")}</label><Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("class", "Class")}</label><Input value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})} className="mt-1" /></div>
                <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("subject", "Subject")}</label><Input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="mt-1" /></div>
              </div>
              <div><label className="text-xs font-bold text-muted-foreground uppercase">{t("due_date", "Due Date")}</label><Input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="mt-1" /></div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("description", "Description / Instructions")}</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground resize-none h-24" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-primary hover:bg-primary text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold" onClick={handleSave}>
                {mutateRecord.isPending ? 'Saving...' : 'Save Assignment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
