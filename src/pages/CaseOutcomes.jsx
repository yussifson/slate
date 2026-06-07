import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/shared/PageHeader";
import { Trophy, Plus, TrendingUp, Target } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const OUTCOME_COLORS = { won: "bg-primary/10 text-primary/90", lost: "bg-red-100 text-red-700", settled: "bg-orange-100 text-orange-700", dismissed: "bg-primary/10 text-primary/90", withdrawn: "bg-gray-100 text-gray-600", ongoing: "bg-amber-100 text-amber-700" };
const PIE_COLORS = ["#22c55e", "#ef4444", "#3b82f6", "#a855f7", "#9ca3af", "#f59e0b"];

export default function CaseOutcomes() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = user?.company_id;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: outcomes = [] } = useQuery({
    queryKey: ["outcomes", companyId],
    queryFn: () => base44.entities.CaseOutcome.filter({ company_id: companyId }, "-created_date"),
    enabled: !!companyId,
  });
  const { data: cases = [] } = useQuery({
    queryKey: ["cases", companyId],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CaseOutcome.create({ ...data, company_id: companyId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["outcomes"] }); setShowForm(false); },
  });

  const outcomeStats = ["won", "lost", "settled", "dismissed", "withdrawn"].map(o => ({ name: o, value: outcomes.filter(x => x.outcome === o).length })).filter(o => o.value > 0);
  const winRate = outcomes.length > 0 ? Math.round((outcomes.filter(o => o.outcome === "won").length / outcomes.filter(o => o.outcome !== "ongoing").length) * 100) : 0;
  const settleRate = outcomes.length > 0 ? Math.round((outcomes.filter(o => o.outcome === "settled").length / outcomes.filter(o => o.outcome !== "ongoing").length) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Case Outcomes"
        subtitle="Track win/loss rates and case results"
        actions={<Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5"><Plus className="w-4 h-4" />{t("record_outcome", "Record Outcome")}</Button>}
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Closed", value: outcomes.filter(o => o.outcome !== "ongoing").length, color: "bg-primary/5 text-primary" },
          { label: "Won", value: outcomes.filter(o => o.outcome === "won").length, color: "bg-primary/5 text-primary" },
          { label: "Win Rate", value: `${winRate}%`, color: "bg-primary/10 text-primary" },
          { label: "Settlement Rate", value: `${settleRate}%`, color: "bg-primary/5 text-primary" },
        ].map(s => {
          return (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", s.color)}><Target className="w-4 h-4" /></div>
              <div><p className="text-xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        {outcomeStats.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-3">{t("outcome_distribution", "Outcome Distribution")}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={outcomeStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {outcomeStats.map((entry, i) => {
                    return <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />;
                  })}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent outcomes */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">{t("recent_outcomes", "Recent Outcomes")}</h3>
          </div>
          <div className="divide-y divide-border max-h-72 overflow-y-auto">
            {outcomes.slice(0, 10).map(o => {
              return (
                <div key={o.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{o.case_title}</p>
                    <p className="text-xs text-muted-foreground">{o.client_name} · {o.assigned_lawyer_name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {o.outcome_date && <span className="text-[10px] text-muted-foreground">{format(new Date(o.outcome_date), "MMM d, yyyy")}</span>}
                    <Badge className={cn("text-[10px] capitalize", OUTCOME_COLORS[o.outcome])}>{o.outcome}</Badge>
                  </div>
                </div>
              );
            })}
            {outcomes.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">{t("no_outcomes_recorded_yet", "No outcomes recorded yet")}</div>}
          </div>
        </div>
      </div>
      <OutcomeDialog open={showForm} onClose={() => setShowForm(false)} cases={cases} onSubmit={createMutation.mutate} />
    </div>
  );
}

function OutcomeDialog({ open, onClose, cases, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ case_id: "", outcome: "won", outcome_date: "", outcome_summary: "", settlement_amount: "" });
  const handleCaseChange = (caseId) => {
    const c = cases.find(x => x.id === caseId);
    if (c) setForm(p => ({ ...p, case_id: c.id, case_title: c.title, client_name: c.client_name, assigned_lawyer: c.assigned_lawyer, assigned_lawyer_name: c.assigned_lawyer_name, case_type: c.case_type, court_name: c.court_name }));
  };
  const handleSubmit = (e) => { e.preventDefault(); onSubmit({ ...form, settlement_amount: form.settlement_amount ? parseFloat(form.settlement_amount) : undefined }); };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t("record_case_outcome", "Record Case Outcome")}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t("case", "Case *")}</Label>
            <Select value={form.case_id} onValueChange={handleCaseChange}>
              <SelectTrigger><SelectValue placeholder="Select a case" /></SelectTrigger>
              <SelectContent>{cases.filter(c => !["closed", "archived"].includes(c.status)).map(c => {
                return <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>;
              })}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("outcome", "Outcome *")}</Label>
              <Select value={form.outcome} onValueChange={(v) => setForm(p => ({ ...p, outcome: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["won", "lost", "settled", "dismissed", "withdrawn"].map(o => {
                  return <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>;
                })}</SelectContent>
              </Select>
            </div>
            <div><Label>{t("date", "Date")}</Label><Input type="date" value={form.outcome_date} onChange={(e) => setForm(p => ({ ...p, outcome_date: e.target.value }))} /></div>
          </div>
          {form.outcome === "settled" && <div><Label>{t("settlement_amount", "Settlement Amount")}</Label><Input type="number" placeholder="0.00" value={form.settlement_amount} onChange={(e) => setForm(p => ({ ...p, settlement_amount: e.target.value }))} /></div>}
          <div><Label>{t("summary", "Summary")}</Label><Textarea value={form.outcome_summary} onChange={(e) => setForm(p => ({ ...p, outcome_summary: e.target.value }))} className="resize-none h-20" placeholder="Brief description of the outcome..." /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>{t("cancel", "Cancel")}</Button>
            <Button type="submit" disabled={!form.case_id}>{t("record_outcome", "Record Outcome")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}