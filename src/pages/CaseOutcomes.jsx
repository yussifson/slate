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
import { Trophy, Plus, TrendingUp, Target, Sparkles, BrainCircuit } from "lucide-react";
import { generateText } from "@/lib/cloudflareAI";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const OUTCOME_COLORS = { won: "bg-slate-100 text-primary/90", lost: "bg-red-100 text-red-700", settled: "bg-orange-100 text-orange-700", dismissed: "bg-slate-100 text-primary/90", withdrawn: "bg-gray-100 text-gray-600", ongoing: "bg-amber-100 text-amber-700" };
const PIE_COLORS = ["#22c55e", "#ef4444", "#3b82f6", "#a855f7", "#9ca3af", "#f59e0b"];

export default function CaseOutcomes() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = user?.company_id;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [aiForecast, setAiForecast] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: outcomes = [] } = useQuery({
    queryKey: ["outcomes", companyId],
    queryFn: () => base44.entities.CaseOutcome.filter({ company_id: companyId }, "-created_date"),
    enabled: !!companyId});
  const { data: cases = [] } = useQuery({
    queryKey: ["cases", companyId],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }),
    enabled: !!companyId});

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CaseOutcome.create({ ...data, company_id: companyId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["outcomes"] }); setShowForm(false); }});

  const outcomeStats = ["won", "lost", "settled", "dismissed", "withdrawn"].map(o => ({ name: o, value: outcomes.filter(x => x.outcome === o).length })).filter(o => o.value > 0);
  const winRate = outcomes.length > 0 ? Math.round((outcomes.filter(o => o.outcome === "won").length / outcomes.filter(o => o.outcome !== "ongoing").length) * 100) : 0;
  const settleRate = outcomes.length > 0 ? Math.round((outcomes.filter(o => o.outcome === "settled").length / outcomes.filter(o => o.outcome !== "ongoing").length) * 100) : 0;

  const handleGenerateForecast = async () => {
    setIsGenerating(true);
    const tId = toast.loading('AI analyzing historical case outcomes...');
    try {
      const summaryData = outcomes.map(o => ({ type: o.case_type || 'Unknown', outcome: o.outcome, value: o.settlement_amount || 0 }));
      const prompt = `You are an AI Legal Outcome Forecaster. Analyze this historical firm data:
${JSON.stringify(summaryData.slice(0, 50))}

Provide a predictive JSON response (raw JSON only, no markdown):
{
  "projectedWinRate": "number with % sign",
  "settlementTrend": "1-2 sentence trend analysis (e.g. 'You settle 80% of family cases.')",
  "trialRisk": "1-2 sentence assessment of trial risks based on recent losses or wins.",
  "strategicAdvice": "1 sentence advice on how to improve settlement amounts."
}`;
      const rawResponse = await generateText([{ role: 'user', content: prompt }]);
      const cleanJsonStr = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim().replace(/[\u0000-\u001F]+/g, "");
      setAiForecast(JSON.parse(cleanJsonStr));
      toast.success('Forecast generated!', { id: tId });
    } catch (err) {
      toast.error('Failed to generate forecast: ' + err.message, { id: tId });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 school-page-enter font-dmsans">
      <PageHeader
        title="Case Outcomes"
        subtitle="Track win/loss rates and case results"
        actions={<Button size="sm" onClick={() => setShowForm(true)} className="gap-2.5"><Plus className="w-4 h-4" />{t("record_outcome", "Record Outcome")}</Button>}
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Closed", value: outcomes.filter(o => o.outcome !== "ongoing").length, color: "bg-slate-50 dark:bg-slate-800/50 text-primary" },
          { label: "Won", value: outcomes.filter(o => o.outcome === "won").length, color: "bg-slate-50 dark:bg-slate-800/50 text-primary" },
          { label: "Win Rate", value: `${winRate}%`, color: "bg-slate-100 text-primary" },
          { label: "Settlement Rate", value: `${settleRate}%`, color: "bg-slate-50 dark:bg-slate-800/50 text-primary" },
        ].map(s => {
          return (
            <div key={s.label} className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-4 flex items-center gap-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", s.color)}><Target className="w-4 h-4" /></div>
              <div><p className="text-xl font-semibold">{s.value}</p><p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{s.label}</p></div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie chart */}
        {outcomeStats.length > 0 && (
          <div className="lg:col-span-1 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
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

        {/* AI Forecaster Widget */}
        <div className="lg:col-span-1 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-5 flex flex-col relative overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><BrainCircuit className="w-24 h-24"/></div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-primary"><Sparkles className="w-4 h-4"/> AI Outcome Forecaster</h3>
          <p className="text-xs text-[#71717a] dark:text-gray-400 mb-4">Analyze historical outcomes to predict future trial risks and settlement rates.</p>
          
          {aiForecast ? (
            <div className="space-y-4 flex-1 relative z-10">
              <div>
                <p className="text-[10px] font-semibold text-[#71717a] uppercase tracking-wider mb-1">Projected Win Rate</p>
                <p className="text-2xl font-bold text-foreground">{aiForecast.projectedWinRate}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#71717a] uppercase tracking-wider mb-1">Settlement Trend</p>
                <p className="text-sm font-medium text-foreground">{aiForecast.settlementTrend}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/10 p-2.5 rounded-lg border border-red-200 dark:border-red-900/30">
                <p className="text-[10px] font-semibold text-red-800 dark:text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Target className="w-3 h-3"/> Trial Risk</p>
                <p className="text-xs text-red-900 dark:text-red-300">{aiForecast.trialRisk}</p>
              </div>
              <div className="bg-primary/5 p-2.5 rounded-lg border border-primary/10">
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Strategic Advice</p>
                <p className="text-xs text-foreground">{aiForecast.strategicAdvice}</p>
              </div>
              <Button onClick={handleGenerateForecast} disabled={isGenerating} size="sm" variant="outline" className="w-full mt-auto text-primary">
                {isGenerating ? 'Updating...' : 'Refresh Forecast'}
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
              <BrainCircuit className="w-10 h-10 text-primary/20" />
              <Button onClick={handleGenerateForecast} disabled={isGenerating || outcomes.length === 0} size="sm" className="gap-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30">
                <Sparkles className="w-4 h-4"/> {isGenerating ? 'Analyzing...' : 'Generate AI Forecast'}
              </Button>
            </div>
          )}
        </div>

        {/* Recent outcomes */}
        <div className="lg:col-span-1 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="p-4 border-b border-primary/40 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">{t("recent_outcomes", "Recent Outcomes")}</h3>
          </div>
          <div className="divide-y divide-border-[0.5px] border-black/9 dark:border-white/8 max-h-72 overflow-y-auto">
            {outcomes.slice(0, 10).map(o => {
              return (
                <div key={o.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{o.case_title}</p>
                    <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{o.client_name} · {o.assigned_lawyer_name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {o.outcome_date && <span className="text-[10px] text-[#71717a] dark:text-gray-400">{format(new Date(o.outcome_date), "MMM d, yyyy")}</span>}
                    <Badge className={cn("text-[10px] capitalize", OUTCOME_COLORS[o.outcome])}>{o.outcome}</Badge>
                  </div>
                </div>
              );
            })}
            {outcomes.length === 0 && <div className="p-8 text-center text-sm text-[#71717a] dark:text-gray-400">{t("no_outcomes_recorded_yet", "No outcomes recorded yet")}</div>}
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