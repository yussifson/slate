import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function ClientMessaging({ caseData, user, senderType = "client" }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const endRef = useRef(null);
  const [content, setContent] = useState("");

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["client-messages", caseData?.id],
    queryFn: () => base44.entities.ClientMessage.filter({ case_id: caseData.id }, "created_date"),
    enabled: !!caseData?.id,
    refetchInterval: 6000,
  });

  useEffect(() => {
    const unsub = base44.entities.ClientMessage.subscribe((event) => {
      if (event.data?.case_id === caseData?.id) {
        queryClient.invalidateQueries({ queryKey: ["client-messages", caseData.id] });
      }
    });
    return unsub;
  }, [caseData?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    // Mark messages as read
    messages.forEach(m => {
      const readField = senderType === "client" ? "read_by_client" : "read_by_lawyer";
      if (!m[readField]) {
        base44.entities.ClientMessage.update(m.id, { [readField]: true });
      }
    });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientMessage.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["client-messages", caseData.id] }); setContent(""); },
  });

  const handleSend = () => {
    if (!content.trim()) return;
    sendMutation.mutate({
      company_id: caseData.company_id,
      case_id: caseData.id,
      case_title: caseData.title,
      sender_email: user?.email,
      sender_name: user?.full_name || user?.email,
      sender_type: senderType,
      content: content.trim(),
      read_by_client: senderType === "client",
      read_by_lawyer: senderType === "lawyer",
    });
  };

  const getInitials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="flex flex-col h-[480px] bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
      <div className="px-4 py-3 border-b border-primary/40 flex items-center gap-2 bg-muted/20">
        <MessageSquare className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">{t("messages", "Messages —")} {caseData?.title}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {isLoading && <p className="text-center text-xs text-[#71717a] dark:text-gray-400 py-6 tracking-[0.04em]">{t("loading_messages", "Loading messages...")}</p>}
        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-8 h-8 text-[#71717a] dark:text-gray-400 mb-2" />
            <p className="text-sm text-[#71717a] dark:text-gray-400">{t(
              "no_messages_yet_start_the_conv",
              "No messages yet. Start the conversation."
            )}</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_email === user?.email;
          const isClient = msg.sender_type === "client";
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0 ${isClient ? "bg-amber-500" : "bg-primary"}`}>
                {getInitials(msg.sender_name)}
              </div>
              <div className={`max-w-[75%] space-y-0.5 ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                <div className="flex items-center gap-2.5">
                  {!isMe && <span className="text-[10px] font-semibold">{msg.sender_name}</span>}
                  <span className="text-[9px] text-[#71717a] dark:text-gray-400">{format(new Date(msg.created_date), "HH:mm")}</span>
                </div>
                <div className={`rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-primary text-white rounded-tr-sm" : "bg-muted rounded-tl-sm"}`}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="px-4 py-3 border-t border-primary/40 bg-background flex items-end gap-2">
        <div className="flex-1 bg-muted/50 rounded-xl px-3 py-2 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 focus-within:border-primary/40 focus-within:bg-background transition-colors">
          <textarea
            rows={1}
            className="w-full bg-transparent text-sm outline-none resize-none placeholder:text-[#71717a] dark:text-gray-400"
            placeholder="Type a message..."
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
            style={{ minHeight: "24px", maxHeight: "80px" }}
          />
        </div>
        <Button size="icon" onClick={handleSend} disabled={!content.trim() || sendMutation.isPending} className="rounded-xl h-9 w-9 shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}