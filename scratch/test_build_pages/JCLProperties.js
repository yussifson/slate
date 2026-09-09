import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Search,
  Plus,
  Edit,
  Trash2,
  MapPin,
  DollarSign,
  BedDouble,
  Bath,
  Square,
  Eye,
  Grid,
  List,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Sparkles
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
import { cn } from "@/lib/utils";
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
const PROPERTY_TYPES = [
  { value: "all", label: "All Property Types" },
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "villa", label: "Luxury Villa" },
  { value: "penthouse", label: "Penthouse" },
  { value: "apartment", label: "Apartment" },
  { value: "land", label: "Land / Plot" }
];
const STATUS_CONFIG = {
  active: {
    label: "Active Listing",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-500"
  },
  pending: {
    label: "Under Offer / Pending",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    dot: "bg-amber-500"
  },
  sold: {
    label: "Sold / Closed",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
    dot: "bg-blue-500"
  },
  off_market: {
    label: "Off Market",
    badge: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30",
    dot: "bg-slate-400"
  }
};
export default function JCLProperties() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();
  const [properties, setProperties] = useState([]);
  const [viewings, setViewings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFormSheet, setShowFormSheet] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [inspectorProperty, setInspectorProperty] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    propertyType: "residential",
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1500,
    lotSize: 0,
    price: 35e4,
    status: "active",
    agentName: user?.user_metadata?.full_name || "Assigned Broker",
    yearBuilt: (/* @__PURE__ */ new Date()).getFullYear(),
    description: ""
  });
  const fetchPropertiesData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const [propRes, viewRes] = await Promise.all([
        powerSync.execute("SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY created_at DESC", [companyId]),
        powerSync.execute("SELECT * FROM univ_re_viewings WHERE company_id = ? ORDER BY viewing_date DESC", [companyId]).catch(() => ({ rows: [] }))
      ]);
      const propList = propRes.rows._array || Array.from(propRes.rows || []);
      const viewList = viewRes.rows._array || Array.from(viewRes.rows || []);
      setProperties(propList);
      setViewings(viewList);
    } catch (_err) {
      toast.error("Failed to load properties");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchPropertiesData();
  }, [companyId]);
  const stats = useMemo(() => {
    const total = properties.length;
    const active = properties.filter((p) => p.status === "active").length;
    const pending = properties.filter((p) => p.status === "pending").length;
    const sold = properties.filter((p) => p.status === "sold").length;
    const totalValuation = properties.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
    const avgPrice = total > 0 ? totalValuation / total : 0;
    return { total, active, pending, sold, totalValuation, avgPrice };
  }, [properties]);
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const matchSearch = !search || p.address?.toLowerCase().includes(search.toLowerCase()) || p.city?.toLowerCase().includes(search.toLowerCase()) || p.state?.toLowerCase().includes(search.toLowerCase()) || p.agent_name?.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || p.property_type === typeFilter;
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [properties, search, typeFilter, statusFilter]);
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      address: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
      propertyType: "residential",
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1500,
      lotSize: 0,
      price: 35e4,
      status: "active",
      agentName: user?.user_metadata?.full_name || "Assigned Broker",
      yearBuilt: (/* @__PURE__ */ new Date()).getFullYear(),
      description: ""
    });
    setShowFormSheet(true);
  };
  const handleOpenEdit = (prop) => {
    setEditingId(prop.id);
    setFormData({
      address: prop.address || "",
      city: prop.city || "",
      state: prop.state || "",
      country: prop.country || "",
      zipCode: prop.zip_code || "",
      propertyType: prop.property_type || "residential",
      bedrooms: prop.bedrooms || 0,
      bathrooms: prop.bathrooms || 0,
      squareFeet: prop.square_feet || 0,
      lotSize: prop.lot_size || 0,
      price: prop.price || 0,
      status: prop.status || "active",
      agentName: prop.agent_name || "",
      yearBuilt: prop.year_built || (/* @__PURE__ */ new Date()).getFullYear(),
      description: prop.description || ""
    });
    setShowFormSheet(true);
  };
  const handleSaveProperty = async (e) => {
    e.preventDefault();
    if (!formData.address) {
      toast.error("Property address is required");
      return;
    }
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_properties SET
            address = ?, city = ?, state = ?, country = ?, zip_code = ?,
            property_type = ?, bedrooms = ?, bathrooms = ?, square_feet = ?,
            lot_size = ?, price = ?, status = ?, agent_name = ?, year_built = ?,
            description = ?, last_updated = ?
          WHERE id = ? AND company_id = ?`,
          [
            formData.address,
            formData.city || null,
            formData.state || null,
            formData.country || null,
            formData.zipCode || null,
            formData.propertyType,
            Number(formData.bedrooms) || 0,
            Number(formData.bathrooms) || 0,
            Number(formData.squareFeet) || 0,
            Number(formData.lotSize) || 0,
            Number(formData.price) || 0,
            formData.status,
            formData.agentName || null,
            Number(formData.yearBuilt) || null,
            formData.description || null,
            now,
            editingId,
            companyId
          ]
        );
        toast.success("Property updated successfully");
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_properties (
            id, created_at, company_id, address, city, state, country, zip_code,
            property_type, bedrooms, bathrooms, square_feet, lot_size, price,
            status, agent_id, agent_name, year_built, description, listing_date, last_updated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId,
            now,
            companyId,
            formData.address,
            formData.city || null,
            formData.state || null,
            formData.country || null,
            formData.zipCode || null,
            formData.propertyType,
            Number(formData.bedrooms) || 0,
            Number(formData.bathrooms) || 0,
            Number(formData.squareFeet) || 0,
            Number(formData.lotSize) || 0,
            Number(formData.price) || 0,
            formData.status,
            user?.id || null,
            formData.agentName || null,
            Number(formData.yearBuilt) || null,
            formData.description || null,
            now,
            now
          ]
        );
        toast.success("Property created successfully");
      }
      setShowFormSheet(false);
      fetchPropertiesData();
      if (inspectorProperty && inspectorProperty.id === editingId) {
        setInspectorProperty((prev) => ({ ...prev, ...formData }));
      }
    } catch (_err) {
      toast.error("Failed to save property");
    }
  };
  const handleDeleteProperty = async () => {
    if (!deleteTarget) return;
    try {
      await powerSync.execute(
        `DELETE FROM univ_re_properties WHERE id = ? AND company_id = ?`,
        [deleteTarget.id, companyId]
      );
      toast.success("Property listing deleted");
      setDeleteTarget(null);
      if (inspectorProperty?.id === deleteTarget.id) {
        setInspectorProperty(null);
      }
      fetchPropertiesData();
    } catch (_err) {
      toast.error("Failed to delete property");
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20", children: /* @__PURE__ */ jsx(Building2, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: "Properties & Units Directory" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "Executive portfolio inventory, unit specifications, valuations, and scheduled viewings" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: fetchPropertiesData,
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
              "Add Property"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Total Portfolio" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-foreground", children: stats.total }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Properties in database" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(Building2, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Active Listings" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-emerald-600 dark:text-emerald-400", children: stats.active }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-emerald-600/80", children: "Available for sale / lease" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(Sparkles, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Sold / Under Offer" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-amber-600 dark:text-amber-400", children: stats.pending + stats.sold }),
          /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-muted-foreground", children: [
            stats.pending,
            " pending, ",
            stats.sold,
            " closed"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Gross Asset Valuation" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-foreground truncate", children: formatCurrency(stats.totalValuation, "USD") }),
          /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-muted-foreground", children: [
            "Avg ",
            formatCurrency(stats.avgPrice, "USD"),
            "/unit"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(DollarSign, { className: "h-5 w-5" }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card border border-border/80 p-3 rounded-xl shadow-xs", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-1 items-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-w-[220px]", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "Search by address, city, agent...",
              value: search,
              onChange: (e) => setSearch(e.target.value),
              className: "pl-9 h-9 text-xs bg-background"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(Select, { value: typeFilter, onValueChange: setTypeFilter, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 text-xs w-[170px] bg-background", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Property Type" }) }),
          /* @__PURE__ */ jsx(SelectContent, { children: PROPERTY_TYPES.map((t) => /* @__PURE__ */ jsx(SelectItem, { value: t.value, className: "text-xs", children: t.label }, t.value)) })
        ] }),
        /* @__PURE__ */ jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 text-xs w-[150px] bg-background", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Status" }) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "all", className: "text-xs", children: "All Statuses" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "active", className: "text-xs", children: "Active" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "pending", className: "text-xs", children: "Pending" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "sold", className: "text-xs", children: "Sold" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "off_market", className: "text-xs", children: "Off Market" })
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
    filteredProperties.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-16 border border-dashed border-border rounded-2xl bg-card/40", children: [
      /* @__PURE__ */ jsx(Building2, { className: "h-10 w-10 mx-auto text-muted-foreground/50 mb-3" }),
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-foreground", children: "No properties found" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1 max-w-sm mx-auto", children: search || typeFilter !== "all" || statusFilter !== "all" ? "No property records match your search filters." : "Add your first property listing to begin tracking units and viewings." }),
      /* @__PURE__ */ jsxs(Button, { onClick: handleOpenCreate, size: "sm", className: "mt-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white", children: [
        /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5 mr-1" }),
        " Add Property"
      ] })
    ] }) : viewMode === "grid" ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5", children: filteredProperties.map((property) => {
      const st = STATUS_CONFIG[property.status] || STATUS_CONFIG.active;
      const priceSqft = property.square_feet > 0 ? (property.price / property.square_feet).toFixed(1) : null;
      return /* @__PURE__ */ jsxs(
        "div",
        {
          onClick: () => setInspectorProperty(property),
          className: "group relative flex flex-col rounded-2xl border border-border/60 hover:border-emerald-500/50 bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "relative h-28 flex flex-col justify-between p-4 overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-600", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-10", style: { backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "30px 30px" } }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between relative z-10", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm", children: property.property_type || "Residential" }),
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm", children: [
                  /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-white animate-pulse" }),
                  (STATUS_CONFIG[property.status] || STATUS_CONFIG.active).label
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
                /* @__PURE__ */ jsx("p", { className: "text-white/70 text-[10px] font-semibold uppercase tracking-widest mb-0.5", children: "Listing Price" }),
                /* @__PURE__ */ jsx("p", { className: "text-2xl font-extrabold text-white tracking-tight", children: formatCurrency(property.price, "USD") })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-4 flex flex-col gap-3 flex-1", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "font-bold text-foreground text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1", children: property.address }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5", children: [
                  /* @__PURE__ */ jsx(MapPin, { className: "h-3 w-3 shrink-0" }),
                  /* @__PURE__ */ jsx("span", { className: "truncate", children: [property.city, property.state, property.zip_code].filter(Boolean).join(", ") || "Prime Location" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 divide-x divide-border/60 rounded-xl border border-border/60 bg-muted/30 overflow-hidden", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center py-2.5 gap-0.5", children: [
                  /* @__PURE__ */ jsx(BedDouble, { className: "h-3.5 w-3.5 text-muted-foreground" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-foreground", children: property.bedrooms ?? "\u2014" }),
                  /* @__PURE__ */ jsx("span", { className: "text-[9px] uppercase font-semibold text-muted-foreground tracking-wider", children: "Beds" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center py-2.5 gap-0.5", children: [
                  /* @__PURE__ */ jsx(Bath, { className: "h-3.5 w-3.5 text-muted-foreground" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-foreground", children: property.bathrooms ?? "\u2014" }),
                  /* @__PURE__ */ jsx("span", { className: "text-[9px] uppercase font-semibold text-muted-foreground tracking-wider", children: "Baths" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center py-2.5 gap-0.5", children: [
                  /* @__PURE__ */ jsx(Square, { className: "h-3.5 w-3.5 text-muted-foreground" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-foreground", children: property.square_feet ? property.square_feet.toLocaleString() : "\u2014" }),
                  /* @__PURE__ */ jsx("span", { className: "text-[9px] uppercase font-semibold text-muted-foreground tracking-wider", children: "Sq Ft" })
                ] })
              ] }),
              priceSqft && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[11px] px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground font-medium", children: "Price / sq ft" }),
                /* @__PURE__ */ jsxs("span", { className: "font-bold text-emerald-700 dark:text-emerald-400", children: [
                  "$",
                  priceSqft
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "pt-2 border-t border-border/50 flex items-center justify-between mt-auto", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0", children: [
                  /* @__PURE__ */ jsx("div", { className: "h-5 w-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white text-[8px] font-extrabold shrink-0", children: (property.agent_name || "A")[0].toUpperCase() }),
                  /* @__PURE__ */ jsx("span", { className: "truncate font-medium", children: property.agent_name || "Assigned Broker" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", onClick: (e) => e.stopPropagation(), children: [
                  /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-muted-foreground hover:text-emerald-600", onClick: () => setInspectorProperty(property), title: "Inspect", children: /* @__PURE__ */ jsx(Eye, { className: "h-3.5 w-3.5" }) }),
                  /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-muted-foreground hover:text-foreground", onClick: () => handleOpenEdit(property), title: "Edit", children: /* @__PURE__ */ jsx(Edit, { className: "h-3.5 w-3.5" }) }),
                  /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-rose-500/70 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30", onClick: () => setDeleteTarget(property), title: "Delete", children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }) })
                ] })
              ] })
            ] })
          ]
        },
        property.id
      );
    }) }) : (
      /* High Density Table View */
      /* @__PURE__ */ jsx("div", { className: "border border-border rounded-xl bg-card overflow-hidden shadow-xs", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-border bg-muted/40 text-muted-foreground font-medium", children: [
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Property Address" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Type" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Specs" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Price" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Assigned Agent" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4 text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border", children: filteredProperties.map((property) => {
          const st = STATUS_CONFIG[property.status] || STATUS_CONFIG.active;
          return /* @__PURE__ */ jsxs(
            "tr",
            {
              className: "hover:bg-muted/30 transition-colors cursor-pointer group",
              onClick: () => setInspectorProperty(property),
              children: [
                /* @__PURE__ */ jsxs("td", { className: "py-3.5 px-4", children: [
                  /* @__PURE__ */ jsx("div", { className: "font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors", children: property.address }),
                  /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: [property.city, property.state].filter(Boolean).join(", ") || "N/A" })
                ] }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 capitalize text-foreground", children: property.property_type || "Residential" }),
                /* @__PURE__ */ jsxs("td", { className: "py-3.5 px-4 text-muted-foreground", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: property.bedrooms || 0 }),
                  " bd |",
                  " ",
                  /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: property.bathrooms || 0 }),
                  " ba |",
                  " ",
                  /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: property.square_feet?.toLocaleString() || 0 }),
                  " sqft"
                ] }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-bold text-foreground", children: formatCurrency(property.price, "USD") }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4", children: /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: cn("text-[10px] font-medium border gap-1", st.badge), children: [
                  /* @__PURE__ */ jsx("span", { className: cn("h-1.5 w-1.5 rounded-full", st.dot) }),
                  st.label
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 text-muted-foreground", children: property.agent_name || "Unassigned" }),
                /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 text-right", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1", children: [
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "icon",
                      className: "h-7 w-7",
                      onClick: () => setInspectorProperty(property),
                      children: /* @__PURE__ */ jsx(Eye, { className: "h-3.5 w-3.5 text-muted-foreground" })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "icon",
                      className: "h-7 w-7",
                      onClick: () => handleOpenEdit(property),
                      children: /* @__PURE__ */ jsx(Edit, { className: "h-3.5 w-3.5 text-muted-foreground" })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "icon",
                      className: "h-7 w-7 text-rose-500 hover:text-rose-600",
                      onClick: () => setDeleteTarget(property),
                      children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
                    }
                  )
                ] }) })
              ]
            },
            property.id
          );
        }) })
      ] }) }) })
    ),
    /* @__PURE__ */ jsx(Sheet, { open: !!inspectorProperty, onOpenChange: (open) => !open && setInspectorProperty(null), children: /* @__PURE__ */ jsx(SheetContent, { className: "sm:max-w-xl overflow-y-auto p-0 flex flex-col font-sans", children: inspectorProperty && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs(SheetHeader, { className: "p-6 border-b border-border bg-muted/20", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs uppercase font-mono tracking-wider", children: inspectorProperty.property_type || "Residential" }),
          /* @__PURE__ */ jsx(
            Badge,
            {
              variant: "outline",
              className: cn("text-xs font-medium border gap-1.5", (STATUS_CONFIG[inspectorProperty.status] || STATUS_CONFIG.active).badge),
              children: (STATUS_CONFIG[inspectorProperty.status] || STATUS_CONFIG.active).label
            }
          )
        ] }),
        /* @__PURE__ */ jsx(SheetTitle, { className: "text-xl font-bold text-foreground mt-2", children: inspectorProperty.address }),
        /* @__PURE__ */ jsxs(SheetDescription, { className: "text-xs flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(MapPin, { className: "h-3.5 w-3.5 text-muted-foreground" }),
          [inspectorProperty.city, inspectorProperty.state, inspectorProperty.zip_code, inspectorProperty.country].filter(Boolean).join(", ")
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6 flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase font-bold text-muted-foreground tracking-wider", children: "Listed Price" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-emerald-600 dark:text-emerald-400", children: formatCurrency(inspectorProperty.price, "USD") })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase font-semibold text-muted-foreground", children: "Year Built" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-foreground", children: inspectorProperty.year_built || "Modern" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: "Architectural Specs" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg border border-border/80 bg-card text-center", children: [
              /* @__PURE__ */ jsx(BedDouble, { className: "h-4 w-4 mx-auto text-muted-foreground mb-1" }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground uppercase", children: "Bedrooms" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-foreground", children: inspectorProperty.bedrooms || "-" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg border border-border/80 bg-card text-center", children: [
              /* @__PURE__ */ jsx(Bath, { className: "h-4 w-4 mx-auto text-muted-foreground mb-1" }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground uppercase", children: "Bathrooms" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-foreground", children: inspectorProperty.bathrooms || "-" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg border border-border/80 bg-card text-center", children: [
              /* @__PURE__ */ jsx(Square, { className: "h-4 w-4 mx-auto text-muted-foreground mb-1" }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground uppercase", children: "Living Area" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-foreground", children: inspectorProperty.square_feet ? `${inspectorProperty.square_feet.toLocaleString()} sqft` : "-" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg border border-border/80 bg-card text-center", children: [
              /* @__PURE__ */ jsx(Building2, { className: "h-4 w-4 mx-auto text-muted-foreground mb-1" }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground uppercase", children: "Lot Size" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-foreground", children: inspectorProperty.lot_size ? `${inspectorProperty.lot_size} Ac` : "-" })
            ] })
          ] })
        ] }),
        inspectorProperty.description && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: "Description & Highlights" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-foreground/90 bg-muted/30 p-3.5 rounded-lg border border-border leading-relaxed", children: inspectorProperty.description })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: "Recent & Upcoming Viewings" }),
            /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px]", children: [
              viewings.filter((v) => v.property_id === inspectorProperty.id).length,
              " recorded"
            ] })
          ] }),
          viewings.filter((v) => v.property_id === inspectorProperty.id).length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-4 text-center border border-dashed border-border rounded-lg text-xs text-muted-foreground", children: "No inspection tours or viewings scheduled yet." }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: viewings.filter((v) => v.property_id === inspectorProperty.id).map((v) => /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg border border-border/80 bg-muted/20 flex items-center justify-between text-xs", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "font-semibold text-foreground", children: v.client_name || "Client Viewing" }),
              /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5", children: [
                /* @__PURE__ */ jsx(Calendar, { className: "h-3 w-3" }),
                v.viewing_date,
                " ",
                v.viewing_time && `at ${v.viewing_time}`
              ] })
            ] }),
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] capitalize", children: v.status || "Scheduled" })
          ] }, v.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => {
              handleOpenEdit(inspectorProperty);
            },
            className: "text-xs gap-1.5",
            children: [
              /* @__PURE__ */ jsx(Edit, { className: "h-3.5 w-3.5" }),
              "Edit Property"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            size: "sm",
            onClick: () => setInspectorProperty(null),
            className: "text-xs bg-emerald-600 hover:bg-emerald-700 text-white",
            children: "Close Inspector"
          }
        )
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx(Sheet, { open: showFormSheet, onOpenChange: setShowFormSheet, children: /* @__PURE__ */ jsxs(SheetContent, { className: "sm:max-w-xl overflow-y-auto p-0 flex flex-col font-sans", children: [
      /* @__PURE__ */ jsxs(SheetHeader, { className: "p-6 border-b border-border bg-muted/20", children: [
        /* @__PURE__ */ jsx(SheetTitle, { className: "text-lg font-bold text-foreground", children: editingId ? "Edit Property Listing" : "Add New Property Listing" }),
        /* @__PURE__ */ jsx(SheetDescription, { className: "text-xs", children: "Fill in the property details, architectural specifications, and pricing" })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSaveProperty, className: "p-6 space-y-4 flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Street Address *" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              required: true,
              placeholder: "e.g. 104 Oceanfront Boulevard, Suite 500",
              value: formData.address,
              onChange: (e) => setFormData({ ...formData, address: e.target.value }),
              className: "text-xs"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "City" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                placeholder: "e.g. Miami",
                value: formData.city,
                onChange: (e) => setFormData({ ...formData, city: e.target.value }),
                className: "text-xs"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "State / Province" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                placeholder: "e.g. FL",
                value: formData.state,
                onChange: (e) => setFormData({ ...formData, state: e.target.value }),
                className: "text-xs"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Property Type" }),
            /* @__PURE__ */ jsxs(
              Select,
              {
                value: formData.propertyType,
                onValueChange: (val) => setFormData({ ...formData, propertyType: val }),
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "text-xs", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsx(SelectItem, { value: "residential", className: "text-xs", children: "Residential" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "commercial", className: "text-xs", children: "Commercial" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "villa", className: "text-xs", children: "Luxury Villa" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "penthouse", className: "text-xs", children: "Penthouse" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "apartment", className: "text-xs", children: "Apartment" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "land", className: "text-xs", children: "Land / Plot" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Listing Status" }),
            /* @__PURE__ */ jsxs(
              Select,
              {
                value: formData.status,
                onValueChange: (val) => setFormData({ ...formData, status: val }),
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "text-xs", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsx(SelectItem, { value: "active", className: "text-xs", children: "Active Listing" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "pending", className: "text-xs", children: "Under Offer / Pending" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "sold", className: "text-xs", children: "Sold / Closed" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "off_market", className: "text-xs", children: "Off Market" })
                  ] })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Bedrooms" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                min: "0",
                value: formData.bedrooms,
                onChange: (e) => setFormData({ ...formData, bedrooms: e.target.value }),
                className: "text-xs"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Bathrooms" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                min: "0",
                step: "0.5",
                value: formData.bathrooms,
                onChange: (e) => setFormData({ ...formData, bathrooms: e.target.value }),
                className: "text-xs"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Sq Ft" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                min: "0",
                value: formData.squareFeet,
                onChange: (e) => setFormData({ ...formData, squareFeet: e.target.value }),
                className: "text-xs"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Year Built" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                value: formData.yearBuilt,
                onChange: (e) => setFormData({ ...formData, yearBuilt: e.target.value }),
                className: "text-xs"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Listing Price ($) *" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                min: "0",
                required: true,
                value: formData.price,
                onChange: (e) => setFormData({ ...formData, price: e.target.value }),
                className: "text-xs font-bold"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Assigned Agent" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                placeholder: "e.g. Sarah Jenkins",
                value: formData.agentName,
                onChange: (e) => setFormData({ ...formData, agentName: e.target.value }),
                className: "text-xs"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs font-semibold", children: "Description & Features" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              rows: 3,
              placeholder: "Key highlights, amenities, parking, views...",
              value: formData.description,
              onChange: (e) => setFormData({ ...formData, description: e.target.value }),
              className: "w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
              children: editingId ? "Save Changes" : "Create Listing"
            }
          )
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!deleteTarget, onOpenChange: (open) => !open && setDeleteTarget(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { className: "font-sans", children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { className: "text-base font-bold", children: "Delete Property Listing?" }),
        /* @__PURE__ */ jsxs(AlertDialogDescription, { className: "text-xs", children: [
          "Are you sure you want to delete ",
          /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: deleteTarget?.address }),
          "? This action will remove the listing and cannot be undone."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { className: "text-xs", children: "Cancel" }),
        /* @__PURE__ */ jsx(
          AlertDialogAction,
          {
            onClick: handleDeleteProperty,
            className: "text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold",
            children: "Confirm Delete"
          }
        )
      ] })
    ] }) })
  ] });
}
