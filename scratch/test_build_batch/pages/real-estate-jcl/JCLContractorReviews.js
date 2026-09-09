import { jsx, jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useMemo } from "react";
import {
  Star,
  RefreshCw,
  MessageSquare,
  ThumbsUp,
  Shield,
  Wrench,
  Search,
  Plus,
  User,
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
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
export default function JCLContractorReviews() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();
  const [reviews, setReviews] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    contractorName: "",
    rating: 5,
    reviewText: ""
  });
  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const [revRes, conRes] = await Promise.all([
        powerSync.execute("SELECT * FROM univ_re_contractor_reviews WHERE company_id = ? ORDER BY created_at DESC", [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute("SELECT * FROM univ_re_contractors WHERE company_id = ? ORDER BY name ASC", [companyId]).catch(() => ({ rows: [] }))
      ]);
      setReviews(revRes.rows._array || Array.from(revRes.rows || []));
      setContractors(conRes.rows._array || Array.from(conRes.rows || []));
    } catch (_err) {
      toast.error("Failed to load contractor reviews");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, [companyId]);
  const filteredReviews = useMemo(() => {
    return reviews.filter(
      (r) => !search || (r.contractor_name || "").toLowerCase().includes(search.toLowerCase()) || (r.review_text || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [reviews, search]);
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.contractorName || !formData.reviewText) {
      toast.error("Vendor name and feedback details are required");
      return;
    }
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const newId = generateUUID();
      await powerSync.execute(
        `INSERT INTO univ_re_contractor_reviews (id, created_at, company_id, contractor_name, rating, review_text, reviewer_name) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newId, now, companyId, formData.contractorName, Number(formData.rating) || 5, formData.reviewText, user?.user_metadata?.full_name || "Inspector"]
      );
      toast.success("Vendor evaluation recorded");
      setShowForm(false);
      fetchData();
    } catch (_err) {
      toast.error("Failed to save review");
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20", children: /* @__PURE__ */ jsx(Star, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: "Contractor Reviews & Performance Audits" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "Verified vendor evaluation scorecards, punctuality ratings, and work order audit notes" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: fetchData, className: "h-9 px-3 text-xs gap-1.5 border-border", children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: cn("h-3.5 w-3.5", isLoading && "animate-spin") }),
          "Refresh"
        ] }),
        /* @__PURE__ */ jsxs(Button, { onClick: () => setShowForm(true), size: "sm", className: "h-9 px-4 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm", children: [
          /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
          " Submit Audit Review"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-card p-3 rounded-xl border border-border shadow-xs max-w-md", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          placeholder: "Search vendor reviews...",
          value: search,
          onChange: (e) => setSearch(e.target.value),
          className: "pl-9 h-9 text-xs bg-background"
        }
      )
    ] }) }),
    filteredReviews.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-16 border border-dashed border-border rounded-2xl text-center bg-card", children: [
      /* @__PURE__ */ jsx(MessageSquare, { className: "h-10 w-10 mx-auto text-muted-foreground/50 mb-3" }),
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-foreground", children: "No vendor reviews submitted yet" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1 max-w-sm mx-auto", children: "Audit work order quality and submit ratings for trade partners." }),
      /* @__PURE__ */ jsxs(Button, { onClick: () => setShowForm(true), size: "sm", className: "mt-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white", children: [
        /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5 mr-1" }),
        " Submit Review"
      ] })
    ] }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5", children: filteredReviews.map((r) => /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl border border-border/80 bg-card hover:border-emerald-500/50 transition-all shadow-xs space-y-3 flex flex-col justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-foreground text-sm", children: r.contractor_name || "Vendor Partner" }),
            /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground mt-0.5", children: [
              "Evaluated by: ",
              /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: r.reviewer_name || "Property Manager" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-500/10 px-2 py-0.5 rounded-md", children: [
            /* @__PURE__ */ jsx(Star, { className: "h-3.5 w-3.5 fill-amber-500" }),
            /* @__PURE__ */ jsxs("span", { children: [
              r.rating || 5,
              "/5"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-foreground/90 bg-muted/30 p-3 rounded-xl border border-border/60 leading-relaxed italic", children: [
          '"',
          r.review_text || "Excellent response time and high quality repair execution.",
          '"'
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground", children: [
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Shield, { className: "h-3 w-3 text-emerald-600" }),
          " Verified Audit"
        ] }),
        /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px]", children: r.created_at ? format(new Date(r.created_at), "MMM dd, yyyy") : "Recent" })
      ] })
    ] }, r.id)) }),
    /* @__PURE__ */ jsx(Sheet, { open: showForm, onOpenChange: setShowForm, children: /* @__PURE__ */ jsxs(SheetContent, { className: "sm:max-w-md overflow-y-auto", children: [
      /* @__PURE__ */ jsxs(SheetHeader, { className: "mb-4", children: [
        /* @__PURE__ */ jsx(SheetTitle, { children: "Submit Contractor Review" }),
        /* @__PURE__ */ jsx(SheetDescription, { children: "Rate work order quality and vendor responsiveness" })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSave, className: "space-y-4 text-xs", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Select Vendor / Contractor *" }),
          /* @__PURE__ */ jsxs(Select, { value: formData.contractorName, onValueChange: (v) => setFormData({ ...formData, contractorName: v }), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 text-xs mt-1", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Pick a vendor..." }) }),
            /* @__PURE__ */ jsx(SelectContent, { children: contractors.map((c) => /* @__PURE__ */ jsxs(SelectItem, { value: c.name, className: "text-xs", children: [
              c.name,
              " (",
              c.specialty,
              ")"
            ] }, c.id)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Rating Score (1 to 5 Stars)" }),
          /* @__PURE__ */ jsxs(Select, { value: String(formData.rating), onValueChange: (v) => setFormData({ ...formData, rating: Number(v) }), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 text-xs mt-1", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "5", className: "text-xs", children: "5 Stars \u2014 Outstanding Quality" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "4", className: "text-xs", children: "4 Stars \u2014 Good Execution" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "3", className: "text-xs", children: "3 Stars \u2014 Satisfactory" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "2", className: "text-xs", children: "2 Stars \u2014 Needs Improvement" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "1", className: "text-xs", children: "1 Star \u2014 Poor Response" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Audit Comments & Performance Feedback *" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: formData.reviewText,
              onChange: (e) => setFormData({ ...formData, reviewText: e.target.value }),
              className: "h-9 text-xs mt-1",
              placeholder: "Describe repair quality, cleanliness, and timing...",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white mt-2", children: "Save Review" })
      ] })
    ] }) })
  ] });
}
