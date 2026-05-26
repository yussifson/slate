import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Briefcase, Calendar, Receipt, Download, FileText, FolderOpen, MessageSquare, Scale, BarChart2, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format, isAfter } from "date-fns";
import { CASE_STATUS_COLORS, INVOICE_STATUS_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import ClientMessaging from "@/components/portal/ClientMessaging";
import ClientBillingReport from "@/components/portal/ClientBillingReport";
import ClientChecklistPanel from "@/components/portal/ClientChecklistPanel";
import ClientAtAGlance from "@/components/portal/ClientAtAGlance";
import { getTerm } from "@/config/industries";

function StatCard({ icon: IconComp, label, value, color }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <IconComp className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function ClientPortal() {
  const { user } = useAuth();
  const [selectedCase, setSelectedCase] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ["my-client", user?.email],
    queryFn: () => base44.entities.Client.filter({ email: user?.email }),
    enabled: !!user?.email,
  });

  const client = clients[0];

  const { data: cases = [] } = useQuery({
    queryKey: ["client-cases", client?.id],
    queryFn: () => base44.entities.LegalCase.filter({ client_id: client?.id }),
    enabled: !!client?.id,
  });

  const { data: hearings = [] } = useQuery({
    queryKey: ["client-hearings", client?.id],
    queryFn: () => base44.entities.Hearing.filter({ company_id: client?.company_id }),
    enabled: !!client?.id,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["client-invoices", client?.id],
    queryFn: () => base44.entities.Invoice.filter({ client_id: client?.id }),
    enabled: !!client?.id,
  });

  const { data: sharedDocs = [] } = useQuery({
    queryKey: ["client-docs", client?.id],
    queryFn: () => base44.entities.Document.filter({ client_id: client?.id, shared_with_client: true }),
    enabled: !!client?.id,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["client-expenses", client?.id],
    queryFn: () => base44.entities.Expense.filter({ client_id: client?.id }),
    enabled: !!client?.id,
  });

  const { data: signatureRequests = [] } = useQuery({
    queryKey: ["client-signatures", client?.id],
    queryFn: () => base44.entities.SignatureRequest.filter({ client_id: client?.id }),
    enabled: !!client?.id,
  });

  const { data: pipelineStates = [] } = useQuery({
    queryKey: ["client-pipeline-states", client?.id],
    queryFn: () => base44.entities.CasePipelineState.filter({ company_id: client?.company_id }),
    enabled: !!client?.id,
  });

  const caseIds = new Set(cases.map(c => c.id));
  const upcomingHearings = hearings
    .filter(h => caseIds.has(h.case_id) && h.date && isAfter(new Date(h.date), new Date()))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const getPipelineState = (caseId) => pipelineStates.find(ps => ps.case_id === caseId);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Scale className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">No {getTerm(user?.company_industry, 'client')} Profile Found</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Your account ({user?.email}) is not linked to a {getTerm(user?.company_industry, 'client').toLowerCase()} record. Please contact your organization.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
            {client.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold">Welcome, {client.name}</h1>
            <p className="text-sm text-white/80">Your secure portal — view {getTerm(user?.company_industry, 'cases').toLowerCase()}, documents & invoices</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label={`My ${getTerm(user?.company_industry, 'cases')}`} value={cases.length} color="bg-blue-50 text-blue-600" />
        <StatCard icon={Calendar} label="Upcoming Appointments" value={upcomingHearings.length} color="bg-purple-50 text-purple-600" />
        <StatCard icon={Receipt} label="Invoices Paid" value={invoices.filter(i => i.status === "paid").length} color="bg-green-50 text-green-600" />
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
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="cases" className="gap-1.5"><Briefcase className="w-3.5 h-3.5" />My {getTerm(user?.company_industry, 'cases')}</TabsTrigger>
          <TabsTrigger value="hearings" className="gap-1.5"><Calendar className="w-3.5 h-3.5" />Appointments</TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5"><FolderOpen className="w-3.5 h-3.5" />Documents</TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1.5"><Receipt className="w-3.5 h-3.5" />Invoices</TabsTrigger>
          <TabsTrigger value="messages" className="gap-1.5"><MessageSquare className="w-3.5 h-3.5" />Messages</TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5"><BarChart2 className="w-3.5 h-3.5" />Billing Report</TabsTrigger>
          <TabsTrigger value="checklist" className="gap-1.5"><CheckSquare className="w-3.5 h-3.5" />My Tasks</TabsTrigger>
        </TabsList>

        {/* Cases tab */}
        <TabsContent value="cases" className="mt-4">
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {cases.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">No {getTerm(user?.company_industry, 'cases').toLowerCase()} found</div>
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
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {c.case_number && <span>#{c.case_number}</span>}
                    {c.case_type && <span className="capitalize">{c.case_type}</span>}
                    {c.court_name && <span>{c.court_name}</span>}
                    {c.assigned_lawyer_name && <span>Lawyer: <span className="text-foreground font-medium">{c.assigned_lawyer_name}</span></span>}
                  </div>
                  {ps && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-muted-foreground">Status:</span>
                      <Badge className="text-[10px] bg-primary/10 text-primary">{ps.current_stage_name}</Badge>
                    </div>
                  )}
                  {c.next_hearing_date && (
                    <p className="text-xs text-muted-foreground">Next appointment: <span className="text-foreground">{format(new Date(c.next_hearing_date), "MMM d, yyyy")}</span></p>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Hearings tab */}
        <TabsContent value="hearings" className="mt-4">
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {upcomingHearings.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">No upcoming appointments</div>
            ) : upcomingHearings.map(h => (
              <div key={h.id} className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-primary leading-none">{format(new Date(h.date), "MMM")}</span>
                  <span className="text-lg font-bold text-primary leading-none">{format(new Date(h.date), "d")}</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{h.title}</p>
                  <p className="text-xs text-muted-foreground">{h.court_name}{h.time ? ` · ${h.time}` : ""}</p>
                  {h.judge_name && <p className="text-xs text-muted-foreground">Judge: {h.judge_name}</p>}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Documents tab */}
        <TabsContent value="documents" className="mt-4">
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {sharedDocs.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">No documents shared with you yet</div>
            ) : sharedDocs.map(doc => (
              <div key={doc.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{doc.category?.replace("_", " ")}{doc.case_title ? ` · ${doc.case_title}` : ""}</p>
                  </div>
                </div>
                {doc.file_url && (
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1 shrink-0">
                      <Download className="w-3 h-3" /> Download
                    </Button>
                  </a>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Invoices tab */}
        <TabsContent value="invoices" className="mt-4">
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {invoices.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">No invoices found</div>
            ) : invoices.map(inv => (
              <div key={inv.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{inv.invoice_number || "Invoice"}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.case_title && `${inv.case_title} · `}
                    Due {inv.due_date ? format(new Date(inv.due_date), "MMM d, yyyy") : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold">{inv.currency === "NGN" ? "₦" : inv.currency === "USD" ? "$" : "GH₵"}{(inv.total_amount || 0).toLocaleString()}</span>
                  <Badge className={cn("text-[10px]", INVOICE_STATUS_COLORS[inv.status])}>{inv.status}</Badge>
                </div>
              </div>
            ))}
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
            <div className="bg-card rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">
              No {getTerm(user?.company_industry, 'cases').toLowerCase()} found to message about
            </div>
          ) : (
            <div className="space-y-4">
              {cases.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {cases.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCase(c)}
                      className={cn(
                        "text-xs px-3 py-1.5 rounded-full border transition-colors",
                        selectedCase?.id === c.id || (!selectedCase && c.id === cases[0].id)
                          ? "bg-primary text-white border-primary"
                          : "bg-card border-border text-foreground hover:bg-muted"
                      )}
                    >
                      {c.title}
                    </button>
                  ))}
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
    </div>
  );
}