import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Mail, Send, Star, Inbox, Trash2, ArrowLeft, MoreVertical, Reply, CornerUpRight, Paperclip, Search, X, Minimize2, Maximize2, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow, format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { generateText } from "@/lib/cloudflareAI";

export default function EmailInbox() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = user?.company_id;
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [isComposeMinimized, setIsComposeMinimized] = useState(false);
  const [search, setSearch] = useState("");

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ["case-emails", companyId],
    queryFn: () => base44.entities.CaseEmail.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff", companyId],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('company_id', companyId);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", companyId],
    queryFn: () => base44.entities.Client.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CaseEmail.create({ ...data, company_id: companyId, logged_by: user?.email }),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["case-emails"] }); 
      setShowCompose(false); 
      setIsComposeMinimized(false);
    },
  });

  const filteredEmails = emails.filter(e =>
    !search ||
    e.subject?.toLowerCase().includes(search.toLowerCase()) ||
    e.sender_email?.toLowerCase().includes(search.toLowerCase()) ||
    e.recipient_email?.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  let displayedEmails = filteredEmails;
  if (activeTab === "sent") {
    displayedEmails = filteredEmails.filter(e => e.sender_email === user?.email);
  } else if (activeTab === "inbox") {
    displayedEmails = filteredEmails.filter(e => e.sender_email !== user?.email || !e.sender_email);
  } else if (activeTab === "starred") {
    displayedEmails = []; 
  }

  const handleComposeSubmit = (data) => {
    createMutation.mutate(data);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] -mt-4 -mb-6 md:-mb-0 md:-mt-0 md:rounded-xl overflow-hidden bg-background border border-border shadow-sm">
      {/* Left Sidebar - Navigation */}
      <div className="w-16 md:w-56 border-r border-border bg-slate-50/50 flex flex-col py-4 flex-shrink-0 transition-all z-10">
        <div className="px-2 md:px-4 mb-6">
          <Button 
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md flex justify-center items-center"
            onClick={() => {
              setShowCompose(true);
              setIsComposeMinimized(false);
            }}
          >
            <Send className="w-5 h-5 md:mr-2" />
            <span className="hidden md:inline">{t("compose", "Compose")}</span>
          </Button>
        </div>
        
        <nav className="space-y-1 px-2">
          <TabButton icon={Inbox} label="Inbox" active={activeTab === "inbox"} onClick={() => setActiveTab("inbox")} count={emails.length} />
          <TabButton icon={Send} label="Sent" active={activeTab === "sent"} onClick={() => setActiveTab("sent")} />
          <TabButton icon={Star} label="Starred" active={activeTab === "starred"} onClick={() => setActiveTab("starred")} />
        </nav>
      </div>

      {/* Middle Pane - Email List */}
      <div className={cn("flex flex-col border-r border-border bg-white transition-all", selectedEmail ? "hidden lg:flex w-[350px] xl:w-[400px] shrink-0" : "flex-1")}>
        <div className="h-14 border-b border-border flex items-center px-4 bg-white shrink-0">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search mail..." className="pl-9 h-9 bg-slate-100/50 border-transparent focus-visible:ring-1 focus-visible:bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : displayedEmails.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Inbox className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">No messages</h3>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {displayedEmails.map(email => (
                <EmailRow 
                  key={email.id} 
                  email={email} 
                  isSelected={selectedEmail?.id === email.id}
                  onClick={() => setSelectedEmail(email)} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane - Email Reader */}
      <div className={cn("flex-1 flex-col bg-white min-w-0 relative", selectedEmail ? "flex" : "hidden lg:flex")}>
        {selectedEmail ? (
          <EmailDetail email={selectedEmail} onBack={() => setSelectedEmail(null)} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/30">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <Mail className="w-10 h-10 text-blue-300" />
            </div>
            <h2 className="text-xl font-medium text-slate-600 mb-2">Select an item to read</h2>
            <p className="text-slate-400 text-sm">Nothing is selected</p>
          </div>
        )}
      </div>

      {/* Compose Email Popup (Gmail Style) */}
      {showCompose && (
        <ComposeEmailPopup 
          isMinimized={isComposeMinimized}
          onToggleMinimize={() => setIsComposeMinimized(!isComposeMinimized)}
          onClose={() => setShowCompose(false)}
          onSubmit={handleComposeSubmit}
          staff={staff}
          clients={clients}
          isLoading={createMutation.isPending}
        />
      )}
    </div>
  );
}

function TabButton({ icon: Icon, label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center md:justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active ? "bg-blue-100/50 text-blue-800 font-semibold" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      <div className="flex items-center gap-3 mx-auto md:mx-0">
        <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-slate-400"}`} />
        <span className="hidden md:inline">{label}</span>
      </div>
      {(count > 0 && active) && (
        <span className="hidden md:inline text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-200 text-blue-800">
          {count}
        </span>
      )}
    </button>
  );
}

