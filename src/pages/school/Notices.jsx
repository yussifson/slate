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

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col font-dmsans bg-[#F0F4FF] dark:bg-blue-900/20 rounded-3xl overflow-hidden border-[0.5px] border-black/9 dark:border-white/8 border-emerald-100 max-w-7xl mx-auto">
      <div className="bg-emerald-600 text-white p-6 md:p-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight tracking-[-0.02em]">{t("noticeboard", "Noticeboard")}</h1>
          <p className="text-emerald-100 mt-1">{t("manage_announcements", "Manage school announcements and communications")}</p>
        </div>
        <Button 
          onClick={() => { setSelectedId(null); setIsEditing(true); setFormData({title: '', content: '', audience: 'All', category: 'General', priority: 'Normal', date: '', expiry_date: '', posted_by: ''}); }} 
          className="bg-emerald-500/10 hover:bg-emerald-400 text-white border-[0.5px] border-emerald-400 rounded-xl px-6 h-12 text-lg font-semibold transition-all"
        >
          <Plus className="w-5 h-5 mr-2" /> {t("new_notice", "New Notice")}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-full md:w-1/3 bg-white border-r border-emerald-100 flex flex-col">
          <div className="p-4 border-b border-emerald-100 bg-[#F0F4FF] dark:bg-blue-900/20/50 space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1E3A8A] dark:text-blue-400" />
              <Input 
                placeholder="Search notices..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="pl-12 bg-white border-emerald-200 focus-visible:ring-emerald-500 rounded-2xl h-12" 
              />
            </div>
            <div className="flex gap-2">
              <select value={selectedCategory} onChange={e=>setSelectedCategory(e.target.value)} className="flex-1 rounded-xl border border-emerald-200 bg-white p-2 text-sm text-emerald-900">
                <option value="All">All Categories</option>
                <option value="General">General</option>
                <option value="Academic">Academic</option>
                <option value="Sports">Sports</option>
                <option value="Health">Health</option>
                <option value="Emergency">Emergency</option>
              </select>
              <select value={selectedAudienceFilter} onChange={e=>setSelectedAudienceFilter(e.target.value)} className="flex-1 rounded-xl border border-emerald-200 bg-white p-2 text-sm text-emerald-900">
                <option value="All">All Audience</option>
                <option value="Students">Students</option>
                <option value="Teachers">Teachers</option>
                <option value="Parents">Parents</option>
              </select>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {isLoading ? (
              <div className="p-4 text-center text-[#1E3A8A] dark:text-blue-400 font-semibold">{t("loading", "Loading...")}</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-emerald-400">
                <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-semibold text-lg">{t("no_notices", "No notices found")}</p>
              </div>
            ) : (
              filtered.map(n => (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  key={n.id} 
                  onClick={() => { setSelectedId(n.id); setIsEditing(false); }}
                  className={`p-5 rounded-2xl cursor-pointer border-2 transition-all relative overflow-hidden ${selectedId === n.id ? 'bg-[#F0F4FF] dark:bg-blue-900/20 border-emerald-400' : 'bg-white border-emerald-100 hover:bg-[#F0F4FF] dark:bg-blue-900/20'}`}
                >
                  <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-lg text-xs font-bold text-white ${
                    n.priority === 'Urgent' ? 'bg-red-500 animate-pulse' : n.priority === 'Important' ? 'bg-orange-500' : 'bg-gray-400'
                  }`}>
                    {n.priority}
                  </div>
                  <h3 className="font-extrabold text-emerald-900 line-clamp-1 text-lg pr-12">{n.title}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">{n.category}</span>
                    <span className="text-xs font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wider">{n.audience}</span>
                  </div>
                  <p className="text-sm text-emerald-500 mt-2 line-clamp-2 font-medium">{n.content}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="hidden md:flex flex-1 bg-[#F0F4FF] dark:bg-blue-900/20 p-8 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div 
                key="edit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl border-[0.5px] border-emerald-200 p-10 max-w-3xl mx-auto w-full"
              >
                <h2 className="text-3xl font-extrabold text-emerald-900 mb-8 tracking-[-0.02em]">{selectedId ? 'Edit Notice' : 'Compose Notice'}</h2>
                <div className="space-y-6 font-dmsans">
                  <div>
                    <label className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wide">Title</label>
                    <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-2 border-emerald-200 focus-visible:ring-emerald-500 rounded-xl h-12 text-lg" placeholder="Notice title..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wide">Category</label>
                      <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="mt-2 w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-lg text-emerald-900">
                        <option>General</option>
                        <option>Academic</option>
                        <option>Sports</option>
                        <option>Health</option>
                        <option>Emergency</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wide">Audience</label>
                      <select value={formData.audience} onChange={e => setFormData({...formData, audience: e.target.value})} className="mt-2 w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-lg text-emerald-900">
                        <option>All</option>
                        <option>Students</option>
                        <option>Teachers</option>
                        <option>Parents</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wide">Priority</label>
                      <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="mt-2 w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-lg text-emerald-900">
                        <option>Normal</option>
                        <option>Important</option>
                        <option>Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wide">Posted By</label>
                      <Input value={formData.posted_by} onChange={e => setFormData({...formData, posted_by: e.target.value})} className="mt-2 border-emerald-200 focus-visible:ring-emerald-500 rounded-xl h-12" placeholder="e.g. Headmaster" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wide">Content</label>
                    <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="mt-2 w-full rounded-xl border border-emerald-200 bg-white p-4 text-lg text-emerald-900 resize-none h-64 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Message content..." />
                  </div>
                </div>
                <div className="flex gap-4 mt-10">
                  <Button variant="outline" className="flex-1 border-emerald-200 text-[#1E3A8A] dark:text-blue-400 hover:bg-[#F0F4FF] dark:bg-blue-900/20 rounded-xl h-14 text-lg font-semibold" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button className="flex-1 bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md transition-all rounded-xl h-14 text-lg font-semibold" onClick={handleSave}>
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
                className="bg-white rounded-3xl border-[0.5px] border-emerald-200 p-10 max-w-3xl mx-auto w-full"
              >
                <div className="flex justify-between items-start mb-8 pb-8 border-b border-emerald-100">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold text-white px-2 py-1 rounded ${
                        selectedNotice.priority === 'Urgent' ? 'bg-red-500 animate-pulse' : selectedNotice.priority === 'Important' ? 'bg-orange-500' : 'bg-gray-400'
                      }`}>{selectedNotice.priority}</span>
                      <span className="text-sm font-semibold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full uppercase tracking-wider">{selectedNotice.category}</span>
                    </div>
                    <h2 className="text-4xl font-extrabold text-emerald-900 leading-tight tracking-[-0.02em]">{selectedNotice.title}</h2>
                    <div className="flex items-center gap-4 mt-4">
                      <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-4 py-1.5 rounded-full uppercase tracking-wider">For: {selectedNotice.audience}</span>
                      <span className="text-sm font-semibold text-emerald-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> {selectedNotice.date ? format(new Date(selectedNotice.date), 'MMM d, yyyy') : 'No Date'}</span>
                      {selectedNotice.posted_by && <span className="text-sm text-gray-500">By: {selectedNotice.posted_by}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="icon" className="h-12 w-12 border-emerald-200 text-[#1E3A8A] rounded-xl" onClick={() => { 
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
                    <Button variant="outline" size="icon" className="h-12 w-12 border-red-200 text-red-600 hover:bg-red-50 rounded-xl" onClick={() => { if(window.confirm('Delete this notice?')) deleteRecord.mutate({ id: selectedNotice.id, recordType: 'school_notice' }, { onSuccess: () => setSelectedId(null) }); }}>
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                <div className="prose prose-emerald prose-lg max-w-none">
                  <p className="text-emerald-800 whitespace-pre-wrap leading-relaxed font-medium">{selectedNotice.content}</p>
                </div>
              </motion.div>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-emerald-400">
                <div className="bg-emerald-100 p-8 rounded-full mb-6">
                  <Megaphone className="w-20 h-20 text-emerald-500" />
                </div>
                <p className="text-2xl font-extrabold text-[#1E3A8A] tracking-[-0.02em]">Select a notice to read</p>
                <p className="text-emerald-500 font-medium mt-2">Or compose a new one from the top right</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
