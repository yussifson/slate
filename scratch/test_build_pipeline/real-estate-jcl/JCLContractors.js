import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useMemo } from "react";
import {
  Wrench,
  Star,
  Plus,
  Edit,
  Trash2,
  Search,
  Phone,
  Mail,
  CheckCircle2,
  Shield,
  RefreshCw,
  Eye,
  Grid,
  List,
  Building2,
  User
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
import { cn } from "@/lib/utils";
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
export default function JCLContractors() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();
  const [contractors, setContractors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [showFormSheet, setShowFormSheet] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [inspectorContractor, setInspectorContractor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    specialty: "Plumbing",
    phone: "",
    email: "",
    rating: 4.8,
    licenseNumber: "",
    hourlyRate: 85,
    notes: ""
  });
  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const res = await powerSync.execute(
        "SELECT * FROM univ_re_contractors WHERE company_id = ? ORDER BY created_at DESC",
        [companyId]
      );
      setContractors(res.rows._array || Array.from(res.rows || []));
    } catch (_err) {
      toast.error("Failed to load contractors");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, [companyId]);
  const filteredContractors = useMemo(() => {
    return contractors.filter((c) => {
      const matchSearch = !search || (c.name || "").toLowerCase().includes(search.toLowerCase()) || (c.specialty || "").toLowerCase().includes(search.toLowerCase());
      const matchSpecialty = specialtyFilter === "all" || (c.specialty || "").toLowerCase() === specialtyFilter.toLowerCase();
      return matchSearch && matchSpecialty;
    });
  }, [contractors, search, specialtyFilter]);
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: "",
      specialty: "Plumbing",
      phone: "",
      email: "",
      rating: 4.8,
      licenseNumber: "",
      hourlyRate: 85,
      notes: ""
    });
    setShowFormSheet(true);
  };
  const handleOpenEdit = (c) => {
    setEditingId(c.id);
    setFormData({
      name: c.name || "",
      specialty: c.specialty || "General Trade",
      phone: c.phone || "",
      email: c.email || "",
      rating: c.rating || 4.8,
      licenseNumber: c.license_number || "",
      hourlyRate: c.hourly_rate || 85,
      notes: c.notes || ""
    });
    setShowFormSheet(true);
  };
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Contractor name is required");
      return;
    }
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_contractors SET name = ?, specialty = ?, phone = ?, email = ?, rating = ?, notes = ? WHERE id = ? AND company_id = ?`,
          [formData.name, formData.specialty, formData.phone || null, formData.email || null, Number(formData.rating) || 4.8, formData.notes || null, editingId, companyId]
        );
        toast.success("Contractor details updated");
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_contractors (id, created_at, company_id, name, specialty, phone, email, rating, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [newId, now, companyId, formData.name, formData.specialty, formData.phone || null, formData.email || null, Number(formData.rating) || 4.8, formData.notes || null]
        );
        toast.success("New contractor onboarded");
      }
      setShowFormSheet(false);
      fetchData();
    } catch (_err) {
      toast.error("Failed to save contractor");
    }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await powerSync.execute("DELETE FROM univ_re_contractors WHERE id = ? AND company_id = ?", [deleteTarget.id, companyId]);
      toast.success("Contractor record deleted");
      setDeleteTarget(null);
      fetchData();
    } catch (_err) {
      toast.error("Failed to delete contractor");
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-6 pb-28 w-full max-w-full space-y-6 font-sans", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20", children: /* @__PURE__ */ jsx(Wrench, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: "Contractors & Maintenance Vendors" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "Verified trade partners, licensed plumbers, electricians, HVAC specialists, and rate cards" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: fetchData, className: "h-9 px-3 text-xs gap-1.5 border-border", children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: cn("h-3.5 w-3.5", isLoading && "animate-spin") }),
          "Refresh"
        ] }),
        /* @__PURE__ */ jsxs(Button, { onClick: handleOpenCreate, size: "sm", className: "h-9 px-4 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm", children: [
          /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
          " Add Contractor"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-xs", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-1 items-center gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1 max-w-md", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "Search by vendor name or trade specialty...",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            className: "pl-9 h-9 text-xs bg-background"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: specialtyFilter, onValueChange: setSpecialtyFilter, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 text-xs w-[170px] bg-background", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Trade Specialty" }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", className: "text-xs", children: "All Specialties" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "plumbing", className: "text-xs", children: "Plumbing" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "electrical", className: "text-xs", children: "Electrical" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "hvac", className: "text-xs", children: "HVAC Aircon" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "general trade", className: "text-xs", children: "General Trade" })
        ] })
      ] })
    ] }) }),
    filteredContractors.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-16 border border-dashed border-border rounded-2xl text-center bg-card", children: [
      /* @__PURE__ */ jsx(Wrench, { className: "h-10 w-10 mx-auto text-muted-foreground/50 mb-3" }),
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-foreground", children: "No contractors registered" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1 max-w-sm mx-auto", children: "Onboard trade vendors to handle maintenance tickets and work orders." }),
      /* @__PURE__ */ jsxs(Button, { onClick: handleOpenCreate, size: "sm", className: "mt-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white", children: [
        /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5 mr-1" }),
        " Add Contractor"
      ] })
    ] }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5", children: filteredContractors.map((c) => {
      const initials = (c.name || "C").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
      return /* @__PURE__ */ jsxs(
        "div",
        {
          onClick: () => setInspectorContractor(c),
          className: "group relative flex flex-col rounded-2xl border border-border/60 hover:border-emerald-500/50 bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "relative h-24 flex items-center justify-between p-4 overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-600", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 relative z-10", children: [
                /* @__PURE__ */ jsx("div", { className: "h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-base font-black shadow-inner", children: initials }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-bold text-white text-base leading-tight tracking-tight", children: c.name }),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-white/80", children: c.specialty || "General Trade" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-white bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-sm text-xs font-bold relative z-10", children: [
                /* @__PURE__ */ jsx(Star, { className: "h-3.5 w-3.5 fill-white text-white" }),
                /* @__PURE__ */ jsx("span", { children: c.rating || 4.9 })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-4 space-y-3 flex-1 flex flex-col justify-between", children: [
              /* @__PURE__ */ jsx("div", { className: "space-y-2 text-xs text-muted-foreground", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/60", children: [
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-foreground font-medium", children: [
                  /* @__PURE__ */ jsx(Phone, { className: "h-3.5 w-3.5 text-emerald-600" }),
                  " ",
                  c.phone || "Phone Unlisted"
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-muted-foreground", children: [
                  /* @__PURE__ */ jsx(Mail, { className: "h-3.5 w-3.5 text-blue-600" }),
                  " Email"
                ] })
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "pt-2 border-t border-border/50 flex items-center justify-between mt-auto", onClick: (e) => e.stopPropagation(), children: [
                /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-bold uppercase", children: "Verified Partner" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-muted-foreground hover:text-emerald-600", onClick: () => setInspectorContractor(c), title: "Inspect", children: /* @__PURE__ */ jsx(Eye, { className: "h-3.5 w-3.5" }) }),
                  /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-muted-foreground hover:text-foreground", onClick: () => handleOpenEdit(c), title: "Edit", children: /* @__PURE__ */ jsx(Edit, { className: "h-3.5 w-3.5" }) }),
                  /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-rose-500/70 hover:text-rose-600 hover:bg-rose-50", onClick: () => setDeleteTarget(c), title: "Delete", children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }) })
                ] })
              ] })
            ] })
          ]
        },
        c.id
      );
    }) }),
    /* @__PURE__ */ jsx(Sheet, { open: showFormSheet, onOpenChange: setShowFormSheet, children: /* @__PURE__ */ jsxs(SheetContent, { className: "sm:max-w-md overflow-y-auto", children: [
      /* @__PURE__ */ jsxs(SheetHeader, { className: "mb-4", children: [
        /* @__PURE__ */ jsx(SheetTitle, { children: editingId ? "Edit Contractor Record" : "Onboard New Trade Vendor" }),
        /* @__PURE__ */ jsx(SheetDescription, { children: "Maintain contractor contact details and license information" })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSave, className: "space-y-4 text-xs", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Contractor / Firm Name *" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: formData.name,
              onChange: (e) => setFormData({ ...formData, name: e.target.value }),
              className: "h-9 text-xs mt-1",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Trade Specialty" }),
          /* @__PURE__ */ jsxs(Select, { value: formData.specialty, onValueChange: (v) => setFormData({ ...formData, specialty: v }), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 text-xs mt-1", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "Plumbing", className: "text-xs", children: "Plumbing" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "Electrical", className: "text-xs", children: "Electrical" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "HVAC Aircon", className: "text-xs", children: "HVAC Aircon" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "General Trade", className: "text-xs", children: "General Trade" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "Roofing & Masonry", className: "text-xs", children: "Roofing & Masonry" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Phone" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: formData.phone,
                onChange: (e) => setFormData({ ...formData, phone: e.target.value }),
                className: "h-9 text-xs mt-1"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Email" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: formData.email,
                onChange: (e) => setFormData({ ...formData, email: e.target.value }),
                className: "h-9 text-xs mt-1"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white mt-2", children: "Save Vendor Record" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Sheet, { open: !!inspectorContractor, onOpenChange: (open) => !open && setInspectorContractor(null), children: /* @__PURE__ */ jsx(SheetContent, { className: "sm:max-w-xl overflow-y-auto p-0 flex flex-col font-sans", children: inspectorContractor && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs(SheetHeader, { className: "p-6 border-b border-border bg-muted/20", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs uppercase font-mono tracking-wider", children: inspectorContractor.specialty || "General Trade" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded-md", children: [
            /* @__PURE__ */ jsx(Star, { className: "h-3.5 w-3.5 fill-amber-500" }),
            /* @__PURE__ */ jsxs("span", { children: [
              inspectorContractor.rating || 4.9,
              " Audit Score"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(SheetTitle, { className: "text-xl font-bold text-foreground mt-2", children: inspectorContractor.name })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "p-6 space-y-6 flex-1", children: /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl border border-border bg-card space-y-2 text-xs", children: [
        /* @__PURE__ */ jsxs("p", { className: "font-semibold text-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Phone, { className: "h-4 w-4 text-emerald-600" }),
          " ",
          inspectorContractor.phone || "Phone Unlisted"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "font-semibold text-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Mail, { className: "h-4 w-4 text-blue-600" }),
          " ",
          inspectorContractor.email || "Email Unlisted"
        ] })
      ] }) })
    ] }) }) }),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!deleteTarget, onOpenChange: (open) => !open && setDeleteTarget(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Delete Contractor" }),
        /* @__PURE__ */ jsxs(AlertDialogDescription, { children: [
          "Are you sure you want to remove ",
          deleteTarget?.name,
          " from vendor registry?"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Cancel" }),
        /* @__PURE__ */ jsx(AlertDialogAction, { onClick: handleDelete, className: "bg-rose-600 hover:bg-rose-700 text-white", children: "Delete Record" })
      ] })
    ] }) })
  ] });
}
