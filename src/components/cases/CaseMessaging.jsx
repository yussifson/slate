import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Paperclip, AtSign, MessageSquare, X, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

function parseContent(content, taggedEmails, staff) {
  if (!content) return null;
  // Highlight @mentions
  const parts = content.split(/(@\w[\w.]*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return <span key={i} className="text-primary font-semibold bg-slate-100 px-0.5 rounded">{part}</span>;
    }
    return part;
  });
}

export default function CaseMessaging({ caseData, user }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [content, setContent] = useState("");
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [linkedDocs, setLinkedDocs] = useState([]);
  const [showDocPicker, setShowDocPicker] = useState(false);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["case-messages", caseData.id],
    queryFn: () => base44.entities.CaseMessage.filter({ case_id: caseData.id }, "created_date"),
    enabled: !!caseData.id,
    refetchInterval: 5000,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff", user?.company_id],
    queryFn: () => base44.entities.StaffRecord.filter({ company_id: user?.company_id }),
    enabled: !!user?.company_id,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["case-documents", caseData.id],
    queryFn: () => base44.entities.Document.filter({ case_id: caseData.id }),
    enabled: !!caseData.id,
  });

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.CaseMessage.subscribe((event) => {
      if (event.data?.case_id === caseData.id) {
        queryClient.invalidateQueries({ queryKey: ["case-messages", caseData.id] });
        // Notify tagged users
        if (event.type === "create" && event.data?.tagged_emails?.includes(user?.email)) {
          if (Notification.permission === "granted") {
            new Notification(`New message in ${caseData.title}`, {
              body: `${event.data.sender_name}: ${event.data.content?.slice(0, 80)}`,
            });
          }
        }
      }
    });
    return unsub;
  }, [caseData.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    const unread = messages.filter(m => m.sender_email !== user?.email && !m.read_by?.includes(user?.email));
    unread.forEach(m => {
      base44.entities.CaseMessage.update(m.id, { read_by: [...(m.read_by || []), user?.email] });
    });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.CaseMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-messages", caseData.id] });
      setContent("");
      setSelectedTags([]);
      setLinkedDocs([]);
    },
  });

  const handleSend = () => {
    if (!content.trim() && linkedDocs.length === 0) return;
    sendMutation.mutate({
      case_id: caseData.id,
      company_id: user?.company_id,
      sender_email: user?.email,
      sender_name: user?.full_name || user?.email,
      content: content.trim(),
      tagged_emails: selectedTags,
      document_links: linkedDocs,
      read_by: [user?.email],
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "@") {
      setShowTagMenu(true);
      setTagSearch("");
    }
  };

  const tagStaff = (member) => {
    if (!selectedTags.includes(member.user_email)) {
      setSelectedTags(prev => [...prev, member.user_email]);
      setContent(prev => prev + member.full_name.split(" ")[0] + " ");
    }
    setShowTagMenu(false);
  };

  const addDoc = (doc) => {
    if (!linkedDocs.find(d => d.url === doc.file_url)) {
      setLinkedDocs(prev => [...prev, { name: doc.name, url: doc.file_url }]);
    }
    setShowDocPicker(false);
  };

  const filteredStaff = staff.filter(s =>
    !tagSearch || s.full_name?.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const groupedByDate = messages.reduce((acc, msg) => {
    const dateKey = format(new Date(msg.created_date), "MMMM d, yyyy");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  const getInitials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const AVATAR_COLORS = ["bg-primary", "bg-primary", "bg-primary", "bg-amber-500", "bg-red-500", "bg-primary"];
  const getColor = (email) => AVATAR_COLORS[(email?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

  return (
    <div className="flex flex-col h-[600px] bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{t("case_discussion", "Case Discussion")}</span>
          <Badge variant="outline" className="text-[10px]">{messages.length} {t("messages", "messages")}</Badge>
        </div>
        <span className="text-xs text-muted-foreground">{t("updates_every_5s", "Updates every 5s")}</span>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {isLoading && <p className="text-center text-sm text-muted-foreground py-8">{t("loading", "Loading...")}</p>}
        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">{t("no_messages_yet", "No messages yet")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("start_the_discussion_about_thi", "Start the discussion about this case.")}</p>
          </div>
        )}

        {Object.entries(groupedByDate).map(([date, msgs]) => {
          return (
            <div key={date}>
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground px-2 font-medium">{date}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-3">
                {msgs.map((msg) => {
                  const isMe = msg.sender_email === user?.email;
                  return (
                    <div key={msg.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                      <div className={`w-8 h-8 rounded-full ${getColor(msg.sender_email)} flex items-center justify-center shrink-0 text-white text-[11px] font-bold`}>
                        {getInitials(msg.sender_name)}
                      </div>
                      <div className={`max-w-[75%] space-y-1 ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                        <div className="flex items-center gap-1.5">
                          {!isMe && <span className="text-[11px] font-semibold text-foreground">{msg.sender_name}</span>}
                          <span className="text-[10px] text-muted-foreground">{format(new Date(msg.created_date), "HH:mm")}</span>
                        </div>
                        <div className={`rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-primary text-white rounded-tr-sm" : "bg-muted rounded-tl-sm"}`}>
                          {msg.content && (
                            <p className="leading-relaxed">{parseContent(msg.content, msg.tagged_emails, staff)}</p>
                          )}
                          {msg.tagged_emails?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {msg.tagged_emails.map(e => {
                                const s = staff.find(m => m.user_email === e);
                                return <span key={e} className={`text-[10px] px-1.5 py-0.5 rounded-full ${isMe ? "bg-white/20" : "bg-slate-100 text-primary"}`}>@{s?.full_name || e}</span>;
                              })}
                            </div>
                          )}
                          {msg.document_links?.length > 0 && (
                            <div className="mt-1.5 space-y-1">
                              {msg.document_links.map((d, i) => {
                                return (
                                  <a key={i} href={d.url} target="_blank" rel="noopener noreferrer"
                                    className={`flex items-center gap-1.5 text-[11px] underline underline-offset-2 ${isMe ? "text-white/80" : "text-primary"}`}>
                                    <Link className="w-3 h-3" /> {d.name}
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      {/* Doc attachment preview */}
      {linkedDocs.length > 0 && (
        <div className="px-4 py-2 border-t border-border flex flex-wrap gap-1.5 bg-muted/20">
          {linkedDocs.map((d, i) => {
            return (
              <div key={i} className="flex items-center gap-1 bg-slate-100 text-primary rounded-full px-2.5 py-1 text-[11px]">
                <Link className="w-3 h-3" />
                <span>{d.name}</span>
                <button onClick={() => setLinkedDocs(prev => prev.filter((_, j) => j !== i))}>
                  <X className="w-3 h-3 ml-0.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      {/* Tag menu */}
      {showTagMenu && (
        <div className="mx-4 border border-border rounded-lg bg-popover shadow-lg mb-0 overflow-hidden max-h-36 overflow-y-auto">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              className="w-full text-xs outline-none bg-transparent placeholder:text-muted-foreground"
              placeholder="Search colleagues..."
              value={tagSearch}
              onChange={e => setTagSearch(e.target.value)}
            />
          </div>
          {filteredStaff.map(s => {
            return (
              <button key={s.id} onClick={() => tagStaff(s)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left">
                <div className={`w-6 h-6 rounded-full ${getColor(s.user_email)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                  {getInitials(s.full_name)}
                </div>
                <span>{s.full_name}</span>
                <span className="text-[10px] text-muted-foreground capitalize ml-auto">{s.role}</span>
              </button>
            );
          })}
          <button onClick={() => setShowTagMenu(false)} className="w-full text-xs text-muted-foreground hover:bg-muted py-1.5 px-3 text-left border-t border-border">
            {t("close", "Close")}
          </button>
        </div>
      )}
      {/* Doc picker */}
      {showDocPicker && (
        <div className="mx-4 border border-border rounded-lg bg-popover shadow-lg mb-0 overflow-hidden max-h-36 overflow-y-auto">
          <div className="p-2 border-b border-border text-xs font-semibold text-muted-foreground">{t("attach_document_link", "Attach document link")}</div>
          {documents.length === 0 && <p className="text-xs text-muted-foreground p-3">{t("no_documents_in_this_case", "No documents in this case")}</p>}
          {documents.map(d => {
            return (
              <button key={d.id} onClick={() => addDoc(d)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left">
                <Link className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{d.name}</span>
              </button>
            );
          })}
          <button onClick={() => setShowDocPicker(false)} className="w-full text-xs text-muted-foreground hover:bg-muted py-1.5 px-3 text-left border-t border-border">
            {t("close", "Close")}
          </button>
        </div>
      )}
      {/* Input area */}
      <div className="px-4 py-3 border-t border-border bg-background">
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {selectedTags.map(e => {
              const s = staff.find(m => m.user_email === e);
              return (
                <span key={e} className="flex items-center gap-1 bg-slate-100 text-primary rounded-full px-2 py-0.5 text-[10px] font-medium">
                  @{s?.full_name?.split(" ")[0] || e}
                  <button onClick={() => setSelectedTags(prev => prev.filter(item => t !== e))}><X className="w-2.5 h-2.5" /></button>
                </span>
              );
            })}
          </div>
        )}
        <div className="flex items-end gap-2">
          <div className="flex-1 flex items-end gap-1 bg-muted/50 rounded-xl px-3 py-2 border border-border focus-within:border-slate-200 focus-within:bg-background transition-colors">
            <textarea
              ref={inputRef}
              rows={1}
              className="flex-1 bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground max-h-24"
              placeholder="Type a message... (@ to tag, Enter to send)"
              value={content}
              onChange={e => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ height: "auto", minHeight: "24px" }}
              onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
            />
          </div>
          <button
            onClick={() => { setShowTagMenu(v => !v); setShowDocPicker(false); }}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-slate-100 transition-colors"
            title="Tag colleague"
          >
            <AtSign className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setShowDocPicker(v => !v); setShowTagMenu(false); }}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-slate-100 transition-colors"
            title="Attach document"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <Button size="icon" onClick={handleSend} disabled={sendMutation.isPending || (!content.trim() && linkedDocs.length === 0)} className="shrink-0 rounded-xl h-9 w-9">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}