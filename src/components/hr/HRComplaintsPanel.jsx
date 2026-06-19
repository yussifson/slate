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
import { Plus, MessageSquareWarning } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const CATEGORIES = ["workplace_conduct", "harassment", "discrimination", "salary", "workload", "management", "safety", "other"];
const CATEGORY_LABELS = { workplace_conduct: "Workplace Conduct", harassment: "Harassment", discrimination: "Discrimination", salary: "Salary", workload: "Workload", management: "Management", safety: "Safety", other: "Other" };
const STATUS_COLORS = { open: "bg-red-100 text-red-700", under_review: "bg-amber-100 text-amber-700", resolved: "bg-slate-100 text-primary/90", dismissed: "bg-slate-100 text-slate-600" };
const PRIORITY_COLORS = { low: "bg-slate-100 text-slate-600", medium: "bg-amber-100 text-amber-700", high: "bg-red-100 text-red-700" };

export default function HRComplaintsPanel({ companyId, complaints, staff, isAdmin, user }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState(null);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.HRComplaint.create({ ...data, company_id: companyId, staff_email: data.is_anonymous ? "anonymous" : user.email, staff_name: data.is_anonymous ? "Anonymous" : user.full_name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["complaints", companyId] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HRComplaint.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["complaints", companyId] }); setViewing(null); },
  });

  const visible = isAdmin ? complaints : complaints.filter(c => c.staff_email === user?.email);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> {t("file_complaint", "File Complaint")}</Button>
      </div>
      {visible.length === 0 ? (
        <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl p-10 text-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <MessageSquareWarning className="w-10 h-10 text-[#71717a] dark:text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-[#71717a] dark:text-gray-400">{t("no_complaints_filed", "No complaints filed")}</p>
        </div>
      ) : (
        <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl divide-y divide-border hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          {visible.map(c => {
            return (
              <div key={c.id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/20 cursor-pointer" onClick={() => setViewing(c)}>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-sm font-medium">{c.subject}</span>
                    <Badge className={cn("text-[9px] h-4 px-1.5", STATUS_COLORS[c.status])}>{c.status?.replace("_", " ")}</Badge>
                    <Badge className={cn("text-[9px] h-4 px-1.5", PRIORITY_COLORS[c.priority])}>{c.priority}</Badge>
                  </div>
                  <p className="text-xs text-[#71717a] dark:text-gray-400 mt-0.5 tracking-[0.04em]">
                    {CATEGORY_LABELS[c.category] || c.category} · {c.is_anonymous ? "Anonymous" : c.staff_name}
                    {c.created_date ? ` · ${format(new Date(c.created_date), "MMM d, yyyy")}` : ""}
                  </p>
                </div>
              </div>
            );
          })}
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
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{t("file_a_complaint", "File a Complaint")}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label>{t("subject", "Subject *")}</Label><Input value={form.subject} onChange={e => set("subject", e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("category", "Category")}</Label>
              <Select value={form.category} onValueChange={v => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => {
                  return <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>;
                })}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("priority", "Priority")}</Label>
              <Select value={form.priority} onValueChange={v => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("low", "Low")}</SelectItem>
                  <SelectItem value="medium">{t("medium", "Medium")}</SelectItem>
                  <SelectItem value="high">{t("high", "High")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>{t("description", "Description *")}</Label><Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} required /></div>
          <div>
            <Label>{t("against_optional", "Against (optional)")}</Label>
            <Select value={form.against_email || "none"} onValueChange={v => { if (v === "none") { set("against_email", ""); set("against_name", ""); } else { const s = staff.find(s => s.user_email === v); set("against_email", v); set("against_name", s?.full_name || ""); } }}>
              <SelectTrigger><SelectValue placeholder="Select person (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("none", "None")}</SelectItem>
                {staff.map(s => {
                  return <SelectItem key={s.user_email} value={s.user_email}>{s.full_name}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="anon" checked={form.is_anonymous} onChange={e => set("is_anonymous", e.target.checked)} className="rounded-md" />
            <Label htmlFor="anon" className="font-normal cursor-pointer">{t("submit_anonymously", "Submit anonymously")}</Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>{t("cancel", "Cancel")}</Button>
            <Button type="submit">{t("submit_complaint", "Submit Complaint")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ComplaintViewDialog({ complaint, onClose, isAdmin, onUpdate, reviewerEmail }) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState(complaint.resolution_notes || "");
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{complaint.subject}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Badge className={cn("text-[10px]", STATUS_COLORS[complaint.status])}>{complaint.status?.replace("_", " ")}</Badge>
            <Badge className={cn("text-[10px]", PRIORITY_COLORS[complaint.priority])}>{complaint.priority}</Badge>
            <Badge variant="outline" className="text-[10px]">{CATEGORY_LABELS[complaint.category]}</Badge>
          </div>
          <p className="text-sm">{complaint.description}</p>
          {complaint.against_name && <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("filed_against", "Filed against:")} <strong>{complaint.against_name}</strong></p>}
          {complaint.created_date && <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("filed", "Filed:")} {format(new Date(complaint.created_date), "MMM d, yyyy")}</p>}
          {isAdmin && (
            <div className="space-y-2 pt-2 border-t border-primary/40">
              <Label>{t("resolution_notes", "Resolution Notes")}</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => onUpdate({ status: "under_review" })}>{t("under_review", "Under Review")}</Button>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => onUpdate({ status: "resolved", resolution_notes: notes, resolved_by: reviewerEmail, resolved_at: new Date().toISOString() })}>{t("resolve", "Resolve")}</Button>
                <Button size="sm" variant="outline" onClick={() => onUpdate({ status: "dismissed", resolution_notes: notes })}>{t("dismiss", "Dismiss")}</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}