import { jsx, jsxs } from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
import React from "react";
import { RevenueForecastCard, BehaviourProfilePanel, BenchmarkingPanel } from "@/components/intelligence/IntelligenceUI";
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Plus, Receipt, Search, CheckCircle2, Clock, AlertCircle, Trash2 } from "lucide-react";
import ExportButton from "@/components/shared/ExportButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import InvoiceForm from "@/components/invoices/InvoiceForm";
import { INVOICE_STATUS_COLORS, formatCurrency } from "@/lib/constants";
import { format } from "date-fns";
import { usePayment } from "@/hooks/integrations/usePayment";
import { RefreshCcw, CreditCard } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
export default function Invoices() {
  const { t } = useTranslation();
  const { processPayment } = usePayment();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", companyId],
    queryFn: () => base44.entities.Invoice.filter({ company_id: companyId }),
    enabled: !!companyId
  });
  const { data: clients = [] } = useQuery({
    queryKey: ["clients", companyId],
    queryFn: () => base44.entities.Client.filter({ company_id: companyId }),
    enabled: !!companyId
  });
  const { data: company } = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      const list = await base44.entities.Company.list();
      return list.find((c) => c.id === companyId) || null;
    },
    enabled: !!companyId
  });
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create({ ...data, company_id: companyId, currency: data.currency || company?.currency || "GHS" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setShowForm(false);
      toast({ title: "Invoice created" });
    }
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setEditingInvoice(null);
      toast({ title: "Invoice updated" });
    }
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Invoice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Invoice deleted" });
    }
  });
  const currency = company?.currency || "GHS";
  const filtered = invoices.filter((i) => {
    const matchSearch = !search || i.client_name?.toLowerCase().includes(search.toLowerCase()) || i.invoice_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (i.total_amount || 0), 0);
  const totalPending = invoices.filter((i) => ["sent", "draft"].includes(i.status)).reduce((s, i) => s + (i.total_amount || 0), 0);
  const getPaymentStatusIcon = (status) => {
    if (status === "paid") return /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-primary/90 text-xs font-medium tracking-[0.04em]", children: [
      /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3.5 h-3.5" }),
      " ",
      t("paid", "Paid")
    ] });
    if (status === "overdue") return /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-red-600 text-xs font-medium tracking-[0.04em]", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "w-3.5 h-3.5" }),
      " ",
      t("overdue", "Overdue")
    ] });
    return /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-amber-600 text-xs font-medium tracking-[0.04em]", children: [
      /* @__PURE__ */ jsx(Clock, { className: "w-3.5 h-3.5" }),
      " ",
      t("pending", "Pending")
    ] });
  };
  const columns = [
    { header: "Invoice #", render: (row) => {
      return /* @__PURE__ */ jsx("span", { className: "font-medium text-sm", children: row.invoice_number || "\u2014" });
    } },
    { header: "Client", render: (row) => {
      return /* @__PURE__ */ jsx("span", { className: "text-sm", children: row.client_name });
    } },
    { header: "Amount", render: (row) => {
      return /* @__PURE__ */ jsx("span", { className: "font-semibold text-sm", children: formatCurrency(row.total_amount, row.currency) });
    } },
    { header: "Payment Status", render: (row) => getPaymentStatusIcon(row.status) },
    { header: "Status", render: (row) => {
      return /* @__PURE__ */ jsx(Badge, { className: `${INVOICE_STATUS_COLORS[row.status]} text-[10px]`, children: row.status });
    } },
    {
      header: "Due Date",
      render: (row) => {
        return /* @__PURE__ */ jsxs("span", { className: "text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]", children: [
          row.due_date ? format(new Date(row.due_date), "MMM d, yyyy") : "\u2014",
          row.due_time ? ` at ${row.due_time}` : ""
        ] });
      }
    },
    { header: "Paid Date", render: (row) => {
      return /* @__PURE__ */ jsx("span", { className: "text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]", children: row.paid_date ? format(new Date(row.paid_date), "MMM d, yyyy") : "\u2014" });
    } },
    {
      header: "Actions",
      render: (row) => {
        return /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            className: "h-8 w-8 text-destructive hover:bg-destructive/10",
            onClick: (e) => {
              e.stopPropagation();
              if (window.confirm(t("confirm_delete_invoice", "Are you sure you want to delete this invoice?"))) {
                deleteMutation.mutate(row.id);
              }
            },
            children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
          }
        );
      }
    }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx(
      PageHeader,
      {
        title: "Invoices",
        subtitle: `${formatCurrency(totalRevenue, currency)} collected \xB7 ${formatCurrency(totalPending, currency)} pending`,
        actions: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(ExportButton, { data: invoices.map((i) => ({ invoice_number: i.invoice_number, client: i.client_name, amount: i.total_amount, currency: i.currency, status: i.status, due_date: i.due_date, paid_date: i.paid_date })), filename: "invoices_export", label: "Export" }),
          /* @__PURE__ */ jsxs(Button, { onClick: () => setShowForm(true), size: "sm", children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-1" }),
            " ",
            t("new_invoice", "New Invoice")
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" }),
        /* @__PURE__ */ jsx(Input, { placeholder: "Search invoices...", className: "pl-9", value: search, onChange: (e) => setSearch(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-40", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: t("all_status", "All Status") }),
          /* @__PURE__ */ jsx(SelectItem, { value: "draft", children: t("draft", "Draft") }),
          /* @__PURE__ */ jsx(SelectItem, { value: "sent", children: t("sent", "Sent") }),
          /* @__PURE__ */ jsx(SelectItem, { value: "paid", children: t("paid", "Paid") }),
          /* @__PURE__ */ jsx(SelectItem, { value: "overdue", children: t("overdue", "Overdue") })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      DataTable,
      {
        columns,
        data: filtered,
        isLoading,
        onRowClick: (row) => setEditingInvoice(row),
        emptyTitle: "No invoices yet",
        emptyDescription: "Create your first invoice.",
        emptyIcon: Receipt
      }
    ),
    (showForm || editingInvoice) && /* @__PURE__ */ jsx(
      InvoiceForm,
      {
        open: showForm || !!editingInvoice,
        onClose: () => {
          setShowForm(false);
          setEditingInvoice(null);
        },
        onSubmit: (data) => editingInvoice ? updateMutation.mutate({ id: editingInvoice.id, data }) : createMutation.mutate(data),
        initialData: editingInvoice,
        clients,
        currency
      }
    )
  ] });
}
