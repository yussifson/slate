import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from "react";
import { usePowerSync } from "@powersync/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, ArrowUpCircle, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
};

export default function HRPromotionsPanel({ companyId, staff, currency, isAdmin, user }) {
  const { t } = useTranslation();
  const powerSync = usePowerSync();
  const [promotions, setPromotions] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchPromotions = async () => {
      if (!companyId) return;
      const res = await powerSync.execute(
        "SELECT * FROM univ_erp_promotions WHERE company_id = ? ORDER BY created_at DESC",
        [companyId]
      );
      if (active) setPromotions(res.rows._array || []);
    };
    fetchPromotions();
    return () => { active = false; };
  }, [companyId, powerSync, showForm]);

  const handleCreate = async (data) => {
    try {
      const id = crypto.randomUUID();
      await powerSync.execute(
        `INSERT INTO univ_erp_promotions 
        (id, created_at, company_id, staff_email, staff_name, from_role, to_role, from_salary, to_salary, effective_date, reason, status) 
        VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [id, companyId, data.staff_email, data.staff_name, data.from_role, data.to_role, data.from_salary, data.to_salary, data.effective_date, data.reason]
      );
      toast.success(t("promotion_recorded", "Promotion recorded successfully"));
      setShowForm(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await powerSync.execute(
        "UPDATE univ_erp_promotions SET status = ?, approved_by = ? WHERE id = ?",
        [status, user?.email || '', id]
      );
      toast.success(t(`promotion_${status}`, `Promotion ${status}`));
      
      const res = await powerSync.execute("SELECT * FROM univ_erp_promotions WHERE company_id = ? ORDER BY created_at DESC", [companyId]);
      setPromotions(res.rows._array || []);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-dmsans">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{t("promotions_and_discounts", "Promotions & Role Changes")}</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage staff role advancements and salary bumps.</p>
        </div>
        {isAdmin && (
          <Button className="bg-primary text-white hover:bg-primary/90 gap-2 rounded-xl shadow-sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> {t("record_promotion", "Record Promotion")}
          </Button>
        )}
      </div>

      {promotions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl p-16 text-center hover:shadow-xl transition-all duration-300">
          <TrendingUp className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg font-bold text-foreground">{t("no_promotions_recorded_yet", "No promotions recorded yet")}</p>
          <p className="text-sm text-muted-foreground mt-1">Click the button above to record a new promotion.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {promotions.map(p => {
            const statusStyle = STATUS_STYLES[p.status] || STATUS_STYLES.pending;
            return (
              <div key={p.id} className="bg-white dark:bg-slate-900 border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col p-5 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none" />
                
                <div className="flex items-start justify-between gap-3 mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-primary font-bold text-lg shadow-inner shrink-0">
                      {p.staff_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground leading-tight truncate max-w-[120px]">{p.staff_name}</h3>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 tracking-wider truncate max-w-[120px]">{p.staff_email}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex flex-col gap-2 border border-border/50 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Role</span>
                    <div className="text-right flex items-center gap-1.5">
                      <span className="text-xs line-through text-muted-foreground">{p.from_role?.replace(/_/g, " ")}</span>
                      <span className="text-[10px] text-primary">→</span>
                      <span className="text-xs font-bold text-foreground">{p.to_role?.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                  {p.from_salary && p.to_salary && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Salary</span>
                      <div className="text-right flex items-center gap-1.5">
                        <span className="text-xs line-through text-muted-foreground">{formatCurrency(p.from_salary, currency)}</span>
                        <span className="text-[10px] text-primary">→</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(p.to_salary, currency)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {p.effective_date && (
                  <p className="text-xs font-medium text-muted-foreground mt-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Effective {format(new Date(p.effective_date), "MMM d, yyyy")}
                  </p>
                )}

                <div className="mt-auto pt-4 flex items-center justify-between relative z-10">
                  <Badge className={cn("text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase hover:bg-transparent", statusStyle)} variant="outline">{p.status}</Badge>
                  
                  {isAdmin && p.status === "pending" && (
                    <div className="flex gap-1.5">
                      <Button size="icon" className="h-8 w-8 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 dark:text-emerald-400 rounded-lg shadow-sm" onClick={() => handleUpdateStatus(p.id, "approved")} title="Approve">
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button size="icon" className="h-8 w-8 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-400 rounded-lg shadow-sm" onClick={() => handleUpdateStatus(p.id, "rejected")} title="Reject">
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {showForm && (
        <PromotionFormDialog onClose={() => setShowForm(false)} onSubmit={handleCreate} staff={staff} currency={currency} />
      )}
    </div>
  );
}

function PromotionFormDialog({ onClose, onSubmit, staff, currency }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ staff_email: "", staff_name: "", from_role: "", to_role: "", from_salary: "", to_salary: "", effective_date: "", reason: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleStaffChange = (email) => {
    const s = staff.find(s => s.email === email);
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
      <DialogContent className="sm:max-w-md rounded-2xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold">{t("record_promotion", "Record Promotion")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("staff_member", "Staff Member *")}</Label>
            <Select value={form.staff_email || "none"} onValueChange={v => v !== "none" && handleStaffChange(v)}>
              <SelectTrigger className="mt-1 rounded-xl bg-slate-50 dark:bg-slate-900 border-none"><SelectValue placeholder="Select staff..." /></SelectTrigger>
              <SelectContent className="rounded-xl">{staff.map(s => <SelectItem key={s.email} value={s.email}>{s.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("current_role", "Current Role")}</Label>
              <Input value={form.from_role} onChange={e => set("from_role", e.target.value)} className="mt-1 rounded-xl bg-slate-50 dark:bg-slate-900 border-none" />
            </div>
            <div>
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("new_role", "New Role *")}</Label>
              <Input value={form.to_role} onChange={e => set("to_role", e.target.value)} required className="mt-1 rounded-xl bg-slate-50 dark:bg-slate-900 border-none" />
            </div>
            <div>
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Current Salary ({currency})</Label>
              <Input type="number" value={form.from_salary} onChange={e => set("from_salary", e.target.value)} className="mt-1 rounded-xl bg-slate-50 dark:bg-slate-900 border-none" />
            </div>
            <div>
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">New Salary ({currency})</Label>
              <Input type="number" value={form.to_salary} onChange={e => set("to_salary", e.target.value)} className="mt-1 rounded-xl bg-slate-50 dark:bg-slate-900 border-none" />
            </div>
          </div>
          <div>
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("effective_date", "Effective Date")}</Label>
            <Input type="date" value={form.effective_date} onChange={e => set("effective_date", e.target.value)} className="mt-1 rounded-xl bg-slate-50 dark:bg-slate-900 border-none" />
          </div>
          <div className="pt-2 flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 rounded-xl font-bold">{t("cancel", "Cancel")}</Button>
            <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold">{t("record", "Record")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}