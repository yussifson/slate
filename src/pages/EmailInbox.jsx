import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Mail, Link2, Search, User, Briefcase, CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/shared/PageHeader";
import { format } from "date-fns";

export default function EmailInbox() {
  const { user } = useAuth();
  const companyId = user?.company_id;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [linkingEmail, setLinkingEmail] = useState(null);

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ["case-emails", companyId],
    queryFn: () => base44.entities.CaseEmail.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["cases", companyId],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", companyId],
    queryFn: () => base44.entities.Client.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CaseEmail.create({ ...data, company_id: companyId, logged_by: user?.email }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["case-emails"] }); setShowAddEmail(false); },
  });

  const linkMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CaseEmail.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["case-emails"] }); setLinkingEmail(null); },
  });

  const filtered = emails.filter(e =>
    !search ||
    e.subject?.toLowerCase().includes(search.toLowerCase()) ||
    e.sender_email?.toLowerCase().includes(search.toLowerCase()) ||
    e.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  const linked = filtered.filter(e => e.case_id || e.client_id);
  const unlinked = filtered.filter(e => !e.case_id && !e.client_id);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Email Inbox"
        subtitle="Link firm emails to client profiles and case folders"
        actions={
          <Button size="sm" onClick={() => setShowAddEmail(true)}>
            <Plus className="w-4 h-4 mr-1" /> Log Email
          </Button>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search emails..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Unlinked Emails */}
      {unlinked.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-foreground">Unlinked Emails</h2>
            <Badge className="bg-amber-100 text-amber-700 text-[10px]">{unlinked.length}</Badge>
          </div>
          <div className="space-y-2">
            {unlinked.map(email => (
              <EmailCard key={email.id} email={email} onLink={() => setLinkingEmail(email)} />
            ))}
          </div>
        </div>
      )}

      {/* Linked Emails */}
      {linked.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-foreground">Linked Emails</h2>
            <Badge className="bg-green-100 text-green-700 text-[10px]">{linked.length}</Badge>
          </div>
          <div className="space-y-2">
            {linked.map(email => (
              <EmailCard key={email.id} email={email} onLink={() => setLinkingEmail(email)} isLinked />
            ))}
          </div>
        </div>
      )}

      {!isLoading && emails.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4">
            <Mail className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">No emails logged yet</p>
          <p className="text-sm text-muted-foreground mt-1">Log emails to link them to cases and clients.</p>
        </div>
      )}

      {/* Add Email Dialog */}
      <AddEmailDialog
        open={showAddEmail}
        onClose={() => setShowAddEmail(false)}
        onSubmit={createMutation.mutate}
        cases={cases}
        clients={clients}
        user={user}
      />

      {/* Link Email Dialog */}
      {linkingEmail && (
        <LinkEmailDialog
          email={linkingEmail}
          cases={cases}
          clients={clients}
          onClose={() => setLinkingEmail(null)}
          onSubmit={(data) => linkMutation.mutate({ id: linkingEmail.id, data })}
        />
      )}
    </div>
  );
}

function EmailCard({ email, onLink, isLinked }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-4 hover:shadow-sm transition-shadow">
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Mail className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground truncate">{email.subject || "(No subject)"}</p>
          <span className="text-xs text-muted-foreground shrink-0">
            {email.received_date ? format(new Date(email.received_date), "MMM d, yyyy") : "—"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">From: {email.sender_email || "Unknown"} · To: {email.recipient_email || "—"}</p>
        {email.body_preview && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{email.body_preview}</p>}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {email.client_name && (
            <Badge className="bg-purple-100 text-purple-700 text-[10px] gap-1"><User className="w-2.5 h-2.5" />{email.client_name}</Badge>
          )}
          {email.case_title && (
            <Badge className="bg-blue-100 text-blue-700 text-[10px] gap-1"><Briefcase className="w-2.5 h-2.5" />{email.case_title}</Badge>
          )}
          {isLinked && <Badge className="bg-green-100 text-green-700 text-[10px] gap-1"><CheckCircle2 className="w-2.5 h-2.5" />Linked</Badge>}
        </div>
      </div>
      <Button size="sm" variant="outline" className="shrink-0 gap-1 text-xs" onClick={onLink}>
        <Link2 className="w-3 h-3" /> {isLinked ? "Relink" : "Link"}
      </Button>
    </div>
  );
}

function AddEmailDialog({ open, onClose, onSubmit, cases, clients, user }) {
  const isAdmin = ["super_admin", "company_admin", "managing_partner"].includes(user?.role);
  const [form, setForm] = useState({ subject: "", sender_email: "", recipient_email: "", received_date: "", body_preview: "", case_id: "", client_id: "" });

  useEffect(() => {
    if (open) {
      setForm({
        subject: "",
        sender_email: isAdmin ? "" : (user?.email || ""),
        recipient_email: "",
        received_date: new Date().toISOString().split("T")[0],
        body_preview: "",
        case_id: "",
        client_id: ""
      });
    }
  }, [open, user, isAdmin]);

  const handleChange = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleClientChange = (clientId) => {
    const client = clients?.find(c => c.id === clientId);
    setForm(p => ({ ...p, client_id: clientId, client_name: client?.name || "" }));
  };

  const handleCaseChange = (caseId) => {
    const c = cases?.find(c => c.id === caseId);
    setForm(p => ({ ...p, case_id: caseId, case_title: c?.title || "" }));
  };

  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Log Email</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Subject *</Label><Input value={form.subject} onChange={(e) => handleChange("subject", e.target.value)} required /></div>
            <div>
              <Label>From</Label>
              <Input
                value={form.sender_email}
                onChange={(e) => handleChange("sender_email", e.target.value)}
                placeholder="sender@example.com"
                disabled={!isAdmin}
              />
            </div>
            <div><Label>To</Label><Input value={form.recipient_email} onChange={(e) => handleChange("recipient_email", e.target.value)} placeholder="recipient@example.com" /></div>
            <div><Label>Date Received</Label><Input type="date" value={form.received_date} onChange={(e) => handleChange("received_date", e.target.value)} /></div>
            <div>
              <Label>Link to Client <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Select value={form.client_id} onValueChange={handleClientChange}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Link to Case <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Select value={form.case_id} onValueChange={handleCaseChange}>
                <SelectTrigger><SelectValue placeholder="Select case" /></SelectTrigger>
                <SelectContent>{cases?.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Email Preview / Notes <span className="text-muted-foreground text-xs">(optional)</span></Label><Textarea value={form.body_preview} onChange={(e) => handleChange("body_preview", e.target.value)} rows={3} /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Log Email</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LinkEmailDialog({ email, cases, clients, onClose, onSubmit }) {
  const [caseId, setCaseId] = useState(email.case_id || "");
  const [clientId, setClientId] = useState(email.client_id || "");

  const handleClientChange = (id) => setClientId(id);
  const handleCaseChange = (id) => setCaseId(id);

  const handleSubmit = (e) => {
    e.preventDefault();
    const client = clients?.find(c => c.id === clientId);
    const caseItem = cases?.find(c => c.id === caseId);
    onSubmit({ case_id: caseId, case_title: caseItem?.title || "", client_id: clientId, client_name: client?.name || "" });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Link Email to Case / Client</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">"{email.subject}"</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Client</Label>
            <Select value={clientId} onValueChange={handleClientChange}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>— None —</SelectItem>
                {clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Case</Label>
            <Select value={caseId} onValueChange={handleCaseChange}>
              <SelectTrigger><SelectValue placeholder="Select case" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>— None —</SelectItem>
                {cases?.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Link</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}