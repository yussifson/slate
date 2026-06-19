import { useTranslation } from "react-i18next";
import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, PenTool, Eye, CheckCircle, Clock, XCircle, Loader2, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const STATUS_CONFIG = {
  draft:    { color: "bg-gray-100 text-gray-600",    icon: Clock },
  sent:     { color: "bg-orange-100 text-orange-700",    icon: Send },
  opened:   { color: "bg-amber-100 text-amber-700",  icon: Eye },
  signed:   { color: "bg-slate-100 text-primary/90",  icon: CheckCircle },
  declined: { color: "bg-red-100 text-red-700",      icon: XCircle },
  expired:  { color: "bg-gray-100 text-[#71717a] dark:text-gray-400",    icon: Clock },
};

export default function ESignaturePanel({ caseData, user }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSendForm, setShowSendForm] = useState(false);
  const [viewingSig, setViewingSig] = useState(null);
  const canManage = ["super_admin", "company_admin"].includes(user?.role) || user?.email === caseData.assigned_lawyer;

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["sig-requests", caseData.id],
    queryFn: () => base44.entities.SignatureRequest.filter({ case_id: caseData.id }),
    enabled: !!caseData.id,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["case-documents", caseData.id],
    queryFn: () => base44.entities.Document.filter({ case_id: caseData.id }),
    enabled: !!caseData.id,
  });

  const sendMutation = useMutation({
    mutationFn: async (data) => {
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const req = await base44.entities.SignatureRequest.create({
        ...data,
        company_id: user?.company_id,
        case_id: caseData.id,
        case_title: caseData.title,
        sent_by: user?.email,
        sent_by_name: user?.full_name,
        status: "sent",
        sent_at: new Date().toISOString(),
        signature_token: token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const signingUrl = `${window.location.origin}/sign/${token}`;

      await base44.integrations.Core.SendEmail({
        to: data.client_email,
        from_name: user?.full_name || "Slate",
        subject: `Signature Required: ${data.document_name}`,
        body: `Dear ${data.client_name},

You have been requested to sign the following document:

Document: ${data.document_name}
Case: ${caseData.title}
${data.message ? `\nMessage from your lawyer:\n${data.message}\n` : ""}
To review and sign this document, please click the link below:
${signingUrl}

This link will expire in 7 days.

Best regards,
${user?.full_name}
Slate Law Management`,
      });

      return req;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sig-requests", caseData.id] });
      setShowSendForm(false);
      toast({ title: "Signature request sent to client" });
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (req) => {
      const signingUrl = `${window.location.origin}/sign/${req.signature_token}`;
      await base44.integrations.Core.SendEmail({
        to: req.client_email,
        subject: `[Reminder] Signature Required: ${req.document_name}`,
        body: `Dear ${req.client_name},\n\nThis is a reminder to sign the document: ${req.document_name}\n\nSigning link: ${signingUrl}\n\n— Slate`,
      });
      toast({ title: "Reminder sent" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{t("e_signature_requests", "E-Signature Requests")}</h3>
          <p className="text-xs text-[#71717a] dark:text-gray-400 mt-0.5 tracking-[0.04em]">{t(
            "send_documents_to_clients_for_",
            "Send documents to clients for legally binding electronic signatures"
          )}</p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setShowSendForm(true)} className="gap-2.5 text-xs tracking-[0.04em]">
            <Send className="w-3.5 h-3.5" /> {t("request_signature", "Request Signature")}
          </Button>
        )}
      </div>
      {isLoading ? (
        <div className="p-8 text-center text-sm text-[#71717a] dark:text-gray-400">{t("loading", "Loading...")}</div>
      ) : requests.length === 0 ? (
        <div className="bg-card rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-10 text-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <PenTool className="w-10 h-10 mx-auto text-[#71717a] dark:text-gray-400 mb-3" />
          <p className="text-sm font-medium">{t("no_signature_requests_yet", "No signature requests yet")}</p>
          <p className="text-xs text-[#71717a] dark:text-gray-400 mt-1 tracking-[0.04em]">{t(
            "send_documents_to_clients_for_",
            "Send documents to clients for e-signatures and track their status here."
          )}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map(req => {
            const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.sent;
            const StatusIcon = cfg.icon;
            return (
              <div key={req.id} className="bg-card rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 px-4 py-3 flex items-center gap-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <PenTool className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{req.document_name}</p>
                    <Badge className={`text-[10px] gap-2 ${cfg.color}`}>
                      <StatusIcon className="w-2.5 h-2.5" />
                      {req.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-0.5 text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">
                    <span>{t("to", "To:")} {req.client_name}({req.client_email})</span>
                    {req.sent_at && <span>{t("sent", "Sent:")} {format(new Date(req.sent_at), "MMM d, HH:mm")}</span>}
                    {req.opened_at && <span>{t("opened", "Opened:")} {format(new Date(req.opened_at), "MMM d, HH:mm")}</span>}
                    {req.signed_at && <span>{t("signed", "Signed:")} {format(new Date(req.signed_at), "MMM d, HH:mm")}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {req.signature_data && (
                    <Button variant="outline" size="sm" className="text-xs h-7 px-2 tracking-[0.04em]" onClick={() => setViewingSig(req)}>
                      {t("view_signature", "View Signature")}
                    </Button>
                  )}
                  {["sent", "opened"].includes(req.status) && canManage && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Send reminder" onClick={() => resendMutation.mutate(req)}>
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <SendSignatureDialog
        open={showSendForm}
        onClose={() => setShowSendForm(false)}
        onSubmit={(data) => sendMutation.mutate(data)}
        documents={documents}
        caseData={caseData}
        isSending={sendMutation.isPending}
      />
      {viewingSig && (
        <Dialog open={!!viewingSig} onOpenChange={() => setViewingSig(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{t("signed_signature", "Signed Signature —")} {viewingSig.document_name}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="bg-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-4 flex items-center justify-center min-h-32 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                {viewingSig.signature_data
                  ? <img src={viewingSig.signature_data} alt="Client signature" className="max-h-28 object-contain" />
                  : <p className="text-sm text-[#71717a] dark:text-gray-400">{t("no_signature_image", "No signature image")}</p>}
              </div>
              <div className="text-xs text-[#71717a] dark:text-gray-400 space-y-1 tracking-[0.04em]">
                <p><strong>{t("signed_by", "Signed by:")}</strong> {viewingSig.client_name} ({viewingSig.client_email})</p>
                {viewingSig.signed_at && <p><strong>{t("signed_at", "Signed at:")}</strong> {format(new Date(viewingSig.signed_at), "PPP p")}</p>}
                {viewingSig.signature_ip && <p><strong>{t("ip_address", "IP Address:")}</strong> {viewingSig.signature_ip}</p>}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function SendSignatureDialog({ open, onClose, onSubmit, documents, caseData, isSending }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    document_id: "",
    document_name: "",
    client_id: caseData.client_id || "",
    client_name: caseData.client_name || "",
    client_email: "",
    message: "",
  });

  const handleDocChange = (id) => {
    const doc = documents.find(d => d.id === id);
    setForm(f => ({ ...f, document_id: id, document_name: doc?.name || "" }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t("request_e_signature", "Request E-Signature")}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>{t("document_to_sign", "Document to Sign")}</Label>
            <Select value={form.document_id} onValueChange={handleDocChange}>
              <SelectTrigger><SelectValue placeholder="Select document..." /></SelectTrigger>
              <SelectContent>
                {documents.map(d => {
                  return <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("client_name", "Client Name")}</Label>
            <Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
          </div>
          <div>
            <Label>{t("client_email", "Client Email")}</Label>
            <Input type="email" value={form.client_email} onChange={e => setForm({ ...form, client_email: e.target.value })} placeholder="client@example.com" required />
          </div>
          <div>
            <Label>{t("message_to_client_optional", "Message to Client (optional)")}</Label>
            <Input value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Please review and sign this document..." />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>{t("cancel", "Cancel")}</Button>
            <Button onClick={() => onSubmit(form)} disabled={isSending || !form.document_id || !form.client_email} className="gap-2.5">
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {t("send_for_signature", "Send for Signature")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}