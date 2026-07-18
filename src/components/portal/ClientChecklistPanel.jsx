import { useTranslation } from "react-i18next";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckSquare, Square, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  pending: { icon: Square, color: "text-[#71717a] dark:text-gray-400", badge: "bg-muted text-[#71717a] dark:text-gray-400" },
  in_progress: { icon: Clock, color: "text-primary", badge: "bg-orange-100 text-orange-700" },
  completed: { icon: CheckCircle2, color: "text-primary", badge: "bg-slate-100 text-primary/90" },
  waived: { icon: AlertCircle, color: "text-amber-500", badge: "bg-amber-100 text-amber-700" }};

export default function ClientChecklistPanel({ clientId }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["client-checklist", clientId],
    queryFn: () => base44.entities.ClientChecklist.filter({ client_id: clientId }),
    enabled: !!clientId});

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ClientChecklist.update(id, {
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["client-checklist", clientId] })});

  const pending = items.filter(i => i.status !== "completed" && i.status !== "waived");
  const done = items.filter(i => i.status === "completed" || i.status === "waived");

  if (isLoading) return <div className="p-6 text-center text-sm text-[#71717a] dark:text-gray-400">{t("loading_checklist", "Loading checklist...")}</div>;

  if (items.length === 0) {
    return (
      <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-10 text-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <CheckSquare className="w-8 h-8 text-[#71717a] dark:text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-[#71717a] dark:text-gray-400">{t("no_checklist_items_assigned_ye", "No checklist items assigned yet")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold">{t("your_action_items", "Your Action Items")}</p>
          <span className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{done.length}/{items.length} {t("completed", "completed")}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${items.length ? (done.length / items.length) * 100 : 0}%` }}
          />
        </div>
      </div>
      {/* Pending items */}
      {pending.length > 0 && (
        <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="px-4 py-3 border-b border-primary/40">
            <p className="text-sm font-semibold">{t("pending", "Pending (")}{pending.length})</p>
          </div>
          <div className="divide-y divide-border">
            {pending.map(item => {
              const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <div key={item.id} className="px-4 py-3 flex items-start gap-3">
                  <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", cfg.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.title}</p>
                    {item.description && <p className="text-xs text-[#71717a] dark:text-gray-400 mt-0.5 tracking-[0.04em]">{item.description}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {item.case_title && <span className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{item.case_title}</span>}
                      {item.due_date && (
                        <span className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">
                          {t("due", "Due")} {format(new Date(item.due_date), "MMM d, yyyy")}
                        </span>
                      )}
                      <Badge className={cn("text-[10px]", cfg.badge)}>{item.status}</Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs shrink-0 tracking-[0.04em]"
                    onClick={() => updateMutation.mutate({ id: item.id, status: "completed" })}
                    disabled={updateMutation.isPending}
                  >
                    {t("mark_done", "Mark Done")}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Completed items */}
      {done.length > 0 && (
        <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl overflow-hidden opacity-70 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="px-4 py-3 border-b border-primary/40">
            <p className="text-sm font-semibold text-[#71717a] dark:text-gray-400">{t("completed", "Completed (")}{done.length})</p>
          </div>
          <div className="divide-y divide-border">
            {done.map(item => {
              return (
                <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-through text-[#71717a] dark:text-gray-400">{item.title}</p>
                    {item.completed_at && (
                      <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("completed", "Completed")} {format(new Date(item.completed_at), "MMM d, yyyy")}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
