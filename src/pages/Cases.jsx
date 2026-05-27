import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useCompanyId, useCompany } from "@/hooks/useCompanyId";
import { getTerm } from "@/config/industries";
import { useNavigate } from "react-router-dom";
import { Plus, Briefcase, Search, LayoutGrid, List, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
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
import AIEmailDrafter from "@/components/shared/AIEmailDrafter";
import { Sparkles } from "lucide-react";
import { CASE_STATUS_COLORS, PRIORITY_COLORS, SUBSCRIPTION_PLANS } from "@/lib/constants";
import { format } from "date-fns";
import { NotificationService } from "@/lib/notifications";

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
  const [viewingCase, setViewingCase] = useState(null);
  const [draftingEmailFor, setDraftingEmailFor] = useState(null);

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
    onSuccess: async (createdCase) => { 
      queryClient.invalidateQueries({ queryKey: ["cases"] }); 
      setShowForm(false); 
      toast({ title: "Case created successfully" });

      // Trigger notification for new case
      await NotificationService.send({
        companyId: companyId,
        recipientEmail: user?.email,
        recipientName: user?.full_name,
        title: `New ${getTerm(industry, "case")} Created`,
        message: `A new ${getTerm(industry, "case").toLowerCase()} "${createdCase.title || 'Untitled'}" was created.`,
        type: 'info',
        channels: ['in-app'] 
      });
    },
    onError: (err) => toast({ title: "Failed to create case", description: err.message, variant: "destructive" })
  });

  const handleAddClick = () => {
    const currentPlan = SUBSCRIPTION_PLANS[company?.subscription_plan] || SUBSCRIPTION_PLANS.free_trial;
    const caseLimit = currentPlan.maxCases || 10;
    
    if (cases.length >= caseLimit) {
      toast({ 
        title: "Limit Reached", 
        description: `Your ${currentPlan.name} plan allows up to ${caseLimit} active projects/cases. Please upgrade your plan.`, 
        variant: "destructive" 
      });
      return;
    }
    setShowForm(true);
  };

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

  const handleDeleteOne = async (id) => {
    if (!window.confirm("Delete this case? This cannot be undone.")) return;
    try {
      await base44.entities.LegalCase.delete(id);
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast({ title: "Case deleted successfully" });
    } catch (err) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
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
            <Button onClick={handleAddClick} size="sm"><Plus className="w-4 h-4 mr-1" /> New {caseTerm}</Button>
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
                <TableHeader><TableRow className="bg-muted/50">{["", caseTerm, clientTerm, "Type", "Status", "Priority", lawyerTerm, "Filed", "Actions"].map((h, i) => <TableHead key={i}>{h}</TableHead>)}</TableRow></TableHeader>
                <TableBody>{Array(5).fill(0).map((_, i) => <TableRow key={i}>{Array(9).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>)}</TableRow>)}</TableBody>
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
                  onClick={handleAddClick}
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
                      {[caseTerm, clientTerm, "Type", "Status", "Priority", lawyerTerm, "Filed", "Actions"].map(h => (
                        <TableHead key={h} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(row => (
                      <TableRow key={row.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell onClick={e => toggleOne(row.id, e)}><Checkbox checked={selected.has(row.id)} onCheckedChange={() => {}} /></TableCell>
                        <TableCell><div><Link to={`/cases/${row.id}`} state={{ caseData: row }} className="font-medium text-sm text-primary hover:underline">{row.title}</Link><p className="text-xs text-muted-foreground">{row.case_number || "No case #"}</p></div></TableCell>
                        <TableCell><Link to="/clients" className="text-sm text-primary hover:underline">{row.client_name || "—"}</Link></TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] capitalize">{row.case_type}</Badge></TableCell>
                        <TableCell><Badge className={`${CASE_STATUS_COLORS[row.status]} text-[10px]`}>{row.status?.replace("_", " ")}</Badge></TableCell>
                        <TableCell><Badge className={`${PRIORITY_COLORS[row.priority]} text-[10px]`}>{row.priority}</Badge></TableCell>
                        <TableCell><Link to="/team" className="text-sm text-primary hover:underline">{row.assigned_lawyer_name || "Unassigned"}</Link></TableCell>
                        <TableCell><span className="text-xs text-muted-foreground">{row.filing_date ? format(new Date(row.filing_date), "MMM d, yyyy") : "—"}</span></TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 shadow-xl border-border/50">
                              <DropdownMenuItem onClick={() => setViewingCase(row)}>View Details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/cases/${row.id}`, { state: { caseData: row } })}>Open Full View</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingCase(row)}>Edit</DropdownMenuItem>
                              <div className="h-px bg-border my-1" />
                              <DropdownMenuItem onClick={() => setDraftingEmailFor(row)} className="text-indigo-600 font-medium focus:text-indigo-700 focus:bg-indigo-50 dark:text-indigo-400 dark:focus:bg-indigo-950/50">
                                <Sparkles className="w-4 h-4 mr-2" /> Draft AI Email
                              </DropdownMenuItem>
                              <div className="h-px bg-border my-1" />
                              <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/50" onClick={() => handleDeleteOne(row.id)}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
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

      <Sheet open={!!viewingCase} onOpenChange={(open) => !open && setViewingCase(null)}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{caseTerm} Details</SheetTitle>
          </SheetHeader>
          {viewingCase && (
            <div className="mt-6 space-y-4">
              <div>
                <Label className="text-muted-foreground">Title</Label>
                <p className="font-medium">{viewingCase.title}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Case Number</Label>
                <p className="font-medium">{viewingCase.case_number || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Client</Label>
                <p className="font-medium">
                  <Link to="/clients" className="text-primary hover:underline">{viewingCase.client_name || "—"}</Link>
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <p className="font-medium capitalize">{viewingCase.case_type || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <p className="font-medium capitalize">{viewingCase.status?.replace("_", " ") || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Priority</Label>
                <p className="font-medium capitalize">{viewingCase.priority || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Assigned Lawyer</Label>
                <p className="font-medium">
                  <Link to="/team" className="text-primary hover:underline">{viewingCase.assigned_lawyer_name || "Unassigned"}</Link>
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Filing Date</Label>
                <p className="font-medium">{viewingCase.filing_date ? format(new Date(viewingCase.filing_date), "MMM d, yyyy") : "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="font-medium whitespace-pre-wrap">{viewingCase.description || "—"}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {draftingEmailFor && (
        <AIEmailDrafter 
          recordData={draftingEmailFor} 
          defaultContext="Write a polite and professional update email to the client regarding this legal case."
          onClose={() => setDraftingEmailFor(null)} 
        />
      )}
    </div>
  );
}

function activeCasesCount(cases) {
  return cases.filter(c => ["open", "in_progress", "pending_hearing"].includes(c.status)).length;
}