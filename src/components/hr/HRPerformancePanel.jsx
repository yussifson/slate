import React, { useState, useEffect, useCallback } from "react";
import { powerSync } from "@/api/PowerSyncConnector";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Target, Star, TrendingUp, Users, Trophy, ChevronRight, MessageSquare, ArrowUpRight, ArrowDownRight, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const REVIEW_TYPES = ["Self", "Manager Review", "Peer Review", "360 Review"];
const STATUS_STYLES = {
  draft: "bg-slate-100 text-slate-700 dark:bg-secondary dark:text-foreground",
  submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
};

export default function HRPerformancePanel({ companyId, isAdmin, staff = [], user }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ staff_id: "", period: "", type: "Manager Review", score: "", strengths: "", weaknesses: "", status: "draft" });

  const loadReviews = useCallback(async () => {
    if (companyId === undefined) return;
    const res = await powerSync.execute(
      "SELECT r.*, s.name as full_name, s.department FROM hr_performance_reviews r LEFT JOIN univ_hr_employees s ON r.staff_id = s.id WHERE r.company_id = ? ORDER BY r.created_at DESC",
      [companyId]
    );
    setReviews(res.rows?._array || []);
  }, [companyId]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const saveReview = async () => {
    if (!form.staff_id || !form.period) return toast({ title: "Staff and period are required", variant: "destructive" });
    await powerSync.execute(
      "INSERT INTO hr_performance_reviews (id, created_at, company_id, staff_id, reviewer_id, period, type, score, strengths, weaknesses, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      [crypto.randomUUID(), new Date().toISOString(), companyId, form.staff_id, user?.id, form.period, form.type, parseFloat(form.score) || null, form.strengths, form.weaknesses, form.status]
    );
    await loadReviews();
    setShowForm(false);
    setForm({ staff_id: "", period: "", type: "Manager Review", score: "", strengths: "", weaknesses: "", status: "draft" });
    toast({ title: "Review saved" });
  };

  const myReviews = reviews.filter(r => r.staff_id === user?.id);
  const teamAvg = reviews.length > 0 ? (reviews.filter(r => r.score != null).reduce((s, r) => s + parseFloat(r.score || 0), 0) / Math.max(reviews.filter(r => r.score != null).length, 1)).toFixed(1) : 0;
  const topPerformers = [...reviews].filter(r => r.score != null).sort((a, b) => b.score - a.score).slice(0, 3);
  const latestReviews = [...reviews].slice(0, 6);

  const kpis = [
    { label: 'Total Reviews', value: reviews.length, sub: 'All time', icon: MessageSquare, alt: false, trend: '+5%', trendUp: true },
    { label: 'Company Avg Score', value: `${teamAvg}/10`, sub: 'Across all departments', icon: Target, alt: true, trend: '+0.2', trendUp: true },
    { label: 'Top Performers', value: topPerformers.length, sub: 'Scores above 8', icon: Trophy, alt: false },
    { label: 'Completion Rate', value: '92%', sub: 'For this quarter', icon: CheckCircle2, alt: true, trend: '+4%', trendUp: true },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden font-sans">
      {/* â”€â”€ Hero Header â”€â”€ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 -right-16 w-56 h-56 bg-white/5 rounded-full" />
        <div className="absolute top-4 right-40 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{t("performance_reviews", "Performance Reviews")}</h1>
                <p className="text-green-100 text-sm">Manage staff evaluations and goals.</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button onClick={() => setShowForm(true)} className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur gap-2 text-xs font-bold">
                <Plus className="w-4 h-4" /> Create Review
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* â”€â”€ KPI Cards â”€â”€ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md ${kpi.alt ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
              {kpi.trend && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${kpi.trendUp ? 'text-green-700 bg-green-50 dark:bg-green-900/40' : 'text-orange-700 bg-orange-50 dark:bg-orange-900/40'}`}>
                  {kpi.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {kpi.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground mb-1 tabular-nums">{kpi.value}</p>
            <p className="text-sm font-medium text-foreground mb-0.5">{kpi.label}</p>
            <p className="text-xs text-muted-foreground">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue={isAdmin ? "all_reviews" : "my_reviews"} className="w-full pt-4">
        <TabsList className="bg-muted p-1 rounded-xl mb-6 inline-flex">
          {isAdmin && <TabsTrigger value="all_reviews" className="rounded-lg font-semibold px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">All Reviews</TabsTrigger>}
          <TabsTrigger value="my_reviews" className="rounded-lg font-semibold px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">My Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="all_reviews" className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No performance reviews conducted yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map(r => (
                <div key={r.id} className="bg-slate-50 dark:bg-secondary/30 border border-border/50 rounded-2xl p-5 hover:border-emerald-500/30 transition-all hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 font-bold flex items-center justify-center">
                        {r.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{r.full_name}</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">{r.period}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase border border-border/50 ${STATUS_STYLES[r.status] || STATUS_STYLES.draft}`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex -space-x-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className={`w-4 h-4 ${star <= (r.score / 2) ? "text-amber-500 fill-amber-500" : "text-slate-300 dark:text-slate-700"}`} />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-foreground ml-2">{r.score}/10 Score</span>
                  </div>
                  {r.strengths && <div className="mb-2"><p className="text-[10px] font-bold text-muted-foreground uppercase">Strengths</p><p className="text-xs text-foreground line-clamp-2 mt-0.5">{r.strengths}</p></div>}
                  <div className="pt-4 mt-4 border-t border-border/50 flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-semibold">{r.type}</span>
                    <Button variant="link" className="h-auto p-0 text-emerald-600 font-bold">View Full</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my_reviews" className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          {myReviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">You have no performance reviews yet.</div>
          ) : (
            <div className="space-y-4">
              {myReviews.map(r => (
                <div key={r.id} className="p-4 bg-slate-50 dark:bg-secondary/30 rounded-xl border border-border/50 flex flex-col md:flex-row justify-between gap-4 group hover:border-emerald-500/30">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase ${STATUS_STYLES[r.status]}`}>{r.status}</span>
                      <span className="text-xs font-bold text-muted-foreground uppercase">{r.period}</span>
                    </div>
                    <h4 className="font-bold text-sm text-foreground">{r.type}</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-lg font-black text-emerald-600">{r.score}/10</span>
                      <div className="flex -space-x-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} className={`w-3 h-3 ${star <= (r.score / 2) ? "text-amber-500 fill-amber-500" : "text-slate-300 dark:text-slate-700"}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 max-w-lg space-y-2">
                    {r.strengths && <div><p className="text-[10px] font-bold text-emerald-600 uppercase">Strengths</p><p className="text-xs text-foreground line-clamp-1">{r.strengths}</p></div>}
                    {r.weaknesses && <div><p className="text-[10px] font-bold text-rose-500 uppercase">Areas to Improve</p><p className="text-xs text-foreground line-clamp-1">{r.weaknesses}</p></div>}
                  </div>
                  <Button variant="ghost" className="shrink-0 h-8 font-bold text-xs self-start md:self-center">Review Details</Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-2xl rounded-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold">Conduct Performance Review</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Staff Member *</Label>
              <Select value={form.staff_id} onValueChange={v => setForm({...form, staff_id: v})}>
                <SelectTrigger className="bg-slate-50 dark:bg-card rounded-xl border-none"><SelectValue placeholder="Select staff..."/></SelectTrigger>
                <SelectContent className="rounded-xl max-h-60">
                  {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name || s.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Review Period *</Label>
              <Input placeholder="e.g. Q3 2026" value={form.period} onChange={e => setForm({...form, period: e.target.value})} className="bg-slate-50 dark:bg-card rounded-xl border-none" />
            </div>
            <div>
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Review Type</Label>
              <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                <SelectTrigger className="bg-slate-50 dark:bg-card rounded-xl border-none"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">{REVIEW_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Overall Score (0-10)</Label>
              <Input type="number" min="0" max="10" step="0.1" placeholder="e.g. 8.5" value={form.score} onChange={e => setForm({...form, score: e.target.value})} className="bg-slate-50 dark:bg-card rounded-xl border-none" />
            </div>
            <div className="col-span-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Key Strengths</Label>
              <Textarea value={form.strengths} onChange={e => setForm({...form, strengths: e.target.value})} className="bg-slate-50 dark:bg-card rounded-xl border-none resize-none" rows={2} />
            </div>
            <div className="col-span-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Areas for Improvement</Label>
              <Textarea value={form.weaknesses} onChange={e => setForm({...form, weaknesses: e.target.value})} className="bg-slate-50 dark:bg-card rounded-xl border-none resize-none" rows={2} />
            </div>
            <div className="col-span-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger className="bg-slate-50 dark:bg-card rounded-xl border-none"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setShowForm(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button onClick={saveReview} className="bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700">Save Review</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ className, children, ...props }) {
  return <label className={className} {...props}>{children}</label>;
}
