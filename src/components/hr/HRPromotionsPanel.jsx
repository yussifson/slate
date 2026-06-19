import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, ArrowUpCircle, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STATUS_COLORS = { pending: "bg-amber-100 text-amber-700", approved: "bg-slate-100 text-primary/90", rejected: "bg-red-100 text-red-700" };

export default function HRPromotionsPanel({ companyId, promotions, staff, currency, isAdmin, user }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Promotion.create({ ...data, company_id: companyId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["promotions", companyId] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Promotion.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["promotions", companyId] }),
  });

  const handleApprove = (p) => updateMutation.mutate({ id: p.id, data: { status: "approved", approved_by: user.email } });
  const handleReject = (p) => updateMutation.mutate({ id: p.id, data: { status: "rejected" } });

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> {t("record_promotion", "Record Promotion")}</Button>
        </div>
      )}
      {promotions.length === 0 ? (
        <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl p-10 text-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <ArrowUpCircle className="w-10 h-10 text-[#71717a] dark:text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-[#71717a] dark:text-gray-400">{t("no_promotions_recorded_yet", "No promotions recorded yet")}</p>
        </div>
      ) : (
        <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl divide-y divide-border hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          {promotions.map(p => {
            return (
              <div key={p.id} className="px-4 py-3 flex items-center gap-4">
                <div className="w-9 h-9 rounded-md-full bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-primary">{p.staff_name?.[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-sm font-medium">{p.staff_name}</span>
                    <Badge className={cn("text-[9px] h-4 px-1.5", STATUS_COLORS[p.status])}>{p.status}</Badge>
                  </div>
                  <p className="text-xs text-[#71717a] dark:text-gray-400 mt-0.5 tracking-[0.04em]">
                    <span className="line-through">{p.from_role?.replace(/_/g, " ")}</span>
                    {" → "}<strong className="text-foreground">{p.to_role?.replace(/_/g, " ")}</strong>
                    {p.from_salary && p.to_salary && ` · ${formatCurrency(p.from_salary, currency)} → ${formatCurrency(p.to_salary, currency)}`}
                    {p.effective_date ? ` · Effective ${format(new Date(p.effective_date), "MMM d, yyyy")}` : ""}
                  </p>
                  {p.reason && <p className="text-xs text-[#71717a] dark:text-gray-400 truncate tracking-[0.04em]">{p.reason}</p>}
                </div>
                {isAdmin && p.status === "pending" && (
                  <div className="flex gap-2.5 shrink-0">
                    <Button size="sm" className="h-7 text-xs bg-primary hover:bg-primary/90 gap-2 tracking-[0.04em]" onClick={() => handleApprove(p)}><CheckCircle className="w-3 h-3" />{t("approve", "Approve")}</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-2 text-red-600 border-red-200 tracking-[0.04em]" onClick={() => handleReject(p)}><XCircle className="w-3 h-3" />{t("reject", "Reject")}</Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {showForm && (
        <PromotionFormDialog onClose={() => setShowForm(false)} onSubmit={(d) => createMutation.mutate(d)} staff={staff} currency={currency} />
      )}
    </div>
  );
}

function PromotionFormDialog({ onClose, onSubmit, staff, currency }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ staff_email: "", staff_name: "", from_role: "", to_role: "", from_salary: "", to_salary: "", effective_date: "", reason: "", status: "pending" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleStaffChange = (email) => {
    const s = staff.find(s => s.user_email === email);
    set("staff_email", email);
    set("staff_name", s?.full_name || "");
    set("from_role", s?.role || "");
    set("from_salary", s?.salary || "");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, from_salary: form.from_salary ? Number(form.from_salary) : undefined, to_salary: form.to_salary ? Number(form.to_salary) : undefined });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{t("record_promotion", "Record Promotion")}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>{t("staff_member", "Staff Member *")}</Label>
            <Select value={form.staff_email || "none"} onValueChange={v => v !== "none" && handleStaffChange(v)}>
              <SelectTrigger><SelectValue placeholder="Select staff..." /></SelectTrigger>
              <SelectContent>{staff.map(s => {
                return <SelectItem key={s.user_email} value={s.user_email}>{s.full_name}</SelectItem>;
              })}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("current_role", "Current Role")}</Label><Input value={form.from_role} onChange={e => set("from_role", e.target.value)} placeholder="e.g. paralegal" /></div>
            <div><Label>{t("new_role", "New Role *")}</Label><Input value={form.to_role} onChange={e => set("to_role", e.target.value)} placeholder="e.g. lawyer" required /></div>
            <div><Label>{t("current_salary", "Current Salary (")}{currency})</Label><Input type="number" min="0" value={form.from_salary} onChange={e => set("from_salary", e.target.value)} /></div>
            <div><Label>{t("new_salary", "New Salary (")}{currency})</Label><Input type="number" min="0" value={form.to_salary} onChange={e => set("to_salary", e.target.value)} /></div>
          </div>
          <div><Label>{t("effective_date", "Effective Date")}</Label><Input type="date" value={form.effective_date} onChange={e => set("effective_date", e.target.value)} /></div>
          <div><Label>{t("reason_notes", "Reason / Notes")}</Label><Textarea value={form.reason} onChange={e => set("reason", e.target.value)} rows={2} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>{t("cancel", "Cancel")}</Button>
            <Button type="submit">{t("record_promotion", "Record Promotion")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}