import { jsx, jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Search,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle2,
  Zap,
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
export default function JCLPaymentSchedules() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    leaseId: "",
    paymentAmount: 1800,
    paymentDueDate: 1,
    gracePeriodDays: 5,
    lateFeePercentage: 5,
    autoDebitEnabled: true
  });
  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const res = await powerSync.execute(
        "SELECT * FROM univ_re_rent_payment_schedules WHERE company_id = ? ORDER BY created_at DESC",
        [companyId]
      );
      setSchedules(res.rows._array || Array.from(res.rows || []));
    } catch (_err) {
      toast.error("Failed to load payment schedules");
    }
    setIsLoading(false);
  };
  useEffect(() => {
    fetchData();
  }, [companyId]);
  return /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-6 pb-28 w-full max-w-full space-y-6 font-sans", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20", children: /* @__PURE__ */ jsx(Calendar, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: "Payment Schedules & Auto-Debit Rules" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "Automated monthly rent payment dates, grace period thresholds, and late penalty triggers" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: fetchData, className: "h-9 px-3 text-xs gap-1.5 border-border", children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: cn("h-3.5 w-3.5", isLoading && "animate-spin") }),
          "Refresh"
        ] }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            onClick: () => setShowForm(true),
            size: "sm",
            className: "h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 gap-1.5",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
              "Add Schedule Rule"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "border border-border rounded-xl bg-card overflow-hidden shadow-xs", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs border-collapse", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-border bg-muted/40 text-muted-foreground font-medium", children: [
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Lease Reference" }),
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Monthly Amount" }),
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Due Day" }),
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Grace Period" }),
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Late Fee" }),
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Auto Debit" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border", children: schedules.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "py-8 text-center text-muted-foreground", children: "No active payment schedule rules configured." }) }) : schedules.map((item) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30 transition-colors", children: [
        /* @__PURE__ */ jsx("td", { className: "py-3 px-4 font-mono font-bold", children: item.lease_id || "LS-GENERAL" }),
        /* @__PURE__ */ jsx("td", { className: "py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono", children: formatCurrency(item.payment_amount, "USD") }),
        /* @__PURE__ */ jsxs("td", { className: "py-3 px-4 font-semibold", children: [
          item.payment_due_date || 1,
          "st of Month"
        ] }),
        /* @__PURE__ */ jsxs("td", { className: "py-3 px-4 text-muted-foreground", children: [
          item.grace_period_days || 5,
          " Days"
        ] }),
        /* @__PURE__ */ jsxs("td", { className: "py-3 px-4 font-mono text-xs", children: [
          item.late_fee_percentage || 5,
          "%"
        ] }),
        /* @__PURE__ */ jsx("td", { className: "py-3 px-4", children: /* @__PURE__ */ jsx(Badge, { variant: "outline", className: cn("text-[10px] uppercase font-bold", item.auto_debit_enabled ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" : "bg-slate-500/10 text-slate-700 border-slate-300"), children: item.auto_debit_enabled ? "Active" : "Disabled" }) })
      ] }, item.id)) })
    ] }) }) })
  ] });
}
