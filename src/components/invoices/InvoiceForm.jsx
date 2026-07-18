import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/constants";

export default function InvoiceForm({ open, onClose, onSubmit, initialData, clients, currency: defaultCurrency }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    invoice_number: "", client_id: "", client_name: "", status: "draft",
    due_date: "", due_time: "", currency: "GHS", exchange_rate: 1.0, payment_method: "", notes: "",
    items: [{ description: "", quantity: 1, unit_price: 0, total: 0 }]
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        ...initialData,
        currency: initialData.currency || defaultCurrency || "GHS",
        exchange_rate: initialData.exchange_rate || 1.0,
        due_time: initialData.due_time || ""
      });
    } else {
      setForm({
        invoice_number: `INV-${Date.now().toString().slice(-6)}`,
        client_id: "", client_name: "", status: "draft",
        due_date: "", due_time: "", currency: defaultCurrency || "GHS", exchange_rate: 1.0, payment_method: "", notes: "",
        items: [{ description: "", quantity: 1, unit_price: 0, total: 0 }]
      });
    }
  }, [initialData, open, defaultCurrency]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleClientChange = (clientId) => {
    const client = clients?.find(c => c.id === clientId);
    setForm(prev => ({ ...prev, client_id: clientId, client_name: client?.name || "" }));
  };

  const handleItemChange = (idx, field, value) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    if (field === "quantity" || field === "unit_price") {
      items[idx].total = (items[idx].quantity || 0) * (items[idx].unit_price || 0);
    }
    setForm(prev => ({ ...prev, items }));
  };

  const addItem = () => setForm(prev => ({ ...prev, items: [...prev.items, { description: "", quantity: 1, unit_price: 0, total: 0 }] }));
  const removeItem = (idx) => setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const subtotal = form.items.reduce((sum, item) => sum + (item.total || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, subtotal, total_amount: subtotal });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initialData ? "Edit Invoice" : "New Invoice"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>{t("invoice", "Invoice #")}</Label><Input value={form.invoice_number} onChange={(e) => handleChange("invoice_number", e.target.value)} /></div>
            <div>
              <Label>{t("client", "Client")} <span className="text-[#71717a] dark:text-gray-400 text-xs tracking-[0.04em]">{t("optional", "(optional)")}</span></Label>
              <Select value={form.client_id} onValueChange={handleClientChange}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>{clients?.map(c => {
                  return <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>;
                })}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("status", "Status")}</Label>
              <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t("draft", "Draft")}</SelectItem>
                  <SelectItem value="sent">{t("sent", "Sent")}</SelectItem>
                  <SelectItem value="paid">{t("paid", "Paid")}</SelectItem>
                  <SelectItem value="overdue">{t("overdue", "Overdue")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Due Date and Time side-by-side */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{t("due_date", "Due Date")}</Label>
                <Input type="date" value={form.due_date} onChange={(e) => handleChange("due_date", e.target.value)} />
              </div>
              <div>
                <Label>{t("due_time", "Due Time")}</Label>
                <Input type="time" value={form.due_time} onChange={(e) => handleChange("due_time", e.target.value)} />
              </div>
            </div>

            {/* Currency and Exchange Rate */}
            <div>
              <Label>{t("currency", "Currency")}</Label>
              <Select value={form.currency} onValueChange={(v) => handleChange("currency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GHS">{t("ghs_ghana_cedi", "GHS (Ghana Cedi)")}</SelectItem>
                  <SelectItem value="NGN">{t("ngn_nigerian_naira", "NGN (Nigerian Naira)")}</SelectItem>
                  <SelectItem value="SLL">{t("sll_sierra_leonean_leone", "SLL (Sierra Leonean Leone)")}</SelectItem>
                  <SelectItem value="USD">{t("usd_us_dollar", "USD (US Dollar)")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("exchange_rate_to_usd_or_base", "Exchange Rate (to USD or Base)")}</Label>
              <Input
                type="number"
                step="0.000001"
                min="0"
                value={form.exchange_rate}
                onChange={(e) => handleChange("exchange_rate", parseFloat(e.target.value) || 1.0)}
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>{t("line_items", "Line Items")}</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" /> {t("add_item", "Add Item")}</Button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, idx) => {
                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Input placeholder="Description" value={item.description} onChange={(e) => handleItemChange(idx, "description", e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))} />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => handleItemChange(idx, "unit_price", Number(e.target.value))} />
                    </div>
                    <div className="col-span-2 text-sm font-medium text-right py-2">
                      {formatCurrency(item.total, form.currency)}
                    </div>
                    <div className="col-span-1">
                      {form.items.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end mt-3 text-lg font-semibold">
              {t("total", "Total:")} {formatCurrency(subtotal, form.currency)}
            </div>
          </div>

          <div><Label>{t("notes", "Notes")}</Label><Textarea value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} rows={2} /></div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>{t("cancel", "Cancel")}</Button>
            <Button type="submit">{initialData ? "Update" : "Create"} {t("invoice", "Invoice")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
