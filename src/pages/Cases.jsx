import { useTranslation} from "react-i18next";
import React, { useState} from "react";
import { base44} from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import { useAuth} from "@/lib/AuthContext";
import { useCompanyId} from "@/hooks/useCompanyId";
import { useNavigate} from "react-router-dom";
import { Plus, Briefcase, Search, LayoutGrid, List, MoreVertical, ExternalLink} from "lucide-react";
import ExportButton from "@/components/shared/ExportButton";
import BulkActionBar from "@/components/shared/BulkActionBar";
import { Button} from "@/components/ui/button";
import { Input} from "@/components/ui/input";
import { Badge} from "@/components/ui/badge";
import { Checkbox} from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from "@/components/ui/sheet";
import { Link} from "react-router-dom";
import { Skeleton} from "@/components/ui/skeleton";
import PageHeader from "@/components/shared/PageHeader";
import CaseForm from "@/components/cases/CaseForm";
import CasesKanban from "@/components/cases/CasesKanban";
import { CASE_STATUS_COLORS, PRIORITY_COLORS} from "@/lib/constants";
import { format} from "date-fns";

import { useToast} from "@/components/ui/use-toast";

const CASE_STATUS_OPTIONS = [
 { value: "open", label: "Open"},
 { value: "in_progress", label: "In Progress"},
 { value: "pending_hearing", label: "Pending Hearing"},
 { value: "closed", label: "Closed"},
 { value: "archived", label: "Archived"},
];

