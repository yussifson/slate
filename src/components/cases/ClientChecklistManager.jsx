import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, CheckCircle2, Clock, Square, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_ICONS = {
  pending: Square,
  in_progress: Clock,
  completed: CheckCircle2,
  waived: AlertCircle,
};

const STATUS_COLORS = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-orange-100 text-orange-700",
  completed: "bg-slate-100 text-primary/90",
  waived: "bg-amber-100 text-amber-700",
};

const DEFAULT_TEMPLATES = [
  "Provide valid government-issued ID",
  "Submit signed retainer agreement",
  "Provide proof of address",
  "Complete KYC form",
  "Submit supporting evidence documents",
  "Review and sign fee agreement",
];

export default function ClientChecklistManager({ caseData, client, user }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", due_date: "" });

  const { data: items = [] } = useQuery({
    queryKey: ["checklist-case", caseData?.id],
    queryFn: () => base44.entities.ClientChecklist.filter({ case_id: caseData?.id }),
    enabled: !!caseData?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientChecklist.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-case", caseData?.id] });
      setForm({ title: "", description: "", due_date: "" });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ClientChecklist.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["checklist-case", caseData?.id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ClientChecklist.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["checklist-case", caseData?.id] }),
  });

  const handleCreate = () => {
    if (!form.title.trim()) return;
    createMutation.mutate({
      company_id: caseData.company_id,
      client_id: client?.id,
      client_name: client?.name,
      client_email: client?.email,
      case_id: caseData.id,
      case_title: caseData.title,
      assigned_by: user?.email,
      assigned_by_name: user?.full_name,
      title: form.title,
      description: form.description,
      due_date: form.due_date || undefined,
      status: "pending",
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{t("client_checklist", "Client Checklist")}</p>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowForm(true)}>
          <Plus className="w-3 h-3" /> {t("add_item", "Add Item")}
        </Button>
      </div>
      {items.length === 0 ? (
        <div className="bg-muted/40 rounded-lg p-4 text-center text-xs text-muted-foreground">
          {t(
            "no_checklist_items_yet_add_ite",
            "No checklist items yet. Add items to request documents or actions from the client."
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const Icon = STATUS_ICONS[item.status] || Square;
            return (
              <div key={item.id} className="bg-card border border-border rounded-lg px-3 py-2.5 flex items-start gap-2.5">
                <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", item.status === "completed" ? "text-primary" : "text-muted-foreground")} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", item.status === "completed" && "line-through text-muted-foreground")}>{item.title}</p>
                  {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={cn("text-[10px]", STATUS_COLORS[item.status])}>{item.status}</Badge>
                    {item.due_date && <span className="text-[10px] text-muted-foreground">{t("due", "Due")} {format(new Date(item.due_date), "MMM d")}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Select value={item.status} onValueChange={(val) => updateMutation.mutate({ id: item.id, status: val })}>
                    <SelectTrigger className="h-6 text-[11px] w-24 px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{t("pending", "Pending")}</SelectItem>
                      <SelectItem value="in_progress">{t("in_progress", "In Progress")}</SelectItem>
                      <SelectItem value="completed">{t("completed", "Completed")}</SelectItem>
                      <SelectItem value="waived">{t("waived", "Waived")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("add_checklist_item", "Add Checklist Item")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Quick templates */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">{t("quick_templates", "Quick templates")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_TEMPLATES.map(item => {
                  return (
                    <button
                      key={item}
                      onClick={() => setForm(f => ({ ...f, title: t }))}
                      className="text-[11px] px-2 py-1 rounded-full border border-border bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">{t("title", "Title *")}</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Submit national ID document" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">{t("description", "Description")}</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Additional instructions for the client..." className="h-20" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">{t("due_date", "Due Date")}</Label>
              <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>{t("cancel", "Cancel")}</Button>
              <Button size="sm" onClick={handleCreate} disabled={!form.title.trim() || createMutation.isPending}>
                {t("add_item", "Add Item")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}