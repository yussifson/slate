import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Receipt, Upload, CheckCircle, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/constants";
import { format } from "date-fns";

const CATEGORIES = ["travel", "filing_fees", "court_costs", "postage", "printing", "accommodation", "expert_fees", "translation", "other"];

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-slate-100 text-primary/90",
  rejected: "bg-red-100 text-red-700",
  billed: "bg-orange-100 text-orange-700",
};

export default function CaseExpenses({ caseData, user }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const canManage = ["super_admin", "company_admin"].includes(user?.role) || user?.email === caseData.assigned_lawyer;

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["case-expenses", caseData.id],
    queryFn: () => base44.entities.Expense.filter({ case_id: caseData.id }),
    enabled: !!caseData.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create({
      ...data,
      company_id: user?.company_id,
      case_id: caseData.id,
      case_title: caseData.title,
      client_id: caseData.client_id,
      client_name: caseData.client_name,
      logged_by: user?.email,
      logged_by_name: user?.full_name,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-expenses", caseData.id] });
      setShowForm(false);
      toast({ title: "Expense logged" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Expense.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["case-expenses", caseData.id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-expenses", caseData.id] });
      toast({ title: "Expense deleted" });
    },
  });

  const handleAddToInvoice = async () => {
    const unbilled = expenses.filter(e => e.billable && !e.billed && e.status === "approved");
    if (unbilled.length === 0) {
      toast({ title: "No approved, unbilled expenses to add", variant: "destructive" });
      return;
    }
    const items = unbilled.map(e => ({
      description: `[Expense] ${e.description} (${e.category?.replace("_", " ")})`,
      quantity: 1,
      unit_price: e.amount,
      total: e.amount,
    }));
    const total = unbilled.reduce((s, e) => s + (e.amount || 0), 0);
    const inv = await base44.entities.Invoice.create({
      company_id: user?.company_id,
      client_id: caseData.client_id,
      client_name: caseData.client_name,
      case_id: caseData.id,
      case_title: caseData.title,
      items,
      subtotal: total,
      total_amount: total,
      currency: user?.company_currency || "GHS",
      status: "draft",
    });
    for (const e of unbilled) {
      await base44.entities.Expense.update(e.id, { billed: true, status: "billed", invoice_id: inv.id });
    }
    queryClient.invalidateQueries({ queryKey: ["case-expenses", caseData.id] });
    toast({ title: `Draft invoice created with ${unbilled.length} expense(s)` });
  };

  const totalUnbilled = expenses.filter(e => e.billable && !e.billed).reduce((s, e) => s + (e.amount || 0), 0);
  const totalAll = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const currency = user?.company_currency || "GHS";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Expenses", value: formatCurrency(totalAll, currency), color: "text-foreground" },
          { label: "Unbilled", value: formatCurrency(totalUnbilled, currency), color: "text-amber-600" },
          { label: "Expenses Count", value: expenses.length, color: "text-foreground" },
        ].map(s => {
          return (
            <div key={s.label} className="bg-card rounded-xl border border-primary/40 p-3 text-center">
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{t("expense_log", "Expense Log")}</h3>
        <div className="flex gap-2">
          {canManage && totalUnbilled > 0 && (
            <Button variant="outline" size="sm" onClick={handleAddToInvoice} className="gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5" /> {t("add_to_invoice", "Add to Invoice")}
            </Button>
          )}
          {canManage && (
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> {t("log_expense", "Log Expense")}
            </Button>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">{t("loading", "Loading...")}</div>
      ) : expenses.length === 0 ? (
        <div className="bg-card rounded-xl border border-primary/40 p-10 text-center">
          <Receipt className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium">{t("no_expenses_logged_yet", "No expenses logged yet")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t(
            "track_case_related_costs_like_",
            "Track case-related costs like travel, filing fees, and more."
          )}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map(exp => {
            return (
              <div key={exp.id} className="bg-card rounded-xl border border-primary/40 px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Receipt className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{exp.description}</p>
                    <Badge className={`text-[10px] ${STATUS_COLORS[exp.status]}`}>{exp.status}</Badge>
                    {exp.billed && <Badge className="text-[10px] bg-orange-100 text-orange-700">{t("billed", "Billed")}</Badge>}
                    {!exp.billable && <Badge className="text-[10px] bg-gray-100 text-gray-600">{t("non_billable", "Non-billable")}</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground capitalize">{exp.category?.replace("_", " ")}</span>
                    {exp.expense_date && <span className="text-xs text-muted-foreground">{format(new Date(exp.expense_date), "MMM d, yyyy")}</span>}
                    <span className="text-xs text-muted-foreground">{t("by", "by")} {exp.logged_by_name || exp.logged_by}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold">{formatCurrency(exp.amount, exp.currency)}</span>
                  {exp.receipt_url && (
                    <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Receipt className="w-3.5 h-3.5" /></Button>
                    </a>
                  )}
                  {canManage && exp.status === "pending" && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateMutation.mutate({ id: exp.id, data: { status: "approved" } })}>
                      <CheckCircle className="w-3.5 h-3.5 text-primary" />
                    </Button>
                  )}
                  {canManage && !exp.billed && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(exp.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ExpenseFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        currency={user?.company_currency || "GHS"}
      />
    </div>
  );
}

function ExpenseFormDialog({ open, onClose, onSubmit, currency }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    description: "", category: "other", amount: "", expense_date: new Date().toISOString().split("T")[0],
    billable: true, notes: "", currency: currency || "GHS",
  });
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingReceipt(true);
    try {
      const path = `${Date.now()}_${file.name}`;
      await base44.storage.upload('documents', path, file);
      const file_url = base44.storage.getPublicUrl('documents', path);
      setForm(prev => ({ ...prev, receipt_url: file_url }));
    } catch (err) {
      console.error(err);
      alert("Upload failed. Ensure 'documents' bucket exists and is public.");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, amount: parseFloat(form.amount) });
    setForm({ description: "", category: "other", amount: "", expense_date: new Date().toISOString().split("T")[0], billable: true, notes: "", currency, receipt_url: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t("log_expense", "Log Expense")}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>{t("description", "Description")}</Label>
            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Filing fee for court application" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("category", "Category")}</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => {
                  return <SelectItem key={c} value={c} className="capitalize">{c.replace("_", " ")}</SelectItem>;
                })}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("amount", "Amount (")}{form.currency})</Label>
              <Input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label>{t("expense_date", "Expense Date")}</Label>
            <Input type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} />
          </div>
          <div>
            <Label>{t("receipt_optional", "Receipt (optional)")}</Label>
            <div className="mt-1 border-2 border-dashed border-primary/40 rounded-lg p-3 text-center">
              <input type="file" id="receipt-upload" className="hidden" onChange={handleReceiptUpload} accept="image/*,.pdf" />
              <label htmlFor="receipt-upload" className="text-sm text-primary cursor-pointer hover:underline">
                {uploadingReceipt ? "Uploading..." : form.receipt_url ? "✓ Receipt uploaded" : "Upload receipt"}
              </label>
            </div>
          </div>
          <div>
            <Label>{t("notes_optional", "Notes (optional)")}</Label>
            <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any additional details..." />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-primary/40 p-3">
            <div>
              <p className="text-sm font-medium">{t("billable_to_client", "Billable to client")}</p>
              <p className="text-xs text-muted-foreground">{t("include_this_in_client_invoice", "Include this in client invoice")}</p>
            </div>
            <Switch checked={form.billable} onCheckedChange={v => setForm({ ...form, billable: v })} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>{t("cancel", "Cancel")}</Button>
            <Button type="submit" disabled={uploading}>{t("log_expense", "Log Expense")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}