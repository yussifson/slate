import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useMemo } from "react";
import {
  DollarSign,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  Grid,
  List,
  Building2,
  XCircle,
  ArrowRight
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
  pending: { label: "Under Consideration", badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  accepted: { label: "Offer Accepted", badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  countered: { label: "Counter-Offered", badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  rejected: { label: "Offer Declined", badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30" },
  expired: { label: "Offer Expired", badge: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30" }
};
export default function JCLOffers() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();
  const [offers, setOffers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFormSheet, setShowFormSheet] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [inspectorOffer, setInspectorOffer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    propertyId: "",
    propertyAddress: "",
    buyerId: "",
    buyerName: "",
    offerAmount: 45e4,
    earnestMoney: 25e3,
    contingencies: "Financing (21 days), Appraisal, Home Inspection (10 days)",
    offerDate: format(/* @__PURE__ */ new Date(), "yyyy-MM-dd"),
    expirationDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3), "yyyy-MM-dd"),
    status: "pending",
    agentName: user?.user_metadata?.full_name || "Assigned Broker",
    notes: ""
  });
  const fetchOffersData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const [offRes, propRes, clientRes] = await Promise.all([
        powerSync.execute("SELECT * FROM univ_re_offers WHERE company_id = ? ORDER BY created_at DESC", [companyId]),
        powerSync.execute("SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY address ASC", [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute("SELECT * FROM univ_re_clients WHERE company_id = ? ORDER BY name ASC", [companyId]).catch(() => ({ rows: [] }))
      ]);
      const offList = offRes.rows._array || Array.from(offRes.rows || []);
      const propList = propRes.rows._array || Array.from(propRes.rows || []);
      const clientList = clientRes.rows._array || Array.from(clientRes.rows || []);
      setOffers(offList);
      setProperties(propList);
      setClients(clientList);
    } catch (_err) {
      toast.error("Failed to load offers");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchOffersData();
  }, [companyId]);
  const stats = useMemo(() => {
    const total = offers.length;
    const pending = offers.filter((o) => o.status === "pending").length;
    const accepted = offers.filter((o) => o.status === "accepted").length;
    const totalOfferedValue = offers.reduce((sum, o) => sum + (Number(o.offer_amount) || 0), 0);
    const acceptanceRate = total > 0 ? Math.round(accepted / total * 100) : 0;
    return { total, pending, accepted, totalOfferedValue, acceptanceRate };
  }, [offers]);
  const filteredOffers = useMemo(() => {
    return offers.filter((o) => {
      const matchSearch = !search || o.property_address?.toLowerCase().includes(search.toLowerCase()) || o.buyer_name?.toLowerCase().includes(search.toLowerCase()) || o.agent_name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [offers, search, statusFilter]);
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      propertyId: properties[0]?.id || "",
      propertyAddress: properties[0]?.address || "",
      buyerId: clients[0]?.id || "",
      buyerName: clients[0]?.name || "",
      offerAmount: 45e4,
      earnestMoney: 25e3,
      contingencies: "Financing (21 days), Appraisal, Home Inspection (10 days)",
      offerDate: format(/* @__PURE__ */ new Date(), "yyyy-MM-dd"),
      expirationDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3), "yyyy-MM-dd"),
      status: "pending",
      agentName: user?.user_metadata?.full_name || "Assigned Broker",
      notes: ""
    });
    setShowFormSheet(true);
  };
  const handleOpenEdit = (o) => {
    setEditingId(o.id);
    setFormData({
      propertyId: o.property_id || "",
      propertyAddress: o.property_address || "",
      buyerId: o.buyer_id || "",
      buyerName: o.buyer_name || "",
      offerAmount: o.offer_amount || 0,
      earnestMoney: o.earnest_money || 0,
      contingencies: o.contingencies || "",
      offerDate: o.offer_date || "",
      expirationDate: o.expiration_date || "",
      status: o.status || "pending",
      agentName: o.agent_name || "",
      notes: o.notes || ""
    });
    setShowFormSheet(true);
  };
  const handleSaveOffer = async (e) => {
    e.preventDefault();
    if (!formData.propertyAddress || !formData.buyerName) {
      toast.error("Property address and buyer name are required");
      return;
    }
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_offers SET
            property_id = ?, property_address = ?, buyer_id = ?, buyer_name = ?,
            offer_amount = ?, earnest_money = ?, contingencies = ?, offer_date = ?,
            expiration_date = ?, status = ?, agent_name = ?, notes = ?, updated_at = ?
          WHERE id = ? AND company_id = ?`,
          [
            formData.propertyId || null,
            formData.propertyAddress,
            formData.buyerId || null,
            formData.buyerName,
            Number(formData.offerAmount) || 0,
            Number(formData.earnestMoney) || 0,
            formData.contingencies || null,
            formData.offerDate,
            formData.expirationDate || null,
            formData.status,
            formData.agentName || null,
            formData.notes || null,
            now,
            editingId,
            companyId
          ]
        );
        toast.success("Offer updated");
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_offers (
            id, created_at, company_id, property_id, property_address,
            buyer_id, buyer_name, offer_amount, earnest_money, contingencies,
            offer_date, expiration_date, status, agent_id, agent_name, notes, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId,
            now,
            companyId,
            formData.propertyId || null,
            formData.propertyAddress,
            formData.buyerId || null,
            formData.buyerName,
            Number(formData.offerAmount) || 0,
            Number(formData.earnestMoney) || 0,
            formData.contingencies || null,
            formData.offerDate,
            formData.expirationDate || null,
            formData.status,
            user?.id || null,
            formData.agentName || null,
            formData.notes || null,
            now
          ]
        );
        toast.success("Purchase offer registered");
      }
      setShowFormSheet(false);
      fetchOffersData();
      if (inspectorOffer && inspectorOffer.id === editingId) {
        setInspectorOffer((prev) => ({ ...prev, ...formData }));
      }
    } catch (_err) {
      toast.error("Failed to save offer");
    }
  };
  const handleUpdateStatus = async (offerId, newStatus) => {
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      await powerSync.execute(
        `UPDATE univ_re_offers SET status = ?, updated_at = ? WHERE id = ? AND company_id = ?`,
        [newStatus, now, offerId, companyId]
      );
      toast.success(`Offer marked as ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      fetchOffersData();
      if (inspectorOffer && inspectorOffer.id === offerId) {
        setInspectorOffer((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (_err) {
      toast.error("Failed to update status");
    }
  };
  const handleDeleteOffer = async () => {
    if (!deleteTarget) return;
    try {
      await powerSync.execute(
        `DELETE FROM univ_re_offers WHERE id = ? AND company_id = ?`,
        [deleteTarget.id, companyId]
      );
      toast.success("Offer removed");
      setDeleteTarget(null);
      if (inspectorOffer?.id === deleteTarget.id) setInspectorOffer(null);
      fetchOffersData();
    } catch (_err) {
      toast.error("Failed to delete offer");
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20", children: /* @__PURE__ */ jsx(DollarSign, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: "Purchase Offers & Negotiations" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "Purchase bids, earnest deposits, counter-offers, and buyer contingency tracking" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: fetchOffersData,
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
              "Create Offer"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Active Offers" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-foreground", children: stats.pending }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "In active review / counter" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(AlertCircle, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Accepted Offers" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-emerald-600 dark:text-emerald-400", children: stats.accepted }),
          /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-emerald-600/80", children: [
            stats.acceptanceRate,
            "% acceptance rate"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Total Offered Value" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-foreground truncate", children: formatCurrency(stats.totalOfferedValue, "USD") }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Cumulative bid volume" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(DollarSign, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Total Offers Logged" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-foreground", children: stats.total }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Historical bid records" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(Building2, { className: "h-5 w-5" }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card border border-border/80 p-3 rounded-xl shadow-xs", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-1 items-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-w-[220px]", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "Search by property, buyer, agent...",
              value: search,
              onChange: (e) => setSearch(e.target.value),
              className: "pl-9 h-9 text-xs bg-background"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 text-xs w-[170px] bg-background", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Status" }) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "all", className: "text-xs", children: "All Offer Statuses" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "pending", className: "text-xs", children: "Under Consideration" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "accepted", className: "text-xs", children: "Accepted" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "countered", className: "text-xs", children: "Countered" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "rejected", className: "text-xs", children: "Declined" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "expired", className: "text-xs", children: "Expired" })
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
    filteredOffers.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-16 border border-dashed border-border rounded-2xl bg-card/40", children: [
      /* @__PURE__ */ jsx(DollarSign, { className: "h-10 w-10 mx-auto text-muted-foreground/50 mb-3" }),
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-foreground", children: "No purchase offers found" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1 max-w-sm mx-auto", children: "No purchase bids match your search filters." }),
      /* @__PURE__ */ jsxs(Button, { onClick: handleOpenCreate, size: "sm", className: "mt-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white", children: [
        /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5 mr-1" }),
        " Create Offer"
      ] })
    ] }) : viewMode === "grid" ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5", children: filteredOffers.map((offer) => {
      const st = STATUS_CONFIG[offer.status] || STATUS_CONFIG.pending;
      const bannerColor = "from-emerald-800 via-emerald-700 to-emerald-600";
      const buyerInitials = (offer.buyer_name || "B").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
      return /* @__PURE__ */ jsxs(
        "div",
        {
          onClick: () => setInspectorOffer(offer),
          className: "group relative flex flex-col rounded-2xl border border-border/60 hover:border-emerald-500/50 bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer",
          children: [
            /* @__PURE__ */ jsxs("div", { className: cn("relative h-28 flex flex-col justify-between p-4 overflow-hidden bg-gradient-to-br", bannerColor), children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-10", style: { backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "28px 28px" } }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between relative z-10", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm", children: "Purchase Proposal" }),
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm", children: [
                  /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-white animate-pulse" }),
                  st.label
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
                /* @__PURE__ */ jsx("p", { className: "text-white/70 text-[9px] font-semibold uppercase tracking-widest mb-0.5", children: "Offered Price" }),
                /* @__PURE__ */ jsx("p", { className: "text-2xl font-extrabold text-white tracking-tight", children: formatCurrency(offer.offer_amount, "USD") })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-4 flex flex-col gap-3 flex-1 justify-between", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "font-bold text-foreground text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1", children: offer.property_address }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[11px] text-muted-foreground mt-1", children: [
                  /* @__PURE__ */ jsxs("span", { children: [
                    "Buyer: ",
                    /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: offer.buyer_name })
                  ] }),
                  offer.earnest_money > 0 && /* @__PURE__ */ jsxs("span", { className: "font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20", children: [
                    formatCurrency(offer.earnest_money, "USD"),
                    " Deposit"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 divide-x divide-border/60 rounded-xl border border-border/60 bg-muted/30 overflow-hidden text-center", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center py-2.5 gap-0.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[8px] uppercase font-semibold text-muted-foreground tracking-wider", children: "Offer Date" }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-foreground", children: offer.offer_date || "N/A" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center py-2.5 gap-0.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[8px] uppercase font-semibold text-muted-foreground tracking-wider", children: "Expiration Date" }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-foreground", children: offer.expiration_date || "N/A" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "pt-2 border-t border-border/50 flex items-center justify-between mt-auto", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0", children: [
                  /* @__PURE__ */ jsx("div", { className: "h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white text-[9px] font-extrabold shrink-0", children: buyerInitials }),
                  /* @__PURE__ */ jsx("span", { className: "truncate font-medium", children: offer.agent_name || "Assigned Broker" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", onClick: (e) => e.stopPropagation(), children: [
                  /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-muted-foreground hover:text-emerald-600", onClick: () => setInspectorOffer(offer), title: "Inspect", children: /* @__PURE__ */ jsx(Eye, { className: "h-3.5 w-3.5" }) }),
                  /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-muted-foreground hover:text-foreground", onClick: () => handleOpenEdit(offer), title: "Edit", children: /* @__PURE__ */ jsx(Edit, { className: "h-3.5 w-3.5" }) }),
                  /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-rose-500/70 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30", onClick: () => setDeleteTarget(offer), title: "Delete", children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }) })
                ] })
              ] })
            ] })
          ]
        },
        offer.id
      );
    }) }) : (
      /* List View */
      /* @__PURE__ */ jsx("div", { className: "border border-border rounded-xl bg-card overflow-hidden shadow-xs", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-border bg-muted/40 text-muted-foreground font-medium", children: [
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Property Address" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Buyer Name" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Offered Price" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Earnest Deposit" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Offer Date" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Expires" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4 text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border", children: filteredOffers.map((offer) => {
          const st = STATUS_CONFIG[offer.status] || STATUS_CONFIG.pending;
          return /* @__PURE__ */ jsxs(
            "tr",
            {
              className: "hover:bg-muted/30 transition-colors cursor-pointer group",
              onClick: () => setInspectorOffer(offer),
              children: [
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-semibold text-foreground group-hover:text-emerald-600 transition-colors", children: offer.property_address }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 text-foreground font-medium", children: offer.buyer_name }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400", children: formatCurrency(offer.offer_amount, "USD") }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-mono text-muted-foreground", children: formatCurrency(offer.earnest_money, "USD") }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-mono text-muted-foreground", children: offer.offer_date }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-mono text-muted-foreground", children: offer.expiration_date || "N/A" }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4", children: /* @__PURE__ */ jsx(Badge, { variant: "outline", className: cn("text-[10px] font-medium border", st.badge), children: st.label }) }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 text-right", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1", children: [
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "icon",
                      className: "h-7 w-7",
                      onClick: () => setInspectorOffer(offer),
                      children: /* @__PURE__ */ jsx(Eye, { className: "h-3.5 w-3.5 text-muted-foreground" })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "icon",
                      className: "h-7 w-7",
                      onClick: () => handleOpenEdit(offer),
                      children: /* @__PURE__ */ jsx(Edit, { className: "h-3.5 w-3.5 text-muted-foreground" })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "icon",
                      className: "h-7 w-7 text-rose-500 hover:text-rose-600",
                      onClick: () => setDeleteTarget(offer),
                      children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
                    }
                  )
                ] }) })
              ]
            },
            offer.id
          );
        }) })
      ] }) }) })
    ),
    /* @__PURE__ */ jsx(Sheet, { open: !!inspectorOffer, onOpenChange: (open) => !open && setInspectorOffer(null), children: /* @__PURE__ */ jsx(SheetContent, { className: "sm:max-w-xl overflow-y-auto p-0 flex flex-col font-sans", children: inspectorOffer && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs(SheetHeader, { className: "p-6 border-b border-border bg-muted/20", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs uppercase font-mono tracking-wider", children: "Offer Details" }),
          /* @__PURE__ */ jsx(
            Badge,
            {
              variant: "outline",
              className: cn(
                "text-xs font-medium border",
                (STATUS_CONFIG[inspectorOffer.status] || STATUS_CONFIG.pending).badge
              ),
              children: (STATUS_CONFIG[inspectorOffer.status] || STATUS_CONFIG.pending).label
            }
          )
        ] }),
        /* @__PURE__ */ jsx(SheetTitle, { className: "text-xl font-bold text-foreground mt-2", children: inspectorOffer.property_address }),
        /* @__PURE__ */ jsxs(SheetDescription, { className: "text-xs", children: [
          "Buyer: ",
          /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: inspectorOffer.buyer_name })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6 flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase font-bold text-muted-foreground tracking-wider", children: "Offer Amount" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-emerald-600 dark:text-emerald-400", children: formatCurrency(inspectorOffer.offer_amount, "USD") })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase font-semibold text-muted-foreground", children: "Earnest Money" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-foreground", children: formatCurrency(inspectorOffer.earnest_money, "USD") })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: "Negotiation Status Actions" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
            /* @__PURE__ */ jsxs(
              Button,
              {
                size: "sm",
                variant: "outline",
                className: "text-xs border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
                onClick: () => handleUpdateStatus(inspectorOffer.id, "accepted"),
                children: [
                  /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3.5 w-3.5 mr-1" }),
                  "Accept Offer"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                size: "sm",
                variant: "outline",
                className: "text-xs border-blue-500/40 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30",
                onClick: () => handleUpdateStatus(inspectorOffer.id, "countered"),
                children: [
                  /* @__PURE__ */ jsx(ArrowRight, { className: "h-3.5 w-3.5 mr-1" }),
                  "Counter Offer"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                size: "sm",
                variant: "outline",
                className: "text-xs border-rose-500/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30",
                onClick: () => handleUpdateStatus(inspectorOffer.id, "rejected"),
                children: [
                  /* @__PURE__ */ jsx(XCircle, { className: "h-3.5 w-3.5 mr-1" }),
                  "Decline Offer"
                ]
              }
            )
          ] })
        ] }),
        inspectorOffer.contingencies && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: "Contingencies & Terms" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-foreground/90 bg-muted/30 p-3.5 rounded-lg border border-border leading-relaxed", children: inspectorOffer.contingencies })
        ] }),
        inspectorOffer.notes && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: "Internal Notes" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-foreground/90 bg-muted/30 p-3.5 rounded-lg border border-border leading-relaxed", children: inspectorOffer.notes })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => handleOpenEdit(inspectorOffer),
            className: "text-xs gap-1.5",
            children: [
              /* @__PURE__ */ jsx(Edit, { className: "h-3.5 w-3.5" }),
              "Edit Offer"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            size: "sm",
            onClick: () => setInspectorOffer(null),
            className: "text-xs bg-emerald-600 hover:bg-emerald-700 text-white",
            children: "Close"
          }
        )
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx(Sheet, { open: showFormSheet, onOpenChange: setShowFormSheet, children: /* @__PURE__ */ jsxs(SheetContent, { className: "sm:max-w-xl overflow-y-auto p-0 flex flex-col font-sans", children: [
      /* @__PURE__ */ jsxs(SheetHeader, { className: "p-6 border-b border-border bg-muted/20", children: [
        /* @__PURE__ */ jsx(SheetTitle, { className: "text-lg font-bold text-foreground", children: editingId ? "Edit Purchase Offer" : "Register Purchase Offer" }),
        /* @__PURE__ */ jsx(SheetDescription, { className: "text-xs", children: "Log purchase proposal, earnest money deposit, and expiration date" })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSaveOffer, className: "p-6 space-y-4 flex-1", children: [
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
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Buyer Name *" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                required: true,
                placeholder: "e.g. Jonathan Blake",
                value: formData.buyerName,
                onChange: (e) => setFormData({ ...formData, buyerName: e.target.value }),
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
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Offer Amount ($) *" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                min: "0",
                required: true,
                value: formData.offerAmount,
                onChange: (e) => setFormData({ ...formData, offerAmount: e.target.value }),
                className: "text-xs font-bold"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Earnest Money Deposit ($)" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                min: "0",
                value: formData.earnestMoney,
                onChange: (e) => setFormData({ ...formData, earnestMoney: e.target.value }),
                className: "text-xs"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Offer Date *" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "date",
                required: true,
                value: formData.offerDate,
                onChange: (e) => setFormData({ ...formData, offerDate: e.target.value }),
                className: "text-xs"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Expiration Date" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "date",
                value: formData.expirationDate,
                onChange: (e) => setFormData({ ...formData, expirationDate: e.target.value }),
                className: "text-xs"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Offer Status" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: formData.status,
              onValueChange: (val) => setFormData({ ...formData, status: val }),
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "text-xs", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsx(SelectItem, { value: "pending", className: "text-xs", children: "Under Consideration" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "accepted", className: "text-xs", children: "Offer Accepted" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "countered", className: "text-xs", children: "Counter-Offered" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "rejected", className: "text-xs", children: "Offer Declined" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "expired", className: "text-xs", children: "Offer Expired" })
                ] })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Contingencies & Conditions" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              rows: 2,
              placeholder: "Financing, appraisal, inspection timelines...",
              value: formData.contingencies,
              onChange: (e) => setFormData({ ...formData, contingencies: e.target.value }),
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
              placeholder: "Seller response deadline, lender pre-approval notes...",
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
              children: editingId ? "Save Changes" : "Register Offer"
            }
          )
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!deleteTarget, onOpenChange: (open) => !open && setDeleteTarget(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { className: "font-sans", children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { className: "text-base font-bold", children: "Delete Offer Record?" }),
        /* @__PURE__ */ jsxs(AlertDialogDescription, { className: "text-xs", children: [
          "Are you sure you want to delete the offer for ",
          /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: deleteTarget?.property_address }),
          "?"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { className: "text-xs", children: "Cancel" }),
        /* @__PURE__ */ jsx(
          AlertDialogAction,
          {
            onClick: handleDeleteOffer,
            className: "text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold",
            children: "Confirm Delete"
          }
        )
      ] })
    ] }) })
  ] });
}
