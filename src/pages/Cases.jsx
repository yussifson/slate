import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useCompanyId, useCompany } from "@/hooks/useCompanyId";
import { getTerm } from "@/config/industries";
import { useNavigate } from "react-router-dom";
import { Plus, Briefcase, Search, LayoutGrid, List } from "lucide-react";
import ExportButton from "@/components/shared/ExportButton";
import BulkActionBar from "@/components/shared/BulkActionBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/shared/PageHeader";
import CaseForm from "@/components/cases/CaseForm";
import CasesKanban from "@/components/cases/CasesKanban";
import { CASE_STATUS_COLORS, PRIORITY_COLORS } from "@/lib/constants";
import { format } from "date-fns";

import { useToast } from "@/components/ui/use-toast";

const CASE_STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending_hearing", label: "Pending Hearing" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

export default function Cases() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const { company } = useCompany();
  const industry = company?.industry_type || "law";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["cases", companyId],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", companyId],
    queryFn: () => base44.entities.Client.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff", companyId],
    queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LegalCase.create({ ...data, company_id: companyId }),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["cases"] }); 
      setShowForm(false); 
      toast({ title: "Case created successfully" });
    },
    onError: (err) => toast({ title: "Failed to create case", description: err.message, variant: "destructive" })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LegalCase.update(id, data),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["cases"] }); 
      setEditingCase(null); 
      toast({ title: "Case updated successfully" });
    },
    onError: (err) => toast({ title: "Failed to update case", description: err.message, variant: "destructive" })
  });

  const filtered = cases.filter(c => {
    const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.case_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const allFilteredIds = filtered.map(c => c.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selected.has(id));

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(allFilteredIds));
  };

  const toggleOne = (id, e) => {
    e.stopPropagation();
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkStatus = async (status) => {
    try {
      await Promise.all([...selected].map(id => base44.entities.LegalCase.update(id, { status })));
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      setSelected(new Set());
      toast({ title: `Status updated for ${selected.size} case(s)` });
    } catch (err) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.size} case(s)? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await Promise.all([...selected].map(id => base44.entities.LegalCase.delete(id)));
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      setSelected(new Set());
      toast({ title: "Cases deleted successfully" });
    } catch (err) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const exportData = cases.map(c => ({
    title: c.title, case_number: c.case_number, client: c.client_name,
    type: c.case_type, status: c.status, priority: c.priority,
    lawyer: c.assigned_lawyer_name, filing_date: c.filing_date,
  }));

  const caseTerm = getTerm(industry, "case");
  const casesTerm = getTerm(industry, "cases");
  const clientTerm = getTerm(industry, "client");
  const lawyerTerm = getTerm(industry, "lawyer");

  return (
    <div className="space-y-4">
      <PageHeader
        title={casesTerm}
        subtitle={`${activeCasesCount(cases)} active ${casesTerm.toLowerCase()}`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button onClick={() => setViewMode("list")} className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-white" : "hover:bg-muted text-muted-foreground"}`}><List className="w-4 h-4" /></button>
              <button onClick={() => setViewMode("kanban")} className={`p-2 transition-colors ${viewMode === "kanban" ? "bg-primary text-white" : "hover:bg-muted text-muted-foreground"}`}><LayoutGrid className="w-4 h-4" /></button>
            </div>
            <ExportButton data={exportData} filename={`${casesTerm.toLowerCase()}_export`} label="Export" />
            <Button onClick={() => setShowForm(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> New {caseTerm}</Button>
          </div>
        }
      />

      {viewMode === "list" && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={`Search ${casesTerm.toLowerCase()}...`} className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {CASE_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <BulkActionBar
            selectedCount={selected.size}
            onClear={() => setSelected(new Set())}
            statusOptions={CASE_STATUS_OPTIONS}
            onBulkStatus={handleBulkStatus}
            onBulkDelete={handleBulkDelete}
            deleting={deleting}
          />

          {isLoading ? (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader><TableRow className="bg-muted/50">{["", caseTerm, clientTerm, "Type", "Status", "Priority", lawyerTerm, "Filed"].map((h, i) => <TableHead key={i}>{h}</TableHead>)}</TableRow></TableHeader>
                <TableBody>{Array(5).fill(0).map((_, i) => <TableRow key={i}>{Array(8).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>)}</TableRow>)}</TableBody>
              </Table>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-card rounded-2xl border border-dashed border-slate-200 p-12 text-center max-w-sm mx-auto my-8 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto text-primary">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-slate-900">No Active {caseTerm} Matters</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Start tracking client pipelines, court filings, and milestones by creating your first {caseTerm.toLowerCase()}.
                </p>
              </div>
              <div className="pt-2">
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-primary hover:bg-primary/95 text-white font-semibold text-xs py-3.5 px-5 rounded-xl shadow-md"
                >
                  Initialize First {caseTerm}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={toggleAll} /></TableHead>
                      {[caseTerm, clientTerm, "Type", "Status", "Priority", lawyerTerm, "Filed"].map(h => (
                        <TableHead key={h} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(row => (
                      <TableRow key={row.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/cases/${row.id}`, { state: { caseData: row } })}>
                        <TableCell onClick={e => toggleOne(row.id, e)}><Checkbox checked={selected.has(row.id)} onCheckedChange={() => {}} /></TableCell>
                        <TableCell><div><p className="font-medium text-sm">{row.title}</p><p className="text-xs text-muted-foreground">{row.case_number || "No case #"}</p></div></TableCell>
                        <TableCell><span className="text-sm">{row.client_name || "—"}</span></TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] capitalize">{row.case_type}</Badge></TableCell>
                        <TableCell><Badge className={`${CASE_STATUS_COLORS[row.status]} text-[10px]`}>{row.status?.replace("_", " ")}</Badge></TableCell>
                        <TableCell><Badge className={`${PRIORITY_COLORS[row.priority]} text-[10px]`}>{row.priority}</Badge></TableCell>
                        <TableCell><span className="text-sm">{row.assigned_lawyer_name || "Unassigned"}</span></TableCell>
                        <TableCell><span className="text-xs text-muted-foreground">{row.filing_date ? format(new Date(row.filing_date), "MMM d, yyyy") : "—"}</span></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}

      {viewMode === "kanban" && (
        <CasesKanban cases={cases} onStatusChange={(c, newStatus) => updateMutation.mutate({ id: c.id, data: { status: newStatus } })} />
      )}

      {showForm && (
        <CaseForm open={showForm} onClose={() => setShowForm(false)} onSubmit={(data) => createMutation.mutate(data)} clients={clients} staff={staff} />
      )}
      {editingCase && (
        <CaseForm open={!!editingCase} onClose={() => setEditingCase(null)} onSubmit={(data) => updateMutation.mutate({ id: editingCase.id, data })} initialData={editingCase} clients={clients} staff={staff} />
      )}
    </div>
  );
}

function activeCasesCount(cases) {
  return cases.filter(c => ["open", "in_progress", "pending_hearing"].includes(c.status)).length;
}