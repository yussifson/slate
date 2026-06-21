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

export default function Notices() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: records = [], isLoading } = useIndustryRecords('notice');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const [formData, setFormData] = useState({ title: '', audience: 'All', content: '' });

  const notices = records.map(r => ({ id: r.id, ...r.data }));
  const filtered = notices.filter(n => n.title?.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!formData.title || !formData.content) return toast.error("Title and content are required");
    
    const payload = {
      title: formData.title,
      audience: formData.audience,
      content: formData.content,
      datePublished: new Date().toISOString(),
      status: 'Published'
    };

    if (selectedId && isEditing) {
      mutateRecord.mutate({
        id: selectedId, recordType: 'notice', payload, status: 'active',
        searchText: `${formData.title} ${formData.audience}`
      }, {
        onSuccess: () => { toast.success("Notice updated"); setIsEditing(false); }
      });
    } else {
      mutateRecord.mutate({
        recordType: 'notice', payload, status: 'active',
        searchText: `${formData.title} ${formData.audience}`
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
          onClick={() => { setSelectedId(null); setIsEditing(true); setFormData({title: '', audience: 'All', content: ''}); }} 
          className="bg-emerald-500/10 hover:bg-emerald-400 text-white border-[0.5px] border-black/9 dark:border-white/8 border-emerald-400 rounded-xl px-6 h-12 text-lg font-semibold transition-all"
        >
          <Plus className="w-5 h-5 mr-2" /> {t("new_notice", "New Notice")}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-full md:w-1/3 bg-white border-r border-emerald-100 flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="p-4 border-b border-emerald-100 bg-[#F0F4FF] dark:bg-blue-900/20/50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1E3A8A] dark:text-blue-400" />
              <Input 
                placeholder="Search notices..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="pl-12 bg-white border-emerald-200 focus-visible:ring-emerald-500 rounded-2xl h-12 text-md hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" 
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {isLoading ? (
              <div className="p-4 text-center text-[#1E3A8A] dark:text-blue-400 font-semibold">{t("loading", "Loading...")}</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-emerald-400">
                <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-semibold text-lg">{t("no_notices", "No notices published")}</p>
              </div>
            ) : (
              filtered.map(n => (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  key={n.id} 
                  onClick={() => { setSelectedId(n.id); setIsEditing(false); }}
                  className={`p-5 rounded-2xl cursor-pointer border-2 transition-all ${selectedId === n.id ? 'bg-[#F0F4FF] dark:bg-blue-900/20 border-emerald-400' : 'bg-white border-emerald-100 hover:bg-[#F0F4FF] dark:bg-blue-900/20'}`}
                >
                  <h3 className="font-extrabold text-emerald-900 line-clamp-1 text-lg">{n.title}</h3>
                  <p className="text-xs font-semibold text-[#1E3A8A] dark:text-blue-400 mt-2 uppercase tracking-wider tracking-[0.04em]">{t("audience", "Audience:")} {n.audience}</p>
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
                className="bg-white rounded-3xl border-[0.5px] border-black/9 dark:border-white/8 border-emerald-200 p-10 max-w-3xl mx-auto w-full shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
              >
                <h2 className="text-3xl font-extrabold text-emerald-900 mb-8 tracking-[-0.02em]">{selectedId ? 'Edit Notice' : 'Compose Notice'}</h2>
                <div className="space-y-6 school-page-enter font-dmsans">
                  <div>
                    <label className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wide tracking-[0.04em]">Title</label>
                    <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-2 border-emerald-200 focus-visible:ring-emerald-500 rounded-xl h-12 text-lg" placeholder="Enter notice title..." />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wide tracking-[0.04em]">Audience</label>
                    <select value={formData.audience} onChange={e => setFormData({...formData, audience: e.target.value})} className="mt-2 w-full rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-emerald-200 bg-white px-4 py-3 text-lg text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                      <option>All</option>
                      <option>Students Only</option>
                      <option>Parents Only</option>
                      <option>Staff Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wide tracking-[0.04em]">Content</label>
                    <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="mt-2 w-full rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-emerald-200 bg-white p-4 text-lg text-emerald-900 resize-none h-64 focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" placeholder="Type your message here..." />
                  </div>
                </div>
                <div className="flex gap-4 mt-10">
                  <Button variant="outline" className="flex-1 border-emerald-200 text-[#1E3A8A] dark:text-blue-400 hover:bg-[#F0F4FF] dark:bg-blue-900/20 rounded-xl h-14 text-lg font-semibold" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button className="flex-1 bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold rounded-xl h-14 text-lg font-semibold" onClick={handleSave}>
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
                className="bg-white rounded-3xl border-[0.5px] border-black/9 dark:border-white/8 border-emerald-200 p-10 max-w-3xl mx-auto w-full shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
              >
                <div className="flex justify-between items-start mb-8 pb-8 border-b border-emerald-100">
                  <div>
                    <h2 className="text-4xl font-extrabold text-emerald-900 leading-tight tracking-[-0.02em]">{selectedNotice.title}</h2>
                    <div className="flex items-center gap-4 mt-4">
                      <span className="text-sm font-semibold bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full uppercase tracking-wider tracking-[0.04em]">{selectedNotice.audience}</span>
                      <span className="text-sm font-semibold text-emerald-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> {selectedNotice.datePublished ? format(new Date(selectedNotice.datePublished), 'MMMM d, yyyy') : 'No Date'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="icon" className="h-12 w-12 border-emerald-200 text-[#1E3A8A] dark:text-blue-400 hover:bg-[#F0F4FF] dark:bg-blue-900/20 rounded-xl" onClick={() => { setFormData({ title: selectedNotice.title, audience: selectedNotice.audience, content: selectedNotice.content }); setIsEditing(true); }}>
                      <Edit2 className="w-5 h-5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-12 w-12 border-red-200 text-red-600 hover:bg-red-50 rounded-xl" onClick={() => { if(window.confirm('Delete this notice?')) deleteRecord.mutate({ id: selectedNotice.id, recordType: 'notice' }, { onSuccess: () => setSelectedId(null) }); }}>
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
                <p className="text-2xl font-extrabold text-[#1E3A8A] dark:text-blue-400 tracking-[-0.02em]">Select a notice to read</p>
                <p className="text-emerald-500 font-medium mt-2">Or compose a new one from the top right</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
