import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, MessageSquareWarning, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const CATEGORIES = ["workplace_conduct", "harassment", "discrimination", "salary", "workload", "management", "safety", "other"];
const CATEGORY_LABELS = { workplace_conduct: "Workplace Conduct", harassment: "Harassment", discrimination: "Discrimination", salary: "Salary", workload: "Workload", management: "Management", safety: "Safety", other: "Other" };
const STATUS_COLORS = { open: "bg-red-100 text-red-700", under_review: "bg-amber-100 text-amber-700", resolved: "bg-emerald-100 text-emerald-700", dismissed: "bg-slate-100 text-slate-600" };
const PRIORITY_COLORS = { low: "bg-slate-100 text-slate-600", medium: "bg-amber-100 text-amber-700", high: "bg-red-100 text-red-700" };

export default function HRComplaintsPanel({ companyId, complaints = [], staff, isAdmin, user }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState(null);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.HRComplaint.create({ ...data, company_id: companyId, staff_email: data.is_anonymous ? "anonymous" : user?.email, staff_name: data.is_anonymous ? "Anonymous" : user?.full_name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["complaints", companyId] }); setShowForm(false); }});

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HRComplaint.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["complaints", companyId] }); setViewing(null); }});

  const visible = isAdmin ? complaints : complaints.filter(c => c.staff_email === user?.email);

  const openCount = visible.filter(c => c.status === "open").length;
  const underReviewCount = visible.filter(c => c.status === "under_review").length;
  const resolvedCount = visible.filter(c => c.status === "resolved").length;

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden font-sans pb-24">
      {/* ── Native Header ── */}
      <div className="flex items-center justify-between gap-3 min-w-0 border-b pb-4 border-border/80">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">{t("complaints", "Complaints & Grievances")}</h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">Confidential reporting, internal disputes, and resolution status</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm" className="h-9 px-3 sm:px-4 text-xs font-bold bg-[#005A9C] hover:bg-[#00477D] text-white rounded-xl shadow-xs gap-1.5 shrink-0 active:scale-95 transition-all">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">{t("file_complaint", "File Complaint")}</span><span className="sm:hidden">File</span>
        </Button>
      </div>

      {/* ── 2x2 Modern Mobile Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Reports</div>
          <div className="text-lg sm:text-2xl font-black mt-0.5 text-foreground">{visible.length}</div>
        </div>
        <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Open</div>
          <div className="text-lg sm:text-2xl font-black mt-0.5 text-rose-600">{openCount}</div>
        </div>
        <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">In Review</div>
          <div className="text-lg sm:text-2xl font-black mt-0.5 text-amber-600">{underReviewCount}</div>
        </div>
        <div className="p-3 sm:p-4 rounded-[20px] border border-border/80 bg-card text-card-foreground shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Resolved</div>
          <div className="text-lg sm:text-2xl font-black mt-0.5 text-emerald-600">{resolvedCount}</div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="bg-card border border-border/80 rounded-2xl p-10 text-center shadow-xs">
          <MessageSquareWarning className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">{t("no_complaints_filed", "No complaints filed")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map(c => (
            <div 
              key={c.id} 
              className="bg-card border border-border/80 rounded-[20px] p-4 shadow-xs hover:border-primary/40 transition-all cursor-pointer space-y-2.5" 
              onClick={() => setViewing(c)}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-xs text-foreground truncate">{c.subject}</h3>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge className={cn("text-[9px] h-4 px-1.5", STATUS_COLORS[c.status])}>{c.status?.replace("_", " ")}</Badge>
                  <Badge className={cn("text-[9px] h-4 px-1.5", PRIORITY_COLORS[c.priority])}>{c.priority}</Badge>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2">{c.description || "No description provided."}</p>
              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{CATEGORY_LABELS[c.category] || c.category}</span>
                <span>{c.is_anonymous ? "Anonymous" : c.staff_name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <ComplaintFormDialog onClose={() => setShowForm(false)} onSubmit={(d) => createMutation.mutate(d)} staff={staff} />
      )}
      {viewing && (
        <ComplaintViewDialog complaint={viewing} onClose={() => setViewing(null)} isAdmin={isAdmin} onUpdate={(data) => updateMutation.mutate({ id: viewing.id, data })} reviewerEmail={user?.email} />
      )}
    </div>
  );
}

function ComplaintFormDialog({ onClose, onSubmit, staff }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ subject: "", description: "", category: "other", priority: "medium", against_email: "", against_name: "", is_anonymous: false });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card text-card-foreground rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("file_complaint", "File a Complaint")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-3.5 py-2">
          <div>
            <Label className="text-xs font-semibold">{t("subject", "Subject *")}</Label>
            <Input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="mt-1 h-9 rounded-xl text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">{t("category", "Category")}</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1 h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-xs">{CATEGORY_LABELS[c]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">{t("priority", "Priority")}</Label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger className="mt-1 h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" className="text-xs">Low</SelectItem>
                  <SelectItem value="medium" className="text-xs">Medium</SelectItem>
                  <SelectItem value="high" className="text-xs">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold">{t("description", "Details *")}</Label>
            <Textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1 rounded-xl text-xs resize-none" />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="anon" checked={form.is_anonymous} onChange={e => setForm({ ...form, is_anonymous: e.target.checked })} className="rounded" />
            <label htmlFor="anon" className="text-xs font-medium cursor-pointer">{t("submit_anonymously", "Submit Anonymously")}</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">Cancel</Button>
            <Button type="submit" size="sm" className="bg-[#005A9C] hover:bg-[#00477D] text-white rounded-xl text-xs font-bold">Submit</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ComplaintViewDialog({ complaint, onClose, isAdmin, onUpdate, reviewerEmail }) {
  const [resolution, setResolution] = useState(complaint.resolution_notes || "");
  const [status, setStatus] = useState(complaint.status || "open");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card text-card-foreground rounded-2xl">
        <DialogHeader>
          <DialogTitle>{complaint.subject}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2 text-xs">
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground font-semibold">Category:</span>
              <span className="font-bold">{CATEGORY_LABELS[complaint.category] || complaint.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-semibold">Filed by:</span>
              <span className="font-bold">{complaint.is_anonymous ? "Anonymous" : complaint.staff_name}</span>
            </div>
          </div>
          <p className="text-foreground leading-relaxed p-1">{complaint.description}</p>
          {isAdmin && (
            <div className="space-y-2 pt-2 border-t border-border">
              <Label className="text-xs font-semibold">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open" className="text-xs">Open</SelectItem>
                  <SelectItem value="under_review" className="text-xs">Under Review</SelectItem>
                  <SelectItem value="resolved" className="text-xs">Resolved</SelectItem>
                  <SelectItem value="dismissed" className="text-xs">Dismissed</SelectItem>
                </SelectContent>
              </Select>
              <Label className="text-xs font-semibold">Resolution Notes</Label>
              <Textarea value={resolution} onChange={e => setResolution(e.target.value)} rows={2} className="rounded-xl text-xs resize-none" />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">Close</Button>
            {isAdmin && (
              <Button size="sm" onClick={() => onUpdate({ status, resolution_notes: resolution, resolved_date: status === "resolved" ? new Date().toISOString() : null, reviewer_email: reviewerEmail })} className="bg-[#005A9C] hover:bg-[#00477D] text-white rounded-xl text-xs font-bold">
                Save
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
