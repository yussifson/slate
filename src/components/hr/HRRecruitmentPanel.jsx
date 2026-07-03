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
import {
  Plus, Briefcase, Users, MapPin, Search, GripVertical, Star,
  Phone, Mail, FileText, ChevronRight, Trophy, Clock, CheckCircle
} from "lucide-react";

const STAGES = [
  { key: "applied",   label: "Applied",   color: "bg-blue-50 border-blue-200 text-blue-700",   header: "from-blue-500 to-blue-600" },
  { key: "screened",  label: "Screened",  color: "bg-purple-50 border-purple-200 text-purple-700", header: "from-purple-500 to-purple-600" },
  { key: "interview", label: "Interview", color: "bg-amber-50 border-amber-200 text-amber-700", header: "from-amber-500 to-amber-600" },
  { key: "offer",     label: "Offer",     color: "bg-orange-50 border-orange-200 text-orange-700", header: "from-orange-500 to-orange-600" },
  { key: "hired",     label: "Hired",     color: "bg-green-50 border-green-200 text-green-700",  header: "from-green-500 to-green-600" },
];

const STATUS_COLORS = {
  open:   "bg-green-100 text-green-700",
  closed: "bg-slate-100 text-slate-600",
  draft:  "bg-amber-100 text-amber-700",
};

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Remote"];

function ScoreBadge({ score }) {
  if (score == null) return <span className="text-xs text-muted-foreground">—</span>;
  const color = score >= 75 ? "bg-green-100 text-green-700" : score >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{score}</span>;
}

