import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, Square, Plus, FileText, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/constants";
import { format, differenceInMinutes } from "date-fns";

const CATEGORIES = [
  { value: "legal_research", label: "Legal Research" },
  { value: "court_appearance", label: "Court Appearance" },
  { value: "client_meeting", label: "Client Meeting" },
  { value: "document_drafting", label: "Document Drafting" },
  { value: "correspondence", label: "Correspondence" },
  { value: "consultation", label: "Consultation" },
  { value: "other", label: "Other" },
];

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function CaseTimeTracker({ caseData, user }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const companyId = user?.company_id;

  // Timer state
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [timerDesc, setTimerDesc] = useState("");
  const [timerCategory, setTimerCategory] = useState("other");
  const [timerRate, setTimerRate] = useState(150);
  const intervalRef = useRef(null);

  // Manual entry dialog
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ description: "", category: "other", duration_minutes: 60, hourly_rate: 150, is_billable: true, date: format(new Date(), "yyyy-MM-dd") });

  // Invoice dialog
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["time-entries", caseData.id],
    queryFn: () => base44.entities.TimeEntry.filter({ case_id: caseData.id }),
    enabled: !!caseData.id,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["company", companyId],
    queryFn: () => base44.entities.Company.filter({ id: companyId }),
    enabled: !!companyId,
  });
  const currency = companies[0]?.currency || "GHS";

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TimeEntry.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["time-entries", caseData.id] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TimeEntry.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["time-entries", caseData.id] }),
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Draft invoice created", description: "Go to Invoices to review and send." });
      setShowInvoiceDialog(false);
    },
  });

  const markBilledMutation = useMutation({
    mutationFn: ({ ids, invoiceId }) => Promise.all(ids.map(id => base44.entities.TimeEntry.update(id, { billed: true, invoice_id: invoiceId }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["time-entries", caseData.id] }),
  });

  // Timer tick
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const handleStart = () => {
    setStartTime(new Date().toISOString());
    setElapsed(0);
    setRunning(true);
  };

  const handleStop = async () => {
    setRunning(false);
    const endTime = new Date().toISOString();
    const durationMinutes = Math.ceil(elapsed / 60);
    const amount = timerRate * (durationMinutes / 60);
    await createMutation.mutateAsync({
      company_id: companyId,
      case_id: caseData.id,
      case_title: caseData.title,
      case_number: caseData.case_number,
      client_id: caseData.client_id,
      client_name: caseData.client_name,
      lawyer_email: user?.email,
      lawyer_name: user?.full_name,
      description: timerDesc || "Time entry",
      start_time: startTime,
      end_time: endTime,
      duration_minutes: durationMinutes,
      hourly_rate: timerRate,
      billable_amount: parseFloat(amount.toFixed(2)),
      currency,
      is_billable: true,
      billed: false,
      category: timerCategory,
    });
    setTimerDesc("");
    setElapsed(0);
    toast({ title: `Logged ${formatDuration(durationMinutes)}` });
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const amount = manualForm.hourly_rate * (manualForm.duration_minutes / 60);
    await createMutation.mutateAsync({
      company_id: companyId,
      case_id: caseData.id,
      case_title: caseData.title,
      case_number: caseData.case_number,
      client_id: caseData.client_id,
      client_name: caseData.client_name,
      lawyer_email: user?.email,
      lawyer_name: user?.full_name,
      ...manualForm,
      billable_amount: parseFloat(amount.toFixed(2)),
      currency,
      billed: false,
      start_time: new Date(manualForm.date).toISOString(),
    });
    setShowManual(false);
    setManualForm({ description: "", category: "other", duration_minutes: 60, hourly_rate: 150, is_billable: true, date: format(new Date(), "yyyy-MM-dd") });
    toast({ title: "Time entry added" });
  };

  const unbilledEntries = entries.filter(e => e.is_billable && !e.billed);
  const totalUnbilledAmount = unbilledEntries.reduce((sum, e) => sum + (e.billable_amount || 0), 0);
  const totalUnbilledMins = unbilledEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);

  const handleCreateInvoice = async () => {
    const items = unbilledEntries.map(e => ({
      description: `${e.description || "Legal Services"} (${formatDuration(e.duration_minutes || 0)})`,
      quantity: parseFloat(((e.duration_minutes || 0) / 60).toFixed(2)),
      unit_price: e.hourly_rate || 0,
      total: e.billable_amount || 0,
    }));
    const invoice = await createInvoiceMutation.mutateAsync({
      company_id: companyId,
      client_id: caseData.client_id,
      client_name: caseData.client_name,
      case_id: caseData.id,
      case_title: caseData.title,
      items,
      subtotal: totalUnbilledAmount,
      total_amount: totalUnbilledAmount,
      currency,
      status: "draft",
      invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    });
    await markBilledMutation.mutateAsync({ ids: unbilledEntries.map(e => e.id), invoiceId: invoice.id });
  };

  return (
    <div className="space-y-4">
      {/* Timer card */}
      <div className="bg-card rounded-xl border border-primary/40 p-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs">{t("description", "Description")}</Label>
                <Input placeholder="What are you working on?" value={timerDesc} onChange={e => setTimerDesc(e.target.value)} disabled={running} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("category", "Category")}</Label>
                <Select value={timerCategory} onValueChange={setTimerCategory} disabled={running}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => {
                    return <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>;
                  })}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="space-y-1 w-32">
                <Label className="text-xs">{t("rate_hr", "Rate / hr (")}{currency})</Label>
                <Input type="number" value={timerRate} onChange={e => setTimerRate(Number(e.target.value))} disabled={running} />
              </div>
              {running && (
                <div className="flex items-center gap-2 mt-5">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-2xl font-mono font-bold text-foreground">{formatElapsed(elapsed)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 sm:flex-col">
            {!running ? (
              <Button onClick={handleStart} className="gap-2 bg-primary hover:bg-primary/90 text-white">
                <Play className="w-4 h-4" /> {t("start_timer", "Start Timer")}
              </Button>
            ) : (
              <Button onClick={handleStop} variant="destructive" className="gap-2">
                <Square className="w-4 h-4" /> {t("stop_log", "Stop & Log")}
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowManual(true)} className="gap-2">
              <Plus className="w-4 h-4" /> {t("add_manual", "Add Manual")}
            </Button>
          </div>
        </div>
      </div>
      {/* Summary + create invoice */}
      {unbilledEntries.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-amber-800">{unbilledEntries.length} {t("unbilled_entries", "unbilled entries")}</p>
            <p className="text-xs text-amber-700">{formatDuration(totalUnbilledMins)} · {formatCurrency(totalUnbilledAmount, currency)}</p>
          </div>
          <Button onClick={handleCreateInvoice} disabled={createInvoiceMutation.isPending} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm">
            <FileText className="w-4 h-4" />
            {createInvoiceMutation.isPending ? "Creating..." : "Create Draft Invoice"}
          </Button>
        </div>
      )}
      {/* Entries list */}
      <div className="bg-card rounded-xl border border-primary/40 overflow-hidden">
        <div className="px-5 py-3 border-b border-primary/40 bg-muted/30 flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t("time_entries", "Time Entries (")}{entries.length})</span>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">{t("loading", "Loading...")}</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">{t(
            "no_time_entries_yet_start_the_",
            "No time entries yet. Start the timer or add manually."
          )}</div>
        ) : (
          <div className="divide-y divide-border">
            {entries.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map(entry => {
              return (
                <div key={entry.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.description || "Time entry"}</p>
                    <div className="flex flex-wrap gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{entry.start_time ? format(new Date(entry.start_time), "MMM d, yyyy") : ""}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">{entry.category?.replace("_", " ")}</Badge>
                      {entry.billed && <Badge className="text-[10px] bg-slate-100 text-primary/90">{t("billed", "Billed")}</Badge>}
                      {!entry.billed && entry.is_billable && <Badge className="text-[10px] bg-amber-100 text-amber-700">{t("unbilled", "Unbilled")}</Badge>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{formatDuration(entry.duration_minutes || 0)}</p>
                    {entry.is_billable && <p className="text-xs text-muted-foreground">{formatCurrency(entry.billable_amount || 0, entry.currency)}</p>}
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => deleteMutation.mutate(entry.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        {entries.length > 0 && (
          <div className="px-5 py-3 border-t border-primary/40 bg-muted/20 flex justify-between text-sm">
            <span className="text-muted-foreground">{t("total_logged", "Total logged")}</span>
            <span className="font-semibold">{formatDuration(entries.reduce((s, e) => s + (e.duration_minutes || 0), 0))} · {formatCurrency(entries.reduce((s, e) => s + (e.billable_amount || 0), 0), currency)}</span>
          </div>
        )}
      </div>
      {/* Manual entry dialog */}
      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t("add_manual_time_entry", "Add Manual Time Entry")}</DialogTitle></DialogHeader>
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div><Label>{t("description", "Description")}</Label><Input value={manualForm.description} onChange={e => setManualForm({ ...manualForm, description: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t("date", "Date")}</Label><Input type="date" value={manualForm.date} onChange={e => setManualForm({ ...manualForm, date: e.target.value })} /></div>
              <div><Label>{t("duration_min", "Duration (min)")}</Label><Input type="number" min={1} value={manualForm.duration_minutes} onChange={e => setManualForm({ ...manualForm, duration_minutes: Number(e.target.value) })} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t("hourly_rate", "Hourly Rate")}</Label><Input type="number" value={manualForm.hourly_rate} onChange={e => setManualForm({ ...manualForm, hourly_rate: Number(e.target.value) })} /></div>
              <div>
                <Label>{t("category", "Category")}</Label>
                <Select value={manualForm.category} onValueChange={v => setManualForm({ ...manualForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => {
                    return <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>;
                  })}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setShowManual(false)}>{t("cancel", "Cancel")}</Button>
              <Button type="submit">{t("add_entry", "Add Entry")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}