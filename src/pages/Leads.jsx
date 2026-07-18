import { useTranslation } from "react-i18next";
import React from 'react';
import { RevenueForecastCard, BehaviourProfilePanel, BenchmarkingPanel } from '@/components/intelligence/IntelligenceUI';
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Users, Search, ExternalLink, Mail, Phone, CheckCircle, XCircle, Trash2, Pencil, Save, Calendar as CalendarIcon, Zap, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

const STATUS_COLORS = {
  new: "bg-orange-100 text-orange-700",
  contacted: "bg-amber-100 text-amber-700",
  qualified: "bg-slate-100 text-primary/90",
  converted: "bg-slate-100 text-primary/90",
  lost: "bg-gray-100 text-[#71717a] dark:text-gray-400"};

const URGENCY_COLORS = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-slate-100 text-primary",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700"};

const calculateLeadScore = (lead) => {
  let score = 0;
  if (lead.status === 'qualified') score += 40;
  else if (lead.status === 'contacted') score += 20;
  else if (lead.status === 'new') score += 10;
  if (lead.urgency === 'urgent') score += 30;
  else if (lead.urgency === 'high') score += 20;
  else if (lead.urgency === 'medium') score += 10;
  if (lead.email) score += 10;
  if (lead.phone) score += 10;
  if (lead.organization) score += 10;
  return Math.min(100, score);
};

