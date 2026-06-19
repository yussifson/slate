import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
              <Label>{t("firm_name", "Firm Name *")}</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>{t("contact_email", "Contact Email *")}</Label>
              <Input value={form.email} onChange={e => set("email", e.target.value)} type="email" required />
            </div>
            <div className="space-y-1.5">
              <Label>{t("phone", "Phone")}</Label>
              <Input value={form.phone} onChange={e => set("phone", e.target.value)} />
            </div>
            <div className="col-span-2 pt-2 border-t border-primary/40">
              <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2.5 tracking-[0.04em]"><UserPlus className="w-3.5 h-3.5" />{t("company_admin", "Company Admin")}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("admin_full_name", "Admin Full Name")} {!initialData && <span className="text-[#71717a] dark:text-gray-400 text-xs tracking-[0.04em]">{t("optional", "(optional)")}</span>}</Label>
                  <Input value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Jane Mensah" disabled={!!initialData} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("admin_email", "Admin Email")} {!initialData && <span className="text-[#71717a] dark:text-gray-400 text-xs tracking-[0.04em]">{t("optional", "(optional)")}</span>}</Label>
                  <Input value={form.admin_email} onChange={e => set("admin_email", e.target.value)} type="email" placeholder="admin@firm.com" />
                </div>
              </div>
              {!initialData && form.admin_email && (
                <div className="mt-2 flex items-center gap-2 text-xs text-orange-700 bg-orange-50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-xl px-3 py-2 tracking-[0.04em]">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  {t("a_login_invitation_will_be_sen", "A login invitation will be sent to")} <strong className="ml-1">{form.admin_email}</strong> {t("with_company_admin_access", "with Company Admin access.")}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{t("country", "Country *")}</Label>
              <Select value={form.country} onValueChange={v => set("country", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{COUNTRIES.map(c => {
                  return <SelectItem key={c} value={c}>{c}</SelectItem>;
                })}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("city", "City")}</Label>
              <Input value={form.city} onChange={e => set("city", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("currency", "Currency")}</Label>
              <Select value={form.currency} onValueChange={v => set("currency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GHS">{t("ghs_gh", "GHS (GH₵)")}</SelectItem>
                  <SelectItem value="NGN">{t("ngn", "NGN (₦)")}</SelectItem>
                  <SelectItem value="SLL">{t("sll_le", "SLL (Le)")}</SelectItem>
                  <SelectItem value="USD">{t("usd", "USD ($)")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("status", "Status")}</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("active", "Active")}</SelectItem>
                  <SelectItem value="suspended">{t("suspended", "Suspended")}</SelectItem>
                  <SelectItem value="pending">{t("pending", "Pending")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 pt-2 border-t border-primary/40">
              <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wide mb-3 tracking-[0.04em]">{t("subscription", "Subscription")}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("plan", "Plan")}</Label>
                  <Select value={form.subscription_plan} onValueChange={handlePlanChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(SUBSCRIPTION_PLANS).map(([k, v]) => {
                        return (<SelectItem key={k} value={k}>{v.name}— ${v.price}{t("mo", "/mo")}</SelectItem>);
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("subscription_status", "Subscription Status")}</Label>
                  <Select value={form.subscription_status} onValueChange={v => set("subscription_status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t("active", "Active")}</SelectItem>
                      <SelectItem value="trial">{t("trial", "Trial")}</SelectItem>
                      <SelectItem value="inactive">{t("inactive", "Inactive")}</SelectItem>
                      <SelectItem value="expired">{t("expired", "Expired")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="col-span-2 pt-2 border-t border-primary/40">
              <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wide mb-3 tracking-[0.04em]">{t("usage_limits", "Usage Limits")}</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("max_users", "Max Users")}</Label>
                  <Input type="number" value={form.max_users} onChange={e => set("max_users", parseInt(e.target.value))} min={1} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("max_cases", "Max Cases")}</Label>
                  <Input type="number" value={form.max_cases} onChange={e => set("max_cases", parseInt(e.target.value))} min={1} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("storage_gb", "Storage (GB)")}</Label>
                  <Input type="number" value={form.max_storage_gb} onChange={e => set("max_storage_gb", parseInt(e.target.value))} min={1} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>{t("cancel", "Cancel")}</Button>
            <Button type="submit">{initialData ? "Save Changes" : "Create Firm"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}