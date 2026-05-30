import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EXPENSE_CATEGORIES = [
  { value: "travel", label: "Travel" },
  { value: "filing_fees", label: "Filing Fees" },
  { value: "court_costs", label: "Court Costs" },
  { value: "postage", label: "Postage" },
  { value: "printing", label: "Printing" },
  { value: "accommodation", label: "Accommodation" },
  { value: "expert_fees", label: "Expert Fees" },
  { value: "translation", label: "Translation" },
  { value: "other", label: "Other" },
];

export default function ExpenseForm({ open, onClose, onSubmit, initialData, cases, clients, currency }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    description: "",
    category: "other",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    case_id: "",
    case_title: "",
    client_id: "",
    client_name: "",
    billable: true,
    notes: "",
  });

  useEffect(() => {
    if (initialData) setForm(initialData);
    else setForm({
      description: "",
      category: "other",
      amount: "",
      expense_date: new Date().toISOString().split("T")[0],
      case_id: "",
      case_title: "",
      client_id: "",
      client_name: "",
      billable: true,
      notes: "",
    });
  }, [initialData, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCaseChange = (caseId) => {
    const c = cases.find(c => c.id === caseId);
    set("case_id", caseId);
    set("case_title", c?.title || "");
    if (c?.client_id) {
      set("client_id", c.client_id);
      set("client_name", c.client_name || "");
    }
  };

  const handleClientChange = (clientId) => {
    const c = clients.find(c => c.id === clientId);
    set("client_id", clientId);
    set("client_name", c?.name || "");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, amount: Number(form.amount) });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData?.id ? "Edit Expense" : "Log Expense"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>{t("description", "Description *")}</Label>
            <Input value={form.description} onChange={e => set("description", e.target.value)} placeholder="e.g. Court filing fee for case X" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("expense_type", "Expense Type *")}</Label>
              <Select value={form.category} onValueChange={v => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => {
                    return (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>);
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("amount", "Amount (")}{currency}) *</Label>
              <Input type="number" min="0" step="0.01" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="0.00" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("date", "Date")}</Label>
              <Input type="date" value={form.expense_date} onChange={e => set("expense_date", e.target.value)} />
            </div>
            <div>
              <Label>{t("billable_to_client", "Billable to Client?")}</Label>
              <Select value={form.billable ? "yes" : "no"} onValueChange={v => set("billable", v === "yes")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">{t("yes_billable", "Yes — Billable")}</SelectItem>
                  <SelectItem value="no">{t("no_internal", "No — Internal")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>{t("related_case", "Related Case")}</Label>
            <Select value={form.case_id || "none"} onValueChange={v => v === "none" ? (set("case_id", ""), set("case_title", "")) : handleCaseChange(v)}>
              <SelectTrigger><SelectValue placeholder="Select case (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("none", "None")}</SelectItem>
                {cases.map(c => {
                  return <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>

          {!form.case_id && (
            <div>
              <Label>{t("client", "Client")}</Label>
              <Select value={form.client_id || "none"} onValueChange={v => v === "none" ? (set("client_id", ""), set("client_name", "")) : handleClientChange(v)}>
                <SelectTrigger><SelectValue placeholder="Select client (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("none", "None")}</SelectItem>
                  {clients.map(c => {
                    return <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>{t("notes", "Notes")}</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t("cancel", "Cancel")}</Button>
            <Button type="submit">{initialData?.id ? "Update" : "Log"} {t("expense", "Expense")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}