function ApplicantCard({ applicant, onClick, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, applicant)}
      onClick={() => onClick(applicant)}
      className="bg-white dark:bg-card border border-border rounded-xl p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-150 space-y-2"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {applicant.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">{applicant.name}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[120px]">{applicant.job_title || "No Job"}</p>
          </div>
        </div>
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 text-amber-400" />
          <span className="text-xs text-muted-foreground">AI:</span>
          <ScoreBadge score={applicant.ai_score} />
        </div>
        <div className="flex items-center gap-1">
          <Trophy className="w-3 h-3 text-blue-400" />
          <span className="text-xs text-muted-foreground">Score:</span>
          <ScoreBadge score={applicant.interview_score} />
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ stage, applicants, onCardClick, onDragStart, onDragOver, onDrop }) {
  const [isDragOver, setIsDragOver] = useState(false);
  return (
    <div
      className="flex-1 min-w-[200px] max-w-[260px]"
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); onDragOver(e, stage.key); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { setIsDragOver(false); onDrop(e, stage.key); }}
    >
      <div className={`rounded-xl border-2 transition-all duration-200 ${isDragOver ? "border-dashed border-violet-400 bg-violet-50/50 dark:bg-violet-900/10 scale-[1.01]" : "border-transparent"}`}>
        <div className={`bg-gradient-to-r ${stage.header} rounded-t-xl px-3 py-2.5 flex items-center justify-between`}>
          <span className="text-white text-sm font-semibold">{stage.label}</span>
          <span className="bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full">{applicants.length}</span>
        </div>
        <div className="bg-slate-50 dark:bg-muted/20 rounded-b-xl p-2 space-y-2 min-h-[300px]">
          {applicants.map(a => (
            <ApplicantCard key={a.id} applicant={a} onClick={onCardClick} onDragStart={onDragStart} />
          ))}
          {applicants.length === 0 && (
            <div className="flex items-center justify-center h-24 text-xs text-muted-foreground/50 border-2 border-dashed border-muted rounded-xl">
              Drop here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HRRecruitmentPanel({ companyId, isAdmin, staff = [] }) {
  const { toast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showApplicantForm, setShowApplicantForm] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [draggedApplicant, setDraggedApplicant] = useState(null);
  const [search, setSearch] = useState("");
  const [filterJob, setFilterJob] = useState("all");

  const [jobForm, setJobForm] = useState({ title: "", department: "", location: "", type: "Full-time", status: "open", description: "", requirements: "" });
  const [appForm, setAppForm] = useState({ name: "", email: "", phone: "", job_id: "", stage: "applied", notes: "" });

  const loadData = useCallback(async () => {
    if (!companyId) return;
    const jr = await powerSync.execute("SELECT * FROM hr_jobs WHERE company_id = ? ORDER BY created_at DESC", [companyId]);
    const ar = await powerSync.execute("SELECT a.*, j.title as job_title FROM hr_applicants a LEFT JOIN hr_jobs j ON a.job_id = j.id WHERE a.company_id = ? ORDER BY a.created_at DESC", [companyId]);
    setJobs(jr.rows?._array || []);
    setApplicants(ar.rows?._array || []);
  }, [companyId]);

  useEffect(() => {
    loadData();
    if (!companyId) return;
    const unsub = powerSync.watch("SELECT * FROM hr_jobs WHERE company_id = ?", [companyId], { onResult: loadData });
    return () => unsub?.();
  }, [companyId, loadData]);

  const saveJob = async () => {
    if (!jobForm.title) return toast({ title: "Job title is required", variant: "destructive" });
    await powerSync.execute(
      "INSERT INTO hr_jobs (id, created_at, company_id, title, department, location, type, status, description, requirements) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [crypto.randomUUID(), new Date().toISOString(), companyId, jobForm.title, jobForm.department, jobForm.location, jobForm.type, jobForm.status, jobForm.description, jobForm.requirements]
    );
    await loadData();
    setShowJobForm(false);
    setJobForm({ title: "", department: "", location: "", type: "Full-time", status: "open", description: "", requirements: "" });
    toast({ title: "Job posted successfully" });
  };

  const saveApplicant = async () => {
    if (!appForm.name || !appForm.job_id) return toast({ title: "Name and job are required", variant: "destructive" });
    await powerSync.execute(
      "INSERT INTO hr_applicants (id, created_at, company_id, job_id, name, email, phone, stage, notes) VALUES (?,?,?,?,?,?,?,?,?)",
      [crypto.randomUUID(), new Date().toISOString(), companyId, appForm.job_id, appForm.name, appForm.email, appForm.phone, appForm.stage, appForm.notes]
    );
    await loadData();
    setShowApplicantForm(false);
    setAppForm({ name: "", email: "", phone: "", job_id: "", stage: "applied", notes: "" });
    toast({ title: "Applicant added" });
  };

  const updateApplicantStage = async (applicantId, newStage) => {
    await powerSync.execute("UPDATE hr_applicants SET stage = ? WHERE id = ?", [newStage, applicantId]);
    await loadData();
  };

  const updateApplicantDetails = async () => {
    await powerSync.execute(
      "UPDATE hr_applicants SET notes = ?, interview_score = ?, stage = ? WHERE id = ?",
      [selectedApplicant.notes, selectedApplicant.interview_score, selectedApplicant.stage, selectedApplicant.id]
    );
    await loadData();
    setSelectedApplicant(null);
    toast({ title: "Applicant updated" });
  };

  const onDragStart = (e, applicant) => {
    setDraggedApplicant(applicant);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e) => e.preventDefault();
  const onDrop = async (e, newStage) => {
    e.preventDefault();
    if (draggedApplicant && draggedApplicant.stage !== newStage) {
      await updateApplicantStage(draggedApplicant.id, newStage);
      toast({ title: `Moved ${draggedApplicant.name} to ${newStage}` });
    }
    setDraggedApplicant(null);
  };

  const filteredApplicants = applicants.filter(a => {
    const matchSearch = !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase());
    const matchJob = filterJob === "all" || a.job_id === filterJob;
    return matchSearch && matchJob;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Recruitment Pipeline</h2>
            <p className="text-violet-200 text-sm">{jobs.filter(j => j.status === "open").length} open positions · {applicants.length} total applicants</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30" onClick={() => setShowApplicantForm(true)}>
                <Users className="w-4 h-4 mr-1" /> Add Applicant
              </Button>
              <Button size="sm" className="bg-white text-violet-700 hover:bg-white/90" onClick={() => setShowJobForm(true)}>
                <Plus className="w-4 h-4 mr-1" /> Post Job
              </Button>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="pipeline">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="pipeline" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="w-4 h-4 mr-1.5" /> Applicants Pipeline
          </TabsTrigger>
          <TabsTrigger value="jobs" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Briefcase className="w-4 h-4 mr-1.5" /> Job Postings ({jobs.length})
          </TabsTrigger>
        </TabsList>

        {/* PIPELINE */}
        <TabsContent value="pipeline" className="mt-4">
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search applicants..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterJob} onValueChange={setFilterJob}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {STAGES.map(stage => (
              <KanbanColumn
                key={stage.key}
                stage={stage}
                applicants={filteredApplicants.filter(a => a.stage === stage.key)}
                onCardClick={setSelectedApplicant}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
              />
            ))}
          </div>
        </TabsContent>

        {/* JOBS */}
        <TabsContent value="jobs" className="mt-4">
          {jobs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No job postings yet</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Title</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Department</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Location</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Applicants</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job, i) => {
                    const count = applicants.filter(a => a.job_id === job.id).length;
                    return (
                      <tr key={job.id} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                        <td className="px-4 py-3 font-medium text-foreground">{job.title}</td>
                        <td className="px-4 py-3 text-muted-foreground">{job.department || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{job.type}</td>
                        <td className="px-4 py-3">
                          <Badge className={STATUS_COLORS[job.status] || "bg-slate-100 text-slate-600"}>{job.status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 font-bold text-violet-600"><Users className="w-3.5 h-3.5" />{count}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Post Job Dialog */}
      <Dialog open={showJobForm} onOpenChange={setShowJobForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Post New Job</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Job Title *</Label><Input placeholder="e.g. Senior Developer" value={jobForm.title} onChange={e => setJobForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><Label>Department</Label><Input placeholder="Engineering" value={jobForm.department} onChange={e => setJobForm(f => ({ ...f, department: e.target.value }))} /></div>
              <div><Label>Location</Label><Input placeholder="Accra, Ghana" value={jobForm.location} onChange={e => setJobForm(f => ({ ...f, location: e.target.value }))} /></div>
              <div>
                <Label>Job Type</Label>
                <Select value={jobForm.type} onValueChange={v => setJobForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{JOB_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={jobForm.status} onValueChange={v => setJobForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Description</Label><Textarea placeholder="Job description..." value={jobForm.description} onChange={e => setJobForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
              <div className="col-span-2"><Label>Requirements</Label><Textarea placeholder="Required skills, experience..." value={jobForm.requirements} onChange={e => setJobForm(f => ({ ...f, requirements: e.target.value }))} rows={3} /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowJobForm(false)}>Cancel</Button>
              <Button onClick={saveJob}>Post Job</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Applicant Dialog */}
      <Dialog open={showApplicantForm} onOpenChange={setShowApplicantForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Applicant</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Full Name *</Label><Input placeholder="John Mensah" value={appForm.name} onChange={e => setAppForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>Email</Label><Input placeholder="john@example.com" value={appForm.email} onChange={e => setAppForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input placeholder="+233..." value={appForm.phone} onChange={e => setAppForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div>
                <Label>Applying for *</Label>
                <Select value={appForm.job_id} onValueChange={v => setAppForm(f => ({ ...f, job_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select job" /></SelectTrigger>
                  <SelectContent>{jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Initial Stage</Label>
                <Select value={appForm.stage} onValueChange={v => setAppForm(f => ({ ...f, stage: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Notes</Label><Textarea placeholder="Initial notes about this applicant..." value={appForm.notes} onChange={e => setAppForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowApplicantForm(false)}>Cancel</Button>
              <Button onClick={saveApplicant}>Add Applicant</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Applicant Detail Dialog */}
      {selectedApplicant && (
        <Dialog open={!!selectedApplicant} onOpenChange={() => setSelectedApplicant(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-bold">
                  {selectedApplicant.name?.[0]?.toUpperCase()}
                </div>
                {selectedApplicant.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedApplicant.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" />{selectedApplicant.email}</div>}
                {selectedApplicant.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" />{selectedApplicant.phone}</div>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Stage</Label>
                  <Select value={selectedApplicant.stage} onValueChange={v => setSelectedApplicant(a => ({ ...a, stage: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Interview Score (0–100)</Label>
                  <Input type="number" min={0} max={100} value={selectedApplicant.interview_score || ""} onChange={e => setSelectedApplicant(a => ({ ...a, interview_score: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea rows={3} value={selectedApplicant.notes || ""} onChange={e => setSelectedApplicant(a => ({ ...a, notes: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedApplicant(null)}>Cancel</Button>
                <Button onClick={updateApplicantDetails}>Save Changes</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
