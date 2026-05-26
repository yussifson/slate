import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Users, Search, ExternalLink, Mail, Phone, CheckCircle, XCircle } from "lucide-react";
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
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-amber-100 text-amber-700",
  qualified: "bg-purple-100 text-purple-700",
  converted: "bg-green-100 text-green-700",
  lost: "bg-gray-100 text-gray-500",
};

const URGENCY_COLORS = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

export default function Leads() {
  const { user } = useAuth();
  const { toast } = useToast();
  const companyId = user?.company_id;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads", companyId],
    queryFn: () => base44.entities.Lead.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead updated" });
    },
  });

  const convertToClientMutation = useMutation({
    mutationFn: async (lead) => {
      await base44.entities.Client.create({
        company_id: companyId,
        name: lead.full_name,
        email: lead.email,
        phone: lead.phone,
        type: lead.organization ? "organization" : "individual",
        status: "active",
      });
      await base44.entities.Lead.update(lead.id, { status: "converted" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setSelectedLead(null);
      toast({ title: "Lead converted to client" });
    },
  });

  const filtered = leads.filter(l => {
    const matchSearch = !search || l.full_name?.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const intakeFormUrl = `${window.location.origin}/intake${companyId ? `?firm=${companyId}` : ""}`;

  const columns = [
    {
      header: "Name",
      render: (row) => (
        <div>
          <p className="font-medium text-sm">{row.full_name}</p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      )
    },
    { header: "Case Type", render: (row) => <Badge variant="outline" className="text-[10px] capitalize">{row.case_type?.replace("_", " ") || "—"}</Badge> },
    { header: "Urgency", render: (row) => <Badge className={`text-[10px] ${URGENCY_COLORS[row.urgency]}`}>{row.urgency}</Badge> },
    { header: "Status", render: (row) => <Badge className={`text-[10px] ${STATUS_COLORS[row.status]}`}>{row.status}</Badge> },
    { header: "Submitted", render: (row) => <span className="text-xs text-muted-foreground">{format(new Date(row.created_date), "MMM d, yyyy")}</span> },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Email lead" onClick={e => { e.stopPropagation(); window.open(`mailto:${row.email}`); }}>
            <Mail className="w-3.5 h-3.5" />
          </Button>
          {row.phone && (
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Call lead" onClick={e => { e.stopPropagation(); window.open(`tel:${row.phone}`); }}>
              <Phone className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Leads"
        subtitle={`${leads.filter(l => l.status === "new").length} new leads from intake form`}
        actions={
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(intakeFormUrl, "_blank")}>
            <ExternalLink className="w-3.5 h-3.5" /> View Intake Form
          </Button>
        }
      />

      {/* Intake Form Link Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-900">Your public intake form is live</p>
          <p className="text-xs text-blue-700 mt-0.5 break-all">{intakeFormUrl}</p>
        </div>
        <Button size="sm" variant="outline" className="shrink-0 text-blue-700 border-blue-300" onClick={() => { navigator.clipboard.writeText(intakeFormUrl); toast({ title: "Link copied!" }); }}>
          Copy Link
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search leads..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
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
          onUpdateStatus={(status) => updateMutation.mutate({ id: selectedLead.id, data: { status } })}
          onConvert={() => convertToClientMutation.mutate(selectedLead)}
          isConverting={convertToClientMutation.isPending}
        />
      )}
    </div>
  );
}

function LeadDetailDialog({ lead, onClose, onUpdateStatus, onConvert, isConverting }) {
  return (
    <Dialog open={!!lead} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {lead.full_name}
            <Badge className={`text-[10px] ${STATUS_COLORS[lead.status]}`}>{lead.status}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><Label className="text-xs">Email</Label><p className="mt-0.5">{lead.email}</p></div>
            <div><Label className="text-xs">Phone</Label><p className="mt-0.5">{lead.phone || "—"}</p></div>
            <div><Label className="text-xs">Organization</Label><p className="mt-0.5">{lead.organization || "Individual"}</p></div>
            <div><Label className="text-xs">Case Type</Label><p className="mt-0.5 capitalize">{lead.case_type?.replace("_", " ") || "—"}</p></div>
            <div><Label className="text-xs">Urgency</Label><Badge className={`text-[10px] mt-0.5 ${URGENCY_COLORS[lead.urgency]}`}>{lead.urgency}</Badge></div>
            <div><Label className="text-xs">Preferred Contact</Label><p className="mt-0.5 capitalize">{lead.preferred_contact || "—"}</p></div>
          </div>
          <div>
            <Label className="text-xs">Case Description</Label>
            <p className="mt-1 text-sm bg-muted/40 rounded-lg p-3">{lead.case_description}</p>
          </div>
          <div>
            <Label className="text-xs">Update Status</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {["new", "contacted", "qualified", "lost"].map(s => (
                <button
                  key={s}
                  onClick={() => onUpdateStatus(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border capitalize transition-colors ${lead.status === s ? STATUS_COLORS[s] + " border-transparent" : "border-border text-muted-foreground hover:bg-muted"}`}
                >{s}</button>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <Button variant="outline" onClick={onClose}>Close</Button>
            {lead.status !== "converted" && (
              <Button onClick={onConvert} disabled={isConverting} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
                {isConverting ? "Converting..." : <><CheckCircle className="w-4 h-4" /> Convert to Client</>}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}