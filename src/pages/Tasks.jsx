import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useCompanyId, useCompany } from "@/hooks/useCompanyId";
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
import { Plus, Search, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const PRIORITY_COLORS = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-orange-100 text-orange-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-orange-100 text-orange-700",
  completed: "bg-slate-100 text-primary/90",
  cancelled: "bg-gray-100 text-[#71717a] dark:text-gray-400",
};

function TaskFormDialog({ open, onClose, initialData, cases, staff, companyId, caseTerm }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEdit = !!initialData?.id;

  const defaultForm = {
    title: "",
    description: "",
    case_id: "",
    case_title: "",
    assignees: [], // Array of { id, full_name, user_email }
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

  const handleStaffChange = (staffObj, checked) => {
    setForm(prev => {
      const currentAssignees = prev.assignees || [];
      if (checked) {
        return { ...prev, assignees: [...currentAssignees, { id: staffObj.id, full_name: staffObj.full_name, user_email: staffObj.user_email }] };
      } else {
        return { ...prev, assignees: currentAssignees.filter(a => a.id !== staffObj.id) };
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          <div>
            <Label>{t("title", "Title *")}</Label>
            <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Task title" />
          </div>
          <div>
            <Label>{t("description", "Description")}</Label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("priority", "Priority")}</Label>
              <Select value={form.priority} onValueChange={v => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("low", "Low")}</SelectItem>
                  <SelectItem value="medium">{t("medium", "Medium")}</SelectItem>
                  <SelectItem value="high">{t("high", "High")}</SelectItem>
                  <SelectItem value="urgent">{t("urgent", "Urgent")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("status", "Status")}</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t("pending", "Pending")}</SelectItem>
                  <SelectItem value="in_progress">{t("in_progress", "In Progress")}</SelectItem>
                  <SelectItem value="completed">{t("completed", "Completed")}</SelectItem>
                  <SelectItem value="cancelled">{t("cancelled", "Cancelled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="block mb-1.5">{t("assign_to_multiple_team_member", "Assign To (Multiple Team Members)")}</Label>
              <div className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-3 max-h-36 overflow-y-auto space-y-2 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                {staff.map(s => {
                  const isChecked = form.assignees?.some(a => a.id === s.id);
                  return (
                    <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleStaffChange(s, e.target.checked)}
                        className="rounded-md text-primary focus:ring-primary border-primary/40"
                      />
                      <span>{s.full_name} ({s.role})</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="col-span-2">
              <Label>{t("due_date", "Due Date")}</Label>
              <Input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>{t("related", "Related")} {caseTerm}</Label>
            <Select value={form.case_id} onValueChange={handleCaseChange}>
              <SelectTrigger><SelectValue placeholder={`Select ${caseTerm.toLowerCase()} (optional)`} /></SelectTrigger>
              <SelectContent>
                {cases.map(c => {
                  return (<SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>);
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("category", "Category")}</Label>
            <Select value={form.category} onValueChange={v => set("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="legal">{t("legal", "Legal")}</SelectItem>
                <SelectItem value="admin">{t("admin", "Admin")}</SelectItem>
                <SelectItem value="finance">{t("finance", "Finance")}</SelectItem>
                <SelectItem value="hr">{t("hr", "HR")}</SelectItem>
                <SelectItem value="other">{t("other", "Other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("cancel", "Cancel")}</Button>
          <Button onClick={() => mutation.mutate(form)} disabled={!form.title || mutation.isPending}>
            {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Tasks() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  const { company } = useCompany();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const industry = sessionStorage.getItem("slate_industry_override") || company?.industry_type || user?.company_industry || "law";
  const caseTerm = getTerm(industry, "case");

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

  const isAdmin = ["super_admin", "company_admin", "managing_partner"].includes(user?.role);
  const filtered = tasks.filter(item => {
    if (!isAdmin) {
      const isAssignee = item.assignees?.some(a => a.user_email === user?.email);
      const isCreator = item.created_by === user?.id;
      if (!isAssignee && !isCreator) return false;
    }
    const matchSearch = !search || item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.assignees?.some(a => a.full_name?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter(item => item.status === "pending").length,
    in_progress: tasks.filter(item => item.status === "in_progress").length,
    completed: tasks.filter(item => item.status === "completed").length,
  };

  const columns = [
    {
      header: "Task",
      render: row => {
        return (
          <div>
            <p className="font-medium text-sm">{row.title}</p>
            {row.case_title && <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{row.case_title}</p>}
          </div>
        );
      },
    },
    {
      header: "Assigned To",
      render: row => {
        return (
          <span className="text-sm">
            {row.assignees?.length > 0 
              ? row.assignees.map(a => a.full_name).join(", ") 
              : "—"}
          </span>
        );
      },
    },
    {
      header: "Priority",
      render: row => {
        return (
          <Badge className={cn("text-xs capitalize", PRIORITY_COLORS[row.priority])}>
            {row.priority}
          </Badge>
        );
      },
    },
    {
      header: "Status",
      render: row => {
        return (
          <Select value={row.status} onValueChange={v => updateMutation.mutate({ id: row.id, data: { status: v } })}>
            <SelectTrigger className="h-7 text-xs w-32 tracking-[0.04em]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">{t("pending", "Pending")}</SelectItem>
              <SelectItem value="in_progress">{t("in_progress", "In Progress")}</SelectItem>
              <SelectItem value="completed">{t("completed", "Completed")}</SelectItem>
              <SelectItem value="cancelled">{t("cancelled", "Cancelled")}</SelectItem>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      header: "Due Date",
      render: (row) => row.due_date
        ? <span className="text-sm">{format(new Date(row.due_date), "MMM d, yyyy")}</span>
        : <span className="text-sm text-[#71717a] dark:text-gray-400">—</span>,
    },
    {
      header: "",
      render: row => {
        return (
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditing(row); setShowForm(true); }}>
            {t("edit", "Edit")}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        subtitle="Manage and track team tasks"
        actions={
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> {t("new_task", "New Task")}
          </Button>
        }
      />
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: Clock, color: "text-primary bg-slate-50" },
          { label: "Pending", value: stats.pending, icon: AlertCircle, color: "text-yellow-600 bg-yellow-50" },
          { label: "In Progress", value: stats.in_progress, icon: Clock, color: "text-primary bg-slate-50" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-primary bg-slate-50" },
        ].map(({ label, value, icon: Icon, color }) => {
          return (
            <div key={label} className="bg-card rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 flex items-center gap-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-semibold">{value}</p>
                <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{label}</p>
              </div>
            </div>
          );
        })}
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
          <Input className="pl-9" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all_statuses", "All Statuses")}</SelectItem>
            <SelectItem value="pending">{t("pending", "Pending")}</SelectItem>
            <SelectItem value="in_progress">{t("in_progress", "In Progress")}</SelectItem>
            <SelectItem value="completed">{t("completed", "Completed")}</SelectItem>
            <SelectItem value="cancelled">{t("cancelled", "Cancelled")}</SelectItem>
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
    </div>
  );
}