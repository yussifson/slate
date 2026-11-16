import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { notificationService } from "@/lib/notificationService";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { 
  Plus, Search, Calendar, Edit2, CheckCircle2, MessageSquare, 
  User, Send, Clock, AlertCircle, FileText, Check, ListChecks
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { isAdmin } from "@/lib/constants";
import { Eye, Lock, Globe } from "lucide-react";

function parseTaskNotes(rawNotes, defaultAuthor, defaultDate) {
  if (!rawNotes) return [];
  if (Array.isArray(rawNotes)) return rawNotes;
  if (typeof rawNotes === "string") {
    const trimmed = rawNotes.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // Fall back below
      }
    }
    return [{ text: trimmed, author: defaultAuthor || "Creator", date: defaultDate }];
  }
  return [];
}

export default function Tasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all"); // 'all' | 'my_tasks' | 'created_by_me'
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.filter(),
    enabled: !!user,
  });

  const { data: staffProfiles = [] } = useQuery({
    queryKey: ["staff_profiles"],
    queryFn: () => base44.entities.Profile.list(),
    enabled: !!user,
  });

  const { data: staffRecords = [] } = useQuery({
    queryKey: ["staff_records_directory"],
    queryFn: () => base44.entities.StaffRecord.list(),
    enabled: !!user,
  });

  // Comprehensive merged staff directory from both profiles and staff records
  const staff = React.useMemo(() => {
    const map = new Map();
    // Add profiles first
    staffProfiles.forEach(p => {
      const email = (p.email || p.user_email || "").trim().toLowerCase();
      if (email) {
        map.set(email, {
          id: p.id,
          email,
          full_name: p.full_name || p.name || email,
          role: p.role || "Staff",
          department: p.department || ""
        });
      }
    });
    // Add staff directory records
    staffRecords.forEach(s => {
      const email = (s.user_email || s.email || "").trim().toLowerCase();
      if (email) {
        if (!map.has(email)) {
          map.set(email, {
            id: s.id,
            email,
            full_name: s.full_name || email,
            role: s.role || "Staff",
            department: s.department || ""
          });
        } else {
          // Merge details
          const existing = map.get(email);
          map.set(email, {
            ...existing,
            full_name: s.full_name || existing.full_name,
            role: s.role || existing.role,
            department: s.department || existing.department
          });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [staffProfiles, staffRecords]);

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => base44.entities.Department.filter(),
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const updated = await base44.entities.Task.update(id, data);
      
      // If marking as completed, notify the task creator if different from current user
      if (data.status === "completed") {
        const originalTask = tasks.find(t => t.id === id);
        if (originalTask?.created_by_email && originalTask.created_by_email !== user?.email) {
          await notificationService.notifyUsers(
            [originalTask.created_by_email],
            `Task Completed: ${originalTask.title}`,
            `Task has been marked as COMPLETED by ${user?.full_name || user?.email}.`,
            "/tasks",
            "task"
          );
        }
      }
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks"]);
      toast({ title: "Task status updated" });
    }
  });

  // Filter tasks based on status, search, and assignee filter (My Tasks / Created by Me)
  const displayTasks = tasks.filter(t => {
    // Visibility check (Public vs Private)
    const userEmail = (user?.email || "").toLowerCase();
    const userName = (user?.full_name || "").toLowerCase();
    const isUserAdmin = isAdmin(user);
    if (!isUserAdmin) {
      const isPrivate = t.visibility === "private";
      if (isPrivate) {
        const creatorEmail = (t.created_by_email || "").toLowerCase();
        const creatorName = (t.created_by_name || "").toLowerCase();
        const assigned = (t.assigned_to || "").toLowerCase();
        const allowed = Array.isArray(t.allowed_users) 
          ? t.allowed_users.map(u => String(u || "").toLowerCase()) 
          : [];
        const isCreator = (userEmail && creatorEmail === userEmail) || (userName && creatorName === userName);
        const isAssigned = (userEmail && assigned.includes(userEmail)) || (userName && assigned.includes(userName));
        const isExplicitlyAllowed = allowed.includes(userEmail) || allowed.includes(userName);
        if (!isCreator && !isAssigned && !isExplicitlyAllowed) return false;
      }
    }

    // Search filter
    if (search && !t.title?.toLowerCase().includes(search.toLowerCase()) && !t.description?.toLowerCase().includes(search.toLowerCase())) return false;
    
    // Status tab filter
    if (activeTab !== "all" && t.status !== activeTab) return false;

    // Assignee filter
    if (filterAssignee === "my_tasks") {
      const assigned = (t.assigned_to || "").toLowerCase();
      if (!assigned.includes(userEmail) && !assigned.includes(userName)) return false;
    }

    if (filterAssignee === "created_by_me") {
      const createdBy = (t.created_by_email || t.created_by_name || "").toLowerCase();
      if (!createdBy.includes(userEmail) && !createdBy.includes(userName)) return false;
    }

    return true;
  });

  const myAssignedCount = tasks.filter(t => {
    const assigned = (t.assigned_to || "").toLowerCase();
    const userEmail = (user?.email || "").toLowerCase();
    const userName = (user?.full_name || "").toLowerCase();
    return (assigned.includes(userEmail) || assigned.includes(userName)) && t.status !== "completed";
  }).length;

  return (
    <div className="space-y-6 max-w-[1700px] w-full mx-auto pb-32 md:pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground tracking-tight">Operations Tasks & Workflows</h1>
            {myAssignedCount > 0 && (
              <Badge className="bg-primary text-white font-bold text-xs">
                {myAssignedCount} Assigned to You
              </Badge>
            )}
          </div>
          <p className="hidden sm:block text-sm font-medium text-muted-foreground mt-1">
            Assign tasks to staff, track notes and progress updates, and verify completed operations.
          </p>
        </div>
        <Button 
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="gap-2 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all hover:opacity-95 text-white rounded-lg shadow-sm font-bold h-10 px-4"
        >
          <Plus className="w-4 h-4 stroke-[2]" /> New Task
        </Button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Tasks</span>
          <div className="text-2xl font-bold tracking-tight text-foreground mt-1">{tasks.length} Tasks</div>
          <p className="text-xs text-muted-foreground">All operational assignments</p>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">My Assigned Tasks</span>
          <div className="text-2xl font-bold tracking-tight text-primary mt-1">{myAssignedCount} Pending</div>
          <p className="text-xs text-muted-foreground">Awaiting your completion</p>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">In Progress</span>
          <div className="text-2xl font-bold tracking-tight text-blue-600 mt-1">{tasks.filter(t => t.status === "in_progress").length}</div>
          <p className="text-xs text-muted-foreground">Currently underway</p>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Completed</span>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 mt-1">{tasks.filter(t => t.status === "completed").length}</div>
          <p className="text-xs text-muted-foreground">Verified & closed</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Tabs */}
            <div className="flex gap-1.5 bg-muted/40 border border-border/60 p-1 rounded-xl">
              {['all', 'pending', 'in_progress', 'completed'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${activeTab === tab ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {tab.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Scope Filter: All vs Assigned to Me vs Created by Me */}
            <div className="flex gap-1 bg-secondary/60 p-1 rounded-xl border border-border/60">
              {[
                { key: "all", label: "All Staff Tasks" },
                { key: "my_tasks", label: "Assigned To Me" },
                { key: "created_by_me", label: "Created By Me" }
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setFilterAssignee(opt.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterAssignee === opt.key ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search tasks, notes..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-10 h-10 bg-card border-border rounded-lg text-xs font-medium focus-visible:ring-2 focus-visible:ring-[#F0709B]/30" 
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3.5 font-semibold tracking-wide text-muted-foreground uppercase text-xs tracking-wider">Task & Creator</th>
                <th className="px-4 py-3.5 font-semibold tracking-wide text-muted-foreground uppercase text-xs tracking-wider">Assigned Staff</th>
                <th className="px-4 py-3.5 font-semibold tracking-wide text-muted-foreground uppercase text-xs tracking-wider">Priority</th>
                <th className="px-4 py-3.5 font-semibold tracking-wide text-muted-foreground uppercase text-xs tracking-wider">Due Date</th>
                <th className="px-4 py-3.5 font-semibold tracking-wide text-muted-foreground uppercase text-xs tracking-wider">Status</th>
                <th className="px-4 py-3.5 font-semibold tracking-wide text-muted-foreground uppercase text-xs tracking-wider text-center">Notes / Updates</th>
                <th className="px-4 py-3.5 font-semibold tracking-wide text-muted-foreground uppercase text-xs tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {displayTasks.map(t => {
                const notesList = parseTaskNotes(t.notes, t.created_by_name, t.created_date);
                const isAssignedToMe = (t.assigned_to || "").toLowerCase().includes((user?.email || "").toLowerCase()) ||
                  (t.assigned_to || "").toLowerCase().includes((user?.full_name || "").toLowerCase());

                return (
                  <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-foreground text-sm">{t.title}</p>
                        {t.visibility === "private" && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-bold flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            Private
                          </Badge>
                        )}
                        {isAssignedToMe && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                            You
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{t.description || "No description provided"}</p>
                      <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        <span>Created by:</span>
                        <span className="font-semibold text-foreground">{t.created_by_name || t.created_by_email || "Operations Team"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-primary flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{t.assigned_to || "Unassigned"}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground capitalize">{t.category?.replace('_', ' ') || 'General'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold capitalize", 
                        t.priority === 'urgent' || t.priority === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' :
                        t.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      )}>
                        {t.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {t.due_date ? format(new Date(t.due_date), "MMM d, yyyy") : "—"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Select 
                        value={t.status || 'pending'} 
                        onValueChange={v => updateMutation.mutate({ 
                          id: t.id, 
                          data: { 
                            status: v, 
                            completed_at: v === 'completed' ? new Date().toISOString() : null,
                            completed_by: v === 'completed' ? (user?.full_name || user?.email) : null
                          } 
                        })}
                      >
                        <SelectTrigger className={cn("h-8 w-32 border text-xs font-bold capitalize rounded-lg", 
                          t.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300' :
                          t.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300' :
                          t.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
                        )}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      {t.status === 'completed' && t.completed_by && (
                        <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                          Done by {t.completed_by}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTaskDetails(t)}
                        className="h-8 text-xs font-bold gap-1 rounded-xl border-border hover:bg-muted"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-primary" />
                        <span>Notes ({notesList.length})</span>
                      </Button>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {t.status !== 'completed' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => updateMutation.mutate({ 
                              id: t.id, 
                              data: { 
                                status: "completed", 
                                completed_at: new Date().toISOString(),
                                completed_by: user?.full_name || user?.email
                              } 
                            })}
                            className="h-8 text-xs font-bold text-emerald-600 border-emerald-300 hover:bg-emerald-50 rounded-xl gap-1"
                            title="Mark as Completed"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Complete</span>
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { setEditing(t); setShowForm(true); }}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary rounded-xl"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {displayTasks.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-xs font-semibold text-muted-foreground">
                    No tasks found matching your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Creation & Edit Dialog */}
      {showForm && (
        <TaskFormDialog 
          open={showForm} 
          onClose={() => { setShowForm(false); setEditing(null); }} 
          initialData={editing}
          staff={staff}
          departments={departments}
        />
      )}

      {/* Task Details & Submissions Notes Modal */}
      {selectedTaskDetails && (
        <TaskNotesModal
          task={selectedTaskDetails}
          onClose={() => setSelectedTaskDetails(null)}
          currentUser={user}
        />
      )}
    </div>
  );
}

function TaskFormDialog({ open, onClose, initialData, staff, departments }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const isEdit = !!initialData?.id;

  const [form, setForm] = useState(initialData || {
    title: "", 
    description: "", 
    assigned_to: "", 
    priority: "medium", 
    due_date: "", 
    category: "other", 
    department: "", 
    status: "pending",
    visibility: "public", // 'public' | 'private'
    allowed_users: [],
    created_by_name: user?.full_name || "Staff",
    created_by_email: user?.email || ""
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        created_by_name: data.created_by_name || user?.full_name || "Staff",
        created_by_email: data.created_by_email || user?.email || ""
      };

      const res = isEdit 
        ? await base44.entities.Task.update(initialData.id, payload) 
        : await base44.entities.Task.create(payload);
      
      // Notify assigned staff
      if (data.assigned_to) {
        const emails = data.assigned_to.split(',').map(e => e.trim()).filter(Boolean);
        if (emails.length > 0) {
          await notificationService.notifyUsers(
            emails,
            isEdit ? "Task Updated: " + data.title : "New Task Assigned: " + data.title,
            data.description || "You have been assigned to an operations task.",
            "/tasks",
            "task"
          );
        }
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks"]);
      onClose();
      toast({ title: isEdit ? "Task updated & assignees notified" : "Task created & assignees notified" });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">{isEdit ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Assign operations task to staff. They will receive an instant notification and can submit progress notes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2 text-xs">
          <div>
            <Label className="font-bold text-xs">Task Title *</Label>
            <Input 
              value={form.title} 
              onChange={e=>setForm({...form, title: e.target.value})} 
              className="mt-1 h-9 rounded-lg text-xs" 
              placeholder="e.g. Inspect refrigeration temperature in Van 2"
              required
            />
          </div>
          <div>
            <Label className="font-bold text-xs">Description & Instructions</Label>
            <Textarea 
              value={form.description} 
              onChange={e=>setForm({...form, description: e.target.value})} 
              className="mt-1 rounded-lg text-xs" 
              rows={3}
              placeholder="Detailed instructions for the assigned staff member..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-bold text-xs">Category</Label>
              <Select value={form.category} onValueChange={v=>setForm({...form, category: v})}>
                <SelectTrigger className="mt-1 h-9 rounded-lg text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="material_request">Material Request</SelectItem>
                  <SelectItem value="procurement">Procurement</SelectItem>
                  <SelectItem value="approval">Approval</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="packaging">Packaging</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="sales">Sales & Collections</SelectItem>
                  <SelectItem value="other">Other Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-bold text-xs">Priority</Label>
              <Select value={form.priority} onValueChange={v=>setForm({...form, priority: v})}>
                <SelectTrigger className="mt-1 h-9 rounded-lg text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-bold text-xs">Assign To Staff *</Label>
              <SearchableSelect
                value={form.assigned_to}
                onValueChange={v => setForm({ ...form, assigned_to: v })}
                placeholder="Select Staff Member"
                searchPlaceholder="Search active staff directory..."
                className="mt-1"
                options={staff.map(s => ({
                  value: s.email,
                  label: s.full_name || s.email,
                  sublabel: s.department ? `${s.department} • ${s.email}` : s.email,
                  badge: s.role ? s.role.toUpperCase() : "STAFF"
                }))}
              />
            </div>
            <div>
              <Label className="font-bold text-xs">Due Date</Label>
              <Input type="date" value={form.due_date} onChange={e=>setForm({...form, due_date: e.target.value})} className="mt-1 h-9 rounded-lg text-xs font-mono" />
            </div>
          </div>

          {/* Visibility: Public vs Private Task */}
          <div className="p-3 rounded-lg border border-border/70 bg-muted/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-bold text-xs flex items-center gap-1.5">
                  {form.visibility === "private" ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <Globe className="w-3.5 h-3.5 text-blue-600" />}
                  <span>Task Visibility</span>
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  {form.visibility === "private" 
                    ? "Private: Only you and selected staff members can view this task" 
                    : "Public: Visible to all authorized team members in Operations"}
                </p>
              </div>
              <Select value={form.visibility || "public"} onValueChange={v => setForm({ ...form, visibility: v })}>
                <SelectTrigger className="h-8 w-28 text-xs font-bold rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.visibility === "private" && (
              <div className="pt-2 border-t border-border/40 space-y-1.5">
                <Label className="text-[11px] font-bold text-foreground">Select Allowed Viewers (In addition to Assignee)</Label>
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-2 bg-card rounded-md border border-border/60">
                  {staff.map(s => {
                    const isSelected = Array.isArray(form.allowed_users) && form.allowed_users.includes(s.email);
                    return (
                      <label key={s.id || s.email} className="flex items-center gap-1.5 text-xs cursor-pointer hover:bg-muted/40 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const cur = Array.isArray(form.allowed_users) ? [...form.allowed_users] : [];
                            if (e.target.checked) {
                              setForm({ ...form, allowed_users: [...cur, s.email] });
                            } else {
                              setForm({ ...form, allowed_users: cur.filter(x => x !== s.email) });
                            }
                          }}
                          className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <span className="truncate">{s.full_name || s.email}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="mt-6 flex justify-end gap-2">
          <Button variant="outline" className="rounded-lg text-xs font-bold" onClick={onClose}>Cancel</Button>
          <Button 
            className="bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold h-9 px-4" 
            onClick={() => mutation.mutate(form)} 
            disabled={!form.title || mutation.isPending}
          >
            {mutation.isPending ? "Saving..." : "Save & Notify Staff"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TaskNotesModal({ task, onClose, currentUser }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newNote, setNewNote] = useState("");

  const existingNotes = parseTaskNotes(task.notes, task.created_by_name, task.created_date);

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      if (!newNote.trim()) return;

      const noteEntry = {
        id: `note-${Date.now()}`,
        text: newNote.trim(),
        author: currentUser?.full_name || currentUser?.email || "Staff",
        author_email: currentUser?.email,
        date: new Date().toISOString()
      };

      const updatedNotes = [...existingNotes, noteEntry];

      await base44.entities.Task.update(task.id, {
        notes: updatedNotes
      });

      // Notify task creator if the note was written by the assignee, and vice-versa
      const recipientEmails = [];
      if (task.created_by_email && task.created_by_email !== currentUser?.email) {
        recipientEmails.push(task.created_by_email);
      }
      if (task.assigned_to && task.assigned_to !== currentUser?.email) {
        recipientEmails.push(task.assigned_to);
      }

      if (recipientEmails.length > 0) {
        await notificationService.notifyUsers(
          recipientEmails,
          `New Note on Task: ${task.title}`,
          `${currentUser?.full_name || 'Staff'}: "${newNote.trim().substring(0, 100)}"`,
          "/tasks",
          "task"
        );
      }

      return noteEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks"]);
      setNewNote("");
      toast({ title: "Note submitted and team notified!" });
    }
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: async () => {
      const isComplete = task.status === "completed";
      const newStatus = isComplete ? "pending" : "completed";
      await base44.entities.Task.update(task.id, {
        status: newStatus,
        completed_at: newStatus === "completed" ? new Date().toISOString() : null,
        completed_by: newStatus === "completed" ? (currentUser?.full_name || currentUser?.email) : null
      });

      // Notify creator
      if (task.created_by_email && task.created_by_email !== currentUser?.email) {
        await notificationService.notifyUsers(
          [task.created_by_email],
          `Task Marked as ${newStatus.toUpperCase()}: ${task.title}`,
          `Status changed by ${currentUser?.full_name || currentUser?.email}`,
          "/tasks",
          "task"
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks"]);
      onClose();
      toast({ title: "Task status updated!" });
    }
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-xl max-h-[90vh] overflow-y-auto p-5">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-primary" />
                <span>{task.title}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Task details, assignee submissions, and progress notes.
              </DialogDescription>
            </div>
            <Badge className={cn("text-[10px] capitalize font-bold", 
              task.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            )}>
              {task.status || "pending"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-3 text-xs">
          {/* Metadata Card */}
          <div className="p-3 bg-muted/40 rounded-xl border border-border/60 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-muted-foreground">Assigned To: </span>
                <span className="font-bold text-foreground">{task.assigned_to || "Unassigned"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Created By: </span>
                <span className="font-bold text-foreground">{task.created_by_name || task.created_by_email || "Operations"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Due Date: </span>
                <span className="font-semibold text-foreground">{task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "No due date"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Priority: </span>
                <span className="font-bold capitalize text-primary">{task.priority || "Medium"}</span>
              </div>
            </div>
            
          </div>

          {/* Notes & Submission Timeline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
                Submitted Notes & Progress Updates ({existingNotes.length})
              </span>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto p-2 bg-muted/20 rounded-xl border border-border/50">
              {existingNotes.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground text-xs">
                  No notes or progress updates submitted yet.
                </p>
              ) : (
                existingNotes.map((n, i) => (
                  <div key={n.id || i} className="p-2.5 rounded-lg bg-card border border-border/50 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-foreground flex items-center gap-1">
                        <User className="w-3 h-3 text-primary" />
                        {n.author || "Staff"}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {n.date ? format(new Date(n.date), "MMM d, h:mm a") : ""}
                      </span>
                    </div>
                    <p className="text-xs text-foreground whitespace-pre-wrap">{n.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add New Note */}
          <div className="space-y-1.5">
            <Label className="font-bold text-xs">Add Submission / Status Note</Label>
            <div className="flex gap-2">
              <Textarea
                placeholder="Write a progress note, observations, or completion details..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={2}
                className="rounded-lg text-xs"
              />
            </div>
            <div className="flex justify-end pt-1">
              <Button
                size="sm"
                onClick={() => addNoteMutation.mutate()}
                disabled={!newNote.trim() || addNoteMutation.isPending}
                className="bg-primary text-white text-xs font-bold rounded-lg gap-1.5 h-8 px-3"
              >
                <Send className="w-3 h-3" />
                <span>{addNoteMutation.isPending ? "Submitting..." : "Post Note"}</span>
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border pt-3 flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleCompleteMutation.mutate()}
            disabled={toggleCompleteMutation.isPending}
            className={cn("text-xs font-bold rounded-lg gap-1.5", 
              task.status === "completed" 
                ? "border-amber-300 text-amber-700 hover:bg-amber-50" 
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{task.status === "completed" ? "Re-open Task" : "Mark as Completed"}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-lg text-xs font-bold">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
