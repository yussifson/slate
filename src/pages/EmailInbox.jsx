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
 Maximize2, Sparkles, Plus
} from "lucide-react";
import { Button} from "@/components/ui/button";
import { Input} from "@/components/ui/input";
import { formatDistanceToNow, format} from "date-fns";
import { cn} from "@/lib/utils";
import { generateText} from "@/lib/cloudflareAI";

export default function EmailInbox() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const companyId = user?.company_id;
 const queryClient = useQueryClient();

 const [activeTab, setActiveTab] = useState("inbox");
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
  ).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

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
 <div className="flex h-[calc(100vh-100px)] overflow-hidden rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">

 {/* ── Left Sidebar ── */}
 <aside className="w-56 shrink-0 flex flex-col border-r border-primary/40 bg-muted/30 dark:bg-slate-900/60">
 {/* Compose Button */}
 <div className="p-4">
 <Button
 className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold gap-2 text-sm"
 onClick={() => { setComposeInitialData(null); setShowCompose(true); setIsComposeMinimized(false);}}
 >
 <Plus className="w-4 h-4" />
 {t("compose", "Compose")}
 </Button>
 </div>

 {/* Nav Items */}
 <nav className="px-3 space-y-0.5 flex-1">
 {NAV_ITEMS.map(({ id, label, icon: Icon, count}) => (
 <button
 key={id}
 onClick={() => setActiveTab(id)}
 className={cn(
 "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
 activeTab === id
 ? "bg-primary/10 text-primary"
 : "text-[#71717a] dark:text-gray-400 hover:bg-accent hover:text-foreground"
 )}
 >
 <div className="flex items-center gap-2.5">
 <Icon className={cn("w-4 h-4", activeTab === id ? "text-primary" : "text-[#71717a] dark:text-gray-400 group-hover:text-foreground")} />
 {label}
 </div>
 {count > 0 && (
 <span className={cn(
 "text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
 activeTab === id ? "bg-primary/20 text-primary" : "bg-muted text-[#71717a] dark:text-gray-400"
 )}>
 {count}
 </span>
 )}
 </button>
 ))}
 </nav>

 {/* Storage indicator */}
 <div className="p-4 border-t border-primary/40">
 <p className="text-[11px] text-[#71717a] dark:text-gray-400 font-medium mb-1.5">Storage</p>
 <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
 <div className="h-full w-1/4 bg-primary rounded-full" />
 </div>
 <p className="text-[11px] text-[#71717a] dark:text-gray-400 mt-1">1.2 GB of 15 GB used</p>
 </div>
 </aside>

 {/* ── Middle Pane: Email List ── */}
 <div className={cn(
 "flex flex-col border-r border-primary/40 bg-background transition-all",
 selectedEmail ? "hidden lg:flex w-[340px] shrink-0" : "flex-1"
 )}>
 {/* Search Header */}
 <div className="h-[57px] border-b border-primary/40 flex items-center px-4 gap-3 shrink-0 bg-background">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <input
 placeholder="Search mail..."
 className="w-full pl-9 pr-3 h-9 rounded-xl bg-muted/50 border-0 text-sm text-foreground placeholder:text-[#71717a] dark:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary/30 transition"
 value={search}
 onChange={e => setSearch(e.target.value)}
 />
 </div>
 </div>

 {/* Email list */}
 <div className="flex-1 overflow-y-auto divide-y divide-border">
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
 "flex-1 flex-col min-w-0 bg-background",
 selectedEmail ? "flex" : "hidden lg:flex"
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
 onReply={() => {
 setComposeInitialData({
 recipient_email: selectedEmail.sender_email,
 subject: selectedEmail.subject?.startsWith("Re:") ? selectedEmail.subject : `Re: ${selectedEmail.subject}`,
 message: `\n\n\n--- On ${format(new Date(selectedEmail.created_date || new Date()), "MMM d, yyyy")} ${selectedEmail.sender_email} wrote:\n> ${selectedEmail.body_preview?.replace(/\n/g, "\n> ")}`
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
 <div className="flex flex-col h-full bg-background">
 {/* Toolbar */}
 <div className="h-[57px] border-b border-primary/40 flex items-center px-4 gap-2 shrink-0">
 <button onClick={onBack} className="lg:hidden p-2 hover:bg-muted rounded-xl text-[#71717a] dark:text-gray-400 mr-1">
 <ArrowLeft className="w-4 h-4" />
 </button>

 <div className="flex items-center gap-2">
 <ActionBtn icon={Reply} label="Reply" onClick={onReply} />
 <ActionBtn icon={CornerUpRight} label="Forward" onClick={onForward} />
 </div>

 <div className="w-px h-5 bg-primary/40 mx-2" />

 <ActionBtn icon={Trash2} label="Delete" onClick={onDelete} danger />
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto px-8 py-8">
 {/* Subject */}
 <div className="flex items-start justify-between gap-4 mb-6">
 <h1 className="text-xl font-semibold text-foreground leading-snug">{email.subject || "(No subject)"}</h1>
 <button
 onClick={onToggleStar}
 className={cn("p-1.5 rounded-full transition-colors shrink-0 mt-0.5", isStarred ? "text-amber-400" : "text-[#71717a] dark:text-gray-400 hover:text-amber-400")}
 >
 <Star className="w-5 h-5" fill={isStarred ? "currentColor" : "none"} />
 </button>
 </div>

 {/* Sender card */}
 <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 mb-7">
 <img src={avatarUrl} alt={senderName} className="w-10 h-10 rounded-full shrink-0 object-cover border-[0.5px] border-black/9 dark:border-white/8 border-primary/40" />
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-4">
 <div>
 <p className="text-sm font-semibold text-foreground">{senderName}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{email.sender_email}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 mt-0.5 tracking-[0.04em]">To: {email.recipient_email || "me"}</p>
 </div>
 <p className="text-xs text-[#71717a] dark:text-gray-400 shrink-0 tracking-[0.04em]">
 {email.created_date ? format(new Date(email.created_date), "MMM d, yyyy, h:mm a") : ""}
 </p>
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

 {/* Quick reply strip */}
 <div className="flex gap-2 border-t border-primary/40 pt-6">
 <Button onClick={handleExtractIntent} disabled={isExtracting} className="gap-2 text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white border-none shadow-md">
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
 alert("Failed to send external email: " + err.message);
 return;
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
 "bg-card dark:bg-slate-900",
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
 <div className="px-4 py-3 border-t border-primary/40 flex items-center justify-between bg-muted/30 dark:bg-slate-900/60 shrink-0">
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
