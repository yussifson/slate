import React, { useState, useEffect } from 'react';
import { Bell, Check, Video, MessageSquare, Calendar, BrainCircuit, Users, ShieldCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { LocalNotifications } from '@capacitor/local-notifications';

export default function NotificationCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Setup realtime subscription with a unique channel name to prevent StrictMode reuse errors
      const channel = supabase
        .channel(`public:clipad_notifications_${user.id}_${Date.now()}`)
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'clipad_notifications',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setNotifications(prev => [payload.new, ...prev]);
              setUnreadCount(prev => prev + 1);
              
              // Play native-feeling notification sound and trigger OS notification
              try {
                // Trigger native OS notification
                LocalNotifications.schedule({
                  notifications: [
                    {
                      title: payload.new.title || 'New Notification',
                      body: payload.new.message || '',
                      id: new Date().getTime(),
                      schedule: { at: new Date(Date.now() + 100) },
                      sound: null, // Default OS notification sound
                      actionTypeId: '',
                      extra: null
                    }
                  ]
                });
                
                // Fallback / Web Audio
                const audio = new Audio('https://cdn.freesound.org/previews/415/415065_7811904-lq.mp3');
                audio.volume = 0.5;
                audio.play().catch(e => console.log('Audio playback blocked by browser:', e));
              } catch (e) {
                console.error('Local Notification Error:', e);
              }

              toast({
                title: payload.new.title,
                description: payload.new.message,
              });
            } else if (payload.eventType === 'UPDATE') {
              setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
            }
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      }
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('clipad_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from('clipad_notifications')
        .update({ is_read: true })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state to reflect change immediately
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      const { error } = await supabase
        .from('clipad_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
        
      if (error) throw error;
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
        <Bell className="w-5 h-5 text-slate-700 dark:text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 bg-card text-foreground shadow-lg border-slate-200 dark:border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-card/50">
          <DropdownMenuLabel className="p-0 font-semibold text-base">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Mark all read
            </button>
          )}
        </div>
        
        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-500 dark:text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">We'll let you know when something happens</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <DropdownMenuItem 
                  key={notification.id}
                  className={cn(
                    "flex flex-col items-start p-4 cursor-pointer border-b border-slate-50 dark:border-border/50 last:border-0 rounded-none focus:bg-slate-50 dark:focus:bg-slate-800/50 transition-colors",
                    !notification.is_read ? "bg-primary/5 dark:bg-primary/10" : ""
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!notification.is_read) {
                      markAsRead(notification.id);
                    }
                    // Could add navigation logic here based on notification.link or similar if it exists
                  }}
                >
                  <div className="flex items-start gap-3 w-full">
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                    <div className={cn("flex flex-col gap-1 w-full", notification.is_read && "pl-5")}>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {notification.title || 'Notification'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
