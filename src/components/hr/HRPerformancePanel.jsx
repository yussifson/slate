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
import { Plus, Target, Star, TrendingUp, Users, Trophy, ChevronRight, MessageSquare } from "lucide-react";

const REVIEW_TYPES = ["Self", "Manager Review", "Peer Review", "360 Review"];
const STATUS_STYLES = {
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
};

function ScoreRing({ score, size = 100 }) {
  const pct = Math.min(100, Math.max(0, (score / 10) * 100));
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;
  const color = score >= 8 ? "#10b981" : score >= 5 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative inline-flex items-center justify-center bg-white dark:bg-slate-800 rounded-full shadow-sm" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={8} className="text-slate-100 dark:text-slate-700" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold" style={{ color }}>{score?.toFixed(1) ?? "—"}</span>
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">/ 10</span>
      </div>
    </div>
  );
}

export default function HRPerformancePanel({ companyId, isAdmin, staff = [], user }) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ staff_id: "", period: "", type: "Manager Review", score: "", strengths: "", weaknesses: "", status: "draft" });

  const loadReviews = useCallback(async () => {
    if (!companyId) return;
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
  const teamAvg = reviews.length > 0 ? (reviews.filter(r => r.score != null).reduce((s, r) => s + parseFloat(r.score || 0), 0) / reviews.filter(r => r.score != null).length).toFixed(1) : null;

  const topPerformers = [...reviews].filter(r => r.score != null).sort((a, b) => b.score - a.score).slice(0, 3);
  const latestReviews = [...reviews].slice(0, 6);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-dmsans">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Performance Reviews</h2>
            <p className="text-emerald-100 mt-1 opacity-90">{reviews.length} Total Reviews Conducted</p>
          </div>
          {isAdmin && (
            <Button className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold shadow-sm whitespace-nowrap self-start md:self-auto" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create Review
            </Button>
          )}
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-emerald-500/30 flex items-center justify-center border border-emerald-400/30 shrink-0">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-100 uppercase tracking-wider">Company Avg</p>
              <p className="text-3xl font-bold mt-0.5">{teamAvg ?? "—"}<span className="text-base font-normal text-emerald-200">/10</span></p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 flex flex-col justify-center">
            <p className="text-sm font-medium text-emerald-100 uppercase tracking-wider mb-2">Score Distribution</p>
            <div className="flex items-end gap-1 h-12 w-full">
              {[
                { label: "0-3", count: reviews.filter(r => r.score != null && r.score <= 3).length },
                { label: "4-6", count: reviews.filter(r => r.score != null && r.score > 3 && r.score <= 6).length },
                { label: "7-8", count: reviews.filter(r => r.score != null && r.score > 6 && r.score <= 8).length },
                { label: "9-10", count: reviews.filter(r => r.score != null && r.score > 8).length },
              ].map((b, i, arr) => {
                const max = Math.max(...arr.map(x => x.count), 1);
                const h = Math.max((b.count / max) * 100, 10);
                return (
                  <div key={b.label} className="flex-1 flex flex-col justify-end items-center group relative">
                    <div className="w-full bg-white/40 rounded-sm hover:bg-white/80 transition-colors" style={{ height: `${h}%` }} />
                    <span className="absolute -bottom-5 text-[9px] text-emerald-200">{b.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 col-span-1 md:col-span-2 lg:col-span-2">
            <p className="text-sm font-medium text-emerald-100 uppercase tracking-wider mb-3">Top Performers</p>
            <div className="flex gap-4">
              {topPerformers.length > 0 ? topPerformers.map(r => (
                <div key={r.id} className="flex-1 bg-white/20 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center shrink-0">
                    {r.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{r.full_name}</p>
                    <p className="text-xs text-emerald-100 font-medium">Score: {r.score}</p>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-emerald-200">No scored reviews yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue={isAdmin ? "all_reviews" : "my_reviews"} className="w-full pt-4">
        <TabsList className="bg-muted p-1 rounded-xl mb-6 inline-flex">
          {isAdmin && <TabsTrigger value="all_reviews" className="rounded-lg font-semibold px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">All Reviews</TabsTrigger>}
          <TabsTrigger value="my_reviews" className="rounded-lg font-semibold px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">My Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="all_reviews">
          {reviews.length === 0 ? (
            <div className="py-20 text-center bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8">
              <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg font-bold text-foreground">No Reviews Found</p>
              <p className="text-muted-foreground mt-1">Start by evaluating your team members.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {latestReviews.map(r => (
                <div key={r.id} className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 dark:bg-rose-500/10 rounded-bl-full -z-0" />
                  
                  <div className="p-6 relative z-10 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
                          {r.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-foreground leading-tight">{r.full_name}</h3>
                          <p className="text-xs text-muted-foreground">{r.department || 'Employee'}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${STATUS_STYLES[r.status] || STATUS_STYLES['draft']}`}>
                        {r.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 mb-6">
                      <ScoreRing score={r.score} size={80} />
                      <div className="space-y-1.5 flex-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Review Details</p>
                        <p className="text-sm font-medium text-foreground"><span className="text-muted-foreground">Type:</span> {r.type}</p>
                        <p className="text-sm font-medium text-foreground"><span className="text-muted-foreground">Period:</span> {r.period}</p>
                      </div>
                    </div>

                    <div className="space-y-3 mt-auto">
                      {r.strengths && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                          <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Strengths</p>
                          <p className="text-sm text-emerald-900 dark:text-emerald-100 line-clamp-2">{r.strengths}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my_reviews">
          {myReviews.length === 0 ? (
            <div className="py-20 text-center bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8">
              <Star className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg font-bold text-foreground">No Personal Reviews</p>
              <p className="text-muted-foreground mt-1">You haven't received any performance reviews yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myReviews.map(r => (
                <div key={r.id} className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 p-6 flex gap-6">
                  <ScoreRing score={r.score} size={100} />
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-1">{r.period}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{r.type} • Status: <span className="font-semibold">{r.status}</span></p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Strengths</p>
                        <p className="text-sm text-foreground">{r.strengths || 'None listed'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-red-600 uppercase mb-1">Areas for Growth</p>
                        <p className="text-sm text-foreground">{r.weaknesses || 'None listed'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Add Review Dialog ── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>New Performance Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employee</label>
                <Select value={form.staff_id} onValueChange={v => setForm({ ...form, staff_id: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select staff..." /></SelectTrigger>
                  <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Period</label>
                <Input value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} className="mt-1" placeholder="e.g. Q3 2026" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Review Type</label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{REVIEW_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score (0-10)</label>
                <Input type="number" min="0" max="10" step="0.1" value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} className="mt-1" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Key Strengths</label>
              <Textarea value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} className="mt-1 h-20 resize-none border-emerald-200 focus-visible:ring-emerald-500" placeholder="What did they do well?" />
            </div>
            <div>
              <label className="text-xs font-semibold text-red-600 uppercase tracking-wider">Areas for Improvement</label>
              <Textarea value={form.weaknesses} onChange={e => setForm({ ...form, weaknesses: e.target.value })} className="mt-1 h-20 resize-none border-red-200 focus-visible:ring-red-500" placeholder="Where can they grow?" />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={saveReview} className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl mt-4">Save Review</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
