import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Megaphone, Search, Plus, Calendar, MoreVertical, Edit2, Trash2, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { powerSync } from '@/api/PowerSyncConnector';
import { toast } from 'react-hot-toast';
import { format } from "date-fns";
import { motion, AnimatePresence } from 'framer-motion';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';

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

  const [formData, setFormData] = useState({ 
    title: '', content: '', audience: 'All', category: 'General', priority: 'Normal', date: '', expiry_date: '', posted_by: ''
  });

  const notices = records.map(r => ({ id: r.id, ...r.data }));
  
  const filtered = notices.filter(n => {
    const matchSearch = n.title?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === 'All' || n.category === selectedCategory;
    const matchAudience = selectedAudienceFilter === 'All' || n.audience === selectedAudienceFilter || n.audience === 'All';
    return matchSearch && matchCategory && matchAudience;
  });

  const handleSave = () => {
    if (!formData.title || !formData.content) return toast.error("Title and content are required");
    
    const payload = {
      title: formData.title,
      content: formData.content,
      audience: formData.audience,
      category: formData.category,
      priority: formData.priority,
      date: formData.date || new Date().toISOString().split('T')[0],
      expiry_date: formData.expiry_date,
      posted_by: formData.posted_by,
      status: 'Published'
    };

    if (selectedId && isEditing) {
      mutateRecord.mutate({
        id: selectedId, recordType: 'school_notice', payload, status: 'active',
        searchText: `${formData.title} ${formData.audience} ${formData.category}`
      }, {
        onSuccess: () => { toast.success("Notice updated"); setIsEditing(false); }
      });
    } else {
      mutateRecord.mutate({
        recordType: 'school_notice', payload, status: 'active',
        searchText: `${formData.title} ${formData.audience} ${formData.category}`
      }, {
        onSuccess: () => { toast.success("Notice published"); setIsEditing(false); }
      });
    }
  };

  const selectedNotice = notices.find(n => n.id === selectedId);

  const cardStyle = "bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.02)]";
  const primaryBtn = "bg-gradient-to-r from-indigo-600 to-orange-500 hover:opacity-90 text-white rounded-full font-semibold px-6 py-2.5 transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(99,102,241,0.15)]";
  const secondaryBtn = "bg-white dark:bg-zinc-800 hover:bg-[#FAF8F5] dark:hover:bg-zinc-700 text-[#1F1E1C] dark:text-zinc-50 border border-[#E4DFD5] dark:border-zinc-700 rounded-full font-semibold px-6 py-2.5 transition-all hover:scale-[1.02]";
  const inputStyle = "rounded-xl border-[1.5px] border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none w-full";

  return (
    <div className={`school-theme-root h-[calc(100vh-80px)] flex flex-col font-sans bg-[#FCFAF7] dark:bg-zinc-950 ${cardStyle} overflow-hidden max-w-7xl mx-auto`}>
      <div className="bg-white dark:bg-zinc-900 border-b border-[#F0EBE1] dark:border-zinc-800 p-6 md:p-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1F1E1C] dark:text-zinc-50">{t("noticeboard", "Noticeboard")}</h1>
          <p className="text-zinc-500 font-medium mt-1">{t("manage_announcements", "Manage school announcements and communications")}</p>
        </div>
        <Button 
          onClick={() => { setSelectedId(null); setIsEditing(true); setFormData({title: '', content: '', audience: 'All', category: 'General', priority: 'Normal', date: '', expiry_date: '', posted_by: ''}); }} 
          className={primaryBtn}
        >
          <Plus className="w-5 h-5 mr-2" /> {t("new_notice", "New Notice")}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-full md:w-1/3 bg-white dark:bg-zinc-900 border-r border-[#F0EBE1] dark:border-zinc-800 flex flex-col">
          <div className="p-4 border-b border-[#F0EBE1] dark:border-zinc-800 bg-[#FCFAF7] dark:bg-zinc-950 space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <Input 
                placeholder="Search notices..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className={`${inputStyle} pl-12 h-12`} 
              />
            </div>
            <div className="flex gap-2">
              <select value={selectedCategory} onChange={e=>setSelectedCategory(e.target.value)} className={`${inputStyle} flex-1 p-2 h-11 text-sm text-[#1F1E1C] dark:text-zinc-50`}>
                <option value="All">All Categories</option>
                <option value="General">General</option>
                <option value="Academic">Academic</option>
                <option value="Sports">Sports</option>
                <option value="Health">Health</option>
                <option value="Emergency">Emergency</option>
              </select>
              <select value={selectedAudienceFilter} onChange={e=>setSelectedAudienceFilter(e.target.value)} className={`${inputStyle} flex-1 p-2 h-11 text-sm text-[#1F1E1C] dark:text-zinc-50`}>
                <option value="All">All Audience</option>
                <option value="Students">Students</option>
                <option value="Teachers">Teachers</option>
                <option value="Parents">Parents</option>
              </select>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[#FCFAF7] dark:bg-zinc-950">
            {isLoading ? (
              <div className="p-4 text-center text-indigo-600 font-semibold">{t("loading", "Loading...")}</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-zinc-400">
                <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-semibold text-lg text-zinc-500">{t("no_notices", "No notices found")}</p>
              </div>
            ) : (
              filtered.map(n => (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  key={n.id} 
                  onClick={() => { setSelectedId(n.id); setIsEditing(false); }}
                  className={`p-5 rounded-[1.5rem] cursor-pointer border transition-all relative overflow-hidden ${selectedId === n.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/50' : 'bg-white dark:bg-zinc-900 border-[#F0EBE1] dark:border-zinc-800 hover:bg-[#FAF8F5] dark:hover:bg-zinc-800/50'}`}
                >
                  <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold text-white uppercase tracking-widest ${
                    n.priority === 'Urgent' ? 'bg-red-500 animate-pulse' : n.priority === 'Important' ? 'bg-orange-500' : 'bg-zinc-400'
                  }`}>
                    {n.priority}
                  </div>
                  <h3 className="font-semibold text-[#1F1E1C] dark:text-zinc-50 line-clamp-1 text-lg pr-12">{n.title}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 px-2 py-0.5 rounded-full uppercase tracking-widest">{n.category}</span>
                    <span className="text-[10px] font-bold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 px-2 py-0.5 rounded-full uppercase tracking-widest">{n.audience}</span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-3 line-clamp-2 font-medium">{n.content}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="hidden md:flex flex-1 bg-[#FCFAF7] dark:bg-zinc-950 p-8 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div 
                key="edit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`${cardStyle} p-10 max-w-3xl mx-auto w-full`}
              >
                <h2 className="text-3xl font-semibold text-[#1F1E1C] dark:text-zinc-50 mb-8 tracking-tight">{selectedId ? 'Edit Notice' : 'Compose Notice'}</h2>
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Title</label>
                    <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={`${inputStyle} h-12 text-lg px-4`} placeholder="Notice title..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Category</label>
                      <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={`${inputStyle} h-12 px-4 text-base`}>
                        <option>General</option>
                        <option>Academic</option>
                        <option>Sports</option>
                        <option>Health</option>
                        <option>Emergency</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Audience</label>
                      <select value={formData.audience} onChange={e => setFormData({...formData, audience: e.target.value})} className={`${inputStyle} h-12 px-4 text-base`}>
                        <option>All</option>
                        <option>Students</option>
                        <option>Teachers</option>
                        <option>Parents</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Priority</label>
                      <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className={`${inputStyle} h-12 px-4 text-base`}>
                        <option>Normal</option>
                        <option>Important</option>
                        <option>Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Posted By</label>
                      <Input value={formData.posted_by} onChange={e => setFormData({...formData, posted_by: e.target.value})} className={`${inputStyle} h-12 px-4`} placeholder="e.g. Headmaster" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Content</label>
                    <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className={`${inputStyle} p-4 text-base resize-none h-64`} placeholder="Message content..." />
                  </div>
                </div>
                <div className="flex gap-4 mt-10">
                  <Button variant="outline" className={`${secondaryBtn} flex-1 h-14`} onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button className={`${primaryBtn} flex-1 h-14 text-lg`} onClick={handleSave}>
                    {mutateRecord.isPending ? 'Publishing...' : 'Publish Notice'}
                  </Button>
                </div>
              </motion.div>
            ) : selectedNotice ? (
              <motion.div 
                key="view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`${cardStyle} p-10 max-w-3xl mx-auto w-full`}
              >
                <div className="flex justify-between items-start mb-8 pb-8 border-b border-[#F0EBE1] dark:border-zinc-800">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`text-[10px] font-bold text-white px-3 py-1 rounded-full uppercase tracking-widest ${
                        selectedNotice.priority === 'Urgent' ? 'bg-red-500 animate-pulse' : selectedNotice.priority === 'Important' ? 'bg-orange-500' : 'bg-zinc-400'
                      }`}>{selectedNotice.priority}</span>
                      <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-400 px-3 py-1 rounded-full uppercase tracking-widest">{selectedNotice.category}</span>
                    </div>
                    <h2 className="text-4xl font-semibold text-[#1F1E1C] dark:text-zinc-50 leading-tight tracking-tight">{selectedNotice.title}</h2>
                    <div className="flex items-center gap-4 mt-4 flex-wrap">
                      <span className="text-xs font-bold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 px-4 py-1.5 rounded-full uppercase tracking-widest">For: {selectedNotice.audience}</span>
                      <span className="text-sm font-semibold text-zinc-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> {selectedNotice.date ? format(new Date(selectedNotice.date), 'MMM d, yyyy') : 'No Date'}</span>
                      {selectedNotice.posted_by && <span className="text-sm font-medium text-zinc-400">By: {selectedNotice.posted_by}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="icon" className="h-12 w-12 border-[#E4DFD5] dark:border-zinc-700 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30" onClick={() => { 
                      setFormData({ 
                        title: selectedNotice.title || '', 
                        content: selectedNotice.content || '', 
                        audience: selectedNotice.audience || 'All', 
                        category: selectedNotice.category || 'General', 
                        priority: selectedNotice.priority || 'Normal', 
                        date: selectedNotice.date || '', 
                        expiry_date: selectedNotice.expiry_date || '', 
                        posted_by: selectedNotice.posted_by || '' 
                      }); 
                      setIsEditing(true); 
                    }}>
                      <Edit2 className="w-5 h-5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-12 w-12 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20 rounded-xl" onClick={() => { if(window.confirm('Delete this notice?')) deleteRecord.mutate({ id: selectedNotice.id, recordType: 'school_notice' }, { onSuccess: () => setSelectedId(null) }); }}>
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-[#1F1E1C] dark:text-zinc-300 whitespace-pre-wrap leading-relaxed font-medium">{selectedNotice.content}</p>
                </div>
              </motion.div>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-zinc-400">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-[2rem] mb-6">
                  <Megaphone className="w-20 h-20 text-indigo-400" />
                </div>
                <p className="text-2xl font-semibold text-[#1F1E1C] dark:text-zinc-50 tracking-tight">Select a notice to read</p>
                <p className="text-zinc-500 font-medium mt-2">Or compose a new one from the top right</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
