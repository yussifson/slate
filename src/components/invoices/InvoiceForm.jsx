import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/constants";

export default function InvoiceForm({ open, onClose, onSubmit, initialData, clients, currency, clientTerm = "Client" }) {
  const [form, setForm] = useState({
    invoice_number: "", client_id: "", client_name: "", status: "draft",
    due_date: "", payment_method: "", notes: "",
    items: [{ description: "", quantity: 1, unit_price: 0, total: 0 }]
  });

  useEffect(() => {
    if (initialData) setForm(initialData);
    else setForm({
      invoice_number: `INV-${Date.now().toString().slice(-6)}`,
      client_id: "", client_name: "", status: "draft",
      due_date: "", payment_method: "", notes: "",
      items: [{ description: "", quantity: 1, unit_price: 0, total: 0 }]
    });
  }, [initialData, open]);

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
            <div><Label>Invoice #</Label><Input value={form.invoice_number} onChange={(e) => handleChange("invoice_number", e.target.value)} /></div>
            <div>
              <Label>{clientTerm} <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Select value={form.client_id} onValueChange={handleClientChange}>
                <SelectTrigger><SelectValue placeholder={`Select ${clientTerm.toLowerCase()}`} /></SelectTrigger>
                <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Due Date <span className="text-muted-foreground text-xs">(optional)</span></Label><Input type="date" value={form.due_date} onChange={(e) => handleChange("due_date", e.target.value)} /></div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" /> Add Item</Button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, idx) => (
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
                    {formatCurrency(item.total, currency)}
                  </div>
                  <div className="col-span-1">
                    {form.items.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-3 text-lg font-bold">
              Total: {formatCurrency(subtotal, currency)}
            </div>
          </div>

          <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} rows={2} /></div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{initialData ? "Update" : "Create"} Invoice</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}