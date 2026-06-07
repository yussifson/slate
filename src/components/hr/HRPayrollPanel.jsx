import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/constants";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Play, FileText, CheckCircle, Banknote, Plus, Trash2, Printer, Eye, ChevronDown, ChevronRight } from "lucide-react";

const STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-600",
  approved: "bg-orange-100 text-orange-700",
  paid: "bg-primary/10 text-primary/90",
};

// Generate YYYY-MM period string
function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function periodLabel(period) {
  if (!period) return "";
  const [y, m] = period.split("-");
  return format(new Date(Number(y), Number(m) - 1, 1), "MMMM yyyy");
}

export default function HRPayrollPanel({ companyId, staff, currency, isAdmin, leaves, user }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState(currentPeriod());
  const [generating, setGenerating] = useState(false);
  const [viewSlip, setViewSlip] = useState(null);
  const [editSlip, setEditSlip] = useState(null);
  const [expandedSlip, setExpandedSlip] = useState(null);

  const { data: slips = [], isLoading } = useQuery({
    queryKey: ["payroll", companyId, period],
    queryFn: () => base44.entities.PayrollSlip.filter({ company_id: companyId, pay_period: period }),
    enabled: !!companyId && !!period,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PayrollSlip.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payroll", companyId, period] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PayrollSlip.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["payroll", companyId, period] }); setEditSlip(null); },
  });

  const bulkGenerate = async () => {
    setGenerating(true);
    const existingEmails = new Set(slips.map(s => s.staff_email));
    const toGenerate = staff.filter(s => s.status === "active" && s.salary > 0 && !existingEmails.has(s.user_email));

    for (const member of toGenerate) {
      // Calculate leave days taken this period
      const periodYear = Number(period.split("-")[0]);
      const periodMonth = Number(period.split("-")[1]);
      const leaveDays = (leaves || []).filter(l =>
        l.staff_email === member.user_email &&
        l.status === "approved" &&
        l.start_date &&
        new Date(l.start_date).getFullYear() === periodYear &&
        new Date(l.start_date).getMonth() + 1 === periodMonth
      ).reduce((s, l) => s + (l.days_requested || 0), 0);

      const basic = member.salary || 0;
      const gross = basic;
      const totalDeductions = 0;
      const net = gross - totalDeductions;

      await createMutation.mutateAsync({
        company_id: companyId,
        staff_email: member.user_email,
        staff_name: member.full_name,
        staff_role: member.role,
        department: member.department || "",
        pay_period: period,
        basic_salary: basic,
        allowances: [],
        deductions: [],
        gross_salary: gross,
        total_deductions: totalDeductions,
        net_salary: net,
        currency: currency,
        leave_days_taken: leaveDays,
        status: "draft",
      });
    }
    setGenerating(false);
  };

  const handleApproveAll = () => {
    slips.filter(s => s.status === "draft").forEach(s =>
      updateMutation.mutate({ id: s.id, data: { status: "approved", approved_by: user.email, approved_at: new Date().toISOString() } })
    );
  };

  const handleMarkAllPaid = () => {
    slips.filter(s => s.status === "approved").forEach(s =>
      updateMutation.mutate({ id: s.id, data: { status: "paid", paid_at: new Date().toISOString() } })
    );
  };

  const totalNet = slips.reduce((s, sl) => s + (sl.net_salary || 0), 0);
  const draftCount = slips.filter(s => s.status === "draft").length;
  const approvedCount = slips.filter(s => s.status === "approved").length;
  const paidCount = slips.filter(s => s.status === "paid").length;
  const ungeneratedCount = staff.filter(s => s.status === "active" && s.salary > 0 && !slips.find(sl => sl.staff_email === s.user_email)).length;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <Label className="text-xs mb-1 block">{t("pay_period", "Pay Period")}</Label>
          <Input type="month" value={period} onChange={e => setPeriod(e.target.value)} className="w-44" />
        </div>
        <div className="flex gap-2 mt-5">
          {isAdmin && ungeneratedCount > 0 && (
            <Button size="sm" onClick={bulkGenerate} disabled={generating}>
              <Play className="w-4 h-4 mr-1" />
              {generating ? "Generating..." : `Generate ${ungeneratedCount} Slip${ungeneratedCount > 1 ? "s" : ""}`}
            </Button>
          )}
          {isAdmin && draftCount > 0 && (
            <Button size="sm" variant="outline" onClick={handleApproveAll}>
              <CheckCircle className="w-4 h-4 mr-1" /> {t("approve_all", "Approve All (")}{draftCount})
                          </Button>
          )}
          {isAdmin && approvedCount > 0 && (
            <Button size="sm" variant="outline" className="text-primary/90 border-primary/30 hover:bg-primary/5" onClick={handleMarkAllPaid}>
              <Banknote className="w-4 h-4 mr-1" /> {t("mark_all_paid", "Mark All Paid (")}{approvedCount})
                          </Button>
          )}
        </div>
      </div>
      {/* Summary bar */}
      {slips.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-3 flex flex-wrap gap-6 items-center">
          <div>
            <p className="text-xs text-muted-foreground">{t("total_net_payroll", "Total Net Payroll")}</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(totalNet, currency)}</p>
          </div>
          <div className="flex gap-4 text-sm">
            {draftCount > 0 && <span className="text-slate-600">{draftCount} {t("draft", "Draft")}</span>}
            {approvedCount > 0 && <span className="text-primary">{approvedCount} {t("approved", "Approved")}</span>}
            {paidCount > 0 && <span className="text-primary">{paidCount} {t("paid", "Paid")}</span>}
          </div>
        </div>
      )}
      {/* Slip list */}
      {isLoading ? (
        <div className="text-center py-10 text-sm text-muted-foreground">{t("loading", "Loading...")}</div>
      ) : slips.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">{t("no_payroll_slips_for", "No payroll slips for")} {periodLabel(period)}</p>
          {isAdmin && staff.filter(s => s.status === "active" && s.salary > 0).length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{t(
              "click_generate_slips_to_auto_c",
              "Click \"Generate Slips\" to auto-calculate for all active staff."
            )}</p>
          )}
          {staff.filter(s => s.status === "active" && s.salary > 0).length === 0 && (
            <p className="text-xs text-muted-foreground mt-1">{t(
              "set_salaries_for_active_staff_",
              "Set salaries for active staff members first."
            )}</p>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/30 border-b border-border grid grid-cols-12 gap-2 text-xs font-semibold uppercase text-muted-foreground">
            <span className="col-span-4">{t("staff_member", "Staff Member")}</span>
            <span className="col-span-2">{t("basic", "Basic")}</span>
            <span className="col-span-2">{t("deductions", "Deductions")}</span>
            <span className="col-span-2 font-bold">{t("net_pay", "Net Pay")}</span>
            <span className="col-span-2 text-center">{t("actions", "Actions")}</span>
          </div>
          <div className="divide-y divide-border">
            {slips.map(slip => {
              const isExpanded = expandedSlip === slip.id;
              return (
                <div key={slip.id}>
                  {/* Main row */}
                  <div className="px-4 py-3 grid grid-cols-12 gap-2 items-center hover:bg-muted/20 cursor-pointer" onClick={() => setExpandedSlip(isExpanded ? null : slip.id)}>
                    <div className="col-span-4 flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                      <div>
                        <p className="text-sm font-medium">{slip.staff_name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge className={cn("text-[9px] h-4 px-1.5", STATUS_COLORS[slip.status])}>{slip.status}</Badge>
                          {slip.leave_days_taken > 0 && <span className="text-[9px] text-amber-600">{slip.leave_days_taken}{t("d_leave", "d leave")}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 text-sm">{formatCurrency(slip.basic_salary, currency)}</div>
                    <div className="col-span-2 text-sm text-red-600">
                      {slip.total_deductions > 0 ? `-${formatCurrency(slip.total_deductions, currency)}` : "—"}
                    </div>
                    <div className="col-span-2 text-sm font-bold text-primary/90">{formatCurrency(slip.net_salary, currency)}</div>
                    <div className="col-span-2 flex gap-1 justify-center" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="View Slip" onClick={() => setViewSlip(slip)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {isAdmin && slip.status === "draft" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => setEditSlip(slip)}>
                          <FileText className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {isAdmin && slip.status === "draft" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" title="Approve" onClick={() => updateMutation.mutate({ id: slip.id, data: { status: "approved", approved_by: user.email, approved_at: new Date().toISOString() } })}>
                          <CheckCircle className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {isAdmin && slip.status === "approved" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-primary/90" title="Mark Paid" onClick={() => updateMutation.mutate({ id: slip.id, data: { status: "paid", paid_at: new Date().toISOString() } })}>
                          <Banknote className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div className="bg-muted/20 border-t border-border px-8 py-4">
                      <div className="grid grid-cols-3 gap-6 text-sm">
                        {/* Earnings */}
                        <div>
                          <p className="text-xs font-semibold uppercase text-primary/90 mb-2">{t("earnings", "Earnings")}</p>
                          <div className="space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t("basic_salary", "Basic Salary")}</span>
                              <span className="font-medium">{formatCurrency(slip.basic_salary, currency)}</span>
                            </div>
                            {(slip.allowances || []).length > 0 ? slip.allowances.map((a, i) => {
                              return (
                                <div key={i} className="flex justify-between">
                                  <span className="text-muted-foreground">{a.label || "Allowance"}</span>
                                  <span className="text-primary/90">+{formatCurrency(a.amount, currency)}</span>
                                </div>
                              );
                            }) : <p className="text-xs text-muted-foreground italic">{t("no_allowances", "No allowances")}</p>}
                            <div className="flex justify-between font-semibold border-t border-border pt-1">
                              <span>{t("gross", "Gross")}</span>
                              <span>{formatCurrency(slip.gross_salary, currency)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Deductions */}
                        <div>
                          <p className="text-xs font-semibold uppercase text-red-600 mb-2">{t("deductions", "Deductions")}</p>
                          <div className="space-y-1.5">
                            {(slip.deductions || []).length > 0 ? slip.deductions.map((d, i) => {
                              return (
                                <div key={i} className="flex justify-between">
                                  <span className="text-muted-foreground">{d.label || "Deduction"}</span>
                                  <span className="text-red-600">-{formatCurrency(d.amount, currency)}</span>
                                </div>
                              );
                            }) : <p className="text-xs text-muted-foreground italic">{t("no_deductions", "No deductions")}</p>}
                            {slip.total_deductions > 0 && (
                              <div className="flex justify-between font-semibold border-t border-border pt-1 text-red-600">
                                <span>{t("total", "Total")}</span>
                                <span>-{formatCurrency(slip.total_deductions, currency)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Summary */}
                        <div>
                          <p className="text-xs font-semibold uppercase text-primary mb-2">{t("summary", "Summary")}</p>
                          <div className="space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t("gross_pay", "Gross Pay")}</span>
                              <span>{formatCurrency(slip.gross_salary, currency)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t("total_deductions", "Total Deductions")}</span>
                              <span className="text-red-600">-{formatCurrency(slip.total_deductions || 0, currency)}</span>
                            </div>
                            {slip.leave_days_taken > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("leave_taken", "Leave Taken")}</span>
                                <span className="text-amber-600">{slip.leave_days_taken} {t("day_s", "day(s)")}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold text-primary border-t border-border pt-1">
                              <span>{t("net_pay", "Net Pay")}</span>
                              <span>{formatCurrency(slip.net_salary, currency)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {slip.notes && <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">{slip.notes}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {viewSlip && (
        <SalarySlipDialog slip={viewSlip} currency={currency} onClose={() => setViewSlip(null)} />
      )}
      {editSlip && (
        <EditSlipDialog
          slip={editSlip}
          currency={currency}
          onClose={() => setEditSlip(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editSlip.id, data })}
        />
      )}
    </div>
  );
}

function SalarySlipDialog({ slip, currency, onClose }) {
  const { t } = useTranslation();
  const handlePrint = () => window.print();

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("salary_slip", "Salary Slip —")} {periodLabel(slip.pay_period)}</DialogTitle>
        </DialogHeader>
        <div id="salary-slip" className="space-y-4 text-sm">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-base">{slip.staff_name}</p>
              <p className="text-muted-foreground capitalize">{slip.staff_role?.replace(/_/g, " ")}</p>
              {slip.department && <p className="text-muted-foreground">{slip.department}</p>}
            </div>
            <Badge className={cn("text-xs", STATUS_COLORS[slip.status])}>{slip.status}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs bg-muted/30 rounded-lg p-3">
            <div><span className="text-muted-foreground">{t("pay_period", "Pay Period:")}</span> <strong>{periodLabel(slip.pay_period)}</strong></div>
            <div><span className="text-muted-foreground">{t("currency", "Currency:")}</span> <strong>{slip.currency || currency}</strong></div>
            {slip.leave_days_taken > 0 && <div><span className="text-muted-foreground">{t("leave_taken", "Leave Taken:")}</span> <strong>{slip.leave_days_taken} {t("day_s", "day(s)")}</strong></div>}
            {slip.approved_by && <div><span className="text-muted-foreground">{t("approved_by", "Approved by:")}</span> <strong>{slip.approved_by.split("@")[0]}</strong></div>}
          </div>

          <Separator />

          {/* Earnings */}
          <div>
            <p className="font-semibold mb-2 text-primary/90">{t("earnings", "Earnings")}</p>
            <div className="space-y-1">
              <div className="flex justify-between"><span>{t("basic_salary", "Basic Salary")}</span><span className="font-medium">{formatCurrency(slip.basic_salary, currency)}</span></div>
              {(slip.allowances || []).map((a, i) => {
                return (<div key={i} className="flex justify-between text-primary/90"><span>{a.label}</span><span>+{formatCurrency(a.amount, currency)}</span></div>);
              })}
              <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1">
                <span>{t("gross_salary", "Gross Salary")}</span><span>{formatCurrency(slip.gross_salary, currency)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          {(slip.deductions || []).length > 0 && (
            <div>
              <p className="font-semibold mb-2 text-red-600">{t("deductions", "Deductions")}</p>
              <div className="space-y-1">
                {slip.deductions.map((d, i) => {
                  return (<div key={i} className="flex justify-between text-red-600"><span>{d.label}</span><span>-{formatCurrency(d.amount, currency)}</span></div>);
                })}
                <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1 text-red-600">
                  <span>{t("total_deductions", "Total Deductions")}</span><span>-{formatCurrency(slip.total_deductions, currency)}</span>
                </div>
              </div>
            </div>
          )}

          <Separator />

          <div className="flex justify-between text-base font-bold bg-primary/5 rounded-lg px-4 py-3">
            <span>{t("net_pay", "Net Pay")}</span>
            <span className="text-primary">{formatCurrency(slip.net_salary, currency)}</span>
          </div>

          {slip.notes && <p className="text-xs text-muted-foreground border-t border-border pt-2">{slip.notes}</p>}
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={onClose}>{t("close", "Close")}</Button>
          <Button onClick={handlePrint}><Printer className="w-4 h-4 mr-1" /> {t("print", "Print")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditSlipDialog({ slip, currency, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [allowances, setAllowances] = useState(slip.allowances || []);
  const [deductions, setDeductions] = useState(slip.deductions || []);
  const [notes, setNotes] = useState(slip.notes || "");

  const addRow = (setter) => setter(prev => [...prev, { label: "", amount: 0 }]);
  const removeRow = (setter, idx) => setter(prev => prev.filter((_, i) => i !== idx));
  const updateRow = (setter, idx, field, value) => setter(prev => prev.map((r, i) => i === idx ? { ...r, [field]: field === "amount" ? Number(value) : value } : r));

  const gross = slip.basic_salary + allowances.reduce((s, a) => s + (a.amount || 0), 0);
  const totalDed = deductions.reduce((s, d) => s + (d.amount || 0), 0);
  const net = gross - totalDed;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ allowances, deductions, gross_salary: gross, total_deductions: totalDed, net_salary: net, notes });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{t("edit_slip", "Edit Slip —")} {slip.staff_name}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
            {t("basic_salary", "Basic Salary:")} <strong>{formatCurrency(slip.basic_salary, currency)}</strong>
          </div>

          {/* Allowances */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-primary/90">{t("allowances", "Allowances")}</Label>
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => addRow(setAllowances)}>
                <Plus className="w-3 h-3 mr-1" /> {t("add", "Add")}
              </Button>
            </div>
            {allowances.map((a, i) => {
              return (
                <div key={i} className="flex gap-2 mb-2">
                  <Input placeholder="Label (e.g. Housing)" value={a.label} onChange={e => updateRow(setAllowances, i, "label", e.target.value)} className="flex-1" />
                  <Input type="number" min="0" placeholder="Amount" value={a.amount} onChange={e => updateRow(setAllowances, i, "amount", e.target.value)} className="w-28" />
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeRow(setAllowances, i)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Deductions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-red-600">{t("deductions", "Deductions")}</Label>
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => addRow(setDeductions)}>
                <Plus className="w-3 h-3 mr-1" /> {t("add", "Add")}
              </Button>
            </div>
            {deductions.map((d, i) => {
              return (
                <div key={i} className="flex gap-2 mb-2">
                  <Input placeholder="Label (e.g. Tax, Pension)" value={d.label} onChange={e => updateRow(setDeductions, i, "label", e.target.value)} className="flex-1" />
                  <Input type="number" min="0" placeholder="Amount" value={d.amount} onChange={e => updateRow(setDeductions, i, "amount", e.target.value)} className="w-28" />
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeRow(setDeductions, i)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Live summary */}
          <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between"><span>{t("gross", "Gross")}</span><span className="font-medium">{formatCurrency(gross, currency)}</span></div>
            <div className="flex justify-between text-red-600"><span>{t("deductions", "Deductions")}</span><span>-{formatCurrency(totalDed, currency)}</span></div>
            <div className="flex justify-between font-bold text-primary border-t border-border pt-1 mt-1"><span>{t("net_pay", "Net Pay")}</span><span>{formatCurrency(net, currency)}</span></div>
          </div>

          <div><Label>{t("notes", "Notes")}</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} /></div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>{t("cancel", "Cancel")}</Button>
            <Button type="submit">{t("save_slip", "Save Slip")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}