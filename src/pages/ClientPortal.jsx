import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Briefcase, Calendar, Receipt, Download, FileText, FolderOpen, MessageSquare, Scale, BarChart2, CheckSquare, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format, isAfter } from "date-fns";
import { CASE_STATUS_COLORS, INVOICE_STATUS_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import ClientMessaging from "@/components/portal/ClientMessaging";
import { UploadDocumentDialog } from "@/components/cases/CaseDocumentRepo";
import ClientBillingReport from "@/components/portal/ClientBillingReport";
import ClientChecklistPanel from "@/components/portal/ClientChecklistPanel";
import ClientAtAGlance from "@/components/portal/ClientAtAGlance";
import { getTerm } from "@/config/industries";
import PaymentModal from "@/components/portal/PaymentModal";

function StatCard({ icon: IconComp, label, value, color }) {
  return (
    <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 flex items-center gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <IconComp className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-[-0.02em]">{value}</p>
        <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{label}</p>
      </div>
    </div>
  );
}

export default function ClientPortal() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedCase, setSelectedCase] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ["my-client", user?.email],
    queryFn: () => base44.entities.Client.filter({ email: user?.email }),
    enabled: !!user?.email});

  const client = clients[0];

  const { data: cases = [] } = useQuery({
    queryKey: ["client-cases", client?.id],
    queryFn: () => base44.entities.LegalCase.filter({ client_id: client?.id }),
    enabled: !!client?.id});

  const { data: hearings = [] } = useQuery({
    queryKey: ["client-hearings", client?.id],
    queryFn: () => base44.entities.Hearing.filter({ company_id: client?.company_id }),
    enabled: !!client?.id});

  const { data: invoices = [] } = useQuery({
    queryKey: ["client-invoices", client?.id],
    queryFn: () => base44.entities.Invoice.filter({ client_id: client?.id }),
    enabled: !!client?.id});

  const { data: sharedDocs = [] } = useQuery({
    queryKey: ["client-docs", client?.id],
    queryFn: () => base44.entities.Document.filter({ client_id: client?.id, shared_with_client: true }),
    enabled: !!client?.id});

  const { data: expenses = [] } = useQuery({
    queryKey: ["client-expenses", client?.id],
    queryFn: () => base44.entities.Expense.filter({ client_id: client?.id }),
    enabled: !!client?.id});

  const { data: signatureRequests = [] } = useQuery({
    queryKey: ["client-signatures", client?.id],
    queryFn: () => base44.entities.SignatureRequest.filter({ client_id: client?.id }),
    enabled: !!client?.id});

  const { data: pipelineStates = [] } = useQuery({
    queryKey: ["client-pipeline-states", client?.id],
    queryFn: () => base44.entities.CasePipelineState.filter({ company_id: client?.company_id }),
    enabled: !!client?.id});

  const caseIds = new Set(cases.map(c => c.id));
  const upcomingHearings = hearings
    .filter(h => caseIds.has(h.case_id) && h.date && isAfter(new Date(h.date), new Date()))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const getPipelineState = (caseId) => pipelineStates.find(ps => ps.case_id === caseId);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Document.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-docs", client?.id] });
      toast({ title: "Document uploaded successfully" });
      setShowUpload(false);
    }});

  const handleUploadSubmit = (docData) => {
    // If no case is selected, assign it to the first active case, or just leave it null
    const targetCase = selectedCase || cases[0];
    createMutation.mutate({
      ...docData,
      company_id: client?.company_id,
      client_id: client?.id,
      client_name: client?.name,
      case_id: targetCase?.id,
      case_title: targetCase?.title,
      uploaded_by: user?.email,
      shared_with_client: true, // uploaded by client, so it's inherently shared
    });
  };

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-invoices", client?.id] });
      setPayingInvoice(null);
    }});

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Scale className="w-8 h-8 text-[#71717a] dark:text-gray-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{t("no", "No")} {getTerm(user?.company_industry, 'client')} {t("profile_found", "Profile Found")}</h2>
          <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1 max-w-sm">
            {t("your_account", "Your account (")}{user?.email}{t("is_not_linked_to_a", ") is not linked to a")} {getTerm(user?.company_industry, 'client').toLowerCase()} {t(
              "record_please_contact_your_org",
              "record. Please contact your organization."
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 school-page-enter font-dmsans">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900/40/20 flex items-center justify-center text-lg font-semibold hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            {client.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-semibold">{t("welcome", "Welcome,")} {client.name}</h1>
            <p className="text-sm text-white/80">{t("your_secure_portal_view", "Your secure portal — view")} {getTerm(user?.company_industry, 'cases').toLowerCase()}{t("documents_invoices", ", documents & invoices")}</p>
          </div>
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label={`My ${getTerm(user?.company_industry, 'cases')}`} value={cases.length} color="bg-slate-50 dark:bg-slate-800/50 text-primary" />
        <StatCard icon={Calendar} label="Upcoming Appointments" value={upcomingHearings.length} color="bg-slate-50 dark:bg-slate-800/50 text-primary" />
        <StatCard icon={Receipt} label="Invoices Paid" value={invoices.filter(i => i.status === "paid").length} color="bg-slate-50 dark:bg-slate-800/50 text-primary" />
        <StatCard icon={FolderOpen} label="Documents" value={sharedDocs.length} color="bg-amber-50 text-amber-600" />
      </div>
      {/* At a Glance */}
      <ClientAtAGlance
      hearings={upcomingHearings}
      signatureRequests={signatureRequests}
      invoices={invoices}
      currency="GHS"
      />
      <Tabs defaultValue="cases">
        <TabsList className="flex-wrap h-auto gap-2">
          <TabsTrigger value="cases" className="gap-2.5"><Briefcase className="w-3.5 h-3.5" />{t("my", "My")} {getTerm(user?.company_industry, 'cases')}</TabsTrigger>
          <TabsTrigger value="hearings" className="gap-2.5"><Calendar className="w-3.5 h-3.5" />{t("appointments", "Appointments")}</TabsTrigger>
          <TabsTrigger value="documents" className="gap-2.5"><FolderOpen className="w-3.5 h-3.5" />{t("documents", "Documents")}</TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2.5"><Receipt className="w-3.5 h-3.5" />{t("invoices", "Invoices")}</TabsTrigger>
          <TabsTrigger value="messages" className="gap-2.5"><MessageSquare className="w-3.5 h-3.5" />{t("messages", "Messages")}</TabsTrigger>
          <TabsTrigger value="billing" className="gap-2.5"><BarChart2 className="w-3.5 h-3.5" />{t("billing_report", "Billing Report")}</TabsTrigger>
          <TabsTrigger value="checklist" className="gap-2.5"><CheckSquare className="w-3.5 h-3.5" />{t("my_tasks", "My Tasks")}</TabsTrigger>
        </TabsList>

        {/* Cases tab */}
        <TabsContent value="cases" className="mt-4">
          <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 divide-y divide-border hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            {cases.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#71717a] dark:text-gray-400">{t("no", "No")} {getTerm(user?.company_industry, 'cases').toLowerCase()} {t("found", "found")}</div>
            ) : cases.map(c => {
              const ps = getPipelineState(c.id);
              return (
                <div key={c.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-tight">{c.title}</p>
                    <Badge className={cn("text-[10px] shrink-0", CASE_STATUS_COLORS[c.status])}>
                      {c.status?.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">
                    {c.case_number && <span>#{c.case_number}</span>}
                    {c.case_type && <span className="capitalize">{c.case_type}</span>}
                    {c.court_name && <span>{c.court_name}</span>}
                    {c.assigned_lawyer_name && <span>{t("lawyer", "Lawyer:")} <span className="text-foreground font-medium">{c.assigned_lawyer_name}</span></span>}
                  </div>
                  {ps && (
                    <div className="flex items-center gap-2.5 mt-1">
                      <span className="text-[10px] text-[#71717a] dark:text-gray-400">{t("status", "Status:")}</span>
                      <Badge className="text-[10px] bg-slate-100 text-primary">{ps.current_stage_name}</Badge>
                    </div>
                  )}
                  {c.next_hearing_date && (
                    <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("next_appointment", "Next appointment:")} <span className="text-foreground">{format(new Date(c.next_hearing_date), "MMM d, yyyy")}</span></p>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Hearings tab */}
        <TabsContent value="hearings" className="mt-4">
          <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 divide-y divide-border hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            {upcomingHearings.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#71717a] dark:text-gray-400">{t("no_upcoming_appointments", "No upcoming appointments")}</div>
            ) : upcomingHearings.map(h => {
              return (
                <div key={h.id} className="p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] font-semibold text-primary leading-none">{format(new Date(h.date), "MMM")}</span>
                    <span className="text-lg font-semibold text-primary leading-none">{format(new Date(h.date), "d")}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{h.title}</p>
                    <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{h.court_name}{h.time ? ` · ${h.time}` : ""}</p>
                    {h.judge_name && <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("judge", "Judge:")} {h.judge_name}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Documents tab */}
        <TabsContent value="documents" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold">{t("my_documents", "My Documents")}</h3>
            <Button size="sm" onClick={() => setShowUpload(true)} className="gap-2.5">
              <Upload className="w-4 h-4" /> {t("upload_document", "Upload Document")}
            </Button>
          </div>
          <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 divide-y divide-border hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            {sharedDocs.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#71717a] dark:text-gray-400">{t("no_documents_shared_with_you_y", "No documents shared with you yet")}</div>
            ) : sharedDocs.map(doc => {
              return (
                <div key={doc.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-[#71717a] dark:text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-[#71717a] dark:text-gray-400 capitalize tracking-[0.04em]">{doc.category?.replace("_", " ")}{doc.case_title ? ` · ${doc.case_title}` : ""}</p>
                    </div>
                  </div>
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-2 shrink-0 tracking-[0.04em]">
                        <Download className="w-3 h-3" /> {t("download", "Download")}
                      </Button>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Invoices tab */}
        <TabsContent value="invoices" className="mt-4">
          <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 divide-y divide-border hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            {invoices.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#71717a] dark:text-gray-400">{t("no_invoices_found", "No invoices found")}</div>
            ) : invoices.map(inv => {
              return (
                <div key={inv.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{inv.invoice_number || "Invoice"}</p>
                    <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">
                      {inv.case_title && `${inv.case_title} · `}
                      {t("due", "Due")} {inv.due_date ? format(new Date(inv.due_date), "MMM d, yyyy") : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold">{inv.currency === "NGN" ? "₦" : inv.currency === "USD" ? "$" : "GH₵"}{(inv.total_amount || 0).toLocaleString()}</span>
                    <Badge className={cn("text-[10px]", INVOICE_STATUS_COLORS[inv.status])}>{inv.status}</Badge>
                    {inv.status !== "paid" && (
                       <Button size="sm" className="bg-primary hover:bg-primary/90 h-7 text-xs px-3 tracking-[0.04em]" onClick={() => setPayingInvoice(inv)}>
                         {t("pay_now", "Pay Now")}
                       </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Billing Report tab */}
        <TabsContent value="billing" className="mt-4">
          <ClientBillingReport
            invoices={invoices}
            expenses={expenses}
            currency="GHS"
          />
        </TabsContent>

        {/* Checklist tab */}
        <TabsContent value="checklist" className="mt-4">
          <ClientChecklistPanel clientId={client?.id} />
        </TabsContent>

        {/* Messages tab */}
        <TabsContent value="messages" className="mt-4">
          {cases.length === 0 ? (
            <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-10 text-center text-sm text-[#71717a] dark:text-gray-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              {t("no", "No")} {getTerm(user?.company_industry, 'cases').toLowerCase()} {t("found_to_message_about", "found to message about")}
            </div>
          ) : (
            <div className="space-y-4">
              {cases.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {cases.map(c => {
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCase(c)}
                        className={cn(
                          "text-xs px-3 py-1.5 rounded-full border-[0.5px] border-black/9 dark:border-white/8 transition-colors",
                          selectedCase?.id === c.id || (!selectedCase && c.id === cases[0].id)
                            ? "bg-primary text-white border-primary"
                            : "bg-card border-primary/40 text-foreground hover:bg-muted"
                        )}
                      >
                        {c.title}
                      </button>
                    );
                  })}
                </div>
              )}
              <ClientMessaging
                caseData={selectedCase || cases[0]}
                user={user}
                senderType="client"
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
      {/* Upload document dialog */}
      {showUpload && (
        <UploadDocumentDialog
          onClose={() => setShowUpload(false)}
          onSubmit={handleUploadSubmit}
          isUploading={createMutation.isPending}
          companyId={client?.company_id}
          caseId={selectedCase?.id || cases[0]?.id}
        />
      )}

      {/* Payment Modal */}
      <PaymentModal
        open={!!payingInvoice}
        onClose={() => setPayingInvoice(null)}
        invoice={payingInvoice}
        onSuccess={() => updateInvoiceMutation.mutate({ id: payingInvoice.id, data: { status: "paid", paid_date: new Date().toISOString().split("T")[0] } })}
      />
    </div>
  );
}