export default function Leads() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const companyId = user?.company_id;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showSequences, setShowSequences] = useState(false);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads", companyId],
    queryFn: () => base44.entities.Lead.filter({ company_id: companyId }),
    enabled: !!companyId});

  const { data: emailSequences = [] } = useQuery({
    queryKey: ["email_sequences", companyId],
    queryFn: () => base44.entities.EmailSequence.filter({ company_id: companyId }),
    enabled: !!companyId});

  const createSequenceMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailSequence.create({ ...data, company_id: companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_sequences"] });
      toast({ title: "Sequence created" });
    }});

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead updated" });
    }});

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Lead.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead deleted" });
      setSelectedLead(null);
    }});

  const convertToClientMutation = useMutation({
    mutationFn: async (lead) => {
      await base44.entities.Client.create({
        company_id: companyId,
        name: lead.full_name,
        email: lead.email,
        phone: lead.phone,
        type: lead.organization ? "organization" : "individual",
        status: "active"});
      await base44.entities.Lead.update(lead.id, { status: "converted" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setSelectedLead(null);
      toast({ title: "Lead converted to client" });
    }});

  const filtered = leads.filter(l => {
    const matchSearch = !search || l.full_name?.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const intakeFormUrl = `${window.location.origin}/intake${companyId ? `?firm=${companyId}` : ""}`;

  const columns = [
    {
      header: "Name",
      render: row => {
        return (
          <div>
            <p className="font-medium text-sm">{row.full_name}</p>
            <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{row.email}</p>
          </div>
        );
      }
    },
    {
      header: "Score",
      render: row => {
        const score = calculateLeadScore(row);
        const color = score >= 70 ? "text-green-700 bg-green-100" : score >= 40 ? "text-amber-700 bg-amber-100" : "text-slate-700 bg-slate-100";
        return <Badge className={`text-[10px] ${color}`}>{score}</Badge>;
      }
    },
    { header: "Case Type", render: row => {
      return <Badge variant="outline" className="text-[10px] capitalize">{row.case_type?.replace("_", " ") || "—"}</Badge>;
    } },
    { header: "Urgency", render: row => {
      return <Badge className={`text-[10px] ${URGENCY_COLORS[row.urgency]}`}>{row.urgency}</Badge>;
    } },
    { header: "Status", render: row => {
      return <Badge className={`text-[10px] ${STATUS_COLORS[row.status]}`}>{row.status}</Badge>;
    } },
    { header: "Submitted", render: row => {
      return <span className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{format(new Date(row.created_date), "MMM d, yyyy")}</span>;
    } },
    {
      header: "Actions",
      render: row => {
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Email lead" onClick={e => { e.stopPropagation(); window.open(`mailto:${row.email}`); }}>
              <Mail className="w-3.5 h-3.5" />
            </Button>
            {row.phone && (
              <Button variant="ghost" size="icon" className="h-7 w-7" title="Call lead" onClick={e => { e.stopPropagation(); window.open(`tel:${row.phone}`); }}>
                <Phone className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" title="Delete lead" onClick={e => {
              e.stopPropagation();
              if (window.confirm(t("confirm_delete_lead", "Are you sure you want to delete this lead?"))) {
                deleteMutation.mutate(row.id);
              }
            }}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        );
      }
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Leads & CRM"
        subtitle={`${leads.filter(l => l.status === "new").length} new leads from intake form`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={() => setShowSequences(true)}>
              <Send className="w-4 h-4" /> Email Sequences
            </Button>
            <Button variant="outline" size="sm" className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => setShowScheduler(true)}>
              <CalendarIcon className="w-4 h-4" /> Meeting Scheduler
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(intakeFormUrl, "_blank")}>
              <ExternalLink className="w-4 h-4" /> {t("view_intake_form", "Intake Form")}
            </Button>
          </div>
        }
      />
      {/* Intake Form Link Banner */}
      <div className="bg-slate-50 dark:bg-secondary/50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary/70">{t("your_public_intake_form_is_liv", "Your public intake form is live")}</p>
          <p className="text-xs text-primary/90 mt-0.5 break-all tracking-[0.04em]">{intakeFormUrl}</p>
        </div>
        <Button size="sm" variant="outline" className="shrink-0 text-primary/90 border-primary/30" onClick={() => { navigator.clipboard.writeText(intakeFormUrl); toast({ title: "Link copied!" }); }}>
          {t("copy_link", "Copy Link")}
        </Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
          <Input placeholder="Search leads..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all_status", "All Status")}</SelectItem>
            <SelectItem value="new">{t("new", "New")}</SelectItem>
            <SelectItem value="contacted">{t("contacted", "Contacted")}</SelectItem>
            <SelectItem value="qualified">{t("qualified", "Qualified")}</SelectItem>
            <SelectItem value="converted">{t("converted", "Converted")}</SelectItem>
            <SelectItem value="lost">{t("lost", "Lost")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        onRowClick={setSelectedLead}
        emptyTitle="No leads yet"
        emptyDescription="Share your intake form link to start collecting inquiries."
        emptyIcon={Users}
      />
      {selectedLead && (
        <LeadDetailDialog
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onSave={(data) => {
            updateMutation.mutate({ id: selectedLead.id, data });
            setSelectedLead({ ...selectedLead, ...data });
          }}
          onDelete={() => {
            if (window.confirm(t("confirm_delete_lead", "Are you sure you want to delete this lead?"))) {
              deleteMutation.mutate(selectedLead.id);
            }
          }}
          onUpdateStatus={(status) => {
            updateMutation.mutate({ id: selectedLead.id, data: { status } });
            setSelectedLead({ ...selectedLead, status });
          }}
          onConvert={() => convertToClientMutation.mutate(selectedLead)}
          isConverting={convertToClientMutation.isPending}
        />
      )}

      {/* Meeting Scheduler Modal */}
      <Dialog open={showScheduler} onOpenChange={setShowScheduler}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-blue-500"/> Meeting Scheduler</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">Share this link with leads to let them book time directly on your calendar.</p>
            <div className="bg-muted p-3 rounded-lg flex items-center justify-between border border-border">
              <span className="text-sm font-medium truncate">{window.location.origin}/book/{companyId || 'demo'}</span>
              <Button size="sm" variant="secondary" onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/book/${companyId || 'demo'}`);
                toast({ title: "Booking link copied!" });
              }}>Copy</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Sequences Modal */}
      <Dialog open={showSequences} onOpenChange={setShowSequences}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="w-5 h-5 text-indigo-500"/> Email Sequences</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">Automated drip campaigns for new leads.</p>
            <div className="space-y-3">
              {emailSequences.length === 0 && (
                 <p className="text-sm text-muted-foreground italic">No sequences found. Create one below.</p>
              )}
              {emailSequences.map(seq => {
                const stepsObj = seq.steps ? JSON.parse(seq.steps) : [];
                return (
                <div key={seq.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                  <div>
                    <h4 className="font-medium text-sm">{seq.name}</h4>
                    <p className="text-xs text-muted-foreground">{stepsObj.length} emails</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">{seq.description}</span>
                    <Button variant="ghost" size="sm"><Pencil className="w-4 h-4"/></Button>
                  </div>
                </div>
              )})}
            </div>
            <Button 
                onClick={() => createSequenceMutation.mutate({ name: "New Lead Welcome", description: "Default welcome", steps: "[]" })}
                className="w-full mt-2 gap-2"
                disabled={createSequenceMutation.isPending}
            >
                <Plus className="w-4 h-4"/> Create Default Sequence
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LeadDetailDialog({ lead, onClose, onUpdateStatus, onConvert, onSave, onDelete, isConverting }) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...lead });

  useEffect(() => {
    setFormData({ ...lead });
  }, [lead]);

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
  };

  return (
    <Dialog open={!!lead} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <Input 
                value={formData.full_name} 
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
                className="h-8 w-48 font-semibold"
              />
            ) : (
              lead.full_name
            )}
            <Badge className={`text-[10px] ${STATUS_COLORS[lead.status]}`}>{lead.status}</Badge>
            <div className="ml-auto flex items-center gap-2">
              {!isEditing ? (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={handleSave}>
                  <Save className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <Label className="text-xs tracking-[0.04em]">{t("email", "Email")}</Label>
              {isEditing ? (
                <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-7 text-xs mt-1 tracking-[0.04em]" />
              ) : (
                <p className="mt-0.5">{lead.email}</p>
              )}
            </div>
            <div>
              <Label className="text-xs tracking-[0.04em]">{t("phone", "Phone")}</Label>
              {isEditing ? (
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-7 text-xs mt-1 tracking-[0.04em]" />
              ) : (
                <p className="mt-0.5">{lead.phone || "—"}</p>
              )}
            </div>
            <div>
              <Label className="text-xs tracking-[0.04em]">{t("organization", "Organization")}</Label>
              {isEditing ? (
                <Input value={formData.organization} onChange={(e) => setFormData({ ...formData, organization: e.target.value })} className="h-7 text-xs mt-1 tracking-[0.04em]" />
              ) : (
                <p className="mt-0.5">{lead.organization || "Individual"}</p>
              )}
            </div>
            <div>
              <Label className="text-xs tracking-[0.04em]">{t("case_type", "Case Type")}</Label>
              {isEditing ? (
                <Select value={formData.case_type} onValueChange={(val) => setFormData({ ...formData, case_type: val })}>
                  <SelectTrigger className="h-7 text-xs mt-1 tracking-[0.04em]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="litigation">Litigation</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="family_law">Family Law</SelectItem>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-0.5 capitalize">{lead.case_type?.replace("_", " ") || "—"}</p>
              )}
            </div>
            <div>
              <Label className="text-xs tracking-[0.04em]">{t("urgency", "Urgency")}</Label>
              {isEditing ? (
                <Select value={formData.urgency} onValueChange={(val) => setFormData({ ...formData, urgency: val })}>
                  <SelectTrigger className="h-7 text-xs mt-1 tracking-[0.04em]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={`text-[10px] mt-0.5 ${URGENCY_COLORS[lead.urgency]}`}>{lead.urgency}</Badge>
              )}
            </div>
            <div>
              <Label className="text-xs tracking-[0.04em]">{t("preferred_contact", "Preferred Contact")}</Label>
              {isEditing ? (
                <Select value={formData.preferred_contact} onValueChange={(val) => setFormData({ ...formData, preferred_contact: val })}>
                  <SelectTrigger className="h-7 text-xs mt-1 tracking-[0.04em]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-0.5 capitalize">{lead.preferred_contact || "—"}</p>
              )}
            </div>
          </div>
          <div>
            <Label className="text-xs tracking-[0.04em]">{t("case_description", "Case Description")}</Label>
            {isEditing ? (
              <Input value={formData.case_description} onChange={(e) => setFormData({ ...formData, case_description: e.target.value })} className="mt-1" />
            ) : (
              <p className="mt-1 text-sm bg-muted/40 rounded-xl p-3">{lead.case_description}</p>
            )}
          </div>
          <div>
            <Label className="text-xs tracking-[0.04em]">{t("update_status", "Update Status")}</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {["new", "contacted", "qualified", "lost"].map(s => {
                return (
                  <button
                    key={s}
                    onClick={() => onUpdateStatus(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border-[0.5px] border-black/9 dark:border-white/8 capitalize transition-colors ${lead.status === s ? STATUS_COLORS[s] + " border-transparent" : "border-primary/40 text-[#71717a] dark:text-gray-400 hover:bg-muted"}`}
                  >{s}</button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-primary/40">
            <Button variant="outline" onClick={onClose}>{t("close", "Close")}</Button>
            {lead.status !== "converted" && (
              <Button onClick={onConvert} disabled={isConverting} className="gap-2.5 bg-primary hover:bg-primary/90 text-white">
                {isConverting ? "Converting..." : <><CheckCircle className="w-4 h-4" /> {t("convert_to_client", "Convert to Client")}</>}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}