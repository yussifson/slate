import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { MessageCircle, Send, User, Briefcase, ExternalLink, Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateText } from "@/lib/cloudflareAI";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";

const MESSAGE_TEMPLATES = [
  { label: "Case Update", text: "Dear {client_name}, I wanted to update you on your case. Please feel free to contact us if you have any questions." },
  { label: "Hearing Reminder", text: "Dear {client_name}, this is a reminder that your hearing is scheduled. Please ensure you are available and have all required documents." },
  { label: "Document Request", text: "Dear {client_name}, we kindly request that you provide the following documents at your earliest convenience to proceed with your case." },
  { label: "Invoice Ready", text: "Dear {client_name}, your invoice is ready. Please review and arrange payment at your earliest convenience. Contact us for any queries." },
  { label: "Appointment Confirmation", text: "Dear {client_name}, your appointment with our office has been confirmed. Please arrive 10 minutes early with a valid ID." },
];

export default function WhatsAppMessenger() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = user?.company_id;
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const { toast } = useToast();

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", companyId],
    queryFn: () => base44.entities.Client.filter({ company_id: companyId }),
    enabled: !!companyId});

  const { data: cases = [] } = useQuery({
    queryKey: ["cases", companyId],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }),
    enabled: !!companyId});

  const clientCases = selectedClient
    ? cases.filter(c => c.client_id === selectedClient.id)
    : [];

  const handleClientChange = (clientId) => {
    const c = clients.find(cl => cl.id === clientId);
    setSelectedClient(c || null);
    setSelectedCase(null);
    setPhone(c?.phone || "");
  };

  const handleTemplate = (template) => {
    const filled = template.text.replace("{client_name}", selectedClient?.name || "Client");
    setMessage(filled);
  };

  const formatPhone = (raw) => {
    // Strip everything except digits and leading +
    return raw.replace(/[^\d+]/g, "");
  };

  const handleAiCompose = async () => {
    if (!aiPrompt.trim()) return;
    setIsComposing(true);
    toast({ title: "AI is composing message..." });
    try {
      const prompt = `Write a short, professional WhatsApp message to a client named ${selectedClient?.name || "Client"}. Context: ${aiPrompt}. Do not include subject lines or formal email sign-offs, just a natural WhatsApp message text.`;
      const response = await generateText([{ role: 'user', content: prompt }]);
      setMessage(response);
      setAiPrompt("");
      toast({ title: "Draft generated" });
    } catch (err) {
      toast({ title: "Failed to generate draft", variant: "destructive" });
    } finally {
      setIsComposing(false);
    }
  };

  const handleSend = () => {
    const cleaned = formatPhone(phone);
    if (!cleaned) return;
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${cleaned.replace("+", "")}?text=${encoded}`;
    window.open(url, "_blank");
  };

  const canSend = phone.trim().length > 5 && message.trim().length > 0;

  return (
    <div className="space-y-4 max-w-3xl">
      <PageHeader
        title="WhatsApp Messenger"
        subtitle="Send case updates and documents to clients via WhatsApp"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Client & Case selection */}
        <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-5 space-y-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> {t("select_recipient", "Select Recipient")}
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("client", "Client")}</label>
            <Select onValueChange={handleClientChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a client..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map(c => {
                  return (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : "— no phone"}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedClient && (
            <div className="bg-muted/40 rounded-xl p-3 space-y-1">
              <p className="text-xs font-semibold tracking-[0.04em]">{selectedClient.name}</p>
              {selectedClient.email && <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{selectedClient.email}</p>}
              <div className="flex items-center gap-2.5 mt-1">
                <Phone className="w-3 h-3 text-[#71717a] dark:text-gray-400" />
                <input
                  className="text-xs bg-transparent border-b border-dashed border-muted-foreground/40 focus:outline-none focus:border-primary w-full tracking-[0.04em]"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+233200000000"
                />
              </div>
              {!selectedClient.phone && (
                <p className="text-[10px] text-amber-600 mt-1">{t(
                  "no_phone_on_file_enter_manuall",
                  "No phone on file — enter manually above"
                )}</p>
              )}
            </div>
          )}

          {clientCases.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("related_case_optional", "Related Case (optional)")}</label>
              <Select onValueChange={(id) => setSelectedCase(cases.find(c => c.id === id) || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tag a case..." />
                </SelectTrigger>
                <SelectContent>
                  {clientCases.map(c => {
                    return (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3 h-3" />
                          {c.title}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedCase && (
            <div className="bg-slate-50 dark:bg-secondary/50 rounded-xl px-3 py-2 flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary tracking-[0.04em]">{selectedCase.title}</span>
              <Badge variant="outline" className="text-[9px] ml-auto">{selectedCase.status}</Badge>
            </div>
          )}
        </div>

        {/* Right: Message composer */}
        <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-5 space-y-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" /> {t("compose_message", "Compose Message")}
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("quick_templates", "Quick Templates")}</label>
            <div className="flex flex-wrap gap-2.5">
              {MESSAGE_TEMPLATES.map(template => {
                return (
                  <button
                    key={template.label}
                    onClick={() => handleTemplate(template)}
                    className="text-[10px] px-2 py-1 rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:border-primary hover:bg-slate-50 dark:bg-secondary/50 transition-colors"
                  >
                    {template.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20">
            <label className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> AI Composer</label>
            <div className="flex gap-2">
              <Input 
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="E.g. ask for passport copy..."
                className="h-8 text-sm bg-white dark:bg-black/20"
                onKeyDown={e => e.key === 'Enter' && handleAiCompose()}
              />
              <Button onClick={handleAiCompose} disabled={isComposing || !aiPrompt.trim()} size="sm" className="h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
                {isComposing ? <Sparkles className="w-3.5 h-3.5 animate-pulse" /> : "Compose"}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("message", "Message")}</label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
              className="text-sm resize-none"
            />
            <p className="text-[10px] text-[#71717a] dark:text-gray-400 text-right">{message.length} {t("chars", "chars")}</p>
          </div>

          <Button
            onClick={handleSend}
            disabled={!canSend}
            className="w-full gap-2 bg-primary hover:bg-primary/90 text-white"
          >
            <Send className="w-4 h-4" />
            {t("open_in_whatsapp", "Open in WhatsApp")}
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </Button>

          <p className="text-[10px] text-center text-[#71717a] dark:text-gray-400">
            {t(
              "opens_whatsapp_with_the_messag",
              "Opens WhatsApp with the message pre-filled. Works on desktop (WhatsApp Web) and mobile."
            )}
          </p>
        </div>
      </div>
      {/* Quick send cards */}
      {clients.filter(c => c.phone).length > 0 && (
        <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <h3 className="text-sm font-semibold mb-3">{t("quick_contact_clients_with_wha", "Quick Contact — Clients with WhatsApp")}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {clients.filter(c => c.phone).slice(0, 8).map(c => {
              return (
                <a
                  key={c.id}
                  href={`https://wa.me/${formatPhone(c.phone).replace("+", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2.5 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:border-primary/70 hover:bg-slate-50 dark:bg-secondary/50 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-semibold text-primary/90">{c.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate tracking-[0.04em]">{c.name}</p>
                    <p className="text-[10px] text-[#71717a] dark:text-gray-400">{c.phone}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}