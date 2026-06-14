import React, { useState, useEffect} from 'react';
import { motion, AnimatePresence} from 'framer-motion';
import { cn} from '@/lib/utils';
import { useToast} from '@/components/ui/use-toast';
import { 
 Bell, CheckCircle2, MessageSquare, AlertTriangle, 
 Settings, Trash2, ExternalLink, X, Clock
} from 'lucide-react';

/**
 * Universal Notification Center
 * 
 * In production, this component should integrate with the @novu/notification-center 
 * headless API or React hooks to fetch real-time in-app notifications.
 */
export default function UnivNotificationCenter() {
 const { toast} = useToast();
 const [isOpen, setIsOpen] = useState(false);
 const [activeTab, setActiveTab] = useState('all'); // all, unread

 // Dummy data representing Novu headless feed
 const [notifications, setNotifications] = useState([
 {
 id: '1',
 read: false,
 type: 'mention',
 title: 'Jane Smith mentioned you',
 content: '"Can you review the latest Q3 compliance report?"',
 time: '10 mins ago',
 link: '/compliance/report-q3'
},
 {
 id: '2',
 read: false,
 type: 'system',
 title: 'Subscription Upgraded',
 content: 'Your company has been upgraded to the Enterprise Plan.',
 time: '2 hours ago',
 link: '/billing'
},
 {
 id: '3',
 read: true,
 type: 'alert',
 title: 'Action Required: Contract Expiring',
 content: 'The vendor contract with Globex Inc expires in 7 days.',
 time: 'Yesterday',
 link: '/vendors/globex'
}
 ]);

 const unreadCount = notifications.filter(n => !n.read).length;

 const filteredNotifications = notifications.filter(n => {
 if (activeTab === 'unread') return !n.read;
 return true;
});

 const markAsRead = (id) => {
 setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true} : n));
 // In production: novu.markAsRead(id)
};

 const markAllAsRead = () => {
 setNotifications(prev => prev.map(n => ({ ...n, read: true})));
 toast({ title: 'All marked as read'});
 // In production: novu.markAllAsRead()
};

 const deleteNotification = (e, id) => {
 e.stopPropagation();
 setNotifications(prev => prev.filter(n => n.id !== id));
};

 const getIcon = (type) => {
 switch(type) {
 case 'mention': return <MessageSquare className="w-4 h-4 text-blue-500" />;
 case 'system': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
 case 'alert': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
 default: return <Bell className="w-4 h-4 text-primary" />;
}
};

 return (
 <div className="relative">
 {/* Trigger Button */}
 <button 
 onClick={() => setIsOpen(!isOpen)}
 className="relative p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
 >
 <Bell className="w-5 h-5" />
 {unreadCount > 0 && (
 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
 )}
 </button>

 {/* Dropdown Panel */}
 <AnimatePresence>
 {isOpen && (
 <>
 <motion.div 
 initial={{ opacity: 0}} animate={{ opacity: 1}} exit={{ opacity: 0}}
 className="fixed inset-0 z-40" 
 onClick={() => setIsOpen(false)} 
 />
 <motion.div 
 initial={{ opacity: 0, y: 10, scale: 0.95}}
 animate={{ opacity: 1, y: 0, scale: 1}}
 exit={{ opacity: 0, y: 10, scale: 0.95}}
 transition={{ duration: 0.15}}
 className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-xl z-50 overflow-hidden flex flex-col max-h-[80vh]"
 >
 {/* Header */}
 <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
 <h3 className="font-bold text-foreground">Notifications</h3>
 <div className="flex items-center gap-2">
 {unreadCount > 0 && (
 <button onClick={markAllAsRead} className="text-xs font-semibold text-primary hover:underline">
 Mark all read
 </button>
 )}
 <button onClick={() => window.location.href = '/settings/notifications'} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors" title="Notification Preferences">
 <Settings className="w-4 h-4" />
 </button>
 <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground md:hidden">
 <X className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Tabs */}
 <div className="flex px-4 pt-2 border-b border-border bg-card">
 <button 
 onClick={() => setActiveTab('all')}
 className={cn("px-4 py-2 text-sm font-semibold border-b-2 transition-colors", activeTab === 'all' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
 >
 All
 </button>
 <button 
 onClick={() => setActiveTab('unread')}
 className={cn("px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5", activeTab === 'unread' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
 >
 Unread {unreadCount > 0 && <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px]">{unreadCount}</span>}
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
 filteredNotifications.map(notification => (
 <div 
 key={notification.id}
 onClick={() => { markAsRead(notification.id); if(notification.link) window.location.href = notification.link;}}
 className={cn(
 "group p-3 rounded-lg flex gap-3 cursor-pointer transition-all",
 notification.read ? "hover:bg-muted/50" : "bg-primary/5 hover:bg-primary/10"
 )}
 >
 <div className="shrink-0 mt-0.5">
 <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", notification.read ? "bg-muted" : "bg-background ")}>
 {getIcon(notification.type)}
 </div>
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex justify-between items-start mb-0.5">
 <p className={cn("text-sm font-bold truncate pr-2", notification.read ? "text-foreground" : "text-primary")}>
 {notification.title}
 </p>
 {/* Hover Actions */}
 <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 -mt-1">
 {!notification.read && (
 <button onClick={(e) => { e.stopPropagation(); markAsRead(notification.id);}} className="p-1 hover:bg-background rounded text-primary" title="Mark read"><CheckCircle2 className="w-3.5 h-3.5" /></button>
 )}
 <button onClick={(e) => deleteNotification(e, notification.id)} className="p-1 hover:bg-background rounded text-red-500" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
 </div>
 </div>
 <p className={cn("text-xs line-clamp-2", notification.read ? "text-muted-foreground" : "text-foreground font-medium")}>
 {notification.content}
 </p>
 <div className="mt-2 flex items-center gap-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
 <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {notification.time}</span>
 {notification.link && <span className="flex items-center gap-1 text-primary"><ExternalLink className="w-3 h-3" /> View</span>}
 </div>
 </div>
 {!notification.read && (
 <div className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5 mr-1" />
 )}
 </div>
 ))
 )}
 </div>

 {/* Footer */}
 <div className="p-3 border-t border-border bg-muted/10 text-center">
 <a href="/notifications" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
 View full history
 </a>
 </div>
 </motion.div>
 </>
 )}
 </AnimatePresence>
 </div>
 );
}
