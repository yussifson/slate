import { jsx, jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from "react";
import {
  Percent,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Award
} from "lucide-react";
import { usePowerSync } from "@powersync/react";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
export default function JCLCommissionRules() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const res = await powerSync.execute(
        "SELECT * FROM univ_re_commission_rules WHERE company_id = ? ORDER BY created_at DESC",
        [companyId]
      );
      setRules(res.rows._array || Array.from(res.rows || []));
    } catch (_err) {
      toast.error("Failed to load commission rules");
    }
    setIsLoading(false);
  };
  useEffect(() => {
    fetchData();
  }, [companyId]);
  return /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-6 pb-28 w-full max-w-full space-y-6 font-sans", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20", children: /* @__PURE__ */ jsx(Percent, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: "Commission Policy Tiers & Rules" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "Graduated brokerage split tiers, sales target thresholds, and agent commission structures" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: fetchData, className: "h-9 px-3 text-xs gap-1.5 border-border", children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: cn("h-3.5 w-3.5", isLoading && "animate-spin") }),
        "Refresh"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "border border-border rounded-xl bg-card overflow-hidden shadow-xs", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs border-collapse", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-border bg-muted/40 text-muted-foreground font-medium", children: [
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Tier Name" }),
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Min Target Volume" }),
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Agent Split %" }),
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Brokerage Fee %" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border", children: rules.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "py-8 text-center text-muted-foreground", children: "No custom commission tiers configured. Standard 70/30 split active." }) }) : rules.map((r) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30 transition-colors", children: [
        /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 font-bold text-foreground", children: r.rule_name || "Standard Tier" }),
        /* @__PURE__ */ jsxs("td", { className: "py-3.5 px-4 font-mono", children: [
          "$",
          (r.min_volume || 0).toLocaleString()
        ] }),
        /* @__PURE__ */ jsxs("td", { className: "py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400", children: [
          r.agent_split || 70,
          "%"
        ] }),
        /* @__PURE__ */ jsxs("td", { className: "py-3.5 px-4 font-mono", children: [
          100 - (r.agent_split || 70),
          "%"
        ] })
      ] }, r.id)) })
    ] }) }) })
  ] });
}
