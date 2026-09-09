import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  RefreshCw,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Search,
  Edit,
  Trash2,
  Eye,
  Grid,
  List,
  Sparkles,
  Building2,
  User,
  Phone,
  FileCheck,
  DollarSign
} from "lucide-react";
import { usePowerSync } from "@powersync/react";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import { useVideo } from "@/lib/VideoContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/constants";
import { toast } from "react-hot-toast";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
const STATUS_CONFIG = {
  proposal_sent: { label: "Proposal Sent", badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  in_negotiation: { label: "In Negotiation", badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  accepted: { label: "Renewal Approved", badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  declined: { label: "Notice Given / Expired", badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30" }
};
export default function JCLLeaseRenewals() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();
  const { joinRoom } = useVideo();
  const [renewals, setRenewals] = useState([]);
  const [leases, setLeases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFormSheet, setShowFormSheet] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [inspectorRenewal, setInspectorRenewal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    leaseId: "",
    tenantName: "",
    propertyAddress: "",
    currentRent: 2500,
    proposedRent: 2750,
    expirationDate: format(new Date((/* @__PURE__ */ new Date()).setMonth((/* @__PURE__ */ new Date()).getMonth() + 2)), "yyyy-MM-dd"),
    newTermMonths: 12,
    status: "proposal_sent",
    notes: ""
  });
  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const [renRes, leaseRes] = await Promise.all([
        powerSync.execute("SELECT * FROM univ_re_lease_renewals WHERE company_id = ? ORDER BY created_at DESC", [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute("SELECT * FROM univ_re_leases WHERE company_id = ? ORDER BY property_address ASC", [companyId]).catch(() => ({ rows: [] }))
      ]);
      const renList = renRes.rows._array || Array.from(renRes.rows || []);
      const leaseList = leaseRes.rows._array || Array.from(leaseRes.rows || []);
      setRenewals(renList);
      setLeases(leaseList);
    } catch (_err) {
      toast.error("Failed to load lease renewals");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, [companyId]);
  const stats = useMemo(() => {
    const total = renewals.length;
    const pending = renewals.filter((r) => (r.status || "proposal_sent") === "proposal_sent" || r.status === "in_negotiation").length;
    const approved = renewals.filter((r) => r.status === "accepted").length;
    const avgIncrease = renewals.length > 0 ? renewals.reduce((acc, r) => acc + (Number(r.proposed_rent || 0) - Number(r.current_rent || 0)), 0) / renewals.length : 0;
    return { total, pending, approved, avgIncrease };
  }, [renewals]);
  const filteredRenewals = useMemo(() => {
    return renewals.filter((r) => {
      const matchSearch = !search || (r.tenant_name || "").toLowerCase().includes(search.toLowerCase()) || (r.property_address || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || (r.status || "proposal_sent") === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [renewals, search, statusFilter]);
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      leaseId: "",
      tenantName: "",
      propertyAddress: "",
      currentRent: 2500,
      proposedRent: 2750,
      expirationDate: format(new Date((/* @__PURE__ */ new Date()).setMonth((/* @__PURE__ */ new Date()).getMonth() + 2)), "yyyy-MM-dd"),
      newTermMonths: 12,
      status: "proposal_sent",
      notes: ""
    });
    setShowFormSheet(true);
  };
  const handleOpenEdit = (r) => {
    setEditingId(r.id);
    setFormData({
      leaseId: r.lease_id || "",
      tenantName: r.tenant_name || "",
      propertyAddress: r.property_address || "",
      currentRent: r.current_rent || 0,
      proposedRent: r.proposed_rent || 0,
      expirationDate: r.expiration_date || "",
      newTermMonths: r.new_term_months || 12,
      status: r.status || "proposal_sent",
      notes: r.notes || ""
    });
    setShowFormSheet(true);
  };
  const handleSaveRenewal = async (e) => {
    e.preventDefault();
    if (!formData.tenantName || !formData.propertyAddress) {
      toast.error("Tenant name and property address are required");
      return;
    }
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_lease_renewals SET
            lease_id = ?, tenant_name = ?, property_address = ?, current_rent = ?,
            proposed_rent = ?, expiration_date = ?, new_term_months = ?, status = ?, notes = ?
          WHERE id = ? AND company_id = ?`,
          [
            formData.leaseId || null,
            formData.tenantName,
            formData.propertyAddress,
            Number(formData.currentRent) || 0,
            Number(formData.proposedRent) || 0,
            formData.expirationDate,
            Number(formData.newTermMonths) || 12,
            formData.status,
            formData.notes || null,
            editingId,
            companyId
          ]
        );
        toast.success("Lease renewal proposal updated");
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_lease_renewals (
            id, created_at, company_id, lease_id, tenant_name, property_address,
            current_rent, proposed_rent, expiration_date, new_term_months, status, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId,
            now,
            companyId,
            formData.leaseId || null,
            formData.tenantName,
            formData.propertyAddress,
            Number(formData.currentRent) || 0,
            Number(formData.proposedRent) || 0,
            formData.expirationDate,
            Number(formData.newTermMonths) || 12,
            formData.status,
            formData.notes || null
          ]
        );
        toast.success("Lease renewal proposal created");
      }
      setShowFormSheet(false);
      fetchData();
      if (inspectorRenewal && inspectorRenewal.id === editingId) {
        setInspectorRenewal((prev) => ({ ...prev, ...formData }));
      }
    } catch (_err) {
      toast.error("Failed to save renewal proposal");
    }
  };
  const handleDeleteRenewal = async () => {
    if (!deleteTarget) return;
    try {
      await powerSync.execute(
        `DELETE FROM univ_re_lease_renewals WHERE id = ? AND company_id = ?`,
        [deleteTarget.id, companyId]
      );
      toast.success("Renewal proposal deleted");
      setDeleteTarget(null);
      if (inspectorRenewal?.id === deleteTarget.id) setInspectorRenewal(null);
      fetchData();
    } catch (_err) {
      toast.error("Failed to delete renewal");
    }
  };
  const handleStartCallWithTenant = (tenantName) => {
    const roomName = `tenant-renewal-${companyId.slice(0, 6)}-${generateUUID().slice(0, 6)}`;
    const url = `https://meet.ffmuc.net/${roomName}`;
    joinRoom(url);
    toast.success(`Starting live renewal video consultation for ${tenantName}`);
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20", children: /* @__PURE__ */ jsx(FileCheck, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: "Lease Renewals & Expiry Hub" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "Automated expiration countdowns, rent adjustment proposals, and direct tenant consultation" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: fetchData,
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
            className: "h-9 px-4 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
              "New Renewal Proposal"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Total Renewals" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-foreground", children: stats.total }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "In active renewal cycle" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(Calendar, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Pending Review" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-amber-600 dark:text-amber-400", children: stats.pending }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-amber-600/80", children: "Negotiations & sent offers" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(Clock, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Approved Renewals" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-emerald-600 dark:text-emerald-400", children: stats.approved }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-emerald-600/80", children: "Contracts extended" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Avg Rent Increase" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-foreground", children: formatCurrency(stats.avgIncrease, "USD") }),
          /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5", children: [
            /* @__PURE__ */ jsx(ArrowUpRight, { className: "h-3 w-3" }),
            " Lift per renewal"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(DollarSign, { className: "h-5 w-5" }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-xs", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-1 items-center gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative flex-1 max-w-md", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "Search tenant name or property address...",
              value: search,
              onChange: (e) => setSearch(e.target.value),
              className: "pl-9 h-9 text-xs bg-background"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 text-xs w-[170px] bg-background", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Filter Status" }) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "all", className: "text-xs", children: "All Statuses" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "proposal_sent", className: "text-xs", children: "Proposal Sent" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "in_negotiation", className: "text-xs", children: "In Negotiation" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "accepted", className: "text-xs", children: "Approved" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "declined", className: "text-xs", children: "Notice Given / Expired" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 self-end md:self-auto", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setViewMode("grid"),
            className: cn(
              "p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
              viewMode === "grid" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            ),
            title: "Grid View",
            children: [
              /* @__PURE__ */ jsx(Grid, { className: "h-3.5 w-3.5" }),
              /* @__PURE__ */ jsx("span", { className: "text-[11px] hidden sm:inline", children: "Grid" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setViewMode("list"),
            className: cn(
              "p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
              viewMode === "list" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            ),
            title: "List View",
            children: [
              /* @__PURE__ */ jsx(List, { className: "h-3.5 w-3.5" }),
              /* @__PURE__ */ jsx("span", { className: "text-[11px] hidden sm:inline", children: "List" })
            ]
          }
        )
      ] })
    ] }),
    filteredRenewals.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-16 border border-dashed border-border rounded-2xl bg-card/40", children: [
      /* @__PURE__ */ jsx(FileCheck, { className: "h-10 w-10 mx-auto text-muted-foreground/50 mb-3" }),
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-foreground", children: "No renewal proposals found" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1 max-w-sm mx-auto", children: "No active lease expiration proposals match your search criteria." }),
      /* @__PURE__ */ jsxs(Button, { onClick: handleOpenCreate, size: "sm", className: "mt-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white", children: [
        /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5 mr-1" }),
        " Create Proposal"
      ] })
    ] }) : viewMode === "grid" ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5", children: filteredRenewals.map((r) => {
      const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.proposal_sent;
      const bannerColor = "from-emerald-800 via-emerald-700 to-emerald-600";
      const delta = (r.proposed_rent || 0) - (r.current_rent || 0);
      const daysLeft = r.expiration_date ? differenceInDays(new Date(r.expiration_date), /* @__PURE__ */ new Date()) : null;
      return /* @__PURE__ */ jsxs(
        "div",
        {
          onClick: () => setInspectorRenewal(r),
          className: "group relative flex flex-col rounded-2xl border border-border/60 hover:border-emerald-500/50 bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer",
          children: [
            /* @__PURE__ */ jsxs("div", { className: cn("relative h-28 flex flex-col justify-between p-4 overflow-hidden bg-gradient-to-br", bannerColor), children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-10", style: { backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "28px 28px" } }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between relative z-10", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm", children: "Renewal Proposal" }),
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm", children: [
                  /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-white animate-pulse" }),
                  st.label
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-end justify-between relative z-10", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-white/70 text-[9px] font-semibold uppercase tracking-widest mb-0.5", children: "Proposed Rent" }),
                  /* @__PURE__ */ jsxs("p", { className: "text-2xl font-extrabold text-white tracking-tight", children: [
                    formatCurrency(r.proposed_rent, "USD"),
                    " ",
                    /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-white/80", children: "/mo" })
                  ] })
                ] }),
                daysLeft !== null && /* @__PURE__ */ jsx("span", { className: cn(
                  "text-[10px] font-extrabold px-2.5 py-1 rounded-lg backdrop-blur-sm",
                  daysLeft < 30 ? "bg-amber-400 text-slate-900" : "bg-white/20 text-white"
                ), children: daysLeft > 0 ? `${daysLeft} Days Left` : "Expired" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-4 flex flex-col gap-3 flex-1 justify-between", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "font-bold text-foreground text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1", children: r.property_address || "Prime Tenancy Property" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-[11px] text-muted-foreground mt-1", children: [
                  /* @__PURE__ */ jsx(User, { className: "h-3 w-3 text-emerald-500 shrink-0" }),
                  /* @__PURE__ */ jsxs("span", { className: "truncate", children: [
                    "Tenant: ",
                    /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: r.tenant_name || "Assigned Tenant" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/60 text-center font-mono", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[9px] uppercase text-muted-foreground block mb-0.5", children: "Current Rate" }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-muted-foreground", children: formatCurrency(r.current_rent, "USD") })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[9px] uppercase text-emerald-600 dark:text-emerald-400 block mb-0.5", children: "Proposed Rate" }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-extrabold text-emerald-600 dark:text-emerald-400", children: formatCurrency(r.proposed_rent, "USD") })
                ] })
              ] }),
              delta !== 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[11px] px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground font-medium", children: "Monthly Adjustment" }),
                /* @__PURE__ */ jsx("span", { className: "font-bold font-mono text-emerald-700 dark:text-emerald-400", children: delta > 0 ? `+${formatCurrency(delta, "USD")} (+${Math.round(delta / (r.current_rent || 1) * 100)}%)` : formatCurrency(delta, "USD") })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "pt-2 border-t border-border/50 flex items-center justify-between mt-auto", children: [
                /* @__PURE__ */ jsxs(
                  Button,
                  {
                    size: "sm",
                    variant: "outline",
                    className: "h-7 text-[11px] font-semibold gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10",
                    onClick: (e) => {
                      e.stopPropagation();
                      handleStartCallWithTenant(r.tenant_name);
                    },
                    children: [
                      /* @__PURE__ */ jsx(Phone, { className: "h-3 w-3" }),
                      " Call Tenant"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", onClick: (e) => e.stopPropagation(), children: [
                  /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-muted-foreground hover:text-emerald-600", onClick: () => setInspectorRenewal(r), title: "Inspect", children: /* @__PURE__ */ jsx(Eye, { className: "h-3.5 w-3.5" }) }),
                  /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-muted-foreground hover:text-foreground", onClick: () => handleOpenEdit(r), title: "Edit", children: /* @__PURE__ */ jsx(Edit, { className: "h-3.5 w-3.5" }) }),
                  /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-rose-500/70 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30", onClick: () => setDeleteTarget(r), title: "Delete", children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }) })
                ] })
              ] })
            ] })
          ]
        },
        r.id
      );
    }) }) : (
      /* High Density Table View */
      /* @__PURE__ */ jsx("div", { className: "border border-border rounded-xl bg-card overflow-hidden shadow-xs", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-border bg-muted/40 text-muted-foreground font-medium", children: [
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Property Address" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Tenant" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Current Rent" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Proposed Rent" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Expiration" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4 text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border", children: filteredRenewals.map((r) => {
          const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.proposal_sent;
          return /* @__PURE__ */ jsxs(
            "tr",
            {
              className: "hover:bg-muted/30 transition-colors cursor-pointer group",
              onClick: () => setInspectorRenewal(r),
              children: [
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors", children: r.property_address || "Property Address" }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 text-foreground font-medium", children: r.tenant_name || "Tenant" }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-mono", children: formatCurrency(r.current_rent, "USD") }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-mono font-extrabold text-emerald-600 dark:text-emerald-400", children: formatCurrency(r.proposed_rent, "USD") }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-mono text-muted-foreground", children: r.expiration_date || "N/A" }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4", children: /* @__PURE__ */ jsx(Badge, { variant: "outline", className: cn("text-[10px] font-bold border", st.badge), children: st.label }) }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 text-right", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1", children: [
                  /* @__PURE__ */ jsxs(
                    Button,
                    {
                      size: "sm",
                      variant: "outline",
                      className: "h-7 text-[10px] gap-1 border-emerald-500/30 text-emerald-600",
                      onClick: () => handleStartCallWithTenant(r.tenant_name),
                      children: [
                        /* @__PURE__ */ jsx(Phone, { className: "h-3 w-3" }),
                        " Call"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "icon",
                      className: "h-7 w-7",
                      onClick: () => setInspectorRenewal(r),
                      children: /* @__PURE__ */ jsx(Eye, { className: "h-3.5 w-3.5 text-muted-foreground" })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "icon",
                      className: "h-7 w-7",
                      onClick: () => handleOpenEdit(r),
                      children: /* @__PURE__ */ jsx(Edit, { className: "h-3.5 w-3.5 text-muted-foreground" })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "icon",
                      className: "h-7 w-7 text-rose-500 hover:text-rose-600",
                      onClick: () => setDeleteTarget(r),
                      children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
                    }
                  )
                ] }) })
              ]
            },
            r.id
          );
        }) })
      ] }) }) })
    ),
    /* @__PURE__ */ jsx(Sheet, { open: showFormSheet, onOpenChange: setShowFormSheet, children: /* @__PURE__ */ jsxs(SheetContent, { className: "sm:max-w-md overflow-y-auto", children: [
      /* @__PURE__ */ jsxs(SheetHeader, { className: "mb-4", children: [
        /* @__PURE__ */ jsx(SheetTitle, { children: editingId ? "Edit Renewal Proposal" : "Create Lease Renewal Proposal" }),
        /* @__PURE__ */ jsx(SheetDescription, { children: "Propose rent adjustments and set new lease terms" })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSaveRenewal, className: "space-y-4 text-xs", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Select Existing Lease (Optional)" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: formData.leaseId,
              onValueChange: (val) => {
                const sel = leases.find((l) => l.id === val);
                if (sel) {
                  setFormData({
                    ...formData,
                    leaseId: sel.id,
                    tenantName: sel.tenant_name || "",
                    propertyAddress: sel.property_address || "",
                    currentRent: sel.monthly_rent || 0,
                    proposedRent: Math.round((sel.monthly_rent || 0) * 1.08)
                  });
                }
              },
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 text-xs mt-1", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Pick a active lease..." }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: leases.map((l) => /* @__PURE__ */ jsxs(SelectItem, { value: l.id, className: "text-xs", children: [
                  l.tenant_name,
                  " \u2014 ",
                  l.property_address
                ] }, l.id)) })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Tenant Name" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: formData.tenantName,
              onChange: (e) => setFormData({ ...formData, tenantName: e.target.value }),
              className: "h-9 text-xs mt-1",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Property Address" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: formData.propertyAddress,
              onChange: (e) => setFormData({ ...formData, propertyAddress: e.target.value }),
              className: "h-9 text-xs mt-1",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Current Rent ($)" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                value: formData.currentRent,
                onChange: (e) => setFormData({ ...formData, currentRent: e.target.value }),
                className: "h-9 text-xs mt-1",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Proposed Rent ($)" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                value: formData.proposedRent,
                onChange: (e) => setFormData({ ...formData, proposedRent: e.target.value }),
                className: "h-9 text-xs mt-1",
                required: true
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Current Lease Expiry" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "date",
                value: formData.expirationDate,
                onChange: (e) => setFormData({ ...formData, expirationDate: e.target.value }),
                className: "h-9 text-xs mt-1",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Status" }),
            /* @__PURE__ */ jsxs(
              Select,
              {
                value: formData.status,
                onValueChange: (v) => setFormData({ ...formData, status: v }),
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 text-xs mt-1", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsx(SelectItem, { value: "proposal_sent", className: "text-xs", children: "Proposal Sent" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "in_negotiation", className: "text-xs", children: "In Negotiation" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "accepted", className: "text-xs", children: "Approved" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "declined", className: "text-xs", children: "Declined / Notice" })
                  ] })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Negotiation Notes & Special Clauses" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: formData.notes,
              onChange: (e) => setFormData({ ...formData, notes: e.target.value }),
              className: "h-9 text-xs mt-1",
              placeholder: "Include maintenance upgrades or tenant incentives..."
            }
          )
        ] }),
        /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white mt-2", children: "Save Proposal" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Sheet, { open: !!inspectorRenewal, onOpenChange: (open) => !open && setInspectorRenewal(null), children: /* @__PURE__ */ jsx(SheetContent, { className: "sm:max-w-xl overflow-y-auto p-0 flex flex-col font-sans", children: inspectorRenewal && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs(SheetHeader, { className: "p-6 border-b border-border bg-muted/20", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs uppercase font-mono tracking-wider", children: "Tenancy Renewal" }),
          /* @__PURE__ */ jsx(
            Badge,
            {
              variant: "outline",
              className: cn("text-xs font-medium border gap-1.5", (STATUS_CONFIG[inspectorRenewal.status] || STATUS_CONFIG.proposal_sent).badge),
              children: (STATUS_CONFIG[inspectorRenewal.status] || STATUS_CONFIG.proposal_sent).label
            }
          )
        ] }),
        /* @__PURE__ */ jsx(SheetTitle, { className: "text-xl font-bold text-foreground mt-2", children: inspectorRenewal.tenant_name }),
        /* @__PURE__ */ jsxs(SheetDescription, { className: "text-xs flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(Building2, { className: "h-3.5 w-3.5 text-muted-foreground" }),
          inspectorRenewal.property_address
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6 flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase font-bold text-muted-foreground tracking-wider", children: "Proposed Monthly Rent" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-emerald-600 dark:text-emerald-400", children: formatCurrency(inspectorRenewal.proposed_rent, "USD") })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase font-semibold text-muted-foreground", children: "Current Rent" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-foreground", children: formatCurrency(inspectorRenewal.current_rent, "USD") })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl border border-border bg-card space-y-3", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: "Tenant Consultation" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Connect with the tenant in a live audio/video session to review terms." }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              onClick: () => handleStartCallWithTenant(inspectorRenewal.tenant_name),
              className: "w-full h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2",
              children: [
                /* @__PURE__ */ jsx(Phone, { className: "h-4 w-4" }),
                " Start Live Consultation Call"
              ]
            }
          )
        ] }),
        inspectorRenewal.notes && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: "Notes & Terms" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-foreground/90 bg-muted/30 p-3.5 rounded-lg border border-border leading-relaxed", children: inspectorRenewal.notes })
        ] })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!deleteTarget, onOpenChange: (open) => !open && setDeleteTarget(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Delete Renewal Proposal" }),
        /* @__PURE__ */ jsxs(AlertDialogDescription, { children: [
          "Are you sure you want to remove the renewal proposal for ",
          deleteTarget?.tenant_name,
          "?"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Cancel" }),
        /* @__PURE__ */ jsx(AlertDialogAction, { onClick: handleDeleteRenewal, className: "bg-rose-600 hover:bg-rose-700 text-white", children: "Delete Proposal" })
      ] })
    ] }) })
  ] });
}
