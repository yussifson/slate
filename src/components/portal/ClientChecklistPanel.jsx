import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckSquare, Square, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  pending: { icon: Square, color: "text-muted-foreground", badge: "bg-muted text-muted-foreground" },
  in_progress: { icon: Clock, color: "text-blue-500", badge: "bg-blue-100 text-blue-700" },
  completed: { icon: CheckCircle2, color: "text-green-500", badge: "bg-green-100 text-green-700" },
  waived: { icon: AlertCircle, color: "text-amber-500", badge: "bg-amber-100 text-amber-700" },
};

export default function ClientChecklistPanel({ clientId }) {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["client-checklist", clientId],
    queryFn: () => base44.entities.ClientChecklist.filter({ client_id: clientId }),
    enabled: !!clientId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ClientChecklist.update(id, {
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["client-checklist", clientId] }),
  });

  const pending = items.filter(i => i.status !== "completed" && i.status !== "waived");
  const done = items.filter(i => i.status === "completed" || i.status === "waived");

  if (isLoading) return <div className="p-6 text-center text-sm text-muted-foreground">Loading checklist...</div>;

  if (items.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-10 text-center">
        <CheckSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No checklist items assigned yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold">Your Action Items</p>
          <span className="text-xs text-muted-foreground">{done.length}/{items.length} completed</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${items.length ? (done.length / items.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Pending items */}
      {pending.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold">Pending ({pending.length})</p>
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
                    {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {item.case_title && <span className="text-xs text-muted-foreground">{item.case_title}</span>}
                      {item.due_date && (
                        <span className="text-xs text-muted-foreground">
                          Due {format(new Date(item.due_date), "MMM d, yyyy")}
                        </span>
                      )}
                      <Badge className={cn("text-[10px]", cfg.badge)}>{item.status}</Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs shrink-0"
                    onClick={() => updateMutation.mutate({ id: item.id, status: "completed" })}
                    disabled={updateMutation.isPending}
                  >
                    Mark Done
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed items */}
      {done.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden opacity-70">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-muted-foreground">Completed ({done.length})</p>
          </div>
          <div className="divide-y divide-border">
            {done.map(item => (
              <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-through text-muted-foreground">{item.title}</p>
                  {item.completed_at && (
                    <p className="text-xs text-muted-foreground">Completed {format(new Date(item.completed_at), "MMM d, yyyy")}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}