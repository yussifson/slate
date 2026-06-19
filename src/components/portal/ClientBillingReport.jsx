import { useTranslation } from "react-i18next";
import React, { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns";
import { Receipt, TrendingUp, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { INVOICE_STATUS_COLORS } from "@/lib/constants";

function formatAmt(amount, currency) {
  const sym = currency === "NGN" ? "₦" : currency === "USD" ? "$" : "GH₵";
  return `${sym}${(amount || 0).toLocaleString()}`;
}

export default function ClientBillingReport({ invoices = [], expenses = [], currency = "GHS" }) {
  const { t } = useTranslation();
  const [monthOffset, setMonthOffset] = useState(0);

  const targetMonth = subMonths(new Date(), monthOffset);
  const monthStart = startOfMonth(targetMonth);
  const monthEnd = endOfMonth(targetMonth);
  const monthLabel = format(targetMonth, "MMMM yyyy");

  const monthInvoices = useMemo(() =>
    invoices.filter(i => i.due_date && isWithinInterval(new Date(i.due_date), { start: monthStart, end: monthEnd })),
    [invoices, monthOffset]
  );

  const monthExpenses = useMemo(() =>
    expenses.filter(e => e.expense_date && isWithinInterval(new Date(e.expense_date), { start: monthStart, end: monthEnd })),
    [expenses, monthOffset]
  );

  const totalBilled = monthInvoices.reduce((s, i) => s + (i.total_amount || 0), 0);
  const totalPaid = monthInvoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.total_amount || 0), 0);
  const totalExpenses = monthExpenses.filter(e => e.billable).reduce((s, e) => s + (e.amount || 0), 0);
  const outstanding = totalBilled - totalPaid;

  return (
    <div className="space-y-4">
      {/* Month Navigator */}
      <div className="flex items-center justify-between bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl px-4 py-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <Button variant="ghost" size="icon" onClick={() => setMonthOffset(o => o + 1)} className="h-8 w-8">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold">{monthLabel}</p>
          <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("monthly_billing_summary", "Monthly Billing Summary")}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMonthOffset(o => Math.max(0, o - 1))} disabled={monthOffset === 0} className="h-8 w-8">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Billed", value: formatAmt(totalBilled, currency), color: "bg-orange-50 text-orange-700" },
          { label: "Paid", value: formatAmt(totalPaid, currency), color: "bg-slate-50 text-primary/90" },
          { label: "Outstanding", value: formatAmt(outstanding, currency), color: outstanding > 0 ? "bg-red-50 text-red-700" : "bg-muted text-[#71717a] dark:text-gray-400" },
        ].map(k => {
          return (
            <div key={k.label} className={`rounded-xl p-3 text-center ${k.color}`}>
              <p className="text-lg font-semibold">{k.value}</p>
              <p className="text-xs font-medium mt-0.5 tracking-[0.04em]">{k.label}</p>
            </div>
          );
        })}
      </div>
      {/* Invoices */}
      <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="px-4 py-3 border-b border-primary/40 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold">{t("invoices", "Invoices")}</p>
          <span className="ml-auto text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{monthInvoices.length} {t("invoice", "invoice")}{monthInvoices.length !== 1 ? "s" : ""}</span>
        </div>
        {monthInvoices.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("no_invoices_for_this_month", "No invoices for this month")}</div>
        ) : (
          <div className="divide-y divide-border">
            {monthInvoices.map(inv => {
              return (
                <div key={inv.id} className="px-4 py-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{inv.invoice_number || "Invoice"}</p>
                    <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">
                      {inv.case_title ? `${inv.case_title} · ` : ""}{t("due", "Due")} {inv.due_date ? format(new Date(inv.due_date), "MMM d") : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold">{formatAmt(inv.total_amount, inv.currency || currency)}</span>
                    <Badge className={cn("text-[10px]", INVOICE_STATUS_COLORS[inv.status])}>{inv.status}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Expenses */}
      {monthExpenses.length > 0 && (
        <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="px-4 py-3 border-b border-primary/40 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-semibold">{t("case_expenses", "Case Expenses")}</p>
            <span className="ml-auto text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{formatAmt(totalExpenses, currency)} {t("billable", "billable")}</span>
          </div>
          <div className="divide-y divide-border">
            {monthExpenses.map(exp => {
              return (
                <div key={exp.id} className="px-4 py-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{exp.description}</p>
                    <p className="text-xs text-[#71717a] dark:text-gray-400 capitalize tracking-[0.04em]">
                      {exp.category?.replace(/_/g, " ")}{exp.case_title ? ` · ${exp.case_title}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold">{formatAmt(exp.amount, exp.currency || currency)}</span>
                    <Badge variant="outline" className="text-[10px]">{exp.billable ? "Billable" : "Internal"}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}