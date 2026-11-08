import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@powersync/react";
import { base44 } from "@/api/base44Client";
import { useAuth } from '@/lib/AuthContext';
import { 
  Bell, CheckCircle2, MessageSquare, AlertTriangle, 
  Settings, Trash2, ExternalLink, X, Clock, AlertCircle, Mail, CreditCard, Check
} from 'lucide-react';
import { formatDistanceToNow } from "date-fns";

/**
 * Universal Notification Center
 * Fully integrated with PowerSync offline-first DB.
 */
export default function UnivNotificationCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, unread
  const [optimisticReads, setOptimisticReads] = useState(new Set());
  const [optimisticDeletes, setOptimisticDeletes] = useState(new Set());

  const { data: rawNotifications = [] } = useQuery(
    user?.email ? `SELECT * FROM notifications WHERE recipient_email = ?` : `SELECT * FROM notifications WHERE 1=0`,
    user?.email ? [user?.email] : []
  );

  // Sort descending by created_at and apply optimistic states
  const notifications = [...rawNotifications]
    .filter(n => !optimisticDeletes.has(n.id))
    .map(n => ({
      ...n,
      is_read: optimisticReads.has(n.id) ? 'true' : String(n.is_read)
    }))
    .sort((a, b) => {
      return new Date(b.created_at || b.created_date || 0) - new Date(a.created_at || a.created_date || 0);
    });

  // Real-time toast notification listener via PowerSync reactivity
  const prevCount = React.useRef(0);
  const currentUnreadCount = rawNotifications.filter(n => n.is_read !== 'true').length;

  useEffect(() => {
    if (currentUnreadCount > prevCount.current && prevCount.current !== 0) {
      toast({
        title: "New Notification",
        description: "You have a new notification in your inbox.",
      });
    }
    prevCount.current = currentUnreadCount;
  }, [currentUnreadCount, toast]);

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: 'true' }),
    onMutate: (id) => {
      setOptimisticReads(prev => new Set([...prev, id]));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onMutate: (id) => {
      setOptimisticDeletes(prev => new Set([...prev, id]));
    }
  });

  const unreadCount = notifications.filter(n => n.is_read !== 'true').length;

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return n.is_read !== 'true';
    return true;
  });

  const markAsRead = (id) => {
    markReadMutation.mutate(id);
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => n.is_read !== 'true');
    // Optimistic update
    setOptimisticReads(prev => new Set([...prev, ...unread.map(n => n.id)]));
    try {
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: 'true' })));
      toast({ title: 'All marked as read' });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteNotification = (e, id) => {
    e.stopPropagation();
    deleteMutation.mutate(id);
  };

  const getIcon = (type) => {
    switch(type) {
      case 'internal_message': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'assigned_task': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'hearing_reminder': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'case_update': return <Mail className="w-4 h-4 text-indigo-500" />;
      case 'invoice_overdue':
      case 'billing_notification': return <CreditCard className="w-4 h-4 text-purple-500" />;
      case 'other':
      default: return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    try {
      let cleanStr = dateStr;
      if (!cleanStr.includes('Z') && !cleanStr.includes('+')) {
        cleanStr = cleanStr.replace(' ', 'T') + 'Z';
      }
      return formatDistanceToNow(new Date(cleanStr), { addSuffix: true });
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-full transition-all duration-200 focus:outline-none",
          isOpen ? "bg-white/20 text-white" : "hover:bg-white/10 text-white/95 hover:text-white"
        )}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 drop-shadow-sm text-white" strokeWidth={2.2} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600 border border-white shadow-sm"></span>
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[100] flex justify-end">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100]" 
                onClick={() => setIsOpen(false)} 
              />
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="fixed top-[52px] right-2 sm:right-5 w-80 sm:w-96 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 shadow-xl rounded-xl z-[101] overflow-hidden flex flex-col max-h-[80vh] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
              >
                {/* Header */}
              <div className="p-4 border-b border-[0.5px] border-black/9 dark:border-white/8 flex items-center justify-between bg-muted/30">
                <h3 className="font-semibold text-foreground">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs font-semibold text-primary hover:underline flex items-center gap-2 tracking-[0.04em]">
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                  <button onClick={() => window.location.href = '/notifications'} className="p-1.5 rounded-lg hover:bg-muted text-[#71717a] dark:text-gray-400 transition-colors" title="Notification Preferences">
                    <Settings className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-muted text-[#71717a] dark:text-gray-400 md:hidden">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex px-4 pt-2 border-b border-[0.5px] border-black/9 dark:border-white/8 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                <button 
                  onClick={() => setActiveTab('all')}
                  className={cn("px-4 py-2 text-sm font-semibold border-b-2 transition-colors", activeTab === 'all' ? "border-primary text-primary" : "border-transparent text-[#71717a] dark:text-gray-400 hover:text-foreground")}
                >
                  All
                </button>
                <button 
                  onClick={() => setActiveTab('unread')}
                  className={cn("px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2.5", activeTab === 'unread' ? "border-primary text-primary" : "border-transparent text-[#71717a] dark:text-gray-400 hover:text-foreground")}
                >
                  Unread {unreadCount > 0 && <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-[10px]">{unreadCount}</span>}
                </button>
              </div>

              {/* Feed */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {filteredNotifications.length === 0 ? (
                  <div className="py-12 text-center text-[#71717a] dark:text-gray-400">
                    <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">You're all caught up!</p>
                  </div>
                ) : (
                  filteredNotifications.map(notification => {
                    const isRead = notification.is_read === 'true';
                    return (
                      <div 
                        key={notification.id}
                        onClick={() => { markAsRead(notification.id); window.location.href = '/notifications'; }}
                        className={cn(
                          "group p-3 rounded-xl flex gap-3 cursor-pointer transition-all",
                          isRead ? "hover:bg-muted/50" : "bg-primary/5 hover:bg-primary/10"
                        )}
                      >
                        <div className="shrink-0 mt-0.5">
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", isRead ? "bg-muted" : "bg-background ")}>
                            {getIcon(notification.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-0.5">
                            <p className={cn("text-sm font-semibold truncate pr-2", isRead ? "text-foreground" : "text-primary")}>
                              {notification.title}
                            </p>
                            {/* Hover Actions */}
                            <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 -mt-1">
                              {!isRead && (
                                <button onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }} className="p-1 hover:bg-background rounded-md text-primary" title="Mark read"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                              )}
                              <button onClick={(e) => deleteNotification(e, notification.id)} className="p-1 hover:bg-background rounded-md text-red-500" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                          <p className={cn("text-xs line-clamp-2", isRead ? "text-[#71717a] dark:text-gray-400" : "text-foreground font-medium")}>
                            {notification.message}
                          </p>
                          <div className="mt-2 flex items-center gap-3 text-[10px] font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">
                            <span className="flex items-center gap-2"><Clock className="w-3 h-3" /> {formatTime(notification.created_at || notification.created_date)}</span>
                            {notification.related_id && <span className="flex items-center gap-2 text-primary"><ExternalLink className="w-3 h-3" /> View</span>}
                          </div>
                        </div>
                        {!isRead && (
                          <div className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5 mr-1" />
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-[0.5px] border-black/9 dark:border-white/8 bg-muted/10 text-center">
                <a href="/notifications" className="text-xs font-semibold text-[#71717a] dark:text-gray-400 hover:text-primary transition-colors tracking-[0.04em]">
                  View Full Inbox
                </a>
              </div>
            </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
