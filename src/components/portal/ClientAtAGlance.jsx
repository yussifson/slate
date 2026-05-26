import React from "react";
import { format, isAfter, differenceInDays } from "date-fns";
import { Calendar, PenTool, Receipt, AlertTriangle, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function SectionHeader({ icon: Icon, label, color }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 border-b border-border ${color}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

export default function ClientAtAGlance({ hearings = [], signatureRequests = [], invoices = [], currency = "GHS" }) {
  const now = new Date();

  const upcomingHearings = hearings
    .filter(h => h.date && isAfter(new Date(h.date), now))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const pendingSignatures = signatureRequests.filter(s => ["sent", "opened"].includes(s.status));

  const outstandingInvoices = invoices.filter(i => ["sent", "overdue"].includes(i.status));
  const totalOutstanding = outstandingInvoices.reduce((s, i) => s + (i.total_amount || 0), 0);

  const currencySymbol = currency === "NGN" ? "₦" : currency === "USD" ? "$" : "GH₵";

  const allClear = upcomingHearings.length === 0 && pendingSignatures.length === 0 && outstandingInvoices.length === 0;

  if (allClear) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-green-800">You're all caught up!</p>
          <p className="text-xs text-green-700 mt-0.5">No upcoming hearings, pending signatures, or outstanding invoices.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

      {/* Upcoming Hearings */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <SectionHeader icon={Calendar} label={`Upcoming Hearings (${upcomingHearings.length})`} color="bg-purple-50/60 text-purple-700" />
        {upcomingHearings.length === 0 ? (
          <div className="px-4 py-5 text-center">
            <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">No upcoming hearings</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {upcomingHearings.map(h => {
              const daysUntil = differenceInDays(new Date(h.date), now);
              const isUrgent = daysUntil <= 7;
              return (
                <div key={h.id} className="px-4 py-3 flex items-center gap-3">
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 text-center",
                    isUrgent ? "bg-red-50" : "bg-primary/10"
                  )}>
                    <span className={cn("text-[9px] font-bold leading-none", isUrgent ? "text-red-500" : "text-primary")}>
                      {format(new Date(h.date), "MMM")}
                    </span>
                    <span className={cn("text-base font-bold leading-tight", isUrgent ? "text-red-600" : "text-primary")}>
                      {format(new Date(h.date), "d")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{h.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{h.court_name || "Court TBD"}{h.time ? ` · ${h.time}` : ""}</p>
                    <p className={cn("text-[10px] font-semibold mt-0.5", isUrgent ? "text-red-500" : "text-muted-foreground")}>
                      {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`}
                    </p>
                  </div>
                  {isUrgent && <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Signatures */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <SectionHeader icon={PenTool} label={`Pending Signatures (${pendingSignatures.length})`} color="bg-amber-50/60 text-amber-700" />
        {pendingSignatures.length === 0 ? (
          <div className="px-4 py-5 text-center">
            <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">No pending signatures</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {pendingSignatures.map(sig => (
              <div key={sig.id} className="px-4 py-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <PenTool className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{sig.document_name}</p>
                  {sig.case_title && <p className="text-xs text-muted-foreground truncate">{sig.case_title}</p>}
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge className={cn("text-[10px]", sig.status === "opened" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700")}>
                      {sig.status === "opened" ? "Opened" : "Awaiting Signature"}
                    </Badge>
                    {sig.expires_at && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> Expires {format(new Date(sig.expires_at), "MMM d")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outstanding Invoices */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <SectionHeader icon={Receipt} label={`Outstanding Invoices (${outstandingInvoices.length})`} color="bg-red-50/60 text-red-700" />
        {outstandingInvoices.length === 0 ? (
          <div className="px-4 py-5 text-center">
            <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">No outstanding invoices</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {outstandingInvoices.slice(0, 4).map(inv => (
                <div key={inv.id} className="px-4 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{inv.invoice_number || "Invoice"}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {inv.due_date ? format(new Date(inv.due_date), "MMM d") : "—"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{currencySymbol}{(inv.total_amount || 0).toLocaleString()}</p>
                    <Badge className={cn("text-[10px]", inv.status === "overdue" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                      {inv.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total outstanding</span>
              <span className="text-sm font-bold text-red-600">{currencySymbol}{totalOutstanding.toLocaleString()}</span>
            </div>
          </>
        )}
      </div>

    </div>
  );
}