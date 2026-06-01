import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Mail, Send, Star, Inbox, Trash2, ArrowLeft, MoreVertical, Reply, CornerUpRight, Paperclip, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow, format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

export default function EmailInbox() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = user?.company_id;
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [search, setSearch] = useState("");

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ["case-emails", companyId],
    queryFn: () => base44.entities.CaseEmail.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff", companyId],
    queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CaseEmail.create({ ...data, company_id: companyId, logged_by: user?.email }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["case-emails"] }); setShowCompose(false); },
  });

  const filteredEmails = emails.filter(e =>
    !search ||
    e.subject?.toLowerCase().includes(search.toLowerCase()) ||
    e.sender_email?.toLowerCase().includes(search.toLowerCase()) ||
    e.recipient_email?.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  // In a real app we'd filter by direction (inbound/outbound) or read status.
  // We'll mock the tabs slightly based on data we have.
  let displayedEmails = filteredEmails;
  if (activeTab === "sent") {
    displayedEmails = filteredEmails.filter(e => e.sender_email === user?.email);
  } else if (activeTab === "inbox") {
    // For demo, just show all or those not sent by current user
    displayedEmails = filteredEmails.filter(e => e.sender_email !== user?.email || !e.sender_email);
  } else if (activeTab === "starred") {
    displayedEmails = []; // Mock
  }

  const handleComposeSubmit = (data) => {
    createMutation.mutate(data);
  };

  return (
    <div className="flex h-[calc(100vh-48px)] -m-4 sm:-m-6 lg:-m-8 overflow-hidden bg-background border-t border-border">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-border bg-slate-50/50 flex flex-col p-4 space-y-6 flex-shrink-0">
        <Button 
          className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-md"
          onClick={() => setShowCompose(true)}
        >
          <Send className="w-5 h-5 mr-2 -ml-1" />
          {t("compose", "Compose")}
        </Button>
        
        <nav className="space-y-1">
          <TabButton icon={Inbox} label="Inbox" active={activeTab === "inbox"} onClick={() => {setActiveTab("inbox"); setSelectedEmail(null);}} count={emails.length} />
          <TabButton icon={Send} label="Sent" active={activeTab === "sent"} onClick={() => {setActiveTab("sent"); setSelectedEmail(null);}} />
          <TabButton icon={Star} label="Starred" active={activeTab === "starred"} onClick={() => {setActiveTab("starred"); setSelectedEmail(null);}} />
        </nav>
      </div>

      {/* Right Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {!selectedEmail ? (
          <>
            <div className="h-14 border-b border-border flex items-center px-4 justify-between bg-white">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search emails..." className="pl-9 h-9 bg-slate-100/50 border-none" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : displayedEmails.length === 0 ? (
                <div className="p-20 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Inbox className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700">No messages</h3>
                  <p className="text-muted-foreground mt-1">You're all caught up.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {displayedEmails.map(email => (
                    <EmailRow key={email.id} email={email} onClick={() => setSelectedEmail(email)} />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <EmailDetail email={selectedEmail} onBack={() => setSelectedEmail(null)} />
        )}
      </div>

      <ComposeEmailDialog 
        open={showCompose} 
        onClose={() => setShowCompose(false)} 
        onSubmit={handleComposeSubmit} 
        staff={staff}
      />
    </div>
  );
}

function TabButton({ icon: Icon, label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
        active ? "bg-blue-100/50 text-blue-700" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-slate-400"}`} />
        {label}
      </div>
      {count > 0 && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? "bg-blue-200 text-blue-800" : "bg-slate-200 text-slate-600"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function EmailRow({ email, onClick }) {
  // Use dicebear initials for avatar
  const senderName = email.sender_name || email.sender_email?.split('@')[0] || 'Unknown';
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${senderName}&backgroundColor=e2e8f0,bfdbfe`;

  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors group"
    >
      <Checkbox className="data-[state=checked]:bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()} />
      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
        <img src={avatarUrl} alt={senderName} className="w-full h-full object-cover" />
      </div>
      <div className="w-48 shrink-0 truncate font-semibold text-slate-800 text-sm">
        {senderName}
      </div>
      <div className="flex-1 truncate text-sm">
        <span className="font-semibold text-slate-800">{email.subject || '(No subject)'}</span>
        <span className="text-slate-400 mx-2">-</span>
        <span className="text-slate-500">{email.body_preview || 'No content preview...'}</span>
      </div>
      <div className="w-24 shrink-0 text-right text-xs text-slate-500 font-medium">
        {email.created_date ? formatDistanceToNow(new Date(email.created_date), { addSuffix: true }) : ''}
      </div>
    </div>
  );
}

function EmailDetail({ email, onBack }) {
  const { t } = useTranslation();
  const senderName = email.sender_name || email.sender_email?.split('@')[0] || 'Unknown';
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${senderName}&backgroundColor=e2e8f0,bfdbfe`;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Detail Toolbar */}
      <div className="h-14 border-b border-border flex items-center px-4 gap-4 bg-white">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="h-4 w-px bg-border"></div>
        <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors" title="Reply">
          <Reply className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors" title="Forward">
          <CornerUpRight className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors ml-auto" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">{email.subject || '(No subject)'}</h1>
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 shadow-sm border border-slate-100">
              <img src={avatarUrl} alt={senderName} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-base">{email.sender_email || 'Unknown Sender'}</p>
              <p className="text-xs text-slate-500 mt-0.5">To: {email.recipient_email || 'Me'}</p>
            </div>
          </div>
          <div className="text-sm text-slate-400 font-medium">
            {email.created_date ? formatDistanceToNow(new Date(email.created_date), { addSuffix: true }) : ''}
          </div>
        </div>

        <div className="prose prose-slate max-w-none text-slate-800 text-[15px] leading-relaxed">
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

function ComposeEmailDialog({ open, onClose, onSubmit, staff }) {
  const { t } = useTranslation();
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const recipients = staff.filter(s => selectedStaffIds.includes(s.id)).map(s => s.user_email).join(', ');
    onSubmit({
      subject,
      recipient_email: recipients,
      body_preview: message,
      received_date: new Date().toISOString(),
    });
    // Reset
    setSelectedStaffIds([]);
    setSubject("");
    setMessage("");
  };

  const toggleStaff = (id) => {
    setSelectedStaffIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden gap-0 bg-white">
        <DialogHeader className="p-4 border-b border-border bg-slate-50/50">
          <DialogTitle className="text-base font-bold text-slate-800">{t("new_message", "New Message")}</DialogTitle>
          <DialogDescription className="sr-only">Compose a new message</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* To Field with Checkboxes */}
          <div className="border-b border-border p-4 bg-white">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
              {t("to_select_firm_members", "To (Select Firm Members)")}
            </Label>
            <div className="max-h-32 overflow-y-auto space-y-1 p-1 border border-slate-200 rounded-lg bg-slate-50/30">
              {staff.length === 0 && <p className="text-xs text-muted-foreground p-2">No firm members found.</p>}
              {staff.map(member => (
                <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-md cursor-pointer transition-colors" onClick={() => toggleStaff(member.id)}>
                  <Checkbox 
                    checked={selectedStaffIds.includes(member.id)} 
                    onCheckedChange={() => toggleStaff(member.id)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-800">{member.full_name}</span>
                  <span className="text-xs text-slate-400">({member.user_email})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Field */}
          <div className="border-b border-border px-4 py-3 bg-white">
            <input 
              type="text"
              placeholder={t("subject", "Subject")}
              className="w-full text-sm font-semibold text-slate-800 placeholder:text-slate-400 bg-transparent border-none outline-none focus:ring-0 p-0"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
            />
          </div>

          {/* Message Body */}
          <div className="p-4 bg-white">
            <textarea
              placeholder={t("type_your_message_here", "Type your message here...")}
              className="w-full min-h-[250px] text-sm text-slate-700 bg-transparent border-none outline-none focus:ring-0 p-0 resize-y"
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
            />
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border bg-slate-50/50 flex items-center justify-between">
            <Button type="button" variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
              <Paperclip className="w-5 h-5" />
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-full shadow-md font-bold">
              {t("send", "Send")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}