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
  Search, CheckSquare, Filter, ArrowRight, Sparkles, BrainCircuit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateText } from "@/lib/cloudflareAI";
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
  const [aiBriefing, setAiBriefing] = useState(null);
  const [optimisticReads, setOptimisticReads] = useState(new Set());
  const [optimisticDeletes, setOptimisticDeletes] = useState(new Set());
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);

  const { data: rawNotifications = [], isLoading } = useQuery(
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

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: 'true' }),
    onMutate: (id) => setOptimisticReads(prev => new Set([...prev, id]))
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onMutate: (id) => setOptimisticDeletes(prev => new Set([...prev, id]))
  });

  const filteredNotifications = notifications.filter(n => {
    const isRead = String(n.is_read) === 'true';
    if (activeTab === 'unread' && isRead) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!n.title?.toLowerCase().includes(q) && !n.message?.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const unreadCount = notifications.filter(n => String(n.is_read) !== 'true').length;

  const handleAiTriage = async () => {
    if (aiBriefing) {
      setAiBriefing(null);
      return;
    }
    const unread = notifications.filter(n => String(n.is_read) !== 'true');
    if (unread.length === 0) {
      toast({ title: 'Inbox Zero', description: 'You have no unread notifications to triage.' });
      return;
    }
    setIsGeneratingBriefing(true);
    toast({ title: "AI is generating your morning briefing..." });
    try {
      const summaryData = unread.slice(0, 50).map(n => `[${n.type}] ${n.title}: ${n.message}`);
      const prompt = `You are an AI assistant. Triage these unread notifications for the user. Group them logically and provide a short, natural language summary of what needs attention. Output a clean text summary.\n\nNotifications:\n${summaryData.join('\n')}`;
      const response = await generateText([{ role: 'user', content: prompt }]);
      setAiBriefing(response);
      toast({ title: "Briefing ready" });
    } catch (e) {
      toast({ title: "Failed to generate briefing", variant: "destructive" });
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => String(n.is_read) !== 'true');
    setOptimisticReads(prev => new Set([...prev, ...unread.map(n => n.id)]));
    try {
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: 'true' })));
      toast({ title: 'All marked as read' });
    } catch (e) {
      console.error(e);
    }
  };

  const clearAll = async () => {
    if (!window.confirm("Are you sure you want to permanently delete all notifications?")) return;
    setOptimisticDeletes(prev => new Set([...prev, ...notifications.map(n => n.id)]));
    try {
      await Promise.all(notifications.map(n => base44.entities.Notification.delete(n.id)));
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
      let cleanStr = dateStr;
      if (!cleanStr.includes('Z') && !cleanStr.includes('+')) {
        cleanStr = cleanStr.replace(' ', 'T') + 'Z';
      }
      const d = new Date(cleanStr);
      return `${format(d, 'MMM d, yyyy')} • ${formatDistanceToNow(d, { addSuffix: true })}`;
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-background overflow-hidden relative">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 max-w-5xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-[#005A9C] flex items-center justify-center text-white shadow-md shadow-[#005A9C]/20 shrink-0">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">Inbox</h1>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                    {unreadCount} Unread
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-medium">Activity updates & team alerts</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {unreadCount > 0 && (
              <Button size="sm" variant="outline" onClick={markAllAsRead} className="h-9 px-3 text-xs font-bold gap-1.5 border-border rounded-xl">
                <CheckSquare className="w-3.5 h-3.5 text-primary" /> <span className="hidden sm:inline">Mark All Read</span><span className="sm:hidden">Read All</span>
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={clearAll} className="h-9 px-3 text-xs font-bold gap-1.5 text-rose-600 border-border rounded-xl hover:bg-rose-50">
              <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Clear Inbox</span><span className="sm:hidden">Clear</span>
            </Button>
          </div>
        </div>

        {/* AI Briefing Banner */}
        <AnimatePresence>
          {aiBriefing && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><BrainCircuit className="w-24 h-24 text-indigo-500"/></div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-indigo-900 dark:text-indigo-200"><Sparkles className="w-4 h-4"/> AI Morning Briefing</h3>
              <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap max-w-4xl relative z-10">
                {aiBriefing}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar & Filter Bar */}
        <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[20px] p-2 sm:p-2.5 shadow-xs mb-4 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex w-full sm:w-auto p-1 bg-muted/60 rounded-xl border border-border/60">
            <button 
              onClick={() => setActiveTab('all')}
              className={cn("flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all", activeTab === 'all' ? "bg-card shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              All ({notifications.length})
            </button>
            <button 
              onClick={() => setActiveTab('unread')}
              className={cn("flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5", activeTab === 'unread' ? "bg-card shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              Unread {unreadCount > 0 && <span className="text-[10px] bg-rose-500 text-white rounded-full px-1.5 py-0.2 font-black">{unreadCount}</span>}
            </button>
          </div>
          <div className="w-full sm:w-72 relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-muted-foreground" />
            <Input 
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background border-border/80 h-9.5 text-xs rounded-xl w-full"
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
                const isRead = String(notification.is_read) === 'true';
                return (
                  <motion.div 
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onClick={() => {
                      if (!isRead) {
                         markReadMutation.mutate(notification.id);
                      }
                      if (notification.related_id) {
                         window.location.href = notification.related_id;
                      }
                    }}
                    className={cn(
                      "group flex gap-3 p-3.5 sm:p-4 rounded-[20px] border border-border/80 transition-all cursor-pointer active:scale-[0.99]",
                      isRead ? "bg-card border-[0.5px] border-black/9 dark:border-white/8 hover:border-primary/30 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm" : "bg-primary/5 border-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-primary/10 hover:bg-primary/10"
                    )}
                  >
                    <div className="shrink-0">
                      <div className={cn("w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center", isRead ? "bg-muted" : "bg-background shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm")}>
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
                      
                      <p className={cn("text-sm max-w-4xl", isRead ? "text-[#71717a] dark:text-gray-400" : "text-slate-700 dark:text-foreground font-medium")}>
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
