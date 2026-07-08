import React, { useState, useEffect, useCallback } from "react";
import { powerSync } from "@/api/PowerSyncConnector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Plus, BookOpen, Award, Clock, CheckCircle2, AlertTriangle, Users, GraduationCap, PlayCircle, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Compliance", "Technical", "Leadership", "Safety", "Onboarding", "Product", "Soft Skills"];

const STATUS_STYLES = {
  not_started: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  completed:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  expired:     "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

function ProgressRing({ pct, size = 64 }) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(100, pct) / 100) * circ;
  const color = pct >= 80 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#94a3b8";
  return (
    <div className="relative inline-flex items-center justify-center rounded-full" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={6} className="text-slate-200 dark:text-slate-800" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
      </svg>
      <span className="absolute text-sm font-bold text-foreground">{pct}%</span>
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
    try {
      const cr = await powerSync.execute("SELECT * FROM hr_training_courses WHERE company_id = ? ORDER BY created_at DESC", [companyId]);
      const rr = await powerSync.execute(
        "SELECT r.*, c.title as course_title, c.category, c.is_mandatory, s.name as full_name FROM hr_training_records r LEFT JOIN hr_training_courses c ON r.course_id = c.id LEFT JOIN univ_hr_employees s ON r.staff_id = s.id WHERE r.company_id = ? ORDER BY r.created_at DESC",
        [companyId]
      );
      setCourses(cr.rows?._array || []);
      setRecords(rr.rows?._array || []);
    } catch (e) {
      console.error(e);
    }
  }, [companyId]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveCourse = async () => {
    if (!courseForm.title) return toast({ title: "Course title required", variant: "destructive" });
    try {
      await powerSync.execute(
        "INSERT INTO hr_training_courses (id, created_at, company_id, title, description, category, is_mandatory) VALUES (?,?,?,?,?,?,?)",
        [crypto.randomUUID(), new Date().toISOString(), companyId, courseForm.title, courseForm.description, courseForm.category, courseForm.is_mandatory]
      );
      await loadData();
      setShowCourseForm(false);
      setCourseForm({ title: "", description: "", category: "Compliance", is_mandatory: 0 });
      toast({ title: "Course created successfully" });
    } catch (err) {
      toast({ title: "Failed to create course", variant: "destructive" });
    }
  };

  const enrollStaff = async () => {
    if (!enrollForm.staff_id || !enrollForm.course_id) return toast({ title: "Staff and course required", variant: "destructive" });
    try {
      await powerSync.execute(
        "INSERT INTO hr_training_records (id, created_at, company_id, staff_id, course_id, status, expiry_date) VALUES (?,?,?,?,?,?,?)",
        [crypto.randomUUID(), new Date().toISOString(), companyId, enrollForm.staff_id, enrollForm.course_id, "not_started", enrollForm.expiry_date || null]
      );
      await loadData();
      setShowEnrollForm(false);
      setEnrollForm({ staff_id: "", course_id: "", expiry_date: "" });
      toast({ title: "Staff enrolled in course" });
    } catch (err) {
      toast({ title: "Failed to enroll staff", variant: "destructive" });
    }
  };

  const updateStatus = async (recordId, status) => {
    try {
      await powerSync.execute(
        "UPDATE hr_training_records SET status = ?, completed_at = ? WHERE id = ?",
        [status, status === "completed" ? new Date().toISOString() : null, recordId]
      );
      await loadData();
      setShowUpdateForm(null);
      toast({ title: `Marked as ${status}` });
    } catch (err) {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const completedCount = records.filter(r => r.status === "completed").length;
  const overallPct = records.length > 0 ? Math.round((completedCount / records.length) * 100) : 0;

  const staffCompletion = staff.map(s => {
    const myRecords = records.filter(r => r.staff_id === s.id);
    const done = myRecords.filter(r => r.status === "completed").length;
    return { name: s.full_name || s.name || 'Unknown', total: myRecords.length, completed: done, pct: myRecords.length > 0 ? Math.round((done / myRecords.length) * 100) : 0, avatar: (s.full_name || s.name || '?').charAt(0) };
  }).filter(s => s.total > 0).sort((a, b) => b.pct - a.pct);

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/50 h-[calc(100vh-4rem)] p-4 lg:p-8 font-dmsans flex flex-col">
      <div className="max-w-[1600px] w-full mx-auto flex flex-col h-full space-y-8">
        
        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-primary" /> Learning & Development
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage staff training courses, compliance, and skills development.</p>
          </div>
          <div className="flex gap-3">
            <Button className="bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white rounded-xl shadow-sm gap-2 font-bold" onClick={() => setShowEnrollForm(true)}>
              <Users className="w-4 h-4" /> Enroll Staff
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm gap-2 font-bold" onClick={() => setShowCourseForm(true)}>
              <Plus className="w-4 h-4" /> New Course
            </Button>
          </div>
        </div>

        {/* ── Analytics Stats (Clean, No Card Header) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
          <div className="bg-white dark:bg-slate-900 border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl p-6 shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow">
            <div className="shrink-0 bg-slate-50 dark:bg-slate-800 p-2 rounded-full border border-border/50">
              <ProgressRing pct={overallPct} size={76} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Overall Completion</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-black text-foreground">{completedCount}</p>
                <p className="text-sm font-medium text-muted-foreground">/ {records.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl p-6 shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50 shrink-0">
              <BookOpen className="w-8 h-8 text-indigo-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Courses</p>
              <p className="text-3xl font-black text-foreground mt-1">{courses.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl p-6 shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/50 shrink-0">
              <Award className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mandatory Passed</p>
              <p className="text-3xl font-black text-foreground mt-1">
                {records.filter(r => r.is_mandatory && r.status === "completed").length}
              </p>
            </div>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border-[0.5px] border-black/9 dark:border-white/8 flex flex-col overflow-hidden">
          <Tabs defaultValue="courses" className="flex-1 flex flex-col min-h-0">
            <div className="px-6 pt-4 border-b border-border/50 shrink-0">
              <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl h-auto flex flex-wrap gap-1 max-w-max">
                <TabsTrigger value="courses" className="rounded-lg px-6 py-2 text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-primary data-[state=active]:shadow-sm">Course Library</TabsTrigger>
                <TabsTrigger value="records" className="rounded-lg px-6 py-2 text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-primary data-[state=active]:shadow-sm">Staff Records</TabsTrigger>
                <TabsTrigger value="analytics" className="rounded-lg px-6 py-2 text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-primary data-[state=active]:shadow-sm">Leaderboard</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="courses" className="flex-1 overflow-y-auto custom-scrollbar p-6 m-0 outline-none">
              {courses.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-border/50 shadow-sm">
                    <BookOpen className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">No Courses Yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-sm">Build your learning library by adding the first training course for your staff.</p>
                  <Button onClick={() => setShowCourseForm(true)} className="bg-primary text-white hover:bg-primary/90 font-bold rounded-xl px-8 shadow-sm">Create First Course</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {courses.map(course => (
                    <div key={course.id} className="group bg-slate-50 dark:bg-slate-800/30 border border-border/50 rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 transition-all flex flex-col">
                      <div className="h-32 bg-slate-100 dark:bg-slate-800 p-5 flex flex-col justify-between relative overflow-hidden border-b border-border/50 shrink-0">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none" />
                        <div className="flex justify-between items-start relative z-10">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider bg-white dark:bg-slate-950 text-primary shadow-sm border border-border/50">
                            {course.category}
                          </span>
                          {course.is_mandatory ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 rounded-md border border-rose-200 dark:border-rose-800 shadow-sm">
                              <AlertTriangle className="w-3 h-3" /> Mandatory
                            </span>
                          ) : null}
                        </div>
                        <div className="relative z-10 w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm border border-border/50 mt-4 group-hover:scale-110 transition-transform">
                          <PlayCircle className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col bg-white dark:bg-slate-900">
                        <h3 className="font-bold text-foreground text-lg leading-tight line-clamp-2">{course.title}</h3>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2 font-medium flex-1">{course.description || "No description provided."}</p>
                        
                        <div className="mt-5 pt-4 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                          <span>{records.filter(r => r.course_id === course.id).length} Enrolled</span>
                          <Button variant="link" className="h-auto p-0 text-primary font-bold" onClick={() => { setEnrollForm({ ...enrollForm, course_id: course.id }); setShowEnrollForm(true); }}>Assign</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="records" className="flex-1 overflow-y-auto custom-scrollbar p-6 m-0 outline-none">
              {records.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No enrollments found.</div>
              ) : (
                <div className="space-y-4">
                  {records.map(r => (
                    <div key={r.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-border/50 gap-4 hover:shadow-md hover:border-primary/30 transition-all group">
                      <div className="flex gap-4 items-center">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center font-bold text-sm text-foreground shadow-sm border border-border/50 shrink-0">
                          {r.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground leading-tight">{r.full_name || 'Unknown Staff'}</h4>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{r.course_title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className={cn("px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border border-border/50", STATUS_STYLES[r.status] || STATUS_STYLES.not_started)}>
                          {r.status?.replace("_", " ")}
                        </span>
                        {showUpdateForm === r.id ? (
                          <div className="flex gap-2 bg-white dark:bg-slate-900 p-1 rounded-lg border border-border/50 shadow-sm">
                            <Button size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" onClick={() => updateStatus(r.id, 'completed')}>Complete</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold uppercase tracking-wider" onClick={() => setShowUpdateForm(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-8 font-bold text-xs" onClick={() => setShowUpdateForm(r.id)}>Update Status</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="flex-1 overflow-y-auto custom-scrollbar p-6 m-0 outline-none">
              <div className="bg-slate-50 dark:bg-slate-800/30 border border-border/50 rounded-2xl p-6 shadow-inner">
                <h3 className="font-bold text-foreground text-lg mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" /> Completion Leaderboard
                </h3>
                {staffCompletion.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No completion data available yet.</p>
                ) : (
                  <div className="space-y-4">
                    {staffCompletion.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-5 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border-[0.5px] border-black/9 dark:border-white/8">
                        <div className="w-8 font-black text-xl text-muted-foreground/40 shrink-0 text-right">#{idx + 1}</div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary border border-primary/20 shrink-0">
                          {s.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-end mb-2">
                            <span className="font-bold text-foreground text-sm">{s.name}</span>
                            <span className="text-xs font-bold text-muted-foreground">{s.completed} of {s.total} completed</span>
                          </div>
                          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-border/50">
                            <div className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full" style={{ width: `${s.pct}%` }} />
                          </div>
                        </div>
                        <div className="w-12 text-right font-black text-foreground">{s.pct}%</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

      </div>

      {/* Forms */}
      <Dialog open={showCourseForm} onOpenChange={setShowCourseForm}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold">Create New Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Title *</Label>
              <Input value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} className="bg-slate-50 dark:bg-slate-900 rounded-xl border-none" />
            </div>
            <div>
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Category</Label>
              <Select value={courseForm.category} onValueChange={v => setCourseForm({...courseForm, category: v})}>
                <SelectTrigger className="bg-slate-50 dark:bg-slate-900 rounded-xl border-none"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Description</Label>
              <Textarea value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} className="bg-slate-50 dark:bg-slate-900 rounded-xl border-none resize-none" rows={3} />
            </div>
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl">
              <input type="checkbox" id="mandatory" checked={courseForm.is_mandatory===1} onChange={e => setCourseForm({...courseForm, is_mandatory: e.target.checked?1:0})} className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary" />
              <Label htmlFor="mandatory" className="font-bold text-sm cursor-pointer">Make this a mandatory course</Label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowCourseForm(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button onClick={saveCourse} className="bg-primary text-white rounded-xl font-bold">Save Course</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEnrollForm} onOpenChange={setShowEnrollForm}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold">Enroll Staff</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Select Staff *</Label>
              <Select value={enrollForm.staff_id} onValueChange={v => setEnrollForm({...enrollForm, staff_id: v})}>
                <SelectTrigger className="bg-slate-50 dark:bg-slate-900 rounded-xl border-none"><SelectValue placeholder="Choose employee..."/></SelectTrigger>
                <SelectContent className="rounded-xl max-h-60">
                  {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name || s.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Select Course *</Label>
              <Select value={enrollForm.course_id} onValueChange={v => setEnrollForm({...enrollForm, course_id: v})}>
                <SelectTrigger className="bg-slate-50 dark:bg-slate-900 rounded-xl border-none"><SelectValue placeholder="Choose course..."/></SelectTrigger>
                <SelectContent className="rounded-xl max-h-60">
                  {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Expiry Date (Optional)</Label>
              <Input type="date" value={enrollForm.expiry_date} onChange={e => setEnrollForm({...enrollForm, expiry_date: e.target.value})} className="bg-slate-50 dark:bg-slate-900 rounded-xl border-none" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowEnrollForm(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button onClick={enrollStaff} className="bg-primary text-white rounded-xl font-bold">Enroll</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
