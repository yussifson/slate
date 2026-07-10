import { useTranslation} from "react-i18next";
import React, { useState, useEffect } from "react";
import { OrbitLoader } from "@/components/ui/orbit-loader";
import { base44} from "@/api/base44Client";
import { powerSync} from "@/api/PowerSyncConnector";
import { useMutation, useQueryClient, useQuery as useTanstackQuery } from "@tanstack/react-query";
import { useQuery } from "@powersync/react";
import { useAuth} from "@/lib/AuthContext";
import { supabase} from "@/api/supabaseClient";
 import {
  Mail, Send, Star, Inbox, Trash2, ArrowLeft, MoreVertical,
  Reply, CornerUpRight, Paperclip, Search, X, Minimize2,
  Maximize2, Sparkles, Plus, Menu
 } from "lucide-react";
import { Button} from "@/components/ui/button";
import { Input} from "@/components/ui/input";
import { formatDistanceToNow, format} from "date-fns";
import { cn} from "@/lib/utils";
import { generateText} from "@/lib/cloudflareAI";
import { toast } from "react-hot-toast";
import { useUIPreference } from "@/hooks/useUIPreference";

export default function EmailInbox() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const companyId = user?.company_id;
 const queryClient = useQueryClient();

 const [activeTab, setActiveTab] = useState("inbox");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useUIPreference(user, 'emailSidebarCollapsed', false);
 const [selectedEmail, setSelectedEmail] = useState(null);
 const [showCompose, setShowCompose] = useState(false);
 const [isComposeMinimized, setIsComposeMinimized] = useState(false);
 const [composeInitialData, setComposeInitialData] = useState(null);
 const [search, setSearch] = useState("");
 const [starredEmails, setStarredEmails] = useState(() => {
 try { return JSON.parse(localStorage.getItem("starredEmails") || "[]");}
 catch { return [];}
});

 React.useEffect(() => {
 localStorage.setItem("starredEmails", JSON.stringify(starredEmails));
}, [starredEmails]);

 const toggleStar = (e, emailId) => {
 e.stopPropagation();
 setStarredEmails(prev =>
 prev.includes(emailId) ? prev.filter(id => id !== emailId) : [...prev, emailId]
 );
};

  const { data: emails = [], isLoading } = useQuery(
    companyId ? `SELECT * FROM case_emails WHERE company_id = ?` : `SELECT * FROM case_emails WHERE 1=0`,
    companyId ? [companyId] : []
  );

 const { data: staff = []} = useTanstackQuery({
 queryKey: ["staff", companyId],
 queryFn: async () => {
 const { data} = await powerSync.execute('SELECT * FROM profiles WHERE company_id = ?', [companyId]).then(res => ({ data: res.rows._array}));
 return data || [];
},
 enabled: !!companyId});

 const { data: clients = []} = useTanstackQuery({
 queryKey: ["clients", companyId],
 queryFn: () => base44.entities.Client.filter({ company_id: companyId}),
 enabled: !!companyId});

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const emailRecord = await base44.entities.CaseEmail.create({
        subject: data.subject,
        recipient_email: data.recipient_email,
        body_preview: data.body_preview,
        received_date: data.received_date,
        attachments: data.attachments,
        company_id: companyId,
        logged_by: user?.email,
        sender_email: user?.email
      });

      // If internal, create notifications
      if (data.is_internal && data.internal_recipients) {
        for (const recipient of data.internal_recipients) {
          if (recipient === user?.email) continue; // don't notify self
          try {
            await base44.entities.Notification.create({
              company_id: companyId,
              recipient_email: recipient,
              type: 'internal_message',
              title: `New Message: ${data.subject}`,
              message: `From ${user?.full_name || user?.email}`,
              related_id: `/emails`,
              is_read: 'false'
            });
          } catch(e) {
            console.error("Failed to notify", recipient, e);
          }
        }
      }
      return emailRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-emails"] });
      setShowCompose(false);
      setIsComposeMinimized(false);
    }});

  const userEmail = user?.email?.toLowerCase() || "";
  const userName = user?.full_name?.toLowerCase() || "";

  const filteredEmails = emails.filter(e =>
    !search ||
    e.subject?.toLowerCase().includes(search.toLowerCase()) ||
    e.sender_email?.toLowerCase().includes(search.toLowerCase()) ||
    e.recipient_email?.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const timeA = new Date(a.created_at || a.received_date || a.created_date || 0).getTime();
    const timeB = new Date(b.created_at || b.received_date || b.created_date || 0).getTime();
    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
  });

  // Determine lists independent of active tab for counts
  const inboxEmails = filteredEmails.filter(e => {
    const sender = (e.sender_email || "").toLowerCase();
    const recipient = (e.recipient_email || "").toLowerCase();
    return recipient.includes(userEmail) || (sender !== userEmail && !(userName && sender.includes(userName)));
  });

  const sentEmails = filteredEmails.filter(e => {
    const sender = (e.sender_email || "").toLowerCase();
    return sender === userEmail || (userName && sender.includes(userName));
  });

  const starredEmailsList = filteredEmails.filter(e => starredEmails.includes(e.id));

  // Select displayed emails based on tab
  let displayedEmails = inboxEmails;
  if (activeTab === "sent") displayedEmails = sentEmails;
  if (activeTab === "starred") displayedEmails = starredEmailsList;

  const NAV_ITEMS = [
    { id: "inbox", label: "Inbox", icon: Inbox, count: inboxEmails.length },
    { id: "sent", label: "Sent", icon: Send, count: sentEmails.length },
    { id: "starred", label: "Starred", icon: Star, count: starredEmailsList.length },
  ];

 return (
 <div className="flex h-full w-full overflow-hidden bg-gradient-to-br from-background via-muted/20 to-primary/5 transition-all duration-300">

 {/* ── Left Sidebar ── */}
 <div className={cn(
   "border-r border-black/5 dark:border-white/5 flex flex-col bg-card/40 backdrop-blur-xl shrink-0 transition-all duration-300",
   isSidebarCollapsed ? "w-[68px]" : "w-64"
 )}>
 <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
   {!isSidebarCollapsed && (
     <Button 
       onClick={() => {
         setComposeInitialData(null);
         setShowCompose(true);
         setIsComposeMinimized(false);
       }} 
       className="flex-1 gap-2 font-medium tracking-wide shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all mr-2"
     >
       <Plus className="w-4 h-4" /> Compose
     </Button>
   )}
   {isSidebarCollapsed && (
     <Button 
       onClick={() => {
         setComposeInitialData(null);
         setShowCompose(true);
         setIsComposeMinimized(false);
       }}
       size="icon"
       className="w-full shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all mb-2 flex-shrink-0"
     >
       <Plus className="w-4 h-4" />
     </Button>
   )}
   <Button 
     variant="ghost" 
     size="icon" 
     onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
     className={cn("text-muted-foreground hover:text-foreground shrink-0", isSidebarCollapsed && "hidden")}
   >
     <Menu className="w-5 h-5" />
   </Button>
 </div>

 {isSidebarCollapsed && (
   <div className="px-2 pt-2 pb-1">
     <Button 
       variant="ghost" 
       size="icon" 
       onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
       className="w-full text-muted-foreground hover:text-foreground"
     >
       <Menu className="w-5 h-5" />
     </Button>
   </div>
 )}
 
 <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
 {NAV_ITEMS.map(item => {
 const isActive = activeTab === item.id;
 const Icon = item.icon;
 return (
 <button
 key={item.id}
 onClick={() => { setActiveTab(item.id); setSelectedEmail(null); }}
 className={cn(
 "w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium",
 isActive 
 ? "bg-primary text-primary-foreground shadow-sm" 
 : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
 isSidebarCollapsed ? "justify-center" : "justify-between"
 )}
 title={isSidebarCollapsed ? item.label : undefined}
 >
 <div className="flex items-center gap-3">
 <Icon className="w-4 h-4" />
 {!isSidebarCollapsed && item.label}
 </div>
 {!isSidebarCollapsed && item.count > 0 && (
 <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full">{item.count}</span>
 )}
 </button>
 );
 })}
 </div>
 </div>

 {/* ── Middle Pane: Email List ── */}
 <div className={cn(
   "border-r border-black/5 dark:border-white/5 flex flex-col bg-card/60 backdrop-blur-md shrink-0 transition-all duration-300",
   selectedEmail ? "hidden" : "flex-1 w-full"
 )}>
 <div className="p-4 border-b border-black/5 dark:border-white/5 space-y-4">
 <h2 className="font-semibold text-lg text-foreground tracking-tight flex items-center gap-2">
 {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
 </h2>
 <div className="relative group">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
 <Input 
 placeholder="Search emails..." 
 value={search}
 onChange={e => setSearch(e.target.value)}
 className="pl-9 bg-background/50 backdrop-blur-sm border-transparent focus-visible:ring-1 focus-visible:ring-primary/50 transition-all rounded-xl"
 />
 </div>
 </div>

 {/* Email list */}
 <div className="flex-1 overflow-y-auto divide-y divide-border/50">
 {isLoading ? (
 <div className="flex flex-col items-center justify-center h-full gap-3 text-[#71717a] dark:text-gray-400">
 <OrbitLoader size="md" />
 <p className="text-sm">Loading…</p>
 </div>
 ) : displayedEmails.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
 <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
 <Inbox className="w-7 h-7 text-[#71717a] dark:text-gray-400/50" />
 </div>
 <p className="font-semibold text-foreground">No messages</p>
 <p className="text-sm text-[#71717a] dark:text-gray-400">Your {activeTab} is empty</p>
 </div>
 ) : (
 displayedEmails.map(email => (
 <EmailRow
 key={email.id}
 email={email}
 isSelected={selectedEmail?.id === email.id}
 onClick={() => setSelectedEmail(email)}
 isStarred={starredEmails.includes(email.id)}
 onToggleStar={e => toggleStar(e, email.id)}
 />
 ))
 )}
 </div>
 </div>

 {/* ── Right Pane: Email Reader ── */}
 <div className={cn(
 "flex-col min-w-0 bg-background/50 backdrop-blur-md transition-all duration-300",
 selectedEmail ? "flex-1 flex" : "hidden"
 )}>
 {selectedEmail ? (
 <EmailDetail
 email={selectedEmail}
 onBack={() => setSelectedEmail(null)}
 isStarred={starredEmails.includes(selectedEmail.id)}
 onToggleStar={e => toggleStar(e, selectedEmail.id)}
 onDelete={async () => {
 await base44.entities.CaseEmail.delete(selectedEmail.id);
 queryClient.invalidateQueries({ queryKey: ["case-emails"]});
 setSelectedEmail(null);
}}
 onReply={(prefilledText) => {
 setComposeInitialData({
 recipient_email: selectedEmail.sender_email,
 subject: selectedEmail.subject?.startsWith("Re:") ? selectedEmail.subject : `Re: ${selectedEmail.subject}`,
 message: prefilledText && typeof prefilledText === 'string' ? prefilledText : `\n\n\n--- On ${format(new Date(selectedEmail.created_date || new Date()), "MMM d, yyyy")} ${selectedEmail.sender_email} wrote:\n> ${selectedEmail.body_preview?.replace(/\n/g, "\n> ")}`
});
 setShowCompose(true);
 setIsComposeMinimized(false);
}}
 onForward={() => {
 setComposeInitialData({
 subject: selectedEmail.subject?.startsWith("Fwd:") ? selectedEmail.subject : `Fwd: ${selectedEmail.subject}`,
 message: `\n\n\n--- Forwarded Message ---\nFrom: ${selectedEmail.sender_email}\nDate: ${format(new Date(selectedEmail.created_date || new Date()), "MMM d, yyyy")}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body_preview}`
});
 setShowCompose(true);
 setIsComposeMinimized(false);
}}
 />
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center text-center p-10 gap-5">
 <div className="w-20 h-20 bg-muted/60 rounded-2xl flex items-center justify-center ">
 <Mail className="w-9 h-9 text-primary/30" />
 </div>
 <div>
 <h2 className="text-lg font-semibold text-foreground mb-1">Select an item to read</h2>
 <p className="text-sm text-[#71717a] dark:text-gray-400">Nothing is selected</p>
 </div>
 </div>
 )}
 </div>

 {/* ── Compose Popup ── */}
 {showCompose && (
 <ComposeEmailPopup
 isMinimized={isComposeMinimized}
 onToggleMinimize={() => setIsComposeMinimized(!isComposeMinimized)}
 onClose={() => setShowCompose(false)}
 onSubmit={data => createMutation.mutate(data)}
 staff={staff}
 clients={clients}
 isLoading={createMutation.isPending}
 initialData={composeInitialData}
 />
 )}
 </div>
 );
}

