import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { powerSync } from "@/api/PowerSyncConnector";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pencil, DollarSign, Users, Award, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/constants";

const roleColors = {
  company_admin: "bg-slate-100 text-primary/90",
  lawyer: "bg-orange-100 text-orange-700",
  paralegal: "bg-slate-100 text-primary/90",
  hr: "bg-slate-100 text-primary/90",
  finance: "bg-amber-100 text-amber-700",
  support: "bg-slate-100 text-slate-600"
};

export default function HRSalaryPanel({ companyId, staff = [], currency = "USD", isAdmin }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await powerSync.execute("UPDATE univ_hr_employees SET salary = ? WHERE id = ?", [data.salary, id]);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["staff", companyId] }); setEditing(null); }
  });

  const activeStaff = staff.filter(s => s.status === "active" || s.status === "Active");
  const totalPayroll = activeStaff.reduce((s, m) => s + (Number(m.salary) || 0), 0);
  const avgSalary = activeStaff.length > 0 ? Math.round(totalPayroll / activeStaff.length) : 0;
  const highestSalary = Math.max(...activeStaff.map(s => Number(s.salary) || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden font-sans pb-24">
      {/* ── Native Header ── */}
      <div className="flex items-center justify-between gap-3 min-w-0 border-b pb-4 border-border/80">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">{t("salary", "Salary Benchmarks")}</h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">Compensation scale, payroll distribution, and role-based benchmarking</p>
        </div>
      </div>

      {/* ── 2x2 Modern Mobile Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Monthly</div>
          <div className="text-lg sm:text-2xl font-black mt-0.5 text-foreground">{formatCurrency(totalPayroll, currency)}</div>
        </div>
        <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Avg Salary</div>
          <div className="text-lg sm:text-2xl font-black mt-0.5 text-emerald-600">{formatCurrency(avgSalary, currency)}</div>
        </div>
        <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Staff</div>
          <div className="text-lg sm:text-2xl font-black mt-0.5 text-blue-600">{activeStaff.length}</div>
        </div>
        <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Highest Scale</div>
          <div className="text-lg sm:text-2xl font-black mt-0.5 text-purple-600">{formatCurrency(highestSalary, currency)}</div>
        </div>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="md:hidden space-y-2.5">
        {staff.length === 0 ? (
          <div className="text-center py-10 bg-card rounded-2xl border border-dashed border-border p-6 text-muted-foreground text-xs">
            No employee salary records found.
          </div>
        ) : (
          staff.map(s => (
            <div key={s.id} className="bg-card rounded-[20px] p-3.5 border border-border/80 shadow-xs flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <h3 className="font-bold text-xs text-foreground truncate">{s.full_name}</h3>
                <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{s.role?.replace(/_/g, " ") || "Staff"}</p>
                <p className="text-xs font-bold text-primary mt-1">{s.salary ? formatCurrency(s.salary, currency) : "Not set"}</p>
              </div>
              {isAdmin && (
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-bold shrink-0" onClick={() => setEditing(s)}>
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop Table (>= md) */}
      <div className="hidden md:block bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-muted/40 border-b border-border/80 grid grid-cols-12 gap-2 text-xs font-semibold uppercase text-muted-foreground">
          <span className="col-span-5">{t("staff_member", "Staff Member")}</span>
          <span className="col-span-3">{t("role", "Role")}</span>
          <span className="col-span-3 text-right">{t("monthly_salary", "Monthly Salary")}</span>
          {isAdmin && <span className="col-span-1" />}
        </div>
        <div className="divide-y divide-border/60">
          {staff.map(s => (
            <div key={s.id} className="px-4 py-3 grid grid-cols-12 gap-2 items-center hover:bg-muted/20 transition-colors">
              <div className="col-span-5 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{s.full_name}</p>
                <p className="text-xs text-muted-foreground">{s.status === "active" ? "" : <span className="text-amber-600 capitalize">{s.status?.replace("_"," ")}</span>}</p>
              </div>
              <div className="col-span-3">
                <Badge className={`${roleColors[s.role] || "bg-slate-100 text-slate-600"} text-[10px] capitalize`}>{s.role?.replace(/_/g, " ")}</Badge>
              </div>
              <div className="col-span-3 text-right">
                <span className="text-sm font-bold text-foreground">{s.salary ? formatCurrency(s.salary, currency) : <span className="text-muted-foreground text-xs">{t("not_set", "Not set")}</span>}</span>
              </div>
              {isAdmin && (
                <div className="col-span-1 flex justify-end">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(s)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-card text-card-foreground rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("edit_salary", "Edit Salary")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(Number(salary)); }} className="space-y-4 py-2">
          <div>
            <p className="text-sm font-semibold">{staff.full_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{staff.role?.replace(/_/g, " ")}</p>
          </div>
          <div>
            <Label className="text-xs font-semibold">{t("monthly_salary", "Monthly Salary")} ({currency})</Label>
            <Input type="number" min="0" step="100" value={salary} onChange={(e) => setSalary(e.target.value)} className="mt-1 h-9 rounded-xl text-xs" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">Cancel</Button>
            <Button type="submit" size="sm" className="bg-[#005A9C] hover:bg-[#00477D] text-white rounded-xl text-xs font-bold">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
