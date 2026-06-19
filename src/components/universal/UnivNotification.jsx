import React, { useState, useEffect } from 'react';
import { supabase } from "@/api/supabaseClient";
import { powerSync } from "@/api/PowerSyncConnector";
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, Settings, Info, AlertTriangle, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateText } from '@/lib/cloudflareAI';

export default function UnivNotification() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');
 const [notifications, setNotifications] = useState([]);
 const [loading, setLoading] = useState(true);
 const [aiDigest, setAiDigest] = useState(null);
 const [isGeneratingDigest, setIsGeneratingDigest] = useState(false);

 useEffect(() => {
 if (companyId) {
 fetchNotifications();
 const channel = supabase.channel('notification_changes')
 .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_notifications', filter: `company_id=eq.${companyId}`}, () => {
 fetchNotifications();
}).subscribe();
 return () => { supabase.removeChannel(channel);};
}
}, [companyId]);

 const fetchNotifications = async () => {
 setLoading(true);
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_notifications WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error && error.code !== '42P01') throw error;
 setNotifications(data || []);
} catch (err) {
 console.error(err);
} finally {
 setLoading(false);
}
};

 const markAllRead = async () => {
 if (!companyId) return;
 try {
 const { error} = await supabase
 .from('univ_notifications')
 .update({ read: true})
 .eq('company_id', companyId)
 .eq('read', false);
 if (error) throw error;
 toast.success('All notifications marked as read');
 fetchNotifications();
} catch (err) {
 console.error(err);
 toast.error(err.message || 'Failed to mark all as read');
}
};

 const generateSmartDigest = async () => {
  const unread = notifications.filter(n => !n.read);
  if (unread.length === 0) {
    toast.success("No unread notifications to summarize!");
    return;
  }
  setIsGeneratingDigest(true);
  try {
    const aiMessages = [
      { role: 'system', content: 'You are an AI assistant. Summarize the following system notifications into a brief, 2-3 sentence digest. Highlight any urgent or high-priority items. Do not list them, just write a cohesive summary.' },
      { role: 'user', content: JSON.stringify(unread.map(n => ({ title: n.title, message: n.message, type: n.type, time: n.created_at }))) }
    ];
    let digest = await generateText(aiMessages);
    if (typeof digest !== 'string') {
        digest = digest.response || digest.text || JSON.stringify(digest);
    }
    setAiDigest(digest.replace(/```json|```/g, '').trim());
  } catch (err) {
    console.error("AI Digest Error:", err);
    toast.error("Failed to generate AI digest");
  } finally {
    setIsGeneratingDigest(false);
  }
 };

 const markAsRead = async (id) => {
 try {
 const { error} = await supabase
 .from('univ_notifications')
 .update({ read: true})
 .eq('id', id);
 if (error) throw error;
 toast.success('Notification marked as read');
 fetchNotifications();
} catch (err) {
 console.error(err);
 toast.error(err.message || 'Failed to mark as read');
}
};

 const getIcon = (type) => {
 switch(type) {
 case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
 case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
 case 'reminder': return <Clock className="w-5 h-5 text-purple-500" />;
 case 'info': default: return <Info className="w-5 h-5 text-blue-500" />;
}
};

 const getBg = (type) => {
 switch(type) {
 case 'success': return 'bg-emerald-100 dark:bg-emerald-500/10/10';
 case 'warning': return 'bg-orange-100 dark:bg-orange-500/10/10';
 case 'reminder': return 'bg-purple-100 dark:bg-purple-500/10/10';
 case 'info': default: return 'bg-blue-100 dark:bg-blue-500/10/10';
}
};

 const formatTime = (dateStr) => {
 if (!dateStr) return '';
 const date = new Date(dateStr);
 const now = new Date();
 const diffMs = now - date;
 const diffMins = Math.floor(diffMs / 60000);
 const diffHours = Math.floor(diffMins / 60);
 const diffDays = Math.floor(diffHours / 24);

 if (diffMins < 1) return 'Just now';
 if (diffMins < 60) return `${diffMins} mins ago`;
 if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
 if (diffDays === 1) return 'Yesterday';
 return date.toLocaleDateString();
};

 return (
 <div className="flex flex-col h-full bg-background overflow-hidden relative ${view !== 'Default' ? 'hide-default' : ''}">
 <div className="view-header max-w-3xl w-full mx-auto py-12 px-4 sm:px-6 relative z-10 flex flex-col h-full">
 
 <div className="flex items-center justify-between mb-8 shrink-0 flex-wrap gap-4">
 <div className="flex items-center gap-3">
 <div className="p-3 bg-primary/10 text-primary rounded-xl">
 <Bell className="w-6 h-6" />
 </div>
 <div>
 <h2 className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">Notifications</h2>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Stay updated with alerts and reminders.</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button onClick={generateSmartDigest} disabled={isGeneratingDigest} className="px-4 py-2 flex items-center gap-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl hover:opacity-90 transition-opacity hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)] disabled:opacity-50">
 <Sparkles className="w-4 h-4" />
 {isGeneratingDigest ? 'Generating...' : 'AI Digest'}
 </button>
 <button onClick={markAllRead} className="px-4 py-2 text-sm font-medium text-foreground bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl hover:bg-muted transition-colors hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
 Mark all as read
 </button>
 <button className="p-2 text-[#71717a] dark:text-gray-400 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl hover:bg-muted transition-colors">
 <Settings className="w-5 h-5" />
 </button>
 </div>
 </div>

 {aiDigest && (
   <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 flex gap-4 items-start shrink-0">
     <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
       <Sparkles className="w-5 h-5" />
     </div>
     <div className="flex-1">
       <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-1">AI Smart Digest</h4>
       <p className="text-sm text-indigo-800/80 dark:text-indigo-200/80 leading-relaxed">{aiDigest}</p>
     </div>
     <button onClick={() => setAiDigest(null)} className="p-1 text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-500/20 rounded-md transition-colors shrink-0">
       <Trash2 className="w-4 h-4" />
     </button>
   </motion.div>
 )}

 <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
 {loading ? (
 <div className="text-center p-12 text-[#71717a] dark:text-gray-400">Loading notifications...</div>
 ) : (
 <AnimatePresence>
 {notifications.map(n => (
 <motion.div 
 initial={{ opacity: 0, y: 10}}
 animate={{ opacity: 1, y: 0}}
 exit={{ opacity: 0, scale: 0.95}}
 key={n.id} 
 className={`flex items-start gap-4 p-5 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 transition-all ${n.read ? 'bg-card border-primary/40 opacity-70 hover:opacity-100' : 'bg-card border-primary/30 -primary/5'}`}
 >
 <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getBg(n.type)}`}>
 {getIcon(n.type)}
 </div>
 <div className="flex-1">
 <div className="flex justify-between items-start">
 <h4 className={`text-sm font-semibold ${n.read ? 'text-foreground' : 'text-primary'}`}>{n.title}</h4>
 <span className="text-xs font-semibold text-[#71717a] dark:text-gray-400 whitespace-nowrap ml-4 tracking-[0.04em]">{formatTime(n.created_at)}</span>
 </div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">{n.message}</p>
 </div>
 <div className="flex flex-col gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
 {!n.read && (
 <button 
 onClick={() => markAsRead(n.id)}
 className="p-1.5 text-emerald-600 bg-emerald-100 dark:bg-emerald-500/10/20 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-500/10/30 transition-colors"
 title="Mark as read"
 >
 <Check className="w-4 h-4" />
 </button>
 )}
 </div>
 </motion.div>
 ))}
 </AnimatePresence>
 )}
 
 {!loading && notifications.length === 0 && (
 <div className="text-center p-12 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 border-dashed rounded-2xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
 <h3 className="text-lg font-semibold text-foreground">All caught up!</h3>
 <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm">You have no new notifications.</p>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
