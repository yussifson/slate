import { jsx, jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useMemo } from "react";
import {
  CreditCard,
  Calendar,
  Home,
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
  RefreshCw,
  Search,
  Eye,
  Edit,
  Trash2,
  Building2,
  Phone
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
import { toast } from "react-hot-toast";
import { formatCurrency } from "@/lib/constants";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
const STATUS_CONFIG = {
  paid: { label: "Paid in Full", badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30", dot: "bg-emerald-500" },
  pending: { label: "Payment Pending", badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30", dot: "bg-amber-500" },
  overdue: { label: "Overdue Arrears", badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30", dot: "bg-rose-500" }
};
export default function JCLRentPayments() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();
  const { joinRoom } = useVideo();
  const [payments, setPayments] = useState([]);
  const [leases, setLeases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tenantName: "",
    propertyAddress: "",
    amount: 2500,
    dueDate: format(/* @__PURE__ */ new Date(), "yyyy-MM-dd"),
    status: "pending",
    paymentMethod: "Bank Transfer"
  });
  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const [payRes, leaseRes] = await Promise.all([
        powerSync.execute("SELECT * FROM univ_re_rent_payments WHERE company_id = ? ORDER BY due_date DESC", [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute("SELECT * FROM univ_re_leases WHERE company_id = ? ORDER BY property_address ASC", [companyId]).catch(() => ({ rows: [] }))
      ]);
      setPayments(payRes.rows._array || Array.from(payRes.rows || []));
      setLeases(leaseRes.rows._array || Array.from(leaseRes.rows || []));
    } catch (_err) {
      toast.error("Failed to load rent payments");
    }
    setIsLoading(false);
  };
  useEffect(() => {
    fetchData();
  }, [companyId]);
  const stats = useMemo(() => {
    const totalCollected = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalPending = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalOverdue = payments.filter((p) => p.status === "overdue").reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return { totalCollected, totalPending, totalOverdue };
  }, [payments]);
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch = !search || (p.tenant_name || "").toLowerCase().includes(search.toLowerCase()) || (p.property_address || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || (p.status || "pending") === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [payments, search, statusFilter]);
  const handleStatusChange = async (id, newStatus) => {
    try {
      await powerSync.execute(
        `UPDATE univ_re_rent_payments SET status = ? WHERE id = ? AND company_id = ?`,
        [newStatus, id, companyId]
      );
      toast.success(`Rent payment status updated to ${newStatus}`);
      fetchData();
    } catch (_err) {
      toast.error("Failed to update status");
    }
  };
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.tenantName || !formData.propertyAddress) {
      toast.error("Tenant name and property address are required");
      return;
    }
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const newId = generateUUID();
      await powerSync.execute(
        `INSERT INTO univ_re_rent_payments (id, created_at, company_id, tenant_name, property_address, amount, due_date, status, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId, now, companyId, formData.tenantName, formData.propertyAddress, Number(formData.amount) || 0, formData.dueDate, formData.status, formData.paymentMethod]
      );
      toast.success("Rent collection entry recorded");
      setShowForm(false);
      fetchData();
    } catch (_err) {
      toast.error("Failed to record rent entry");
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-6 pb-28 w-full max-w-full space-y-6 font-sans", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20", children: /* @__PURE__ */ jsx(CreditCard, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: "Rent Roll Collection & Ledger" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "Monthly tenant rent roll collection, overdue arrears tracking, and automated digital receipts" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: fetchData, className: "h-9 px-3 text-xs gap-1.5 border-border", children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: cn("h-3.5 w-3.5", isLoading && "animate-spin") }),
          "Refresh"
        ] }),
        /* @__PURE__ */ jsxs(Button, { onClick: () => setShowForm(true), size: "sm", className: "h-9 px-4 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm", children: [
          /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
          " Record Rent Entry"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Collected Rent Roll" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-emerald-600 dark:text-emerald-400", children: formatCurrency(stats.totalCollected, "USD") }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-emerald-600/80", children: "Received this period" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Pending Collection" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-amber-600 dark:text-amber-400", children: formatCurrency(stats.totalPending, "USD") }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-amber-600/80", children: "Awaiting tenant payment" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(Clock, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Overdue Arrears" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-rose-600 dark:text-rose-400", children: formatCurrency(stats.totalOverdue, "USD") }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-rose-600/80", children: "Action required" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(AlertTriangle, { className: "h-5 w-5" }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-xs", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-1 items-center gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1 max-w-md", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "Search tenant name or property...",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            className: "pl-9 h-9 text-xs bg-background"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 text-xs w-[170px] bg-background", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Payment Status" }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", className: "text-xs", children: "All Payments" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "paid", className: "text-xs", children: "Paid in Full" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "pending", className: "text-xs", children: "Pending" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "overdue", className: "text-xs", children: "Overdue Arrears" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "border border-border rounded-xl bg-card overflow-hidden shadow-xs w-full", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto w-full", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs border-collapse", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-border bg-muted/40 text-muted-foreground font-medium", children: [
        /* @__PURE__ */ jsx("th", { className: "py-3.5 px-4", children: "Tenant Name" }),
        /* @__PURE__ */ jsx("th", { className: "py-3.5 px-4", children: "Property Address" }),
        /* @__PURE__ */ jsx("th", { className: "py-3.5 px-4", children: "Due Date" }),
        /* @__PURE__ */ jsx("th", { className: "py-3.5 px-4", children: "Amount" }),
        /* @__PURE__ */ jsx("th", { className: "py-3.5 px-4", children: "Status" }),
        /* @__PURE__ */ jsx("th", { className: "py-3.5 px-4 text-right", children: "Quick Action" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border", children: filteredPayments.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "py-12 text-center text-muted-foreground", children: "No rent payment records found." }) }) : filteredPayments.map((p) => {
        const st = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
        return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30 transition-colors", children: [
          /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-bold text-foreground", children: p.tenant_name || "Tenant" }),
          /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 text-foreground", children: p.property_address || "Unit Address" }),
          /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-mono text-muted-foreground", children: p.due_date || "N/A" }),
          /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm", children: formatCurrency(p.amount, "USD") }),
          /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4", children: /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: cn("text-[10px] font-medium border gap-1", st.badge), children: [
            /* @__PURE__ */ jsx("span", { className: cn("h-1.5 w-1.5 rounded-full", st.dot) }),
            st.label
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 text-right", children: /* @__PURE__ */ jsxs(Select, { value: p.status, onValueChange: (v) => handleStatusChange(p.id, v), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "h-7 text-[10px] w-[120px] ml-auto bg-background", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "paid", className: "text-xs", children: "Mark Paid" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "pending", className: "text-xs", children: "Mark Pending" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "overdue", className: "text-xs", children: "Mark Overdue" })
            ] })
          ] }) })
        ] }, p.id);
      }) })
    ] }) }) }),
    /* @__PURE__ */ jsx(Sheet, { open: showForm, onOpenChange: setShowForm, children: /* @__PURE__ */ jsxs(SheetContent, { className: "sm:max-w-md overflow-y-auto", children: [
      /* @__PURE__ */ jsxs(SheetHeader, { className: "mb-4", children: [
        /* @__PURE__ */ jsx(SheetTitle, { children: "Record Rent Collection" }),
        /* @__PURE__ */ jsx(SheetDescription, { children: "Log tenant rent roll payment details" })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSave, className: "space-y-4 text-xs", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Select Lease (Optional)" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: "",
              onValueChange: (val) => {
                const sel = leases.find((l) => l.id === val);
                if (sel) {
                  setFormData({
                    ...formData,
                    tenantName: sel.tenant_name || "",
                    propertyAddress: sel.property_address || "",
                    amount: sel.monthly_rent || 2500
                  });
                }
              },
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 text-xs mt-1", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Pick active lease..." }) }),
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
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Tenant Name *" }),
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
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Property Address *" }),
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
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Amount ($)" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                value: formData.amount,
                onChange: (e) => setFormData({ ...formData, amount: e.target.value }),
                className: "h-9 text-xs mt-1",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Due Date" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "date",
                value: formData.dueDate,
                onChange: (e) => setFormData({ ...formData, dueDate: e.target.value }),
                className: "h-9 text-xs mt-1",
                required: true
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white mt-2", children: "Record Rent Payment" })
      ] })
    ] }) })
  ] });
}
