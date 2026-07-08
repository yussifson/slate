import React, { useState, useEffect, useCallback } from "react";
import { powerSync } from "@/api/PowerSyncConnector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Plus, BookOpen, Award, Clock, CheckCircle2, AlertTriangle, Users, GraduationCap, PlayCircle } from "lucide-react";

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
    <div className="relative inline-flex items-center justify-center bg-white dark:bg-slate-800 rounded-full shadow-sm" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={6} className="text-slate-100 dark:text-slate-700" />
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
    const cr = await powerSync.execute("SELECT * FROM hr_training_courses WHERE company_id = ? ORDER BY created_at DESC", [companyId]);
    const rr = await powerSync.execute(
      "SELECT r.*, c.title as course_title, c.category, c.is_mandatory, s.name as full_name FROM hr_training_records r LEFT JOIN hr_training_courses c ON r.course_id = c.id LEFT JOIN univ_hr_employees s ON r.staff_id = s.id WHERE r.company_id = ? ORDER BY r.created_at DESC",
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

  const updateStatus = async (recordId, status) => {
    await powerSync.execute(
      "UPDATE hr_training_records SET status = ?, completed_at = ? WHERE id = ?",
      [status, status === "completed" ? new Date().toISOString() : null, recordId]
    );
    await loadData();
    setShowUpdateForm(null);
    toast({ title: `Marked as ${status}` });
  };

  const completedCount = records.filter(r => r.status === "completed").length;
  const overallPct = records.length > 0 ? Math.round((completedCount / records.length) * 100) : 0;

  const staffCompletion = staff.map(s => {
    const myRecords = records.filter(r => r.staff_id === s.id);
    const done = myRecords.filter(r => r.status === "completed").length;
    return { name: s.full_name, total: myRecords.length, completed: done, pct: myRecords.length > 0 ? Math.round((done / myRecords.length) * 100) : 0, avatar: s.full_name?.charAt(0) || '?' };
  }).filter(s => s.total > 0).sort((a, b) => b.pct - a.pct);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-dmsans">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Training & Learning Hub</h2>
              <p className="text-blue-100 mt-1 opacity-90">{courses.length} Active Courses · {records.length} Total Enrollments</p>
            </div>
            {isAdmin && (
              <div className="flex gap-3">
                <Button className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md rounded-xl" onClick={() => setShowEnrollForm(true)}>
                  <Users className="w-4 h-4 mr-2" /> Enroll Staff
                </Button>
                <Button className="bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-bold shadow-sm" onClick={() => setShowCourseForm(true)}>
                  <Plus className="w-4 h-4 mr-2" /> New Course
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 flex items-center gap-5">
              <ProgressRing pct={overallPct} size={72} />
              <div>
                <p className="text-sm font-medium text-blue-100 uppercase tracking-wider">Overall Completion</p>
                <p className="text-2xl font-bold mt-0.5">{completedCount} of {records.length}</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-blue-500/30 flex items-center justify-center border border-blue-400/30">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-100 uppercase tracking-wider">Courses Available</p>
                <p className="text-2xl font-bold mt-0.5">{courses.length}</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-blue-500/30 flex items-center justify-center border border-blue-400/30">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-100 uppercase tracking-wider">Top Learner</p>
                <p className="text-lg font-bold mt-0.5 line-clamp-1">{staffCompletion.length > 0 ? staffCompletion[0].name : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Tabs ── */}
      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="bg-muted p-1 rounded-xl mb-6">
          <TabsTrigger value="courses" className="rounded-lg font-semibold px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Courses</TabsTrigger>
          <TabsTrigger value="enrollments" className="rounded-lg font-semibold px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Enrollments</TabsTrigger>
          <TabsTrigger value="leaderboard" className="rounded-lg font-semibold px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Leaderboard</TabsTrigger>
        </TabsList>

        {/* ── Courses Tab ── */}
        <TabsContent value="courses">
          {courses.length === 0 ? (
            <div className="py-20 text-center bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8">
              <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg font-bold text-foreground">No Courses Found</p>
              <p className="text-muted-foreground mt-1">Create your first training module to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(c => (
                <div key={c.id} className="group bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                  <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-bold tracking-wider text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/40 px-2.5 py-1 rounded-full uppercase">{c.category}</span>
                      {c.is_mandatory === 1 && (
                        <span className="text-[10px] font-bold tracking-wider text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/40 px-2.5 py-1 rounded-full uppercase flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Mandatory</span>
                      )}
                    </div>
                    <h3 className="font-bold text-xl text-foreground mb-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{c.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">{c.description || "No description provided."}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground font-medium pt-4 border-t border-border/50">
                      <span className="flex items-center gap-1.5"><Users className="w-4 h-4"/> {records.filter(r => r.course_id === c.id).length} Enrolled</span>
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="w-4 h-4"/> {records.filter(r => r.course_id === c.id && r.status === "completed").length} Done</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Enrollments Tab ── */}
        <TabsContent value="enrollments">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {records.map(r => (
              <div key={r.id} className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 shadow-sm flex flex-col overflow-hidden">
                <div className="p-5 flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary font-bold">
                      {r.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm leading-tight">{r.full_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <h4 className="font-bold text-base text-foreground mb-3">{r.course_title}</h4>
                  
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Status</p>
                    <select
                      value={r.status}
                      onChange={e => updateStatus(r.id, e.target.value)}
                      className={`w-full appearance-none px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer border-none outline-none focus:ring-2 focus:ring-primary/20 ${STATUS_STYLES[r.status] || STATUS_STYLES['not_started']}`}
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                </div>
                {r.status !== 'completed' && r.status !== 'expired' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 mt-auto border-t border-border/50">
                    <Button onClick={() => updateStatus(r.id, 'completed')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9">
                      <CheckCircle2 className="w-4 h-4 mr-2"/> Mark Completed
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── Leaderboard Tab ── */}
        <TabsContent value="leaderboard">
          <div className="bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border/50 flex items-center gap-3">
              <Award className="w-6 h-6 text-amber-500" />
              <h3 className="text-lg font-bold">Top Learners</h3>
            </div>
            <div className="divide-y divide-border/50">
              {staffCompletion.map((s, idx) => (
                <div key={idx} className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                  <div className="w-8 text-center font-bold text-muted-foreground">#{idx + 1}</div>
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
                    {s.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.completed} of {s.total} courses completed</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{s.pct}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── New Course Dialog ── */}
      <Dialog open={showCourseForm} onOpenChange={setShowCourseForm}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</label>
              <Input value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} className="mt-1" placeholder="e.g. Data Privacy 101" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
              <Textarea value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} className="mt-1 h-24" placeholder="Course overview..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
              <Select value={courseForm.category} onValueChange={v => setCourseForm({ ...courseForm, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="mandatory" checked={courseForm.is_mandatory === 1} onChange={e => setCourseForm({ ...courseForm, is_mandatory: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600" />
              <label htmlFor="mandatory" className="text-sm font-semibold text-foreground cursor-pointer">This course is mandatory</label>
            </div>
            <Button onClick={saveCourse} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl mt-2">Create Course</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Enroll Dialog ── */}
      <Dialog open={showEnrollForm} onOpenChange={setShowEnrollForm}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Enroll Staff</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Staff Member</label>
              <Select value={enrollForm.staff_id} onValueChange={v => setEnrollForm({ ...enrollForm, staff_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select staff..." /></SelectTrigger>
                <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Course</label>
              <Select value={enrollForm.course_id} onValueChange={v => setEnrollForm({ ...enrollForm, course_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select course..." /></SelectTrigger>
                <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deadline (Optional)</label>
              <Input type="date" value={enrollForm.expiry_date} onChange={e => setEnrollForm({ ...enrollForm, expiry_date: e.target.value })} className="mt-1" />
            </div>
            <Button onClick={enrollStaff} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl mt-2">Enroll Staff</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
