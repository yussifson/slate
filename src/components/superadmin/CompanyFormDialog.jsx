import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import { UserPlus, Mail } from "lucide-react";

const COUNTRIES = ["Ghana", "Nigeria", "Sierra Leone"];

const emptyForm = {
  name: "", email: "", phone: "", country: "Ghana", city: "", address: "",
  subscription_plan: "free", subscription_status: "trial",
  currency: "GHS", status: "active", admin_email: "",
  max_users: 2, max_cases: 10, max_storage_gb: 1
};

export default function CompanyFormDialog({ open, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(emptyForm);
  const [adminName, setAdminName] = useState("");
  const [inviteAdmin, setInviteAdmin] = useState(true);

  useEffect(() => {
    setForm(initialData || emptyForm);
    setAdminName("");
    setInviteAdmin(true);
  }, [initialData, open]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handlePlanChange = (v) => {
    const p = SUBSCRIPTION_PLANS[v];
    setForm(prev => ({ ...prev, subscription_plan: v, max_users: p?.maxUsers || 2, max_cases: p?.maxCases || 10, max_storage_gb: p?.maxStorageGB || 1 }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initialData ? "Edit Firm" : "Add New Firm"}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ form, adminName: inviteAdmin ? adminName : null }); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Firm Name *</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Contact Email *</Label>
              <Input value={form.email} onChange={e => set("email", e.target.value)} type="email" required />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => set("phone", e.target.value)} />
            </div>
            <div className="col-span-2 pt-2 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5"><UserPlus className="w-3.5 h-3.5" />Company Admin</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Admin Full Name {!initialData && <span className="text-muted-foreground text-xs">(optional)</span>}</Label>
                  <Input value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Jane Mensah" disabled={!!initialData} />
                </div>
                <div className="space-y-1.5">
                  <Label>Admin Email {!initialData && <span className="text-muted-foreground text-xs">(optional)</span>}</Label>
                  <Input value={form.admin_email} onChange={e => set("admin_email", e.target.value)} type="email" placeholder="admin@firm.com" />
                </div>
              </div>
              {!initialData && form.admin_email && (
                <div className="mt-2 flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  A login invitation will be sent to <strong className="ml-1">{form.admin_email}</strong> with Company Admin access.
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Country *</Label>
              <Select value={form.country} onValueChange={v => set("country", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input value={form.city} onChange={e => set("city", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={v => set("currency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GHS">GHS (GH₵)</SelectItem>
                  <SelectItem value="NGN">NGN (₦)</SelectItem>
                  <SelectItem value="SLL">SLL (Le)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 pt-2 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Subscription</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Plan</Label>
                  <Select value={form.subscription_plan} onValueChange={handlePlanChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(SUBSCRIPTION_PLANS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.name} — ${v.price}/mo</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Subscription Status</Label>
                  <Select value={form.subscription_status} onValueChange={v => set("subscription_status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="col-span-2 pt-2 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Usage Limits</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Max Users</Label>
                  <Input type="number" value={form.max_users} onChange={e => set("max_users", parseInt(e.target.value))} min={1} />
                </div>
                <div className="space-y-1.5">
                  <Label>Max Cases</Label>
                  <Input type="number" value={form.max_cases} onChange={e => set("max_cases", parseInt(e.target.value))} min={1} />
                </div>
                <div className="space-y-1.5">
                  <Label>Storage (GB)</Label>
                  <Input type="number" value={form.max_storage_gb} onChange={e => set("max_storage_gb", parseInt(e.target.value))} min={1} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{initialData ? "Save Changes" : "Create Firm"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}