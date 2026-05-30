import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { Send, Mail, MessageSquare, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";

export default function CaseCommunications({ caseData, client, user }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeMode, setActiveMode] = useState("email");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendEmail = async () => {
    if (!message || !subject) {
      toast({ title: "Please fill out all fields", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: "LexAfrica <noreply@lexafrica.oatstack.com>",
          to: [client?.email || "mock@example.com"],
          subject: `${caseData.title}: ${subject}`,
          html: `<p>${message.replace(/\n/g, '<br/>')}</p>`
        })
      });
      if (!res.ok) throw new Error("Failed to send email");
      
      await base44.entities.CaseEmail.create({
        company_id: caseData.company_id,
        case_id: caseData.id,
        case_title: caseData.title,
        client_id: client?.id,
        client_name: client?.name,
        subject: subject,
        body_preview: message.substring(0, 100),
        sender_email: user?.email,
        recipient_email: client?.email || "mock@example.com",
        direction: "outbound"
      });
      
      toast({ title: "Email sent successfully" });
      setMessage("");
      setSubject("");
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!message || !client?.phone) {
      toast({ title: "Message and valid client phone required", variant: "destructive" });
      return;
    }
    
    setSending(true);
    try {
      const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
      const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
      const twilioWhatsApp = import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER || import.meta.env.VITE_TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !twilioWhatsApp) {
        throw new Error("Twilio credentials not configured in environment variables.");
      }

      const phone = client.phone.startsWith("+") ? client.phone : `+${client.phone.replace(/[^0-9]/g, "")}`;
      
      const formData = new URLSearchParams();
      formData.append("To", `whatsapp:${phone}`);
      formData.append("From", `whatsapp:${twilioWhatsApp}`);
      formData.append("Body", message);

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`
        },
        body: formData.toString()
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send WhatsApp message");
      
      toast({ title: "WhatsApp message sent successfully!" });
      setMessage("");
    } catch (err) {
      toast({ title: "Failed to send WhatsApp", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleSendSMS = async () => {
    if (!message || !client?.phone) {
      toast({ title: "Message and valid client phone required", variant: "destructive" });
      return;
    }
    
    setSending(true);
    try {
      const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
      const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
      const twilioPhone = import.meta.env.VITE_TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !twilioPhone) {
        throw new Error("Twilio credentials not configured in environment variables.");
      }

      const phone = client.phone.startsWith("+") ? client.phone : `+${client.phone.replace(/[^0-9]/g, "")}`;
      
      const formData = new URLSearchParams();
      formData.append("To", phone);
      formData.append("From", twilioPhone);
      formData.append("Body", message);

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`
        },
        body: formData.toString()
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send SMS");
      
      toast({ title: "SMS sent successfully!" });
      setMessage("");
    } catch (err) {
      toast({ title: "Failed to send SMS", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    if (activeMode === "email") handleSendEmail();
    else if (activeMode === "whatsapp") handleSendWhatsApp();
    else if (activeMode === "sms") handleSendSMS();
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <h3 className="font-semibold text-sm">{t("external_communications", "External Communications")}</h3>
      <p className="text-xs text-muted-foreground">{t("send_updates_directly_to", "Send updates directly to")} {client?.name || "the client"}</p>
      <div className="flex gap-2 mb-4">
        <Button 
          variant={activeMode === "email" ? "default" : "outline"} 
          onClick={() => setActiveMode("email")}
          className="gap-2"
        >
          <Mail className="w-4 h-4" /> {t("email", "Email")}
        </Button>
        <Button 
          variant={activeMode === "whatsapp" ? "default" : "outline"} 
          onClick={() => setActiveMode("whatsapp")}
          className="gap-2"
        >
          <MessageSquare className="w-4 h-4" /> {t("whatsapp", "WhatsApp")}
        </Button>
        <Button 
          variant={activeMode === "sms" ? "default" : "outline"} 
          onClick={() => setActiveMode("sms")}
          className="gap-2"
        >
          <Phone className="w-4 h-4" /> {t("sms", "SMS")}
        </Button>
      </div>
      <div className="space-y-3">
        {activeMode === "email" && (
          <div className="space-y-1">
            <Label className="text-xs">{t("subject", "Subject")}</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject..." />
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-xs">{t("message", "Message")}</Label>
          <Textarea 
            value={message} 
            onChange={e => setMessage(e.target.value)} 
            placeholder={`Type your ${activeMode} message here...`}
            rows={5}
          />
        </div>
        <div className="pt-2">
          <Button onClick={handleSend} disabled={sending} className="gap-2 w-full sm:w-auto">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {t("send", "Send")} {activeMode.toUpperCase()}
          </Button>
        </div>
      </div>
    </div>
  );
}
