import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/constants";

const roleColors = {
  company_admin: "bg-purple-100 text-purple-700",
  lawyer: "bg-blue-100 text-blue-700",
  paralegal: "bg-cyan-100 text-cyan-700",
  hr: "bg-green-100 text-green-700",
  finance: "bg-amber-100 text-amber-700",
  support: "bg-slate-100 text-slate-600",
};

export default function HRSalaryPanel({ companyId, staff, currency, isAdmin }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StaffRecord.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["staff", companyId] }); setEditing(null); },
  });

  const totalPayroll = staff.filter(s => s.status === "active").reduce((s, m) => s + (m.salary || 0), 0);

  return (
    <div className="space-y-4">
      <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 flex items-center gap-3">
        <DollarSign className="w-5 h-5 text-primary" />
        <div>
          <p className="text-xs text-muted-foreground">{t("total_monthly_payroll_active_s", "Total Monthly Payroll (Active Staff)")}</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalPayroll, currency)}</p>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/30 border-b border-border grid grid-cols-12 gap-2 text-xs font-semibold uppercase text-muted-foreground">
          <span className="col-span-5">{t("staff_member", "Staff Member")}</span>
          <span className="col-span-3">{t("role", "Role")}</span>
          <span className="col-span-3 text-right">{t("monthly_salary", "Monthly Salary")}</span>
          {isAdmin && <span className="col-span-1" />}
        </div>
        <div className="divide-y divide-border">
          {staff.map(s => {
            return (
              <div key={s.id} className="px-4 py-3 grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <p className="text-sm font-medium">{s.full_name}</p>
                  <p className="text-xs text-muted-foreground">{s.status === "active" ? "" : <span className="text-amber-600 capitalize">{s.status?.replace("_"," ")}</span>}</p>
                </div>
                <div className="col-span-3">
                  <Badge className={`${roleColors[s.role] || "bg-slate-100 text-slate-600"} text-[10px] capitalize`}>{s.role?.replace(/_/g, " ")}</Badge>
                </div>
                <div className="col-span-3 text-right">
                  <span className="text-sm font-semibold">{s.salary ? formatCurrency(s.salary, currency) : <span className="text-muted-foreground text-xs">{t("not_set", "Not set")}</span>}</span>
                </div>
                {isAdmin && (
                  <div className="col-span-1 flex justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(s)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {editing && (
        <SalaryEditDialog
          staff={editing}
          currency={currency}
          onClose={() => setEditing(null)}
          onSubmit={(salary) => updateMutation.mutate({ id: editing.id, data: { salary } })}
        />
      )}
    </div>
  );
}

function SalaryEditDialog({ staff, currency, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [salary, setSalary] = useState(staff.salary || "");
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(Number(salary)); };
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>{t("edit_salary", "Edit Salary —")} {staff.full_name}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t("monthly_salary", "Monthly Salary (")}{currency})</Label>
            <Input type="number" min="0" step="0.01" value={salary} onChange={e => setSalary(e.target.value)} autoFocus />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>{t("cancel", "Cancel")}</Button>
            <Button type="submit">{t("update_salary", "Update Salary")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}