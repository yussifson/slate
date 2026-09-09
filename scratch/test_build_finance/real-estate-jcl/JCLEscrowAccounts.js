import { jsx, jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useMemo } from "react";
import {
  Lock,
  Plus,
  Edit,
  Trash2,
  Search,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Shield,
  Building2,
  Eye,
  User,
  FileText
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
  held: { label: "Funds Held in Escrow", badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30", dot: "bg-amber-500" },
  released: { label: "Released / Closing Finalized", badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30", dot: "bg-emerald-500" },
  refunded: { label: "Refunded / Contract Terminated", badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30", dot: "bg-rose-500" },
  disputed: { label: "Disputed Hold", badge: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30", dot: "bg-purple-500" }
};
export default function JCLEscrowAccounts() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();
  const [escrows, setEscrows] = useState([]);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [inspectorEscrow, setInspectorEscrow] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    escrowType: "earnest_money",
    escrowAmount: 15e3,
    buyerName: "",
    sellerName: "",
    propertyId: "",
    propertyAddress: "",
    escrowAgentName: "",
    escrowAgentCompany: "",
    releaseDate: format(new Date(Date.now() + 30 * 864e5), "yyyy-MM-dd"),
    releaseConditions: "Satisfactory home inspection & title search clearance",
    releaseStatus: "held"
  });
  const fetchEscrowsData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const [escRes, propRes] = await Promise.all([
        powerSync.execute("SELECT * FROM univ_re_escrow_accounts WHERE company_id = ? ORDER BY created_at DESC", [companyId]),
        powerSync.execute("SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY address ASC", [companyId]).catch(() => ({ rows: [] }))
      ]);
      setEscrows(escRes.rows._array || Array.from(escRes.rows || []));
      setProperties(propRes.rows._array || Array.from(propRes.rows || []));
    } catch (_err) {
      toast.error("Failed to load escrow accounts");
    }
    setIsLoading(false);
  };
  useEffect(() => {
    fetchEscrowsData();
  }, [companyId]);
  const stats = useMemo(() => {
    const totalHeld = escrows.filter((e) => e.release_status === "held").reduce((sum, e) => sum + (Number(e.escrow_amount) || 0), 0);
    const totalReleased = escrows.filter((e) => e.release_status === "released").reduce((sum, e) => sum + (Number(e.escrow_amount) || 0), 0);
    const totalCount = escrows.length;
    const activeCount = escrows.filter((e) => e.release_status === "held").length;
    return { totalHeld, totalReleased, totalCount, activeCount };
  }, [escrows]);
  const filteredEscrows = useMemo(() => {
    return escrows.filter((e) => {
      const matchSearch = !search || e.escrow_agent_name?.toLowerCase().includes(search.toLowerCase()) || e.property_address?.toLowerCase().includes(search.toLowerCase()) || e.buyer_name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || e.release_status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [escrows, search, statusFilter]);
  const handleSaveEscrow = async (e) => {
    e.preventDefault();
    if (!formData.escrowAmount || !formData.propertyAddress) {
      toast.error("Escrow amount and property address are required");
      return;
    }
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_escrow_accounts SET
            escrow_type = ?, escrow_amount = ?, buyer_name = ?, seller_name = ?,
            property_id = ?, property_address = ?, escrow_agent_name = ?,
            escrow_agent_company = ?, release_date = ?, release_conditions = ?, release_status = ?
          WHERE id = ? AND company_id = ?`,
          [
            formData.escrowType,
            Number(formData.escrowAmount) || 0,
            formData.buyerName || null,
            formData.sellerName || null,
            formData.propertyId || null,
            formData.propertyAddress,
            formData.escrowAgentName || null,
            formData.escrowAgentCompany || null,
            formData.releaseDate || null,
            formData.releaseConditions || null,
            formData.releaseStatus || "held",
            editingId,
            companyId
          ]
        );
        toast.success("Escrow record updated");
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_escrow_accounts (
            id, created_at, company_id, escrow_type, escrow_amount, buyer_name,
            seller_name, property_id, property_address, escrow_agent_name,
            escrow_agent_company, release_date, release_conditions, release_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId,
            now,
            companyId,
            formData.escrowType,
            Number(formData.escrowAmount) || 0,
            formData.buyerName || null,
            formData.sellerName || null,
            formData.propertyId || null,
            formData.propertyAddress,
            formData.escrowAgentName || null,
            formData.escrowAgentCompany || null,
            formData.releaseDate || null,
            formData.releaseConditions || null,
            formData.releaseStatus || "held"
          ]
        );
        toast.success("Earnest escrow account registered");
      }
      setShowForm(false);
      fetchEscrowsData();
    } catch (_err) {
      toast.error("Failed to save escrow account");
    }
  };
  const handleStatusChange = async (id, newStatus) => {
    try {
      await powerSync.execute(
        `UPDATE univ_re_escrow_accounts SET release_status = ? WHERE id = ? AND company_id = ?`,
        [newStatus, id, companyId]
      );
      toast.success(`Escrow status changed to ${newStatus}`);
      fetchEscrowsData();
    } catch (_err) {
      toast.error("Failed to update escrow status");
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20", children: /* @__PURE__ */ jsx(Lock, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: "Earnest Money & Escrow Vault" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "Closing deposits, third-party escrow agent holds, and automated disbursement conditions" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: fetchEscrowsData,
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
            onClick: () => {
              setEditingId(null);
              setFormData({
                escrowType: "earnest_money",
                escrowAmount: 15e3,
                buyerName: "",
                sellerName: "",
                propertyId: properties[0]?.id || "",
                propertyAddress: properties[0]?.address || "",
                escrowAgentName: "",
                escrowAgentCompany: "",
                releaseDate: format(new Date(Date.now() + 30 * 864e5), "yyyy-MM-dd"),
                releaseConditions: "Satisfactory home inspection & title clearance",
                releaseStatus: "held"
              });
              setShowForm(true);
            },
            size: "sm",
            className: "h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 gap-1.5",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
              "New Escrow Account"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Total Held Funds" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-amber-600 dark:text-amber-400", children: formatCurrency(stats.totalHeld, "USD") }),
          /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-muted-foreground", children: [
            stats.activeCount,
            " active earnest holds"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(Lock, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Released at Closing" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-emerald-600 dark:text-emerald-400", children: formatCurrency(stats.totalReleased, "USD") }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-emerald-600/80", children: "Successfully disbursed" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Total Escrow Vaults" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-foreground", children: stats.totalCount }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Deal escrow records" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(Shield, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Avg Earnest Deposit" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-foreground", children: formatCurrency(stats.totalCount > 0 ? (stats.totalHeld + stats.totalReleased) / stats.totalCount : 0, "USD") }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Per deal security" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(DollarSign, { className: "h-5 w-5" }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card border border-border/80 p-3 rounded-xl shadow-xs", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-1 items-center gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-w-[220px]", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "Search by property, buyer, escrow agent...",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            className: "pl-9 h-9 text-xs bg-background"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 text-xs w-[170px] bg-background", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Escrow Status" }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", className: "text-xs", children: "All Statuses" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "held", className: "text-xs", children: "Held in Escrow" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "released", className: "text-xs", children: "Released" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "refunded", className: "text-xs", children: "Refunded" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "disputed", className: "text-xs", children: "Disputed" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "border border-border rounded-xl bg-card overflow-hidden shadow-xs", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs border-collapse", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-border bg-muted/40 text-muted-foreground font-medium", children: [
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Property / Deal" }),
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Buyer / Seller" }),
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Escrow Amount" }),
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Escrow Agent" }),
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Release Date" }),
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Status" }),
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4 text-right", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border", children: filteredEscrows.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "py-8 text-center text-muted-foreground", children: "No escrow accounts found." }) }) : filteredEscrows.map((item) => {
        const st = STATUS_CONFIG[item.release_status] || STATUS_CONFIG.held;
        return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30 transition-colors", children: [
          /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-semibold text-foreground", children: item.property_address || "Property Transaction" }),
          /* @__PURE__ */ jsxs("td", { className: "py-3.5 px-4 text-foreground", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              "B: ",
              item.buyer_name || "N/A"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-muted-foreground", children: [
              "S: ",
              item.seller_name || "N/A"
            ] })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm", children: formatCurrency(item.escrow_amount, "USD") }),
          /* @__PURE__ */ jsxs("td", { className: "py-3.5 px-4 text-muted-foreground", children: [
            /* @__PURE__ */ jsx("div", { children: item.escrow_agent_name || "Title Escrow Co" }),
            /* @__PURE__ */ jsx("div", { className: "text-[10px]", children: item.escrow_agent_company })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-mono text-muted-foreground", children: item.release_date || "Target Close" }),
          /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4", children: /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: cn("text-[10px] font-medium border gap-1", st.badge), children: [
            /* @__PURE__ */ jsx("span", { className: cn("h-1.5 w-1.5 rounded-full", st.dot) }),
            st.label
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 text-right", children: /* @__PURE__ */ jsxs(
            Select,
            {
              value: item.release_status,
              onValueChange: (v) => handleStatusChange(item.id, v),
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "h-7 text-[10px] w-[110px] ml-auto", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsx(SelectItem, { value: "held", className: "text-xs", children: "Hold" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "released", className: "text-xs", children: "Release" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "refunded", className: "text-xs", children: "Refund" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "disputed", className: "text-xs", children: "Dispute" })
                ] })
              ]
            }
          ) })
        ] }, item.id);
      }) })
    ] }) }) }),
    /* @__PURE__ */ jsx(Sheet, { open: showForm, onOpenChange: setShowForm, children: /* @__PURE__ */ jsxs(SheetContent, { className: "sm:max-w-md overflow-y-auto", children: [
      /* @__PURE__ */ jsxs(SheetHeader, { className: "mb-4", children: [
        /* @__PURE__ */ jsx(SheetTitle, { children: "Register Earnest Escrow" }),
        /* @__PURE__ */ jsx(SheetDescription, { children: "Log earnest deposit and third-party escrow parameters" })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSaveEscrow, className: "space-y-4 text-xs", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Property Address" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: formData.propertyAddress,
              onChange: (e) => setFormData({ ...formData, propertyAddress: e.target.value }),
              placeholder: "e.g. 742 Evergreen Terrace",
              className: "h-9 text-xs mt-1",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Buyer Name" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: formData.buyerName,
                onChange: (e) => setFormData({ ...formData, buyerName: e.target.value }),
                placeholder: "Buyer full name",
                className: "h-9 text-xs mt-1"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Seller Name" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: formData.sellerName,
                onChange: (e) => setFormData({ ...formData, sellerName: e.target.value }),
                placeholder: "Seller full name",
                className: "h-9 text-xs mt-1"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Escrow Amount ($)" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                value: formData.escrowAmount,
                onChange: (e) => setFormData({ ...formData, escrowAmount: e.target.value }),
                className: "h-9 text-xs mt-1",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Target Release Date" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "date",
                value: formData.releaseDate,
                onChange: (e) => setFormData({ ...formData, releaseDate: e.target.value }),
                className: "h-9 text-xs mt-1"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Escrow Agent / Title Company" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: formData.escrowAgentName,
              onChange: (e) => setFormData({ ...formData, escrowAgentName: e.target.value }),
              placeholder: "First American Title / John Doe Agent",
              className: "h-9 text-xs mt-1"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Release Conditions" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: formData.releaseConditions,
              onChange: (e) => setFormData({ ...formData, releaseConditions: e.target.value }),
              placeholder: "Clear title, signed closing disclosure",
              className: "h-9 text-xs mt-1"
            }
          )
        ] }),
        /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white mt-2", children: "Establish Escrow" })
      ] })
    ] }) })
  ] });
}
