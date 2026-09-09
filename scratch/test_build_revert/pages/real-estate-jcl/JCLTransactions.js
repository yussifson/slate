import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useMemo } from "react";
import {
  Banknote,
  DollarSign,
  Plus,
  Search,
  Edit,
  Trash2,
  TrendingUp,
  RefreshCw,
  Eye,
  Grid,
  List,
  CheckCircle2
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { PortalAwareItem } from "@/lib/kanbanPortal.jsx";
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
const PIPELINE_STAGES = [
  { id: "offer_accepted", label: "Offer Accepted", color: "border-orange-500/40 bg-orange-500/5", badge: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30" },
  { id: "inspection", label: "Under Inspection", color: "border-amber-500/40 bg-amber-500/5", badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  { id: "appraisal", label: "Appraisal & Title", color: "border-blue-500/40 bg-blue-500/5", badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  { id: "financing", label: "Escrow Financing", color: "border-indigo-500/40 bg-indigo-500/5", badge: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30" },
  { id: "ready_close", label: "Ready to Close", color: "border-purple-500/40 bg-purple-500/5", badge: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30" },
  { id: "closed", label: "Closed / Finalized", color: "border-emerald-500/40 bg-emerald-500/5", badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" }
];
export default function JCLTransactions() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();
  const [transactions, setTransactions] = useState([]);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("kanban");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [showFormSheet, setShowFormSheet] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [inspectorTxn, setInspectorTxn] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    propertyId: "",
    propertyAddress: "",
    sellerName: "",
    buyerName: "",
    salePrice: 5e5,
    closingDate: format(/* @__PURE__ */ new Date(), "yyyy-MM-dd"),
    agentName: user?.user_metadata?.full_name || "Assigned Broker",
    status: "offer_accepted",
    notes: ""
  });
  const fetchTransactionsData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const [txnRes, propRes] = await Promise.all([
        powerSync.execute("SELECT * FROM univ_re_transactions WHERE company_id = ? ORDER BY created_at DESC", [companyId]),
        powerSync.execute("SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY address ASC", [companyId]).catch(() => ({ rows: [] }))
      ]);
      const txnList = txnRes.rows._array || Array.from(txnRes.rows || []);
      const propList = propRes.rows._array || Array.from(propRes.rows || []);
      setTransactions(txnList);
      setProperties(propList);
    } catch (_err) {
      toast.error("Failed to load transactions");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchTransactionsData();
  }, [companyId]);
  const stats = useMemo(() => {
    const total = transactions.length;
    const totalVolume = transactions.reduce((sum, t) => sum + (Number(t.sale_price) || 0), 0);
    const closedVolume = transactions.filter((t) => t.status === "closed").reduce((sum, t) => sum + (Number(t.sale_price) || 0), 0);
    const activeDeals = transactions.filter((t) => t.status !== "closed").length;
    return { total, totalVolume, closedVolume, activeDeals };
  }, [transactions]);
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch = !search || t.property_address?.toLowerCase().includes(search.toLowerCase()) || t.buyer_name?.toLowerCase().includes(search.toLowerCase()) || t.seller_name?.toLowerCase().includes(search.toLowerCase()) || t.agent_name?.toLowerCase().includes(search.toLowerCase());
      const matchStage = stageFilter === "all" || t.status === stageFilter;
      return matchSearch && matchStage;
    });
  }, [transactions, search, stageFilter]);
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      propertyId: properties[0]?.id || "",
      propertyAddress: properties[0]?.address || "",
      sellerName: "",
      buyerName: "",
      salePrice: 5e5,
      closingDate: format(/* @__PURE__ */ new Date(), "yyyy-MM-dd"),
      agentName: user?.user_metadata?.full_name || "Assigned Broker",
      status: "offer_accepted",
      notes: ""
    });
    setShowFormSheet(true);
  };
  const handleOpenEdit = (txn) => {
    setEditingId(txn.id);
    setFormData({
      propertyId: txn.property_id || "",
      propertyAddress: txn.property_address || "",
      sellerName: txn.seller_name || "",
      buyerName: txn.buyer_name || "",
      salePrice: txn.sale_price || 0,
      closingDate: txn.closing_date || "",
      agentName: txn.agent_name || "",
      status: txn.status || "offer_accepted",
      notes: txn.notes || ""
    });
    setShowFormSheet(true);
  };
  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    if (!formData.propertyAddress || !formData.buyerName) {
      toast.error("Property address and buyer name are required");
      return;
    }
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_transactions SET
            property_id = ?, property_address = ?, seller_name = ?, buyer_name = ?,
            sale_price = ?, closing_date = ?, status = ?, agent_name = ?, notes = ?
          WHERE id = ? AND company_id = ?`,
          [
            formData.propertyId || null,
            formData.propertyAddress,
            formData.sellerName || null,
            formData.buyerName,
            Number(formData.salePrice) || 0,
            formData.closingDate || null,
            formData.status,
            formData.agentName || null,
            formData.notes || null,
            editingId,
            companyId
          ]
        );
        toast.success("Transaction updated");
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_transactions (
            id, created_at, company_id, property_id, property_address,
            seller_name, buyer_name, sale_price, closing_date, status,
            agent_id, agent_name, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId,
            now,
            companyId,
            formData.propertyId || null,
            formData.propertyAddress,
            formData.sellerName || null,
            formData.buyerName,
            Number(formData.salePrice) || 0,
            formData.closingDate || null,
            formData.status,
            user?.id || null,
            formData.agentName || null,
            formData.notes || null
          ]
        );
        toast.success("Deal logged to transaction pipeline");
      }
      setShowFormSheet(false);
      fetchTransactionsData();
      if (inspectorTxn && inspectorTxn.id === editingId) {
        setInspectorTxn((prev) => ({ ...prev, ...formData }));
      }
    } catch (_err) {
      toast.error("Failed to save transaction");
    }
  };
  const handleDeleteTransaction = async () => {
    if (!deleteTarget) return;
    try {
      await powerSync.execute(
        `DELETE FROM univ_re_transactions WHERE id = ? AND company_id = ?`,
        [deleteTarget.id, companyId]
      );
      toast.success("Transaction removed");
      setDeleteTarget(null);
      if (inspectorTxn?.id === deleteTarget.id) setInspectorTxn(null);
      fetchTransactionsData();
    } catch (_err) {
      toast.error("Failed to delete transaction");
    }
  };
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;
    const newStage = destination.droppableId;
    setTransactions(
      (prev) => prev.map((t) => t.id === draggableId ? { ...t, status: newStage } : t)
    );
    try {
      await powerSync.execute(
        `UPDATE univ_re_transactions SET status = ? WHERE id = ? AND company_id = ?`,
        [newStage, draggableId, companyId]
      );
      toast.success(`Moved to ${PIPELINE_STAGES.find((s) => s.id === newStage)?.label || newStage}`);
    } catch (_err) {
      toast.error("Failed to update stage");
      fetchTransactionsData();
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20", children: /* @__PURE__ */ jsx(Banknote, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: "Transactions & Deal Pipeline" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "Multi-stage property acquisitions, escrow closing workflows, and sales milestones" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: fetchTransactionsData,
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
              "New Transaction"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Active Deals" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-foreground", children: stats.activeDeals }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "In active negotiation / escrow" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(TrendingUp, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Pipeline Volume" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-emerald-600 dark:text-emerald-400 truncate", children: formatCurrency(stats.totalVolume, "USD") }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Total across all stages" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(DollarSign, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Closed Revenue" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-foreground truncate", children: formatCurrency(stats.closedVolume, "USD") }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-emerald-600 font-medium", children: "Finalized contracts" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Total Deals Logged" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-foreground", children: stats.total }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Historical transaction volume" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(Banknote, { className: "h-5 w-5" }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card border border-border/80 p-3 rounded-xl shadow-xs", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-1 items-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-w-[220px]", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "Search by property, buyer, seller, agent...",
              value: search,
              onChange: (e) => setSearch(e.target.value),
              className: "pl-9 h-9 text-xs bg-background"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(Select, { value: stageFilter, onValueChange: setStageFilter, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 text-xs w-[170px] bg-background", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Pipeline Stage" }) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "all", className: "text-xs", children: "All Pipeline Stages" }),
            PIPELINE_STAGES.map((s) => /* @__PURE__ */ jsx(SelectItem, { value: s.id, className: "text-xs", children: s.label }, s.id))
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 self-end md:self-auto", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setViewMode("kanban"),
            className: cn(
              "p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
              viewMode === "kanban" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            ),
            title: "Kanban Board",
            children: [
              /* @__PURE__ */ jsx(Grid, { className: "h-3.5 w-3.5" }),
              /* @__PURE__ */ jsx("span", { className: "text-[11px] hidden sm:inline", children: "Kanban" })
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
    viewMode === "kanban" ? /* @__PURE__ */ jsx(DragDropContext, { onDragEnd: handleDragEnd, children: /* @__PURE__ */ jsx("div", { className: "flex flex-nowrap gap-4 overflow-x-auto pb-4 scrollbar-primary", children: PIPELINE_STAGES.map((stage) => {
      const stageDeals = filteredTransactions.filter((t) => (t.status || "offer_accepted") === stage.id);
      const stageVolume = stageDeals.reduce((sum, t) => sum + (Number(t.sale_price) || 0), 0);
      return /* @__PURE__ */ jsxs(
        "div",
        {
          className: cn(
            "flex flex-col rounded-xl border p-3 flex-1 min-w-[260px] max-w-[300px] shrink-0 bg-card/50",
            stage.color
          ),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
              /* @__PURE__ */ jsx("span", { className: "font-bold text-xs text-foreground truncate", children: stage.label }),
              /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[10px] px-1.5 h-5 font-mono", children: stageDeals.length })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] font-semibold text-muted-foreground mb-3", children: formatCurrency(stageVolume, "USD") }),
            /* @__PURE__ */ jsx(Droppable, { droppableId: stage.id, children: (providedDroppable, snapshot) => /* @__PURE__ */ jsxs(
              "div",
              {
                ref: providedDroppable.innerRef,
                ...providedDroppable.droppableProps,
                className: cn(
                  "flex-1 space-y-2.5 min-h-[300px] rounded-lg p-1 transition-colors",
                  snapshot.isDraggingOver && "bg-emerald-500/10 ring-1 ring-emerald-500/30"
                ),
                children: [
                  stageDeals.map((deal, index) => /* @__PURE__ */ jsx(Draggable, { draggableId: deal.id, index, children: (providedDraggable, snapshotDraggable) => /* @__PURE__ */ jsx(PortalAwareItem, { provided: providedDraggable, snapshot: snapshotDraggable, children: /* @__PURE__ */ jsxs(
                    "div",
                    {
                      onClick: () => setInspectorTxn(deal),
                      className: cn(
                        "p-3 rounded-lg border border-border bg-card shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group",
                        snapshotDraggable.isDragging && "shadow-xl ring-2 ring-emerald-500 z-50 bg-background"
                      ),
                      children: [
                        /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between gap-1 mb-1", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1", children: deal.property_address }) }),
                        /* @__PURE__ */ jsx("p", { className: "text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mb-2", children: formatCurrency(deal.sale_price, "USD") }),
                        /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-[11px] text-muted-foreground border-t border-border/50 pt-2", children: [
                          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                            /* @__PURE__ */ jsx("span", { children: "Buyer:" }),
                            /* @__PURE__ */ jsx("strong", { className: "text-foreground truncate max-w-[110px]", children: deal.buyer_name || "N/A" })
                          ] }),
                          deal.closing_date && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[10px]", children: [
                            /* @__PURE__ */ jsx("span", { children: "Close:" }),
                            /* @__PURE__ */ jsx("span", { className: "font-mono text-foreground", children: deal.closing_date })
                          ] })
                        ] })
                      ]
                    }
                  ) }) }, deal.id)),
                  providedDroppable.placeholder
                ]
              }
            ) })
          ]
        },
        stage.id
      );
    }) }) }) : (
      /* List View */
      /* @__PURE__ */ jsx("div", { className: "border border-border rounded-xl bg-card overflow-hidden shadow-xs", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-border bg-muted/40 text-muted-foreground font-medium", children: [
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Property / Deal" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Buyer" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Seller" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Sale Price" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Target Closing" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Stage" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Agent" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4 text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border", children: filteredTransactions.map((deal) => {
          const stage = PIPELINE_STAGES.find((s) => s.id === deal.status) || PIPELINE_STAGES[0];
          return /* @__PURE__ */ jsxs(
            "tr",
            {
              className: "hover:bg-muted/30 transition-colors cursor-pointer group",
              onClick: () => setInspectorTxn(deal),
              children: [
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-semibold text-foreground group-hover:text-emerald-600 transition-colors", children: deal.property_address }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 text-foreground", children: deal.buyer_name || "N/A" }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 text-muted-foreground", children: deal.seller_name || "N/A" }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-bold text-foreground", children: formatCurrency(deal.sale_price, "USD") }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-mono text-muted-foreground", children: deal.closing_date || "TBD" }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4", children: /* @__PURE__ */ jsx(Badge, { variant: "outline", className: cn("text-[10px] font-medium border", stage.badge), children: stage.label }) }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 text-muted-foreground", children: deal.agent_name || "Assigned" }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 text-right", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1", children: [
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "icon",
                      className: "h-7 w-7",
                      onClick: () => setInspectorTxn(deal),
                      children: /* @__PURE__ */ jsx(Eye, { className: "h-3.5 w-3.5 text-muted-foreground" })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "icon",
                      className: "h-7 w-7",
                      onClick: () => handleOpenEdit(deal),
                      children: /* @__PURE__ */ jsx(Edit, { className: "h-3.5 w-3.5 text-muted-foreground" })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "icon",
                      className: "h-7 w-7 text-rose-500 hover:text-rose-600",
                      onClick: () => setDeleteTarget(deal),
                      children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
                    }
                  )
                ] }) })
              ]
            },
            deal.id
          );
        }) })
      ] }) }) })
    ),
    /* @__PURE__ */ jsx(Sheet, { open: !!inspectorTxn, onOpenChange: (open) => !open && setInspectorTxn(null), children: /* @__PURE__ */ jsx(SheetContent, { className: "sm:max-w-xl overflow-y-auto p-0 flex flex-col font-sans", children: inspectorTxn && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs(SheetHeader, { className: "p-6 border-b border-border bg-muted/20", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs uppercase font-mono tracking-wider", children: "Deal Room" }),
          /* @__PURE__ */ jsx(
            Badge,
            {
              variant: "outline",
              className: cn(
                "text-xs font-medium border",
                (PIPELINE_STAGES.find((s) => s.id === inspectorTxn.status) || PIPELINE_STAGES[0]).badge
              ),
              children: (PIPELINE_STAGES.find((s) => s.id === inspectorTxn.status) || PIPELINE_STAGES[0]).label
            }
          )
        ] }),
        /* @__PURE__ */ jsx(SheetTitle, { className: "text-xl font-bold text-foreground mt-2", children: inspectorTxn.property_address }),
        /* @__PURE__ */ jsxs(SheetDescription, { className: "text-xs", children: [
          "Target Closing: ",
          /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: inspectorTxn.closing_date || "Pending" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6 flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase font-bold text-muted-foreground tracking-wider", children: "Contract Price" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-emerald-600 dark:text-emerald-400", children: formatCurrency(inspectorTxn.sale_price, "USD") })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase font-semibold text-muted-foreground", children: "Assigned Broker" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-foreground", children: inspectorTxn.agent_name || "Lead Broker" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: "Involved Parties" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg border border-border/80 bg-muted/20", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase text-muted-foreground", children: "Purchaser / Buyer" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-foreground mt-0.5", children: inspectorTxn.buyer_name || "N/A" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg border border-border/80 bg-muted/20", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase text-muted-foreground", children: "Seller / Vendor" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-foreground mt-0.5", children: inspectorTxn.seller_name || "Owner of Record" })
            ] })
          ] })
        ] }),
        inspectorTxn.notes && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: "Deal Terms & Notes" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-foreground/90 bg-muted/30 p-3.5 rounded-lg border border-border leading-relaxed", children: inspectorTxn.notes })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => handleOpenEdit(inspectorTxn),
            className: "text-xs gap-1.5",
            children: [
              /* @__PURE__ */ jsx(Edit, { className: "h-3.5 w-3.5" }),
              "Edit Deal"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            size: "sm",
            onClick: () => setInspectorTxn(null),
            className: "text-xs bg-emerald-600 hover:bg-emerald-700 text-white",
            children: "Close Deal Sheet"
          }
        )
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx(Sheet, { open: showFormSheet, onOpenChange: setShowFormSheet, children: /* @__PURE__ */ jsxs(SheetContent, { className: "sm:max-w-xl overflow-y-auto p-0 flex flex-col font-sans", children: [
      /* @__PURE__ */ jsxs(SheetHeader, { className: "p-6 border-b border-border bg-muted/20", children: [
        /* @__PURE__ */ jsx(SheetTitle, { className: "text-lg font-bold text-foreground", children: editingId ? "Edit Transaction Record" : "Log New Transaction Deal" }),
        /* @__PURE__ */ jsx(SheetDescription, { className: "text-xs", children: "Record contract price, buyer & seller details, and escrow timeline" })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSaveTransaction, className: "p-6 space-y-4 flex-1", children: [
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
                placeholder: "e.g. Arthur Pendelton",
                value: formData.buyerName,
                onChange: (e) => setFormData({ ...formData, buyerName: e.target.value }),
                className: "text-xs"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Seller Name" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                placeholder: "e.g. Eleanor Vance",
                value: formData.sellerName,
                onChange: (e) => setFormData({ ...formData, sellerName: e.target.value }),
                className: "text-xs"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Sale Price ($) *" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                min: "0",
                required: true,
                value: formData.salePrice,
                onChange: (e) => setFormData({ ...formData, salePrice: e.target.value }),
                className: "text-xs font-bold"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Target Closing Date" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "date",
                value: formData.closingDate,
                onChange: (e) => setFormData({ ...formData, closingDate: e.target.value }),
                className: "text-xs"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Pipeline Stage" }),
            /* @__PURE__ */ jsxs(
              Select,
              {
                value: formData.status,
                onValueChange: (val) => setFormData({ ...formData, status: val }),
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "text-xs", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsx(SelectContent, { children: PIPELINE_STAGES.map((s) => /* @__PURE__ */ jsx(SelectItem, { value: s.id, className: "text-xs", children: s.label }, s.id)) })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Assigned Agent / Broker" }),
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
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Terms, Contingencies & Notes" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              rows: 3,
              placeholder: "Financing contingencies, inspection deadlines, escrow notes...",
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
              children: editingId ? "Save Changes" : "Log Transaction"
            }
          )
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!deleteTarget, onOpenChange: (open) => !open && setDeleteTarget(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { className: "font-sans", children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { className: "text-base font-bold", children: "Delete Transaction Deal?" }),
        /* @__PURE__ */ jsxs(AlertDialogDescription, { className: "text-xs", children: [
          "Are you sure you want to remove the transaction for ",
          /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: deleteTarget?.property_address }),
          "?"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { className: "text-xs", children: "Cancel" }),
        /* @__PURE__ */ jsx(
          AlertDialogAction,
          {
            onClick: handleDeleteTransaction,
            className: "text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold",
            children: "Confirm Delete"
          }
        )
      ] })
    ] }) })
  ] });
}
