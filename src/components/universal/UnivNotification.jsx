import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, Settings, Info, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivNotification() {
  const companyId = useCompanyId();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      fetchNotifications();
      const channel = supabase.channel('notification_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_notifications', filter: `company_id=eq.${companyId}` }, () => {
          fetchNotifications();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_notifications')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
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
      const { error } = await supabase
        .from('univ_notifications')
        .update({ read: true })
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

  const markAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from('univ_notifications')
        .update({ read: true })
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
      case 'success': return 'bg-emerald-100 dark:bg-emerald-500/10';
      case 'warning': return 'bg-orange-100 dark:bg-orange-500/10';
      case 'reminder': return 'bg-purple-100 dark:bg-purple-500/10';
      case 'info': default: return 'bg-blue-100 dark:bg-blue-500/10';
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
    <div className="flex flex-col h-full bg-background overflow-hidden relative">
      <div className="max-w-3xl w-full mx-auto py-12 px-4 sm:px-6 relative z-10 flex flex-col h-full">
        
        <div className="flex items-center justify-between mb-8 shrink-0">
           <div className="flex items-center gap-3">
             <div className="p-3 bg-primary/10 text-primary rounded-xl">
               <Bell className="w-6 h-6" />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-foreground tracking-tight">Notifications</h2>
               <p className="text-sm text-muted-foreground mt-1">Stay updated with alerts and reminders.</p>
             </div>
           </div>
           <div className="flex items-center gap-2">
             <button onClick={markAllRead} className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-xl hover:bg-muted transition-colors">
               Mark all as read
             </button>
             <button className="p-2 text-muted-foreground bg-card border border-border rounded-xl hover:bg-muted transition-colors">
               <Settings className="w-5 h-5" />
             </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
           {loading ? (
             <div className="text-center p-12 text-muted-foreground">Loading notifications...</div>
           ) : (
             <AnimatePresence>
               {notifications.map(n => (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   key={n.id} 
                   className={`flex items-start gap-4 p-5 rounded-2xl border transition-all ${n.read ? 'bg-card border-border opacity-70 hover:opacity-100' : 'bg-card border-primary/30 shadow-md shadow-primary/5'}`}
                 >
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getBg(n.type)}`}>
                     {getIcon(n.type)}
                   </div>
                   <div className="flex-1">
                     <div className="flex justify-between items-start">
                       <h4 className={`text-sm font-bold ${n.read ? 'text-foreground' : 'text-primary'}`}>{n.title}</h4>
                       <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap ml-4">{formatTime(n.created_at)}</span>
                     </div>
                     <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                   </div>
                   <div className="flex flex-col gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.read && (
                        <button 
                          onClick={() => markAsRead(n.id)}
                          className="p-1.5 text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 rounded-md hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors"
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
             <div className="text-center p-12 bg-card border border-border border-dashed rounded-2xl">
                <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-700">All caught up!</h3>
                <p className="text-slate-500 mt-1 text-sm">You have no new notifications.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
