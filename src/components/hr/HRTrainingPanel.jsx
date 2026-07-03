import React, { useState, useEffect, useCallback } from "react";
import { powerSync } from "@/api/PowerSyncConnector";
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
import {
  Plus, BookOpen, Award, Clock, CheckCircle2, AlertTriangle,
  Users, GraduationCap, RefreshCw, TrendingUp
} from "lucide-react";

const CATEGORIES = ["Compliance", "Technical", "Leadership", "Safety", "Onboarding", "Product", "Soft Skills"];
const STATUS_COLORS = {
  not_started: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-700",
  completed:   "bg-green-100 text-green-700",
  expired:     "bg-red-100 text-red-700",
};

function ProgressRing({ pct, size = 56 }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(100, pct) / 100) * circ;
  const color = pct >= 80 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#94a3b8";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={5} className="text-muted/30" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color }}>{pct}%</span>
    </div>
  );
}

export default function HRTrainingPanel({ companyId, isAdmin, staff = [] }) {
  const { toast } = useToast();
  const [courses, setCourses] = useState([]);
  const [records, setRecords] = useState([]);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(null);

  const [courseForm, setCourseForm] = useState({ title: "", description: "", category: "Compliance", is_mandatory: 0 });
  const [enrollForm, setEnrollForm] = useState({ staff_id: "", course_id: "", expiry_date: "" });

  const loadData = useCallback(async () => {
    if (!companyId) return;
    const cr = await powerSync.execute("SELECT * FROM hr_training_courses WHERE company_id = ? ORDER BY created_at DESC", [companyId]);
    const rr = await powerSync.execute(
      "SELECT r.*, c.title as course_title, c.category, c.is_mandatory, s.full_name FROM hr_training_records r LEFT JOIN hr_training_courses c ON r.course_id = c.id LEFT JOIN staff_records s ON r.staff_id = s.id WHERE r.company_id = ? ORDER BY r.created_at DESC",
      [companyId]
    );
    setCourses(cr.rows?._array || []);
    setRecords(rr.rows?._array || []);
  }, [companyId]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveCourse = async () => {
    if (!courseForm.title) return toast({ title: "Course title required", variant: "destructive" });
    await powerSync.execute(
      "INSERT INTO hr_training_courses (id, created_at, company_id, title, description, category, is_mandatory) VALUES (?,?,?,?,?,?,?)",
      [crypto.randomUUID(), new Date().toISOString(), companyId, courseForm.title, courseForm.description, courseForm.category, courseForm.is_mandatory]
    );
    await loadData();
    setShowCourseForm(false);
    setCourseForm({ title: "", description: "", category: "Compliance", is_mandatory: 0 });
    toast({ title: "Course created" });
  };

  const enrollStaff = async () => {
    if (!enrollForm.staff_id || !enrollForm.course_id) return toast({ title: "Staff and course required", variant: "destructive" });
    await powerSync.execute(
      "INSERT INTO hr_training_records (id, created_at, company_id, staff_id, course_id, status, expiry_date) VALUES (?,?,?,?,?,?,?)",
      [crypto.randomUUID(), new Date().toISOString(), companyId, enrollForm.staff_id, enrollForm.course_id, "not_started", enrollForm.expiry_date || null]
    );
    await loadData();
    setShowEnrollForm(false);
    setEnrollForm({ staff_id: "", course_id: "", expiry_date: "" });
    toast({ title: "Staff enrolled in course" });
  };

  const updateStatus = async (recordId, status, completedAt) => {
    await powerSync.execute(
      "UPDATE hr_training_records SET status = ?, completed_at = ? WHERE id = ?",
      [status, status === "completed" ? new Date().toISOString() : null, recordId]
    );
    await loadData();
    setShowUpdateForm(null);
    toast({ title: `Marked as ${status}` });
  };

  // Analytics
  const completedCount = records.filter(r => r.status === "completed").length;
  const inProgressCount = records.filter(r => r.status === "in_progress").length;
  const notStartedCount = records.filter(r => r.status === "not_started").length;
  const overallPct = records.length > 0 ? Math.round((completedCount / records.length) * 100) : 0;

  const expiringRecords = records.filter(r => {
    if (!r.expiry_date || r.status === "completed") return false;
    const days = Math.ceil((new Date(r.expiry_date) - new Date()) / 86400000);
    return days >= 0 && days <= 30;
  });

  const categoryData = CATEGORIES.map(cat => ({
    name: cat,
    total: records.filter(r => r.category === cat).length,
    completed: records.filter(r => r.category === cat && r.status === "completed").length,
  })).filter(d => d.total > 0);

  // Per-staff completion
  const staffCompletion = staff.map(s => {
    const myRecords = records.filter(r => r.staff_id === s.id);
    const done = myRecords.filter(r => r.status === "completed").length;
    return { name: s.full_name, total: myRecords.length, completed: done, pct: myRecords.length > 0 ? Math.round((done / myRecords.length) * 100) : 0 };
  }).filter(s => s.total > 0).sort((a, b) => b.pct - a.pct);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Training & Learning</h2>
              <p className="text-emerald-100 text-sm">{courses.length} courses · {records.length} enrollments · {overallPct}% overall completion</p>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30" onClick={() => setShowEnrollForm(true)}>
                  <Users className="w-4 h-4 mr-1" /> Enroll Staff
                </Button>
                <Button size="sm" className="bg-white text-emerald-700 hover:bg-white/90" onClick={() => setShowCourseForm(true)}>
                  <Plus className="w-4 h-4 mr-1" /> New Course
                </Button>
              </div>
            )}
          </div>

          {/* Summary KPIs */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Courses", value: courses.length, icon: BookOpen },
              { label: "Completed", value: completedCount, icon: CheckCircle2 },
              { label: "In Progress", value: inProgressCount, icon: Clock },
              { label: "Not Started", value: notStartedCount, icon: RefreshCw },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white/15 rounded-xl p-3 text-center">
                <Icon className="w-4 h-4 mx-auto mb-1 text-emerald-200" />
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs text-emerald-200">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expiry Alerts */}
      {expiringRecords.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-800 mb-2">
            <AlertTriangle className="w-4 h-4" />{expiringRecords.length} training records expiring within 30 days
          </p>
          <div className="flex flex-wrap gap-2">
            {expiringRecords.map(r => (
              <span key={r.id} className="text-xs bg-white border border-amber-200 px-3 py-1.5 rounded-lg text-amber-800">
                {r.full_name} · {r.course_title} · {r.expiry_date}
              </span>
            ))}
          </div>
        </div>
      )}

      <Tabs defaultValue="records">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="records" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <GraduationCap className="w-4 h-4 mr-1.5" />Training Records
          </TabsTrigger>
          <TabsTrigger value="courses" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <BookOpen className="w-4 h-4 mr-1.5" />Courses ({courses.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <TrendingUp className="w-4 h-4 mr-1.5" />Analytics
          </TabsTrigger>
        </TabsList>

        {/* TRAINING RECORDS */}
        <TabsContent value="records" className="mt-4">
          {records.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No training records yet. Enroll staff to get started.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Employee</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Course</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Category</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Expiry</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => {
                    const daysLeft = r.expiry_date ? Math.ceil((new Date(r.expiry_date) - new Date()) / 86400000) : null;
                    return (
                      <tr key={r.id} className={`border-b border-border last:border-0 hover:bg-muted/30 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                        <td className="px-4 py-3 font-medium">{r.full_name || "Unknown"}</td>
                        <td className="px-4 py-3">
                          <span className="text-foreground">{r.course_title}</span>
                          {r.is_mandatory ? <Badge className="ml-2 text-[10px] bg-red-100 text-red-700 px-1.5">Mandatory</Badge> : null}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{r.category}</td>
                        <td className="px-4 py-3">
                          <Badge className={STATUS_COLORS[r.status] || "bg-slate-100 text-slate-600"}>{r.status?.replace("_", " ")}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {daysLeft != null ? (
                            <span className={`text-xs font-medium ${daysLeft <= 30 ? "text-amber-600" : daysLeft < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                              {daysLeft < 0 ? "Expired" : `${daysLeft}d left`}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {isAdmin && r.status !== "completed" && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600 hover:bg-emerald-50" onClick={() => setShowUpdateForm(r)}>
                              Update
                            </Button>
                          )}
                          {r.status === "completed" && (
                            <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3 h-3" />Done</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* COURSES */}
        <TabsContent value="courses" className="mt-4">
          {courses.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No courses yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map(course => {
                const enrolled = records.filter(r => r.course_id === course.id).length;
                const completed = records.filter(r => r.course_id === course.id && r.status === "completed").length;
                const pct = enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0;
                return (
                  <div key={course.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <ProgressRing pct={pct} size={48} />
                        {course.is_mandatory ? <Badge className="text-[10px] bg-red-100 text-red-700 px-1.5">Mandatory</Badge> : null}
                      </div>
                    </div>
                    <h3 className="font-bold text-foreground text-sm mb-1">{course.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <Badge className="bg-muted text-muted-foreground">{course.category}</Badge>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{enrolled} enrolled</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Completion by Category */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-1">Completion by Category</h3>
              <p className="text-xs text-muted-foreground mb-4">Training records completed per category</p>
              {categoryData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={categoryData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="total" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Enrolled" />
                    <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Per-staff completion leaderboard */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />Training Leaderboard
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Employees ranked by training completion</p>
              {staffCompletion.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No enrollments yet</p>
              ) : (
                <div className="space-y-3">
                  {staffCompletion.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-3">
                      <span className={`w-6 text-xs font-bold ${i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-muted-foreground"}`}>{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{s.name}</span>
                          <span className="text-xs text-muted-foreground">{s.completed}/{s.total}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full transition-all ${s.pct >= 80 ? "bg-green-500" : s.pct >= 40 ? "bg-amber-500" : "bg-slate-400"}`} style={{ width: `${s.pct}%` }} />
                        </div>
                      </div>
                      <ProgressRing pct={s.pct} size={40} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Course Dialog */}
      <Dialog open={showCourseForm} onOpenChange={setShowCourseForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Training Course</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Course Title *</Label><Input placeholder="e.g. Workplace Safety Certification" value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={courseForm.category} onValueChange={v => setCourseForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mandatory?</Label>
                <Select value={String(courseForm.is_mandatory)} onValueChange={v => setCourseForm(f => ({ ...f, is_mandatory: parseInt(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Optional</SelectItem>
                    <SelectItem value="1">Mandatory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Description</Label><Textarea placeholder="What will employees learn?" rows={3} value={courseForm.description} onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCourseForm(false)}>Cancel</Button>
              <Button onClick={saveCourse}>Create Course</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enroll Dialog */}
      <Dialog open={showEnrollForm} onOpenChange={setShowEnrollForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Enroll Staff in Course</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Employee *</Label>
              <Select value={enrollForm.staff_id} onValueChange={v => setEnrollForm(f => ({ ...f, staff_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Course *</Label>
              <Select value={enrollForm.course_id} onValueChange={v => setEnrollForm(f => ({ ...f, course_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Certification Expiry (optional)</Label><Input type="date" value={enrollForm.expiry_date} onChange={e => setEnrollForm(f => ({ ...f, expiry_date: e.target.value }))} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEnrollForm(false)}>Cancel</Button>
              <Button onClick={enrollStaff}>Enroll</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      {showUpdateForm && (
        <Dialog open={!!showUpdateForm} onOpenChange={() => setShowUpdateForm(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Update Training Status</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground"><strong>{showUpdateForm.full_name}</strong> · {showUpdateForm.course_title}</p>
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="justify-start gap-2" onClick={() => updateStatus(showUpdateForm.id, "in_progress")}>
                  <Clock className="w-4 h-4 text-blue-500" />Mark as In Progress
                </Button>
                <Button className="justify-start gap-2 bg-green-600 hover:bg-green-700" onClick={() => updateStatus(showUpdateForm.id, "completed")}>
                  <CheckCircle2 className="w-4 h-4" />Mark as Completed
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
