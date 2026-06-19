import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@powersync/react";
import { base44 } from "@/api/base44Client";
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';
import { 
  Bell, CheckCircle2, MessageSquare, AlertTriangle, 
  Trash2, ExternalLink, Clock, AlertCircle, Mail, CreditCard,
  Search, CheckSquare, Filter, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { OrbitLoader } from "@/components/ui/orbit-loader";

export default function NotificationsInbox() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, unread, archived

  const { data: rawNotifications = [], isLoading } = useQuery(
    user?.email ? `SELECT * FROM notifications WHERE recipient_email = ?` : `SELECT * FROM notifications WHERE 1=0`,
    user?.email ? [user?.email] : []
  );

  // Sort descending by created_at
  const notifications = [...rawNotifications].sort((a, b) => {
    return new Date(b.created_at || b.created_date || 0) - new Date(a.created_at || a.created_date || 0);
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: 'true' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.email] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.email] }),
  });

  const filteredNotifications = notifications.filter(n => {
    const isRead = n.is_read === 'true';
    if (activeTab === 'unread' && isRead) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!n.title?.toLowerCase().includes(q) && !n.message?.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const unreadCount = notifications.filter(n => n.is_read !== 'true').length;

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => n.is_read !== 'true');
    try {
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: 'true' })));
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.email] });
      toast({ title: 'All marked as read' });
    } catch (e) {
      console.error(e);
    }
  };

  const clearAll = async () => {
    if (!window.confirm("Are you sure you want to permanently delete all notifications?")) return;
    try {
      await Promise.all(notifications.map(n => base44.entities.Notification.delete(n.id)));
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.email] });
      toast({ title: 'Inbox cleared' });
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'internal_message': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'assigned_task': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'hearing_reminder': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'case_update': return <Mail className="w-5 h-5 text-indigo-500" />;
      case 'invoice_overdue':
      case 'billing_notification': return <CreditCard className="w-5 h-5 text-purple-500" />;
      case 'other':
      default: return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    try {
      const d = new Date(dateStr);
      return `${format(d, 'MMM d, yyyy')} • ${formatDistanceToNow(d, { addSuffix: true })}`;
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-background overflow-hidden relative">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 max-w-5xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-3 tracking-[-0.02em]">
              <Bell className="w-8 h-8 text-primary" />
              Inbox
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 text-sm px-2">
                  {unreadCount} Unread
                </Badge>
              )}
            </h1>
            <p className="text-[#71717a] dark:text-gray-400 mt-1">
              Manage your alerts, mentions, and system updates.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead} className="gap-2 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10">
                <CheckSquare className="w-4 h-4" /> Mark All Read
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={async () => {
                const { NotificationService } = await import('@/services/NotificationService');
                await NotificationService.emit({
                  companyId: user?.company_id,
                  recipientEmail: user?.email,
                  title: 'Test Novu Alert',
                  message: 'This is a test notification to verify your Novu email pipeline is working!',
                  type: 'other'
                });
                toast({ title: 'Test alert dispatched' });
              }} 
              className="gap-2 bg-primary text-white hover:bg-primary/90"
            >
              <Bell className="w-4 h-4" /> Send Test Ping
            </Button>
            <Button variant="outline" onClick={clearAll} className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4" /> Clear Inbox
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-[0.5px] border-black/9 dark:border-white/8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm mb-6 flex flex-col sm:flex-row items-center justify-between p-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="flex w-full sm:w-auto p-1 bg-muted/50 rounded-xl">
            <button 
              onClick={() => setActiveTab('all')}
              className={cn("flex-1 sm:flex-none px-6 py-2 text-sm font-semibold rounded-lg transition-all", activeTab === 'all' ? "bg-background shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm text-foreground" : "text-[#71717a] dark:text-gray-400 hover:text-foreground")}
            >
              All Notifications
            </button>
            <button 
              onClick={() => setActiveTab('unread')}
              className={cn("flex-1 sm:flex-none px-6 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2", activeTab === 'unread' ? "bg-background shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm text-foreground" : "text-[#71717a] dark:text-gray-400 hover:text-foreground")}
            >
              Unread
            </button>
          </div>
          <div className="w-full sm:w-72 mt-2 sm:mt-0 p-1 relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
            <Input 
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background border-[0.5px] border-black/9 dark:border-white/8 h-10 w-full"
            />
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-3">
          <AnimatePresence>
            {isLoading ? (
              <div className="py-20 flex justify-center">
                <OrbitLoader size="md" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="py-24 flex flex-col items-center justify-center text-center bg-card border-[0.5px] border-black/9 dark:border-white/8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
              >
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                  <Bell className="w-10 h-10 text-[#71717a] dark:text-gray-400 opacity-50" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Inbox Zero</h3>
                <p className="text-[#71717a] dark:text-gray-400 max-w-md mx-auto">
                  {searchQuery ? "No notifications match your search query." : "You're all caught up! There are no new notifications to review."}
                </p>
              </motion.div>
            ) : (
              filteredNotifications.map(notification => {
                const isRead = notification.is_read === 'true';
                return (
                  <motion.div 
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onClick={() => {
                      if (!isRead) markReadMutation.mutate(notification.id);
                      if (notification.related_id) window.location.href = notification.related_id;
                    }}
                    className={cn(
                      "group flex gap-4 p-5 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 transition-all cursor-pointer",
                      isRead ? "bg-card border-[0.5px] border-black/9 dark:border-white/8 hover:border-primary/30 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm" : "bg-primary/5 border-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-primary/10 hover:bg-primary/10"
                    )}
                  >
                    <div className="shrink-0">
                      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", isRead ? "bg-muted" : "bg-background shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm")}>
                        {getIcon(notification.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className={cn("text-base font-semibold truncate", isRead ? "text-foreground" : "text-primary")}>
                            {notification.title}
                          </h4>
                          {!isRead && <span className="flex shrink-0 w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-semibold text-[#71717a] dark:text-gray-400 flex items-center gap-2.5 bg-muted px-2.5 py-1 rounded-full tracking-[0.04em]">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(notification.created_at || notification.created_date)}
                          </span>
                        </div>
                      </div>
                      
                      <p className={cn("text-sm max-w-4xl", isRead ? "text-[#71717a] dark:text-gray-400" : "text-slate-700 dark:text-slate-300 font-medium")}>
                        {notification.message}
                      </p>
                      
                      <div className="mt-4 flex items-center gap-3">
                        {notification.related_id && (
                          <Button variant="ghost" size="sm" className="h-8 px-3 text-xs gap-2.5 bg-primary/5 text-primary hover:bg-primary/10 tracking-[0.04em]">
                            View Details <ArrowRight className="w-3 h-3" />
                          </Button>
                        )}
                        {!isRead && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-3 text-xs gap-2.5 text-[#71717a] dark:text-gray-400 hover:text-primary tracking-[0.04em]"
                            onClick={(e) => { e.stopPropagation(); markReadMutation.mutate(notification.id); }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Read
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-[#71717a] dark:text-gray-400 hover:text-red-500 hover:bg-red-50 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(notification.id); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
