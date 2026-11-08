import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { powerSync } from "@/api/PowerSyncConnector";
import { useAuth } from "@/lib/AuthContext";
import { useCompanyId, useCompany } from "@/hooks/useCompanyId";
import { getTerm } from "@/config/industries";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, CheckCircle2, Clock, AlertCircle, Sparkles, ListChecks, Calendar, Users, Edit2, Link2, BarChart2, List, GanttChartSquare, AlertTriangle } from "lucide-react";
import { generateText } from "@/lib/cloudflareAI";
import { format, differenceInDays, addDays, parseISO, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import TaskChecklist from "@/components/tasks/TaskChecklist";
import TaskComments from "@/components/tasks/TaskComments";
import TaskAttachments from "@/components/tasks/TaskAttachments";
import { useToast } from "@/components/ui/use-toast";

const PRIORITY_COLORS = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-orange-100 text-orange-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700"};

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-orange-100 text-orange-700",
  completed: "bg-slate-100 text-primary/90",
  cancelled: "bg-gray-100 text-[#71717a] dark:text-gray-400"};

function TaskFormDialog({ open, onClose, initialData, cases, staff, companyId, caseTerm, allTasks }) {
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
    start_date: "",
    category: "legal",
    depends_on: [], // Array of task IDs this is blocked by
    custom_fields: {} // { fieldName: value }
  };

  const [form, setForm] = useState(initialData || defaultForm);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setForm(initialData || defaultForm);
  }, [open, initialData]);

  const mutation = useMutation({
    mutationFn: (data) => {
      const firstAssignee = data.assignees?.[0];
      const payload = {
         ...data,
         assigned_to: firstAssignee?.id || null,
         assigned_to_name: firstAssignee?.full_name || null,
         depends_on: data.depends_on ? JSON.stringify(data.depends_on) : null,
         custom_fields: data.custom_fields ? JSON.stringify(data.custom_fields) : null,
      };
      return isEdit
        ? base44.entities.Task.update(initialData.id, payload)
        : base44.entities.Task.create({ ...payload, company_id: companyId });
    },
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

  const handleAIBreakdown = async () => {
    if (!form.title) {
      toast({ title: "Title Required", description: "Please enter a task title first." });
      return;
    }
    setIsGenerating(true);
    toast({ title: "AI is generating task checklist..." });
    try {
      const prompt = `Break down this task into a 3-5 step actionable checklist in plain text without any markdown or special characters: "${form.title}"\nReturn ONLY the plain text checklist.`;
      const response = await generateText([{ role: 'user', content: prompt }]);
      
      const newDesc = form.description 
        ? `${form.description}\n\n### AI Task Breakdown:\n${response}` 
        : `### AI Task Breakdown:\n${response}`;
      
      set("description", newDesc);
      toast({ title: "Checklist generated!" });
    } catch (e) {
      toast({ title: "Failed to generate breakdown", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-6xl xl:max-w-7xl h-[min(92vh,940px)] flex flex-col p-0 gap-0 overflow-hidden bg-background text-foreground border border-border/80 shadow-2xl rounded-2xl">
        <DialogHeader className="px-6 py-4 border-b border-black/5 dark:border-white/5 bg-gradient-to-r from-background via-muted/20 to-background border-b border-border/70 shrink-0">
          <DialogTitle className="text-xl font-bold tracking-tight">{isEdit ? "Task Details" : "New Task"}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 sm:px-8 py-3 bg-white dark:bg-[#2C2C2E] border-b border-black/5 dark:border-white/5 shrink-0">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-hidden relative">
            <TabsContent value="details" className="h-full absolute inset-0 overflow-y-auto px-4 sm:px-8 py-6 custom-scrollbar m-0 outline-none">
              <div className="space-y-6 w-full bg-card p-6 sm:p-8 rounded-2xl border border-border/80 shadow-xs">
          <div>
            <Label>{t("title", "Title *")}</Label>
            <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Task title" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>{t("description", "Description")}</Label>
              <Button type="button" onClick={handleAIBreakdown} disabled={isGenerating || !form.title} variant="ghost" size="sm" className="h-6 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 gap-1.5 rounded">
                {isGenerating ? <Sparkles className="w-3 h-3 animate-pulse"/> : <ListChecks className="w-3 h-3"/>}
                AI Breakdown
              </Button>
            </div>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4} placeholder="Add details or generate an AI breakdown..." />
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
          <div className="col-span-2">
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date || ''} onChange={e => set("start_date", e.target.value)} />
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

          {/* Task Dependencies */}
          {allTasks?.length > 0 && (
            <div>
              <Label className="flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" /> Blocked By (Dependencies)</Label>
              <div className="border border-border rounded-lg p-3 max-h-28 overflow-y-auto space-y-1.5 mt-1.5 bg-muted/30">
                {allTasks.filter(t => t.id !== initialData?.id).map(t => (
                  <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(form.depends_on || []).includes(t.id)}
                      onChange={(e) => {
                        const cur = form.depends_on || [];
                        set('depends_on', e.target.checked ? [...cur, t.id] : cur.filter(id => id !== t.id));
                      }}
                      className="rounded"
                    />
                    <span className="truncate">{t.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Custom Fields */}
          <div className="border border-border rounded-lg p-3 space-y-3 bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custom Fields</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Estimated Hours</Label>
                <Input
                  type="number" min="0"
                  placeholder="0"
                  value={form.custom_fields?.estimated_hours || ''}
                  onChange={e => set('custom_fields', { ...form.custom_fields, estimated_hours: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Story Points</Label>
                <Input
                  type="number" min="0"
                  placeholder="0"
                  value={form.custom_fields?.story_points || ''}
                  onChange={e => set('custom_fields', { ...form.custom_fields, story_points: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Sprint / Milestone</Label>
              <Input
                placeholder="e.g. Sprint 3 or Q3 Launch"
                value={form.custom_fields?.sprint || ''}
                onChange={e => set('custom_fields', { ...form.custom_fields, sprint: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>
        </TabsContent>
        <TabsContent value="checklist" className="h-full absolute inset-0 overflow-y-auto px-4 sm:px-8 py-6 custom-scrollbar m-0 outline-none">
          <div className="w-full bg-white dark:bg-[#2C2C2E] p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm min-h-full">
            <TaskChecklist taskId={initialData?.id} />
          </div>
        </TabsContent>
        <TabsContent value="comments" className="h-full absolute inset-0 overflow-y-auto px-4 sm:px-8 py-6 custom-scrollbar m-0 outline-none">
          <div className="w-full bg-white dark:bg-[#2C2C2E] p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm h-full flex flex-col">
            <TaskComments taskId={initialData?.id} />
          </div>
        </TabsContent>
        <TabsContent value="files" className="h-full absolute inset-0 overflow-y-auto px-4 sm:px-8 py-6 custom-scrollbar m-0 outline-none">
          <div className="w-full bg-white dark:bg-[#2C2C2E] p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm min-h-full">
            <TaskAttachments taskId={initialData?.id} />
          </div>
        </TabsContent>
        </div>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t border-border/70 bg-gradient-to-r from-background via-muted/20 to-background shrink-0 mt-auto">
          <Button variant="outline" onClick={onClose} type="button">{t("cancel", "Cancel")}</Button>
          <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.title}>
            {mutation.isPending ? t("saving", "Saving...") : t("save", "Save")}
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
    enabled: !!companyId});

  const { data: cases = [] } = useQuery({
    queryKey: ["cases-list", companyId],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }),
    enabled: !!companyId});

  const { data: staff = [] } = useQuery({
    queryKey: ["staff-list", companyId],
    queryFn: async () => {
      try {
        const res = await powerSync.execute('SELECT * FROM univ_hr_employees WHERE company_id = ?', [companyId]);
        const records = res.rows._array || Array.from(res.rows);
        return records.map(r => ({
           id: r.id,
           full_name: r.name,
           user_email: r.email,
           role: r.role
        }));
      } catch(e) { return []; }
    },
    enabled: !!companyId});

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", companyId] })});

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
    completed: tasks.filter(item => item.status === "completed").length};

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
      }},
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
      }},
    {
      header: "Priority",
      render: row => {
        return (
          <Badge className={cn("text-xs capitalize", PRIORITY_COLORS[row.priority])}>
            {row.priority}
          </Badge>
        );
      }},
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
      }},
    {
      header: "Due Date",
      render: (row) => row.due_date
        ? <span className="text-sm">{format(new Date(row.due_date), "MMM d, yyyy")}</span>
        : <span className="text-sm text-[#71717a] dark:text-gray-400">—</span>},
    {
      header: "",
      render: row => {
        return (
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditing(row); setShowForm(true); }}>
            {t("edit", "Edit")}
          </Button>
        );
      }},
  ];

  const [activeView, setActiveView] = useState('list');

  return (
    <div className="space-y-6 school-page-enter font-dmsans">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Total", value: stats.total, icon: Clock, bg: "bg-gradient-to-br from-emerald-500 to-emerald-600", text: "text-white", border: "border-emerald-500/20" },
          { label: "Pending", value: stats.pending, icon: AlertCircle, bg: "bg-white dark:bg-[#2C2C2E]", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-500/20", iconBg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "In Progress", value: stats.in_progress, icon: Clock, bg: "bg-white dark:bg-[#2C2C2E]", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-500/20", iconBg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, bg: "bg-white dark:bg-[#2C2C2E]", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-500/20", iconBg: "bg-emerald-50 dark:bg-emerald-500/10" },
        ].map(({ label, value, icon: Icon, bg, text, border, iconBg }) => {
          return (
            <div key={label} className={`rounded-2xl border ${border} ${bg} p-3.5 sm:p-4 rounded-[20px] flex flex-col gap-2.5 sm:gap-3 shadow-xs hover:shadow-sm transition-all relative overflow-hidden group`}>
              <div className="flex items-center justify-between z-10">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg || 'bg-white/20 text-white'}`}>
                  <Icon className={`w-5 h-5 ${iconBg ? 'text-emerald-600 dark:text-emerald-400' : 'text-white'}`} />
                </div>
                <p className={`text-xl sm:text-2xl font-black tracking-tight ${bg.includes('emerald-500') ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                  {value}
                </p>
              </div>
              <div className="z-10 mt-auto">
                <p className={`text-[10px] sm:text-xs font-bold tracking-wider uppercase ${bg.includes('emerald-500') ? 'text-emerald-50' : 'text-slate-500 dark:text-muted-foreground'}`}>
                  {label} Tasks
                </p>
              </div>
              {/* Subtle background decoration */}
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            </div>
          );
        })}
      </div>

      {/* View Toggle + Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 sm:items-center justify-between bg-card/90 backdrop-blur-xl p-2.5 sm:p-3.5 rounded-[20px] border border-border/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 h-10 rounded-xl bg-background text-xs border-border/80" placeholder="Search tasks or assignees..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 h-10 rounded-xl text-xs font-semibold bg-background border-border/80"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">{t("all_statuses", "All Statuses")}</SelectItem>
              <SelectItem value="pending" className="text-xs">{t("pending", "Pending")}</SelectItem>
              <SelectItem value="in_progress" className="text-xs">{t("in_progress", "In Progress")}</SelectItem>
              <SelectItem value="completed" className="text-xs">{t("completed", "Completed")}</SelectItem>
              <SelectItem value="cancelled" className="text-xs">{t("cancelled", "Cancelled")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0">
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 shrink-0">
            <button onClick={() => setActiveView('list')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all', activeView === 'list' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground')}><List className="w-3.5 h-3.5"/>List</button>
            <button onClick={() => setActiveView('board')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all', activeView === 'board' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground')}><BarChart2 className="w-3.5 h-3.5"/>Board</button>
            <button onClick={() => setActiveView('gantt')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all', activeView === 'gantt' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground')}><GanttChartSquare className="w-3.5 h-3.5"/>Timeline</button>
          </div>
        </div>
      </div>

      {activeView === 'gantt' ? (
        <GanttView tasks={filtered} />
      ) : (
      <div className="mt-6 flex flex-col divide-y rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-slate-500">Loading tasks...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center bg-card border-dashed border-slate-300 dark:border-border">
            <ListChecks className="w-12 h-12 mx-auto text-slate-400 mb-3" />
            <h3 className="text-lg font-medium">No tasks yet</h3>
            <p className="text-slate-500 text-sm">Create your first task to get started.</p>
          </div>
        ) : (
          filtered.map(row => {
            const statusConfig = {
              pending: { 
                bg: "bg-red-50 dark:bg-red-950/20", 
                border: "border-red-200 dark:border-red-900/50", 
                accent: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
                indicator: "bg-red-500"
              },
              in_progress: { 
                bg: "bg-blue-50 dark:bg-blue-950/20", 
                border: "border-blue-200 dark:border-blue-900/50", 
                accent: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
                indicator: "bg-blue-500"
              },
              completed: { 
                bg: "bg-emerald-50 dark:bg-emerald-950/20", 
                border: "border-emerald-200 dark:border-emerald-900/50", 
                accent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
                indicator: "bg-emerald-500"
              },
              cancelled: { 
                bg: "bg-slate-50 dark:bg-card/50", 
                border: "border-slate-200 dark:border-border", 
                accent: "bg-slate-200 text-slate-700 dark:bg-secondary dark:text-muted-foreground",
                indicator: "bg-slate-400"
              },
            }[row.status] || { bg: "bg-card", border: "border-border", accent: "bg-muted text-muted-foreground", indicator: "bg-slate-300" };

            return (
              <div 
                key={row.id} 
                onClick={() => { setEditing(row); setShowForm(true); }}
                className={`group relative p-4 sm:p-5 hover:bg-muted/40 transition-colors flex flex-col justify-between cursor-pointer ${statusConfig.bg}`}
              >
                {/* Top Section */}
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-4">
                      <h3 className="font-bold text-[15px] leading-tight text-slate-900 dark:text-slate-100 line-clamp-2">
                        {row.title}
                      </h3>
                      {row.case_title && (
                        <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {row.case_title}
                        </p>
                      )}
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40"
                      onClick={(e) => { e.stopPropagation(); setEditing(row); setShowForm(true); }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={cn("text-[10px] uppercase font-bold tracking-wider", PRIORITY_COLORS[row.priority] || "bg-slate-100 text-slate-700")}>
                      {row.priority}
                    </Badge>
                    {row.depends_on?.length > 0 && (
                      <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> Blocked
                      </Badge>
                    )}
                    {row.custom_fields?.sprint && (
                      <Badge className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                        {row.custom_fields.sprint}
                      </Badge>
                    )}
                  </div>
                  {row.custom_fields?.estimated_hours && (
                    <p className="text-xs text-muted-foreground mb-2">⏱ Est. {row.custom_fields.estimated_hours}h</p>
                  )}
                </div>

                {/* Bottom Section */}
                <div className="pt-4 mt-auto border-t border-black/5 dark:border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {row.due_date ? format(new Date(row.due_date), "MMM d, yyyy") : "No due date"}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[100px]">
                        {row.assignees?.length > 0 ? row.assignees.map(a => a.full_name).join(", ") : "Unassigned"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white/60 dark:bg-black/20 p-2 rounded-xl">
                    <div className={`w-2 h-2 rounded-full ${statusConfig.indicator} animate-pulse`} />
                    <Select value={row.status} onValueChange={v => updateMutation.mutate({ id: row.id, data: { status: v } })}>
                      <SelectTrigger className={`h-8 text-xs font-bold border-0 hover:bg-black/5 dark:hover:bg-white/5 focus:ring-0 ${statusConfig.accent}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{t("pending", "Pending")}</SelectItem>
                        <SelectItem value="in_progress">{t("in_progress", "In Progress")}</SelectItem>
                        <SelectItem value="completed">{t("completed", "Completed")}</SelectItem>
                        <SelectItem value="cancelled">{t("cancelled", "Cancelled")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      )}
      {showForm && (
        <TaskFormDialog
          open={showForm}
          onClose={() => { setShowForm(false); setEditing(null); }}
          initialData={editing}
          cases={cases}
          staff={staff}
          companyId={companyId}
          caseTerm={caseTerm}
          allTasks={tasks}
        />
      )}
    </div>
  );
}

// ─── Gantt / Timeline View ─────────────────────────────────────────
function GanttView({ tasks }) {
  const today = new Date();
  const rangeStart = new Date(today);
  rangeStart.setDate(1);
  const rangeEnd = addDays(rangeStart, 60);
  const totalDays = differenceInDays(rangeEnd, rangeStart);

  const tasksWithDates = tasks.filter(t => t.due_date && isValid(parseISO(t.due_date)));

  const PRIORITY_COLORS_GANTT = {
    low: 'bg-gray-400',
    medium: 'bg-blue-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500'
  };

  if (tasksWithDates.length === 0) {
    return (
      <div className="py-16 text-center bg-card rounded-xl border border-dashed border-slate-300">
        <GanttChartSquare className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <h3 className="text-lg font-medium">No dated tasks</h3>
        <p className="text-slate-500 text-sm">Add due dates to your tasks to see them on the timeline.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Header ruler */}
      <div className="flex border-b border-border bg-muted/40">
        <div className="w-48 shrink-0 px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Task</div>
        <div className="flex-1 relative h-10">
          {[0, 15, 30, 45].map(d => (
            <div key={d} className="absolute top-0 h-full border-l border-border/50 flex items-center px-2" style={{ left: `${(d / totalDays) * 100}%` }}>
              <span className="text-[10px] text-muted-foreground">{format(addDays(rangeStart, d), 'MMM d')}</span>
            </div>
          ))}
          {/* Today marker */}
          <div className="absolute top-0 h-full border-l-2 border-primary/70" style={{ left: `${(differenceInDays(today, rangeStart) / totalDays) * 100}%` }} />
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {tasksWithDates.sort((a,b) => new Date(a.due_date) - new Date(b.due_date)).map(task => {
          const start = task.start_date && isValid(parseISO(task.start_date)) ? parseISO(task.start_date) : addDays(parseISO(task.due_date), -3);
          const end = parseISO(task.due_date);
          const startPct = Math.max(0, (differenceInDays(start, rangeStart) / totalDays) * 100);
          const widthPct = Math.max(1, (differenceInDays(end, start) / totalDays) * 100);
          const barColor = PRIORITY_COLORS_GANTT[task.priority] || 'bg-blue-500';
          const isOverdue = end < today && task.status !== 'completed';

          return (
            <div key={task.id} className="flex items-center hover:bg-muted/30 transition-colors">
              <div className="w-48 shrink-0 px-4 py-3 flex flex-col gap-0.5">
                <p className="text-sm font-medium truncate">{task.title}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{task.status?.replace('_', ' ')}</p>
              </div>
              <div className="flex-1 relative h-14 flex items-center pr-4">
                <div
                  className={cn('absolute h-6 rounded-full flex items-center px-2.5 text-[10px] font-semibold text-white truncate shadow-sm', barColor, isOverdue ? 'opacity-60 border-2 border-red-500' : '')}
                  style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                  title={`${task.title} — Due: ${format(end, 'MMM d, yyyy')}`}
                >
                  {widthPct > 5 ? format(end, 'MMM d') : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
