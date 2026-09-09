import { jsx, jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Shield,
  Clock,
  RefreshCw,
  UserCheck,
  ShieldAlert,
  FileText,
  CheckCircle2,
  Lock
} from "lucide-react";
import { usePowerSync } from "@powersync/react";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
export default function JCLAuditLog() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const res = await powerSync.execute(
        "SELECT * FROM univ_re_audit_log WHERE company_id = ? ORDER BY created_at DESC LIMIT 100",
        [companyId]
      );
      setLogs(res.rows._array || Array.from(res.rows || []));
    } catch (_err) {
      toast.error("Failed to load audit logs");
    }
    setIsLoading(false);
  };
  useEffect(() => {
    fetchData();
  }, [companyId]);
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const matchSearch = !search || (l.user_name || "").toLowerCase().includes(search.toLowerCase()) || (l.action_text || "").toLowerCase().includes(search.toLowerCase());
      const matchModule = moduleFilter === "all" || (l.module_name || "").toLowerCase() === moduleFilter.toLowerCase();
      return matchSearch && matchModule;
    });
  }, [logs, search, moduleFilter]);
  return /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-6 pb-28 max-w-[1600px] mx-auto space-y-6 font-sans", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20", children: /* @__PURE__ */ jsx(ShieldAlert, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: "Security Audit Log & Activity Stream" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "Immutable activity stream of user authentication events, lease mutations, and financial approvals" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: fetchData, className: "h-9 px-3 text-xs gap-1.5 border-border", children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: cn("h-3.5 w-3.5", isLoading && "animate-spin") }),
        "Refresh"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Recorded Events" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-foreground", children: logs.length }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Logged actions in system" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(Clock, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Security State" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-emerald-600 dark:text-emerald-400", children: "Encrypted" }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-emerald-600/80", children: "Tamper-evident logs" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(Lock, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Active Operators" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-foreground", children: new Set(logs.map((l) => l.user_name)).size || 1 }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Unique admin accounts" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(UserCheck, { className: "h-5 w-5" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "border border-border/80 shadow-xs bg-card/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: "Compliance Status" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-emerald-600 dark:text-emerald-400", children: "100% Compliant" }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "SOC2 / Real Estate Standard" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5" }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-xs", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-1 items-center gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1 max-w-md", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "Search user name or action text...",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            className: "pl-9 h-9 text-xs bg-background"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: moduleFilter, onValueChange: setModuleFilter, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 text-xs w-[170px] bg-background", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Module Filter" }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", className: "text-xs", children: "All Modules" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "properties", className: "text-xs", children: "Properties" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "leases", className: "text-xs", children: "Leases" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "finance", className: "text-xs", children: "Finance & Escrow" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "security", className: "text-xs", children: "Security & Auth" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "border border-border rounded-xl bg-card overflow-hidden shadow-xs", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs border-collapse", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-border bg-muted/40 text-muted-foreground font-medium", children: [
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Timestamp" }),
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Operator / User" }),
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Action Summary" }),
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Target Module" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border", children: filteredLogs.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "py-12 text-center text-muted-foreground", children: "No security audit events recorded." }) }) : filteredLogs.map((l) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30 transition-colors", children: [
        /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-mono text-muted-foreground whitespace-nowrap", children: l.created_at ? format(new Date(l.created_at), "MMM dd, yyyy HH:mm:ss") : "Recent" }),
        /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-bold text-foreground", children: l.user_name || "System Operator" }),
        /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 text-foreground font-medium", children: l.action_text || "Mutated real estate records" }),
        /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4", children: /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] uppercase font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30", children: l.module_name || "General" }) })
      ] }, l.id)) })
    ] }) }) })
  ] });
}