/* ── Email Row ── */
function EmailRow({ email, isSelected, onClick, isStarred, onToggleStar}) {
 const senderName = email.sender_name || email.sender_email?.split("@")[0] || "Unknown";
 const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${senderName}&backgroundColor=e2e8f0`;

 return (
 <div
 onClick={onClick}
 className={cn(
 "flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors relative border-l-[3px]",
 isSelected
 ? "bg-primary/5 border-primary"
 : "border-transparent hover:bg-muted/50"
 )}
 >
 <img src={avatarUrl} alt={senderName} className="w-9 h-9 rounded-full shrink-0 mt-0.5 object-cover border-[0.5px] border-black/9 dark:border-white/8 border-primary/40" />
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between gap-2 mb-0.5">
 <span className="text-sm font-semibold text-foreground truncate">{senderName}</span>
 <span className="text-[11px] text-[#71717a] dark:text-gray-400 shrink-0">
 {email.created_date ? formatDistanceToNow(new Date(email.created_date), { addSuffix: false}) : ""}
 </span>
 </div>
 <p className="text-sm text-foreground/80 truncate font-medium mb-0.5">{email.subject || "(No subject)"}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 truncate leading-relaxed tracking-[0.04em]">{email.body_preview || "No preview available"}</p>
 </div>
 <button
 onClick={onToggleStar}
 className={cn("shrink-0 p-1 rounded-full transition-colors mt-1", isStarred ? "text-amber-400" : "text-border-[0.5px] border-black/9 dark:border-white/8 hover:text-amber-400")}
 >
 <Star className="w-3.5 h-3.5" fill={isStarred ? "currentColor" : "none"} />
 </button>
 </div>
 );
}

/* ── Email Detail ── */
export function EmailDetail({ email, onBack, isStarred, onToggleStar, onDelete, onReply, onForward}) {
 const senderName = email.sender_name || email.sender_email?.split("@")[0] || "Unknown";
 const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${senderName}&backgroundColor=e2e8f0`;
 const [isExtracting, setIsExtracting] = useState(false);
 const [extractedIntent, setExtractedIntent] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [isSmartReplying, setIsSmartReplying] = useState(false);
  const [smartReplies, setSmartReplies] = useState([]);

  const handleSummarize = async () => {
    if (summary) {
      setSummary(null);
      return;
    }
    setIsSummarizing(true);
    try {
      const prompt = `Summarize this email in 3 brief bullet points:\nSubject: ${email.subject}\nBody: ${email.body_preview}`;
      let response = await generateText([{ role: 'user', content: prompt }]);
      if (typeof response !== 'string') response = response.response || response.text || JSON.stringify(response);
      setSummary(response);
    } catch (err) {
      toast.error("Failed to summarize email");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSmartReply = async () => {
    if (smartReplies.length > 0) {
      setSmartReplies([]);
      return;
    }
    setIsSmartReplying(true);
    try {
      const prompt = `Draft 3 quick, professional, 1-sentence reply options to this email. Format strictly as a JSON array of strings, e.g. ["Option 1", "Option 2"].\nSubject: ${email.subject}\nBody: ${email.body_preview}`;
      let response = await generateText([{ role: 'user', content: prompt }]);
      if (typeof response !== 'string') response = response.response || response.text || JSON.stringify(response);
      
      let cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
      const match = cleaned.match(/\[.*\]/s);
      if (match) {
        cleaned = match[0];
      }
      
      try {
        setSmartReplies(JSON.parse(cleaned));
      } catch (parseErr) {
        // Fallback if not valid JSON
        const fallback = cleaned.split('\n').filter(l => l.trim().length > 5).map(l => l.replace(/^[-\d.*]+ /, '').replace(/^"|",?$/g, ''));
        if (fallback.length > 0) setSmartReplies(fallback);
        else throw parseErr;
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate smart replies");
    } finally {
      setIsSmartReplying(false);
    }
  };

 const handleExtractIntent = async () => {
   if (extractedIntent) {
     setExtractedIntent(null);
     return;
   }
   setIsExtracting(true);
   try {
     const prompt = [
       { role: 'system', content: 'You are an AI assistant in an email client. Analyze the following email content. Extract the primary intent and provide a 1-sentence suggested reply or action.' },
       { role: 'user', content: `Subject: ${email.subject}\nBody: ${email.body_preview}` }
     ];
     let response = await generateText(prompt);
     if (typeof response !== 'string') {
         response = response.response || response.text || JSON.stringify(response);
     }
     setExtractedIntent(response.replace(/```json|```/g, '').trim());
   } catch (err) {
     toast.error("Failed to extract intent");
   } finally {
     setIsExtracting(false);
   }
 };

 return (
 <div className="flex flex-col h-full bg-background/50">
 {/* Toolbar */}
 <div className="h-[57px] border-b border-primary/40 flex items-center px-4 gap-2 shrink-0">
 <button onClick={onBack} className="p-2 hover:bg-muted rounded-xl text-[#71717a] dark:text-gray-400 mr-1">
 <ArrowLeft className="w-5 h-5 text-primary" />
 </button>

 <div className="flex items-center gap-2">
 <ActionBtn icon={Reply} label="Reply" onClick={onReply} />
 <ActionBtn icon={CornerUpRight} label="Forward" onClick={onForward} />
 </div>

 <div className="w-px h-5 bg-primary/40 mx-2" />

 <ActionBtn icon={Trash2} label="Delete" onClick={onDelete} danger />
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto px-6 md:px-10 py-6 md:py-8 bg-background">
 {/* Subject */}
 <div className="flex items-center gap-3 mb-8">
 <h1 className="text-[1.375rem] font-normal text-foreground leading-snug">{email.subject || "(No subject)"}</h1>
 <span className="text-[10px] bg-muted/80 text-muted-foreground px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Inbox</span>
 </div>

 {/* Sender Row */}
 <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
 <div className="flex items-center gap-3.5">
 <img src={avatarUrl} alt={senderName} className="w-10 h-10 rounded-full shrink-0 object-cover bg-muted" />
 <div className="flex flex-col">
 <div className="flex items-baseline gap-1.5 flex-wrap">
 <span className="text-sm font-bold text-foreground">{senderName}</span>
 <span className="text-xs text-muted-foreground">&lt;{email.sender_email}&gt;</span>
 </div>
 <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground cursor-pointer hover:underline decoration-muted-foreground/30 underline-offset-2">
 <span>to {email.recipient_email || "me"}</span>
 <svg className="w-3 h-3 opacity-60 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
 </div>
 </div>
 </div>
 
 <div className="flex items-center gap-3.5 sm:mt-1 self-start sm:self-auto ml-13 sm:ml-0">
 <span className="text-xs text-muted-foreground font-medium">
 {email.created_date ? format(new Date(email.created_date), "MMM d, yyyy, h:mm a") : ""}
 </span>
 <div className="flex items-center gap-3 ml-2">
 <button onClick={onToggleStar} className={cn("transition-colors hover:bg-muted/50 p-1.5 rounded-full -m-1.5", isStarred ? "text-amber-400" : "text-muted-foreground hover:text-amber-400")}>
 <Star className="w-4 h-4" fill={isStarred ? "currentColor" : "none"} />
 </button>
 <button onClick={onReply} className="text-muted-foreground hover:text-foreground hover:bg-muted/50 p-1.5 rounded-full -m-1.5 transition-colors">
 <Reply className="w-4 h-4" />
 </button>
 <button className="text-muted-foreground hover:text-foreground hover:bg-muted/50 p-1.5 rounded-full -m-1.5 transition-colors">
 <MoreVertical className="w-4 h-4" />
 </button>
 </div>
 </div>
 </div>

 {/* Body */}
 <div className="text-sm text-foreground/90 leading-7 whitespace-pre-wrap mb-8">
 {email.body_preview || <span className="italic text-[#71717a] dark:text-gray-400">No message content.</span>}
 </div>

 {/* Attachments */}
 {email.attachments && (() => {
 try {
 const atts = typeof email.attachments === "string" ? JSON.parse(email.attachments) : email.attachments;
 return (
 <div className="border-t border-primary/40 pt-5 mb-8">
 <h4 className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2.5 tracking-[0.04em]">
 <Paperclip className="w-3.5 h-3.5" /> {atts.length} Attachment{atts.length !== 1 ? "s" : ""}
 </h4>
 <div className="flex flex-wrap gap-3">
 {atts.map((att, i) => (
 <a key={i} href={att.url} target="_blank" rel="noopener noreferrer"
 className="flex items-center gap-3 p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:bg-muted/50 transition-colors max-w-xs group">
 <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
 <Paperclip className="w-4 h-4" />
 </div>
 <div className="min-w-0">
 <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{att.name}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{(att.size / 1024).toFixed(1)} KB</p>
 </div>
 </a>
 ))}
 </div>
 </div>
 );
} catch { return null;}
})()}

 {extractedIntent && (
   <div className="mb-8 p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-xl flex gap-3 items-start w-fit">
     <Sparkles className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
     <div className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">
       <span className="font-semibold block mb-1">AI Suggestion</span>
       {extractedIntent}
     </div>
   </div>
 )}

 {summary && (
    <div className="mb-8 p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-xl flex gap-3 items-start w-fit">
      <Sparkles className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
      <div className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed whitespace-pre-wrap">
        <span className="font-semibold block mb-1">AI Summary</span>
        {summary}
      </div>
    </div>
  )}

  {smartReplies.length > 0 && (
    <div className="mb-8 space-y-2">
      <p className="text-xs font-semibold text-[#71717a] flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5"/> Smart Replies</p>
      <div className="flex flex-col gap-2 items-start">
        {smartReplies.map((reply, idx) => (
          <button key={idx} onClick={() => onReply(reply)} className="text-left px-4 py-2 bg-muted/40 hover:bg-muted border border-border rounded-xl text-sm transition-colors text-foreground">
            {reply}
          </button>
        ))}
      </div>
    </div>
  )}

 {/* Quick reply strip */}
 <div className="flex flex-wrap gap-2 border-t border-primary/40 pt-6">
 <Button onClick={handleSmartReply} disabled={isSmartReplying} className="gap-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground border-none shadow-md">
 {isSmartReplying ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Sparkles className="w-4 h-4" />} Smart Reply
 </Button>
 <Button onClick={handleSummarize} disabled={isSummarizing} variant="outline" className="gap-2 text-sm bg-card hover:bg-muted/50 border-primary/40 text-foreground">
 <Sparkles className="w-4 h-4" /> Summarize
 </Button>
 <Button onClick={handleExtractIntent} disabled={isExtracting} variant="outline" className="gap-2 text-sm bg-card hover:bg-muted/50 border-primary/40 text-foreground">
 {isExtracting ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Sparkles className="w-4 h-4" />} AI Actions
 </Button>
 <Button onClick={onReply} variant="outline" className="gap-2 text-sm bg-card hover:bg-muted/50 border-primary/40 text-foreground">
 <Reply className="w-4 h-4" /> Reply
 </Button>
 <Button onClick={onForward} variant="outline" className="gap-2 text-sm bg-card hover:bg-muted/50 border-primary/40 text-foreground">
 <CornerUpRight className="w-4 h-4" /> Forward
 </Button>
 </div>
 </div>
 </div>
 );
}

function ActionBtn({ icon: Icon, label, onClick, danger = false}) {
 return (
 <button
 onClick={onClick}
 title={label}
 className={cn(
 "flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors",
 danger
 ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10/10"
 : "text-[#71717a] dark:text-gray-400 hover:bg-muted hover:text-foreground"
 )}
 >
 <Icon className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">{label}</span>
 </button>
 );
}

/* ── Compose Popup ── */
function ComposeEmailPopup({ isMinimized, onToggleMinimize, onClose, onSubmit, staff, clients = [], isLoading, initialData}) {
 const { t} = useTranslation();
 const { user} = useAuth();
 const [recipientType, setRecipientType] = useState("internal");
 const [selectedStaffIds, setSelectedStaffIds] = useState([]);
 const [externalEmails, setExternalEmails] = useState("");
 const [subject, setSubject] = useState("");
 const [message, setMessage] = useState("");
 const [showCc, setShowCc] = useState(false);
 const [isAiLoading, setIsAiLoading] = useState(false);
 const [recipientQuery, setRecipientQuery] = useState("");
 const [recipientPickerOpen, setRecipientPickerOpen] = useState(false);
 const [attachments, setAttachments] = useState([]);
 const [isUploading, setIsUploading] = useState(false);
 const fileInputRef = React.useRef(null);

 React.useEffect(() => {
 if (initialData) {
 if (initialData.subject) setSubject(initialData.subject);
 if (initialData.message) setMessage(initialData.message);
 if (initialData.recipient_email) { setRecipientType("external"); setExternalEmails(initialData.recipient_email);}
}
}, [initialData]);

 const handleFileChange = async e => {
 const files = Array.from(e.target.files);
 if (!files.length) return;
 setIsUploading(true);
 try {
 const newAtts = [];
 for (const file of files) {
 const path = `${user?.company_id || "general"}/${Date.now()}_${file.name}`;
 await base44.storage.upload("documents", path, file);
 const url = base44.storage.getPublicUrl("documents", path);
 newAtts.push({ name: file.name, url, size: file.size});
}
 setAttachments(prev => [...prev, ...newAtts]);
} catch (err) { alert("Upload failed: " + err.message);}
 finally { setIsUploading(false);}
};

  const handleSubmit = async e => {
    e.preventDefault();
    let recipients = [];
    let internalEmails = [];
    if (recipientType === "internal" || recipientType === "both") {
      internalEmails = staff.filter(s => selectedStaffIds.includes(s.id)).map(s => s.user_email || s.email).filter(Boolean);
      recipients = [...internalEmails];
    }
    if (recipientType === "external" || recipientType === "both") {
      let extEmails = externalEmails.split(",").map(e => e.trim()).filter(Boolean);
      if (recipientQuery.includes("@")) {
        extEmails.push(recipientQuery.trim());
      }
      recipients = [...recipients, ...extEmails];
    }
 if (recipientType === "external" || recipientType === "both") {
 try {
 const { error} = await supabase.functions.invoke('send-external-email', {
 body: { to: recipients, subject, message}
 });
 if (error) throw error;
 } catch (err) {
 toast.error("Failed to send external email: " + err.message);
 }
 }

    onSubmit({ 
      subject, 
      recipient_email: recipients.join(", "), 
      body_preview: message, 
      received_date: new Date().toISOString(), 
      attachments: attachments.length ? JSON.stringify(attachments) : null,
      is_internal: recipientType === "internal" || recipientType === "both",
      internal_recipients: internalEmails
    });
};

 const toggleStaff = id => setSelectedStaffIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

 const handleAiAssist = async () => {
 if (!message.trim()) return;
 setIsAiLoading(true);
 const orig = message;
 setMessage("AI is polishing your email…");
 try {
 const res = await generateText([
 { role: "system", content: "You are an AI helping write a professional email. Rewrite the message to be clear, concise, and professional. Return ONLY the rewritten body."},
 { role: "user", content: orig}
 ]);
 setMessage(res || orig);
} catch { setMessage(orig);}
 finally { setIsAiLoading(false);}
};

 const dropdownStaff = staff.filter(s => !recipientQuery || (s.full_name || s.email || "").toLowerCase().includes(recipientQuery.toLowerCase()));

 return (
 <div className={cn(
 "fixed right-6 bottom-0 z-50 flex flex-col rounded-t-xl overflow-hidden border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 transition-all duration-200",
 "bg-card dark:bg-card",
 isMinimized ? "w-72 h-12" : "w-[520px] h-[560px] max-h-[85vh]"
 )}>
 {/* Compose Header */}
 <div
 className="h-12 flex items-center justify-between px-4 bg-muted/60 dark:bg-slate-800 border-b border-primary/40 cursor-pointer shrink-0"
 onClick={onToggleMinimize}
 >
 <span className="text-sm font-semibold text-foreground">New Message</span>
 <div className="flex items-center gap-2 text-[#71717a] dark:text-gray-400">
 <button type="button" className="p-1 hover:bg-muted rounded-md transition-colors" onClick={e => { e.stopPropagation(); onToggleMinimize();}}>
 {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
 </button>
 <button type="button" className="p-1 hover:bg-muted rounded-md transition-colors" onClick={e => { e.stopPropagation(); onClose();}}>
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>

 {!isMinimized && (
 <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">

 {/* Internal / External Toggle */}
 <div className="px-4 py-2 flex items-center gap-2 border-b border-primary/40 bg-muted/20">
 <button 
 type="button" 
 onClick={() => setRecipientType("internal")} 
 className={cn("px-3 py-1 rounded-lg text-xs font-semibold transition-colors", recipientType === "internal" || recipientType === "both" ? "bg-primary text-white" : "bg-muted text-[#71717a] dark:text-gray-400 hover:bg-muted/80")}
 >
 Internal Staff
 </button>
 <button 
 type="button" 
 onClick={() => setRecipientType("external")} 
 className={cn("px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2", recipientType === "external" ? "bg-primary text-white" : "bg-muted text-[#71717a] dark:text-gray-400 hover:bg-muted/80")}
 >
 External Email
 </button>
 </div>

 {/* To */}
 <div className="px-4 py-2.5 border-b border-primary/40 flex items-start gap-2 text-sm relative">
 <span className="text-[#71717a] dark:text-gray-400 w-8 shrink-0 pt-1">To</span>
 <div className="flex-1 flex flex-wrap gap-2.5 items-center relative min-w-0">
 {(recipientType === "internal" || recipientType === "both") && staff.filter(s => selectedStaffIds.includes(s.id)).map(s => (
 <div key={s.id} className="flex items-center gap-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs tracking-[0.04em]">
 {s.full_name || s.email}
 <X className="w-3 h-3 cursor-pointer hover:opacity-70" onClick={() => toggleStaff(s.id)} />
 </div>
 ))}
 {(recipientType === "external" || recipientType === "both") && externalEmails.split(",").map(e => e.trim()).filter(Boolean).map(email => (
 <div key={email} className="flex items-center gap-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs tracking-[0.04em]">
 {email}
 <X className="w-3 h-3 cursor-pointer hover:opacity-70" onClick={() => setExternalEmails(prev => prev.split(",").map(e => e.trim()).filter(e => e !== email).join(", "))} />
 </div>
 ))}
 <input
 type="text"
 placeholder={recipientType === "external" ? "Type external email and hit Enter..." : "Search staff or type email..."}
 className="flex-1 min-w-[180px] outline-none border-none text-sm bg-transparent text-foreground placeholder:text-[#71717a] dark:text-gray-400"
 value={recipientQuery}
 onChange={e => setRecipientQuery(e.target.value)}
 onKeyDown={e => {
 if (e.key === "Enter" && recipientQuery.includes("@")) {
 e.preventDefault();
 setExternalEmails(prev => prev ? `${prev}, ${recipientQuery}` : recipientQuery);
 if (recipientType === "internal") setRecipientType("both");
 setRecipientQuery("");
 setRecipientPickerOpen(false);
 }
 }}
 onFocus={() => setRecipientPickerOpen(true)}
 onBlur={() => setTimeout(() => setRecipientPickerOpen(false), 200)}
 />
 {recipientPickerOpen && (recipientType === "internal" || recipientType === "both") && dropdownStaff.length > 0 && (
 <div className="absolute top-full left-0 w-full max-h-44 overflow-y-auto bg-popover border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl mt-1 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-xl">
 {dropdownStaff.map(m => (
 <div key={m.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted cursor-pointer"
 onMouseDown={() => { toggleStaff(m.id); setRecipientQuery("");}}>
 <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0 tracking-[0.04em]">
 {(m.full_name || m.email || "?")[0].toUpperCase()}
 </div>
 <div>
 <p className="text-sm font-medium text-foreground">{m.full_name || m.email}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{m.email}</p>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 <button type="button" className="text-xs text-[#71717a] dark:text-gray-400 hover:text-foreground shrink-0 mt-1 tracking-[0.04em]" onClick={() => setShowCc(!showCc)}>Cc</button>
 </div>

 {/* Cc */}
 {showCc && (
 <div className="px-4 py-2.5 border-b border-primary/40 flex items-center gap-2 text-sm">
 <span className="text-[#71717a] dark:text-gray-400 w-8 shrink-0">Cc</span>
 <input type="text" className="flex-1 outline-none text-sm bg-transparent text-foreground" />
 </div>
 )}

 {/* Subject */}
 <div className="px-4 py-2.5 border-b border-primary/40">
 <input
 type="text"
 placeholder="Subject"
 className="w-full text-sm font-semibold text-foreground placeholder:text-[#71717a] dark:text-gray-400 outline-none bg-transparent"
 value={subject}
 onChange={e => setSubject(e.target.value)}
 required
 />
 </div>

 {/* Body */}
 <div className="flex-1 p-4 min-h-0">
 <textarea
 className="w-full h-full text-sm text-foreground outline-none resize-none bg-transparent placeholder:text-[#71717a] dark:text-gray-400 leading-relaxed"
 value={message}
 onChange={e => setMessage(e.target.value)}
 placeholder="Write your message here…"
 required
 disabled={isAiLoading}
 />
 </div>

 {/* Footer */}
 <div className="px-4 py-3 border-t border-primary/40 flex items-center justify-between bg-muted/30 dark:bg-card/60 shrink-0">
 <div className="flex items-center gap-2">
 <Button type="submit" disabled={isLoading || isUploading}
 className="bg-primary hover:bg-primary/90 text-white px-5 rounded-xl font-semibold h-8 text-sm">
 {isLoading || isUploading ? "Sending…" : t("send", "Send")}
 </Button>
 <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileChange} />
 <button type="button" onClick={() => fileInputRef.current?.click()}
 className="relative w-8 h-8 flex items-center justify-center text-[#71717a] dark:text-gray-400 hover:bg-muted rounded-xl transition-colors">
 <Paperclip className="w-4 h-4" />
 {attachments.length > 0 && (
 <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
 {attachments.length}
 </span>
 )}
 </button>
 </div>
 <div className="flex items-center gap-2">
 <Button type="button" onClick={handleAiAssist} disabled={isAiLoading || !message.trim()}
 variant="outline" className="h-8 px-3 text-xs gap-2.5 rounded-xl font-medium border-primary/20 text-primary hover:bg-primary/5 tracking-[0.04em]">
 <Sparkles className="w-3 h-3" /> AI Polish
 </Button>
 <button type="button" onClick={onClose}
 className="w-8 h-8 flex items-center justify-center text-[#71717a] dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10/10 hover:text-red-500 rounded-xl transition-colors">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 </form>
 )}
 </div>
 );
}
