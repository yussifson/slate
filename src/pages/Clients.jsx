import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useCompanyId, useCompany } from "@/hooks/useCompanyId";
import { getTerm } from "@/config/industries";
import { Plus, Users, Search, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ExportButton from "@/components/shared/ExportButton";
import BulkActionBar from "@/components/shared/BulkActionBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/shared/PageHeader";
import { format } from "date-fns";

import { useToast } from "@/components/ui/use-toast";

const CLIENT_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "lead", label: "Lead" },
];

export default function Clients() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const { company } = useCompany();
  const industry = company?.industry_type || "law";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [viewingClient, setViewingClient] = useState(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients", companyId],
    queryFn: () => base44.entities.Client.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create({ ...data, company_id: companyId }),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["clients"] }); 
      setShowForm(false); 
      toast({ title: `${getTerm(industry, "client")} added successfully` });
    },
    onError: (err) => toast({ title: `Failed to add ${getTerm(industry, "client").toLowerCase()}`, description: err.message, variant: "destructive" })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["clients"] }); 
      setEditingClient(null); 
      toast({ title: "Client updated successfully" });
    },
    onError: (err) => toast({ title: "Failed to update client", description: err.message, variant: "destructive" })
  });

  const filtered = clients.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const allFilteredIds = filtered.map(c => c.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selected.has(id));

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allFilteredIds));

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
      await Promise.all([...selected].map(id => base44.entities.Client.update(id, { status })));
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setSelected(new Set());
      toast({ title: `Status updated for ${selected.size} client(s)` });
    } catch (err) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.size} client(s)? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await Promise.all([...selected].map(id => base44.entities.Client.delete(id)));
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setSelected(new Set());
      toast({ title: "Clients deleted successfully" });
    } catch (err) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteOne = async (id) => {
    if (!window.confirm("Delete this client? This cannot be undone.")) return;
    try {
      await base44.entities.Client.delete(id);
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Client deleted successfully" });
    } catch (err) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  const exportData = clients.map(c => ({
    name: c.name, email: c.email, phone: c.phone, type: c.type,
    status: c.status, city: c.city, country: c.country,
  }));

  const clientTerm = getTerm(industry, "client");
  const clientsTerm = getTerm(industry, "clients");

  return (
    <div className="space-y-4">
      <PageHeader
        title={clientsTerm}
        subtitle={`${clients.filter(c => c.status === "active").length} active ${clientsTerm.toLowerCase()}`}
        actions={
          <div className="flex items-center gap-2">
            <ExportButton data={exportData} filename={`${clientsTerm.toLowerCase()}_export`} label="Export" />
            <Button onClick={() => setShowForm(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> Add {clientTerm}</Button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={`Search ${clientsTerm.toLowerCase()}...`} className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {CLIENT_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <BulkActionBar
        selectedCount={selected.size}
        onClear={() => setSelected(new Set())}
        statusOptions={CLIENT_STATUS_OPTIONS}
        onBulkStatus={handleBulkStatus}
        onBulkDelete={handleBulkDelete}
        deleting={deleting}
      />

      {isLoading ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table><TableHeader><TableRow>{["", clientTerm, "Phone", "Type", "Status", "Added"].map((h, i) => <TableHead key={i}>{h}</TableHead>)}</TableRow></TableHeader>
            <TableBody>{Array(5).fill(0).map((_, i) => <TableRow key={i}>{Array(6).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>)}</TableRow>)}</TableBody>
          </Table>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-dashed border-slate-200 p-12 text-center max-w-sm mx-auto my-8 space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto text-primary">
            <Users className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-sm text-slate-900">No Registered {clientsTerm}</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Start building your firm's address book, tracking intake forms, and sharing retainers by adding your first {clientTerm.toLowerCase()}.
            </p>
          </div>
          <div className="pt-2">
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-primary hover:bg-primary/95 text-white font-semibold text-xs py-3.5 px-5 rounded-xl shadow-md"
            >
              Add New {clientTerm}
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
                  {[clientTerm, "Phone", "Type", "Status", "Added", "Actions"].map(h => (
                    <TableHead key={h} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(row => (
                  <TableRow key={row.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell onClick={e => toggleOne(row.id, e)}><Checkbox checked={selected.has(row.id)} onCheckedChange={() => {}} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{row.name?.[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{row.name}</p>
                          <p className="text-xs text-muted-foreground">{row.email || "No email"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><span className="text-sm">{row.phone || "—"}</span></TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] capitalize">{row.type}</Badge></TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${row.status === "active" ? "bg-green-100 text-green-700" : row.status === "lead" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">{format(new Date(row.created_date), "MMM d, yyyy")}</span></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingClient(row)}>View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingClient(row)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteOne(row.id)}>Delete</DropdownMenuItem>
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

      <ClientFormDialog
        open={showForm || !!editingClient}
        onClose={() => { setShowForm(false); setEditingClient(null); }}
        onSubmit={(data) => editingClient ? updateMutation.mutate({ id: editingClient.id, data }) : createMutation.mutate(data)}
        initialData={editingClient}
        clientTerm={clientTerm}
      />

      <Sheet open={!!viewingClient} onOpenChange={(open) => !open && setViewingClient(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{clientTerm} Details</SheetTitle>
          </SheetHeader>
          {viewingClient && (
            <div className="mt-6 space-y-4">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="font-medium">{viewingClient.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{viewingClient.email || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="font-medium">{viewingClient.phone || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <p className="font-medium capitalize">{viewingClient.type || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <p className="font-medium capitalize">{viewingClient.status || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Address</Label>
                <p className="font-medium">{viewingClient.address || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">City</Label>
                <p className="font-medium">{viewingClient.city || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Country</Label>
                <p className="font-medium">{viewingClient.country || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Notes</Label>
                <p className="font-medium whitespace-pre-wrap">{viewingClient.notes || "—"}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ClientFormDialog({ open, onClose, onSubmit, initialData, clientTerm = "Client" }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", type: "individual", status: "active", address: "", city: "", country: "", notes: "" });

  useEffect(() => {
    if (initialData) setForm(initialData);
    else setForm({ name: "", email: "", phone: "", type: "individual", status: "active", address: "", city: "", country: "", notes: "" });
  }, [initialData, open]);

  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); };
  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initialData ? `Edit ${clientTerm}` : `Add ${clientTerm}`}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => set("email", e.target.value)} type="email" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="individual">Individual</SelectItem><SelectItem value="organization">Organization</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="lead">Lead</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>City</Label><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
            <div><Label>Country</Label><Input value={form.country} onChange={(e) => set("country", e.target.value)} /></div>
            <div className="col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{initialData ? "Update" : "Add"} {clientTerm}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}