export default function Cases() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const navigate = useNavigate();
 const companyId = useCompanyId();
 const queryClient = useQueryClient();
 const { toast} = useToast();
 const [showForm, setShowForm] = useState(false);
 const [editingCase, setEditingCase] = useState(null);
 const [search, setSearch] = useState("");
 const [statusFilter, setStatusFilter] = useState("all");
 const [viewMode, setViewMode] = useState("list");
 const [selected, setSelected] = useState(new Set());
 const [deleting, setDeleting] = useState(false);
 const [viewingCase, setViewingCase] = useState(null);

 const isAdmin = ["super_admin", "company_admin", "managing_partner"].includes(user?.role);

 const { data: cases = [], isLoading} = useQuery({
 queryKey: ["cases", companyId, user?.email, isAdmin],
 queryFn: async () => {
 const list = await base44.entities.LegalCase.filter({ company_id: companyId});
 if (isAdmin) return list;
 return list.filter(c => c.assigned_lawyer === user?.email || c.created_by === user?.id);
},
 enabled: !!companyId,
});

 const { data: clients = []} = useQuery({
 queryKey: ["clients", companyId],
 queryFn: () => base44.entities.Client.filter({ company_id: companyId}),
 enabled: !!companyId,
});

 const { data: staff = []} = useQuery({
 queryKey: ["staff", companyId],
 queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId}),
 enabled: !!companyId,
});

 const createMutation = useMutation({
 mutationFn: (data) => base44.entities.LegalCase.create({ ...data, company_id: companyId}),
 onSuccess: () => { 
 queryClient.invalidateQueries({ queryKey: ["cases"]}); 
 setShowForm(false); 
 toast({ title: "Case created successfully"});
},
 onError: (err) => toast({ title: "Failed to create case", description: err.message, variant: "destructive"})
});

 const updateMutation = useMutation({
 mutationFn: ({ id, data}) => base44.entities.LegalCase.update(id, data),
 onSuccess: () => { 
 queryClient.invalidateQueries({ queryKey: ["cases"]}); 
 setEditingCase(null); 
 toast({ title: "Case updated successfully"});
},
 onError: (err) => toast({ title: "Failed to update case", description: err.message, variant: "destructive"})
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
 await Promise.all([...selected].map(id => base44.entities.LegalCase.update(id, { status})));
 queryClient.invalidateQueries({ queryKey: ["cases"]});
 setSelected(new Set());
 toast({ title: `Status updated for ${selected.size} case(s)`});
} catch (err) {
 toast({ title: "Update failed", description: err.message, variant: "destructive"});
}
};

 const handleBulkDelete = async () => {
 if (!window.confirm(`Delete ${selected.size} case(s)? This cannot be undone.`)) return;
 setDeleting(true);
 try {
 await Promise.all([...selected].map(id => base44.entities.LegalCase.delete(id)));
 queryClient.invalidateQueries({ queryKey: ["cases"]});
 setSelected(new Set());
 toast({ title: "Cases deleted successfully"});
} catch (err) {
 toast({ title: "Delete failed", description: err.message, variant: "destructive"});
} finally {
 setDeleting(false);
}
};

 const exportData = cases.map(c => ({
 title: c.title, case_number: c.case_number, client: c.client_name,
 type: c.case_type, status: c.status, priority: c.priority,
 lawyer: c.assigned_lawyer_name, filing_date: c.filing_date,
}));

 return (
 <div className="space-y-4">
 <PageHeader
 title="Cases"
 subtitle={`${activeCasesCount(cases)} active cases`}
 actions={
 <div className="flex items-center gap-2">
 <div className="flex items-center border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl overflow-hidden">
 <button onClick={() => setViewMode("list")} className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-white" : "hover:bg-muted text-[#71717a] dark:text-gray-400"}`}><List className="w-4 h-4" /></button>
 <button onClick={() => setViewMode("kanban")} className={`p-2 transition-colors ${viewMode === "kanban" ? "bg-primary text-white" : "hover:bg-muted text-[#71717a] dark:text-gray-400"}`}><LayoutGrid className="w-4 h-4" /></button>
 </div>
 <ExportButton data={exportData} filename="cases_export" label="Export" />
 <Button onClick={() => setShowForm(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> {t("new_case", "New Case")}</Button>
 </div>
}
 />
 {viewMode === "list" && (
 <>
 <div className="flex flex-col sm:flex-row gap-3">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
 <Input placeholder="Search cases..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
 </div>
 <Select value={statusFilter} onValueChange={setStatusFilter}>
 <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="all">{t("all_status", "All Status")}</SelectItem>
 {CASE_STATUS_OPTIONS.map(o => {
 return <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>;
})}
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
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Table>
 <TableHeader><TableRow className="bg-muted/50">{["", "Case", "Client", "Type", "Status", "Priority", "Lawyer", "Filed"].map((h, i) => {
 return <TableHead key={i}>{h}</TableHead>;
})}</TableRow></TableHeader>
 <TableBody>{Array(5).fill(0).map((_, i) => {
 return (
 <TableRow key={i}>{Array(8).fill(0).map((_, j) => {
 return <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>;
})}</TableRow>
 );
})}</TableBody>
 </Table>
 </div>
 ) : filtered.length === 0 ? (
 <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-dashed border-primary/40 p-12 text-center max-w-sm mx-auto my-8 space-y-4  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex items-center justify-center mx-auto text-primary">
 <Briefcase className="w-5 h-5" />
 </div>
 <div className="space-y-1">
 <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{t("no_active_case_matters", "No Active Case Matters")}</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed tracking-[0.04em]">
 {t(
 "start_tracking_client_pipeline",
 "Start tracking client pipelines, court filings, and milestones by creating your first legal case."
 )}
 </p>
 </div>
 <div className="pt-2">
 <Button 
 onClick={() => setShowForm(true)}
 className="bg-primary hover:bg-primary/95 text-white font-semibold text-xs py-3.5 px-5 rounded-xl  tracking-[0.04em]"
 >
 {t("initialize_first_case", "Initialize First Case")}
 </Button>
 </div>
 </div>
 ) : (
 <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="overflow-x-auto">
 <Table>
 <TableHeader>
 <TableRow className="bg-muted/50">
 <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={toggleAll} /></TableHead>
 {["Case", "Client", "Type", "Status", "Priority", "Lawyer", "Filed", ""].map((h, i) => {
 return (<TableHead key={i} className="text-xs font-semibold uppercase tracking-wider text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{h}</TableHead>);
})}
 </TableRow>
 </TableHeader>
 <TableBody>
 {filtered.map(row => {
 return (
 <TableRow key={row.id} className="hover:bg-muted/50 transition-colors">
 <TableCell onClick={e => toggleOne(row.id, e)}><Checkbox checked={selected.has(row.id)} onCheckedChange={() => {}} /></TableCell>
 <TableCell className="cursor-pointer" onClick={() => navigate(`/cases/${row.id}`, { state: { caseData: row}})}><div><p className="font-medium text-sm">{row.title}</p><p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{row.case_number || "No case #"}</p></div></TableCell>
 <TableCell>
 {row.client_id ? (
 <Link to="/clients" className="text-primary hover:underline text-sm inline-flex items-center gap-2">
 {row.client_name} <ExternalLink className="w-3 h-3" />
 </Link>
 ) : (
 <span className="text-sm">{row.client_name || "—"}</span>
 )}
 </TableCell>
 <TableCell><Badge variant="outline" className="text-[10px] capitalize">{row.case_type}</Badge></TableCell>
 <TableCell><Badge className={`${CASE_STATUS_COLORS[row.status]} text-[10px]`}>{row.status?.replace("_", " ")}</Badge></TableCell>
 <TableCell><Badge className={`${PRIORITY_COLORS[row.priority]} text-[10px]`}>{row.priority}</Badge></TableCell>
 <TableCell>
 {row.assigned_lawyer_id ? (
 <Link to="/team" className="text-primary hover:underline text-sm inline-flex items-center gap-2">
 {row.assigned_lawyer_name} <ExternalLink className="w-3 h-3" />
 </Link>
 ) : (
 <span className="text-sm">{row.assigned_lawyer_name || "Unassigned"}</span>
 )}
 </TableCell>
 <TableCell><span className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{row.filing_date ? format(new Date(row.filing_date), "MMM d, yyyy") : "—"}</span></TableCell>
 <TableCell>
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => setViewingCase(row)}>{t("view_details", "View Details")}</DropdownMenuItem>
 <DropdownMenuItem onClick={() => setEditingCase(row)}>{t("edit", "Edit")}</DropdownMenuItem>
 <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => {
 if (window.confirm("Delete this case?")) {
 base44.entities.LegalCase.delete(row.id).then(() => {
 queryClient.invalidateQueries({ queryKey: ["cases"]});
 toast({ title: "Case deleted successfully"});
}).catch(err => toast({ title: "Delete failed", description: err.message, variant: "destructive"}));
}
}}>{t("delete", "Delete")}</DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </TableCell>
 </TableRow>
 );
})}
 </TableBody>
 </Table>
 </div>
 </div>
 )}
 </>
 )}
 {viewMode === "kanban" && (
 <CasesKanban cases={cases} onStatusChange={(c, newStatus) => updateMutation.mutate({ id: c.id, data: { status: newStatus}})} />
 )}
 {showForm && (
 <CaseForm open={showForm} onClose={() => setShowForm(false)} onSubmit={(data) => createMutation.mutate(data)} clients={clients} staff={staff} />
 )}
 {editingCase && (
 <CaseForm open={!!editingCase} onClose={() => setEditingCase(null)} onSubmit={(data) => updateMutation.mutate({ id: editingCase.id, data})} initialData={editingCase} clients={clients} staff={staff} />
 )}
 <Sheet open={!!viewingCase} onOpenChange={(open) => !open && setViewingCase(null)}>
 <SheetContent className="overflow-y-auto">
 <SheetHeader className="mb-6">
 <SheetTitle>{t("case_details", "Case Details")}</SheetTitle>
 <SheetDescription>{t("view_complete_case_record", "View complete case record")}</SheetDescription>
 </SheetHeader>
 {viewingCase && (
 <div className="space-y-4">
 <div><span className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">{t("title", "Title")}</span><p className="font-medium mt-1">{viewingCase.title}</p></div>
 <div><span className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">{t("case_number", "Case Number")}</span><p className="mt-1">{viewingCase.case_number || "—"}</p></div>
 <div>
 <span className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider block mb-1 tracking-[0.04em]">{t("client", "Client")}</span>
 {viewingCase.client_id ? (
 <Link to="/clients" className="text-primary hover:underline text-sm inline-flex items-center gap-2">
 {viewingCase.client_name} <ExternalLink className="w-3 h-3" />
 </Link>
 ) : <span className="text-sm">—</span>}
 </div>
 <div>
 <span className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider block mb-1 tracking-[0.04em]">{t("assigned_lawyer", "Assigned Lawyer")}</span>
 {viewingCase.assigned_lawyer_id ? (
 <Link to="/team" className="text-primary hover:underline text-sm inline-flex items-center gap-2">
 {viewingCase.assigned_lawyer_name} <ExternalLink className="w-3 h-3" />
 </Link>
 ) : <span className="text-sm">{t("unassigned", "Unassigned")}</span>}
 </div>
 <div><span className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider block mb-1 tracking-[0.04em]">{t("status", "Status")}</span><Badge className={`${CASE_STATUS_COLORS[viewingCase.status]} capitalize`}>{viewingCase.status?.replace("_", " ")}</Badge></div>
 <div><span className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider block mb-1 tracking-[0.04em]">{t("priority", "Priority")}</span><Badge className={`${PRIORITY_COLORS[viewingCase.priority]} capitalize`}>{viewingCase.priority}</Badge></div>
 <div><span className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">{t("case_type", "Case Type")}</span><p className="capitalize mt-1">{viewingCase.case_type}</p></div>
 <div><span className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">{t("filing_date", "Filing Date")}</span><p className="mt-1">{viewingCase.filing_date ? format(new Date(viewingCase.filing_date), "MMM d, yyyy") : "—"}</p></div>
 {viewingCase.description && (
 <div><span className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">{t("description", "Description")}</span><p className="text-sm whitespace-pre-wrap mt-1">{viewingCase.description}</p></div>
 )}
 </div>
 )}
 </SheetContent>
 </Sheet>
 </div>
 );
}

function activeCasesCount(cases) {
 return cases.filter(c => ["open", "in_progress", "pending_hearing"].includes(c.status)).length;
}