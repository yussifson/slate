import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useMutation } from "@tanstack/react-query";
import { useQuery } from "@powersync/react";
import { base44 } from "@/api/base44Client";
import { useAuth } from '@/lib/AuthContext';
import { nativeMobile } from '@/services/NativeMobileService';
import { 
  Bell, CheckCircle2, MessageSquare, AlertTriangle, 
  Settings, Trash2, ExternalLink, X, Clock, Mail, Check,
  Home, Eye, FileText, ShoppingCart, Wrench, ShieldCheck, DollarSign
} from 'lucide-react';
import { formatDistanceToNow } from "date-fns";

/**
 * Universal Notification Center
 * Fully integrated with PowerSync offline-first DB, Novu Edge orchestration,
 * native audible chime sound, tactile haptics, and mobile badge synchronization.
 */
export default function UnivNotificationCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, unread
  const [optimisticReads, setOptimisticReads] = useState(new Set());
  const [optimisticDeletes, setOptimisticDeletes] = useState(new Set());
  const prevCount = useRef(0);

  // Initialize native channel and audio listener on mount
  useEffect(() => {
    nativeMobile.init();
  }, []);

  const userEmail = (user?.email || '').toLowerCase().trim();
  const userCompanyId = user?.company_id || '';

  const { data: rawNotifications = [] } = useQuery(
    userEmail
      ? `SELECT * FROM notifications WHERE recipient_email = ? OR (recipient_email IS NULL AND company_id = ?) ORDER BY created_at DESC LIMIT 50`
      : `SELECT * FROM notifications WHERE 1=0`,
    userEmail ? [userEmail, userCompanyId] : []
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

  const unreadCount = notifications.filter(n => n.is_read !== 'true' && n.is_read !== true).length;

  // Real-time audio chime + native mobile push banner on incoming notifications
  useEffect(() => {
    nativeMobile.setBadgeCount(unreadCount);

    if (unreadCount > prevCount.current && prevCount.current !== 0) {
      const latest = notifications.find(n => n.is_read !== 'true' && n.is_read !== true);
      const title = latest?.title || "New JCL Notification";
      const body = latest?.message || "New activity recorded in your workspace.";

      // Play audio chime and trigger mobile notification banner
      nativeMobile.notify({
        title,
        body,
        extra: {
          related_id: latest?.related_id,
          type: latest?.type
        }
      });

      toast({
        title,
        description: body,
      });
    }
    prevCount.current = unreadCount;
  }, [unreadCount, notifications, toast]);

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

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return n.is_read !== 'true' && n.is_read !== true;
    return true;
  });

  const markAsRead = (id) => {
    markReadMutation.mutate(id);
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => n.is_read !== 'true' && n.is_read !== true);
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

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setIsOpen(false);
    if (notification.related_id) {
      if (notification.related_id.startsWith('/')) {
        navigate(notification.related_id);
      } else {
        window.location.href = notification.related_id;
      }
    } else {
      navigate('/notifications');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'offer':
      case 'counter_offer':
        return <FileText className="w-4 h-4 text-emerald-500" />;
      case 'viewing':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'lead':
        return <MessageSquare className="w-4 h-4 text-sky-500" />;
      case 'requisition':
      case 'purchase_order':
      case 'procurement':
        return <ShoppingCart className="w-4 h-4 text-amber-500" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-orange-500" />;
      case 'custody':
      case 'asset':
        return <ShieldCheck className="w-4 h-4 text-indigo-500" />;
      case 'lease':
      case 'property':
        return <Home className="w-4 h-4 text-teal-500" />;
      case 'finance':
      case 'commission':
      case 'rent':
      case 'invoice':
      case 'billing_notification':
        return <DollarSign className="w-4 h-4 text-purple-500" />;
      case 'assigned_task':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'internal_message':
      case 'case_update':
        return <Mail className="w-4 h-4 text-indigo-500" />;
      default:
        return <Bell className="w-4 h-4 text-primary" />;
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
    } catch {
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
                    <button onClick={() => { setIsOpen(false); navigate('/notifications'); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors" title="Notification Preferences">
                      <Settings className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground md:hidden">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex px-4 pt-2 border-b border-[0.5px] border-black/9 dark:border-white/8 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                  <button 
                    onClick={() => setActiveTab('all')}
                    className={cn("px-4 py-2 text-sm font-semibold border-b-2 transition-colors", activeTab === 'all' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setActiveTab('unread')}
                    className={cn("px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2.5", activeTab === 'unread' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
                  >
                    Unread {unreadCount > 0 && <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-[10px]">{unreadCount}</span>}
                  </button>
                </div>

                {/* Feed */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {filteredNotifications.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">You're all caught up!</p>
                    </div>
                  ) : (
                    filteredNotifications.map(notification => {
                      const isRead = notification.is_read === 'true' || notification.is_read === true;
                      return (
                        <div 
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
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
                            <p className={cn("text-xs line-clamp-2", isRead ? "text-muted-foreground" : "text-foreground font-medium")}>
                              {notification.message}
                            </p>
                            <div className="mt-2 flex items-center gap-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider tracking-[0.04em]">
                              <span className="flex items-center gap-2"><Clock className="w-3 h-3" /> {formatTime(notification.created_at || notification.created_date)}</span>
                              {notification.related_id && <span className="flex items-center gap-2 text-primary"><ExternalLink className="w-3 h-3" /> View</span>}
                            </div>
                          </div>
                          {!isRead && (
                            <div className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5 mr-1" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-[0.5px] border-black/9 dark:border-white/8 bg-muted/10 text-center">
                  <button onClick={() => { setIsOpen(false); navigate('/notifications'); }} className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors tracking-[0.04em]">
                    View Full Inbox
                  </button>
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
