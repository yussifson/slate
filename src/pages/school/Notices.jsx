import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Megaphone, Search, Plus, Calendar, Edit2, Trash2, Inbox, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { format } from "date-fns";
import { motion, AnimatePresence } from 'framer-motion';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import SchoolPageShell from '@/components/school/SchoolPageShell';

const priorityConfig = {
  Urgent: { cls: 'bg-rose-500 text-white', badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' },
  Important: { cls: 'bg-amber-500 text-white', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' },
  Normal: { cls: 'bg-slate-400 text-white', badge: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20' },
};

export default function Notices() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAudienceFilter, setSelectedAudienceFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: records = [], isLoading } = useIndustryRecords('school_notice');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const [formData, setFormData] = useState({ title: '', content: '', audience: 'All', category: 'General', priority: 'Normal', date: '', expiry_date: '', posted_by: '' });

  const notices = records.map(r => ({ id: r.id, ...r.data }));
  
  const filtered = notices.filter(n => {
    const matchSearch = n.title?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === 'All' || n.category === selectedCategory;
    const matchAudience = selectedAudienceFilter === 'All' || n.audience === selectedAudienceFilter || n.audience === 'All';
    return matchSearch && matchCategory && matchAudience;
  });

  const handleSave = () => {
    if (!formData.title || !formData.content) return toast.error("Title and content are required");
    const payload = { title: formData.title, content: formData.content, audience: formData.audience, category: formData.category, priority: formData.priority, date: formData.date || new Date().toISOString().split('T')[0], expiry_date: formData.expiry_date, posted_by: formData.posted_by, status: 'Published' };
    if (selectedId && isEditing) {
      mutateRecord.mutate({ id: selectedId, recordType: 'school_notice', payload, status: 'active', searchText: `${formData.title} ${formData.audience} ${formData.category}` }, { onSuccess: () => { toast.success("Notice updated"); setIsEditing(false); } });
    } else {
      mutateRecord.mutate({ recordType: 'school_notice', payload, status: 'active', searchText: `${formData.title} ${formData.audience} ${formData.category}` }, { onSuccess: () => { toast.success("Notice published"); setIsEditing(false); } });
    }
  };

  const selectedNotice = notices.find(n => n.id === selectedId);
  const inputCls = "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <SchoolPageShell
      title="Noticeboard"
      subtitle="Manage school announcements and communications"
      breadcrumb={['School', 'Noticeboard']}
      actions={
        <Button onClick={() => { setSelectedId(null); setIsEditing(true); setFormData({ title: '', content: '', audience: 'All', category: 'General', priority: 'Normal', date: '', expiry_date: '', posted_by: '' }); }} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm h-10 px-5 text-sm font-medium">
          <Plus className="w-4 h-4 mr-2" /> New Notice
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5 h-[calc(100vh-260px)] min-h-[500px]">
        {/* Left panel: notice list */}
        <div className="md:col-span-2 bg-card rounded-xl border border-border/50 shadow-sm flex flex-col overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-border/50 space-y-3 flex-shrink-0 bg-muted/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search notices..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background border-border/50 h-9 text-sm" />
            </div>
            <div className="flex gap-2">
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className={`${inputCls} flex-1 h-9 text-xs`}>
                <option value="All">All Categories</option>
                <option>General</option><option>Academic</option><option>Sports</option><option>Health</option><option>Emergency</option>
              </select>
              <select value={selectedAudienceFilter} onChange={e => setSelectedAudienceFilter(e.target.value)} className={`${inputCls} flex-1 h-9 text-xs`}>
                <option value="All">All Audience</option>
                <option>Students</option><option>Teachers</option><option>Parents</option>
              </select>
            </div>
          </div>
          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center">
                <Inbox className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No notices found</p>
              </div>
            ) : filtered.map(n => {
              const pCfg = priorityConfig[n.priority] || priorityConfig.Normal;
              return (
                <motion.div
                  key={n.id}
                  onClick={() => { setSelectedId(n.id); setIsEditing(false); }}
                  className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedId === n.id ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/30' : 'bg-background border-border/50 hover:bg-muted/30'}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-foreground text-sm line-clamp-1 flex-1">{n.title}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${pCfg.badge}`}>{n.priority}</span>
                  </div>
                  <div className="flex gap-1.5 mb-2">
                    <span className="text-xs bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">{n.category}</span>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">{n.audience}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.content}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right panel: detail/editor */}
        <div className="md:col-span-3 bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div key="edit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col h-full">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-5 flex-shrink-0">
                  <h2 className="text-lg font-bold text-white">{selectedId ? 'Edit Notice' : 'Compose Notice'}</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title *</label>
                    <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1.5 h-10" placeholder="Notice title..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</label>
                      <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={`mt-1.5 ${inputCls}`}>
                        <option>General</option><option>Academic</option><option>Sports</option><option>Health</option><option>Emergency</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Audience</label>
                      <select value={formData.audience} onChange={e => setFormData({...formData, audience: e.target.value})} className={`mt-1.5 ${inputCls}`}>
                        <option>All</option><option>Students</option><option>Teachers</option><option>Parents</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Priority</label>
                      <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className={`mt-1.5 ${inputCls}`}>
                        <option>Normal</option><option>Important</option><option>Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Posted By</label>
                      <Input value={formData.posted_by} onChange={e => setFormData({...formData, posted_by: e.target.value})} className="mt-1.5 h-10" placeholder="e.g. Headmaster" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Content *</label>
                    <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="mt-1.5 w-full h-32 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" placeholder="Message content..." />
                  </div>
                </div>
                <div className="flex gap-3 p-5 border-t border-border/50 flex-shrink-0">
                  <Button variant="outline" className="flex-1 h-10" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSave} disabled={mutateRecord.isPending}>
                    {mutateRecord.isPending ? 'Publishing...' : 'Publish Notice'}
                  </Button>
                </div>
              </motion.div>
            ) : selectedNotice ? (
              <motion.div key="view" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col h-full overflow-y-auto">
                <div className="p-6 border-b border-border/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${(priorityConfig[selectedNotice.priority] || priorityConfig.Normal).badge}`}>{selectedNotice.priority}</span>
                        <span className="text-xs bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-2.5 py-1 rounded-full font-medium">{selectedNotice.category}</span>
                        <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">For: {selectedNotice.audience}</span>
                      </div>
                      <h2 className="text-2xl font-bold text-foreground leading-snug">{selectedNotice.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {selectedNotice.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(selectedNotice.date), 'MMM d, yyyy')}</span>}
                        {selectedNotice.posted_by && <span>By: {selectedNotice.posted_by}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button className="p-2 rounded-lg border border-border/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" onClick={() => { setFormData({ title: selectedNotice.title || '', content: selectedNotice.content || '', audience: selectedNotice.audience || 'All', category: selectedNotice.category || 'General', priority: selectedNotice.priority || 'Normal', date: selectedNotice.date || '', expiry_date: selectedNotice.expiry_date || '', posted_by: selectedNotice.posted_by || '' }); setIsEditing(true); }}>
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg border border-rose-200 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-rose-500" onClick={() => { if (window.confirm('Delete this notice?')) deleteRecord.mutate({ id: selectedNotice.id, recordType: 'school_notice' }, { onSuccess: () => setSelectedId(null) }); }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6 flex-1">
                  <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">{selectedNotice.content}</p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full p-10 text-center">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4">
                  <Megaphone className="w-10 h-10 text-indigo-400" />
                </div>
                <p className="text-lg font-semibold text-foreground">Select a notice to read</p>
                <p className="text-muted-foreground text-sm mt-1">Or compose a new one from the button above</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </SchoolPageShell>
  );
}
