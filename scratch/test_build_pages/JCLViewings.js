import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Eye,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Building2
} from "lucide-react";
import { usePowerSync } from "@powersync/react";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { toast } from "react-hot-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
const STATUS_CONFIG = {
  scheduled: { label: "Scheduled Tour", badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  completed: { label: "Tour Completed", badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  cancelled: { label: "Cancelled", badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30" },
  rescheduled: { label: "Rescheduled", badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" }
};
export default function JCLViewings() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();
  const [viewings, setViewings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(/* @__PURE__ */ new Date());
  const [viewMode, setViewMode] = useState("agenda");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFormSheet, setShowFormSheet] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [inspectorViewing, setInspectorViewing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    propertyId: "",
    propertyAddress: "",
    clientId: "",
    clientName: "",
    agentName: user?.user_metadata?.full_name || "Assigned Broker",
    viewingDate: format(/* @__PURE__ */ new Date(), "yyyy-MM-dd"),
    viewingTime: "10:00 AM",
    durationMinutes: 45,
    status: "scheduled",
    feedback: "",
    notes: ""
  });
  const fetchViewingsData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const [viewRes, propRes, clientRes] = await Promise.all([
        powerSync.execute("SELECT * FROM univ_re_viewings WHERE company_id = ? ORDER BY viewing_date DESC", [companyId]),
        powerSync.execute("SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY address ASC", [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute("SELECT * FROM univ_re_clients WHERE company_id = ? ORDER BY name ASC", [companyId]).catch(() => ({ rows: [] }))
      ]);
      const viewList = viewRes.rows._array || Array.from(viewRes.rows || []);
      const propList = propRes.rows._array || Array.from(propRes.rows || []);
      const clientList = clientRes.rows._array || Array.from(clientRes.rows || []);
      setViewings(viewList);
      setProperties(propList);
      setClients(clientList);
    } catch (_err) {
      toast.error("Failed to load viewings");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchViewingsData();
  }, [companyId]);
  const stats = useMemo(() => {
    const total = viewings.length;
    const scheduled = viewings.filter((v) => v.status === "scheduled").length;
    const completed = viewings.filter((v) => v.status === "completed").length;
    const todayStr = format(/* @__PURE__ */ new Date(), "yyyy-MM-dd");
    const todayCount = viewings.filter((v) => v.viewing_date === todayStr).length;
    return { total, scheduled, completed, todayCount };
  }, [viewings]);
  const filteredViewings = useMemo(() => {
    return viewings.filter((v) => {
      const matchSearch = !search || v.property_address?.toLowerCase().includes(search.toLowerCase()) || v.client_name?.toLowerCase().includes(search.toLowerCase()) || v.agent_name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [viewings, search, statusFilter]);
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      propertyId: properties[0]?.id || "",
      propertyAddress: properties[0]?.address || "",
      clientId: clients[0]?.id || "",
      clientName: clients[0]?.name || "",
      agentName: user?.user_metadata?.full_name || "Assigned Broker",
      viewingDate: format(/* @__PURE__ */ new Date(), "yyyy-MM-dd"),
      viewingTime: "10:00 AM",
      durationMinutes: 45,
      status: "scheduled",
      feedback: "",
      notes: ""
    });
    setShowFormSheet(true);
  };
  const handleOpenEdit = (v) => {
    setEditingId(v.id);
    setFormData({
      propertyId: v.property_id || "",
      propertyAddress: v.property_address || "",
      clientId: v.client_id || "",
      clientName: v.client_name || "",
      agentName: v.agent_name || "",
      viewingDate: v.viewing_date || "",
      viewingTime: v.viewing_time || "",
      durationMinutes: v.duration_minutes || 45,
      status: v.status || "scheduled",
      feedback: v.feedback || "",
      notes: v.notes || ""
    });
    setShowFormSheet(true);
  };
  const handleSaveViewing = async (e) => {
    e.preventDefault();
    if (!formData.propertyAddress || !formData.clientName) {
      toast.error("Property address and client name are required");
      return;
    }
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_viewings SET
            property_id = ?, property_address = ?, client_id = ?, client_name = ?,
            agent_name = ?, viewing_date = ?, viewing_time = ?, duration_minutes = ?,
            status = ?, feedback = ?, notes = ?
          WHERE id = ? AND company_id = ?`,
          [
            formData.propertyId || null,
            formData.propertyAddress,
            formData.clientId || null,
            formData.clientName,
            formData.agentName || null,
            formData.viewingDate,
            formData.viewingTime || null,
            Number(formData.durationMinutes) || 45,
            formData.status,
            formData.feedback || null,
            formData.notes || null,
            editingId,
            companyId
          ]
        );
        toast.success("Viewing updated");
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_viewings (
            id, created_at, company_id, property_id, property_address,
            client_id, client_name, agent_id, agent_name, viewing_date,
            viewing_time, status, duration_minutes, feedback, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId,
            now,
            companyId,
            formData.propertyId || null,
            formData.propertyAddress,
            formData.clientId || null,
            formData.clientName,
            user?.id || null,
            formData.agentName || null,
            formData.viewingDate,
            formData.viewingTime || null,
            formData.status,
            Number(formData.durationMinutes) || 45,
            formData.feedback || null,
            formData.notes || null
          ]
        );
        toast.success("Viewing scheduled");
      }
      setShowFormSheet(false);
      fetchViewingsData();
      if (inspectorViewing && inspectorViewing.id === editingId) {
        setInspectorViewing((prev) => ({ ...prev, ...formData }));
      }
    } catch (_err) {
      toast.error("Failed to save viewing");
    }
  };
  const handleDeleteViewing = async () => {
    if (!deleteTarget) return;
    try {
      await powerSync.execute(
        `DELETE FROM univ_re_viewings WHERE id = ? AND company_id = ?`,
        [deleteTarget.id, companyId]
      );
      toast.success("Viewing deleted");
      setDeleteTarget(null);
      if (inspectorViewing?.id === deleteTarget.id) setInspectorViewing(null);
      fetchViewingsData();
    } catch (_err) {
      toast.error("Failed to delete viewing");
    }
  };
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  return /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20", children: /* @__PURE__ */ jsx(CalendarIcon, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: "Viewings & Site Inspections" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "Client inspection itineraries, tour agendas, broker schedules, and visitor feedback" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: fetchViewingsData,
            className: "h-9 px-3 text-xs gap-1.5 border-border",
            children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: cn("h-3.5 w-3.5", isLoading && "animate-spin") }),
              "Refresh"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            onClick: handleOpenCreate,
            size: "sm",
            className: "h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 gap-1.5",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
              "Schedule Viewing"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Scheduled Tours" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-foreground", children: stats.scheduled }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Upcoming property viewings" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(Clock, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Today's Viewings" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-emerald-600 dark:text-emerald-400", children: stats.todayCount }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-emerald-600/80", children: "Scheduled for today" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(CalendarIcon, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Completed Tours" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-foreground", children: stats.completed }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Feedback logged" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Total Tours Logged" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-foreground", children: stats.total }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Historical viewing sessions" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(Building2, { className: "h-5 w-5" }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card border border-border/80 p-3 rounded-xl shadow-xs", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-1 items-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-w-[220px]", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "Search by property, client, broker...",
              value: search,
              onChange: (e) => setSearch(e.target.value),
              className: "pl-9 h-9 text-xs bg-background"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 text-xs w-[170px] bg-background", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Status" }) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "all", className: "text-xs", children: "All Statuses" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "scheduled", className: "text-xs", children: "Scheduled" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "completed", className: "text-xs", children: "Completed" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "rescheduled", className: "text-xs", children: "Rescheduled" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "cancelled", className: "text-xs", children: "Cancelled" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 self-end md:self-auto", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setViewMode("agenda"),
            className: cn(
              "p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
              viewMode === "agenda" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            ),
            title: "Agenda Stream",
            children: [
              /* @__PURE__ */ jsx(Clock, { className: "h-3.5 w-3.5" }),
              /* @__PURE__ */ jsx("span", { className: "text-[11px] hidden sm:inline", children: "Agenda" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setViewMode("calendar"),
            className: cn(
              "p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
              viewMode === "calendar" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            ),
            title: "Month Calendar",
            children: [
              /* @__PURE__ */ jsx(CalendarIcon, { className: "h-3.5 w-3.5" }),
              /* @__PURE__ */ jsx("span", { className: "text-[11px] hidden sm:inline", children: "Calendar" })
            ]
          }
        )
      ] })
    ] }),
    viewMode === "agenda" ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: filteredViewings.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-16 border border-dashed border-border rounded-2xl bg-card/40", children: [
      /* @__PURE__ */ jsx(CalendarIcon, { className: "h-10 w-10 mx-auto text-muted-foreground/50 mb-3" }),
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-foreground", children: "No viewings scheduled" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1 max-w-sm mx-auto", children: "No property inspections match your filter criteria." }),
      /* @__PURE__ */ jsxs(Button, { onClick: handleOpenCreate, size: "sm", className: "mt-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white", children: [
        /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5 mr-1" }),
        " Schedule Viewing"
      ] })
    ] }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5", children: filteredViewings.map((v) => {
      const st = STATUS_CONFIG[v.status] || STATUS_CONFIG.scheduled;
      const bannerColor = "from-emerald-800 via-emerald-700 to-emerald-600";
      const clientInitials = (v.client_name || "C").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
      return /* @__PURE__ */ jsxs(
        "div",
        {
          onClick: () => setInspectorViewing(v),
          className: "group relative flex flex-col rounded-2xl border border-border/60 hover:border-emerald-500/50 bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer",
          children: [
            /* @__PURE__ */ jsxs("div", { className: cn("relative h-28 flex flex-col justify-between p-4 overflow-hidden bg-gradient-to-br", bannerColor), children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-10", style: { backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "28px 28px" } }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between relative z-10", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm", children: "Tour Inspection" }),
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm", children: [
                  /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-white animate-pulse" }),
                  st.label
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-end justify-between relative z-10", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-white/70 text-[9px] font-semibold uppercase tracking-widest mb-0.5", children: "Viewing Date" }),
                  /* @__PURE__ */ jsx("p", { className: "text-lg font-extrabold text-white tracking-tight", children: v.viewing_date ? format(new Date(v.viewing_date), "MMM dd, yyyy") : "TBD" })
                ] }),
                v.viewing_time && /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold text-white bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-sm", children: v.viewing_time })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-4 flex flex-col gap-3 flex-1 justify-between", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "font-bold text-foreground text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1", children: v.property_address }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-[11px] text-muted-foreground mt-1", children: [
                  /* @__PURE__ */ jsx(Building2, { className: "h-3 w-3 text-emerald-500 shrink-0" }),
                  /* @__PURE__ */ jsx("span", { className: "truncate", children: "Prime Inspection Site" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 divide-x divide-border/60 rounded-xl border border-border/60 bg-muted/30 overflow-hidden text-center", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center py-2 gap-0.5", children: [
                  /* @__PURE__ */ jsx(User, { className: "h-3.5 w-3.5 text-muted-foreground" }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-foreground truncate max-w-[110px]", children: v.client_name }),
                  /* @__PURE__ */ jsx("span", { className: "text-[8px] uppercase font-semibold text-muted-foreground tracking-wider", children: "Client" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center py-2 gap-0.5", children: [
                  /* @__PURE__ */ jsx(Clock, { className: "h-3.5 w-3.5 text-muted-foreground" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-foreground", children: [
                    v.duration_minutes || 45,
                    "m"
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "text-[8px] uppercase font-semibold text-muted-foreground tracking-wider", children: "Duration" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "pt-2 border-t border-border/50 flex items-center justify-between mt-auto", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0", children: [
                  /* @__PURE__ */ jsx("div", { className: "h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white text-[9px] font-extrabold shrink-0", children: clientInitials }),
                  /* @__PURE__ */ jsx("span", { className: "truncate font-medium", children: v.agent_name || "Assigned Broker" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", onClick: (e) => e.stopPropagation(), children: [
                  /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-muted-foreground hover:text-emerald-600", onClick: () => setInspectorViewing(v), title: "Inspect", children: /* @__PURE__ */ jsx(Eye, { className: "h-3.5 w-3.5" }) }),
                  /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-muted-foreground hover:text-foreground", onClick: () => handleOpenEdit(v), title: "Edit", children: /* @__PURE__ */ jsx(Edit, { className: "h-3.5 w-3.5" }) }),
                  /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-rose-500/70 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30", onClick: () => setDeleteTarget(v), title: "Delete", children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }) })
                ] })
              ] })
            ] })
          ]
        },
        v.id
      );
    }) }) }) : (
      /* Calendar View */
      /* @__PURE__ */ jsxs("div", { className: "border border-border rounded-xl bg-card p-4 space-y-4 shadow-xs", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-base text-foreground", children: format(currentMonth, "MMMM yyyy") }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "outline",
                size: "icon",
                className: "h-8 w-8",
                onClick: () => setCurrentMonth(subMonths(currentMonth, 1)),
                children: /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "outline",
                size: "sm",
                className: "h-8 text-xs",
                onClick: () => setCurrentMonth(/* @__PURE__ */ new Date()),
                children: "Today"
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "outline",
                size: "icon",
                className: "h-8 w-8",
                onClick: () => setCurrentMonth(addMonths(currentMonth, 1)),
                children: /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border", children: [
          ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => /* @__PURE__ */ jsx("div", { className: "bg-muted/40 p-2 text-center text-xs font-semibold text-muted-foreground", children: d }, d)),
          daysInMonth.map((day) => {
            const dayStr = format(day, "yyyy-MM-dd");
            const dayViewings = filteredViewings.filter((v) => v.viewing_date === dayStr);
            const isToday = isSameDay(day, /* @__PURE__ */ new Date());
            return /* @__PURE__ */ jsxs(
              "div",
              {
                className: cn(
                  "min-h-[90px] p-2 bg-card transition-colors flex flex-col justify-between",
                  !isSameMonth(day, currentMonth) && "opacity-40 bg-muted/10",
                  isToday && "bg-emerald-500/5 ring-1 ring-emerald-500/30"
                ),
                children: [
                  /* @__PURE__ */ jsx("span", { className: cn(
                    "text-xs font-bold self-end h-5 w-5 rounded-full flex items-center justify-center",
                    isToday ? "bg-emerald-600 text-white" : "text-muted-foreground"
                  ), children: format(day, "d") }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1 mt-1", children: [
                    dayViewings.slice(0, 2).map((v) => /* @__PURE__ */ jsxs(
                      "div",
                      {
                        onClick: () => setInspectorViewing(v),
                        className: "text-[10px] p-1 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 truncate cursor-pointer hover:bg-emerald-500/20",
                        children: [
                          v.viewing_time ? `${v.viewing_time} ` : "",
                          v.property_address
                        ]
                      },
                      v.id
                    )),
                    dayViewings.length > 2 && /* @__PURE__ */ jsxs("span", { className: "text-[9px] text-muted-foreground font-semibold", children: [
                      "+",
                      dayViewings.length - 2,
                      " more"
                    ] })
                  ] })
                ]
              },
              day.toISOString()
            );
          })
        ] })
      ] })
    ),
    /* @__PURE__ */ jsx(Sheet, { open: !!inspectorViewing, onOpenChange: (open) => !open && setInspectorViewing(null), children: /* @__PURE__ */ jsx(SheetContent, { className: "sm:max-w-xl overflow-y-auto p-0 flex flex-col font-sans", children: inspectorViewing && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs(SheetHeader, { className: "p-6 border-b border-border bg-muted/20", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs uppercase font-mono tracking-wider", children: "Viewing Record" }),
          /* @__PURE__ */ jsx(
            Badge,
            {
              variant: "outline",
              className: cn(
                "text-xs font-medium border",
                (STATUS_CONFIG[inspectorViewing.status] || STATUS_CONFIG.scheduled).badge
              ),
              children: (STATUS_CONFIG[inspectorViewing.status] || STATUS_CONFIG.scheduled).label
            }
          )
        ] }),
        /* @__PURE__ */ jsx(SheetTitle, { className: "text-xl font-bold text-foreground mt-2", children: inspectorViewing.property_address }),
        /* @__PURE__ */ jsxs(SheetDescription, { className: "text-xs flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(Clock, { className: "h-3.5 w-3.5" }),
          inspectorViewing.viewing_date,
          " at ",
          inspectorViewing.viewing_time || "Scheduled Time"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6 flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg border border-border/80 bg-muted/20", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase text-muted-foreground", children: "Prospect / Client" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-foreground mt-0.5", children: inspectorViewing.client_name })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg border border-border/80 bg-muted/20", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase text-muted-foreground", children: "Assigned Broker" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-foreground mt-0.5", children: inspectorViewing.agent_name || "Assigned" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: "Visitor Feedback" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-foreground/90 bg-muted/30 p-3.5 rounded-lg border border-border leading-relaxed", children: inspectorViewing.feedback || "No inspection feedback logged yet." })
        ] }),
        inspectorViewing.notes && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: "Internal Notes" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-foreground/90 bg-muted/30 p-3.5 rounded-lg border border-border leading-relaxed", children: inspectorViewing.notes })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => handleOpenEdit(inspectorViewing),
            className: "text-xs gap-1.5",
            children: [
              /* @__PURE__ */ jsx(Edit, { className: "h-3.5 w-3.5" }),
              "Edit Viewing"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            size: "sm",
            onClick: () => setInspectorViewing(null),
            className: "text-xs bg-emerald-600 hover:bg-emerald-700 text-white",
            children: "Close"
          }
        )
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx(Sheet, { open: showFormSheet, onOpenChange: setShowFormSheet, children: /* @__PURE__ */ jsxs(SheetContent, { className: "sm:max-w-xl overflow-y-auto p-0 flex flex-col font-sans", children: [
      /* @__PURE__ */ jsxs(SheetHeader, { className: "p-6 border-b border-border bg-muted/20", children: [
        /* @__PURE__ */ jsx(SheetTitle, { className: "text-lg font-bold text-foreground", children: editingId ? "Edit Inspection Viewing" : "Schedule Property Viewing" }),
        /* @__PURE__ */ jsx(SheetDescription, { className: "text-xs", children: "Book a client viewing tour, set time, and assign property specialist" })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSaveViewing, className: "p-6 space-y-4 flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Property Address *" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              required: true,
              placeholder: "e.g. 104 Oceanfront Boulevard",
              value: formData.propertyAddress,
              onChange: (e) => setFormData({ ...formData, propertyAddress: e.target.value }),
              className: "text-xs"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Client Name *" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                required: true,
                placeholder: "e.g. Eleanor Vance",
                value: formData.clientName,
                onChange: (e) => setFormData({ ...formData, clientName: e.target.value }),
                className: "text-xs"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Assigned Agent" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                placeholder: "e.g. Marcus Vance",
                value: formData.agentName,
                onChange: (e) => setFormData({ ...formData, agentName: e.target.value }),
                className: "text-xs"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Viewing Date *" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "date",
                required: true,
                value: formData.viewingDate,
                onChange: (e) => setFormData({ ...formData, viewingDate: e.target.value }),
                className: "text-xs"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Viewing Time" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                placeholder: "e.g. 10:30 AM",
                value: formData.viewingTime,
                onChange: (e) => setFormData({ ...formData, viewingTime: e.target.value }),
                className: "text-xs"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Duration (Minutes)" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                min: "15",
                step: "15",
                value: formData.durationMinutes,
                onChange: (e) => setFormData({ ...formData, durationMinutes: e.target.value }),
                className: "text-xs"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Status" }),
            /* @__PURE__ */ jsxs(
              Select,
              {
                value: formData.status,
                onValueChange: (val) => setFormData({ ...formData, status: val }),
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "text-xs", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsx(SelectItem, { value: "scheduled", className: "text-xs", children: "Scheduled" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "completed", className: "text-xs", children: "Completed" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "rescheduled", className: "text-xs", children: "Rescheduled" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "cancelled", className: "text-xs", children: "Cancelled" })
                  ] })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Feedback / Client Reactions" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              rows: 2,
              placeholder: "Client likes natural light, asked about HOA fees...",
              value: formData.feedback,
              onChange: (e) => setFormData({ ...formData, feedback: e.target.value }),
              className: "w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Notes" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              rows: 2,
              placeholder: "Lockbox code, gate instructions...",
              value: formData.notes,
              onChange: (e) => setFormData({ ...formData, notes: e.target.value }),
              className: "w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-border flex items-center justify-end gap-2", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: () => setShowFormSheet(false),
              className: "text-xs",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "submit",
              size: "sm",
              className: "text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20",
              children: editingId ? "Save Changes" : "Schedule Viewing"
            }
          )
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!deleteTarget, onOpenChange: (open) => !open && setDeleteTarget(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { className: "font-sans", children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { className: "text-base font-bold", children: "Delete Viewing Schedule?" }),
        /* @__PURE__ */ jsxs(AlertDialogDescription, { className: "text-xs", children: [
          "Are you sure you want to delete the viewing for ",
          /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: deleteTarget?.property_address }),
          "?"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { className: "text-xs", children: "Cancel" }),
        /* @__PURE__ */ jsx(
          AlertDialogAction,
          {
            onClick: handleDeleteViewing,
            className: "text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold",
            children: "Confirm Delete"
          }
        )
      ] })
    ] }) })
  ] });
}
