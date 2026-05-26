import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useCompanyId, useCompany } from "@/hooks/useCompanyId";
import { isSuperAdmin } from "@/lib/constants";
import { getTerm } from "@/config/industries";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, CheckCircle2, Clock, AlertCircle, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const PRIORITY_COLORS = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

function TaskFormDialog({ open, onClose, initialData, cases, staff, companyId, caseTerm }) {
  const queryClient = useQueryClient();
  const isEdit = !!initialData?.id;

  const defaultForm = {
    title: "",
    description: "",
    case_id: "",
    case_title: "",
    assigned_to: "",
    assigned_to_name: "",
    priority: "medium",
    status: "pending",
    due_date: "",
    category: "legal",
  };

  const [form, setForm] = useState(initialData || defaultForm);
  const { toast } = useToast();

  useEffect(() => {
    setForm(initialData || defaultForm);
  }, [open, initialData]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? base44.entities.Task.update(initialData.id, data)
      : base44.entities.Task.create({ ...data, company_id: companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", companyId] });
      onClose();
      toast({ title: isEdit ? "Task updated" : "Task created successfully" });
    },
    onError: (err) => {
      toast({ title: "Task error", description: err.message, variant: "destructive" });
    }
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCaseChange = (caseId) => {
    const c = cases.find(c => c.id === caseId);
    set("case_id", caseId);
    set("case_title", c?.title || "");
  };

  const handleStaffChange = (email) => {
    const s = staff.find(s => s.user_email === email);
    set("assigned_to", email);
    set("assigned_to_name", s?.full_name || "");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title *</Label>
            <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Task title" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Assign To</Label>
              <Select value={form.assigned_to} onValueChange={handleStaffChange}>
                <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.user_email}>{s.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Related {caseTerm}</Label>
            <Select value={form.case_id} onValueChange={handleCaseChange}>
              <SelectTrigger><SelectValue placeholder={`Select ${caseTerm.toLowerCase()} (optional)`} /></SelectTrigger>
              <SelectContent>
                {cases.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Category</Label>
            <Select value={form.category} onValueChange={v => set("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate(form)} disabled={!form.title || mutation.isPending}>
            {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Tasks() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const { data: company } = useCompany();
  const queryClient = useQueryClient();

  const industry = company?.industry_type || "law";
  const caseTerm = getTerm(industry, "case");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", companyId],
    queryFn: () => base44.entities.Task.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["cases-list", companyId],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff-list", companyId],
    queryFn: () => base44.entities.StaffRecord.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", companyId] }),
  });

  const handleDeleteOne = async (id) => {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    try {
      await base44.entities.Task.delete(id);
      queryClient.invalidateQueries({ queryKey: ["tasks", companyId] });
      toast({ title: "Task deleted successfully" });
    } catch (err) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  const filtered = tasks.filter(t => {
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.assigned_to_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    completed: tasks.filter(t => t.status === "completed").length,
  };

  const columns = [
    {
      header: "Task",
      render: (row) => (
        <div>
          <p className="font-medium text-sm">{row.title}</p>
          {row.case_title && (
            <Link to={`/cases/${row.case_id}`} className="text-xs text-primary hover:underline">
              {row.case_title}
            </Link>
          )}
        </div>
      ),
    },
    {
      header: "Assigned To",
      render: (row) => (
        <Link to="/team" className="text-sm text-primary hover:underline">
          {row.assigned_to_name || "—"}
        </Link>
      ),
    },
    {
      header: "Priority",
      render: (row) => (
        <Badge className={cn("text-xs capitalize", PRIORITY_COLORS[row.priority])}>
          {row.priority}
        </Badge>
      ),
    },
    {
      header: "Status",
      render: (row) => (
        <Select value={row.status} onValueChange={v => updateMutation.mutate({ id: row.id, data: { status: v } })}>
          <SelectTrigger className="h-7 text-xs w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      header: "Due Date",
      render: (row) => row.due_date
        ? <span className="text-sm">{format(new Date(row.due_date), "MMM d, yyyy")}</span>
        : <span className="text-sm text-muted-foreground">—</span>,
    },
    {
      header: "Actions",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setViewingTask(row); }}>View Details</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditing(row); setShowForm(true); }}>Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); handleDeleteOne(row.id); }}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        subtitle="Manage and track team tasks"
        actions={
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> New Task
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: Clock, color: "text-blue-600 bg-blue-50" },
          { label: "Pending", value: stats.pending, icon: AlertCircle, color: "text-yellow-600 bg-yellow-50" },
          { label: "In Progress", value: stats.in_progress, icon: Clock, color: "text-blue-600 bg-blue-50" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        emptyTitle="No tasks yet"
        emptyDescription="Create your first task to get started."
      />

      {showForm && (
        <TaskFormDialog
          open={showForm}
          onClose={() => { setShowForm(false); setEditing(null); }}
          initialData={editing}
          cases={cases}
          staff={staff}
          companyId={companyId}
          caseTerm={caseTerm}
        />
      )}

      <Sheet open={!!viewingTask} onOpenChange={(open) => !open && setViewingTask(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Task Details</SheetTitle>
          </SheetHeader>
          {viewingTask && (
            <div className="mt-6 space-y-4">
              <div>
                <Label className="text-muted-foreground">Title</Label>
                <p className="font-medium">{viewingTask.title}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="font-medium whitespace-pre-wrap">{viewingTask.description || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Related {caseTerm}</Label>
                <p className="font-medium">
                  {viewingTask.case_id ? (
                    <Link to={`/cases/${viewingTask.case_id}`} className="text-primary hover:underline">
                      {viewingTask.case_title}
                    </Link>
                  ) : "—"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Assigned To</Label>
                <p className="font-medium">
                  <Link to="/team" className="text-primary hover:underline">{viewingTask.assigned_to_name || "Unassigned"}</Link>
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Priority</Label>
                <p className="font-medium capitalize">{viewingTask.priority || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <p className="font-medium capitalize">{viewingTask.status?.replace("_", " ") || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Due Date</Label>
                <p className="font-medium">{viewingTask.due_date ? format(new Date(viewingTask.due_date), "MMM d, yyyy") : "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Category</Label>
                <p className="font-medium capitalize">{viewingTask.category || "—"}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}