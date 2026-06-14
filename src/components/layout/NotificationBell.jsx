import { useTranslation} from "react-i18next";
import React, { useEffect, useState} from "react";
import { useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import { base44} from "@/api/base44Client";
import { Bell, Check, Trash2, Mail, CreditCard, Clock, MessageSquare, AlertCircle} from "lucide-react";
import { Button} from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import { Badge} from "@/components/ui/badge";
import { formatDistanceToNow} from "date-fns";
import { useToast} from "@/components/ui/use-toast";

const NOTIFICATION_ICONS = {
 hearing_reminder: Clock,
 invoice_overdue: CreditCard,
 assigned_task: AlertCircle,
 internal_message: MessageSquare,
 case_update: Mail,
 billing_notification: CreditCard,
 other: Bell
};

export default function NotificationBell({ user}) {
 const { t} = useTranslation();
 const queryClient = useQueryClient();
 const { toast} = useToast();
 const [open, setOpen] = useState(false);

 const { data: notifications = []} = useQuery({
 queryKey: ["notifications", user?.email],
 queryFn: () => base44.entities.Notification.filter({ recipient_email: user?.email}),
 enabled: !!user?.email,
});

 // Real-time subscription to notifications
 useEffect(() => {
 if (!user?.email) return;

 const unsubscribe = base44.entities.Notification.subscribe(({ type, data}) => {
 if (type === "create" && data.recipient_email === user?.email) {
 queryClient.invalidateQueries({ queryKey: ["notifications", user?.email]});
 
 // Show push notification toast
 toast({
 title: data.title || "New Notification",
 description: data.message,
});
}
});

 return () => {
 unsubscribe();
};
}, [user?.email, queryClient, toast]);

 const markReadMutation = useMutation({
 mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true}),
 onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.email]}),
});

 const deleteMutation = useMutation({
 mutationFn: (id) => base44.entities.Notification.delete(id),
 onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.email]}),
});

 const markAllRead = async () => {
 const unread = notifications.filter(n => !n.is_read);
 try {
 await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true})));
 queryClient.invalidateQueries({ queryKey: ["notifications", user?.email]});
 toast({ title: "All notifications marked as read"});
} catch (e) {
 console.error(e);
}
};

 const unreadCount = notifications.filter(n => !n.is_read).length;

 return (
 <Popover open={open} onOpenChange={setOpen}>
 <PopoverTrigger asChild>
 <button className="relative p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-250 select-none">
 <Bell className="w-5 h-5" />
 {unreadCount > 0 && (
 <>
 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
 </>
 )}
 </button>
 </PopoverTrigger>
 <PopoverContent className="w-80 p-0 mr-4 mt-2 bg-card border border-primary/40 rounded-xl overflow-hidden font-sans">
 <div className="px-4 py-3 border-b border-primary/40 bg-muted/30 flex items-center justify-between">
 <span className="font-semibold text-sm">{t("notifications", "Notifications")}</span>
 {unreadCount > 0 && (
 <Button variant="ghost" size="sm" className="h-7 text-xs px-2 gap-1 text-primary hover:text-primary/90" onClick={markAllRead}>
 <Check className="w-3 h-3" /> {t("mark_all_read", "Mark all read")}
 </Button>
 )}
 </div>
 <div className="max-h-[350px] overflow-y-auto divide-y divide-border">
 {notifications.length === 0 ? (
 <div className="p-8 text-center text-xs text-muted-foreground">
 <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
 {t("no_notifications_yet", "No notifications yet")}
 </div>
 ) : (
 notifications.map(n => {
 const IconComp = NOTIFICATION_ICONS[n.type] || NOTIFICATION_ICONS.other;
 return (
 <div
 key={n.id}
 className={`p-3.5 flex gap-3 items-start hover:bg-muted/30 transition-colors ${!n.is_read ? "bg-slate-50 border-l-2 border-primary" : ""}`}
 >
 <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${!n.is_read ? "bg-slate-100 text-primary" : "bg-muted text-muted-foreground"}`}>
 <IconComp className="w-4 h-4" />
 </div>
 <div className="flex-1 min-w-0">
 <p className={`text-xs font-semibold leading-normal truncate ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
 <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">{n.message}</p>
 <p className="text-[9px] text-muted-foreground mt-1.5">
 {n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true}) : "just now"}
 </p>
 </div>
 <div className="flex flex-col gap-1 shrink-0">
 {!n.is_read && (
 <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => markReadMutation.mutate(n.id)}>
 <Check className="w-3.5 h-3.5 text-primary" />
 </Button>
 )}
 <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(n.id)}>
 <Trash2 className="w-3.5 h-3.5" />
 </Button>
 </div>
 </div>
 );
})
 )}
 </div>
 </PopoverContent>
 </Popover>
 );
}