function EmailRow({ email, isSelected, onClick }) {
  const senderName = email.sender_name || email.sender_email?.split('@')[0] || 'Unknown';
  const isRead = email.is_read || false;
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${senderName}&backgroundColor=e2e8f0,bfdbfe`;
  
  // Fake read status based on ID just for visual testing
  const isUnread = email.id?.includes('1') || false;

  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex flex-col px-4 py-3 cursor-pointer transition-colors group relative border-l-4",
        isSelected ? "bg-blue-50/50 border-blue-500" : "bg-white hover:bg-slate-50 border-transparent"
      )}
    >
      <div className="flex items-center gap-3 mb-1">
        <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 mt-0.5 shadow-sm">
          <img src={avatarUrl} alt={senderName} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 flex items-center justify-between min-w-0">
          <span className={cn("truncate text-[15px]", isUnread && !isSelected ? "font-bold text-slate-900" : "font-medium text-slate-700")}>
            {senderName}
          </span>
          <span className={cn("text-[11px] shrink-0 ml-2", isUnread && !isSelected ? "font-bold text-blue-600" : "text-slate-400 font-medium")}>
            {email.created_date ? formatDistanceToNow(new Date(email.created_date), { addSuffix: false }) : ''}
          </span>
        </div>
      </div>
      <div className="pl-9 pr-2">
        <div className={cn("truncate text-sm mb-0.5", isUnread && !isSelected ? "font-semibold text-slate-800" : "text-slate-700")}>
          {email.subject || '(No subject)'}
        </div>
        <div className="truncate text-sm text-slate-500 leading-snug">
          {email.body_preview || 'No content preview...'}
        </div>
      </div>
    </div>
  );
}

function EmailDetail({ email, onBack }) {
  const senderName = email.sender_name || email.sender_email?.split('@')[0] || 'Unknown';
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${senderName}&backgroundColor=e2e8f0,bfdbfe`;

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Detail Toolbar */}
      <div className="h-14 border-b border-border flex items-center px-2 lg:px-4 gap-2 bg-white sticky top-0 z-10 shrink-0">
        <button onClick={onBack} className="lg:hidden p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors mr-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors" title="Reply">
          <Reply className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors" title="Forward">
          <CornerUpRight className="w-4 h-4" />
        </button>
        <div className="h-5 w-px bg-border mx-1"></div>
        <button className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors ml-auto">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
        <div className="flex items-start justify-between gap-4 mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 leading-tight">{email.subject || '(No subject)'}</h1>
          <button className="mt-1 p-1.5 text-slate-300 hover:text-amber-400 transition-colors shrink-0">
            <Star className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-start gap-4 mb-8">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-sm border border-slate-100 mt-1">
            <img src={avatarUrl} alt={senderName} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <p className="font-semibold text-slate-900 text-sm truncate">
                {senderName} <span className="font-normal text-slate-500">&lt;{email.sender_email}&gt;</span>
              </p>
              <div className="text-[12px] text-slate-500 shrink-0 ml-4">
                {email.created_date ? format(new Date(email.created_date), 'MMM d, yyyy, h:mm a') : ''}
              </div>
            </div>
            <p className="text-[13px] text-slate-500">to {email.recipient_email || 'me'}</p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none text-slate-800 text-[15px] leading-relaxed break-words">
          {email.body_preview ? (
             <div className="whitespace-pre-wrap">{email.body_preview}</div>
          ) : (
             <div className="italic text-slate-400">No message content.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ComposeEmailPopup({ isMinimized, onToggleMinimize, onClose, onSubmit, staff, clients = [], isLoading }) {
  const { t } = useTranslation();
  const [recipientType, setRecipientType] = useState("internal"); 
  const [internalTarget, setInternalTarget] = useState("team"); 
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [externalEmails, setExternalEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipientPickerOpen, setRecipientPickerOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    let recipients = [];
    if (recipientType === "internal" || recipientType === "both") {
      if (internalTarget === "team") {
        recipients = [...recipients, ...staff.filter(s => selectedStaffIds.includes(s.id)).map(s => s.user_email || s.email)];
      } else {
        recipients = [...recipients, ...clients.filter(c => selectedClientIds.includes(c.id)).map(c => c.email)];
      }
    }
    if (recipientType === "external" || recipientType === "both") {
      const extList = externalEmails.split(',').map(e => e.trim()).filter(Boolean);
      recipients = [...recipients, ...extList];
    }
    
    onSubmit({
      subject,
      recipient_email: recipients.filter(Boolean).join(', '),
      body_preview: message,
      received_date: new Date().toISOString(),
    });
  };

  const toggleStaff = (id) => {
    setSelectedStaffIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleClient = (id) => {
    setSelectedClientIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleAiAssist = async () => {
    if (!message.trim()) return;
    setIsAiLoading(true);
    const originalMsg = message;
    setMessage("AI is polishing your email...");
    try {
      const msgs = [
        { role: 'system', content: 'You are an AI assistant helping a user write a better, more professional email. Rewrite the users message to be clear, concise, and highly professional. Return ONLY the rewritten email body text, nothing else.' },
        { role: 'user', content: originalMsg }
      ];
      const response = await generateText(msgs);
      setMessage(response || originalMsg);
    } catch (err) {
      console.error(err);
      setMessage(originalMsg);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className={cn(
      "fixed right-4 sm:right-16 md:right-24 bottom-0 bg-white rounded-t-xl shadow-[0_8px_30px_rgb(0,0,0,0.24)] flex flex-col z-50 transition-all duration-200 overflow-hidden",
      isMinimized ? "w-72 h-12" : "w-full sm:w-[500px] h-[550px] max-h-[85vh]"
    )}>
      {/* Header */}
      <div 
        className="h-10 bg-[#f2f6fc] text-slate-700 flex items-center justify-between px-4 cursor-pointer shrink-0 rounded-t-xl"
        onClick={onToggleMinimize}
      >
        <span className="font-semibold text-sm truncate">{isMinimized ? "New Message" : "New Message"}</span>
        <div className="flex items-center gap-1 shrink-0 text-slate-500">
          <button type="button" className="p-1 hover:bg-slate-200 rounded transition-colors" onClick={(e) => { e.stopPropagation(); onToggleMinimize(); }}>
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button type="button" className="p-1 hover:bg-slate-200 rounded transition-colors" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 bg-white">
          
          <div className="px-4 py-2 border-b border-border flex items-center gap-2 text-sm">
             <span className="text-slate-500 shrink-0 w-8">To</span>
             <div className="flex-1 flex flex-wrap gap-1 items-center relative">
               {/* Selected Chips */}
               {staff.filter(s => selectedStaffIds.includes(s.id)).map(s => (
                  <div key={s.id} className="bg-white border border-slate-300 text-slate-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1 hover:bg-slate-50">
                    {s.full_name || s.email}
                    <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-slate-700" onClick={() => toggleStaff(s.id)} />
                  </div>
               ))}
               
               <input 
                 type="text" 
                 placeholder="Search team members..." 
                 className="flex-1 min-w-[120px] outline-none border-none text-sm bg-transparent py-1"
                 value={recipientQuery}
                 onChange={e => setRecipientQuery(e.target.value)}
                 onFocus={() => setRecipientPickerOpen(true)}
               />
               
               {recipientPickerOpen && (
                 <div className="absolute top-full left-0 w-full max-h-48 overflow-y-auto bg-white border border-border shadow-lg rounded-md mt-1 z-20">
                    <div className="p-1">
                      {staff.filter(s => !recipientQuery || (s.full_name || s.email || "").toLowerCase().includes(recipientQuery.toLowerCase())).map(member => (
                        <div 
                          key={member.id} 
                          className="flex flex-col px-3 py-2 hover:bg-slate-100 cursor-pointer rounded-sm"
                          onClick={() => { toggleStaff(member.id); setRecipientQuery(""); setRecipientPickerOpen(false); }}
                        >
                          <span className="text-sm font-semibold text-slate-800">{member.full_name || member.email}</span>
                          <span className="text-xs text-slate-500">{member.email || "No email"}</span>
                        </div>
                      ))}
                      {staff.length === 0 && <div className="p-3 text-xs text-slate-500">No team members found in profiles.</div>}
                    </div>
                 </div>
               )}
             </div>
             <button type="button" className="text-slate-500 hover:text-slate-800 text-sm font-medium" onClick={() => setShowCc(!showCc)}>Cc</button>
          </div>

          {showCc && (
             <div className="px-4 py-2 border-b border-border flex items-center gap-2 text-sm">
               <span className="text-slate-500 shrink-0 w-8">Cc</span>
               <input type="text" className="flex-1 outline-none text-sm bg-transparent py-1" />
             </div>
          )}

          <div className="px-4 py-2 border-b border-border text-sm flex">
            <input 
              type="text"
              placeholder="Subject"
              className="w-full text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none bg-transparent py-1"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="flex-1 p-4 relative min-h-0">
            <textarea
              className="w-full h-full text-sm text-slate-800 outline-none resize-none bg-transparent"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write your email here..."
              required
              disabled={isAiLoading}
            />
          </div>

          <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-full font-bold shadow-sm h-9">
                {isLoading ? "Sending..." : t("send", "Send")}
              </Button>
              <button type="button" className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-full transition-colors"><Paperclip className="w-5 h-5" /></button>
            </div>
            
            <div className="flex items-center gap-2">
               <Button 
                type="button" 
                onClick={handleAiAssist} 
                disabled={isAiLoading || !message.trim()} 
                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-full h-8 px-3 flex items-center gap-1 shadow-sm font-medium text-xs"
              >
                <Sparkles className="w-3 h-3" /> AI Polish
              </Button>
               <button type="button" className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-full transition-colors" onClick={onClose}><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
