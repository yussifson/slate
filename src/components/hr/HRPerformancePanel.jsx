import React, { useState, useEffect, useCallback } from "react";
import { powerSync } from "@/api/PowerSyncConnector";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Plus, Target, Star, TrendingUp, Users, Trophy, Award } from "lucide-react";

const REVIEW_TYPES = ["Self", "Manager Review", "Peer Review", "360 Review"];
const STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-600",
  submitted: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
};

function ScoreRing({ score, size = 80 }) {
  const pct = Math.min(100, Math.max(0, (score / 10) * 100));
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;
  const color = score >= 7 ? "#22c55e" : score >= 5 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={6} className="text-muted/30" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.5s ease" }} />
      </svg>
      <span className="absolute text-lg font-bold" style={{ color }}>{score?.toFixed(1) ?? "—"}</span>
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
      "SELECT r.*, s.name as full_name FROM hr_performance_reviews r LEFT JOIN univ_hr_employees s ON r.staff_id = s.id WHERE r.company_id = ? ORDER BY r.created_at DESC",
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

  // Analytics: score distribution
  const bands = [
    { range: "0–3", count: reviews.filter(r => r.score != null && r.score <= 3).length },
    { range: "4–5", count: reviews.filter(r => r.score != null && r.score > 3 && r.score <= 5).length },
    { range: "6–7", count: reviews.filter(r => r.score != null && r.score > 5 && r.score <= 7).length },
    { range: "8–9", count: reviews.filter(r => r.score != null && r.score > 7 && r.score <= 9).length },
    { range: "10",  count: reviews.filter(r => r.score != null && r.score > 9).length },
  ];

  const topPerformers = [...reviews].filter(r => r.score != null).sort((a, b) => b.score - a.score).slice(0, 5);
  const lowPerformers = [...reviews].filter(r => r.score != null).sort((a, b) => a.score - b.score).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 p-6 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Performance Reviews</h2>
            <p className="text-rose-100 text-sm">{reviews.length} total reviews · Team avg: {teamAvg ?? "—"}/10</p>
          </div>
          {isAdmin && (
            <Button size="sm" className="bg-white text-rose-600 hover:bg-white/90" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" /> New Review
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue={isAdmin ? "reviews" : "mine"}>
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          {isAdmin && <TabsTrigger value="reviews" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"><Users className="w-4 h-4 mr-1.5" />All Reviews</TabsTrigger>}
          <TabsTrigger value="mine" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"><Star className="w-4 h-4 mr-1.5" />My Reviews</TabsTrigger>
          {isAdmin && <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"><TrendingUp className="w-4 h-4 mr-1.5" />Analytics</TabsTrigger>}
        </TabsList>

        {/* ALL REVIEWS (Admin) */}
        {isAdmin && (
          <TabsContent value="reviews" className="mt-4">
            {reviews.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground"><Target className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="text-sm">No reviews yet. Create the first one.</p></div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Employee</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Period</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Type</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Score</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((r, i) => (
                      <tr key={r.id} className={`border-b border-border last:border-0 hover:bg-muted/30 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                        <td className="px-4 py-3 font-medium">{r.full_name || "Unknown"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.period}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.type}</td>
                        <td className="px-4 py-3">
                          {r.score != null ? (
                            <span className={`font-bold text-base ${r.score >= 7 ? "text-green-600" : r.score >= 5 ? "text-amber-600" : "text-red-600"}`}>{parseFloat(r.score).toFixed(1)}</span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3"><Badge className={STATUS_COLORS[r.status] || "bg-slate-100 text-slate-600"}>{r.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        )}

        {/* MY REVIEWS */}
        <TabsContent value="mine" className="mt-4">
          {myReviews.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground"><Star className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="text-sm">No reviews for you yet</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myReviews.map(r => (
                <div key={r.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-bold text-foreground">{r.period}</p>
                      <p className="text-xs text-muted-foreground">{r.type}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <ScoreRing score={parseFloat(r.score)} size={64} />
                      <Badge className={STATUS_COLORS[r.status] || "bg-slate-100 text-slate-600"}>{r.status}</Badge>
                    </div>
                  </div>
                  {r.strengths && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-2">
                      <p className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1"><Trophy className="w-3 h-3" />Strengths</p>
                      <p className="text-xs text-green-800 dark:text-green-300">{r.strengths}</p>
                    </div>
                  )}
                  {r.weaknesses && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1"><Target className="w-3 h-3" />Areas to Improve</p>
                      <p className="text-xs text-amber-800 dark:text-amber-300">{r.weaknesses}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ANALYTICS */}
        {isAdmin && (
          <TabsContent value="analytics" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold text-foreground mb-1">Score Distribution</h3>
                <p className="text-xs text-muted-foreground mb-4">Number of employees by performance band</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={bands} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#ec4899" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                <div className="bg-card border border-border rounded-2xl p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-2">Team Average</p>
                  <ScoreRing score={parseFloat(teamAvg)} size={80} />
                  <p className="text-sm font-semibold mt-2 text-foreground">{teamAvg ?? "—"} / 10</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-4">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-3"><Award className="w-3.5 h-3.5 text-amber-500" />Top Performers</p>
                  {topPerformers.map((r, i) => (
                    <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                      <span className="text-sm text-foreground truncate">{r.full_name || "Unknown"}</span>
                      <span className={`text-sm font-bold ${r.score >= 7 ? "text-green-600" : "text-amber-600"}`}>{parseFloat(r.score).toFixed(1)}</span>
                    </div>
                  ))}
                  {topPerformers.length === 0 && <p className="text-xs text-muted-foreground">No data yet</p>}
                </div>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* New Review Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Performance Review</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Employee *</Label>
                <Select value={form.staff_id} onValueChange={v => setForm(f => ({ ...f, staff_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent position="popper" className="z-[9999] max-h-60">{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Period *</Label>
                <Input placeholder="e.g. Q2 2026, Annual 2025" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} />
              </div>
              <div>
                <Label>Review Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent position="popper" className="z-[9999] max-h-60">{REVIEW_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Score (0–10)</Label>
                <Input type="number" min={0} max={10} step={0.1} placeholder="e.g. 8.5" value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent position="popper" className="z-[9999] max-h-60">
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Strengths</Label>
                <Textarea placeholder="What did this employee do well?" rows={3} value={form.strengths} onChange={e => setForm(f => ({ ...f, strengths: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Areas for Improvement</Label>
                <Textarea placeholder="What can be improved?" rows={3} value={form.weaknesses} onChange={e => setForm(f => ({ ...f, weaknesses: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={saveReview}>Save Review</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
